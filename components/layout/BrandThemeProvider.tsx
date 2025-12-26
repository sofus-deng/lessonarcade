/**
 * Brand Theme Provider
 *
 * Client component that sets the `data-brand` attribute on the document element.
 * This enables CSS-based theme switching using the design tokens defined in globals.css.
 */

"use client";

import { useEffect, useState } from "react";
import { getBrandPreset } from "@/lib/branding/brandPresets";

interface BrandThemeProviderProps {
  /** The brand ID to apply (from env var) */
  brandId: string;
  /** Child components */
  children: React.ReactNode;
}

/**
 * BrandThemeProvider sets the active brand by updating the `data-brand` attribute
 * on the document element. This allows CSS selectors like `[data-brand="warm-paper"]`
 * to override design tokens for specific brands.
 *
 * The brand can be overridden via the `brand` query string parameter.
 */
export function BrandThemeProvider({ brandId, children }: BrandThemeProviderProps) {
  const [activeBrand, setActiveBrand] = useState(brandId);

  useEffect(() => {
    // Read from query param to override the brand
    const params = new URLSearchParams(window.location.search);
    const brandParam = params.get("brand");
    const resolvedBrand = getBrandPreset(brandParam).id;

    setActiveBrand(resolvedBrand);
    document.documentElement.dataset.brand = resolvedBrand;
  }, [brandId]);

  return <>{children}</>;
}
