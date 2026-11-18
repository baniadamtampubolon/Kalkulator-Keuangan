"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

const PX_PER_MM = 96 / 25.4;

// Global registry so beforeprint / manual sync recalculates every active sheet synchronously
const activeCalculators = new Set<() => void>();
let isBeforePrintHooked = false;

export function syncAllAutoFitSheets(): void {
  activeCalculators.forEach((fn) => {
    try {
      fn();
    } catch {
      // Ignore transient DOM unmount states
    }
  });
}

function ensureGlobalBeforePrintListener(): void {
  if (typeof window === "undefined" || isBeforePrintHooked) return;
  window.addEventListener("beforeprint", syncAllAutoFitSheets);
  isBeforePrintHooked = true;
}

function getOrCreateMeasurerHost(): HTMLDivElement {
  const existing = document.getElementById("autofit-print-measurer-host") as HTMLDivElement | null;
  if (existing) return existing;

  const host = document.createElement("div");
  host.id = "autofit-print-measurer-host";
  host.className = "autofit-measurer-host";
  host.setAttribute("aria-hidden", "true");
  document.body.appendChild(host);
  return host;
}

interface MeasureResult {
  scale: number;
  unscaledWidthMm: number;
  scaledHeightMm: number;
}

function measureSheetForA4(
  sourceEl: HTMLElement,
  printableWidthMm: number,
  printableHeightMm: number,
  minScale: number
): MeasureResult {
  const host = getOrCreateMeasurerHost();
  const targetWidthPx = printableWidthMm * PX_PER_MM;
  const maxHeightPx = printableHeightMm * PX_PER_MM;

  const box = document.createElement("div");
  box.className = "autofit-measurer-box";

  const clone = sourceEl.cloneNode(true) as HTMLElement;
  clone.style.width = "100%";
  clone.style.transform = "none";
  clone.removeAttribute("contenteditable");

  // Also strip nested contentEditable attributes on cloned nodes to avoid focus outline styles
  clone.querySelectorAll("[contenteditable]").forEach((el) => {
    el.removeAttribute("contenteditable");
  });

  box.appendChild(clone);
  host.appendChild(box);

  const checkFits = (s: number): { fits: boolean; hPx: number } => {
    const wMm = printableWidthMm / s;
    box.style.width = `${wMm}mm`;
    const hPx = Math.max(box.scrollHeight, clone.scrollHeight);
    const wPx = Math.max(box.scrollWidth, clone.scrollWidth);
    const fitsV = hPx * s <= maxHeightPx;
    const fitsH = wPx * s <= targetWidthPx + 2;
    return { fits: fitsV && fitsH, hPx };
  };

  try {
    const natural = checkFits(1);
    if (natural.fits) {
      return {
        scale: 1,
        unscaledWidthMm: printableWidthMm,
        scaledHeightMm: natural.hPx / PX_PER_MM,
      };
    }

    let lo = minScale;
    let hi = 0.995;
    let bestScale = minScale;

    for (let i = 0; i < 9; i++) {
      const mid = (lo + hi) / 2;
      const res = checkFits(mid);
      if (res.fits) {
        bestScale = mid;
        lo = mid;
      } else {
        hi = mid;
      }
    }

    // Apply tiny 0.5% safety margin for font-rasterizer differences between screen DOM & PDF printer
    const safeScale = Math.max(minScale, Math.floor(bestScale * 995) / 1000);
    const finalRes = checkFits(safeScale);
    const scaledHeightMm = Math.min(
      printableHeightMm + 1.5,
      (finalRes.hPx / PX_PER_MM) * safeScale + 1.5
    );

    return {
      scale: safeScale,
      unscaledWidthMm: printableWidthMm / safeScale,
      scaledHeightMm,
    };
  } finally {
    if (box.parentNode === host) {
      host.removeChild(box);
    }
  }
}

