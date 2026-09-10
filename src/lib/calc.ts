import { ParticipantRow, SbmRate, ActiveCostKey, ActiveUhKey, NomorMemo } from "./types";

export function calculateLamaHari(start: string, end: string): number {
  if (!start || !end) return 1;
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || endDate < startDate) {
    return 1;
  }
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
}

export function findSbmByProvince(sbmList: SbmRate[], provName: string): SbmRate | undefined {
  if (!provName) return undefined;
  const clean = provName.trim().toUpperCase();
  return (
    sbmList.find((s) => s.provinsi.trim().toUpperCase() === clean) ||
    sbmList.find((s) => clean.includes(s.provinsi.trim().toUpperCase())) ||
    sbmList.find((s) => s.provinsi.trim().toUpperCase().includes(clean))
  );
}

export function calculateRowTotal(
  row: ParticipantRow,
  sbm: SbmRate | undefined,
  activeUh: Record<ActiveUhKey, boolean>,
  activeCols: Record<ActiveCostKey, boolean>,
  options?: {
    forceRecalcUh?: boolean;
    forceRecalcTransport?: boolean;
    skipAutoTransport?: boolean;
    sbmJakarta?: SbmRate;
    isCustomNominal?: boolean;
  }
): ParticipantRow {
  const updated = { ...row };

  // 1. Lama Hari (Durasi Perjalanan Dinas Kalender)
  const newLamaHari = calculateLamaHari(row.tanggalMulai, row.tanggalSelesai);
  const isDurationChanged = row.lamaHari !== undefined && row.lamaHari !== newLamaHari;
  updated.lamaHari = newLamaHari;

  // 2. Uang Harian (Mandiri & Fleksibel: Durasi dinas vs Hari UH riil & Editable Nominal)
  const uhRateBiasa = sbm?.uhBiasa || 0;
  const uhRateHalfday = sbm?.uhHalfday || 0;
  const uhRateFullboard = sbm?.uhFullboard || 0;

  const shouldCalculateBiaya = (
    currentBiaya: number | undefined | null,
    hari: number,
    rate: number
  ) => {
    if (currentBiaya === undefined || currentBiaya === null) return true;
    if (isDurationChanged) return true;
    if (options?.forceRecalcUh) return true;
    // Auto-calculate initial 0 fee when hari > 0 and rate > 0, unless explicitly customized
    if (currentBiaya === 0 && hari > 0 && rate > 0 && !options?.isCustomNominal) return true;
    return false;
  };

  if (activeUh.uhBiasa) {
    let hari = updated.hariUhBiasa;
    if (hari === undefined || (isDurationChanged && (row.hariUhBiasa === row.lamaHari || row.hariUhBiasa === 0))) {
      hari = updated.lamaHari;
      updated.hariUhBiasa = hari;
    }
    if (shouldCalculateBiaya(updated.biayaUhBiasa, hari, uhRateBiasa)) {
      updated.biayaUhBiasa = hari * uhRateBiasa;
    }
  } else {
    updated.biayaUhBiasa = 0;
  }

  if (activeUh.uhBiasa60) {
    let hari = updated.hariUhBiasa60;
    if (hari === undefined || (isDurationChanged && (row.hariUhBiasa60 === row.lamaHari || row.hariUhBiasa60 === 0))) {
      hari = updated.lamaHari;
      updated.hariUhBiasa60 = hari;
    }
    if (shouldCalculateBiaya(updated.biayaUhBiasa60, hari, Math.round(uhRateBiasa * 0.6))) {
      updated.biayaUhBiasa60 = Math.round(hari * uhRateBiasa * 0.6);
    }
  } else {
    updated.biayaUhBiasa60 = 0;
  }

  if (activeUh.uhHalfday) {
    let hari = updated.hariUhHalfday;
    if (hari === undefined || (isDurationChanged && (row.hariUhHalfday === row.lamaHari || row.hariUhHalfday === 0))) {
      hari = updated.lamaHari;
      updated.hariUhHalfday = hari;
    }
    if (shouldCalculateBiaya(updated.biayaUhHalfday, hari, uhRateHalfday)) {
      updated.biayaUhHalfday = hari * uhRateHalfday;
    }
  } else {
    updated.biayaUhHalfday = 0;
  }

  if (activeUh.uhFullboard) {
    let hari = updated.hariUhFullboard;
    if (hari === undefined || (isDurationChanged && (row.hariUhFullboard === row.lamaHari || row.hariUhFullboard === 0))) {
      hari = updated.lamaHari;
      updated.hariUhFullboard = hari;
    }
    if (shouldCalculateBiaya(updated.biayaUhFullboard, hari, uhRateFullboard)) {
      updated.biayaUhFullboard = hari * uhRateFullboard;
    }
  } else {
    updated.biayaUhFullboard = 0;
  }

  // 3. Hotel vs Penginapan 30%
  if (activeCols.hotel && updated.malamHotel && updated.rateHotel) {
    updated.hotel = updated.malamHotel * updated.rateHotel;
  } else if (!activeCols.hotel) {
    updated.hotel = 0;
  }

  if (activeCols.penginapan30 && sbm && updated.malamHotel) {
    const hotelSbm =
      row.golongan.startsWith("IV")
        ? sbm.hotelEselon3Gol4
        : sbm.hotelEselon4Kebawah;
    updated.penginapan30 = Math.round(updated.malamHotel * (hotelSbm * 0.3));
  } else if (!activeCols.penginapan30) {
    updated.penginapan30 = 0;
  }

  // 4. Pengeluaran Riil
  if (activeCols.pengRill && Array.isArray(updated.riilItems) && updated.riilItems.length > 0) {
    updated.pengRill = updated.riilItems.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
  } else if (!activeCols.pengRill) {
    updated.pengRill = 0;
  }

  // 5. Automasi Transportasi Taksi Bandara PP (SBM Taksi Bandara x 2 untuk Pulang-Pergi)
  // Taksi Jakarta PP (Asal/Homebase: default Rp 250.000 x 2 = Rp 500.000)
  const taksiJktRate = (options?.sbmJakarta?.taksiBandara && options.sbmJakarta.taksiBandara > 0)
    ? options.sbmJakarta.taksiBandara
    : (sbm?.provinsi?.toUpperCase().includes("JAKARTA") && sbm.taksiBandara ? sbm.taksiBandara : 250000);
  const tarifJakartaPp = taksiJktRate * 2;

  if (activeCols.transportJakartaPp) {
    if (
      !options?.skipAutoTransport &&
      (updated.transportJakartaPp === undefined ||
        updated.transportJakartaPp === 0 ||
        options?.forceRecalcTransport)
    ) {
      updated.transportJakartaPp = tarifJakartaPp;
    }
  } else {
    updated.transportJakartaPp = 0;
  }

  // Taksi Daerah PP (Tujuan: Tarif SBM Provinsi Tujuan x 2 untuk Pulang-Pergi)
  const taksiDaerahRate = sbm?.taksiBandara || 0;
  const tarifDaerahPp = taksiDaerahRate * 2;

  if (activeCols.transportDaerahPp) {
    if (
      !options?.skipAutoTransport &&
      (updated.transportDaerahPp === undefined ||
        updated.transportDaerahPp === 0 ||
        options?.forceRecalcTransport)
    ) {
      updated.transportDaerahPp = tarifDaerahPp;
    }
  } else {
    updated.transportDaerahPp = 0;
  }

  // Inactive Cost Zeroing for strict synchronization
  const tiketVal = activeCols.tiket ? (updated.tiket || 0) : 0;
  const dukunganVal = activeCols.dukunganTransportasi ? (updated.dukunganTransportasi || 0) : 0;
  const transDaratVal = activeCols.transportasiDarat ? (updated.transportasiDarat || 0) : 0;
  const transLokalVal = activeCols.transportasiLokal ? (updated.transportasiLokal || 0) : 0;
  const transJakartaPpVal = activeCols.transportJakartaPp ? (updated.transportJakartaPp || 0) : 0;
  const transDaerahPpVal = activeCols.transportDaerahPp ? (updated.transportDaerahPp || 0) : 0;
  const hotelVal = activeCols.hotel ? (updated.hotel || 0) : 0;
  const penginapan30Val = activeCols.penginapan30 ? (updated.penginapan30 || 0) : 0;
  const pengRillVal = activeCols.pengRill ? (updated.pengRill || 0) : 0;
  const fulldayVal = activeCols.fulldayMeeting ? (updated.fulldayMeeting || 0) : 0;
  const fullboardVal = activeCols.fullboardMeeting ? (updated.fullboardMeeting || 0) : 0;
  const representatifVal = activeCols.representatif ? (updated.representatif || 0) : 0;
  const belanjaBahanVal = activeCols.belanjaBahan ? (updated.belanjaBahan || 0) : 0;

  // 5. Total Sum (Strictly sum only active checked components)
  let total = 0;
  total += updated.biayaUhBiasa;
  total += updated.biayaUhBiasa60;
  total += updated.biayaUhHalfday;
  total += updated.biayaUhFullboard;

  total += tiketVal;
  total += dukunganVal;
  total += transDaratVal;
  total += transLokalVal;
  total += transJakartaPpVal;
  total += transDaerahPpVal;
  total += hotelVal;
  total += penginapan30Val;
  total += pengRillVal;
  total += fulldayVal;
  total += fullboardVal;
  total += representatifVal;
  total += belanjaBahanVal;

  updated.totalJumlah = total;
  return updated;
}

