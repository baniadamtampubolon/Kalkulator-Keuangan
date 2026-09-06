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
  Database,
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
    <header className="sticky top-0 z-40 w-full bg-slate-50/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-2.5 no-print transition-all shadow-2xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 transition-all">
        {/* Brand & Context */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center border border-slate-300/70 shadow-2xs">
            <Calculator className="w-4 h-4 text-slate-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs md:text-sm font-semibold tracking-tight text-slate-900">
                Kalkulator Keuangan & SPPD
              </h1>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                Inspektorat
              </span>
            </div>
            <p className="text-[10.5px] text-slate-500 font-normal">
              Kemenko Bidang Pangan RI
            </p>
          </div>
        </div>

        {/* Floating Spatial Segmented Navigation Material */}
        <nav className="flex items-center gap-1 p-1 bg-slate-200/50 border border-slate-300/40 rounded-xl backdrop-blur-md overflow-x-auto max-w-full">
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

        {/* Operational Context & Primary Action */}
        <div className="flex items-center gap-2.5">
          <div className="hidden lg:flex flex-col items-end pr-1 text-right">
            <span className="text-[10px] text-slate-500 font-normal">
              {participantCount} Peserta Terdaftar
            </span>
            <span className="text-xs font-bold text-slate-900 font-mono">
              Rp {totalExpenditure.toLocaleString("id-ID")}
            </span>
          </div>

          {onOpenDatabaseSync && (
            <button
              onClick={onOpenDatabaseSync}
              className="btn-tactile flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100/90 hover:bg-slate-200/80 text-slate-700 hover:text-slate-900 text-xs font-medium border border-slate-300/60 shadow-2xs transition-all cursor-pointer"
              title="Integrasi Database Google Spreadsheet"
            >
              <Database className="w-3.5 h-3.5 text-slate-700" />
              <span className="hidden sm:inline font-medium">Database</span>
            </button>
          )}

          <button
            onClick={onPrint}
            className="btn-tactile flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-white" />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>
    </header>
  );
};

