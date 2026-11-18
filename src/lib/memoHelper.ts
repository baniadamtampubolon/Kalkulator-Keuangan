/**
 * Helper untuk Buku Kendali & Manajemen Daftar Nomor Memorandum Terdaftar
 * Mengintegrasikan database master (nomor_memo.json), sinkronisasi cloud, dan penyimpanan lokal
 */

import { NomorMemo, SavedKegiatan } from "./types";
import { getSavedKegiatanList } from "./kegiatanHelper";
import * as XLSX from "xlsx";

export const STORAGE_KEY_CUSTOM_MEMOS = "perdin_custom_memo_entries";
export const STORAGE_KEY_DELETED_MEMOS = "perdin_deleted_memo_keys";

export function getDeletedMemoKeys(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DELETED_MEMOS);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed.map((x) => String(x).toLowerCase())) : new Set();
  } catch {
    return new Set();
  }
}

function unmarkMemoAsDeleted(memo: NomorMemo): void {
  if (typeof window === "undefined") return;
  try {
    const keys = getDeletedMemoKeys();
    const seq = extractMemoSeqNumber(memo);
    const fmt = (memo.format_lengkap || memo.noMemo || "").trim().toLowerCase();
    if (fmt) keys.delete(fmt);
    if (seq > 0) keys.delete(`seq-${seq}`);
    localStorage.setItem(STORAGE_KEY_DELETED_MEMOS, JSON.stringify(Array.from(keys)));
  } catch {
    // ignore
  }
}

export function markMemoAsDeleted(formatOrSeq: string | number): void {
  if (typeof window === "undefined") return;
  try {
    const keys = getDeletedMemoKeys();
    const str = String(formatOrSeq).trim().toLowerCase();
    const seq = typeof formatOrSeq === "number" ? formatOrSeq : extractMemoSeqNumber(str);
    if (str) keys.add(str);
    if (seq > 0) keys.add(`seq-${seq}`);
    localStorage.setItem(STORAGE_KEY_DELETED_MEMOS, JSON.stringify(Array.from(keys)));
  } catch {
    // ignore
  }
}

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

    unmarkMemoAsDeleted(memo);
    localStorage.setItem(STORAGE_KEY_CUSTOM_MEMOS, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("memo-list-updated", { detail: { memo, list: updated } }));
  } catch (err) {
    console.error("Gagal menyimpan custom memo:", err);
  }
}

/**
 * Hapus nomor memo dari localStorage & tandai terhapus agar tidak muncul kembali dari cache statis
 */
export function deleteCustomMemo(formatOrSeq: string | number): void {
  if (typeof window === "undefined") return;
  try {
    const current = getCustomMemoList();
    const str = String(formatOrSeq).trim();
    const num = typeof formatOrSeq === "number" ? formatOrSeq : extractMemoSeqNumber(str);

    const updated = current.filter((m) => {
      const f = (m.format_lengkap || m.noMemo || "").trim();
      if (f && f.toLowerCase() === str.toLowerCase()) return false;
      if (num > 0 && extractMemoSeqNumber(m) === num) return false;
      return true;
    });

    markMemoAsDeleted(str);
    localStorage.setItem(STORAGE_KEY_CUSTOM_MEMOS, JSON.stringify(updated));
    window.dispatchEvent(
      new CustomEvent("memo-list-updated", { detail: { deleted: str, seq: num, list: updated } })
    );
  } catch (err) {
    console.error("Gagal menghapus custom memo:", err);
  }
}

/**
 * Menggabungkan master data memo bawaan dengan memo kustom lokal & seluruh kegiatan tersimpan (5 jenis SPJ) secara unik & terurut
 */
