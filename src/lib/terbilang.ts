/**
 * Terbilang Generator (Indonesian Number to Words)
 * Mengonversi nominal numerik rupiah menjadi kalimat terbilang bahasa Indonesia.
 * Contoh: 15450000 -> "Lima Belas Juta Empat Ratus Lima Puluh Ribu Rupiah"
 */

const SATUAN = [
  "",
  "Satu",
  "Dua",
  "Tiga",
  "Empat",
  "Lima",
  "Enam",
  "Tujuh",
  "Delapan",
  "Sembilan",
  "Sepuluh",
  "Sebelas",
];

function angkaKeKata(n: number): string {
  if (n < 12) {
    return SATUAN[n];
  } else if (n < 20) {
    return `${angkaKeKata(n - 10)} Belas`;
  } else if (n < 100) {
    const sisa = n % 10;
    return `${angkaKeKata(Math.floor(n / 10))} Puluh ${sisa > 0 ? angkaKeKata(sisa) : ""}`.trim();
  } else if (n < 200) {
    const sisa = n - 100;
    return `Seratus ${sisa > 0 ? angkaKeKata(sisa) : ""}`.trim();
  } else if (n < 1000) {
    const sisa = n % 100;
    return `${angkaKeKata(Math.floor(n / 100))} Ratus ${sisa > 0 ? angkaKeKata(sisa) : ""}`.trim();
  } else if (n < 2000) {
    const sisa = n - 1000;
    return `Seribu ${sisa > 0 ? angkaKeKata(sisa) : ""}`.trim();
  } else if (n < 1000000) {
    const ribu = Math.floor(n / 1000);
    const sisa = n % 1000;
    return `${angkaKeKata(ribu)} Ribu ${sisa > 0 ? angkaKeKata(sisa) : ""}`.trim();
  } else if (n < 1000000000) {
    const juta = Math.floor(n / 1000000);
    const sisa = n % 1000000;
    return `${angkaKeKata(juta)} Juta ${sisa > 0 ? angkaKeKata(sisa) : ""}`.trim();
  } else if (n < 1000000000000) {
    const milyar = Math.floor(n / 1000000000);
    const sisa = n % 1000000000;
    return `${angkaKeKata(milyar)} Milyar ${sisa > 0 ? angkaKeKata(sisa) : ""}`.trim();
  } else if (n < 1000000000000000) {
    const triliun = Math.floor(n / 1000000000000);
    const sisa = n % 1000000000000;
    return `${angkaKeKata(triliun)} Triliun ${sisa > 0 ? angkaKeKata(sisa) : ""}`.trim();
  }
  return "";
}

export function terbilang(nominal: number): string {
  if (isNaN(nominal) || nominal <= 0) return "Nol Rupiah";
  const kata = angkaKeKata(Math.floor(nominal));
  return `${kata} Rupiah`;
}

export function formatRupiah(val: number): string {
  if (isNaN(val)) return "Rp 0";
  return `Rp ${val.toLocaleString("id-ID")}`;
}

export function formatAngka(val: number): string {
  if (isNaN(val)) return "0";
  return val.toLocaleString("id-ID");
}
