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

export function getDefaultGasApiUrl(): string {
  return process.env.NEXT_PUBLIC_GAS_API_URL || "";
}

export function getGasApiUrl(): string {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(STORAGE_KEY_URL);
    if (saved && saved.trim() !== "") return saved.trim();
  }
  return getDefaultGasApiUrl();
}

export function setGasApiUrl(url: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_URL, url.trim());
  }
}

export function resetGasApiUrl(): string {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY_URL);
  }
  return getDefaultGasApiUrl();
}

export function getCachedMasterData(): MasterSyncData | null {
  if (typeof window !== "undefined") {
    const cached = localStorage.getItem(STORAGE_KEY_MASTER_CACHE);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        return null;
      }
    }
  }
  return null;
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

    const json: GasApiResponse<Record<string, unknown[]>> = await res.json();
    if (json.status === "success" && json.data) {
      const rawPegawai = (json.data.pegawai as Array<Record<string, unknown>>) || [];
      const rawSbm = (json.data.sbm as Array<Record<string, unknown>>) || [];
      const rawMemo = (json.data.memo as Array<Record<string, unknown>>) || [];

      const normalizedPegawai: Pegawai[] = rawPegawai
        .map((p, idx) => ({
          kodeNama: String(p.kodeNama || p.kode_nama || `PEG${idx + 1}`),
          no: String(p.no || p.no_urut || idx + 1),
          nama: String(p.nama || p.nama_lengkap || "").trim(),
          nip: String(p.nip || ""),
          jenisKelamin: String(p.jenisKelamin || p.jenis_kelamin || "Laki-laki"),
          pangkat: String(p.pangkat || ""),
          golongan: String(p.golongan || ""),
          jabatan: String(p.jabatan || ""),
          kelasJabatan: String(p.kelasJabatan || p.kelas_jabatan || ""),
          namaBank: String(p.namaBank || p.nama_bank || ""),
          nomorRekening: String(p.nomorRekening || p.nomor_rekening || ""),
        }))
        .filter((p) => p.nama !== "");

      const normalizedSbm: SbmRate[] = rawSbm
        .map((s, idx) => ({
          no: String(s.no || idx + 1),
          provinsi: String(s.provinsi || s.nama_provinsi || "").toUpperCase().trim(),
          uhBiasa: Number(s.uhBiasa ?? s.uh_biasa ?? 0),
          uhHalfday: Number(s.uhHalfday ?? s.uh_halfday ?? 0),
          uhFullboard: Number(s.uhFullboard ?? s.uh_fullboard ?? 0),
          hotelEselon1: Number(s.hotelEselon1 ?? s.hotel_eselon1 ?? 0),
          hotelEselon2: Number(s.hotelEselon2 ?? s.hotel_eselon2 ?? 0),
          hotelEselon3Gol4: Number(s.hotelEselon3Gol4 ?? s.hotel_eselon3_gol4 ?? 0),
          hotelEselon4Kebawah: Number(s.hotelEselon4Kebawah ?? s.hotel_eselon4_kebawah ?? 0),
        }))
        .filter((s) => s.provinsi !== "");

      const normalizedMemo: NomorMemo[] = rawMemo
        .map((m, idx) => {
          const tahunAnggaran = (m.tahun_anggaran as string | number) || (m.tahun as string | number) || 2026;
          const nomorUrut = String(m.nomor_urut || m.nomor || m["No."] || m["No"] || idx + 1).trim();
          const formatLengkap = String(
            m.format_lengkap || m["No Memo"] || m["No. Memo"] || m.noMemo || m.nomor_memo || ""
          ).trim();
          const tanggalMemo = String(m.tanggal_memo || m.Tanggal || m.tanggal || "").trim();
          const perihal = String(m.perihal || m.Perihal || "").trim();
          const idKegiatanRef = String(m.id_kegiatan_ref || m.id_kegiatan || "").trim();
          const status = String(m.status || (perihal ? "TERPAKAI" : "")).trim();
          const nominal = String(m.nominal || m.Nominal || "").trim();
          const mak = String(m.MAK || m.mak || "").trim();

          // Deteksi komponen format memo
          const headerNoMemoVal = String(m["No. Memo"] || "").trim();
          let parsedPrefix = "M.";
          let parsedNomor = nomorUrut;
          let parsedUnit = "/INS/PPK/";
          let parsedBulan = "XI";
          let parsedTahun = String(tahunAnggaran);

          const candidateStr = formatLengkap || (headerNoMemoVal.includes("/") ? headerNoMemoVal : "");
          if (candidateStr) {
            const match =
              candidateStr.match(/^([A-Za-z]+\.)?\s*(\d+)\s*(\/.*?\/)([IVXLCDM]+)\/(\d{4})/i) ||
              candidateStr.match(/^([A-Za-z]+\.)?\s*(\d+)\s*(\/[^\/]+\/)?([A-Za-z]+)?(\/\d{4})?/);
            if (match) {
              if (match[1]) parsedPrefix = match[1];
              if (match[2]) parsedNomor = match[2];
              if (match[3]) parsedUnit = match[3];
              if (match[4]) parsedBulan = match[4];
              if (match[5]) parsedTahun = match[5].replace(/\//g, "").trim();
            }
          }

          const rawNomor = String(
            m.nomor || m.nomor_urut || m["_col_2"] || m["col_2"] || (!headerNoMemoVal.includes("/") && headerNoMemoVal !== "M." ? headerNoMemoVal : "")
          ).trim();

          const finalNomor = parsedNomor || (rawNomor.match(/^\d+$/) ? rawNomor : "");
          const finalPrefix = String(m.prefix || (headerNoMemoVal === "M." ? "M." : "") || parsedPrefix || "M.");
          const finalUnit = String(m.unit || m["_col_3"] || m["col_3"] || parsedUnit || "/INS/PPK/");
          const finalBulan = String(m.bulanRomawi || m.bulan_romawi || m["_col_4"] || m["col_4"] || parsedBulan || "XI");
          const finalTahun = String(m.tahun || m["_col_5"] || m["col_5"] || parsedTahun || "/2026");

          const cleanUnit = finalUnit.startsWith("/") ? finalUnit : `/${finalUnit}/`;
          const cleanTahun = finalTahun.startsWith("/") ? finalTahun : `/${finalTahun}`;
          const constructedFull = candidateStr || (finalNomor ? `${finalPrefix}${finalNomor}${cleanUnit}${finalBulan}${cleanTahun}` : "");

          return {
            // Canonical Google Sheets 9 columns
            tahun_anggaran: tahunAnggaran,
            nomor_urut: finalNomor || nomorUrut,
            format_lengkap: constructedFull,
            tanggal_memo: tanggalMemo,
            perihal,
            id_kegiatan_ref: idKegiatanRef,
            status,
            nominal,
            MAK: mak,

            // Legacy & UI aliases
            no: nomorUrut,
            prefix: finalPrefix,
            nomor: finalNomor || nomorUrut,
            unit: cleanUnit,
            bulanRomawi: finalBulan,
            tahun: cleanTahun,
            noMemo: constructedFull,
            tanggal: tanggalMemo,
            mak,
          };
        })
        .filter((m) => m.nomor !== "" || m.noMemo !== "" || m.perihal !== "");

      const normalizedData: MasterSyncData = {
        pegawai: normalizedPegawai.length > 0 ? normalizedPegawai : undefined,
        sbm: normalizedSbm.length > 0 ? normalizedSbm : undefined,
        memo: normalizedMemo.length > 0 ? normalizedMemo : undefined,
      };

      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY_MASTER_CACHE, JSON.stringify(normalizedData));
      }
      return { success: true, data: normalizedData, message: "Data master berhasil disinkronkan." };
    } else {
      return { success: false, message: json.message || "Data master tidak valid." };
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Gagal sinkronisasi: ${errMsg}` };
  }
}

/**
 * Simpan / Update Pegawai Baru ke tab MASTER_PEGAWAI di Google Spreadsheet
 */
export async function savePegawaiToGoogleSheet(
  pegawai: Pegawai,
  customUrl?: string
): Promise<{ success: boolean; message: string; idPegawai?: string }> {
  const url = customUrl || getGasApiUrl();

  const idPegawai = pegawai.kodeNama
    ? `PEG-${pegawai.kodeNama.toUpperCase().replace(/\s+/g, "_")}`
    : `PEG-${Date.now()}`;

  const payload = {
    action: "SAVE_PEGAWAI",
    pegawai: {
      idPegawai,
      id_pegawai: idPegawai,
      kodeNama: pegawai.kodeNama,
      kode_nama: pegawai.kodeNama,
      no: pegawai.no || Date.now().toString(),
      no_urut: pegawai.no || Date.now().toString(),
      nama: pegawai.nama,
      nama_lengkap: pegawai.nama,
      nip: pegawai.nip || "",
      jenisKelamin: pegawai.jenisKelamin || "Laki-laki",
      jenis_kelamin: pegawai.jenisKelamin || "Laki-laki",
      pangkat: pegawai.pangkat || "",
      golongan: pegawai.golongan || "III/a",
      jabatan: pegawai.jabatan || "Pelaksana",
      kelasJabatan: pegawai.kelasJabatan || "",
      kelas_jabatan: pegawai.kelasJabatan || "",
      namaBank: pegawai.namaBank || "",
      nama_bank: pegawai.namaBank || "",
      nomorRekening: pegawai.nomorRekening || "",
      nomor_rekening: pegawai.nomorRekening || "",
      isActive: true,
      is_active: true,
    },
  };

  // Cadangkan langsung ke memori cache browser (localStorage)
  if (typeof window !== "undefined") {
    try {
      const cached = getCachedMasterData() || {};
      const currentList = cached.pegawai || [];
      const updatedList = [...currentList.filter((p) => p.nama !== pegawai.nama), pegawai];
      cached.pegawai = updatedList;
      localStorage.setItem(STORAGE_KEY_MASTER_CACHE, JSON.stringify(cached));
    } catch {
      // ignore
    }
  }

  if (!url) {
    return {
      success: true,
      message: `Pegawai ${pegawai.nama} disimpan di memori browser lokal (URL Web App belum diisi).`,
      idPegawai,
    };
  }

  try {
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
        message: json.message || `Pegawai ${pegawai.nama} berhasil disimpan ke MASTER_PEGAWAI Google Spreadsheet.`,
        idPegawai,
      };
    } else {
      return { success: false, message: json.message || "Gagal menyimpan pegawai ke spreadsheet." };
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `Gagal mengirim ke Google Sheets: ${errMsg}`,
    };
  }
}


/**
 * Tarik seluruh baris data dari tab REKAP_PERDIN_48KOLOM di Google Spreadsheet
 */
export async function fetchRekapFromSheet(
  customUrl?: string
): Promise<{ success: boolean; data?: Array<Record<string, unknown>>; message?: string }> {
  const url = customUrl || getGasApiUrl();
  if (!url) {
    return { success: false, message: "URL Web App belum dikonfigurasi." };
  }

  try {
    const fetchUrl = url.includes("?") ? `${url}&action=GET_REKAP` : `${url}?action=GET_REKAP`;
    const res = await fetch(fetchUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    const json = await res.json();
    if (json.status === "success" && Array.isArray(json.data)) {
      if (typeof window !== "undefined") {
        localStorage.setItem("perdin_cached_rekap_data", JSON.stringify(json.data));
      }
      return {
        success: true,
        data: json.data as Array<Record<string, unknown>>,
        message: `Berhasil memuat ${json.data.length} baris data rekap perdin.`,
      };
    } else {
      return { success: false, message: json.message || "Data rekap tidak valid." };
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Gagal memuat rekap: ${errMsg}` };
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
      perihal: header.keteranganKegiatan || "Perjalanan Dinas",
      keteranganMemo: header.keteranganKegiatan || "Perjalanan Dinas",
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

      // Jika nomor memo diisi, simpan / perbarui statusnya di cache Master Memo lokal
      if (header.nomorMemo) {
        const rawCache = localStorage.getItem(STORAGE_KEY_MASTER_CACHE);
        if (rawCache) {
          const cached = JSON.parse(rawCache) as MasterSyncData;
          if (cached && Array.isArray(cached.memo)) {
            const memoNumMatch = header.nomorMemo.match(/\bM\.?(\d+)/i) || header.nomorMemo.match(/(\d+)/);
            const numStr = memoNumMatch ? memoNumMatch[1] : "";
            const memoEntry: NomorMemo = {
              tahun_anggaran: 2026,
              nomor_urut: numStr,
              format_lengkap: header.nomorMemo,
              tanggal_memo: header.tanggalMemo || "",
              perihal: header.keteranganKegiatan || "Perjalanan Dinas",
              id_kegiatan_ref: idKegiatan,
              status: "TERPAKAI",
              nominal: grandTotal,
              MAK: header.nomorMak || "524111",
              noMemo: header.nomorMemo,
              tanggal: header.tanggalMemo || "",
              mak: header.nomorMak || "524111",
            };

            const existingIdx = cached.memo.findIndex(
              (m) =>
                (m.format_lengkap && m.format_lengkap === header.nomorMemo) ||
                (m.noMemo && m.noMemo === header.nomorMemo) ||
                (numStr && (m.nomor_urut === numStr || m.nomor === numStr))
            );

            if (existingIdx >= 0) {
              cached.memo[existingIdx] = { ...cached.memo[existingIdx], ...memoEntry };
            } else {
              cached.memo.push(memoEntry);
            }
            localStorage.setItem(STORAGE_KEY_MASTER_CACHE, JSON.stringify(cached));
          }
        }
      }
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

