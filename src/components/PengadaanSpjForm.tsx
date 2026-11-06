"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  HeaderData,
  NomorMemo,
  Pegawai,
  PengadaanItemRow,
  PengadaanTaxConfig,
} from "@/lib/types";
import {
  LIST_NOMOR_KOMPONEN,
  LIST_NOMOR_MAK,
  OPSI_PERIHAL_MEMORANDUM,
  getItemDetailsForMak,
  getCustomItemDetails,
  ItemDetailItem,
} from "@/data/mak_akun";
import {
  calculatePengadaanTotals,
  formatNominalExcel,
  getDefaultPengadaanItems,
  getDefaultPengadaanTax,
  getSpjTypeMeta,
} from "@/lib/pengadaanHelper";
import {
  getDefaultMemoNumber,
  getMonthRoman,
  parseMemoNumberParts,
  updateMemoNumberWithDate,
} from "@/lib/calc";
import { terbilang } from "@/lib/terbilang";
import {
  FileText,
  Landmark,
  Users2,
  Plus,
  Trash2,
  Wand2,
  BookmarkCheck,
  FolderKanban,
  Calculator,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Save,
  Receipt,
  FileSpreadsheet,
  Info,
  Sparkles,
} from "lucide-react";

interface PengadaanSpjFormProps {
  header: HeaderData;
  setHeader: React.Dispatch<React.SetStateAction<HeaderData>>;
  memoList: NomorMemo[];
  pegawaiList: Pegawai[];
  onGenerateMemoNumber: () => void;
  onOpenDaftarKegiatan?: () => void;
  onOpenDaftarMemo?: () => void;
  onCreateNewKegiatan?: () => void;
  editingOriginalId?: string | null;
  isSaved: boolean;
  hasChanges: boolean;
  isSaving: boolean;
  saveFeedback: { type: "success" | "error" | "info"; text: string } | null;
  onSaveOrUpdate: () => void;
  onClearFeedback: () => void;
  onNavigateTab: (tab: "kwitansi" | "memorandum" | "nominatif") => void;
}

