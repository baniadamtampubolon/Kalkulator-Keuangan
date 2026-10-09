"use client";

import React, { useState, useEffect, useMemo } from "react";
import { SavedKegiatan } from "@/lib/types";
import {
  getSavedKegiatanList,
  deleteKegiatanRecord,
  sortKegiatanByNewest,
} from "@/lib/kegiatanHelper";
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
  User,
  FileText,
  Landmark,
  Coins,
  ArrowRight,
  TrendingUp,
  Briefcase,
  Sparkles,
  Layers,
  Edit3,
  Trash2,
  ArrowDownWideNarrow,
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
    try {
      setKegiatanList(getSavedKegiatanList());
    } catch {
      // ignore
    }
  }, []);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterKategori, setFilterKategori] = useState<"ALL" | "A" | "NA">("ALL");
  const [sortBy, setSortBy] = useState<"NEWEST" | "DATE_DESC" | "OLDEST" | "NAME_AZ">("NEWEST");
  const [isLoadingCloud, setIsLoadingCloud] = useState<boolean>(false);

  // Modal Delete State
  const [deleteTarget, setDeleteTarget] = useState<SavedKegiatan | null>(null);
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
        (item.rows || []).some((r) =>
          (r.nama || r.namaExternal || r.kodeNama || r.nip || "").toLowerCase().includes(term)
        );

      const isItemNonAsn = item.kategori === "NA" || (item.kategori as string) === "B";
      const matchesKategori =
        filterKategori === "ALL"
          ? true
          : filterKategori === "NA"
          ? isItemNonAsn
          : item.kategori === "A";

      return matchesSearch && matchesKategori;
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
  }, [kegiatanList, searchTerm, filterKategori, sortBy]);

  const countAsn = kegiatanList.filter((k) => k.kategori === "A").length;
  const countNonAsn = kegiatanList.filter((k) => k.kategori === "NA" || (k.kategori as string) === "B").length;
  const totalAnggaran = kegiatanList.reduce((acc, k) => acc + (k.grandTotal || 0), 0);
  const totalPeserta = kegiatanList.reduce((acc, k) => acc + (k.jumlahPeserta || k.rows?.length || 0), 0);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setIsDeleting(true);
    // 1. Hapus dari penyimpanan lokal terlebih dahulu
    deleteKegiatanRecord(target.idKegiatan);
    setKegiatanList((prev) => prev.filter((k) => k.idKegiatan !== target.idKegiatan));

    // 2. Hapus dari Google Spreadsheet Cloud
    try {
      const cloudRes = await deleteKegiatanFromGoogleSheet(target.idKegiatan, target.namaKegiatan);
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
    <div className="space-y-4">
      {/* -------------------------------------------------------------
          1. DASHBOARD SUMMARY KPI CARDS (Apple Minimal Style)
          ------------------------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Total Kegiatan */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Total Berkas SPJ
            </span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
              {kegiatanList.length}
            </span>
            <span className="text-xs text-slate-500">Paket Terdaftar</span>
          </div>
          <div className="flex items-center gap-2 pt-0.5 text-[10.5px] text-slate-500">
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              {countAsn} ASN [A]
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              {countNonAsn} Non-ASN
            </span>
          </div>
        </div>

        {/* Metric 2: Total Peserta */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Personil Berangkat
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
              {totalPeserta}
            </span>
            <span className="text-xs text-slate-500">Orang Pelaksana</span>
          </div>
          <p className="text-[10.5px] text-slate-500 pt-0.5 truncate">
            Dari seluruh rekapitulasi surat tugas
          </p>
        </div>

        {/* Metric 3: Total Anggaran */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Total Realisasi Anggaran
            </span>
            <div className="p-1.5 rounded-lg bg-violet-50 text-violet-600">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg sm:text-xl font-extrabold text-slate-900 font-mono">
              Rp {totalAnggaran.toLocaleString("id-ID")}
            </span>
          </div>
          <p className="text-[10.5px] text-slate-500 pt-0.5 truncate">
            Akun MAK 524111 Inspektorat
          </p>
        </div>

        {/* Metric 4: Sedang Dibuka / Status */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              SPJ Sedang Dibuka
            </span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm sm:text-base font-bold text-blue-600 font-mono truncate">
              {currentLoadedId || "Draft Baru"}
            </span>
          </div>
          <p className="text-[10.5px] text-slate-500 pt-0.5 truncate">
            {currentLoadedId ? "Sedang aktif di form input & kalkulator" : "Belum ada paket yang dimuat"}
          </p>
        </div>
      </div>

      {/* -------------------------------------------------------------
          2. SEARCH, FILTER & ACTION BAR
          ------------------------------------------------------------- */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari ID, nama kegiatan, kota, nomor ST, nama pegawai..."
              className="input-human w-full pl-9 pr-8 py-2 text-xs font-normal"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Sync Cloud Button */}
            <button
              type="button"
              onClick={syncWithCloud}
              disabled={isLoadingCloud}
              className="btn-tactile inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold cursor-pointer shadow-2xs transition-all disabled:opacity-50"
              title="Tarik & perbarui data kegiatan dari Google Spreadsheet"
            >
              <RotateCw className={`w-3.5 h-3.5 text-blue-600 ${isLoadingCloud ? "animate-spin" : ""}`} />
              <span>{isLoadingCloud ? "Menyinkronkan..." : "Sinkron Cloud"}</span>
            </button>

            {/* Create New SPJ Button */}
            <button
              type="button"
              onClick={onCreateNewKegiatan}
              className="btn-tactile inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
              title="Mulai membuat berkas SPJ baru"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>SPJ Baru</span>
            </button>
          </div>
        </div>

        {/* Filter Category Segmented Control */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setFilterKategori("ALL")}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                filterKategori === "ALL"
                  ? "bg-white text-slate-900 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Semua ({kegiatanList.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterKategori("A")}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                filterKategori === "A"
                  ? "bg-white text-blue-900 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>ASN [A] ({countAsn})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterKategori("NA")}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                filterKategori === "NA"
                  ? "bg-white text-amber-900 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Non-ASN [NA] ({countNonAsn})</span>
            </button>
          </div>

          {/* Right: Sort Selector & Format info */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[11px] text-slate-500 font-medium inline-flex items-center gap-1">
                <ArrowDownWideNarrow className="w-3.5 h-3.5 text-slate-400" />
                <span>Urutkan:</span>
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "NEWEST" | "DATE_DESC" | "OLDEST" | "NAME_AZ")}
                className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-xl px-2.5 py-1 text-xs font-semibold text-slate-700 cursor-pointer shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                title="Pilih urutan daftar kegiatan"
              >
                <option value="NEWEST">⚡ Terbaru (Default)</option>
                <option value="DATE_DESC">📅 Tanggal Pelaksanaan Terbaru</option>
                <option value="OLDEST">⏳ Terlama Dahulu</option>
                <option value="NAME_AZ">🔤 Nama Kegiatan (A - Z)</option>
              </select>
            </div>

            <div className="hidden md:block text-[11px] text-slate-400 font-mono border-l border-slate-200 pl-3">
              Format: <span className="text-slate-700 font-bold">KEG-YYMM-001-A</span>
            </div>
          </div>
        </div>

        {/* Toast Notification */}
        {notification && (
          <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">{notification.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="p-1 rounded hover:bg-emerald-100 text-slate-500 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* -------------------------------------------------------------
          3. MAIN INFORMATION-RICH ACTIVITIES LIST / TABLE
          ------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Table Header (Clean, Light Apple Design) */}
        <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          <div className="col-span-12 sm:col-span-4 lg:col-span-3">Identitas &amp; Dokumen SPJ</div>
          <div className="hidden sm:block sm:col-span-8 lg:col-span-5">Uraian Kegiatan &amp; Pelaksana</div>
          <div className="hidden lg:block lg:col-span-2 text-right">Total Anggaran</div>
          <div className="hidden lg:block lg:col-span-2 text-center">Aksi</div>
        </div>

        {/* List Content */}
        {filteredList.length === 0 ? (
          <div className="py-14 text-center text-slate-400 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400 border border-slate-200">
              <FolderOpen className="w-6 h-6 stroke-1" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <p className="font-bold text-slate-800 text-sm">
                {searchTerm ? "Kegiatan Tidak Ditemukan" : "Belum Ada Daftar Kegiatan"}
              </p>
              <p className="text-xs text-slate-500">
                {searchTerm
                  ? "Tidak ada kegiatan yang sesuai dengan kata kunci pencarian Anda."
                  : "Mulai buat paket perjalanan dinas baru dengan mengisi form input & kalkulator."}
              </p>
            </div>
            {!searchTerm && (
              <button
                type="button"
                onClick={onCreateNewKegiatan}
                className="btn-tactile inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold cursor-pointer shadow-xs transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Buat SPJ Baru Sekarang</span>
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredList.map((item) => {
              const isCurrent = currentLoadedId === item.idKegiatan;
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
                (item.kotaTujuan && item.provinsiTujuan)
                  ? `${item.kotaTujuan}, ${item.provinsiTujuan}`
                  : item.kotaTujuan || item.provinsiTujuan || "Indonesia";

              // Rentang Nomor SPD
              const spdNumbers = participants.map((p) => p.nomorSpd).filter(Boolean);
              const spdRangeText =
                spdNumbers.length > 1
                  ? `SPD ${spdNumbers[0]} s.d ${spdNumbers[spdNumbers.length - 1]}`
                  : spdNumbers.length === 1
                  ? `SPD ${spdNumbers[0]}`
                  : null;

              return (
                <div
                  key={item.idKegiatan}
                  className={`p-4 transition-all hover:bg-slate-50/70 ${
                    isCurrent ? "bg-blue-50/40 border-l-4 border-l-blue-600" : ""
                  }`}
                >
                  <div className="grid grid-cols-12 gap-3.5 items-center">
                    {/* -------------------------------------------------------------
                        KOLOM 1: IDENTITAS & DOKUMEN SPJ
                        ------------------------------------------------------------- */}
                    <div className="col-span-12 sm:col-span-4 lg:col-span-3 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* ID Kegiatan Mono Badge */}
                        <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-white border border-slate-300/80 text-slate-900 shadow-2xs">
                          {item.idKegiatan}
                        </span>

                        {/* Kategori Badge */}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.kategori === "A"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {item.kategori === "A" ? "ASN [A]" : "Non-ASN [NA]"}
                        </span>
                      </div>

                      {/* Tanggal & Nomor SPD */}
                      <div className="space-y-0.5 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium">{formatDateIndo(item.tanggalSpd)}</span>
                        </div>

                        {spdRangeText && (
                          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            <span>{spdRangeText}</span>
                          </div>
                        )}
                      </div>

                      {/* Nomor ST & Memo (Administrative Metadata) */}
                      {(item.header?.nomorStMaster || item.header?.nomorMemo || item.header?.nomorMak) && (
                        <div className="pt-1 flex flex-wrap gap-1.5 text-[10.5px]">
                          {item.header?.nomorStMaster && (
                            <span
                              className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 truncate max-w-[170px]"
                              title={`Nomor ST: ${item.header.nomorStMaster}`}
                            >
                              ST: {item.header.nomorStMaster}
                            </span>
                          )}
                          {item.header?.nomorMak && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono border border-slate-200">
                              MAK {item.header.nomorMak}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* -------------------------------------------------------------
                        KOLOM 2: URAIAN KEGIATAN & DAFTAR PESERTA
                        ------------------------------------------------------------- */}
                    <div className="col-span-12 sm:col-span-8 lg:col-span-5 space-y-2">
                      <div className="space-y-1">
                        <div className="flex items-start gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                            {item.namaKegiatan || "Perjalanan Dinas Jabatan Inspektorat"}
                          </h4>
                        </div>

                        {/* Location Pill */}
                        <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap">
                          <span className="inline-flex items-center gap-1 font-medium text-slate-700 bg-slate-100/80 px-2 py-0.5 rounded-md border border-slate-200/80">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span>{lokasiText}</span>
                          </span>

                          {isCurrent && (
                            <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                              <Sparkles className="w-3 h-3 text-blue-600" />
                              Sedang Dibuka
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Participant Preview Pills */}
                      {participants.length > 0 && (
                        <div className="pt-1.5 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mr-1">
                            <Users className="w-3.5 h-3.5 text-blue-600" />
                            <span>Pelaksana ({participants.length}):</span>
                          </span>

                          {participants.slice(0, 4).map((p, pIdx) => (
                            <span
                              key={pIdx}
                              className="inline-flex items-center gap-1 text-[11px] font-medium bg-white hover:bg-blue-50/80 text-slate-700 hover:text-blue-700 px-2 py-0.5 rounded-md border border-slate-200/90 shadow-2xs transition-all cursor-help"
                              title={
                                p.details || p.nip
                                  ? `${p.name}${p.details ? `\n${p.details}` : ""}${p.nip ? `\nNIP: ${p.nip}` : ""}${p.biaya ? `\nTotal: Rp ${p.biaya.toLocaleString("id-ID")}` : ""}`
                                  : p.name
                              }
                            >
                              <User className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[130px] sm:max-w-[160px]">{p.name}</span>
                            </span>
                          ))}

                          {participants.length > 4 && (
                            <span
                              className="text-[10.5px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 cursor-help transition-colors"
                              title={
                                `Peserta lainnya:\n` +
                                participants
                                  .slice(4)
                                  .map((p, i) => `${i + 5}. ${p.name}${p.details ? ` (${p.details})` : ""}`)
                                  .join("\n")
                              }
                            >
                              +{participants.length - 4} lainnya
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* -------------------------------------------------------------
                        KOLOM 3: TOTAL ANGGARAN & PERSONIL
                        ------------------------------------------------------------- */}
                    <div className="col-span-6 lg:col-span-2 text-left lg:text-right space-y-1">
                      <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400 block">
                        Total Anggaran
                      </span>
                      <span className="text-sm sm:text-base font-extrabold text-slate-900 font-mono block">
                        Rp {(item.grandTotal || 0).toLocaleString("id-ID")}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                        <Users className="w-3 h-3 text-slate-500" />
                        <span>{item.jumlahPeserta || participants.length || 1} Orang</span>
                      </span>
                    </div>

                    {/* -------------------------------------------------------------
                        KOLOM 4: AKSI (Buka & Edit, Hapus)
                        ------------------------------------------------------------- */}
                    <div className="col-span-6 lg:col-span-2 flex items-center justify-end gap-2">
                      {/* Buka & Edit Button */}
                      <button
                        type="button"
                        onClick={() => onEditKegiatan(item)}
                        className="btn-tactile inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs cursor-pointer transition-all"
                        title="Buka data kegiatan ini di form input untuk diedit atau dicetak"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Buka &amp; Edit</span>
                      </button>

                      {/* Hapus Button */}
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(item)}
                        className="btn-tactile p-2 rounded-xl bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 shadow-2xs cursor-pointer transition-all"
                        title="Hapus paket kegiatan ini dari database"
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
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-start gap-3.5 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-slate-900">
                  Hapus Paket Kegiatan?
                </h3>
                <p className="text-xs text-slate-500 font-mono font-bold">
                  {deleteTarget.idKegiatan}
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1.5">
              <p className="font-bold text-slate-900 leading-snug">
                &ldquo;{deleteTarget.namaKegiatan}&rdquo;
              </p>
              <p className="text-slate-500 text-[11px]">
                Total <strong>{deleteTarget.jumlahPeserta} orang peserta</strong> dan seluruh rincian transaksi SPJ pada kegiatan ini akan dihapus dari Rekap Perdin dan Google Spreadsheet.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="btn-tactile px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
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
