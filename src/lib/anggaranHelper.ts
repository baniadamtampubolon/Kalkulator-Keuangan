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

export const STORAGE_KEY = "kalkulator_monitoring_anggaran_v3";
export const TRX_LOCAL_STORAGE_KEY = "kalkulator_monitoring_anggaran_trx_v1";
export const ANGGARAN_CLOUD_SEEDED_KEY = "anggaran_cloud_seeded";
export const ANGGARAN_UPDATED_EVENT = "anggaran-updated";

export interface LocalAnggaranTrxRecord {
  idKegiatan: string;
  targetRowId: string;
  nominal: number;
  baselineIncluded: number;
}

/**
 * Return deep clone of initial data extracted from anggaran-lengkap files (6), (7), (9), (10)
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
    // Purge old v1 & v2 cache if still present
    localStorage.removeItem("kalkulator_monitoring_anggaran_v1");
    localStorage.removeItem("kalkulator_monitoring_anggaran_v2");

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
 * Save AnggaranData to LocalStorage and broadcast live update event in the same tab
 */
export function saveAnggaranData(data: AnggaranData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent(ANGGARAN_UPDATED_EVENT));
  } catch (err) {
    console.error("Gagal menyimpan monitoring anggaran ke localStorage:", err);
  }
}

export function loadLocalAnggaranTrxMap(): Record<string, LocalAnggaranTrxRecord> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(TRX_LOCAL_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveLocalAnggaranTrxMap(map: Record<string, LocalAnggaranTrxRecord>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TRX_LOCAL_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage quota errors
  }
}

export function clearLocalAnggaranTrxMap(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(TRX_LOCAL_STORAGE_KEY);
  } catch {
    // ignore
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

/**
 * Look up Pagu for an Akun MAK and Item Detail directly from Monitoring Anggaran (16 Segmen).
 */
export interface ResolvedAnggaranTarget {
  matchedAkunRow?: AnggaranRow;
  matchedItemRow?: AnggaranRow;
  targetRow?: AnggaranRow;
  syntheticRow?: AnggaranRow;
  insertAfterIndex: number;
  kodeAkunPath: string;
  kodeItem: string;
}

function buildCanonicalAkunCode(
  akunRow: AnggaranRow,
  byId: Map<string, AnggaranRow>
): string {
  const ancestors: AnggaranRow[] = [];
  let curr: AnggaranRow | undefined = akunRow;
  let guard = 0;
  while (curr && guard < 20) {
    ancestors.unshift(curr);
    curr = curr.parentId ? byId.get(curr.parentId) : undefined;
    guard++;
  }
  const keg = ancestors.find((a) => a.type === "kegiatan")?.kode || "";
  const ro = ancestors.find((a) => a.type === "ro")?.kode || "";
  const sub = ancestors.find((a) => a.type === "subkomponen")?.kode || "";
  const komp = ancestors.find((a) => a.type === "komponen")?.kode || "";
  const midSub = sub || komp;
  return [keg, ro, midSub, akunRow.kode]
    .filter(Boolean)
    .join(".")
    .replace(/^(CL|WA)\./i, "")
    .toUpperCase();
}

/**
 * Resolve matching Akun/Item rows and leaf target row for SPJ lookup or deduction.
 */
export function resolveAnggaranTargetsForSpj(
  rows: AnggaranRow[],
  nomorKomp?: string,
  nomorMak?: string,
  itemDetail?: string,
  keteranganItem?: string
): ResolvedAnggaranTarget {
  const byId = new Map<string, AnggaranRow>();
  rows.forEach((r) => byId.set(r.id, r));

  const cleanKomp = (nomorKomp || "")
    .replace(/^(CL|WA)\./i, "")
    .replace(/^MAK\./i, "")
    .trim()
    .toUpperCase();
  const cleanMak = (nomorMak || "524111").trim().toUpperCase();
  const targetAkunNoPrefix = cleanKomp
    ? cleanKomp.endsWith(`.${cleanMak}`) || cleanKomp === cleanMak
      ? cleanKomp
      : `${cleanKomp}.${cleanMak}`
    : "";

  const rawItem = (itemDetail || "").trim();
  const cleanItemCode = (
    rawItem.includes(".")
      ? rawItem.split(".")[0].trim()
      : rawItem.match(/^\d+/)?.[0] || rawItem
  ).toUpperCase();

  let matchedAkunRow: AnggaranRow | undefined;
  let matchedAkunPath = targetAkunNoPrefix;

  if (targetAkunNoPrefix) {
    matchedAkunRow = rows.find(
      (r) => r.type === "akun" && buildCanonicalAkunCode(r, byId) === targetAkunNoPrefix
    );
  }

  let matchedItemRow: AnggaranRow | undefined;
  if (matchedAkunRow && cleanItemCode) {
    matchedItemRow = rows.find(
      (r) =>
        r.type === "item" &&
        r.parentId === matchedAkunRow!.id &&
        String(r.kode || "").trim().toUpperCase() === cleanItemCode
    );
  }

  if (!matchedAkunRow && cleanItemCode) {
    matchedItemRow = rows.find((r) => {
      if (r.type !== "item" || String(r.kode || "").trim().toUpperCase() !== cleanItemCode) {
        return false;
      }
      if (!cleanMak) return true;
      const parentAkun = r.parentId ? byId.get(r.parentId) : undefined;
      return String(parentAkun?.kode || "").trim().toUpperCase() === cleanMak;
    });

    if (matchedItemRow && matchedItemRow.parentId) {
      const parent = byId.get(matchedItemRow.parentId);
      if (parent && parent.type === "akun") {
        matchedAkunRow = parent;
        matchedAkunPath = buildCanonicalAkunCode(parent, byId);
      }
    }
  }

  let targetRow: AnggaranRow | undefined = matchedItemRow;
  let syntheticRow: AnggaranRow | undefined;
  let insertAfterIndex = -1;

  if (!targetRow && matchedAkunRow) {
    const children: AnggaranRow[] = [];
    let lastDescendantIndex = -1;
    let akunIndex = -1;
    rows.forEach((r, idx) => {
      if (r.id === matchedAkunRow!.id) akunIndex = idx;
      if (r.parentId === matchedAkunRow!.id) {
        children.push(r);
        lastDescendantIndex = idx;
      }
    });

    if (children.length === 0) {
      targetRow = matchedAkunRow;
    } else if (children.length === 1 && !cleanItemCode) {
      targetRow = children[0];
    } else {
      const codeSlug = (cleanItemCode || "umum")
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "");
      const synId = `row-spj-${matchedAkunRow.id}-${codeSlug}`;
      const existingSyn = children.find((c) => c.id === synId);
      if (existingSyn) {
        targetRow = existingSyn;
      } else {
        syntheticRow = {
          id: synId,
          level: 8,
          type: "item",
          kode: cleanItemCode || "SPJ",
          uraian: (keteranganItem || "").trim() || `Realisasi SPJ (${cleanMak})`,
          pagu: 0,
          lock: 0,
          realLalu: 0,
          realIni: 0,
          realSd: 0,
          persen: 0,
          sisa: 0,
          parentId: matchedAkunRow.id,
        };
        targetRow = syntheticRow;
        insertAfterIndex = lastDescendantIndex !== -1 ? lastDescendantIndex : akunIndex;
      }
    }
  }

  return {
    matchedAkunRow,
    matchedItemRow,
    targetRow,
    syntheticRow,
    insertAfterIndex,
    kodeAkunPath: matchedAkunPath || targetAkunNoPrefix || cleanMak,
    kodeItem: cleanItemCode,
  };
}

