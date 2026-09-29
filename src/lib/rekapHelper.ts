import { HeaderData, ParticipantRow } from "./types";
import { getSavedKegiatanList } from "./kegiatanHelper";

export const STANDARD_REKAP_HEADERS = [
  "No SPBY",
  "JENIS PENGAJUAN",
  "No SPM",
  "",
  "NAMA PEGAWAI INTERNAL INSPEKTORAT",
  "NAMA EXTERNAL",
  "NIP",
  "Gol",
  "Jabatan",
  "Jenis Perdin",
  "Status Pegawai",
  "Nama Kegiatan",
  "No Surat Tugas",
  "Unit Kerja",
  "Angkutan",
  "Berangkat dari-",
  "Tujuan ke-",
  "Tgl Berangkat",
  "Tgl Kembali",
  "Nomor Tiket",
  "Nama Maskapai",
  "Kode Booking",
  "Boarding Pass (Ada/Tidak)",
  "Nama Penginapan",
  "Tanggal Check In",
  "Tanggal Check Out",
  "Jumlah Hari Menginap",
  "Lama Hari 100%",
  "Lama Hari 40%",
  "Total Hari",
  "UH 100% ()",
  "UH 40% ()",
  "UH Fullboard/Fullday/Halfday/Diklat",
  "Biaya Penginapan Biasa (Hotel)",
  "Penginapan 30%",
  "Biaya Fullboard/Fullday/Halfday ()",
  "Kurs ()",
  "Riil ()",
  "Harga Fare Tiket Pergi ()",
  "Harga FareTiket Pulang ()",
  "Transport Jakarta PP",
  "Transport Daerah PP",
  "Biaya Transport ()",
  "Sewa kendaraan ()",
  "Representatif ()",
  "Taksi Bandara",
  "Biaya Reschedule ()",
  "Total",
  "Nilai Nominal di Daftar Nominatif",
  "PENGEMBALIAN",
];

export const STORAGE_KEY_REKAP = "perdin_cached_rekap_data";

/**
 * Format string helpers for tolerant matching
 */
export function normalizeStr(val: unknown): string {
  if (val === null || val === undefined) return "";
  return String(val).trim().toLowerCase().replace(/\s+/g, " ");
}

export function cleanNip(nip: unknown): string {
  return String(nip || "").replace(/\D/g, "");
}

/**
 * Buat signature unik untuk baris peserta/rekap
 */
export function getRowSignature(r: Record<string, unknown>): {
  nip: string;
  nama: string;
  kegiatan: string;
  st: string;
  tgl: string;
  batchId: string;
  idPeserta: string;
} {
  const nip = cleanNip(r["NIP"] || (r as Record<string, unknown>).nip);
  const nama = normalizeStr(
    r["NAMA PEGAWAI INTERNAL INSPEKTORAT"] ||
      r["NAMA EXTERNAL"] ||
      (r as Record<string, unknown>).nama ||
      (r as Record<string, unknown>).namaExternal ||
      ""
  );
  const kegiatan = normalizeStr(r["Nama Kegiatan"] || (r as Record<string, unknown>).namaKegiatan || "");
  const st = normalizeStr(r["No Surat Tugas"] || (r as Record<string, unknown>).nomorSt || "");
  const tgl = normalizeStr(r["Tgl Berangkat"] || (r as Record<string, unknown>).tanggalMulai || "");
  const batchId = normalizeStr(r["_spjBatchId"] || (r as Record<string, unknown>).idKegiatan || "");
  const idPeserta = normalizeStr(r["_idPeserta"] || (r as Record<string, unknown>).id || "");

  return { nip, nama, kegiatan, st, tgl, batchId, idPeserta };
}

/**
 * Cek apakah baris A dan baris B merepresentasikan peserta dan kegiatan yang sama (anti-duplikasi)
 */