interface PrintAutoFitSheetProps {
  children: React.ReactNode;
  orientation?: "portrait" | "landscape";
  /** Lebar area cetak (A4 dikurangi margin kiri+kanan dalam mm) */
  printableWidthMm?: number;
  /** Tinggi maksimal area cetak (A4 dikurangi margin atas+bawah + safety cushion dalam mm) */
  printableHeightMm?: number;
  minScale?: number;
  isBundleMode?: boolean;
  noBreakAfter?: boolean;
}

export const PrintAutoFitSheet: React.FC<PrintAutoFitSheetProps> = ({
  children,
  orientation = "portrait",
  printableWidthMm,
  printableHeightMm,
  minScale = 0.35,
  isBundleMode = false,
  noBreakAfter = false,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const scalerRef = useRef<HTMLDivElement>(null);
  const [computedScale, setComputedScale] = useState<number>(1);

  const effectiveWidthMm =
    printableWidthMm ??
    (orientation === "landscape" ? 277 : isBundleMode ? 174 : 170);
  const effectiveHeightMm =
    printableHeightMm ?? (orientation === "landscape" ? 188 : 260);

  const recalculate = useCallback(() => {
    const wrapper = wrapperRef.current;
    const scaler = scalerRef.current;
    if (!wrapper || !scaler) return;

    const targetChild = (scaler.firstElementChild as HTMLElement | null) || scaler;
    const result = measureSheetForA4(
      targetChild,
      effectiveWidthMm,
      effectiveHeightMm,
      minScale
    );

    if (result.scale < 0.998) {
      wrapper.setAttribute("data-autofit-scaled", "true");
      wrapper.style.setProperty("--autofit-scale", result.scale.toFixed(4));
      wrapper.style.setProperty("--autofit-w", `${result.unscaledWidthMm.toFixed(2)}mm`);
      wrapper.style.setProperty("--autofit-h", `${result.scaledHeightMm.toFixed(2)}mm`);
    } else {
      wrapper.removeAttribute("data-autofit-scaled");
      wrapper.style.removeProperty("--autofit-scale");
      wrapper.style.removeProperty("--autofit-w");
      wrapper.style.removeProperty("--autofit-h");
    }

    setComputedScale((prev) =>
      Math.abs(prev - result.scale) > 0.004 ? result.scale : prev
    );
  }, [effectiveWidthMm, effectiveHeightMm, minScale]);

  useEffect(() => {
    ensureGlobalBeforePrintListener();
    activeCalculators.add(recalculate);

    // Hitung di next frame agar layout dan gambar selesai termuat
    const rafId = requestAnimationFrame(() => {
      recalculate();
    });

    // Pantau perubahan konten live (mis. saat user mengedit via Mode Edit Canvas)
    const scaler = scalerRef.current;
    let observer: MutationObserver | null = null;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    if (scaler && typeof MutationObserver !== "undefined") {
      observer = new MutationObserver(() => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          recalculate();
        }, 120);
      });
      observer.observe(scaler, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }

    return () => {
      activeCalculators.delete(recalculate);
      cancelAnimationFrame(rafId);
      if (debounceTimer) clearTimeout(debounceTimer);
      if (observer) observer.disconnect();
    };
  }, [recalculate]);

  const scalePercent = Math.round(computedScale * 100);

  return (
    <div
      ref={wrapperRef}
      data-no-break-after={noBreakAfter ? "true" : undefined}
      className="autofit-page-wrapper"
    >
      {!isBundleMode && computedScale < 0.995 && (
        <div
          className={`no-print mx-auto mb-1.5 flex justify-end px-1 ${
            orientation === "landscape" ? "max-w-[1240px]" : "max-w-[860px]"
          }`}
        >
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/60"
            title="Konten lebih panjang dari 1 halaman A4; ukuran cetak otomatis diskalakan agar seluruh isi & tanda tangan muat utuh dalam 1 lembar A4 tanpa terpotong."
          >
            Auto-Fit A4: {scalePercent}% (muat 1 halaman penuh saat dicetak)
          </span>
        </div>
      )}
      <div ref={scalerRef} className="autofit-scaler">
        {children}
      </div>
    </div>
  );
};
