"use client";

import React from "react";
import { HeaderData, ParticipantRow, ActiveCostKey, ActiveUhKey } from "@/lib/types";
import { formatRupiah, terbilang } from "@/lib/terbilang";
import { Printer } from "lucide-react";

interface NominatifDocProps {
  header: HeaderData;
  rows: ParticipantRow[];
  activeCols: Record<ActiveCostKey, boolean>;
  activeUh: Record<ActiveUhKey, boolean>;
}

export const NominatifDoc: React.FC<NominatifDocProps> = ({
  header,
  rows,
  activeCols,
  activeUh,
}) => {
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

  // Calculate Column Totals across rows
  const totalUh = rows.reduce(
    (acc, r) =>
      acc +
      (activeUh.uhBiasa ? r.biayaUhBiasa : 0) +
      (activeUh.uhBiasa60 ? r.biayaUhBiasa60 : 0) +
      (activeUh.uhHalfday ? r.biayaUhHalfday : 0) +
      (activeUh.uhFullboard ? r.biayaUhFullboard : 0),
    0
  );

  const totalTiket = activeCols.tiket
    ? rows.reduce((acc, r) => acc + (r.tiket || 0), 0)
    : 0;

  const totalTransDarat = activeCols.transportasiDarat
    ? rows.reduce((acc, r) => acc + (r.transportasiDarat || 0), 0)
    : 0;

  const totalTransLokal = activeCols.transportasiLokal
    ? rows.reduce((acc, r) => acc + (r.transportasiLokal || 0), 0)
    : 0;

  const totalHotel =
    (activeCols.hotel ? rows.reduce((acc, r) => acc + (r.hotel || 0), 0) : 0) +
    (activeCols.penginapan30 ? rows.reduce((acc, r) => acc + (r.penginapan30 || 0), 0) : 0);

  const totalRiil = activeCols.pengRill
    ? rows.reduce((acc, r) => acc + (r.pengRill || 0), 0)
    : 0;

  const totalRepresentatif = activeCols.representatif
    ? rows.reduce((acc, r) => acc + (r.representatif || 0), 0)
    : 0;

  const totalBelanjaBahan = activeCols.belanjaBahan
    ? rows.reduce((acc, r) => acc + (r.belanjaBahan || 0), 0)
    : 0;

  const grandTotal = rows.reduce((acc, r) => acc + (r.totalJumlah || 0), 0);

  // Dynamic Column Visibility Rules matching user criteria
  const showUh = totalUh > 0;
  const showTiket = activeCols.tiket && totalTiket > 0;
  const showTransDarat = activeCols.transportasiDarat && totalTransDarat > 0;
  const showTransLokal = activeCols.transportasiLokal && totalTransLokal > 0;
  const showHotel = (activeCols.hotel || activeCols.penginapan30) && totalHotel > 0;
  const showRiil = activeCols.pengRill && totalRiil > 0;
  const showRepresentatif = activeCols.representatif; // Always show if checked
  const showBelanjaBahan = activeCols.belanjaBahan && totalBelanjaBahan > 0;

  // Number of active sub-columns under "Rincian Biaya"
  let rincianColCount = 1; // +1 for Jumlah
  if (showTransDarat) rincianColCount++;
  if (showTransLokal) rincianColCount++;
  if (showTiket) rincianColCount++;
  if (showUh) rincianColCount++;
  if (showHotel) rincianColCount++;
  if (showRiil) rincianColCount++;
  if (showRepresentatif) rincianColCount++;
  if (showBelanjaBahan) rincianColCount++;

  // Total columns count
  const totalColumns = 8 + rincianColCount + 1; // 8 left cols + rincian cols + 1 keterangan

  // Dynamic font and sizing calculation based on total columns
  const isVeryDense = totalColumns >= 14;
  const isDense = totalColumns >= 11;

  const leftColSpan = 8;

  // First row participant for PJ Kegiatan signature
  const pjKegiatan = rows[0] || {
    nama: "Reni Sutaryo, S.Si., M.Adm.Pemb",
    nip: "19791126 200604 2 014",
  };

  // Build clean subtitle
  const subtitleText = header.keteranganKegiatan.toLowerCase().includes("tanggal")
    ? header.keteranganKegiatan
    : `${header.keteranganKegiatan}, pada Tanggal ${formatDateIndo(rows[0]?.tanggalMulai || header.tanggalSpd)} di ${kotaTujuanText}, ${header.provinsiTujuan}`;

  return (
    <div className="space-y-6">
      {/* Inject Scoped Print Landscape CSS with Dynamic Auto-Fit */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @media print {
            @page {
              size: A4 landscape !important;
              margin: 6mm 8mm 6mm 8mm !important;
            }
            body {
              background: #ffffff !important;
            }
            .print-page-landscape {
              width: 100% !important;
              max-width: 100% !important;
              padding: 0 !important;
              margin: 0 !important;
              box-shadow: none !important;
              border: none !important;
              font-size: ${isVeryDense ? "7pt" : isDense ? "7.5pt" : "8.5pt"} !important;
            }
            .print-page-landscape table {
              width: 100% !important;
              table-layout: auto !important;
              font-size: ${isVeryDense ? "6.5pt" : isDense ? "7pt" : "8pt"} !important;
            }
            .print-page-landscape th,
            .print-page-landscape td {
              padding: ${isVeryDense ? "1.5px 2px" : isDense ? "2px 3px" : "3px 4px"} !important;
              word-break: break-word !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `,
        }}
      />

      {/* Action Toolbar */}
      <div className="no-print glass-floating rounded-2xl p-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              Dokumen 3: Daftar Nominatif Rencana Kegiatan
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              A4 Landscape Auto-Fit ({totalColumns} Kolom)
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Tabel otomatis menyesuaikan ukuran font dan padding secara dinamis agar 100% muat pas di 1 lembar kertas A4 Landscape
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="btn-tactile flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Cetak Nominatif</span>
        </button>
      </div>

      {/* Nominatif Document Sheet (Landscape Print-ready with Tahoma Font) */}
      <div
        style={{ fontFamily: "Tahoma, 'Segoe UI', Geneva, Verdana, sans-serif" }}
        className="print-page print-page-landscape bg-white text-black p-4 md:p-6 rounded-2xl shadow-md border border-slate-200 mx-auto w-full max-w-[1240px] text-xs leading-normal space-y-3"
      >
        {/* Document Title Header */}
        <div className="text-center space-y-1 px-2">
          <h1 className="text-xs md:text-sm font-black tracking-wide uppercase text-black font-sans">
            DAFTAR NOMINATIF RENCANA KEGIATAN
          </h1>
          <p className="text-[10px] md:text-xs font-bold text-black max-w-4xl mx-auto leading-tight">
            {subtitleText}
          </p>
        </div>

        {/* Dynamic Auto-Fitting Table */}
        <div className="w-full overflow-x-auto pt-1">
          <table className="w-full border-2 border-black border-collapse font-sans text-[10px] leading-tight">
            <thead>
              <tr className="font-bold border-b border-black text-center bg-white text-black">
                <th rowSpan={2} className="border border-black p-1 w-6 align-middle">
                  No
                </th>
                <th rowSpan={2} className="border border-black p-1 align-middle">
                  Nama
                </th>
                <th rowSpan={2} className="border border-black p-1 align-middle">
                  Jabatan
                </th>
                <th rowSpan={2} className="border border-black p-1 w-8 align-middle">
                  Gol
                </th>
                <th rowSpan={2} className="border border-black p-1 align-middle">
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
                <th rowSpan={2} className="border border-black p-1 max-w-[150px] align-middle">
                  Keterangan
                </th>
              </tr>
              <tr className="font-bold border-b-2 border-black text-center bg-white text-black text-[9px]">
                {/* Under Tanggal */}
                <th className="border border-black p-0.5 w-16">Berangkat</th>
                <th className="border border-black p-0.5 w-16">Pulang</th>

                {/* Under Rincian Biaya */}
                {showTransDarat && <th className="border border-black p-0.5">Transport Darat PP</th>}
                {showTransLokal && <th className="border border-black p-0.5">Transport Lokal</th>}
                {showTiket && <th className="border border-black p-0.5">Tiket PP</th>}
                {showUh && <th className="border border-black p-0.5">Uang Harian</th>}
                {showHotel && <th className="border border-black p-0.5">Hotel</th>}
                {showRiil && <th className="border border-black p-0.5">Peng. Riil</th>}
                {showRepresentatif && <th className="border border-black p-0.5">Representatif</th>}
                {showBelanjaBahan && <th className="border border-black p-0.5">Belanja Bahan</th>}
                <th className="border border-black p-0.5 font-bold">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const uhRow =
                  (activeUh.uhBiasa ? row.biayaUhBiasa : 0) +
                  (activeUh.uhBiasa60 ? row.biayaUhBiasa60 : 0) +
                  (activeUh.uhHalfday ? row.biayaUhHalfday : 0) +
                  (activeUh.uhFullboard ? row.biayaUhFullboard : 0);

                const hotelRow =
                  (activeCols.hotel ? (row.hotel || 0) : 0) +
                  (activeCols.penginapan30 ? (row.penginapan30 || 0) : 0);

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
                      {row.nama}
                    </td>
                    <td className="border border-black p-1 text-left">
                      {row.jabatan}
                    </td>
                    <td className="border border-black p-1 text-center font-medium">
                      {row.golongan}
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
                      <td className="border border-black p-1 text-right font-mono">
                        {(row.transportasiDarat || 0).toLocaleString("id-ID")}
                      </td>
                    )}
                    {showTransLokal && (
                      <td className="border border-black p-1 text-right font-mono">
                        {(row.transportasiLokal || 0).toLocaleString("id-ID")}
                      </td>
                    )}
                    {showTiket && (
                      <td className="border border-black p-1 text-right font-mono">
                        {(row.tiket || 0).toLocaleString("id-ID")}
                      </td>
                    )}
                    {showUh && (
                      <td className="border border-black p-1 text-right font-mono">
                        {uhRow.toLocaleString("id-ID")}
                      </td>
                    )}
                    {showHotel && (
                      <td className="border border-black p-1 text-right font-mono">
                        {hotelRow.toLocaleString("id-ID")}
                      </td>
                    )}
                    {showRiil && (
                      <td className="border border-black p-1 text-right font-mono">
                        {(row.pengRill || 0).toLocaleString("id-ID")}
                      </td>
                    )}
                    {showRepresentatif && (
                      <td className="border border-black p-1 text-right font-mono">
                        {(row.representatif || 0).toLocaleString("id-ID")}
                      </td>
                    )}
                    {showBelanjaBahan && (
                      <td className="border border-black p-1 text-right font-mono">
                        {(row.belanjaBahan || 0).toLocaleString("id-ID")}
                      </td>
                    )}

                    {/* Jumlah Row */}
                    <td className="border border-black p-1 text-right font-mono font-bold">
                      {row.totalJumlah.toLocaleString("id-ID")}
                    </td>

                    {/* Keterangan Column (Merged across all participant rows) */}
                    {idx === 0 ? (
                      <td
                        rowSpan={rows.length}
                        className="border border-black p-1.5 text-justify align-top text-[8.5px] leading-snug break-words max-w-[150px]"
                      >
                        {subtitleText}
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              {/* Grand Total Row */}
              <tr className="border-t-2 border-black font-bold text-black bg-white">
                <td colSpan={leftColSpan} className="border border-black p-1 text-center uppercase tracking-wider text-[10px]">
                  JUMLAH
                </td>

                {showTransDarat && (
                  <td className="border border-black p-1 text-right font-mono">
                    {totalTransDarat.toLocaleString("id-ID")}
                  </td>
                )}
                {showTransLokal && (
                  <td className="border border-black p-1 text-right font-mono">
                    {totalTransLokal.toLocaleString("id-ID")}
                  </td>
                )}
                {showTiket && (
                  <td className="border border-black p-1 text-right font-mono">
                    {totalTiket.toLocaleString("id-ID")}
                  </td>
                )}
                {showUh && (
                  <td className="border border-black p-1 text-right font-mono">
                    {totalUh.toLocaleString("id-ID")}
                  </td>
                )}
                {showHotel && (
                  <td className="border border-black p-1 text-right font-mono">
                    {totalHotel.toLocaleString("id-ID")}
                  </td>
                )}
                {showRiil && (
                  <td className="border border-black p-1 text-right font-mono">
                    {totalRiil.toLocaleString("id-ID")}
                  </td>
                )}
                {showRepresentatif && (
                  <td className="border border-black p-1 text-right font-mono">
                    {totalRepresentatif.toLocaleString("id-ID")}
                  </td>
                )}
                {showBelanjaBahan && (
                  <td className="border border-black p-1 text-right font-mono">
                    {totalBelanjaBahan.toLocaleString("id-ID")}
                  </td>
                )}

                <td className="border border-black p-1 text-right font-mono font-bold text-[10px]">
                  {grandTotal.toLocaleString("id-ID")}
                </td>

                {/* Terbilang inside Keterangan footer cell */}
                <td className="border border-black p-1 text-center italic font-bold text-[8.5px] leading-tight break-words max-w-[150px]">
                  {terbilang(grandTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Signatures Section (3 Kolom: PPK, Bendahara, Penanggung Jawab Kegiatan) */}
        <div className="pt-4 pb-1">
          <div className="grid grid-cols-3 text-left gap-4 text-[10px] font-sans">
            {/* 1. PPK (Kiri) */}
            <div className="space-y-12">
              <div>
                <p>Mengetahui/ Menyetujui</p>
                <p className="font-semibold">Pejabat Pembuat Komitmen</p>
              </div>
              <div className="space-y-0.5">
                <p className="font-bold">{header.ppkNama || "Kunto Nugroho"}</p>
                <p className="font-mono text-[9.5px]">NIP. {header.ppkNip || "198912142018011001"}</p>
              </div>
            </div>

            {/* 2. Bendahara Pengeluaran (Tengah) */}
            <div className="space-y-12">
              <div>
                <p>Bendahara Pengeluaran</p>
                <p className="font-semibold">Kemenko Pangan</p>
              </div>
              <div className="space-y-0.5">
                <p className="font-bold">{header.bendahara.split(",")[0] || "Raka Panji Wibowo, S.Kom"}</p>
                <p className="font-mono text-[9.5px]">
                  {header.bendahara.includes("NIP")
                    ? header.bendahara.substring(header.bendahara.indexOf("NIP"))
                    : "NIP. 19950408202012 1 001"}
                </p>
              </div>
            </div>

            {/* 3. Penanggung Jawab Kegiatan (Kanan) */}
            <div className="space-y-12">
              <div>
                <p>Penanggung Jawab Kegiatan,</p>
              </div>
              <div className="space-y-0.5">
                <p className="font-bold">{pjKegiatan.nama || "Reni Sutaryo, S.Si., M.Adm.Pemb"}</p>
                <p className="font-mono text-[9.5px]">NIP. {pjKegiatan.nip || "19791126 200604 2 014"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
