"use client";

import React, { useState, useEffect } from "react";
import { HeaderData, ParticipantRow } from "@/lib/types";
import {
  Download,
  Search,
  RefreshCw,
  Cloud,
  FileText,
  Plus,
  Edit3,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  CloudUpload,
  X,
} from "lucide-react";
import * as XLSX from "xlsx";
import { fetchRekapFromSheet, syncAllRekapToGoogleSheet, savePerdinToGoogleSheet } from "@/lib/googleSheetsService";
import { ModalRekapRowEditor } from "./ModalRekapRowEditor";

interface RekapPerdinTabProps {
  header: HeaderData;
  rows: ParticipantRow[];
}

export const RekapPerdinTab: React.FC<RekapPerdinTabProps> = ({ header, rows }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewSource, setViewSource] = useState<"cloud" | "draft">("cloud");
  const [cloudRows, setCloudRows] = useState<Array<Record<string, unknown>>>(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("perdin_cached_rekap_data");
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          return [];
        }
      }
    }
    return [];
  });
  const [isFetching, setIsFetching] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSavingAndSyncing, setIsSavingAndSyncing] = useState(false);

  // CRUD Modal States
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [editingRow, setEditingRow] = useState<Record<string, unknown> | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Delete Confirmation State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    index: number | null;
    name: string;
  }>({
    isOpen: false,
    index: null,
    name: "",
  });

  // Notification / Feedback State
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetchRekapFromSheet().then((res) => {
      if (isMounted && res.success && res.data) {
        setCloudRows(res.data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleManualRefresh = async () => {
    setIsFetching(true);
    const res = await fetchRekapFromSheet();
    setIsFetching(false);
    if (res.success && res.data) {
      setCloudRows(res.data);
      setViewSource("cloud");
      setStatusMessage({
        type: "success",
        text: `Berhasil memperbarui ${res.data.length} data rekap dari Google Spreadsheet.`,
      });
    } else {
      setStatusMessage({
        type: "error",
        text: res.message || "Gagal memuat data dari Spreadsheet.",
      });
    }
  };

  // Simpan Form SPJ aktif & langsung sinkronkan Rekap Perdin dari Google Sheet
  const handleSaveAndSync = async () => {
    if (rows.length === 0) {
      setStatusMessage({
        type: "error",
        text: "Belum ada data peserta/form untuk disimpan. Silakan isi form terlebih dahulu.",
      });
      return;
    }

    setIsSavingAndSyncing(true);
    setStatusMessage({
      type: "info",
      text: "Sedang menyimpan transaksi SPJ ke Google Spreadsheet & menyinkronkan Rekap Perdin...",
    });

    try {
      // 1. Simpan form aktif ke Google Spreadsheet
      const saveRes = await savePerdinToGoogleSheet(header, rows);
      if (!saveRes.success) {
        setStatusMessage({
          type: "error",
          text: saveRes.message || "Gagal menyimpan ke Google Spreadsheet.",
        });
        setIsSavingAndSyncing(false);
        return;
      }

      // 2. Tarik & sinkronkan data terbaru dari Google Spreadsheet ke Rekap Perdin
      const fetchRes = await fetchRekapFromSheet();
      if (fetchRes.success && fetchRes.data) {
        setCloudRows(fetchRes.data);
        setViewSource("cloud");
        if (typeof window !== "undefined") {
          localStorage.setItem("perdin_cached_rekap_data", JSON.stringify(fetchRes.data));
        }
        setStatusMessage({
          type: "success",
          text: `Berhasil! Transaksi SPJ disimpan dan ${fetchRes.data.length} baris Rekap Perdin berhasil disinkronkan dari Google Spreadsheet.`,
        });
      } else {
        setViewSource("cloud");
        setStatusMessage({
          type: "success",
          text: "Transaksi SPJ berhasil disimpan ke Spreadsheet, namun gagal memuat ulang rekap otomatis.",
        });
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setStatusMessage({
        type: "error",
        text: `Terjadi kendala: ${errMsg}`,
      });
    } finally {
      setIsSavingAndSyncing(false);
    }
  };

  // Headers standard 48 columns
  const standardHeaders = [
    "No SPBY",
    "JENIS PENGAJUAN",
    "No SPM",
    "",
    "NAMA PEGAWAI INTERNAL INSPEKTORAT",
    "NAMA EXTERNAL",
    "NIP",
    "Gol",
    "Jabatan",
    "Jenis Perdin",
    "Status Pegawai",
    "Nama Kegiatan",
    "No Surat Tugas",
    "Unit Kerja",
    "Angkutan",
    "Berangkat dari-",
    "Tujuan ke-",
    "Tgl Berangkat",
    "Tgl Kembali",
    "Nomor Tiket",
    "Nama Maskapai",
    "Kode Booking",
    "Boarding Pass (Ada/Tidak)",
    "Nama Penginapan",
    "Tanggal Check In",
    "Tanggal Check Out",
    "Jumlah Hari Menginap",
    "Lama Hari 100%",
    "Lama Hari 40%",
    "Total Hari",
    "UH 100% ()",
    "UH 40% ()",
    "UH Fullboard/Fullday/Halfday/Diklat",
    "Biaya Penginapan Biasa (Hotel)",
    "Penginapan 30%",
    "Biaya Fullboard/Fullday/Halfday ()",
    "Kurs ()",
    "Riil ()",
    "Harga Fare Tiket Pergi ()",
    "Harga FareTiket Pulang ()",
    "Transport Jakarta PP",
    "Transport Daerah PP",
    "Biaya Transport ()",
    "Sewa kendaraan ()",
    "Representatif ()",
    "Taksi Bandara",
    "Biaya Reschedule ()",
    "Total",
    "Nilai Nominal di Daftar Nominatif",
    "PENGEMBALIAN",
  ];

  // Map draft rows into 48-column objects
  const draftFormattedRows: Array<Record<string, unknown>> = rows.map((r) => {
    const noTiket =
      r.tiketDetailPergi?.noTiket || r.tiketDetailPulang?.noTiket
        ? `Berangkat : ${r.tiketDetailPergi?.noTiket || "-"}\nPulang : ${r.tiketDetailPulang?.noTiket || "-"}`
        : "";

    const maskapai =
      r.tiketDetailPergi?.maskapai || r.tiketDetailPulang?.maskapai
        ? `Berangkat : ${r.tiketDetailPergi?.maskapai || "-"}\nPulang : ${r.tiketDetailPulang?.maskapai || "-"}`
        : "";

    const kodeBooking =
      r.tiketDetailPergi?.kodeBooking || r.tiketDetailPulang?.kodeBooking
        ? `Berangkat : ${r.tiketDetailPergi?.kodeBooking || "-"}\nPulang : ${r.tiketDetailPulang?.kodeBooking || "-"}`
        : "";

    const farePergi =
      r.tiketDetailPergi?.harga !== undefined
        ? r.tiketDetailPergi.harga
        : r.tiket ? Math.round(r.tiket / 2) : 0;

    const farePulang =
      r.tiketDetailPulang?.harga !== undefined
        ? r.tiketDetailPulang.harga
        : r.tiket ? Math.round(r.tiket / 2) : 0;

    const biayaTransport =
      (r.transportasiDarat || 0) + (r.transportasiLokal || 0) + (r.dukunganTransportasi || 0);

    const biayaMeeting = (r.fulldayMeeting || 0) + (r.fullboardMeeting || 0);
    const uhMeeting = (r.biayaUhHalfday || 0) + (r.biayaUhFullboard || 0);

    return {
      "No SPBY": header.noSpby || "",
      "JENIS PENGAJUAN": header.jenisPengajuan || "RAMPUNG",
      "No SPM": header.noSpm || "",
      "": "",
      "NAMA PEGAWAI INTERNAL INSPEKTORAT": r.namaExternal ? "" : r.nama,
      "NAMA EXTERNAL": r.namaExternal || "",
      NIP: r.nip || "",
      Gol: r.golongan || "",
      Jabatan: r.jabatan || "",
      "Jenis Perdin": header.jenisPerdin || "Perdin Luar Kota",
      "Status Pegawai": r.nip ? "PNS" : "Non-PNS",
      "Nama Kegiatan": header.keteranganKegiatan || "",
      "No Surat Tugas": r.nomorSt || header.nomorStStaff || header.nomorStMaster || "",
      "Unit Kerja": header.unitKerja || "INSPEKTORAT",
      Angkutan: header.alatAngkut || "Angkutan Darat",
      "Berangkat dari-": header.berangkatDari || "Jakarta",
      "Tujuan ke-": r.tujuanKota || header.provinsiTujuan || "",
      "Tgl Berangkat": r.tanggalMulai || "",
      "Tgl Kembali": r.tanggalSelesai || "",
      "Nomor Tiket": noTiket,
      "Nama Maskapai": maskapai,
      "Kode Booking": kodeBooking,
      "Boarding Pass (Ada/Tidak)": r.boardingPass || (r.tiket > 0 ? "ADA" : ""),
      "Nama Penginapan": r.namaHotel || "",
      "Tanggal Check In": r.checkInHotel || (r.hotel > 0 ? r.tanggalMulai : ""),
      "Tanggal Check Out": r.checkOutHotel || (r.hotel > 0 ? r.tanggalSelesai : ""),
      "Jumlah Hari Menginap": r.malamHotel || (r.hotel > 0 ? 1 : 0),
      "Lama Hari 100%": r.hariUhBiasa !== undefined ? r.hariUhBiasa : r.lamaHari || 1,
      "Lama Hari 40%": r.hariUhBiasa60 || 0,
      "Total Hari": r.lamaHari || 1,
      "UH 100% ()": r.biayaUhBiasa || 0,
      "UH 40% ()": r.biayaUhBiasa60 || 0,
      "UH Fullboard/Fullday/Halfday/Diklat": uhMeeting || 0,
      "Biaya Penginapan Biasa (Hotel)": r.hotel || 0,
      "Penginapan 30%": r.penginapan30 || 0,
      "Biaya Fullboard/Fullday/Halfday ()": biayaMeeting || 0,
      "Kurs ()": r.kurs || 0,
      "Riil ()": r.pengRill || 0,
      "Harga Fare Tiket Pergi ()": farePergi,
      "Harga FareTiket Pulang ()": farePulang,
      "Transport Jakarta PP": r.transportJakartaPp || 0,
      "Transport Daerah PP": r.transportDaerahPp || 0,
      "Biaya Transport ()": biayaTransport,
      "Sewa kendaraan ()": r.sewaKendaraan || 0,
      "Representatif ()": r.representatif || 0,
      "Taksi Bandara": r.taksiBandara || 0,
      "Biaya Reschedule ()": r.biayaReschedule || 0,
      Total: r.totalJumlah || 0,
      "Nilai Nominal di Daftar Nominatif": r.totalJumlah || 0,
      PENGEMBALIAN: r.pengembalian || 0,
    };
  });

  const activeDataList = viewSource === "cloud" ? cloudRows : draftFormattedRows;

  // Filter based on search
  const filteredData = activeDataList.filter((item) => {
    const nama = String(item["NAMA PEGAWAI INTERNAL INSPEKTORAT"] || item["NAMA EXTERNAL"] || "");
    const nip = String(item["NIP"] || "");
    const jabatan = String(item["Jabatan"] || "");
    const kegiatan = String(item["Nama Kegiatan"] || "");
    const query = searchTerm.toLowerCase();

    return (
      nama.toLowerCase().includes(query) ||
      nip.toLowerCase().includes(query) ||
      jabatan.toLowerCase().includes(query) ||
      kegiatan.toLowerCase().includes(query)
    );
  });

  const grandTotal = filteredData.reduce((acc, r) => acc + (Number(r["Total"]) || 0), 0);

  // CRUD Handlers
  const handleOpenCreate = () => {
    setViewSource("cloud");
    setEditorMode("create");
    setEditingRow(null);
    setEditingIndex(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (item: Record<string, unknown>, filteredIdx: number) => {
    const actualIdx = cloudRows.findIndex((r) => r === item);
    setViewSource("cloud");
    setEditorMode("edit");
    setEditingRow(item);
    setEditingIndex(actualIdx !== -1 ? actualIdx : filteredIdx);
    setIsEditorOpen(true);
  };

  const handleOpenDelete = (item: Record<string, unknown>, filteredIdx: number) => {
    const actualIdx = cloudRows.findIndex((r) => r === item);
    const name = String(item["NAMA PEGAWAI INTERNAL INSPEKTORAT"] || item["NAMA EXTERNAL"] || "Pegawai");
    setDeleteModal({
      isOpen: true,
      index: actualIdx !== -1 ? actualIdx : filteredIdx,
      name,
    });
  };

  const handleSaveRow = (savedRow: Record<string, unknown>) => {
    let updatedRows: Array<Record<string, unknown>>;
    if (editorMode === "create") {
      updatedRows = [savedRow, ...cloudRows];
      setStatusMessage({
        type: "success",
        text: "Baris rekap baru berhasil ditambahkan ke memori lokal. Klik 'Sinkronkan ke Cloud' untuk memperbarui Google Spreadsheet.",
      });
    } else if (editingIndex !== null && editingIndex >= 0 && editingIndex < cloudRows.length) {
      updatedRows = [...cloudRows];
      updatedRows[editingIndex] = savedRow;
      setStatusMessage({
        type: "success",
        text: "Perubahan data berhasil disimpan di memori lokal. Klik 'Sinkronkan ke Cloud' untuk menyelaraskan ke Google Spreadsheet.",
      });
    } else {
      updatedRows = [savedRow, ...cloudRows];
    }

    setCloudRows(updatedRows);
    if (typeof window !== "undefined") {
      localStorage.setItem("perdin_cached_rekap_data", JSON.stringify(updatedRows));
    }
    setIsEditorOpen(false);
    setEditingRow(null);
    setEditingIndex(null);
  };

  const handleConfirmDelete = () => {
    if (deleteModal.index !== null && deleteModal.index >= 0 && deleteModal.index < cloudRows.length) {
      const deletedName = deleteModal.name;
      const updated = cloudRows.filter((_, idx) => idx !== deleteModal.index);
      setCloudRows(updated);
      if (typeof window !== "undefined") {
        localStorage.setItem("perdin_cached_rekap_data", JSON.stringify(updated));
      }
      setStatusMessage({
        type: "info",
        text: `Data perjalanan dinas untuk ${deletedName} berhasil dihapus dari daftar lokal. Klik 'Sinkronkan ke Cloud' untuk memperbarui Spreadsheet.`,
      });
    }
    setDeleteModal({ isOpen: false, index: null, name: "" });
  };

  const handleSyncToSpreadsheet = async () => {
    if (cloudRows.length === 0) {
      setStatusMessage({
        type: "error",
        text: "Tidak ada data rekap untuk disinkronkan.",
      });
      return;
    }

    setIsSyncing(true);
    setStatusMessage({
      type: "info",
      text: "Sedang menyinkronkan seluruh baris rekap ke Google Spreadsheet...",
    });

    try {
      const res = await syncAllRekapToGoogleSheet(cloudRows);
      if (res.success) {
        setStatusMessage({
          type: "success",
          text: res.message || "Berhasil menyinkronkan data ke Google Spreadsheet!",
        });
      } else {
        setStatusMessage({
          type: "error",
          text: res.message || "Gagal menyinkronkan data ke Google Spreadsheet.",
        });
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setStatusMessage({
        type: "error",
        text: `Gagal sinkronisasi: ${errMsg}`,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Export to Excel (.xlsx) matching active data
  const handleExportExcel = () => {
    const dataRows = filteredData.map((item) => {
      return standardHeaders.map((h) => item[h] ?? "");
    });

    const worksheetData = [standardHeaders, ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    // Auto-fit column widths
    const colWidths = standardHeaders.map((h, i) => {
      let maxLen = h.length;
      dataRows.forEach((row) => {
        const val = String(row[i] || "");
        if (val.length > maxLen) maxLen = Math.min(val.length, 45);
      });
      return { wch: Math.max(maxLen + 2, 12) };
    });
    ws["!cols"] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Perdin");
    const filename = `Rekap_Perdin_Inspektorat_${viewSource === "cloud" ? "CloudDB" : "Draft"}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  const formatCellDate = (val: unknown) => {
    if (!val) return "—";
    const str = String(val);
    if (str.includes("T")) {
      try {
        return str.split("T")[0];
      } catch {
        return str;
      }
    }
    return str;
  };

  return (
    <div className="space-y-4">
      {/* Consolidated Toolbar */}
      <div className="glass-base rounded-2xl p-4 md:p-5 space-y-3.5">
        {/* Row 1: Header Title & Primary Document Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200/70">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xs md:text-sm font-bold text-slate-900 tracking-tight">
                Rekap Pertanggungjawaban Perdin
              </h2>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/80">
                48 Kolom SPJ
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Data pertanggungjawaban dinas resmi terintegrasi dengan Google Spreadsheet Cloud
            </p>
          </div>

          {/* Primary Action Buttons (Simpan & Ekspor) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSaveAndSync}
              disabled={isSavingAndSyncing || rows.length === 0}
              className="btn-tactile inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold cursor-pointer disabled:opacity-50 shadow-2xs transition-all"
              title="Simpan form aktif ke Google Spreadsheet dan langsung perbarui Rekap Perdin"
            >
              <CloudUpload className={`w-3.5 h-3.5 ${isSavingAndSyncing ? "animate-bounce" : ""}`} />
              <span>{isSavingAndSyncing ? "Menyimpan & Sinkron..." : "Simpan & Sinkron ke Spreadsheet"}</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="btn-tactile inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor Excel</span>
            </button>
          </div>
        </div>

        {/* Status Notification Banner */}
        {statusMessage && (
          <div
            className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800"
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === "success" && <CheckCircle2 className="w-4 h-4 text-slate-900 shrink-0" />}
              {statusMessage.type === "error" && <AlertTriangle className="w-4 h-4 text-slate-900 shrink-0" />}
              {statusMessage.type === "info" && <RefreshCw className="w-4 h-4 text-slate-600 shrink-0 animate-spin" />}
              <p className="font-medium">{statusMessage.text}</p>
            </div>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="p-1 rounded hover:bg-slate-200 text-slate-500 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Row 2: Data Controls on Left, Search & Total on Right */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
          {/* Sisi Kiri: Switcher Sumber Data, Refresh, Tambah Baris, & Sinkron Tabel */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Source Switcher */}
            <div className="flex items-center p-0.5 bg-slate-200/60 rounded-lg border border-slate-300/50 text-xs font-medium">
              <button
                type="button"
                onClick={() => setViewSource("cloud")}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  viewSource === "cloud"
                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Cloud className="w-3.5 h-3.5 text-slate-600" />
                <span>Cloud DB ({cloudRows.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setViewSource("draft")}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  viewSource === "draft"
                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-slate-600" />
                <span>Draft ({rows.length})</span>
              </button>
            </div>

            {/* Refresh from Cloud */}
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isFetching}
              className="btn-tactile inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200/80 cursor-pointer disabled:opacity-50 shadow-2xs"
              title="Muat ulang data dari Google Spreadsheet"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isFetching ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>

            {/* Create New Row */}
            <button
              type="button"
              onClick={handleOpenCreate}
              className="btn-tactile inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-300/80 text-xs font-semibold cursor-pointer shadow-2xs"
              title="Tambah baris perjalanan dinas baru secara langsung"
            >
              <Plus className="w-3.5 h-3.5 text-[#0071e3]" />
              <span>Tambah Baris</span>
            </button>

            {/* Push / Sync All Rekap Edits to Google Sheet */}
            {viewSource === "cloud" && (
              <button
                type="button"
                onClick={handleSyncToSpreadsheet}
                disabled={isSyncing || cloudRows.length === 0}
                className="btn-tactile inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300/80 text-xs font-medium cursor-pointer disabled:opacity-50 shadow-2xs"
                title="Sinkronkan seluruh baris rekap ke Google Spreadsheet"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isSyncing ? "animate-spin" : ""}`} />
                <span>{isSyncing ? "Menyinkronkan..." : "Sinkron Perubahan Tabel"}</span>
              </button>
            )}
          </div>

          {/* Sisi Kanan: Input Pencarian & Total Biaya Metric */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex items-center min-w-[200px] sm:min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari pegawai, NIP, kegiatan..."
                className="input-glass h-8 pl-8 pr-2.5 text-xs w-full font-normal"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-slate-400 text-[11px] hidden sm:inline">
                {filteredData.length} data {viewSource === "cloud" ? "(Cloud)" : "(Draft)"}
              </span>
              <div className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs">
                Total Biaya: <span className="font-mono font-bold text-slate-900">Rp {grandTotal.toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main 48-Column Table */}
      <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs">
        <div className="overflow-x-auto max-h-[72vh]">
          <table className="w-full text-[11px] text-left border-collapse whitespace-nowrap">
            <thead className="bg-slate-100 text-slate-700 sticky top-0 z-30 font-semibold text-[11px] border-b border-slate-300">
              <tr>
                <th className="p-2 border-r border-slate-200 text-center w-10">No</th>
                {viewSource === "cloud" && (
                  <th className="p-2 border-r border-slate-200 text-center min-w-[70px] sticky left-0 z-50 bg-slate-100">
                    Aksi
                  </th>
                )}
                <th className="p-2 border-r border-slate-200 min-w-[90px]">No SPBY</th>
                <th className="p-2 border-r border-slate-200 min-w-[110px]">Jenis Pengajuan</th>
                <th className="p-2 border-r border-slate-200 min-w-[100px]">No SPM</th>
                <th
                  className={`p-2 border-r border-slate-200 min-w-[200px] ${
                    viewSource === "cloud" ? "sticky left-[70px]" : "sticky left-0"
                  } bg-slate-100 z-40 shadow-[2px_0_4px_rgba(0,0,0,0.06)]`}
                >
                  Nama Pegawai
                </th>
                <th className="p-2 border-r border-slate-200 min-w-[130px]">Nama External</th>
                <th className="p-2 border-r border-slate-200 min-w-[150px]">NIP</th>
                <th className="p-2 border-r border-slate-200 min-w-[60px]">Gol</th>
                <th className="p-2 border-r border-slate-200 min-w-[160px]">Jabatan</th>
                <th className="p-2 border-r border-slate-200 min-w-[110px]">Jenis Perdin</th>
                <th className="p-2 border-r border-slate-200 min-w-[180px]">Nama Kegiatan</th>
                <th className="p-2 border-r border-slate-200 min-w-[140px]">No Surat Tugas</th>
                <th className="p-2 border-r border-slate-200 min-w-[110px]">Angkutan</th>
                <th className="p-2 border-r border-slate-200 min-w-[110px]">Berangkat</th>
                <th className="p-2 border-r border-slate-200 min-w-[120px]">Tujuan</th>
                <th className="p-2 border-r border-slate-200 min-w-[95px]">Tgl Pergi</th>
                <th className="p-2 border-r border-slate-200 min-w-[95px]">Tgl Pulang</th>
                <th className="p-2 border-r border-slate-200 min-w-[150px]">No Tiket</th>
                <th className="p-2 border-r border-slate-200 min-w-[140px]">Maskapai</th>
                <th className="p-2 border-r border-slate-200 min-w-[120px]">Kode Booking</th>
                <th className="p-2 border-r border-slate-200 min-w-[90px] text-center">Boarding Pass</th>
                <th className="p-2 border-r border-slate-200 min-w-[150px]">Penginapan</th>
                <th className="p-2 border-r border-slate-200 min-w-[95px]">Check In</th>
                <th className="p-2 border-r border-slate-200 min-w-[95px]">Check Out</th>
                <th className="p-2 border-r border-slate-200 text-center min-w-[60px]">Malam</th>
                <th className="p-2 border-r border-slate-200 text-center min-w-[60px]">Hari</th>
                <th className="p-2 border-r border-slate-200 text-right min-w-[100px]">UH 100%</th>
                <th className="p-2 border-r border-slate-200 text-right min-w-[90px]">UH 40%</th>
                <th className="p-2 border-r border-slate-200 text-right min-w-[100px]">Biaya Hotel</th>
                <th className="p-2 border-r border-slate-200 text-right min-w-[95px]">Penginapan 30%</th>
                <th className="p-2 border-r border-slate-200 text-right min-w-[100px]">Fullboard/Meeting</th>
                <th className="p-2 border-r border-slate-200 text-right min-w-[90px]">Riil</th>
                <th className="p-2 border-r border-slate-200 text-right min-w-[100px]">Fare Pergi</th>
                <th className="p-2 border-r border-slate-200 text-right min-w-[100px]">Fare Pulang</th>
                <th className="p-2 border-r border-slate-200 text-right min-w-[105px]">Trans Jakarta PP</th>
                <th className="p-2 border-r border-slate-200 text-right min-w-[105px]">Trans Daerah PP</th>
                <th className="p-2 border-r border-slate-200 text-right min-w-[100px]">Transport Total</th>
                <th className="p-2 border-r border-slate-200 text-right min-w-[90px]">Sewa Mobil</th>
                <th className="p-2 border-r border-slate-200 text-right min-w-[95px]">Representatif</th>
                <th className="p-2 border-r border-slate-200 text-right min-w-[120px] bg-slate-200 text-slate-900 font-bold">
                  Total Biaya
                </th>
                <th className="p-2 text-right min-w-[95px]">Pengembalian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={viewSource === "cloud" ? 43 : 42} className="p-8 text-center text-slate-500 font-medium">
                    {isFetching ? (
                      <div className="flex items-center justify-center gap-2 text-slate-600">
                        <RefreshCw className="w-4 h-4 animate-spin text-slate-600" />
                        <span>Sedang memuat data dari Google Spreadsheet...</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-700">Belum ada data perjalanan dinas yang ditemukan.</p>
                        <p className="text-xs text-slate-400">
                          {viewSource === "cloud"
                            ? "Klik tombol '+ Tambah Baris' untuk membuat entri rekap baru, atau klik 'Refresh'."
                            : "Isi data peserta pada tab Input & Kalkulator."}
                        </p>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => {
                  const nama = String(item["NAMA PEGAWAI INTERNAL INSPEKTORAT"] || item["NAMA EXTERNAL"] || "—");
                  const namaExt = String(item["NAMA EXTERNAL"] || "");
                  const totalNum = Number(item["Total"]) || 0;
                  const uh100 = Number(item["UH 100% ()"]) || 0;
                  const uh40 = Number(item["UH 40% ()"]) || 0;
                  const hotelNum = Number(item["Biaya Penginapan Biasa (Hotel)"]) || 0;
                  const p30Num = Number(item["Penginapan 30%"]) || 0;
                  const meetingNum = Number(item["Biaya Fullboard/Fullday/Halfday ()"]) || 0;
                  const riilNum = Number(item["Riil ()"]) || 0;
                  const farePergiNum = Number(item["Harga Fare Tiket Pergi ()"]) || 0;
                  const farePulangNum = Number(item["Harga FareTiket Pulang ()"]) || 0;
                  const transJkt = Number(item["Transport Jakarta PP"]) || 0;
                  const transDaerah = Number(item["Transport Daerah PP"]) || 0;
                  const transTotal = Number(item["Biaya Transport ()"]) || 0;
                  const sewaMobil = Number(item["Sewa kendaraan ()"]) || 0;
                  const repNum = Number(item["Representatif ()"]) || 0;
                  const pengembalianNum = Number(item["PENGEMBALIAN"]) || 0;

                  return (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="p-2 border-r border-slate-200 text-center font-medium text-slate-400">
                        {idx + 1}
                      </td>
                      {viewSource === "cloud" && (
                        <td className="p-2 border-r border-slate-200 text-center sticky left-0 z-20 bg-white shadow-[2px_0_4px_rgba(0,0,0,0.04)]">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(item, idx)}
                              title="Edit baris rekap ini"
                              className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenDelete(item, idx)}
                              title="Hapus baris rekap ini"
                              className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                      <td className="p-2 border-r border-slate-200 font-mono text-slate-600">
                        {String(item["No SPBY"] || "—")}
                      </td>
                      <td className="p-2 border-r border-slate-200 font-medium text-slate-800">
                        {String(item["JENIS PENGAJUAN"] || "RAMPUNG")}
                      </td>
                      <td className="p-2 border-r border-slate-200 font-mono font-semibold text-slate-800">
                        {String(item["No SPM"] || "—")}
                      </td>
                      <td
                        className={`p-2 border-r border-slate-200 font-semibold text-slate-900 ${
                          viewSource === "cloud" ? "sticky left-[70px]" : "sticky left-0"
                        } bg-white shadow-[2px_0_4px_rgba(0,0,0,0.04)]`}
                      >
                        {nama}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-slate-600">
                        {namaExt || "—"}
                      </td>
                      <td className="p-2 border-r border-slate-200 font-mono text-slate-600">
                        {String(item["NIP"] || "—")}
                      </td>
                      <td className="p-2 border-r border-slate-200 font-medium">
                        {String(item["Gol"] || "—")}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-slate-700">
                        {String(item["Jabatan"] || "—")}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-slate-700">
                        {String(item["Jenis Perdin"] || "Perdin Luar Kota")}
                      </td>
                      <td className="p-2 border-r border-slate-200 font-medium text-slate-800 max-w-xs truncate" title={String(item["Nama Kegiatan"] || "")}>
                        {String(item["Nama Kegiatan"] || "—")}
                      </td>
                      <td className="p-2 border-r border-slate-200 font-mono text-slate-700">
                        {String(item["No Surat Tugas"] || "—")}
                      </td>
                      <td className="p-2 border-r border-slate-200">
                        {String(item["Angkutan"] || "Angkutan Darat")}
                      </td>
                      <td className="p-2 border-r border-slate-200">
                        {String(item["Berangkat dari-"] || "Jakarta")}
                      </td>
                      <td className="p-2 border-r border-slate-200 font-medium text-slate-800">
                        {String(item["Tujuan ke-"] || "—")}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-slate-600 font-mono">
                        {formatCellDate(item["Tgl Berangkat"])}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-slate-600 font-mono">
                        {formatCellDate(item["Tgl Kembali"])}
                      </td>
                      <td className="p-2 border-r border-slate-200 font-mono text-slate-700 whitespace-pre-line">
                        {String(item["Nomor Tiket"] || "—")}
                      </td>
                      <td className="p-2 border-r border-slate-200 whitespace-pre-line">
                        {String(item["Nama Maskapai"] || "—")}
                      </td>
                      <td className="p-2 border-r border-slate-200 font-mono font-medium text-slate-800 whitespace-pre-line">
                        {String(item["Kode Booking"] || "—")}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-center">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            String(item["Boarding Pass (Ada/Tidak)"]).toUpperCase() === "ADA"
                              ? "bg-slate-100 text-slate-700"
                              : "bg-slate-50 text-slate-400"
                          }`}
                        >
                          {String(item["Boarding Pass (Ada/Tidak)"] || "—")}
                        </span>
                      </td>
                      <td className="p-2 border-r border-slate-200 font-medium">
                        {String(item["Nama Penginapan"] || "—")}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-slate-600 font-mono">
                        {formatCellDate(item["Tanggal Check In"])}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-slate-600 font-mono">
                        {formatCellDate(item["Tanggal Check Out"])}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-center font-medium">
                        {String(item["Jumlah Hari Menginap"] || 0)}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-center font-medium">
                        {String(item["Total Hari"] || 1)}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right font-mono">
                        {uh100 ? `Rp ${uh100.toLocaleString("id-ID")}` : "—"}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right font-mono">
                        {uh40 ? `Rp ${uh40.toLocaleString("id-ID")}` : "—"}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right font-mono">
                        {hotelNum ? `Rp ${hotelNum.toLocaleString("id-ID")}` : "—"}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right font-mono">
                        {p30Num ? `Rp ${p30Num.toLocaleString("id-ID")}` : "—"}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right font-mono">
                        {meetingNum ? `Rp ${meetingNum.toLocaleString("id-ID")}` : "—"}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right font-mono">
                        {riilNum ? `Rp ${riilNum.toLocaleString("id-ID")}` : "—"}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right font-mono">
                        {farePergiNum ? `Rp ${farePergiNum.toLocaleString("id-ID")}` : "—"}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right font-mono">
                        {farePulangNum ? `Rp ${farePulangNum.toLocaleString("id-ID")}` : "—"}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right font-mono">
                        {transJkt ? `Rp ${transJkt.toLocaleString("id-ID")}` : "—"}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right font-mono">
                        {transDaerah ? `Rp ${transDaerah.toLocaleString("id-ID")}` : "—"}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right font-mono">
                        {transTotal ? `Rp ${transTotal.toLocaleString("id-ID")}` : "—"}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right font-mono">
                        {sewaMobil ? `Rp ${sewaMobil.toLocaleString("id-ID")}` : "—"}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right font-mono">
                        {repNum ? `Rp ${repNum.toLocaleString("id-ID")}` : "—"}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-slate-900 bg-slate-50">
                        Rp {totalNum.toLocaleString("id-ID")}
                      </td>
                      <td className="p-2 text-right font-mono text-slate-600">
                        {pengembalianNum ? `Rp ${pengembalianNum.toLocaleString("id-ID")}` : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredData.length > 0 && (
              <tfoot className="bg-slate-100/90 font-semibold border-t border-slate-200 text-slate-800 sticky bottom-0 z-20">
                <tr>
                  <td colSpan={viewSource === "cloud" ? 6 : 5} className="p-2.5 text-center">
                    Total ({filteredData.length} baris data)
                  </td>
                  <td colSpan={34} className="p-2.5 text-right">
                    Grand Total:
                  </td>
                  <td className="p-2.5 text-right font-mono font-bold text-slate-900 bg-slate-200/60">
                    Rp {grandTotal.toLocaleString("id-ID")}
                  </td>
                  <td className="p-2.5 text-right font-mono"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Modal Editor for 48 Columns SPJ (Create / Edit) */}
      <ModalRekapRowEditor
        isOpen={isEditorOpen}
        mode={editorMode}
        initialData={editingRow}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingRow(null);
          setEditingIndex(null);
        }}
        onSave={handleSaveRow}
      />

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2.5 bg-red-50 rounded-xl border border-red-100">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Hapus Baris Rekap?</h3>
                <p className="text-xs text-slate-500">
                  Data perjalanan dinas ini akan dihapus dari daftar rekap.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-700">
              <span className="text-slate-400">Pegawai:</span>{" "}
              <span className="font-semibold text-slate-900">{deleteModal.name}</span>
            </div>

            <p className="text-[11px] text-slate-400">
              Catatan: Setelah menghapus, Anda dapat mengeklik tombol{" "}
              <span className="font-semibold text-slate-600">Sinkron ke Cloud</span> untuk memperbarui data di Google Spreadsheet secara permanen.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, index: null, name: "" })}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Data</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

