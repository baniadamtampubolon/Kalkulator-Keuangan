import initialDataJson from "@/data/realisasi_16_segmen_initial.json";
import * as XLSX from "xlsx";

export type AnggaranRowType =
  | "total"
  | "program"
  | "kegiatan"
  | "kro"
  | "ro"
  | "komponen"
  | "subkomponen"
  | "akun"
  | "item";

export interface AnggaranRow {
  id: string;
  level: number;
  type: AnggaranRowType;
  kode: string;
  uraian: string;
  pagu: number;
  lock: number;
  realLalu: number;
  realIni: number;
  realSd: number;
  persen: number;
  sisa: number;
  parentId: string | null;
}

export interface AnggaranMeta {
  judul: string;
  subjudul: string;
  periode: string;
  kementerianKode: string;
  kementerianNama: string;
  unitOrganisasiKode: string;
  unitOrganisasiNama: string;
  satkerKode: string;
  satkerNama: string;
}

export interface AnggaranData {
  meta: AnggaranMeta;
  rows: AnggaranRow[];
}

const STORAGE_KEY = "kalkulator_monitoring_anggaran_v2";

/**
 * Return deep clone of initial data extracted from anggaran-lengkap files (7), (9), (10)
 */
export function getDefaultAnggaranData(): AnggaranData {
  return JSON.parse(JSON.stringify(initialDataJson)) as AnggaranData;
}

/**
 * Bottom-up recalculation of the hierarchy tree:
 * Level 8 (item) -> 7 (akun) -> 6 (subkomponen) -> 5 (komponen) -> 4 (ro) -> 3 (kro) -> 2 (kegiatan) -> 1 (program) -> 0 (total)
 */
export function recalculateTree(allRows: AnggaranRow[]): AnggaranRow[] {
  const rowMap = new Map<string, AnggaranRow>();
  allRows.forEach((r) => rowMap.set(r.id, { ...r }));

  // Map parent to its direct children
  const childrenMap = new Map<string, string[]>();
  allRows.forEach((r) => {
    if (r.parentId) {
      if (!childrenMap.has(r.parentId)) childrenMap.set(r.parentId, []);
      childrenMap.get(r.parentId)!.push(r.id);
    }
  });

  const levels = [8, 7, 6, 5, 4, 3, 2, 1, 0];

  levels.forEach((lvl) => {
    allRows
      .filter((r) => r.level === lvl)
      .forEach((r) => {
        const current = rowMap.get(r.id)!;
        const childIds = childrenMap.get(r.id);

        // If row has children, aggregate sums from children
        if (childIds && childIds.length > 0) {
          let sumPagu = 0;
          let sumLock = 0;
          let sumRealLalu = 0;
          let sumRealIni = 0;

          childIds.forEach((cId) => {
            const child = rowMap.get(cId);
            if (child) {
              sumPagu += Number(child.pagu) || 0;
              sumLock += Number(child.lock) || 0;
              sumRealLalu += Number(child.realLalu) || 0;
              sumRealIni += Number(child.realIni) || 0;
            }
          });

          current.pagu = sumPagu;
          current.lock = sumLock;
          current.realLalu = sumRealLalu;
          current.realIni = sumRealIni;
        }

        // Compute derived figures
        current.realSd = (Number(current.realLalu) || 0) + (Number(current.realIni) || 0);
        current.persen =
          current.pagu > 0 ? (current.realSd / current.pagu) * 100 : 0;
        current.sisa =
          (Number(current.pagu) || 0) -
          (Number(current.lock) || 0) -
          current.realSd;
      });
  });

  return allRows.map((r) => rowMap.get(r.id)!);
}

/**
 * Load AnggaranData from LocalStorage if present, else fallback to default from Excel.
 */
