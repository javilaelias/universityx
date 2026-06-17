export type UserRole = 'student' | 'instructor' | 'admin' | 'support';

// Fila directa de PostgreSQL (snake_case = nombres de columna)
export interface User {
  id:                    string;
  email:                 string;
  institutional_email:   string | null;
  full_name:             string;
  role:                  UserRole;
  avatar_url:            string | null;
  sso_provider:          string | null;
  sso_subject_id:        string | null;
  is_active:             boolean;
  timezone:              string;
  language:              string;
  dark_mode_enabled:     boolean;
  last_login_at:         Date | null;
  created_at:            Date;
}

export interface TokenPair {
  accessToken:  string;
  refreshToken: string;
  expiresIn:    number;
}

export interface JwtPayload {
  sub:   string;  // user id
  email: string;
  role:  UserRole;
  iat?:  number;
  exp?:  number;
}

export interface RefreshTokenPayload {
  sub:      string;  // user id
  tokenId:  string;  // UUID de esta sesión (para revocación individual)
  iat?:     number;
  exp?:     number;
}

// Cuerpo de las rutas
export interface RegisterBody {
  email:    string;
  password: string;
  fullName: string;
}

export interface LoginBody {
  email:    string;
  password: string;
}

export interface RefreshBody {
  refreshToken: string;
}

// Extender Request de Express
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