/**
 * Find Sisa Anggaran (remaining Pagu after realization) for Memorandum Page 3
 * based on Komponen, MAK, and Item Detail.
 */
export function findPaguForMemorandum(
  nomorKomp?: string,
  nomorMak?: string,
  itemDetail?: string
): {
  paguAkun: number | null;
  paguItem: number | null;
  paguAwalAkun?: number | null;
  paguAwalItem?: number | null;
} {
  const data = loadAnggaranData();
  const rows = data.rows || [];
  if (rows.length === 0) return { paguAkun: null, paguItem: null };

  const { matchedAkunRow, matchedItemRow } = resolveAnggaranTargetsForSpj(
    rows,
    nomorKomp,
    nomorMak,
    itemDetail
  );

  const hideUnbudgetedSyntheticItem =
    matchedItemRow &&
    matchedItemRow.id.startsWith("row-spj-") &&
    (Number(matchedItemRow.pagu) || 0) === 0;

  return {
    paguAkun: matchedAkunRow ? Number(matchedAkunRow.sisa) || 0 : null,
    paguItem:
      matchedItemRow && !hideUnbudgetedSyntheticItem
        ? Number(matchedItemRow.sisa) || 0
        : null,
    paguAwalAkun: matchedAkunRow ? Number(matchedAkunRow.pagu) || 0 : null,
    paguAwalItem:
      matchedItemRow && !hideUnbudgetedSyntheticItem
        ? Number(matchedItemRow.pagu) || 0
        : null,
  };
}

function pruneEmptySyntheticRows(rows: AnggaranRow[]): AnggaranRow[] {
  return rows.filter((r) => {
    if (!String(r.id || "").startsWith("row-spj-")) return true;
    return (
      (Number(r.pagu) || 0) !== 0 ||
      (Number(r.lock) || 0) !== 0 ||
      (Number(r.realLalu) || 0) !== 0 ||
      (Number(r.realIni) || 0) !== 0
    );
  });
}

/**
 * Replace local Monitoring Anggaran cache with authoritative Cloud rows and broadcast update.
 */