export const ROMAN_MONTHS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"] as const;

/**
 * Mendapatkan representasi angka Romawi bulan (I s/d XII) dari tanggal (string YYYY-MM-DD atau Date)
 */
export function getMonthRoman(dateInput?: string | Date): string {
  if (!dateInput) return "";

  if (typeof dateInput === "string") {
    const trimmed = dateInput.trim();
    if (!trimmed) return "";
    // Handle YYYY-MM-DD atau YYYY/MM/DD
    const isoMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (isoMatch) {
      const m = parseInt(isoMatch[2], 10);
      if (m >= 1 && m <= 12) return ROMAN_MONTHS[m - 1];
    }
    // Handle DD-MM-YYYY atau DD/MM/YYYY
    const dmyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (dmyMatch) {
      const m = parseInt(dmyMatch[2], 10);
      if (m >= 1 && m <= 12) return ROMAN_MONTHS[m - 1];
    }
  }

  const d = new Date(dateInput);
  if (!isNaN(d.getTime())) {
    return ROMAN_MONTHS[d.getMonth()] || "";
  }
  return "";
}

/**
 * Mengubah string nomor memo yang sudah ada agar bulan romawi dan tahunnya
 * otomatis sinkron mengikuti tanggal memo yang dipilih.
 * Contoh: "M.322/INS/PPK/XI/2026" dengan tanggal 2026-08-15 -> "M.322/INS/PPK/VIII/2026"
 */
