"use client";

import React from "react";
import Image from "next/image";
import { SpjDocType } from "@/lib/types";
import { ActiveTab } from "./Navbar";
import {
  Briefcase,
  Utensils,
  PackageCheck,
  Car,
  GraduationCap,
  ArrowRight,
  FileText,
  Receipt,
  FileSpreadsheet,
  FolderKanban,
  BookmarkCheck,
  TrendingUp,
  Table2,
  BookOpen,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Play,
} from "lucide-react";

interface LandingHomeViewProps {
  currentSpjType: SpjDocType;
  currentLoadedId?: string | null;
  currentTitle?: string;
  currentTotal?: number;
  totalKegiatanCount: number;
  memoCount: number;
  pegawaiCount: number;
  onSelectSpjToWork: (type: SpjDocType) => void;
  onContinueCurrentWork: () => void;
  onNavigateTab: (tab: ActiveTab) => void;
}

interface SpjCardOption {
  id: SpjDocType;
  title: string;
  subtitle: string;
  makBadge: string;
  docCountBadge: string;
  description: string;
  taxHighlight: string;
  documents: string[];
  icon: React.ComponentType<{ className?: string }>;
  accentBg: string;
  accentText: string;
  accentBorder: string;
  buttonBg: string;
  featured?: boolean;
}

const SPJ_CARDS: SpjCardOption[] = [
  {
    id: "PERDIN",
    title: "SPJ Perjalanan Dinas (Perdin)",
    subtitle: "Dalam Kota (Jabodetabekdung), Luar Kota & Multi-Provinsi",
    makBadge: "MAK 524111 / 524113",
    docCountBadge: "6 Dokumen Otomatis",
    description:
      "Kalkulator otomatis Uang Harian (SBM 38 Provinsi), Transportasi Darat/Lokal, Hotel, Tiket Pesawat/Kereta, Representatif, hingga Honorarium Narasumber.",
    taxHighlight: "Otomatis mengikuti tarif SBM Kemenkeu terbaru",
    documents: [
      "1. Kwitansi Perdin",
      "2. Memorandum (3 Hal)",
      "3. Daftar Nominatif",
      "4. Rincian Biaya 7 Kolom",
      "5. Daftar Pengeluaran Riil",
      "6. SPPD Lembar Depan",
    ],
    icon: Briefcase,
    accentBg: "bg-blue-50",
    accentText: "text-blue-700",
    accentBorder: "border-blue-200",
    buttonBg: "bg-[#0071e3] hover:bg-[#0077ed]",
    featured: true,
  },
  {
    id: "KONSUMSI",
    title: "SPJ Konsumsi Rapat",
    subtitle: "Makan Siang & Snack Rapat Koordinasi / Pengawasan",
    makBadge: "MAK 521211",
    docCountBadge: "3 Dokumen + Pajak",
    description:
      "Penyusunan SPJ belanja konsumsi rapat (Makan Siang, Snack Pagi/Sore) lengkap dengan kalkulasi otomatis PPN & potongan PPh sesuai jenis penyedia.",
    taxHighlight: "Otomatis PPN Include (11/111) & PPh 23 (2%) / PPh 22 (1,5%)",
    documents: [
      "1. Kuitansi Konsumsi",
      "2. Memorandum (3 Halaman)",
      "3. Daftar Nominatif Konsumsi",
    ],
    icon: Utensils,
    accentBg: "bg-emerald-50",
    accentText: "text-emerald-700",
    accentBorder: "border-emerald-200",
    buttonBg: "bg-emerald-600 hover:bg-emerald-700",
  },
  {
    id: "ATK",
    title: "SPJ Seminar Kit & ATK",
    subtitle: "Belanja Bahan, Alat Tulis Kantor & Perlengkapan Kegiatan",
    makBadge: "MAK 521211",
    docCountBadge: "3 Dokumen + Pajak",
    description:
      "Penyusunan SPJ pembelian ATK (kertas, amplop, alat tulis, bahan komputer) dan Seminar Kit dengan perhitungan otomatis DPP, PPN, dan PPh Pasal 22.",
    taxHighlight: "Otomatis PPN Include (11/111) & Potongan PPh 22 (1,5%)",
    documents: [
      "1. Kuitansi Semkit & ATK",
      "2. Memorandum (3 Halaman)",
      "3. Daftar Nominatif Semkit & ATK",
    ],
    icon: PackageCheck,
    accentBg: "bg-amber-50",
    accentText: "text-amber-800",
    accentBorder: "border-amber-200",
    buttonBg: "bg-amber-600 hover:bg-amber-700",
  },
  {
    id: "SEWA",
    title: "SPJ Sewa Kendaraan",
    subtitle: "Sewa Mobil / Kendaraan Operasional Kegiatan",
    makBadge: "MAK 522141",
    docCountBadge: "3 Dokumen + Pajak",
    description:
      "Penyusunan SPJ belanja sewa kendaraan operasional per hari/unit lengkap dengan perhitungan otomatis potongan PPh Pasal 23 atas jasa sewa.",
    taxHighlight: "Otomatis PPh 23 Sewa: 2% (Ada NPWP) atau 4% (Tanpa NPWP)",
    documents: [
      "1. Kuitansi Sewa Mobil",
      "2. Memorandum (3 Halaman)",
      "3. Daftar Nominatif Sewa Mobil",
    ],
    icon: Car,
    accentBg: "bg-violet-50",
    accentText: "text-violet-700",
    accentBorder: "border-violet-200",
    buttonBg: "bg-violet-600 hover:bg-violet-700",
  },
  {
    id: "DIKLAT",
    title: "SPJ Diklat / Pelatihan",
    subtitle: "PNBP Diklat, Sertifikasi & Peningkatan Kapabilitas APIP",
    makBadge: "MAK 524111 / 522191",
    docCountBadge: "3 Dokumen Siap Cetak",
    description:
      "Penyusunan SPJ biaya kontribusi / PNBP pendidikan dan pelatihan teknis, sertifikasi auditor, serta bimbingan teknis peningkatan kapabilitas APIP.",
    taxHighlight: "Default Tanpa Pajak (0%) untuk PNBP Instansi atau Opsi PPh 23",
    documents: [
      "1. Kuitansi Diklat",
      "2. Memorandum (3 Halaman)",
      "3. Daftar Nominatif Diklat",
    ],
    icon: GraduationCap,
    accentBg: "bg-rose-50",
    accentText: "text-rose-700",
    accentBorder: "border-rose-200",
    buttonBg: "bg-rose-600 hover:bg-rose-700",
  },
];

