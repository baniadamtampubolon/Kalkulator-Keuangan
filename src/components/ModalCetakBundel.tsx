"use client";

import React, { useState, useMemo } from "react";
import {
  HeaderData,
  ParticipantRow,
  ActiveCostKey,
  ActiveUhKey,
  Pegawai,
  SpjDocType,
} from "@/lib/types";
import { getSpjTypeMeta } from "@/lib/pengadaanHelper";
import { KwitansiDoc } from "./documents/KwitansiDoc";
import { MemorandumDoc } from "./documents/MemorandumDoc";
import { NominatifDoc } from "./documents/NominatifDoc";
import { RincianBiayaDoc } from "./documents/RincianBiayaDoc";
import { BiayaRiilDoc } from "./documents/BiayaRiilDoc";
import { SppdDepanDoc } from "./documents/SppdDepanDoc";
import { KuitansiPengadaanDoc } from "./documents/KuitansiPengadaanDoc";
import { NominatifPengadaanDoc } from "./documents/NominatifPengadaanDoc";
import {
  X,
  Printer,
  Check,
  Receipt,
  FileText,
  FileSpreadsheet,
  ListOrdered,
  FileCheck,
  Layers,
} from "lucide-react";

export type BundleDocId =
  | "kwitansi"
  | "memorandum"
  | "nominatif"
  | "rincian"
  | "riil"
  | "spd";

interface BundleDocOption {
  id: BundleDocId;
  orderLabel: string;
  title: string;
  subtitle: string;
  orientation: "Portrait" | "Landscape";
  icon: React.ComponentType<{ className?: string }>;
}

const PERDIN_BUNDLE_OPTIONS: BundleDocOption[] = [
  {
    id: "kwitansi",
    orderLabel: "1",
    title: "Kwitansi Pembayaran",
    subtitle: "Kwitansi dinas per peserta (rangkap)",
    orientation: "Portrait",
    icon: Receipt,
  },
  {
    id: "memorandum",
    orderLabel: "2",
    title: "Memorandum (3 Halaman)",
    subtitle: "Nota pengajuan, Rincian MAK & Rincian Transfer",
    orientation: "Portrait",
    icon: FileText,
  },
  {
    id: "nominatif",
    orderLabel: "3",
    title: "Daftar Nominatif",
    subtitle: "Tabel rekapitulasi seluruh pelaksana",
    orientation: "Landscape",
    icon: FileSpreadsheet,
  },
  {
    id: "rincian",
    orderLabel: "4",
    title: "Rincian Biaya Perdin",
    subtitle: "Rincian perhitungan 7 kolom per peserta",
    orientation: "Portrait",
    icon: ListOrdered,
  },
  {
    id: "riil",
    orderLabel: "5",
    title: "Daftar Pengeluaran Riil",
    subtitle: "Surat pernyataan pengeluaran riil per peserta",
    orientation: "Portrait",
    icon: FileCheck,
  },
  {
    id: "spd",
    orderLabel: "6",
    title: "SPPD Lembar Depan",
    subtitle: "Surat Perjalanan Dinas per pelaksana",
    orientation: "Portrait",
    icon: FileText,
  },
];

const PENGADAAN_BUNDLE_OPTIONS: BundleDocOption[] = [
  {
    id: "kwitansi",
    orderLabel: "1",
    title: "Kuitansi SPJ",
    subtitle: "Kuitansi pembayaran resmi pengadaan",
    orientation: "Portrait",
    icon: Receipt,
  },
  {
    id: "memorandum",
    orderLabel: "2",
    title: "Memorandum (3 Halaman)",
    subtitle: "Nota dinas, Lampiran MAK & Rincian Transfer",
    orientation: "Portrait",
    icon: FileText,
  },
  {
    id: "nominatif",
    orderLabel: "3",
    title: "Daftar Nominatif Pengadaan",
    subtitle: "Tabel item, DPP, PPN, PPh 22/23 & bersih",
    orientation: "Landscape",
    icon: FileSpreadsheet,
  },
];

interface ModalCetakBundelProps {
  isOpen: boolean;
  onClose: () => void;
  spjType: SpjDocType;
  header: HeaderData;
  rows: ParticipantRow[];
  onStartPrintBundle: (selectedDocs: BundleDocId[]) => void;
}

