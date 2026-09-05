export interface Pegawai {
  kodeNama: string;
  no: string;
  nama: string;
  nip: string;
  jenisKelamin: string;
  pangkat: string;
  golongan: string;
  jabatan: string;
  kelasJabatan?: string;
  namaBank?: string;
  nomorRekening?: string;
}

export interface SbmRate {
  no: string;
  provinsi: string;
  uhBiasa: number;
  uhHalfday: number;
  uhFullboard: number;
  hotelEselon1: number;
  hotelEselon2: number;
  hotelEselon3Gol4: number;
  hotelEselon4Kebawah: number;
}

export interface NomorMemo {
  no: string;
  prefix: string;
  nomor: string;
  unit: string;
  bulanRomawi: string;
  tahun: string;
  tanggal: string;
  perihal: string;
}

export interface RiilItem {
  id: string;
  uraian: string;
  amount: number;
  keterangan?: string;
}

export interface TicketDetail {
  noTiket?: string;
  kodeBooking?: string;
  maskapai?: string;
  noPenerbangan?: string;
  asal?: string;
  tujuan?: string;
  tanggal?: string;
  harga?: number;
}

export interface ParticipantRow {
  id: string;
  kodeNama: string;
  nama: string;
  nip: string;
  golongan: string;
  jabatan: string;
  tujuanKota: string;
  tujuanProvinsi: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  lamaHari: number;
  nomorSt: string;
  isPejabat?: boolean;
  nomorSpd: string;

  // Uang Harian Fields
  hariUhBiasa: number;
  biayaUhBiasa: number;
  hariUhBiasa60: number;
  biayaUhBiasa60: number;
  hariUhHalfday: number;
  biayaUhHalfday: number;
  hariUhFullboard: number;
  biayaUhFullboard: number;

  // Biaya Transpor & Akomodasi
  tiket: number;
  dukunganTransportasi: number;
  transportasiDarat: number;
  transportasiLokal: number;
  transportJakartaPp: number;
  transportDaerahPp: number;
  
  // Tiket Rincian SPJ Pergi & Pulang
  tiketDetailPergi?: TicketDetail;
  tiketDetailPulang?: TicketDetail;
  boardingPass?: "ADA" | "TIDAK";

  // Hotel & Penginapan Rincian SPJ
  hotel: number;
  penginapan30: number;
  namaHotel?: string;
  kotaHotel?: string;
  checkInHotel?: string;
  checkOutHotel?: string;
  noBillFolio?: string;
  noKamar?: string;
  malamHotel?: number;
  rateHotel?: number;

  // Meeting
  fulldayMeeting: number;
  fullboardMeeting: number;
  paxMeeting?: number;
  rateMeeting?: number;

  // Lainnya & SPJ Eksternal
  representatif: number;
  belanjaBahan: number;
  namaExternal?: string;
  sewaKendaraan?: number;
  taksiBandara?: number;
  biayaReschedule?: number;
  kurs?: number;
  pengembalian?: number;
  
  // Pengeluaran Riil
  pengRill: number;
  riilItems: RiilItem[];

  // Honorarium Narasumber
  jamNarsum?: number;
  satuanNarsum?: number;
  pphNarsum?: number;
  honorariumNarsum?: number;

  // Total
  totalJumlah: number;
}

export interface HeaderData {
  keteranganKegiatan: string;
  keteranganMemo: string;
  provinsiTujuan: string;
  kotaTujuanList: string[]; // Dynamic 1 or more destination cities
  unitKerja: string;
  picInisiator: string;
  bendahara: string;
  petugasVerifikasi: string;
  nomorKomp: string;
  nomorMak: string;
  itemDetail: string;
  alatAngkut: string;
  tanggalSpd: string;
  tanggalMemo: string;
  nomorMemo: string;
  nomorStMaster: string;
  nomorStStaff?: string;
  useDifferentStPejabat?: boolean;
  nomorStPejabat?: string;
  ppkNama: string;
  ppkNip: string;
  ppkJabatan: string;

  // SPJ & Rekap Perdin Metadata
  noSpby?: string;
  jenisPengajuan?: "RENCANA" | "RAMPUNG" | "MERAMPUNGKAN";
  noSpm?: string;
  jenisPerdin?: "Perdin Jabodetabekdung" | "Perdin Luar Kota" | "Perdin Luar Negeri";
  berangkatDari?: string;
}

export type ActiveCostKey =
  | "tiket"
  | "dukunganTransportasi"
  | "transportasiDarat"
  | "transportasiLokal"
  | "transportJakartaPp"
  | "transportDaerahPp"
  | "pengRill"
  | "hotel"
  | "penginapan30"
  | "fulldayMeeting"
  | "fullboardMeeting"
  | "representatif"
  | "belanjaBahan";

export type ActiveUhKey = "uhBiasa" | "uhBiasa60" | "uhHalfday" | "uhFullboard";
