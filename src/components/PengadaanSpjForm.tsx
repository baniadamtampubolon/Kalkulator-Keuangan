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
  getItemDetailByKode,
  saveCustomItemDetail,
  normalizeKomponenCode,
  ItemDetailItem,
} from "@/data/mak_akun";
import { CurrencyInput } from "./CurrencyInput";
import {
  calculatePengadaanTotals,
  formatNominalExcel,
  formatPegawaiBankRekening,
  getDefaultPengadaanItems,
  getDefaultPengadaanTax,
  getPengadaanScenarioPresets,
  getSpjTypeMeta,
  PengadaanScenarioPreset,
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
  Copy,
  Trash2,
  Wand2,
  BookmarkCheck,
  FolderKanban,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Save,
  Receipt,
  FileSpreadsheet,
  Info,
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
  onCreateNewKegiatan,
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
  const scenarioPresets = useMemo(() => getPengadaanScenarioPresets(spjType), [spjType]);

  const [customItems, setCustomItems] = useState<ItemDetailItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isManualKomponen, setIsManualKomponen] = useState(false);
  const [isCustomPerihalMemo, setIsCustomPerihalMemo] = useState(false);

  const normalizedKomp = useMemo(() => {
    const raw = normalizeKomponenCode(header.nomorKomp);
    if (raw && LIST_NOMOR_KOMPONEN.some((k) => k.kode === raw)) {
      return raw;
    }
    return raw || spjMeta.defaultKomp;
  }, [header.nomorKomp, spjMeta.defaultKomp]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      setIsMounted(true);
      try {
        setCustomItems(getCustomItemDetails());
      } catch {
        // ignore
      }
    });
    return () => {
      active = false;
    };
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
    const defaultNama = header.penanggungJawabNama || "Reni Sutaryo, S.Si., M.Adm.Pemb";
    const foundPeg = pegawaiList.find(
      (p) => p.nama.toLowerCase() === defaultNama.toLowerCase()
    );
    return getDefaultPengadaanTax(
      spjType,
      defaultNama,
      header.penanggungJawabNip || foundPeg?.nip || "19791126200604 2 014",
      formatPegawaiBankRekening(foundPeg)
    );
  }, [header.pengadaanTax, spjType, header.penanggungJawabNama, header.penanggungJawabNip, pegawaiList]);

  const calc = useMemo(() => calculatePengadaanTotals(items, tax), [items, tax]);

  const availableItemDetails = useMemo(() => {
    return getItemDetailsForMak(
      normalizedKomp,
      header.nomorMak || spjMeta.defaultMak,
      isMounted ? customItems : []
    );
  }, [normalizedKomp, header.nomorMak, spjMeta.defaultMak, isMounted, customItems]);

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
      id: it.id || `${spjType.toLowerCase()}-${idx + 1}`,
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
    const nextNo = items.length + 1;
    const newRow: PengadaanItemRow = {
      id: `${spjType.toLowerCase()}-${nextNo}`,
      no: nextNo,
      uraian: "",
      hargaSatuan: 0,
      jumlah: 1,
      satuan: spjMeta.defaultSatuan,
      subTotal: 0,
      ppnJenis: tax.ppnMode !== "NONE" ? "INCLUDE" : "NONE",
    };
    handleUpdateItems([...items, newRow]);
  };

  const handleDuplicateLastRow = () => {
    if (items.length === 0) {
      handleAddRow();
      return;
    }
    const last = items[items.length - 1];
    const nextNo = items.length + 1;
    const duplicated: PengadaanItemRow = {
      ...last,
      id: `${spjType.toLowerCase()}-${nextNo}`,
      no: nextNo,
      subTotal: (Number(last.hargaSatuan) || 0) * (Number(last.jumlah) || 0),
    };
    handleUpdateItems([...items, duplicated]);
  };

  const handleRemoveRow = (index: number) => {
    if (items.length <= 1) return;
    const filtered = items.filter((_, i) => i !== index);
    handleUpdateItems(filtered);
  };

  const handleApplyScenarioPreset = (preset: PengadaanScenarioPreset) => {
    const nextTax: PengadaanTaxConfig = {
      ...tax,
      ppnMode: preset.ppnMode,
      pphType: preset.pphType,
    };
    setHeader((prev) => ({
      ...prev,
      pengadaanItems: preset.items.map((it, idx) => ({
        ...it,
        id: `${spjType.toLowerCase()}-${idx + 1}`,
        no: idx + 1,
        subTotal: (Number(it.hargaSatuan) || 0) * (Number(it.jumlah) || 0),
      })),
      pengadaanTax: nextTax,
    }));
  };

  const handleResetDefaultItems = () => {
    const defItems = getDefaultPengadaanItems(spjType);
    const defTax = getDefaultPengadaanTax(
      spjType,
      tax.penerimaNama || header.penanggungJawabNama,
      tax.penerimaNip || header.penanggungJawabNip,
      tax.rekeningTransfer
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
    setHeader((prev) => {
      // Only sync internal Penanggung Jawab Kegiatan on Memorandum Page 2 if recipient is an internal ASN (!isPenerimaCustom)
      const shouldSyncInternalPj = !nextTax.isPenerimaCustom;
      return {
        ...prev,
        pengadaanTax: nextTax,
        penanggungJawabNama:
          shouldSyncInternalPj && partial.penerimaNama !== undefined
            ? partial.penerimaNama
            : prev.penanggungJawabNama,
        penanggungJawabNip:
          shouldSyncInternalPj && partial.penerimaNip !== undefined
            ? partial.penerimaNip
            : prev.penanggungJawabNip,
      };
    });
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
      const autoRek = formatPegawaiBankRekening(found);
      handleUpdateTax({
        penerimaNama: found.nama,
        penerimaNip: found.nip,
        isPenerimaCustom: false,
        rekeningTransfer: autoRek || tax.rekeningTransfer,
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
          SECTION 1: IDENTITAS KEGIATAN, NOMOR MEMORANDUM & PEMBEBANAN ANGGARAN
         ===================================================================== */}
      <section className="form-card p-5 sm:p-6 space-y-5">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 border border-slate-200/90 flex items-center justify-center font-bold text-xs shadow-2xs">
              1
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-slate-900">
                  Identitas Kegiatan &amp; Memorandum ({spjMeta.label})
                </h2>
                <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-md border ${spjMeta.badgeColor}`}>
                  {spjMeta.shortLabel}
                </span>
                {header.idKegiatan && (
                  <span className="text-[10.5px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                    {header.idKegiatan}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{spjMeta.description}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenDaftarKegiatan && (
              <button
                type="button"
                onClick={onOpenDaftarKegiatan}
                className="btn-tactile inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200/90 shadow-2xs cursor-pointer"
              >
                <FolderKanban className="w-3.5 h-3.5 text-slate-500" />
                <span>Daftar Kegiatan</span>
              </button>
            )}
            {onOpenDaftarMemo && (
              <button
                type="button"
                onClick={onOpenDaftarMemo}
                className="btn-tactile inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200/90 shadow-2xs cursor-pointer"
              >
                <BookmarkCheck className="w-3.5 h-3.5 text-slate-500" />
                <span>Daftar Memo ({memoList.length})</span>
              </button>
            )}
            {onCreateNewKegiatan && (
              <button
                type="button"
                onClick={onCreateNewKegiatan}
                className="btn-tactile inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs cursor-pointer"
                title="Reset form dan buat berkas SPJ baru"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>SPJ Baru</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub-grid 1A: Uraian Kegiatan + Tanggal & Nomor Memo */}
        <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Uraian Pembayaran / Kegiatan */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-1.5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                    <span>Uraian Kegiatan / Untuk Pembayaran (Kuitansi, Nominatif &amp; Memo)</span>
                    <span className="text-red-500 font-bold">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleChangeHeader("keteranganKegiatan", spjMeta.defaultUraianKegiatan)}
                    className="text-[11px] font-semibold text-[#0071e3] hover:underline cursor-pointer"
                    title="Isi dengan contoh kalimat baku"
                  >
                    Isi Kalimat Baku
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={header.keteranganKegiatan}
                  onChange={(e) => handleChangeHeader("keteranganKegiatan", e.target.value)}
                  placeholder={spjMeta.defaultUraianKegiatan}
                  className="input-clean w-full p-3 text-xs leading-relaxed resize-none"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Uraian ini tercetak otomatis pada baris &ldquo;Untuk Pembayaran&rdquo; Kuitansi, Judul Daftar Nominatif, dan Memorandum.
              </p>
            </div>

            {/* Tanggal & Nomor Memorandum */}
            <div className="lg:col-span-5 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                    <span>Tanggal Kegiatan / Kuitansi</span>
                    <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="date"
                    value={header.tanggalSpd}
                    onChange={(e) => handleChangeHeader("tanggalSpd", e.target.value)}
                    className="input-clean w-full h-9.5 px-3 text-xs font-medium cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                    <span>Tanggal Memorandum</span>
                    <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="date"
                    value={header.tanggalMemo}
                    onChange={(e) => handleChangeHeader("tanggalMemo", e.target.value)}
                    className="input-clean w-full h-9.5 px-3 text-xs font-medium cursor-pointer"
                  />
                </div>
              </div>

              {/* Nomor Memorandum Segmented Input (Consistent with HeaderForm) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-800">
                    Nomor Memorandum (Buku Kendali Bersama)
                  </label>
                </div>
                <div className="flex gap-1.5 items-stretch">
                  <div className="flex-1 flex items-stretch h-9.5 rounded-xl border border-slate-300 focus-within:ring-2 focus-within:ring-slate-900/15 focus-within:border-slate-900 overflow-hidden bg-white shadow-2xs transition-all">
                    <span className="px-2.5 text-xs font-mono font-bold text-slate-600 bg-slate-100 border-r border-slate-300 flex items-center select-none">
                      M.
                    </span>
                    <input
                      type="text"
                      value={memoParts.seqNumber === "xxx" ? "" : memoParts.seqNumber}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const num = e.target.value.trim() || "xxx";
                        const newMemo = `M.${num}/INS/PPK/${currentMemoRomanMonth}/${currentMemoYear}`;
                        handleChangeHeader("nomorMemo", newMemo);
                      }}
                      placeholder="xxx"
                      className="w-16 sm:w-20 px-2 text-xs font-mono font-bold text-center text-[#0071e3] bg-[#f1f3f5] focus:bg-white focus:outline-none transition-colors"
                      title="Ketik nomor urut memorandum atau klik Ambil No"
                    />
                    <span className="px-2.5 text-xs font-mono text-slate-600 bg-slate-100 border-l border-slate-300 flex items-center flex-1 truncate select-none">
                      /INS/PPK/<strong className="text-slate-800 font-semibold">{currentMemoRomanMonth}</strong>/{currentMemoYear}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onGenerateMemoNumber}
                    className="btn-tactile px-3 py-1.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
                    title="Ambil nomor urut berikutnya dari database master"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Ambil No</span>
                  </button>
                </div>
              </div>

              {/* Perihal Memorandum */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-800">
                    Perihal Memorandum (Hal)
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomPerihalMemo((prev) => !prev)}
                    className="text-[11px] font-semibold text-[#0071e3] hover:underline cursor-pointer"
                  >
                    {isCustomPerihalMemo ? "Pilih dari Daftar Baku" : "Ketik Manual"}
                  </button>
                </div>
                {isCustomPerihalMemo ? (
                  <input
                    type="text"
                    value={header.keteranganMemo}
                    onChange={(e) => handleChangeHeader("keteranganMemo", e.target.value)}
                    placeholder={spjMeta.defaultPerihalMemo}
                    className="input-clean w-full h-9.5 px-3 text-xs font-medium"
                  />
                ) : (
                  <select
                    value={
                      OPSI_PERIHAL_MEMORANDUM.includes(header.keteranganMemo)
                        ? header.keteranganMemo
                        : spjMeta.defaultPerihalMemo
                    }
                    onChange={(e) => handleChangeHeader("keteranganMemo", e.target.value)}
                    className="input-clean w-full h-9.5 px-3 text-xs font-semibold cursor-pointer"
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
        </div>

        {/* Sub-grid 1B: Pembebanan Anggaran DIPA */}
        <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-slate-600" />
              <h3 className="text-xs font-bold text-slate-900">
                Pembebanan Anggaran DIPA (Sub Kegiatan, Komponen, Akun MAK &amp; Item Detail POK)
              </h3>
            </div>
            <span className="text-[10.5px] font-medium text-slate-500 hidden sm:inline">
              Tercetak pada Kuitansi &amp; Memorandum Hal. 2
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Nomor Komponen / Sub Keg */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-800">
                  Kode Sub Kegiatan / Komponen
                </label>
                <button
                  type="button"
                  onClick={() => setIsManualKomponen((prev) => !prev)}
                  className="text-[11px] font-semibold text-[#0071e3] hover:underline cursor-pointer"
                >
                  {isManualKomponen ? "Pilih Preset DIPA" : "Input Manual"}
                </button>
              </div>
              {isManualKomponen ? (
                <input
                  type="text"
                  value={header.nomorKomp || normalizedKomp}
                  onChange={(e) => handleChangeHeader("nomorKomp", e.target.value)}
                  placeholder="Contoh: WA.7457.EBD.Z28.051.0B"
                  className="input-clean w-full h-9.5 px-3 text-xs font-mono font-semibold"
                />
              ) : (
                <select
                  value={normalizedKomp}
                  onChange={(e) => {
                    const val = e.target.value;
                    const found = LIST_NOMOR_KOMPONEN.find((k) => k.kode === val);
                    setHeader((prev) => ({
                      ...prev,
                      nomorKomp: val,
                      detailKomponen: found ? found.nama : prev.detailKomponen,
                    }));
                  }}
                  className="input-clean w-full h-9.5 px-3 text-xs font-mono font-semibold cursor-pointer"
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
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-800 block">
                Nomor Akun MAK
              </label>
              <select
                value={header.nomorMak || spjMeta.defaultMak}
                onChange={(e) => handleChangeHeader("nomorMak", e.target.value)}
                className="input-clean w-full h-9.5 px-3 text-xs font-mono font-semibold cursor-pointer"
              >
                {LIST_NOMOR_MAK.map((m) => (
                  <option key={m.kode} value={m.kode}>
                    {m.kode} — {m.nama}
                  </option>
                ))}
              </select>
            </div>

            {/* Pilih Cepat Item Detail */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-800 block">
                Pilih Cepat Item Detail DIPA ({availableItemDetails.length} tersedia)
              </label>
              <select
                value={
                  availableItemDetails.some((it) => it.kode === header.itemDetail)
                    ? header.itemDetail
                    : ""
                }
                onChange={(e) => {
                  const kode = e.target.value;
                  if (!kode) return;
                  const found =
                    availableItemDetails.find((it) => it.kode === kode) ||
                    getItemDetailByKode(kode);
                  setHeader((prev) => ({
                    ...prev,
                    nomorKomp: normalizeKomponenCode(prev.nomorKomp) || spjMeta.defaultKomp,
                    itemDetail: kode,
                    keteranganItemDetail: found ? found.nama : prev.keteranganItemDetail,
                  }));
                  if (found) {
                    saveCustomItemDetail(found);
                  }
                }}
                className="input-clean w-full h-9.5 px-3 text-xs font-medium cursor-pointer"
              >
                <option value="">-- Pilih dari DIPA ({availableItemDetails.length} item) --</option>
                {availableItemDetails.map((item) => (
                  <option key={`${item.fullMak}-${item.kode}`} value={item.kode}>
                    [{item.kode}] {item.nama}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Baris 2 Pembebanan: Kode Item Detail & Keterangan Item Detail */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <span>Kode Item Detail (POK)</span>
                <span className="text-[10.5px] font-normal text-slate-400">
                  (contoh: {spjMeta.defaultItemDetail})
                </span>
              </label>
              <input
                type="text"
                value={header.itemDetail || ""}
                onChange={(e) => {
                  const kodeVal = e.target.value;
                  const found = getItemDetailByKode(kodeVal);
                  setHeader((prev) => ({
                    ...prev,
                    itemDetail: kodeVal,
                    keteranganItemDetail:
                      found && (!prev.keteranganItemDetail || prev.keteranganItemDetail.trim() === "")
                        ? found.nama
                        : prev.keteranganItemDetail,
                  }));
                }}
                placeholder={spjMeta.defaultItemDetail}
                className="input-clean w-full h-9 px-3 text-xs font-mono font-bold"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <span>Keterangan / Uraian Item Detail DIPA</span>
                <span className="text-[10.5px] font-normal text-slate-400">
                  (otomatis terisi saat pilih DIPA atau ketik manual)
                </span>
              </label>
              <input
                type="text"
                value={header.keteranganItemDetail || ""}
                onChange={(e) => handleChangeHeader("keteranganItemDetail", e.target.value)}
                placeholder={spjMeta.defaultKeteranganItemDetail}
                className="input-clean w-full h-9 px-3 text-xs font-medium"
              />
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 2: TABEL RINCIAN ITEM NOMINATIF & KALKULATOR PAJAK (PPN & PPh)
         ===================================================================== */}
      <section className="form-card p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 border border-slate-200/90 flex items-center justify-center font-bold text-xs shadow-2xs">
              2
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Rincian Item Daftar Nominatif &amp; Perhitungan Pajak ({spjMeta.shortLabel})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Menghitung otomatis Sub Total Bruto, PPN (11/111 atau Faktur), DPP, Potongan PPh 22 / PPh 23, dan Jumlah Bersih
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefaultItems}
              className="btn-tactile inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium border border-slate-200/90 shadow-2xs cursor-pointer"
              title="Reset ke contoh data standar Excel SPJ 2026"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Default</span>
            </button>
            <button
              type="button"
              onClick={handleDuplicateLastRow}
              className="btn-tactile inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200/90 shadow-2xs cursor-pointer"
              title="Gandakan baris terakhir untuk mempercepat input"
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>Duplikat Baris</span>
            </button>
            <button
              type="button"
              onClick={handleAddRow}
              className="btn-tactile inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Baris</span>
            </button>
          </div>
        </div>

        {/* 1-Click Scenario Presets Bar (Minimum Click Principle) */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200/90">
          <span className="text-[11px] font-semibold text-slate-600 mr-1">
            Preset Skenario Cepat:
          </span>
          {scenarioPresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleApplyScenarioPreset(preset)}
              title={preset.description}
              className="btn-tactile px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50/70 text-slate-700 hover:text-[#0071e3] border border-slate-200 hover:border-blue-300 text-xs font-medium cursor-pointer shadow-2xs transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Tabel Input Rincian Item */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold">
                <th className="p-2.5 text-center w-12 border-r border-slate-200">No</th>
                <th className="p-2.5 text-left min-w-[240px] border-r border-slate-200">
                  Uraian Item / Barang / Jasa
                </th>
                <th className="p-2.5 text-right w-44 border-r border-slate-200">
                  {spjMeta.colHargaLabel} (Rp)
                </th>
                <th className="p-2.5 text-center w-28 border-r border-slate-200">
                  {spjMeta.colJumlahLabel}
                </th>
                <th className="p-2.5 text-center w-32 border-r border-slate-200">
                  Satuan
                </th>
                <th className="p-2.5 text-right w-44 border-r border-slate-200">
                  Sub Total (Rp)
                </th>
                <th className="p-2.5 text-center w-14">Hapus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {items.map((item, idx) => {
                const rowSub = (Number(item.hargaSatuan) || 0) * (Number(item.jumlah) || 0);
                return (
                  <tr key={item.id || `${spjType}-${idx}`} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-2 text-center font-mono font-bold text-slate-500 border-r border-slate-200">
                      {idx + 1}
                    </td>
                    <td className="p-2 border-r border-slate-200">
                      <input
                        type="text"
                        value={item.uraian}
                        onChange={(e) => handleItemFieldChange(idx, "uraian", e.target.value)}
                        placeholder="Ketik uraian item (misal: Makan Siang, Kertas A4, Sewa Mobil)..."
                        className="input-clean w-full h-9 px-3 text-xs font-medium"
                      />
                    </td>
                    <td className="p-2 border-r border-slate-200">
                      <CurrencyInput
                        value={item.hargaSatuan}
                        onChange={(val) => handleItemFieldChange(idx, "hargaSatuan", val)}
                        placeholder="0"
                        className="input-clean w-full h-9 px-3 text-xs font-mono font-semibold text-right"
                        title="Harga satuan dalam Rupiah"
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
                        className="input-clean w-full h-9 px-2.5 text-xs font-mono font-semibold text-center"
                      />
                    </td>
                    <td className="p-2 border-r border-slate-200">
                      <input
                        type="text"
                        list={`satuan-list-${spjType}`}
                        value={item.satuan}
                        onChange={(e) => handleItemFieldChange(idx, "satuan", e.target.value)}
                        placeholder={spjMeta.defaultSatuan}
                        className="input-clean w-full h-9 px-2.5 text-xs font-medium text-center"
                      />
                      <datalist id={`satuan-list-${spjType}`}>
                        {spjMeta.satuanOptions.map((s) => (
                          <option key={s} value={s} />
                        ))}
                      </datalist>
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold text-slate-900 border-r border-slate-200 bg-slate-50/60">
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
            <tfoot>
              <tr className="bg-slate-100/90 border-t border-slate-200 font-bold text-slate-800">
                <td colSpan={5} className="p-2.5 text-right border-r border-slate-200">
                  Total Bruto Rincian ({items.length} Item):
                </td>
                <td className="p-2.5 text-right font-mono text-slate-900 border-r border-slate-200">
                  Rp {formatNominalExcel(calc.subTotalBruto)}
                </td>
                <td className="p-2.5" />
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Panel Konfigurasi Pajak (PPN & PPh) + Live Preview Ringkasan Nominatif */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1">
          {/* Kiri: Pengaturan PPN & PPh + Panduan Dasar Pajak */}
          <div className="lg:col-span-7 p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Pilihan PPN */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800 block">
                  Perhitungan PPN (Kolom H &amp; I Nominatif)
                </label>
                <select
                  value={tax.ppnMode}
                  onChange={(e) =>
                    handleUpdateTax({
                      ppnMode: e.target.value as PengadaanTaxConfig["ppnMode"],
                    })
                  }
                  className="input-clean w-full h-9.5 px-3 text-xs font-semibold cursor-pointer"
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
                  <div className="pt-1.5 space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700 block">
                      Nominal PPN di Faktur Pajak (Rp):
                    </label>
                    <CurrencyInput
                      value={tax.ppnManualValue}
                      onChange={(val) => handleUpdateTax({ ppnManualValue: val })}
                      placeholder="Masukkan nilai PPN dari Faktur Pajak..."
                      className="input-clean w-full h-9 px-3 text-xs font-mono font-semibold"
                    />
                  </div>
                )}
              </div>

              {/* Pilihan PPh */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800 block">
                  Jenis Potongan PPh (Kolom K &amp; L Nominatif)
                </label>
                <select
                  value={tax.pphType}
                  onChange={(e) =>
                    handleUpdateTax({
                      pphType: e.target.value as PengadaanTaxConfig["pphType"],
                    })
                  }
                  className="input-clean w-full h-9.5 px-3 text-xs font-semibold cursor-pointer"
                >
                  <option value="PPH23_2">
                    PPh Pasal 23 (2%) — Katering / Jasa / Sewa Mobil Ber-NPWP
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
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 text-[11px] text-slate-600 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>Ketentuan Dasar Pemotongan Pajak:</span>
              </div>
              {spjType === "KONSUMSI" && (
                <ul className="list-disc list-inside space-y-0.5 pl-1">
                  <li>
                    <strong>Ada Invoice / Berbadan Hukum (CV, PT):</strong> Dikenakan <strong>PPh 23 (2%)</strong> dari DPP, serta <strong>PPN (11/111)</strong> jika di atas Rp 2 Juta.
                  </li>
                  <li>
                    <strong>Bon Biasa (Non Badan Hukum):</strong> Di bawah Rp 2 Juta <strong>Tanpa Pajak</strong>; di atas Rp 2 Juta dikenakan <strong>PPN (11/111) + PPh 22 (1,5%)</strong>.
                  </li>
                </ul>
              )}
              {spjType === "ATK" && (
                <ul className="list-disc list-inside space-y-0.5 pl-1">
                  <li>
                    <strong>Pembelian Semkit &amp; ATK:</strong> Menggunakan <strong>PPN Include (11/111)</strong> (atau nominal dari Faktur Pajak) dan dipotong <strong>PPh 22 (1,5%)</strong> dari DPP (Sub Total dikurangi PPN).
                  </li>
                </ul>
              )}
              {spjType === "SEWA" && (
                <ul className="list-disc list-inside space-y-0.5 pl-1">
                  <li>
                    <strong>Sewa Kendaraan / Mobil:</strong> Jika penyedia memiliki NPWP dikenakan <strong>PPh 23 (2%)</strong>; jika tidak memiliki NPWP dikenakan <strong>PPh 23 (4%)</strong>.
                  </li>
                </ul>
              )}
              {spjType === "DIKLAT" && (
                <ul className="list-disc list-inside space-y-0.5 pl-1">
                  <li>
                    <strong>Biaya Narasumber / Diklat:</strong> Sesuaikan potongan PPh atau pilih Tanpa PPN &amp; Tanpa PPh (0%) untuk PNBP Instansi.
                  </li>
                </ul>
              )}
            </div>
          </div>

          {/* Kanan: Ringkasan Kalkulasi Real-Time */}
          <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-2xs">
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-700 font-semibold">
                  Sub Total Bruto (Nilai Kuitansi &amp; Memo)
                </span>
                <span className="font-mono font-bold text-sm text-slate-900">
                  Rp {formatNominalExcel(calc.subTotalBruto)}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span>
                  Potongan PPN ({tax.ppnMode === "INCLUDE_11_111" ? "11/111" : tax.ppnMode === "MANUAL" ? "Faktur" : "-"})
                </span>
                <span className="font-mono text-slate-800">
                  - Rp {formatNominalExcel(calc.nilaiPpn)}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200/80 pt-1.5 text-slate-800 font-semibold">
                <span>Sub Total Setelah PPN (DPP)</span>
                <span className="font-mono">Rp {formatNominalExcel(calc.dpp)}</span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span>Potongan {calc.pphLabel}</span>
                <span className="font-mono text-rose-700 font-semibold">
                  - Rp {formatNominalExcel(calc.nilaiPph)}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 space-y-1">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-bold text-slate-900">
                  Jumlah Bersih Diterima (Transfer)
                </span>
                <span className="text-base sm:text-lg font-mono font-extrabold text-[#0071e3]">
                  Rp {formatNominalExcel(calc.jumlahBersih)}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 italic truncate">
                Terbilang: {terbilang(calc.jumlahBersihRounded)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 3: PEJABAT PENANDATANGAN & YANG MENERIMA (DROPDOWN + CUSTOM)
         ===================================================================== */}
      <section className="form-card p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 border border-slate-200/90 flex items-center justify-center font-bold text-xs shadow-2xs">
              3
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Pejabat Penandatangan &amp; Penerima Pembayaran
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pilih nama penerima dari database pegawai atau aktifkan mode Pihak Ketiga jika dibayarkan langsung ke penyedia/rekanan
              </p>
            </div>
          </div>
          <Users2 className="w-4 h-4 text-slate-400 hidden sm:block" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Kolom 1: PPK */}
          <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-900 block">
                Pejabat Pembuat Komitmen (PPK)
              </span>
              <span className="text-[10.5px] text-slate-400">
                Penandatangan Kuitansi &amp; Memorandum
              </span>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">Nama PPK</label>
              <select
                value={header.ppkNama}
                onChange={(e) => handleSelectPpk(e.target.value)}
                className="input-clean w-full h-9.5 px-3 text-xs font-semibold cursor-pointer"
              >
                {pegawaiList.map((p, idx) => (
                  <option key={`${p.nama}-${idx}`} value={p.nama}>
                    {p.nama}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">NIP PPK</label>
              <input
                type="text"
                value={header.ppkNip}
                onChange={(e) => handleChangeHeader("ppkNip", e.target.value)}
                className="input-clean w-full h-9 px-3 text-xs font-mono font-medium"
              />
            </div>
          </div>

          {/* Kolom 2: Bendahara & Verifikator */}
          <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-900 block">
                Bendahara &amp; Petugas Verifikasi
              </span>
              <span className="text-[10.5px] text-slate-400">
                Penandatangan Lunas Bayar &amp; Lembar Verifikasi
              </span>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                Bendahara Pengeluaran
              </label>
              <input
                type="text"
                value={header.bendahara}
                onChange={(e) => handleChangeHeader("bendahara", e.target.value)}
                className="input-clean w-full h-9.5 px-3 text-xs font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                Petugas Verifikasi (Memorandum Hal. 2)
              </label>
              <select
                value={header.petugasVerifikasi}
                onChange={(e) => handleChangeHeader("petugasVerifikasi", e.target.value)}
                className="input-clean w-full h-9 px-3 text-xs font-medium cursor-pointer"
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

          {/* Kolom 3: Penanggung Jawab Kegiatan / Yang Menerima */}
          <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Yang Menerima / Penanggung Jawab
                </span>
                <span className="text-[10.5px] text-slate-400">
                  Penerima Kuitansi &amp; TTD Daftar Nominatif
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleUpdateTax({ isPenerimaCustom: !tax.isPenerimaCustom })}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer shrink-0 ${
                  tax.isPenerimaCustom
                    ? "bg-amber-50 text-amber-800 border-amber-300"
                    : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/70"
                }`}
              >
                {tax.isPenerimaCustom ? "Mode: Pihak Ketiga" : "Ubah ke Pihak Ketiga"}
              </button>
            </div>

            {tax.isPenerimaCustom ? (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Nama Penerima / Penyedia / Pihak Ketiga
                </label>
                <input
                  type="text"
                  value={tax.penerimaNama}
                  onChange={(e) => handleUpdateTax({ penerimaNama: e.target.value })}
                  placeholder="Ketik nama penerima / CV / PT / Rekanan..."
                  className="input-clean w-full h-9.5 px-3 text-xs font-semibold"
                />
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Pilih Nama Pegawai (Database)
                </label>
                <select
                  value={tax.penerimaNama}
                  onChange={(e) => handleSelectPenerimaDropdown(e.target.value)}
                  className="input-clean w-full h-9.5 px-3 text-xs font-semibold cursor-pointer"
                >
                  {pegawaiList.map((p, idx) => (
                    <option key={`${p.nama}-${idx}`} value={p.nama}>
                      {p.nama}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 block">
                  NIP (Kosongkan jika Vendor)
                </label>
                <input
                  type="text"
                  value={tax.penerimaNip}
                  onChange={(e) => handleUpdateTax({ penerimaNip: e.target.value })}
                  placeholder="Kosongkan jika non-ASN"
                  className="input-clean w-full h-9 px-2.5 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 block">
                  Jabatan TTD Kanan
                </label>
                <select
                  value={tax.penerimaJabatan || "Penanggung Jawab Kegiatan,"}
                  onChange={(e) => handleUpdateTax({ penerimaJabatan: e.target.value })}
                  className="input-clean w-full h-9 px-2 text-xs font-medium cursor-pointer"
                >
                  <option value="Penanggung Jawab Kegiatan,">Penanggung Jawab Kegiatan,</option>
                  <option value="Yang menerima,">Yang menerima,</option>
                  <option value="Penyedia / Pihak Ketiga,">Penyedia / Pihak Ketiga,</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 block">
                Rekening / Keterangan Transfer (Hal. 3 Memorandum)
              </label>
              <input
                type="text"
                value={tax.rekeningTransfer || ""}
                onChange={(e) => handleUpdateTax({ rekeningTransfer: e.target.value })}
                placeholder="Contoh: BRI - 202001000249506 / Rekening Rekanan"
                className="input-clean w-full h-9 px-3 text-xs font-medium"
              />
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 4: ACTION BAR SIMPAN & LIHAT DOKUMEN CETAK
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
            className="btn-tactile inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] disabled:opacity-60 text-white text-xs font-semibold shadow-xs cursor-pointer transition-all"
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
          <span className="text-xs font-medium text-slate-500 mr-1">
            Pratinjau &amp; Cetak Dokumen:
          </span>
          <button
            type="button"
            onClick={() => onNavigateTab("kwitansi")}
            className="btn-tactile inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold border border-slate-200 cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5 text-slate-500" />
            <span>1. Kuitansi</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab("memorandum")}
            className="btn-tactile inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold border border-slate-200 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>2. Memorandum (3 Hal)</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab("nominatif")}
            className="btn-tactile inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold border border-slate-200 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span>3. Daftar Nominatif</span>
          </button>
        </div>
      </div>
    </div>
  );
};
