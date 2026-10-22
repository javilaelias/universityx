// "15m", "7d"… → milisegundos. env.ts ya exige este formato; el fallback es solo defensivo.
export function parseDurationToMs(duration: string, fallback: number): number {
  const units: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return fallback;
  return parseInt(match[1]) * units[match[2]];
}
