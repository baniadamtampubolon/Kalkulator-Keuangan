import { HeaderData, ParticipantRow } from "./types";

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
 * Format a single participant row into the official 48-column SPJ object
 */
export function formatRowTo48Columns(
  header: HeaderData,
  r: ParticipantRow,
  batchId?: string
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
    "Lama Hari 40%": r.hariUhBiasa60 || 0,
    "Total Hari": r.lamaHari || 1,
    "UH 100% ()": r.biayaUhBiasa || 0,
    "UH 40% ()": r.biayaUhBiasa60 || 0,
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
    .map((r) => formatRowTo48Columns(header, r, batchId));
}

/**
 * Save or update the current SPJ rows into the Rekap Perdin local cache
 */
export function saveOrUpdateRekapLocal(
  header: HeaderData,
  rows: ParticipantRow[],
  batchId: string
): { updatedRekap: Array<Record<string, unknown>>; isUpdate: boolean; batchId: string } {
  if (typeof window === "undefined") {
    return { updatedRekap: [], isUpdate: false, batchId };
  }

  const cachedStr = localStorage.getItem(STORAGE_KEY_REKAP);
  let existingList: Array<Record<string, unknown>> = [];
  if (cachedStr) {
    try {
      existingList = JSON.parse(cachedStr);
      if (!Array.isArray(existingList)) existingList = [];
    } catch {
      existingList = [];
    }
  }

  // Generate 48-column rows for current SPJ
  const newFormattedRows = formatRowsTo48Columns(header, rows, batchId);

  // Check if rows with this batchId already exist
  const existingBatchIndices: number[] = [];
  existingList.forEach((item, idx) => {
    if (item._spjBatchId === batchId) {
      existingBatchIndices.push(idx);
    }
  });

  let isUpdate = false;
  let updatedRekap: Array<Record<string, unknown>> = [];

  if (existingBatchIndices.length > 0) {
    // UPDATE existing saved batch in-place
    isUpdate = true;
    const firstIdx = existingBatchIndices[0];
    const withoutOld = existingList.filter((item) => item._spjBatchId !== batchId);
    updatedRekap = [
      ...withoutOld.slice(0, firstIdx),
      ...newFormattedRows,
      ...withoutOld.slice(firstIdx),
    ];
  } else {
    // Fallback: check matching No Surat Tugas & Nama Kegiatan if batchId wasn't previously assigned
    const stMaster = header.nomorStStaff || header.nomorStMaster || "";
    const keg = header.keteranganKegiatan || "";
    const matchingIndices: number[] = [];
    if (stMaster && keg) {
      existingList.forEach((item, idx) => {
        if (item["No Surat Tugas"] === stMaster && item["Nama Kegiatan"] === keg) {
          matchingIndices.push(idx);
        }
      });
    }

    if (matchingIndices.length > 0) {
      isUpdate = true;
      const firstIdx = matchingIndices[0];
      const withoutOld = existingList.filter(
        (item) => !(item["No Surat Tugas"] === stMaster && item["Nama Kegiatan"] === keg)
      );
      updatedRekap = [
        ...withoutOld.slice(0, firstIdx),
        ...newFormattedRows,
        ...withoutOld.slice(firstIdx),
      ];
    } else {
      // Brand new save: prepend to the top of Rekap Perdin so user sees it right away
      updatedRekap = [...newFormattedRows, ...existingList];
    }
  }

  try {
    localStorage.setItem(STORAGE_KEY_REKAP, JSON.stringify(updatedRekap));
    window.dispatchEvent(
      new CustomEvent("rekap-perdin-updated", {
        detail: { updatedRekap, batchId, isUpdate },
      })
    );
  } catch (err) {
    console.error("Failed to save to localStorage:", err);
  }

  return { updatedRekap, isUpdate, batchId };
}
