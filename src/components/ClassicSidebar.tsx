"use client";

import React from "react";
import Image from "next/image";
import { ActiveTab } from "./Navbar";
import {
  Calculator,
  Receipt,
  FileText,
  FileSpreadsheet,
  ListOrdered,
  FileCheck,
  FolderKanban,
  PanelLeftClose,
  Plus,
  Cloud,
  Bookmark,
  Layers,
  TrendingUp,
  BookmarkCheck,
  Home as HomeIcon,
  ChevronDown,
} from "lucide-react";
import { SpjDocType } from "@/lib/types";
import { SPJ_TYPE_LIST } from "@/lib/pengadaanHelper";
import { REKAP_CATEGORY_LIST } from "@/lib/rekapHelper";

interface ClassicSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenDatabaseSync?: () => void;
  onCreateNewKegiatan?: () => void;
  currentLoadedId?: string | null;
  hasChanges?: boolean;
  totalKegiatanCount?: number;
  memoCount?: number;
  participantCount?: number;
  totalExpenditure?: number;
  spjType?: SpjDocType;
  onSelectSpjType?: (type: SpjDocType) => void;
  activeRekapType?: SpjDocType;
  onSelectRekapType?: (type: SpjDocType) => void;
}

export const ClassicSidebar: React.FC<ClassicSidebarProps> = ({
  isOpen,
  onToggle,
  activeTab,
  onSelectTab,
  onOpenDatabaseSync,
  onCreateNewKegiatan,
  currentLoadedId,
  hasChanges = false,
  totalKegiatanCount = 0,
  memoCount = 0,
  participantCount = 0,
  totalExpenditure = 0,
  spjType = "PERDIN",
  onSelectSpjType,
  activeRekapType = "PERDIN",
  onSelectRekapType,
}) => {
  const [mounted, setMounted] = React.useState(false);
  const [isRekapClickedOpen, setIsRekapClickedOpen] = React.useState(false);
  const [isRekapHovered, setIsRekapHovered] = React.useState(false);

  React.useEffect(() => {
    Promise.resolve().then(() => setMounted(true));
  }, []);

  const isRekapSubmenuOpen = isRekapClickedOpen || isRekapHovered || activeTab === "rekap";

  const isPengadaan = spjType !== "PERDIN";

  // Main Course: Documents of current SPJ
  const docTabs = isPengadaan
    ? [
        { id: "beranda", label: "Beranda (Pilih Jenis SPJ)", icon: HomeIcon },
        { id: "input", label: "Input & Kalkulator", icon: Calculator },
        { id: "kwitansi", label: "1. Kuitansi SPJ", icon: Receipt },
        { id: "memorandum", label: "2. Memorandum", icon: FileText },
        { id: "nominatif", label: "3. Daftar Nominatif", icon: FileSpreadsheet },
      ]
    : [
        { id: "beranda", label: "Beranda (Pilih Jenis SPJ)", icon: HomeIcon },
        { id: "input", label: "Input & Kalkulator", icon: Calculator },
        { id: "kwitansi", label: "1. Kwitansi SPJ", icon: Receipt },
        { id: "memorandum", label: "2. Memorandum", icon: FileText },
        { id: "nominatif", label: "3. Daftar Nominatif", icon: FileSpreadsheet },
        { id: "rincian", label: "4. Rincian Biaya 7 Kolom", icon: ListOrdered },
        { id: "riil", label: "5. Daftar Pengeluaran Riil", icon: FileCheck },
        { id: "spd", label: "6. SPPD Depan", icon: FileText },
      ];

  return (
    <>
      {/* Mobile Backdrop Overlay (< lg) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300 no-print"
          onClick={onToggle}
        />
      )}

      {/* Classic macOS Left Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen bg-[#f5f5f7]/95 dark:bg-slate-900/95 backdrop-blur-2xl border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-between transition-all duration-300 ease-in-out no-print select-none ${
          isOpen
            ? "w-64 sm:w-72 translate-x-0 shadow-2xl lg:shadow-none shrink-0"
            : "-translate-x-full lg:translate-x-0 lg:w-0 lg:border-r-0 overflow-hidden"
        }`}
      >
        {/* Top Header & Navigation Items */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3.5 space-y-4">
          {/* Top Bar: macOS Window & Brand Info */}
          <div className="flex items-center justify-between px-1.5 pb-2.5 border-b border-slate-200/70 dark:border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative w-7 h-7 rounded-lg bg-white dark:bg-slate-800 p-0.5 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0">
                <Image
                  src="/logo-kemenkopangan.png"
                  alt="Logo Kemenko Pangan"
                  width={28}
                  height={28}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <h2 className="text-xs font-bold text-slate-900 dark:text-white truncate tracking-tight">
                  Kalkulator SPPD
                </h2>
                <p className="text-[10px] text-slate-500 truncate">
                  Inspektorat RI
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onToggle}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-all cursor-pointer"
              title="Tutup Sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          {/* Action: Buat SPJ Baru (macOS style primary action) */}
          {onCreateNewKegiatan && (
            <div className="px-1">
              <button
                type="button"
                onClick={onCreateNewKegiatan}
                className="btn-tactile w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs cursor-pointer transition-all"
                title="Mulai membuat berkas SPJ baru (reset & auto ID)"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Buat SPJ Baru</span>
              </button>
            </div>
          )}

          {/* Section 0: PILIH JENIS SPJ */}
          {onSelectSpjType && (
            <div className="space-y-1 px-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1 block">
                Jenis Dokumen SPJ
              </span>
              <select
                value={spjType}
                onChange={(e) => onSelectSpjType(e.target.value as SpjDocType)}
                className="input-clean w-full h-8 px-2.5 text-xs font-bold bg-white cursor-pointer"
              >
                {SPJ_TYPE_LIST.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Section 1: DOKUMEN SPJ AKTIF (Safari Tabs style) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 pb-1 text-slate-500">
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-[11px] font-semibold tracking-tight text-slate-700 dark:text-slate-300">
                  {docTabs.length} Dokumen SPJ
                </span>
              </div>
              {currentLoadedId ? (
                <span
                  className={`text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                    hasChanges
                      ? "bg-amber-50 text-amber-800 border-amber-300"
                      : "bg-blue-50 text-blue-700 border-blue-200"
                  }`}
                  title={hasChanges ? "Perubahan belum disimpan" : "ID Kegiatan aktif"}
                >
                  {currentLoadedId}
                </span>
              ) : (
                <span className="text-[9.5px] font-medium px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-600">
                  Draft
                </span>
              )}
            </div>

            <nav className="space-y-0.5">
              {docTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onSelectTab(tab.id as ActiveTab)}
                    className={`btn-tactile w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                      isActive
                        ? "bg-[#0071e3] text-white shadow-2xs font-semibold"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-200/60 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? "text-white" : "text-slate-500 dark:text-slate-400"
                        }`}
                      />
                      <span className="truncate">{tab.label}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Section 2: MANAJEMEN & ARSIP (Tab Groups style) */}
          <div className="space-y-1 pt-2 border-t border-slate-200/60 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 pb-1 block">
              Grup Arsip &amp; Kegiatan
            </span>

            <nav className="space-y-0.5">
              {/* 1. Daftar Riwayat Kegiatan */}
              <button
                type="button"
                onClick={() => onSelectTab("kegiatan")}
                className={`btn-tactile w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  activeTab === "kegiatan"
                    ? "bg-[#0071e3] text-white shadow-2xs font-semibold"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-200/60 dark:hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FolderKanban
                    className={`w-4 h-4 shrink-0 ${
                      activeTab === "kegiatan" ? "text-white" : "text-slate-500 dark:text-slate-400"
                    }`}
                  />
                  <span className="truncate">Daftar Riwayat Kegiatan</span>
                </div>

                {mounted && totalKegiatanCount > 0 && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full font-mono ${
                      activeTab === "kegiatan"
                        ? "bg-white/20 text-white"
                        : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {totalKegiatanCount}
                  </span>
                )}
              </button>

              {/* 2. Rekap Kegiatan (Hover / Klik untuk menampilkan 5 Rekap Kegiatan) */}
              <div
                className="space-y-0.5"
                onMouseEnter={() => setIsRekapHovered(true)}
                onMouseLeave={() => setIsRekapHovered(false)}
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsRekapClickedOpen((prev) => !prev);
                    onSelectTab("rekap");
                  }}
                  className={`btn-tactile w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                    activeTab === "rekap"
                      ? "bg-[#0071e3] text-white shadow-2xs font-semibold"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-200/60 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileSpreadsheet
                      className={`w-4 h-4 shrink-0 ${
                        activeTab === "rekap" ? "text-white" : "text-slate-500 dark:text-slate-400"
                      }`}
                    />
                    <span className="truncate">Rekap Kegiatan</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded-full font-mono ${
                        activeTab === "rekap"
                          ? "bg-white/20 text-white"
                          : "bg-slate-200/90 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      5
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        isRekapSubmenuOpen ? "rotate-180" : ""
                      } ${activeTab === "rekap" ? "text-white" : "text-slate-400"}`}
                    />
                  </div>
                </button>

                {/* Sub-menu 5 Rekap Kegiatan */}
                {isRekapSubmenuOpen && (
                  <div className="pl-4 pr-1 py-1 space-y-0.5 border-l-2 border-slate-200/90 dark:border-slate-700 ml-4 animate-in fade-in slide-in-from-top-1 duration-150">
                    {REKAP_CATEGORY_LIST.map((cat, idx) => {
                      const isSubActive = activeTab === "rekap" && activeRekapType === cat.spjType;
                      return (
                        <button
                          key={cat.spjType}
                          type="button"
                          onClick={() => {
                            if (onSelectRekapType) onSelectRekapType(cat.spjType);
                            onSelectTab("rekap");
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] transition-all text-left cursor-pointer ${
                            isSubActive
                              ? "bg-blue-50 dark:bg-blue-950/60 text-[#0071e3] dark:text-blue-400 font-bold border border-blue-200/80 dark:border-blue-800"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-200/60 dark:hover:bg-slate-800 font-medium"
                          }`}
                          title={cat.sheetName}
                        >
                          <span className="truncate">
                            {idx + 1}. {cat.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 3. Monitoring Anggaran */}
              <button
                type="button"
                onClick={() => onSelectTab("monitoring")}
                className={`btn-tactile w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  activeTab === "monitoring"
                    ? "bg-[#0071e3] text-white shadow-2xs font-semibold"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-200/60 dark:hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <TrendingUp
                    className={`w-4 h-4 shrink-0 ${
                      activeTab === "monitoring" ? "text-white" : "text-slate-500 dark:text-slate-400"
                    }`}
                  />
                  <span className="truncate">Monitoring Anggaran</span>
                </div>
              </button>

              {/* 4. Daftar Memorandum */}
              <button
                type="button"
                onClick={() => onSelectTab("daftar-memo")}
                className={`btn-tactile w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  activeTab === "daftar-memo"
                    ? "bg-[#0071e3] text-white shadow-2xs font-semibold"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-200/60 dark:hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <BookmarkCheck
                    className={`w-4 h-4 shrink-0 ${
                      activeTab === "daftar-memo" ? "text-white" : "text-slate-500 dark:text-slate-400"
                    }`}
                  />
                  <span className="truncate">Daftar Memorandum</span>
                </div>

                {mounted && memoCount > 0 && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full font-mono ${
                      activeTab === "daftar-memo"
                        ? "bg-white/20 text-white"
                        : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {memoCount}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Section 3: CLOUD SYNC & SISTEM (Safari iCloud Tabs style) */}
          <div className="space-y-1 pt-2 border-t border-slate-200/60 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 pb-1 block">
              Cloud &amp; Integrasi
            </span>

            <nav className="space-y-0.5">
              {/* Database Google Spreadsheet Button */}
              {onOpenDatabaseSync && (
                <button
                  type="button"
                  onClick={onOpenDatabaseSync}
                  className="btn-tactile w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-all text-left cursor-pointer"
                  title="Buka Pengaturan Integrasi Database Cloud"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Cloud className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="truncate">Database Spreadsheet</span>
                  </div>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Online Sync" />
                </button>
              )}
            </nav>
          </div>

          {/* Section 4: PANDUAN & BANTUAN (Safari Saved / Bookmarks style) */}
          <div className="space-y-1 pt-2 border-t border-slate-200/60 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 pb-1 block">
              Bantuan &amp; Panduan
            </span>

            <nav className="space-y-0.5">
              <button
                type="button"
                onClick={() => onSelectTab("panduan")}
                className={`btn-tactile w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  activeTab === "panduan"
                    ? "bg-[#0071e3] text-white shadow-2xs font-semibold"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-200/60 dark:hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Bookmark
                    className={`w-4 h-4 shrink-0 ${
                      activeTab === "panduan" ? "text-white" : "text-amber-500"
                    }`}
                  />
                  <span className="truncate">Buku Panduan (Manual)</span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Sidebar Footer: Summary Card (macOS Status Style) */}
        <div className="p-3 bg-white/70 dark:bg-slate-900/70 border-t border-slate-200/70 dark:border-slate-800 space-y-1 text-xs">
          <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
            <span className="font-medium">{participantCount} {isPengadaan ? "Item" : "Peserta"}</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              Rp {totalExpenditure.toLocaleString("id-ID")}
            </span>
          </div>
          <p className="text-[9.5px] text-slate-400 text-center">
            Inspektorat • Kemenko Pangan RI
          </p>
        </div>
      </aside>
    </>
  );
};
