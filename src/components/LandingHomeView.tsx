"use client";

import React from "react";
import Image from "next/image";
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
  hoverCard: string;
  hoverAccent: string;
  hoverGlow: string;
}

const SPJ_SQUARE_BLOCKS: SpjSquareBlock[] = [
  {
    no: "01",
    type: "PERDIN",
    title: "Buat SPJ Perjalanan Dinas",
    subtitle: "Kwitansi, Memo, Nominatif, Rincian, Riil & SPPD",
    icon: Briefcase,
    iconBg:
      "bg-blue-50/90 dark:bg-blue-950/60 text-[#0071e3] dark:text-blue-400 border-blue-100 dark:border-blue-800/60 group-hover:bg-[#0071e3] group-hover:text-white group-hover:border-[#0071e3] dark:group-hover:bg-blue-600",
    activeRing: "border-[#0071e3] dark:border-blue-500 ring-2 ring-[#0071e3]/15 dark:ring-blue-500/25",
    hoverCard: "hover:border-blue-300/90 dark:hover:border-blue-700 hover:shadow-xl hover:shadow-blue-500/10",
    hoverAccent: "group-hover:text-[#0071e3] dark:group-hover:text-blue-400",
    hoverGlow: "from-blue-500/10 via-blue-400/5 to-transparent",
  },
  {
    no: "02",
    type: "KONSUMSI",
    title: "SPJ Konsumsi",
    subtitle: "Kuitansi, Memorandum & Nominatif",
    icon: UtensilsCrossed,
    iconBg:
      "bg-emerald-50/90 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/60 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600",
    activeRing: "border-emerald-500 ring-2 ring-emerald-500/15 dark:ring-emerald-500/25",
    hoverCard: "hover:border-emerald-300/90 dark:hover:border-emerald-700 hover:shadow-xl hover:shadow-emerald-500/10",
    hoverAccent: "group-hover:text-emerald-600 dark:group-hover:text-emerald-400",
    hoverGlow: "from-emerald-500/10 via-emerald-400/5 to-transparent",
  },
  {
    no: "03",
    type: "SEWA",
    title: "SPJ Sewa Kendaraan",
    subtitle: "Kuitansi, Memorandum & Nominatif",
    icon: Car,
    iconBg:
      "bg-violet-50/90 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-800/60 group-hover:bg-violet-600 group-hover:text-white group-hover:border-violet-600",
    activeRing: "border-violet-500 ring-2 ring-violet-500/15 dark:ring-violet-500/25",
    hoverCard: "hover:border-violet-300/90 dark:hover:border-violet-700 hover:shadow-xl hover:shadow-violet-500/10",
    hoverAccent: "group-hover:text-violet-600 dark:group-hover:text-violet-400",
    hoverGlow: "from-violet-500/10 via-violet-400/5 to-transparent",
  },
  {
    no: "04",
    type: "DIKLAT",
    title: "SPJ Narsum",
    subtitle: "Kuitansi, Memorandum & Nominatif",
    icon: Mic,
    iconBg:
      "bg-rose-50/90 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800/60 group-hover:bg-rose-600 group-hover:text-white group-hover:border-rose-600",
    activeRing: "border-rose-500 ring-2 ring-rose-500/15 dark:ring-rose-500/25",
    hoverCard: "hover:border-rose-300/90 dark:hover:border-rose-700 hover:shadow-xl hover:shadow-rose-500/10",
    hoverAccent: "group-hover:text-rose-600 dark:group-hover:text-rose-400",
    hoverGlow: "from-rose-500/10 via-rose-400/5 to-transparent",
  },
  {
    no: "05",
    type: "ATK",
    title: "SPJ ATK dan Seminar Kit",
    subtitle: "Kuitansi, Memorandum & Nominatif",
    icon: Package,
    iconBg:
      "bg-amber-50/90 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800/60 group-hover:bg-amber-600 group-hover:text-white group-hover:border-amber-600",
    activeRing: "border-amber-500 ring-2 ring-amber-500/15 dark:ring-amber-500/25",
    hoverCard: "hover:border-amber-300/90 dark:hover:border-amber-700 hover:shadow-xl hover:shadow-amber-500/10",
    hoverAccent: "group-hover:text-amber-600 dark:group-hover:text-amber-400",
    hoverGlow: "from-amber-500/10 via-amber-400/5 to-transparent",
  },
];

