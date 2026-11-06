import { PengadaanItemRow, PengadaanTaxConfig, SpjDocType } from "./types";

export interface SpjTypeMetadata {
  id: SpjDocType;
  label: string;
  shortLabel: string;
  badgeColor: string;
  description: string;
  defaultMak: string;
  defaultKomp: string;
  defaultDetailKomp: string;
  defaultPerihalMemo: string;
  defaultUraianKegiatan: string;
  colHargaLabel: string;
  colJumlahLabel: string;
  defaultSatuan: string;
  satuanOptions: string[];
}

export const SPJ_TYPE_LIST: SpjTypeMetadata[] = [
  {
    id: "PERDIN",
    label: "Perjalanan Dinas (Perdin)",
    shortLabel: "Perdin",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    description: "6 Dokumen SPJ Perdin Lengkap (Kwitansi, Memorandum, Nominatif, Rincian 7 Kolom, Riil, SPPD)",
    defaultMak: "524111",
    defaultKomp: "WA.7457.EBD.Z29.051.A",
    defaultDetailKomp: "Pelaksanaan Pengawasan Intern (Inspektorat I-IV)",
    defaultPerihalMemo: "Permintaan Pembayaran Langsung (LS) Perjalanan Dinas",
    defaultUraianKegiatan: "",
    colHargaLabel: "HARGA SATUAN",
    colJumlahLabel: "JUMLAH SATUAN",
    defaultSatuan: "OH",
    satuanOptions: ["OH", "OK", "Kali", "Paket"],
  },
  {
    id: "KONSUMSI",
    label: "SPJ Konsumsi Rapat",
    shortLabel: "Konsumsi",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    description: "Kuitansi, Memorandum & Daftar Nominatif Konsumsi (Makan Siang & Snack + PPN & PPh)",
    defaultMak: "521211",
    defaultKomp: "WA.7457.EBD.Z28.051.A",
    defaultDetailKomp: "Dukungan Manajemen dan Teknis Inspektorat",
    defaultPerihalMemo: "Permintaan Pembayaran Langsung (LS) Konsumsi",
    defaultUraianKegiatan:
      "Biaya Konsumsi Rapat Koordinasi pada Inspektorat Kementerian Koordinator Bidang Pangan",
    colHargaLabel: "HARGA SATUAN",
    colJumlahLabel: "JUMLAH SATUAN",
    defaultSatuan: "Pak",
    satuanOptions: ["Pak", "pax", "Kotak", "Box", "Porsi", "Paket", "Orang"],
  },
  {
    id: "ATK",
    label: "SPJ Semkit & ATK",
    shortLabel: "Semkit & ATK",
    badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
    description: "Kuitansi, Memorandum & Daftar Nominatif Seminar Kit / Alat Tulis Kantor (PPN & PPh 22)",
    defaultMak: "521211",
    defaultKomp: "WA.7457.EBD.Z28.051.A",
    defaultDetailKomp: "Dukungan Manajemen dan Teknis Inspektorat",
    defaultPerihalMemo: "Permintaan Pembayaran Langsung (LS) ATK",
    defaultUraianKegiatan:
      "Pembelian Alat Tulis Kantor (ATK) dan Bahan Penunjang Kegiatan Inspektorat Kementerian Koordinator Bidang Pangan",
    colHargaLabel: "HARGA SATUAN",
    colJumlahLabel: "JUMLAH SATUAN",
    defaultSatuan: "Rim",
    satuanOptions: ["Rim", "Dus", "Lusin", "Pack", "Pak", "Pcs", "Buah", "Set", "Paket", "Unit", "Botol", "Roll"],
  },
  {
    id: "SEWA",
    label: "SPJ Sewa Kendaraan",
    shortLabel: "Sewa Mobil",
    badgeColor: "bg-violet-50 text-violet-700 border-violet-200",
    description: "Kuitansi, Memorandum & Daftar Nominatif Sewa Kendaraan / Mobil (PPh 23 Sewa)",
    defaultMak: "522141",
    defaultKomp: "WA.7457.EBD.Z29.051.B",
    defaultDetailKomp: "Pelaksanaan Pengawasan Intern (Inspektorat I-IV)",
    defaultPerihalMemo: "Permintaan Pembayaran Langsung (LS) Sewa Kendaraan",
    defaultUraianKegiatan:
      "Biaya Sewa Kendaraan Roda 4 dalam rangka Kegiatan Koordinasi dan Pengawasan Inspektorat",
    colHargaLabel: "HARGA SEWA PERHARI",
    colJumlahLabel: "JUMLAH HARI",
    defaultSatuan: "Hari",
    satuanOptions: ["Hari", "Unit", "Kali", "Bulan", "Paket"],
  },
  {
    id: "DIKLAT",
    label: "SPJ Diklat / Pelatihan",
    shortLabel: "Diklat",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
    description: "Kuitansi, Memorandum & Daftar Nominatif Biaya Diklat / PNBP Pelatihan",
    defaultMak: "524111",
    defaultKomp: "WA.7457.EBD.Z29.052.A",
    defaultDetailKomp: "Peningkatan Kapabilitas APIP",
    defaultPerihalMemo: "Permintaan Pembayaran Langsung (LS) Biaya Diklat",
    defaultUraianKegiatan:
      "Biaya Kontribusi / PNBP Diklat Peningkatan Kapabilitas APIP pada Inspektorat Kementerian Koordinator Bidang Pangan",
    colHargaLabel: "HARGA SATUAN",
    colJumlahLabel: "VOLUME",
    defaultSatuan: "Kali",
    satuanOptions: ["Kali", "Orang", "Paket", "Peserta", "Sesi", "Hari"],
  },
];