export function isSameRekapRow(
  a: Record<string, unknown>,
  b: Record<string, unknown>
): boolean {
  if (a === b) return true;
  const sigA = getRowSignature(a);
  const sigB = getRowSignature(b);

  // 1. Explicit participant ID match (e.g. KEG-2609-001-A-01)
  if (sigA.idPeserta && sigB.idPeserta && sigA.idPeserta === sigB.idPeserta) {
    return true;
  }

  // 2. Batch ID match
  if (sigA.batchId && sigB.batchId && sigA.batchId === sigB.batchId) {
    if (sigA.nip && sigB.nip && sigA.nip === sigB.nip) return true;
    if (sigA.nama && sigB.nama && sigA.nama === sigB.nama) return true;
    if (!sigA.nama || !sigB.nama) return true;
  }

  // 3. Nama Kegiatan sama DAN (NIP sama ATAU Nama sama)
  const isSameKegiatan =
    sigA.kegiatan !== "" && sigB.kegiatan !== "" && sigA.kegiatan === sigB.kegiatan;
  const isSameNip = sigA.nip !== "" && sigB.nip !== "" && sigA.nip === sigB.nip;
  const isSameNama = sigA.nama !== "" && sigB.nama !== "" && sigA.nama === sigB.nama;

  if (isSameKegiatan && (isSameNip || isSameNama)) {
    return true;
  }

  // 4. No Surat Tugas sama DAN (NIP sama ATAU Nama sama)
  const isSameSt =
    sigA.st !== "" &&
    sigB.st !== "" &&
    sigA.st !== "-" &&
    sigB.st !== "-" &&
    sigA.st === sigB.st;

  if (isSameSt && (isSameNip || isSameNama)) {
    return true;
  }

  // 5. Tanggal Berangkat sama DAN (NIP sama ATAU Nama sama) DAN (Kegiatan sama ATAU ST sama)
  const isSameTgl = sigA.tgl !== "" && sigB.tgl !== "" && sigA.tgl === sigB.tgl;
  if (isSameTgl && (isSameNip || isSameNama) && (isSameKegiatan || isSameSt)) {
    return true;
  }

  // 6. Jika NIP sama & Tanggal sama & Nama sama
  if (sigA.nip && sigB.nip && sigA.nip === sigB.nip && isSameNama && isSameTgl) {
    return true;
  }

  return false;
}

/**
 * Deduplikasi array baris rekap
 */
export function deduplicateRekapRows(
  rows: Array<Record<string, unknown>>
): Array<Record<string, unknown>> {
  const result: Array<Record<string, unknown>> = [];
  rows.forEach((row) => {
    const nama = String(row["NAMA PEGAWAI INTERNAL INSPEKTORAT"] || row["NAMA EXTERNAL"] || "").trim();
    const keg = String(row["Nama Kegiatan"] || "").trim();
    if (!nama && !keg) return; // skip empty ghost rows

    const isDuplicate = result.some((existing) => isSameRekapRow(existing, row));
    if (!isDuplicate) {
      result.push(row);
    }
  });
  return result;
}

/**
 * Format a single participant row into the official 48-column SPJ object
 */
