import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider      from 'next-auth/providers/google';
import AzureADProvider     from 'next-auth/providers/azure-ad';
import type { NextAuthOptions } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import { forwardedForHeader } from '@/lib/client-ip';

const AUTH_URL = process.env.AUTH_SERVICE_URL ?? 'http://localhost:4001';

// Se renueva el access token cuando le quedan menos de 2 min (ver SessionKeeper).
const REFRESH_MARGIN_MS = 2 * 60 * 1000;

const expiresAt = (expiresIn: number) => Date.now() + expiresIn * 1000;

// Rotación vía /auth/refresh. Solo un 401 (refresh vencido o revocado) invalida la sesión;
// un fallo de red o 5xx deja el token como estaba y se reintenta en la próxima renovación.
async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const res = await fetch(`${AUTH_URL}/auth/refresh`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ refreshToken: token.refreshToken }),
    });
    if (res.status === 401) return { ...token, error: 'RefreshAccessTokenError' };
    if (!res.ok) return token;
    const data = await res.json();
    return {
      ...token,
      accessToken:        data.accessToken,
      refreshToken:       data.refreshToken,
      accessTokenExpires: expiresAt(data.expiresIn),
      error:              undefined,
    };
  } catch (err) {
    console.error('[auth] refresh error', err);
    return token;
  }
}

// ── Providers ─────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const providers: any[] = [
  // Credenciales propias
  CredentialsProvider({
    id:   'credentials',
    name: 'Credenciales',
    credentials: {
      email:      { label: 'Email',      type: 'email'    },
      password:   { label: 'Contraseña', type: 'password' },
      rememberMe: { label: 'Recuérdame', type: 'text'     },
    },
    async authorize(credentials, req) {
      if (!credentials?.email || !credentials?.password) {
        console.error('[auth] authorize: missing email or password');
        return null;
      }

      let res: Response;
      try {
        res = await fetch(`${AUTH_URL}/auth/login`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', ...forwardedForHeader(req?.headers?.['x-forwarded-for']) },
          body:    JSON.stringify({ email: credentials.email, password: credentials.password }),
        });
      } catch (err) {
        console.error('[auth] authorize: fetch error', err);
        return null;
      }

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        // Cuenta bloqueada por intentos: la página de login muestra su propio mensaje.
        if (res.status === 429 && body.includes('ACCOUNT_LOCKED')) throw new Error('locked');
        console.error('[auth] authorize: auth-service returned', res.status);
        return null;
      }

      const { user, accessToken, refreshToken, expiresIn } = await res.json();
      return {
        id:          user.id,
        email:       user.email,
        name:        user.full_name,
        role:        user.role,
        accessToken,
        refreshToken,
        expiresIn,
        rememberMe:  credentials.rememberMe === '1',
      };
    },
  }),

  // Código SAML de un solo uso (el auth-service lo genera tras validar la aserción)
  CredentialsProvider({
    id:   'saml-code',
    name: 'SAML',
    credentials: { code: { type: 'text' } },
    async authorize(credentials) {
      if (!credentials?.code) return null;
      try {
        const res = await fetch(`${AUTH_URL}/auth/sso/exchange-code`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ code: credentials.code }),
        });
        if (!res.ok) return null;
        const { user, accessToken, refreshToken, expiresIn } = await res.json();
        return {
          id: user.id, email: user.email, name: user.full_name,
          role: user.role, accessToken, refreshToken, expiresIn,
        };
      } catch {
        return null;
      }
    },
  }),
];

// Google Workspace (requiere GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

// Microsoft Entra ID / Azure AD
if (process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET) {
  providers.push(
    AzureADProvider({
      clientId:     process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      tenantId:     process.env.AZURE_AD_TENANT_ID ?? 'common',
    }),
  );
}

// ── NextAuth config ───────────────────────────────────────────────────────────

export const authOptions: NextAuthOptions = {
  providers,

  callbacks: {
    async jwt({ token, user, account, trigger }) {
      if (!user) {
        // Solo se rota en update(): esa respuesta (POST /api/auth/session) reescribe la cookie.
        // getServerSession en un route handler no puede persistirla, y rotar ahí revocaría
        // el refresh token que queda guardado.
        if (trigger === 'update' && !token.error && token.refreshToken
            && Date.now() > (token.accessTokenExpires ?? 0) - REFRESH_MARGIN_MS) {
          return refreshAccessToken(token);
        }
        return token;
      }

      if (account?.provider === 'google' || account?.provider === 'azure-ad') {
        // JIT provisioning para OIDC: llamar al auth-service y obtener nuestros tokens
        try {
          const res = await fetch(`${AUTH_URL}/auth/sso/provision`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              provider:    account.provider,
              providerSub: account.providerAccountId,
              email:       user.email!,
              fullName:    user.name ?? user.email!,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            token.id           = data.user.id;
            token.role         = data.user.role;
            token.accessToken  = data.accessToken;
            token.refreshToken = data.refreshToken;
            token.accessTokenExpires = expiresAt(data.expiresIn);
          }
        } catch (err) {
          console.error('[auth] SSO provision error:', err);
        }
        token.exp = Math.floor(Date.now() / 1000) + 8 * 60 * 60;
      } else {
        // credentials o saml-code: el objeto user ya trae los tokens
        token.id           = user.id;
        token.role         = user.role;
        token.accessToken  = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.accessTokenExpires = expiresAt(user.expiresIn);
        const ttl = user.rememberMe ? 30 * 24 * 60 * 60 : 8 * 60 * 60;
        token.exp = Math.floor(Date.now() / 1000) + ttl;
      }

      return token;
    },

    async session({ session, token }) {
      // El refresh token se queda en la cookie cifrada: nunca llega al JavaScript del navegador.
      session.accessToken        = token.accessToken;
      session.accessTokenExpires = token.accessTokenExpires;
      session.error              = token.error;
      session.user.id      = token.id;
      session.user.role    = token.role;
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error:  '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge:   30 * 24 * 60 * 60,
  },

  // En production sin NEXTAUTH_SECRET, NextAuth falla cerrado (NO_SECRET) en vez de usar uno fijo.
  secret: process.env.NEXTAUTH_SECRET
    ?? (process.env.NODE_ENV === 'production' ? undefined : 'universidad-x-secret-dev'),
};
