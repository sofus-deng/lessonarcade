/**
 * Brand Switcher Component
 *
 * A dev-only component that allows switching between brand presets.
 * This is only visible in non-production environments.
 */

"use client";

import { useState, useEffect } from "react";
import { BRAND_PRESETS, type BrandId } from "@/lib/branding/brandPresets";

/**
 * Props for BrandSwitcher component.
 */
export interface BrandSwitcherProps {
  /** The initial brand ID to display on first render (SSR + hydration safe) */
  initialBrandId: BrandId;
}

/**
 * BrandSwitcher provides a dropdown to preview different brand themes.
 * In production, this component renders nothing.
 *
 * The initial brand is provided via the `initialBrandId` prop, which should
 * be computed on the server (e.g., from URL query params) to ensure SSR
 * and hydration consistency.
 */
export function BrandSwitcher({ initialBrandId }: BrandSwitcherProps) {
  const [brandId, setBrandId] = useState<BrandId>(initialBrandId);

  // Sync brand state with URL changes (for navigation)
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const getBrandFromURL = (): BrandId => {
      const params = new URLSearchParams(window.location.search);
      const brand = params.get("brand");
      if (brand && brand in BRAND_PRESETS) {
        return brand as BrandId;
      }
      return initialBrandId;
    };

    // Listen for URL changes
    const handleUrlChange = () => {
      setBrandId(getBrandFromURL());
    };

    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      handleUrlChange();
    };

    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      handleUrlChange();
    };

    window.addEventListener('popstate', handleUrlChange);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, [initialBrandId]);

  // Sync data-brand attribute with current brand state
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.brand = brandId;
    }
  }, [brandId]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newBrand = e.target.value as BrandId;
    setBrandId(newBrand);

    // Update URL query param
    const url = new URL(window.location.href);
    url.searchParams.set("brand", newBrand);
    window.history.replaceState({}, "", url.toString());
  };

  // Hide in production
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-la-surface border border-la-border rounded-lg p-3 shadow-lg">
      <label htmlFor="brand-select" className="block text-sm font-medium text-la-muted mb-1">
        Theme Preview
      </label>
      <select
        id="brand-select"
        value={brandId}
        onChange={handleChange}
        className="bg-la-bg text-la-surface text-sm rounded px-2 py-1 border border-la-border"
      >
        {Object.values(BRAND_PRESETS).map((preset) => (
          <option key={preset.id} value={preset.id}>
            {preset.label}
          </option>
        ))}
      </select>
    </div>
  );
}