export function formatRowTo48Columns(
  header: HeaderData,
  r: ParticipantRow,
  batchId?: string,
  rowIndex: number = 1
): Record<string, unknown> {
  const noTiket =
    r.tiketDetailPergi?.noTiket || r.tiketDetailPulang?.noTiket
      ? `Berangkat : ${r.tiketDetailPergi?.noTiket || "-"}\nPulang : ${r.tiketDetailPulang?.noTiket || "-"}`
      : "";

  const maskapai =
    r.tiketDetailPergi?.maskapai || r.tiketDetailPulang?.maskapai
      ? `Berangkat : ${r.tiketDetailPergi?.maskapai || "-"}\nPulang : ${r.tiketDetailPulang?.maskapai || "-"}`
      : "";

  const kodeBooking =
    r.tiketDetailPergi?.kodeBooking || r.tiketDetailPulang?.kodeBooking
      ? `Berangkat : ${r.tiketDetailPergi?.kodeBooking || "-"}\nPulang : ${r.tiketDetailPulang?.kodeBooking || "-"}`
      : "";

  const farePergi =
    r.tiketDetailPergi?.harga !== undefined
      ? r.tiketDetailPergi.harga
      : r.tiket ? Math.round(r.tiket / 2) : 0;

  const farePulang =
    r.tiketDetailPulang?.harga !== undefined
      ? r.tiketDetailPulang.harga
      : r.tiket ? Math.round(r.tiket / 2) : 0;

  const biayaTransport =
    (r.transportasiDarat || 0) + (r.transportasiLokal || 0) + (r.dukunganTransportasi || 0);

  const biayaMeeting = (r.fulldayMeeting || 0) + (r.fullboardMeeting || 0);
  const uhMeeting = (r.biayaUhHalfday || 0) + (r.biayaUhFullboard || 0);

  return {
    // Internal metadata for update tracking
    _spjBatchId: batchId || "",
    _spjRowId: r.id,
    _idPeserta: batchId ? `${batchId}-${String(rowIndex).padStart(2, "0")}` : r.id,

    // 48 Column Standard SPJ Fields
    "No SPBY": header.noSpby || "",
    "JENIS PENGAJUAN": header.jenisPengajuan || "RAMPUNG",
    "No SPM": header.noSpm || "",
    "": "",
    "NAMA PEGAWAI INTERNAL INSPEKTORAT": r.namaExternal ? "" : r.nama,
    "NAMA EXTERNAL": r.namaExternal || "",
    NIP: r.nip || "",
    Gol: r.golongan || "",
    Jabatan: r.jabatan || "",
    "Jenis Perdin": header.jenisPerdin || "Perdin Luar Kota",
    "Status Pegawai": r.nip ? "PNS" : "Non-PNS",
    "Nama Kegiatan": header.keteranganKegiatan || "",
    "No Surat Tugas": r.nomorSt || header.nomorStStaff || header.nomorStMaster || "",
    "Unit Kerja": header.unitKerja || "INSPEKTORAT",
    Angkutan: header.alatAngkut || "Angkutan Darat",
    "Berangkat dari-": header.berangkatDari || "Jakarta",
    "Tujuan ke-": r.tujuanKota || header.provinsiTujuan || "",
    "Tgl Berangkat": r.tanggalMulai || "",
    "Tgl Kembali": r.tanggalSelesai || "",
    "Nomor Tiket": noTiket,
    "Nama Maskapai": maskapai,
    "Kode Booking": kodeBooking,
    "Boarding Pass (Ada/Tidak)": r.boardingPass || (r.tiket > 0 ? "ADA" : ""),
    "Nama Penginapan": r.namaHotel || "",
    "Tanggal Check In": r.checkInHotel || (r.hotel > 0 ? r.tanggalMulai : ""),
    "Tanggal Check Out": r.checkOutHotel || (r.hotel > 0 ? r.tanggalSelesai : ""),
    "Jumlah Hari Menginap": r.malamHotel || (r.hotel > 0 ? 1 : 0),
    "Lama Hari 100%": r.hariUhBiasa !== undefined ? r.hariUhBiasa : r.lamaHari || 1,
    "Lama Hari 40%": r.hariUhBiasa40 || r.hariUhBiasa60 || 0,
    "Total Hari": r.lamaHari || 1,
    "UH 100% ()": r.biayaUhBiasa || 0,
    "UH 40% ()": r.biayaUhBiasa40 || r.biayaUhBiasa60 || 0,
    "UH Fullboard/Fullday/Halfday/Diklat": uhMeeting || 0,
    "Biaya Penginapan Biasa (Hotel)": r.hotel || 0,
    "Penginapan 30%": r.penginapan30 || 0,
    "Biaya Fullboard/Fullday/Halfday ()": biayaMeeting || 0,
    "Kurs ()": r.kurs || 0,
    "Riil ()": r.pengRill || 0,
    "Harga Fare Tiket Pergi ()": farePergi,
    "Harga FareTiket Pulang ()": farePulang,
    "Transport Jakarta PP": r.transportJakartaPp || 0,
    "Transport Daerah PP": r.transportDaerahPp || 0,
    "Biaya Transport ()": biayaTransport,
    "Sewa kendaraan ()": r.sewaKendaraan || 0,
    "Representatif ()": r.representatif || 0,
    "Taksi Bandara": r.taksiBandara || 0,
    "Biaya Reschedule ()": r.biayaReschedule || 0,
    Total: r.totalJumlah || 0,
    "Nilai Nominal di Daftar Nominatif": r.totalJumlah || 0,
    PENGEMBALIAN: r.pengembalian || 0,
  };
}

/**
 * Format an array of participant rows into the 48-column objects
 */
export function formatRowsTo48Columns(
  header: HeaderData,
  rows: ParticipantRow[],
  batchId?: string
): Array<Record<string, unknown>> {
  return rows
    .filter((r) => Boolean((r.nama && r.nama.trim() !== "") || (r.namaExternal && r.namaExternal.trim() !== "")))
    .map((r, idx) => formatRowTo48Columns(header, r, batchId, idx + 1));
}

/**
 * Reconstruct all 48-column rekap rows directly from all saved activities
 */
export function buildRekapFromSavedKegiatanList(): Array<Record<string, unknown>> {
  if (typeof window === "undefined") return [];
  const savedActivities = getSavedKegiatanList();
  const allRows: Array<Record<string, unknown>> = [];
  const seenBatchIds = new Set<string>();

  savedActivities.forEach((keg) => {
    if (!keg.idKegiatan || seenBatchIds.has(keg.idKegiatan)) return;
    seenBatchIds.add(keg.idKegiatan);
    if (keg.header && Array.isArray(keg.rows) && keg.rows.length > 0) {
      const rows = formatRowsTo48Columns(keg.header, keg.rows, keg.idKegiatan);
      allRows.push(...rows);
    }
  });

  return allRows;
}

