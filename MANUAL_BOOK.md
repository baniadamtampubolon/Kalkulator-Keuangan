# PANDUAN PENGGUNAAN (MANUAL BOOK)
## Sistem Otomasi SPPD & Kalkulator Keuangan Perjalanan Dinas
**Inspektorat — Kementerian Koordinator Bidang Pangan Republik Indonesia**

---

## DAFTAR ISI
1. [Pendahuluan & Gambaran Umum](#1-pendahuluan--gambaran-umum)
2. [Tampilan Utama & Navigasi Antarmuka](#2-tampilan-utama--navigasi-antarmuka)
3. [Langkah 1: Pengisian Header & Parameter Kegiatan](#3-langkah-1-pengisian-header--parameter-kegiatan)
4. [Langkah 2: Memilih Preset & Komponen Biaya](#4-langkah-2-memilih-preset--komponen-biaya)
5. [Langkah 3: Mengisi Daftar Peserta & Perhitungan Biaya](#5-langkah-3-mengisi-daftar-peserta--perhitungan-biaya)
   - [3.1 Menambah & Memilih Pegawai](#31-menambah--memilih-pegawai)
   - [3.2 Menentukan Durasi & Uang Harian (UH)](#32-menentukan-durasi--uang-harian-uh)
   - [3.3 Input Tiket Pesawat / Kereta (Modal Tiket)](#33-input-tiket-pesawat--kereta-modal-tiket)
   - [3.4 Input Akomodasi Hotel (Modal Hotel)](#34-input-akomodasi-hotel-modal-hotel)
   - [3.5 Input Pengeluaran Riil (Modal Riil)](#35-input-pengeluaran-riil-modal-riil)
   - [3.6 Input Data Tambahan SPJ & Rekap Perdin](#36-input-data-tambahan-spj--rekap-perdin)
6. [Langkah 4: Pratinjau & Pencetakan Dokumen Resmi](#6-langkah-4-pratinjau--pencetakan-dokumen-resmi)
   - [4.1 Jenis Dokumen yang Tersedia](#41-jenis-dokumen-yang-tersedia)
   - [4.2 Mode Edit Bebas on Canvas](#42-mode-edit-bebas-on-canvas)
   - [4.3 Tips Pengaturan Cetak Browser (Print Setup)](#43-tips-pengaturan-cetak-browser-print-setup)
7. [Langkah 5: Menyimpan ke Google Sheet & Mengelola Rekap Perdin](#7-langkah-5-menyimpan-ke-google-sheet--mengelola-rekap-perdin)
   - [5.1 Tombol All-in-One: Simpan & Sinkronkan](#51-tombol-all-in-one-simpan--sinkronkan)
   - [5.2 Mengedit & Mencari Data Rekap Perdin](#52-mengedit--mencari-data-rekap-perdin)
   - [5.3 Ekspor Data Rekap ke Excel](#53-ekspor-data-rekap-ke-excel)
8. [Menu Khusus Admin: Database Cloud & PIN Keamanan](#8-menu-khusus-admin-database-cloud--pin-keamanan)
9. [Tanya Jawab (FAQ) & Penyelesaian Masalah (Troubleshooting)](#9-tanya-jawab-faq--penyelesaian-masalah-troubleshooting)

---

## 1. Pendahuluan & Gambaran Umum
Aplikasi ini dikembangkan untuk memudahkan penyusunan, perhitungan tarif SBM (Standar Biaya Masukan PMK), pembuatan SPJ, dan pencetakan dokumen pertanggungjawaban perjalanan dinas di lingkungan Kementerian Koordinator Bidang Pangan RI.

### Keunggulan Sistem:
* **Perhitungan SBM Otomatis:** Menyesuaikan tarif Uang Harian dan batas atas Penginapan berdasarkan provinsi/kota tujuan sesuai PMK terbaru.
* **Format Angka Otomatis:** Setiap nominal biaya yang diketik secara langsung diformat dengan tanda titik ribuan (`1.000.000`) untuk mencegah kesalahan input.
* **Pencetakan Terstandarisasi:** Menghasilkan 6 jenis dokumen resmi siap cetak (Kwitansi, Memorandum, Daftar Nominatif, Daftar Pengeluaran Riil, Rincian Biaya, dan SPPD Visum).
* **Integrasi Database Cloud (Google Sheets):** Menyimpan seluruh histori SPJ secara aman dan terpusat tanpa memerlukan database server rumit.

---

## 2. Tampilan Utama & Navigasi Antarmuka
Aplikasi dirancang dengan estetika minimalis modern (*Apple Monochrome Design*) yang bersih dan responsif:

* **Header Navigasi Atas:**
  * Logo resmi Kementerian Koordinator Bidang Pangan RI.
  * Status jumlah peserta terdaftar dan total akumulasi anggaran.
  * Tab Menu Utama:
    * **Input & Kalkulator:** Formulir utama pengisian data perdin.
    * **Kwitansi, Memorandum, Nominatif, Pengeluaran Riil, Rincian Biaya, SPPD:** Tab pratinjau dokumen cetak.
    * **Rekap Perdin:** Riwayat seluruh arsip perjalanan dinas tersimpan.
    * **Tombol Database Cloud:** Menu pengaturan koneksi database (dilindungi PIN Admin).

---

## 3. Langkah 1: Pengisian Header & Parameter Kegiatan
Pada bagian atas formulir **Input & Kalkulator**, lengkapi informasi dasar kegiatan:

1. **Nomor Surat Tugas (ST):**
   * Masukkan Nomor ST Master kegiatan (contoh: `ST-04/INS/KP.01/01/2026`).
   * *Opsional:* Jika terdapat ST terpisah untuk Pejabat Eselon I/II atau Staff, Anda dapat mengisi kolom ST khusus yang tersedia.
2. **Nomor SPBY & Akun MAK:**
   * Masukkan Nomor Surat Perintah Bayar (SPBY).
   * Nomor SPM (standar: `00073T`).
   * Akun MAK pembebanan anggaran (standar: `524111` - Belanja Perjalanan Dinas Biasa).
3. **Tanggal Cetak & Kota Penetapan:**
   * Tentukan tanggal pembuatan dokumen dan kota penetapan (`Jakarta Pusat`).
4. **Pejabat Penandatangan:**
   * **PPK (Pejabat Pembuat Komitmen):** Nama, NIP, dan jabatan.
   * **Bendahara Pengeluaran:** Nama, NIP, dan jabatan.
   * **Pejabat Penerbit ST / Atasan Langsung:** Contoh: Inspektur Kementerian Koordinator Bidang Pangan.
5. **Provinsi & Kota Tujuan:**
   * Pilih provinsi tujuan kegiatan (misal: *Sumatera Utara*, *Jawa Timur*, *Bali*).
   * Memilih provinsi akan secara otomatis menentukan besaran tarif Uang Harian (UH) dan pagu hotel sesuai SBM PMK.

---

## 4. Langkah 2: Memilih Preset & Komponen Biaya

### A. Tombol Preset Cepat Skema Biaya
Untuk menghemat waktu pengisian, gunakan salah satu dari tombol preset berikut:
* 🚗 **Standar Darat PP:** Mengaktifkan biaya Transportasi Darat PP + Uang Harian Biasa 100%. Cocok untuk dinas darat dekat.
* ✈️ **Udara + Hotel:** Mengaktifkan Tiket Pesawat/Kereta + Hotel + Pengeluaran Riil + Uang Harian Biasa. Cocok untuk dinas luar kota reguler.
* 🏢 **Fullboard Meeting:** Mengaktifkan Paket Fullboard + Uang Harian Fullboard/Halfday + Tiket Transportasi. Cocok untuk kegiatan konsinyering/rapat hotel.
* 🔄 **Reset:** Mengembalikan seluruh pilihan komponen ke kondisi kosong.

### B. Komponen Biaya yang Dihitung
Anda dapat mencentang atau menghilangkan centang komponen biaya sesuai kebutuhan:
* **Transportasi:** Tiket Pesawat/KA, Transport Darat PP, Dukungan Transport, Transport Lokal, Transport Jakarta PP, Transport Daerah PP.
* **Akomodasi:** Hotel / Penginapan (at cost), Penginapan 30% SBM (jika tidak menginap di hotel dinas).
* **Paket Pertemuan:** Paket Fullday, Paket Fullboard.
* **Lain-lain:** Pengeluaran Riil, Uang Representatif (khusus Pejabat), Belanja Bahan.

### C. Jenis Uang Harian (SBM PMK)
Pilih skema uang harian yang berlaku:
* **UH Biasa (100%):** Perjalanan dinas luar kota biasa.
* **UH 60%:** Kegiatan diklat atau workshop.
* **UH Halfday:** Rapat luar kantor paket setengah hari tanpa menginap.
* **UH Fullboard:** Rapat luar kantor paket menginap penuh.

---

## 5. Langkah 3: Mengisi Daftar Peserta & Perhitungan Biaya

### 3.1 Menambah & Memilih Pegawai
1. Klik tombol **`+ Tambah Pegawai`** untuk menambahkan baris peserta baru.
2. Gunakan tombol **`Duplikat Baris`** untuk menyalin data peserta sebelumnya (mempercepat pengisian jika tanggal dan tujuan sama).
3. Pada kolom **Nama Pegawai**, klik dropdown dan pilih nama pegawai yang bersangkutan.
   * *NIP, Golongan, dan Jabatan akan terisi secara otomatis dari database Master Pegawai.*

### 3.2 Menentukan Durasi & Uang Harian (UH)
1. **Tanggal Berangkat & Pulang:**
   * Tentukan tanggal mulai dan selesai dinas. Kolom **Durasi (hr)** akan terhitung otomatis.
2. **Lama Hari Pembayaran UH:**
   * Secara default, hari UH mengikuti durasi dinas. Anda dapat mengubah jumlah hari pembayaran UH secara manual (misal: dinas 3 hari namun UH yang dibayarkan hanya 2 hari).
3. **Nominal Uang Harian (Editable):**
   * Tarif otomatis terisi dari standar SBM.
   * **Dapat Diedit Bebas:** Jika terdapat kondisi pemotongan (misal: dipotong uang makan karena disediakan konsumsi oleh panitia), ketikkan langsung nominal penyesuaian. Sistem langsung memformat angka dengan titik ribuan secara otomatis.

### 3.3 Input Tiket Pesawat / Kereta (Modal Tiket)
Jika komponen tiket dicentang, klik tombol **`Input`** berikon pesawat pada baris pegawai:
* **Kolom Keberangkatan:** No. Tiket, Kode Booking, Maskapai, No. Penerbangan, Tanggal & Jam, dan **Harga Fare Pergi (Rp)**.
* **Kolom Kepulangan:** No. Tiket, Kode Booking, Maskapai, No. Penerbangan, Tanggal & Jam, dan **Harga Fare Pulang (Rp)**.
* **Status Boarding Pass:** Pilih `ADA` atau `TIDAK`.
* Klik **Simpan Tiket**.

### 3.4 Input Akomodasi Hotel (Modal Hotel)
Jika komponen hotel dicentang, klik tombol **`Input`** berikon hotel:
* Masukkan **Nama Hotel**, **No. Kamar**, dan **No. Bill/Folio**.
* Masukkan **Jumlah Malam** dan **Rate Per Malam (Rp)**.
* Sistem akan otomatis mengalikan dan menampilkan Total Biaya Hotel.
* Klik **Simpan Hotel**.

### 3.5 Input Pengeluaran Riil (Modal Riil)
Jika terdapat pengeluaran yang tidak memiliki bukti kuitansi resmi (sesuai PMK):
* Klik tombol **`Input`** berikon koin/dolar pada baris pegawai.
* Klik **`+ Tambah Baris`** untuk menambahkan item (misal: Biaya Tol, Taksi Lokal, Parkir).
* Masukkan uraian dan jumlah rupiah.
* Klik **Simpan Pengeluaran Riil**.

### 3.6 Input Data Tambahan SPJ & Rekap Perdin
Klik ikon spreadsheet kecil di samping tombol hapus baris untuk melengkapi data arsip SPJ:
* Nama Pegawai Eksternal (jika pelaksana dinas bukan PNS internal Inspektorat).
* Sewa Kendaraan, Taksi Bandara, Biaya Reschedule, Kurs Valuta (jika LN), dan Pengembalian Kas.

---

## 6. Langkah 4: Pratinjau & Pencetakan Dokumen Resmi

Setelah seluruh data terisi, buka tab dokumen yang diinginkan pada bilah navigasi atas:

### 4.1 Jenis Dokumen yang Tersedia
1. **Kwitansi Nominatif (Kwitansi SPJ):**
   * Format tanda bukti penerimaan pembayaran lengkap dengan tabel rincian biaya, pembebanan anggaran, serta 4 tanda tangan (Pelaksana, Bendahara Pengeluaran, PPK, dan Atasan Langsung).
2. **Memorandum Master:**
   * Nota dinas pertanggungjawaban pelaksanaan dinas dan rincian pengeluaran kepada Pimpinan.
3. **Daftar Nominatif Rencana Kegiatan:**
   * Tabel horizontal landscape memuat seluruh pelaksana dinas, ST, rincian biaya tiket, hotel, UH, riil, dan total keseluruhan dalam satu lembar rapi font Tahoma standar Inspektorat.
4. **Daftar Pengeluaran Riil:**
   * Formulir resmi surat pernyataan pengeluaran riil per pegawai sesuai ketentuan perbendaharaan.
5. **Rincian Biaya Perjalanan Dinas:**
   * Lampiran rincian biaya perorangan untuk kelengkapan SPPD.
6. **Lampiran SPPD:**
   * Halaman depan (Identitas Perdin & PPK) dan Halaman belakang (Tabel visum stempel instansi tujuan).

### 4.2 Mode Edit Bebas on Canvas
Pada setiap halaman dokumen, terdapat tombol **`Mode Edit Bebas`**:
* Aktifkan tombol ini untuk mengklik dan mengubah teks apapun langsung pada lembar dokumen (misal: merevisi nama kota, nomor ST, gelar pegawai, catatan kaki, dsb.).
* Perubahan pada kanvas tidak akan merusak kalkulasi dasar.

### 4.3 Tips Pengaturan Cetak Browser (Print Setup)
Ketika menekan tombol **`Cetak Dokumen / Print`** atau `Ctrl + P` (`Cmd + P` di Mac):
* **Destination:** Pilih *Save as PDF* atau printer fisik Anda.
* **Paper Size:** Pastikan memilih **A4**.
* **Orientation:**
  * Dokumen Nominatif: **Landscape**.
  * Kwitansi, Riil, Rincian, SPPD, Memo: **Portrait**.
* **Margins:** Pilih **None** atau **Default**.
* **Options:** Centang **Background graphics** agar warna garis dan tabel tercetak sempurna.

---

## 7. Langkah 5: Menyimpan ke Google Sheet & Mengelola Rekap Perdin

### 7.1 Tombol All-in-One: Simpan & Sinkronkan
Setelah selesai mengisi data pada halaman **Input & Kalkulator**:
1. Buka tab **Rekap Perdin**.
2. Klik tombol hijau utama: **`Simpan ke Google Sheet & Sinkronkan Rekap`**.
3. Sistem akan memproses penyimpanan seluruh peserta ke database spreadsheet cloud, dan langsung menyegarkan tabel riwayat rekap perdin dalam sekali klik.

### 7.2 Mengedit & Mencari Data Rekap Perdin
* **Pencarian Cepat:** Gunakan kotak filter pencarian di bagian atas untuk menemukan riwayat dinas berdasarkan nama pegawai, nomor ST, atau nama kegiatan.
* **Edit Baris Rekap:** Klik tombol edit pada baris tertentu untuk membuka *Editor Rekap 4-Tab* jika ingin melakukan koreksi data yang telah tersimpan.

### 7.3 Ekspor Data Rekap ke Excel
* Klik tombol **`Ekspor Excel (.xlsx)`** pada tab Rekap Perdin untuk mengunduh seluruh arsip data perjalanan dinas ke file spreadsheet komputer lokal Anda.

---

## 8. Setup Awal Koneksi Database & Menu Khusus Admin

### 8.1 Tutorial Setup Awal Koneksi Database (Bagi Pengguna Baru / Ganti Spreadsheet)

> [!IMPORTANT]
> **PENTING: CARA MENDAPATKAN LINK DATABASE**
> Untuk mendapatkan **Link Web App Google Apps Script**, Anda harus **menghubungi Administrator sistem** terlebih dahulu. Administrator akan memberikan link deployment URL resmi yang terhubung ke Google Spreadsheet master instansi.

Setelah Anda mendapatkan link dari Administrator, ikuti langkah-langkah setup awal berikut:

1. **Buka Menu Database:**
   * Pada halaman web app, klik tombol **`Database`** (berikon database) yang terletak di bilah navigasi kanan atas.
2. **Masukkan PIN Keamanan Admin:**
   * Ketik PIN Keamanan: **`311001`**, lalu tekan tombol **Buka Pengaturan Database**.
3. **Masukkan URL Web App:**
   * Tempelkan (*paste*) Link Web App Google Apps Script yang telah Anda peroleh dari Administrator ke dalam kolom input **"URL Deployment Google Apps Script"**.
4. **Uji Koneksi:**
   * Klik tombol biru **`Uji Koneksi`**. Tunggu sesaat hingga sistem menampilkan notifikasi status berwarna hijau: **"Terhubung ke Google Spreadsheet"**.
5. **Simpan Konfigurasi:**
   * Klik tombol **`Simpan URL & Gunakan`**. Link akan tersimpan secara otomatis di peramban Anda.
6. **Sinkronkan Master Data:**
   * Klik tombol **`Sinkronkan Master Data`** untuk memuat daftar pegawai terbaru, standar tarif SBM PMK, dan riwayat penomoran memo langsung dari Google Sheet.
7. **Selesai!**
   * Aplikasi Anda kini telah siap digunakan sepenuhnya untuk menyimpan data SPJ dan menyinkronkan rekap perjalanan dinas secara otomatis.

---

### 8.2 Keamanan & Hak Akses
* **PIN Keamanan Admin:** `311001`.
* **Penggunaan Sehari-hari:** Jika aplikasi sudah dideploy di Vercel atau link sudah disetup, pengguna umum **tidak perlu mengulangi setup ini**. Aplikasi akan otomatis mengingat koneksi ke database cloud.
* **Pergantian Spreadsheet:** Jika suatu saat Inspektorat membuat file Google Spreadsheet baru di tahun anggaran berikutnya, ulangi langkah di atas dengan link Apps Script baru dari Administrator.

---

## 9. Tanya Jawab (FAQ) & Penyelesaian Masalah (Troubleshooting)

### Q1: Apakah saya harus memasukkan link Google Apps Script setiap kali membuka web app?
> **Tidak.** Aplikasi sudah otomatis terhubung ke database cloud melalui pengaturan server (Vercel Environment Variable). Pengguna dapat langsung menggunakan aplikasi tanpa langkah teknis apapun.

### Q2: Angka nominal biaya terpotong saat mencetak dokumen Nominatif?
> Ukuran font Nominatif telah disesuaikan ke font Tahoma yang padat dan ketebalan border telah disetel ke 1px reguler. Pastikan pada dialog print browser Anda memilih kertas **A4 Landscape** dengan skala (*Scale*) **Fit to page** atau **100%**.

### Q3: Bagaimana jika Uang Harian harus dipotong uang makan?
> Cukup ketik nominal baru pada kolom biaya Uang Harian di tabel rincian peserta. Angka dapat diedit bebas dan sistem secara otomatis menghitung ulang total anggaran.

### Q4: Data di Google Sheet tidak bertambah setelah klik tombol simpan?
> 1. Pastikan koneksi internet aktif.
> 2. Pastikan Google Apps Script dideploy dengan akses: *Who has access: Anyone*.
> 3. Cek apakah sheet target memiliki struktur kolom yang sesuai dengan template database.

---
*Dokumen panduan ini disusun resmi untuk operasional internal Kementerian Koordinator Bidang Pangan RI.*
