import { HeaderData, ParticipantRow, Pegawai, SbmRate, NomorMemo, SavedKegiatan, RiilItem, TicketDetail } from "./types";
import { generateIdKegiatan, getSavedKegiatanList } from "./kegiatanHelper";
import { buildRekapFromSavedKegiatanList, deduplicateRekapRows, isSameRekapRow } from "./rekapHelper";
import { getMonthRoman } from "./calc";
import { parseSpdNumber, saveLatestRegisteredSpdNumber } from "./spdHelper";
import { ItemDetailItem, LIST_ITEM_DETAIL, getItemDetailByKode, getKomponenName } from "@/data/mak_akun";

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
  mak?: ItemDetailItem[];
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
          taksiBandara: Number(
            s.taksiBandara ??
            s.taksi_bandara ??
            s["taksi bandara"] ??
            s["Taksi Bandara"] ??
            s["TAKSI BANDARA"] ??
            s["Taksi Bandara (Terminal/Stasiun)"] ??
            0
          ),
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const normalizedMak: ItemDetailItem[] = ((json.data as any).mak || [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((m: any) => ({
          kode: String(m.kode_item || m.kode || ""),
          nama: String(m.nama_item || m.nama || ""),
          fullLabel: String(m.full_label || m.fullLabel || ""),
          kodeMak: String(m.kode_mak || m.kodeMak || ""),
          namaMak: String(m.nama_mak || m.namaMak || ""),
          kodeKomponen: String(m.kode_komponen || m.kodeKomponen || ""),
          fullMak: String(m.full_mak || m.fullMak || ""),
        }))
        .filter((m: ItemDetailItem) => m.kode !== "");

      const normalizedData: MasterSyncData = {
        pegawai: normalizedPegawai.length > 0 ? normalizedPegawai : undefined,
        sbm: normalizedSbm.length > 0 ? normalizedSbm : undefined,
        memo: normalizedMemo.length > 0 ? normalizedMemo : undefined,
        mak: normalizedMak.length > 0 ? normalizedMak : undefined,
      };

      // Sinkronkan nomor SPD terakhir dari spreadsheet jika tersedia
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (json.data && (json.data as any).latestSpdNumber) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cloudSpd = Number((json.data as any).latestSpdNumber);
        if (!isNaN(cloudSpd) && cloudSpd > 0) {
          saveLatestRegisteredSpdNumber(cloudSpd);
        }
      }

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

      // Gabungkan dengan baris rekap dari daftar kegiatan tersimpan di lokal tanpa duplikasi
      const localRekapRows = buildRekapFromSavedKegiatanList();

      let combinedData: Array<Record<string, unknown>>;
      if (localRekapRows.length > 0) {
        // Ambil baris dari cloud yang TIDAK ada di local activities
        const extraCloudRows = validData.filter((cr) => {
          const isMatched = localRekapRows.some((lr) => isSameRekapRow(cr, lr));
          return !isMatched;
        });
        const dedupedExtra = deduplicateRekapRows(extraCloudRows);
        combinedData = [...localRekapRows, ...dedupedExtra];
      } else {
        combinedData = deduplicateRekapRows(validData);
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("perdin_cached_rekap_data", JSON.stringify(combinedData));
      }
      return {
        success: true,
        data: combinedData,
        message: `Berhasil memuat ${combinedData.length} baris data rekap perdin.`,
      };
    } else {
      return { success: false, message: json.message || "Data rekap tidak valid." };
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Gagal memuat rekap: ${errMsg}` };
  }
}

export function cleanIsoDate(val: unknown, fallback: string = new Date().toISOString().split("T")[0]): string {
  if (!val) return fallback;
  if (val instanceof Date && !isNaN(val.getTime())) {
    const year = val.getFullYear();
    const month = String(val.getMonth() + 1).padStart(2, "0");
    const day = String(val.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  const str = String(val).trim();
  if (!str) return fallback;

  // If plain YYYY-MM-DD format (no time), keep it exactly as-is
  if (str.match(/^\d{4}-\d{2}-\d{2}$/)) return str;

  // If ISO string with T (e.g. 2026-09-14T17:00:00.000Z or local time), parse using local Date components
  if (str.includes("T")) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
    const part = str.split("T")[0];
    if (part.match(/^\d{4}-\d{2}-\d{2}$/)) return part;
  }

  // Format DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
  const dmyMatch = str.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, "0");
    const month = dmyMatch[2].padStart(2, "0");
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Format YYYY/MM/DD or YYYY.MM.DD
  const ymdMatch = str.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, "0");
    const day = ymdMatch[3].padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Format Text Bulan Indonesia: "15 September 2026" / "15 Sep 2026"
  const indoMonths: Record<string, string> = {
    jan: "01", januari: "01",
    feb: "02", februari: "02",
    mar: "03", maret: "03",
    apr: "04", april: "04",
    mei: "05", may: "05",
    jun: "06", juni: "06",
    jul: "07", juli: "07",
    agu: "08", agustus: "08", aug: "08",
    sep: "09", september: "09",
    okt: "10", oktober: "10", oct: "10",
    nov: "11", november: "11",
    des: "12", desember: "12", dec: "12"
  };
  const textMatch = str.match(/^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/);
  if (textMatch) {
    const day = textMatch[1].padStart(2, "0");
    const mKey = textMatch[2].toLowerCase();
    const month = indoMonths[mKey];
    const year = textMatch[3];
    if (month) return `${year}-${month}-${day}`;
  }

  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    try {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch {
      return fallback;
    }
  }

  return fallback;
}

function pesertaRowToParticipant(p: Record<string, unknown>, idx: number): ParticipantRow {
  const namaSnapshot = String(p["nama_snapshot"] || p["nama"] || "").trim();
  const namaExt = String(p["spj_nama_external"] || p["namaExternal"] || p["NAMA EXTERNAL"] || "").trim();
  const nama = namaSnapshot || (namaExt ? "" : `Peserta ${idx + 1}`);
  const isExternal = Boolean(namaExt);

  // Parse riil_items_json
  let riilItems: RiilItem[] = [];
  const rawRiil = p["riil_items_json"] || p["riilItems"] || p["riil_items"];
  if (typeof rawRiil === "string" && rawRiil.trim() !== "") {
    try {
      const parsed = JSON.parse(rawRiil);
      if (Array.isArray(parsed)) {
        riilItems = parsed.map((it: Record<string, unknown>, itIdx: number) => ({
          id: String(it.id || itIdx + 1),
          uraian: String(it.uraian || "Pengeluaran Riil"),
          amount: Number(it.amount || 0),
          keterangan: it.keterangan ? String(it.keterangan) : undefined,
        }));
      }
    } catch {
      riilItems = [];
    }
  } else if (Array.isArray(rawRiil)) {
    riilItems = rawRiil as RiilItem[];
  }

  const biayaRiil = Number(p["biaya_riil"] || p["pengRill"] || p["Riil ()"] || 0);
  if (riilItems.length === 0 && biayaRiil > 0) {
    riilItems = [
      { id: "1", uraian: "Pengeluaran Riil Lainnya", amount: biayaRiil }
    ];
  }

  const tiketDetailPergi: TicketDetail = {
    noTiket: String(p["tiket_pergi_no"] || ""),
    kodeBooking: String(p["tiket_pergi_booking"] || ""),
    maskapai: String(p["tiket_pergi_maskapai"] || ""),
    harga: Number(p["tiket_pergi_fare"] || 0),
  };

  const tiketDetailPulang: TicketDetail = {
    noTiket: String(p["tiket_pulang_no"] || ""),
    kodeBooking: String(p["tiket_pulang_booking"] || ""),
    maskapai: String(p["tiket_pulang_maskapai"] || ""),
    harga: Number(p["tiket_pulang_fare"] || 0),
  };

  const tglMulai = cleanIsoDate(p["tanggal_mulai"] || p["Tgl Berangkat"]);
  const tglSelesai = cleanIsoDate(p["tanggal_selesai"] || p["Tgl Kembali"]);

  return {
    id: String(p["id_peserta"] || idx + 1),
    kodeNama: String(p["id_pegawai"] || p["kode_nama"] || ""),
    nama,
    namaExternal: isExternal ? namaExt : undefined,
    nip: String(p["nip_snapshot"] || p["nip"] || p["NIP"] || ""),
    golongan: String(p["golongan_snapshot"] || p["golongan"] || p["Gol"] || ""),
    jabatan: String(p["jabatan_snapshot"] || p["jabatan"] || p["Jabatan"] || ""),
    tujuanKota: String(p["tujuan_kota"] || p["Tujuan ke-"] || ""),
    tujuanProvinsi: String(p["tujuan_provinsi"] || "JAWA BARAT"),
    tanggalMulai: tglMulai,
    tanggalSelesai: tglSelesai,
    lamaHari: Number(p["lama_hari"] || p["Total Hari"] || 1),
    nomorSt: String(p["nomor_st_assigned"] || p["nomor_st"] || p["No Surat Tugas"] || ""),
    nomorSpd: String(p["nomor_spd"] || idx + 1).padStart(2, "0"),
    isPejabat: Boolean(p["is_pejabat"]),
    hariUhBiasa: Number(p["hari_uh_biasa"] || p["Lama Hari 100%"] || 0),
    biayaUhBiasa: Number(p["biaya_uh_biasa"] || p["UH 100% ()"] || 0),
    hariUhBiasa60: Number(p["hari_uh_60"] || 0),
    biayaUhBiasa60: Number(p["biaya_uh_60"] || 0),
    hariUhBiasa40: Number(p["hari_uh_40"] || p["Lama Hari 40%"] || 0),
    biayaUhBiasa40: Number(p["biaya_uh_40"] || p["UH 40% ()"] || 0),
    hariUhHalfday: Number(p["hari_uh_halfday"] || 0),
    biayaUhHalfday: Number(p["biaya_uh_halfday"] || 0),
    hariUhFullboard: Number(p["hari_uh_fullboard"] || 0),
    biayaUhFullboard: Number(p["biaya_uh_fullboard"] || p["UH Fullboard/Fullday/Halfday/Diklat"] || 0),
    tiket: Number(p["biaya_tiket"] || p["tiket"] || 0),
    dukunganTransportasi: 0,
    transportasiDarat: Number(p["biaya_trans_darat"] || p["Biaya Transport ()"] || 0),
    transportasiLokal: Number(p["biaya_trans_lokal"] || 0),
    transportJakartaPp: Number(p["biaya_trans_jakarta_pp"] || p["Transport Jakarta PP"] || 0),
    transportDaerahPp: Number(p["biaya_trans_daerah_pp"] || p["Transport Daerah PP"] || 0),
    hotel: Number(p["biaya_hotel"] || p["Biaya Penginapan Biasa (Hotel)"] || 0),
    penginapan30: Number(p["biaya_penginapan_30"] || p["Penginapan 30%"] || 0),
    fulldayMeeting: 0,
    fullboardMeeting: Number(p["biaya_meeting"] || p["Biaya Fullboard/Fullday/Halfday ()"] || 0),
    representatif: Number(p["biaya_representatif"] || p["Representatif ()"] || 0),
    belanjaBahan: 0,
    pengRill: biayaRiil,
    riilItems,
    totalJumlah: Number(p["total_biaya"] || p["Total"] || 0),
    boardingPass:
      String(p["tiket_boarding_pass"] || "").toUpperCase() === "ADA"
        ? "ADA"
        : String(p["tiket_boarding_pass"] || "").toUpperCase() === "TIDAK"
        ? "TIDAK"
        : undefined,
    tiketDetailPergi,
    tiketDetailPulang,
    namaHotel: String(p["hotel_nama"] || p["Nama Penginapan"] || ""),
    checkInHotel: cleanIsoDate(p["hotel_checkin"] || p["Tanggal Check In"]),
    checkOutHotel: cleanIsoDate(p["hotel_checkout"] || p["Tanggal Check Out"]),
    malamHotel: Number(p["hotel_malam"] || p["Jumlah Hari Menginap"] || 1),
    noBillFolio: String(p["hotel_bill_folio"] || ""),
    noKamar: String(p["hotel_no_kamar"] || ""),
    sewaKendaraan: Number(p["spj_sewa_kendaraan"] || p["Sewa kendaraan ()"] || 0),
    taksiBandara: Number(p["spj_taksi_bandara"] || p["Taksi Bandara"] || 0),
    biayaReschedule: Number(p["spj_biaya_reschedule"] || p["Biaya Reschedule ()"] || 0),
    kurs: Number(p["spj_kurs_valuta"] || p["Kurs ()"] || 0),
    pengembalian: Number(p["spj_pengembalian_kas"] || 0),
  };
}

function rekapRowToParticipant(rekap: Record<string, unknown>, idx: number): ParticipantRow {
  const namaInternal = String(rekap["NAMA PEGAWAI INTERNAL INSPEKTORAT"] || "").trim();
  const namaExternal = String(rekap["NAMA EXTERNAL"] || "").trim();
  const nama = namaInternal || namaExternal || `Peserta ${idx + 1}`;
  const isExternal = Boolean(namaExternal);
  const totalJumlah = Number(rekap["Total"] || rekap["Nilai Nominal di Daftar Nominatif"] || 0);

  const tglMulai = cleanIsoDate(rekap["Tgl Berangkat"]);
  const tglSelesai = cleanIsoDate(rekap["Tgl Kembali"]);

  const biayaRiil = Number(rekap["Riil ()"] || 0);
  const riilItems: RiilItem[] = biayaRiil > 0 ? [{ id: "1", uraian: "Pengeluaran Riil Lainnya", amount: biayaRiil }] : [];

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
    hariUhBiasa60: 0,
    biayaUhBiasa60: 0,
    hariUhBiasa40: Number(rekap["Lama Hari 40%"] || 0),
    biayaUhBiasa40: Number(rekap["UH 40% ()"] || 0),
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
    pengRill: biayaRiil,
    riilItems,
    totalJumlah,
  };
}

/**
 * Tarik seluruh daftar kegiatan dari tab DB_KEGIATAN, DB_PESERTA & REKAP_PERDIN_48KOLOM di Google Spreadsheet
 */
export async function fetchKegiatanFromSheet(
  customUrl?: string
): Promise<{ success: boolean; data?: SavedKegiatan[]; message?: string }> {
  const url = customUrl || getGasApiUrl();
  if (!url) {
    return { success: false, message: "URL Web App belum dikonfigurasi." };
  }

  try {
    const [jsonKegiatan, jsonRekap, jsonPeserta, jsonMasters] = await Promise.all([
      executeGasRequest<Array<Record<string, unknown>>>("GET", { action: "GET_KEGIATAN_LIST" }, url),
      executeGasRequest<Array<Record<string, unknown>>>("GET", { action: "GET_REKAP" }, url).catch(() => ({
        status: "error" as const,
        data: [] as Array<Record<string, unknown>>,
      })),
      executeGasRequest<Array<Record<string, unknown>>>("GET", { action: "GET_PESERTA" }, url).catch(() => ({
        status: "error" as const,
        data: [] as Array<Record<string, unknown>>,
      })),
      executeGasRequest<MasterSyncData>("GET", { action: "GET_MASTERS" }, url).catch(() => ({
        status: "error" as const,
        data: {} as MasterSyncData,
      })),
    ]);

    if (jsonKegiatan.status !== "success" || !Array.isArray(jsonKegiatan.data)) {
      return { success: false, message: jsonKegiatan.message || "Data kegiatan tidak valid." };
    }

    const cloudKegiatanList: Array<Record<string, unknown>> = jsonKegiatan.data;
    const rekapRows: Array<Record<string, unknown>> = Array.isArray(jsonRekap.data) ? jsonRekap.data : [];
    const pesertaRows: Array<Record<string, unknown>> = Array.isArray(jsonPeserta.data) ? jsonPeserta.data : [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const memoRows: Array<Record<string, unknown>> =
      jsonMasters.data && Array.isArray((jsonMasters.data as any).memo)
        ? ((jsonMasters.data as any).memo as Array<Record<string, unknown>>)
        : [];

    // Ambil data lokal yang sudah tersimpan untuk merge
    const localList = typeof window !== "undefined" ? getSavedKegiatanList() : [];
    const localMap = new Map<string, SavedKegiatan>();
    localList.forEach((item) => {
      if (item.idKegiatan) localMap.set(item.idKegiatan, item);
    });

    // Helper pencocokan cerdas antara kegiatan di cloud dan lokal (mencocokkan ID persis ATAU Nama Kegiatan)
    const findMatchingLocal = (cloudId: string, cloudNama: string, cloudTgl: string) => {
      // 1. Cocokkan ID persis
      if (cloudId && localMap.has(cloudId)) {
        return localMap.get(cloudId);
      }

      // 2. Cocokkan Nama Kegiatan (agar format ID lama seperti K-080926-01-A otomatis bermigrasi ke KEG-2609-01-A)
      const cleanNama = cloudNama.trim().toLowerCase();
      if (cleanNama) {
        const found = localList.find((l) => {
          const lNama = String(l.namaKegiatan || "").trim().toLowerCase();
          const lTgl = cleanIsoDate(l.tanggalSpd);
          return lNama === cleanNama && (!cloudTgl || !lTgl || lTgl === cloudTgl);
        });
        if (found) return found;
      }

      return undefined;
    };

    const parsedList: SavedKegiatan[] = cloudKegiatanList.map((item) => {
      const idKegiatan = String(item.id_kegiatan || "").trim();
      const namaKegiatan = String(item.nama_kegiatan || "Kegiatan Dinas").trim();
      const rawTanggalSpd = cleanIsoDate(item.tanggal_spd || item.tanggal_mulai);
      const existingLocal = findMatchingLocal(idKegiatan, namaKegiatan, rawTanggalSpd);

      // Cari baris DB_PESERTA yang cocok dengan id_kegiatan
      const matchingPeserta = pesertaRows.filter((p) => {
        const pIdKgt = String(p.id_kegiatan || "").trim();
        return pIdKgt === idKegiatan || (pIdKgt && pIdKgt === String(item.kode_kegiatan || "").trim());
      });

      // Cari baris rekap yang memiliki nama kegiatan yang sama
      const matchingRekap = rekapRows.filter((r) => {
        const rowKgt = String(r["Nama Kegiatan"] || "").trim();
        return rowKgt === namaKegiatan;
      });

      // Cari baris memo yang mencatat kegiatan ini
      const matchingMemo = memoRows.find(
        (m) =>
          (idKegiatan && String(m.id_kegiatan_ref || m.id_kegiatan || "").trim() === idKegiatan) ||
          (namaKegiatan && String(m.perihal || m.Perihal || "").trim().toLowerCase() === namaKegiatan.toLowerCase())
      );

      // 1. PRIORITAS UTAMA: Jika baris DB_KEGIATAN memiliki payload_json yang lengkap dan utuh
      const rawPayload = item.payload_json || item.payloadJson || item.PAYLOAD_JSON;
      if (rawPayload && typeof rawPayload === "string" && rawPayload.trim().startsWith("{")) {
        try {
          const parsed = JSON.parse(rawPayload);
          if (parsed && (parsed.idKegiatan || parsed.header) && Array.isArray(parsed.rows)) {
            const cleanTglSpd = cleanIsoDate(parsed.tanggalSpd || parsed.header?.tanggalSpd || item.tanggal_spd || rawTanggalSpd);
            const cleanTglMemo = cleanIsoDate(parsed.header?.tanggalMemo || item.tanggal_memo || cleanTglSpd, cleanTglSpd);

            // Periksa perihal memo: jangan biarkan terisi judul kegiatan yang panjang
            let ketMemo = String(
              parsed.header?.keteranganMemo ||
              (item.perihal && item.perihal !== namaKegiatan ? item.perihal : "") ||
              item.keterangan_memo ||
              existingLocal?.header?.keteranganMemo ||
              ""
            ).trim();
            if (!ketMemo || ketMemo.toLowerCase() === namaKegiatan.toLowerCase() || ketMemo.toLowerCase() === "rampung") {
              ketMemo = "Permintaan Pembayaran Langsung (LS) Perjalanan Dinas";
            }

            // Periksa nomor memo: jika kosong, ambil dari master memo
            let noMemo = String(parsed.header?.nomorMemo || item.nomor_memo || existingLocal?.header?.nomorMemo || "").trim();
            if ((!noMemo || noMemo.includes("xxx")) && matchingMemo) {
              noMemo = String(matchingMemo.format_lengkap || matchingMemo["No. Memo"] || matchingMemo.noMemo || noMemo);
            }

            // Periksa item detail & komponen
            const itmDetail = String(parsed.header?.itemDetail || item.item_detail || existingLocal?.header?.itemDetail || "001").trim();
            const itmObj = getItemDetailByKode(itmDetail);
            const noKomp = String(parsed.header?.nomorKomp || item.kode_komponen || existingLocal?.header?.nomorKomp || itmObj?.kodeKomponen || "CL.7458.ABR.006.075.EE").trim();
            const detKomp = String(parsed.header?.detailKomponen || item.detail_komponen || existingLocal?.header?.detailKomponen || itmObj?.nama || getKomponenName(noKomp) || "").trim();
            const noMak = String(parsed.header?.nomorMak || item.kode_mak || matchingMemo?.MAK || matchingMemo?.mak || existingLocal?.header?.nomorMak || itmObj?.kodeMak || "524111").trim();
            const ketItmDetail = String(parsed.header?.keteranganItemDetail || item.keterangan_item_detail || existingLocal?.header?.keteranganItemDetail || itmObj?.nama || "").trim();

            // Periksa nomor Surat Tugas
            const stMaster = String(
              parsed.header?.nomorStMaster ||
              parsed.header?.nomorStStaff ||
              item.nomor_st_master ||
              item.nomor_st_staf ||
              matchingPeserta[0]?.nomor_st_assigned ||
              matchingRekap[0]?.["No Surat Tugas"] ||
              existingLocal?.header?.nomorStMaster ||
              ""
            ).trim();
            const stStaff = String(parsed.header?.nomorStStaff || stMaster || existingLocal?.header?.nomorStStaff || "").trim();

            const normalizedHeader: HeaderData = {
              idKegiatan: parsed.idKegiatan || idKegiatan,
              kategoriSpj: parsed.header?.kategoriSpj || parsed.kategori || "A",
              noKegiatanUrut: parsed.header?.noKegiatanUrut || idKegiatan.split("-")[2] || "001",
              keteranganKegiatan: parsed.header?.keteranganKegiatan || parsed.namaKegiatan || namaKegiatan,
              keteranganMemo: ketMemo,
              provinsiTujuan: parsed.header?.provinsiTujuan || parsed.provinsiTujuan || String(item.provinsi_tujuan || "JAWA BARAT"),
              kotaTujuanList: Array.isArray(parsed.header?.kotaTujuanList) && parsed.header.kotaTujuanList.length > 0
                ? parsed.header.kotaTujuanList
                : [parsed.kotaTujuan || ""],
              unitKerja: parsed.header?.unitKerja || String(item.unit_kerja || "INSPEKTORAT"),
              picInisiator: parsed.header?.picInisiator || String(item.ppk_nama || "Arif Wibowo, S.H., M.H."),
              bendahara: parsed.header?.bendahara || String(item.bendahara_nama || "Raka Panji Wibowo, S.Kom, NIP. 19950408202012 1 001"),
              petugasVerifikasi: parsed.header?.petugasVerifikasi || String(item.verifikator_nama || "Noviarty Ningsi Sumirat, S.E, NIP. 19811112201001 2 001"),
              nomorKomp: noKomp,
              detailKomponen: detKomp,
              nomorMak: noMak,
              itemDetail: itmDetail,
              keteranganItemDetail: ketItmDetail,
              alatAngkut: parsed.header?.alatAngkut || String(item.alat_angkut || "Angkutan Darat"),
              tanggalSpd: cleanTglSpd,
              tanggalMemo: cleanTglMemo,
              nomorMemo: noMemo,
              nomorStMaster: stMaster,
              nomorStStaff: stStaff,
              nomorStPejabat: parsed.header?.nomorStPejabat || stMaster,
              useDifferentStPejabat: Boolean(parsed.header?.useDifferentStPejabat ?? item.use_different_st_pejabat),
              ppkNama: parsed.header?.ppkNama || String(item.ppk_nama || "Arif Wibowo, S.H., M.H."),
              ppkNip: parsed.header?.ppkNip || String(item.ppk_nip || "19830124200801 1 006"),
              ppkJabatan: parsed.header?.ppkJabatan || "Kepala Bagian Tata Usaha Inspektorat",
              penanggungJawabNama: parsed.header?.penanggungJawabNama || String(item.penanggung_jawab_nama || "Reni Sutaryo, S.Si., M.Adm.Pemb"),
              penanggungJawabNip: parsed.header?.penanggungJawabNip || String(item.penanggung_jawab_nip || "19791126200604 2 014"),
              penanggungJawabJabatan: parsed.header?.penanggungJawabJabatan || String(item.penanggung_jawab_jabatan || "Inspektur"),
              jenisPengajuan: (parsed.header?.jenisPengajuan || item.jenis_pengajuan || "RAMPUNG") as HeaderData["jenisPengajuan"],
              noSpm: parsed.header?.noSpm || String(item.no_spm || ""),
              noSpby: parsed.header?.noSpby || String(item.no_spby || ""),
              jenisPerdin: (parsed.header?.jenisPerdin || item.jenis_perdin || "Perdin Luar Kota") as HeaderData["jenisPerdin"],
              berangkatDari: parsed.header?.berangkatDari || String(item.berangkat_dari || "Jakarta"),
            };

            const normalizedRows: ParticipantRow[] = (parsed.rows as ParticipantRow[]).map((r, rIdx) => ({
              ...r,
              id: String(r.id || rIdx + 1),
              tanggalMulai: cleanIsoDate(r.tanggalMulai, cleanTglSpd),
              tanggalSelesai: cleanIsoDate(r.tanggalSelesai, cleanTglSpd),
              checkInHotel: r.checkInHotel ? cleanIsoDate(r.checkInHotel, cleanTglSpd) : undefined,
              checkOutHotel: r.checkOutHotel ? cleanIsoDate(r.checkOutHotel, cleanTglSpd) : undefined,
            }));

            return {
              idKegiatan: parsed.idKegiatan || idKegiatan,
              kategori: parsed.kategori || normalizedHeader.kategoriSpj || "A",
              namaKegiatan: parsed.namaKegiatan || namaKegiatan,
              tanggalSpd: cleanTglSpd,
              kotaTujuan: parsed.kotaTujuan || (normalizedHeader.kotaTujuanList?.[0] || ""),
              provinsiTujuan: parsed.provinsiTujuan || normalizedHeader.provinsiTujuan || "JAWA BARAT",
              jumlahPeserta: normalizedRows.length,
              grandTotal: parsed.grandTotal || normalizedRows.reduce((acc, r) => acc + (r.totalJumlah || 0), 0),
              header: normalizedHeader,
              rows: normalizedRows,
              activeCols: parsed.activeCols,
              activeUh: parsed.activeUh,
              updatedAt: parsed.updatedAt || new Date().toISOString(),
            };
          }
        } catch {
          // ignore parsing error and proceed to fallback
        }
      }

      // 2. FALLBACK RECONSTRUCTION (Jika baris belum memiliki payload_json / data lama):
      let kategori: "A" | "NA" | "B" = "A";
      if (idKegiatan.endsWith("-NA") || idKegiatan.endsWith("-B")) {
        kategori = "NA";
      } else if (idKegiatan.endsWith("-A")) {
        kategori = "A";
      } else {
        const hasExternal = matchingRekap.some((r) => Boolean(r["NAMA EXTERNAL"])) || matchingPeserta.some((p) => Boolean(p.spj_nama_external || p.namaExternal));
        kategori = hasExternal ? "NA" : "A";
      }

      const tanggalSpd = cleanIsoDate(item.tanggal_spd || item.tanggal_mulai || matchingPeserta[0]?.tanggal_mulai || matchingRekap[0]?.["Tgl Berangkat"] || rawTanggalSpd);
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
      const jumlahPeserta = matchingPeserta.length > 0 ? matchingPeserta.length : (matchingRekap.length > 0 ? matchingRekap.length : 1);

      // Reconstruct rows dari DB_PESERTA (yang menyimpan detail riilItems lengkap), atau fallback ke REKAP
      const reconstructedRows: ParticipantRow[] =
        matchingPeserta.length > 0
          ? matchingPeserta.map((p, idx) => pesertaRowToParticipant(p, idx))
          : matchingRekap.length > 0
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
                nomorSt: String(item.nomor_st_master || item.nomor_st_staf || ""),
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

      // Reconstruct ST, Memo, dan DIPA
      const nomorStRecovered = String(
        item.nomor_st_master ||
        item.nomor_st_staf ||
        matchingPeserta[0]?.nomor_st_assigned ||
        matchingRekap[0]?.["No Surat Tugas"] ||
        existingLocal?.header?.nomorStMaster ||
        ""
      );

      const nomorMemoRecovered = String(
        item.nomor_memo && item.nomor_memo !== "xxx"
          ? item.nomor_memo
          : matchingMemo?.format_lengkap || matchingMemo?.["No. Memo"] || matchingMemo?.noMemo || existingLocal?.header?.nomorMemo || ""
      );

      let itemDetailCode = String(item.item_detail || existingLocal?.header?.itemDetail || "").trim();
      if (!itemDetailCode || itemDetailCode === "001") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (matchingPeserta[0] && (matchingPeserta[0] as any).item_detail && (matchingPeserta[0] as any).item_detail !== "001") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          itemDetailCode = String((matchingPeserta[0] as any).item_detail).trim();
        }
      }
      if (!itemDetailCode) itemDetailCode = "001";

      const itDetailObj = getItemDetailByKode(itemDetailCode);

      const kodeMak = String(
        (item.kode_mak && item.kode_mak !== "524111" ? item.kode_mak : "") ||
        matchingMemo?.MAK ||
        matchingMemo?.mak ||
        item.kode_mak ||
        existingLocal?.header?.nomorMak ||
        itDetailObj?.kodeMak ||
        "524111"
      ).trim();

      const kodeKomponen = String(
        item.kode_komponen ||
        existingLocal?.header?.nomorKomp ||
        itDetailObj?.kodeKomponen ||
        "CL.7458.ABR.006.075.EE"
      ).trim();

      const detailKomponen = String(
        item.detail_komponen ||
        existingLocal?.header?.detailKomponen ||
        itDetailObj?.nama ||
        getKomponenName(kodeKomponen) ||
        ""
      ).trim();

      const keteranganItemDetail = String(
        item.keterangan_item_detail ||
        existingLocal?.header?.keteranganItemDetail ||
        itDetailObj?.nama ||
        ""
      ).trim();

      let keteranganMemo = String(
        (item.perihal && item.perihal !== namaKegiatan ? item.perihal : "") ||
        item.keterangan_memo ||
        item.keteranganMemo ||
        (existingLocal && existingLocal.header?.keteranganMemo) ||
        ""
      ).trim();
      if (!keteranganMemo || keteranganMemo.toLowerCase() === namaKegiatan.toLowerCase() || keteranganMemo.toLowerCase() === "rampung") {
        keteranganMemo = "Permintaan Pembayaran Langsung (LS) Perjalanan Dinas";
      }

      // Reconstruct HeaderData
      const reconstructedHeader: HeaderData = {
        idKegiatan,
        kategoriSpj: kategori,
        noKegiatanUrut: idKegiatan.split("-")[2] || "001",
        keteranganKegiatan: namaKegiatan,
        keteranganMemo,
        provinsiTujuan,
        kotaTujuanList: kotaTujuan ? [kotaTujuan] : [""],
        unitKerja: String(item.unit_kerja || "INSPEKTORAT"),
        picInisiator: String(item.ppk_nama || "Arif Wibowo, S.H., M.H."),
        bendahara: String(item.bendahara_nama || "Raka Panji Wibowo, S.Kom, NIP. 19950408202012 1 001"),
        petugasVerifikasi: String(item.verifikator_nama || "Noviarty Ningsi Sumirat, S.E, NIP. 19811112201001 2 001"),
        nomorKomp: kodeKomponen,
        detailKomponen,
        nomorMak: kodeMak,
        itemDetail: itemDetailCode,
        keteranganItemDetail,
        alatAngkut: String(item.alat_angkut || "Angkutan Darat"),
        tanggalSpd,
        tanggalMemo: cleanIsoDate(item.tanggal_memo || matchingMemo?.tanggal_memo || matchingMemo?.tanggal || item.tanggal_spd, tanggalSpd),
        nomorMemo: nomorMemoRecovered,
        nomorStMaster: nomorStRecovered,
        nomorStStaff: nomorStRecovered,
        nomorStPejabat: String(item.nomor_st_pejabat || nomorStRecovered),
        useDifferentStPejabat: Boolean(item.use_different_st_pejabat),
        ppkNama: String(item.ppk_nama || "Arif Wibowo, S.H., M.H."),
        ppkNip: String(item.ppkNip || item.ppk_nip || "19830124200801 1 006"),
        ppkJabatan: "Kepala Bagian Tata Usaha Inspektorat",
        penanggungJawabNama: String(item.penanggung_jawab_nama || "Reni Sutaryo, S.Si., M.Adm.Pemb"),
        penanggungJawabNip: String(item.penanggung_jawab_nip || "19791126200604 2 014"),
        penanggungJawabJabatan: String(item.penanggung_jawab_jabatan || "Inspektur"),
        jenisPengajuan: (item.jenis_pengajuan || "RAMPUNG") as HeaderData["jenisPengajuan"],
        noSpm: String(item.no_spm || ""),
        noSpby: String(item.no_spby || ""),
        jenisPerdin: (item.jenis_perdin || "Perdin Luar Kota") as HeaderData["jenisPerdin"],
        berangkatDari: String(item.berangkat_dari || "Jakarta"),
      };

      const hasRiil = reconstructedRows.some((r) => (r.pengRill || 0) > 0 || (Array.isArray(r.riilItems) && r.riilItems.length > 0));
      const hasTiket = reconstructedRows.some((r) => (r.tiket || 0) > 0);
      const hasHotel = reconstructedRows.some((r) => (r.hotel || 0) > 0);
      const hasPenginapan30 = reconstructedRows.some((r) => (r.penginapan30 || 0) > 0);
      const hasTransDarat = reconstructedRows.some((r) => (r.transportasiDarat || 0) > 0);
      const hasTransLokal = reconstructedRows.some((r) => (r.transportasiLokal || 0) > 0);
      const hasTransJkt = reconstructedRows.some((r) => (r.transportJakartaPp || 0) > 0);
      const hasTransDaerah = reconstructedRows.some((r) => (r.transportDaerahPp || 0) > 0);
      const hasMeeting = reconstructedRows.some((r) => (r.fullboardMeeting || 0) > 0 || (r.fulldayMeeting || 0) > 0);
      const hasRepresentatif = reconstructedRows.some((r) => (r.representatif || 0) > 0);

      const hasUhBiasa = reconstructedRows.some((r) => (r.hariUhBiasa || 0) > 0 || (r.biayaUhBiasa || 0) > 0);
      const hasUh60 = reconstructedRows.some((r) => (r.hariUhBiasa60 || 0) > 0 || (r.biayaUhBiasa60 || 0) > 0);
      const hasUh40 = reconstructedRows.some((r) => (r.hariUhBiasa40 || 0) > 0 || (r.biayaUhBiasa40 || 0) > 0);
      const hasUhHalfday = reconstructedRows.some((r) => (r.hariUhHalfday || 0) > 0 || (r.biayaUhHalfday || 0) > 0);
      const hasUhFullboard = reconstructedRows.some((r) => (r.hariUhFullboard || 0) > 0 || (r.biayaUhFullboard || 0) > 0);

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
          tiket: hasTiket,
          dukunganTransportasi: false,
          transportasiDarat: hasTransDarat,
          transportasiLokal: hasTransLokal,
          transportJakartaPp: hasTransJkt,
          transportDaerahPp: hasTransDaerah,
          pengRill: hasRiil,
          hotel: hasHotel,
          penginapan30: hasPenginapan30,
          fulldayMeeting: false,
          fullboardMeeting: hasMeeting,
          representatif: hasRepresentatif,
          belanjaBahan: false,
        },
        activeUh: {
          uhBiasa: hasUhBiasa || (!hasUh60 && !hasUh40 && !hasUhHalfday && !hasUhFullboard),
          uhBiasa60: hasUh60,
          uhBiasa40: hasUh40,
          uhHalfday: hasUhHalfday,
          uhFullboard: hasUhFullboard,
        },
      };
    });

    // parsedList adalah daftar kegiatan resmi dari Google Spreadsheet yang sudah menyerap detail lokal.
    // Jika ada kegiatan lokal yang benar-benar baru dan belum pernah disinkronkan ke cloud:
    const cloudNames = new Set(parsedList.map((p) => String(p.namaKegiatan || "").trim().toLowerCase()));
    const cloudIds = new Set(parsedList.map((p) => String(p.idKegiatan || "").trim()));

    const trulyNewLocalDrafts = localList.filter((l) => {
      const lId = String(l.idKegiatan || "").trim();
      const lNama = String(l.namaKegiatan || "").trim().toLowerCase();
      if (cloudIds.has(lId)) return false;
      if (cloudNames.has(lNama)) return false;
      return true;
    });

    const mergedKegiatanList = [...parsedList, ...trulyNewLocalDrafts];

    // Simpan ke localStorage agar offline / subsequent render cepat
    if (typeof window !== "undefined") {
      localStorage.setItem("perdin_saved_kegiatan_list", JSON.stringify(mergedKegiatanList));
      window.dispatchEvent(new CustomEvent("kegiatan-list-updated", { detail: { updatedList: mergedKegiatanList } }));
    }

    return {
      success: true,
      data: mergedKegiatanList,
      message: `Berhasil memuat ${mergedKegiatanList.length} paket kegiatan dari Google Spreadsheet.`,
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
  customUrl?: string,
  oldIdKegiatan?: string,
  options?: {
    activeCols?: Record<string, boolean>;
    activeUh?: Record<string, boolean>;
  }
): Promise<{ success: boolean; message: string; idKegiatan?: string }> {
  const url = customUrl || getGasApiUrl();

  const idKegiatan =
    header.idKegiatan ||
    generateIdKegiatan(
      header.tanggalSpd,
      header.noKegiatanUrut || "001",
      header.kategoriSpj || "A"
    );

  const validParticipants = participants.filter(
    (p) => Boolean((p.nama && p.nama.trim() !== "") || (p.namaExternal && p.namaExternal.trim() !== ""))
  );

  const grandTotal = validParticipants.reduce((sum, p) => sum + (p.totalJumlah || 0), 0);

  const cleanTglSpd = cleanIsoDate(header.tanggalSpd);
  const cleanTglMemo = cleanIsoDate(header.tanggalMemo || cleanTglSpd, cleanTglSpd);

  const memoPerihalVal = header.keteranganMemo || "Permintaan Pembayaran Langsung (LS) Perjalanan Dinas";

  const fullSnapshot: SavedKegiatan = {
    idKegiatan,
    kategori: (header.kategoriSpj === "NA" || (header.kategoriSpj as string) === "B" ? "NA" : "A") as "A" | "NA" | "B",
    namaKegiatan: header.keteranganKegiatan || "Kegiatan Dinas",
    tanggalSpd: cleanTglSpd,
    kotaTujuan: header.kotaTujuanList?.[0] || "",
    provinsiTujuan: header.provinsiTujuan || "JAWA BARAT",
    jumlahPeserta: validParticipants.length,
    grandTotal,
    header: {
      ...header,
      idKegiatan,
      tanggalSpd: cleanTglSpd,
      tanggalMemo: cleanTglMemo,
      keteranganMemo: memoPerihalVal,
    },
    rows: validParticipants.map((p) => ({
      ...p,
      tanggalMulai: cleanIsoDate(p.tanggalMulai, cleanTglSpd),
      tanggalSelesai: cleanIsoDate(p.tanggalSelesai, cleanTglSpd),
      checkInHotel: p.checkInHotel ? cleanIsoDate(p.checkInHotel, cleanTglSpd) : undefined,
      checkOutHotel: p.checkOutHotel ? cleanIsoDate(p.checkOutHotel, cleanTglSpd) : undefined,
    })),
    activeCols: options?.activeCols,
    activeUh: options?.activeUh,
    updatedAt: new Date().toISOString(),
  };

  const payload = {
    action: "SAVE_PERDIN",
    header: {
      idKegiatan,
      oldIdKegiatan: oldIdKegiatan || idKegiatan,
      kodeKegiatan: header.nomorKomp || "PRD-" + Date.now(),
      namaKegiatan: header.keteranganKegiatan || "Perjalanan Dinas Inspektorat",
      jenisPengajuan: header.jenisPengajuan || "RAMPUNG",
      noSpm: header.noSpm || "",
      noSpby: header.noSpby || "",
      jenisPerdin: header.jenisPerdin || "Perdin Luar Kota",
      berangkatDari: header.berangkatDari || "Jakarta",
      provinsiTujuan: header.provinsiTujuan || "JAWA BARAT",
      kotaTujuanList: header.kotaTujuanList || [],
      tanggalMulai: validParticipants[0]?.tanggalMulai ? cleanIsoDate(validParticipants[0].tanggalMulai, cleanTglSpd) : cleanTglSpd,
      tanggalSelesai: validParticipants[0]?.tanggalSelesai ? cleanIsoDate(validParticipants[0].tanggalSelesai, cleanTglSpd) : cleanTglSpd,
      alatAngkut: header.alatAngkut || "Angkutan Darat",
      nomorStMaster: header.nomorStMaster || "",
      nomorStStaff: header.nomorStStaff || header.nomorStMaster || "",
      nomorStPejabat: header.nomorStPejabat || header.nomorStMaster || "",
      useDifferentStPejabat: header.useDifferentStPejabat || false,
      nomorMemo: header.nomorMemo || "",
      tanggalMemo: cleanTglMemo,
      perihal: memoPerihalVal,
      keteranganMemo: memoPerihalVal,
      tanggalSpd: cleanTglSpd,
      kodeMak: header.nomorMak || "524111",
      kodeKomponen: header.nomorKomp || "CL.7458.ABR.006.075.EE",
      detailKomponen: header.detailKomponen || "",
      itemDetail: header.itemDetail || "001",
      keteranganItemDetail: header.keteranganItemDetail || "",
      unitKerja: header.unitKerja || "INSPEKTORAT",
      ppkNama: header.ppkNama || "",
      ppkNip: header.ppkNip || "",
      ppkJabatan: header.ppkJabatan || "",
      bendaharaNama: header.bendahara || "",
      verifikatorNama: header.petugasVerifikasi || "",
      penanggungJawabNama: header.penanggungJawabNama || "",
      penanggungJawabNip: header.penanggungJawabNip || "",
      penanggungJawabJabatan: header.penanggungJawabJabatan || "",
      grandTotal,
      statusDokumen: "FINAL",
      payload_json: JSON.stringify(fullSnapshot),
    },
    fullSnapshot,
    participants: validParticipants.map((p) => ({
      pegawaiId: p.kodeNama || "",
      nomorSpd: p.nomorSpd || "01",
      nomorStAssigned: p.nomorSt || header.nomorStMaster || "",
      isPejabat: p.isPejabat || false,
      nama: p.nama,
      nip: p.nip,
      golongan: p.golongan,
      jabatan: p.jabatan,
      tujuanKota: p.tujuanKota || header.provinsiTujuan,
      tujuanProvinsi: p.tujuanProvinsi || header.provinsiTujuan || "JAWA BARAT",
      tanggalMulai: p.tanggalMulai,
      tanggalSelesai: p.tanggalSelesai,
      lamaHari: p.lamaHari,
      hariUhBiasa: p.hariUhBiasa || 0,
      biayaUhBiasa: p.biayaUhBiasa || 0,
      hariUh60: p.hariUhBiasa60 || 0,
      biayaUh60: p.biayaUhBiasa60 || 0,
      hariUh40: p.hariUhBiasa40 || 0,
      biayaUh40: p.biayaUhBiasa40 || 0,
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
            const memoRomanMonth = getMonthRoman(header.tanggalMemo) || "XI";
            const memoYear = Number(header.tanggalMemo ? new Date(header.tanggalMemo).getFullYear() : 2026) || 2026;
            const memoEntry: NomorMemo = {
              tahun_anggaran: memoYear,
              nomor_urut: numStr,
              format_lengkap: header.nomorMemo,
              tanggal_memo: header.tanggalMemo || "",
              perihal: header.keteranganMemo || header.keteranganKegiatan || "Perjalanan Dinas",
              id_kegiatan_ref: idKegiatan,
              status: "TERPAKAI",
              nominal: grandTotal,
              MAK: header.nomorMak || "524111",
              noMemo: header.nomorMemo,
              tanggal: header.tanggalMemo || "",
              mak: header.nomorMak || "524111",
              bulanRomawi: memoRomanMonth,
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

      // Perbarui nomor SPD tertinggi ke storage lokal dari peserta yang valid
      const maxSpd = validParticipants.reduce((max, p) => {
        const parsed = parseSpdNumber(p.nomorSpd);
        return Math.max(max, parsed.num);
      }, 0);
      if (maxSpd > 0) {
        saveLatestRegisteredSpdNumber(maxSpd);
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
      const cloudSpd = Number((json as any).latestSpdNumber || (json.data as any)?.latestSpdNumber);
      if (!isNaN(cloudSpd) && cloudSpd > 0) {
        saveLatestRegisteredSpdNumber(cloudSpd);
      }
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

  // Filter anti-hantu & deduplikasi sebelum simpan ke local dan cloud
  const validRows = deduplicateRekapRows(
    rekapRows.filter((r) => {
      const nama = String(r["NAMA PEGAWAI INTERNAL INSPEKTORAT"] || r["NAMA EXTERNAL"] || "").trim();
      const keg = String(r["Nama Kegiatan"] || "").trim();
      return nama !== "" || keg !== "";
    })
  );

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

/**
 * Jalankan pembersihan baris hantu di cloud spreadsheet (DB_PESERTA, REKAP_PERDIN_48KOLOM, DB_KEGIATAN)
 */
export async function pruneGhostRowsInGoogleSheet(
  customUrl?: string
): Promise<{ success: boolean; message: string }> {
  const url = customUrl || getGasApiUrl();
  try {
    const json = await executeGasRequest("POST", { action: "PRUNE_GHOST_ROWS" }, url);
    return {
      success: json.status === "success",
      message: json.message || "Pembersihan baris hantu berhasil.",
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Gagal membersihkan baris hantu: ${errMsg}` };
  }
}

/**
 * Sinkronisasi Master MAK & Item Detail ke Google Spreadsheet
 */
export async function syncMasterMakToGoogleSheet(
  customUrl?: string
): Promise<{ success: boolean; message: string }> {
  const url = customUrl || getGasApiUrl();
  try {
    const json = await executeGasRequest<{ status: string; message?: string }>(
      "POST",
      { action: "SYNC_MASTER_MAK", items: LIST_ITEM_DETAIL },
      url
    );
    return {
      success: json.status === "success",
      message: json.message || "Master MAK & Item Detail berhasil disinkronkan ke Spreadsheet.",
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `Gagal menyinkronkan Master MAK: ${errMsg}`,
    };
  }
}

