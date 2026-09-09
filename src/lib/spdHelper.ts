import { ParticipantRow, SavedKegiatan } from "./types";
import { getSavedKegiatanList } from "./kegiatanHelper";

export const STORAGE_KEY_LATEST_SPD = "perdin_latest_spd_number";

export interface ParsedSpd {
  prefix: string;
  num: number;
  padLength: number;
  suffix: string;
  raw: string;
}

/**
 * Ekstrak bagian teks prefix, angka numerik, padding, dan suffix dari string nomor SPD.
 * Contoh:
 * - "01" -> { prefix: "", num: 1, padLength: 2, suffix: "", raw: "01" }
 * - "26" -> { prefix: "", num: 26, padLength: 2, suffix: "", raw: "26" }
 * - "025" -> { prefix: "", num: 25, padLength: 3, suffix: "", raw: "025" }
 * - "SPD-05" -> { prefix: "SPD-", num: 5, padLength: 2, suffix: "", raw: "SPD-05" }
 * - "SPD/12/XI/2026" -> { prefix: "SPD/", num: 12, padLength: 2, suffix: "/XI/2026", raw: "..." }
 */
export function parseSpdNumber(spdStr?: string | number): ParsedSpd {
  const raw = String(spdStr ?? "").trim();
  if (!raw) {
    return { prefix: "", num: 0, padLength: 2, suffix: "", raw: "" };
  }

  // Cari kelompok digit pertama atau utama
  const match = raw.match(/^(.*?)(\d+)(.*?)$/);
  if (match) {
    const prefix = match[1];
    const digits = match[2];
    const suffix = match[3];
    const num = parseInt(digits, 10);
    return {
      prefix,
      num: isNaN(num) ? 0 : num,
      padLength: digits.length,
      suffix,
      raw,
    };
  }

  return { prefix: raw, num: 0, padLength: 2, suffix: "", raw };
}

/**
 * Format nomor integer menjadi string nomor SPD dengan padding dan prefix/suffix yang sesuai.
 */
export function formatSpdNumber(
  num: number,
  padLength: number = 2,
  prefix: string = "",
  suffix: string = ""
): string {
  if (num <= 0) {
    return prefix ? `${prefix}01${suffix}` : "01";
  }
  const padded = String(num).padStart(Math.max(padLength, 2), "0");
  return `${prefix}${padded}${suffix}`;
}

/**
 * Dapatkan nomor SPD tertinggi yang terdaftar di database lokal (daftar kegiatan tersimpan & storage cache).
 */
export function getLatestRegisteredSpdNumber(extraActivities?: SavedKegiatan[]): number {
  if (typeof window === "undefined") return 0;

  let maxSpd = 0;

  // 1. Cek dari nilai langsung yang tersimpan di localStorage
  try {
    const directStored = localStorage.getItem(STORAGE_KEY_LATEST_SPD);
    if (directStored) {
      const parsed = parseInt(directStored, 10);
      if (!isNaN(parsed) && parsed > maxSpd) {
        maxSpd = parsed;
      }
    }
  } catch {
    // ignore
  }

  // 2. Pindai seluruh data kegiatan tersimpan (SavedKegiatan)
  try {
    const savedList = extraActivities || getSavedKegiatanList();
    if (Array.isArray(savedList)) {
      for (const item of savedList) {
        if (item.rows && Array.isArray(item.rows)) {
          for (const row of item.rows) {
            if (row.nomorSpd) {
              const parsed = parseSpdNumber(row.nomorSpd);
              if (parsed.num > maxSpd) {
                maxSpd = parsed.num;
              }
            }
          }
        }
      }
    }
  } catch {
    // ignore
  }

  // 3. Pindai cache data rekap jika tersedia
  try {
    const cachedRekapRaw = localStorage.getItem("perdin_cached_rekap_data");
    if (cachedRekapRaw) {
      const rekapRows = JSON.parse(cachedRekapRaw);
      if (Array.isArray(rekapRows)) {
        for (const r of rekapRows) {
          const rawSpd = r.nomor_spd || r.nomorSpd || r["No. SPD"] || r["No SPD"];
          if (rawSpd) {
            const parsed = parseSpdNumber(rawSpd);
            if (parsed.num > maxSpd) {
              maxSpd = parsed.num;
            }
          }
        }
      }
    }
  } catch {
    // ignore
  }

  return maxSpd;
}

/**
 * Simpan nomor SPD tertinggi ke localStorage dan picu event agar komponen lain tersinkronisasi.
 */
export function saveLatestRegisteredSpdNumber(num: number): void {
  if (typeof window === "undefined") return;
  if (!num || isNaN(num) || num <= 0) return;

  try {
    const current = getLatestRegisteredSpdNumber();
    if (num > current) {
      localStorage.setItem(STORAGE_KEY_LATEST_SPD, String(num));
      window.dispatchEvent(
        new CustomEvent("spd-latest-updated", {
          detail: { latestSpdNumber: num },
        })
      );
    }
  } catch (err) {
    console.error("Gagal menyimpan latest spd number:", err);
  }
}

/**
 * Dapatkan nomor urut SPD selanjutnya (+1) dari string acuan sebelumnya.
 * Jika acuan kosong/tidak valid, gunakan fallbackStart atau (latest + 1).
 */
export function getNextSpdNumber(
  referenceSpd?: string | number,
  fallbackStart?: number
): string {
  if (referenceSpd !== undefined && referenceSpd !== null && referenceSpd !== "") {
    const parsed = parseSpdNumber(referenceSpd);
    if (parsed.num > 0) {
      return formatSpdNumber(
        parsed.num + 1,
        parsed.padLength,
        parsed.prefix,
        parsed.suffix
      );
    }
  }

  const start = fallbackStart ?? getLatestRegisteredSpdNumber() + 1;
  return formatSpdNumber(start, 2);
}

/**
 * Urutkan seluruh baris peserta secara sekuensial (+1 berurutan per kepala).
 * Baris 1 dapat menggunakan customStart atau mempertahankan nomor baris 1 saat ini.
 */
export function sequenceSpdNumbers(
  rows: ParticipantRow[],
  customStart?: string | number
): ParticipantRow[] {
  if (!rows || rows.length === 0) return [];

  // Tentukan nomor awal untuk Baris 1
  let firstSpdStr = customStart !== undefined && customStart !== ""
    ? String(customStart).trim()
    : (rows[0].nomorSpd ? String(rows[0].nomorSpd).trim() : "");

  if (!firstSpdStr) {
    const latest = getLatestRegisteredSpdNumber();
    firstSpdStr = formatSpdNumber(latest + 1, 2);
  }

  const firstParsed = parseSpdNumber(firstSpdStr);
  const startNum = firstParsed.num > 0 ? firstParsed.num : 1;
  const padLength = Math.max(firstParsed.padLength, 2);
  const prefix = firstParsed.prefix;
  const suffix = firstParsed.suffix;

  return rows.map((row, index) => {
    const currentNum = startNum + index;
    const sequentialSpd = formatSpdNumber(currentNum, padLength, prefix, suffix);
    return {
      ...row,
      nomorSpd: sequentialSpd,
    };
  });
}
