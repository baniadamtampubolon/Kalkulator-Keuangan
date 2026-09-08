/**
 * Master Data Kode MAK & Komponen Anggaran
 * Disarikan dari docs/KODE MAK AKUN.xlsx & kebutuhan operasional Kemenko Pangan
 */

export interface MakAkunItem {
  kode: string;
  nama: string;
  kategori?: string;
}

export interface KomponenItem {
  kode: string;
  nama: string;
  unit?: string;
}

// 13 Nomor Akun MAK standar
export const LIST_NOMOR_MAK: MakAkunItem[] = [
  { kode: "521211", nama: "Belanja Bahan", kategori: "Bahan" },
  { kode: "521213", nama: "Belanja Honor Output Kegiatan", kategori: "Honor" },
  { kode: "522141", nama: "Belanja Sewa", kategori: "Sewa" },
  { kode: "522151", nama: "Belanja Jasa Profesi", kategori: "Jasa" },
  { kode: "522191", nama: "Belanja Jasa Lainnya", kategori: "Jasa" },
  { kode: "524111", nama: "Belanja Perjalanan Dinas Biasa", kategori: "Perdin" },
  { kode: "524113", nama: "Belanja Perjalanan Dinas Dalam Kota", kategori: "Perdin" },
  { kode: "524114", nama: "Belanja Perjalanan Dinas Paket Meeting Dalam Kota", kategori: "Meeting" },
  { kode: "524119", nama: "Belanja Perjalanan Dinas Paket Meeting Luar Kota", kategori: "Meeting" },
  { kode: "522131", nama: "Belanja Jasa Konsultan", kategori: "Jasa" },
  { kode: "524211", nama: "Belanja Perjalanan Dinas Biasa - Luar Negeri", kategori: "Perdin LN" },
  { kode: "524219", nama: "Belanja Perjalanan Dinas Lainnya - Luar Negeri", kategori: "Perdin LN" },
  { kode: "521111", nama: "Belanja Keperluan Perkantoran", kategori: "Operasional" },
];

// Daftar Kode Komponen lengkap
export const LIST_NOMOR_KOMPONEN: KomponenItem[] = [
  // Kode Komponen Prioritas (Gambar 2)
  { kode: "7461.ABR.006.051.0A", nama: "Koordinasi dan Evaluasi Kebijakan Tata Niaga" },
  { kode: "7461.ABR.006.052.0A", nama: "Sinkronisasi Kebijakan Bidang Pangan" },
  { kode: "7461.ABR.006.052.AP", nama: "Alokasi Perjalanan Dinas Pimpinan" },
  { kode: "7461.ABR.006.053.0A", nama: "Koordinasi Pelaksanaan Kebijakan" },
  { kode: "WA.7457.EBA.962.962.0M", nama: "Dukungan Manajemen Kemenko Pangan" },
  { kode: "WA.7457.EBD.Z24.953.0J", nama: "Layanan Umum dan Tata Usaha" },
  { kode: "7461.ABR.006.076.AC", nama: "Monev Pengawasan Program Prioritas" },
  { kode: "7461.ABR.006.076.FF", nama: "Pendampingan Percepatan Pascabencana Alam" },
  { kode: "7461.ABR.006.076.MR", nama: "Monev MRPN Lintas Sektor" },
  { kode: "7461.ABR.006.082.AC", nama: "Koordinasi Tindak Lanjut Pengawasan" },
  { kode: "7461.ABR.006.082.FF", nama: "Fasilitasi Pengendalian Program" },

  // Komponen dari KODE MAK AKUN.xlsx
  { kode: "CL.7458.ABR.006.051.0A", nama: "Koordinasi dan Evaluasi Kebijakan Tata Niaga" },
  { kode: "CL.7458.ABR.006.051.0B", nama: "Pelaksanaan Koordinasi Tata Niaga" },
  { kode: "CL.7458.ABR.006.051.0C", nama: "Penyelesaian Tunggakan TA 2025" },
  { kode: "CL.7458.ABR.006.051.AP", nama: "Alokasi Perjalanan Dinas Pimpinan" },
  { kode: "CL.7458.ABR.006.071.AA", nama: "Monev MRPN LS Koperasi Merah Putih (KDKMP)" },
  { kode: "CL.7458.ABR.006.072.BB", nama: "Monev MRPN LS Makan Bergizi Gratis (MBG)" },
  { kode: "CL.7458.ABR.006.073.CC", nama: "Monev MRPN LS Pengelolaan Persampahan" },
  { kode: "CL.7458.ABR.006.074.DD", nama: "Monev MRPN LS Ekosistem Pangan Haji" },
  { kode: "CL.7458.ABR.006.075.EE", nama: "Koordinasi Implementasi NEK Pengendalian Emisi GRK" },
  { kode: "CL.7458.ABR.006.076.AN", nama: "Monev Pendampingan Pascabencana Alam (Aceh, Sumut, Sumbar)" },
  { kode: "CL.7458.ABR.006.076.FF", nama: "Pendampingan Pascabencana Alam" },
  { kode: "CL.7458.ABR.006.077.GG", nama: "Koordinasi Kebijakan Pengendalian Emisi GRK" },
  { kode: "WA.7457.EBD.Z30.052.0A", nama: "Tata Kelola dan Pelayanan Internal" },
];

