"use client";

import React, { useState, useEffect, useMemo } from "react";
import { NomorMemo, SavedKegiatan } from "@/lib/types";
import {
  formatMemoDate,
  extractMemoSeqNumber,
  getCustomMemoList,
  saveCustomMemo,
  mergeAndSortMemoList,
  exportMemoListToExcel,
} from "@/lib/memoHelper";
import { getSavedKegiatanList } from "@/lib/kegiatanHelper";
import { deleteMemoFromGoogleSheet } from "@/lib/googleSheetsService";
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
  CheckCircle2,
  Clock,
  Calendar,
  Edit3,
  Trash2,
  AlertTriangle,
  Table,
  LayoutGrid,
  X,
  BookmarkCheck,
  ArrowRight,
  Coins,
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
  const [deleteTargetMemo, setDeleteTargetMemo] = useState<{
    memo: NomorMemo;
    formatLengkap: string;
    judul: string;
    linkedKegiatan?: SavedKegiatan;
  } | null>(null);
  const [isDeletingMemo, setIsDeletingMemo] = useState<boolean>(false);
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

  // Hydrate custom memos & saved kegiatan
  useEffect(() => {
    const handleUpdate = () => {
      try {
        setCustomList(getCustomMemoList());
        setSavedKegiatanList(getSavedKegiatanList());
      } catch {
        // ignore
      }
    };

    handleUpdate();
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

  // Map kegiatan by nomor memo and ID Kegiatan for reliable cross-referencing
  const kegiatanByMemoMap = useMemo(() => {
    const map = new Map<string, SavedKegiatan>();
    for (const k of savedKegiatanList) {
      if (k.idKegiatan) {
        map.set(`id-${k.idKegiatan.toLowerCase()}`, k);
      }
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

  const resolveLinkedKegiatan = useMemo(() => {
    return (m: NomorMemo, seq: number, formatLower: string): SavedKegiatan | undefined => {
      return (
        kegiatanByMemoMap.get(formatLower) ||
        (seq > 0 ? kegiatanByMemoMap.get(`seq-${seq}`) : undefined) ||
        (m.id_kegiatan_ref ? kegiatanByMemoMap.get(`id-${m.id_kegiatan_ref.toLowerCase()}`) : undefined)
      );
    };
  }, [kegiatanByMemoMap]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = fullMemoList.length;
    let terpakaiCount = 0;
    let maxSeq = 0;
    let latestMemoStr = "";
    let totalBiaya = 0;

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

      const format = (m.format_lengkap || m.noMemo || `M.${seq}`).toLowerCase();
      const linked = resolveLinkedKegiatan(m, seq, format);
      const rawNom = m.nominal ? Number(String(m.nominal).replace(/\D/g, "")) : (linked?.grandTotal || 0);
      if (!isNaN(rawNom) && rawNom > 0) {
        totalBiaya += rawNom;
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
      totalBiaya,
      maxSeq,
      latestMemoStr: latestMemoStr || `M.320/INS/PPK/XI/2026`,
      nextSeq,
      nextMemoStr,
    };
  }, [fullMemoList, resolveLinkedKegiatan]);

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
      const linked = resolveLinkedKegiatan(m, seq, format);
      const judulKegiatan = (
        linked?.namaKegiatan ||
        linked?.header?.keteranganKegiatan ||
        ""
      ).toLowerCase();

      // Search term
      if (term) {
        const matchesTerm =
          format.includes(term) ||
          perihal.includes(term) ||
          judulKegiatan.includes(term) ||
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
      const hasSpj = Boolean(linked) || Boolean(m.id_kegiatan_ref);

      if (spjFilter === "WITH_SPJ" && !hasSpj) return false;
      if (spjFilter === "WITHOUT_SPJ" && hasSpj) return false;

      return true;
    });
  }, [fullMemoList, searchTerm, statusFilter, bulanFilter, spjFilter, resolveLinkedKegiatan]);

  // Total Biaya untuk entri yang sedang tampil (Filtered)
  const filteredTotalBiaya = useMemo(() => {
    return filteredList.reduce((acc, m) => {
      const seq = extractMemoSeqNumber(m);
      const format = (m.format_lengkap || m.noMemo || `M.${seq}`).toLowerCase();
      const linked = resolveLinkedKegiatan(m, seq, format);
      const rawNom = m.nominal ? Number(String(m.nominal).replace(/\D/g, "")) : (linked?.grandTotal || 0);
      return acc + (isNaN(rawNom) ? 0 : rawNom);
    }, 0);
  }, [filteredList, resolveLinkedKegiatan]);

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
    const rawNom = memo.nominal
      ? typeof memo.nominal === "number"
        ? memo.nominal
        : Number(String(memo.nominal).replace(/\D/g, ""))
      : 0;
    const format = (memo.format_lengkap || memo.noMemo || `M.${seq}`).toLowerCase();
    const linked = kegiatanByMemoMap.get(format) || (seq > 0 ? kegiatanByMemoMap.get(`seq-${seq}`) : undefined);
    const nominalToEdit = rawNom > 0 ? rawNom : (linked?.grandTotal || 0);

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
      nominal: nominalToEdit > 0 ? nominalToEdit.toLocaleString("id-ID") : "",
      status: memo.status || "TERPAKAI",
      idKegiatanRef: memo.id_kegiatan_ref || (linked?.idKegiatan || ""),
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

  const handleConfirmDeleteMemo = async () => {
    if (!deleteTargetMemo) return;
    const target = deleteTargetMemo;
    setIsDeletingMemo(true);
    try {
      const res = await deleteMemoFromGoogleSheet(
        target.formatLengkap,
        target.linkedKegiatan?.idKegiatan || target.memo.id_kegiatan_ref
      );
      setCustomList(getCustomMemoList());
      setToastMessage(
        res.success
          ? `Nomor memorandum ${target.formatLengkap} berhasil dihapus.`
          : `Nomor memorandum ${target.formatLengkap} dihapus dari tampilan lokal (${res.message}).`
      );
      if (onRefreshMemo) {
        await onRefreshMemo();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setToastMessage(`Gagal menghapus memo: ${msg}`);
    } finally {
      setIsDeletingMemo(false);
      setDeleteTargetMemo(null);
      setTimeout(() => setToastMessage(null), 3500);
    }
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
            className="p-1 rounded-lg text-slate-400 dark:text-slate-500 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
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
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
              <BookmarkCheck className="w-4 h-4" />
            </div>
            <h1 className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Daftar Memorandum Terdaftar
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onRefreshMemo && (
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="btn-tactile flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-medium cursor-pointer transition-all disabled:opacity-50"
                title="Sinkronkan dengan master database Google Sheets"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-slate-600" : "text-slate-500"}`} />
                <span>{isRefreshing ? "Menyinkronkan..." : "Sinkronisasi Cloud"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => exportMemoListToExcel(filteredList, "Buku_Kendali_Memorandum", kegiatanByMemoMap)}
              className="btn-tactile flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-medium cursor-pointer transition-all"
              title="Unduh seluruh daftar memorandum ke format Microsoft Excel (.xlsx)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ekspor Excel</span>
            </button>

            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="btn-tactile flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold cursor-pointer transition-all"
              title="Daftarkan entri nomor memorandum baru"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Daftarkan Nomor</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. COMPACT STATISTIK STRIP                                                */}
        {/* ========================================================================= */}
        <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/70 dark:divide-slate-800">
          <div className="px-3.5 py-2.5 space-y-0.5">
            <span className="text-[10.5px] font-medium text-slate-500 dark:text-slate-400 block">
              Total Register
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono">
                {stats.total}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">memo</span>
            </div>
          </div>

          <div className="px-3.5 py-2.5 space-y-0.5">
            <span className="text-[10.5px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-slate-400" />
              <span>Terpakai</span>
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono">
                {stats.terpakaiCount}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                ({stats.total > 0 ? Math.round((stats.terpakaiCount / stats.total) * 100) : 0}%)
              </span>
            </div>
          </div>

          <div className="px-3.5 py-2.5 space-y-0.5 col-span-2 sm:col-span-1">
            <span className="text-[10.5px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Coins className="w-3 h-3 text-slate-400" />
              <span>Total Biaya Terdata</span>
            </span>
            <span
              className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono block truncate"
              title={`Rp${stats.totalBiaya.toLocaleString("id-ID")}`}
            >
              Rp{stats.totalBiaya.toLocaleString("id-ID")}
            </span>
          </div>

          <div className="px-3.5 py-2.5 space-y-0.5">
            <span className="text-[10.5px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>Nomor Terakhir</span>
            </span>
            <span
              className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-mono block truncate"
              title={stats.latestMemoStr}
            >
              {stats.latestMemoStr}
            </span>
          </div>

          <div className="px-3.5 py-2.5 space-y-0.5">
            <span className="text-[10.5px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <ArrowRight className="w-3 h-3 text-slate-400" />
              <span>Nomor Berikutnya</span>
            </span>
            <div className="flex items-center justify-between gap-1 min-w-0">
              <span
                className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono truncate"
                title={stats.nextMemoStr}
              >
                {stats.nextMemoStr}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (onSelectMemo) onSelectMemo(stats.nextMemoStr);
                }}
                className="text-[11px] font-semibold text-[#0071e3] dark:text-blue-400 hover:underline cursor-pointer shrink-0"
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
      <section className="form-card p-3.5 space-y-2.5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nomor memo, judul kegiatan, perihal, ID KEG, atau MAK..."
              className="input-human w-full h-9 pl-9 pr-8 text-xs font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 dark:text-slate-500 hover:text-slate-600"
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
              className="input-human h-10 px-3 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer bg-white dark:bg-slate-900"
            >
              <option value="ALL">Semua Status ({fullMemoList.length})</option>
              <option value="TERPAKAI">Terpakai ({stats.terpakaiCount})</option>
              <option value="TERSEDIA">Tersedia ({stats.tersediaCount})</option>
            </select>

            {/* Filter Bulan Romawi */}
            <select
              value={bulanFilter}
              onChange={(e) => setBulanFilter(e.target.value)}
              className="input-human h-10 px-3 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer bg-white dark:bg-slate-900"
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
              className="input-human h-10 px-3 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer bg-white dark:bg-slate-900"
            >
              <option value="ALL">Semua Berkas</option>
              <option value="WITH_SPJ">Ada Berkas SPJ ({savedKegiatanList.length})</option>
              <option value="WITHOUT_SPJ">Belum Terhubung SPJ</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === "table" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100"
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
                  viewMode === "grid" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100"
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
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span>
              Menampilkan <strong className="text-slate-900 dark:text-slate-100 font-mono">{filteredList.length}</strong> dari {fullMemoList.length} entri memorandum
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
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 mx-auto flex items-center justify-center">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Tidak ada nomor memorandum yang cocok</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Coba ubah kata kunci pencarian atau sesuaikan filter status dan bulan di panel atas.
          </p>
        </div>
      ) : viewMode === "table" ? (
        /* -------------------------------------------------------------
           VIEW A: CLEAN 5-COLUMN SPREADSHEET VIEW (Wide Judul Kegiatan, Zero Pill Bloat)
           ------------------------------------------------------------- */
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/90 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10.5px] font-bold select-none">
                  <th className="py-2.5 px-3 text-center w-12">No</th>
                  <th className="py-2.5 px-3.5 w-60">Nomor Memo &amp; Dokumen</th>
                  <th className="py-2.5 px-3.5 min-w-[320px]">Judul Kegiatan &amp; Perihal</th>
                  <th className="py-2.5 px-3.5 text-right w-40">Biaya &amp; Status</th>
                  <th className="py-2.5 px-3.5 text-right w-32">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                {filteredList.map((memo, idx) => {
                  const seq = extractMemoSeqNumber(memo);
                  const formatLengkap = memo.format_lengkap || memo.noMemo || `M.${seq}/INS/PPK/XI/2026`;
                  const isCopied = copiedMemo === formatLengkap;
                  const tglDisplay = formatMemoDate(memo.tanggal_memo || memo.tanggal);
                  const isUsed = Boolean(
                    (memo.status && String(memo.status).toUpperCase().includes("TERPAKAI")) ||
                    (memo.perihal && String(memo.perihal).trim().length > 0) ||
                    (memo.id_kegiatan_ref && String(memo.id_kegiatan_ref).trim().length > 0)
                  );
                  const makDisplay = (memo.MAK || memo.mak || "").trim();

                  const linkedKegiatan = resolveLinkedKegiatan(memo, seq, formatLengkap.toLowerCase());
                  const judulKegiatan = (
                    linkedKegiatan?.namaKegiatan ||
                    linkedKegiatan?.header?.keteranganKegiatan ||
                    ""
                  ).trim();
                  const perihalText = (memo.perihal || "").trim();
                  const primaryTitle = judulKegiatan || perihalText;
                  const showSubPerihal =
                    Boolean(judulKegiatan) &&
                    Boolean(perihalText) &&
                    perihalText.toLowerCase() !== judulKegiatan.toLowerCase();

                  const rawNominal = memo.nominal
                    ? typeof memo.nominal === "number"
                      ? memo.nominal
                      : Number(String(memo.nominal).replace(/\D/g, ""))
                    : 0;
                  const nominalDisplay = rawNominal > 0 ? rawNominal : (linkedKegiatan?.grandTotal || 0);

                  return (
                    <tr
                      key={formatLengkap + idx}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors align-top group"
                    >
                      {/* No. Urut */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-400 dark:text-slate-500">
                        {seq > 0 ? seq : idx + 1}
                      </td>

                      {/* Nomor Memorandum, Tanggal, MAK, SPJ Ref */}
                      <td className="py-3 px-3.5 space-y-1 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <span className="font-mono font-bold text-[#0071e3] dark:text-blue-400 text-xs tracking-tight">
                            {formatLengkap}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyMemo(formatLengkap)}
                            className="p-1 rounded text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            title="Salin nomor memorandum ke clipboard"
                          >
                            {isCopied ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                          <Calendar className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
                          <span>{tglDisplay}</span>
                          {makDisplay && makDisplay !== "-" && (
                            <>
                              <span className="text-slate-300 dark:text-slate-700">·</span>
                              <span className="font-mono" title={`MAK: ${makDisplay}`}>
                                {makDisplay.length > 14 ? `MAK ${makDisplay.slice(-6)}` : `MAK ${makDisplay}`}
                              </span>
                            </>
                          )}
                        </div>

                        {linkedKegiatan && (
                          <button
                            type="button"
                            onClick={() => {
                              if (onLoadKegiatan) onLoadKegiatan(linkedKegiatan);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                            title={`Terhubung ke Berkas ${linkedKegiatan.idKegiatan}. Klik untuk membuka di editor.`}
                          >
                            <CheckCircle2 className="w-3 h-3 shrink-0" />
                            <span className="font-mono">{linkedKegiatan.idKegiatan}</span>
                          </button>
                        )}
                      </td>

                      {/* Judul Kegiatan & Perihal (Tampil Penuh, Bersih) */}
                      <td className="py-3 px-3.5 space-y-1 leading-snug">
                        {primaryTitle ? (
                          <>
                            <p className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                              {primaryTitle}
                            </p>
                            {showSubPerihal && (
                              <p className="text-[11.5px] text-slate-500 dark:text-slate-400">
                                {perihalText}
                              </p>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 italic text-xs">
                            Belum ada keterangan kegiatan / perihal
                          </span>
                        )}
                      </td>

                      {/* Biaya & Status */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap space-y-1">
                        {nominalDisplay > 0 ? (
                          <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs block">
                            Rp{nominalDisplay.toLocaleString("id-ID")}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 font-mono text-xs block">-</span>
                        )}
                        <span
                          className={`inline-flex items-center justify-end gap-1.5 text-[11px] font-semibold ${
                            isUsed
                              ? "text-emerald-700 dark:text-emerald-400"
                              : "text-slate-400 dark:text-slate-500"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isUsed ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
                            }`}
                          />
                          <span>{isUsed ? "Terpakai" : "Tersedia"}</span>
                        </span>
                      </td>

                      {/* Aksi Cepat */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {onSelectMemo && (
                            <button
                              type="button"
                              onClick={() => onSelectMemo(formatLengkap, memo.perihal)}
                              className="btn-tactile inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0071e3] hover:bg-[#0077ed] text-white text-[11px] font-semibold cursor-pointer"
                              title="Pilih nomor memorandum ini untuk pengajuan SPJ saat ini"
                            >
                              <span>Gunakan</span>
                            </button>
                          )}

                          {linkedKegiatan && onLoadKegiatan && (
                            <button
                              type="button"
                              onClick={() => onLoadKegiatan(linkedKegiatan)}
                              className="p-1.5 rounded-lg text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors cursor-pointer"
                              title="Buka Berkas SPJ ini di Kalkulator"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(memo)}
                            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Edit data nomor memo"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setDeleteTargetMemo({
                                memo,
                                formatLengkap,
                                judul: primaryTitle || perihalText || "Tanpa Keterangan",
                                linkedKegiatan,
                              })
                            }
                            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                            title="Hapus nomor memorandum ini dari Buku Kendali & MASTER_MEMO"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50/90 dark:bg-slate-800/70 border-t border-slate-200 dark:border-slate-800 font-sans text-xs">
                <tr>
                  <td colSpan={3} className="py-2.5 px-3.5 text-right font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                    Total Biaya Terdata ({filteredList.length} memo):
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-mono font-bold text-slate-900 dark:text-slate-100 text-xs whitespace-nowrap">
                    Rp{filteredTotalBiaya.toLocaleString("id-ID")}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : (
        /* -------------------------------------------------------------
           VIEW B: CLEAN CARD GRID VIEW
           ------------------------------------------------------------- */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredList.map((memo, idx) => {
            const seq = extractMemoSeqNumber(memo);
            const formatLengkap = memo.format_lengkap || memo.noMemo || `M.${seq}/INS/PPK/XI/2026`;
            const isCopied = copiedMemo === formatLengkap;
            const tglDisplay = formatMemoDate(memo.tanggal_memo || memo.tanggal);
            const isUsed = Boolean(
              (memo.status && String(memo.status).toUpperCase().includes("TERPAKAI")) ||
              (memo.perihal && String(memo.perihal).trim().length > 0) ||
              (memo.id_kegiatan_ref && String(memo.id_kegiatan_ref).trim().length > 0)
            );
            const makDisplay = (memo.MAK || memo.mak || "").trim();

            const linkedKegiatan = resolveLinkedKegiatan(memo, seq, formatLengkap.toLowerCase());
            const judulKegiatan = (
              linkedKegiatan?.namaKegiatan ||
              linkedKegiatan?.header?.keteranganKegiatan ||
              ""
            ).trim();
            const perihalText = (memo.perihal || "").trim();
            const primaryTitle = judulKegiatan || perihalText;
            const showSubPerihal =
              Boolean(judulKegiatan) &&
              Boolean(perihalText) &&
              perihalText.toLowerCase() !== judulKegiatan.toLowerCase();

            const rawNominal = memo.nominal
              ? typeof memo.nominal === "number"
                ? memo.nominal
                : Number(String(memo.nominal).replace(/\D/g, ""))
              : 0;
            const nominalDisplay = rawNominal > 0 ? rawNominal : (linkedKegiatan?.grandTotal || 0);

            return (
              <div
                key={formatLengkap + idx}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2.5 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-mono font-bold text-[#0071e3] dark:text-blue-400 text-xs">
                          {formatLengkap}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyMemo(formatLengkap)}
                          className="p-1 rounded text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                          title="Salin nomor memo"
                        >
                          {isCopied ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{tglDisplay}</span>
                        </span>
                        {makDisplay && makDisplay !== "-" && (
                          <span className="font-mono">· MAK {makDisplay}</span>
                        )}
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                        isUsed ? "text-emerald-700 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isUsed ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
                        }`}
                      />
                      <span>{isUsed ? "Terpakai" : "Tersedia"}</span>
                    </span>
                  </div>

                  {/* Judul Kegiatan & Perihal (Penuh, Clean) */}
                  <div className="space-y-1 pt-1">
                    {primaryTitle ? (
                      <>
                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                          {primaryTitle}
                        </p>
                        {showSubPerihal && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                            {perihalText}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-slate-400 italic">Belum ada perihal</p>
                    )}
                  </div>

                  {/* Biaya & Linked SPJ Row */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {nominalDisplay > 0 ? `Rp${nominalDisplay.toLocaleString("id-ID")}` : "-"}
                    </span>
                    {linkedKegiatan && (
                      <button
                        type="button"
                        onClick={() => {
                          if (onLoadKegiatan) onLoadKegiatan(linkedKegiatan);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span className="font-mono">{linkedKegiatan.idKegiatan}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(memo)}
                      className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setDeleteTargetMemo({
                          memo,
                          formatLengkap,
                          judul: primaryTitle || perihalText || "Tanpa Keterangan",
                          linkedKegiatan,
                        })
                      }
                      className="text-[11px] text-slate-400 dark:text-slate-500 hover:text-rose-600 font-medium flex items-center gap-1 cursor-pointer"
                      title="Hapus nomor memorandum"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Hapus</span>
                    </button>
                  </div>

                  {onSelectMemo && (
                    <button
                      type="button"
                      onClick={() => onSelectMemo(formatLengkap, memo.perihal)}
                      className="btn-tactile inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold cursor-pointer"
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="p-4 md:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#0071e3] flex items-center justify-center font-bold">
                  <BookmarkCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {editingMemo ? "Edit Data Nomor Memorandum" : "Daftarkan Nomor Memorandum Baru"}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {editingMemo ? "Perbarui informasi pada register buku kendali" : "Tambahkan nomor urut baru ke register master"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveModalForm} className="p-4 md:p-5 space-y-4 text-xs">
              {/* Nomor Urut & Format */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    Nomor Urut Angka <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={modalForm.nomorUrut}
                    onChange={(e) => setModalForm((prev) => ({ ...prev, nomorUrut: e.target.value }))}
                    placeholder="321"
                    className="input-human w-full h-9 px-3 font-mono font-bold text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 dark:text-slate-200">Bulan Romawi</label>
                  <select
                    value={modalForm.bulanRomawi}
                    onChange={(e) => setModalForm((prev) => ({ ...prev, bulanRomawi: e.target.value }))}
                    className="input-human w-full h-9 px-3 font-mono font-semibold text-slate-900 dark:text-slate-100 cursor-pointer bg-white dark:bg-slate-900"
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
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Format Lengkap Resmi:</span>
                <span className="font-mono font-bold text-blue-700 dark:text-blue-300 text-xs">
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
                  <label className="font-bold text-slate-800 dark:text-slate-200">
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
                  <label className="font-bold text-slate-800 dark:text-slate-200">Status</label>
                  <select
                    value={modalForm.status}
                    onChange={(e) => setModalForm((prev) => ({ ...prev, status: e.target.value }))}
                    className="input-human w-full h-9 px-3 font-semibold text-slate-900 dark:text-slate-100 cursor-pointer bg-white dark:bg-slate-900"
                  >
                    <option value="TERPAKAI">TERPAKAI</option>
                    <option value="TERSEDIA">TERSEDIA / KOSONG</option>
                    <option value="BATAL">BATAL</option>
                  </select>
                </div>
              </div>

              {/* Perihal / Uraian Kegiatan */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800 dark:text-slate-200">
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

              {/* Pembebanan MAK & Nominal Biaya */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800 dark:text-slate-200">Pembebanan Anggaran (MAK)</label>
                  <select
                    value={modalForm.mak}
                    onChange={(e) => setModalForm((prev) => ({ ...prev, mak: e.target.value }))}
                    className="input-human w-full h-9 px-3 font-mono text-xs cursor-pointer bg-white dark:bg-slate-900"
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

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 dark:text-slate-200">Biaya / Nominal Pengajuan (Rp)</label>
                  <input
                    type="text"
                    value={modalForm.nominal}
                    onChange={(e) => {
                      const num = e.target.value.replace(/\D/g, "");
                      const formatted = num ? Number(num).toLocaleString("id-ID") : "";
                      setModalForm((prev) => ({ ...prev, nominal: formatted }));
                    }}
                    placeholder="Contoh: 15.000.000"
                    className="input-human w-full h-9 px-3 font-mono text-xs font-bold text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-tactile px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
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

      {/* ========================================================================= */}
      {/* 6. MODAL KONFIRMASI HAPUS NOMOR MEMORANDUM                                */}
      {/* ========================================================================= */}
      {deleteTargetMemo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3.5 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Hapus Nomor Memorandum?
                </h3>
                <p className="text-xs font-mono font-bold text-[#0071e3] dark:text-blue-400">
                  {deleteTargetMemo.formatLengkap}
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/70 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1.5">
              <p className="font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                {deleteTargetMemo.judul}
              </p>
              {deleteTargetMemo.linkedKegiatan ? (
                <p className="text-[11px] text-amber-700 dark:text-amber-300">
                  Catatan: Memo ini terhubung dengan berkas{" "}
                  <strong className="font-mono">{deleteTargetMemo.linkedKegiatan.idKegiatan}</strong>. Menghapus entri ini hanya menghapus nomor memo dari Buku Kendali &amp; MASTER_MEMO (berkas SPJ di Daftar Kegiatan tetap ada).
                </p>
              ) : (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Nomor memorandum ini tidak terhubung dengan berkas SPJ aktif dan akan dihapus permanen dari Buku Kendali &amp; sheet MASTER_MEMO.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                disabled={isDeletingMemo}
                onClick={() => setDeleteTargetMemo(null)}
                className="btn-tactile px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeletingMemo}
                onClick={handleConfirmDeleteMemo}
                className="btn-tactile px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer shadow-sm disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {isDeletingMemo && <RotateCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{isDeletingMemo ? "Menghapus..." : "Ya, Hapus Memo"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

