# Sistem Otomasi SPPD & Kalkulator Keuangan Perjalanan Dinas

### Inspektorat — Kementerian Koordinator Bidang Pangan Republik Indonesia

Aplikasi web modern untuk otomatisasi perhitungan Uang Harian SBM PMK, pembuatan rincian biaya perjalanan dinas, pencetakan 6 dokumen pertanggungjawaban resmi standar Inspektorat, dan sinkronisasi database cloud Google Sheets.

---

## 📖 Panduan Penggunaan Lengkap

Untuk panduan penggunaan langkah demi langkah dari awal sampai akhir, silakan baca:
👉 **[Buku Panduan Penggunaan (MANUAL_BOOK.md)](./MANUAL_BOOK.md)**

---

## 🚀 Fitur Utama

- **Kalkulasi SBM Otomatis:** Perhitungan tarif Uang Harian (100%, 60%, Halfday, Fullboard) dan batas penginapan berdasarkan SBM PMK seluruh provinsi di Indonesia.
- **Input Angka Rupiah Otomatis:** Dilengkapi pemisah ribuan standar Indonesia (`1.000.000`) secara *real-time* saat mengetik.
- **Pencetakan Dokumen Resmi:**
  1. Kwitansi Nominatif / Kwitansi SPJ (4 Tanda Tangan)
  2. Memorandum Master Nota Dinas
  3. Daftar Nominatif Rencana Kegiatan (Tabel Landscape Font Tahoma)
  4. Surat Pernyataan Daftar Pengeluaran Riil
  5. Rincian Biaya Perjalanan Dinas
  6. Lampiran SPPD Depan & Belakang (Visum Stempel)
- **Mode Edit Bebas on Canvas:** Fitur koreksi langsung pada kanvas dokumen sebelum dicetak.
- **Integrasi Database Cloud (Google Sheets):** Tombol All-in-One untuk menyimpan data SPJ ke Google Spreadsheet sekaligus menyinkronkan data rekap perdin.
- **Keamanan Konfigurasi:** Menu konfigurasi database dilindungi oleh PIN Admin (`311001`).

---

## 🛠️ Menjalankan di Komputer Lokal

1. **Install dependencies:**

   ```bash
   npm install
   ```
2. **Jalankan development server:**

   ```bash
   npm run dev
   ```
3. Buka peramban di [http://localhost:3000](http://localhost:3000).

---

## 🌐 Deployment ke Vercel

1. Push repository ke GitHub:

   ```bash
   git add .
   git commit -m "feat: update project"
   git push origin main
   ```
2. Import repository di [Vercel](https://vercel.com/new).
3. Tambahkan Environment Variable:

   - `NEXT_PUBLIC_GAS_API_URL`: URL Web App Google Apps Script.
4. Klik **Deploy**.
