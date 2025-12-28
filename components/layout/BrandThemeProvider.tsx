/**
 * Brand Theme Provider
 *
 * Client component that sets `data-brand` attribute on document element.
 * This enables CSS-based theme switching using design tokens defined in globals.css.
 */

"use client";

import { useLayoutEffect, useState } from "react";
import { getBrandPreset } from "@/lib/branding/brandPresets";

interface BrandThemeProviderProps {
  /** Child components */
  children: React.ReactNode;
}

/**
 * Get brand from URL or default
 */
function getBrandFromURL(): string {
  if (typeof window === 'undefined') {
    return getBrandPreset(null).id;
  }
  const params = new URLSearchParams(window.location.search);
  const brandParam = params.get("brand");
  return getBrandPreset(brandParam).id;
}

/**
 * BrandThemeProvider sets active brand by updating the `data-brand` attribute
 * on the document element. This allows CSS selectors like `[data-brand="warm-paper"]`
 * to override design tokens for specific brands.
 *
 * The brand can be overridden via the `brand` query string parameter.
 * The provider listens for URL changes and updates the brand accordingly.
 */
export function BrandThemeProvider({ children }: BrandThemeProviderProps) {
  // Get initial brand from URL or default
  const initialBrand = getBrandFromURL();

  const [currentBrand, setCurrentBrand] = useState(initialBrand);

  const updateBrand = () => {
    const brand = getBrandFromURL();
    setCurrentBrand(brand);
    document.documentElement.dataset.brand = brand;
  };

  // useLayoutEffect runs synchronously after DOM mutations but before paint
  // This ensures the data-brand attribute is set before tests check it
  useLayoutEffect(() => {
    // Set brand attribute on mount
    document.documentElement.dataset.brand = currentBrand;

    // Listen for URL changes (popstate for back/forward navigation)
    const handlePopState = () => {
      updateBrand();
    };

    // Listen for pushState/replaceState (for client-side navigation)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    const handleUrlChange = () => {
      updateBrand();
    };

    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      handleUrlChange();
    };

    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      handleUrlChange();
    };

    window.addEventListener('popstate', handlePopState);

    // Also poll for URL changes (for hash-based navigation and other edge cases)
    const pollInterval = setInterval(() => {
      const brand = getBrandFromURL();
      if (document.documentElement.dataset.brand !== brand) {
        updateBrand();
      }
    }, 100);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      clearInterval(pollInterval);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, [currentBrand]);

  return <>{children}</>;
}
