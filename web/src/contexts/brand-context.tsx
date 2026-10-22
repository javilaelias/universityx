'use client';

import { createContext, useContext } from 'react';
import { DEFAULT_BRAND, type Brand } from '@/lib/brand';

const BrandContext = createContext<Brand>(DEFAULT_BRAND);

export function BrandProvider({ brand, children }: { brand: Brand; children: React.ReactNode }) {
  return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>;
}

export const useBrand = () => useContext(BrandContext);

/** "<pie configurado>" o "<nombre> © <año>". */
export function brandFooter(brand: Brand): string {
  return brand.footerText ?? `${brand.name} © ${new Date().getFullYear()}`;
}
