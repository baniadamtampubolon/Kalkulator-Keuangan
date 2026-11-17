"use client";

import React from "react";
import { SpjDocType } from "@/lib/types";
import { ActiveTab } from "./Navbar";
import {
  Briefcase,
  UtensilsCrossed,
  Car,
  Mic,
  Package,
  ArrowUpRight,
  FolderKanban,
  ScrollText,
  Table2,
  PieChart,
  Database,
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

interface SpjSquareBlock {
  no: string;
  type: SpjDocType;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  activeRing: string;
}

const SPJ_SQUARE_BLOCKS: SpjSquareBlock[] = [
  {
    no: "01",
    type: "PERDIN",
    title: "Buat SPJ Perjalanan Dinas",
    subtitle: "Kwitansi, Memo, Nominatif, Rincian, Riil & SPPD",
    icon: Briefcase,
    iconBg: "bg-blue-50 dark:bg-blue-950/60 text-[#0071e3] dark:text-blue-400 border-blue-100 dark:border-blue-800/60 group-hover:bg-[#0071e3] group-hover:text-white dark:group-hover:bg-blue-600",
    activeRing: "border-[#0071e3] dark:border-blue-500 ring-2 ring-[#0071e3]/15 dark:ring-blue-500/25",
  },
  {
    no: "02",
    type: "KONSUMSI",
    title: "SPJ Konsumsi",
    subtitle: "Kuitansi, Memorandum & Nominatif Konsumsi",
    icon: UtensilsCrossed,
    iconBg: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/60 group-hover:bg-emerald-600 group-hover:text-white",
    activeRing: "border-emerald-500 ring-2 ring-emerald-500/15 dark:ring-emerald-500/25",
  },
  {
    no: "03",
    type: "SEWA",
    title: "SPJ Sewa Kendaraan",
    subtitle: "Kuitansi, Memorandum & Nominatif Sewa Mobil",
    icon: Car,
    iconBg: "bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-800/60 group-hover:bg-violet-600 group-hover:text-white",
    activeRing: "border-violet-500 ring-2 ring-violet-500/15 dark:ring-violet-500/25",
  },
  {
    no: "04",
    type: "DIKLAT",
    title: "SPJ Narsum",
    subtitle: "Kuitansi, Memorandum & Nominatif Narasumber",
    icon: Mic,
    iconBg: "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800/60 group-hover:bg-rose-600 group-hover:text-white",
    activeRing: "border-rose-500 ring-2 ring-rose-500/15 dark:ring-rose-500/25",
  },
  {
    no: "05",
    type: "ATK",
    title: "SPJ ATK dan Seminar Kit",
    subtitle: "Kuitansi, Memorandum & Nominatif ATK / Semkit",
    icon: Package,
    iconBg: "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800/60 group-hover:bg-amber-600 group-hover:text-white",
    activeRing: "border-amber-500 ring-2 ring-amber-500/15 dark:ring-amber-500/25",
  },
];

export const LandingHomeView: React.FC<LandingHomeViewProps> = ({
  currentSpjType,
  totalKegiatanCount,
  memoCount,
  onSelectSpjToWork,
  onNavigateTab,
  onOpenDbModal,
}) => {
  return (
    <div className="min-h-[calc(100vh-9rem)] flex flex-col justify-center py-8 sm:py-12 px-2">
      <div className="max-w-6xl w-full mx-auto space-y-10 sm:space-y-12">
        {/* =====================================================================
            1. HERO GREETING (Clean, Minimalist, Modern Landing Page)
           ===================================================================== */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs text-xs font-medium text-slate-600 dark:text-slate-300">
            <span className="w-2 h-2 rounded-full bg-[#0071e3] dark:bg-blue-400" />
            <span>Inspektorat • Kementerian Koordinator Bidang Pangan RI</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            Selamat Datang di <span className="text-[#0071e3] dark:text-blue-400">Go SPJ</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
            Sistem pembuat dokumen perjalanan dinas dan pertanggungjawaban keuangan digital. Pilih jenis SPJ di bawah ini untuk mulai menyusun berkas secara otomatis, cepat, dan presisi.
          </p>
        </div>

        {/* =====================================================================
            2. FIVE SQUARE BLOCKS (5 Blok Shape Kotak Minimalis)
           ===================================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5">
          {SPJ_SQUARE_BLOCKS.map((block) => {
            const Icon = block.icon;
            const isSelected = currentSpjType === block.type;

            return (
              <button
                key={block.type}
                type="button"
                onClick={() => onSelectSpjToWork(block.type, false)}
                className={`group relative sm:aspect-square min-h-[200px] rounded-3xl bg-white/90 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-800/95 backdrop-blur-xl p-6 flex flex-col justify-between text-left border transition-all duration-200 hover:-translate-y-1.5 hover:shadow-xl dark:hover:shadow-black/40 cursor-pointer ${
                  isSelected
                    ? `${block.activeRing} shadow-md`
                    : "border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs"
                }`}
              >
                {/* Top Row: Icon & Number */}
                <div className="flex items-start justify-between w-full">
                  <div
                    className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-colors duration-200 ${block.iconBg}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <span className="font-mono text-xs font-bold text-slate-300 dark:text-slate-600 group-hover:text-slate-400 dark:group-hover:text-slate-400 transition-colors">
                    {block.no}
                  </span>
                </div>

                {/* Bottom Row: Title & Subtitle */}
                <div className="space-y-1.5 pt-4">
                  <div className="flex items-end justify-between gap-2">
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug group-hover:text-[#0071e3] dark:group-hover:text-blue-400 transition-colors">
                      {block.title}
                    </h2>
                    <ArrowUpRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-[#0071e3] dark:group-hover:text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 mb-0.5" />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                    {block.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* =====================================================================
            3. MINIMALIST SECONDARY NAVIGATION PILLS
           ===================================================================== */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-2">
          <button
            type="button"
            onClick={() => onNavigateTab("kegiatan")}
            className="btn-tactile inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-800 text-xs font-medium shadow-2xs cursor-pointer transition-all"
          >
            <FolderKanban className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>Daftar Kegiatan ({totalKegiatanCount})</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab("daftar-memo")}
            className="btn-tactile inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-800 text-xs font-medium shadow-2xs cursor-pointer transition-all"
          >
            <ScrollText className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>Daftar Memorandum ({memoCount})</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab("rekap")}
            className="btn-tactile inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-800 text-xs font-medium shadow-2xs cursor-pointer transition-all"
          >
            <Table2 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>Rekap Perdin</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab("monitoring")}
            className="btn-tactile inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-800 text-xs font-medium shadow-2xs cursor-pointer transition-all"
          >
            <PieChart className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>Monitoring Anggaran</span>
          </button>

          {onOpenDbModal && (
            <button
              type="button"
              onClick={onOpenDbModal}
              className="btn-tactile inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-800 text-xs font-medium shadow-2xs cursor-pointer transition-all"
            >
              <Database className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span>Database Cloud</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