export function getMakAkunName(kode: string): string {
  const found = LIST_NOMOR_MAK.find((m) => m.kode === kode);
  return found ? found.nama : "";
}

export function getKomponenName(kode: string): string {
  const found = LIST_NOMOR_KOMPONEN.find((k) => k.kode === kode);
  return found ? found.nama : "";
}

export interface MakHierarchyDetail {
  kegOutputCode: string;
  kegOutputUraian: string;
  komponenCode: string;
  komponenUraian: string;
  subKomponenCode: string;
  subKomponenUraian: string;
  akunCode: string;
  akunUraian: string;
}

const KOMP_DICT: Record<string, string> = {
  "051": "Sinkronisasi kebijakan Bidang Koordinasi Tata Niaga dan Distribusi Pangan",
  "052": "Sinkronisasi Kebijakan Bidang Ketersediaan dan Pangan Berkelanjutan",
  "053": "Koordinasi Pelaksanaan Kebijakan Tata Niaga",
  "071": "Monev Implementasi MRLNLS Bidang Pangan Terkait KDKMP",
  "072": "Monev Implementasi MRPN LS Bidang Pangan Terkait Makan Bergizi Gratis",
  "073": "Monev Implementasi MRPN LS Bidang Pangan Terkait Pengendalian Persampahan",
  "074": "Monev Implementasi MRPN LS Bidang Pangan Terkait Ekosistem Pangan Haji",
  "075": "Monev dan Sinkronisasi, Koordinasi dan Pengendalian MRPN LS Bidang Pangan Terkait Nilai Ekonomi Karbon",
  "076": "Monev dan Sinkronisasi , Koordinasi dan Pengendalian Program MRPN LS Bidang Pangan Terkait Percepatan Rehabilitasi dan Rekonstruksi Pasca Bencana Alam",
  "077": "Monev Implementasi MRPN LS Bidang Pangan Terkait Pengendalian Emisi Gas Rumah Kaca",
  "082": "Koordinasi dan Pengendalian Tindak Lanjut Pengawasan",
  "962": "Dukungan Manajemen Kemenko Pangan",
};

