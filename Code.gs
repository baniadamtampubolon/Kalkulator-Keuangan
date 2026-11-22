/**
 * ============================================================================
 * BACKEND API GOOGLE APPS SCRIPT (v1.4 - Fixed 9-Column MASTER_MEMO & Full CRUD)
 * Aplikasi Kalkulator Keuangan, SPPD & Rekap Perdin Inspektorat
 * Kemenko Bidang Pangan RI
 * ============================================================================
 */

// OPTIONAL: Isi ID Spreadsheet jika menggunakan Standalone Script.
// Kosongkan ('') jika skrip dibuat langsung dari menu Ekstensi > Apps Script di Spreadsheet.
const SPREADSHEET_ID = '';

const SHEET_NAMES = {
  PEGAWAI: 'MASTER_PEGAWAI',
  SBM: 'MASTER_SBM',
  MEMO: 'MASTER_MEMO',
  MAK: 'MASTER_MAK',
  KEGIATAN: 'DB_KEGIATAN',
  PESERTA: 'DB_PESERTA',
  REKAP: 'REKAP_PERDIN_48KOLOM',
  REKAP_KONSUMSI: 'REKAP_SPJ_KONSUMSI',
  REKAP_SEWA: 'REKAP_SPJ_SEWA_KENDARAAN',
  REKAP_NARSUM: 'REKAP_SPJ_NARSUM',
  REKAP_ATK: 'REKAP_SPJ_ATK_SEMKIT',
  ANGGARAN: 'MONITORING_ANGGARAN',
  ANGGARAN_TRX: 'MONITORING_ANGGARAN_TRX',
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
  MAK: [
    'kode_komponen', 'kode_mak', 'nama_mak', 'kode_item', 'nama_item', 'full_label', 'full_mak'
  ],
  KEGIATAN: [
    'id_kegiatan', 'kode_kegiatan', 'nama_kegiatan', 'perihal', 'jenis_pengajuan', 'no_spm', 'no_spby',
    'jenis_perdin', 'berangkat_dari', 'provinsi_tujuan', 'kota_tujuan_list', 'tanggal_mulai',
    'tanggal_selesai', 'alat_angkut', 'nomor_st_master', 'nomor_st_staf', 'nomor_st_pejabat',
    'use_different_st_pejabat', 'nomor_memo', 'tanggal_memo', 'tanggal_spd', 'kode_mak',
    'kode_komponen', 'detail_komponen', 'item_detail', 'keterangan_item_detail', 'unit_kerja', 'ppk_nama', 'ppk_nip', 'bendahara_nama',
    'verifikator_nama', 'penanggung_jawab_nama', 'penanggung_jawab_nip', 'penanggung_jawab_jabatan',
    'grand_total', 'status_dokumen', 'payload_json', 'created_at', 'updated_at'
  ],
  PESERTA: [
    'id_peserta', 'id_kegiatan', 'id_pegawai', 'urutan', 'nomor_spd', 'nomor_st_assigned', 'nomor_memo',
    'is_pejabat', 'nama_snapshot', 'nip_snapshot', 'golongan_snapshot', 'jabatan_snapshot',
    'tujuan_kota', 'tujuan_provinsi', 'tanggal_mulai', 'tanggal_selesai', 'lama_hari',
    'hari_uh_biasa', 'biaya_uh_biasa', 'hari_uh_60', 'biaya_uh_60',
    'hari_uh_40', 'biaya_uh_40',
    'hari_uh_halfday', 'biaya_uh_halfday', 'hari_uh_fullboard',
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
    'Nilai Nominal di Daftar Nominatif', 'PENGEMBALIAN',
    'id_kegiatan', 'nomor_memo'
  ],
  REKAP_PENGADAAN: [
    'id_kegiatan', 'Jenis SPJ', 'Tanggal Kegiatan', 'Nomor Memo', 'Tanggal Memo', 'Perihal Memo',
    'Nama Kegiatan / Uraian Pembayaran', 'No SPBY', 'No SPM', 'Kode Komponen', 'Detail Komponen',
    'Kode MAK', 'Item Detail', 'No Item', 'Uraian Rincian Item', 'Volume', 'Satuan',
    'Harga Satuan', 'Jumlah Bruto Item', 'Sub Total Bruto Paket (Nilai Kuitansi)',
    'Jenis PPN', 'Nilai PPN', 'DPP (Dasar Pengenaan Pajak)', 'Jenis PPh', 'Nilai PPh',
    'Jumlah Bersih Diterima (Netto)', 'Nama Penerima / Vendor', 'NIP Penerima', 'Jabatan Penerima',
    'Rekening Transfer', 'Status NPWP', 'Nama Penanggung Jawab (Memo)', 'NIP Penanggung Jawab',
    'Jabatan Penanggung Jawab', 'PPK Nama', 'PPK NIP', 'Bendahara', 'Verifikator', 'Updated At'
  ],
  ANGGARAN: [
    'id', 'level', 'type', 'kode', 'uraian', 'pagu', 'lock',
    'real_lalu', 'real_ini', 'real_sd', 'persen', 'sisa',
    'parent_id', 'periode', 'updated_at'
  ],
  ANGGARAN_TRX: [
    'id_kegiatan', 'target_row_id', 'kode_akun_path', 'kode_item',
    'nama_kegiatan', 'nomor_memo', 'nominal', 'baseline_included', 'updated_at'
  ]
};

/**
 * Helper: Tentukan nama Sheet Rekap berdasarkan jenis SPJ Pengadaan (4 fitur SPJ baru)
 */
function getPengadaanSheetNameBySpjType(spjType) {
  const t = String(spjType || '').trim().toUpperCase();
  if (t === 'KONSUMSI') return SHEET_NAMES.REKAP_KONSUMSI;
  if (t === 'SEWA') return SHEET_NAMES.REKAP_SEWA;
  if (t === 'DIKLAT' || t === 'NARSUM') return SHEET_NAMES.REKAP_NARSUM;
  if (t === 'ATK' || t === 'SEMKIT') return SHEET_NAMES.REKAP_ATK;
  return null;
}

function getAllPengadaanSheetNames() {
  return [
    SHEET_NAMES.REKAP_KONSUMSI,
    SHEET_NAMES.REKAP_SEWA,
    SHEET_NAMES.REKAP_NARSUM,
    SHEET_NAMES.REKAP_ATK
  ];
}

/**
 * FUNGSI SETUP OTOMATIS (Jalankan sekali via tombol Run jika ingin inisialisasi instan)
 */
