/**
 * Standar Penjenjangan Pangkat & Golongan Ruang Pegawai Negeri Sipil (PNS / ASN)
 * Sesuai Peraturan Pemerintah tentang Pembinaan Karier & Manajemen PNS
 */

export interface PangkatGolonganInfo {
  golongan: string; // Format garis miring standar (e.g. "III/a")
  golonganKode: string; // Format tanpa garis miring (e.g. "IIIa")
  golonganLabel: string; // Label resmi (e.g. "Golongan IIIa")
  pangkat: string; // Nama pangkat resmi (e.g. "Penata Muda")
  tingkat: "Juru" | "Pengatur" | "Penata" | "Pembina";
}

export const LIST_PANGKAT_GOLONGAN: PangkatGolonganInfo[] = [
  { golongan: "I/a", golonganKode: "Ia", golonganLabel: "Golongan Ia", pangkat: "Juru Muda", tingkat: "Juru" },
  { golongan: "I/b", golonganKode: "Ib", golonganLabel: "Golongan Ib", pangkat: "Juru Muda Tingkat I", tingkat: "Juru" },
  { golongan: "I/c", golonganKode: "Ic", golonganLabel: "Golongan Ic", pangkat: "Juru", tingkat: "Juru" },
  { golongan: "I/d", golonganKode: "Id", golonganLabel: "Golongan Id", pangkat: "Juru Tingkat I", tingkat: "Juru" },
  { golongan: "II/a", golonganKode: "IIa", golonganLabel: "Golongan IIa", pangkat: "Pengatur Muda", tingkat: "Pengatur" },
  { golongan: "II/b", golonganKode: "IIb", golonganLabel: "Golongan IIb", pangkat: "Pengatur Muda Tingkat I", tingkat: "Pengatur" },
  { golongan: "II/c", golonganKode: "IIc", golonganLabel: "Golongan IIc", pangkat: "Pengatur", tingkat: "Pengatur" },
  { golongan: "II/d", golonganKode: "IId", golonganLabel: "Golongan IId", pangkat: "Pengatur Tingkat I", tingkat: "Pengatur" },
  { golongan: "III/a", golonganKode: "IIIa", golonganLabel: "Golongan IIIa", pangkat: "Penata Muda", tingkat: "Penata" },
  { golongan: "III/b", golonganKode: "IIIb", golonganLabel: "Golongan IIIb", pangkat: "Penata Muda Tingkat I", tingkat: "Penata" },
  { golongan: "III/c", golonganKode: "IIIc", golonganLabel: "Golongan IIIc", pangkat: "Penata", tingkat: "Penata" },
  { golongan: "III/d", golonganKode: "IIId", golonganLabel: "Golongan IIId", pangkat: "Penata Tingkat I", tingkat: "Penata" },
  { golongan: "IV/a", golonganKode: "IVa", golonganLabel: "Golongan IVa", pangkat: "Pembina", tingkat: "Pembina" },
  { golongan: "IV/b", golonganKode: "IVb", golonganLabel: "Golongan IVb", pangkat: "Pembina Tingkat I", tingkat: "Pembina" },
  { golongan: "IV/c", golonganKode: "IVc", golonganLabel: "Golongan IVc", pangkat: "Pembina Utama Muda", tingkat: "Pembina" },
  { golongan: "IV/d", golonganKode: "IVd", golonganLabel: "Golongan IVd", pangkat: "Pembina Utama Madya", tingkat: "Pembina" },
  { golongan: "IV/e", golonganKode: "IVe", golonganLabel: "Golongan IVe", pangkat: "Pembina Utama", tingkat: "Pembina" },
];

/**
 * Cari nama pangkat otomatis berdasarkan kode golongan (e.g. "III/a" atau "IIIa" -> "Penata Muda")
 */
export function getPangkatByGolongan(gol: string): string {
  if (!gol) return "";
  const clean = gol.trim().toLowerCase().replace(/\s+/g, "").replace(/\//g, "");
  const match = LIST_PANGKAT_GOLONGAN.find((item) => {
    const itemClean = item.golongan.toLowerCase().replace(/\//g, "");
    return itemClean === clean || item.golonganKode.toLowerCase() === clean || item.golongan.toLowerCase() === gol.trim().toLowerCase();
  });
  return match ? match.pangkat : "";
}

/**
 * Cari kode golongan bersih (e.g. "IIb", "IIIa") berdasarkan nama pangkat
 */
export function getGolonganKodeByPangkat(pangkatStr: string): string {
  if (!pangkatStr) return "";
  const clean = pangkatStr.trim().toLowerCase();
  const match = LIST_PANGKAT_GOLONGAN.find(
    (item) => item.pangkat.toLowerCase() === clean
  );
  return match ? match.golonganKode : "";
}

/**
 * Cari kode golongan standar garis miring (e.g. "Pembina" -> "IV/a")
 */
export function getGolonganByPangkat(pangkatStr: string): string {
  if (!pangkatStr) return "";
  const clean = pangkatStr.trim().toLowerCase();
  const match = LIST_PANGKAT_GOLONGAN.find(
    (item) => item.pangkat.toLowerCase() === clean
  );
  return match ? match.golongan : "";
}
