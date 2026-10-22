import { describe, it, expect, vi } from 'vitest';
import type { BatchResponse } from 'firebase-admin/messaging';
import { createPushSender, pushToUser, type PushSender } from '../push/fcm';
import { registerDeviceSchema, unregisterDeviceSchema } from '../push/devices';

const TOKEN_A = 'a'.repeat(40);
const TOKEN_B = 'b'.repeat(40);
const TOKEN_C = 'c'.repeat(40);
const msg = { title: 'Hola', body: 'Cuerpo', event: 'ticket.reply' };

function sender(res: Partial<BatchResponse>): PushSender & { sendEachForMulticast: ReturnType<typeof vi.fn> } {
  return { sendEachForMulticast: vi.fn().mockResolvedValue({ successCount: 0, failureCount: 0, responses: [], ...res }) };
}

describe('createPushSender', () => {
  it('sin credenciales queda deshabilitado', () => {
    expect(createPushSender('')).toBeNull();
    expect(createPushSender('   ')).toBeNull();
  });

  it('con un archivo ilegible queda deshabilitado sin lanzar', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(createPushSender('/no/existe/fcm.json')).toBeNull();
    expect(err).toHaveBeenCalled();
    err.mockRestore();
  });
});

describe('pushToUser', () => {
  it('sin tokens no llama a FCM', async () => {
    const s = sender({});
    const query = vi.fn().mockResolvedValue({ rows: [] });
    expect(await pushToUser(s, query, 'u1', msg)).toEqual({ sent: 0, removed: 0 });
    expect(s.sendEachForMulticast).not.toHaveBeenCalled();
  });

  it('envía a todos los tokens del usuario con título, cuerpo y evento', async () => {
    const s = sender({ successCount: 2, responses: [{ success: true }, { success: true }] as BatchResponse['responses'] });
    const query = vi.fn().mockResolvedValue({ rows: [{ token: TOKEN_A }, { token: TOKEN_B }] });
    expect(await pushToUser(s, query, 'u1', msg)).toEqual({ sent: 2, removed: 0 });
    expect(query).toHaveBeenCalledTimes(1);
    expect(query.mock.calls[0][1]).toEqual(['u1']);
    expect(s.sendEachForMulticast).toHaveBeenCalledWith({
      tokens: [TOKEN_A, TOKEN_B],
      notification: { title: 'Hola', body: 'Cuerpo' },
      data: { event: 'ticket.reply' },
    });
  });

  it('borra solo los tokens que FCM reporta como muertos', async () => {
    const responses = [
      { success: true },
      { success: false, error: { code: 'messaging/registration-token-not-registered' } },
      { success: false, error: { code: 'messaging/invalid-argument' } },
    ] as BatchResponse['responses'];
    const s = sender({ successCount: 1, responses });
    const query = vi.fn()
      .mockResolvedValueOnce({ rows: [{ token: TOKEN_A }, { token: TOKEN_B }, { token: TOKEN_C }] })
      .mockResolvedValueOnce({ rows: [] });
    expect(await pushToUser(s, query, 'u1', msg)).toEqual({ sent: 1, removed: 1 });
    expect(query.mock.calls[1][0]).toContain('DELETE FROM device_tokens');
    expect(query.mock.calls[1][1]).toEqual([[TOKEN_B]]);
  });
});

describe('esquemas de dispositivo', () => {
  it('acepta un token válido y usa android por defecto', () => {
    expect(registerDeviceSchema.parse({ token: TOKEN_A })).toEqual({ token: TOKEN_A, platform: 'android' });
  });

  it('rechaza token corto, enorme o plataforma desconocida', () => {
    expect(registerDeviceSchema.safeParse({ token: 'x' }).success).toBe(false);
    expect(registerDeviceSchema.safeParse({ token: 'x'.repeat(5000) }).success).toBe(false);
    expect(registerDeviceSchema.safeParse({ token: TOKEN_A, platform: 'symbian' }).success).toBe(false);
    expect(unregisterDeviceSchema.safeParse({}).success).toBe(false);
  });
});