export function getSpjTypeMeta(type?: SpjDocType): SpjTypeMetadata {
  const found = SPJ_TYPE_LIST.find((t) => t.id === (type || "PERDIN"));
  return found || SPJ_TYPE_LIST[0];
}

export function getDefaultPengadaanItems(type: SpjDocType): PengadaanItemRow[] {
  if (type === "KONSUMSI") {
    return [
      {
        id: "kons-1",
        no: 1,
        uraian: "Makan Siang",
        hargaSatuan: 53000,
        jumlah: 52,
        satuan: "Pak",
        subTotal: 53000 * 52,
        ppnJenis: "INCLUDE",
      },
      {
        id: "kons-2",
        no: 2,
        uraian: "Snack Pagi",
        hargaSatuan: 28000,
        jumlah: 52,
        satuan: "Pak",
        subTotal: 28000 * 52,
        ppnJenis: "INCLUDE",
      },
    ];
  }

  if (type === "ATK") {
    return [
      {
        id: "atk-1",
        no: 1,
        uraian: "Kertas A4 80 gr",
        hargaSatuan: 60000,
        jumlah: 15,
        satuan: "Rim",
        subTotal: 60000 * 15,
        ppnJenis: "INCLUDE",
      },
      {
        id: "atk-2",
        no: 2,
        uraian: "Amplop coklat (A4)",
        hargaSatuan: 60000,
        jumlah: 10,
        satuan: "Dus",
        subTotal: 60000 * 10,
        ppnJenis: "INCLUDE",
      },
      {
        id: "atk-3",
        no: 3,
        uraian: "Pulpen Hitam Faster",
        hargaSatuan: 30000,
        jumlah: 10,
        satuan: "Lusin",
        subTotal: 30000 * 10,
        ppnJenis: "INCLUDE",
      },
      {
        id: "atk-4",
        no: 4,
        uraian: "Sticky Note",
        hargaSatuan: 10000,
        jumlah: 10,
        satuan: "Pack",
        subTotal: 10000 * 10,
        ppnJenis: "INCLUDE",
      },
      {
        id: "atk-5",
        no: 5,
        uraian: "Tissue",
        hargaSatuan: 20000,
        jumlah: 5,
        satuan: "Pack",
        subTotal: 20000 * 5,
        ppnJenis: "INCLUDE",
      },
    ];
  }

  if (type === "SEWA") {
    return [
      {
        id: "sewa-1",
        no: 1,
        uraian: "Sewa Kendaraan Operasional Roda 4",
        hargaSatuan: 1300000,
        jumlah: 1,
        satuan: "Hari",
        subTotal: 1300000,
        ppnJenis: "NONE",
      },
    ];
  }

  if (type === "DIKLAT") {
    return [
      {
        id: "diklat-1",
        no: 1,
        uraian: "Biaya PNBP Diklat / Pelatihan Teknis",
        hargaSatuan: 5335000,
        jumlah: 1,
        satuan: "Kali",
        subTotal: 5335000,
        ppnJenis: "NONE",
      },
    ];
  }

  return [];
}

