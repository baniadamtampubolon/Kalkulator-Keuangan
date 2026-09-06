/**
 * ============================================================================
 * BACKEND API GOOGLE APPS SCRIPT (v1.4 - Fixed 9-Column MASTER_MEMO & Full CRUD)
 * Aplikasi Kalkulator Keuangan, SPPD & Rekap Perdin Inspektorat
 * Kemenko Bidang Pangan RI
 * ============================================================================
 * 
 * PETUNJUK PEMASANGAN / UPDATE:
 * 1. Buka Google Spreadsheet Anda (DATABASE_PERDIN_INSPEKTORAT_2026).
 * 2. Buka menu Ekstensi > Apps Script (Extensions > Apps Script).
 * 3. Hapus seluruh kode lama di Code.gs, lalu tempelkan seluruh isi file ini.
 * 4. Klik ikon Simpan (Ctrl+S / Cmd+S).
 * 5. (PENTING) Untuk memperbarui Web App aktif:
 *    - Klik Deploy > Manage deployments (Kelola penerapan).
 *    - Klik ikon Pensil (Edit) pada deployment aktif.
 *    - Pilih Version: New version (Versi baru).
 *    - Klik Deploy.
 * 6. Jika ingin inisialisasi tab lembar kerja secara instan:
 *    - Pilih fungsi SETUP_INITIAL_TABS pada dropdown di samping tombol Run.
 *    - Klik Run (Jalankan).
 */

// OPTIONAL: Isi ID Spreadsheet jika menggunakan Standalone Script.
// Kosongkan ('') jika skrip dibuat langsung dari menu Ekstensi > Apps Script di Spreadsheet.
const SPREADSHEET_ID = '';

const SHEET_NAMES = {
  PEGAWAI: 'MASTER_PEGAWAI',
  SBM: 'MASTER_SBM',
  MEMO: 'MASTER_MEMO',
  KEGIATAN: 'DB_KEGIATAN',
  PESERTA: 'DB_PESERTA',
  REKAP: 'REKAP_PERDIN_48KOLOM',
  LOGS: 'AUDIT_LOGS'
};

const DEFAULT_HEADERS = {
  PEGAWAI: [
    'id_pegawai', 'kode_nama', 'no_urut', 'nama_lengkap', 'nip', 'jenis_kelamin',
    'pangkat', 'golongan', 'jabatan', 'kelas_jabatan', 'nama_bank', 'nomor_rekening',
    'is_active', 'updated_at'
  ],
  SBM: [
    'tahun_anggaran', 'nama_provinsi', 'uh_biasa', 'uh_halfday', 'uh_fullboard',
    'hotel_eselon1', 'hotel_eselon2', 'hotel_eselon3_gol4', 'hotel_eselon4_kebawah',
    'representatif_luar_kota', 'taksi_bandara'
  ],
  // FORMAT FIX 9 KOLOM MASTER MEMORANDUM
  MEMO: [
    'tahun_anggaran', 'nomor_urut', 'format_lengkap', 'tanggal_memo', 'perihal',
    'id_kegiatan_ref', 'status', 'nominal', 'MAK'
  ],
  KEGIATAN: [
    'id_kegiatan', 'kode_kegiatan', 'nama_kegiatan', 'jenis_pengajuan', 'no_spm', 'no_spby',
    'jenis_perdin', 'berangkat_dari', 'provinsi_tujuan', 'kota_tujuan_list', 'tanggal_mulai',
    'tanggal_selesai', 'alat_angkut', 'nomor_st_master', 'nomor_st_staf', 'nomor_st_pejabat',
    'use_different_st_pejabat', 'nomor_memo', 'tanggal_memo', 'tanggal_spd', 'kode_mak',
    'kode_komponen', 'item_detail', 'unit_kerja', 'ppk_nama', 'ppk_nip', 'bendahara_nama',
    'verifikator_nama', 'grand_total', 'status_dokumen', 'created_at'
  ],
  PESERTA: [
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
  ],
  REKAP: [
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
  ]
};

/**
 * FUNGSI SETUP OTOMATIS (Jalankan ini sekali via tombol Run di Apps Script jika ingin inisialisasi instan)
 */
