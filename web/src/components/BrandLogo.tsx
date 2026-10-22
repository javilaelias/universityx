'use client';

import { BookOpen } from 'lucide-react';
import { useBrand } from '@/contexts/brand-context';

/** Logo de la marca, o el ícono por defecto si no hay BRAND_LOGO_URL. */
export default function BrandLogo({ className }: { className?: string }) {
  const brand = useBrand();
  if (brand.logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={brand.logoUrl} alt={brand.name} className={`${className ?? ''} object-contain`} />;
  }
  return <BookOpen className={className} />;
}
