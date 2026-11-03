"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  AnggaranData,
  AnggaranRow,
  AnggaranRowType,
  loadAnggaranData,
  saveAnggaranData,
  resetAnggaranDataToDefault,
  recalculateTree,
  formatRupiah,
  formatPercent,
  exportAnggaranToExcel,
} from "@/lib/anggaranHelper";
import { CurrencyInput } from "./CurrencyInput";
import {
  TrendingUp,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Edit2,
  Trash2,
  Plus,
  RotateCcw,
  Download,
  Printer,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  Folder,
  Layers,
  Calendar,
  X,
  FileSpreadsheet,
  PieChart,
  Lock,
  ArrowUpDown,
} from "lucide-react";

export const MonitoringAnggaranTab: React.FC = () => {
  const [data, setData] = useState<AnggaranData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "524" | "521" | "522">("all");

  // Track expanded rows (Set of row IDs).
  // By default, all parent levels (Program, Kegiatan, KRO, RO, Komponen, SubKomponen) are expanded,
  // but Akun items (Level 8) are COLLAPSED as requested.
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Modal states
  const [editingRow, setEditingRow] = useState<AnggaranRow | null>(null);
  const [addingChildOf, setAddingChildOf] = useState<AnggaranRow | null>(null);
  const [deletingRow, setDeletingRow] = useState<AnggaranRow | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showEditMeta, setShowEditMeta] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states for Editing Row
  const [formUraian, setFormUraian] = useState("");
  const [formKode, setFormKode] = useState("");
  const [formPagu, setFormPagu] = useState(0);
  const [formLock, setFormLock] = useState(0);
  const [formRealLalu, setFormRealLalu] = useState(0);
  const [formRealIni, setFormRealIni] = useState(0);

  // Form states for Meta Editing
  const [formPeriode, setFormPeriode] = useState("");

  // Load data on mount
  useEffect(() => {
    const loaded = loadAnggaranData();
    setData(loaded);

    // Initialize expanded set: expand all levels < 7 (Program up to Subkomponen)
    // Keep Level 7 (Akun items) collapsed by default
    const defaultExpanded = new Set<string>();
    loaded.rows.forEach((r) => {
      if (r.level < 7) {
        defaultExpanded.add(r.id);
      }
    });
    setExpandedIds(defaultExpanded);
    setFormPeriode(loaded.meta.periode);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Toggle expand/collapse for a specific row
  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Expand all rows
  const handleExpandAll = () => {
    if (!data) return;
    const all = new Set<string>();
    data.rows.forEach((r) => all.add(r.id));
    setExpandedIds(all);
    showToast("Semua tingkatan dan rincian item dibuka.");
  };

  // Collapse all detail items (keep only up to Akun)
  const handleCollapseItems = () => {
    if (!data) return;
    const next = new Set<string>();
    data.rows.forEach((r) => {
      if (r.level < 7) next.add(r.id);
    });
    setExpandedIds(next);
    showToast("Semua rincian item ditutup (tampil s.d. Nomor MAK).");
  };

  // Grand total row
  const totalRow = useMemo(() => {
    if (!data) return null;
    return data.rows.find((r) => r.type === "total") || null;
  }, [data]);

  // Compute children count map
  const childrenMap = useMemo(() => {
    const map = new Map<string, AnggaranRow[]>();
    if (!data) return map;
    data.rows.forEach((r) => {
      if (r.parentId) {
        if (!map.has(r.parentId)) map.set(r.parentId, []);
        map.get(r.parentId)!.push(r);
      }
    });
    return map;
  }, [data]);

  // Map row by id
  const rowMap = useMemo(() => {
    const map = new Map<string, AnggaranRow>();
    if (!data) return map;
    data.rows.forEach((r) => map.set(r.id, r));
    return map;
  }, [data]);

  // Filtered rows
  const visibleRows = useMemo(() => {
    if (!data) return [];

    let rows = data.rows;

    // Apply quick filter on Akun codes
    if (selectedFilter !== "all") {
      const prefix = selectedFilter; // "524", "521", "522"
      // Find akuns that match
      const matchingAkunIds = new Set<string>();
      rows.forEach((r) => {
        if (r.type === "akun" && r.kode.startsWith(prefix)) {
          matchingAkunIds.add(r.id);
        }
      });

      // Find all ancestors and items of these akuns
      const allowedIds = new Set<string>();
      rows.forEach((r) => {
        if (matchingAkunIds.has(r.id)) {
          allowedIds.add(r.id);
          // add ancestors
          let curr: AnggaranRow | undefined = r;
          while (curr && curr.parentId) {
            allowedIds.add(curr.parentId);
            curr = rowMap.get(curr.parentId);
          }
        }
        // include items whose parent is in matching akuns
        if (r.type === "item" && r.parentId && matchingAkunIds.has(r.parentId)) {
          allowedIds.add(r.id);
        }
        // always include total
        if (r.type === "total") allowedIds.add(r.id);
      });

      rows = rows.filter((r) => allowedIds.has(r.id));
    }

    // Apply search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const directMatches = new Set<string>();
      rows.forEach((r) => {
        if (
          r.kode.toLowerCase().includes(q) ||
          r.uraian.toLowerCase().includes(q)
        ) {
          directMatches.add(r.id);
        }
      });

      // Include all ancestors of direct matches
      const searchAllowed = new Set<string>();
      rows.forEach((r) => {
        if (directMatches.has(r.id)) {
          searchAllowed.add(r.id);
          let curr: AnggaranRow | undefined = r;
          while (curr && curr.parentId) {
            searchAllowed.add(curr.parentId);
            curr = rowMap.get(curr.parentId);
          }
        }
        if (r.type === "total") searchAllowed.add(r.id);
      });

      rows = rows.filter((r) => searchAllowed.has(r.id));
    }

    // Now check accordion visibility:
    // A row is visible if all its ancestors are in expandedIds (or it has no parent).
    // Note: If searching, we auto-reveal matches so users don't have to manually hunt down parents.
    const isSearching = searchQuery.trim().length > 0;

    return rows.filter((r) => {
      if (r.type === "total") return true;
      if (isSearching) return true; // Show matching hierarchy during search

      let curr: AnggaranRow | undefined = r;
      while (curr && curr.parentId) {
        if (!expandedIds.has(curr.parentId)) {
          return false;
        }
        curr = rowMap.get(curr.parentId);
      }
      return true;
    });
  }, [data, selectedFilter, searchQuery, expandedIds, rowMap]);

  // Open Edit Modal
  const handleOpenEdit = (row: AnggaranRow) => {
    setEditingRow(row);
    setFormKode(row.kode);
    setFormUraian(row.uraian);
    setFormPagu(row.pagu);
    setFormLock(row.lock);
    setFormRealLalu(row.realLalu);
    setFormRealIni(row.realIni);
  };

  // Save Edit Row
  const handleSaveEdit = () => {
    if (!data || !editingRow) return;

    const updatedRows = data.rows.map((r) => {
      if (r.id === editingRow.id) {
        return {
          ...r,
          kode: formKode.trim(),
          uraian: formUraian.trim(),
          pagu: formPagu,
          lock: formLock,
          realLalu: formRealLalu,
          realIni: formRealIni,
        };
      }
      return r;
    });

    const recalculated = recalculateTree(updatedRows);
    const newData: AnggaranData = {
      ...data,
      rows: recalculated,
    };

    setData(newData);
    saveAnggaranData(newData);
    setEditingRow(null);
    showToast(`Baris [${formKode || editingRow.type}] berhasil diperbarui dan direkalkulasi.`);
  };

  // Open Add Child Modal
  const handleOpenAddChild = (parentRow: AnggaranRow) => {
    setAddingChildOf(parentRow);
    setFormKode("");
    setFormUraian("");
    setFormPagu(0);
    setFormLock(0);
    setFormRealLalu(0);
    setFormRealIni(0);
  };

  // Save Add Child Row
  const handleSaveAddChild = () => {
    if (!data || !addingChildOf) return;

    // Determine type of new row
    let newType: AnggaranRowType = "item";
    let newLevel = 8;
    if (addingChildOf.type === "komponen") {
      newType = "subkomponen";
      newLevel = 6;
    } else if (addingChildOf.type === "subkomponen") {
      newType = "akun";
      newLevel = 7;
    } else if (addingChildOf.type === "akun") {
      newType = "item";
      newLevel = 8;
    }

    const newId = `row-custom-${Date.now()}`;
    const newRow: AnggaranRow = {
      id: newId,
      level: newLevel,
      type: newType,
      kode: formKode.trim(),
      uraian: formUraian.trim() || `Item Baru ${formKode}`,
      pagu: formPagu,
      lock: formLock,
      realLalu: formRealLalu,
      realIni: formRealIni,
      realSd: formRealLalu + formRealIni,
      persen: formPagu > 0 ? ((formRealLalu + formRealIni) / formPagu) * 100 : 0,
      sisa: formPagu - formLock - (formRealLalu + formRealIni),
      parentId: addingChildOf.id,
    };

    // Insert new row directly below the parent (or below its last child)
    const currentRows = [...data.rows];
    const parentIndex = currentRows.findIndex((r) => r.id === addingChildOf.id);
    // Find where children end
    let insertIndex = parentIndex + 1;
    while (
      insertIndex < currentRows.length &&
      currentRows[insertIndex].level > addingChildOf.level
    ) {
      insertIndex++;
    }
    currentRows.splice(insertIndex, 0, newRow);

    const recalculated = recalculateTree(currentRows);
    const newData: AnggaranData = {
      ...data,
      rows: recalculated,
    };

    setData(newData);
    saveAnggaranData(newData);
    // Ensure parent is expanded
    setExpandedIds((prev) => new Set([...prev, addingChildOf.id]));
    setAddingChildOf(null);
    showToast(`Berhasil menambahkan baris baru ke dalam [${addingChildOf.kode || addingChildOf.type}].`);
  };

  // Confirm Delete Row
  const handleConfirmDelete = () => {
    if (!data || !deletingRow) return;

    // Collect all descendant IDs to cascade delete
    const toDeleteIds = new Set<string>([deletingRow.id]);
    let added = true;
    while (added) {
      added = false;
      data.rows.forEach((r) => {
        if (r.parentId && toDeleteIds.has(r.parentId) && !toDeleteIds.has(r.id)) {
          toDeleteIds.add(r.id);
          added = true;
        }
      });
    }

    const remainingRows = data.rows.filter((r) => !toDeleteIds.has(r.id));
    const recalculated = recalculateTree(remainingRows);
    const newData: AnggaranData = {
      ...data,
      rows: recalculated,
    };

    setData(newData);
    saveAnggaranData(newData);
    setDeletingRow(null);
    showToast(`Baris berhasil dihapus beserta sub-rinciannya.`);
  };

  // Reset to Baseline Excel
  const handleResetToBaseline = () => {
    const baseline = resetAnggaranDataToDefault();
    setData(baseline);
    const defaultExpanded = new Set<string>();
    baseline.rows.forEach((r) => {
      if (r.level < 7) defaultExpanded.add(r.id);
    });
    setExpandedIds(defaultExpanded);
    setShowResetConfirm(false);
    showToast("Data anggaran berhasil di-reset kembali ke data awal file Excel.");
  };

  // Save Meta Periode
  const handleSaveMeta = () => {
    if (!data) return;
    const newData: AnggaranData = {
      ...data,
      meta: {
        ...data.meta,
        periode: formPeriode.trim() || data.meta.periode,
      },
    };
    setData(newData);
    saveAnggaranData(newData);
    setShowEditMeta(false);
    showToast("Periode anggaran berhasil diperbarui.");
  };

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 text-white shadow-2xl text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Card (Official Government Style) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Kop Atas */}
        <div className="px-6 py-5 border-b border-slate-200/80 dark:border-slate-800 bg-linear-to-r from-blue-50/50 via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-100/80 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[11px] font-bold tracking-wide uppercase">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Sistem Akuntansi Instansi (SAKTI) • BAS 16 Segmen</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {data.meta.judul}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {data.meta.subjudul}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            {/* Edit Periode Button */}
            <button
              type="button"
              onClick={() => setShowEditMeta(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="Ubah Periode Laporan"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Periode: {data.meta.periode}</span>
              <Edit2 className="w-3 h-3 text-slate-400" />
            </button>

            {/* Export Excel Button */}
            <button
              type="button"
              onClick={() => exportAnggaranToExcel(data)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
              title="Unduh format Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Ekspor Excel</span>
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer shadow-2xs no-print"
              title="Cetak Laporan"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Cetak</span>
            </button>

            {/* Reset Button */}
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-bold transition-all cursor-pointer border border-rose-200 dark:border-rose-900"
              title="Kembalikan data ke awal dari file Excel"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Baseline</span>
            </button>
          </div>
        </div>

        {/* Info Lembaga & Satker Details Bar */}
        <div className="px-6 py-3 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] grid grid-cols-1 sm:grid-cols-3 gap-3 border-b border-slate-200/60 dark:border-slate-800">
          <div>
            <span className="text-slate-400 block font-medium">Kementerian:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              [{data.meta.kementerianKode}] {data.meta.kementerianNama}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Unit Organisasi:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              [{data.meta.unitOrganisasiKode}] {data.meta.unitOrganisasiNama}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Satuan Kerja (Satker):</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              [{data.meta.satkerKode}] {data.meta.satkerNama}
            </span>
          </div>
        </div>

        {/* Cards KPI / Ringkasan Realisasi */}
        {totalRow && (
          <div className="p-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {/* Total Pagu */}
            <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/60">
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
                Total Pagu Revisi
              </span>
              <p className="text-lg sm:text-xl font-extrabold text-blue-950 dark:text-blue-100 mt-1">
                {formatRupiah(totalRow.pagu)}
              </p>
              <span className="text-[10px] text-blue-500 font-medium mt-0.5 block">
                DIPA TA 2026 Kemenko Pangan
              </span>
            </div>

            {/* Realisasi Periode Lalu */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Periode Lalu
              </span>
              <p className="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-slate-200 mt-1">
                {formatRupiah(totalRow.realLalu)}
              </p>
              <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
                Realisasi s.d. Bulan Agustus
              </span>
            </div>

            {/* Realisasi Periode Ini */}
            <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60">
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                Bulan Ini ({data.meta.periode.split(" ")[0]})
              </span>
              <p className="text-lg sm:text-xl font-extrabold text-amber-950 dark:text-amber-100 mt-1">
                {formatRupiah(totalRow.realIni)}
              </p>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-0.5 block">
                Realisasi berjalan
              </span>
            </div>

            {/* Total Realisasi & % Serapan */}
            <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/60">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                  Total Realisasi
                </span>
                <span className="text-xs font-black px-1.5 py-0.5 rounded-full bg-emerald-200/80 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                  {formatPercent(totalRow.persen)}
                </span>
              </div>
              <p className="text-lg sm:text-xl font-extrabold text-emerald-950 dark:text-emerald-100 mt-1">
                {formatRupiah(totalRow.realSd)}
              </p>
              {/* Progress Bar */}
              <div className="w-full bg-emerald-200/60 dark:bg-emerald-950 h-2 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, totalRow.persen > 1 ? totalRow.persen : totalRow.persen * 100))}%` }}
                />
              </div>
            </div>

            {/* Sisa Anggaran */}
            <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 col-span-2 md:col-span-4 lg:col-span-1">
              <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block">
                Sisa Anggaran
              </span>
              <p className="text-lg sm:text-xl font-extrabold text-indigo-950 dark:text-indigo-100 mt-1">
                {formatRupiah(totalRow.sisa)}
              </p>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium mt-0.5 block">
                Ketersediaan dana efektif
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Action Bar & Quick Filter Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode MAK, komponen, MBG, perdin, dll..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-100/80 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 border border-transparent dark:border-slate-700 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setSelectedFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedFilter === "all"
                ? "bg-blue-600 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            Semua Akun
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter("524")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedFilter === "524"
                ? "bg-blue-600 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            <span>Perjalanan Dinas (524xxx)</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter("521")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedFilter === "521"
                ? "bg-blue-600 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            Bahan &amp; Honor (521xxx)
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter("522")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedFilter === "522"
                ? "bg-blue-600 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            Sewa &amp; Jasa (522xxx)
          </button>
        </div>

        {/* Expand / Collapse All Accordion Controls */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <button
            type="button"
            onClick={handleExpandAll}
            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-semibold transition-all cursor-pointer"
            title="Buka semua tingkatan hingga ke item belanja terdalam"
          >
            Buka Semua Item
          </button>
          <button
            type="button"
            onClick={handleCollapseItems}
            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-semibold transition-all cursor-pointer"
            title="Tutup rincian item belanja (tampilkan hanya sampai akun MAK)"
          >
            Tutup Rincian Item
          </button>
        </div>
      </div>

      {/* Main Table: Hierarchical Official Report (SAKTI Format) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[10.5px] font-bold">
                <th className="py-3 px-4 min-w-[340px]">Uraian &amp; Bagan Akun Standar (BAS)</th>
                <th className="py-3 px-3 text-right min-w-[125px]">Pagu Revisi</th>
                <th className="py-3 px-2 text-right min-w-[85px]">Lock Pagu</th>
                <th className="py-3 px-3 text-right min-w-[120px]">Periode Lalu</th>
                <th className="py-3 px-3 text-right min-w-[110px]">Periode Ini</th>
                <th className="py-3 px-3 text-right min-w-[125px]">s.d. Periode</th>
                <th className="py-3 px-2 text-right min-w-[65px]">%</th>
                <th className="py-3 px-3 text-right min-w-[125px]">Sisa Anggaran</th>
                <th className="py-3 px-3 text-center min-w-[90px] no-print">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
              {visibleRows.map((row) => {
                const hasChildren = (childrenMap.get(row.id)?.length || 0) > 0;
                const isExpanded = expandedIds.has(row.id);
                const childrenCount = childrenMap.get(row.id)?.length || 0;

                // Level-specific styles and badges
                let rowBg = "hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors";
                let fontStyle = "text-slate-800 dark:text-slate-200";
                let badgeColor = "";

                if (row.type === "total") {
                  rowBg = "bg-blue-100/70 dark:bg-blue-950/60 font-black text-blue-900 dark:text-blue-200 border-y-2 border-blue-300 dark:border-blue-800";
                } else if (row.type === "program") {
                  rowBg = "bg-slate-100/70 dark:bg-slate-800/60 font-bold text-slate-900 dark:text-white";
                  badgeColor = "bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300";
                } else if (row.type === "kegiatan") {
                  rowBg = "bg-slate-50 dark:bg-slate-800/40 font-bold text-slate-900 dark:text-white";
                  badgeColor = "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300";
                } else if (row.type === "kro") {
                  rowBg = "bg-white dark:bg-slate-900 font-semibold text-slate-800 dark:text-slate-200";
                  badgeColor = "bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-300";
                } else if (row.type === "ro") {
                  rowBg = "bg-white dark:bg-slate-900 font-semibold text-slate-800 dark:text-slate-200";
                  badgeColor = "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/60 dark:text-cyan-300";
                } else if (row.type === "komponen") {
                  rowBg = "bg-emerald-50/40 dark:bg-emerald-950/20 font-bold text-emerald-950 dark:text-emerald-200";
                  badgeColor = "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300";
                } else if (row.type === "subkomponen") {
                  rowBg = "bg-slate-50/60 dark:bg-slate-800/30 font-semibold text-slate-800 dark:text-slate-200";
                  badgeColor = "bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300";
                } else if (row.type === "akun") {
                  rowBg = "bg-white dark:bg-slate-900 font-medium text-slate-900 dark:text-slate-100";
                  badgeColor = "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300";
                } else if (row.type === "item") {
                  rowBg = "bg-white/50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 text-[11.5px]";
                  badgeColor = "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
                }

                // Indentation in px
                const indentPx = (row.level - 1) * 22;

                const isDeficit = row.sisa < 0;

                return (
                  <tr key={row.id} className={`${rowBg} ${fontStyle}`}>
                    {/* Uraian with Accordion Caret */}
                    <td className="py-2 px-3">
                      <div
                        className="flex items-center gap-1.5"
                        style={{ paddingLeft: `${Math.max(0, indentPx)}px` }}
                      >
                        {/* Caret Button for Parents */}
                        {hasChildren ? (
                          <button
                            type="button"
                            onClick={() => toggleExpand(row.id)}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 cursor-pointer transition-all shrink-0"
                            title={isExpanded ? "Tutup rincian" : "Buka rincian"}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </button>
                        ) : (
                          <span className="w-5 shrink-0" />
                        )}

                        {/* Code Badge */}
                        {row.kode && (
                          <span
                            className={`px-1.5 py-0.5 rounded-md font-mono text-[10.5px] font-bold shrink-0 ${badgeColor}`}
                          >
                            {row.kode}
                          </span>
                        )}

                        {/* Title / Uraian */}
                        <span className="truncate max-w-[420px]" title={row.uraian}>
                          {row.uraian}
                        </span>

                        {/* Child count chip on Akun rows */}
                        {row.type === "akun" && childrenCount > 0 && (
                          <button
                            type="button"
                            onClick={() => toggleExpand(row.id)}
                            className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                              isExpanded
                                ? "bg-blue-600 text-white"
                                : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300 hover:bg-blue-100 hover:text-blue-700"
                            }`}
                            title={isExpanded ? "Klik untuk tutup rincian item" : "Klik untuk buka rincian item"}
                          >
                            {isExpanded ? `▼ ${childrenCount} Item` : `▶ ${childrenCount} Item`}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Pagu Revisi */}
                    <td className="py-2 px-3 text-right font-mono">
                      {formatRupiah(row.pagu)}
                    </td>

                    {/* Lock Pagu */}
                    <td className="py-2 px-2 text-right font-mono text-slate-400">
                      {row.lock > 0 ? formatRupiah(row.lock) : "-"}
                    </td>

                    {/* Periode Lalu */}
                    <td className="py-2 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                      {formatRupiah(row.realLalu)}
                    </td>

                    {/* Periode Ini */}
                    <td className="py-2 px-3 text-right font-mono text-amber-600 dark:text-amber-400 font-semibold">
                      {row.realIni > 0 ? formatRupiah(row.realIni) : "-"}
                    </td>

                    {/* s.d. Periode */}
                    <td className="py-2 px-3 text-right font-mono font-bold">
                      {formatRupiah(row.realSd)}
                    </td>

                    {/* % */}
                    <td className="py-2 px-2 text-right font-mono">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10.5px] font-bold ${
                          row.persen >= 90
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                            : row.persen >= 50
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {formatPercent(row.persen)}
                      </span>
                    </td>

                    {/* Sisa Anggaran */}
                    <td
                      className={`py-2 px-3 text-right font-mono font-bold ${
                        isDeficit
                          ? "text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20"
                          : "text-slate-900 dark:text-slate-100"
                      }`}
                    >
                      {formatRupiah(row.sisa)}
                    </td>

                    {/* Actions */}
                    <td className="py-2 px-2 text-center no-print">
                      <div className="flex items-center justify-center gap-1">
                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(row)}
                          className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-all cursor-pointer"
                          title="Edit Nilai / Uraian"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Add Child (available for Komponen, SubKomponen, Akun) */}
                        {(row.type === "komponen" ||
                          row.type === "subkomponen" ||
                          row.type === "akun") && (
                          <button
                            type="button"
                            onClick={() => handleOpenAddChild(row)}
                            className="p-1 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-all cursor-pointer"
                            title="Tambah Rincian di Bawah Baris Ini"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Delete Button (only for item or custom rows, protect top structure) */}
                        {(row.type === "item" || row.id.includes("custom")) && (
                          <button
                            type="button"
                            onClick={() => setDeletingRow(row)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-all cursor-pointer"
                            title="Hapus Rincian Item Ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: EDIT ROW */}
      {editingRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Edit Data Baris Anggaran
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingRow(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Tipe &amp; Kode Segmen
                </span>
                <div className="flex gap-2">
                  <span className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 uppercase">
                    {editingRow.type}
                  </span>
                  <input
                    type="text"
                    value={formKode}
                    onChange={(e) => setFormKode(e.target.value)}
                    placeholder="Kode (contoh: 524111 / 009905)"
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Uraian Segmen / Item Belanja
                </span>
                <textarea
                  rows={2}
                  value={formUraian}
                  onChange={(e) => setFormUraian(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">
                    Pagu Revisi (Rp)
                  </label>
                  <CurrencyInput
                    value={formPagu}
                    onChange={setFormPagu}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">
                    Lock Pagu (Rp)
                  </label>
                  <CurrencyInput
                    value={formLock}
                    onChange={setFormLock}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">
                    Realisasi Periode Lalu (Rp)
                  </label>
                  <CurrencyInput
                    value={formRealLalu}
                    onChange={setFormRealLalu}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-amber-600 block mb-1">
                    Realisasi Bulan Ini (Rp)
                  </label>
                  <CurrencyInput
                    value={formRealIni}
                    onChange={setFormRealIni}
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1 text-[11.5px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Realisasi s.d. Bulan Ini:</span>
                  <span className="font-mono font-bold">
                    {formatRupiah(formRealLalu + formRealIni)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Persentase Serapan:</span>
                  <span className="font-mono font-bold text-blue-600">
                    {formatPercent(
                      formPagu > 0 ? ((formRealLalu + formRealIni) / formPagu) * 100 : 0
                    )}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Sisa Anggaran:
                  </span>
                  <span
                    className={`font-mono font-black ${
                      formPagu - formLock - (formRealLalu + formRealIni) < 0
                        ? "text-rose-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {formatRupiah(formPagu - formLock - (formRealLalu + formRealIni))}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingRow(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs cursor-pointer"
              >
                Simpan &amp; Rekalkulasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: TAMBAH RINCIAN BARU */}
      {addingChildOf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Tambah Rincian Anggaran Baru
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAddingChildOf(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
              <span>Parent: </span>
              <strong className="font-mono">[{addingChildOf.kode}]</strong> {addingChildOf.uraian}
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  Kode Item / Akun
                </label>
                <input
                  type="text"
                  value={formKode}
                  onChange={(e) => setFormKode(e.target.value)}
                  placeholder="Contoh: 009999 atau 524111"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  Uraian Rincian Kegiatan
                </label>
                <textarea
                  rows={2}
                  value={formUraian}
                  onChange={(e) => setFormUraian(e.target.value)}
                  placeholder="Uraian rincian kegiatan atau item pengeluaran..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">
                    Pagu Anggaran (Rp)
                  </label>
                  <CurrencyInput
                    value={formPagu}
                    onChange={setFormPagu}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-amber-600 block mb-1">
                    Realisasi Bulan Ini (Rp)
                  </label>
                  <CurrencyInput
                    value={formRealIni}
                    onChange={setFormRealIni}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setAddingChildOf(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveAddChild}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs cursor-pointer"
              >
                Tambahkan Rincian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: KONFIRMASI HAPUS */}
      {deletingRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Hapus Baris Anggaran?
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Apakah Anda yakin ingin menghapus{" "}
              <strong>[{deletingRow.kode}] {deletingRow.uraian}</strong>?
              Seluruh sub-rincian di dalamnya juga akan terhapus dan angka total akan otomatis disesuaikan.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingRow(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-2xs cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: KONFIRMASI RESET BASELINE */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center gap-2 text-amber-600">
              <RotateCcw className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Reset ke Data Awal Excel?
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Semua perubahan, penambahan item, dan pengeditan angka yang pernah Anda lakukan akan diganti kembali dengan data murni dari file <code>Laporan_Realisasi_16 Segmen.xlsx</code>.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleResetToBaseline}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-2xs cursor-pointer"
              >
                Reset Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: EDIT PERIODE */}
      {showEditMeta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600 shrink-0" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Ubah Periode Laporan
              </h3>
            </div>
            <div className="space-y-2 text-xs">
              <label className="text-[11px] font-bold text-slate-500 block">
                Nama Periode (Bulan &amp; Tahun)
              </label>
              <input
                type="text"
                value={formPeriode}
                onChange={(e) => setFormPeriode(e.target.value)}
                placeholder="Contoh: September 2026 atau Triwulan III 2026"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowEditMeta(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveMeta}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs cursor-pointer"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