export const ModalCetakBundel: React.FC<ModalCetakBundelProps> = ({
  isOpen,
  onClose,
  spjType,
  header,
  rows,
  onStartPrintBundle,
}) => {
  const isPengadaan = spjType !== "PERDIN";
  const spjMeta = getSpjTypeMeta(spjType);
  const options = isPengadaan ? PENGADAAN_BUNDLE_OPTIONS : PERDIN_BUNDLE_OPTIONS;

  const [selectedIds, setSelectedIds] = useState<BundleDocId[]>(() =>
    options.map((o) => o.id)
  );

  // Sync default selection when switching SPJ type
  const validSelected = useMemo(() => {
    const allowed = new Set(options.map((o) => o.id));
    return options.filter((o) => selectedIds.includes(o.id) && allowed.has(o.id)).map((o) => o.id);
  }, [options, selectedIds]);

  if (!isOpen) return null;

  const toggleDoc = (id: BundleDocId) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds(options.map((o) => o.id));
  };

  const handleClearAll = () => {
    setSelectedIds([]);
  };

  const validParticipantsCount = rows.filter(
    (r) => Boolean((r.nama && r.nama.trim() !== "") || (r.namaExternal && r.namaExternal.trim() !== ""))
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0071e3] dark:text-blue-400 border border-blue-100 dark:border-blue-800/60 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Cetak Bundel Dokumen ({spjMeta.shortLabel})
              </h2>
              <p className="text-[11.5px] text-slate-500 dark:text-slate-400">
                Pilih dokumen yang ingin digabungkan menjadi satu cetakan / PDF
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Quick Info & Select Controls */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              {header.idKegiatan || "Draft Aktif"} ·{" "}
              <strong className="text-slate-800 dark:text-slate-200">
                {validSelected.length} dari {options.length} dokumen
              </strong>{" "}
              dipilih
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[11.5px] font-semibold text-[#0071e3] dark:text-blue-400 hover:underline cursor-pointer"
              >
                Pilih Semua
              </button>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[11.5px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:underline cursor-pointer"
              >
                Kosongkan
              </button>
            </div>
          </div>

          {/* Checklist Options */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/40 dark:bg-slate-800/30">
            {options.map((opt) => {
              const Icon = opt.icon;
              const isChecked = validSelected.includes(opt.id);

              return (
                <label
                  key={opt.id}
                  onClick={() => toggleDoc(opt.id)}
                  className={`flex items-center justify-between gap-3 px-3.5 py-2.5 cursor-pointer transition-colors select-none ${
                    isChecked
                      ? "bg-white dark:bg-slate-900"
                      : "bg-slate-50/60 dark:bg-slate-900/40 opacity-65 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Custom Checkbox */}
                    <div
                      className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                        isChecked
                          ? "bg-[#0071e3] border-[#0071e3] text-white"
                          : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>

                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isChecked
                          ? "text-[#0071e3] dark:text-blue-400"
                          : "text-slate-400 dark:text-slate-500"
                      }`}
                    />

                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {opt.orderLabel}. {opt.title}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {opt.subtitle}
                        {!isPengadaan &&
                        (opt.id === "kwitansi" ||
                          opt.id === "rincian" ||
                          opt.id === "riil" ||
                          opt.id === "spd")
                          ? ` (${validParticipantsCount || rows.length} peserta)`
                          : ""}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10.5px] font-mono shrink-0 ${
                      opt.orientation === "Landscape"
                        ? "text-violet-600 dark:text-violet-400 font-semibold"
                        : "text-slate-400 dark:text-slate-500"
                    }`}
                  >
                    {opt.orientation}
                  </span>
                </label>
              );
            })}
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Saat dialog cetak browser terbuka, pilih <strong>Simpan sebagai PDF (Save as PDF)</strong> untuk menggabungkan seluruh dokumen terpilih menjadi satu file PDF berurutan.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50/70 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-tactile px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={validSelected.length === 0}
            onClick={() => onStartPrintBundle(validSelected)}
            className="btn-tactile inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] disabled:opacity-40 text-white text-xs font-semibold shadow-xs cursor-pointer transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>
              Cetak Bundel ({validSelected.length} Dokumen)
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface BundlePrintContainerProps {
  selectedDocs: BundleDocId[];
  spjType: SpjDocType;
  header: HeaderData;
  rows: ParticipantRow[];
  activeCols: Record<ActiveCostKey, boolean>;
  activeUh: Record<ActiveUhKey, boolean>;
  pegawaiList: Pegawai[];
  onCloseBundle: () => void;
}

export const BundlePrintContainer: React.FC<BundlePrintContainerProps> = ({
  selectedDocs,
  spjType,
  header,
  rows,
  activeCols,
  activeUh,
  pegawaiList,
  onCloseBundle,
}) => {
  const isPengadaan = spjType !== "PERDIN";

  const renderDoc = (id: BundleDocId) => {
    if (isPengadaan) {
      if (id === "kwitansi") return <KuitansiPengadaanDoc header={header} isBundleMode={true} />;
      if (id === "memorandum") return <MemorandumDoc header={header} rows={rows} isBundleMode={true} />;
      if (id === "nominatif") return <NominatifPengadaanDoc header={header} isBundleMode={true} />;
      return null;
    }

    switch (id) {
      case "kwitansi":
        return (
          <KwitansiDoc
            header={header}
            rows={rows}
            activeCols={activeCols}
            activeUh={activeUh}
            isBundleMode={true}
          />
        );
      case "memorandum":
        return <MemorandumDoc header={header} rows={rows} isBundleMode={true} />;
      case "nominatif":
        return (
          <NominatifDoc
            header={header}
            rows={rows}
            activeCols={activeCols}
            activeUh={activeUh}
            isBundleMode={true}
          />
        );
      case "rincian":
        return (
          <RincianBiayaDoc
            header={header}
            rows={rows}
            activeCols={activeCols}
            activeUh={activeUh}
            isBundleMode={true}
          />
        );
      case "riil":
        return <BiayaRiilDoc header={header} rows={rows} activeCols={activeCols} isBundleMode={true} />;
      case "spd":
        return <SppdDepanDoc header={header} rows={rows} pegawaiList={pegawaiList} isBundleMode={true} />;
      default:
        return null;
    }
  };

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                size: A4 portrait;
                margin: 15mm 18mm 15mm 18mm;
              }
              @page bundle_portrait {
                size: A4 portrait;
                margin: 15mm 18mm 15mm 18mm;
              }
              @page bundle_landscape {
                size: A4 landscape;
                margin: 8mm 10mm 8mm 10mm;
              }
              .bundle-doc-portrait {
                page: bundle_portrait;
                break-before: page;
                page-break-before: always;
              }
              .bundle-doc-landscape {
                page: bundle_landscape;
                break-before: page;
                page-break-before: always;
              }
              .bundle-doc-first {
                break-before: auto !important;
                page-break-before: auto !important;
              }
            }
          `,
        }}
      />

      {/* Screen-only Overlay Notice while Print Dialog is Open */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm no-print">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-sm w-full p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#0071e3] dark:text-blue-400 mx-auto flex items-center justify-center">
            <Printer className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Bundel PDF Siap Dicetak ({selectedDocs.length} Dokumen)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Jendela cetak browser akan terbuka otomatis. Pilih <strong>Save as PDF</strong> untuk menyimpan seluruh bundel menjadi 1 file.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => window.print()}
              className="btn-tactile inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Buka Ulang Cetak</span>
            </button>
            <button
              type="button"
              onClick={onCloseBundle}
              className="btn-tactile px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              Selesai / Tutup
            </button>
          </div>
        </div>
      </div>

      {/* Print-Only Bundled Documents Flow */}
      <div className="hidden print:block w-full bg-white text-black">
        {selectedDocs.map((docId, idx) => {
          const isLandscape = docId === "nominatif";
          const orientationClass = isLandscape
            ? "bundle-doc-landscape"
            : "bundle-doc-portrait";
          const firstClass = idx === 0 ? "bundle-doc-first" : "";

          return (
            <div key={docId} className={`${orientationClass} ${firstClass}`}>
              {renderDoc(docId)}
            </div>
          );
        })}
      </div>
    </>
  );
};
