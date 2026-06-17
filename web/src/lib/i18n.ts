// Diccionarios de traducción.
// Uso: const { t } = useTranslation();  →  t('nav.courses')

const es = {
  // Navegación
  'nav.dashboard':   'Dashboard',
  'nav.courses':     'Cursos',
  'nav.support':     'Soporte',
  'nav.profile':     'Perfil',
  'nav.logout':      'Salir',
  'nav.theme.light': 'Modo claro',
  'nav.theme.dark':  'Modo oscuro',
  'nav.lang':        'English',

  // Login
  'login.subtitle':    'Plataforma de aprendizaje adaptativo',
  'login.email':       'Correo electrónico',
  'login.password':    'Contraseña',
  'login.remember':    'Recordar sesión por 30 días',
  'login.submit':      'Iniciar sesión',
  'login.submitting':  'Ingresando…',
  'login.error':       'Correo o contraseña incorrectos.',
  'login.or':          'o continúa con',
  'login.sso_inst':    'SSO Institucional',
  'login.sso_cancel':  'Cancelar',
  'login.sso_cont':    'Continuar',
  'login.sso_email':   'tu@universidad.edu',
  'login.no_account':  '¿No tienes cuenta?',
  'login.register':    'Regístrate',
  'login.registered':  '¡Cuenta creada! Inicia sesión.',

  // Register
  'register.title':      'Crear cuenta',
  'register.subtitle':   'Universidad X · Plataforma adaptativa',
  'register.fullname':   'Nombre completo',
  'register.email':      'Correo electrónico',
  'register.password':   'Contraseña',
  'register.confirm':    'Confirmar contraseña',
  'register.submit':     'Crear cuenta',
  'register.submitting': 'Creando cuenta…',
  'register.has_account':'¿Ya tienes cuenta?',
  'register.signin':     'Inicia sesión',
  'register.err_match':  'Las contraseñas no coinciden.',
  'register.err_short':  'La contraseña debe tener al menos 8 caracteres.',
  'register.err_default':'Error al crear la cuenta.',

  // Dashboard
  'dash.welcome':        'Bienvenido',
  'dash.courses':        'Mis cursos',
  'dash.progress':       'Progreso',
  'dash.notifications':  'Notificaciones',
} as const;

const en: Record<keyof typeof es, string> = {
  'nav.dashboard':   'Dashboard',
  'nav.courses':     'Courses',
  'nav.support':     'Support',
  'nav.profile':     'Profile',
  'nav.logout':      'Sign out',
  'nav.theme.light': 'Light mode',
  'nav.theme.dark':  'Dark mode',
  'nav.lang':        'Español',

  'login.subtitle':    'Adaptive learning platform',
  'login.email':       'Email',
  'login.password':    'Password',
  'login.remember':    'Remember me for 30 days',
  'login.submit':      'Sign in',
  'login.submitting':  'Signing in…',
  'login.error':       'Invalid email or password.',
  'login.or':          'or continue with',
  'login.sso_inst':    'Institutional SSO',
  'login.sso_cancel':  'Cancel',
  'login.sso_cont':    'Continue',
  'login.sso_email':   'you@university.edu',
  'login.no_account':  "Don't have an account?",
  'login.register':    'Sign up',
  'login.registered':  'Account created! Sign in.',

  'register.title':      'Create account',
  'register.subtitle':   'Universidad X · Adaptive platform',
  'register.fullname':   'Full name',
  'register.email':      'Email',
  'register.password':   'Password',
  'register.confirm':    'Confirm password',
  'register.submit':     'Create account',
  'register.submitting': 'Creating account…',
  'register.has_account':'Already have an account?',
  'register.signin':     'Sign in',
  'register.err_match':  'Passwords do not match.',
  'register.err_short':  'Password must be at least 8 characters.',
  'register.err_default':'Error creating account.',

  'dash.welcome':        'Welcome',
  'dash.courses':        'My courses',
  'dash.progress':       'Progress',
  'dash.notifications':  'Notifications',
};

export type Lang = 'es' | 'en';
export type TranslationKey = keyof typeof es;
export const dictionaries = { es, en } as const;

export function translate(lang: Lang, key: TranslationKey): string {
  return dictionaries[lang][key] ?? key;
}