export function getDefaultPengadaanTax(
  type: SpjDocType,
  defaultPenerimaNama = "Reni Sutaryo, S.Si., M.Adm.Pemb",
  defaultPenerimaNip = "19791126200604 2 014"
): PengadaanTaxConfig {
  if (type === "KONSUMSI") {
    return {
      ppnMode: "INCLUDE_11_111",
      ppnManualValue: 0,
      pphType: "PPH23_2",
      penerimaNama: defaultPenerimaNama,
      penerimaNip: defaultPenerimaNip,
      penerimaJabatan: "Penanggung Jawab Kegiatan",
      isPenerimaCustom: false,
      rekeningTransfer: "",
    };
  }

  if (type === "ATK") {
    return {
      ppnMode: "INCLUDE_11_111",
      ppnManualValue: 0,
      pphType: "PPH22_1_5",
      penerimaNama: defaultPenerimaNama,
      penerimaNip: defaultPenerimaNip,
      penerimaJabatan: "Penanggung Jawab Kegiatan",
      isPenerimaCustom: false,
      rekeningTransfer: "",
    };
  }

  if (type === "SEWA") {
    return {
      ppnMode: "NONE",
      ppnManualValue: 0,
      pphType: "PPH23_2",
      penerimaNama: defaultPenerimaNama,
      penerimaNip: defaultPenerimaNip,
      penerimaJabatan: "Penanggung Jawab Kegiatan",
      isPenerimaCustom: false,
      rekeningTransfer: "",
    };
  }

  // DIKLAT default
  return {
    ppnMode: "NONE",
    ppnManualValue: 0,
    pphType: "NONE",
    penerimaNama: defaultPenerimaNama,
    penerimaNip: defaultPenerimaNip,
    penerimaJabatan: "Penanggung Jawab Kegiatan",
    isPenerimaCustom: false,
    rekeningTransfer: "",
  };
}

export interface PengadaanCalculationResult {
  subTotalBruto: number; // Nilai Bruto = Nilai pada Kuitansi (G10 / G17)
  nilaiPpn: number; // Nilai PPN (I7 / G17)
  dpp: number; // Sub Total setelah PPN (M10 = G10 - I7)
  pphLabel: string; // e.g., "PPH 23 (2%)" or "PPH 22 (1,5%)"
  pph22Text: string; // Display in col K ("1,5%" or "-")
  pph23Text: string; // Display in col L ("2%" / "4%" or "-")
  nilaiPph: number; // Potongan PPh (M12 = DPP * rate)
  jumlahBersih: number; // Jumlah Bersih Diterima (M13 = DPP - M12)
  jumlahBersihRounded: number; // Pembulatan untuk Terbilang
}

export function calculatePengadaanTotals(
  items: PengadaanItemRow[] = [],
  tax?: PengadaanTaxConfig
): PengadaanCalculationResult {
  const subTotalBruto = items.reduce((acc, item) => {
    const rowSub = (Number(item.hargaSatuan) || 0) * (Number(item.jumlah) || 0);
    return acc + rowSub;
  }, 0);

  const ppnMode = tax?.ppnMode || "NONE";
  let nilaiPpn = 0;
  if (ppnMode === "INCLUDE_11_111") {
    // Sesuai rumus Excel: ROUND(G10 * (11/111), 0)
    nilaiPpn = Math.round((subTotalBruto * 11) / 111);
  } else if (ppnMode === "MANUAL") {
    nilaiPpn = Math.max(0, Number(tax?.ppnManualValue) || 0);
  } else {
    nilaiPpn = 0;
  }

  // DPP / Sub Total di kolom TOTAL (M10 = G10 - Nilai PPN)
  const dpp = Math.max(0, subTotalBruto - nilaiPpn);

  const pphType = tax?.pphType || "NONE";
  let nilaiPph = 0;
  let pphLabel = "PPH";
  let pph22Text = "-";
  let pph23Text = "-";

  if (pphType === "PPH22_1_5") {
    nilaiPph = dpp * 0.015;
    pphLabel = "PPH 22 (1,5%)";
    pph22Text = "1,5%";
    pph23Text = "-";
  } else if (pphType === "PPH23_2") {
    nilaiPph = dpp * 0.02;
    pphLabel = "PPH 23 (2%)";
    pph22Text = "-";
    pph23Text = "2%";
  } else if (pphType === "PPH23_4") {
    nilaiPph = dpp * 0.04;
    pphLabel = "PPH 23 (4%)";
    pph22Text = "-";
    pph23Text = "4%";
  } else {
    nilaiPph = 0;
    pphLabel = "PPH";
    pph22Text = "-";
    pph23Text = "-";
  }

  const jumlahBersih = Math.max(0, dpp - nilaiPph);
  const jumlahBersihRounded = Math.round(jumlahBersih);

  return {
    subTotalBruto,
    nilaiPpn,
    dpp,
    pphLabel,
    pph22Text,
    pph23Text,
    nilaiPph,
    jumlahBersih,
    jumlahBersihRounded,
  };
}

/**
 * Format angka nominal sesuai tampilan Excel Indonesia (mendukung desimal jika ada sen pajak, misal 3.718.703,1)
 */
export function formatNominalExcel(val: number, maxFractionDigits = 2): string {
  if (!val || isNaN(val)) return "-";
  const hasDecimal = Math.abs(val - Math.round(val)) > 0.001;
  if (!hasDecimal) {
    return Math.round(val).toLocaleString("id-ID");
  }
  return val.toLocaleString("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFractionDigits,
  });
}