function SETUP_INITIAL_TABS() {
  const ss = getSpreadsheet();
  getOrCreateSheet(ss, SHEET_NAMES.PEGAWAI, DEFAULT_HEADERS.PEGAWAI);
  getOrCreateSheet(ss, SHEET_NAMES.SBM, DEFAULT_HEADERS.SBM);
  getOrCreateSheet(ss, SHEET_NAMES.MEMO, DEFAULT_HEADERS.MEMO);
  getOrCreateSheet(ss, SHEET_NAMES.MAK, DEFAULT_HEADERS.MAK);
  getOrCreateSheet(ss, SHEET_NAMES.KEGIATAN, DEFAULT_HEADERS.KEGIATAN);
  getOrCreateSheet(ss, SHEET_NAMES.PESERTA, DEFAULT_HEADERS.PESERTA);
  getOrCreateSheet(ss, SHEET_NAMES.REKAP, DEFAULT_HEADERS.REKAP);
  getOrCreateSheet(ss, SHEET_NAMES.REKAP_KONSUMSI, DEFAULT_HEADERS.REKAP_PENGADAAN);
  getOrCreateSheet(ss, SHEET_NAMES.REKAP_SEWA, DEFAULT_HEADERS.REKAP_PENGADAAN);
  getOrCreateSheet(ss, SHEET_NAMES.REKAP_NARSUM, DEFAULT_HEADERS.REKAP_PENGADAAN);
  getOrCreateSheet(ss, SHEET_NAMES.REKAP_ATK, DEFAULT_HEADERS.REKAP_PENGADAAN);
  getOrCreateSheet(ss, SHEET_NAMES.ANGGARAN, DEFAULT_HEADERS.ANGGARAN);
  getOrCreateSheet(ss, SHEET_NAMES.ANGGARAN_TRX, DEFAULT_HEADERS.ANGGARAN_TRX);
  getOrCreateSheet(ss, SHEET_NAMES.LOGS, ['Timestamp', 'Action', 'Reference_ID', 'Details']);
  Logger.log('✅ Inisialisasi 14 tab lembar kerja (termasuk Monitoring Anggaran & 4 sheet Rekap SPJ Baru) berhasil!');
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
      const makSheet = getOrCreateSheet(ss, SHEET_NAMES.MAK, DEFAULT_HEADERS.MAK);

      return createJsonResponse({
        status: 'success',
        data: {
          pegawai: sheetToObjects(pegawaiSheet),
          sbm: sheetToObjects(sbmSheet),
          memo: sheetToObjects(memoSheet),
          mak: sheetToObjects(makSheet),
          latestSpdNumber: getLatestSpdNumberFromSheet(ss)
        }
      });
    }

    if (action === 'GET_REKAP') {
      const rekapSheet = getOrCreateSheet(ss, SHEET_NAMES.REKAP, DEFAULT_HEADERS.REKAP);
      return createJsonResponse({
        status: 'success',
        data: sheetToObjects(rekapSheet),
        latestSpdNumber: getLatestSpdNumberFromSheet(ss)
      });
    }

    if (action === 'GET_KEGIATAN_LIST') {
      const kegiatanSheet = getOrCreateSheet(ss, SHEET_NAMES.KEGIATAN, DEFAULT_HEADERS.KEGIATAN);
      return createJsonResponse({
        status: 'success',
        data: sheetToObjects(kegiatanSheet),
        latestSpdNumber: getLatestSpdNumberFromSheet(ss)
      });
    }

    if (action === 'GET_PESERTA') {
      const pesertaSheet = getOrCreateSheet(ss, SHEET_NAMES.PESERTA, DEFAULT_HEADERS.PESERTA);
      return createJsonResponse({
        status: 'success',
        data: sheetToObjects(pesertaSheet),
        latestSpdNumber: getLatestSpdNumberFromSheet(ss)
      });
    }

    if (action === 'GET_REKAP_PENGADAAN') {
      const spjTypeParam = (e && e.parameter && e.parameter.spjType) || '';
      const targetSheetName = getPengadaanSheetNameBySpjType(spjTypeParam);
      if (targetSheetName) {
        const pSheet = getOrCreateSheet(ss, targetSheetName, DEFAULT_HEADERS.REKAP_PENGADAAN);
        return createJsonResponse({
          status: 'success',
          data: sheetToObjects(pSheet),
          sheetName: targetSheetName
        });
      }
      const konsumsiSheet = getOrCreateSheet(ss, SHEET_NAMES.REKAP_KONSUMSI, DEFAULT_HEADERS.REKAP_PENGADAAN);
      const sewaSheet = getOrCreateSheet(ss, SHEET_NAMES.REKAP_SEWA, DEFAULT_HEADERS.REKAP_PENGADAAN);
      const narsumSheet = getOrCreateSheet(ss, SHEET_NAMES.REKAP_NARSUM, DEFAULT_HEADERS.REKAP_PENGADAAN);
      const atkSheet = getOrCreateSheet(ss, SHEET_NAMES.REKAP_ATK, DEFAULT_HEADERS.REKAP_PENGADAAN);
      return createJsonResponse({
        status: 'success',
        data: {
          konsumsi: sheetToObjects(konsumsiSheet),
          sewa: sheetToObjects(sewaSheet),
          narsum: sheetToObjects(narsumSheet),
          atk: sheetToObjects(atkSheet)
        }
      });
    }

    if (action === 'GET_ANGGARAN') {
      const angState = readAnggaranFromSheet(ss);
      return createJsonResponse({
        status: 'success',
        needsSeed: angState.rows.length === 0,
        periode: angState.periode || 'November 2026',
        rows: angState.rows,
        transactions: angState.transactions
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
  if (!lock.tryLock(30000)) {
    return createJsonResponse({
      status: 'error',
      message: 'Server sedang sibuk memproses permintaan lain. Silakan coba lagi dalam beberapa detik.'
    });
  }

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

    // 1b. SINKRONISASI MASTER MAK & ITEM DETAIL
    if (action === 'SYNC_MASTER_MAK') {
      const items = payload.items || [];
      const makSheet = getOrCreateSheet(ss, SHEET_NAMES.MAK, DEFAULT_HEADERS.MAK);
      makSheet.clearContents();
      makSheet.appendRow(DEFAULT_HEADERS.MAK);
      if (items.length > 0) {
        const rows = items.map(it => [
          it.kodeKomponen || '',
          it.kodeMak || '',
          it.namaMak || '',
          it.kode || '',
          it.nama || '',
          it.fullLabel || '',
          it.fullMak || ''
        ]);
        makSheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
      }
      return createJsonResponse({
        status: 'success',
        message: 'Master MAK & Item Detail (' + items.length + ' item) berhasil disinkronkan ke MASTER_MAK Google Spreadsheet.'
      });
    }

    // 2. SIMPAN TRANSAKSI PERJALANAN DINAS & 48 KOLOM
    if (action === 'SAVE_PERDIN') {
      const header = payload.header || {};
      const participants = Array.isArray(payload.participants) ? payload.participants : [];
      const isNewRecord = payload.isNewRecord === true || !header.oldIdKegiatan;

      const kegiatanSheet = getOrCreateSheet(ss, SHEET_NAMES.KEGIATAN, DEFAULT_HEADERS.KEGIATAN);
      const memoSheet = getOrCreateSheet(ss, SHEET_NAMES.MEMO, DEFAULT_HEADERS.MEMO);
      const pesertaSheet = getOrCreateSheet(ss, SHEET_NAMES.PESERTA, DEFAULT_HEADERS.PESERTA);
      const rekapSheet = getOrCreateSheet(ss, SHEET_NAMES.REKAP, DEFAULT_HEADERS.REKAP);

      // Parse fullSnapshot agar ID/Memo/SPD hasil resolusi atomik server tersinkron di payload_json
      let snapshotObj = payload.fullSnapshot || null;
      if (!snapshotObj && header.payload_json) {
        try {
          snapshotObj = JSON.parse(header.payload_json);
        } catch (e) {}
      }

      // 0a. Resolusi ID Kegiatan atomik di dalam LockService (cegah 2 user menimpa ID yang sama)
      const requestedIdKegiatan = String(header.idKegiatan || '').trim();
      const reservedMemoToken = String(payload.reservedMemo || header.reservedMemo || '').trim();
      const idResolution = resolveUniqueIdKegiatan(
        kegiatanSheet,
        memoSheet,
        requestedIdKegiatan,
        isNewRecord,
        header.oldIdKegiatan,
        reservedMemoToken
      );
      const finalIdKegiatan = idResolution.idKegiatan;
      const idWasReassigned = idResolution.reassigned;
      header.idKegiatan = finalIdKegiatan;

      // 1. Simpan / Perbarui nomor memorandum di MASTER_MEMO (9 Kolom Baku) dengan proteksi tabrakan
      const memoRes = upsertMemo(memoSheet, header.nomorMemo, {
        tanggal: header.tanggalMemo || header.tanggalSpd || '',
        perihal: header.keteranganKegiatan || header.keteranganMemo || header.perihal || 'Permintaan Pembayaran Langsung (LS) Perjalanan Dinas',
        nominal: header.grandTotal || 0,
        mak: header.kodeMak || '524111',
        idKegiatan: finalIdKegiatan,
        isNewRecord: isNewRecord,
        oldNomorMemo: header.oldNomorMemo || '',
        reservedMemo: reservedMemoToken
      }, true);
      const assignedMemo = typeof memoRes === 'object' ? memoRes.memoStr : memoRes;
      const memoWasReassigned = typeof memoRes === 'object' ? Boolean(memoRes.reassigned) : false;

      // 1b. Resolusi SPD otomatis bila isNewRecord & SPD sudah dipakai kegiatan lain (cegah tabrakan SPD antar user)
      let spdWasReassigned = false;
      const spjTypeCheck = String(header.spjType || payload.spjType || 'PERDIN').trim().toUpperCase();
      const assignedSpdNumbers = [];
      if (isNewRecord && spjTypeCheck === 'PERDIN' && participants.length > 0) {
        const usedSpdMap = collectUsedSpdNumbers(pesertaSheet, finalIdKegiatan);
        let nextSpdNum = Math.max(getLatestSpdNumberFromSheet(ss), usedSpdMap.maxNum) + 1;

        participants.forEach(function(p, idx) {
          const rawSpd = String(p.nomorSpd || '').trim();
          const parsedSpd = parseInt(rawSpd.replace(/\D/g, ''), 10);
          const isValidNum = !isNaN(parsedSpd) && parsedSpd > 0;
          if (!isValidNum || usedSpdMap.used[parsedSpd]) {
            const newSpdStr = nextSpdNum < 10 ? '0' + nextSpdNum : String(nextSpdNum);
            if (rawSpd !== newSpdStr) spdWasReassigned = true;
            p.nomorSpd = newSpdStr;
            usedSpdMap.used[nextSpdNum] = true;
            nextSpdNum++;
          } else {
            usedSpdMap.used[parsedSpd] = true;
          }
          assignedSpdNumbers.push(String(p.nomorSpd || ''));
          if (snapshotObj && Array.isArray(snapshotObj.rows) && snapshotObj.rows[idx]) {
            snapshotObj.rows[idx].nomorSpd = p.nomorSpd;
          }
        });
      } else {
        participants.forEach(function(p) {
          assignedSpdNumbers.push(String(p.nomorSpd || ''));
        });
      }

      // Sinkronkan perubahan atomik ID / Memo ke snapshotObj
      const finalNomorMemo = assignedMemo || header.nomorMemo || '';
      if (snapshotObj) {
        snapshotObj.idKegiatan = finalIdKegiatan;
        if (snapshotObj.header) {
          snapshotObj.header.idKegiatan = finalIdKegiatan;
          snapshotObj.header.nomorMemo = finalNomorMemo;
          const idMatch = finalIdKegiatan.match(/^KEG-\d{4}-(\d+)-/);
          if (idMatch) snapshotObj.header.noKegiatanUrut = idMatch[1];
        }
      }

      // 2. Simpan / Perbarui Item Detail DIPA ke MASTER_MAK jika ada
      if (header.itemDetail && String(header.itemDetail).trim() !== '') {
        const makSheet = getOrCreateSheet(ss, SHEET_NAMES.MAK, DEFAULT_HEADERS.MAK);
        upsertMakItem(makSheet, {
          kodeKomponen: header.kodeKomponen || 'CL.7458.ABR.006.075.EE',
          kodeMak: header.kodeMak || '524111',
          kode: header.itemDetail,
          nama: header.keteranganItemDetail || ''
        });
      }

      // 3. Simpan/Update DB_KEGIATAN dengan Header-Aware Mapping

      // Ambil No SPM manual yang sudah ada di spreadsheet (jika ada) agar tidak tertimpa/terhapus saat simpan
      let existingManualSpm = '';
      if (!isNewRecord && rekapSheet.getLastRow() >= 2) {
        const rData = rekapSheet.getDataRange().getValues();
        const rHeaders = rData[0] || DEFAULT_HEADERS.REKAP;
        const spmCol = rHeaders.indexOf('No SPM') !== -1 ? rHeaders.indexOf('No SPM') : 2;
        const kegCol = rHeaders.indexOf('Nama Kegiatan') !== -1 ? rHeaders.indexOf('Nama Kegiatan') : 11;
        for (let i = 1; i < rData.length; i++) {
          const rowKeg = String(rData[i][kegCol] || '').trim();
          if (rowKeg && (rowKeg === header.namaKegiatan || (header.oldNamaKegiatan && rowKeg === header.oldNamaKegiatan))) {
            const val = String(rData[i][spmCol] || '').trim();
            if (val) {
              existingManualSpm = val;
              break;
            }
          }
        }
      }

      // Cari data kegiatan sebelumnya di DB_KEGIATAN HANYA jika ini adalah update/edit (!isNewRecord) SEBELUM deleteRowsByColumnValue / upsert
      let prevNamaFromDb = !isNewRecord ? (header.oldNamaKegiatan || '').trim() : '';
      let prevMemoFromDb = !isNewRecord ? (header.oldNomorMemo || '').trim() : '';
      let prevDbGrandTotal = 0;
      const targetSearchId = !isNewRecord ? (header.oldIdKegiatan || header.idKegiatan || '').trim() : '';

      if (!isNewRecord && kegiatanSheet.getLastRow() >= 2 && targetSearchId) {
        const kegData = kegiatanSheet.getDataRange().getValues();
        const kegHeaders = kegData[0] || [];
        const colKegId = kegHeaders.indexOf('id_kegiatan');
        const colKegNama = kegHeaders.indexOf('nama_kegiatan');
        const colKegMemo = kegHeaders.indexOf('nomor_memo');
        const colKegGrandTotal = kegHeaders.indexOf('grand_total');

        if (colKegId !== -1) {
          for (let k = 1; k < kegData.length; k++) {
            if (String(kegData[k][colKegId] || '').trim().toLowerCase() === targetSearchId.toLowerCase()) {
              if (!prevNamaFromDb && colKegNama !== -1) {
                prevNamaFromDb = String(kegData[k][colKegNama] || '').trim();
              }
              if (!prevMemoFromDb && colKegMemo !== -1) {
                prevMemoFromDb = String(kegData[k][colKegMemo] || '').trim();
              }
              if (colKegGrandTotal !== -1) {
                prevDbGrandTotal = parseAnggaranNumberGas(kegData[k][colKegGrandTotal]);
              }
              break;
            }
          }
        }
      }

      if (!isNewRecord && header.oldIdKegiatan && header.oldIdKegiatan !== finalIdKegiatan) {
        deleteRowsByColumnValue(kegiatanSheet, 'id_kegiatan', header.oldIdKegiatan);
      }

      const rawKotaTujuan = header.kotaTujuanList;
      const kotaTujuanListStr = typeof rawKotaTujuan === 'string' ? rawKotaTujuan : JSON.stringify(rawKotaTujuan || []);

      const payloadJsonStr = snapshotObj ? JSON.stringify(snapshotObj) : (header.payload_json || '');
      const finalNoSpmToUse = header.noSpm || existingManualSpm || '';
      const wasAutoReassigned = Boolean(idWasReassigned || memoWasReassigned || spdWasReassigned);

      const kegiatanData = {
        id_kegiatan: header.idKegiatan || '',
        kode_kegiatan: header.kodeKegiatan || '',
        nama_kegiatan: header.namaKegiatan || '',
        perihal: header.perihal || header.keteranganMemo || 'Permintaan Pembayaran Langsung (LS) Perjalanan Dinas',
        jenis_pengajuan: header.jenisPengajuan || 'RAMPUNG',
        no_spm: finalNoSpmToUse,
        no_spby: header.noSpby || '',
        jenis_perdin: header.jenisPerdin || 'Perdin Luar Kota',
        berangkat_dari: header.berangkatDari || 'Jakarta',
        provinsi_tujuan: header.provinsiTujuan || '',
        kota_tujuan_list: kotaTujuanListStr,
        tanggal_mulai: header.tanggalMulai || '',
        tanggal_selesai: header.tanggalSelesai || '',
        alat_angkut: header.alatAngkut || 'Angkutan Darat',
        nomor_st_master: header.nomorStMaster || '',
        nomor_st_staf: header.nomorStStaff || header.nomorStMaster || '',
        nomor_st_pejabat: header.nomorStPejabat || header.nomorStMaster || '',
        use_different_st_pejabat: Boolean(header.useDifferentStPejabat),
        nomor_memo: finalNomorMemo,
        tanggal_memo: header.tanggalMemo || '',
        tanggal_spd: header.tanggalSpd || '',
        kode_mak: header.kodeMak || '524111',
        kode_komponen: header.kodeKomponen || 'CL.7458.ABR.006.075.EE',
        detail_komponen: header.detailKomponen || '',
        item_detail: header.itemDetail || '001',
        keterangan_item_detail: header.keteranganItemDetail || '',
        unit_kerja: header.unitKerja || 'INSPEKTORAT',
        ppk_nama: header.ppkNama || '',
        ppk_nip: header.ppkNip || '',
        bendahara_nama: header.bendaharaNama || '',
        verifikator_nama: header.verifikatorNama || '',
        penanggung_jawab_nama: header.penanggungJawabNama || '',
        penanggung_jawab_nip: header.penanggungJawabNip || '',
        penanggung_jawab_jabatan: header.penanggungJawabJabatan || '',
        grand_total: header.grandTotal || 0,
        status_dokumen: header.statusDokumen || 'FINAL',
        payload_json: payloadJsonStr,
        created_at: header.createdAt || new Date(),
        updated_at: new Date()
      };

      upsertRowByHeaderObject(kegiatanSheet, 'id_kegiatan', finalIdKegiatan, kegiatanData, DEFAULT_HEADERS.KEGIATAN);

      // Bersihkan baris lama di DB_PESERTA sebelum menulis data baru
      deleteRowsByColumnValue(pesertaSheet, 'id_kegiatan', finalIdKegiatan);
      if (!isNewRecord && header.oldIdKegiatan && header.oldIdKegiatan !== finalIdKegiatan) {
        deleteRowsByColumnValue(pesertaSheet, 'id_kegiatan', header.oldIdKegiatan);
      }

      // Bersihkan baris lama di ke-4 sheet REKAP SPJ Baru jika ada update/perubahan jenis SPJ
      const allPengadaanSheets = getAllPengadaanSheetNames();
      allPengadaanSheets.forEach(function(sName) {
        const sObj = ss.getSheetByName(sName);
        if (sObj && sObj.getLastRow() >= 2) {
          deleteRowsByColumnValue(sObj, 'id_kegiatan', finalIdKegiatan);
          if (!isNewRecord && header.oldIdKegiatan && header.oldIdKegiatan !== finalIdKegiatan) {
            deleteRowsByColumnValue(sObj, 'id_kegiatan', header.oldIdKegiatan);
          }
          if (!isNewRecord && finalNomorMemo) {
            deleteRowsByColumnValue(sObj, 'Nomor Memo', finalNomorMemo);
          }
          if (!isNewRecord && (prevMemoFromDb || header.oldNomorMemo)) {
            deleteRowsByColumnValue(sObj, 'Nomor Memo', prevMemoFromDb || header.oldNomorMemo);
          }
        }
      });

      const spjType = String(header.spjType || payload.spjType || 'PERDIN').trim().toUpperCase();
      const targetPengadaanSheetName = getPengadaanSheetNameBySpjType(spjType);

      // JIKA MERUPAKAN SALAH SATU DARI 4 FITUR SPJ BARU (KONSUMSI, SEWA, NARSUM/DIKLAT, ATK & SEMKIT):
      if (targetPengadaanSheetName) {
        // Pastikan tidak ada sisa baris di REKAP_PERDIN_48KOLOM jika sebelumnya pernah tersimpan di sana
        deleteRekapRowsByKeys(rekapSheet, {
          idKegiatan: finalIdKegiatan,
          oldIdKegiatan: !isNewRecord ? header.oldIdKegiatan : '',
          nomorMemo: finalNomorMemo,
          oldNomorMemo: !isNewRecord ? (prevMemoFromDb || header.oldNomorMemo) : '',
          namaKegiatan: header.namaKegiatan,
          oldNamaKegiatan: !isNewRecord ? (prevNamaFromDb || header.oldNamaKegiatan) : '',
          participantNames: []
        });

        const pengadaanSheet = getOrCreateSheet(ss, targetPengadaanSheetName, DEFAULT_HEADERS.REKAP_PENGADAAN);
        const pengadaanData = payload.pengadaan || {};
        const items = Array.isArray(pengadaanData.items) && pengadaanData.items.length > 0
          ? pengadaanData.items
          : (Array.isArray(header.pengadaanItems) ? header.pengadaanItems : []);
        const tax = pengadaanData.tax || header.pengadaanTax || {};
        const calc = pengadaanData.calc || {};

        const spjLabelMap = {
          'KONSUMSI': 'SPJ Konsumsi',
          'SEWA': 'SPJ Sewa Kendaraan',
          'DIKLAT': 'SPJ Narsum',
          'NARSUM': 'SPJ Narsum',
          'ATK': 'SPJ ATK dan Seminar Kit',
          'SEMKIT': 'SPJ ATK dan Seminar Kit'
        };
        const jenisSpjLabel = spjLabelMap[spjType] || spjType;
        const itemDetailFull = (header.itemDetail || '001') + (header.keteranganItemDetail ? ' - ' + header.keteranganItemDetail : '');

        const pengadaanBatch = [];
        const itemsToWrite = items.length > 0 ? items : [{
          uraian: header.namaKegiatan || jenisSpjLabel,
          volume: 1,
          satuan: 'Paket',
          hargaSatuan: Number(header.grandTotal) || 0
        }];

        itemsToWrite.forEach(function(it, idx) {
          const vol = Number(it.jumlah !== undefined ? it.jumlah : it.volume) || 0;
          const harga = Number(it.hargaSatuan) || 0;
          const brutoItem = vol * harga;
          const ppnLabel = tax.ppnMode === 'INCLUDE_11_111' ? 'PPN 11/111 (Include)' : (tax.ppnMode === 'MANUAL' ? 'PPN Manual' : 'Tanpa PPN');

          pengadaanBatch.push([
            header.idKegiatan || '',
            jenisSpjLabel,
            header.tanggalSpd || header.tanggalMulai || '',
            finalNomorMemo || '',
            header.tanggalMemo || '',
            header.perihal || header.keteranganMemo || '',
            header.namaKegiatan || '',
            header.noSpby || '',
            finalNoSpmToUse || '',
            header.kodeKomponen || '',
            header.detailKomponen || '',
            header.kodeMak || '',
            itemDetailFull,
            idx + 1,
            it.uraian || '',
            vol,
            it.satuan || 'Paket',
            harga,
            brutoItem,
            calc.subTotalBruto !== undefined ? calc.subTotalBruto : (header.grandTotal || brutoItem),
            calc.ppnLabel || ppnLabel,
            calc.nilaiPpn !== undefined ? calc.nilaiPpn : 0,
            calc.dpp !== undefined ? calc.dpp : (header.grandTotal || brutoItem),
            calc.pphLabel || tax.pphType || '',
            calc.nilaiPph !== undefined ? calc.nilaiPph : 0,
            calc.jumlahBersih !== undefined ? calc.jumlahBersih : (header.grandTotal || brutoItem),
            tax.penerimaNama || header.penanggungJawabNama || '',
            tax.penerimaNip || header.penanggungJawabNip || '',
            tax.penerimaJabatan || header.penanggungJawabJabatan || '',
            tax.rekeningTransfer || tax.nomorRekening || '',
            tax.pphType === 'PPH23_4' || tax.hasNpwp === false ? 'Tanpa NPWP' : 'Ber-NPWP',
            header.penanggungJawabNama || '',
            header.penanggungJawabNip || '',
            header.penanggungJawabJabatan || '',
            header.ppkNama || '',
            header.ppkNip || '',
            header.bendaharaNama || '',
            header.verifikatorNama || '',
            new Date()
          ]);
        });

        if (pengadaanBatch.length > 0) {
          const sheetCols = pengadaanSheet.getLastColumn() || DEFAULT_HEADERS.REKAP_PENGADAAN.length;
          const adjustedPengadaanBatch = pengadaanBatch.map(function(row) {
            if (row.length === sheetCols) return row;
            if (row.length < sheetCols) {
              const copy = row.slice();
              while (copy.length < sheetCols) copy.push('');
              return copy;
            }
            return row.slice(0, sheetCols);
          });
          pengadaanSheet.getRange(pengadaanSheet.getLastRow() + 1, 1, adjustedPengadaanBatch.length, sheetCols)
            .setValues(adjustedPengadaanBatch);
        }

        const anggaranRes = applySpjDeductionToAnggaranGas(ss, {
          idKegiatan: finalIdKegiatan,
          oldIdKegiatan: !isNewRecord ? (header.oldIdKegiatan || '') : '',
          isNewRecord: isNewRecord,
          kodeKomponen: header.kodeKomponen || header.nomorKomp || '',
          kodeMak: header.kodeMak || '524111',
          itemDetail: header.itemDetail || '',
          keteranganItem: header.keteranganItemDetail || '',
          namaKegiatan: header.namaKegiatan || '',
          nomorMemo: finalNomorMemo || '',
          grandTotal: parseAnggaranNumberGas(header.grandTotal),
          prevDbGrandTotal: prevDbGrandTotal,
          initialAnggaranRows: Array.isArray(payload.initialAnggaranRows) ? payload.initialAnggaranRows : null,
          initialPeriode: String(payload.anggaranPeriode || 'November 2026')
        });

        logAction(ss, 'SAVE_' + spjType, header.idKegiatan, 'Berhasil menyimpan ' + jenisSpjLabel + ' ke ' + targetPengadaanSheetName);

        return createJsonResponse({
          status: 'success',
          message: 'Data ' + jenisSpjLabel + ' berhasil disimpan ke sheet ' + targetPengadaanSheetName + ' & berbagi nomor di MASTER_MEMO.',
          idKegiatan: finalIdKegiatan,
          assignedIdKegiatan: finalIdKegiatan,
          assignedNomorMemo: finalNomorMemo,
          assignedSpdNumbers: assignedSpdNumbers,
          wasAutoReassigned: wasAutoReassigned,
          sheetName: targetPengadaanSheetName,
          latestSpdNumber: getLatestSpdNumberFromSheet(ss),
          updatedAnggaranRows: anggaranRes.rows,
          anggaranPeriode: anggaranRes.periode,
          anggaranApplied: anggaranRes.applied
        });
      }

      // FILTER ANTI-HANTU: Hanya peserta yang memiliki nama yang disimpan ke database
      const validParticipants = participants.filter(p => {
        const nama = String(p.nama || '').trim();
        const ext = String(p.spjExtra?.namaExternal || p.namaExternal || '').trim();
        return nama !== '' || ext !== '';
      });

      // Bersihkan baris lama di REKAP_PERDIN_48KOLOM berdasarkan ID Kegiatan, Nomor Memo, dan Judul Kegiatan
      deleteRekapRowsByKeys(rekapSheet, {
        idKegiatan: finalIdKegiatan,
        oldIdKegiatan: !isNewRecord ? header.oldIdKegiatan : '',
        nomorMemo: finalNomorMemo,
        oldNomorMemo: !isNewRecord ? (prevMemoFromDb || header.oldNomorMemo) : '',
        namaKegiatan: header.namaKegiatan,
        oldNamaKegiatan: !isNewRecord ? (prevNamaFromDb || header.oldNamaKegiatan) : '',
        participantNames: validParticipants.map(function(p) {
          return String(p.nama || p.spjExtra?.namaExternal || p.namaExternal || '').trim();
        })
      });

      // Batch write: Kumpulkan semua baris lalu tulis sekaligus (5-10x lebih cepat)
      const pesertaBatch = [];
      const rekapBatch = [];

      validParticipants.forEach((p, idx) => {
        const idPeserta = header.idKegiatan + '-' + (idx + 1).toString().padStart(2, '0');

        pesertaBatch.push([
          idPeserta,
          header.idKegiatan,
          p.pegawaiId || '',
          idx + 1,
          p.nomorSpd || '',
          p.nomorStAssigned || header.nomorStStaff || '',
          finalNomorMemo,
          p.isPejabat || false,
          p.nama || '',
          p.nip || '',
          p.golongan || '',
          p.jabatan || '',
          p.tujuanKota || '',
          p.tujuanProvinsi || header.provinsiTujuan || '',
          p.tanggalMulai || '',
          p.tanggalSelesai || '',
          p.lamaHari || 0,
          p.hariUhBiasa || 0,
          p.biayaUhBiasa || 0,
          p.hariUh60 || 0,
          p.biayaUh60 || 0,
          p.hariUh40 || 0,
          p.biayaUh40 || 0,
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

        rekapBatch.push([
          header.noSpby || '',
          header.jenisPengajuan || 'RAMPUNG',
          finalNoSpmToUse,
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
          p.hariUh40 || p.hariUh60 || 0,
          p.lamaHari || 0,
          p.biayaUhBiasa || 0,
          p.biayaUh40 || p.biayaUh60 || 0,
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
          p.spjExtra?.pengembalianKas || 0,
          header.idKegiatan || '',
          finalNomorMemo || ''
        ]);
      });

      // Batch write DB_PESERTA
      if (pesertaBatch.length > 0) {
        pesertaSheet.getRange(pesertaSheet.getLastRow() + 1, 1, pesertaBatch.length, pesertaBatch[0].length)
          .setValues(pesertaBatch);
      }

      // Batch write REKAP_PERDIN_48KOLOM
      if (rekapBatch.length > 0) {
        const rekapCols = rekapSheet.getLastColumn();
        const adjustedBatch = rekapBatch.map(function(row) {
          if (row.length === rekapCols) return row;
          if (row.length < rekapCols) {
            const copy = row.slice();
            while (copy.length < rekapCols) copy.push('');
            return copy;
          }
          return row.slice(0, rekapCols);
        });
        rekapSheet.getRange(rekapSheet.getLastRow() + 1, 1, adjustedBatch.length, rekapCols)
          .setValues(adjustedBatch);
      }

      // Pembersihan akhir baris hantu setelah penulisan selesai
      pruneGhostRows(pesertaSheet);
      pruneGhostRows(rekapSheet);

      const perdinFallbackTotal = validParticipants.reduce(function(acc, p) {
        return acc + parseAnggaranNumberGas(p.totalJumlah || p.totalBiaya || p.total_biaya);
      }, 0);
      const effectivePerdinTotal = parseAnggaranNumberGas(header.grandTotal) || perdinFallbackTotal;

      const anggaranRes = applySpjDeductionToAnggaranGas(ss, {
        idKegiatan: finalIdKegiatan,
        oldIdKegiatan: !isNewRecord ? (header.oldIdKegiatan || '') : '',
        isNewRecord: isNewRecord,
        kodeKomponen: header.kodeKomponen || header.nomorKomp || '',
        kodeMak: header.kodeMak || '524111',
        itemDetail: header.itemDetail || '',
        keteranganItem: header.keteranganItemDetail || '',
        namaKegiatan: header.namaKegiatan || '',
        nomorMemo: finalNomorMemo || '',
        grandTotal: effectivePerdinTotal,
        prevDbGrandTotal: prevDbGrandTotal,
        initialAnggaranRows: Array.isArray(payload.initialAnggaranRows) ? payload.initialAnggaranRows : null,
        initialPeriode: String(payload.anggaranPeriode || 'November 2026')
      });

      logAction(ss, 'SAVE_PERDIN', header.idKegiatan, 'Berhasil menyimpan transaksi ' + (header.namaKegiatan || ''));

      const latestSpd = getLatestSpdNumberFromSheet(ss);
      return createJsonResponse({
        status: 'success',
        message: 'Data perjalanan dinas dan 48 kolom rekap berhasil disimpan ke Google Spreadsheet.',
        idKegiatan: finalIdKegiatan,
        assignedIdKegiatan: finalIdKegiatan,
        assignedNomorMemo: finalNomorMemo,
        assignedSpdNumbers: assignedSpdNumbers,
        wasAutoReassigned: wasAutoReassigned,
        latestSpdNumber: latestSpd,
        updatedAnggaranRows: anggaranRes.rows,
        anggaranPeriode: anggaranRes.periode,
        anggaranApplied: anggaranRes.applied
      });
    }

    // 3. SINKRONISASI BARIS REKAP 48 KOLOM
    if (action === 'SYNC_REKAP') {
      const rawRekapRows = payload.rekapRows || [];
      const rekapSheet = getOrCreateSheet(ss, SHEET_NAMES.REKAP, DEFAULT_HEADERS.REKAP);

      // Bersihkan baris hantu di spreadsheet terlebih dahulu
      pruneGhostRows(rekapSheet);

      // FILTER ANTI-HANTU: Hanya baris yang memiliki nama pegawai ATAU nama kegiatan yang boleh diproses
      const rekapRows = Array.isArray(rawRekapRows) ? rawRekapRows.filter(rowObj => {
        const nama = (rowObj['NAMA PEGAWAI INTERNAL INSPEKTORAT'] || rowObj['NAMA EXTERNAL'] || '').toString().trim();
        const kegiatan = (rowObj['Nama Kegiatan'] || '').toString().trim();
        return nama !== '' || kegiatan !== '';
      }) : [];

      if (rekapRows.length > 0) {
        const lastRow = rekapSheet.getLastRow();
        const headers = lastRow > 0
          ? rekapSheet.getRange(1, 1, 1, rekapSheet.getLastColumn()).getValues()[0]
          : DEFAULT_HEADERS.REKAP;

        rekapRows.forEach(rowObj => {
          const rowArray = headers.map(h => (rowObj[h] !== undefined && rowObj[h] !== null ? rowObj[h] : ''));
          const namaPegawai = (rowObj['NAMA PEGAWAI INTERNAL INSPEKTORAT'] || rowObj['NAMA EXTERNAL'] || '').toString().trim();
          const namaKegiatan = (rowObj['Nama Kegiatan'] || '').toString().trim();
          const idKegiatan = (rowObj['id_kegiatan'] || rowObj['ID Kegiatan'] || rowObj['_spjBatchId'] || '').toString().trim();
          const nomorMemo = (rowObj['nomor_memo'] || rowObj['Nomor Memo'] || '').toString().trim();

          let updated = false;
          if (rekapSheet.getLastRow() >= 2) {
            const data = rekapSheet.getDataRange().getValues();
            const colPegawai = headers.indexOf('NAMA PEGAWAI INTERNAL INSPEKTORAT');
            const colPegawaiExt = headers.indexOf('NAMA EXTERNAL');
            const colKegiatan = headers.indexOf('Nama Kegiatan');
            const colIdKeg = headers.indexOf('id_kegiatan') !== -1 ? headers.indexOf('id_kegiatan') : headers.indexOf('ID Kegiatan');
            const colMemo = headers.indexOf('nomor_memo') !== -1 ? headers.indexOf('nomor_memo') : headers.indexOf('Nomor Memo');

            for (let i = 1; i < data.length; i++) {
              const curPeg = (
                (colPegawai !== -1 ? String(data[i][colPegawai] || '').trim() : '') ||
                (colPegawaiExt !== -1 ? String(data[i][colPegawaiExt] || '').trim() : '')
              );
              const curKeg = colKegiatan !== -1 ? String(data[i][colKegiatan] || '').trim() : '';
              const curIdKeg = colIdKeg !== -1 ? String(data[i][colIdKeg] || '').trim() : '';
              const curMemo = colMemo !== -1 ? String(data[i][colMemo] || '').trim() : '';

              const isSamePerson = namaPegawai !== '' && curPeg.toLowerCase() === namaPegawai.toLowerCase();

              // Match by primary key 1: ID Kegiatan + Pegawai
              const isMatchById = idKegiatan !== '' && curIdKeg !== '' && curIdKeg.toLowerCase() === idKegiatan.toLowerCase() && isSamePerson;

              // Match by primary key 2: Nomor Memo + Pegawai
              const isMatchByMemo = nomorMemo !== '' && curMemo !== '' && curMemo.toLowerCase() === nomorMemo.toLowerCase() && isSamePerson;

              // Match by Nama Kegiatan + Pegawai
              const isMatchByKeg = namaKegiatan !== '' && curKeg !== '' && curKeg.toLowerCase() === namaKegiatan.toLowerCase() && isSamePerson;

              if (isMatchById || isMatchByMemo || isMatchByKeg) {
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

    // 4. HAPUS PAKET KEGIATAN & SELURUH PESERTA DARI CLOUD
    if (action === 'DELETE_KEGIATAN') {
      const idKegiatan = (payload.idKegiatan || '').trim();
      const namaKegiatan = (payload.namaKegiatan || '').trim();
      const nomorMemo = (payload.nomorMemo || '').trim();

      if (!idKegiatan && !namaKegiatan) {
        return createJsonResponse({ status: 'error', message: 'ID Kegiatan atau Nama Kegiatan wajib disertakan.' });
      }

      const kegiatanSheet = getOrCreateSheet(ss, SHEET_NAMES.KEGIATAN, DEFAULT_HEADERS.KEGIATAN);
      const pesertaSheet = getOrCreateSheet(ss, SHEET_NAMES.PESERTA, DEFAULT_HEADERS.PESERTA);
      const rekapSheet = getOrCreateSheet(ss, SHEET_NAMES.REKAP, DEFAULT_HEADERS.REKAP);

      if (idKegiatan) {
        deleteRowsByColumnValue(kegiatanSheet, 'id_kegiatan', idKegiatan);
        deleteRowsByColumnValue(pesertaSheet, 'id_kegiatan', idKegiatan);
        deleteRowsByColumnValue(rekapSheet, 'id_kegiatan', idKegiatan);
        deleteRowsByColumnValue(rekapSheet, 'ID Kegiatan', idKegiatan);
      }

      if (nomorMemo) {
        deleteRowsByColumnValue(rekapSheet, 'nomor_memo', nomorMemo);
        deleteRowsByColumnValue(rekapSheet, 'Nomor Memo', nomorMemo);
      }

      if (namaKegiatan) {
        deleteRowsByColumnValue(rekapSheet, 'Nama Kegiatan', namaKegiatan);
      } else if (idKegiatan) {
        deleteRowsByColumnValue(rekapSheet, 'No SPBY', idKegiatan);
      }

      // Hapus juga dari ke-4 sheet Rekap SPJ Pengadaan jika ada
      getAllPengadaanSheetNames().forEach(function(sName) {
        const pSheet = ss.getSheetByName(sName);
        if (pSheet && pSheet.getLastRow() >= 2) {
          if (idKegiatan) {
            deleteRowsByColumnValue(pSheet, 'id_kegiatan', idKegiatan);
          }
          if (nomorMemo) {
            deleteRowsByColumnValue(pSheet, 'Nomor Memo', nomorMemo);
          }
          if (namaKegiatan) {
            deleteRowsByColumnValue(pSheet, 'Nama Kegiatan / Uraian Pembayaran', namaKegiatan);
          }
        }
      });

      // Hapus juga dari MASTER_MEMO jika diminta (default: true)
      if (payload.deleteMemo !== false) {
        const memoSheet = ss.getSheetByName(SHEET_NAMES.MEMO);
        if (memoSheet && memoSheet.getLastRow() >= 2) {
          if (idKegiatan) {
            deleteRowsByColumnValue(memoSheet, 'id_kegiatan_ref', idKegiatan);
          }
          if (nomorMemo) {
            deleteRowsByColumnValue(memoSheet, 'format_lengkap', nomorMemo);
            deleteRowsByColumnValue(memoSheet, 'noMemo', nomorMemo);
          }
        }
      }

      const refundRes = refundSpjFromMonitoringAnggaranGas(ss, {
        idKegiatan: idKegiatan,
        oldIdKegiatan: String(payload.oldIdKegiatan || '').trim(),
        namaKegiatan: namaKegiatan,
        nomorMemo: nomorMemo
      });

      pruneGhostRows(rekapSheet);
      logAction(ss, 'DELETE_KEGIATAN', idKegiatan || namaKegiatan, 'Menghapus paket kegiatan ' + (namaKegiatan || idKegiatan));

      return createJsonResponse({
        status: 'success',
        message: 'Paket kegiatan ' + (idKegiatan || namaKegiatan) + ' berhasil dihapus dari Google Spreadsheet.',
        anggaranRefunded: refundRes.refunded,
        refundedNominal: refundRes.nominal || 0,
        updatedAnggaranRows: refundRes.rows || null,
        anggaranPeriode: refundRes.periode || null
      });
    }

    // 4B. HAPUS NOMOR MEMORANDUM DARI MASTER_MEMO
    if (action === 'DELETE_MEMO') {
      const nomorMemo = String(payload.nomorMemo || payload.formatLengkap || '').trim();
      const nomorUrut = String(payload.nomorUrut || '').trim();
      const idKegiatanRef = String(payload.idKegiatanRef || '').trim();

      if (!nomorMemo && !nomorUrut && !idKegiatanRef) {
        return createJsonResponse({ status: 'error', message: 'Nomor Memorandum wajib disertakan.' });
      }

      const memoSheet = getOrCreateSheet(ss, SHEET_NAMES.MEMO, DEFAULT_HEADERS.MEMO);
      if (memoSheet && memoSheet.getLastRow() >= 2) {
        if (nomorMemo) {
          deleteRowsByColumnValue(memoSheet, 'format_lengkap', nomorMemo);
          deleteRowsByColumnValue(memoSheet, 'noMemo', nomorMemo);
          const seqMatch = nomorMemo.match(/\bM\.?\s*(\d+)/i) || nomorMemo.match(/(\d+)/);
          if (seqMatch) {
            deleteRowsByColumnValue(memoSheet, 'nomor_urut', seqMatch[1]);
          }
        }
        if (nomorUrut) {
          deleteRowsByColumnValue(memoSheet, 'nomor_urut', nomorUrut);
        }
        if (idKegiatanRef) {
          deleteRowsByColumnValue(memoSheet, 'id_kegiatan_ref', idKegiatanRef);
        }
      }

      logAction(ss, 'DELETE_MEMO', nomorMemo || nomorUrut, 'Menghapus nomor memorandum ' + (nomorMemo || nomorUrut));
      return createJsonResponse({
        status: 'success',
        message: 'Nomor memorandum ' + (nomorMemo || nomorUrut) + ' berhasil dihapus dari MASTER_MEMO.'
      });
    }

    // 4c. RESERVASI / ASSIGN NOMOR MEMORANDUM LANGSUNG SAAT USER KLIK "GUNAKAN NOMOR"
    if (action === 'RESERVE_MEMO') {
      const memoSheet = getOrCreateSheet(ss, SHEET_NAMES.MEMO, DEFAULT_HEADERS.MEMO);
      const kegiatanSheet = getOrCreateSheet(ss, SHEET_NAMES.KEGIATAN, DEFAULT_HEADERS.KEGIATAN);

      const isNewRecord = payload.isNewRecord !== false && !payload.oldIdKegiatan;
      const reservedMemoToken = String(payload.reservedMemo || '').trim();
      const idResolution = resolveUniqueIdKegiatan(
        kegiatanSheet,
        memoSheet,
        String(payload.idKegiatan || '').trim(),
        isNewRecord,
        payload.oldIdKegiatan || '',
        reservedMemoToken
      );
      const finalIdKegiatan = idResolution.idKegiatan;

      const memoRes = upsertMemo(memoSheet, payload.nomorMemo || '', {
        tanggal: payload.tanggalMemo || '',
        perihal: payload.perihal || 'Permintaan Pembayaran Langsung (LS) Perjalanan Dinas',
        nominal: payload.nominal !== undefined && payload.nominal !== null ? payload.nominal : 0,
        mak: payload.mak || '524111',
        idKegiatan: finalIdKegiatan,
        isNewRecord: isNewRecord,
        oldNomorMemo: payload.oldNomorMemo || '',
        reservedMemo: reservedMemoToken
      }, true);

      const assignedMemo = typeof memoRes === 'object' ? memoRes.memoStr : memoRes;
      const memoWasReassigned = typeof memoRes === 'object' ? Boolean(memoRes.reassigned) : false;

      // Hitung daftar memo terbaru & nomor berikutnya yang tersedia setelah reservasi ini
      const updatedMemos = sheetToObjects(memoSheet);
      let maxSeq = 0;
      updatedMemos.forEach(function(m) {
        const n = parseInt(String(m.nomor_urut || '').replace(/\D/g, ''), 10);
        if (!isNaN(n) && n > maxSeq && n < 2000) maxSeq = n;
      });
      const nextAvailableNum = maxSeq > 0 ? maxSeq + 1 : 321;

      let romanMonth = 'XI';
      let memoYear = '2026';
      if (payload.tanggalMemo) {
        try {
          const d = new Date(payload.tanggalMemo);
          if (!isNaN(d.getTime())) {
            const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
            romanMonth = romans[d.getMonth()] || 'XI';
            memoYear = String(d.getFullYear());
          }
        } catch (e) {}
      }
      const nextAvailableMemo = 'M.' + nextAvailableNum + '/INS/PPK/' + romanMonth + '/' + memoYear;

      logAction(ss, 'RESERVE_MEMO', finalIdKegiatan, 'Menggunakan/mengunci nomor memo ' + assignedMemo);

      return createJsonResponse({
        status: 'success',
        message: memoWasReassigned
          ? 'Nomor sebelumnya sudah dipakai user lain. Otomatis dialihkan & dikunci ke ' + assignedMemo
          : 'Nomor memorandum ' + assignedMemo + ' resmi digunakan & tercatat di database.',
        assignedNomorMemo: assignedMemo,
        assignedIdKegiatan: finalIdKegiatan,
        nextAvailableUrut: nextAvailableNum,
        nextAvailableMemo: nextAvailableMemo,
        wasReassigned: Boolean(memoWasReassigned || idResolution.reassigned),
        memo: updatedMemos
      });
    }

    // 5. RESET SELURUH DATA TRANSAKSI TESTING (BERSIH TOTAL BARIS 2 KE BAWAH)
    if (action === 'RESET_TRANSAKSI') {
      const kegiatanSheet = getOrCreateSheet(ss, SHEET_NAMES.KEGIATAN, DEFAULT_HEADERS.KEGIATAN);
      const pesertaSheet = getOrCreateSheet(ss, SHEET_NAMES.PESERTA, DEFAULT_HEADERS.PESERTA);
      const rekapSheet = getOrCreateSheet(ss, SHEET_NAMES.REKAP, DEFAULT_HEADERS.REKAP);

      if (kegiatanSheet.getLastRow() >= 2) {
        kegiatanSheet.deleteRows(2, kegiatanSheet.getLastRow() - 1);
      }
      if (pesertaSheet.getLastRow() >= 2) {
        pesertaSheet.deleteRows(2, pesertaSheet.getLastRow() - 1);
      }
      if (rekapSheet.getLastRow() >= 2) {
        rekapSheet.deleteRows(2, rekapSheet.getLastRow() - 1);
      }

      getAllPengadaanSheetNames().forEach(function(sName) {
        const pSheet = ss.getSheetByName(sName);
        if (pSheet && pSheet.getLastRow() >= 2) {
          pSheet.deleteRows(2, pSheet.getLastRow() - 1);
        }
      });

      logAction(ss, 'RESET_TRANSAKSI', 'ALL', 'Mengosongkan seluruh data transaksi uji coba.');

      return createJsonResponse({
        status: 'success',
        message: 'Seluruh data transaksi uji coba (DB_KEGIATAN, DB_PESERTA, REKAP_PERDIN_48KOLOM, dan 4 Sheet Rekap SPJ Baru) berhasil dikosongkan 100% secara bersih.'
      });
    }

    // 5. PEMBERSIHAN BARIS HANTU DI SELURUH TAB TRANSAKSI
    if (action === 'PRUNE_GHOST_ROWS') {
      const pesertaSheet = ss.getSheetByName(SHEET_NAMES.PESERTA);
      const rekapSheet = ss.getSheetByName(SHEET_NAMES.REKAP);
      const kegiatanSheet = ss.getSheetByName(SHEET_NAMES.KEGIATAN);

      if (pesertaSheet) pruneGhostRows(pesertaSheet);
      if (rekapSheet) pruneGhostRows(rekapSheet);
      if (kegiatanSheet) pruneGhostRows(kegiatanSheet);

      logAction(ss, 'PRUNE_GHOST_ROWS', 'ALL', 'Membersihkan seluruh baris hantu di DB_PESERTA, REKAP, dan DB_KEGIATAN.');

      return createJsonResponse({
        status: 'success',
        message: 'Pembersihan baris hantu di tab DB_PESERTA, REKAP_PERDIN_48KOLOM, dan DB_KEGIATAN berhasil dilakukan.'
      });
    }

    // 6. SIMPAN / INISIALISASI / RESET MONITORING ANGGARAN KE CLOUD
    if (action === 'SAVE_ANGGARAN') {
      const rows = Array.isArray(payload.rows) ? payload.rows : [];
      const periode = String(payload.periode || (payload.meta && payload.meta.periode) || 'November 2026').trim();
      const onlyIfEmpty = Boolean(payload.onlyIfEmpty);
      const clearTransactions = Boolean(payload.clearTransactions);

      const angSheet = getOrCreateSheet(ss, SHEET_NAMES.ANGGARAN, DEFAULT_HEADERS.ANGGARAN);
      if (onlyIfEmpty && angSheet.getLastRow() >= 2) {
        const existing = readAnggaranFromSheet(ss);
        return createJsonResponse({
          status: 'success',
          alreadySeeded: true,
          periode: existing.periode || periode,
          rows: existing.rows,
          transactions: existing.transactions
        });
      }

      if (rows.length === 0) {
        return createJsonResponse({ status: 'error', message: 'Data rows Monitoring Anggaran kosong.' });
      }

      const recalculated = recalculateAnggaranTreeGas(rows);
      writeAnggaranToSheet(ss, recalculated, periode);

      if (clearTransactions) {
        const trxSheet = getOrCreateSheet(ss, SHEET_NAMES.ANGGARAN_TRX, DEFAULT_HEADERS.ANGGARAN_TRX);
        if (trxSheet.getLastRow() >= 2) {
          trxSheet.deleteRows(2, trxSheet.getLastRow() - 1);
        }
      }

      logAction(ss, 'SAVE_ANGGARAN', clearTransactions ? 'RESET_BASELINE' : 'UPDATE', 'Menyimpan ' + recalculated.length + ' baris Monitoring Anggaran.');

      return createJsonResponse({
        status: 'success',
        periode: periode,
        rows: recalculated
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
 * Pembersih Baris Hantu Otomatis:
 * Mendukung tab DB_PESERTA, REKAP_PERDIN_48KOLOM, dan DB_KEGIATAN
 */
function pruneGhostRows(sheet) {
  if (!sheet || sheet.getLastRow() < 2) return;
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return;

  const headers = data[0] || [];
  const colRekapInternal = headers.indexOf('NAMA PEGAWAI INTERNAL INSPEKTORAT');
  const colRekapExternal = headers.indexOf('NAMA EXTERNAL');
  const colRekapKegiatan = headers.indexOf('Nama Kegiatan');

  const colPesertaNama = headers.indexOf('nama_snapshot');
  const colPesertaExt = headers.indexOf('spj_nama_external');
  const colPesertaKeg = headers.indexOf('id_kegiatan');

  const colKegiatanId = headers.indexOf('id_kegiatan');
  const colKegiatanNama = headers.indexOf('nama_kegiatan');

  // Loop mundur dari baris paling bawah ke atas
  for (let i = data.length - 1; i >= 1; i--) {
    const row = data[i];

    // 1. Deteksi jika ini sheet DB_PESERTA
    if (colPesertaNama !== -1) {
      const nama = String(row[colPesertaNama] || '').trim();
      const ext = colPesertaExt !== -1 ? String(row[colPesertaExt] || '').trim() : '';
      const idKeg = colPesertaKeg !== -1 ? String(row[colPesertaKeg] || '').trim() : '';
      // Baris hantu jika tidak ada nama peserta ATAU tidak ada id_kegiatan
      if ((nama === '' && ext === '') || idKeg === '') {
        sheet.deleteRow(i + 1);
      }
    }
    // 2. Deteksi jika ini sheet REKAP_PERDIN_48KOLOM
    else if (colRekapInternal !== -1 || colRekapExternal !== -1) {
      const nama = colRekapInternal !== -1 ? String(row[colRekapInternal] || '').trim() : '';
      const ext = colRekapExternal !== -1 ? String(row[colRekapExternal] || '').trim() : '';
      const keg = colRekapKegiatan !== -1 ? String(row[colRekapKegiatan] || '').trim() : '';
      // Baris hantu jika tidak ada nama pegawai internal maupun external, ATAU tidak ada nama kegiatan
      if ((nama === '' && ext === '') || keg === '') {
        sheet.deleteRow(i + 1);
      }
    }
    // 3. Deteksi jika ini sheet DB_KEGIATAN
    else if (colKegiatanNama !== -1 && colKegiatanId !== -1) {
      const idKeg = String(row[colKegiatanId] || '').trim();
      const namaKeg = String(row[colKegiatanNama] || '').trim();
      if (idKeg === '' || namaKeg === '') {
        sheet.deleteRow(i + 1);
      }
    }
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
    const curId = idCol >= 0 ? String(data[i][idCol] || '').trim() : '';
    const curName = nameCol >= 0 ? String(data[i][nameCol] || '').trim().toLowerCase() : '';
    const curNip = nipCol >= 0 ? String(data[i][nipCol] || '').trim() : '';

    const isMatchId = curId && idPegawai && curId.toLowerCase() === String(idPegawai).toLowerCase();
    const isMatchNip = nip && nip !== '-' && curNip && curNip !== '-' && curNip === nip;
    const isMatchName = namaLengkap && curName && curName === namaLengkap.toLowerCase();

    if (isMatchId || isMatchNip || isMatchName) {
      sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
      return;
    }
  }

  sheet.appendRow(rowData);
}

/**
 * Helper: Simpan / Perbarui Baris Memorandum di MASTER_MEMO (9 Kolom Baku)
 */
function resolveUniqueIdKegiatan(kegiatanSheet, memoSheet, requestedId, isNewRecord, oldIdKegiatan, reservedMemoToken) {
  const savedKegiatanIds = {};
  const memoClaimedByOther = {};
  const reqLower = String(requestedId || '').trim().toLowerCase();
  const reservedLower = String(reservedMemoToken || '').trim().toLowerCase();

  if (kegiatanSheet && kegiatanSheet.getLastRow() >= 2) {
    const kData = kegiatanSheet.getDataRange().getValues();
    const kHeaders = kData[0] || [];
    const colId = kHeaders.indexOf('id_kegiatan');
    if (colId !== -1) {
      for (let i = 1; i < kData.length; i++) {
        const val = String(kData[i][colId] || '').trim();
        if (val) savedKegiatanIds[val.toLowerCase()] = true;
      }
    }
  }
  if (memoSheet && memoSheet.getLastRow() >= 2) {
    const mData = memoSheet.getDataRange().getValues();
    const mHeaders = mData[0] || [];
    const colRef = mHeaders.indexOf('id_kegiatan_ref') !== -1 ? mHeaders.indexOf('id_kegiatan_ref') : 5;
    const colFmt = mHeaders.indexOf('format_lengkap') !== -1 ? mHeaders.indexOf('format_lengkap') : 2;
    for (let i = 1; i < mData.length; i++) {
      const val = String(mData[i][colRef] || '').trim();
      const fmt = String(mData[i][colFmt] || '').trim().toLowerCase();
      if (val) {
        const valLower = val.toLowerCase();
        // Jika baris memo ini persis reservasi milik draft aktif (reservedMemoToken cocok), jangan anggap tabrakan
        const isSelfReservation = Boolean(reservedLower && valLower === reqLower && fmt === reservedLower);
        if (!isSelfReservation) {
          memoClaimedByOther[valLower] = true;
        }
      }
    }
  }

  const existingIds = {};
  Object.keys(savedKegiatanIds).forEach(function(k) { existingIds[k] = true; });
  Object.keys(memoClaimedByOther).forEach(function(k) { existingIds[k] = true; });

  const req = String(requestedId || '').trim();
  const oldReq = String(oldIdKegiatan || '').trim();
  const isCollisionOnNew = isNewRecord && req && Boolean(existingIds[req.toLowerCase()]);
  const isCollisionOnRename = !isNewRecord && req && req.toLowerCase() !== oldReq.toLowerCase() && Boolean(existingIds[req.toLowerCase()]);

  if (req && !isCollisionOnNew && !isCollisionOnRename) {
    return { idKegiatan: req, reassigned: false };
  }

  const match = req.match(/^KEG-(\d{4})-(\d+)-(A|NA|B)$/i);
  const now = new Date();
  const defaultYymm = String(now.getFullYear()).slice(-2) + String(now.getMonth() + 1).padStart(2, '0');
  const yymm = match ? match[1] : defaultYymm;
  const kat = match ? match[3].toUpperCase() : 'A';
  const monthPrefix = ('KEG-' + yymm + '-').toLowerCase();

  let maxNo = 0;
  Object.keys(existingIds).forEach(function(k) {
    if (k.indexOf(monthPrefix) === 0) {
      const m = k.match(/^keg-\d{4}-(\d+)-/i);
      if (m) {
        const n = parseInt(m[1], 10);
        if (!isNaN(n) && n > maxNo) maxNo = n;
      }
    }
  });

  let nextNo = maxNo + 1;
  let candidate = 'KEG-' + yymm + '-' + String(nextNo).padStart(3, '0') + '-' + kat;
  while (existingIds[candidate.toLowerCase()]) {
    nextNo++;
    candidate = 'KEG-' + yymm + '-' + String(nextNo).padStart(3, '0') + '-' + kat;
  }

  return { idKegiatan: candidate, reassigned: candidate !== req };
}

function collectUsedSpdNumbers(pesertaSheet, excludeIdKegiatan) {
  const used = {};
  let maxNum = 0;
  if (!pesertaSheet || pesertaSheet.getLastRow() < 2) {
    return { used: used, maxNum: 0 };
  }
  const pData = pesertaSheet.getDataRange().getValues();
  const pHeaders = pData[0] || [];
  const colSpd = pHeaders.indexOf('nomor_spd') !== -1 ? pHeaders.indexOf('nomor_spd') : 4;
  const colKeg = pHeaders.indexOf('id_kegiatan') !== -1 ? pHeaders.indexOf('id_kegiatan') : 1;
  const excludeLower = String(excludeIdKegiatan || '').trim().toLowerCase();

  for (let i = 1; i < pData.length; i++) {
    const rowKeg = String(pData[i][colKeg] || '').trim().toLowerCase();
    const rawSpd = String(pData[i][colSpd] || '').trim();
    const num = parseInt(rawSpd.replace(/\D/g, ''), 10);
    if (!isNaN(num) && num > 0) {
      if (num > maxNum) maxNum = num;
      if (!excludeLower || rowKeg !== excludeLower) {
        used[num] = true;
      }
    }
  }
  return { used: used, maxNum: maxNum };
}

function upsertMemo(sheet, nomorMemo, info, returnDetailed) {
  if (!sheet) return returnDetailed ? { memoStr: '', reassigned: false } : '';
  let memoStr = String(nomorMemo || '').trim();
  const infoIdKgt = String(info.idKegiatan || '').trim();
  const isNewRecord = Boolean(info.isNewRecord);
  const oldNomorMemoLower = String(info.oldNomorMemo || '').trim().toLowerCase();
  const reservedMemoLower = String(info.reservedMemo || '').trim().toLowerCase();
  let reassigned = false;

  const lastRow = sheet.getLastRow();
  const data = lastRow >= 1 ? sheet.getDataRange().getValues() : [];
  const headers = data[0] || DEFAULT_HEADERS.MEMO;

  const colTahun = headers.indexOf('tahun_anggaran') !== -1 ? headers.indexOf('tahun_anggaran') : 0;
  const colUrut = headers.indexOf('nomor_urut') !== -1 ? headers.indexOf('nomor_urut') : 1;
  const colFormat = headers.indexOf('format_lengkap') !== -1 ? headers.indexOf('format_lengkap') : 2;
  const colTgl = headers.indexOf('tanggal_memo') !== -1 ? headers.indexOf('tanggal_memo') : 3;
  const colPerihal = headers.indexOf('perihal') !== -1 ? headers.indexOf('perihal') : 4;
  const colRef = headers.indexOf('id_kegiatan_ref') !== -1 ? headers.indexOf('id_kegiatan_ref') : 5;
  const colStatus = headers.indexOf('status') !== -1 ? headers.indexOf('status') : 6;
  const colNominal = headers.indexOf('nominal') !== -1 ? headers.indexOf('nominal') : 7;
  const colMak = headers.indexOf('MAK') !== -1 ? headers.indexOf('MAK') : (headers.indexOf('mak') !== -1 ? headers.indexOf('mak') : 8);

  // 1. Hitung nomor urut tertinggi di MASTER_MEMO saat ini
  let maxSeq = 0;
  for (let i = 1; i < data.length; i++) {
    const val = data[i][colUrut];
    if (val !== undefined && val !== null && val !== '') {
      const num = parseInt(String(val).replace(/\D/g, ''), 10);
      if (!isNaN(num) && num > maxSeq && num < 2000) {
        maxSeq = num;
      }
    }
  }

  // 2. Ekstrak nomor dari memoStr (contoh M.390/INS/PPK/IX/2026 -> 390)
  let targetNum = '';
  const seqMatch = memoStr.match(/\bM\.?\s*(\d+)/i) || memoStr.match(/^(\d+)/);
  if (seqMatch) {
    const parsedVal = parseInt(seqMatch[1], 10);
    if (!isNaN(parsedVal) && parsedVal < 2000) {
      targetNum = String(parsedVal);
    }
  }

  // Tentukan bulan romawi dan tahun
  let romanMonth = 'X';
  let memoYear = '2026';
  if (info.tanggal) {
    try {
      const d = new Date(info.tanggal);
      if (!isNaN(d.getTime())) {
        const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
        romanMonth = romans[d.getMonth()] || 'X';
        memoYear = String(d.getFullYear());
      }
    } catch (e) {}
  }

  // Jika nomorMemo berisi 'xxx' atau kosong/tidak valid, alokasikan nomor urut berikutnya secara otomatis
  if (!targetNum || memoStr.toLowerCase().includes('xxx')) {
    const nextNum = maxSeq > 0 ? maxSeq + 1 : 321;
    targetNum = String(nextNum);
    memoStr = 'M.' + targetNum + '/INS/PPK/' + romanMonth + '/' + memoYear;
  } else if (lastRow >= 2) {
    // Cek proteksi tabrakan memo: apakah targetNum sudah TERPAKAI oleh kegiatan LAIN?
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowUrut = String(colUrut !== -1 ? row[colUrut] : row[1] || '').trim();
      const rowRef = String(colRef !== -1 ? row[colRef] : row[5] || '').trim();
      const rowStatus = String(colStatus !== -1 ? row[colStatus] : row[6] || '').trim().toUpperCase();
      const rowPerihal = String(colPerihal !== -1 ? row[colPerihal] : row[4] || '').trim();

      if (rowUrut === targetNum) {
        const rowFmt = String(colFormat !== -1 ? row[colFormat] : row[2] || '').trim().toLowerCase();
        const isDraftReservationOwner = Boolean(
          reservedMemoLower &&
          infoIdKgt &&
          rowRef &&
          rowRef.toLowerCase() === infoIdKgt.toLowerCase() &&
          rowFmt === reservedMemoLower
        );
        const ownedBySameId = (!isNewRecord && infoIdKgt && rowRef && rowRef.toLowerCase() === infoIdKgt.toLowerCase()) || isDraftReservationOwner;
        const isEmptyUnusedSlot = !rowRef && rowStatus !== 'TERPAKAI' && !rowPerihal;
        if (!ownedBySameId && !isEmptyUnusedSlot) {
          // Tabrakan terdeteksi! Alokasikan nomor urut baru agar data user sebelumnya aman
          const nextNum = maxSeq > 0 ? maxSeq + 1 : 321;
          targetNum = String(nextNum);
          memoStr = 'M.' + targetNum + '/INS/PPK/' + romanMonth + '/' + memoYear;
          reassigned = true;
        }
        break;
      }
    }
  }

  // Ekstrak tahun anggaran
  let targetYear = memoYear;
  const yearMatch = memoStr.match(/\/(\d{4})$/);
  if (yearMatch) {
    targetYear = yearMatch[1];
  }

  // 3. Cek apakah baris memo sudah ada di MASTER_MEMO
  if (lastRow >= 2 && !reassigned) {
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowRef = String(colRef !== -1 ? row[colRef] : row[5] || '').trim();
      const rowFormat = String(colFormat !== -1 ? row[colFormat] : row[2] || '').trim().toLowerCase();
      const rowUrut = String(colUrut !== -1 ? row[colUrut] : row[1] || '').trim();
      const rowStatus = String(colStatus !== -1 ? row[colStatus] : row[6] || '').trim().toUpperCase();

      const isMatchUrut = targetNum && rowUrut && rowUrut === targetNum;
      const isMatchOldOnEdit = !isNewRecord && oldNomorMemoLower && rowFormat === oldNomorMemoLower && (!rowRef || rowRef.toLowerCase() === infoIdKgt.toLowerCase());
      const isMatchOwnedRef = !isNewRecord && infoIdKgt && rowRef && rowRef.toLowerCase() === infoIdKgt.toLowerCase() && (isMatchUrut || !targetNum);
      const isDraftReservationOwner = Boolean(
        reservedMemoLower &&
        infoIdKgt &&
        rowRef &&
        rowRef.toLowerCase() === infoIdKgt.toLowerCase() &&
        rowFormat === reservedMemoLower &&
        isMatchUrut
      );

      // Saat isNewRecord, hanya boleh claim baris jika slot kosong belum terpakai ATAU merupakan reservasi milik draft aktif sendiri
      const canClaim = isNewRecord
        ? ((isMatchUrut && !rowRef && rowStatus !== 'TERPAKAI') || isDraftReservationOwner)
        : (isMatchOwnedRef || isMatchOldOnEdit || (isMatchUrut && (!rowRef || rowRef.toLowerCase() === infoIdKgt.toLowerCase())));

      if (canClaim) {
        const rowNum = i + 1;
        if (colTahun !== -1) sheet.getRange(rowNum, colTahun + 1).setValue(targetYear);
        if (colUrut !== -1) sheet.getRange(rowNum, colUrut + 1).setValue(Number(targetNum));
        if (colFormat !== -1) sheet.getRange(rowNum, colFormat + 1).setValue(memoStr);
        if (colTgl !== -1 && info.tanggal) sheet.getRange(rowNum, colTgl + 1).setValue(info.tanggal);
        if (colPerihal !== -1 && info.perihal) sheet.getRange(rowNum, colPerihal + 1).setValue(info.perihal);
        if (colRef !== -1 && infoIdKgt) sheet.getRange(rowNum, colRef + 1).setValue(infoIdKgt);
        if (colStatus !== -1) sheet.getRange(rowNum, colStatus + 1).setValue('TERPAKAI');
        if (colNominal !== -1 && info.nominal !== undefined && info.nominal !== null) {
          sheet.getRange(rowNum, colNominal + 1).setValue(info.nominal);
        }
        if (colMak !== -1 && info.mak) sheet.getRange(rowNum, colMak + 1).setValue(info.mak);
        return returnDetailed ? { memoStr: memoStr, reassigned: reassigned } : memoStr;
      }
    }
  }

  // 4. Jika belum ada di MASTER_MEMO (atau dialokasikan nomor baru), tambahkan baris baru
  const newRow = [
    targetYear,
    Number(targetNum),
    memoStr,
    info.tanggal || '',
    info.perihal || '',
    infoIdKgt,
    'TERPAKAI',
    info.nominal !== undefined && info.nominal !== null ? info.nominal : '',
    info.mak || ''
  ];
  sheet.appendRow(newRow);
  return returnDetailed ? { memoStr: memoStr, reassigned: reassigned } : memoStr;
}

/**
 * Helper: Simpan / Perbarui Baris Item Detail di MASTER_MAK
 */
function upsertMakItem(sheet, item) {
  if (!sheet || !item || !item.kode) return;
  const lastRow = sheet.getLastRow();
  const kodeItem = String(item.kode).trim();
  const namaItem = String(item.nama || '').trim();
  const kodeMak = String(item.kodeMak || item.kode_mak || '524111').trim();
  const kodeKomponen = String(item.kodeKomponen || item.kode_komponen || 'CL.7458.ABR.006.075.EE').trim();
  const fullLabel = kodeItem + (namaItem ? ' - ' + namaItem : '');

  if (lastRow >= 2) {
    const data = sheet.getDataRange().getValues();
    const headers = data[0] || DEFAULT_HEADERS.MAK;
    const colKode = headers.indexOf('kode_item') !== -1 ? headers.indexOf('kode_item') : 3;
    const colNama = headers.indexOf('nama_item') !== -1 ? headers.indexOf('nama_item') : 4;
    const colKomp = headers.indexOf('kode_komponen') !== -1 ? headers.indexOf('kode_komponen') : 0;
    const colMak = headers.indexOf('kode_mak') !== -1 ? headers.indexOf('kode_mak') : 1;
    const colFull = headers.indexOf('full_label') !== -1 ? headers.indexOf('full_label') : 5;

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][colKode]).trim() === kodeItem) {
        const r = i + 1;
        if (colKomp !== -1 && kodeKomponen) sheet.getRange(r, colKomp + 1).setValue(kodeKomponen);
        if (colMak !== -1 && kodeMak) sheet.getRange(r, colMak + 1).setValue(kodeMak);
        if (colNama !== -1 && namaItem) sheet.getRange(r, colNama + 1).setValue(namaItem);
        if (colFull !== -1 && fullLabel) sheet.getRange(r, colFull + 1).setValue(fullLabel);
        return;
      }
    }
  }

  sheet.appendRow([
    kodeKomponen,
    kodeMak,
    getMakNameByCode(kodeMak),
    kodeItem,
    namaItem,
    fullLabel,
    kodeMak
  ]);
}

function getMakNameByCode(code) {
  const c = String(code || '').trim();
  if (c === '524111') return 'Belanja Perjalanan Dinas Biasa';
  if (c === '524113') return 'Belanja Perjalanan Dinas Dalam Kota';
  if (c === '524114') return 'Belanja Perjalanan Dinas Paket Meeting Dalam Kota';
  if (c === '524119') return 'Belanja Perjalanan Dinas Paket Meeting Luar Kota';
  if (c === '522141') return 'Belanja Sewa';
  if (c === '521211') return 'Belanja Bahan';
  if (c === '521213') return 'Honor Output Kegiatan';
  if (c === '521811') return 'Belanja Barang Persediaan Barang Konsumsi';
  return 'Belanja Perjalanan Dinas';
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
  } else if (defaultHeaders && defaultHeaders.length > 0 && sheet.getLastRow() >= 1) {
    // Pastikan header baru yang belum ada di row 1 ditambahkan!
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] || [];
    const missingHeaders = defaultHeaders.filter(function(h) {
      return h !== '' && headers.indexOf(h) === -1;
    });
    if (missingHeaders.length > 0) {
      const startCol = headers.length + 1;
      sheet.getRange(1, startCol, 1, missingHeaders.length).setValues([missingHeaders]);
    }
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

  let tz = 'Asia/Jakarta';
  try {
    const ss = sheet.getParent() || SpreadsheetApp.getActiveSpreadsheet();
    if (ss && ss.getSpreadsheetTimeZone()) {
      tz = ss.getSpreadsheetTimeZone();
    }
  } catch (e) {}

  const headers = data[0];
  const rows = data.slice(1);

  return rows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      const cleanKey = header
        ? String(header).replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '').trim()
        : `_col_${index}`;
      const key = cleanKey || `_col_${index}`;
      let val = row[index];
      if (val instanceof Date && !isNaN(val.getTime())) {
        val = Utilities.formatDate(val, tz, 'yyyy-MM-dd');
      }
      obj[key] = val;
    });
    return obj;
  });
}

function upsertRowByHeaderObject(sheet, keyColumnName, keyValue, rowObject, defaultHeaders) {
  if (!sheet) return;

  if (sheet.getLastRow() === 0 && defaultHeaders && defaultHeaders.length > 0) {
    sheet.appendRow(defaultHeaders);
  }

  const lastRow = sheet.getLastRow();
  let headers = [];
  if (lastRow > 0) {
    headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] || [];
  } else if (defaultHeaders && defaultHeaders.length > 0) {
    headers = defaultHeaders;
  }

  // Tambahkan kolom header default yang belum ada di lembar kerja
  if (defaultHeaders && defaultHeaders.length > 0) {
    const missingHeaders = defaultHeaders.filter(function(h) { return headers.indexOf(h) === -1; });
    if (missingHeaders.length > 0) {
      const startCol = headers.length + 1;
      sheet.getRange(1, startCol, 1, missingHeaders.length).setValues([missingHeaders]);
      headers = headers.concat(missingHeaders);
    }
  }

  const rowData = headers.map(function(headerKey) {
    const key = String(headerKey).trim();
    return rowObject[key] !== undefined && rowObject[key] !== null ? rowObject[key] : '';
  });

  const keyIndex = headers.indexOf(keyColumnName);
  if (keyIndex !== -1 && lastRow >= 2) {
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][keyIndex]).trim().toLowerCase() === String(keyValue).trim().toLowerCase()) {
        sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
        return;
      }
    }
  }

  sheet.appendRow(rowData);
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
    if (String(data[i][colIndex] || '').trim() === String(value || '').trim()) {
      sheet.deleteRow(i + 1);
    }
  }
}

