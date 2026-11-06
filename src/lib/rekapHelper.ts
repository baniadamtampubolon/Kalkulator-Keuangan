import { HeaderData, ParticipantRow, SpjDocType } from "./types";
import { getSavedKegiatanList } from "./kegiatanHelper";
import { calculatePengadaanTotals, getDefaultPengadaanItems, getDefaultPengadaanTax, getSpjTypeMeta } from "./pengadaanHelper";

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

export const STANDARD_REKAP_PENGADAAN_HEADERS = [
  "id_kegiatan",
  "Jenis SPJ",
  "Tanggal Kegiatan",
  "Nomor Memo",
  "Tanggal Memo",
  "Perihal Memo",
  "Nama Kegiatan / Uraian Pembayaran",
  "No SPBY",
  "No SPM",
  "Kode Komponen",
  "Detail Komponen",
  "Kode MAK",
  "Item Detail",
  "No Item",
  "Uraian Rincian Item",
  "Volume",
  "Satuan",
  "Harga Satuan",
  "Jumlah Bruto Item",
  "Sub Total Bruto Paket (Nilai Kuitansi)",
  "Jenis PPN",
  "Nilai PPN",
  "DPP (Dasar Pengenaan Pajak)",
  "Jenis PPh",
  "Nilai PPh",
  "Jumlah Bersih Diterima (Netto)",
  "Nama Penerima / Vendor",
  "NIP Penerima",
  "Jabatan Penerima",
  "Rekening Transfer",
  "Status NPWP",
  "Nama Penanggung Jawab (Memo)",
  "NIP Penanggung Jawab",
  "Jabatan Penanggung Jawab",
  "PPK Nama",
  "PPK NIP",
  "Bendahara",
  "Verifikator",
  "Updated At",
];

export interface RekapCategoryMeta {
  spjType: SpjDocType;
  label: string;
  shortLabel: string;
  sheetName: string;
  description: string;
}

export const REKAP_CATEGORY_LIST: RekapCategoryMeta[] = [
  {
    spjType: "PERDIN",
    label: "Rekap SPJ Perjalanan Dinas",
    shortLabel: "Rekap Perdin",
    sheetName: "REKAP_PERDIN_48KOLOM",
    description: "Tabel 48 kolom pertanggungjawaban perjalanan dinas",
  },
  {
    spjType: "KONSUMSI",
    label: "Rekap SPJ Konsumsi",
    shortLabel: "Rekap Konsumsi",
    sheetName: "REKAP_SPJ_KONSUMSI",
    description: "Tabel rekapitulasi kuitansi, memorandum & pajak konsumsi rapat",
  },
  {
    spjType: "SEWA",
    label: "Rekap SPJ Sewa Kendaraan",
    shortLabel: "Rekap Sewa Kendaraan",
    sheetName: "REKAP_SPJ_SEWA_KENDARAAN",
    description: "Tabel rekapitulasi sewa kendaraan operasional & PPh 23",
  },
  {
    spjType: "DIKLAT",
    label: "Rekap SPJ Narsum",
    shortLabel: "Rekap Narsum",
    sheetName: "REKAP_SPJ_NARSUM",
    description: "Tabel rekapitulasi honorarium narasumber & kegiatan diklat",
  },
  {
    spjType: "ATK",
    label: "Rekap SPJ ATK dan Seminar Kit",
    shortLabel: "Rekap ATK & Semkit",
    sheetName: "REKAP_SPJ_ATK_SEMKIT",
    description: "Tabel rekapitulasi pengadaan ATK, seminar kit & PPh 22",
  },
];

export function getRekapCategoryMeta(spjType?: SpjDocType): RekapCategoryMeta {
  return REKAP_CATEGORY_LIST.find((c) => c.spjType === spjType) || REKAP_CATEGORY_LIST[0];
}

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
  memo: string;
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
  const batchId = normalizeStr(
    r["_spjBatchId"] ||
      r["id_kegiatan"] ||
      r["ID Kegiatan"] ||
      r["idKegiatan"] ||
      (r as Record<string, unknown>).idKegiatan ||
      ""
  );
  const idPeserta = normalizeStr(
    r["_idPeserta"] ||
      r["id_peserta"] ||
      r["ID Peserta"] ||
      (r as Record<string, unknown>).id ||
      ""
  );
  const memo = normalizeStr(
    r["nomor_memo"] ||
      r["Nomor Memo"] ||
      r["No Memo"] ||
      r["nomorMemo"] ||
      (r as Record<string, unknown>).nomorMemo ||
      ""
  );

  return { nip, nama, kegiatan, st, tgl, batchId, idPeserta, memo };
}

