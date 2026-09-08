import { SavedKegiatan, ParticipantRow } from "./types";
import { STORAGE_KEY_REKAP } from "./rekapHelper";

export const STORAGE_KEY_KEGIATAN = "perdin_saved_kegiatan_list";

/**
 * Format string tanggal YYYY-MM-DD menjadi ddmmyy (contoh: 2026-09-08 -> 080926)
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
 * Buat ID Kegiatan dengan format baku: K-ddmmyy-nokegiatan-A/B
 * Contoh: K-080926-08-A
 * A = ASN (memiliki NIP & pangkat/jabatan)
 * B = Non-ASN (tidak memiliki NIP / eksternal)
 */
export function generateIdKegiatan(
  tanggalStr?: string,
  noKegiatan: string | number = "01",
  kategori: "A" | "B" = "A"
): string {
  const ddmmyy = formatDateToDdmmyy(tanggalStr);
  const formattedNo = String(noKegiatan).padStart(2, "0");
  return `K-${ddmmyy}-${formattedNo}-${kategori}`;
}

/**
 * Deteksi otomatis apakah peserta merupakan ASN (A) atau Non-ASN (B)
 */
export function detectKategoriFromRows(rows: ParticipantRow[]): "A" | "B" {
  if (!rows || rows.length === 0) return "A";
  const hasNonAsn = rows.some(
    (r) => Boolean(r.namaExternal && r.namaExternal.trim() !== "") || !r.nip || r.nip.trim() === ""
  );
  return hasNonAsn ? "B" : "A";
}

/**
 * Ambil daftar kegiatan tersimpan dari localStorage
 */
export function getSavedKegiatanList(): SavedKegiatan[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_KEGIATAN);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Gagal membaca daftar kegiatan dari storage:", err);
    return [];
  }
}

/**
 * Cari nomor urut kegiatan berikutnya untuk tanggal yang dipilih
 */
export function getNextNoKegiatan(
  tanggalStr?: string,
  kategori?: "A" | "B" | SavedKegiatan[],
  existingList?: SavedKegiatan[]
): string {
  const list = Array.isArray(kategori) ? kategori : (existingList || getSavedKegiatanList());
  const katFilter = typeof kategori === "string" ? kategori : undefined;
  const ddmmyy = formatDateToDdmmyy(tanggalStr);

  // Cari semua kegiatan yang memiliki tanggal ddmmyy yang sama
  const matchingNumbers: number[] = [];
  list.forEach((item) => {
    if (item.idKegiatan && item.idKegiatan.startsWith(`K-${ddmmyy}-`)) {
      const parts = item.idKegiatan.split("-");
      if (parts.length >= 4) {
        if (!katFilter || parts[3] === katFilter) {
          const num = parseInt(parts[2], 10);
          if (!isNaN(num)) matchingNumbers.push(num);
        }
      }
    }
  });

  if (matchingNumbers.length === 0) {
    return "01";
  }

  const maxNum = Math.max(...matchingNumbers);
  return String(maxNum + 1).padStart(2, "0");
}

/**
 * Simpan atau perbarui data kegiatan di localStorage
 */
export function saveKegiatanRecord(kegiatan: SavedKegiatan): {
  updatedList: SavedKegiatan[];
  isUpdate: boolean;
} {
  if (typeof window === "undefined") return { updatedList: [], isUpdate: false };

  const currentList = getSavedKegiatanList();
  const existingIdx = currentList.findIndex((k) => k.idKegiatan === kegiatan.idKegiatan);

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