function SETUP_INITIAL_TABS() {
  const ss = getSpreadsheet();
  getOrCreateSheet(ss, SHEET_NAMES.PEGAWAI, DEFAULT_HEADERS.PEGAWAI);
  getOrCreateSheet(ss, SHEET_NAMES.SBM, DEFAULT_HEADERS.SBM);
  getOrCreateSheet(ss, SHEET_NAMES.MEMO, DEFAULT_HEADERS.MEMO);
  getOrCreateSheet(ss, SHEET_NAMES.KEGIATAN, DEFAULT_HEADERS.KEGIATAN);
  getOrCreateSheet(ss, SHEET_NAMES.PESERTA, DEFAULT_HEADERS.PESERTA);
  getOrCreateSheet(ss, SHEET_NAMES.REKAP, DEFAULT_HEADERS.REKAP);
  getOrCreateSheet(ss, SHEET_NAMES.LOGS, ['Timestamp', 'Action', 'Reference_ID', 'Details']);
  Logger.log('✅ Inisialisasi 7 tab lembar kerja berhasil!');
}

function getSpreadsheet() {
  if (SPREADSHEET_ID && SPREADSHEET_ID.trim() !== '') {
    return SpreadsheetApp.openById(SPREADSHEET_ID.trim());
  }
  return SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.getActive();
}

/**
 * Handle HTTP GET Request
 */
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'GET_MASTERS';
  const ss = getSpreadsheet();

  try {
    if (action === 'GET_MASTERS') {
      const pegawaiSheet = getOrCreateSheet(ss, SHEET_NAMES.PEGAWAI, DEFAULT_HEADERS.PEGAWAI);
      const sbmSheet = getOrCreateSheet(ss, SHEET_NAMES.SBM, DEFAULT_HEADERS.SBM);
      const memoSheet = getOrCreateSheet(ss, SHEET_NAMES.MEMO, DEFAULT_HEADERS.MEMO);

      return createJsonResponse({
        status: 'success',
        data: {
          pegawai: sheetToObjects(pegawaiSheet),
          sbm: sheetToObjects(sbmSheet),
          memo: sheetToObjects(memoSheet)
        }
      });
    }

    if (action === 'GET_REKAP') {
      const rekapSheet = getOrCreateSheet(ss, SHEET_NAMES.REKAP, DEFAULT_HEADERS.REKAP);
      return createJsonResponse({
        status: 'success',
        data: sheetToObjects(rekapSheet)
      });
    }

    if (action === 'GET_KEGIATAN_LIST') {
      const kegiatanSheet = getOrCreateSheet(ss, SHEET_NAMES.KEGIATAN, DEFAULT_HEADERS.KEGIATAN);
      return createJsonResponse({
        status: 'success',
        data: sheetToObjects(kegiatanSheet)
      });
    }

    return createJsonResponse({ status: 'error', message: 'Action not found' });
  } catch (error) {
    return createJsonResponse({ status: 'error', message: error.toString() });
  }
}

