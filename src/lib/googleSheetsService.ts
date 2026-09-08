import { HeaderData, ParticipantRow, Pegawai, SbmRate, NomorMemo, SavedKegiatan } from "./types";
import { generateIdKegiatan, getSavedKegiatanList } from "./kegiatanHelper";

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

export const DEFAULT_GAS_API_URL =
  "https://script.google.com/macros/s/AKfycbyHhSy4j0a3W0doKZ5JB_579IqkC5Cqjux7nuemnlbWUnTnVCKWGqlpcLXCYhrB6DuXcQ/exec";

const STORAGE_KEY_URL = "perdin_gas_api_url";
const STORAGE_KEY_MASTER_CACHE = "perdin_cached_master_data";

export function getDefaultGasApiUrl(): string {
  return process.env.NEXT_PUBLIC_GAS_API_URL || DEFAULT_GAS_API_URL;
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
 * Executor terpadu request Google Apps Script:
 * - Menggunakan proxy internal Next.js `/api/gas` saat di browser untuk menghindari issue CORS & HTTP 302 redirect.
 * - Fallback ke direct fetch jika proxy tidak tersedia atau di luar lingkungan Next.js.
 */
export async function executeGasRequest<T = unknown>(
  method: "GET" | "POST",
  payloadOrParams: Record<string, unknown>,
  customUrl?: string
): Promise<GasApiResponse<T>> {
  const targetUrl = customUrl || getGasApiUrl();

  // 1. Coba lewat internal Next.js API Proxy di client browser
  if (typeof window !== "undefined") {
    try {
      if (method === "GET") {
        const query = new URLSearchParams();
        Object.entries(payloadOrParams).forEach(([k, v]) => {
          if (v !== undefined && v !== null) query.set(k, String(v));
        });
        if (targetUrl) query.set("gasUrl", targetUrl);
        const res = await fetch(`/api/gas?${query.toString()}`, {
          method: "GET",
          headers: { Accept: "application/json" },
        });
        if (res.ok) {
          const json = (await res.json()) as GasApiResponse<T>;
          return json;
        }
      } else {
        const res = await fetch("/api/gas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payloadOrParams, customUrl: targetUrl }),
        });
        if (res.ok) {
          const json = (await res.json()) as GasApiResponse<T>;
          return json;
        }
      }
    } catch {
      // Fallback ke direct fetch jika proxy gagal
    }
  }

  // 2. Fallback: direct fetch ke Google Apps Script
  if (!targetUrl) {
    throw new Error("URL Google Apps Script belum dikonfigurasi.");
  }

  if (method === "GET") {
    const query = new URLSearchParams();
    Object.entries(payloadOrParams).forEach(([k, v]) => {
      if (v !== undefined && v !== null) query.set(k, String(v));
    });
    const qs = query.toString();
    const fetchUrl = qs
      ? (targetUrl.includes("?") ? `${targetUrl}&${qs}` : `${targetUrl}?${qs}`)
      : targetUrl;
    const res = await fetch(fetchUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    return (await res.json()) as GasApiResponse<T>;
  } else {
    const res = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payloadOrParams),
    });
    return (await res.json()) as GasApiResponse<T>;
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
    const json = await executeGasRequest<MasterSyncData>("GET", { action: "GET_MASTERS" }, url);
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
    const json = await executeGasRequest<Record<string, unknown[]>>("GET", { action: "GET_MASTERS" }, url);
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
    ? `PEG-${pegawai.kodeNama.toUpperCase().replace(/\s+/g, "_")}-${Date.now().toString().slice(-4)}`
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

  try {
    const json = await executeGasRequest("POST", payload, url);
    if (json.status === "success") {
      // Simpan ke cache browser setelah berhasil simpan ke database
      if (typeof window !== "undefined") {
        try {
          const cached = getCachedMasterData() || {};
          const currentList = cached.pegawai || [];
          const updatedList = [...currentList.filter((p) => p.nama !== pegawai.nama), { ...pegawai, idPegawai }];
          cached.pegawai = updatedList;
          localStorage.setItem(STORAGE_KEY_MASTER_CACHE, JSON.stringify(cached));
        } catch {
          // ignore
        }
      }

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
    // Cadangkan ke local cache jika terjadi kegagalan koneksi
    if (typeof window !== "undefined") {
      try {
        const cached = getCachedMasterData() || {};
        const currentList = cached.pegawai || [];
        const updatedList = [...currentList.filter((p) => p.nama !== pegawai.nama), { ...pegawai, idPegawai }];
        cached.pegawai = updatedList;
        localStorage.setItem(STORAGE_KEY_MASTER_CACHE, JSON.stringify(cached));
      } catch {
        // ignore
      }
    }
    return {
      success: false,
      message: `Gagal mengirim ke Google Sheets: ${errMsg}. Data tersimpan sementara di memori browser lokal.`,
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
    const json = await executeGasRequest<Array<Record<string, unknown>>>("GET", { action: "GET_REKAP" }, url);
    if (json.status === "success" && Array.isArray(json.data)) {
      // Filter anti-hantu: buang baris yang tidak memiliki Nama Pegawai dan Nama Kegiatan
      const validData = (json.data as Array<Record<string, unknown>>).filter((r) => {
        const nama = String(r["NAMA PEGAWAI INTERNAL INSPEKTORAT"] || r["NAMA EXTERNAL"] || "").trim();
        const keg = String(r["Nama Kegiatan"] || "").trim();
        return nama !== "" || keg !== "";
      });

      if (typeof window !== "undefined") {
        localStorage.setItem("perdin_cached_rekap_data", JSON.stringify(validData));
      }
      return {
        success: true,
        data: validData,
        message: `Berhasil memuat ${validData.length} baris data rekap perdin.`,
      };
    } else {
      return { success: false, message: json.message || "Data rekap tidak valid." };
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Gagal memuat rekap: ${errMsg}` };
  }
}

function cleanIsoDate(val: unknown, fallback: string = new Date().toISOString().split("T")[0]): string {
  if (!val) return fallback;
  const str = String(val).trim();
  if (str.includes("T")) return str.split("T")[0];
  if (str.match(/^\d{4}-\d{2}-\d{2}$/)) return str;
  const d = new Date(str);
  if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
  return fallback;
}

function rekapRowToParticipant(rekap: Record<string, unknown>, idx: number): ParticipantRow {
  const namaInternal = String(rekap["NAMA PEGAWAI INTERNAL INSPEKTORAT"] || "").trim();
  const namaExternal = String(rekap["NAMA EXTERNAL"] || "").trim();
  const nama = namaInternal || namaExternal || `Peserta ${idx + 1}`;
  const isExternal = Boolean(namaExternal);
  const totalJumlah = Number(rekap["Total"] || rekap["Nilai Nominal di Daftar Nominatif"] || 0);

  const tglMulai = cleanIsoDate(rekap["Tgl Berangkat"]);
  const tglSelesai = cleanIsoDate(rekap["Tgl Kembali"]);

  return {
    id: String(idx + 1),
    kodeNama: "",
    nama,
    namaExternal: isExternal ? namaExternal : undefined,
    nip: String(rekap["NIP"] || ""),
    golongan: String(rekap["Gol"] || ""),
    jabatan: String(rekap["Jabatan"] || ""),
    tujuanKota: String(rekap["Tujuan ke-"] || ""),
    tujuanProvinsi: String(rekap["Tujuan ke-"] || "JAWA BARAT"),
    tanggalMulai: tglMulai,
    tanggalSelesai: tglSelesai,
    lamaHari: Number(rekap["Total Hari"] || 1),
    nomorSt: String(rekap["No Surat Tugas"] || ""),
    nomorSpd: String(idx + 1).padStart(2, "0"),
    hariUhBiasa: Number(rekap["Lama Hari 100%"] || 1),
    biayaUhBiasa: Number(rekap["UH 100% ()"] || 0),
    hariUhBiasa60: Number(rekap["Lama Hari 40%"] || 0),
    biayaUhBiasa60: Number(rekap["UH 40% ()"] || 0),
    hariUhHalfday: 0,
    biayaUhHalfday: 0,
    hariUhFullboard: 0,
    biayaUhFullboard: Number(rekap["UH Fullboard/Fullday/Halfday/Diklat"] || 0),
    tiket: Number(rekap["Harga Fare Tiket Pergi ()"] || 0) + Number(rekap["Harga FareTiket Pulang ()"] || 0),
    dukunganTransportasi: 0,
    transportasiDarat: Number(rekap["Biaya Transport ()"] || 0),
    transportasiLokal: 0,
    transportJakartaPp: Number(rekap["Transport Jakarta PP"] || 0),
    transportDaerahPp: Number(rekap["Transport Daerah PP"] || 0),
    hotel: Number(rekap["Biaya Penginapan Biasa (Hotel)"] || 0),
    penginapan30: Number(rekap["Penginapan 30%"] || 0),
    fulldayMeeting: 0,
    fullboardMeeting: Number(rekap["Biaya Fullboard/Fullday/Halfday ()"] || 0),
    representatif: Number(rekap["Representatif ()"] || 0),
    belanjaBahan: 0,
    pengRill: Number(rekap["Riil ()"] || 0),
    riilItems: [],
    totalJumlah,
  };
}

/**
 * Tarik seluruh daftar kegiatan dari tab DB_KEGIATAN & REKAP_PERDIN_48KOLOM di Google Spreadsheet
 */
export async function fetchKegiatanFromSheet(
  customUrl?: string
): Promise<{ success: boolean; data?: SavedKegiatan[]; message?: string }> {
  const url = customUrl || getGasApiUrl();
  if (!url) {
    return { success: false, message: "URL Web App belum dikonfigurasi." };
  }

  try {
    const [jsonKegiatan, jsonRekap] = await Promise.all([
      executeGasRequest<Array<Record<string, unknown>>>("GET", { action: "GET_KEGIATAN_LIST" }, url),
      executeGasRequest<Array<Record<string, unknown>>>("GET", { action: "GET_REKAP" }, url).catch(() => ({
        status: "error" as const,
        data: [],
      })),
    ]);

    if (jsonKegiatan.status !== "success" || !Array.isArray(jsonKegiatan.data)) {
      return { success: false, message: jsonKegiatan.message || "Data kegiatan tidak valid." };
    }

    const cloudKegiatanList: Array<Record<string, unknown>> = jsonKegiatan.data;
    const rekapRows: Array<Record<string, unknown>> = Array.isArray(jsonRekap.data) ? jsonRekap.data : [];

    if (typeof window !== "undefined" && rekapRows.length > 0) {
      localStorage.setItem("perdin_cached_rekap_data", JSON.stringify(rekapRows));
    }

    // Ambil data lokal yang sudah tersimpan untuk merge
    const localList = typeof window !== "undefined" ? getSavedKegiatanList() : [];
    const localMap = new Map<string, SavedKegiatan>();
    localList.forEach((item) => {
      if (item.idKegiatan) localMap.set(item.idKegiatan, item);
    });

    const parsedList: SavedKegiatan[] = cloudKegiatanList.map((item) => {
      const idKegiatan = String(item.id_kegiatan || "").trim();
      const namaKegiatan = String(item.nama_kegiatan || "Kegiatan Dinas").trim();

      // Cari baris rekap yang memiliki nama kegiatan yang sama
      const matchingRekap = rekapRows.filter((r) => {
        const rowKgt = String(r["Nama Kegiatan"] || "").trim();
        return rowKgt === namaKegiatan;
      });

      let kategori: "A" | "B" = "A";
      if (idKegiatan.endsWith("-B")) {
        kategori = "B";
      } else if (idKegiatan.endsWith("-A")) {
        kategori = "A";
      } else {
        const hasExternal = matchingRekap.some((r) => Boolean(r["NAMA EXTERNAL"]));
        kategori = hasExternal ? "B" : "A";
      }

      const tanggalSpd = cleanIsoDate(item.tanggal_spd || item.tanggal_mulai);
      let kotaTujuan = "";
      try {
        const rawKota = item.kota_tujuan_list;
        if (typeof rawKota === "string" && rawKota.startsWith("[")) {
          const parsed = JSON.parse(rawKota);
          kotaTujuan = Array.isArray(parsed) && parsed.length > 0 ? String(parsed[0]) : "";
        } else if (typeof rawKota === "string") {
          kotaTujuan = rawKota;
        }
      } catch {
        kotaTujuan = "";
      }

      const provinsiTujuan = String(item.provinsi_tujuan_list || item.provinsi_tujuan || "JAWA BARAT");
      const grandTotal = Number(item.grand_total) || 0;
      const jumlahPeserta = matchingRekap.length > 0 ? matchingRekap.length : 1;

      // Jika ada di lokal dan memiliki rows peserta, gunakan local snapshot agar tidak kehilangan detail form
      const existingLocal = localMap.get(idKegiatan);
      if (existingLocal && existingLocal.rows && existingLocal.rows.length > 0) {
        return {
          ...existingLocal,
          idKegiatan,
          kategori,
          namaKegiatan,
          tanggalSpd,
          kotaTujuan: kotaTujuan || existingLocal.kotaTujuan,
          provinsiTujuan: provinsiTujuan || existingLocal.provinsiTujuan,
          jumlahPeserta: existingLocal.rows.length,
          grandTotal: grandTotal || existingLocal.grandTotal,
        };
      }

      // Reconstruct rows dari tabel rekap jika di lokal belum ada
      const reconstructedRows: ParticipantRow[] =
        matchingRekap.length > 0
          ? matchingRekap.map((r, idx) => rekapRowToParticipant(r, idx))
          : [
              {
                id: "1",
                kodeNama: "",
                nama: "Peserta Dinas",
                nip: "",
                golongan: "",
                jabatan: "",
                tujuanKota: kotaTujuan,
                tujuanProvinsi: provinsiTujuan,
                tanggalMulai: tanggalSpd,
                tanggalSelesai: tanggalSpd,
                lamaHari: 1,
                nomorSt: String(item.nomor_st_master || ""),
                nomorSpd: "01",
                hariUhBiasa: 1,
                biayaUhBiasa: 0,
                hariUhBiasa60: 0,
                biayaUhBiasa60: 0,
                hariUhHalfday: 0,
                biayaUhHalfday: 0,
                hariUhFullboard: 0,
                biayaUhFullboard: 0,
                tiket: 0,
                dukunganTransportasi: 0,
                transportasiDarat: 0,
                transportasiLokal: 0,
                transportJakartaPp: 0,
                transportDaerahPp: 0,
                hotel: 0,
                penginapan30: 0,
                fulldayMeeting: 0,
                fullboardMeeting: 0,
                representatif: 0,
                belanjaBahan: 0,
                pengRill: 0,
                riilItems: [],
                totalJumlah: grandTotal,
              },
            ];

      // Reconstruct HeaderData
      const reconstructedHeader: HeaderData = {
        idKegiatan,
        kategoriSpj: kategori,
        noKegiatanUrut: idKegiatan.split("-")[2] || "01",
        keteranganKegiatan: namaKegiatan,
        keteranganMemo: namaKegiatan,
        provinsiTujuan,
        kotaTujuanList: kotaTujuan ? [kotaTujuan] : [""],
        unitKerja: String(item.unit_kerja || "Inspektorat"),
        picInisiator: String(item.ppk_nama || "Arif Wibowo, S.H., M.H."),
        bendahara: String(item.bendahara_nama || "Raka Panji Wibowo, S.Kom, NIP. 19950408202012 1 001"),
        petugasVerifikasi: String(item.verifikator_nama || "Noviarty Ningsi Sumirat, S.E, NIP. 19811112201001 2 001"),
        nomorKomp: String(item.kode_komponen || ""),
        nomorMak: String(item.kode_mak || ""),
        itemDetail: String(item.item_detail || "001"),
        alatAngkut: String(item.alat_angkut || "Angkutan Darat"),
        tanggalSpd,
        tanggalMemo: cleanIsoDate(item.tanggal_memo || item.tanggal_spd),
        nomorMemo: String(item.nomor_memo || ""),
        nomorStMaster: String(item.nomor_st_master || ""),
        ppkNama: String(item.ppk_nama || "Arif Wibowo, S.H., M.H."),
        ppkNip: String(item.ppk_nip || "19830124200801 1 006"),
        ppkJabatan: "Kepala Bagian Tata Usaha Inspektorat",
        penanggungJawabNama: "Reni Sutaryo, S.Si., M.Adm.Pemb",
        penanggungJawabNip: "19791126200604 2 014",
        penanggungJawabJabatan: "Inspektur",
        jenisPengajuan: "RAMPUNG",
        noSpm: String(item.no_spm || ""),
        noSpby: String(item.no_spby || ""),
        jenisPerdin: "Perdin Luar Kota",
        berangkatDari: String(item.berangkat_dari || "Jakarta"),
      };

      return {
        idKegiatan,
        kategori,
        namaKegiatan,
        tanggalSpd,
        kotaTujuan,
        provinsiTujuan,
        jumlahPeserta,
        grandTotal,
        header: reconstructedHeader,
        rows: reconstructedRows,
        activeCols: {
          tiket: false,
          dukunganTransportasi: false,
          transportasiDarat: true,
          transportasiLokal: false,
          transportJakartaPp: false,
          transportDaerahPp: false,
          pengRill: true,
          hotel: false,
          penginapan30: false,
          fulldayMeeting: false,
          fullboardMeeting: false,
          representatif: true,
          belanjaBahan: false,
        },
        activeUh: {
          uhBiasa: true,
          uhBiasa60: false,
          uhHalfday: false,
          uhFullboard: false,
        },
      };
    });

    // Simpan ke localStorage agar offline / subsequent render cepat
    if (typeof window !== "undefined") {
      localStorage.setItem("perdin_saved_kegiatan_list", JSON.stringify(parsedList));
      window.dispatchEvent(new CustomEvent("kegiatan-list-updated", { detail: { updatedList: parsedList } }));
    }

    return {
      success: true,
      data: parsedList,
      message: `Berhasil memuat ${parsedList.length} paket kegiatan dari Google Spreadsheet.`,
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Gagal memuat kegiatan: ${errMsg}` };
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
    header.idKegiatan ||
    generateIdKegiatan(
      header.tanggalSpd,
      header.noKegiatanUrut || "01",
      header.kategoriSpj || "A"
    );

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
    const json = await executeGasRequest("POST", payload, url);
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

  // Filter anti-hantu sebelum simpan ke local dan cloud
  const validRows = rekapRows.filter((r) => {
    const nama = String(r["NAMA PEGAWAI INTERNAL INSPEKTORAT"] || r["NAMA EXTERNAL"] || "").trim();
    const keg = String(r["Nama Kegiatan"] || "").trim();
    return nama !== "" || keg !== "";
  });

  // Simpan selalu ke localStorage
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("perdin_cached_rekap_data", JSON.stringify(validRows));
    } catch {
      // ignore
    }
  }

  if (!url) {
    return {
      success: true,
      message: `Pembaruan ${validRows.length} baris rekap tersimpan di memori browser lokal (URL Web App belum diisi).`,
    };
  }

  try {
    const payload = {
      action: "SYNC_REKAP",
      rekapRows: validRows,
    };

    const json = await executeGasRequest("POST", payload, url);
    if (json.status === "success") {
      return {
        success: true,
        message: json.message || `Berhasil menyinkronkan ${validRows.length} baris rekap ke Google Spreadsheet.`,
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

/**
 * Hapus seluruh data sebuah paket kegiatan dari Google Spreadsheet (DB_KEGIATAN, DB_PESERTA, REKAP_PERDIN_48KOLOM)
 */
export async function deleteKegiatanFromGoogleSheet(
  idKegiatan: string,
  namaKegiatan?: string,
  customUrl?: string
): Promise<{ success: boolean; message: string }> {
  const url = customUrl || getGasApiUrl();
  if (!url) {
    return { success: false, message: "URL Web App Google Apps Script belum diset." };
  }

  try {
    const payload = {
      action: "DELETE_KEGIATAN",
      idKegiatan,
      namaKegiatan: namaKegiatan || "",
    };

    const json = await executeGasRequest("POST", payload, url);
    return {
      success: json.status === "success",
      message: json.message || `Kegiatan ${idKegiatan} berhasil dihapus dari cloud.`,
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Gagal menghapus kegiatan di cloud: ${errMsg}` };
  }
}

/**
 * Kosongkan seluruh data transaksi uji coba dari Google Spreadsheet (DB_KEGIATAN, DB_PESERTA, REKAP_PERDIN_48KOLOM)
 * Master data (Pegawai, SBM, Memo) tetap aman terjaga.
 */
export async function resetTransaksiInGoogleSheet(
  customUrl?: string
): Promise<{ success: boolean; message: string }> {
  const url = customUrl || getGasApiUrl();
  if (!url) {
    return { success: false, message: "URL Web App Google Apps Script belum diset." };
  }

  try {
    const payload = {
      action: "RESET_TRANSAKSI",
    };

    const json = await executeGasRequest("POST", payload, url);
    if (json.status === "success") {
      // Bersihkan juga seluruh memori browser lokal seketika
      if (typeof window !== "undefined") {
        localStorage.removeItem("perdin_cached_rekap_data");
        localStorage.removeItem("perdin_saved_kegiatan_list");
        window.dispatchEvent(new CustomEvent("rekap-perdin-updated", { detail: { updatedRekap: [] } }));
        window.dispatchEvent(new CustomEvent("kegiatan-list-updated", { detail: { updatedList: [] } }));
      }
      return {
        success: true,
        message: json.message || "Seluruh data transaksi uji coba berhasil dikosongkan secara bersih.",
      };
    } else {
      return { success: false, message: json.message || "Gagal mengosongkan transaksi di cloud." };
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Gagal mengosongkan transaksi: ${errMsg}` };
  }
}

