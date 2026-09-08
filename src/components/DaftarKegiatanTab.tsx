"use client";

import React, { useState, useEffect } from "react";
import { SavedKegiatan } from "@/lib/types";
import {
  getSavedKegiatanList,
  deleteKegiatanRecord,
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
  const [kegiatanList, setKegiatanList] = useState<SavedKegiatan[]>(() => {
    if (typeof window !== "undefined") {
      return getSavedKegiatanList();
    }
    return [];
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterKategori, setFilterKategori] = useState<"ALL" | "A" | "B">("ALL");
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
        setKegiatanList(res.data);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingCloud(false);
    }
  };

  // Load list & subscribe to events + auto-sync from cloud
  useEffect(() => {
    let isMounted = true;

    // Tarik data terbaru dari Google Spreadsheet Cloud secara otomatis
    fetchKegiatanFromSheet()
      .then((res) => {
        if (isMounted) {
          if (res.success && res.data) {
            setKegiatanList(res.data);
          }
          setIsLoadingCloud(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoadingCloud(false);
      });

    const handleUpdate = () => {
      const updated = getSavedKegiatanList();
      if (isMounted) setKegiatanList(updated);
    };

    window.addEventListener("kegiatan-list-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener("kegiatan-list-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  // Filter activities
  const filteredList = kegiatanList.filter((item) => {
    const matchesSearch =
      (item.namaKegiatan || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.idKegiatan || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.kotaTujuan || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.provinsiTujuan || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesKategori =
      filterKategori === "ALL" ? true : item.kategori === filterKategori;

    return matchesSearch && matchesKategori;
  });

  const countAsn = kegiatanList.filter((k) => k.kategori === "A").length;
  const countNonAsn = kegiatanList.filter((k) => k.kategori === "B").length;

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setIsDeleting(true);
    // 1. Hapus dari penyimpanan lokal terlebih dahulu
    deleteKegiatanRecord(target.idKegiatan);
    setKegiatanList((prev) => prev.filter((k) => k.idKegiatan !== target.idKegiatan));

    // 2. Hapus dari Google Spreadsheet Cloud (DB_KEGIATAN, DB_PESERTA, REKAP_PERDIN_48KOLOM)
    try {
      const cloudRes = await deleteKegiatanFromGoogleSheet(target.idKegiatan, target.namaKegiatan);
      setNotification({
        type: "success",
        message: cloudRes.success
          ? `Kegiatan "${target.namaKegiatan}" berhasil dihapus dari sistem & cloud.`
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
      {/* Top Header & Search Bar (Matching User's Reference Layout) */}
      <div className="glass-base rounded-2xl p-4 md:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base md:text-lg font-bold text-slate-900 tracking-tight">
                2. Daftar Kegiatan
              </h2>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0071e3] border border-blue-200/80">
                {kegiatanList.length} Kegiatan Terdaftar
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Kelola seluruh paket perjalanan dinas. Klik <strong>Edit</strong> untuk membuka kembali rincian peserta dan dokumen SPJ.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input matching the reference */}
            <div className="relative min-w-[260px] sm:min-w-[320px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari deskripsi kegiatan..."
                className="input-glass h-9 pl-9 pr-3 text-xs w-full font-normal rounded-xl"
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

            {/* Sync from Google Spreadsheet Button */}
            <button
              type="button"
              onClick={syncWithCloud}
              disabled={isLoadingCloud}
              className="btn-tactile inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold cursor-pointer shadow-2xs transition-all disabled:opacity-50"
              title="Tarik data kegiatan terbaru dari Google Spreadsheet"
            >
              <RotateCw className={`w-3.5 h-3.5 text-blue-600 ${isLoadingCloud ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{isLoadingCloud ? "Menyinkronkan..." : "Sinkron Cloud"}</span>
            </button>

            {/* Create New Activity Button */}
            <button
              type="button"
              onClick={onCreateNewKegiatan}
              className="btn-tactile inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Buat Kegiatan Baru</span>
            </button>
          </div>
        </div>

        {/* Filter Category Tabs (Semua, ASN [A], Non-ASN [B]) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80 text-xs">
            <button
              type="button"
              onClick={() => setFilterKategori("ALL")}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                filterKategori === "ALL"
                  ? "bg-white text-slate-900 shadow-2xs font-semibold"
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
                  ? "bg-white text-blue-900 shadow-2xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>ASN [A] ({countAsn})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterKategori("B")}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                filterKategori === "B"
                  ? "bg-white text-amber-900 shadow-2xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Non-ASN [B] ({countNonAsn})</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400">
            Format ID: <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-bold">K-ddmmyy-nokegiatan-A/B</code>
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{notification.message}</span>
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

        {/* Main Table Styled Exactly Like User Reference Screenshot */}
        <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#1c3d73] text-white font-bold text-xs uppercase tracking-wider">
                <th className="p-3.5 md:px-5">KETERANGAN / NAMA KEGIATAN</th>
                <th className="p-3.5 text-center w-28 md:w-32">PESERTA</th>
                <th className="p-3.5 text-center w-36 md:w-44">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FolderOpen className="w-10 h-10 text-slate-300 stroke-1" />
                      <p className="font-medium text-slate-600 text-sm">
                        {searchTerm ? "Tidak ditemukan kegiatan yang sesuai dengan pencarian." : "Belum ada daftar kegiatan yang tersimpan."}
                      </p>
                      <p className="text-xs text-slate-400 max-w-md">
                        {searchTerm
                          ? "Coba gunakan kata kunci lain seperti nama kota atau nomor kegiatan."
                          : "Isi data pelaksana perjalanan dinas pada tab 'Input & Kalkulator' lalu tekan tombol 'Simpan Data' agar muncul di sini."}
                      </p>
                      {!searchTerm && (
                        <button
                          type="button"
                          onClick={onCreateNewKegiatan}
                          className="mt-2 btn-tactile inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0071e3] text-white text-xs font-semibold cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Mulai Buat Kegiatan Sekarang</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => {
                  const isCurrent = currentLoadedId === item.idKegiatan;
                  return (
                    <tr
                      key={item.idKegiatan}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isCurrent ? "bg-blue-50/40" : ""
                      }`}
                    >
                      {/* KETERANGAN / NAMA KEGIATAN */}
                      <td className="p-3.5 md:px-5 align-middle">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-xs md:text-sm">
                              {item.namaKegiatan || "Tanpa Judul Kegiatan"}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#0071e3] border border-blue-300/80">
                                Sedang Dibuka
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                            {/* ID Kegiatan Badge */}
                            <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                              {item.idKegiatan}
                            </span>

                            {/* Kategori Badge */}
                            <span
                              className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                                item.kategori === "A"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              {item.kategori === "A" ? "SPJ ASN" : "SPJ Non-ASN"}
                            </span>

                            {/* Location */}
                            {(item.kotaTujuan || item.provinsiTujuan) && (
                              <span className="inline-flex items-center gap-1 text-slate-600">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                <span>{item.kotaTujuan || item.provinsiTujuan}</span>
                              </span>
                            )}

                            {/* Date */}
                            {item.tanggalSpd && (
                              <span className="inline-flex items-center gap-1 text-slate-400">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                <span>{item.tanggalSpd}</span>
                              </span>
                            )}

                            {/* Total Biaya */}
                            {item.grandTotal > 0 && (
                              <span className="font-mono font-semibold text-slate-700">
                                Rp {item.grandTotal.toLocaleString("id-ID")}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* PESERTA (Matching Blue Pill in Reference) */}
                      <td className="p-3.5 text-center align-middle">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#e8f0fe] text-[#1967d2] border border-[#c2e7ff]">
                          {item.jumlahPeserta || item.rows?.length || 1} Org
                        </span>
                      </td>

                      {/* AKSI (Edit & Hapus Buttons Matching Reference) */}
                      <td className="p-3.5 text-center align-middle">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => onEditKegiatan(item)}
                            className="btn-tactile px-3.5 py-1.5 rounded-lg bg-blue-50 hover:bg-[#1967d2] text-[#1967d2] hover:text-white border border-blue-200/80 text-xs font-semibold cursor-pointer shadow-2xs transition-all"
                            title="Buka & Edit Data Kegiatan Ini di Form Input"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(item)}
                            className="btn-tactile px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200/80 text-xs font-semibold cursor-pointer shadow-2xs transition-all"
                            title="Hapus Paket Kegiatan Ini"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal Delete */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="glass-base rounded-2xl max-w-md w-full p-5 space-y-4 bg-white border border-slate-200 shadow-xl">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Hapus Paket Kegiatan?
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {deleteTarget.idKegiatan}
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1">
              <p className="font-semibold text-slate-800">
                &ldquo;{deleteTarget.namaKegiatan}&rdquo;
              </p>
              <p className="text-slate-500">
                Total <strong>{deleteTarget.jumlahPeserta} orang peserta</strong> dan seluruh rincian SPJ pada kegiatan ini akan dihapus dari daftar dan Rekap Perdin.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5"
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
