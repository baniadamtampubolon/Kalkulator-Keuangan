import { SavedKegiatan, ParticipantRow } from "./types";
import { STORAGE_KEY_REKAP } from "./rekapHelper";

export const STORAGE_KEY_KEGIATAN = "perdin_saved_kegiatan_list";

/**
 * Format string tanggal YYYY-MM-DD menjadi YYMM (contoh: 2026-09-08 -> 2609)
 */
export function formatDateToYymm(dateStr?: string): string {
  let d: Date;
  if (dateStr && !isNaN(new Date(dateStr).getTime())) {
    d = new Date(dateStr);
  } else {
    d = new Date();
  }

  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(-2);

  return `${year}${month}`;
}

/**
 * Format string tanggal YYYY-MM-DD menjadi ddmmyy (contoh: 2026-09-08 -> 080926) - Legacy helper
 */
export function formatDateToDdmmyy(dateStr?: string): string {
  let d: Date;
  if (dateStr && !isNaN(new Date(dateStr).getTime())) {
    d = new Date(dateStr);
  } else {
    d = new Date();
  }

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(-2);

  return `${day}${month}${year}`;
}

/**
 * Buat ID Kegiatan dengan format baku baru: KEG-YYMM-001-A (ASN) / KEG-YYMM-001-NA (Non-ASN)
 * Contoh: KEG-2609-001-A, KEG-2610-002-NA
 * A = ASN (memiliki NIP & pangkat/jabatan)
 * NA = Non-ASN (tidak memiliki NIP / eksternal)
 */
export function generateIdKegiatan(
  tanggalStr?: string,
  noKegiatan: string | number = "001",
  kategori: "A" | "NA" | "B" = "A"
): string {
  const yymm = formatDateToYymm(tanggalStr);
  const num =
    typeof noKegiatan === "number"
      ? noKegiatan
      : parseInt(String(noKegiatan).replace(/\D/g, "") || "1", 10);
  const formattedNo = String(isNaN(num) ? 1 : num).padStart(3, "0");
  const kat = kategori === "NA" || kategori === "B" ? "NA" : "A";
  return `KEG-${yymm}-${formattedNo}-${kat}`;
}

/**
 * Buat ID Peserta dengan format turunan: [ID_KEGIATAN]-[NOMOR_URUT_PESERTA]
 * Contoh: KEG-2609-001-A-01, KEG-2609-001-A-02, KEG-2609-001-NA-01
 */
export function generateIdPeserta(
  idKegiatan: string,
  urutPeserta: number | string = 1
): string {
  const pNo = String(urutPeserta).padStart(2, "0");
  return `${idKegiatan}-${pNo}`;
}

/**
 * Deteksi otomatis apakah peserta merupakan ASN (A) atau Non-ASN (NA)
 */
export function detectKategoriFromRows(rows: ParticipantRow[]): "A" | "NA" {
  if (!rows || rows.length === 0) return "A";
  const hasNonAsn = rows.some(
    (r) => Boolean(r.namaExternal && r.namaExternal.trim() !== "") || !r.nip || r.nip.trim() === ""
  );
  return hasNonAsn ? "NA" : "A";
}

/**
 * Urutkan daftar kegiatan berdasarkan kegiatan yang terbaru:
 * 1. Prioritaskan ID Kegiatan (KEG-YYMM-XXX) karena penomoran paket kegiatan selalu bertambah seiring kegiatan baru dibuat
 * 2. Tanggal kegiatan (tanggalSpd) terbaru
 * 3. Waktu update / create terbaru
 * 4. Nomor SPD tertinggi
 */