/**
 * Cek apakah baris A dan baris B merepresentasikan peserta dan kegiatan yang sama (anti-duplikasi)
 * Menggunakan ID Kegiatan dan Nomor Memorandum sebagai Primary Key utama
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

  const isSameNip = sigA.nip !== "" && sigB.nip !== "" && sigA.nip === sigB.nip;
  const isSameNama = sigA.nama !== "" && sigB.nama !== "" && sigA.nama === sigB.nama;
  const isSamePerson = isSameNip || isSameNama;

  // 2. PRIMARY KEY 1: ID Kegiatan (batchId) match + Person
  // Jika ID Kegiatan sama dan peserta sama -> baris yang sama, meskipun judul kegiatan diedit!
  if (sigA.batchId && sigB.batchId && sigA.batchId === sigB.batchId) {
    if (isSamePerson) return true;
    if (!sigA.nama || !sigB.nama) return true;
  }

  // 3. PRIMARY KEY 2: Nomor Memorandum (memo) match + Person
  // Jika Nomor Memorandum sama dan peserta sama -> baris yang sama, meskipun judul kegiatan diedit!
  if (sigA.memo && sigB.memo && sigA.memo === sigB.memo) {
    if (isSamePerson) return true;
    if (!sigA.nama || !sigB.nama) return true;
  }

  // 4. Nama Kegiatan sama DAN (NIP sama ATAU Nama sama)
  const isSameKegiatan =
    sigA.kegiatan !== "" && sigB.kegiatan !== "" && sigA.kegiatan === sigB.kegiatan;
  if (isSameKegiatan && isSamePerson) {
    return true;
  }

  // 5. No Surat Tugas sama DAN (NIP sama ATAU Nama sama)
  const isSameSt =
    sigA.st !== "" &&
    sigB.st !== "" &&
    sigA.st !== "-" &&
    sigB.st !== "-" &&
    sigA.st === sigB.st;
  if (isSameSt && isSamePerson) {
    return true;
  }

  // 6. Tanggal Berangkat sama DAN (NIP sama ATAU Nama sama) DAN (Kegiatan sama ATAU ST sama)
  const isSameTgl = sigA.tgl !== "" && sigB.tgl !== "" && sigA.tgl === sigB.tgl;
  if (isSameTgl && isSamePerson && (isSameKegiatan || isSameSt)) {
    return true;
  }

  // 7. Jika NIP sama & Tanggal sama & Nama sama
  if (isSameNip && isSameNama && isSameTgl) {
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
  const pergiLegs = r.tiketPergiList && r.tiketPergiList.length > 0 ? r.tiketPergiList : (r.tiketDetailPergi ? [r.tiketDetailPergi] : []);
  const pulangLegs = r.tiketPulangList && r.tiketPulangList.length > 0 ? r.tiketPulangList : (r.tiketDetailPulang ? [r.tiketDetailPulang] : []);

  const noTiket = (() => {
    const pStr = pergiLegs.map((t) => t.noTiket).filter(Boolean).join(" / ");
    const rStr = pulangLegs.map((t) => t.noTiket).filter(Boolean).join(" / ");
    if (pStr || rStr) {
      return `Berangkat : ${pStr || "-"}\nPulang : ${rStr || "-"}`;
    }
    return "";
  })();

  const maskapai = (() => {
    const pStr = pergiLegs.map((t) => t.maskapai).filter(Boolean).join(" + ");
    const rStr = pulangLegs.map((t) => t.maskapai).filter(Boolean).join(" + ");
    if (pStr || rStr) {
      return `Berangkat : ${pStr || "-"}\nPulang : ${rStr || "-"}`;
    }
    return "";
  })();

  const kodeBooking = (() => {
    const pStr = pergiLegs.map((t) => t.kodeBooking).filter(Boolean).join(" / ");
    const rStr = pulangLegs.map((t) => t.kodeBooking).filter(Boolean).join(" / ");
    if (pStr || rStr) {
      return `Berangkat : ${pStr || "-"}\nPulang : ${rStr || "-"}`;
    }
    return "";
  })();

  const farePergi = pergiLegs.length > 0
    ? pergiLegs.reduce((acc, t) => acc + (Number(t.harga) || 0), 0)
    : (r.tiket ? Math.round(r.tiket / 2) : 0);

  const farePulang = pulangLegs.length > 0
    ? pulangLegs.reduce((acc, t) => acc + (Number(t.harga) || 0), 0)
    : (r.tiket ? Math.round(r.tiket / 2) : 0);

  const biayaTransport =
    (r.transportasiDarat || 0) + (r.transportasiLokal || 0) + (r.dukunganTransportasi || 0);

  const biayaMeeting = (r.fulldayMeeting || 0) + (r.fullboardMeeting || 0);
  const uhMeeting = (r.biayaUhHalfday || 0) + (r.biayaUhFullboard || 0);

  return {
    // Internal metadata for update tracking & primary keys
    _spjBatchId: batchId || header.idKegiatan || "",
    _spjRowId: r.id,
    _idPeserta: (batchId || header.idKegiatan) ? `${batchId || header.idKegiatan}-${String(rowIndex).padStart(2, "0")}` : r.id,
    id_kegiatan: batchId || header.idKegiatan || "",
    idKegiatan: batchId || header.idKegiatan || "",
    "ID Kegiatan": batchId || header.idKegiatan || "",
    nomor_memo: header.nomorMemo || "",
    nomorMemo: header.nomorMemo || "",
    "Nomor Memo": header.nomorMemo || "",

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
    if (keg.header?.spjType && keg.header.spjType !== "PERDIN") return;
    seenBatchIds.add(keg.idKegiatan);
    if (keg.header && Array.isArray(keg.rows) && keg.rows.length > 0) {
      const rows = formatRowsTo48Columns(
        {
          ...keg.header,
          idKegiatan: keg.idKegiatan,
          keteranganKegiatan: keg.namaKegiatan || keg.header.keteranganKegiatan,
        },
        keg.rows,
        keg.idKegiatan
      );
      allRows.push(...rows);
    }
  });

  return allRows;
}

/**
 * Reconstruct rekap rows for one of the 4 Pengadaan SPJ types (KONSUMSI, SEWA, DIKLAT/NARSUM, ATK) from local saved activities
 */