export function updateMemoNumberWithDate(memoNumber: string, dateInput?: string | Date): string {
  if (!memoNumber || !dateInput) return memoNumber;
  const romanMonth = getMonthRoman(dateInput);
  if (!romanMonth) return memoNumber;

  let yearStr = "";
  if (typeof dateInput === "string") {
    const trimmed = dateInput.trim();
    const isoMatch = trimmed.match(/^(\d{4})[-/]/);
    if (isoMatch) yearStr = isoMatch[1];
    const dmyMatch = trimmed.match(/[-/](\d{4})$/);
    if (dmyMatch) yearStr = dmyMatch[1];
  }
  if (!yearStr) {
    const d = new Date(dateInput);
    if (!isNaN(d.getTime())) yearStr = String(d.getFullYear());
  }

  // Pola 1: /ROMAN/YEAR (e.g. /XI/2026)
  if (/\/([IVXLCDM]+)\/(\d{4})/i.test(memoNumber)) {
    return memoNumber.replace(/\/([IVXLCDM]+)\/(\d{4})/i, `/${romanMonth}/${yearStr || "$2"}`);
  }

  // Pola 2: /ROMAN di akhir string (e.g. /XI)
  if (/\/([IVXLCDM]+)$/i.test(memoNumber)) {
    return memoNumber.replace(/\/([IVXLCDM]+)$/i, `/${romanMonth}${yearStr ? "/" + yearStr : ""}`);
  }

  return memoNumber;
}

/**
 * Menghitung dan menghasilkan nomor memorandum dinas berikutnya berdasarkan database master.
 * Bulan Romawi (I-XII) dan tahun otomatis mengikuti tanggal memo yang berlangsung.
 * Contoh: Jika tanggal memo 2026-08-15 dan nomor terakhir 321, maka menghasilkan M.322/INS/PPK/VIII/2026.
 */
