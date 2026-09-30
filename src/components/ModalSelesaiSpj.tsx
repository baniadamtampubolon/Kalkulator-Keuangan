"use client";

import React from "react";
import { HeaderData, ParticipantRow } from "@/lib/types";
import { ActiveTab } from "./Navbar";
import {
  CheckCircle2,
  Printer,
  Plus,
  FolderKanban,
  FileText,
  Receipt,
  FileSpreadsheet,
  ListOrdered,
  FileCheck,
  Sparkles,
  ArrowRight,
  X,
  MapPin,
  Calendar,
  Users,
  Coins,
} from "lucide-react";

interface ModalSelesaiSpjProps {
  isOpen: boolean;
  onClose: () => void;
  header: HeaderData;
  rows: ParticipantRow[];
  onNavigateToTab: (tab: ActiveTab) => void;
  onPrintAll: () => void;
  onCreateNewKegiatan: () => void;
}

export const ModalSelesaiSpj: React.FC<ModalSelesaiSpjProps> = ({
  isOpen,
  onClose,
  header,
  rows,
  onNavigateToTab,
  onPrintAll,
  onCreateNewKegiatan,
}) => {
  if (!isOpen) return null;

  const validRows = rows.filter(
    (r) => Boolean((r.nama && r.nama.trim() !== "") || (r.namaExternal && r.namaExternal.trim() !== ""))
  );
  const totalBiaya = validRows.reduce((acc, r) => acc + (r.totalJumlah || 0), 0);
  const kotaTujuan = (header.kotaTujuanList || []).filter(Boolean).join(", ") || header.provinsiTujuan || "Indonesia";

  const formatDateIndo = (dStr: string) => {
    if (!dStr) return "";
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return dStr;
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const documentItems = [
    { id: "kwitansi", label: "Kwitansi Pembayaran", icon: Receipt, desc: "Format rangkap 3 resmi" },
    { id: "memorandum", label: "Memorandum Permohonan", icon: FileText, desc: "Nota dinas pembebanan anggaran" },
    { id: "nominatif", label: "Daftar Nominatif", icon: FileSpreadsheet, desc: "Tabel rekapitulasi peserta" },
    { id: "rincian", label: "Rincian Biaya", icon: ListOrdered, desc: "Perhitungan detail per personil" },
    { id: "riil", label: "Pengeluaran Riil", icon: FileCheck, desc: "Pernyataan biaya riil tanpa bukti" },
    { id: "rekap", label: "Rekap Perdin (48 Kolom)", icon: FileSpreadsheet, desc: "Database lengkap & ekspor Excel" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in no-print overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white/95 rounded-3xl border border-slate-200/90 shadow-2xl p-6 sm:p-8 space-y-6 my-8 backdrop-blur-xl">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
          title="Tutup & Tetap di Halaman Ini"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Milestone Celebration Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/20 mb-1 ring-4 ring-emerald-100 animate-bounce-short">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            SPJ Selesai & Berhasil Disimpan!
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
            Semua data perjalanan dinas telah tersimpan ke <span className="font-semibold text-slate-900">Daftar Kegiatan</span>, <span className="font-semibold text-slate-900">Rekap Perdin</span>, dan tersinkronisasi ke <span className="font-semibold text-slate-900">Google Spreadsheet</span>.
          </p>
        </div>

        {/* SPJ Summary Card (Stage Summary) */}
        <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-2xl border border-slate-200/80 p-4 sm:p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200/60">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-600 text-white font-mono shadow-xs">
                {header.idKegiatan || "KEG-BARU"}
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                Kategori {header.kategoriSpj || "A"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Status: Tersimpan & Valid</span>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-slate-500 font-medium">Nama / Perihal Kegiatan:</p>
            <p className="text-sm font-bold text-slate-900 line-clamp-2">
              {header.keteranganKegiatan || "Perjalanan Dinas Jabatan Inspektorat"}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1 text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate font-medium">{kotaTujuan}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate font-medium">{formatDateIndo(header.tanggalSpd)}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <Users className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="font-medium">{validRows.length} Personil</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
            <span className="text-xs text-slate-600 font-medium">Total Anggaran SPJ:</span>
            <span className="text-base font-extrabold text-slate-900 font-mono">
              Rp {totalBiaya.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        {/* Ready Documents Checklist */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-900 tracking-wide uppercase">
              Dokumen Lengkap Siap Digunakan ({documentItems.length})
            </p>
            <span className="text-[11px] text-slate-500">Klik untuk langsung membuka</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {documentItems.map((doc) => {
              const Icon = doc.icon;
              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToTab(doc.id as ActiveTab);
                  }}
                  className="btn-tactile flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                        {doc.label}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">{doc.desc}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Clear Action Buttons (The Game Loop Next Step) */}
        <div className="space-y-2.5 pt-2 border-t border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Action 1: Cetak Seluruh Dokumen */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onPrintAll();
              }}
              className="btn-tactile flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Seluruh Dokumen SPJ</span>
            </button>

            {/* Action 2: Selesai & Buat SPJ Baru */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onCreateNewKegiatan();
              }}
              className="btn-tactile flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Selesai & Buat SPJ Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Action 3: Buka Daftar Kegiatan */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToTab("kegiatan");
              }}
              className="btn-tactile flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer border border-slate-200"
            >
              <FolderKanban className="w-4 h-4 text-slate-600" />
              <span>Buka Daftar Kegiatan (Menu Utama)</span>
            </button>

            {/* Action 4: Tetap di Halaman Ini */}
            <button
              type="button"
              onClick={onClose}
              className="btn-tactile flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-medium transition-all cursor-pointer border border-slate-200"
            >
              <span>Tetap di Halaman Ini (Lanjut Edit)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