/**
 * Handle HTTP POST Request (Simpan / Update Master Data & Transaksi Perdin)
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(30000);

  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    const ss = getSpreadsheet();

    // 1. TAMBAH / UPDATE MASTER PEGAWAI
    if (action === 'SAVE_PEGAWAI') {
      const p = payload.pegawai || {};
      const pegawaiSheet = getOrCreateSheet(ss, SHEET_NAMES.PEGAWAI, DEFAULT_HEADERS.PEGAWAI);
      const idPegawai = p.id_pegawai || p.idPegawai || ('PEG-' + (p.kode_nama || p.kodeNama || Date.now()));
      const namaLengkap = (p.nama_lengkap || p.nama || '').trim();
      const nip = (p.nip || '').trim();

      const rowData = [
        idPegawai,
        p.kode_nama || p.kodeNama || '',
        p.no_urut || p.no || '',
        namaLengkap,
        nip,
        p.jenis_kelamin || p.jenisKelamin || 'Laki-laki',
        p.pangkat || '',
        p.golongan || 'III/a',
        p.jabatan || 'Pelaksana',
        p.kelas_jabatan || p.kelasJabatan || '',
        p.nama_bank || p.namaBank || '',
        p.nomor_rekening || p.nomorRekening || '',
        true,
        new Date()
      ];

      upsertPegawai(pegawaiSheet, idPegawai, namaLengkap, nip, rowData);
      logAction(ss, 'SAVE_PEGAWAI', idPegawai, 'Menambahkan/memperbarui data pegawai ' + namaLengkap);

      return createJsonResponse({
        status: 'success',
        message: 'Data pegawai ' + namaLengkap + ' berhasil disimpan ke MASTER_PEGAWAI Google Spreadsheet.',
        idPegawai: idPegawai
      });
    }

    // 2. SIMPAN TRANSAKSI PERJALANAN DINAS & 48 KOLOM
    if (action === 'SAVE_PERDIN') {
      const header = payload.header || {};
      const participants = payload.participants || [];

      // 1. Simpan/Update DB_KEGIATAN
      const kegiatanSheet = getOrCreateSheet(ss, SHEET_NAMES.KEGIATAN, DEFAULT_HEADERS.KEGIATAN);
      upsertRowById(kegiatanSheet, 'id_kegiatan', header.idKegiatan, [
        header.idKegiatan,
        header.kodeKegiatan || '',
        header.namaKegiatan || '',
        header.jenisPengajuan || 'RAMPUNG',
        header.noSpm || '',
        header.noSpby || '',
        header.jenisPerdin || 'Perdin Luar Kota',
        header.berangkatDari || 'Jakarta',
        header.provinsiTujuan || '',
        JSON.stringify(header.kotaTujuanList || []),
        header.tanggalMulai || '',
        header.tanggalSelesai || '',
        header.alatAngkut || 'Angkutan Darat',
        header.nomorStMaster || '',
        header.nomorStStaff || '',
        header.nomorStPejabat || '',
        header.useDifferentStPejabat || false,
        header.nomorMemo || '',
        header.tanggalMemo || '',
        header.tanggalSpd || '',
        header.kodeMak || '524111',
        header.kodeKomponen || '051',
        header.itemDetail || '001',
        header.unitKerja || 'INSPEKTORAT',
        header.ppkNama || '',
        header.ppkNip || '',
        header.bendaharaNama || '',
        header.verifikatorNama || '',
        header.grandTotal || 0,
        header.statusDokumen || 'FINAL',
        new Date()
      ]);

      // 2. Simpan Detail DB_PESERTA & REKAP 48 Kolom
      const pesertaSheet = getOrCreateSheet(ss, SHEET_NAMES.PESERTA, DEFAULT_HEADERS.PESERTA);
      const rekapSheet = getOrCreateSheet(ss, SHEET_NAMES.REKAP, DEFAULT_HEADERS.REKAP);

      // Bersihkan baris lama kegiatan ini
      deleteRowsByColumnValue(pesertaSheet, 'id_kegiatan', header.idKegiatan);
      deleteRowsByColumnValue(rekapSheet, 'Nama Kegiatan', header.namaKegiatan);

      participants.forEach((p, idx) => {
        const idPeserta = header.idKegiatan + '-' + (idx + 1).toString().padStart(2, '0');

        // Baris untuk DB_PESERTA
        pesertaSheet.appendRow([
          idPeserta,
          header.idKegiatan,
          p.pegawaiId || '',
          idx + 1,
          p.nomorSpd || '',
          p.nomorStAssigned || header.nomorStStaff || '',
          p.isPejabat || false,
          p.nama || '',
          p.nip || '',
          p.golongan || '',
          p.jabatan || '',
          p.tujuanKota || '',
          p.tanggalMulai || '',
          p.tanggalSelesai || '',
          p.lamaHari || 0,
          p.hariUhBiasa || 0,
          p.biayaUhBiasa || 0,
          p.hariUh60 || 0,
          p.biayaUh60 || 0,
          p.hariUhHalfday || 0,
          p.biayaUhHalfday || 0,
          p.hariUhFullboard || 0,
          p.biayaUhFullboard || 0,
          p.biayaTiket || 0,
          p.biayaHotel || 0,
          p.biayaPenginapan30 || 0,
          p.biayaTransDarat || 0,
          p.biayaTransLokal || 0,
          p.biayaTransJakartaPp || 0,
          p.biayaTransDaerahPp || 0,
          p.biayaRiil || 0,
          p.biayaMeeting || 0,
          p.biayaRepresentatif || 0,
          p.totalBiaya || 0,
          p.ticketDetail?.boardingPassStatus || '',
          p.ticketDetail?.pergiNoTiket || '',
          p.ticketDetail?.pergiKodeBooking || '',
          p.ticketDetail?.pergiMaskapai || '',
          p.ticketDetail?.pergiHargaFare || 0,
          p.ticketDetail?.pulangNoTiket || '',
          p.ticketDetail?.pulangKodeBooking || '',
          p.ticketDetail?.pulangMaskapai || '',
          p.ticketDetail?.pulangHargaFare || 0,
          p.hotelDetail?.namaHotel || '',
          p.hotelDetail?.tanggalCheckin || '',
          p.hotelDetail?.tanggalCheckout || '',
          p.hotelDetail?.jumlahMalam || 1,
          p.hotelDetail?.noBillFolio || '',
          p.hotelDetail?.noKamar || '',
          JSON.stringify(p.riilItems || []),
          p.spjExtra?.namaExternal || '',
          p.spjExtra?.sewaKendaraan || 0,
          p.spjExtra?.taksiBandara || 0,
          p.spjExtra?.biayaReschedule || 0,
          p.spjExtra?.kursValuta || 0,
          p.spjExtra?.pengembalianKas || 0
        ]);

        // Baris untuk REKAP_PERDIN_48KOLOM
        rekapSheet.appendRow([
          header.noSpby || '',
          header.jenisPengajuan || 'RAMPUNG',
          header.noSpm || '',
          '',
          p.spjExtra?.namaExternal ? '' : p.nama,
          p.spjExtra?.namaExternal || '',
          p.nip || '',
          p.golongan || '',
          p.jabatan || '',
          header.jenisPerdin || 'Perdin Luar Kota',
          p.nip ? 'PNS' : 'Non-PNS',
          header.namaKegiatan || '',
          p.nomorStAssigned || header.nomorStStaff || '',
          header.unitKerja || 'INSPEKTORAT',
          header.alatAngkut || 'Angkutan Darat',
          header.berangkatDari || 'Jakarta',
          p.tujuanKota || '',
          p.tanggalMulai || '',
          p.tanggalSelesai || '',
          formatMultiTiket(p.ticketDetail?.pergiNoTiket, p.ticketDetail?.pulangNoTiket),
          formatMultiTiket(p.ticketDetail?.pergiMaskapai, p.ticketDetail?.pulangMaskapai),
          formatMultiTiket(p.ticketDetail?.pergiKodeBooking, p.ticketDetail?.pulangKodeBooking),
          p.ticketDetail?.boardingPassStatus || (p.biayaTiket > 0 ? 'ADA' : ''),
          p.hotelDetail?.namaHotel || '',
          p.hotelDetail?.tanggalCheckin || p.tanggalMulai,
          p.hotelDetail?.tanggalCheckout || p.tanggalSelesai,
          p.hotelDetail?.jumlahMalam || 1,
          p.hariUhBiasa || 0,
          p.hariUh60 || 0,
          p.lamaHari || 0,
          p.biayaUhBiasa || 0,
          p.biayaUh60 || 0,
          (p.biayaUhHalfday || 0) + (p.biayaUhFullboard || 0),
          p.biayaHotel || 0,
          p.biayaPenginapan30 || 0,
          p.biayaMeeting || 0,
          p.spjExtra?.kursValuta || 0,
          p.biayaRiil || 0,
          p.ticketDetail?.pergiHargaFare || 0,
          p.ticketDetail?.pulangHargaFare || 0,
          p.biayaTransJakartaPp || 0,
          p.biayaTransDaerahPp || 0,
          (p.biayaTransDarat || 0) + (p.biayaTransLokal || 0),
          p.spjExtra?.sewaKendaraan || 0,
          p.biayaRepresentatif || 0,
          p.spjExtra?.taksiBandara || 0,
          p.spjExtra?.biayaReschedule || 0,
          p.totalBiaya || 0,
          p.totalBiaya || 0,
          p.spjExtra?.pengembalianKas || 0
        ]);
      });

      // 3. Catat / Perbarui nomor memorandum di MASTER_MEMO (9 Kolom Baku)
      if (header.nomorMemo && String(header.nomorMemo).trim() !== '') {
        const memoSheet = getOrCreateSheet(ss, SHEET_NAMES.MEMO, DEFAULT_HEADERS.MEMO);
        upsertMemo(memoSheet, header.nomorMemo, {
          tanggal: header.tanggalMemo || '',
          perihal: header.keteranganMemo || header.namaKegiatan || '',
          nominal: header.grandTotal || 0,
          mak: header.kodeMak || '',
          idKegiatan: header.idKegiatan || ''
        });
      }

      logAction(ss, 'SAVE_PERDIN', header.idKegiatan, 'Berhasil menyimpan transaksi ' + (header.namaKegiatan || ''));

      return createJsonResponse({
        status: 'success',
        message: 'Data perjalanan dinas dan 48 kolom rekap berhasil disimpan ke Google Spreadsheet.',
        idKegiatan: header.idKegiatan
      });
    }

    // 3. SINKRONISASI BARIS REKAP 48 KOLOM
    if (action === 'SYNC_REKAP') {
      const rekapRows = payload.rekapRows || [];
      const rekapSheet = getOrCreateSheet(ss, SHEET_NAMES.REKAP, DEFAULT_HEADERS.REKAP);

      if (Array.isArray(rekapRows) && rekapRows.length > 0) {
        const lastRow = rekapSheet.getLastRow();
        const headers = lastRow > 0
          ? rekapSheet.getRange(1, 1, 1, rekapSheet.getLastColumn()).getValues()[0]
          : DEFAULT_HEADERS.REKAP;

        rekapRows.forEach(rowObj => {
          const rowArray = headers.map(h => (rowObj[h] !== undefined && rowObj[h] !== null ? rowObj[h] : ''));
          const namaPegawai = rowObj['NAMA PEGAWAI INTERNAL INSPEKTORAT'] || rowObj['NAMA EXTERNAL'] || '';
          const namaKegiatan = rowObj['Nama Kegiatan'] || '';

          let updated = false;
          if (lastRow >= 2) {
            const data = rekapSheet.getDataRange().getValues();
            const colPegawai = headers.indexOf('NAMA PEGAWAI INTERNAL INSPEKTORAT');
            const colKegiatan = headers.indexOf('Nama Kegiatan');

            for (let i = 1; i < data.length; i++) {
              if (
                colKegiatan !== -1 && String(data[i][colKegiatan]).trim() === String(namaKegiatan).trim() &&
                colPegawai !== -1 && String(data[i][colPegawai]).trim() === String(namaPegawai).trim()
              ) {
                rekapSheet.getRange(i + 1, 1, 1, rowArray.length).setValues([rowArray]);
                updated = true;
                break;
              }
            }
          }
          if (!updated) {
            rekapSheet.appendRow(rowArray);
          }
        });
      }

      logAction(ss, 'SYNC_REKAP', 'REKAP_48KOLOM', `Menyinkronkan ${rekapRows.length} baris rekap.`);
      return createJsonResponse({
        status: 'success',
        message: `Berhasil menyinkronkan ${rekapRows.length} baris ke tab REKAP_PERDIN_48KOLOM.`
      });
    }

    return createJsonResponse({ status: 'error', message: 'Unknown action: ' + action });
  } catch (error) {
    return createJsonResponse({ status: 'error', message: error.toString() });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Helper: Simpan / Perbarui Baris Pegawai (Anti-Duplikasi berdasarkan ID, NIP, atau Nama)
 */
