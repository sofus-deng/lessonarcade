/**
 * Brand Theme Provider
 *
 * Client component that sets the `data-brand` attribute on the document element.
 * This enables CSS-based theme switching using design tokens defined in globals.css.
 */

"use client";

import { useEffect } from "react";
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
  useEffect(() => {
    // Read from query param to override brand
    const params = new URLSearchParams(window.location.search);
    const brandParam = params.get("brand");
    const resolvedBrand = getBrandPreset(brandParam).id;

    document.documentElement.dataset.brand = resolvedBrand;
  }, [brandId]);

  return <>{children}</>;
}