/**
 * Helper: Hapus seluruh baris lama di REKAP_PERDIN_48KOLOM berdasarkan ID Kegiatan, Nomor Memo, dan Judul Kegiatan
 */
function deleteRekapRowsByKeys(sheet, criteria) {
  if (!sheet || sheet.getLastRow() < 2) return;

  const data = sheet.getDataRange().getValues();
  const headers = data[0] || [];

  const colIdKeg = headers.indexOf('id_kegiatan') !== -1 ? headers.indexOf('id_kegiatan') : headers.indexOf('ID Kegiatan');
  const colMemo = headers.indexOf('nomor_memo') !== -1 ? headers.indexOf('nomor_memo') : headers.indexOf('Nomor Memo');
  const colKegiatan = headers.indexOf('Nama Kegiatan');
  const colPegawaiInt = headers.indexOf('NAMA PEGAWAI INTERNAL INSPEKTORAT');
  const colPegawaiExt = headers.indexOf('NAMA EXTERNAL');

  const curId = criteria.idKegiatan ? String(criteria.idKegiatan).trim().toLowerCase() : '';
  const oldId = criteria.oldIdKegiatan ? String(criteria.oldIdKegiatan).trim().toLowerCase() : '';
  const curMemo = criteria.nomorMemo ? String(criteria.nomorMemo).trim().toLowerCase() : '';
  const oldMemo = criteria.oldNomorMemo ? String(criteria.oldNomorMemo).trim().toLowerCase() : '';
  const curKeg = criteria.namaKegiatan ? String(criteria.namaKegiatan).trim().toLowerCase() : '';
  const oldKeg = criteria.oldNamaKegiatan ? String(criteria.oldNamaKegiatan).trim().toLowerCase() : '';
  const participantNames = (criteria.participantNames || []).map(function(n) { return String(n).trim().toLowerCase(); }).filter(Boolean);

  for (let i = data.length - 1; i >= 1; i--) {
    const row = data[i];
    const rowId = colIdKeg !== -1 ? String(row[colIdKeg] || '').trim().toLowerCase() : '';
    const rowMemo = colMemo !== -1 ? String(row[colMemo] || '').trim().toLowerCase() : '';
    const rowKeg = colKegiatan !== -1 ? String(row[colKegiatan] || '').trim().toLowerCase() : '';
    const rowName = (
      (colPegawaiInt !== -1 ? String(row[colPegawaiInt] || '').trim() : '') ||
      (colPegawaiExt !== -1 ? String(row[colPegawaiExt] || '').trim() : '')
    ).toLowerCase();

    let shouldDelete = false;

    // 1. Primary key 1: ID Kegiatan match
    if (rowId !== '') {
      if ((curId && rowId === curId) || (oldId && rowId === oldId)) {
        shouldDelete = true;
      }
    }

    // 2. Primary key 2: Nomor Memo match
    if (!shouldDelete && rowMemo !== '') {
      if ((curMemo && rowMemo === curMemo) || (oldMemo && rowMemo === oldMemo)) {
        shouldDelete = true;
      }
    }

    // 3. Nama Kegiatan match HANYA jika rowId kosong atau milik kegiatan ini (cegah hapus kegiatan lain yang judulnya kebetulan sama)
    const isSameOrEmptyId = rowId === '' || (curId && rowId === curId) || (oldId && rowId === oldId);
    if (!shouldDelete && rowKeg !== '' && isSameOrEmptyId) {
      if (oldKeg && rowKeg === oldKeg) {
        shouldDelete = true;
      } else if (curKeg && rowKeg === curKeg) {
        shouldDelete = true;
      }
    }

    // 4. Participant match when old title or memo was altered (and not belonging to another ID)
    if (!shouldDelete && participantNames.length > 0 && rowName !== '' && isSameOrEmptyId) {
      const isParticipantMatch = participantNames.indexOf(rowName) !== -1;
      if (isParticipantMatch) {
        if (oldKeg && (rowKeg === oldKeg || rowKeg.indexOf(oldKeg) !== -1 || oldKeg.indexOf(rowKeg) !== -1)) {
          shouldDelete = true;
        } else if (oldMemo && rowMemo === oldMemo) {
          shouldDelete = true;
        }
      }
    }

    if (shouldDelete) {
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

/**
 * Ambil nomor SPD tertinggi dari seluruh database (DB_PESERTA, DB_KEGIATAN & REKAP_PERDIN_48KOLOM)
 */
function getLatestSpdNumberFromSheet(ss) {
  try {
    let maxSpd = 0;

    // Helper untuk membersihkan string header dari karakter tak terlihat (Zero-Width Space dsb)
    function cleanStr(s) {
      return String(s || '').replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '').trim().toLowerCase();
    }

    // 1. Pindai tab DB_PESERTA
    const pesertaSheet = getOrCreateSheet(ss, SHEET_NAMES.PESERTA, DEFAULT_HEADERS.PESERTA);
    const lastRowPeserta = pesertaSheet.getLastRow();
    if (lastRowPeserta >= 2) {
      const data = pesertaSheet.getDataRange().getValues();
      const headers = data[0] || [];
      let spdIdx = -1;
      for (let c = 0; c < headers.length; c++) {
        const hClean = cleanStr(headers[c]);
        if (hClean === 'nomor_spd' || hClean === 'nomorspd' || hClean === 'spd') {
          spdIdx = c;
          break;
        }
      }
      // Fallback ke kolom E (index 4) jika header tidak ditemukan
      if (spdIdx === -1 && headers.length > 4) {
        spdIdx = 4;
      }

      if (spdIdx !== -1) {
        for (let i = 1; i < data.length; i++) {
          const val = data[i][spdIdx];
          if (val !== undefined && val !== null && val !== '') {
            const match = String(val).match(/\d+/);
            if (match) {
              const num = parseInt(match[0], 10);
              if (!isNaN(num) && num > maxSpd && num < 100000) {
                maxSpd = num;
              }
            }
          }
        }
      }
    }

    // 2. Pindai tab DB_KEGIATAN (payload_json) jika ada
    const kegiatanSheet = getOrCreateSheet(ss, SHEET_NAMES.KEGIATAN, DEFAULT_HEADERS.KEGIATAN);
    const lastRowKegiatan = kegiatanSheet.getLastRow();
    if (lastRowKegiatan >= 2) {
      const kData = kegiatanSheet.getDataRange().getValues();
      const kHeaders = kData[0] || [];
      let jsonIdx = -1;
      for (let c = 0; c < kHeaders.length; c++) {
        const hClean = cleanStr(kHeaders[c]);
        if (hClean === 'payload_json' || hClean === 'payloadjson') {
          jsonIdx = c;
          break;
        }
      }

      if (jsonIdx !== -1) {
        for (let i = 1; i < kData.length; i++) {
          const raw = String(kData[i][jsonIdx] || '');
          if (raw.startsWith('{')) {
            try {
              const parsed = JSON.parse(raw);
              if (parsed && Array.isArray(parsed.rows)) {
                for (let j = 0; j < parsed.rows.length; j++) {
                  const rSpd = parsed.rows[j].nomorSpd;
                  if (rSpd) {
                    const m = String(rSpd).match(/\d+/);
                    if (m) {
                      const n = parseInt(m[0], 10);
                      if (!isNaN(n) && n > maxSpd && n < 100000) {
                        maxSpd = n;
                      }
                    }
                  }
                }
              }
            } catch (e) {}
          }
        }
      }
    }

    // 3. Pindai tab REKAP_PERDIN_48KOLOM jika ada
    const rekapSheet = getOrCreateSheet(ss, SHEET_NAMES.REKAP, DEFAULT_HEADERS.REKAP);
    if (rekapSheet.getLastRow() >= 2) {
      const rData = rekapSheet.getDataRange().getValues();
      const rHeaders = rData[0] || [];
      let rSpdIdx = -1;
      for (let c = 0; c < rHeaders.length; c++) {
        const hClean = cleanStr(rHeaders[c]);
        if (hClean.includes('spd')) {
          rSpdIdx = c;
          break;
        }
      }
      if (rSpdIdx !== -1) {
        for (let i = 1; i < rData.length; i++) {
          const val = rData[i][rSpdIdx];
          if (val !== undefined && val !== null && val !== '') {
            const m = String(val).match(/\d+/);
            if (m) {
              const n = parseInt(m[0], 10);
              if (!isNaN(n) && n > maxSpd && n < 100000) {
                maxSpd = n;
              }
            }
          }
        }
      }
    }

    return maxSpd;
  } catch (err) {
    return 0;
  }
}

/**
 * ============================================================================
 * MONITORING ANGGARAN CLOUD SYNC & DEDUCTION / REFUND HELPERS
 * ============================================================================
 */
function parseAnggaranNumberGas(val) {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val).trim();
  if (!str) return 0;
  if (/^-?\d+(\.\d+)?$/.test(str)) {
    const n = parseFloat(str);
    return isNaN(n) ? 0 : n;
  }
  const neg = str.charAt(0) === '-';
  const digits = str.replace(/[^0-9]/g, '');
  if (!digits) return 0;
  const parsed = parseFloat(digits);
  if (isNaN(parsed)) return 0;
  return neg ? -parsed : parsed;
}

function readAnggaranFromSheet(ss) {
  const angSheet = getOrCreateSheet(ss, SHEET_NAMES.ANGGARAN, DEFAULT_HEADERS.ANGGARAN);
  const trxSheet = getOrCreateSheet(ss, SHEET_NAMES.ANGGARAN_TRX, DEFAULT_HEADERS.ANGGARAN_TRX);

  let rows = [];
  let periode = 'November 2026';

  if (angSheet.getLastRow() >= 2) {
    const data = angSheet.getDataRange().getValues();
    const headers = data[0] || DEFAULT_HEADERS.ANGGARAN;
    const idx = function(name) { return headers.indexOf(name); };

    const cId = idx('id');
    const cLevel = idx('level');
    const cType = idx('type');
    const cKode = idx('kode');
    const cUraian = idx('uraian');
    const cPagu = idx('pagu');
    const cLock = idx('lock');
    const cRealLalu = idx('real_lalu');
    const cRealIni = idx('real_ini');
    const cRealSd = idx('real_sd');
    const cPersen = idx('persen');
    const cSisa = idx('sisa');
    const cParent = idx('parent_id');
    const cPeriode = idx('periode');

    for (let i = 1; i < data.length; i++) {
      const r = data[i];
      const id = cId !== -1 ? String(r[cId] || '').trim() : '';
      if (!id) continue;
      if (cPeriode !== -1 && r[cPeriode] && String(r[cPeriode]).trim() !== '') {
        periode = String(r[cPeriode]).trim();
      }
      rows.push({
        id: id,
        level: cLevel !== -1 ? Number(r[cLevel]) || 0 : 0,
        type: cType !== -1 ? String(r[cType] || 'item').trim() : 'item',
        kode: cKode !== -1 ? String(r[cKode] !== null && r[cKode] !== undefined ? r[cKode] : '').trim() : '',
        uraian: cUraian !== -1 ? String(r[cUraian] || '') : '',
        pagu: cPagu !== -1 ? parseAnggaranNumberGas(r[cPagu]) : 0,
        lock: cLock !== -1 ? parseAnggaranNumberGas(r[cLock]) : 0,
        realLalu: cRealLalu !== -1 ? parseAnggaranNumberGas(r[cRealLalu]) : 0,
        realIni: cRealIni !== -1 ? parseAnggaranNumberGas(r[cRealIni]) : 0,
        realSd: cRealSd !== -1 ? parseAnggaranNumberGas(r[cRealSd]) : 0,
        persen: cPersen !== -1 ? Number(r[cPersen]) || 0 : 0,
        sisa: cSisa !== -1 ? parseAnggaranNumberGas(r[cSisa]) : 0,
        parentId: cParent !== -1 ? (String(r[cParent] || '').trim() || null) : null
      });
    }
  }

  let transactions = [];
  if (trxSheet.getLastRow() >= 2) {
    transactions = sheetToObjects(trxSheet);
  }

  return {
    periode: periode,
    rows: rows,
    transactions: transactions
  };
}

function writeAnggaranToSheet(ss, rows, periode) {
  const angSheet = getOrCreateSheet(ss, SHEET_NAMES.ANGGARAN, DEFAULT_HEADERS.ANGGARAN);
  const now = new Date();
  const safePeriode = String(periode || 'November 2026').trim() || 'November 2026';

  const batch = rows.map(function(r) {
    return [
      String(r.id || ''),
      Number(r.level) || 0,
      String(r.type || 'item'),
      String(r.kode !== undefined && r.kode !== null ? r.kode : ''),
      String(r.uraian || ''),
      Number(r.pagu) || 0,
      Number(r.lock) || 0,
      Number(r.realLalu) || 0,
      Number(r.realIni) || 0,
      Number(r.realSd) || 0,
      Number(r.persen) || 0,
      Number(r.sisa) || 0,
      r.parentId ? String(r.parentId) : '',
      safePeriode,
      now
    ];
  });

  const colCount = DEFAULT_HEADERS.ANGGARAN.length;
  const oldLastRow = angSheet.getLastRow();

  if (batch.length > 0) {
    // Set Plain Text format (@) on ID, Kode, Parent ID, Periode so '001' keeps leading zeros
    angSheet.getRange(2, 1, batch.length, 1).setNumberFormat('@');
    angSheet.getRange(2, 4, batch.length, 1).setNumberFormat('@');
    angSheet.getRange(2, 13, batch.length, 2).setNumberFormat('@');
    // Set numeric format for Rupiah & Percentage columns
    angSheet.getRange(2, 6, batch.length, 5).setNumberFormat('#,##0');
    angSheet.getRange(2, 11, batch.length, 1).setNumberFormat('0.00');
    angSheet.getRange(2, 12, batch.length, 1).setNumberFormat('#,##0');

    angSheet.getRange(2, 1, batch.length, colCount).setValues(batch);
  }

  if (oldLastRow > 1 + batch.length) {
    angSheet.deleteRows(2 + batch.length, oldLastRow - 1 - batch.length);
  }
}

function recalculateAnggaranTreeGas(allRows) {
  const rowMap = {};
  const orderedIds = [];
  const childrenMap = {};

  for (let i = 0; i < allRows.length; i++) {
    const r = allRows[i];
    const copy = {
      id: String(r.id || ''),
      level: Number(r.level) || 0,
      type: String(r.type || 'item'),
      kode: String(r.kode !== undefined && r.kode !== null ? r.kode : ''),
      uraian: String(r.uraian || ''),
      pagu: parseAnggaranNumberGas(r.pagu),
      lock: parseAnggaranNumberGas(r.lock),
      realLalu: parseAnggaranNumberGas(r.realLalu !== undefined ? r.realLalu : r.real_lalu),
      realIni: parseAnggaranNumberGas(r.realIni !== undefined ? r.realIni : r.real_ini),
      realSd: parseAnggaranNumberGas(r.realSd !== undefined ? r.realSd : r.real_sd),
      persen: Number(r.persen) || 0,
      sisa: parseAnggaranNumberGas(r.sisa),
      parentId: r.parentId !== undefined ? (r.parentId || null) : (r.parent_id || null)
    };
    rowMap[copy.id] = copy;
    orderedIds.push(copy.id);
    if (copy.parentId) {
      if (!childrenMap[copy.parentId]) childrenMap[copy.parentId] = [];
      childrenMap[copy.parentId].push(copy.id);
    }
  }

  const levels = [8, 7, 6, 5, 4, 3, 2, 1, 0];
  for (let li = 0; li < levels.length; li++) {
    const lvl = levels[li];
    for (let i = 0; i < orderedIds.length; i++) {
      const current = rowMap[orderedIds[i]];
      if (current.level !== lvl) continue;
      const childIds = childrenMap[current.id];
      if (childIds && childIds.length > 0) {
        let sumPagu = 0;
        let sumLock = 0;
        let sumRealLalu = 0;
        let sumRealIni = 0;
        for (let ci = 0; ci < childIds.length; ci++) {
          const ch = rowMap[childIds[ci]];
          if (ch) {
            sumPagu += Number(ch.pagu) || 0;
            sumLock += Number(ch.lock) || 0;
            sumRealLalu += Number(ch.realLalu) || 0;
            sumRealIni += Number(ch.realIni) || 0;
          }
        }
        current.pagu = sumPagu;
        current.lock = sumLock;
        current.realLalu = sumRealLalu;
        current.realIni = sumRealIni;
      }
      current.realSd = (Number(current.realLalu) || 0) + (Number(current.realIni) || 0);
      current.persen = current.pagu > 0 ? (current.realSd / current.pagu) * 100 : 0;
      current.sisa = (Number(current.pagu) || 0) - (Number(current.lock) || 0) - current.realSd;
    }
  }

  return orderedIds.map(function(id) { return rowMap[id]; });
}

function buildCanonicalAkunCodeGas(akunRow, byId) {
  const ancestors = [];
  let curr = akunRow;
  let guard = 0;
  while (curr && guard < 20) {
    ancestors.unshift(curr);
    curr = curr.parentId ? byId[curr.parentId] : null;
    guard++;
  }
  const findType = function(t) {
    for (let i = 0; i < ancestors.length; i++) {
      if (ancestors[i].type === t) return ancestors[i].kode || '';
    }
    return '';
  };
  const keg = findType('kegiatan');
  const ro = findType('ro');
  const sub = findType('subkomponen');
  const komp = findType('komponen');
  const midSub = sub || komp;
  return [keg, ro, midSub, akunRow.kode]
    .filter(Boolean)
    .join('.')
    .replace(/^(CL|WA)\./i, '')
    .toUpperCase();
}

function resolveAnggaranTargetGas(rows, kodeKomp, kodeMak, itemDetail, keteranganItem) {
  const byId = {};
  for (let i = 0; i < rows.length; i++) {
    byId[rows[i].id] = rows[i];
  }

  const cleanKomp = String(kodeKomp || '')
    .replace(/^(CL|WA)\./i, '')
    .replace(/^MAK\./i, '')
    .trim()
    .toUpperCase();
  const cleanMak = String(kodeMak || '524111').trim().toUpperCase();
  const targetAkunNoPrefix = cleanKomp
    ? (cleanKomp.endsWith('.' + cleanMak) || cleanKomp === cleanMak ? cleanKomp : cleanKomp + '.' + cleanMak)
    : '';

  const rawItem = String(itemDetail || '').trim();
  let cleanItemCode = '';
  if (rawItem.indexOf('.') !== -1) {
    cleanItemCode = rawItem.split('.')[0].trim().toUpperCase();
  } else {
    const m = rawItem.match(/^\d+/);
    cleanItemCode = (m ? m[0] : rawItem).toUpperCase();
  }

  let matchedAkunRow = null;
  let matchedAkunPath = targetAkunNoPrefix;

  if (targetAkunNoPrefix) {
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].type === 'akun' && buildCanonicalAkunCodeGas(rows[i], byId) === targetAkunNoPrefix) {
        matchedAkunRow = rows[i];
        break;
      }
    }
  }

  let matchedItemRow = null;
  if (matchedAkunRow && cleanItemCode) {
    for (let i = 0; i < rows.length; i++) {
      if (
        rows[i].type === 'item' &&
        rows[i].parentId === matchedAkunRow.id &&
        String(rows[i].kode || '').trim().toUpperCase() === cleanItemCode
      ) {
        matchedItemRow = rows[i];
        break;
      }
    }
  }

  // Fallback global hanya bila parent akun tidak ditemukan
  if (!matchedAkunRow && cleanItemCode) {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (r.type !== 'item' || String(r.kode || '').trim().toUpperCase() !== cleanItemCode) continue;
      if (!cleanMak) {
        matchedItemRow = r;
        break;
      }
      const p = r.parentId ? byId[r.parentId] : null;
      if (p && String(p.kode || '').trim().toUpperCase() === cleanMak) {
        matchedItemRow = r;
        matchedAkunRow = p;
        matchedAkunPath = buildCanonicalAkunCodeGas(p, byId);
        break;
      }
    }
  }

  let targetRow = matchedItemRow;
  let syntheticRow = null;
  let insertAfterIndex = -1;

  if (!targetRow && matchedAkunRow) {
    const children = [];
    let lastDescendantIndex = -1;
    let akunIndex = -1;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].id === matchedAkunRow.id) akunIndex = i;
      if (rows[i].parentId === matchedAkunRow.id) {
        children.push(rows[i]);
        lastDescendantIndex = i;
      }
    }

    if (children.length === 0) {
      targetRow = matchedAkunRow;
    } else if (children.length === 1 && !cleanItemCode) {
      targetRow = children[0];
    } else {
      const codeSlug = (cleanItemCode || 'umum').toLowerCase().replace(/[^a-z0-9_-]/g, '');
      const synId = 'row-spj-' + matchedAkunRow.id + '-' + codeSlug;
      for (let i = 0; i < children.length; i++) {
        if (children[i].id === synId) {
          targetRow = children[i];
          break;
        }
      }
      if (!targetRow) {
        syntheticRow = {
          id: synId,
          level: 8,
          type: 'item',
          kode: cleanItemCode || 'SPJ',
          uraian: String(keteranganItem || '').trim() || ('Realisasi SPJ (' + cleanMak + ')'),
          pagu: 0,
          lock: 0,
          realLalu: 0,
          realIni: 0,
          realSd: 0,
          persen: 0,
          sisa: 0,
          parentId: matchedAkunRow.id
        };
        targetRow = syntheticRow;
        insertAfterIndex = lastDescendantIndex !== -1 ? lastDescendantIndex : akunIndex;
      }
    }
  }

  return {
    matchedAkunRow: matchedAkunRow,
    matchedItemRow: matchedItemRow,
    targetRow: targetRow,
    syntheticRow: syntheticRow,
    insertAfterIndex: insertAfterIndex,
    kodeAkunPath: matchedAkunPath || targetAkunNoPrefix || cleanMak,
    kodeItem: cleanItemCode
  };
}