export function sortKegiatanByNewest(list: SavedKegiatan[]): SavedKegiatan[] {
  if (!Array.isArray(list)) return [];

  const parseIdScore = (id?: string): number => {
    if (!id) return 0;
    // Format standar: KEG-YYMM-XXX-A/NA (contoh: KEG-2610-002-A -> 202610002)
    const match = id.match(/KEG-(\d{2})(\d{2})-(\d+)/i);
    if (match) {
      const yy = parseInt(match[1], 10);
      const mm = parseInt(match[2], 10);
      const seq = parseInt(match[3], 10);
      return (2000 + yy) * 1000000 + mm * 10000 + seq;
    }
    // Format legacy: K-ddmmyy-no-A/B
    const legMatch = id.match(/K-(\d{2})(\d{2})(\d{2})-(\d+)/i);
    if (legMatch) {
      const mm = parseInt(legMatch[2], 10);
      const yy = parseInt(legMatch[3], 10);
      const seq = parseInt(legMatch[4], 10);
      return (2000 + yy) * 1000000 + mm * 10000 + seq;
    }
    return 0;
  };

  const getMaxSpd = (item: SavedKegiatan): number => {
    let max = 0;
    (item.rows || []).forEach((r) => {
      const num = parseInt(String(r.nomorSpd || "").replace(/\D/g, ""), 10);
      if (!isNaN(num) && num > max) max = num;
    });
    return max;
  };

  return [...list].sort((a, b) => {
    // 1. Bandingkan ID Score (Nomor urut paket kegiatan yang lebih tinggi / baru dibuat)
    const scoreA = parseIdScore(a.idKegiatan);
    const scoreB = parseIdScore(b.idKegiatan);
    if (scoreA !== scoreB && scoreA > 0 && scoreB > 0) {
      return scoreB - scoreA;
    }

    // 2. Bandingkan tanggal kegiatan / Tanggal SPD
    const dateA = a.tanggalSpd ? new Date(a.tanggalSpd).getTime() : 0;
    const dateB = b.tanggalSpd ? new Date(b.tanggalSpd).getTime() : 0;
    const vDateA = !isNaN(dateA) ? dateA : 0;
    const vDateB = !isNaN(dateB) ? dateB : 0;
    if (vDateA !== vDateB) {
      return vDateB - vDateA;
    }

    // 3. Bandingkan timestamp update/create
    const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
    const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
    const vTimeA = !isNaN(timeA) ? timeA : 0;
    const vTimeB = !isNaN(timeB) ? timeB : 0;
    if (vTimeA !== vTimeB && vTimeA > 0 && vTimeB > 0) {
      return vTimeB - vTimeA;
    }

    // 4. Bandingkan nomor SPD tertinggi
    const spdA = getMaxSpd(a);
    const spdB = getMaxSpd(b);
    if (spdA !== spdB && spdA > 0 && spdB > 0) {
      return spdB - spdA;
    }

    return (b.idKegiatan || "").localeCompare(a.idKegiatan || "");
  });
}

/**
 * Ambil daftar kegiatan tersimpan dari localStorage (selalu terurut dari yang terbaru)
 */
export function getSavedKegiatanList(): SavedKegiatan[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_KEGIATAN);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) ? parsed : [];
    return sortKegiatanByNewest(list);
  } catch (err) {
    console.error("Gagal membaca daftar kegiatan dari storage:", err);
    return [];
  }
}

/**
 * Cari nomor urut kegiatan berikutnya untuk periode bulan/tahun yang dipilih
 */
export function getNextNoKegiatan(
  tanggalStr?: string,
  kategori?: "A" | "NA" | "B" | SavedKegiatan[],
  existingList?: SavedKegiatan[]
): string {
  const list = Array.isArray(kategori) ? kategori : (existingList || getSavedKegiatanList());
  const yymm = formatDateToYymm(tanggalStr);

  // Cari semua kegiatan yang berada pada periode YYMM yang sama
  const matchingNumbers: number[] = [];
  list.forEach((item) => {
    if (!item.idKegiatan) return;

    if (item.idKegiatan.startsWith(`KEG-${yymm}-`)) {
      const parts = item.idKegiatan.split("-");
      if (parts.length >= 3) {
        const num = parseInt(parts[2], 10);
        if (!isNaN(num)) matchingNumbers.push(num);
      }
    } else if (item.idKegiatan.startsWith("K-")) {
      // Legacy K-ddmmyy-no-A/B fallback
      const parts = item.idKegiatan.split("-");
      if (parts.length >= 3) {
        const num = parseInt(parts[2], 10);
        if (!isNaN(num)) matchingNumbers.push(num);
      }
    }
  });

  if (matchingNumbers.length === 0) {
    return "001";
  }

  const maxNum = Math.max(...matchingNumbers);
  return String(maxNum + 1).padStart(3, "0");
}

