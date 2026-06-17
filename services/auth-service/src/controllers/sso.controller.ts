import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { SAML, type SamlConfig } from '@node-saml/node-saml';
import { query } from '../db/postgres';
import { getRedis, storeRefreshToken } from '../db/redis';
import { generateTokenPair } from '../services/jwt.service';
import { env } from '../config/env';
import type { User } from '../types/auth.types';

// ── Schemas ───────────────────────────────────────────────────────────────────

export const provisionSchema = z.object({
  provider:    z.string().min(1),
  providerSub: z.string().min(1),
  email:       z.string().email().toLowerCase(),
  fullName:    z.string().min(1),
});

export const exchangeCodeSchema = z.object({
  code: z.string().uuid(),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function sanitize(user: User) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { sso_subject_id: _sid, ...safe } = user as User & { password_hash?: string };
  return safe;
}

function isSamlConfigured(): boolean {
  return !!(env.SSO_ENTRY_POINT && env.SSO_CERT);
}

function buildSaml(): SAML {
  const config: SamlConfig = {
    callbackUrl:             env.SSO_CALLBACK_URL ?? 'http://localhost:4001/auth/sso/callback',
    entryPoint:              env.SSO_ENTRY_POINT!,
    issuer:                  env.SSO_ISSUER ?? 'universidad-x',
    cert:                    env.SSO_CERT!,
    wantAuthnResponseSigned: true,
    wantAssertionsSigned:    false,
    audience:                false,
    disableRequestedAuthnContext: true,
  };
  return new SAML(config);
}

async function provisionSsoUser(
  provider:    string,
  providerSub: string,
  email:       string,
  fullName:    string,
): Promise<User> {
  // 1. Match existing SSO identity
  const { rows: bySso } = await query<User>(
    'SELECT * FROM users WHERE sso_provider = $1 AND sso_subject_id = $2',
    [provider, providerSub],
  );
  if (bySso[0]) {
    await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [bySso[0].id]);
    return bySso[0];
  }

  // 2. Link to existing account by email
  const { rows: byEmail } = await query<User>(
    'SELECT * FROM users WHERE LOWER(email) = $1',
    [email],
  );
  if (byEmail[0]) {
    const { rows } = await query<User>(
      `UPDATE users
          SET sso_provider = $1, sso_subject_id = $2, last_login_at = NOW()
        WHERE id = $3
        RETURNING *`,
      [provider, providerSub, byEmail[0].id],
    );
    return rows[0];
  }

  // 3. JIT: create new user
  const { rows } = await query<User>(
    `INSERT INTO users (email, full_name, role, sso_provider, sso_subject_id, is_active)
     VALUES ($1, $2, 'student', $3, $4, true)
     RETURNING *`,
    [email, fullName, provider, providerSub],
  );
  return rows[0];
}

// ── POST /auth/sso/provision  (OIDC: Google, Microsoft) ──────────────────────

export async function provision(req: Request, res: Response, next: NextFunction) {
  try {
    const { provider, providerSub, email, fullName } =
      req.body as z.infer<typeof provisionSchema>;

    const user = await provisionSsoUser(provider, providerSub, email, fullName);

    if (!user.is_active) {
      res.status(403).json({ error: 'Cuenta desactivada' });
      return;
    }

    const { accessToken, refreshToken, expiresIn, tokenId } =
      generateTokenPair(user.id, user.email, user.role);
    await storeRefreshToken(user.id, tokenId);

    res.json({ user: sanitize(user), accessToken, refreshToken, expiresIn });
  } catch (err) {
    next(err);
  }
}

// ── POST /auth/sso/exchange-code  (SAML: canjear código corto por tokens) ────

export async function exchangeCode(req: Request, res: Response, next: NextFunction) {
  try {
    const { code } = req.body as z.infer<typeof exchangeCodeSchema>;
    const raw = await getRedis().get(`sso_code:${code}`);

    if (!raw) {
      res.status(401).json({ error: 'Código SSO expirado o inválido' });
      return;
    }

    await getRedis().del(`sso_code:${code}`);
    res.json(JSON.parse(raw));
  } catch (err) {
    next(err);
  }
}

// ── GET /auth/sso/saml/metadata ───────────────────────────────────────────────

export async function samlMetadata(_req: Request, res: Response, next: NextFunction) {
  try {
    if (!isSamlConfigured()) {
      res.status(503).json({ error: 'SAML no configurado en este servidor' });
      return;
    }
    const xml = buildSaml().generateServiceProviderMetadata(null, null);
    res.type('application/xml').send(xml);
  } catch (err) {
    next(err);
  }
}

// ── GET /auth/sso/init ────────────────────────────────────────────────────────

export async function samlInit(req: Request, res: Response, next: NextFunction) {
  try {
    if (!isSamlConfigured()) {
      res.status(503).json({ error: 'SAML no configurado. Configure SSO_ENTRY_POINT y SSO_CERT.' });
      return;
    }
    const relay = (req.query.institution as string) ?? '';
    const { context: url } = await buildSaml().getAuthorizeUrlAsync(relay, req.headers.host, {});
    res.redirect(url as string);
  } catch (err) {
    next(err);
  }
}

// ── POST /auth/sso/callback  (SAML ACS — recibe SAMLResponse del IdP) ────────

export async function samlCallback(req: Request, res: Response, next: NextFunction) {
  const webBase = env.WEB_BASE_URL ?? env.ALLOWED_ORIGINS.split(',')[0].trim();

  try {
    if (!isSamlConfigured()) {
      res.status(503).json({ error: 'SAML no configurado' });
      return;
    }

    const { profile } = await buildSaml().validatePostResponseAsync(
      req.body as Record<string, string>,
    );

    if (!profile?.nameID) {
      res.redirect(`${webBase}/login?error=SSOFailed`);
      return;
    }

    // Extraer email y nombre de los atributos SAML (normalizado entre proveedores)
    const email = (
      (profile as Record<string, unknown>)['email']
      ?? (profile as Record<string, unknown>)['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress']
      ?? (profile as Record<string, unknown>)['urn:oid:0.9.2342.19200300.100.1.3']
      ?? profile.nameID
    ) as string;

    const fullName = (
      (profile as Record<string, unknown>)['displayName']
      ?? (profile as Record<string, unknown>)['http://schemas.microsoft.com/identity/claims/displayname']
      ?? (profile as Record<string, unknown>)['urn:oid:2.16.840.1.113730.3.1.241']
      ?? email
    ) as string;

    const user = await provisionSsoUser('saml', profile.nameID, email.toLowerCase(), fullName);

    if (!user.is_active) {
      res.redirect(`${webBase}/login?error=AccountDisabled`);
      return;
    }

    const { accessToken, refreshToken, tokenId } =
      generateTokenPair(user.id, user.email, user.role);
    await storeRefreshToken(user.id, tokenId);

    // Código de un solo uso (TTL 2 min) para que el front lo canjee por sesión NextAuth
    const code = randomUUID();
    await getRedis().set(
      `sso_code:${code}`,
      JSON.stringify({ user: sanitize(user), accessToken, refreshToken }),
      { EX: 120 },
    );

    res.redirect(`${webBase}/sso-complete?code=${code}`);
  } catch (err) {
    console.error('[sso] samlCallback error:', err);
    res.redirect(`${webBase}/login?error=SSOFailed`);
  }
}