/**
 * Get comprehensive Rekap Perdin data by merging saved activities with cached standalone entries
 */
export function getCompleteRekapData(): Array<Record<string, unknown>> {
  if (typeof window === "undefined") return [];

  const fromSavedKegiatan = buildRekapFromSavedKegiatanList();
  const cachedStr = localStorage.getItem(STORAGE_KEY_REKAP);
  let cachedRows: Array<Record<string, unknown>> = [];

  if (cachedStr) {
    try {
      const parsed = JSON.parse(cachedStr);
      if (Array.isArray(parsed)) cachedRows = parsed;
    } catch {
      cachedRows = [];
    }
  }

  if (fromSavedKegiatan.length === 0) {
    return deduplicateRekapRows(cachedRows);
  }

  // Filter standalone rows: exclude any cached row that matches any saved kegiatan participant
  const standaloneRows = cachedRows.filter((cr) => {
    const isMatched = fromSavedKegiatan.some((fr) => isSameRekapRow(cr, fr));
    return !isMatched;
  });

  const dedupedStandalone = deduplicateRekapRows(standaloneRows);
  return [...fromSavedKegiatan, ...dedupedStandalone];
}

/**
 * Save or update the current SPJ rows into the Rekap Perdin local cache
 */
export function saveOrUpdateRekapLocal(
  header: HeaderData,
  rows: ParticipantRow[],
  batchId: string,
  oldBatchId?: string
): { updatedRekap: Array<Record<string, unknown>>; isUpdate: boolean; batchId: string } {
  if (typeof window === "undefined") {
    return { updatedRekap: [], isUpdate: false, batchId };
  }

  // Generate 48-column rows for current SPJ
  const newFormattedRows = formatRowsTo48Columns(header, rows, batchId);

  // Read current cached rekap
  const cachedStr = localStorage.getItem(STORAGE_KEY_REKAP);
  let existingList: Array<Record<string, unknown>> = [];
  if (cachedStr) {
    try {
      const parsed = JSON.parse(cachedStr);
      if (Array.isArray(parsed)) existingList = parsed;
    } catch {
      existingList = [];
    }
  }

  if (existingList.length === 0) {
    existingList = buildRekapFromSavedKegiatanList();
  }

  const stMaster = (header.nomorStStaff || header.nomorStMaster || "").trim();
  const keg = (header.keteranganKegiatan || "").trim();

  let firstMatchIndex = -1;
  const filteredList: Array<Record<string, unknown>> = [];

  existingList.forEach((item, idx) => {
    const itemBatch = String(item._spjBatchId || "").trim();
    const isMatchingBatch =
      (itemBatch !== "" && itemBatch === batchId) ||
      (oldBatchId && itemBatch !== "" && itemBatch === oldBatchId);

    const isMatchingStKeg =
      itemBatch === "" &&
      stMaster !== "" &&
      keg !== "" &&
      String(item["No Surat Tugas"] || "").trim() === stMaster &&
      String(item["Nama Kegiatan"] || "").trim() === keg;

    const isMatchingAnyParticipant =
      itemBatch === "" &&
      newFormattedRows.some((newRow) => isSameRekapRow(item, newRow));

    if (isMatchingBatch || isMatchingStKeg || isMatchingAnyParticipant) {
      if (firstMatchIndex === -1) firstMatchIndex = idx;
    } else {
      filteredList.push(item);
    }
  });

  const isUpdate = firstMatchIndex !== -1;
  let updatedRekap: Array<Record<string, unknown>>;

  if (isUpdate) {
    const insertIdx = Math.min(firstMatchIndex, filteredList.length);
    updatedRekap = [
      ...filteredList.slice(0, insertIdx),
      ...newFormattedRows,
      ...filteredList.slice(insertIdx),
    ];
  } else {
    // Brand new save: prepend to the top of Rekap Perdin
    updatedRekap = [...newFormattedRows, ...filteredList];
  }

  const finalDeduped = deduplicateRekapRows(updatedRekap);

  try {
    localStorage.setItem(STORAGE_KEY_REKAP, JSON.stringify(finalDeduped));
    window.dispatchEvent(
      new CustomEvent("rekap-perdin-updated", {
        detail: { updatedRekap: finalDeduped, batchId, isUpdate },
      })
    );
  } catch (err) {
    console.error("Failed to save to localStorage:", err);
  }

  return { updatedRekap: finalDeduped, isUpdate, batchId };
}

