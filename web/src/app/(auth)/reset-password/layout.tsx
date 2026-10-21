import type { Metadata } from 'next';

// El token viaja en la URL: que ningún enlace o recurso lo filtre por Referer.
export const metadata: Metadata = { referrer: 'no-referrer' };

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