/**
 * Simpan atau perbarui data kegiatan di localStorage
 */
export function saveKegiatanRecord(
  kegiatan: SavedKegiatan,
  oldIdKegiatan?: string
): {
  updatedList: SavedKegiatan[];
  isUpdate: boolean;
} {
  if (typeof window === "undefined") return { updatedList: [], isUpdate: false };

  const currentList = getSavedKegiatanList();
  const existingIdx = currentList.findIndex(
    (k) =>
      k.idKegiatan === kegiatan.idKegiatan ||
      (oldIdKegiatan && k.idKegiatan === oldIdKegiatan) ||
      (kegiatan.namaKegiatan &&
        k.namaKegiatan &&
        k.namaKegiatan.trim().toLowerCase() === kegiatan.namaKegiatan.trim().toLowerCase() &&
        k.tanggalSpd === kegiatan.tanggalSpd)
  );

  let updatedList: SavedKegiatan[];
  let isUpdate = false;

  const timestamp = new Date().toISOString();
  const recordToSave: SavedKegiatan = {
    ...kegiatan,
    updatedAt: timestamp,
  };

  if (existingIdx >= 0) {
    isUpdate = true;
    updatedList = [...currentList];
    updatedList[existingIdx] = {
      ...updatedList[existingIdx],
      ...recordToSave,
    };
  } else {
    recordToSave.createdAt = timestamp;
    updatedList = [recordToSave, ...currentList];
  }

  updatedList = sortKegiatanByNewest(updatedList);

  try {
    localStorage.setItem(STORAGE_KEY_KEGIATAN, JSON.stringify(updatedList));
    window.dispatchEvent(
      new CustomEvent("kegiatan-list-updated", {
        detail: { updatedList, savedKegiatan: recordToSave, isUpdate },
      })
    );
  } catch (err) {
    console.error("Gagal menyimpan kegiatan ke localStorage:", err);
  }

  return { updatedList, isUpdate };
}

/**
 * Hapus kegiatan dari daftar tersimpan dan bersihkan dari Rekap Perdin
 */
export function deleteKegiatanRecord(idKegiatan: string): {
  updatedList: SavedKegiatan[];
  deleted?: SavedKegiatan;
} {
  if (typeof window === "undefined") return { updatedList: [] };

  const currentList = getSavedKegiatanList();
  const deleted = currentList.find((k) => k.idKegiatan === idKegiatan);
  const updatedList = currentList.filter((k) => k.idKegiatan !== idKegiatan);

  try {
    // 1. Simpan daftar kegiatan yang baru
    localStorage.setItem(STORAGE_KEY_KEGIATAN, JSON.stringify(updatedList));

    // 2. Bersihkan baris di Rekap Perdin yang memiliki _spjBatchId yang sama
    const rekapRaw = localStorage.getItem(STORAGE_KEY_REKAP);
    if (rekapRaw) {
      const rekapList: Array<Record<string, unknown>> = JSON.parse(rekapRaw);
      if (Array.isArray(rekapList)) {
        const cleanedRekap = rekapList.filter((r) => r._spjBatchId !== idKegiatan);
        localStorage.setItem(STORAGE_KEY_REKAP, JSON.stringify(cleanedRekap));
        window.dispatchEvent(
          new CustomEvent("rekap-perdin-updated", {
            detail: { updatedRekap: cleanedRekap, deletedIdKegiatan: idKegiatan },
          })
        );
      }
    }

    window.dispatchEvent(
      new CustomEvent("kegiatan-list-updated", {
        detail: { updatedList, deleted },
      })
    );
  } catch (err) {
    console.error("Gagal menghapus kegiatan:", err);
  }

  return { updatedList, deleted };
}