export function generateNextMemoNumber(
  memoList: NomorMemo[],
  currentMemo?: string,
  tanggalMemo?: string
): { nextMemoNumber: string; latestRegisteredNumber: number; nextNumber: number; bulanRomawi: string } {
  let maxUsedNumber = 0;
  let firstUnusedNumber: number | null = null;
  let templatePrefix = "M.";
  let templateUnit = "/INS/PPK/";
  let templateBulan = "XI";
  let templateTahun = "2026";

  if (Array.isArray(memoList) && memoList.length > 0) {
    for (const m of memoList) {
      // 1. Ekstrak nomor angka
      let numVal = 0;
      if (m.nomor_urut && !isNaN(Number(m.nomor_urut))) {
        numVal = Number(m.nomor_urut);
      } else if (m.nomor && !isNaN(parseInt(m.nomor, 10))) {
        numVal = parseInt(m.nomor, 10);
      } else {
        const str = m.format_lengkap || m.noMemo || "";
        if (str) {
          const match = str.match(/\bM\.?(\d+)/i) || str.match(/(\d+)/);
          if (match) numVal = parseInt(match[1], 10);
        }
      }

      if (numVal > 0) {
        // Cek apakah baris ini sudah dipakai / memiliki perihal / status TERPAKAI
        const isUsed = Boolean(
          (m.status && String(m.status).trim().toUpperCase().includes("TERPAKAI")) ||
          (m.id_kegiatan_ref && String(m.id_kegiatan_ref).trim().length > 0) ||
          (m.perihal && String(m.perihal).trim().length > 0) ||
          (m.tanggal_memo && String(m.tanggal_memo).trim().length > 0) ||
          (m.noMemo && String(m.noMemo).trim().length > 0 && m.tanggal && String(m.tanggal).trim().length > 0)
        );

        if (isUsed) {
          if (numVal > maxUsedNumber) {
            maxUsedNumber = numVal;
            if (m.prefix) templatePrefix = m.prefix;
            if (m.unit) templateUnit = m.unit;
            if (m.bulanRomawi) templateBulan = m.bulanRomawi;
            if (m.tahun) templateTahun = m.tahun.replace(/\//g, "").trim();
            if (m.tahun_anggaran) templateTahun = String(m.tahun_anggaran).trim();

            // Ekstrak unit dari string lengkap jika tersedia (e.g. M.320/INS/PPK/XI/2026)
            const memoStr = m.format_lengkap || m.noMemo;
            if (memoStr) {
              const parts =
                memoStr.match(/^([A-Za-z]+\.)?\s*(\d+)\s*(\/.*?\/)([IVXLCDM]+)\/(\d{4})/i) ||
                memoStr.match(/^([A-Za-z]+\.)?\s*(\d+)\s*(\/[^\/]+\/)?([A-Za-z]+)?(\/\d{4})?/);
              if (parts) {
                if (parts[1]) templatePrefix = parts[1];
                if (parts[3]) templateUnit = parts[3];
                if (parts[4]) templateBulan = parts[4];
                if (parts[5]) templateTahun = parts[5].replace(/\//g, "").trim();
              }
            }
          }
        } else {
          // Baris kosong teralokasi di database master
          if (firstUnusedNumber === null || numVal < firstUnusedNumber) {
            firstUnusedNumber = numVal;
          }
        }
      }
    }
  }

  // Jika tidak ada data sama sekali atau maxUsedNumber masih 0, gunakan fallback 320 -> 321
  if (maxUsedNumber === 0) {
    maxUsedNumber = 320;
  }

  // Tentukan nomor angka berikutnya
  let nextSeq: number;
  if (firstUnusedNumber !== null && firstUnusedNumber > maxUsedNumber) {
    nextSeq = firstUnusedNumber;
  } else {
    nextSeq = maxUsedNumber + 1;
  }

  // Jika currentMemo sudah terisi dan nilainya >= nextSeq, naikkan 1 (fitur klik berulang)
  if (currentMemo) {
    const curMatch = currentMemo.match(/\bM\.?(\d+)/i) || currentMemo.match(/(\d+)/);
    if (curMatch) {
      const curVal = parseInt(curMatch[1], 10);
      if (curVal >= nextSeq) {
        nextSeq = curVal + 1;
      }
    }
  }

  // Format unit
  let formattedUnit = templateUnit.trim();
  if (!formattedUnit.startsWith("/")) formattedUnit = "/" + formattedUnit;
  if (!formattedUnit.endsWith("/")) formattedUnit = formattedUnit + "/";

  // LOGIK AUTOMATION BULAN ROMAWI:
  // Bulan romawi (I - XII) wajib mengikuti bulan pada tanggal memo yang berlangsung
  let targetRomanMonth = getMonthRoman(tanggalMemo);
  if (!targetRomanMonth) {
    // Jika tanggalMemo belum ditentukan, gunakan bulan saat ini
    targetRomanMonth = getMonthRoman(new Date()) || templateBulan || "XI";
  }

  // Format tahun
  let formattedYear = templateTahun || "2026";
  if (tanggalMemo) {
    const d = new Date(tanggalMemo);
    if (!isNaN(d.getTime())) {
      formattedYear = String(d.getFullYear());
    }
  } else {
    formattedYear = String(new Date().getFullYear());
  }

  const generated = `${templatePrefix}${nextSeq}${formattedUnit}${targetRomanMonth}/${formattedYear}`;
  return {
    nextMemoNumber: generated,
    latestRegisteredNumber: maxUsedNumber,
    nextNumber: nextSeq,
    bulanRomawi: targetRomanMonth,
  };
}