function upsertAnggaranTrxGas(ss, trxObj) {
  const trxSheet = getOrCreateSheet(ss, SHEET_NAMES.ANGGARAN_TRX, DEFAULT_HEADERS.ANGGARAN_TRX);
  const lastRow = trxSheet.getLastRow();
  const headers = lastRow > 0 ? trxSheet.getRange(1, 1, 1, trxSheet.getLastColumn()).getValues()[0] : DEFAULT_HEADERS.ANGGARAN_TRX;
  const rowData = headers.map(function(h) {
    return trxObj[h] !== undefined && trxObj[h] !== null ? trxObj[h] : '';
  });

  const colId = headers.indexOf('id_kegiatan');
  let targetRowNum = -1;
  if (colId !== -1 && lastRow >= 2) {
    const data = trxSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][colId] || '').trim().toLowerCase() === String(trxObj.id_kegiatan || '').trim().toLowerCase()) {
        targetRowNum = i + 1;
        break;
      }
    }
  }

  if (targetRowNum === -1) {
    targetRowNum = lastRow + 1;
  }

  trxSheet.getRange(targetRowNum, 1, 1, 6).setNumberFormat('@');
  trxSheet.getRange(targetRowNum, 7, 1, 2).setNumberFormat('#,##0');
  trxSheet.getRange(targetRowNum, 1, 1, rowData.length).setValues([rowData]);
}

