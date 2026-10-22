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
  'register.err_short':  'La contraseña debe tener al menos 10 caracteres.',
  'register.err_letter_digit': 'La contraseña debe incluir al menos una letra y un número.',
  'register.err_common': 'Esa contraseña es demasiado común; elige otra.',
  'register.err_email':  'La contraseña no puede contener tu correo.',
  'register.err_policy': 'La contraseña no cumple la política de seguridad.',
  'register.err_taken':  'El correo ya está registrado.',
  'register.name_ph':    'Tu nombre',
  'register.password_ph':'Mínimo 10 caracteres, con letras y números',
  'register.confirm_ph': 'Repite tu contraseña',
  'register.err_default':'Error al crear la cuenta.',

  // Recuperar contraseña
  'login.forgot':        '¿Olvidaste tu contraseña?',
  'login.email_ph':      'tu@correo.com',
  'login.reset_done':    'Contraseña actualizada. Se cerraron tus otras sesiones; inicia sesión de nuevo.',
  'login.locked':        'Demasiados intentos fallidos. Espera 15 minutos o restablece tu contraseña.',
  'forgot.title':        'Recuperar contraseña',
  'forgot.subtitle':     'Te enviaremos un enlace para crear una nueva contraseña.',
  'forgot.submit':       'Enviar enlace',
  'forgot.submitting':   'Enviando…',
  'forgot.sent':         'Si el correo está registrado, te enviamos un enlace. Revisa tu bandeja (vence en 30 minutos).',
  'forgot.error':        'No pudimos procesar la solicitud. Intenta de nuevo en unos minutos.',
  'forgot.back':         'Volver a iniciar sesión',
  'reset.title':         'Nueva contraseña',
  'reset.password':      'Nueva contraseña',
  'reset.submit':        'Guardar contraseña',
  'reset.submitting':    'Guardando…',
  'reset.invalid':       'El enlace es inválido o venció.',
  'reset.request_new':   'Solicitar un enlace nuevo',

  // Dashboard
  'dash.welcome':        'Bienvenido',
  'dash.courses':        'Mis cursos',
  'dash.progress':       'Progreso',
  'dash.notifications':  'Notificaciones',

  // Instructor panel
  'nav.instructor':      'Panel Instructor',
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
  'register.err_short':  'Password must be at least 10 characters.',
  'register.err_letter_digit': 'Password must include at least one letter and one number.',
  'register.err_common': 'That password is too common; choose another one.',
  'register.err_email':  'The password cannot contain your email.',
  'register.err_policy': 'The password does not meet the security policy.',
  'register.err_taken':  'That email is already registered.',
  'register.name_ph':    'Your name',
  'register.password_ph':'At least 10 characters, with letters and numbers',
  'register.confirm_ph': 'Repeat your password',
  'register.err_default':'Error creating account.',

  // Password recovery
  'login.forgot':        'Forgot your password?',
  'login.email_ph':      'you@email.com',
  'login.reset_done':    'Password updated. Your other sessions were signed out; sign in again.',
  'login.locked':        'Too many failed attempts. Wait 15 minutes or reset your password.',
  'forgot.title':        'Reset password',
  'forgot.subtitle':     "We'll send you a link to create a new password.",
  'forgot.submit':       'Send link',
  'forgot.submitting':   'Sending…',
  'forgot.sent':         'If the email is registered, we sent you a link. Check your inbox (it expires in 30 minutes).',
  'forgot.error':        "We couldn't process the request. Try again in a few minutes.",
  'forgot.back':         'Back to sign in',
  'reset.title':         'New password',
  'reset.password':      'New password',
  'reset.submit':        'Save password',
  'reset.submitting':    'Saving…',
  'reset.invalid':       'The link is invalid or has expired.',
  'reset.request_new':   'Request a new link',

  'dash.welcome':        'Welcome',
  'dash.courses':        'My courses',
  'dash.progress':       'Progress',
  'dash.notifications':  'Notifications',

  'nav.instructor':      'Instructor Panel',
};

export type Lang = 'es' | 'en';
export type TranslationKey = keyof typeof es;
export const dictionaries = { es, en } as const;

export function translate(lang: Lang, key: TranslationKey): string {
  return dictionaries[lang][key] ?? key;
}
