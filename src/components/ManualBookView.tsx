"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Search,
  Database,
  Calculator,
  Receipt,
  FileSpreadsheet,
  FileText,
  Printer,
  ShieldCheck,
  HelpCircle,
  AlertTriangle,
  Sparkles,
  ArrowRight,
} from "lucide-react";

interface ManualBookViewProps {
  onOpenDatabaseSync?: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export const ManualBookView: React.FC<ManualBookViewProps> = ({
  onOpenDatabaseSync,
  onNavigateToTab,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState("setup-database");

  const sections = [
    { id: "setup-database", title: "Setup Awal Database Cloud", icon: Database, badge: "Penting" },
    { id: "pendahuluan", title: "1. Gambaran Umum & Fitur", icon: BookOpen },
    { id: "header-parameter", title: "2. Parameter & Pejabat", icon: FileText },
    { id: "preset-komponen", title: "3. Preset & Komponen Biaya", icon: Sparkles },
    { id: "rincian-biaya", title: "4. Rincian Peserta & SBM", icon: Calculator },
    { id: "cetak-dokumen", title: "5. Pratinjau & Cetak Dokumen", icon: Printer },
    { id: "rekap-perdin", title: "6. Simpan & Rekap Perdin", icon: FileSpreadsheet },
    { id: "faq", title: "7. Tanya Jawab (FAQ)", icon: HelpCircle },
  ];

  const filteredSections = searchQuery.trim()
    ? sections.filter((s) =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sections;

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-white border border-slate-200/80 p-6 md:p-8 shadow-xs relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold">
              <BookOpen className="w-3.5 h-3.5 text-[#0071e3]" />
              <span>Buku Panduan Penggunaan Resmi</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
              Panduan Operasional Kalkulator Keuangan & SPPD
            </h2>
            <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
              Panduan terstruktur cara pengisian data, perhitungan tarif SBM otomatis, pencetakan dokumen resmi, dan setup awal database Google Spreadsheet Inspektorat Kemenko Pangan RI.
            </p>
          </div>

          {/* Quick Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari panduan, topik, atau fitur..."
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Main 2-Column Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sticky Table of Contents Navigation */}
        <div className="lg:col-span-4 sticky top-24 space-y-3">
          <div className="rounded-2xl bg-white border border-slate-200/80 p-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-2">
              Daftar Isi Panduan
            </h3>
            <nav className="space-y-1">
              {filteredSections.map((sec) => {
                const Icon = sec.icon;
                const isSelected = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => scrollToSection(sec.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                      isSelected
                        ? "bg-[#0071e3] text-white shadow-xs font-semibold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 shrink-0 ${isSelected ? "text-white" : "text-slate-400"}`} />
                      <span className="truncate">{sec.title}</span>
                    </div>
                    {sec.badge && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {sec.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Quick Action Button to Open Database */}
            {onOpenDatabaseSync && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onOpenDatabaseSync}
                  className="btn-tactile w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Buka Menu Database</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Content Section */}
        <div className="lg:col-span-8 space-y-6">
          {/* SECTION: SETUP AWAL DATABASE CLOUD */}
          <section
            id="setup-database"
            className="rounded-2xl bg-white border-2 border-[#0071e3]/30 p-6 md:p-8 shadow-xs space-y-5 scroll-mt-24"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0071e3]">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Tutorial Setup Awal Koneksi Database Cloud
                  </h3>
                  <p className="text-xs text-slate-500">
                    Panduan menghubungkan web app dengan Google Spreadsheet resmi
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold border border-blue-200">
                Langkah Awal
              </span>
            </div>

            {/* Crucial Note to Contact Admin */}
            <div className="rounded-xl bg-amber-50 border border-amber-200/80 p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs md:text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>PENTING: CARA MENDAPATKAN LINK DATABASE</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                Untuk mendapatkan <strong>Link Web App Google Apps Script</strong> yang terhubung ke Google Spreadsheet resmi Inspektorat, Anda harus <strong>menghubungi Administrator sistem terlebih dahulu</strong>. Administrator akan membagikan link deployment URL yang siap dipakai.
              </p>
            </div>

            {/* Step by Step Setup Flow */}
            <div className="space-y-4 pt-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Langkah-Langkah Menghubungkan Web App ke Database:
              </h4>

              <div className="space-y-3">
                {/* Step 1 */}
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </span>
                  <div className="space-y-1 text-xs">
                    <strong className="text-slate-900 block font-semibold">
                      Dapatkan Link Web App dari Administrator
                    </strong>
                    <p className="text-slate-600">
                      Minta URL Web App Google Apps Script kepada Administrator sistem. Format link biasanya berawalan:
                      <code className="mx-1 px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 font-mono text-[11px]">
                        https://script.google.com/macros/s/.../exec
                      </code>
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </span>
                  <div className="space-y-1 text-xs">
                    <strong className="text-slate-900 block font-semibold">
                      Buka Menu Database di Web App
                    </strong>
                    <p className="text-slate-600">
                      Klik tombol <strong>Database</strong> di pojok kanan atas layar atau klik tombol di bawah ini:
                    </p>
                    {onOpenDatabaseSync && (
                      <button
                        type="button"
                        onClick={onOpenDatabaseSync}
                        className="btn-tactile inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-800 font-semibold text-[11px] shadow-2xs hover:bg-slate-50 cursor-pointer mt-1"
                      >
                        <Database className="w-3 h-3 text-[#0071e3]" />
                        <span>Buka Menu Database Sekarang</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    3
                  </span>
                  <div className="space-y-1 text-xs">
                    <strong className="text-slate-900 block font-semibold">
                      Masukkan PIN Keamanan Admin
                    </strong>
                    <p className="text-slate-600">
                      Masukkan PIN Admin standar: <strong className="font-mono text-slate-900 bg-slate-200 px-1 rounded">311001</strong> untuk membuka akses konfigurasi. PIN ini dirancang untuk melindungi sistem dari perubahan tidak disengaja.
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    4
                  </span>
                  <div className="space-y-1 text-xs">
                    <strong className="text-slate-900 block font-semibold">
                      Tempelkan URL & Uji Koneksi
                    </strong>
                    <p className="text-slate-600">
                      Tempelkan (*paste*) URL Web App yang diperoleh dari Administrator ke dalam kolom input yang tersedia, lalu klik tombol <strong>&quot;Uji Koneksi&quot;</strong>.
                    </p>
                    <p className="text-emerald-700 font-medium pt-0.5">
                      ✓ Pastikan indikator status menampilkan tulisan hijau: <em>&quot;Terhubung ke Google Spreadsheet&quot;</em>.
                    </p>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    5
                  </span>
                  <div className="space-y-1 text-xs">
                    <strong className="text-slate-900 block font-semibold">
                      Simpan URL & Sinkronkan Master Data
                    </strong>
                    <p className="text-slate-600">
                      Klik <strong>&quot;Simpan URL & Gunakan&quot;</strong>, kemudian klik tombol <strong>&quot;Sinkronkan Master Data&quot;</strong> untuk memperbarui daftar pegawai terbaru, standar tarif SBM PMK, dan nomor memo.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Setup Selesai:</strong> Setelah langkah di atas dilakukan sekali, aplikasi akan otomatis mengingat koneksi ini dan Anda langsung dapat menggunakan tombol <em>&quot;Simpan ke Google Sheet & Sinkronkan Rekap&quot;</em> setiap saat!
                </span>
              </div>
            </div>
          </section>

          {/* SECTION 1: GAMBARAN UMUM & FITUR */}
          <section
            id="pendahuluan"
            className="rounded-2xl bg-white border border-slate-200/80 p-6 md:p-8 shadow-xs space-y-4 scroll-mt-24"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                <BookOpen className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">1. Gambaran Umum & Fitur Utama</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Sistem Otomasi SPPD & Kalkulator Keuangan Perjalanan Dinas merupakan aplikasi web perbendaharaan khusus Inspektorat Kementerian Koordinator Bidang Pangan RI untuk mempermudah perhitungan biaya dinas, penyusunan pertanggungjawaban (SPJ), dan pencetakan dokumen resmi.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <strong className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-[#0071e3]" />
                  Kalkulasi SBM Otomatis
                </strong>
                <p className="text-[11px] text-slate-600">
                  Uang Harian dan Pagu Hotel otomatis menyesuaikan standar PMK berdasarkan provinsi dan kota tujuan yang dipilih.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <strong className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-[#0071e3]" />
                  Format Titik Ribuan Otomatis
                </strong>
                <p className="text-[11px] text-slate-600">
                  Setiap nominal yang diketikkan otomatis diberi titik ribuan (misal: <code>1.000.000</code>) agar pengguna tidak bingung menghitung angka nol.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <strong className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Printer className="w-3.5 h-3.5 text-[#0071e3]" />
                  6 Dokumen Siap Cetak
                </strong>
                <p className="text-[11px] text-slate-600">
                  Menghasilkan Kwitansi, Memorandum, Daftar Nominatif, Daftar Pengeluaran Riil, Rincian Biaya, dan SPPD Visum sekaligus.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <strong className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#0071e3]" />
                  Database Cloud Google Sheets
                </strong>
                <p className="text-[11px] text-slate-600">
                  Simpan data SPJ langsung ke Google Spreadsheet instansi dalam 1 klik dan ekspor riwayat rekap perdin ke file Excel.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 2: PARAMETER & PEJABAT */}
          <section
            id="header-parameter"
            className="rounded-2xl bg-white border border-slate-200/80 p-6 md:p-8 shadow-xs space-y-4 scroll-mt-24"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">2. Pengisian Header & Parameter Kegiatan</h3>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
              <p>Pada formulir <strong>Input & Kalkulator</strong>, lengkapi kolom-kolom berikut:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Nomor ST:</strong> Masukkan Nomor Surat Tugas (misal: <code>ST-04/INS/KP.01/01/2026</code>). Tersedia opsi nomor ST terpisah untuk Pejabat Eselon dan Staff.</li>
                <li><strong>Nomor SPBY, SPM, dan MAK:</strong> SPM default adalah <code>00073T</code> dan akun MAK standar adalah <code>524111</code> (Belanja Perjalanan Dinas Biasa).</li>
                <li><strong>Pejabat Penandatangan:</strong> Pilih nama PPK, Bendahara Pengeluaran, dan Pejabat Pelaksana ST.</li>
                <li><strong>Provinsi & Kota Tujuan:</strong> Memilih provinsi akan secara otomatis menentukan besaran tarif Uang Harian (UH) dan batas hotel sesuai SBM PMK.</li>
              </ul>
            </div>
          </section>

          {/* SECTION 3: PRESET & KOMPONEN BIAYA */}
          <section
            id="preset-komponen"
            className="rounded-2xl bg-white border border-slate-200/80 p-6 md:p-8 shadow-xs space-y-4 scroll-mt-24"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">3. Preset Cepat Skema Biaya</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Gunakan tombol preset di bawah judul untuk mengaktifkan kombinasi komponen biaya dalam satu kali klik:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                <span className="font-bold text-slate-900 block">🚗 Standar Darat PP</span>
                <p className="text-[11px] text-slate-500">Transportasi Darat PP + Uang Harian Biasa (100%).</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                <span className="font-bold text-slate-900 block">✈️ Udara + Hotel</span>
                <p className="text-[11px] text-slate-500">Tiket Pesawat/KA + Hotel + Pengeluaran Riil + UH Biasa.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                <span className="font-bold text-slate-900 block">🏢 Fullboard Meeting</span>
                <p className="text-[11px] text-slate-500">Paket Pertemuan Menginap + UH Fullboard/Halfday + Tiket.</p>
              </div>
            </div>
          </section>

          {/* SECTION 4: RINCIAN PESERTA & SBM */}
          <section
            id="rincian-biaya"
            className="rounded-2xl bg-white border border-slate-200/80 p-6 md:p-8 shadow-xs space-y-4 scroll-mt-24"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                <Calculator className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">4. Rincian Peserta & Perhitungan Biaya</h3>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <strong className="text-slate-800 font-semibold block">Pilih Pegawai dari Master:</strong>
                <p>Klik dropdown pada kolom <strong>Nama Pegawai</strong>. Data NIP, Golongan, dan Jabatan otomatis terisi dari database.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <strong className="text-slate-800 font-semibold block">Uang Harian Fleksibel (Editable):</strong>
                <p>
                  Nominal Uang Harian otomatis diambil dari SBM PMK, namun <strong>tetap dapat diedit secara bebas</strong> jika ada pemotongan uang makan. Setiap nominal yang diketikkan otomatis diformat dengan tanda titik ribuan standar Indonesia.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <strong className="text-slate-800 font-semibold block">Modal Input Khusus:</strong>
                <ul className="list-disc pl-4 space-y-1 pt-1 text-[11px]">
                  <li><strong>Tiket (Ikon Pesawat):</strong> Input No Tiket, Maskapai, Kode Booking, Fare Pergi & Pulang, dan Status Boarding Pass.</li>
                  <li><strong>Hotel (Ikon Hotel):</strong> Input Nama Hotel, No Kamar, No Folio, Malam & Tarif per malam.</li>
                  <li><strong>Pengeluaran Riil (Ikon Dolar):</strong> Tambah rincian pengeluaran tanpa kuitansi resmi sesuai PMK (tol, taksi, parkir).</li>
                  <li><strong>SPJ Tambahan (Ikon File):</strong> Sewa kendaraan, taksi bandara, reschedule tiket, kurs LN, dan pengembalian kas negara.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* SECTION 5: PRATINJAU & CETAK DOKUMEN */}
          <section
            id="cetak-dokumen"
            className="rounded-2xl bg-white border border-slate-200/80 p-6 md:p-8 shadow-xs space-y-4 scroll-mt-24"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                <Printer className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">5. Pratinjau & Pencetakan Dokumen Resmi</h3>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                Buka tab dokumen pada navigasi atas untuk melihat tampilan dokumen yang siap dicetak. Tersedia 6 format dokumen resmi:
              </p>
              <ol className="list-decimal pl-5 space-y-1 font-medium text-slate-700">
                <li><strong>Kwitansi:</strong> Format tanda bukti penerimaan lengkap dengan 4 tanda tangan.</li>
                <li><strong>Memorandum:</strong> Nota dinas laporan pertanggungjawaban kegiatan ke Pimpinan.</li>
                <li><strong>Nominatif:</strong> Tabel horizontal landscape seluruh peserta dengan font Tahoma dan border reguler 1px yang rapi.</li>
                <li><strong>Daftar Pengeluaran Riil:</strong> Pernyataan pengeluaran riil per pegawai.</li>
                <li><strong>Rincian Biaya:</strong> Lampiran rincian biaya tiket, hotel, dan uang saku perorangan.</li>
                <li><strong>Lampiran SPPD:</strong> Visum stempel keberangkatan dan kepulangan instansi tujuan.</li>
              </ol>

              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 space-y-1">
                <strong>Tips Cetak PDF Browser:</strong>
                <p className="text-[11px]">
                  Pilih kertas <strong>A4</strong>, margin <strong>None / Default</strong>, dan centang <strong>Background graphics</strong> agar border dan tabel tercetak jelas. Untuk dokumen Nominatif, pilih orientasi <strong>Landscape</strong>.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 6: SIMPAN & REKAP PERDIN */}
          <section
            id="rekap-perdin"
            className="rounded-2xl bg-white border border-slate-200/80 p-6 md:p-8 shadow-xs space-y-4 scroll-mt-24"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">6. Simpan ke Google Sheet & Rekap Perdin</h3>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                <strong className="block font-bold">Tombol All-in-One: Simpan & Sinkronkan</strong>
                <p className="text-[11px]">
                  Pada tab <strong>Rekap Perdin</strong>, klik tombol hijau <strong>&quot;Simpan ke Google Sheet & Sinkronkan Rekap&quot;</strong>. Sistem akan langsung mengunggah baris peserta ke Google Spreadsheet dan menyegarkan tabel riwayat perdin sekaligus.
                </p>
              </div>

              <p>
                Di halaman Rekap Perdin, Anda juga dapat melakukan:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Pencarian:</strong> Memfilter data berdasarkan nama pegawai, nomor ST, atau kegiatan.</li>
                <li><strong>Koreksi Data:</strong> Mengedit baris tertentu lewat modal editor jika ada perubahan data.</li>
                <li><strong>Ekspor Excel:</strong> Mengunduh seluruh arsip data ke file <code>.xlsx</code>.</li>
              </ul>
            </div>
          </section>

          {/* SECTION 7: TANYA JAWAB (FAQ) */}
          <section
            id="faq"
            className="rounded-2xl bg-white border border-slate-200/80 p-6 md:p-8 shadow-xs space-y-4 scroll-mt-24"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                <HelpCircle className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">7. Tanya Jawab (FAQ)</h3>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <strong className="text-slate-900 block font-semibold">
                  Q: Apakah saya harus memasukkan link Apps Script setiap kali membuka web app?
                </strong>
                <p>
                  <strong>Tidak.</strong> Aplikasi sudah menyimpan URL koneksi secara permanen di server maupun peramban Anda. Anda dapat langsung menggunakan aplikasi tanpa perlu memasukkan link kembali.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <strong className="text-slate-900 block font-semibold">
                  Q: Bagaimana jika Uang Harian dipotong karena disediakan konsumsi panitia?
                </strong>
                <p>
                  Cukup klik pada nominal Uang Harian baris pegawai tersebut di tabel, lalu ketik angka yang telah disesuaikan. Sistem langsung memformat angka dengan titik ribuan secara otomatis dan memperbarui grand total.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <strong className="text-slate-900 block font-semibold">
                  Q: Siapa yang berhak membuka menu Database (PIN Admin)?
                </strong>
                <p>
                  Menu Database dilindungi PIN <code>311001</code> khusus untuk Administrator jika ada pemindahan spreadsheet atau update script. Pengguna sehari-hari tidak perlu membuka menu ini.
                </p>
              </div>
            </div>
          </section>

          {/* Quick Navigation Footer inside Manual Book */}
          {onNavigateToTab && (
            <div className="rounded-2xl bg-slate-100 border border-slate-200 p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-700 font-medium text-center sm:text-left">
                Siap membuat perhitungan perjalanan dinas atau mengecek arsip SPJ?
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigateToTab("input")}
                  className="btn-tactile inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  <span>Mulai Input Data</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateToTab("rekap")}
                  className="btn-tactile inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold border border-slate-300 shadow-2xs cursor-pointer"
                >
                  <span>Buka Rekap Perdin</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
