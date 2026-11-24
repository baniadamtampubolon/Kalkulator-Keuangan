"use client";

import React, { useState, useEffect, useMemo } from "react";
import { SavedKegiatan, SpjDocType } from "@/lib/types";
import {
  getSavedKegiatanList,
  deleteKegiatanRecord,
  sortKegiatanByNewest,
} from "@/lib/kegiatanHelper";
import { getSpjTypeMeta } from "@/lib/pengadaanHelper";
import { fetchKegiatanFromSheet, deleteKegiatanFromGoogleSheet } from "@/lib/googleSheetsService";
import {
  Search,
  Plus,
  Calendar,
  MapPin,
  AlertTriangle,
  FolderOpen,
  CheckCircle2,
  X,
  RotateCw,
  Users,
  Coins,
  Briefcase,
  Edit3,
  Trash2,
  ArrowDownWideNarrow,
  UtensilsCrossed,
  Car,
  Mic,
  Package,
  Layers,
  FileText,
  Hash,
} from "lucide-react";

interface DaftarKegiatanTabProps {
  onEditKegiatan: (kegiatan: SavedKegiatan) => void;
  onCreateNewKegiatan: () => void;
  currentLoadedId?: string;
}

export const DaftarKegiatanTab: React.FC<DaftarKegiatanTabProps> = ({
  onEditKegiatan,
  onCreateNewKegiatan,
  currentLoadedId,
}) => {
  const [kegiatanList, setKegiatanList] = useState<SavedKegiatan[]>([]);

  useEffect(() => {
    Promise.resolve().then(() => {
      try {
        setKegiatanList(getSavedKegiatanList());
      } catch {
        // ignore
      }
    });
  }, []);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterSpjType, setFilterSpjType] = useState<"ALL" | SpjDocType>("ALL");
  const [filterKategori, setFilterKategori] = useState<"ALL" | "A" | "NA">("ALL");
  const [sortBy, setSortBy] = useState<"NEWEST" | "DATE_DESC" | "OLDEST" | "NAME_AZ">("NEWEST");
  const [isLoadingCloud, setIsLoadingCloud] = useState<boolean>(false);

  // Modal Delete State
  const [deleteTarget, setDeleteTarget] = useState<SavedKegiatan | null>(null);
  const [alsoDeleteMemo, setAlsoDeleteMemo] = useState<boolean>(true);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [notification, setNotification] = useState<{
    type: "success" | "info";
    message: string;
  } | null>(null);

  const syncWithCloud = async () => {
    setIsLoadingCloud(true);
    try {
      const res = await fetchKegiatanFromSheet();
      if (res.success && res.data) {
        setKegiatanList(sortKegiatanByNewest(res.data));
        setNotification({
          type: "success",
          message: `Berhasil menyinkronkan ${res.data.length} paket kegiatan dari Google Spreadsheet.`,
        });
      } else {
        setNotification({
          type: "info",
          message: res.message || "Gagal menyinkronkan data kegiatan dari cloud.",
        });
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setNotification({
        type: "info",
        message: `Gagal sinkronisasi: ${errMsg}`,
      });
    } finally {
      setIsLoadingCloud(false);
    }
  };

  // Load list & subscribe to events + auto-sync from cloud
  useEffect(() => {
    let isMounted = true;

    fetchKegiatanFromSheet()
      .then((res) => {
        if (isMounted) {
          if (res.success && res.data) {
            setKegiatanList(sortKegiatanByNewest(res.data));
          }
          setIsLoadingCloud(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoadingCloud(false);
      });

    const handleUpdate = () => {
      const updated = getSavedKegiatanList();
      if (isMounted) setKegiatanList(sortKegiatanByNewest(updated));
    };

    window.addEventListener("kegiatan-list-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener("kegiatan-list-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  // Format Date helper
  const formatDateIndo = (dStr: string) => {
    if (!dStr) return "—";
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return dStr;
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Filter & Sort activities (Default: selalu terurut dari kegiatan paling baru)
  const filteredList = useMemo(() => {
    const list = kegiatanList.filter((item) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        (item.namaKegiatan || "").toLowerCase().includes(term) ||
        (item.idKegiatan || "").toLowerCase().includes(term) ||
        (item.kotaTujuan || "").toLowerCase().includes(term) ||
        (item.provinsiTujuan || "").toLowerCase().includes(term) ||
        (item.header?.nomorStMaster || "").toLowerCase().includes(term) ||
        (item.header?.nomorMemo || "").toLowerCase().includes(term) ||
        (item.header?.nomorMak || "").toLowerCase().includes(term) ||
        (item.header?.pengadaanItems || []).some((it) =>
          (it.uraian || "").toLowerCase().includes(term)
        ) ||
        (item.rows || []).some((r) =>
          (
            r.nama ||
            r.namaExternal ||
            r.kodeNama ||
            r.nip ||
            r.nomorSt ||
            r.nomorSpd ||
            ""
          )
            .toLowerCase()
            .includes(term)
        );

      const isItemNonAsn = item.kategori === "NA" || (item.kategori as string) === "B";
      const matchesKategori =
        filterKategori === "ALL"
          ? true
          : filterKategori === "NA"
          ? isItemNonAsn
          : item.kategori === "A";

      const itemSpjType: SpjDocType = item.header?.spjType || "PERDIN";
      const matchesSpjType = filterSpjType === "ALL" ? true : itemSpjType === filterSpjType;

      return matchesSearch && matchesKategori && matchesSpjType;
    });

    if (sortBy === "NEWEST") {
      return sortKegiatanByNewest(list);
    } else if (sortBy === "DATE_DESC") {
      return [...list].sort((a, b) => {
        const dA = a.tanggalSpd ? new Date(a.tanggalSpd).getTime() : 0;
        const dB = b.tanggalSpd ? new Date(b.tanggalSpd).getTime() : 0;
        return dB - dA;
      });
    } else if (sortBy === "OLDEST") {
      return [...sortKegiatanByNewest(list)].reverse();
    } else if (sortBy === "NAME_AZ") {
      return [...list].sort((a, b) => (a.namaKegiatan || "").localeCompare(b.namaKegiatan || ""));
    }

    return sortKegiatanByNewest(list);
  }, [kegiatanList, searchTerm, filterKategori, filterSpjType, sortBy]);

  const countAsn = kegiatanList.filter((k) => k.kategori === "A").length;
  const countNonAsn = kegiatanList.filter((k) => k.kategori === "NA" || (k.kategori as string) === "B").length;
  const countPerdin = kegiatanList.filter((k) => (k.header?.spjType || "PERDIN") === "PERDIN").length;
  const countKonsumsi = kegiatanList.filter((k) => k.header?.spjType === "KONSUMSI").length;
  const countSewa = kegiatanList.filter((k) => k.header?.spjType === "SEWA").length;
  const countDiklat = kegiatanList.filter((k) => k.header?.spjType === "DIKLAT").length;
  const countAtk = kegiatanList.filter((k) => k.header?.spjType === "ATK").length;
  const totalAnggaran = kegiatanList.reduce((acc, k) => acc + (k.grandTotal || 0), 0);
  const totalPeserta = kegiatanList.reduce((acc, k) => acc + (k.jumlahPeserta || k.rows?.length || 0), 0);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setIsDeleting(true);
    // 1. Hapus dari penyimpanan lokal terlebih dahulu
    deleteKegiatanRecord(target.idKegiatan);
    setKegiatanList((prev) => prev.filter((k) => k.idKegiatan !== target.idKegiatan));

    // 2. Hapus dari Google Spreadsheet Cloud (dan opsional bersihkan nomor memo)
    try {
      const cloudRes = await deleteKegiatanFromGoogleSheet(
        target.idKegiatan,
        target.namaKegiatan,
        undefined,
        target.header?.nomorMemo,
        alsoDeleteMemo
      );
      setNotification({
        type: "success",
        message: cloudRes.success
          ? `Kegiatan "${target.namaKegiatan}" berhasil dihapus dari database & cloud.`
          : `Kegiatan "${target.namaKegiatan}" dihapus dari lokal (${cloudRes.message}).`,
      });
    } catch {
      setNotification({
        type: "success",
        message: `Kegiatan "${target.namaKegiatan}" berhasil dihapus dari sistem.`,
      });
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-3">
      {/* -------------------------------------------------------------
          1. COMPACT SUMMARY STRIP (Hemat Ruang Vertikal, Tanpa Bloating)
          ------------------------------------------------------------- */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800">
        <div className="px-4 py-2.5 flex items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
              Total Berkas SPJ
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono">
                {kegiatanList.length}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                ({countAsn} ASN · {countNonAsn} Non-ASN)
              </span>
            </div>
          </div>
          <Briefcase className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
        </div>

        <div className="px-4 py-2.5 flex items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
              Personil / Pelaksana
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono">
                {totalPeserta}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">orang tercatat</span>
            </div>
          </div>
          <Users className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
        </div>

        <div className="px-4 py-2.5 flex items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
              Total Realisasi
            </span>
            <span className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono block">
              Rp {totalAnggaran.toLocaleString("id-ID")}
            </span>
          </div>
          <Coins className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
        </div>

        <div className="px-4 py-2.5 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
              Sedang Dibuka
            </span>
            <span className="text-sm font-bold text-[#0071e3] dark:text-blue-400 font-mono truncate block">
              {currentLoadedId || "Draft Baru"}
            </span>
          </div>
          <CheckCircle2 className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
        </div>
      </div>

      {/* -------------------------------------------------------------
          2. UNIFIED SEARCH, FILTER & TAB BAR (Clean Flat Design)
          ------------------------------------------------------------- */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
        {/* Top Row: Search + Compact Controls + Actions */}
        <div className="p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 border-b border-slate-100 dark:border-slate-800">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari ID KEG, uraian kegiatan, nomor ST, Memo, MAK, lokasi, nama pegawai / item..."
              className="input-clean w-full h-9 pl-9 pr-8 text-xs font-normal"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Compact Kategori Dropdown */}
            <select
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value as "ALL" | "A" | "NA")}
              className="input-clean h-9 px-2.5 text-xs font-semibold cursor-pointer"
              title="Filter kategori ASN / Non-ASN"
            >
              <option value="ALL">Semua Kategori ({kegiatanList.length})</option>
              <option value="A">ASN ({countAsn})</option>
              <option value="NA">Non ASN ({countNonAsn})</option>
            </select>

            {/* Compact Sort Selector */}
            <div className="inline-flex items-center gap-1.5">
              <ArrowDownWideNarrow className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 hidden sm:inline" />
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "NEWEST" | "DATE_DESC" | "OLDEST" | "NAME_AZ")
                }
                className="input-clean h-9 px-2.5 text-xs font-semibold cursor-pointer"
                title="Urutkan daftar kegiatan"
              >
                <option value="NEWEST">Terbaru (Default)</option>
                <option value="DATE_DESC">Tgl Pelaksanaan Terbaru</option>
                <option value="OLDEST">Terlama Dahulu</option>
                <option value="NAME_AZ">Nama Kegiatan (A–Z)</option>
              </select>
            </div>

            <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-700 hidden sm:block" />

            {/* Sync Cloud */}
            <button
              type="button"
              onClick={syncWithCloud}
              disabled={isLoadingCloud}
              className="btn-tactile inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer transition-all disabled:opacity-50"
              title="Tarik & perbarui data kegiatan dari Google Spreadsheet"
            >
              <RotateCw
                className={`w-3.5 h-3.5 text-[#0071e3] dark:text-blue-400 ${
                  isLoadingCloud ? "animate-spin" : ""
                }`}
              />
              <span>{isLoadingCloud ? "Menyinkronkan..." : "Sinkron"}</span>
            </button>

            {/* Create New SPJ */}
            <button
              type="button"
              onClick={onCreateNewKegiatan}
              className="btn-tactile inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold cursor-pointer transition-all"
              title="Mulai membuat berkas SPJ baru"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>SPJ Baru</span>
            </button>
          </div>
        </div>

        {/* Bottom Row: Flat Tabs Filter Jenis Kegiatan (Tanpa Oval Pill Bloat) */}
        <div className="px-3 flex items-center gap-1 overflow-x-auto scrollbar-none bg-slate-50/70 dark:bg-slate-800/40">
          {(
            [
              {
                id: "ALL",
                label: "Semua Jenis",
                count: kegiatanList.length,
                icon: Layers,
                accent: "text-slate-900 dark:text-white border-slate-900 dark:border-slate-100",
              },
              {
                id: "PERDIN",
                label: "Perjalanan Dinas",
                count: countPerdin,
                icon: Briefcase,
                accent: "text-slate-900 dark:text-white border-slate-900 dark:border-slate-100",
              },
              {
                id: "KONSUMSI",
                label: "SPJ Konsumsi",
                count: countKonsumsi,
                icon: UtensilsCrossed,
                accent: "text-slate-900 dark:text-white border-slate-900 dark:border-slate-100",
              },
              {
                id: "SEWA",
                label: "Sewa Kendaraan",
                count: countSewa,
                icon: Car,
                accent: "text-slate-900 dark:text-white border-slate-900 dark:border-slate-100",
              },
              {
                id: "DIKLAT",
                label: "SPJ Narsum",
                count: countDiklat,
                icon: Mic,
                accent: "text-slate-900 dark:text-white border-slate-900 dark:border-slate-100",
              },
              {
                id: "ATK",
                label: "ATK & Semkit",
                count: countAtk,
                icon: Package,
                accent: "text-slate-900 dark:text-white border-slate-900 dark:border-slate-100",
              },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const isSelected = filterSpjType === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterSpjType(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-xs whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                  isSelected
                    ? `${tab.accent} font-bold`
                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
                <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
                  ({tab.count})
                </span>
              </button>
            );
          })}
        </div>

        {/* Toast Notification */}
        {notification && (
          <div className="mx-3 my-2.5 flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/70 text-emerald-900 dark:text-emerald-200 text-xs animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">{notification.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="p-1 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-slate-500 dark:text-slate-400 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* -------------------------------------------------------------
          3. CLEAN TYPOGRAPHY & ICON-DRIVEN ACTIVITIES LIST
          ------------------------------------------------------------- */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 lg:grid-cols-[270px_minmax(0,1fr)_140px_104px] gap-4 px-4 py-2.5 bg-slate-50/90 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <div className="col-span-12 lg:col-span-1">Identitas &amp; Dokumen SPJ</div>
          <div className="hidden lg:block">Uraian Kegiatan &amp; Pelaksana</div>
          <div className="hidden lg:block text-right">Total Anggaran</div>
          <div className="hidden lg:block text-right">Aksi</div>
        </div>

        {/* List Content */}
        {filteredList.length === 0 ? (
          <div className="py-12 text-center text-slate-400 dark:text-slate-500 space-y-3">
            <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 border border-slate-200 dark:border-slate-700">
              <FolderOpen className="w-5 h-5 stroke-1" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                {searchTerm || filterSpjType !== "ALL" || filterKategori !== "ALL"
                  ? "Kegiatan Tidak Ditemukan"
                  : "Belum Ada Daftar Kegiatan"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {searchTerm || filterSpjType !== "ALL" || filterKategori !== "ALL"
                  ? "Tidak ada kegiatan yang sesuai dengan filter atau kata kunci pencarian Anda."
                  : "Mulai buat paket SPJ baru dengan mengisi form input & kalkulator."}
              </p>
            </div>
            {searchTerm || filterSpjType !== "ALL" || filterKategori !== "ALL" ? (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setFilterSpjType("ALL");
                  setFilterKategori("ALL");
                }}
                className="btn-tactile inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer transition-all"
              >
                <X className="w-3.5 h-3.5" />
                <span>Tampilkan Semua Kegiatan</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onCreateNewKegiatan}
                className="btn-tactile inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Buat SPJ Baru Sekarang</span>
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredList.map((item) => {
              const isCurrent = currentLoadedId === item.idKegiatan;
              const itemSpjType: SpjDocType = item.header?.spjType || "PERDIN";
              const isPengadaan = itemSpjType !== "PERDIN";
              const meta = getSpjTypeMeta(itemSpjType);

              const spjHighlight =
                itemSpjType === "KONSUMSI"
                  ? { Icon: UtensilsCrossed, color: "text-emerald-600 dark:text-emerald-400" }
                  : itemSpjType === "SEWA"
                  ? { Icon: Car, color: "text-violet-600 dark:text-violet-400" }
                  : itemSpjType === "DIKLAT"
                  ? { Icon: Mic, color: "text-rose-600 dark:text-rose-400" }
                  : itemSpjType === "ATK"
                  ? { Icon: Package, color: "text-amber-600 dark:text-amber-400" }
                  : { Icon: Briefcase, color: "text-[#0071e3] dark:text-blue-400" };
              const SpjIcon = spjHighlight.Icon;

              const participants = (item.rows || [])
                .map((r, idx) => {
                  const rawName = (r.nama || r.namaExternal || r.kodeNama || "").trim();
                  const name = rawName || `Peserta ${idx + 1}`;
                  const details = [r.jabatan, r.golongan ? `Gol. ${r.golongan}` : ""].filter(Boolean).join(" • ");
                  return {
                    name,
                    details,
                    nip: r.nip,
                    nomorSpd: r.nomorSpd,
                    biaya: r.totalJumlah,
                  };
                })
                .filter((p) => p.name && p.name !== "—" && p.name !== "-");

              const lokasiText =
                item.kotaTujuan && item.provinsiTujuan
                  ? `${item.kotaTujuan}, ${item.provinsiTujuan}`
                  : item.kotaTujuan || item.provinsiTujuan || "Indonesia";

              const spdNumbers = participants.map((p) => p.nomorSpd).filter((n) => n && n !== "-");
              const spdRangeText =
                spdNumbers.length > 1
                  ? `SPD ${spdNumbers[0]} s.d ${spdNumbers[spdNumbers.length - 1]}`
                  : spdNumbers.length === 1
                  ? `SPD ${spdNumbers[0]}`
                  : null;

              const memoShort = item.header?.nomorMemo
                ? item.header.nomorMemo.split("/")[0].trim()
                : null;

              const pengadaanItemsList = (item.header?.pengadaanItems || []).filter(
                (it) => it.uraian && it.uraian.trim() !== ""
              );

              return (
                <div
                  key={item.idKegiatan}
                  className={`px-4 py-3 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50 ${
                    isCurrent
                      ? "bg-blue-50/40 dark:bg-blue-950/20 border-l-3 border-l-[#0071e3]"
                      : ""
                  }`}
                >
                  <div className="grid grid-cols-12 lg:grid-cols-[270px_minmax(0,1fr)_140px_104px] gap-4 items-start">
                    {/* -------------------------------------------------------------
                        KOLOM 1: IDENTITAS & DOKUMEN SPJ (Clean 4-Line Layout + Icons)
                        ------------------------------------------------------------- */}
                    <div className="col-span-12 sm:col-span-5 lg:col-span-1 space-y-1 min-w-0">
                      {/* Baris 1: KEG-2611-017-A · Perjalanan Dinas · ASN */}
                      <div className="flex items-center gap-1.5 flex-wrap text-xs">
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                          {item.idKegiatan}
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">·</span>
                        <span className={`inline-flex items-center gap-1 font-semibold ${spjHighlight.color}`}>
                          <SpjIcon className="w-3.5 h-3.5 shrink-0" />
                          <span>{meta.shortLabel}</span>
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">·</span>
                        <span
                          className={`text-[11px] font-semibold ${
                            item.kategori === "A"
                              ? "text-slate-600 dark:text-slate-300"
                              : "text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {item.kategori === "A" ? "ASN" : "Non-ASN"}
                        </span>
                        {isCurrent && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0071e3] dark:text-blue-400 ml-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0071e3] animate-pulse" />
                            <span>Aktif</span>
                          </span>
                        )}
                      </div>

                      {/* Baris 2: Tanggal Pelaksanaan */}
                      <div className="flex items-center gap-1.5 text-[11.5px] text-slate-600 dark:text-slate-300">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span>{formatDateIndo(item.tanggalSpd)}</span>
                      </div>

                      {/* Baris 3: Nomor SPD */}
                      {spdRangeText && (
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          <Hash className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                          <span>{spdRangeText}</span>
                        </div>
                      )}

                      {/* Baris 4: Nomor ST + Nomor Memo (Tanpa MAK) */}
                      {(item.header?.nomorStMaster || memoShort) && (
                        <div className="flex items-center gap-2 flex-wrap font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          {item.header?.nomorStMaster && (
                            <span
                              className="inline-flex items-center gap-1"
                              title={`Nomor ST: ${item.header.nomorStMaster}`}
                            >
                              <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                              <span>{item.header.nomorStMaster}</span>
                            </span>
                          )}
                          {memoShort && (
                            <span
                              className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 font-semibold"
                              title={`Memorandum: ${item.header?.nomorMemo}`}
                            >
                              {!item.header?.nomorStMaster && (
                                <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                              )}
                              <span>{memoShort}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* -------------------------------------------------------------
                        KOLOM 2: URAIAN KEGIATAN (FULL TEXT) & PELAKSANA / ITEM
                        ------------------------------------------------------------- */}
                    <div className="col-span-12 sm:col-span-7 lg:col-span-1 space-y-1.5 min-w-0">
                      <h4 className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                        {item.namaKegiatan || "Perjalanan Dinas Jabatan Inspektorat"}
                      </h4>

                      {/* Inline Metadata: Lokasi & Pelaksana / Item (Clean Icon + Plain Text) */}
                      <div className="flex flex-col gap-0.5 text-[11.5px] text-slate-500 dark:text-slate-400">
                        {!isPengadaan && (
                          <div className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span>{lokasiText}</span>
                          </div>
                        )}

                        {isPengadaan && pengadaanItemsList.length > 0 ? (
                          <div
                            className="inline-flex items-start gap-1.5 cursor-help"
                            title={pengadaanItemsList
                              .map((it, i) => `${i + 1}. ${it.uraian} (${it.jumlah} ${it.satuan})`)
                              .join("\n")}
                          >
                            <Package className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                            <span>
                              {pengadaanItemsList.map((it) => it.uraian).join(", ")}
                            </span>
                          </div>
                        ) : (
                          participants.length > 0 && (
                            <div
                              className="inline-flex items-start gap-1.5 cursor-help"
                              title={participants
                                .map(
                                  (p, i) =>
                                    `${i + 1}. ${p.name}${p.details ? ` (${p.details})` : ""}${
                                      p.biaya ? ` — Rp ${p.biaya.toLocaleString("id-ID")}` : ""
                                    }`
                                )
                                .join("\n")}
                            >
                              <Users className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                              <span>
                                {participants.map((p) => p.name).join(", ")}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {/* -------------------------------------------------------------
                        KOLOM 3: TOTAL ANGGARAN & JUMLAH
                        ------------------------------------------------------------- */}
                    <div className="col-span-6 lg:col-span-1 text-left lg:text-right whitespace-nowrap">
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono block">
                        Rp {(item.grandTotal || 0).toLocaleString("id-ID")}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <Users className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>
                          {isPengadaan
                            ? `${item.header?.pengadaanItems?.length || item.jumlahPeserta || 1} Item`
                            : `${item.jumlahPeserta || participants.length || 1} Orang`}
                        </span>
                      </span>
                    </div>

                    {/* -------------------------------------------------------------
                        KOLOM 4: AKSI (Ringkas)
                        ------------------------------------------------------------- */}
                    <div className="col-span-6 lg:col-span-1 flex items-center justify-end gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => onEditKegiatan(item)}
                        className="btn-tactile inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold cursor-pointer transition-all"
                        title="Buka & Edit data kegiatan ini"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Buka</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteTarget(item)}
                        className="btn-tactile p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-all cursor-pointer"
                        title="Hapus paket kegiatan ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* -------------------------------------------------------------
          4. CONFIRMATION MODAL DELETE
          ------------------------------------------------------------- */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-start gap-3.5 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Hapus Paket Kegiatan?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono font-bold">
                  {deleteTarget.idKegiatan}
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/70 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-1.5">
              <p className="font-bold text-slate-900 dark:text-slate-100 leading-snug">
                &ldquo;{deleteTarget.namaKegiatan}&rdquo;
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                Total <strong>{deleteTarget.jumlahPeserta} {deleteTarget.header?.spjType && deleteTarget.header.spjType !== "PERDIN" ? "item" : "orang peserta"}</strong> dan seluruh rincian transaksi SPJ pada kegiatan ini akan dihapus dari Rekap dan Google Spreadsheet.
              </p>
            </div>

            {deleteTarget.header?.nomorMemo && (
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 text-xs cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={alsoDeleteMemo}
                  onChange={(e) => setAlsoDeleteMemo(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
                <div className="space-y-0.5">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                    Hapus juga nomor memorandum terkait
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block">
                    {deleteTarget.header.nomorMemo} (dari Buku Kendali &amp; MASTER_MEMO)
                  </span>
                </div>
              </label>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="btn-tactile px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="btn-tactile px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer shadow-sm disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {isDeleting && <RotateCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{isDeleting ? "Menghapus..." : "Ya, Hapus Kegiatan"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
