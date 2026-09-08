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
  Database,
  BookOpen,
  FolderKanban,
} from "lucide-react";

export type ActiveTab = "input" | "kegiatan" | "kwitansi" | "memorandum" | "nominatif" | "rincian" | "riil" | "rekap" | "panduan";

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onPrint: () => void;
  onOpenDatabaseSync?: () => void;
  participantCount: number;
  totalExpenditure: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onPrint,
  onOpenDatabaseSync,
  participantCount,
  totalExpenditure,
}) => {
  const tabs = [
    { id: "input", label: "Input & Kalkulator", icon: Calculator },
    { id: "kegiatan", label: "Daftar Kegiatan", icon: FolderKanban },
    { id: "kwitansi", label: "1. Kwitansi", icon: Receipt },
    { id: "memorandum", label: "2. Memorandum", icon: FileText },
    { id: "nominatif", label: "3. Nominatif", icon: FileSpreadsheet },
    { id: "rincian", label: "4. Rincian Biaya", icon: ListOrdered },
    { id: "riil", label: "5. Biaya Riil", icon: FileCheck },
    { id: "rekap", label: "6. Rekap Perdin", icon: FileSpreadsheet },
    { id: "panduan", label: "7. Panduan (Manual Book)", icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 no-print transition-all shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Tier 1: Brand & Top Utilities (Symmetrical, Clean, No Stacking) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2.5 border-b border-slate-100">
          {/* Brand Identity with Official Kemenko Pangan Logo */}
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-xl bg-slate-50 p-1 flex items-center justify-center border border-slate-200/80 shadow-2xs overflow-hidden shrink-0">
              <Image
                src="/logo-kemenkopangan.png"
                alt="Logo Kemenko Pangan"
                width={36}
                height={36}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xs md:text-sm font-bold tracking-tight text-slate-900">
                  Kalkulator Keuangan & SPPD
                </h1>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  Inspektorat
                </span>
              </div>
              <p className="text-[10.5px] text-slate-500 font-normal">
                Kemenko Bidang Pangan RI
              </p>
            </div>
          </div>

          {/* Right Action Group: Live Metrics Pill, Database, Cetak PDF */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Live Metrics Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/90 border border-slate-200/80 text-xs shadow-2xs">
              <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap">
                {participantCount} Peserta Terdaftar
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0" />
              <span className="font-bold text-slate-900 font-mono text-xs whitespace-nowrap">
                Rp {totalExpenditure.toLocaleString("id-ID")}
              </span>
            </div>

            {/* Panduan Quick Button */}
            <button
              type="button"
              onClick={() => setActiveTab("panduan")}
              className={`btn-tactile flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border shadow-2xs transition-all cursor-pointer ${
                activeTab === "panduan"
                  ? "bg-slate-900 text-white border-slate-900 font-semibold"
                  : "bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-300/80"
              }`}
              title="Buku Panduan Penggunaan & Tutorial Setup Database"
            >
              <BookOpen className={`w-3.5 h-3.5 ${activeTab === "panduan" ? "text-white" : "text-slate-700"}`} />
              <span>Panduan</span>
            </button>

            {/* Database Button */}
            {onOpenDatabaseSync && (
              <button
                type="button"
                onClick={onOpenDatabaseSync}
                className="btn-tactile flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-medium border border-slate-300/80 shadow-2xs transition-all cursor-pointer"
                title="Integrasi Database Google Spreadsheet"
              >
                <Database className="w-3.5 h-3.5 text-slate-700" />
                <span className="font-medium">Database</span>
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
        </div>

        {/* Tier 2: Dedicated Navigation Tabs (Full Width / Symmetrical, Zero Clutter) */}
        <div className="py-2 overflow-x-auto scrollbar-none flex justify-center sm:justify-start lg:justify-center">
          <nav className="inline-flex items-center gap-1 p-1 bg-slate-200/50 border border-slate-300/40 rounded-xl backdrop-blur-md max-w-full">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ActiveTab)}
                  className={`btn-tactile relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap cursor-pointer ${
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
      </div>
    </header>
  );
};

