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
  activeCols: Record<ActiveCostKey, boolean>
): ParticipantRow {
  const updated = { ...row };

  // 1. Lama Hari (Durasi Perjalanan Dinas Kalender)
  updated.lamaHari = calculateLamaHari(row.tanggalMulai, row.tanggalSelesai);

  // 2. Uang Harian (Mandiri & Fleksibel: Durasi dinas vs Hari UH riil)
  const uhRateBiasa = sbm?.uhBiasa || 0;
  const uhRateHalfday = sbm?.uhHalfday || 0;
  const uhRateFullboard = sbm?.uhFullboard || 0;

  if (activeUh.uhBiasa) {
    const hari = updated.hariUhBiasa !== undefined ? updated.hariUhBiasa : updated.lamaHari;
    updated.hariUhBiasa = hari;
    updated.biayaUhBiasa = hari * uhRateBiasa;
  } else {
    updated.biayaUhBiasa = 0;
  }

  if (activeUh.uhBiasa60) {
    const hari = updated.hariUhBiasa60 !== undefined ? updated.hariUhBiasa60 : updated.lamaHari;
    updated.hariUhBiasa60 = hari;
    updated.biayaUhBiasa60 = Math.round(hari * uhRateBiasa * 0.6);
  } else {
    updated.biayaUhBiasa60 = 0;
  }

  if (activeUh.uhHalfday) {
    const hari = updated.hariUhHalfday !== undefined ? updated.hariUhHalfday : updated.lamaHari;
    updated.hariUhHalfday = hari;
    updated.biayaUhHalfday = hari * uhRateHalfday;
  } else {
    updated.biayaUhHalfday = 0;
  }

  if (activeUh.uhFullboard) {
    const hari = updated.hariUhFullboard !== undefined ? updated.hariUhFullboard : updated.lamaHari;
    updated.hariUhFullboard = hari;
    updated.biayaUhFullboard = hari * uhRateFullboard;
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

/**
 * Menghitung dan menghasilkan nomor memorandum dinas berikutnya berdasarkan database master.
 * Contoh: Jika nomor memorandum terakhir terdaftar adalah M.320/INS/PPK/XI/2026,
 * maka nomor berikutnya yang dihasilkan adalah M.321/INS/PPK/XI/2026.
 */
export function generateNextMemoNumber(
  memoList: NomorMemo[],
  currentMemo?: string,
  tanggalMemo?: string
): { nextMemoNumber: string; latestRegisteredNumber: number; nextNumber: number } {
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

            // Ekstrak dari string lengkap jika tersedia (e.g. M.320/INS/PPK/XI/2026)
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

  // Format tahun
  let formattedYear = templateTahun || "2026";
  if (tanggalMemo) {
    const d = new Date(tanggalMemo);
    if (!isNaN(d.getTime())) {
      formattedYear = String(d.getFullYear());
    }
  }

  const generated = `${templatePrefix}${nextSeq}${formattedUnit}${templateBulan}/${formattedYear}`;
  return {
    nextMemoNumber: generated,
    latestRegisteredNumber: maxUsedNumber,
    nextNumber: nextSeq,
  };
}
