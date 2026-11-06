"use client";

import React from "react";
import { SpjDocType } from "@/lib/types";
import { SPJ_TYPE_LIST, getSpjTypeMeta } from "@/lib/pengadaanHelper";
import { ActiveTab } from "./Navbar";
import {
  Briefcase,
  UtensilsCrossed,
  Package,
  Car,
  GraduationCap,
  ArrowRight,
  FolderKanban,
  ScrollText,
  Table2,
  PieChart,
  CheckCircle2,
  Database,
  PlayCircle,
  PlusCircle,
  HelpCircle,
} from "lucide-react";

interface LandingHomeViewProps {
  currentSpjType: SpjDocType;
  currentLoadedId?: string | null;
  currentTitle?: string;
  currentTotal?: number;
  totalKegiatanCount: number;
  pegawaiCount: number;
  memoCount: number;
  sbmCount?: number;
  onSelectSpjToWork: (type: SpjDocType, createNew?: boolean) => void;
  onContinueCurrentWork: () => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenDbModal?: () => void;
}

interface ModuleDetailConfig {
  type: SpjDocType;
  icon: React.ComponentType<{ className?: string }>;
  documents: string[];
  taxRule: string;
  makCode: string;
}

const MODULE_CONFIGS: Record<SpjDocType, ModuleDetailConfig> = {
  PERDIN: {
    type: "PERDIN",
    icon: Briefcase,
    documents: [
      "1. Kwitansi Rampung",
      "2. Memorandum (3 Hal)",
      "3. Daftar Nominatif",
      "4. Rincian Biaya (7 Kol)",
      "5. Pengeluaran Riil",
      "6. SPPD Depan",
    ],
    taxRule: "Otomatisasi Tarif SBM 38 Provinsi, UH 100%/60%/40%, Hotel 30%, dan Rekap 48 Kolom",
    makCode: "MAK 524111 / 524113",
  },
  KONSUMSI: {
    type: "KONSUMSI",
    icon: UtensilsCrossed,
    documents: [
      "1. Kuitansi / Bukti Pembelian",
      "2. Memorandum (3 Hal)",
      "3. Daftar Nominatif Konsumsi",
    ],
    taxRule: "PPN Include (11/111) + Potongan PPh Pasal 23 Jasa Catering (2% dari DPP)",
    makCode: "MAK 521211",
  },
  ATK: {
    type: "ATK",
    icon: Package,
    documents: [
      "1. Kuitansi / Bukti Pembelian",
      "2. Memorandum (3 Hal)",
      "3. Daftar Nominatif Semkit & ATK",
    ],
    taxRule: "PPN Include (11/111) / Manual + Potongan PPh Pasal 22 Pembelian Barang (1,5% dari DPP)",
    makCode: "MAK 521211",
  },
  SEWA: {
    type: "SEWA",
    icon: Car,
    documents: [
      "1. Kuitansi / Bukti Pembelian",
      "2. Memorandum (3 Hal)",
      "3. Daftar Nominatif Sewa Kendaraan",
    ],
    taxRule: "Potongan PPh Pasal 23 Sewa Harta (2% ber-NPWP / 4% tanpa NPWP) + Opsi PPN",
    makCode: "MAK 522141",
  },
  DIKLAT: {
    type: "DIKLAT",
    icon: GraduationCap,
    documents: [
      "1. Kuitansi / Bukti Pembelian",
      "2. Memorandum (3 Hal)",
      "3. Daftar Nominatif Diklat",
    ],
    taxRule: "PNBP Diklat (Bebas Pajak) atau Jasa Pelatihan Swasta (PPN + PPh 23)",
    makCode: "MAK 524111",
  },
};