export const PengadaanSpjForm: React.FC<PengadaanSpjFormProps> = ({
  header,
  setHeader,
  memoList,
  pegawaiList,
  onGenerateMemoNumber,
  onOpenDaftarKegiatan,
  onOpenDaftarMemo,
  editingOriginalId,
  isSaved,
  hasChanges,
  isSaving,
  saveFeedback,
  onSaveOrUpdate,
  onClearFeedback,
  onNavigateTab,
}) => {
  const spjType = header.spjType || "KONSUMSI";
  const spjMeta = getSpjTypeMeta(spjType);

  const [customItems, setCustomItems] = useState<ItemDetailItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isManualKomponen, setIsManualKomponen] = useState(false);
  const [isCustomPerihalMemo, setIsCustomPerihalMemo] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      setCustomItems(getCustomItemDetails());
    } catch {
      // ignore
    }
  }, []);

  // Ensure pengadaanItems and pengadaanTax exist
  const items: PengadaanItemRow[] = useMemo(() => {
    if (header.pengadaanItems && header.pengadaanItems.length > 0) {
      return header.pengadaanItems;
    }
    return getDefaultPengadaanItems(spjType);
  }, [header.pengadaanItems, spjType]);

  const tax: PengadaanTaxConfig = useMemo(() => {
    if (header.pengadaanTax) {
      return header.pengadaanTax;
    }
    return getDefaultPengadaanTax(
      spjType,
      header.penanggungJawabNama || "Reni Sutaryo, S.Si., M.Adm.Pemb",
      header.penanggungJawabNip || "19791126200604 2 014"
    );
  }, [header.pengadaanTax, spjType, header.penanggungJawabNama, header.penanggungJawabNip]);

  const calc = useMemo(() => calculatePengadaanTotals(items, tax), [items, tax]);

  const availableItemDetails = useMemo(() => {
    return getItemDetailsForMak(header.nomorKomp, header.nomorMak, isMounted ? customItems : []);
  }, [header.nomorKomp, header.nomorMak, isMounted, customItems]);

  const memoParts = useMemo(() => {
    return parseMemoNumberParts(header.nomorMemo, header.tanggalMemo);
  }, [header.nomorMemo, header.tanggalMemo]);

  const currentMemoRomanMonth = useMemo(() => {
    return getMonthRoman(header.tanggalMemo) || getMonthRoman(new Date()) || "XI";
  }, [header.tanggalMemo]);

  const currentMemoYear = useMemo(() => {
    if (header.tanggalMemo) {
      const d = new Date(header.tanggalMemo);
      if (!isNaN(d.getTime())) return String(d.getFullYear());
    }
    return String(new Date().getFullYear());
  }, [header.tanggalMemo]);

  const handleChangeHeader = <K extends keyof HeaderData>(field: K, value: HeaderData[K]) => {
    if (field === "tanggalMemo" && typeof value === "string") {
      setHeader((prev) => {
        const next = { ...prev, [field]: value };
        const currentMemo = prev.nomorMemo || getDefaultMemoNumber(value, "xxx");
        next.nomorMemo = updateMemoNumberWithDate(currentMemo, value);
        return next;
      });
      return;
    }
    setHeader((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdateItems = (nextItems: PengadaanItemRow[]) => {
    const normalized = nextItems.map((it, idx) => ({
      ...it,
      no: idx + 1,
      subTotal: (Number(it.hargaSatuan) || 0) * (Number(it.jumlah) || 0),
    }));
    setHeader((prev) => ({
      ...prev,
      pengadaanItems: normalized,
    }));
  };

  const handleItemFieldChange = (
    index: number,
    field: keyof PengadaanItemRow,
    value: string | number
  ) => {
    const updated = [...items];
    const current = { ...updated[index], [field]: value };
    current.subTotal = (Number(current.hargaSatuan) || 0) * (Number(current.jumlah) || 0);
    updated[index] = current;
    handleUpdateItems(updated);
  };

  const handleAddRow = () => {
    const newRow: PengadaanItemRow = {
      id: `${spjType.toLowerCase()}-${Date.now()}`,
      no: items.length + 1,
      uraian: "",
      hargaSatuan: 0,
      jumlah: 1,
      satuan: spjMeta.defaultSatuan,
      subTotal: 0,
      ppnJenis: tax.ppnMode !== "NONE" ? "INCLUDE" : "NONE",
    };
    handleUpdateItems([...items, newRow]);
  };

  const handleRemoveRow = (index: number) => {
    if (items.length <= 1) return;
    const filtered = items.filter((_, i) => i !== index);
    handleUpdateItems(filtered);
  };

  const handleResetDefaultItems = () => {
    const defItems = getDefaultPengadaanItems(spjType);
    const defTax = getDefaultPengadaanTax(
      spjType,
      tax.penerimaNama || header.penanggungJawabNama,
      tax.penerimaNip || header.penanggungJawabNip
    );
    setHeader((prev) => ({
      ...prev,
      pengadaanItems: defItems,
      pengadaanTax: defTax,
    }));
  };

  const handleUpdateTax = (partial: Partial<PengadaanTaxConfig>) => {
    const nextTax: PengadaanTaxConfig = {
      ...tax,
      ...partial,
    };
    setHeader((prev) => ({
      ...prev,
      pengadaanTax: nextTax,
      penanggungJawabNama:
        partial.penerimaNama !== undefined ? partial.penerimaNama : prev.penanggungJawabNama,
      penanggungJawabNip:
        partial.penerimaNip !== undefined ? partial.penerimaNip : prev.penanggungJawabNip,
    }));
  };

  // Signatory helpers
  const handleSelectPpk = (nama: string) => {
    const found = pegawaiList.find((p) => p.nama === nama);
    if (found) {
      setHeader((prev) => ({
        ...prev,
        ppkNama: found.nama,
        ppkNip: found.nip,
        ppkJabatan: found.jabatan,
      }));
    } else {
      setHeader((prev) => ({ ...prev, ppkNama: nama }));
    }
  };

  const handleSelectPenerimaDropdown = (nama: string) => {
    const found = pegawaiList.find((p) => p.nama === nama);
    if (found) {
      handleUpdateTax({
        penerimaNama: found.nama,
        penerimaNip: found.nip,
        isPenerimaCustom: false,
      });
    } else {
      handleUpdateTax({
        penerimaNama: nama,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* =====================================================================
          SECTION 1: IDENTITAS KEGIATAN & MEMORANDUM
         ===================================================================== */}
      <section className="glass-base rounded-2xl p-5 space-y-5 border border-slate-200/90 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">
                  1. Identitas {spjMeta.label} &amp; Memorandum
                </h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${spjMeta.badgeColor}`}>
                  {spjMeta.shortLabel}
                </span>
                {header.idKegiatan && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                    {header.idKegiatan}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">{spjMeta.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenDaftarKegiatan && (
              <button
                type="button"
                onClick={onOpenDaftarKegiatan}
                className="btn-tactile inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 cursor-pointer"
              >
                <FolderKanban className="w-3.5 h-3.5 text-blue-600" />
                <span>Riwayat Kegiatan</span>
              </button>
            )}
            {onOpenDaftarMemo && (
              <button
                type="button"
                onClick={onOpenDaftarMemo}
                className="btn-tactile inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 cursor-pointer"
              >
                <BookmarkCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Daftar Memo ({memoList.length})</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Uraian Pembayaran / Kegiatan */}
          <div className="lg:col-span-7 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Uraian Kegiatan / Untuk Pembayaran (Tampil di Kuitansi, Nominatif &amp; Memo)
              </label>
              <button
                type="button"
                onClick={() => handleChangeHeader("keteranganKegiatan", spjMeta.defaultUraianKegiatan)}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer"
                title="Isi dengan contoh kalimat baku"
              >
                <Sparkles className="w-3 h-3" />
                <span>Isi Template Baku</span>
              </button>
            </div>
            <textarea
              rows={3}
              value={header.keteranganKegiatan}
              onChange={(e) => handleChangeHeader("keteranganKegiatan", e.target.value)}
              placeholder={spjMeta.defaultUraianKegiatan}
              className="input-clean w-full p-3 text-xs leading-relaxed"
            />
          </div>

          {/* Tanggal & Nomor Memorandum */}
          <div className="lg:col-span-5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Tanggal Kegiatan / Kuitansi
                </label>
                <input
                  type="date"
                  value={header.tanggalSpd}
                  onChange={(e) => handleChangeHeader("tanggalSpd", e.target.value)}
                  className="input-clean w-full h-9 px-3 text-xs font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Tanggal Memorandum
                </label>
                <input
                  type="date"
                  value={header.tanggalMemo}
                  onChange={(e) => handleChangeHeader("tanggalMemo", e.target.value)}
                  className="input-clean w-full h-9 px-3 text-xs font-medium"
                />
              </div>
            </div>

            {/* Nomor Memorandum Segmented Input */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Nomor Memorandum
                </label>
                <button
                  type="button"
                  onClick={onGenerateMemoNumber}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  <Wand2 className="w-3 h-3" />
                  <span>Ambil Nomor Urut Berikutnya</span>
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex items-center flex-1 h-9 rounded-xl border border-slate-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500">
                  <span className="px-2.5 text-xs font-mono font-bold text-slate-500 bg-slate-50 border-r border-slate-200 h-full flex items-center">
                    M.
                  </span>
                  <input
                    type="text"
                    value={memoParts.seqNumber === "xxx" ? "" : memoParts.seqNumber}
                    onChange={(e) => {
                      const num = e.target.value.trim() || "xxx";
                      const newMemo = `M.${num}/INS/PPK/${currentMemoRomanMonth}/${currentMemoYear}`;
                      handleChangeHeader("nomorMemo", newMemo);
                    }}
                    placeholder="xxx"
                    className="w-16 px-2 text-xs font-mono font-bold text-center text-slate-900 focus:outline-none"
                  />
                  <span className="px-2.5 text-xs font-mono text-slate-600 bg-slate-50 border-l border-slate-200 h-full flex items-center flex-1 truncate">
                    /INS/PPK/{currentMemoRomanMonth}/{currentMemoYear}
                  </span>
                </div>
              </div>
            </div>

            {/* Perihal Memorandum */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Perihal Memorandum (Hal)
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomPerihalMemo((prev) => !prev)}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  {isCustomPerihalMemo ? "Pilih dari Daftar Baku" : "Ketik Perihal Custom"}
                </button>
              </div>
              {isCustomPerihalMemo ? (
                <input
                  type="text"
                  value={header.keteranganMemo}
                  onChange={(e) => handleChangeHeader("keteranganMemo", e.target.value)}
                  placeholder={spjMeta.defaultPerihalMemo}
                  className="input-clean w-full h-9 px-3 text-xs"
                />
              ) : (
                <select
                  value={
                    OPSI_PERIHAL_MEMORANDUM.includes(header.keteranganMemo)
                      ? header.keteranganMemo
                      : spjMeta.defaultPerihalMemo
                  }
                  onChange={(e) => handleChangeHeader("keteranganMemo", e.target.value)}
                  className="input-clean w-full h-9 px-3 text-xs font-medium cursor-pointer"
                >
                  {OPSI_PERIHAL_MEMORANDUM.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 2: PEMBEBANAN ANGGARAN (KOMPONEN & MAK)
         ===================================================================== */}
      <section className="glass-base rounded-2xl p-5 space-y-4 border border-slate-200/90 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                2. Pembebanan Anggaran (Sub Kegiatan, Komponen &amp; Akun MAK)
              </h2>
              <p className="text-xs text-slate-500">
                Otomatis terhubung ke Kuitansi (Box Kanan Atas) dan Lampiran Memorandum Halaman 2 &amp; 3
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Nomor Komponen / Sub Keg */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Kode Sub Kegiatan / Komponen
              </label>
              <button
                type="button"
                onClick={() => setIsManualKomponen((prev) => !prev)}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                {isManualKomponen ? "Pilih Preset DIPA" : "Input Manual"}
              </button>
            </div>
            {isManualKomponen ? (
              <input
                type="text"
                value={header.nomorKomp}
                onChange={(e) => handleChangeHeader("nomorKomp", e.target.value)}
                placeholder="Contoh: WA.7457.EBD.Z28.051.A"
                className="input-clean w-full h-9 px-3 text-xs font-mono"
              />
            ) : (
              <select
                value={header.nomorKomp || spjMeta.defaultKomp}
                onChange={(e) => {
                  const val = e.target.value;
                  const found = LIST_NOMOR_KOMPONEN.find((k) => k.kode === val);
                  setHeader((prev) => ({
                    ...prev,
                    nomorKomp: val,
                    detailKomponen: found ? found.nama : prev.detailKomponen,
                  }));
                }}
                className="input-clean w-full h-9 px-3 text-xs font-mono cursor-pointer"
              >
                <option value="">-- Pilih Kode Komponen --</option>
                {LIST_NOMOR_KOMPONEN.map((k) => (
                  <option key={k.kode} value={k.kode}>
                    {k.kode} — {k.nama}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Nomor Akun MAK */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Nomor Akun MAK
            </label>
            <select
              value={header.nomorMak || spjMeta.defaultMak}
              onChange={(e) => handleChangeHeader("nomorMak", e.target.value)}
              className="input-clean w-full h-9 px-3 text-xs font-mono cursor-pointer"
            >
              {LIST_NOMOR_MAK.map((m) => (
                <option key={m.kode} value={m.kode}>
                  {m.kode} — {m.nama}
                </option>
              ))}
            </select>
          </div>

          {/* Pilih Cepat Item Detail */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Item Detail POK / DIPA ({availableItemDetails.length} tersedia)
            </label>
            <select
              value={header.itemDetail || ""}
              onChange={(e) => {
                const kode = e.target.value;
                const found = availableItemDetails.find((it) => it.kode === kode);
                setHeader((prev) => ({
                  ...prev,
                  itemDetail: kode,
                  keteranganItemDetail: found ? found.nama : prev.keteranganItemDetail,
                }));
              }}
              className="input-clean w-full h-9 px-3 text-xs cursor-pointer"
            >
              <option value="">-- Pilih Item Detail --</option>
              {availableItemDetails.map((item) => (
                <option key={`${item.fullMak}-${item.kode}`} value={item.kode}>
                  [{item.kode}] {item.nama}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 3: TABEL RINCIAN ITEM NOMINATIF & KALKULATOR PAJAK (PPN & PPh)
         ===================================================================== */}
      <section className="glass-base rounded-2xl p-5 space-y-5 border border-slate-200/90 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                3. Rincian Item Daftar Nominatif &amp; Perhitungan Pajak ({spjMeta.shortLabel})
              </h2>
              <p className="text-xs text-slate-500">
                Formula menghitung otomatis Sub Total Bruto, PPN (11/111 atau Faktur), DPP, Potongan PPh 22 / PPh 23, dan Jumlah Bersih
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefaultItems}
              className="btn-tactile inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 cursor-pointer"
              title="Muat contoh data sesuai file Excel SPJ 2026"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Muat Contoh Excel</span>
            </button>
            <button
              type="button"
              onClick={handleAddRow}
              className="btn-tactile inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Baris Item</span>
            </button>
          </div>
        </div>

        {/* Tabel Input Rincian Item */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <th className="p-2.5 text-center w-12 border-r border-slate-200">No</th>
                <th className="p-2.5 text-left min-w-[240px] border-r border-slate-200">
                  URAIAN ITEM / BARANG / JASA
                </th>
                <th className="p-2.5 text-right w-44 border-r border-slate-200">
                  {spjMeta.colHargaLabel} (Rp)
                </th>
                <th className="p-2.5 text-center w-28 border-r border-slate-200">
                  {spjMeta.colJumlahLabel}
                </th>
                <th className="p-2.5 text-center w-32 border-r border-slate-200">
                  SATUAN
                </th>
                <th className="p-2.5 text-right w-44 border-r border-slate-200">
                  SUB TOTAL (Rp)
                </th>
                <th className="p-2.5 text-center w-14">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {items.map((item, idx) => {
                const rowSub = (Number(item.hargaSatuan) || 0) * (Number(item.jumlah) || 0);
                return (
                  <tr key={item.id || idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-2 text-center font-mono font-bold text-slate-500 border-r border-slate-200">
                      {idx + 1}
                    </td>
                    <td className="p-2 border-r border-slate-200">
                      <input
                        type="text"
                        value={item.uraian}
                        onChange={(e) => handleItemFieldChange(idx, "uraian", e.target.value)}
                        placeholder="Ketik uraian item (misal: Makan Siang, Kertas A4, Sewa Mobil)..."
                        className="input-clean w-full h-8 px-2.5 text-xs font-medium"
                      />
                    </td>
                    <td className="p-2 border-r border-slate-200">
                      <input
                        type="number"
                        min={0}
                        step={500}
                        value={item.hargaSatuan || ""}
                        onChange={(e) =>
                          handleItemFieldChange(idx, "hargaSatuan", Number(e.target.value) || 0)
                        }
                        placeholder="0"
                        className="input-clean w-full h-8 px-2.5 text-xs font-mono text-right"
                      />
                    </td>
                    <td className="p-2 border-r border-slate-200">
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={item.jumlah || ""}
                        onChange={(e) =>
                          handleItemFieldChange(idx, "jumlah", Number(e.target.value) || 0)
                        }
                        placeholder="1"
                        className="input-clean w-full h-8 px-2 text-xs font-mono text-center"
                      />
                    </td>
                    <td className="p-2 border-r border-slate-200">
                      <input
                        type="text"
                        list={`satuan-list-${spjType}`}
                        value={item.satuan}
                        onChange={(e) => handleItemFieldChange(idx, "satuan", e.target.value)}
                        placeholder={spjMeta.defaultSatuan}
                        className="input-clean w-full h-8 px-2 text-xs text-center"
                      />
                      <datalist id={`satuan-list-${spjType}`}>
                        {spjMeta.satuanOptions.map((s) => (
                          <option key={s} value={s} />
                        ))}
                      </datalist>
                    </td>
                    <td className="p-2 text-right font-mono font-bold text-slate-900 border-r border-slate-200 bg-slate-50/50">
                      Rp {rowSub.toLocaleString("id-ID")}
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(idx)}
                        disabled={items.length <= 1}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 transition-colors cursor-pointer"
                        title="Hapus baris"
                      >
                        <Trash2 className="w-3.5 h-3.5 mx-auto" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Panel Konfigurasi Pajak (PPN & PPh) + Live Preview Ringkasan Nominatif */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
          {/* Kiri: Pengaturan PPN & PPh + Panduan Dasar Pajak */}
          <div className="lg:col-span-7 space-y-4 bg-slate-50/80 rounded-2xl p-4 border border-slate-200/90">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Pengaturan Pajak (Sesuai Sheet DASAR PAJAK Excel)
              </h3>
              <span className="text-[11px] font-medium text-slate-500">
                Otomatis masuk ke Tabel Nominatif
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Pilihan PPN */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  1. Perhitungan PPN (Kolom H &amp; I)
                </label>
                <select
                  value={tax.ppnMode}
                  onChange={(e) =>
                    handleUpdateTax({
                      ppnMode: e.target.value as PengadaanTaxConfig["ppnMode"],
                    })
                  }
                  className="input-clean w-full h-9 px-3 text-xs font-semibold cursor-pointer bg-white"
                >
                  <option value="INCLUDE_11_111">
                    INCLUDE — Rumus Otomatis (Sub Total × 11/111)
                  </option>
                  <option value="MANUAL">
                    INCLUDE — Input Manual Sesuai Faktur Pajak
                  </option>
                  <option value="NONE">
                    Tanpa PPN (-) — Non-PKP / Tidak Kena PPN
                  </option>
                </select>

                {tax.ppnMode === "MANUAL" && (
                  <div className="pt-1 space-y-1">
                    <label className="text-[11px] font-medium text-slate-600">
                      Nominal PPN di Faktur Pajak (Rp):
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={tax.ppnManualValue || ""}
                      onChange={(e) =>
                        handleUpdateTax({ ppnManualValue: Number(e.target.value) || 0 })
                      }
                      placeholder="Masukkan nilai PPN dari Faktur Pajak..."
                      className="input-clean w-full h-8 px-2.5 text-xs font-mono bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Pilihan PPh */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  2. Jenis Potongan PPh (Kolom K &amp; L)
                </label>
                <select
                  value={tax.pphType}
                  onChange={(e) =>
                    handleUpdateTax({
                      pphType: e.target.value as PengadaanTaxConfig["pphType"],
                    })
                  }
                  className="input-clean w-full h-9 px-3 text-xs font-semibold cursor-pointer bg-white"
                >
                  <option value="PPH23_2">
                    PPh Pasal 23 (2%) — Katering Berbadan Hukum / Sewa Mobil NPWP
                  </option>
                  <option value="PPH22_1_5">
                    PPh Pasal 22 (1,5%) — Belanja Barang ATK &amp; Semkit / Bon &gt; 2 Jt
                  </option>
                  <option value="PPH23_4">
                    PPh Pasal 23 (4%) — Sewa Kendaraan Tanpa NPWP
                  </option>
                  <option value="NONE">
                    Tanpa PPh (0%) — Diklat PNBP / Bon Konsumsi &le; 2 Jt
                  </option>
                </select>
              </div>
            </div>

            {/* Info Box Dasar Pajak */}
            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/70 text-[11px] text-slate-700 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-blue-900">
                <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Pedoman Dasar Pajak (Excel SPJ 2026):</span>
              </div>
              {spjType === "KONSUMSI" && (
                <ul className="list-disc list-inside space-y-0.5 text-slate-600 pl-1">
                  <li>
                    <strong>Ada Invoice / Berbadan Hukum (CV, PT):</strong> Berapapun nominalnya dikenakan <strong>PPh 23 (2%)</strong>, serta <strong>PPN (11/111)</strong> jika di atas Rp 2 Juta.
                  </li>
                  <li>
                    <strong>Bon Biasa (Non Badan Hukum):</strong> Di bawah Rp 2 Juta <strong>Tanpa Pajak</strong>; di atas Rp 2 Juta dikenakan <strong>PPN (11/111) + PPh 22 (1,5%)</strong>.
                  </li>
                </ul>
              )}
              {spjType === "ATK" && (
                <ul className="list-disc list-inside space-y-0.5 text-slate-600 pl-1">
                  <li>
                    <strong>Pembelian Semkit &amp; ATK:</strong> Menggunakan <strong>PPN Include (11/111)</strong> (atau nominal dari Faktur Pajak) dan dipotong <strong>PPh 22 (1,5%)</strong> dari DPP (Sub Total dikurangi PPN).
                  </li>
                </ul>
              )}
              {spjType === "SEWA" && (
                <ul className="list-disc list-inside space-y-0.5 text-slate-600 pl-1">
                  <li>
                    <strong>Sewa Kendaraan / Mobil:</strong> Jika penyedia memiliki NPWP dikenakan <strong>PPh 23 (2%)</strong>; jika tidak memiliki NPWP dikenakan <strong>PPh 23 (4%)</strong>.
                  </li>
                </ul>
              )}
              {spjType === "DIKLAT" && (
                <ul className="list-disc list-inside space-y-0.5 text-slate-600 pl-1">
                  <li>
                    <strong>Biaya Diklat / PNBP Instansi:</strong> Umumnya <strong>Tanpa PPN &amp; Tanpa PPh (0%)</strong>, sehingga nilai Kuitansi sama dengan nilai bersih Nominatif.
                  </li>
                </ul>
              )}
            </div>
          </div>

          {/* Kanan: Kartu Ringkasan Kalkulasi Real-Time */}
          <div className="lg:col-span-5 bg-slate-900 text-white rounded-2xl p-4.5 flex flex-col justify-between space-y-3 shadow-sm">
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400 font-medium">
                  Sub Total Bruto (Nilai Kuitansi &amp; Memo)
                </span>
                <span className="font-mono font-bold text-sm text-white">
                  Rp {formatNominalExcel(calc.subTotalBruto)}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <span>
                  Nilai PPN ({tax.ppnMode === "INCLUDE_11_111" ? "11/111" : tax.ppnMode === "MANUAL" ? "Faktur" : "-"})
                </span>
                <span className="font-mono text-amber-300">
                  - Rp {formatNominalExcel(calc.nilaiPpn)}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-slate-800/80 pt-1.5 text-slate-200 font-semibold">
                <span>Sub Total Setelah PPN (DPP)</span>
                <span className="font-mono">Rp {formatNominalExcel(calc.dpp)}</span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <span>Potongan {calc.pphLabel}</span>
                <span className="font-mono text-rose-300">
                  - Rp {formatNominalExcel(calc.nilaiPph)}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-700 space-y-1">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Jumlah Bersih (Nominatif)
                </span>
                <span className="text-lg font-mono font-extrabold text-emerald-400">
                  Rp {formatNominalExcel(calc.jumlahBersih)}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 italic truncate">
                Terbilang: {terbilang(calc.jumlahBersihRounded)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 4: PEJABAT PENANDATANGAN & YANG MENERIMA (DROPDOWN + CUSTOM)
         ===================================================================== */}
      <section className="glass-base rounded-2xl p-5 space-y-4 border border-slate-200/90 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-50 text-violet-600 border border-violet-200/60">
              <Users2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                4. Pejabat Penandatangan &amp; Penerima (Penanggung Jawab Kegiatan / Pihak Ketiga)
              </h2>
              <p className="text-xs text-slate-500">
                Pilih dari daftar pegawai database atau aktifkan mode Custom jika penerima adalah pihak ketiga / vendor
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Kolom 1: PPK */}
          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              1. Pejabat Pembuat Komitmen (PPK)
            </span>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Nama PPK</label>
              <select
                value={header.ppkNama}
                onChange={(e) => handleSelectPpk(e.target.value)}
                className="input-clean w-full h-9 px-2.5 text-xs font-medium bg-white cursor-pointer"
              >
                {pegawaiList.map((p, idx) => (
                  <option key={`${p.nama}-${idx}`} value={p.nama}>
                    {p.nama}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">NIP PPK</label>
              <input
                type="text"
                value={header.ppkNip}
                onChange={(e) => handleChangeHeader("ppkNip", e.target.value)}
                className="input-clean w-full h-8 px-2.5 text-xs font-mono bg-white"
              />
            </div>
          </div>

          {/* Kolom 2: Bendahara & Verifikator */}
          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              2. Bendahara &amp; Petugas Verifikasi
            </span>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Bendahara Pengeluaran
              </label>
              <input
                type="text"
                value={header.bendahara}
                onChange={(e) => handleChangeHeader("bendahara", e.target.value)}
                className="input-clean w-full h-9 px-2.5 text-xs bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Petugas Verifikasi (Memorandum Hal. 2)
              </label>
              <select
                value={header.petugasVerifikasi}
                onChange={(e) => handleChangeHeader("petugasVerifikasi", e.target.value)}
                className="input-clean w-full h-8 px-2.5 text-xs bg-white cursor-pointer"
              >
                <option value="Noviarty Ningsi Sumirat, S.E, NIP. 19811112201001 2 001">
                  Noviarty Ningsi Sumirat, S.E
                </option>
                <option value="Taufik Prasetyo, SKom, NIP. 19900826202521 1 026">
                  Taufik Prasetyo, S.Kom
                </option>
              </select>
            </div>
          </div>

          {/* Kolom 3: Penanggung Jawab Kegiatan / Yang Menerima (Dropdown Pegawai + Custom Pihak Ketiga) */}
          <div className="p-3.5 rounded-xl bg-blue-50/40 border border-blue-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900">
                3. Penanggung Jawab / Yang Menerima
              </span>
              <button
                type="button"
                onClick={() => handleUpdateTax({ isPenerimaCustom: !tax.isPenerimaCustom })}
                className={`text-[10.5px] font-bold px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                  tax.isPenerimaCustom
                    ? "bg-amber-100 text-amber-900 border-amber-300"
                    : "bg-white text-blue-700 border-blue-200 hover:bg-blue-50"
                }`}
              >
                {tax.isPenerimaCustom ? "Mode: Custom / Pihak Ke-3" : "Klik untuk Pihak Ke-3 / Custom"}
              </button>
            </div>

            {tax.isPenerimaCustom ? (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Nama Penerima / Pihak Ketiga / Rekanan (Custom)
                </label>
                <input
                  type="text"
                  value={tax.penerimaNama}
                  onChange={(e) => handleUpdateTax({ penerimaNama: e.target.value })}
                  placeholder="Ketik nama penerima / CV / PT / Pihak Ketiga..."
                  className="input-clean w-full h-9 px-2.5 text-xs font-medium bg-white"
                />
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Pilih Nama Karyawan (Database Pegawai)
                </label>
                <select
                  value={tax.penerimaNama}
                  onChange={(e) => handleSelectPenerimaDropdown(e.target.value)}
                  className="input-clean w-full h-9 px-2.5 text-xs font-medium bg-white cursor-pointer"
                >
                  {pegawaiList.map((p, idx) => (
                    <option key={`${p.nama}-${idx}`} value={p.nama}>
                      {p.nama}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">
                  NIP (Kosongkan jika Vendor)
                </label>
                <input
                  type="text"
                  value={tax.penerimaNip}
                  onChange={(e) => handleUpdateTax({ penerimaNip: e.target.value })}
                  placeholder="Kosongkan jika non-ASN"
                  className="input-clean w-full h-8 px-2 text-xs font-mono bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">
                  Label TTD Kanan
                </label>
                <select
                  value={tax.penerimaJabatan || "Penanggung Jawab Kegiatan,"}
                  onChange={(e) => handleUpdateTax({ penerimaJabatan: e.target.value })}
                  className="input-clean w-full h-8 px-2 text-xs bg-white cursor-pointer"
                >
                  <option value="Penanggung Jawab Kegiatan,">Penanggung Jawab Kegiatan,</option>
                  <option value="Yang menerima,">Yang menerima,</option>
                  <option value="Penyedia / Pihak Ketiga,">Penyedia / Pihak Ketiga,</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700">
                Rekening / Keterangan Transfer (Hal. 3 Memorandum)
              </label>
              <input
                type="text"
                value={tax.rekeningTransfer || ""}
                onChange={(e) => handleUpdateTax({ rekeningTransfer: e.target.value })}
                placeholder="Contoh: BNI 123456789 a.n. Reni Sutaryo / Rekening Rekanan"
                className="input-clean w-full h-8 px-2.5 text-xs bg-white"
              />
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 5: ACTION BAR SIMPAN & LIHAT DOKUMEN CETAK
         ===================================================================== */}
      {saveFeedback && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
            saveFeedback.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : saveFeedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-blue-50 border-blue-200 text-blue-900"
          }`}
        >
          <div className="flex items-center gap-2 font-medium">
            {saveFeedback.type === "error" ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{saveFeedback.text}</span>
          </div>
          <button
            type="button"
            onClick={onClearFeedback}
            className="text-xs font-bold underline cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      <div className="glass-floating rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 border border-slate-200/90">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onSaveOrUpdate}
            disabled={isSaving}
            className="btn-tactile inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold shadow-sm cursor-pointer transition-all"
          >
            <Save className="w-4 h-4" />
            <span>
              {isSaving
                ? "Menyimpan..."
                : editingOriginalId || isSaved
                ? hasChanges
                  ? "Perbarui Berkas SPJ"
                  : "Tersimpan (Klik untuk Simpan Ulang)"
                : `Simpan ${spjMeta.label}`}
            </span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 mr-1">
            Buka Dokumen Siap Cetak:
          </span>
          <button
            type="button"
            onClick={() => onNavigateTab("kwitansi")}
            className="btn-tactile inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold border border-slate-200 cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5 text-blue-600" />
            <span>1. Kuitansi</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab("memorandum")}
            className="btn-tactile inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold border border-slate-200 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-600" />
            <span>2. Memorandum (3 Hal)</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab("nominatif")}
            className="btn-tactile inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold border border-slate-200 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600" />
            <span>3. Daftar Nominatif</span>
          </button>
        </div>
      </div>
    </div>
  );
};
