/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// 1. Read JSON files
const pegawaiPath = path.join(__dirname, '../src/data/pegawai.json');
const sbmPath = path.join(__dirname, '../src/data/sbm.json');
const memoPath = path.join(__dirname, '../src/data/nomor_memo.json');

const pegawaiData = JSON.parse(fs.readFileSync(pegawaiPath, 'utf8'));
const sbmData = JSON.parse(fs.readFileSync(sbmPath, 'utf8'));
const memoData = JSON.parse(fs.readFileSync(memoPath, 'utf8'));

// 2. Format Pegawai to MASTER_PEGAWAI columns
const pegawaiRows = pegawaiData.map((p, idx) => ({
  id_pegawai: `PEG-${(idx + 1).toString().padStart(3, '0')}`,
  kode_nama: p.kodeNama || '',
  no_urut: parseInt(p.no || idx + 1, 10),
  nama_lengkap: p.nama || '',
  nip: p.nip || '',
  jenis_kelamin: p.jenisKelamin || '',
  pangkat: p.pangkat || '',
  golongan: p.golongan || '',
  jabatan: p.jabatan || '',
  kelas_jabatan: p.kelasJabatan || '',
  nama_bank: p.namaBank || '',
  nomor_rekening: p.nomorRekening || '',
  is_active: 'TRUE',
  updated_at: '2026-09-05'
}));

// Create individual master_pegawai.xlsx
const wbPegawai = XLSX.utils.book_new();
const wsPegawai = XLSX.utils.json_to_sheet(pegawaiRows);

// Set column widths for nice formatting
wsPegawai['!cols'] = [
  { wch: 14 }, // id_pegawai
  { wch: 14 }, // kode_nama
  { wch: 8 },  // no_urut
  { wch: 38 }, // nama_lengkap
  { wch: 26 }, // nip
  { wch: 14 }, // jenis_kelamin
  { wch: 24 }, // pangkat
  { wch: 10 }, // golongan
  { wch: 42 }, // jabatan
  { wch: 14 }, // kelas_jabatan
  { wch: 16 }, // nama_bank
  { wch: 20 }, // nomor_rekening
  { wch: 10 }, // is_active
  { wch: 14 }, // updated_at
];

XLSX.utils.book_append_sheet(wbPegawai, wsPegawai, 'MASTER_PEGAWAI');
const outPegawaiPath = path.join(__dirname, '../master_pegawai.xlsx');
XLSX.writeFile(wbPegawai, outPegawaiPath);
console.log(`✅ Berhasil membuat file: ${outPegawaiPath} (${pegawaiRows.length} pegawai)`);

// 3. Create individual master_sbm.xlsx
const sbmRows = sbmData.map(s => ({
  tahun_anggaran: 2026,
  nama_provinsi: s.provinsi || '',
  uh_biasa: s.uhBiasa || 0,
  uh_halfday: s.uhHalfday || 0,
  uh_fullboard: s.uhFullboard || 0,
  hotel_eselon1: s.hotelEselon1 || 0,
  hotel_eselon2: s.hotelEselon2 || 0,
  hotel_eselon3_gol4: s.hotelEselon3Gol4 || 0,
  hotel_eselon4_kebawah: s.hotelEselon4Kebawah || 0,
  representatif_luar_kota: 0,
  taksi_bandara: 0
}));

const wbSbm = XLSX.utils.book_new();
const wsSbmIndiv = XLSX.utils.json_to_sheet(sbmRows);
wsSbmIndiv['!cols'] = [
  { wch: 16 }, // tahun_anggaran
  { wch: 28 }, // nama_provinsi
  { wch: 14 }, // uh_biasa
  { wch: 14 }, // uh_halfday
  { wch: 14 }, // uh_fullboard
  { wch: 16 }, // hotel_eselon1
  { wch: 16 }, // hotel_eselon2
  { wch: 20 }, // hotel_eselon3_gol4
  { wch: 22 }, // hotel_eselon4_kebawah
  { wch: 24 }, // representatif_luar_kota
  { wch: 16 }, // taksi_bandara
];
XLSX.utils.book_append_sheet(wbSbm, wsSbmIndiv, 'MASTER_SBM');
const outSbmPath = path.join(__dirname, '../master_sbm.xlsx');
XLSX.writeFile(wbSbm, outSbmPath);
console.log(`✅ Berhasil membuat file: ${outSbmPath} (${sbmRows.length} provinsi)`);

// 4. Create individual master_memo.xlsx
const memoRows = memoData.map(m => ({
  tahun_anggaran: 2026,
  nomor_urut: parseInt(m.nomor || '0', 10),
  format_lengkap: `${m.prefix || 'M.'}${m.nomor || ''}${m.unit || '/INS/PPK/'}${m.bulanRomawi || 'VIII'}${m.tahun || '/2026'}`,
  tanggal_memo: m.tanggal || '2026-09-05',
  perihal: m.perihal || '',
  id_kegiatan_ref: '',
  status: 'TERSEDIA'
}));

const wbMemo = XLSX.utils.book_new();
const wsMemoIndiv = XLSX.utils.json_to_sheet(memoRows);
wsMemoIndiv['!cols'] = [
  { wch: 16 }, // tahun_anggaran
  { wch: 12 }, // nomor_urut
  { wch: 28 }, // format_lengkap
  { wch: 16 }, // tanggal_memo
  { wch: 60 }, // perihal
  { wch: 18 }, // id_kegiatan_ref
  { wch: 14 }, // status
];
XLSX.utils.book_append_sheet(wbMemo, wsMemoIndiv, 'MASTER_MEMO');
const outMemoPath = path.join(__dirname, '../master_memo.xlsx');
XLSX.writeFile(wbMemo, outMemoPath);
console.log(`✅ Berhasil membuat file: ${outMemoPath} (${memoRows.length} nomor memorandum)`);

