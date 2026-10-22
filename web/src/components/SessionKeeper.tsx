'use client';

import { useEffect, useRef } from 'react';
import { getSession, signOut, useSession } from 'next-auth/react';

// Renueva el access token (15 min) antes de que venza, mientras dura la sesión de NextAuth.
// update() (POST) es el único camino que rota (ver lib/auth.ts). Cada GET /api/auth/session
// reescribe la cookie con lo que leyó: si uno sale antes del POST y vuelve después, deja el
// refresh token ya revocado. Por eso: sin refetch al foco en SessionProvider (lo hace este
// componente), Web Locks para que las pestañas renueven de a una, y dentro del lock una
// relectura sin broadcast (no dispara GETs en otras pestañas) antes del update(). Las demás
// pestañas releen recién cuando update() termina y avisa, con la cookie nueva ya escrita.
const MARGIN_MS = 2 * 60 * 1000;
const CHECK_EVERY_MS = 30 * 1000;

async function renew(update: () => Promise<unknown>) {
  const run = async () => {
    const fresh = await getSession({ broadcast: false });
    // Sin vencimiento conocido (sesión anterior a este cambio) se trata como vencido.
    if (fresh && Date.now() > (fresh.accessTokenExpires ?? 0) - MARGIN_MS) {
      await update();
    }
  };
  if (typeof navigator !== 'undefined' && navigator.locks) {
    await navigator.locks.request('ux-session-refresh', run);
  } else {
    await run();
  }
}

export default function SessionKeeper() {
  const { data: session, status, update } = useSession();
  const expires = session?.accessTokenExpires;
  const error = session?.error;
  const triedWithoutExpiry = useRef(false);

  useEffect(() => {
    if (status !== 'authenticated') return;
    if (error) {
      void signOut({ callbackUrl: '/login' });
      return;
    }
    if (!expires) {
      // Sesión sin vencimiento (anterior a este cambio, o SSO sin tokens propios): un solo
      // intento; si no hay refresh token el servidor devuelve lo mismo y no se insiste.
      if (!triedWithoutExpiry.current) {
        triedWithoutExpiry.current = true;
        void renew(update);
      }
      return;
    }

    // Chequeo cada 30 s: renueva dentro del margen y reintenta si una renovación falló (red/5xx).
    // Al volver una pestaña dormida (timers frenados) se chequea enseguida.
    const check = () => {
      if (Date.now() > expires - MARGIN_MS) void renew(update);
    };
    check();
    const timer = setInterval(check, CHECK_EVERY_MS);
    document.addEventListener('visibilitychange', check);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', check);
    };
    // update cambia de identidad en cada render: no se incluye para no reprogramar en bucle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, expires, error]);

  return null;
}
