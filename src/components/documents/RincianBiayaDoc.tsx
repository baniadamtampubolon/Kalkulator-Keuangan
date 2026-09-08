"use client";

import React, { useState } from "react";
import { HeaderData, ParticipantRow, ActiveCostKey, ActiveUhKey } from "@/lib/types";
import { terbilang } from "@/lib/terbilang";
import { Printer, Edit3, RotateCcw } from "lucide-react";

interface RincianBiayaDocProps {
  header: HeaderData;
  setHeader?: React.Dispatch<React.SetStateAction<HeaderData>>;
  rows: ParticipantRow[];
  setRows?: React.Dispatch<React.SetStateAction<ParticipantRow[]>>;
  activeCols: Record<ActiveCostKey, boolean>;
  activeUh: Record<ActiveUhKey, boolean>;
}

export const RincianBiayaDoc: React.FC<RincianBiayaDocProps> = ({
  header,
  rows,
  activeCols,
  activeUh,
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
              margin: 15mm 20mm 15mm 20mm !important;
            }
            body {
              background: #ffffff !important;
            }
            .rincian-sheet {
              page-break-after: always !important;
              break-after: page !important;
              width: 100% !important;
              max-width: none !important;
              padding: 0 !important;
              margin: 0 !important;
              box-shadow: none !important;
              border: none !important;
            }
            .rincian-sheet:last-child {
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

      {/* Navigation Toolbar */}
      <div className="no-print glass-floating rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">Tampilan Rincian Biaya:</span>
            <select
              value={viewMode === "all" ? "all" : String(viewMode)}
              onChange={(e) => setViewMode(e.target.value === "all" ? "all" : parseInt(e.target.value))}
              className="input-clean h-8 px-3 text-xs font-semibold cursor-pointer"
            >
              <option value="all">⭐ Tampilkan Semua ({rows.length} Pegawai — Cetak Sekaligus)</option>
              {rows.map((r, i) => (
                <option key={r.id} value={i}>
                  Pegawai {i + 1}: {r.nama || "Tanpa Nama"} — SPD No. {r.nomorSpd || i + 1}
                </option>
              ))}
            </select>
          </div>

          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
            {viewMode === "all" ? `Menampilkan ${rows.length} Lembar Rincian Biaya` : `Menampilkan 1 Lembar Pegawai`}
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
              {viewMode === "all" ? `Cetak Semua Rincian (${rows.length} Lembar)` : `Cetak Rincian Biaya Ini`}
            </span>
          </button>
        </div>
      </div>

      {isEditMode && (
        <div className="no-print p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 shrink-0 text-slate-700" />
            <span>
              <strong>Mode Edit Bebas Aktif:</strong> Seluruh teks pada Rincian Biaya SPD (No SPD, tanggal, tabel perincian pos biaya, nominal, terbilang, perhitungan rampung, dan tanda tangan) dapat langsung Anda klik dan edit secara bebas.
            </span>
          </div>
        </div>
      )}

      {/* Rincian Sheets Container */}
      <div className="space-y-8">
        {displayedRows.map((activeRow, index) => {
          const tanggalCetak = formatDateIndo(activeRow.tanggalMulai || header.tanggalSpd || new Date().toISOString());
          const hariUh100 = activeRow.hariUhBiasa !== undefined ? activeRow.hariUhBiasa : activeRow.lamaHari;
          const hariUh60 = activeRow.hariUhBiasa60 !== undefined ? activeRow.hariUhBiasa60 : activeRow.lamaHari;
          const hariHalfday = activeRow.hariUhHalfday !== undefined ? activeRow.hariUhHalfday : activeRow.lamaHari;
          const hariFullboard = activeRow.hariUhFullboard !== undefined ? activeRow.hariUhFullboard : activeRow.lamaHari;

          const uhRate =
            hariUh100 > 0
              ? Math.round(activeRow.biayaUhBiasa / hariUh100)
              : activeRow.biayaUhBiasa;

          // Build active line items for this participant
          interface LineItem {
            no: number;
            title: string;
            detail: string;
            amount: number;
            keterangan?: string;
          }

          const lineItems: LineItem[] = [];
          let itemNum = 1;

          if (activeUh.uhBiasa && activeRow.biayaUhBiasa > 0) {
            lineItems.push({
              no: itemNum++,
              title: "Uang Harian",
              detail: `${hariUh100}  hari @ Rp  ${uhRate.toLocaleString("id-ID")}`,
              amount: activeRow.biayaUhBiasa,
            });
          }

          if (activeUh.uhBiasa60 && activeRow.biayaUhBiasa60 > 0) {
            lineItems.push({
              no: itemNum++,
              title: "Uang Harian 60%",
              detail: `${hariUh60}  hari @ Rp  ${Math.round(uhRate * 0.6).toLocaleString("id-ID")}`,
              amount: activeRow.biayaUhBiasa60,
            });
          }

          if (activeUh.uhHalfday && activeRow.biayaUhHalfday > 0) {
            lineItems.push({
              no: itemNum++,
              title: "Uang Harian Halfday",
              detail: `${hariHalfday}  hari`,
              amount: activeRow.biayaUhHalfday,
            });
          }

          if (activeUh.uhFullboard && activeRow.biayaUhFullboard > 0) {
            lineItems.push({
              no: itemNum++,
              title: "Uang Harian Fullboard",
              detail: `${hariFullboard}  hari`,
              amount: activeRow.biayaUhFullboard,
            });
          }

          if (activeCols.transportasiDarat && activeRow.transportasiDarat > 0) {
            lineItems.push({
              no: itemNum++,
              title: "Transportasi Darat",
              detail: "",
              amount: activeRow.transportasiDarat,
            });
          }

          if (activeCols.transportasiLokal && activeRow.transportasiLokal > 0) {
            lineItems.push({
              no: itemNum++,
              title: "Transportasi Lokal",
              detail: "",
              amount: activeRow.transportasiLokal,
            });
          }

          if (activeCols.transportJakartaPp && (activeRow.transportJakartaPp || 0) > 0) {
            lineItems.push({
              no: itemNum++,
              title: "Transportasi Jakarta PP",
              detail: "",
              amount: activeRow.transportJakartaPp,
            });
          }

          if (activeCols.transportDaerahPp && (activeRow.transportDaerahPp || 0) > 0) {
            lineItems.push({
              no: itemNum++,
              title: "Transportasi Daerah PP",
              detail: "",
              amount: activeRow.transportDaerahPp,
            });
          }

          if (activeCols.dukunganTransportasi && (activeRow.dukunganTransportasi || 0) > 0) {
            lineItems.push({
              no: itemNum++,
              title: "Dukungan Transportasi",
              detail: "",
              amount: activeRow.dukunganTransportasi,
            });
          }

          if (activeCols.tiket && activeRow.tiket > 0) {
            lineItems.push({
              no: itemNum++,
              title: "Tiket Pesawat / Kereta",
              detail: "",
              amount: activeRow.tiket,
            });
          }

          if (activeCols.hotel && activeRow.hotel > 0) {
            lineItems.push({
              no: itemNum++,
              title: "Penginapan / Hotel",
              detail: `${activeRow.malamHotel || 1}  malam @ Rp  ${(activeRow.rateHotel || 0).toLocaleString("id-ID")}`,
              amount: activeRow.hotel,
            });
          }

          if (activeCols.fulldayMeeting && (activeRow.fulldayMeeting || 0) > 0) {
            lineItems.push({
              no: itemNum++,
              title: "Paket Fullday Meeting",
              detail: "",
              amount: activeRow.fulldayMeeting,
            });
          }

          if (activeCols.fullboardMeeting && (activeRow.fullboardMeeting || 0) > 0) {
            lineItems.push({
              no: itemNum++,
              title: "Paket Fullboard Meeting",
              detail: "",
              amount: activeRow.fullboardMeeting,
            });
          }

          if (activeCols.penginapan30 && activeRow.penginapan30 > 0) {
            lineItems.push({
              no: itemNum++,
              title: "Penginapan 30% SBM",
              detail: "30% Tarif SBM",
              amount: activeRow.penginapan30,
            });
          }

          if (activeCols.pengRill && activeRow.pengRill > 0) {
            lineItems.push({
              no: itemNum++,
              title: "Pengeluaran Riil",
              detail: "",
              amount: activeRow.pengRill,
            });
          }

          if (activeCols.representatif && activeRow.representatif > 0) {
            lineItems.push({
              no: itemNum++,
              title: "Representatif",
              detail: "",
              amount: activeRow.representatif,
            });
          }

          if (activeCols.belanjaBahan && activeRow.belanjaBahan > 0) {
            lineItems.push({
              no: itemNum++,
              title: "Belanja Bahan",
              detail: "",
              amount: activeRow.belanjaBahan,
            });
          }

          const calculatedTotal = lineItems.reduce((acc, it) => acc + it.amount, 0);

          return (
            <div
              key={activeRow.id || index}
              style={{ fontFamily: "Tahoma, 'Segoe UI', Geneva, Verdana, sans-serif" }}
              contentEditable={isEditMode}
              suppressContentEditableWarning={true}
              className={`rincian-sheet bg-white text-black p-8 md:p-12 rounded-2xl shadow-md border border-slate-200 mx-auto max-w-[860px] text-xs font-sans leading-normal space-y-6 transition-all ${
                isEditMode ? "ring-2 ring-slate-300 ring-offset-2" : ""
              }`}
            >
              {/* Kop Header */}
              <div className="text-center space-y-1">
                <h2 className="font-bold text-xs md:text-sm tracking-tight uppercase text-black">
                  KEMENTERIAN KOORDINATOR BIDANG PANGAN RI
                </h2>
                <p className="text-[11px] text-black">
                  Gedung Graha Mandiri Jln. Imam Bonjol no. 61 Jakarta Pusat
                </p>
                <h1 className="font-bold text-xs md:text-sm tracking-wide uppercase text-black pt-1">
                  RINCIAN BIAYA PERJALANAN DINAS
                </h1>
              </div>

              {/* Solid Line Separator */}
              <div className="border-b border-black"></div>

              {/* SPD Metadata */}
              <div className="space-y-1 text-xs">
                <div className="grid grid-cols-12 items-center">
                  <span className="col-span-3 text-black">Lampiran SPD Nomor</span>
                  <span className="col-span-1 text-center">:</span>
                  <div className="col-span-8 font-mono">
                    {activeRow.nomorSpd || "01"} &nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {header.nomorMak || "524111"}
                  </div>
                </div>
                <div className="grid grid-cols-12 items-center">
                  <span className="col-span-3 text-black">tanggal</span>
                  <span className="col-span-1 text-center">:</span>
                  <div className="col-span-8">
                    {tanggalCetak}
                  </div>
                </div>
              </div>

              {/* Table Rincian Biaya */}
              <div className="pt-2">
                <table className="w-full text-xs font-sans border-collapse">
                  <thead>
                    <tr className="border-t border-b border-black font-bold text-black">
                      <th className="py-2 text-left w-8">No.</th>
                      <th className="py-2 text-left">PERINCIAN BIAYA</th>
                      <th className="py-2 text-center w-48">JUMLAH</th>
                      <th className="py-2 text-center w-36">KETERANGAN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-0">
                    {lineItems.map((item) => (
                      <tr key={item.no} className="text-black">
                        <td className="py-1.5 align-top">{item.no}</td>
                        <td className="py-1.5 align-top">
                          <div className="flex justify-between pr-8">
                            <span>{item.title}</span>
                            {item.detail && <span>{item.detail}</span>}
                          </div>
                        </td>
                        <td className="py-1.5 align-top font-mono">
                          <div className="flex justify-between px-2">
                            <span>Rp</span>
                            <span>{item.amount.toLocaleString("id-ID")}</span>
                          </div>
                        </td>
                        <td className="py-1.5 align-top text-center">{item.keterangan || ""}</td>
                      </tr>
                    ))}

                    {/* Row Jumlah */}
                    <tr className="font-bold text-black">
                      <td></td>
                      <td className="py-1.5 text-left font-bold">Jumlah :</td>
                      <td className="py-1.5 font-mono font-bold">
                        <div className="flex justify-between px-2">
                          <span>Rp</span>
                          <span>{calculatedTotal.toLocaleString("id-ID")}</span>
                        </div>
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>

                {/* Shaded Terbilang Bar */}
                <div className="w-full bg-[#bfbfbf] py-1 px-2 mt-1 text-black text-xs font-sans flex items-center justify-between">
                  <span className="font-bold whitespace-nowrap mr-4">terbilang :</span>
                  <span className="font-bold italic text-right flex-1">
                    {terbilang(calculatedTotal).toLowerCase()}
                  </span>
                </div>
              </div>

              {/* Signatures 1: Bendahara & Yang Menerima */}
              <div className="pt-6 pb-2">
                <div className="grid grid-cols-2 text-left gap-8 text-xs font-sans">
                  {/* Left: Bendahara */}
                  <div className="space-y-16">
                    <div className="space-y-0.5">
                      <p>Telah dibayar sejumlah</p>
                      <p className="font-mono">{calculatedTotal.toLocaleString("id-ID")}</p>
                      <p className="pt-3">Bendahara Pengeluaran</p>
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

                  {/* Right: Yang Menerima */}
                  <div className="space-y-16 pl-6">
                    <div className="space-y-0.5">
                      <p>Jakarta, {tanggalCetak}</p>
                      <p>Telah menerima jumlah uang sebesar</p>
                      <div className="flex justify-between max-w-[200px] font-mono">
                        <span>Rp</span>
                        <span>{calculatedTotal.toLocaleString("id-ID")}</span>
                      </div>
                      <p className="pt-1">Yang Menerima,</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-normal">{activeRow.nama || "—"}</p>
                      <p className="font-mono text-[11px]">NIP. &nbsp;&nbsp;{activeRow.nip || "—"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: PERHITUNGAN SPD RAMPUNG */}
              <div className="pt-4 space-y-4">
                <div className="text-center">
                  <h3 className="font-bold text-xs uppercase tracking-wide text-black">
                    PERHITUNGAN SPD RAMPUNG
                  </h3>
                </div>

                <div className="grid grid-cols-2 text-left gap-8 text-xs font-sans pt-1">
                  {/* Left: Breakdown Calculation */}
                  <div className="space-y-1 text-xs">
                    <div className="grid grid-cols-12">
                      <span className="col-span-6">Ditetapkan sejumlah</span>
                      <span className="col-span-1 text-center">:</span>
                      <div className="col-span-5 flex justify-between font-mono">
                        <span>Rp</span>
                        <span>{calculatedTotal.toLocaleString("id-ID")}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-12">
                      <span className="col-span-6">Yang telah dibayar semula</span>
                      <span className="col-span-1 text-center">:</span>
                      <div className="col-span-5 flex justify-between font-mono">
                        <span>Rp</span>
                        <span>{calculatedTotal.toLocaleString("id-ID")}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-12">
                      <span className="col-span-6">Sisa kurang / lebih</span>
                      <span className="col-span-1 text-center">:</span>
                      <div className="col-span-5 flex justify-between font-mono">
                        <span>Rp</span>
                        <span className="font-sans">Nihil</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: PPK Signature */}
                  <div className="space-y-16 pl-6">
                    <div>
                      <p>Pejabat Pembuat Komitmen</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-normal">{header.ppkNama || "Arif Wibowo, S.H., M.H."}</p>
                      <p className="font-mono text-[11px]">NIP. &nbsp;&nbsp;&nbsp;{header.ppkNip || "19830124200801 1 006"}</p>
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