export function applyCloudAnggaranRows(
  cloudRows: AnggaranRow[],
  periode?: string
): AnggaranData {
  const current = loadAnggaranData();
  const normalizedRows: AnggaranRow[] = cloudRows.map((r) => ({
    id: String(r.id || ""),
    level: Number(r.level) || 0,
    type: r.type || "item",
    kode: String(r.kode ?? ""),
    uraian: String(r.uraian || ""),
    pagu: Number(r.pagu) || 0,
    lock: Number(r.lock) || 0,
    realLalu: Number(r.realLalu) || 0,
    realIni: Number(r.realIni) || 0,
    realSd: Number(r.realSd) || 0,
    persen: Number(r.persen) || 0,
    sisa: Number(r.sisa) || 0,
    parentId: r.parentId || null,
  }));

  const recalculated = recalculateTree(normalizedRows);
  const nextData: AnggaranData = {
    meta: {
      ...current.meta,
      periode: periode ? String(periode).trim() : current.meta.periode,
    },
    rows: recalculated,
  };

  saveAnggaranData(nextData);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(ANGGARAN_CLOUD_SEEDED_KEY, "1");
    } catch {
      // ignore
    }
  }
  return nextData;
}

/**
 * Local fallback deduction/delta when offline or before Code.gs is redeployed.
 */
export function applyLocalSpjToAnggaran(params: {
  idKegiatan: string;
  oldIdKegiatan?: string;
  isNewRecord?: boolean;
  nomorKomp?: string;
  nomorMak?: string;
  itemDetail?: string;
  keteranganItem?: string;
  grandTotal: number;
  prevGrandTotal?: number;
}): AnggaranData | null {
  if (typeof window === "undefined") return null;
  const data = loadAnggaranData();
  let rows = data.rows.map((r) => ({ ...r }));
  if (rows.length === 0) return null;

  const trxMap = loadLocalAnggaranTrxMap();
  const existingTrx =
    trxMap[params.idKegiatan] ||
    (!params.isNewRecord && params.oldIdKegiatan ? trxMap[params.oldIdKegiatan] : undefined);

  if (existingTrx) {
    const prevRow = rows.find((r) => r.id === existingTrx.targetRowId);
    if (prevRow) {
      prevRow.realIni = (Number(prevRow.realIni) || 0) - (Number(existingTrx.nominal) || 0);
    }
    if (!params.isNewRecord && params.oldIdKegiatan && params.oldIdKegiatan !== params.idKegiatan) {
      delete trxMap[params.oldIdKegiatan];
    }
  }

  let baselineIncluded = 0;
  let newNominal = Number(params.grandTotal) || 0;
  if (existingTrx) {
    baselineIncluded = Number(existingTrx.baselineIncluded) || 0;
    newNominal = (Number(params.grandTotal) || 0) - baselineIncluded;
  } else if (!params.isNewRecord) {
    const prevTotal = Number(params.prevGrandTotal) || 0;
    baselineIncluded = prevTotal;
    newNominal = (Number(params.grandTotal) || 0) - prevTotal;
    if (newNominal === 0) return data;
  }

  const targetRes = resolveAnggaranTargetsForSpj(
    rows,
    params.nomorKomp,
    params.nomorMak,
    params.itemDetail,
    params.keteranganItem
  );

  if (!targetRes.targetRow && !existingTrx) {
    return data;
  }

  if (targetRes.targetRow) {
    let actualTarget = rows.find((r) => r.id === targetRes.targetRow!.id);
    if (!actualTarget && targetRes.syntheticRow) {
      actualTarget = { ...targetRes.syntheticRow };
      const idx =
        targetRes.insertAfterIndex >= 0 ? targetRes.insertAfterIndex + 1 : rows.length;
      rows.splice(idx, 0, actualTarget);
    }
    if (actualTarget) {
      actualTarget.realIni = (Number(actualTarget.realIni) || 0) + newNominal;
      trxMap[params.idKegiatan] = {
        idKegiatan: params.idKegiatan,
        targetRowId: actualTarget.id,
        nominal: newNominal,
        baselineIncluded,
      };
    }
  } else {
    delete trxMap[params.idKegiatan];
  }

  rows = pruneEmptySyntheticRows(rows);
  const nextData: AnggaranData = {
    ...data,
    rows: recalculateTree(rows),
  };
  saveLocalAnggaranTrxMap(trxMap);
  saveAnggaranData(nextData);
  return nextData;
}

/**
 * Local fallback refund when deleting an SPJ without Cloud response.
 */
export function refundLocalSpjFromAnggaran(
  idKegiatan?: string,
  oldIdKegiatan?: string
): AnggaranData | null {
  if (typeof window === "undefined") return null;
  const trxMap = loadLocalAnggaranTrxMap();
  const key =
    (idKegiatan && trxMap[idKegiatan] ? idKegiatan : undefined) ||
    (oldIdKegiatan && trxMap[oldIdKegiatan] ? oldIdKegiatan : undefined);
  if (!key) return null;

  const trx = trxMap[key];
  const data = loadAnggaranData();
  let rows = data.rows.map((r) => ({ ...r }));
  const target = rows.find((r) => r.id === trx.targetRowId);
  if (target) {
    target.realIni = (Number(target.realIni) || 0) - (Number(trx.nominal) || 0);
  }
  delete trxMap[key];
  rows = pruneEmptySyntheticRows(rows);
  const nextData: AnggaranData = {
    ...data,
    rows: recalculateTree(rows),
  };
  saveLocalAnggaranTrxMap(trxMap);
  saveAnggaranData(nextData);
  return nextData;
}


