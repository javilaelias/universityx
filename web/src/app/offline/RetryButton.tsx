'use client';

export default function RetryButton() {
  return (
    <button
      onClick={() => window.location.reload()}
      className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 active:scale-95"
    >
      Reintentar
    </button>
  );
}
