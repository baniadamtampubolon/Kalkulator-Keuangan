import { HeaderData, ParticipantRow, Pegawai, SbmRate, NomorMemo } from "./types";

export interface GasApiResponse<T = unknown> {
  status: "success" | "error";
  message?: string;
  data?: T;
  idKegiatan?: string;
}

export interface MasterSyncData {
  pegawai?: Pegawai[];
  sbm?: SbmRate[];
  memo?: NomorMemo[];
}

const STORAGE_KEY_URL = "perdin_gas_api_url";
const STORAGE_KEY_MASTER_CACHE = "perdin_cached_master_data";

export function getGasApiUrl(): string {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(STORAGE_KEY_URL);
    if (saved && saved.trim() !== "") return saved.trim();
  }
  return process.env.NEXT_PUBLIC_GAS_API_URL || "";
}

export function setGasApiUrl(url: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_URL, url.trim());
  }
}

/**
 * Uji koneksi ke endpoint Google Apps Script Web App
 */
export async function testGasConnection(customUrl?: string): Promise<{ success: boolean; message: string }> {
  const url = customUrl || getGasApiUrl();
  if (!url) {
    return { success: false, message: "URL Web App Google Apps Script belum diisi." };
  }

  try {
    const fetchUrl = url.includes("?") ? `${url}&action=GET_MASTERS` : `${url}?action=GET_MASTERS`;
    const res = await fetch(fetchUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      return { success: false, message: `HTTP Error ${res.status}: ${res.statusText}` };
    }

    const json: GasApiResponse<MasterSyncData> = await res.json();
    if (json.status === "success") {
      return {
        success: true,
        message: "Berhasil terhubung ke Google Spreadsheet! Tab master data terdeteksi.",
      };
    } else {
      return { success: false, message: json.message || "Gagal membaca response dari spreadsheet." };
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `Gagal menghubungi API: ${errMsg}. Pastikan Web App di-deploy dengan akses 'Anyone'.`,
    };
  }
}

/**
 * Tarik Master Data (Pegawai, SBM, Memo) dari Google Spreadsheet
 */
