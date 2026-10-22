import { unstable_noStore as noStore } from 'next/cache';
import { readBrand, type Brand } from '@/lib/brand';

// El env no cambia mientras vive el proceso: se valida una vez (y avisa una vez si algo es inválido).
let cached: Brand | null = null;

/** Marca vigente; marca la ruta como dinámica para leer el env del runtime, no el del build. */
export function getBrand(): Brand {
  noStore();
  return (cached ??= readBrand(process.env));
}
