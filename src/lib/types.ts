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
  
  // Hotel
  hotel: number;
  penginapan30: number;
  namaHotel?: string;
  malamHotel?: number;
  rateHotel?: number;

  // Meeting
  fulldayMeeting: number;
  fullboardMeeting: number;
  paxMeeting?: number;
  rateMeeting?: number;

  // Lainnya
  representatif: number;
  belanjaBahan: number;
  
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
  ppkNama: string;
  ppkNip: string;
  ppkJabatan: string;
}

export type ActiveCostKey =
  | "tiket"
  | "dukunganTransportasi"
  | "transportasiDarat"
  | "transportasiLokal"
  | "pengRill"
  | "hotel"
  | "penginapan30"
  | "fulldayMeeting"
  | "fullboardMeeting"
  | "representatif"
  | "belanjaBahan";

export type ActiveUhKey = "uhBiasa" | "uhBiasa60" | "uhHalfday" | "uhFullboard";
