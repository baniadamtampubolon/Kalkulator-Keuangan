import { ParticipantRow, SbmRate, ActiveCostKey, ActiveUhKey } from "./types";

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

  // 1. Lama Hari
  const previousLamaHari = row.lamaHari;
  updated.lamaHari = calculateLamaHari(row.tanggalMulai, row.tanggalSelesai);
  const isDateChanged = previousLamaHari !== updated.lamaHari;

  // 2. Uang Harian (Sync with lamaHari when dates change or when not set)
  const uhRateBiasa = sbm?.uhBiasa || 0;
  const uhRateHalfday = sbm?.uhHalfday || 0;
  const uhRateFullboard = sbm?.uhFullboard || 0;

  if (activeUh.uhBiasa) {
    const hari = (isDateChanged || !updated.hariUhBiasa) ? updated.lamaHari : updated.hariUhBiasa;
    updated.hariUhBiasa = hari;
    updated.biayaUhBiasa = hari * uhRateBiasa;
  } else {
    updated.biayaUhBiasa = 0;
  }

  if (activeUh.uhBiasa60) {
    const hari = (isDateChanged || !updated.hariUhBiasa60) ? updated.lamaHari : updated.hariUhBiasa60;
    updated.hariUhBiasa60 = hari;
    updated.biayaUhBiasa60 = Math.round(hari * uhRateBiasa * 0.6);
  } else {
    updated.biayaUhBiasa60 = 0;
  }

  if (activeUh.uhHalfday) {
    const hari = (isDateChanged || !updated.hariUhHalfday) ? updated.lamaHari : updated.hariUhHalfday;
    updated.hariUhHalfday = hari;
    updated.biayaUhHalfday = hari * uhRateHalfday;
  } else {
    updated.biayaUhHalfday = 0;
  }

  if (activeUh.uhFullboard) {
    const hari = (isDateChanged || !updated.hariUhFullboard) ? updated.lamaHari : updated.hariUhFullboard;
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