export function loadAnggaranData(): AnggaranData {
  if (typeof window === "undefined") {
    return getDefaultAnggaranData();
  }

  try {
    // Purge old v1 cache if still present
    localStorage.removeItem("kalkulator_monitoring_anggaran_v1");

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const defaultData = getDefaultAnggaranData();
      saveAnggaranData(defaultData);
      return defaultData;
    }
    const parsed = JSON.parse(raw) as AnggaranData;
    if (!parsed.rows || parsed.rows.length === 0) {
      const defaultData = getDefaultAnggaranData();
      saveAnggaranData(defaultData);
      return defaultData;
    }
    return parsed;
  } catch (err) {
    console.error("Gagal membaca monitoring anggaran dari localStorage:", err);
    return getDefaultAnggaranData();
  }
}

/**
 * Save AnggaranData to LocalStorage
 */
export function saveAnggaranData(data: AnggaranData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error("Gagal menyimpan monitoring anggaran ke localStorage:", err);
  }
}

/**
 * Reset AnggaranData to baseline initial Excel values
 */
export function resetAnggaranDataToDefault(): AnggaranData {
  const defaultData = getDefaultAnggaranData();
  saveAnggaranData(defaultData);
  return defaultData;
}

/**
 * Format number to Indonesian Currency
 */
export function formatRupiah(value: number): string {
  if (isNaN(value) || value === null || value === undefined) return "Rp 0";
  const isNegative = value < 0;
  const abs = Math.abs(value);
  const formatted = new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(abs);

  return isNegative ? `-Rp ${formatted}` : `Rp ${formatted}`;
}

/**
 * Format percentage
 */
export function formatPercent(value: number): string {
  if (isNaN(value) || value === null || value === undefined) return "0,00%";
  // If stored as fraction 0.5077 or percentage 50.77
  const normalized = value > 1 ? value : value * 100;
  return `${normalized.toFixed(2).replace(".", ",")}%`;
}

/**
 * Export current AnggaranData to an Excel (.xlsx) file matching the official SAKTI structure
 */
export function exportAnggaranToExcel(data: AnggaranData, filename?: string): void {
  const meta = data.meta;
  const rows = data.rows;

  const headerRows: (string | number)[][] = [
    [meta.judul],
    [meta.subjudul],
    [`Periode ${meta.periode}`],
    ["Kementerian :", "", "", "", "", "", "", "", "", "", "", "", "", "", meta.kementerianKode, meta.kementerianNama],
    ["Unit Organisasi :", "", "", "", "", "", "", "", "", "", "", "", "", "", meta.unitOrganisasiKode, meta.unitOrganisasiNama],
    ["Satuan Kerja :", "", "", "", "", "", "", "", "", "", "", "", "", "", meta.satkerKode, meta.satkerNama],
    [],
    [
      "Kode",
      "Level",
      "Uraian Segmen",
      "Pagu Revisi",
      "Lock Pagu",
      "Realisasi Periode Lalu",
      "Realisasi Periode Ini",
      "Realisasi s.d. Periode",
      "%",
      "Sisa Anggaran",
    ],
  ];

  const dataRows: (string | number)[][] = rows.map((r) => {
    const indent = "  ".repeat(Math.max(0, r.level - 1));
    const label = r.type === "total" ? r.uraian : `${indent}${r.kode ? `[${r.kode}] ` : ""}${r.uraian}`;
    const pct = r.persen > 1 ? r.persen / 100 : r.persen;

    return [
      r.kode,
      r.type.toUpperCase(),
      label,
      r.pagu,
      r.lock,
      r.realLalu,
      r.realIni,
      r.realSd,
      pct,
      r.sisa,
    ];
  });

  const allSheetData = [...headerRows, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(allSheetData);

  // Set column widths
  ws["!cols"] = [
    { wch: 14 }, // Kode
    { wch: 14 }, // Level
    { wch: 65 }, // Uraian
    { wch: 18 }, // Pagu
    { wch: 14 }, // Lock
    { wch: 22 }, // Lalu
    { wch: 20 }, // Ini
    { wch: 22 }, // s.d.
    { wch: 10 }, // %
    { wch: 20 }, // Sisa
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Realisasi 16 Segmen");

  const actualFilename =
    filename ||
    `Laporan_Realisasi_${meta.satkerKode}_${meta.periode.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.xlsx`;

  XLSX.writeFile(wb, actualFilename);
}

