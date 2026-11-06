import { Pegawai, PengadaanItemRow, PengadaanTaxConfig, SpjDocType } from "./types";

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

export interface PengadaanScenarioPreset {
  id: string;
  label: string;
  description: string;
  items: PengadaanItemRow[];
  ppnMode: PengadaanTaxConfig["ppnMode"];
  pphType: PengadaanTaxConfig["pphType"];
}

export function formatPegawaiBankRekening(pegawai?: Pegawai): string {
  if (!pegawai) return "";
  const rek = (pegawai.nomorRekening || "").trim();
  if (!rek || rek.length < 5) return "";
  const bank = (pegawai.namaBank || "").trim();
  const isRealBankName = bank && isNaN(Number(bank));
  if (isRealBankName) return `${bank} - ${rek}`;
  return rek;
}

export const SPJ_TYPE_LIST: SpjTypeMetadata[] = [
  {
    id: "PERDIN",
    label: "Buat SPJ Perjalanan Dinas",
    shortLabel: "Perjalanan Dinas",
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
    label: "SPJ Konsumsi",
    shortLabel: "SPJ Konsumsi",
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
    id: "SEWA",
    label: "SPJ Sewa Kendaraan",
    shortLabel: "Sewa Kendaraan",
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
    label: "SPJ Narsum",
    shortLabel: "SPJ Narsum",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
    description: "Kuitansi, Memorandum & Daftar Nominatif Narasumber / Diklat",
    defaultMak: "522151",
    defaultKomp: "WA.7457.EBD.Z29.052.A",
    defaultDetailKomp: "Peningkatan Kapabilitas APIP",
    defaultPerihalMemo: "Permintaan Pembayaran Langsung (LS) Honorarium Narasumber / Diklat",
    defaultUraianKegiatan:
      "Pembayaran Honorarium Narasumber / Kegiatan Peningkatan Kapabilitas pada Inspektorat Kementerian Koordinator Bidang Pangan",
    colHargaLabel: "HARGA SATUAN",
    colJumlahLabel: "VOLUME",
    defaultSatuan: "OJ",
    satuanOptions: ["OJ", "Kali", "Orang", "Paket", "Sesi", "Hari"],
  },
  {
    id: "ATK",
    label: "SPJ ATK dan Seminar Kit",
    shortLabel: "ATK & Seminar Kit",
    badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
    description: "Kuitansi, Memorandum & Daftar Nominatif Seminar Kit / Alat Tulis Kantor (PPN & PPh 22)",
    defaultMak: "521211",
    defaultKomp: "WA.7457.EBD.Z28.051.A",
    defaultDetailKomp: "Dukungan Manajemen dan Teknis Inspektorat",
    defaultPerihalMemo: "Permintaan Pembayaran Langsung (LS) ATK",
    defaultUraianKegiatan:
      "Pembelian Alat Tulis Kantor (ATK) dan Seminar Kit Kegiatan Inspektorat Kementerian Koordinator Bidang Pangan",
    colHargaLabel: "HARGA SATUAN",
    colJumlahLabel: "JUMLAH SATUAN",
    defaultSatuan: "Rim",
    satuanOptions: ["Rim", "Dus", "Lusin", "Pack", "Pak", "Pcs", "Buah", "Set", "Paket", "Unit", "Botol", "Roll"],
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

export function getPengadaanScenarioPresets(type: SpjDocType): PengadaanScenarioPreset[] {
  if (type === "KONSUMSI") {
    return [
      {
        id: "kons-lengkap",
        label: "Paket Rapat Lengkap (Makan + Snack)",
        description: "Makan Siang Rp 53.000 + Snack Rp 28.000 • PPN Include (11/111) + PPh 23 (2%)",
        items: getDefaultPengadaanItems("KONSUMSI"),
        ppnMode: "INCLUDE_11_111",
        pphType: "PPH23_2",
      },
      {
        id: "kons-snack",
        label: "Snack Rapat Saja",
        description: "1 Item Snack Rapat Rp 28.000/Pak • PPN Include + PPh 23 (2%)",
        items: [
          {
            id: "kons-1",
            no: 1,
            uraian: "Snack Rapat Koordinasi",
            hargaSatuan: 28000,
            jumlah: 40,
            satuan: "Pak",
            subTotal: 28000 * 40,
            ppnJenis: "INCLUDE",
          },
        ],
        ppnMode: "INCLUDE_11_111",
        pphType: "PPH23_2",
      },
      {
        id: "kons-non-ppn",
        label: "Konsumsi < Rp 2 Juta (Bebas PPN)",
        description: "Tanpa potongan PPN (di bawah Rp 2 Juta) • Tetap potong PPh 23 (2%)",
        items: [
          {
            id: "kons-1",
            no: 1,
            uraian: "Makan Siang Rapat",
            hargaSatuan: 53000,
            jumlah: 20,
            satuan: "Pak",
            subTotal: 53000 * 20,
            ppnJenis: "NONE",
          },
          {
            id: "kons-2",
            no: 2,
            uraian: "Snack Rapat",
            hargaSatuan: 28000,
            jumlah: 20,
            satuan: "Pak",
            subTotal: 28000 * 20,
            ppnJenis: "NONE",
          },
        ],
        ppnMode: "NONE",
        pphType: "PPH23_2",
      },
    ];
  }

  if (type === "ATK") {
    return [
      {
        id: "atk-rutin",
        label: "Paket ATK Rutin Kantor (5 Item)",
        description: "Kertas A4, Amplop, Pulpen, Sticky Note, Tissue • PPN Include + PPh 22 (1,5%)",
        items: getDefaultPengadaanItems("ATK"),
        ppnMode: "INCLUDE_11_111",
        pphType: "PPH22_1_5",
      },
      {
        id: "atk-semkit",
        label: "Paket Seminar Kit Kegiatan",
        description: "Tas Seminar, Blocknote, Pulpen, ID Card • PPN Include + PPh 22 (1,5%)",
        items: [
          {
            id: "atk-1",
            no: 1,
            uraian: "Goodie Bag / Tas Seminar Kit",
            hargaSatuan: 45000,
            jumlah: 50,
            satuan: "Pcs",
            subTotal: 45000 * 50,
            ppnJenis: "INCLUDE",
          },
          {
            id: "atk-2",
            no: 2,
            uraian: "Blocknote + Pulpen Seminar",
            hargaSatuan: 25000,
            jumlah: 50,
            satuan: "Set",
            subTotal: 25000 * 50,
            ppnJenis: "INCLUDE",
          },
          {
            id: "atk-3",
            no: 3,
            uraian: "Name Tag / Tali Lanyard Peserta",
            hargaSatuan: 15000,
            jumlah: 50,
            satuan: "Pcs",
            subTotal: 15000 * 50,
            ppnJenis: "INCLUDE",
          },
        ],
        ppnMode: "INCLUDE_11_111",
        pphType: "PPH22_1_5",
      },
      {
        id: "atk-kecil",
        label: "Belanja ATK < Rp 2 Juta (Tanpa Pajak)",
        description: "Pembelian ATK nominal kecil di bawah batas pungut PPN & PPh 22",
        items: [
          {
            id: "atk-1",
            no: 1,
            uraian: "Kertas HVS A4 80 gr",
            hargaSatuan: 60000,
            jumlah: 10,
            satuan: "Rim",
            subTotal: 60000 * 10,
            ppnJenis: "NONE",
          },
          {
            id: "atk-2",
            no: 2,
            uraian: "Ordner / Map Dokumen",
            hargaSatuan: 35000,
            jumlah: 10,
            satuan: "Buah",
            subTotal: 35000 * 10,
            ppnJenis: "NONE",
          },
        ],
        ppnMode: "NONE",
        pphType: "NONE",
      },
    ];
  }

  if (type === "SEWA") {
    return [
      {
        id: "sewa-npwp",
        label: "Sewa Harian Non-PKP + NPWP (PPh 2%)",
        description: "Sewa Kendaraan Rp 1.300.000/hari • Tanpa PPN + Potong PPh 23 (2%)",
        items: getDefaultPengadaanItems("SEWA"),
        ppnMode: "NONE",
        pphType: "PPH23_2",
      },
      {
        id: "sewa-pkp",
        label: "Sewa Vendor PKP (PPN Include + PPh 2%)",
        description: "Vendor PKP • PPN Include (11/111) + Potong PPh 23 (2% dari DPP)",
        items: [
          {
            id: "sewa-1",
            no: 1,
            uraian: "Sewa Kendaraan Operasional Roda 4",
            hargaSatuan: 1300000,
            jumlah: 2,
            satuan: "Hari",
            subTotal: 1300000 * 2,
            ppnJenis: "INCLUDE",
          },
        ],
        ppnMode: "INCLUDE_11_111",
        pphType: "PPH23_2",
      },
      {
        id: "sewa-non-npwp",
        label: "Sewa Tanpa NPWP (PPh 23 4%)",
        description: "Tarif PPh 23 lebih tinggi 100% (4%) untuk penyedia tanpa NPWP",
        items: getDefaultPengadaanItems("SEWA"),
        ppnMode: "NONE",
        pphType: "PPH23_4",
      },
    ];
  }

  // DIKLAT
  return [
    {
      id: "diklat-pnbp",
      label: "PNBP Diklat Instansi Pemerintah (Bebas Pajak)",
      description: "Biaya Kontribusi / PNBP Diklat Instansi Pembina • Tanpa PPN & PPh",
      items: getDefaultPengadaanItems("DIKLAT"),
      ppnMode: "NONE",
      pphType: "NONE",
    },
    {
      id: "diklat-swasta",
      label: "Pelatihan Lembaga Swasta (PPN + PPh 23 2%)",
      description: "Jasa Pelatihan / Bimtek Swasta • PPN Include (11/111) + PPh 23 (2%)",
      items: [
        {
          id: "diklat-1",
          no: 1,
          uraian: "Biaya Pelatihan / Sertifikasi Teknis",
          hargaSatuan: 5335000,
          jumlah: 1,
          satuan: "Kali",
          subTotal: 5335000,
          ppnJenis: "INCLUDE",
        },
      ],
      ppnMode: "INCLUDE_11_111",
      pphType: "PPH23_2",
    },
  ];
}

export function getDefaultPengadaanTax(
  type: SpjDocType,
  defaultPenerimaNama = "Reni Sutaryo, S.Si., M.Adm.Pemb",
  defaultPenerimaNip = "19791126200604 2 014",
  defaultRekeningTransfer = ""
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
      rekeningTransfer: defaultRekeningTransfer,
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
      rekeningTransfer: defaultRekeningTransfer,
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
      rekeningTransfer: defaultRekeningTransfer,
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
    rekeningTransfer: defaultRekeningTransfer,
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

