/**
 * Brand Switcher Component
 *
 * A dev-only component that allows switching between brand presets.
 * This is only visible in non-production environments.
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { BRAND_PRESETS, getBrandPreset, type BrandId } from "@/lib/branding/brandPresets";

/**
 * BrandSwitcher provides a dropdown to preview different brand themes.
 * In production, this component renders nothing.
 */
export function BrandSwitcher() {
  const [brandId, setBrandId] = useState<BrandId>("lessonarcade-default");
  const initializedRef = useRef(false);

  // Read from query param on mount to sync with URL
  useEffect(() => {
    if (typeof window !== "undefined" && !initializedRef.current) {
      const params = new URLSearchParams(window.location.search);
      const brand = params.get("brand");
      if (brand) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Reading URL params on mount is a valid use case
        setBrandId(getBrandPreset(brand).id);
      }
      initializedRef.current = true;
    }
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
