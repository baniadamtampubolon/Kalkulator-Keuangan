"use client";

import React, { useState } from "react";
import { HeaderData, ParticipantRow, ActiveCostKey, ActiveUhKey } from "@/lib/types";
import { terbilang, formatRupiah } from "@/lib/terbilang";
import { Printer, Edit3, RotateCcw } from "lucide-react";

interface KwitansiDocProps {
  header: HeaderData;
  setHeader?: React.Dispatch<React.SetStateAction<HeaderData>>;
  rows: ParticipantRow[];
  setRows?: React.Dispatch<React.SetStateAction<ParticipantRow[]>>;
  activeCols?: Record<ActiveCostKey, boolean>;
  activeUh?: Record<ActiveUhKey, boolean>;
}

export const KwitansiDoc: React.FC<KwitansiDocProps> = ({
  header,
  rows,
}) => {
  // Mode: "all" for bulk view/print, or a specific index
  const [viewMode, setViewMode] = useState<"all" | number>("all");
  const [isEditMode, setIsEditMode] = useState(false);
  const [renderKey, setRenderKey] = useState(0);

  if (!rows || rows.length === 0) {
    return <div className="p-8 text-center text-slate-400">Belum ada data peserta.</div>;
  }

  // Format dates helper
  const formatDateIndo = (dStr: string) => {
    if (!dStr) return "";
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return dStr;
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const kotaTujuanText = (header.kotaTujuanList || []).filter(Boolean).join(", ") || header.provinsiTujuan;
  const tahunAnggaran = header.tanggalSpd ? new Date(header.tanggalSpd).getFullYear() : new Date().getFullYear();

  // Filter rows to render
  const displayedRows = viewMode === "all" ? rows : [rows[viewMode as number]];

  const handleResetCanvas = () => {
    setRenderKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6" key={renderKey}>
      {/* Scoped Print Portrait Style with Page Breaks */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @media print {
            @page {
              size: A4 portrait !important;
              margin: 18mm 20mm 18mm 20mm !important;
            }
            body {
              background: #ffffff !important;
            }
            .kwitansi-sheet {
              page-break-after: always !important;
              break-after: page !important;
              width: 100% !important;
              max-width: none !important;
              padding: 0 !important;
              margin: 0 !important;
              box-shadow: none !important;
              border: none !important;
            }
            .kwitansi-sheet:last-child {
              page-break-after: auto !important;
              break-after: auto !important;
            }
            .no-print {
              display: none !important;
            }
            [contenteditable="true"] {
              outline: none !important;
              background: transparent !important;
            }
          }
          [contenteditable="true"]:hover {
            outline: 1px dashed rgba(59, 130, 246, 0.4);
            border-radius: 2px;
          }
          [contenteditable="true"]:focus {
            outline: 2px solid rgba(59, 130, 246, 0.8);
            background-color: rgba(239, 246, 255, 0.4);
            border-radius: 2px;
          }
        `,
        }}
      />

      {/* Navigation Toolbar with Universal Edit on Canvas Toggle */}
      <div className="no-print glass-floating rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">Tampilan Kuitansi:</span>
            <select
              value={viewMode === "all" ? "all" : String(viewMode)}
              onChange={(e) => setViewMode(e.target.value === "all" ? "all" : parseInt(e.target.value))}
              className="input-clean h-8 px-3 text-xs font-semibold cursor-pointer"
            >
              <option value="all">⭐ Tampilkan Semua ({rows.length} Pegawai — Cetak Sekaligus)</option>
              {rows.map((r, i) => (
                <option key={r.id} value={i}>
                  Pegawai {i + 1}: {r.nama || "Tanpa Nama"} — {formatRupiah(r.totalJumlah)}
                </option>
              ))}
            </select>
          </div>

          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
            {viewMode === "all" ? `Menampilkan ${rows.length} Kuitansi` : `Menampilkan Kuitansi 1 Pegawai`}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Universal Edit on Canvas Toggle */}
          <button
            type="button"
            onClick={() => setIsEditMode(!isEditMode)}
            className={`btn-tactile flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
              isEditMode
                ? "bg-[#0071e3] text-white border-[#0071e3] shadow-sm"
                : "bg-white hover:bg-slate-50 text-slate-700 border-slate-300"
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditMode ? "Mode Edit di Canvas: AKTIF" : "Edit di Canvas"}</span>
          </button>

          {isEditMode && (
            <button
              type="button"
              onClick={handleResetCanvas}
              className="btn-tactile flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-300 cursor-pointer"
              title="Reset kembali ke teks awal dari data input"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Teks</span>
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="btn-tactile flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold shadow-sm cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>
              {viewMode === "all" ? `Cetak Semua Kuitansi (${rows.length} Lembar)` : `Cetak Kuitansi Ini`}
            </span>
          </button>
        </div>
      </div>

      {isEditMode && (
        <div className="no-print p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 shrink-0 text-slate-700" />
            <span>
              <strong>Mode Edit Bebas Aktif:</strong> Seluruh teks pada kuitansi (nama, uraian, tanggal, angka, instansi, jabatan tanda tangan) dapat langsung Anda klik dan ubah secara bebas layaknya di Microsoft Word.
            </span>
          </div>
        </div>
      )}

      {/* Kwitansi Sheets Container (Render all sequentially) */}
      <div className="space-y-8">
        {displayedRows.map((activeRow, index) => {
          const tanggalCetak = formatDateIndo(activeRow.tanggalMulai || header.tanggalSpd || new Date().toISOString());
          const uraianPembayaran = header.keteranganKegiatan
            ? header.keteranganKegiatan.toLowerCase().includes("tanggal")
              ? header.keteranganKegiatan
              : `${header.keteranganKegiatan}, pada Tanggal ${formatDateIndo(activeRow.tanggalMulai)} di ${activeRow.tujuanKota || kotaTujuanText}, ${header.provinsiTujuan}`
            : `Perjalanan Dinas dalam rangka penugasan di ${activeRow.tujuanKota || kotaTujuanText}, ${header.provinsiTujuan}`;

          return (
            <div
              key={activeRow.id || index}
              style={{ fontFamily: "Tahoma, 'Segoe UI', Geneva, Verdana, sans-serif" }}
              contentEditable={isEditMode}
              suppressContentEditableWarning={true}
              className={`kwitansi-sheet bg-white text-black p-10 md:p-14 rounded-2xl shadow-md border border-slate-200 mx-auto max-w-[860px] text-xs leading-relaxed space-y-12 transition-all ${
                isEditMode ? "ring-2 ring-slate-300 ring-offset-2" : ""
              }`}
            >
              {/* Top Header: Instansi Name on Left + Box Table on Right */}
              <div className="flex justify-between items-start pt-2">
                {/* Left: Instansi Header */}
                <div className="w-1/2 pt-4">
                  <h2 className="font-bold text-xs md:text-sm tracking-tight text-black uppercase">
                    KEMENTERIAN KOORDINATOR BIDANG PANGAN
                  </h2>
                </div>

                {/* Right: Box Metadata Table (Natural left alignment for all rows) */}
                <div className="w-fit min-w-[260px] border border-black px-3 py-2 text-[11px] leading-tight space-y-1 shrink-0">
                  <div className="grid grid-cols-[68px_14px_auto] items-center">
                    <span>Sub Keg</span>
                    <span className="text-center">:</span>
                    <span className="font-mono font-medium whitespace-nowrap pl-1">{header.nomorKomp || "-"}</span>
                  </div>
                  <div className="grid grid-cols-[68px_14px_auto] items-center">
                    <span>Akun</span>
                    <span className="text-center">:</span>
                    <span className="font-mono font-medium pl-1">{header.nomorMak || "-"}</span>
                  </div>
                  <div className="grid grid-cols-[68px_14px_auto] items-center">
                    <span>Tanggal</span>
                    <span className="text-center">:</span>
                    <span className="whitespace-nowrap pl-1">{tanggalCetak}</span>
                  </div>
                  <div className="grid grid-cols-[68px_14px_auto] items-center">
                    <span>APBN T.A</span>
                    <span className="text-center">:</span>
                    <span className="font-mono pl-1">{tahunAnggaran}</span>
                  </div>
                </div>
              </div>

              {/* Title: K U I T A N S I */}
              <div className="text-center pt-2 pb-2">
                <h1 className="text-sm md:text-base font-bold tracking-[0.35em] uppercase text-black font-sans">
                  K U I T A N S I
                </h1>
              </div>

              {/* Body Content Details */}
              <div className="space-y-4 text-xs md:text-[12.5px] leading-relaxed">
                {/* Sudah Terima Dari */}
                <div className="grid grid-cols-12 gap-1">
                  <span className="col-span-3 text-black">Sudah terima dari</span>
                  <span className="col-span-1 text-center">:</span>
                  <div className="col-span-8 space-y-0.5">
                    <p>Pejabat Pembuat Komitmen Inspektorat</p>
                    <p>Kementerian Koordinator Bidang Pangan</p>
                  </div>
                </div>

                {/* Uang Sebesar */}
                <div className="grid grid-cols-12 gap-1 pt-1 items-center">
                  <span className="col-span-3 text-black">Uang sebesar</span>
                  <span className="col-span-1 text-center">:</span>
                  <div className="col-span-8 font-mono font-semibold">
                    Rp{activeRow.totalJumlah.toLocaleString("id-ID")}
                  </div>
                </div>

                {/* Terbilang */}
                <div className="grid grid-cols-12 gap-1 pt-1">
                  <span className="col-span-3 text-black">Terbilang</span>
                  <span className="col-span-1 text-center">:</span>
                  <span className="col-span-8 italic font-normal text-black">
                    {terbilang(activeRow.totalJumlah).toLowerCase()}
                  </span>
                </div>

                {/* Untuk Pembayaran */}
                <div className="grid grid-cols-12 gap-1 pt-1">
                  <span className="col-span-3 text-black">Untuk Pembayaran</span>
                  <span className="col-span-1 text-center">:</span>
                  <div className="col-span-8 text-justify leading-relaxed text-black">
                    {uraianPembayaran}
                  </div>
                </div>
              </div>

              {/* Signatures Section (3 Kolom Bersih) */}
              <div className="pt-16 pb-6">
                <div className="grid grid-cols-3 text-left gap-4 text-xs font-sans">
                  {/* 1. PPK (Kiri) */}
                  <div className="space-y-16">
                    <div className="space-y-0.5">
                      <p>Setuju dibayar</p>
                      <p>a.n Kuasa Pengguna Anggaran</p>
                      <p>Pejabat Pembuat Komitmen</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-normal">{header.ppkNama || "Arif Wibowo, S.H., M.H."}</p>
                      <p className="font-mono text-[11px]">NIP. {header.ppkNip || "19830124200801 1 006"}</p>
                    </div>
                  </div>

                  {/* 2. Bendahara Pengeluaran (Tengah) */}
                  <div className="space-y-16">
                    <div className="space-y-0.5">
                      <p>Setuju dan lunas dibayar</p>
                      <p>Bendahara Pengeluaran,</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-normal">{header.bendahara.split(",")[0] || "Raka Panji Wibowo, S.Kom"}</p>
                      <p className="font-mono text-[11px]">
                        {header.bendahara.includes("NIP")
                          ? header.bendahara.substring(header.bendahara.indexOf("NIP"))
                          : "NIP. 19950408202012 1 001"}
                      </p>
                    </div>
                  </div>

                  {/* 3. Penerima (Kanan) */}
                  <div className="space-y-16">
                    <div className="space-y-0.5">
                      <p>{tanggalCetak}</p>
                      <p>Yang menerima,</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-normal">{activeRow.nama || "—"}</p>
                      <p className="font-mono text-[11px]">NIP. {activeRow.nip || "—"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