export const LandingHomeView: React.FC<LandingHomeViewProps> = ({
  currentSpjType,
  currentLoadedId,
  currentTitle,
  currentTotal = 0,
  totalKegiatanCount,
  pegawaiCount,
  memoCount,
  sbmCount = 38,
  onSelectSpjToWork,
  onContinueCurrentWork,
  onNavigateTab,
  onOpenDbModal,
}) => {
  const activeMeta = getSpjTypeMeta(currentSpjType);
  const perdinMeta = getSpjTypeMeta("PERDIN");
  const perdinConfig = MODULE_CONFIGS.PERDIN;
  const pengadaanTypes = SPJ_TYPE_LIST.filter((m) => m.id !== "PERDIN");

  return (
    <div className="space-y-6 pb-8">
      {/* =====================================================================
          1. WORKSPACE HEADER & ACTIVE DRAFT BAR (Calm Liquid Glass Surface)
         ===================================================================== */}
      <section className="glass-base rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <span>Inspektorat • Kementerian Koordinator Bidang Pangan RI</span>
              <span className="text-slate-300">•</span>
              <span className="font-mono text-[11px] text-slate-600">TA 2026</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Sistem Administrasi &amp; Kalkulator SPJ Keuangan
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Pilih jenis dokumen pertanggungjawaban yang ingin Anda susun. Seluruh perhitungan tarif SBM, pemotongan pajak (PPN, PPh 22, PPh 23), hingga penomoran Memorandum dan SPD terhubung secara otomatis.
            </p>
          </div>

          {/* Primary Quick-Resume Action */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onContinueCurrentWork}
              className="btn-tactile inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold shadow-xs cursor-pointer transition-all"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Lanjutkan: {activeMeta.shortLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {onOpenDbModal && (
              <button
                type="button"
                onClick={onOpenDbModal}
                className="btn-tactile inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 text-xs font-semibold cursor-pointer transition-all"
              >
                <Database className="w-3.5 h-3.5 text-slate-500" />
                <span>Sinkronisasi Cloud</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Session & Operational Metadata Bar */}
        <div className="bg-slate-50/80 border-t border-slate-200/70 px-5 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-slate-500 shrink-0">Draft Aktif:</span>
            <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-md border shrink-0 ${activeMeta.badgeColor}`}>
              {activeMeta.shortLabel}
            </span>
            <span className="font-mono font-semibold text-slate-700 shrink-0">
              {currentLoadedId || "Draft Baru"}
            </span>
            {currentTitle && (
              <span className="text-slate-600 truncate hidden md:inline">
                — {currentTitle}
              </span>
            )}
            {currentTotal > 0 && (
              <span className="font-mono font-bold text-slate-900 shrink-0 hidden sm:inline">
                (Rp {currentTotal.toLocaleString("id-ID")})
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-500 shrink-0 flex-wrap">
            <span>
              Berkas Tersimpan: <strong className="font-mono text-slate-800">{totalKegiatanCount}</strong>
            </span>
            <span className="text-slate-300">|</span>
            <span>
              Database Pegawai: <strong className="font-mono text-slate-800">{pegawaiCount}</strong>
            </span>
            <span className="text-slate-300">|</span>
            <span>
              Tarif SBM: <strong className="font-mono text-slate-800">{sbmCount} Prov</strong>
            </span>
            <span className="text-slate-300">|</span>
            <span>
              Reg. Memo: <strong className="font-mono text-slate-800">{memoCount}</strong>
            </span>
          </div>
        </div>
      </section>

      {/* =====================================================================
          2. PEMILIHAN MODUL SPJ (Primary Perdin + 4 Pengadaan Modules)
         ===================================================================== */}
      <section className="space-y-3.5">
        <div className="flex items-baseline justify-between gap-2 px-0.5">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Pilih Dokumen SPJ yang Akan Dikerjakan
            </h2>
            <p className="text-xs text-slate-500">
              Klik langsung pada modul kegiatan untuk membuka form perhitungan dan dokumen cetak
            </p>
          </div>
        </div>

        {/* 2A. PRIMARY FEATURED WORKFLOW: PERJALANAN DINAS (6 DOKUMEN) */}
        <div
          className={`glass-base rounded-2xl p-5 sm:p-6 transition-all border ${
            currentSpjType === "PERDIN"
              ? "border-[#0071e3] ring-1 ring-[#0071e3]/20"
              : "border-slate-200/80 hover:border-slate-300"
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      {perdinMeta.label}
                    </h3>
                    <span className="text-[10.5px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      {perdinConfig.makCode}
                    </span>
                    <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                      6 Dokumen Cetak
                    </span>
                    {currentSpjType === "PERDIN" && (
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        Sedang Aktif
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {perdinConfig.taxRule}
                  </p>
                </div>
              </div>

              {/* 6 Output Documents inline list */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {perdinConfig.documents.map((doc) => (
                  <span
                    key={doc}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 border border-slate-200/80"
                  >
                    {doc}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onSelectSpjToWork("PERDIN", false)}
                className={`btn-tactile inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  currentSpjType === "PERDIN"
                    ? "bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-xs"
                    : "bg-slate-900 hover:bg-slate-800 text-white"
                }`}
              >
                <span>
                  {currentSpjType === "PERDIN"
                    ? "Lanjutkan SPJ Perdin"
                    : "Buka SPJ Perjalanan Dinas"}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => onSelectSpjToWork("PERDIN", true)}
                className="btn-tactile inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200/90 text-xs font-medium cursor-pointer transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5 text-slate-400" />
                <span>Buat Perdin Baru</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2B. 4 MODUL SPJ PENGADAAN & KEGIATAN (KONSUMSI, ATK, SEWA, DIKLAT) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {pengadaanTypes.map((meta) => {
            const cfg = MODULE_CONFIGS[meta.id];
            const Icon = cfg.icon;
            const isSelected = currentSpjType === meta.id;

            return (
              <div
                key={meta.id}
                className={`glass-base rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all border ${
                  isSelected
                    ? "border-[#0071e3] ring-1 ring-[#0071e3]/20"
                    : "border-slate-200/80 hover:border-slate-300"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700 shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-slate-900">
                            {meta.label}
                          </h3>
                          {isSelected && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              Aktif
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10.5px] font-mono font-semibold text-slate-600">
                            {cfg.makCode}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-[10.5px] text-slate-500">
                            3 Dokumen (Kuitansi, Memo, Nominatif)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {cfg.taxRule}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {cfg.documents.map((doc) => (
                      <span
                        key={doc}
                        className="text-[10.5px] font-medium px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 border border-slate-200/80"
                      >
                        {doc}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectSpjToWork(meta.id, false)}
                    className={`btn-tactile flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                      isSelected
                        ? "bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-xs"
                        : "bg-slate-900 hover:bg-slate-800 text-white"
                    }`}
                  >
                    <span>
                      {isSelected
                        ? `Lanjutkan ${meta.shortLabel}`
                        : `Kerjakan ${meta.shortLabel}`}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectSpjToWork(meta.id, true)}
                    className="btn-tactile inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200/90 text-xs font-medium cursor-pointer transition-all"
                    title={`Reset & mulai berkas ${meta.label} baru`}
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-slate-400" />
                    <span>Baru</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =====================================================================
          3. MANAJEMEN DATA, BUKU KENDALI & MONITORING (Unified Surface)
         ===================================================================== */}
      <section className="space-y-2.5">
        <div className="px-0.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Buku Kendali, Rekapitulasi &amp; Referensi Anggaran
          </h2>
        </div>

        <div className="glass-base rounded-2xl border border-slate-200/80 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/70 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 overflow-hidden">
          <button
            type="button"
            onClick={() => onNavigateTab("kegiatan")}
            className="p-4 text-left hover:bg-slate-50/80 transition-colors cursor-pointer flex flex-col justify-between gap-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs group-hover:text-[#0071e3] transition-colors">
                <FolderKanban className="w-4 h-4 text-slate-500 group-hover:text-[#0071e3]" />
                <span>Daftar Kegiatan</span>
              </div>
              <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                {totalKegiatanCount}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Buka, edit kembali, atau kelola seluruh paket SPJ tersimpan
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab("daftar-memo")}
            className="p-4 text-left hover:bg-slate-50/80 transition-colors cursor-pointer flex flex-col justify-between gap-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs group-hover:text-[#0071e3] transition-colors">
                <ScrollText className="w-4 h-4 text-slate-500 group-hover:text-[#0071e3]" />
                <span>Daftar Memorandum</span>
              </div>
              <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                {memoCount}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Buku kendali nomor urut Memorandum, MAK, dan kolom biaya
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab("rekap")}
            className="p-4 text-left hover:bg-slate-50/80 transition-colors cursor-pointer flex flex-col justify-between gap-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs group-hover:text-[#0071e3] transition-colors">
                <Table2 className="w-4 h-4 text-slate-500 group-hover:text-[#0071e3]" />
                <span>Rekapitulasi SPJ</span>
              </div>
              <span className="text-[10px] font-mono font-semibold text-slate-400">
                48 Kolom
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Tabel rekapitulasi perjalanan dinas &amp; ekspor data Excel
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab("monitoring")}
            className="p-4 text-left hover:bg-slate-50/80 transition-colors cursor-pointer flex flex-col justify-between gap-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs group-hover:text-[#0071e3] transition-colors">
                <PieChart className="w-4 h-4 text-slate-500 group-hover:text-[#0071e3]" />
                <span>Monitoring DIPA</span>
              </div>
              <span className="text-[10px] font-mono font-semibold text-slate-400">
                FA 16 Segmen
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Pantau pagu, realisasi, dan sisa anggaran Inspektorat I–IV
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab("panduan")}
            className="p-4 text-left hover:bg-slate-50/80 transition-colors cursor-pointer flex flex-col justify-between gap-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs group-hover:text-[#0071e3] transition-colors">
                <HelpCircle className="w-4 h-4 text-slate-500 group-hover:text-[#0071e3]" />
                <span>Panduan Sistem</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#0071e3] transition-colors" />
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Petunjuk alur penyusunan SPJ, rumus pajak, dan pencetakan
            </p>
          </button>
        </div>
      </section>
    </div>
  );
};
