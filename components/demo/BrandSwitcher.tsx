/**
 * Brand Switcher Component
 *
 * A dev-only component that allows switching between brand presets.
 * This is only visible in non-production environments.
 */

"use client";

import { useState, useEffect } from "react";
import { BRAND_PRESETS, getBrandPreset, type BrandId } from "@/lib/branding/brandPresets";

/**
 * Get the initial brand ID from URL query param or data-brand attribute.
 * Falls back to the default brand if neither is valid.
 */
function getInitialBrandId(): BrandId {
  // 1) Try URL ?brand=...
  if (typeof window !== 'undefined') {
    try {
      const url = new URL(window.location.href);
      const fromQuery = url.searchParams.get('brand');
      if (fromQuery && fromQuery in BRAND_PRESETS) {
        return fromQuery as BrandId;
      }
    } catch {
      // ignore and fall through
    }
  }

  // 2) Try <html data-brand="...">
  if (typeof document !== 'undefined') {
    const attr = document.documentElement.getAttribute('data-brand');
    if (attr && attr in BRAND_PRESETS) {
      return attr as BrandId;
    }
  }

  // 3) Fallback
  return getBrandPreset(null).id;
}

/**
 * BrandSwitcher provides a dropdown to preview different brand themes.
 * In production, this component renders nothing.
 */
export function BrandSwitcher() {
  const [brandId, setBrandId] = useState<BrandId>(getInitialBrandId);

  // Sync with URL changes
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const getBrandFromURL = (): BrandId => {
      const params = new URLSearchParams(window.location.search);
      const brand = params.get("brand");
      return getBrandPreset(brand).id;
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
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newBrand = e.target.value as BrandId;
    setBrandId(newBrand);
    document.documentElement.dataset.brand = newBrand;

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