export async function fetchMasterDataFromSheet(
  customUrl?: string
): Promise<{ success: boolean; data?: MasterSyncData; message?: string }> {
  const url = customUrl || getGasApiUrl();
  if (!url) {
    return { success: false, message: "URL Web App belum dikonfigurasi." };
  }

  try {
    const fetchUrl = url.includes("?") ? `${url}&action=GET_MASTERS` : `${url}?action=GET_MASTERS`;
    const res = await fetch(fetchUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    const json: GasApiResponse<MasterSyncData> = await res.json();
    if (json.status === "success" && json.data) {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY_MASTER_CACHE, JSON.stringify(json.data));
      }
      return { success: true, data: json.data, message: "Data master berhasil disinkronkan." };
    } else {
      return { success: false, message: json.message || "Data master tidak valid." };
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Gagal sinkronisasi: ${errMsg}` };
  }
}

/**
 * Simpan Transaksi Perjalanan Dinas & Rekap 48 Kolom ke Google Spreadsheet
 */
export async function savePerdinToGoogleSheet(
  header: HeaderData,
  participants: ParticipantRow[],
  customUrl?: string
): Promise<{ success: boolean; message: string; idKegiatan?: string }> {
  const url = customUrl || getGasApiUrl();

  const idKegiatan =
    header.nomorKomp && header.nomorMak
      ? `KGT-${header.nomorKomp}-${header.nomorMak}`
      : `KGT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;

  const grandTotal = participants.reduce((sum, p) => sum + (p.totalJumlah || 0), 0);

  const payload = {
    action: "SAVE_PERDIN",
    header: {
      idKegiatan,
      kodeKegiatan: header.nomorKomp || "PRD-" + Date.now(),
      namaKegiatan: header.keteranganKegiatan || "Perjalanan Dinas Inspektorat",
      jenisPengajuan: header.jenisPengajuan || "RAMPUNG",
      noSpm: header.noSpm || "",
      noSpby: header.noSpby || "",
      jenisPerdin: header.jenisPerdin || "Perdin Luar Kota",
      berangkatDari: header.berangkatDari || "Jakarta",
      provinsiTujuan: header.provinsiTujuan || "JAWA BARAT",
      kotaTujuanList: header.kotaTujuanList || [],
      tanggalMulai: participants[0]?.tanggalMulai || header.tanggalSpd,
      tanggalSelesai: participants[0]?.tanggalSelesai || header.tanggalSpd,
      alatAngkut: header.alatAngkut || "Angkutan Darat",
      nomorStMaster: header.nomorStMaster || "",
      nomorStStaff: header.nomorStStaff || header.nomorStMaster || "",
      nomorStPejabat: header.nomorStPejabat || header.nomorStMaster || "",
      useDifferentStPejabat: header.useDifferentStPejabat || false,
      nomorMemo: header.nomorMemo || "",
      tanggalMemo: header.tanggalMemo || "",
      tanggalSpd: header.tanggalSpd || "",
      kodeMak: header.nomorMak || "524111",
      kodeKomponen: header.nomorKomp || "051",
      itemDetail: header.itemDetail || "001",
      unitKerja: header.unitKerja || "INSPEKTORAT",
      ppkNama: header.ppkNama || "",
      ppkNip: header.ppkNip || "",
      ppkJabatan: header.ppkJabatan || "",
      bendaharaNama: header.bendahara || "",
      verifikatorNama: header.petugasVerifikasi || "",
      grandTotal,
      statusDokumen: "FINAL",
    },
    participants: participants.map((p) => ({
      pegawaiId: p.kodeNama || "",
      nomorSpd: p.nomorSpd || "01",
      nomorStAssigned: p.nomorSt || header.nomorStMaster || "",
      isPejabat: p.isPejabat || false,
      nama: p.nama,
      nip: p.nip,
      golongan: p.golongan,
      jabatan: p.jabatan,
      tujuanKota: p.tujuanKota || header.provinsiTujuan,
      tanggalMulai: p.tanggalMulai,
      tanggalSelesai: p.tanggalSelesai,
      lamaHari: p.lamaHari,
      hariUhBiasa: p.hariUhBiasa || 0,
      biayaUhBiasa: p.biayaUhBiasa || 0,
      hariUh60: p.hariUhBiasa60 || 0,
      biayaUh60: p.biayaUhBiasa60 || 0,
      hariUhHalfday: p.hariUhHalfday || 0,
      biayaUhHalfday: p.biayaUhHalfday || 0,
      hariUhFullboard: p.hariUhFullboard || 0,
      biayaUhFullboard: p.biayaUhFullboard || 0,
      biayaTiket: p.tiket || 0,
      biayaHotel: p.hotel || 0,
      biayaPenginapan30: p.penginapan30 || 0,
      biayaTransDarat: p.transportasiDarat || 0,
      biayaTransLokal: p.transportasiLokal || 0,
      biayaTransJakartaPp: p.transportJakartaPp || 0,
      biayaTransDaerahPp: p.transportDaerahPp || 0,
      biayaRiil: p.pengRill || 0,
      biayaMeeting: (p.fulldayMeeting || 0) + (p.fullboardMeeting || 0),
      biayaRepresentatif: p.representatif || 0,
      totalBiaya: p.totalJumlah || 0,
      ticketDetail: {
        boardingPassStatus: p.boardingPass || (p.tiket > 0 ? "ADA" : ""),
        pergiNoTiket: p.tiketDetailPergi?.noTiket || "",
        pergiKodeBooking: p.tiketDetailPergi?.kodeBooking || "",
        pergiMaskapai: p.tiketDetailPergi?.maskapai || "",
        pergiHargaFare: p.tiketDetailPergi?.harga || 0,
        pulangNoTiket: p.tiketDetailPulang?.noTiket || "",
        pulangKodeBooking: p.tiketDetailPulang?.kodeBooking || "",
        pulangMaskapai: p.tiketDetailPulang?.maskapai || "",
        pulangHargaFare: p.tiketDetailPulang?.harga || 0,
      },
      hotelDetail: {
        namaHotel: p.namaHotel || "",
        tanggalCheckin: p.checkInHotel || p.tanggalMulai,
        tanggalCheckout: p.checkOutHotel || p.tanggalSelesai,
        jumlahMalam: p.malamHotel || 1,
        noBillFolio: p.noBillFolio || "",
        noKamar: p.noKamar || "",
        ratePerMalam: p.rateHotel || 0,
      },
      riilItems: p.riilItems || [],
      spjExtra: {
        namaExternal: p.namaExternal || "",
        sewaKendaraan: p.sewaKendaraan || 0,
        taksiBandara: p.taksiBandara || 0,
        biayaReschedule: p.biayaReschedule || 0,
        kursValuta: p.kurs || 0,
        pengembalianKas: p.pengembalian || 0,
      },
    })),
  };

  // Cadangan offline di browser
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(`draft_perdin_${idKegiatan}`, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }

  if (!url) {
    return {
      success: true,
      message: "Data disimpan di memori lokal browser (URL Google Apps Script belum diset).",
      idKegiatan,
    };
  }

  try {
    // Mode text/plain agar menghindari preflight CORS issue pada Google Apps Script
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return { success: false, message: `HTTP Error ${res.status}: ${res.statusText}` };
    }

    const json: GasApiResponse = await res.json();
    if (json.status === "success") {
      return {
        success: true,
        message: json.message || "Data transaksi dan 48 kolom rekap berhasil disimpan ke Google Spreadsheet.",
        idKegiatan,
      };
    } else {
      return { success: false, message: json.message || "Terjadi kesalahan saat menyimpan ke spreadsheet." };
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `Gagal mengirim ke Google Sheets: ${errMsg}. Periksa izin deploy Web App (Who has access: Anyone).`,
    };
  }
}
