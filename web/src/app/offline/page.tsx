import Link from 'next/link';
import RetryButton from './RetryButton';

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[var(--bg)] px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/30">
        {/* wifi-off inline — no depende de lucide en el bundle offline */}
        <svg
          className="h-10 w-10 text-brand-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.56 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01M2 2l20 20"
          />
        </svg>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-[var(--text)]">Sin conexión</h1>
        <p className="max-w-sm text-[var(--muted)]">
          No hay red disponible. Revisa tu conexión a internet y vuelve a intentarlo.
        </p>
      </div>

      <RetryButton />

      <Link href="/dashboard" className="text-sm text-brand-600 hover:underline">
        Ir al dashboard (si está en caché)
      </Link>
    </div>
  );
}
