"use client";

import React from "react";
import Image from "next/image";
import {
  FileText,
  Calculator,
  Receipt,
  FileSpreadsheet,
  ListOrdered,
  FileCheck,
  Printer,
  Plus,
  PanelLeft,
  Home as HomeIcon,
  FolderKanban,
  ArrowRight,
} from "lucide-react";
import { SpjDocType } from "@/lib/types";
import { getSpjTypeMeta } from "@/lib/pengadaanHelper";

export type ActiveTab =
  | "beranda"
  | "input"
  | "kegiatan"
  | "kwitansi"
  | "memorandum"
  | "nominatif"
  | "rincian"
  | "riil"
  | "spd"
  | "rekap"
  | "panduan"
  | "monitoring"
  | "daftar-memo";

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onPrint: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  onCreateNewKegiatan?: () => void;
  currentLoadedId?: string | null;
  isSaved?: boolean;
  hasChanges?: boolean;
  participantCount: number;
  totalExpenditure: number;
  spjType?: SpjDocType;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onPrint,
  onToggleSidebar,
  isSidebarOpen = false,
  onCreateNewKegiatan,
  currentLoadedId,
  hasChanges = false,
  participantCount,
  totalExpenditure,
  spjType = "PERDIN",
}) => {
  const isPengadaan = spjType !== "PERDIN";
  const spjMeta = getSpjTypeMeta(spjType);
  const isBeranda = activeTab === "beranda";

  // Main Course Tabs
  const mainTabs = isPengadaan
    ? [
        { id: "beranda", label: "Beranda", icon: HomeIcon },
        { id: "input", label: "Input & Kalkulator", icon: Calculator },
        { id: "kwitansi", label: "1. Kuitansi SPJ", icon: Receipt },
        { id: "memorandum", label: "2. Memorandum", icon: FileText },
        { id: "nominatif", label: "3. Daftar Nominatif", icon: FileSpreadsheet },
      ]
    : [
        { id: "beranda", label: "Beranda", icon: HomeIcon },
        { id: "input", label: "Input & Kalkulator", icon: Calculator },
        { id: "kwitansi", label: "1. Kwitansi", icon: Receipt },
        { id: "memorandum", label: "2. Memorandum", icon: FileText },
        { id: "nominatif", label: "3. Nominatif", icon: FileSpreadsheet },
        { id: "rincian", label: "4. Rincian Biaya", icon: ListOrdered },
        { id: "riil", label: "5. Biaya Riil", icon: FileCheck },
        { id: "spd", label: "6. SPPD Depan", icon: FileText },
      ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-xl border-b border-slate-200/70 no-print transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Tier 1: Brand & Top Utilities */}
        <div
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 ${
            isBeranda ? "" : "border-b border-slate-100"
          }`}
        >
          {/* Brand Identity with Sidebar Toggle */}
          <div className="flex items-center gap-2.5">
            {onToggleSidebar && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className={`btn-tactile p-2 rounded-xl text-slate-700 hover:text-slate-900 border transition-all cursor-pointer shadow-2xs ${
                  isSidebarOpen
                    ? "bg-slate-900 text-white border-slate-900 hover:bg-black"
                    : "bg-white hover:bg-slate-50 border-slate-200/90"
                }`}
                title="Buka / Tutup Menu Navigasi"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab("beranda")}
              className="relative w-8 h-8 rounded-xl bg-slate-50 p-1 flex items-center justify-center border border-slate-200/80 shadow-2xs overflow-hidden shrink-0 cursor-pointer hover:bg-slate-100 transition-colors"
              title="Kembali ke Beranda Go SPJ"
            >
              <Image
                src="/logo-kemenkopangan.png"
                alt="Logo Kemenko Pangan"
                width={32}
                height={32}
                className="w-full h-full object-contain"
                priority
              />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("beranda")}
                  className="text-xs md:text-sm font-bold tracking-tight text-slate-900 hover:text-[#0071e3] transition-colors cursor-pointer text-left"
                  title="Kembali ke Beranda Go SPJ"
                >
                  Go SPJ
                </button>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/80">
                  Inspektorat
                </span>
                {!isBeranda && currentLoadedId && (
                  <span
                    className={`hidden md:inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      hasChanges
                        ? "bg-amber-50 text-amber-800 border-amber-300"
                        : "bg-emerald-50 text-emerald-800 border-emerald-300"
                    }`}
                    title={hasChanges ? "Ada perubahan belum disimpan" : "Tersimpan di database"}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        hasChanges ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                      }`}
                    />
                    {currentLoadedId}
                  </span>
                )}
              </div>
              <p className="text-[10.5px] text-slate-500 font-normal">
                Kementerian Koordinator Bidang Pangan RI
              </p>
            </div>
          </div>

          {/* Right Action Group */}
          {isBeranda ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("kegiatan")}
                className="btn-tactile inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 text-xs font-medium cursor-pointer transition-all"
              >
                <FolderKanban className="w-3.5 h-3.5 text-slate-500" />
                <span>Riwayat SPJ</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("input")}
                className="btn-tactile inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer transition-all"
              >
                <span>Buka Kalkulator</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {/* Live Metrics Pill */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/90 border border-slate-200/80 text-xs shadow-2xs">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${spjMeta.badgeColor}`}>
                  {spjMeta.shortLabel}
                </span>
                <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap">
                  {participantCount} {isPengadaan ? "Item" : "Peserta"}
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0" />
                <span className="font-bold text-slate-900 font-mono text-xs whitespace-nowrap">
                  Rp {totalExpenditure.toLocaleString("id-ID")}
                </span>
              </div>

              {/* Quick Action: Buat SPJ Baru */}
              {onCreateNewKegiatan && (
                <button
                  type="button"
                  onClick={onCreateNewKegiatan}
                  className="btn-tactile flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
                  title="Mulai membuat berkas SPJ baru (reset form bersih & auto-increment ID)"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>SPJ Baru</span>
                </button>
              )}

              {/* Cetak PDF Primary Action */}
              <button
                type="button"
                onClick={onPrint}
                className="btn-tactile flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-white" />
                <span>Cetak PDF</span>
              </button>
            </div>
          )}
        </div>

        {/* Tier 2: Dedicated Main Course Navigation Tabs (Hidden on Beranda Landing Page for clean minimalism) */}
        {!isBeranda && (
          <div className="py-2 overflow-x-auto scrollbar-none flex justify-center sm:justify-start lg:justify-center">
            <nav className="inline-flex items-center gap-1 p-1 bg-slate-200/50 border border-slate-300/40 rounded-xl backdrop-blur-md max-w-full">
              {mainTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as ActiveTab)}
                    className={`btn-tactile relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? "bg-white text-slate-900 shadow-xs font-semibold border border-white"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/40 font-normal"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? "text-slate-900" : "text-slate-400"}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