// 5. Create Full Database Workbook (master_database_lengkap.xlsx)
const wbFull = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wbFull, wsPegawai, 'MASTER_PEGAWAI');
const wsSbm = XLSX.utils.json_to_sheet(sbmRows);
XLSX.utils.book_append_sheet(wbFull, wsSbm, 'MASTER_SBM');
const wsMemo = XLSX.utils.json_to_sheet(memoRows);
XLSX.utils.book_append_sheet(wbFull, wsMemo, 'MASTER_MEMO');

// Empty structure tabs for transactions
const wsKegiatan = XLSX.utils.aoa_to_sheet([[
  'id_kegiatan', 'kode_kegiatan', 'nama_kegiatan', 'jenis_pengajuan', 'no_spm', 'no_spby',
  'jenis_perdin', 'berangkat_dari', 'provinsi_tujuan', 'kota_tujuan_list', 'tanggal_mulai',
  'tanggal_selesai', 'alat_angkut', 'nomor_st_master', 'nomor_st_staf', 'nomor_st_pejabat',
  'use_different_st_pejabat', 'nomor_memo', 'tanggal_memo', 'tanggal_spd', 'kode_mak',
  'kode_komponen', 'item_detail', 'unit_kerja', 'ppk_nama', 'ppk_nip', 'bendahara_nama',
  'verifikator_nama', 'grand_total', 'status_dokumen', 'created_at'
]]);
XLSX.utils.book_append_sheet(wbFull, wsKegiatan, 'DB_KEGIATAN');

const wsPeserta = XLSX.utils.aoa_to_sheet([[
  'id_peserta', 'id_kegiatan', 'id_pegawai', 'urutan', 'nomor_spd', 'nomor_st_assigned',
  'is_pejabat', 'nama_snapshot', 'nip_snapshot', 'golongan_snapshot', 'jabatan_snapshot',
  'tujuan_kota', 'tanggal_mulai', 'tanggal_selesai', 'lama_hari', 'hari_uh_biasa', 'biaya_uh_biasa',
  'hari_uh_60', 'biaya_uh_60', 'hari_uh_halfday', 'biaya_uh_halfday', 'hari_uh_fullboard',
  'biaya_uh_fullboard', 'biaya_tiket', 'biaya_hotel', 'biaya_penginapan_30', 'biaya_trans_darat',
  'biaya_trans_lokal', 'biaya_trans_jakarta_pp', 'biaya_trans_daerah_pp', 'biaya_riil',
  'biaya_meeting', 'biaya_representatif', 'total_biaya', 'tiket_boarding_pass', 'tiket_pergi_no',
  'tiket_pergi_booking', 'tiket_pergi_maskapai', 'tiket_pergi_fare', 'tiket_pulang_no',
  'tiket_pulang_booking', 'tiket_pulang_maskapai', 'tiket_pulang_fare', 'hotel_nama',
  'hotel_checkin', 'hotel_checkout', 'hotel_malam', 'hotel_bill_folio', 'hotel_no_kamar',
  'riil_items_json', 'spj_nama_external', 'spj_sewa_kendaraan', 'spj_taksi_bandara',
  'spj_biaya_reschedule', 'spj_kurs_valuta', 'spj_pengembalian_kas'
]]);
XLSX.utils.book_append_sheet(wbFull, wsPeserta, 'DB_PESERTA');

const wsRekap = XLSX.utils.aoa_to_sheet([[
  'No SPBY', 'JENIS PENGAJUAN', 'No SPM', '', 'NAMA PEGAWAI INTERNAL INSPEKTORAT', 'NAMA EXTERNAL',
  'NIP', 'Gol', 'Jabatan', 'Jenis Perdin', 'Status Pegawai', 'Nama Kegiatan', 'No Surat Tugas',
  'Unit Kerja', 'Angkutan', 'Berangkat dari-', 'Tujuan ke-', 'Tgl Berangkat', 'Tgl Kembali',
  'Nomor Tiket', 'Nama Maskapai', 'Kode Booking', 'Boarding Pass (Ada/Tidak)', 'Nama Penginapan',
  'Tanggal Check In', 'Tanggal Check Out', 'Jumlah Hari Menginap', 'Lama Hari 100%', 'Lama Hari 40%',
  'Total Hari', 'UH 100% ()', 'UH 40% ()', 'UH Fullboard/Fullday/Halfday/Diklat',
  'Biaya Penginapan Biasa (Hotel)', 'Penginapan 30%', 'Biaya Fullboard/Fullday/Halfday ()',
  'Kurs ()', 'Riil ()', 'Harga Fare Tiket Pergi ()', 'Harga FareTiket Pulang ()',
  'Transport Jakarta PP', 'Transport Daerah PP', 'Biaya Transport ()', 'Sewa kendaraan ()',
  'Representatif ()', 'Taksi Bandara', 'Biaya Reschedule ()', 'Total',
  'Nilai Nominal di Daftar Nominatif', 'PENGEMBALIAN'
]]);
XLSX.utils.book_append_sheet(wbFull, wsRekap, 'REKAP_PERDIN_48KOLOM');

const wsLogs = XLSX.utils.aoa_to_sheet([[
  'Timestamp', 'Action', 'Reference_ID', 'Details'
]]);
XLSX.utils.book_append_sheet(wbFull, wsLogs, 'AUDIT_LOGS');

const outFullPath = path.join(__dirname, '../master_database_lengkap.xlsx');
XLSX.writeFile(wbFull, outFullPath);
console.log(`✅ Berhasil membuat file workbook lengkap: ${outFullPath}`);
