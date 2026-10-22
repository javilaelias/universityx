import { readFileSync }               from 'node:fs';
import { cert, initializeApp }        from 'firebase-admin/app';
import { getMessaging }               from 'firebase-admin/messaging';
import type { MulticastMessage, BatchResponse } from 'firebase-admin/messaging';

// Lo mínimo de firebase-admin que usamos: permite probar sin credenciales reales.
export interface PushSender {
  sendEachForMulticast(message: MulticastMessage): Promise<BatchResponse>;
}

type Query = (sql: string, params: unknown[]) => Promise<{ rows: { token: string }[] }>;

// Errores con los que FCM dice que el token ya no sirve: se borra de la BD. `invalid-argument` no va:
// FCM también lo da ante un mensaje mal formado y borraría todos los tokens válidos del usuario.
const DEAD_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
]);

// Sin FCM_CREDENTIALS_FILE el push queda deshabilitado (solo in-app + email), igual que SMTP_HOST=console.
// Un archivo ilegible no tumba el servicio: se avisa en el log y sigue sin push.
export function createPushSender(credentialsFile: string): PushSender | null {
  const file = credentialsFile.trim();
  if (!file) return null;
  try {
    const app = initializeApp({ credential: cert(JSON.parse(readFileSync(file, 'utf8'))) }, 'fcm');
    return getMessaging(app);
  } catch (err) {
    console.error('[push] FCM deshabilitado: no se pudo leer FCM_CREDENTIALS_FILE —', (err as Error).message);
    return null;
  }
}

// Envía la notificación a todos los dispositivos del usuario y borra los tokens muertos.
export async function pushToUser(
  sender: PushSender,
  query: Query,
  userId: string,
  msg: { title: string; body: string; event: string },
): Promise<{ sent: number; removed: number }> {
  const { rows } = await query(
    `SELECT token FROM device_tokens WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 500`,
    [userId],
  );
  if (rows.length === 0) return { sent: 0, removed: 0 };

  const tokens = rows.map(r => r.token);
  const res = await sender.sendEachForMulticast({
    tokens,
    notification: { title: msg.title, body: msg.body },
    data:         { event: msg.event },
  });

  const dead = res.responses
    .map((r, i) => (!r.success && r.error && DEAD_TOKEN_CODES.has(r.error.code) ? tokens[i] : null))
    .filter((t): t is string => t !== null);
  if (dead.length) await query(`DELETE FROM device_tokens WHERE token = ANY($1)`, [dead]);

  return { sent: res.successCount, removed: dead.length };
}