export const LandingHomeView: React.FC<LandingHomeViewProps> = ({
  currentSpjType,
  currentLoadedId,
  currentTitle,
  totalKegiatanCount,
  memoCount,
  onSelectSpjToWork,
  onContinueCurrentWork,
  onNavigateTab,
  onOpenDbModal,
}) => {
  const hasActiveWork = Boolean(currentLoadedId || (currentTitle && currentTitle.trim() !== ""));

  return (
    <div className="relative min-h-[calc(100vh-9rem)] flex flex-col justify-center py-8 sm:py-12 px-2 overflow-hidden">
      {/* Subtle Ambient Light Accent */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 mx-auto h-72 max-w-3xl rounded-full bg-gradient-to-b from-blue-100/45 via-slate-100/20 to-transparent blur-3xl dark:from-blue-950/25 dark:via-slate-900/10"
      />

      <div className="max-w-6xl w-full mx-auto space-y-10 sm:space-y-12">
        {/* =====================================================================
            1. HERO GREETING WITH OFFICIAL LOGO (Clean, Minimal Text)
           ===================================================================== */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="mx-auto w-16 h-16 sm:w-[74px] sm:h-[74px] rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 shadow-sm p-2.5 flex items-center justify-center">
            <Image
              src="/logo-kemenkopangan.png"
              alt="Logo Kementerian Koordinator Bidang Pangan RI"
              width={64}
              height={64}
              priority
              className="w-full h-full object-contain"
            />
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 tracking-wide">
              Inspektorat · Kementerian Koordinator Bidang Pangan RI
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              Go <span className="text-[#0071e3] dark:text-blue-400">SPJ</span>
            </h1>
          </div>
        </div>

        {/* =====================================================================
            2. FIVE SQUARE BLOCKS (Hover Multi-Color Interactive Cards)
           ===================================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5">
          {SPJ_SQUARE_BLOCKS.map((block) => {
            const Icon = block.icon;
            const isSelected = currentSpjType === block.type;

            return (
              <button
                key={block.type}
                type="button"
                onClick={() => onSelectSpjToWork(block.type, true)}
                className={`group relative overflow-hidden sm:aspect-square min-h-[205px] rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-6 flex flex-col justify-between text-left border transition-all duration-200 hover:-translate-y-1.5 cursor-pointer ${
                  isSelected
                    ? `${block.activeRing} shadow-md`
                    : `border-slate-200/85 dark:border-slate-800 shadow-xs ${block.hoverCard}`
                }`}
              >
                {/* Hover Colored Corner Wash */}
                <div
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${block.hoverGlow} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                />

                {/* Top Row: Icon & Number */}
                <div className="relative flex items-start justify-between w-full">
                  <div
                    className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all duration-200 group-hover:scale-105 ${block.iconBg}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <span
                    className={`font-mono text-xs font-bold text-slate-300 dark:text-slate-600 transition-colors ${block.hoverAccent}`}
                  >
                    {block.no}
                  </span>
                </div>

                {/* Bottom Row: Title & Subtitle */}
                <div className="relative space-y-1.5 pt-4">
                  <div className="flex items-end justify-between gap-2">
                    <h2
                      className={`text-base font-bold text-slate-900 dark:text-slate-100 leading-snug transition-colors ${block.hoverAccent}`}
                    >
                      {block.title}
                    </h2>
                    <ArrowUpRight
                      className={`w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 mb-0.5 ${block.hoverAccent}`}
                    />
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
            3. ACTIVE DRAFT RESUME LINK (Only shown when a draft/edit is open)
           ===================================================================== */}
        {hasActiveWork && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={onContinueCurrentWork}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/90 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 shadow-2xs cursor-pointer transition-all"
            >
              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
              <span>
                Lanjutkan SPJ aktif:{" "}
                <strong className="font-mono text-slate-900 dark:text-slate-100">
                  {currentLoadedId || "Draft"}
                </strong>
                {currentTitle ? ` — ${currentTitle.slice(0, 48)}${currentTitle.length > 48 ? "…" : ""}` : ""}
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#0071e3] dark:text-blue-400 shrink-0" />
            </button>
          </div>
        )}

        {/* =====================================================================
            4. MINIMALIST SECONDARY NAVIGATION PILLS
           ===================================================================== */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-2">
          <button
            type="button"
            onClick={() => onNavigateTab("kegiatan")}
            className="group btn-tactile inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200/90 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 text-xs font-medium shadow-2xs hover:shadow-sm hover:-translate-y-0.5 cursor-pointer transition-all"
          >
            <FolderKanban className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-[#0071e3] transition-colors" />
            <span>Daftar Kegiatan ({totalKegiatanCount})</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab("daftar-memo")}
            className="group btn-tactile inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200/90 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800 text-xs font-medium shadow-2xs hover:shadow-sm hover:-translate-y-0.5 cursor-pointer transition-all"
          >
            <ScrollText className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 transition-colors" />
            <span>Daftar Memorandum ({memoCount})</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab("rekap")}
            className="group btn-tactile inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200/90 dark:border-slate-800 hover:border-violet-200 dark:hover:border-violet-800 text-xs font-medium shadow-2xs hover:shadow-sm hover:-translate-y-0.5 cursor-pointer transition-all"
          >
            <Table2 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-violet-600 transition-colors" />
            <span>Rekap Perdin</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab("monitoring")}
            className="group btn-tactile inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200/90 dark:border-slate-800 hover:border-amber-200 dark:hover:border-amber-800 text-xs font-medium shadow-2xs hover:shadow-sm hover:-translate-y-0.5 cursor-pointer transition-all"
          >
            <PieChart className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-amber-600 transition-colors" />
            <span>Monitoring Anggaran</span>
          </button>

          {onOpenDbModal && (
            <button
              type="button"
              onClick={onOpenDbModal}
              className="group btn-tactile inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200/90 dark:border-slate-800 hover:border-sky-200 dark:hover:border-sky-800 text-xs font-medium shadow-2xs hover:shadow-sm hover:-translate-y-0.5 cursor-pointer transition-all"
            >
              <Database className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-sky-600 transition-colors" />
              <span>Database Cloud</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