const SUB_KOMP_DICT: Record<string, string> = {
  "051.0A": "Koordinasi dan Evaluasi Kebijakan Bidang Koordinasi Tata Niaga dan DistribusiPangan",
  "051.0B": "Pelaksanaan",
  "051.0C": "Penyelesaian Tunggakan TA 2025",
  "051.AP": "Alokasi Perjalanan Dinas Pimpinan",
  "071.AA": "Monev Implementasi MRLNLS Bidang Pangan Terkait KDKMP",
  "072.BB": "Monev Implementasi MRPN LS Bidang Pangan Terkait Makan Bergizi Gratis",
  "073.CC": "MONEV IMPLEMENTASI MRPN LS BIDANG PANGAN TERKAIT PENGELOLAAN PERSAMPAHAN",
  "074.DD": "MONEV IMPLEMENTASI MRPN LS BIDANG PANGAN TERKAIT EKOSISTEM PANGAN HAJI",
  "075.EE": "Koordinasi Implementasi NEK  Pengendalian Emisi GRK",
  "076.AN": "Monev MRPN Pendampingan Percepatan Rehabilitasi dan Rekonstruksi Pascabencana Alam di Provinsi Aceh, Provinsi Sumatera Utara, dan Provinsi Sumatera Barat",
  "076.FF": "Pendampingan Percepatan Rehabilitasi dan Rekonstruksi Pascabencana Alam",
  "076.MR": "Monev Implementasi MRPN LS Bidang Pangan",
  "076.AC": "Monev Pengawasan Program Prioritas",
  "077.GG": "Koordinasi Kebijakan Pengendalian Emisi GRK",
  "082.AC": "Koordinasi Tindak Lanjut Pengawasan",
  "082.FF": "Fasilitasi Pengendalian Program",
  "962.0M": "Dukungan Manajemen Operasional",
  "Z24.953.0J": "Layanan Umum dan Tata Usaha",
  "Z24.0J": "Layanan Umum dan Tata Usaha",
};

export function parseMakHierarchy(nomorKompRaw: string, nomorMakRaw: string): MakHierarchyDetail {
  const cleanKomp = (nomorKompRaw || "7458.ABR.006.071.AA").trim();
  const akunCode = (nomorMakRaw || "524111").trim();
  const akunUraian = getMakAkunName(akunCode) || "Belanja Perjalanan Dinas Biasa";

  // Split tokens by "."
  const rawTokens = cleanKomp.split(".").filter(Boolean);
  // Strip leading non-numeric prefix like CL or WA if present for kegOutput
  const tokens =
    rawTokens[0] && isNaN(Number(rawTokens[0])) && !rawTokens[0].match(/^\d/)
      ? rawTokens.slice(1)
      : rawTokens;

  let kegOutputCode = "7458.ABR.006";
  let komponenCode = "071.";
  let subKomponenCode = "AA";

  if (tokens.length >= 5) {
    kegOutputCode = `${tokens[0]}.${tokens[1]}.${tokens[2]}`;
    komponenCode = `${tokens[3]}.`;
    subKomponenCode = tokens[4];
  } else if (tokens.length === 4) {
    kegOutputCode = `${tokens[0]}.${tokens[1]}`;
    komponenCode = `${tokens[2]}.`;
    subKomponenCode = tokens[3];
  } else if (tokens.length >= 2) {
    kegOutputCode = tokens.slice(0, tokens.length - 2).join(".") || tokens[0];
    komponenCode = `${tokens[tokens.length - 2]}.`;
    subKomponenCode = tokens[tokens.length - 1];
  }

  // Determine descriptions
  let kegOutputUraian =
    "Rekomendasi Kebijakan Program Prioritas Nasional Bidang Tata Niaga dan Distribusi Pangan";
  if (kegOutputCode.includes("EBA") || kegOutputCode.includes("962")) {
    kegOutputUraian = "Layanan Dukungan Manajemen Internal Kemenko Pangan";
  } else if (kegOutputCode.includes("EBD") || kegOutputCode.includes("Z24")) {
    kegOutputUraian = "Layanan Umum dan Tata Usaha Kemenko Pangan";
  }

  const rawKompNum = komponenCode.replace(/\.$/, "");
  const komponenUraian = KOMP_DICT[rawKompNum] || `Monev dan Koordinasi Bidang ${rawKompNum}`;

  const subKeyWithKomp = `${rawKompNum}.${subKomponenCode}`;
  const subKomponenUraian =
    SUB_KOMP_DICT[subKeyWithKomp] ||
    SUB_KOMP_DICT[subKomponenCode] ||
    komponenUraian;

  return {
    kegOutputCode,
    kegOutputUraian,
    komponenCode,
    komponenUraian,
    subKomponenCode,
    subKomponenUraian,
    akunCode,
    akunUraian,
  };
}