function upsertPegawai(sheet, idPegawai, namaLengkap, nip, rowData) {
  if (!sheet) return;
  if (sheet.getLastRow() < 2) {
    sheet.appendRow(rowData);
    return;
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0] || [];
  const idCol = headers.indexOf('id_pegawai');
  const nameCol = headers.indexOf('nama_lengkap');
  const nipCol = headers.indexOf('nip');

  for (let i = 1; i < data.length; i++) {
    const curId = String(data[i][idCol] || '').trim();
    const curName = String(data[i][nameCol] || '').trim().toLowerCase();
    const curNip = String(data[i][nipCol] || '').trim();

    if (
      (curId && curId.toLowerCase() === String(idPegawai).toLowerCase()) ||
      (nip && curNip && curNip === nip) ||
      (namaLengkap && curName === namaLengkap.toLowerCase())
    ) {
      sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
      return;
    }
  }

  sheet.appendRow(rowData);
}

/**
 * Helper: Simpan / Perbarui Baris Memorandum di MASTER_MEMO (9 Kolom Baku)
 */
function upsertMemo(sheet, nomorMemo, info) {
  if (!sheet) return;
  const memoStr = String(nomorMemo || '').trim();
  if (!memoStr) return;

  // Ekstrak angka nomor urut (contoh M.321 -> 321)
  const match = memoStr.match(/\bM\.?(\d+)/i) || memoStr.match(/(\d+)/);
  const targetNum = match ? match[1] : '';

  // Ekstrak tahun anggaran (contoh 2026)
  const yearMatch = memoStr.match(/\/(\d{4})$/);
  const targetYear = yearMatch ? yearMatch[1] : new Date().getFullYear();

  const lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    const data = sheet.getDataRange().getValues();
    const headers = data[0] || [];
    const colTahun = headers.indexOf('tahun_anggaran');
    const colUrut = headers.indexOf('nomor_urut');
    const colFormat = headers.indexOf('format_lengkap');
    const colTgl = headers.indexOf('tanggal_memo');
    const colPerihal = headers.indexOf('perihal');
    const colRef = headers.indexOf('id_kegiatan_ref');
    const colStatus = headers.indexOf('status');
    const colNominal = headers.indexOf('nominal');
    const colMak = headers.indexOf('MAK') !== -1 ? headers.indexOf('MAK') : headers.indexOf('mak');

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowFormat = String(colFormat !== -1 ? row[colFormat] : row[2] || '').trim().toLowerCase();
      const rowUrut = String(colUrut !== -1 ? row[colUrut] : row[1] || '').trim();

      if (
        (rowFormat && rowFormat === memoStr.toLowerCase()) ||
        (targetNum && rowUrut && rowUrut === targetNum)
      ) {
        // Baris terdaftar ditemukan -> Perbarui data
        const rowNum = i + 1;
        if (colFormat !== -1) sheet.getRange(rowNum, colFormat + 1).setValue(memoStr);
        if (colTgl !== -1 && info.tanggal) sheet.getRange(rowNum, colTgl + 1).setValue(info.tanggal);
        if (colPerihal !== -1 && info.perihal) sheet.getRange(rowNum, colPerihal + 1).setValue(info.perihal);
        if (colRef !== -1 && info.idKegiatan) sheet.getRange(rowNum, colRef + 1).setValue(info.idKegiatan);
        if (colStatus !== -1) sheet.getRange(rowNum, colStatus + 1).setValue('TERPAKAI');
        if (colNominal !== -1 && info.nominal !== undefined && info.nominal !== null) {
          sheet.getRange(rowNum, colNominal + 1).setValue(info.nominal);
        }
        if (colMak !== -1 && info.mak) sheet.getRange(rowNum, colMak + 1).setValue(info.mak);
        return;
      }
    }
  }

  // Jika baris nomor memo belum ada di database, otomatis tambahkan baris baru
  sheet.appendRow([
    targetYear,
    targetNum ? Number(targetNum) : '',
    memoStr,
    info.tanggal || '',
    info.perihal || '',
    info.idKegiatan || '',
    'TERPAKAI',
    info.nominal !== undefined && info.nominal !== null ? info.nominal : '',
    info.mak || ''
  ]);
}