function pruneEmptySyntheticAnggaranRowsGas(rows, preserveId) {
  return rows.filter(function(r) {
    if (String(r.id || '').indexOf('row-spj-') !== 0) return true;
    if (preserveId && r.id === preserveId) return true;
    return (
      parseAnggaranNumberGas(r.pagu) !== 0 ||
      parseAnggaranNumberGas(r.lock) !== 0 ||
      parseAnggaranNumberGas(r.realLalu) !== 0 ||
      parseAnggaranNumberGas(r.realIni) !== 0
    );
  });
}

function applySpjDeductionToAnggaranGas(ss, opts) {
  const angSheet = getOrCreateSheet(ss, SHEET_NAMES.ANGGARAN, DEFAULT_HEADERS.ANGGARAN);
  const trxSheet = getOrCreateSheet(ss, SHEET_NAMES.ANGGARAN_TRX, DEFAULT_HEADERS.ANGGARAN_TRX);

  if (angSheet.getLastRow() < 2) {
    if (opts.initialAnggaranRows && opts.initialAnggaranRows.length > 0) {
      const seeded = recalculateAnggaranTreeGas(opts.initialAnggaranRows);
      writeAnggaranToSheet(ss, seeded, opts.initialPeriode || 'November 2026');
    } else {
      return {
        rows: null,
        periode: opts.initialPeriode || 'November 2026',
        applied: { matched: false, reason: 'Tab MONITORING_ANGGARAN belum diinisialisasi.' }
      };
    }
  }

  const state = readAnggaranFromSheet(ss);
  let rows = state.rows;
  if (!rows || rows.length === 0) {
    return { rows: null, periode: state.periode, applied: { matched: false, reason: 'Data anggaran kosong.' } };
  }

  // Cari transaksi existing untuk idKegiatan / oldIdKegiatan
  let existingTrx = null;
  const searchIds = [opts.idKegiatan];
  if (!opts.isNewRecord && opts.oldIdKegiatan && opts.oldIdKegiatan !== opts.idKegiatan) {
    searchIds.push(opts.oldIdKegiatan);
  }
  for (let t = 0; t < state.transactions.length; t++) {
    const tr = state.transactions[t];
    const trId = String(tr.id_kegiatan || '').trim().toLowerCase();
    for (let s = 0; s < searchIds.length; s++) {
      if (searchIds[s] && trId === String(searchIds[s]).trim().toLowerCase()) {
        existingTrx = tr;
        break;
      }
    }
    if (existingTrx) break;
  }

  let didRefundOld = false;
  if (existingTrx) {
    const prevTargetId = String(existingTrx.target_row_id || '').trim();
    const prevNominal = parseAnggaranNumberGas(existingTrx.nominal);
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].id === prevTargetId) {
        rows[i].realIni = (Number(rows[i].realIni) || 0) - prevNominal;
        didRefundOld = true;
        break;
      }
    }
    if (!opts.isNewRecord && opts.oldIdKegiatan && opts.oldIdKegiatan !== opts.idKegiatan) {
      deleteRowsByColumnValue(trxSheet, 'id_kegiatan', opts.oldIdKegiatan);
    }
  }

  let baselineIncluded = 0;
  let newNominal = parseAnggaranNumberGas(opts.grandTotal);
  if (existingTrx) {
    baselineIncluded = parseAnggaranNumberGas(existingTrx.baseline_included);
    newNominal = parseAnggaranNumberGas(opts.grandTotal) - baselineIncluded;
  } else if (!opts.isNewRecord) {
    // SPJ historis pre-fitur: hanya catat/terapkan selisih perubahan agar baseline Excel tidak terpotong ganda
    const prevDbTotal = parseAnggaranNumberGas(opts.prevDbGrandTotal);
    baselineIncluded = prevDbTotal;
    newNominal = parseAnggaranNumberGas(opts.grandTotal) - prevDbTotal;
    if (newNominal === 0) {
      return {
        rows: rows,
        periode: state.periode,
        applied: { matched: true, nominalApplied: 0, unchangedHistorical: true }
      };
    }
  }

  const targetRes = resolveAnggaranTargetGas(
    rows,
    opts.kodeKomponen,
    opts.kodeMak,
    opts.itemDetail,
    opts.keteranganItem
  );

  if (!targetRes.targetRow && !didRefundOld) {
    return {
      rows: rows,
      periode: state.periode,
      applied: {
        matched: false,
        nominalApplied: 0,
        reason: 'MAK ' + (targetRes.kodeAkunPath || opts.kodeMak) + ' tidak ditemukan di Monitoring Anggaran.'
      }
    };
  }

  if (targetRes.targetRow) {
    if (targetRes.syntheticRow) {
      const idx = targetRes.insertAfterIndex >= 0 ? targetRes.insertAfterIndex + 1 : rows.length;
      rows.splice(idx, 0, targetRes.syntheticRow);
    }
    targetRes.targetRow.realIni = (Number(targetRes.targetRow.realIni) || 0) + newNominal;

    upsertAnggaranTrxGas(ss, {
      id_kegiatan: opts.idKegiatan,
      target_row_id: targetRes.targetRow.id,
      kode_akun_path: targetRes.kodeAkunPath,
      kode_item: targetRes.kodeItem,
      nama_kegiatan: opts.namaKegiatan || '',
      nomor_memo: opts.nomorMemo || '',
      nominal: newNominal,
      baseline_included: baselineIncluded,
      updated_at: new Date()
    });
  } else if (existingTrx) {
    deleteRowsByColumnValue(trxSheet, 'id_kegiatan', opts.idKegiatan);
  }

  rows = pruneEmptySyntheticAnggaranRowsGas(rows, targetRes.targetRow ? targetRes.targetRow.id : '');
  const recalculated = recalculateAnggaranTreeGas(rows);
  writeAnggaranToSheet(ss, recalculated, state.periode || 'November 2026');

  return {
    rows: recalculated,
    periode: state.periode,
    applied: {
      matched: Boolean(targetRes.targetRow),
      targetRowId: targetRes.targetRow ? targetRes.targetRow.id : '',
      kodeAkunPath: targetRes.kodeAkunPath,
      nominalApplied: newNominal
    }
  };
}