export function buildRekapPengadaanFromSavedKegiatanList(
  spjType: SpjDocType
): Array<Record<string, unknown>> {
  if (typeof window === "undefined" || spjType === "PERDIN") return [];
  const savedActivities = getSavedKegiatanList();
  const meta = getSpjTypeMeta(spjType);
  const allRows: Array<Record<string, unknown>> = [];
  const seenBatchIds = new Set<string>();

  savedActivities.forEach((keg) => {
    if (!keg.idKegiatan || seenBatchIds.has(keg.idKegiatan)) return;
    const kegType = keg.header?.spjType || "PERDIN";
    if (kegType !== spjType) return;
    seenBatchIds.add(keg.idKegiatan);

    const h = keg.header;
    const items =
      h.pengadaanItems && h.pengadaanItems.length > 0
        ? h.pengadaanItems
        : getDefaultPengadaanItems(spjType);
    const tax =
      h.pengadaanTax ||
      getDefaultPengadaanTax(
        spjType,
        h.penanggungJawabNama || "Reni Sutaryo, S.Si., M.Adm.Pemb",
        h.penanggungJawabNip || "19791126200604 2 014"
      );
    const calc = calculatePengadaanTotals(items, tax);
    const itemDetailFull =
      (h.itemDetail || "001") + (h.keteranganItemDetail ? ` - ${h.keteranganItemDetail}` : "");

    items.forEach((it, idx) => {
      const vol = Number(it.jumlah) || 0;
      const harga = Number(it.hargaSatuan) || 0;
      const brutoItem = vol * harga;
      const ppnLabel =
        tax.ppnMode === "INCLUDE_11_111"
          ? "PPN 11/111 (Include)"
          : tax.ppnMode === "MANUAL"
          ? "PPN Manual"
          : "Tanpa PPN";

      allRows.push({
        id_kegiatan: keg.idKegiatan,
        "Jenis SPJ": meta.label,
        "Tanggal Kegiatan": keg.tanggalSpd || h.tanggalSpd || "",
        "Nomor Memo": h.nomorMemo || "",
        "Tanggal Memo": h.tanggalMemo || keg.tanggalSpd || "",
        "Perihal Memo": h.keteranganMemo || meta.defaultPerihalMemo,
        "Nama Kegiatan / Uraian Pembayaran": keg.namaKegiatan || h.keteranganKegiatan || meta.defaultUraianKegiatan,
        "No SPBY": h.noSpby || "",
        "No SPM": h.noSpm || "",
        "Kode Komponen": h.nomorKomp || meta.defaultKomp,
        "Detail Komponen": h.detailKomponen || meta.defaultDetailKomp,
        "Kode MAK": h.nomorMak || meta.defaultMak,
        "Item Detail": itemDetailFull,
        "No Item": idx + 1,
        "Uraian Rincian Item": it.uraian || "",
        Volume: vol,
        Satuan: it.satuan || "Paket",
        "Harga Satuan": harga,
        "Jumlah Bruto Item": brutoItem,
        "Sub Total Bruto Paket (Nilai Kuitansi)": calc.subTotalBruto,
        "Jenis PPN": ppnLabel,
        "Nilai PPN": calc.nilaiPpn,
        "DPP (Dasar Pengenaan Pajak)": calc.dpp,
        "Jenis PPh": calc.pphLabel,
        "Nilai PPh": calc.nilaiPph,
        "Jumlah Bersih Diterima (Netto)": calc.jumlahBersih,
        "Nama Penerima / Vendor": tax.penerimaNama || h.penanggungJawabNama || "",
        "NIP Penerima": tax.penerimaNip || h.penanggungJawabNip || "",
        "Jabatan Penerima": tax.penerimaJabatan || h.penanggungJawabJabatan || "",
        "Rekening Transfer": tax.rekeningTransfer || "",
        "Status NPWP": tax.pphType === "PPH23_4" ? "Tanpa NPWP" : "Ber-NPWP",
        "Nama Penanggung Jawab (Memo)": h.penanggungJawabNama || "",
        "NIP Penanggung Jawab": h.penanggungJawabNip || "",
        "Jabatan Penanggung Jawab": h.penanggungJawabJabatan || "",
        "PPK Nama": h.ppkNama || "",
        "PPK NIP": h.ppkNip || "",
        Bendahara: h.bendahara || "",
        Verifikator: h.petugasVerifikasi || "",
        "Updated At": keg.updatedAt || "",
      });
    });
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
  oldBatchId?: string,
  oldNamaKegiatan?: string,
  oldNomorMemo?: string
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

  const curBatch = normalizeStr(batchId || header.idKegiatan || "");
  const prevBatch = normalizeStr(oldBatchId || "");
  const curMemo = normalizeStr(header.nomorMemo || "");
  const prevMemo = normalizeStr(oldNomorMemo || "");
  const curKeg = normalizeStr(header.keteranganKegiatan || "");
  const prevKeg = normalizeStr(oldNamaKegiatan || "");
  const curSt = normalizeStr(header.nomorStStaff || header.nomorStMaster || "");

  let firstMatchIndex = -1;
  const filteredList: Array<Record<string, unknown>> = [];

  existingList.forEach((item, idx) => {
    const sig = getRowSignature(item);
    const itemBatch = sig.batchId;
    const itemMemo = sig.memo;
    const itemKeg = sig.kegiatan;
    const itemSt = sig.st;

    // 1. Primary key 1: ID Kegiatan match
    const isMatchingBatch =
      (itemBatch !== "" && curBatch !== "" && itemBatch === curBatch) ||
      (itemBatch !== "" && prevBatch !== "" && itemBatch === prevBatch);

    // 2. Primary key 2: Nomor Memo match
    const isMatchingMemo =
      (itemMemo !== "" && curMemo !== "" && itemMemo === curMemo) ||
      (itemMemo !== "" && prevMemo !== "" && itemMemo === prevMemo);

    // 3. Old Activity Title match
    const isMatchingOldKeg =
      prevKeg !== "" && itemKeg !== "" && itemKeg === prevKeg;

    // 4. Current Activity Title match (with matching ST or matching participant)
    const isMatchingStKeg =
      curKeg !== "" &&
      itemKeg !== "" &&
      itemKeg === curKeg &&
      ((curSt !== "" && itemSt !== "" && itemSt === curSt) ||
        newFormattedRows.some((newRow) => isSameRekapRow(item, newRow)));

    // 5. Participant match
    const isMatchingAnyParticipant =
      newFormattedRows.some((newRow) => isSameRekapRow(item, newRow));

    if (
      isMatchingBatch ||
      isMatchingMemo ||
      isMatchingOldKeg ||
      isMatchingStKeg ||
      isMatchingAnyParticipant
    ) {
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

