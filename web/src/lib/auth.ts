import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider      from 'next-auth/providers/google';
import AzureADProvider     from 'next-auth/providers/azure-ad';
import type { NextAuthOptions } from 'next-auth';

const AUTH_URL = process.env.AUTH_SERVICE_URL ?? 'http://localhost:4001';

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
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        console.error('[auth] authorize: missing email or password');
        return null;
      }

      let res: Response;
      try {
        res = await fetch(`${AUTH_URL}/auth/login`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ email: credentials.email, password: credentials.password }),
        });
      } catch (err) {
        console.error('[auth] authorize: fetch error', err);
        return null;
      }

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        console.error('[auth] authorize: auth-service returned', res.status, body);
        return null;
      }

      const { user, accessToken, refreshToken } = await res.json();
      return {
        id:          user.id,
        email:       user.email,
        name:        user.full_name,
        role:        user.role,
        accessToken,
        refreshToken,
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
        const { user, accessToken, refreshToken } = await res.json();
        return {
          id: user.id, email: user.email, name: user.full_name,
          role: user.role, accessToken, refreshToken,
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
    async jwt({ token, user, account }) {
      if (!user) return token;

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
        const ttl = user.rememberMe ? 30 * 24 * 60 * 60 : 8 * 60 * 60;
        token.exp = Math.floor(Date.now() / 1000) + ttl;
      }

      return token;
    },

    async session({ session, token }) {
      session.accessToken  = token.accessToken;
      session.refreshToken = token.refreshToken;
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

  secret: process.env.NEXTAUTH_SECRET ?? 'universidad-x-secret-dev',
};