function refundSpjFromMonitoringAnggaranGas(ss, opts) {
  const trxSheet = getOrCreateSheet(ss, SHEET_NAMES.ANGGARAN_TRX, DEFAULT_HEADERS.ANGGARAN_TRX);
  const angSheet = getOrCreateSheet(ss, SHEET_NAMES.ANGGARAN, DEFAULT_HEADERS.ANGGARAN);
  if (trxSheet.getLastRow() < 2 || angSheet.getLastRow() < 2) {
    return { refunded: false, nominal: 0, rows: null, periode: '' };
  }

  const state = readAnggaranFromSheet(ss);
  const idClean = String(opts.idKegiatan || '').trim().toLowerCase();
  const oldIdClean = String(opts.oldIdKegiatan || '').trim().toLowerCase();
  const memoClean = String(opts.nomorMemo || '').trim().toLowerCase();
  const namaClean = String(opts.namaKegiatan || '').trim().toLowerCase();

  const matchingTrxs = [];
  for (let i = 0; i < state.transactions.length; i++) {
    const tr = state.transactions[i];
    const tId = String(tr.id_kegiatan || '').trim().toLowerCase();
    const tMemo = String(tr.nomor_memo || '').trim().toLowerCase();
    const tNama = String(tr.nama_kegiatan || '').trim().toLowerCase();

    if ((idClean && tId === idClean) || (oldIdClean && tId === oldIdClean)) {
      matchingTrxs.push(tr);
    } else if (!idClean && ((memoClean && tMemo === memoClean) || (namaClean && tNama === namaClean))) {
      matchingTrxs.push(tr);
    }
  }

  if (matchingTrxs.length === 0) {
    return { refunded: false, nominal: 0, rows: null, periode: state.periode };
  }

  let rows = state.rows;
  let totalRefunded = 0;

  matchingTrxs.forEach(function(tr) {
    const targetId = String(tr.target_row_id || '').trim();
    const nominal = parseAnggaranNumberGas(tr.nominal);
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].id === targetId) {
        rows[i].realIni = (Number(rows[i].realIni) || 0) - nominal;
        totalRefunded += nominal;
        break;
      }
    }
    deleteRowsByColumnValue(trxSheet, 'id_kegiatan', tr.id_kegiatan);
  });

  rows = pruneEmptySyntheticAnggaranRowsGas(rows, '');
  const recalculated = recalculateAnggaranTreeGas(rows);
  writeAnggaranToSheet(ss, recalculated, state.periode || 'November 2026');

  return {
    refunded: true,
    nominal: totalRefunded,
    rows: recalculated,
    periode: state.periode
  };
}
