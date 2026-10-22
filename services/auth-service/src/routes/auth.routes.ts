import { Router } from 'express';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../middleware/validate.middleware';
import { requireAuth } from '../middleware/auth.middleware';
import {
  register, registerSchema,
  login,    loginSchema,
  refresh,  refreshSchema,
  logout,   logoutAll,
  me,
} from '../controllers/auth.controller';
import {
  provision,      provisionSchema,
  exchangeCode,   exchangeCodeSchema,
  samlMetadata,
  samlInit,
  samlCallback,
} from '../controllers/sso.controller';
import {
  forgotPassword, forgotPasswordSchema,
  resetPassword,  resetPasswordSchema,
} from '../controllers/password-reset.controller';

export const authRoutes = Router();

// Límite estricto para endpoints de autenticación (evita fuerza bruta)
const authLimiter = rateLimit({
  windowMs:          15 * 60 * 1000, // 15 minutos
  max:               10,
  standardHeaders:   true,
  legacyHeaders:     false,
  message:           { error: 'Demasiados intentos. Espera 15 minutos.' },
  skip: (req) => req.app.get('env') === 'test',
});

// Límite propio para recuperar contraseña: no comparte contador con login (detrás del proxy
// de la web todas las peticiones llegan con la misma IP). El control fino es por email (Redis).
const passwordLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             30,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { error: 'Demasiados intentos. Espera 15 minutos.' },
  skip: (req) => req.app.get('env') === 'test',
});

// Límite general para rutas autenticadas
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      100,
  skip: (req) => req.app.get('env') === 'test',
});

// ── Rutas públicas ────────────────────────────────────────────────────────────
authRoutes.post('/register', authLimiter, validate(registerSchema), register);
authRoutes.post('/login',    authLimiter, validate(loginSchema),    login);
// Sin limitador por IP: lo llama el servidor de la web para todos los usuarios (un solo bucket) y
// un refresh token es un JWT firmado: uno inventado se rechaza sin tocar Redis ni bcrypt.
authRoutes.post('/refresh',               validate(refreshSchema),  refresh);
authRoutes.post('/logout',               validate(refreshSchema),  logout);
authRoutes.post('/forgot-password', passwordLimiter, validate(forgotPasswordSchema), forgotPassword);
authRoutes.post('/reset-password',  passwordLimiter, validate(resetPasswordSchema),  resetPassword);

// ── SSO ───────────────────────────────────────────────────────────────────────
authRoutes.post('/sso/provision',    validate(provisionSchema),    provision);
authRoutes.post('/sso/exchange-code', validate(exchangeCodeSchema), exchangeCode);
authRoutes.get('/sso/saml/metadata', samlMetadata);
authRoutes.get('/sso/init',          samlInit);
authRoutes.post('/sso/callback',
  express.urlencoded({ extended: false }),  // SAML IdP envía form-encoded
  samlCallback,
);

// ── Rutas autenticadas ────────────────────────────────────────────────────────
authRoutes.get('/me',          apiLimiter, requireAuth, me);
authRoutes.post('/logout-all', apiLimiter, requireAuth, logoutAll);
