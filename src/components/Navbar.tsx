"use client";

import React from "react";
import {
  FileText,
  Calculator,
  Receipt,
  FileSpreadsheet,
  ListOrdered,
  FileCheck,
  Printer,
} from "lucide-react";

export type ActiveTab = "input" | "kwitansi" | "memorandum" | "nominatif" | "rincian" | "riil" | "rekap";

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
    { id: "kwitansi", label: "1. Kwitansi", icon: Receipt },
    { id: "memorandum", label: "2. Memorandum", icon: FileText },
    { id: "nominatif", label: "3. Nominatif", icon: FileSpreadsheet },
    { id: "rincian", label: "4. Rincian Biaya", icon: ListOrdered },
    { id: "riil", label: "5. Biaya Riil", icon: FileCheck },
    { id: "rekap", label: "6. Rekap Perdin", icon: FileSpreadsheet },
  ];

  return (
    <header className="sticky top-0 z-40 w-full px-4 pt-4 pb-2 no-print">
      <div className="max-w-7xl mx-auto glass-floating rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-4 transition-all">
        {/* Brand & Context */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-blue-600/20 border border-white/40">
            <Calculator className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs md:text-sm font-bold tracking-tight text-slate-900">
                Kalkulator Keuangan & SPPD
              </h1>
              <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-blue-50/80 text-blue-700 border border-blue-200/70 shadow-2xs">
                Inspektorat
              </span>
            </div>
            <p className="text-[10.5px] font-medium text-slate-500">
              Kementerian Koordinator Bidang Pangan RI
            </p>
          </div>
        </div>

        {/* Floating Segmented Navigation Material */}
        <nav className="flex items-center gap-1 p-1 bg-slate-200/40 border border-slate-300/40 rounded-xl backdrop-blur-md overflow-x-auto max-w-full">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`btn-tactile relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-white text-blue-700 shadow-sm font-bold border border-white/80"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                <span>{tab.label}</span>
                {isActive && (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-600 rounded-full mx-3" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Stats & Tactile Primary Action */}
        <div className="flex items-center gap-2.5">
          <div className="hidden xl:flex flex-col items-end pr-1">
            <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">
              {participantCount} Peserta Terdaftar
            </span>
            <span className="text-xs font-black text-slate-900 font-mono">
              Rp {totalExpenditure.toLocaleString("id-ID")}
            </span>
          </div>

          {onOpenDatabaseSync && (
            <button
              onClick={onOpenDatabaseSync}
              className="btn-tactile flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 hover:text-slate-900 text-xs font-bold border border-slate-300/60 shadow-xs transition-all cursor-pointer"
              title="Integrasi Database Google Spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Database</span>
            </button>
          )}

          <button
            onClick={onPrint}
            className="btn-tactile flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 border border-white/20 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>
    </header>
  );
};