export const LandingHomeView: React.FC<LandingHomeViewProps> = ({
  currentSpjType,
  currentLoadedId,
  currentTitle,
  currentTotal = 0,
  totalKegiatanCount,
  memoCount,
  pegawaiCount,
  onSelectSpjToWork,
  onContinueCurrentWork,
  onNavigateTab,
}) => {
  const featuredPerdin = SPJ_CARDS[0];
  const pengadaanCards = SPJ_CARDS.slice(1);

  return (
    <div className="space-y-8 pb-6 animate-fade-in">
      {/* =====================================================================
          1. HERO BANNER: TENTANG APLIKASI & RINGKASAN EKSEKUTIF
         ===================================================================== */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 text-white p-6 sm:p-8 lg:p-10 shadow-xl border border-slate-800">
        {/* Decorative Subtle Glow */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-xs font-semibold text-blue-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Inspektorat • Kementerian Koordinator Bidang Pangan RI • TA 2026</span>
            </div>

            <div className="flex items-start gap-4">
              <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-white p-2 items-center justify-center shadow-md shrink-0 mt-1">
                <Image
                  src="/logo-kemenkopangan.png"
                  alt="Logo Kemenko Pangan"
                  width={48}
                  height={48}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="space-y-2">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white leading-tight">
                  Sistem Pembuatan SPJ &amp; Kalkulator Keuangan Terpadu
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Platform digital pembuatan dokumen Surat Pertanggungjawaban (SPJ) Inspektorat secara cepat, akurat, dan seragam. Mendukung <strong>Perjalanan Dinas</strong>, <strong>Konsumsi</strong>, <strong>Semkit &amp; ATK</strong>, <strong>Sewa Kendaraan</strong>, dan <strong>Diklat</strong> lengkap dengan Kuitansi, Memorandum 3 Halaman, Daftar Nominatif, serta Monitoring Anggaran 16 Segmen.
                </p>
              </div>
            </div>
          </div>

          {/* Live System Counters */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigateTab("kegiatan")}
              className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 backdrop-blur-md text-left transition-all cursor-pointer"
            >
              <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-300 block">
                Berkas SPJ
              </span>
              <span className="text-xl sm:text-2xl font-mono font-extrabold text-white mt-0.5 block">
                {totalKegiatanCount}
              </span>
              <span className="text-[10px] text-emerald-300 font-medium">
                Tersimpan
              </span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab("daftar-memo")}
              className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 backdrop-blur-md text-left transition-all cursor-pointer"
            >
              <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-300 block">
                Nomor Memo
              </span>
              <span className="text-xl sm:text-2xl font-mono font-extrabold text-white mt-0.5 block">
                {memoCount}
              </span>
              <span className="text-[10px] text-blue-300 font-medium">
                Terdaftar
              </span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab("monitoring")}
              className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 backdrop-blur-md text-left transition-all cursor-pointer"
            >
              <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-300 block">
                Database SDM
              </span>
              <span className="text-xl sm:text-2xl font-mono font-extrabold text-white mt-0.5 block">
                {pegawaiCount}
              </span>
              <span className="text-[10px] text-amber-300 font-medium">
                Pegawai Aktif
              </span>
            </button>
          </div>
        </div>

        {/* Active Session Resume Bar (If user has an active session/draft) */}
        {(currentLoadedId || (currentTitle && currentTitle.trim() !== "") || currentTotal > 0) && (
          <div className="relative z-10 mt-6 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs text-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span>
                Sesi Aktif:{" "}
                <strong className="text-white font-mono">
                  {currentLoadedId || "Draft SPJ"}
                </strong>{" "}
                —{" "}
                <span className="text-slate-300">
                  {currentTitle || `Mode ${currentSpjType}`}
                </span>{" "}
                <span className="font-mono font-bold text-emerald-300 ml-1">
                  (Rp {currentTotal.toLocaleString("id-ID")})
                </span>
              </span>
            </div>

            <button
              type="button"
              onClick={onContinueCurrentWork}
              className="btn-tactile inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-slate-900 hover:bg-blue-50 text-xs font-bold shadow-sm cursor-pointer transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-slate-900" />
              <span>Lanjutkan Pengerjaan Saat Ini</span>
            </button>
          </div>
        )}
      </section>

      {/* =====================================================================
          2. PEMILIHAN JENIS SPJ YANG INGIN DIKERJAKAN
         ===================================================================== */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 px-1">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Mulai Penyusunan Dokumen</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              Pilih Jenis SPJ yang Ingin Anda Kerjakan
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Klik salah satu kartu di bawah untuk membuka kalkulator &amp; generator dokumen SPJ terkait
          </p>
        </div>

        {/* Featured Card 1: SPJ Perjalanan Dinas (Full Width Highlight) */}
        <div className="bg-white rounded-3xl border-2 border-blue-200/90 hover:border-blue-400 shadow-sm hover:shadow-md p-5 sm:p-6 transition-all">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <div className={`p-2.5 rounded-2xl ${featuredPerdin.accentBg} ${featuredPerdin.accentText} border ${featuredPerdin.accentBorder}`}>
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                      {featuredPerdin.title}
                    </h3>
                    <span className="text-[10.5px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {featuredPerdin.makBadge}
                    </span>
                    <span className="text-[10.5px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {featuredPerdin.docCountBadge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {featuredPerdin.subtitle}
                  </p>
                </div>
              </div>

              <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed">
                {featuredPerdin.description}
              </p>

              {/* 6 Output Documents Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {featuredPerdin.documents.map((doc) => (
                  <span
                    key={doc}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 border border-slate-200/90"
                  >
                    <CheckCircle2 className="w-3 h-3 text-blue-600 shrink-0" />
                    <span>{doc}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-between gap-3 shrink-0 lg:w-64 lg:border-l lg:border-slate-100 lg:pl-6">
              <div className="text-left lg:text-right space-y-0.5">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block">
                  Standar Biaya
                </span>
                <span className="text-xs font-semibold text-slate-700 block">
                  {featuredPerdin.taxHighlight}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onSelectSpjToWork("PERDIN")}
                className={`btn-tactile w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl ${featuredPerdin.buttonBg} text-white text-xs sm:text-sm font-bold shadow-sm cursor-pointer transition-all`}
              >
                <span>Kerjakan SPJ Perdin</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Grid 4 Kartu Jenis SPJ Baru (Konsumsi, Semkit & ATK, Sewa Kendaraan, Diklat) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pengadaanCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                className="bg-white rounded-3xl border border-slate-200/90 hover:border-slate-300 shadow-2xs hover:shadow-md p-5 sm:p-6 flex flex-col justify-between gap-5 transition-all"
              >
                <div className="space-y-3">
                  {/* Top Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2.5 rounded-2xl ${card.accentBg} ${card.accentText} border ${card.accentBorder} shrink-0`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900">
                          {card.title}
                        </h3>
                        <p className="text-[11.5px] text-slate-500 font-medium">
                          {card.subtitle}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${card.accentBg} ${card.accentText} ${card.accentBorder}`}
                    >
                      {card.makBadge}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {card.description}
                  </p>

                  {/* Formula & Tax Highlight */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-[11px] font-medium text-slate-700 flex items-center gap-2">
                    <Receipt className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{card.taxHighlight}</span>
                  </div>

                  {/* Generated Documents */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {card.documents.map((doc) => (
                      <span
                        key={doc}
                        className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-md bg-white text-slate-700 border border-slate-200"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>{doc}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Footer CTA */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-400 font-medium">
                    Format Standar Excel 2026
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelectSpjToWork(card.id)}
                    className={`btn-tactile inline-flex items-center gap-2 px-4 py-2.5 rounded-xl ${card.buttonBg} text-white text-xs font-bold shadow-2xs cursor-pointer transition-all`}
                  >
                    <span>Pilih &amp; Kerjakan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =====================================================================
          3. MENU MANAJEMEN, BUKU KENDALI MEMORANDUM & MONITORING ANGGARAN
         ===================================================================== */}
      <section className="space-y-3 pt-2">
        <div className="px-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Manajemen Database, Buku Kendali &amp; Monitoring Anggaran
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Daftar Riwayat Kegiatan */}
          <button
            type="button"
            onClick={() => onNavigateTab("kegiatan")}
            className="btn-tactile bg-white hover:bg-slate-50/80 rounded-2xl p-4 border border-slate-200/90 shadow-2xs text-left flex flex-col justify-between gap-3 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60">
                <FolderKanban className="w-4 h-4" />
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {totalKegiatanCount} Paket
              </span>
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                Daftar Riwayat Kegiatan SPJ
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                Buka kembali, edit, atau cetak ulang seluruh berkas SPJ yang pernah disimpan.
              </p>
            </div>
          </button>

          {/* Card 2: Buku Kendali & Daftar Memorandum */}
          <button
            type="button"
            onClick={() => onNavigateTab("daftar-memo")}
            className="btn-tactile bg-white hover:bg-slate-50/80 rounded-2xl p-4 border border-slate-200/90 shadow-2xs text-left flex flex-col justify-between gap-3 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60">
                <BookmarkCheck className="w-4 h-4" />
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                {memoCount} Nomor
              </span>
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                Daftar Memorandum Terdaftar
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                Buku kendali nomor memorandum lengkap dengan perihal, akun MAK, dan kolom biaya.
              </p>
            </div>
          </button>

          {/* Card 3: Monitoring Anggaran 16 Segmen */}
          <button
            type="button"
            onClick={() => onNavigateTab("monitoring")}
            className="btn-tactile bg-white hover:bg-slate-50/80 rounded-2xl p-4 border border-slate-200/90 shadow-2xs text-left flex flex-col justify-between gap-3 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-violet-50 text-violet-600 border border-violet-200/60">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700">
                FA Detail 16 Segmen
              </span>
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-violet-600 transition-colors">
                Monitoring Realisasi Anggaran
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                Pantau Pagu, Realisasi, dan Sisa Anggaran SAKTI Inspektorat (Z28, Z29, Z30 &amp; CL.7458).
              </p>
            </div>
          </button>

          {/* Card 4: Rekap Perdin 48 Kolom & Panduan */}
          <button
            type="button"
            onClick={() => onNavigateTab("rekap")}
            className="btn-tactile bg-white hover:bg-slate-50/80 rounded-2xl p-4 border border-slate-200/90 shadow-2xs text-left flex flex-col justify-between gap-3 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60">
                <Table2 className="w-4 h-4" />
              </div>
              <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800">
                Export Excel
              </span>
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                Rekapitulasi SPJ (48 Kolom)
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                Tabel rekapitulasi induk seluruh komponen biaya perjalanan dinas siap unduh ke Excel.
              </p>
            </div>
          </button>
        </div>
      </section>
    </div>
  );
};