/**
 * Helper: Ambil Sheet atau Buat Baru jika belum ada
 */
function getOrCreateSheet(ss, sheetName, defaultHeaders) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (defaultHeaders && defaultHeaders.length > 0) {
      sheet.appendRow(defaultHeaders);
    }
  } else if (sheet.getLastRow() === 0 && defaultHeaders && defaultHeaders.length > 0) {
    sheet.appendRow(defaultHeaders);
  }
  return sheet;
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function sheetToObjects(sheet) {
  if (!sheet) return [];
  if (sheet.getLastRow() < 2) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  const headers = data[0];
  const rows = data.slice(1);

  return rows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      const key = header ? String(header).trim() : `_col_${index}`;
      obj[key] = row[index];
    });
    return obj;
  });
}

function upsertRowById(sheet, keyColumnName, keyValue, rowData) {
  if (!sheet) return;
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(rowData);
    return;
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0] || [];
  const keyIndex = headers.indexOf(keyColumnName);

  if (keyIndex !== -1) {
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][keyIndex]).trim().toLowerCase() === String(keyValue).trim().toLowerCase()) {
        sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
        return;
      }
    }
  }
  sheet.appendRow(rowData);
}

function deleteRowsByColumnValue(sheet, columnName, value) {
  if (!sheet) return;
  if (sheet.getLastRow() < 2) return;

  const data = sheet.getDataRange().getValues();
  const headers = data[0] || [];
  const colIndex = headers.indexOf(columnName);
  if (colIndex === -1) return;

  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][colIndex] === value) {
      sheet.deleteRow(i + 1);
    }
  }
}

function formatMultiTiket(pergi, pulang) {
  if (!pergi && !pulang) return '';
  return 'Berangkat : ' + (pergi || '-') + '\nPulang : ' + (pulang || '-');
}

function logAction(ss, action, refId, details) {
  try {
    const logSheet = getOrCreateSheet(ss, SHEET_NAMES.LOGS, ['Timestamp', 'Action', 'Reference_ID', 'Details']);
    logSheet.appendRow([new Date(), action, refId, details]);
  } catch (e) {}
}
