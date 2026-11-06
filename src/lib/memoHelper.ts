/**
 * Helper untuk Buku Kendali & Manajemen Daftar Nomor Memorandum Terdaftar
 * Mengintegrasikan database master (nomor_memo.json), sinkronisasi cloud, dan penyimpanan lokal
 */

import { NomorMemo, SavedKegiatan } from "./types";
import * as XLSX from "xlsx";

export const STORAGE_KEY_CUSTOM_MEMOS = "perdin_custom_memo_entries";

/**
 * Konversi tanggal memo dari format serial Excel (contoh: 46084), ISO string (2026-03-03), atau teks bebas ke Bahasa Indonesia
 */
export function formatMemoDate(val: string | number | undefined | null): string {
  if (!val) return "-";
  const str = String(val).trim();
  if (!str) return "-";

  // Kasus angka serial Excel (misal 46084)
  if (!isNaN(Number(str)) && !str.includes("-") && !str.includes(" ") && !str.includes("/")) {
    const num = Number(str);
    if (num > 30000 && num < 60000) {
      const utcDays = Math.floor(num - 25569);
      const date = new Date(utcDays * 86400 * 1000);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      }
    }
  }

  // Kasus ISO Date (2026-11-03)
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
  }

  return str;
}

/**
 * Ekstrak nomor urut angka dari string nomor memo (contoh: 'M.320/INS/PPK/XI/2026' -> 320)
 */
export function extractMemoSeqNumber(memo: NomorMemo | string): number {
  if (typeof memo === "string") {
    const match = memo.match(/\bM\.?\s*(\d+)/i) || memo.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  if (memo.nomor_urut && !isNaN(Number(memo.nomor_urut))) {
    return Number(memo.nomor_urut);
  }
  if (memo.nomor && !isNaN(parseInt(memo.nomor, 10))) {
    return parseInt(memo.nomor, 10);
  }

  const str = memo.format_lengkap || memo.noMemo || "";
  const match = str.match(/\bM\.?\s*(\d+)/i) || str.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Ambil daftar nomor memo kustom yang ditambahkan pengguna secara lokal di browser
 */
export function getCustomMemoList(): NomorMemo[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_MEMOS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Simpan entri nomor memo baru atau perbarui memo yang ada ke localStorage
 */
export function saveCustomMemo(memo: NomorMemo): void {
  if (typeof window === "undefined") return;
  try {
    const current = getCustomMemoList();
    const memoSeq = extractMemoSeqNumber(memo);
    const memoFormat = (memo.format_lengkap || memo.noMemo || "").trim();

    const existingIdx = current.findIndex(
      (m) =>
        (memoFormat && (m.format_lengkap === memoFormat || m.noMemo === memoFormat)) ||
        (memoSeq > 0 && extractMemoSeqNumber(m) === memoSeq)
    );

    let updated: NomorMemo[];
    if (existingIdx >= 0) {
      updated = [...current];
      updated[existingIdx] = { ...updated[existingIdx], ...memo };
    } else {
      updated = [memo, ...current];
    }

    localStorage.setItem(STORAGE_KEY_CUSTOM_MEMOS, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("memo-list-updated", { detail: { memo, list: updated } }));
  } catch (err) {
    console.error("Gagal menyimpan custom memo:", err);
  }
}

/**
 * Hapus nomor memo kustom dari localStorage
 */
export function deleteCustomMemo(formatOrSeq: string | number): void {
  if (typeof window === "undefined") return;
  try {
    const current = getCustomMemoList();
    const str = String(formatOrSeq).trim();
    const num = parseInt(str.replace(/\D/g, ""), 10);

    const updated = current.filter((m) => {
      const f = (m.format_lengkap || m.noMemo || "").trim();
      if (f && f === str) return false;
      if (num && extractMemoSeqNumber(m) === num) return false;
      return true;
    });

    localStorage.setItem(STORAGE_KEY_CUSTOM_MEMOS, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("memo-list-updated", { detail: { list: updated } }));
  } catch (err) {
    console.error("Gagal menghapus custom memo:", err);
  }
}

/**
 * Menggabungkan master data memo bawaan dengan memo kustom lokal secara unik & terurut
 */
export function mergeAndSortMemoList(baseList: NomorMemo[], customList?: NomorMemo[]): NomorMemo[] {
  const customs = customList !== undefined ? customList : getCustomMemoList();
  const seenKodes = new Set<string>();
  const merged: NomorMemo[] = [];

  // Dahulukan kustom jika ada penimpaan
  for (const c of customs) {
    const key = (c.format_lengkap || c.noMemo || `SEQ-${extractMemoSeqNumber(c)}`).trim();
    if (key && !seenKodes.has(key)) {
      seenKodes.add(key);
      merged.push(c);
    }
  }

  for (const b of baseList) {
    const key = (b.format_lengkap || b.noMemo || `SEQ-${extractMemoSeqNumber(b)}`).trim();
    if (key && !seenKodes.has(key)) {
      seenKodes.add(key);
      merged.push(b);
    }
  }

  // Urutkan nomor urut descending (terbaru di atas)
  return merged.sort((a, b) => extractMemoSeqNumber(b) - extractMemoSeqNumber(a));
}

/**
 * Ekspor buku kendali nomor memorandum ke file Excel (.xlsx)
 */
export function exportMemoListToExcel(
  list: NomorMemo[],
  fileNamePrefix = "Buku_Kendali_Memorandum",
  kegiatanMap?: Map<string, SavedKegiatan>
): void {
  if (typeof window === "undefined") return;

  const headerRow = [
    "No. Urut",
    "Format Lengkap Nomor Memorandum",
    "Tanggal Memo",
    "Perihal / Uraian Pengajuan",
    "MAK / Komponen",
    "Biaya / Nominal (Rp)",
    "Status",
    "ID Kegiatan Ref",
  ];

  const dataRows = list.map((m) => {
    const seq = extractMemoSeqNumber(m);
    const format = m.format_lengkap || m.noMemo || (seq > 0 ? `M.${seq}/INS/PPK/XI/2026` : "-");
    const tgl = formatMemoDate(m.tanggal_memo || m.tanggal);
    const perihal = m.perihal || "-";
    const mak = m.MAK || m.mak || "-";

    const linked = kegiatanMap
      ? kegiatanMap.get(format.toLowerCase()) || (seq > 0 ? kegiatanMap.get(`seq-${seq}`) : undefined)
      : undefined;

    const rawNom = m.nominal ? Number(String(m.nominal).replace(/\D/g, "")) : (linked?.grandTotal || 0);
    const nominal = rawNom > 0 ? rawNom : "";
    const status = m.status || (perihal !== "-" && perihal ? "TERPAKAI" : "TERSEDIA");
    const idRef = m.id_kegiatan_ref || linked?.idKegiatan || "-";

    return [seq > 0 ? seq : "-", format, tgl, perihal, mak, nominal, status, idRef];
  });

  const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);

  // Lebar kolom adaptif
  ws["!cols"] = [
    { wch: 10 }, // No. Urut
    { wch: 28 }, // Format Lengkap
    { wch: 18 }, // Tanggal
    { wch: 55 }, // Perihal
    { wch: 30 }, // MAK
    { wch: 16 }, // Nominal
    { wch: 14 }, // Status
    { wch: 22 }, // ID Kegiatan Ref
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Daftar_Memorandum");

  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${fileNamePrefix}_${today}.xlsx`);
}

