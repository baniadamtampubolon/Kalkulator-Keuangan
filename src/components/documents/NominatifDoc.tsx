"use client";

import React, { useState } from "react";
import { HeaderData, ParticipantRow, ActiveCostKey, ActiveUhKey } from "@/lib/types";
import { terbilang } from "@/lib/terbilang";
import { Printer, Edit3, RotateCcw } from "lucide-react";

interface NominatifDocProps {
  header: HeaderData;
  setHeader?: React.Dispatch<React.SetStateAction<HeaderData>>;
  rows: ParticipantRow[];
  setRows?: React.Dispatch<React.SetStateAction<ParticipantRow[]>>;
  activeCols: Record<ActiveCostKey, boolean>;
  activeUh: Record<ActiveUhKey, boolean>;
}

export const NominatifDoc: React.FC<NominatifDocProps> = ({
  header,
  rows,
  activeCols,
  activeUh,
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [renderKey, setRenderKey] = useState(0);

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

  // Calculate Column Totals across rows (sum each component safely)
  const totalUh = rows.reduce(
    (acc, r) =>
      acc +
      (r.biayaUhBiasa || 0) +
      (r.biayaUhBiasa60 || 0) +
      (r.biayaUhHalfday || 0) +
      (r.biayaUhFullboard || 0),
    0
  );

  const totalTiket = rows.reduce((acc, r) => acc + (r.tiket || 0), 0);
  const totalDukunganTransport = rows.reduce((acc, r) => acc + (r.dukunganTransportasi || 0), 0);
  const totalTransDarat = rows.reduce((acc, r) => acc + (r.transportasiDarat || 0), 0);
  const totalTransLokal = rows.reduce((acc, r) => acc + (r.transportasiLokal || 0), 0);
  const totalTransJakartaPp = rows.reduce((acc, r) => acc + (r.transportJakartaPp || 0), 0);
  const totalTransDaerahPp = rows.reduce((acc, r) => acc + (r.transportDaerahPp || 0), 0);
  const totalHotel = rows.reduce((acc, r) => acc + (r.hotel || 0) + (r.penginapan30 || 0), 0);
  const totalFullday = rows.reduce((acc, r) => acc + (r.fulldayMeeting || 0), 0);
  const totalFullboard = rows.reduce((acc, r) => acc + (r.fullboardMeeting || 0), 0);
  const totalRiil = rows.reduce((acc, r) => acc + (r.pengRill || 0), 0);
  const totalRepresentatif = rows.reduce((acc, r) => acc + (r.representatif || 0), 0);
  const totalBelanjaBahan = rows.reduce((acc, r) => acc + (r.belanjaBahan || 0), 0);

  const grandTotal = rows.reduce((acc, r) => acc + (r.totalJumlah || 0), 0);

  // Determine which cost columns should be displayed:
  // Shown if explicitly checked in filter OR if any participant has an amount > 0
  const isAnyUhActive = Boolean(
    activeUh?.uhBiasa || activeUh?.uhBiasa60 || activeUh?.uhHalfday || activeUh?.uhFullboard
  );
  const showTransDarat = Boolean(activeCols?.transportasiDarat || totalTransDarat > 0);
  const showDukunganTransport = Boolean(activeCols?.dukunganTransportasi || totalDukunganTransport > 0);
  const showTransLokal = Boolean(activeCols?.transportasiLokal || totalTransLokal > 0);
  const showTransJakartaPp = Boolean(activeCols?.transportJakartaPp || totalTransJakartaPp > 0);
  const showTransDaerahPp = Boolean(activeCols?.transportDaerahPp || totalTransDaerahPp > 0);
  const showTiket = Boolean(activeCols?.tiket || totalTiket > 0);
  const showUh = Boolean(isAnyUhActive || totalUh > 0);
  const showHotel = Boolean(activeCols?.hotel || activeCols?.penginapan30 || totalHotel > 0);
  const showFullday = Boolean(activeCols?.fulldayMeeting || totalFullday > 0);
  const showFullboard = Boolean(activeCols?.fullboardMeeting || totalFullboard > 0);
  const showRiil = Boolean(activeCols?.pengRill || totalRiil > 0);
  const showRepresentatif = Boolean(activeCols?.representatif || totalRepresentatif > 0);
  const showBelanjaBahan = Boolean(activeCols?.belanjaBahan || totalBelanjaBahan > 0);

  let rincianColCount = 1; // Always has Jumlah
  if (showTransDarat) rincianColCount++;
  if (showDukunganTransport) rincianColCount++;
  if (showTransLokal) rincianColCount++;
  if (showTransJakartaPp) rincianColCount++;
  if (showTransDaerahPp) rincianColCount++;
  if (showTiket) rincianColCount++;
  if (showUh) rincianColCount++;
  if (showHotel) rincianColCount++;
  if (showFullday) rincianColCount++;
  if (showFullboard) rincianColCount++;
  if (showRiil) rincianColCount++;
  if (showRepresentatif) rincianColCount++;
  if (showBelanjaBahan) rincianColCount++;

  const baseFixedCols = 8;
  const totalColumns = baseFixedCols + rincianColCount;

  const isDense = totalColumns > 12;
  const isVeryDense = totalColumns > 14;

  const subtitleText = header.keteranganKegiatan
    ? header.keteranganKegiatan.toLowerCase().includes("tanggal")
      ? header.keteranganKegiatan
      : `${header.keteranganKegiatan} PADA TANGGAL ${formatDateIndo(rows[0]?.tanggalMulai || header.tanggalSpd)} DI ${kotaTujuanText}, ${header.provinsiTujuan}`
    : `DAFTAR NOMINATIF PERJALANAN DINAS DI ${kotaTujuanText}, ${header.provinsiTujuan}`;

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
              margin: 8mm 10mm 8mm 10mm !important;
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
            .print-page-landscape table {
              font-family: Tahoma, 'Segoe UI', Geneva, Verdana, sans-serif !important;
              font-size: ${isVeryDense ? "6.5pt" : isDense ? "7.2pt" : "8pt"} !important;
              line-height: 1.15 !important;
            }
            .print-page-landscape th,
            .print-page-landscape td {
              font-family: Tahoma, 'Segoe UI', Geneva, Verdana, sans-serif !important;
              padding: ${isVeryDense ? "1px 1.5px" : isDense ? "1.5px 2px" : "2px 3px"} !important;
            }
            .print-page-landscape td.tabular-nums,
            .print-page-landscape td.text-right,
            .print-page-landscape .whitespace-nowrap {
              white-space: nowrap !important;
              word-break: keep-all !important;
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
              Dokumen 3: Daftar Nominatif Rencana Kegiatan
            </h3>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              A4 Landscape Auto-Fit ({totalColumns} Kolom)
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Tabel otomatis menyesuaikan ukuran font dan padding secara dinamis agar 100% muat pas di 1 lembar kertas A4 Landscape
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Edit on Canvas Toggle */}
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
            <span>Cetak Nominatif</span>
          </button>
        </div>
      </div>

      {isEditMode && (
        <div className="no-print p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 shrink-0 text-slate-700" />
            <span>
              <strong>Mode Edit Bebas Aktif:</strong> Seluruh teks pada Nominatif (judul, narasi kegiatan, seluruh kolom & baris tabel, angka rupiah, keterangan ST, hingga tanda tangan) dapat langsung Anda klik dan edit secara bebas.
            </span>
          </div>
        </div>
      )}

      {/* Nominatif Document Sheet (Landscape Print-ready with Tahoma Font) */}
      <div
        style={{ fontFamily: "Tahoma, 'Segoe UI', Geneva, Verdana, sans-serif" }}
        contentEditable={isEditMode}
        suppressContentEditableWarning={true}
        className={`print-page print-page-landscape bg-white text-black p-4 md:p-6 rounded-2xl shadow-md border border-slate-200 mx-auto w-full max-w-[1240px] text-xs leading-normal space-y-3 transition-all ${
          isEditMode ? "ring-2 ring-slate-300 ring-offset-2" : ""
        }`}
      >
        {/* Document Title Header */}
        <div className="text-center space-y-1 px-2" style={{ fontFamily: "Tahoma, Geneva, sans-serif" }}>
          <h1 className="text-xs md:text-sm font-black tracking-wide uppercase text-black">
            DAFTAR NOMINATIF RENCANA KEGIATAN
          </h1>
          <p className="text-[9.5px] md:text-[10.5px] font-bold text-black max-w-4xl mx-auto leading-tight">
            {subtitleText}
          </p>
        </div>

        {/* Dynamic Auto-Fitting Table */}
        <div className="w-full overflow-x-auto pt-1">
          <table className="w-full border border-black border-collapse text-[8.5px] md:text-[9px] leading-tight" style={{ fontFamily: "Tahoma, Geneva, sans-serif" }}>
            <thead>
              <tr className="font-bold border-b border-black text-center bg-white text-black">
                <th rowSpan={2} className="border border-black p-0.5 w-5 align-middle">
                  No
                </th>
                <th rowSpan={2} className="border border-black p-0.5 align-middle">
                  Nama
                </th>
                <th rowSpan={2} className="border border-black p-0.5 align-middle">
                  Jabatan
                </th>
                <th rowSpan={2} className="border border-black p-0.5 w-7 align-middle">
                  Gol
                </th>
                <th rowSpan={2} className="border border-black p-0.5 align-middle">
                  Tujuan
                </th>
                <th colSpan={2} className="border border-black p-0.5 align-middle">
                  Tanggal
                </th>
                <th rowSpan={2} className="border border-black p-0.5 w-7 align-middle">
                  Lama
                </th>
                <th colSpan={rincianColCount} className="border border-black p-0.5 align-middle">
                  Rincian Biaya
                </th>
              </tr>
              <tr className="font-bold border-b border-black text-center bg-white text-black text-[9px]">
                {/* Under Tanggal */}
                <th className="border border-black p-0.5 w-16">Berangkat</th>
                <th className="border border-black p-0.5 w-16">Pulang</th>

                {/* Under Rincian Biaya */}
                {showTransDarat && <th className="border border-black p-0.5">Transport Darat PP</th>}
                {showDukunganTransport && <th className="border border-black p-0.5">Dukungan Transport</th>}
                {showTransLokal && <th className="border border-black p-0.5">Transport Lokal</th>}
                {showTransJakartaPp && <th className="border border-black p-0.5">Transport Jakarta PP</th>}
                {showTransDaerahPp && <th className="border border-black p-0.5">Transport Daerah PP</th>}
                {showTiket && <th className="border border-black p-0.5">Tiket PP</th>}
                {showUh && <th className="border border-black p-0.5">Uang Harian</th>}
                {showHotel && <th className="border border-black p-0.5">Hotel</th>}
                {showFullday && <th className="border border-black p-0.5">Paket Fullday</th>}
                {showFullboard && <th className="border border-black p-0.5">Paket Fullboard</th>}
                {showRiil && <th className="border border-black p-0.5">Peng. Riil</th>}
                {showRepresentatif && <th className="border border-black p-0.5">Representatif</th>}
                {showBelanjaBahan && <th className="border border-black p-0.5">Belanja Bahan</th>}
                <th className="border border-black p-0.5 font-bold">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const uhRow =
                  (row.biayaUhBiasa || 0) +
                  (row.biayaUhBiasa60 || 0) +
                  (row.biayaUhHalfday || 0) +
                  (row.biayaUhFullboard || 0);

                const hotelRow = (row.hotel || 0) + (row.penginapan30 || 0);

                const tujuanDisplay =
                  row.tujuanKota
                    ? `${row.tujuanKota}, ${row.tujuanProvinsi || header.provinsiTujuan}`
                    : `${kotaTujuanText}, ${header.provinsiTujuan}`;

                return (
                  <tr key={row.id} className="border-b border-black text-black">
                    <td className="border border-black p-1 text-center font-bold">
                      {idx + 1}
                    </td>
                    <td className="border border-black p-1 font-semibold">
                      {row.nama || "—"}
                    </td>
                    <td className="border border-black p-1 text-left">
                      {row.jabatan || "Pelaksana"}
                    </td>
                    <td className="border border-black p-1 text-center font-medium">
                      {row.golongan || "—"}
                    </td>
                    <td className="border border-black p-1 text-center">
                      {tujuanDisplay}
                    </td>
                    <td className="border border-black p-1 text-center whitespace-nowrap">
                      {formatDateIndo(row.tanggalMulai)}
                    </td>
                    <td className="border border-black p-1 text-center whitespace-nowrap">
                      {formatDateIndo(row.tanggalSelesai)}
                    </td>
                    <td className="border border-black p-1 text-center font-semibold">
                      {row.lamaHari}
                    </td>

                    {/* Cost Columns */}
                    {showTransDarat && (
                      <td className="border border-black p-0.5 text-right whitespace-nowrap tabular-nums">
                        {(row.transportasiDarat || 0).toLocaleString("id-ID")}
                      </td>
                    )}
                    {showDukunganTransport && (
                      <td className="border border-black p-0.5 text-right whitespace-nowrap tabular-nums">
                        {(row.dukunganTransportasi || 0).toLocaleString("id-ID")}
                      </td>
                    )}
                    {showTransLokal && (
                      <td className="border border-black p-0.5 text-right whitespace-nowrap tabular-nums">
                        {(row.transportasiLokal || 0).toLocaleString("id-ID")}
                      </td>
                    )}
                    {showTransJakartaPp && (
                      <td className="border border-black p-0.5 text-right whitespace-nowrap tabular-nums">
                        {(row.transportJakartaPp || 0).toLocaleString("id-ID")}
                      </td>
                    )}
                    {showTransDaerahPp && (
                      <td className="border border-black p-0.5 text-right whitespace-nowrap tabular-nums">
                        {(row.transportDaerahPp || 0).toLocaleString("id-ID")}
                      </td>
                    )}
                    {showTiket && (
                      <td className="border border-black p-0.5 text-right whitespace-nowrap tabular-nums">
                        {(row.tiket || 0).toLocaleString("id-ID")}
                      </td>
                    )}
                    {showUh && (
                      <td className="border border-black p-0.5 text-right whitespace-nowrap tabular-nums">
                        {uhRow.toLocaleString("id-ID")}
                      </td>
                    )}
                    {showHotel && (
                      <td className="border border-black p-0.5 text-right whitespace-nowrap tabular-nums">
                        {hotelRow.toLocaleString("id-ID")}
                      </td>
                    )}
                    {showFullday && (
                      <td className="border border-black p-0.5 text-right whitespace-nowrap tabular-nums">
                        {(row.fulldayMeeting || 0).toLocaleString("id-ID")}
                      </td>
                    )}
                    {showFullboard && (
                      <td className="border border-black p-0.5 text-right whitespace-nowrap tabular-nums">
                        {(row.fullboardMeeting || 0).toLocaleString("id-ID")}
                      </td>
                    )}
                    {showRiil && (
                      <td className="border border-black p-0.5 text-right whitespace-nowrap tabular-nums">
                        {(row.pengRill || 0).toLocaleString("id-ID")}
                      </td>
                    )}
                    {showRepresentatif && (
                      <td className="border border-black p-0.5 text-right whitespace-nowrap tabular-nums">
                        {(row.representatif || 0).toLocaleString("id-ID")}
                      </td>
                    )}
                    {showBelanjaBahan && (
                      <td className="border border-black p-0.5 text-right whitespace-nowrap tabular-nums">
                        {(row.belanjaBahan || 0).toLocaleString("id-ID")}
                      </td>
                    )}

                    {/* Jumlah Row Total */}
                    <td className="border border-black p-0.5 text-right font-bold whitespace-nowrap tabular-nums">
                      {row.totalJumlah.toLocaleString("id-ID")}
                    </td>
                  </tr>
                );
              })}

              {/* Total Footer Row */}
              <tr className="font-bold border-t border-black bg-white text-black text-[9px]">
                <td colSpan={8} className="border border-black p-0.5 text-center font-bold uppercase tracking-wider">
                  JUMLAH
                </td>
                {showTransDarat && (
                  <td className="border border-black p-0.5 text-right whitespace-nowrap tabular-nums">
                    {totalTransDarat.toLocaleString("id-ID")}
                  </td>
                )}
                {showDukunganTransport && (
                  <td className="border border-black p-0.5 text-right whitespace-nowrap tabular-nums">
                    {totalDukunganTransport.toLocaleString("id-ID")}
                  </td>
                )}
                {showTransLokal && (
                  <td className="border border-black p-0.5 text-right whitespace-nowrap tabular-nums">
                    {totalTransLokal.toLocaleString("id-ID")}
                  </td>
                )}
                {showTransJakartaPp && (
                  <td className="border border-black p-0.5 text-right whitespace-nowrap tabular-nums">
                    {totalTransJakartaPp.toLocaleString("id-ID")}
                  </td>
                )}
                {showTransDaerahPp && (
                  <td className="border border-black p-0.5 text-right whitespace-nowrap tabular-nums">
                    {totalTransDaerahPp.toLocaleString("id-ID")}
                  </td>
                )}
                {showTiket && (
                  <td className="border border-black p-0.5 text-right whitespace-nowrap tabular-nums">
                    {totalTiket.toLocaleString("id-ID")}
                  </td>
                )}
                {showUh && (
                  <td className="border border-black p-0.5 text-right whitespace-nowrap tabular-nums">
                    {totalUh.toLocaleString("id-ID")}
                  </td>
                )}
                {showHotel && (
                  <td className="border border-black p-0.5 text-right whitespace-nowrap tabular-nums">
                    {totalHotel.toLocaleString("id-ID")}
                  </td>
                )}
                {showFullday && (
                  <td className="border border-black p-0.5 text-right whitespace-nowrap tabular-nums">
                    {totalFullday.toLocaleString("id-ID")}
                  </td>
                )}
                {showFullboard && (
                  <td className="border border-black p-0.5 text-right whitespace-nowrap tabular-nums">
                    {totalFullboard.toLocaleString("id-ID")}
                  </td>
                )}
                {showRiil && (
                  <td className="border border-black p-0.5 text-right whitespace-nowrap tabular-nums">
                    {totalRiil.toLocaleString("id-ID")}
                  </td>
                )}
                {showRepresentatif && (
                  <td className="border border-black p-0.5 text-right whitespace-nowrap tabular-nums">
                    {totalRepresentatif.toLocaleString("id-ID")}
                  </td>
                )}
                {showBelanjaBahan && (
                  <td className="border border-black p-0.5 text-right whitespace-nowrap tabular-nums">
                    {totalBelanjaBahan.toLocaleString("id-ID")}
                  </td>
                )}
                <td className="border border-black p-0.5 text-right font-bold whitespace-nowrap tabular-nums">
                  {grandTotal.toLocaleString("id-ID")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Terbilang Grand Total */}
        <div className="pt-2 text-xs font-sans">
          <p className="font-semibold text-black">
            Terbilang : &nbsp;
            <span className="italic font-normal">
              {terbilang(grandTotal).toLowerCase()}
            </span>
          </p>
        </div>

        {/* Signatures Section: 3 Columns (Kiri: PPK, Tengah: Bendahara, Kanan: Penanggung Jawab Kegiatan) */}
        {(() => {
          const bendaharaRaw = header.bendahara || "Raka Panji Wibowo, NIP. 19950408202012 1 001";
          const bendaharaNama = bendaharaRaw.includes("NIP")
            ? bendaharaRaw.substring(0, bendaharaRaw.indexOf("NIP")).replace(/,\s*$/, "").trim()
            : bendaharaRaw.split(",")[0].trim() || "Raka Panji Wibowo";
          const bendaharaNip = bendaharaRaw.includes("NIP")
            ? bendaharaRaw.substring(bendaharaRaw.indexOf("NIP")).trim()
            : "NIP. 19950408202012 1 001";

          const ppkNama = header.ppkNama || "Arif Wibowo, S.H., M.H.";
          const ppkNip = header.ppkNip
            ? header.ppkNip.startsWith("NIP")
              ? header.ppkNip
              : `NIP. ${header.ppkNip}`
            : "NIP. 19830124200801 1 006";

          const penanggungJawabNama = header.penanggungJawabNama || "Reni Sutaryo, S.Si., M.Adm.Pemb";
          const penanggungJawabNip = header.penanggungJawabNip
            ? header.penanggungJawabNip.startsWith("NIP")
              ? header.penanggungJawabNip
              : `NIP. ${header.penanggungJawabNip}`
            : "NIP. 19791126200604 2 014";

          return (
            <div className="pt-8 pb-4">
              <div className="grid grid-cols-3 gap-6 text-xs font-sans px-4">
                {/* Left: Pejabat Pembuat Komitmen */}
                <div className="space-y-16 text-left">
                  <div className="space-y-0.5">
                    <p>Mengetahui/ Menyetujui</p>
                    <p className="font-semibold">{header.ppkJabatan || "Pejabat Pembuat Komitmen"}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-semibold">{ppkNama}</p>
                    <p className="font-mono text-[11px]">{ppkNip}</p>
                  </div>
                </div>

                {/* Center: Bendahara Pengeluaran */}
                <div className="space-y-16 text-left">
                  <div className="space-y-0.5">
                    <p>Bendahara Pengeluaran</p>
                    <p className="font-semibold">{header.unitKerja || "Kemenko Pangan"}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-semibold">{bendaharaNama}</p>
                    <p className="font-mono text-[11px]">{bendaharaNip}</p>
                  </div>
                </div>

                {/* Right: Penanggung Jawab Kegiatan */}
                <div className="space-y-16 text-left">
                  <div className="space-y-0.5">
                    <p>Penanggung Jawab Kegiatan,</p>
                    <p className="invisible font-semibold">-</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-semibold">{penanggungJawabNama}</p>
                    <p className="font-mono text-[11px]">{penanggungJawabNip}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
