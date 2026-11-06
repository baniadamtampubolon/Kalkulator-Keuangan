"use client";

import React, { useState, useEffect, useMemo } from "react";
import { NomorMemo, SavedKegiatan } from "@/lib/types";
import {
  formatMemoDate,
  extractMemoSeqNumber,
  getCustomMemoList,
  saveCustomMemo,
  deleteCustomMemo,
  mergeAndSortMemoList,
  exportMemoListToExcel,
} from "@/lib/memoHelper";
import { getSavedKegiatanList } from "@/lib/kegiatanHelper";
import { LIST_NOMOR_KOMPONEN } from "@/data/mak_akun";
import { getMonthRoman } from "@/lib/calc";
import {
  Search,
  Plus,
  RotateCw,
  Download,
  Copy,
  Check,
  ExternalLink,
  FileText,
  Filter,
  CheckCircle2,
  Clock,
  Calendar,
  Edit3,
  Trash2,
  Table,
  LayoutGrid,
  X,
  BookmarkCheck,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

interface DaftarMemorandumTabProps {
  memoList: NomorMemo[];
  onSelectMemo?: (memoNumber: string, memoPerihal?: string) => void;
  onLoadKegiatan?: (kegiatan: SavedKegiatan) => void;
  onRefreshMemo?: () => Promise<void>;
}

export const DaftarMemorandumTab: React.FC<DaftarMemorandumTabProps> = ({
  memoList: rawMemoList,
  onSelectMemo,
  onLoadKegiatan,
  onRefreshMemo,
}) => {
  // Master memo merged with custom local memos
  const [customList, setCustomList] = useState<NomorMemo[]>([]);
  const [savedKegiatanList, setSavedKegiatanList] = useState<SavedKegiatan[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedMemo, setCopiedMemo] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "TERPAKAI" | "TERSEDIA">("ALL");
  const [bulanFilter, setBulanFilter] = useState<string>("ALL");
  const [spjFilter, setSpjFilter] = useState<"ALL" | "WITH_SPJ" | "WITHOUT_SPJ">("ALL");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Modal State: Create or Edit Memo
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMemo, setEditingMemo] = useState<NomorMemo | null>(null);
  const [modalForm, setModalForm] = useState<{
    nomorUrut: string;
    prefix: string;
    unit: string;
    bulanRomawi: string;
    tahun: string;
    tanggalMemo: string;
    perihal: string;
    mak: string;
    nominal: string;
    status: string;
    idKegiatanRef: string;
  }>({
    nomorUrut: "",
    prefix: "M.",
    unit: "/INS/PPK/",
    bulanRomawi: "XI",
    tahun: "2026",
    tanggalMemo: new Date().toISOString().slice(0, 10),
    perihal: "",
    mak: "",
    nominal: "",
    status: "TERPAKAI",
    idKegiatanRef: "",
  });

  // Modal Delete State
  const [deleteTarget, setDeleteTarget] = useState<NomorMemo | null>(null);

  // Hydrate custom memos & saved kegiatan
  useEffect(() => {
    try {
      setCustomList(getCustomMemoList());
      setSavedKegiatanList(getSavedKegiatanList());
    } catch {
      // ignore
    }

    const handleUpdate = () => {
      try {
        setCustomList(getCustomMemoList());
        setSavedKegiatanList(getSavedKegiatanList());
      } catch {
        // ignore
      }
    };

    window.addEventListener("memo-list-updated", handleUpdate);
    window.addEventListener("kegiatan-list-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("memo-list-updated", handleUpdate);
      window.removeEventListener("kegiatan-list-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  // Combined full list
  const fullMemoList = useMemo(() => {
    return mergeAndSortMemoList(rawMemoList, customList);
  }, [rawMemoList, customList]);

  // Map kegiatan by nomor memo for quick cross-referencing
  const kegiatanByMemoMap = useMemo(() => {
    const map = new Map<string, SavedKegiatan>();
    for (const k of savedKegiatanList) {
      const memoStr = (k.header?.nomorMemo || "").trim();
      if (memoStr) {
        map.set(memoStr.toLowerCase(), k);
        // Also map just the sequence number if format differs slightly
        const seq = extractMemoSeqNumber(memoStr);
        if (seq > 0) {
          map.set(`seq-${seq}`, k);
        }
      }
    }
    return map;
  }, [savedKegiatanList]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = fullMemoList.length;
    let terpakaiCount = 0;
    let maxSeq = 0;
    let latestMemoStr = "";

    for (const m of fullMemoList) {
      const seq = extractMemoSeqNumber(m);
      const isUsed = Boolean(
        (m.status && String(m.status).toUpperCase().includes("TERPAKAI")) ||
        (m.perihal && String(m.perihal).trim().length > 0) ||
        (m.id_kegiatan_ref && String(m.id_kegiatan_ref).trim().length > 0)
      );

      if (isUsed) {
        terpakaiCount++;
      }

      if (seq > maxSeq) {
        maxSeq = seq;
        latestMemoStr = m.format_lengkap || m.noMemo || `M.${seq}/INS/PPK/XI/2026`;
      }
    }

    const tersediaCount = Math.max(0, total - terpakaiCount);
    const nextSeq = maxSeq > 0 ? maxSeq + 1 : 1;
    const currentRoman = getMonthRoman(new Date()) || "XI";
    const nextMemoStr = `M.${nextSeq}/INS/PPK/${currentRoman}/2026`;

    return {
      total,
      terpakaiCount,
      tersediaCount,
      maxSeq,
      latestMemoStr: latestMemoStr || `M.320/INS/PPK/XI/2026`,
      nextSeq,
      nextMemoStr,
    };
  }, [fullMemoList]);

  // Filtered List
  const filteredList = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    return fullMemoList.filter((m) => {
      const seq = extractMemoSeqNumber(m);
      const format = (m.format_lengkap || m.noMemo || `M.${seq}`).toLowerCase();
      const perihal = (m.perihal || "").toLowerCase();
      const mak = (m.MAK || m.mak || "").toLowerCase();
      const idRef = (m.id_kegiatan_ref || "").toLowerCase();
      const tgl = formatMemoDate(m.tanggal_memo || m.tanggal).toLowerCase();

      // Search term
      if (term) {
        const matchesTerm =
          format.includes(term) ||
          perihal.includes(term) ||
          mak.includes(term) ||
          idRef.includes(term) ||
          tgl.includes(term) ||
          String(seq) === term;
        if (!matchesTerm) return false;
      }

      // Status filter
      const isUsed = Boolean(
        (m.status && String(m.status).toUpperCase().includes("TERPAKAI")) ||
        (m.perihal && String(m.perihal).trim().length > 0) ||
        (m.id_kegiatan_ref && String(m.id_kegiatan_ref).trim().length > 0)
      );

      if (statusFilter === "TERPAKAI" && !isUsed) return false;
      if (statusFilter === "TERSEDIA" && isUsed) return false;

      // Bulan Romawi filter
      if (bulanFilter !== "ALL") {
        const b = (m.bulanRomawi || "").toUpperCase();
        if (b && b !== bulanFilter) return false;
        if (!b && !format.includes(`/${bulanFilter}/`)) return false;
      }

      // SPJ Linked filter
      const hasSpj =
        kegiatanByMemoMap.has(format) ||
        (seq > 0 && kegiatanByMemoMap.has(`seq-${seq}`)) ||
        Boolean(m.id_kegiatan_ref);

      if (spjFilter === "WITH_SPJ" && !hasSpj) return false;
      if (spjFilter === "WITHOUT_SPJ" && hasSpj) return false;

      return true;
    });
  }, [fullMemoList, searchTerm, statusFilter, bulanFilter, spjFilter, kegiatanByMemoMap]);

  // Handle Copy to Clipboard
  const handleCopyMemo = (memoStr: string) => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(memoStr);
    setCopiedMemo(memoStr);
    setToastMessage(`Nomor memorandum ${memoStr} berhasil disalin ke clipboard!`);
    setTimeout(() => {
      setCopiedMemo(null);
      setToastMessage(null);
    }, 2800);
  };

  // Handle Refresh from Google Sheets Cloud
  const handleRefresh = async () => {
    if (!onRefreshMemo) return;
    setIsRefreshing(true);
    try {
      await onRefreshMemo();
      setToastMessage("Data nomor memorandum berhasil disinkronkan dari Cloud!");
      setTimeout(() => setToastMessage(null), 3000);
    } catch {
      setToastMessage("Gagal menyinkronkan data dari cloud.");
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    const nextNum = stats.nextSeq;
    const currentRoman = getMonthRoman(new Date()) || "XI";
    setEditingMemo(null);
    setModalForm({
      nomorUrut: String(nextNum),
      prefix: "M.",
      unit: "/INS/PPK/",
      bulanRomawi: currentRoman,
      tahun: "2026",
      tanggalMemo: new Date().toISOString().slice(0, 10),
      perihal: "",
      mak: "WA.7457.EBD.Z30.052.AP.524111",
      nominal: "",
      status: "TERPAKAI",
      idKegiatanRef: "",
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (memo: NomorMemo) => {
    const seq = extractMemoSeqNumber(memo);
    setEditingMemo(memo);
    setModalForm({
      nomorUrut: String(seq || memo.nomor_urut || ""),
      prefix: memo.prefix || "M.",
      unit: memo.unit || "/INS/PPK/",
      bulanRomawi: memo.bulanRomawi || "XI",
      tahun: String(memo.tahun_anggaran || memo.tahun || "2026").replace(/\//g, ""),
      tanggalMemo: memo.tanggal_memo || memo.tanggal || new Date().toISOString().slice(0, 10),
      perihal: memo.perihal || "",
      mak: memo.MAK || memo.mak || "",
      nominal: memo.nominal ? String(memo.nominal) : "",
      status: memo.status || "TERPAKAI",
      idKegiatanRef: memo.id_kegiatan_ref || "",
    });
    setIsModalOpen(true);
  };

  // Save Memo Modal Form
  const handleSaveModalForm = (e: React.FormEvent) => {
    e.preventDefault();
    const seq = parseInt(modalForm.nomorUrut, 10) || stats.nextSeq;
    const cleanUnit = modalForm.unit.startsWith("/") ? modalForm.unit : `/${modalForm.unit}/`;
    const cleanTahun = modalForm.tahun.startsWith("/") ? modalForm.tahun : `/${modalForm.tahun}`;
    const formatLengkap = `${modalForm.prefix}${seq}${cleanUnit}${modalForm.bulanRomawi}${cleanTahun}`;

    const newMemoEntry: NomorMemo = {
      tahun_anggaran: parseInt(modalForm.tahun.replace(/\D/g, ""), 10) || 2026,
      nomor_urut: seq,
      format_lengkap: formatLengkap,
      tanggal_memo: modalForm.tanggalMemo,
      perihal: modalForm.perihal.trim(),
      id_kegiatan_ref: modalForm.idKegiatanRef.trim(),
      status: modalForm.status,
      nominal: modalForm.nominal ? Number(modalForm.nominal.replace(/\D/g, "")) : "",
      MAK: modalForm.mak.trim(),
      mak: modalForm.mak.trim(),
      noMemo: formatLengkap,
      prefix: modalForm.prefix,
      nomor: String(seq),
      unit: cleanUnit,
      bulanRomawi: modalForm.bulanRomawi,
      tahun: cleanTahun,
      tanggal: modalForm.tanggalMemo,
    };

    saveCustomMemo(newMemoEntry);
    setIsModalOpen(false);
    setToastMessage(`Nomor memorandum ${formatLengkap} berhasil disimpan!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Handle Delete Target Confirm
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const seq = extractMemoSeqNumber(deleteTarget);
    const format = deleteTarget.format_lengkap || deleteTarget.noMemo || `M.${seq}`;
    deleteCustomMemo(format);
    setDeleteTarget(null);
    setToastMessage(`Nomor memorandum ${format} dihapus dari daftar kustom lokal.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900/95 text-white text-xs font-semibold shadow-2xl backdrop-blur-xl border border-slate-700/80 flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. HERO HEADER: LOG KENDALI NOMOR MEMORANDUM DINAS                        */}
      {/* ========================================================================= */}
      <section className="form-card p-5 md:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#0071e3] flex items-center justify-center font-bold shadow-2xs">
                <BookmarkCheck className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-base md:text-lg font-bold text-slate-900 tracking-tight">
                  Buku Kendali &amp; Daftar Memorandum Terdaftar
                </h1>
                <p className="text-xs text-slate-500">
                  Register penomoran resmi Nota Dinas Memorandum Pengajuan Pembayaran Langsung (LS) Inspektorat Kemenko Pangan
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {onRefreshMemo && (
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="btn-tactile flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold shadow-2xs cursor-pointer transition-all disabled:opacity-50"
                title="Sinkronkan dengan master database Google Sheets"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
                <span>{isRefreshing ? "Menyinkronkan..." : "Sinkronisasi Cloud"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => exportMemoListToExcel(filteredList)}
              className="btn-tactile flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-emerald-700 border border-emerald-300 hover:border-emerald-400 text-xs font-semibold shadow-2xs cursor-pointer transition-all"
              title="Unduh seluruh daftar memorandum ke format Microsoft Excel (.xlsx)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ekspor Excel (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="btn-tactile flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold shadow-2xs cursor-pointer transition-all"
              title="Daftarkan entri nomor memorandum baru ke buku kendali"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Daftarkan Nomor Baru</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. STATISTIK KENDALI PENOMORAN                                            */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Total Register */}
          <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Total Memo Terdaftar
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl md:text-2xl font-black text-slate-900 font-mono">
                {stats.total}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">Buku Register</span>
            </div>
          </div>

          {/* Nomor Terpakai */}
          <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200/80 space-y-1">
            <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Nomor Terpakai</span>
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl md:text-2xl font-black text-emerald-700 font-mono">
                {stats.terpakaiCount}
              </span>
              <span className="text-[11px] text-emerald-600 font-semibold font-mono">
                {stats.total > 0 ? Math.round((stats.terpakaiCount / stats.total) * 100) : 0}%
              </span>
            </div>
          </div>

          {/* Nomor Terakhir Terdaftar */}
          <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200/80 space-y-1">
            <span className="text-[10px] uppercase font-bold text-blue-800 tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-600" />
              <span>Nomor Terakhir</span>
            </span>
            <div className="flex items-baseline justify-between min-w-0">
              <span className="text-xs md:text-sm font-bold text-blue-900 font-mono truncate" title={stats.latestMemoStr}>
                {stats.latestMemoStr}
              </span>
            </div>
          </div>

          {/* Estimasi Nomor Berikutnya */}
          <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200/80 space-y-1">
            <span className="text-[10px] uppercase font-bold text-amber-900 tracking-wider flex items-center gap-1">
              <ArrowRight className="w-3 h-3 text-amber-600" />
              <span>Nomor Berikutnya (Rekomendasi)</span>
            </span>
            <div className="flex items-baseline justify-between min-w-0">
              <span className="text-xs md:text-sm font-bold text-amber-950 font-mono truncate" title={stats.nextMemoStr}>
                {stats.nextMemoStr}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (onSelectMemo) onSelectMemo(stats.nextMemoStr);
                }}
                className="text-[10.5px] font-bold text-amber-700 hover:text-amber-900 underline cursor-pointer shrink-0 ml-1"
                title="Langsung gunakan nomor urut berikutnya di kalkulator"
              >
                Gunakan
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. CONTROL PANEL: FILTER, SEARCH & VIEW TOGGLE                            */}
      {/* ========================================================================= */}
      <section className="form-card p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nomor memo (contoh: 320, M.21), perihal, atau MAK..."
              className="input-human w-full h-10 pl-9 pr-8 text-xs font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "ALL" | "TERPAKAI" | "TERSEDIA")}
              className="input-human h-10 px-3 text-xs font-semibold text-slate-800 cursor-pointer bg-white"
            >
              <option value="ALL">Semua Status ({fullMemoList.length})</option>
              <option value="TERPAKAI">Terpakai ({stats.terpakaiCount})</option>
              <option value="TERSEDIA">Tersedia ({stats.tersediaCount})</option>
            </select>

            {/* Filter Bulan Romawi */}
            <select
              value={bulanFilter}
              onChange={(e) => setBulanFilter(e.target.value)}
              className="input-human h-10 px-3 text-xs font-semibold text-slate-800 cursor-pointer bg-white"
            >
              <option value="ALL">Semua Bulan</option>
              {["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"].map((m) => (
                <option key={m} value={m}>
                  Bulan {m}
                </option>
              ))}
            </select>

            {/* Filter Hubungan dengan Berkas SPJ */}
            <select
              value={spjFilter}
              onChange={(e) => setSpjFilter(e.target.value as "ALL" | "WITH_SPJ" | "WITHOUT_SPJ")}
              className="input-human h-10 px-3 text-xs font-semibold text-slate-800 cursor-pointer bg-white"
            >
              <option value="ALL">Semua Berkas</option>
              <option value="WITH_SPJ">Ada Berkas SPJ ({savedKegiatanList.length})</option>
              <option value="WITHOUT_SPJ">Belum Terhubung SPJ</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === "table" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                }`}
                title="Tampilan Tabel Detail"
              >
                <Table className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tabel</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === "grid" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                }`}
                title="Tampilan Kartu Berkas"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kartu</span>
              </button>
            </div>
          </div>
        </div>

        {/* Results Counter & Active Filter Pills */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span>
              Menampilkan <strong className="text-slate-900 font-mono">{filteredList.length}</strong> dari {fullMemoList.length} entri memorandum
            </span>
            {(searchTerm || statusFilter !== "ALL" || bulanFilter !== "ALL" || spjFilter !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("ALL");
                  setBulanFilter("ALL");
                  setSpjFilter("ALL");
                }}
                className="text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. MAIN DATA DISPLAY: TABEL ATAU KARTU                                    */}
      {/* ========================================================================= */}
      {filteredList.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Tidak ada nomor memorandum yang cocok</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Coba ubah kata kunci pencarian atau sesuaikan filter status dan bulan di panel atas.
          </p>
        </div>
      ) : viewMode === "table" ? (
        /* -------------------------------------------------------------
           VIEW A: SPREADSHEET TABLE VIEW (Mac/Excel Style)
           ------------------------------------------------------------- */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10.5px] font-bold select-none">
                  <th className="py-3 px-3.5 text-center w-14">No</th>
                  <th className="py-3 px-3.5 w-52">Nomor Memorandum</th>
                  <th className="py-3 px-3.5 w-36">Tanggal</th>
                  <th className="py-3 px-3.5 min-w-[280px]">Perihal / Uraian Pengajuan</th>
                  <th className="py-3 px-3.5 w-44">Pembebanan MAK</th>
                  <th className="py-3 px-3.5 text-center w-24">Status</th>
                  <th className="py-3 px-3.5 text-right w-44">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredList.map((memo, idx) => {
                  const seq = extractMemoSeqNumber(memo);
                  const formatLengkap = memo.format_lengkap || memo.noMemo || `M.${seq}/INS/PPK/XI/2026`;
                  const isCopied = copiedMemo === formatLengkap;
                  const tglDisplay = formatMemoDate(memo.tanggal_memo || memo.tanggal);
                  const isUsed = Boolean(
                    (memo.status && String(memo.status).toUpperCase().includes("TERPAKAI")) ||
                    (memo.perihal && String(memo.perihal).trim().length > 0)
                  );
                  const makDisplay = memo.MAK || memo.mak || "-";

                  // Check if there is an active/saved SPJ kegiatan matching this memo
                  const linkedKegiatan =
                    kegiatanByMemoMap.get(formatLengkap.toLowerCase()) ||
                    (seq > 0 ? kegiatanByMemoMap.get(`seq-${seq}`) : undefined);

                  return (
                    <tr
                      key={formatLengkap + idx}
                      className="hover:bg-blue-50/40 transition-colors group"
                    >
                      {/* No. Urut */}
                      <td className="py-3 px-3.5 text-center font-mono font-bold text-slate-500">
                        {seq > 0 ? seq : idx + 1}
                      </td>

                      {/* Nomor Memorandum */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-blue-700 text-xs tracking-tight">
                            {formatLengkap}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyMemo(formatLengkap)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Salin nomor memorandum ke clipboard"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        {linkedKegiatan && (
                          <div className="pt-1">
                            <span
                              className="inline-flex items-center gap-1 text-[9.5px] font-semibold text-emerald-800 bg-emerald-100/80 border border-emerald-200 px-1.5 py-0.5 rounded cursor-pointer hover:bg-emerald-200/80 transition-colors"
                              title={`Terhubung ke Berkas SPJ ID: ${linkedKegiatan.idKegiatan}. Klik untuk membuka berkas ini.`}
                              onClick={() => {
                                if (onLoadKegiatan) onLoadKegiatan(linkedKegiatan);
                              }}
                            >
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                              <span>SPJ: {linkedKegiatan.idKegiatan}</span>
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Tanggal Memo */}
                      <td className="py-3 px-3.5 text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{tglDisplay}</span>
                        </div>
                      </td>

                      {/* Perihal / Uraian */}
                      <td className="py-3 px-3.5 text-slate-800 leading-relaxed">
                        <p className="line-clamp-2" title={memo.perihal}>
                          {memo.perihal || <span className="text-slate-400 italic">Belum ada keterangan perihal</span>}
                        </p>
                      </td>

                      {/* MAK */}
                      <td className="py-3 px-3.5 font-mono text-[11px] text-slate-600">
                        <span className="truncate block max-w-[170px]" title={makDisplay}>
                          {makDisplay}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide border ${
                            isUsed
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {isUsed ? "TERPAKAI" : "TERSEDIA"}
                        </span>
                      </td>

                      {/* Aksi Cepat */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Gunakan Nomor Ini */}
                          {onSelectMemo && (
                            <button
                              type="button"
                              onClick={() => onSelectMemo(formatLengkap, memo.perihal)}
                              className="btn-tactile inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0071e3] hover:bg-[#0077ed] text-white text-[11px] font-semibold cursor-pointer shadow-2xs"
                              title="Pilih nomor memorandum ini untuk pengajuan SPJ saat ini"
                            >
                              <span>Gunakan</span>
                            </button>
                          )}

                          {/* Buka SPJ Kegiatan jika ada */}
                          {linkedKegiatan && onLoadKegiatan && (
                            <button
                              type="button"
                              onClick={() => onLoadKegiatan(linkedKegiatan)}
                              className="p-1 rounded-lg text-emerald-700 hover:bg-emerald-50 border border-emerald-200 transition-colors cursor-pointer"
                              title="Buka Berkas SPJ ini di Kalkulator"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Edit Memo */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(memo)}
                            className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
                            title="Edit data nomor memo"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* -------------------------------------------------------------
           VIEW B: CARD GRID VIEW (Modern Cards)
           ------------------------------------------------------------- */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredList.map((memo, idx) => {
            const seq = extractMemoSeqNumber(memo);
            const formatLengkap = memo.format_lengkap || memo.noMemo || `M.${seq}/INS/PPK/XI/2026`;
            const isCopied = copiedMemo === formatLengkap;
            const tglDisplay = formatMemoDate(memo.tanggal_memo || memo.tanggal);
            const isUsed = Boolean(
              (memo.status && String(memo.status).toUpperCase().includes("TERPAKAI")) ||
              (memo.perihal && String(memo.perihal).trim().length > 0)
            );
            const makDisplay = memo.MAK || memo.mak || "-";

            const linkedKegiatan =
              kegiatanByMemoMap.get(formatLengkap.toLowerCase()) ||
              (seq > 0 ? kegiatanByMemoMap.get(`seq-${seq}`) : undefined);

            return (
              <div
                key={formatLengkap + idx}
                className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-blue-700 text-xs">
                          {formatLengkap}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyMemo(formatLengkap)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                          title="Salin nomor memo"
                        >
                          {isCopied ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">No. Urut #{seq > 0 ? seq : idx + 1}</span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        isUsed
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {isUsed ? "TERPAKAI" : "TERSEDIA"}
                    </span>
                  </div>

                  {/* Tanggal & MAK */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{tglDisplay}</span>
                    </span>
                    {makDisplay !== "-" && (
                      <span className="font-mono text-slate-600 truncate max-w-[160px]" title={makDisplay}>
                        {makDisplay}
                      </span>
                    )}
                  </div>

                  {/* Perihal */}
                  <p className="text-xs text-slate-700 line-clamp-3 leading-relaxed pt-1">
                    {memo.perihal || <span className="text-slate-400 italic">Belum ada perihal</span>}
                  </p>

                  {/* Linked Kegiatan */}
                  {linkedKegiatan && (
                    <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-[10.5px] flex items-center justify-between">
                      <span className="font-medium truncate">SPJ: {linkedKegiatan.namaKegiatan}</span>
                      {onLoadKegiatan && (
                        <button
                          type="button"
                          onClick={() => onLoadKegiatan(linkedKegiatan)}
                          className="text-emerald-700 font-bold underline shrink-0 cursor-pointer"
                        >
                          Buka
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(memo)}
                    className="text-[11px] text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>

                  {onSelectMemo && (
                    <button
                      type="button"
                      onClick={() => onSelectMemo(formatLengkap, memo.perihal)}
                      className="btn-tactile inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold cursor-pointer shadow-2xs"
                    >
                      <span>Gunakan Nomor</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL FORM: TAMBAH / DAFTARKAN / EDIT NOMOR MEMORANDUM                 */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="p-4 md:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#0071e3] flex items-center justify-center font-bold">
                  <BookmarkCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingMemo ? "Edit Data Nomor Memorandum" : "Daftarkan Nomor Memorandum Baru"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editingMemo ? "Perbarui informasi pada register buku kendali" : "Tambahkan nomor urut baru ke register master"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveModalForm} className="p-4 md:p-5 space-y-4 text-xs">
              {/* Nomor Urut & Format */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">
                    Nomor Urut Angka <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={modalForm.nomorUrut}
                    onChange={(e) => setModalForm((prev) => ({ ...prev, nomorUrut: e.target.value }))}
                    placeholder="321"
                    className="input-human w-full h-9 px-3 font-mono font-bold text-slate-900"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Bulan Romawi</label>
                  <select
                    value={modalForm.bulanRomawi}
                    onChange={(e) => setModalForm((prev) => ({ ...prev, bulanRomawi: e.target.value }))}
                    className="input-human w-full h-9 px-3 font-mono font-semibold text-slate-900 cursor-pointer bg-white"
                  >
                    {["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"].map((b) => (
                      <option key={b} value={b}>
                        Bulan {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Preview Format Lengkap */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500">Format Lengkap Resmi:</span>
                <span className="font-mono font-bold text-blue-700 text-xs">
                  {modalForm.prefix}
                  {modalForm.nomorUrut || "xxx"}
                  {modalForm.unit}
                  {modalForm.bulanRomawi}/
                  {modalForm.tahun}
                </span>
              </div>

              {/* Tanggal Memo & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">
                    Tanggal Memo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={modalForm.tanggalMemo}
                    onChange={(e) => {
                      const val = e.target.value;
                      const rom = getMonthRoman(val) || modalForm.bulanRomawi;
                      setModalForm((prev) => ({ ...prev, tanggalMemo: val, bulanRomawi: rom }));
                    }}
                    className="input-human w-full h-9 px-3 font-medium cursor-pointer"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Status</label>
                  <select
                    value={modalForm.status}
                    onChange={(e) => setModalForm((prev) => ({ ...prev, status: e.target.value }))}
                    className="input-human w-full h-9 px-3 font-semibold text-slate-900 cursor-pointer bg-white"
                  >
                    <option value="TERPAKAI">TERPAKAI</option>
                    <option value="TERSEDIA">TERSEDIA / KOSONG</option>
                    <option value="BATAL">BATAL</option>
                  </select>
                </div>
              </div>

              {/* Perihal / Uraian Kegiatan */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800">
                  Perihal / Uraian Nota Dinas <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={modalForm.perihal}
                  onChange={(e) => setModalForm((prev) => ({ ...prev, perihal: e.target.value }))}
                  placeholder="Contoh: Perjalanan Dinas dalam rangka Reviu Laporan Keuangan di..."
                  className="input-human w-full p-2.5 text-xs font-normal resize-none"
                  required
                />
              </div>

              {/* Pembebanan MAK */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800">Pembebanan Anggaran (MAK)</label>
                <select
                  value={modalForm.mak}
                  onChange={(e) => setModalForm((prev) => ({ ...prev, mak: e.target.value }))}
                  className="input-human w-full h-9 px-3 font-mono text-xs cursor-pointer bg-white"
                >
                  <option value="">-- Pilih MAK (Opsional) --</option>
                  {LIST_NOMOR_KOMPONEN.map((k) => (
                    <option key={k.kode} value={`${k.kode}.524111`}>
                      {k.kode}.524111 ({k.nama})
                    </option>
                  ))}
                  {modalForm.mak &&
                    !LIST_NOMOR_KOMPONEN.some((k) => `${k.kode}.524111` === modalForm.mak) && (
                      <option value={modalForm.mak}>{modalForm.mak} (Custom)</option>
                    )}
                </select>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-tactile px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-tactile px-4 py-2 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white font-semibold shadow-sm cursor-pointer"
                >
                  Simpan Nomor Memo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
