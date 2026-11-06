"use client";

import React, { useState } from "react";
import { HeaderData, PengadaanItemRow } from "@/lib/types";
import { terbilang } from "@/lib/terbilang";
import {
  calculatePengadaanTotals,
  formatNominalExcel,
  getDefaultPengadaanItems,
  getSpjTypeMeta,
} from "@/lib/pengadaanHelper";
import { Printer, Edit3, RotateCcw } from "lucide-react";

interface NominatifPengadaanDocProps {
  header: HeaderData;
}

export const NominatifPengadaanDoc: React.FC<NominatifPengadaanDocProps> = ({ header }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [renderKey, setRenderKey] = useState(0);

  const spjMeta = getSpjTypeMeta(header.spjType);
  const items: PengadaanItemRow[] =
    header.pengadaanItems && header.pengadaanItems.length > 0
      ? header.pengadaanItems
      : getDefaultPengadaanItems(header.spjType || "KONSUMSI");

  const tax = header.pengadaanTax;
  const calc = calculatePengadaanTotals(items, tax);

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

  const tanggalCetak = formatDateIndo(header.tanggalSpd || header.tanggalMemo || new Date().toISOString());
  const rawKegiatan = (header.keteranganKegiatan || "").trim();
  const sudahAdaTanggal = rawKegiatan
    ? /tanggal|tgl\b|\b\d{1,2}\s+(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\s+\d{4}/i.test(rawKegiatan)
    : false;

  const judulKegiatan = rawKegiatan
    ? sudahAdaTanggal
      ? rawKegiatan
      : `${rawKegiatan} pada Tanggal ${tanggalCetak}`
    : `${spjMeta.defaultUraianKegiatan} pada Tanggal ${tanggalCetak}`;

  // Signatories
  const bendaharaRaw = header.bendahara || "Raka Panji Wibowo, S.Kom, NIP. 19950408202012 1 001";
  const bendaharaNama = bendaharaRaw.includes("NIP")
    ? bendaharaRaw.substring(0, bendaharaRaw.indexOf("NIP")).replace(/,\s*$/, "").trim()
    : bendaharaRaw.split(",")[0].trim() || "Raka Panji Wibowo, S.Kom";
  const bendaharaNip = bendaharaRaw.includes("NIP")
    ? bendaharaRaw.substring(bendaharaRaw.indexOf("NIP")).trim()
    : "NIP. 19950408202012 1 001";

  const penerimaNama =
    tax?.penerimaNama ||
    header.penanggungJawabNama ||
    "Reni Sutaryo, S.Si., M.Adm.Pemb.";
  const rawPenerimaNip =
    tax?.penerimaNip !== undefined
      ? tax.penerimaNip
      : header.penanggungJawabNip || "19791126200604 2 014";
  const penerimaJabatanLabel = tax?.penerimaJabatan || "Penanggung Jawab Kegiatan,";

  const ppnJenisDisplay = tax?.ppnMode && tax.ppnMode !== "NONE" ? "INCLUDE" : "-";

  const handleResetCanvas = () => {
    setRenderKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6" key={renderKey}>
      {/* Scoped Landscape Print Styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @media print {
            @page {
              size: A4 landscape !important;
              margin: 12mm 15mm 12mm 15mm !important;
            }
            body {
              background: #ffffff !important;
            }
            .print-page-landscape {
              width: 100% !important;
              max-width: none !important;
              padding: 0 !important;
              margin: 0 !important;
              box-shadow: none !important;
              border: none !important;
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

      {/* Action Toolbar */}
      <div className="no-print glass-floating rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              Dokumen 3: Daftar Nominatif {spjMeta.label}
            </h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${spjMeta.badgeColor}`}>
              A4 Landscape
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Format Tabel Daftar Nominatif resmi beserta perhitungan otomatis PPN, PPh 22 / PPh 23, dan Jumlah Bersih
          </p>
        </div>

        <div className="flex items-center gap-2.5">
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
            type="button"
            onClick={() => window.print()}
            className="btn-tactile flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold shadow-sm cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Nominatif</span>
          </button>
        </div>
      </div>

      {isEditMode && (
        <div className="no-print p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 shrink-0 text-slate-700" />
            <span>
              <strong>Mode Edit Bebas Aktif:</strong> Seluruh teks dan angka pada Daftar Nominatif dapat langsung Anda klik dan sesuaikan secara bebas.
            </span>
          </div>
        </div>
      )}

      {/* Landscape Printable Sheet */}
      <div
        style={{ fontFamily: "Tahoma, 'Segoe UI', Geneva, Verdana, sans-serif" }}
        contentEditable={isEditMode}
        suppressContentEditableWarning={true}
        className={`print-page print-page-landscape bg-white text-black p-6 md:p-10 rounded-2xl shadow-md border border-slate-200 mx-auto max-w-[1120px] text-xs leading-snug space-y-6 transition-all ${
          isEditMode ? "ring-2 ring-slate-300 ring-offset-2" : ""
        }`}
      >
        {/* Title Block */}
        <div className="text-center space-y-1">
          <h1 className="font-bold text-sm md:text-base tracking-wide uppercase text-black">
            DAFTAR NOMINATIF
          </h1>
          <p className="font-bold text-xs md:text-[13px] max-w-4xl mx-auto leading-snug text-black">
            {judulKegiatan}
          </p>
        </div>

        {/* Main Nominatif Table (Exact Excel Structure) */}
        <div className="overflow-x-auto">
          <table className="w-full border border-black border-collapse text-xs font-sans">
            <thead>
              <tr
                className="border-b border-black font-bold text-center"
                style={{
                  backgroundColor: "#f8fafc",
                  WebkitPrintColorAdjust: "exact",
                  printColorAdjust: "exact",
                }}
              >
                <th rowSpan={2} className="border-r border-black p-2 w-10">
                  No
                </th>
                <th rowSpan={2} className="border-r border-black p-2 min-w-[200px]">
                  URAIAN
                </th>
                <th rowSpan={2} className="border-r border-black p-2 w-32">
                  {spjMeta.colHargaLabel}
                </th>
                <th rowSpan={2} colSpan={2} className="border-r border-black p-2 w-28">
                  {spjMeta.colJumlahLabel}
                </th>
                <th rowSpan={2} className="border-r border-black p-2 w-32">
                  SUB TOTAL
                </th>
                <th colSpan={2} className="border-r border-b border-black p-1.5">
                  PPN
                </th>
                <th colSpan={2} className="border-r border-b border-black p-1.5">
                  PPH
                </th>
                <th rowSpan={2} className="p-2 w-36">
                  TOTAL
                </th>
              </tr>
              <tr
                className="border-b border-black font-bold text-center"
                style={{
                  backgroundColor: "#f8fafc",
                  WebkitPrintColorAdjust: "exact",
                  printColorAdjust: "exact",
                }}
              >
                <th className="border-r border-black p-1.5 w-20">JENIS</th>
                <th className="border-r border-black p-1.5 w-28">NILAI</th>
                <th className="border-r border-black p-1.5 w-16">22</th>
                <th className="border-r border-black p-1.5 w-16">23</th>
              </tr>
            </thead>

            <tbody>
              {items.map((item, idx) => {
                const rowSub = (Number(item.hargaSatuan) || 0) * (Number(item.jumlah) || 0);
                return (
                  <tr key={item.id || idx} className="border-b border-black">
                    <td className="border-r border-black p-2 text-center font-mono">
                      {idx + 1}
                    </td>
                    <td className="border-r border-black p-2 text-left">
                      {item.uraian || "-"}
                    </td>
                    <td className="border-r border-black p-2 text-right font-mono whitespace-nowrap">
                      {item.hargaSatuan ? formatNominalExcel(item.hargaSatuan) : "-"}
                    </td>
                    <td className="border-r border-black p-2 text-center font-mono w-14">
                      {item.jumlah || 0}
                    </td>
                    <td className="border-r border-black p-2 text-center w-14">
                      {item.satuan || spjMeta.defaultSatuan}
                    </td>
                    <td className="border-r border-black p-2 text-right font-mono whitespace-nowrap">
                      {rowSub ? formatNominalExcel(rowSub) : "-"}
                    </td>

                    {/* PPN JENIS */}
                    <td className="border-r border-black p-2 text-center font-medium">
                      {ppnJenisDisplay}
                    </td>

                    {/* Merged Vertically across all item rows: PPN NILAI, PPH 22, PPH 23, TOTAL */}
                    {idx === 0 && (
                      <>
                        <td
                          rowSpan={items.length}
                          className="border-r border-black p-2 text-center font-mono align-middle whitespace-nowrap"
                        >
                          {calc.nilaiPpn > 0 ? formatNominalExcel(calc.nilaiPpn) : "-"}
                        </td>
                        <td
                          rowSpan={items.length}
                          className="border-r border-black p-2 text-center font-mono align-middle"
                        >
                          {calc.pph22Text}
                        </td>
                        <td
                          rowSpan={items.length}
                          className="border-r border-black p-2 text-center font-mono align-middle"
                        >
                          {calc.pph23Text}
                        </td>
                        <td
                          rowSpan={items.length}
                          className="p-2 text-center font-mono align-middle"
                        >
                          -
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}

              {/* Summary Row 1: SUB TOTAL */}
              <tr className="border-b border-black font-bold">
                <td className="border-r border-black p-2 text-center"></td>
                <td colSpan={4} className="border-r border-black p-2 text-center uppercase">
                  SUB TOTAL
                </td>
                <td className="border-r border-black p-2 text-right font-mono whitespace-nowrap">
                  {formatNominalExcel(calc.subTotalBruto)}
                </td>
                <td
                  colSpan={4}
                  className="border-r border-black p-2"
                  style={{
                    backgroundColor: "#f1f5f9",
                    WebkitPrintColorAdjust: "exact",
                    printColorAdjust: "exact",
                  }}
                ></td>
                <td className="p-2 text-right font-mono whitespace-nowrap">
                  {formatNominalExcel(calc.dpp)}
                </td>
              </tr>

              {/* Summary Row 2: PPN & PPH */}
              <tr className="border-b border-black font-bold">
                <td colSpan={4} className="border-r border-black p-2"></td>
                <td className="border-r border-black p-2 text-center uppercase">
                  PPN
                </td>
                <td className="border-r border-black p-2 text-right font-mono whitespace-nowrap">
                  {calc.nilaiPpn > 0 ? formatNominalExcel(calc.nilaiPpn) : "-"}
                </td>
                <td colSpan={4} className="border-r border-black p-2 text-center uppercase">
                  {calc.pphLabel}
                </td>
                <td className="p-2 text-right font-mono whitespace-nowrap">
                  {calc.nilaiPph > 0 ? formatNominalExcel(calc.nilaiPph) : "-"}
                </td>
              </tr>

              {/* Summary Row 3: Jumlah Bersih */}
              <tr className="border-b border-black font-bold">
                <td colSpan={10} className="border-r border-black p-2 text-center">
                  Jumlah
                </td>
                <td className="p-2 text-right font-mono whitespace-nowrap text-[13px]">
                  {formatNominalExcel(calc.jumlahBersih)}
                </td>
              </tr>

              {/* Summary Row 4: Terbilang */}
              <tr className="font-bold">
                <td colSpan={11} className="p-2.5 text-left">
                  <span className="inline-block w-28">Terbilang:</span>
                  <span>{terbilang(calc.jumlahBersihRounded)}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 3 Signature Columns (Sesuai Excel Nominatif) */}
        <div className="pt-8 pb-4">
          <div className="grid grid-cols-3 gap-6 text-left text-xs font-sans">
            {/* Left: PPK */}
            <div className="space-y-16 pl-4">
              <div className="space-y-0.5">
                <p>Mengetahui/ Menyetujui</p>
                <p>Pejabat Pembuat Komitmen</p>
                <p>Inspektorat</p>
              </div>
              <div className="space-y-0.5">
                <p className="font-normal">{header.ppkNama || "Arif Wibowo, SH, MH"}</p>
                <p className="font-mono text-[11px]">
                  {header.ppkNip
                    ? header.ppkNip.startsWith("NIP")
                      ? header.ppkNip
                      : `NIP. ${header.ppkNip}`
                    : "NIP. 19830124200801 1 006"}
                </p>
              </div>
            </div>

            {/* Middle: Bendahara */}
            <div className="space-y-16 pl-8">
              <div className="space-y-0.5">
                <p className="invisible select-none">.</p>
                <p>Setuju dan lunas dibayar</p>
                <p>Bendahara Pengeluaran,</p>
              </div>
              <div className="space-y-0.5">
                <p className="font-normal">{bendaharaNama}</p>
                <p className="font-mono text-[11px]">{bendaharaNip}</p>
              </div>
            </div>

            {/* Right: Penanggung Jawab Kegiatan / Yang Menerima */}
            <div className="space-y-16 pl-8">
              <div className="space-y-0.5">
                <p className="invisible select-none">.</p>
                <p>Jakarta, {tanggalCetak}</p>
                <p>{penerimaJabatanLabel}</p>
              </div>
              <div className="space-y-0.5">
                <p className="font-normal">{penerimaNama || "—"}</p>
                {rawPenerimaNip && rawPenerimaNip.trim() !== "" && (
                  <p className="font-mono text-[11px]">
                    {rawPenerimaNip.startsWith("NIP") ? rawPenerimaNip : `NIP. ${rawPenerimaNip}`}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