/**
 * Sinkronisasi Pembaruan Seluruh Baris Rekap 48 Kolom ke Google Spreadsheet
 */
export async function syncAllRekapToGoogleSheet(
  rekapRows: Array<Record<string, unknown>>,
  customUrl?: string
): Promise<{ success: boolean; message: string }> {
  const url = customUrl || getGasApiUrl();

  // Simpan selalu ke localStorage
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("perdin_cached_rekap_data", JSON.stringify(rekapRows));
    } catch {
      // ignore
    }
  }

  if (!url) {
    return {
      success: true,
      message: `Pembaruan ${rekapRows.length} baris rekap tersimpan di memori browser lokal (URL Web App belum diisi).`,
    };
  }

  try {
    const payload = {
      action: "SYNC_REKAP",
      rekapRows,
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return { success: false, message: `HTTP Error ${res.status}: ${res.statusText}` };
    }

    const json = await res.json();
    if (json.status === "success") {
      return {
        success: true,
        message: json.message || `Berhasil menyinkronkan ${rekapRows.length} baris rekap ke Google Spreadsheet.`,
      };
    } else {
      return {
        success: true,
        message: `Data berhasil disimpan di memori lokal (${json.message || "Spreadsheet sync pending"}).`,
      };
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `Data tersimpan lokal, gagal sync ke cloud: ${errMsg}`,
    };
  }
}