export function mergeAndSortMemoList(baseList: NomorMemo[], customList?: NomorMemo[]): NomorMemo[] {
  const customs = customList !== undefined ? customList : getCustomMemoList();
  const savedKegiatan = typeof window !== "undefined" ? getSavedKegiatanList() : [];
  const deletedKeys = getDeletedMemoKeys();
  const seenKodes = new Set<string>();
  const seenSeqs = new Set<number>();
  const merged: NomorMemo[] = [];

  const registerEntry = (entry: NomorMemo) => {
    const seq = extractMemoSeqNumber(entry);
    const key = (entry.format_lengkap || entry.noMemo || (seq > 0 ? `SEQ-${seq}` : "")).trim().toLowerCase();
    if (!key) return;
    if (deletedKeys.has(key) || (seq > 0 && deletedKeys.has(`seq-${seq}`))) return;
    if (seenKodes.has(key)) return;
    if (seq > 0 && seenSeqs.has(seq)) return;
    seenKodes.add(key);
    if (seq > 0) seenSeqs.add(seq);
    merged.push(entry);
  };

  // 1. Dahulukan kustom lokal terbaru jika ada penimpaan
  for (const c of customs) {
    registerEntry(c);
  }

  // 2. Pastikan seluruh nomor memo dari 5 modul SPJ di Daftar Kegiatan ikut terdaftar bersama
  for (const k of savedKegiatan) {
    const memoNo = (k.header?.nomorMemo || "").trim();
    if (!memoNo || memoNo.toLowerCase().includes("xxx")) continue;
    const seq = extractMemoSeqNumber(memoNo);
    if (seq <= 0) continue;
    registerEntry({
      tahun_anggaran: 2026,
      nomor_urut: String(seq),
      format_lengkap: memoNo,
      tanggal_memo: k.header?.tanggalMemo || k.tanggalSpd || "",
      perihal: k.header?.keteranganMemo || k.namaKegiatan || "",
      id_kegiatan_ref: k.idKegiatan,
      status: "TERPAKAI",
      nominal: k.grandTotal || 0,
      MAK: k.header?.nomorMak || "524111",
      noMemo: memoNo,
      tanggal: k.header?.tanggalMemo || k.tanggalSpd || "",
      mak: k.header?.nomorMak || "524111",
    });
  }

  // 3. Tambahkan daftar memo dari MASTER_MEMO
  for (const b of baseList) {
    registerEntry(b);
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
    "Judul Kegiatan",
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
      ? kegiatanMap.get(format.toLowerCase()) ||
        (seq > 0 ? kegiatanMap.get(`seq-${seq}`) : undefined) ||
        (m.id_kegiatan_ref ? kegiatanMap.get(`id-${m.id_kegiatan_ref.toLowerCase()}`) : undefined)
      : undefined;

    const judulKegiatan = linked?.namaKegiatan || linked?.header?.keteranganKegiatan || perihal;
    const rawNom = m.nominal ? Number(String(m.nominal).replace(/\D/g, "")) : (linked?.grandTotal || 0);
    const nominal = rawNom > 0 ? rawNom : "";
    const status = m.status || (perihal !== "-" && perihal ? "TERPAKAI" : "TERSEDIA");
    const idRef = m.id_kegiatan_ref || linked?.idKegiatan || "-";

    return [seq > 0 ? seq : "-", format, tgl, judulKegiatan, perihal, mak, nominal, status, idRef];
  });

  const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);

  // Lebar kolom adaptif
  ws["!cols"] = [
    { wch: 10 }, // No. Urut
    { wch: 28 }, // Format Lengkap
    { wch: 18 }, // Tanggal
    { wch: 55 }, // Judul Kegiatan
    { wch: 42 }, // Perihal
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

export interface MemoAssignStatus {
  isLockedSelf: boolean;
  conflictOwner: string;
  lastUsedMemoStr: string | null;
  nextAvailNum: number;
  nextAvailStr: string;
}

/**
 * Hitung status keterpakaian nomor memo aktif & nomor tersedia berikutnya untuk dropdown/input form.
 */
export function getMemoAssignStatus(params: {
  memoList: NomorMemo[];
  seqNumber: string;
  nomorMemo?: string;
  reservedMemo?: string;
  idKegiatan?: string;
  romanMonth: string;
  year: string;
}): MemoAssignStatus {
  const { memoList, seqNumber, nomorMemo, reservedMemo, idKegiatan, romanMonth, year } = params;
  let maxNum = 0;
  let lastUsedMemoStr = "";

  for (const m of memoList || []) {
    const numVal = extractMemoSeqNumber(m);
    const isUsed = Boolean(
      (m.status && String(m.status).trim().toUpperCase().includes("TERPAKAI")) ||
        (m.id_kegiatan_ref && String(m.id_kegiatan_ref).trim().length > 0) ||
        (m.perihal && String(m.perihal).trim().length > 0) ||
        (m.tanggal_memo && String(m.tanggal_memo).trim().length > 0) ||
        (m.noMemo && m.tanggal)
    );
    if (isUsed && numVal > maxNum) {
      maxNum = numVal;
      lastUsedMemoStr =
        m.format_lengkap ||
        m.noMemo ||
        `M.${numVal}${m.unit || "/INS/PPK/"}${m.bulanRomawi || romanMonth}${m.tahun || `/${year}`}`;
    }
  }

  const nextAvailNum = (maxNum || 320) + 1;
  const nextAvailStr = `M.${nextAvailNum}/INS/PPK/${romanMonth}/${year}`;
  const isLockedSelf = Boolean(reservedMemo && nomorMemo && reservedMemo === nomorMemo);

  let conflictOwner = "";
  if (seqNumber && seqNumber !== "xxx") {
    const match = (memoList || []).find(
      (m) => String(extractMemoSeqNumber(m)) === String(seqNumber).trim()
    );
    if (match) {
      const ref = String(match.id_kegiatan_ref || "").trim();
      const isUsed =
        String(match.status || "").toUpperCase().includes("TERPAKAI") ||
        Boolean(ref) ||
        Boolean(match.perihal && String(match.perihal).trim() !== "");
      const ownedBySelf =
        (idKegiatan && ref && ref.toLowerCase() === idKegiatan.toLowerCase()) ||
        isLockedSelf;
      if (isUsed && !ownedBySelf) {
        conflictOwner = ref || "kegiatan lain";
      }
    }
  }

  return {
    isLockedSelf,
    conflictOwner,
    lastUsedMemoStr: lastUsedMemoStr || null,
    nextAvailNum,
    nextAvailStr,
  };
}

