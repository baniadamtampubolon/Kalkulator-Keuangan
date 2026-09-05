"use client";

import React, { useState } from "react";
import { HeaderData, ParticipantRow, ActiveCostKey } from "@/lib/types";
import { Printer, Edit3, RotateCcw } from "lucide-react";

interface BiayaRiilDocProps {
  header: HeaderData;
  setHeader?: React.Dispatch<React.SetStateAction<HeaderData>>;
  rows: ParticipantRow[];
  setRows?: React.Dispatch<React.SetStateAction<ParticipantRow[]>>;
  activeCols?: Record<ActiveCostKey, boolean>;
}

export const BiayaRiilDoc: React.FC<BiayaRiilDocProps> = ({
  header,
  rows,
  activeCols = {
    tiket: false,
    dukunganTransportasi: false,
    transportasiDarat: true,
    transportasiLokal: false,
    transportJakartaPp: false,
    transportDaerahPp: false,
    pengRill: false,
    hotel: false,
    penginapan30: false,
    fulldayMeeting: false,
    fullboardMeeting: false,
    representatif: false,
    belanjaBahan: false,
  },
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
              margin: 20mm 20mm 20mm 20mm !important;
            }
            body {
              background: #ffffff !important;
            }
            .riil-sheet {
              page-break-after: always !important;
              break-after: page !important;
              width: 100% !important;
              max-width: none !important;
              padding: 0 !important;
              margin: 0 !important;
              box-shadow: none !important;
              border: none !important;
            }
            .riil-sheet:last-child {
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
            <span className="text-xs font-semibold text-slate-700">Tampilan Daftar Riil:</span>
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
            {viewMode === "all" ? `Menampilkan ${rows.length} Lembar Daftar Riil` : `Menampilkan 1 Lembar Pegawai`}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Universal Edit on Canvas Toggle */}
          <button
            type="button"
            onClick={() => setIsEditMode(!isEditMode)}
            className={`btn-tactile flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              isEditMode
                ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                : "bg-white/80 hover:bg-white text-slate-700 border-slate-300"
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
            className="btn-tactile flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>
              {viewMode === "all" ? `Cetak Semua Daftar Riil (${rows.length} Lembar)` : `Cetak Daftar Riil Ini`}
            </span>
          </button>
        </div>
      </div>

      {isEditMode && (
        <div className="no-print p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              <strong>Mode Edit Bebas Aktif:</strong> Seluruh teks pada Pengeluaran Riil (identitas, kutipan narasi SPD/ST, tabel uraian riil, angka, klausul pernyataan, hingga tanda tangan) dapat langsung Anda klik dan edit secara bebas.
            </span>
          </div>
        </div>
      )}

      {/* Biaya Riil Sheets Container */}
      <div className="space-y-8">
        {displayedRows.map((activeRow, index) => {
          const tanggalCetak = formatDateIndo(activeRow.tanggalMulai || header.tanggalSpd || new Date().toISOString());

          // Build riil items dynamically and strictly synchronized with active inputs
          interface RiilLine {
            id: string;
            uraian: string;
            amount: number;
          }

          const items: RiilLine[] = [];
          let itemCounter = 1;

          // 1. Transportasi Darat PP
          if (activeCols.transportasiDarat && (activeRow.transportasiDarat || 0) > 0) {
            items.push({
              id: String(itemCounter++),
              uraian: "Transportasi Darat PP",
              amount: activeRow.transportasiDarat,
            });
          }

          // 2. Transportasi Lokal di Daerah Tujuan
          if (activeCols.transportasiLokal && (activeRow.transportasiLokal || 0) > 0) {
            items.push({
              id: String(itemCounter++),
              uraian: "Transportasi Lokal Daerah Tujuan",
              amount: activeRow.transportasiLokal,
            });
          }

          // 3. Transportasi Jakarta PP
          if (activeCols.transportJakartaPp && (activeRow.transportJakartaPp || 0) > 0) {
            items.push({
              id: String(itemCounter++),
              uraian: "Transportasi Jakarta PP",
              amount: activeRow.transportJakartaPp,
            });
          }

          // 4. Transportasi Daerah PP
          if (activeCols.transportDaerahPp && (activeRow.transportDaerahPp || 0) > 0) {
            items.push({
              id: String(itemCounter++),
              uraian: "Transportasi Daerah PP",
              amount: activeRow.transportDaerahPp,
            });
          }

          // 3. Pengeluaran Riil (from Modal Riil / Itemized)
          if (activeCols.pengRill && (activeRow.pengRill || 0) > 0) {
            if (Array.isArray(activeRow.riilItems) && activeRow.riilItems.length > 0) {
              activeRow.riilItems.forEach((rit) => {
                if (Number(rit.amount) > 0) {
                  items.push({
                    id: String(itemCounter++),
                    uraian: rit.uraian || "Pengeluaran Riil Lainnya",
                    amount: Number(rit.amount),
                  });
                }
              });
            } else {
              items.push({
                id: String(itemCounter++),
                uraian: "Pengeluaran Riil Lainnya",
                amount: activeRow.pengRill,
              });
            }
          }

          // Fallback if no riil cost is active
          if (items.length === 0) {
            items.push({
              id: "1",
              uraian: "Transportasi Darat PP / Pengeluaran Riil",
              amount: activeRow.transportasiDarat || 0,
            });
          }

          const totalRiil = items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);

          return (
            <div
              key={activeRow.id || index}
              style={{ fontFamily: "Tahoma, 'Segoe UI', Geneva, Verdana, sans-serif" }}
              contentEditable={isEditMode}
              suppressContentEditableWarning={true}
              className={`riil-sheet bg-white text-black p-8 md:p-12 rounded-2xl shadow-md border border-slate-200 mx-auto max-w-[860px] text-xs font-sans leading-relaxed space-y-6 transition-all ${
                isEditMode ? "ring-2 ring-blue-400/40 ring-offset-2" : ""
              }`}
            >
              {/* Header Kop */}
              <div className="text-center space-y-1">
                <h2 className="font-bold text-xs md:text-sm tracking-tight uppercase text-black">
                  KEMENTERIAN KOORDINATOR BIDANG PANGAN RI
                </h2>
                <p className="text-[11px] text-black">
                  Gedung Graha Mandiri Jln. Imam Bonjol no. 61 Jakarta Pusat
                </p>
              </div>

              {/* Title */}
              <div className="text-center pt-2">
                <h1 className="text-xs md:text-sm font-bold tracking-wider uppercase underline text-black">
                  DAFTAR PENGELUARAN RIIL
                </h1>
              </div>

              {/* Identitas Yang Bertanda Tangan */}
              <div className="space-y-1 text-xs">
                <p className="text-black">Yang bertanda tangan di bawah ini :</p>
                <div className="pl-4 space-y-0.5 pt-0.5">
                  <div className="grid grid-cols-12 items-center">
                    <span className="col-span-2">Nama</span>
                    <span className="col-span-1 text-center">:</span>
                    <div className="col-span-9 font-semibold">
                      {activeRow.nama || "—"}
                    </div>
                  </div>
                  <div className="grid grid-cols-12 items-center">
                    <span className="col-span-2">NIP</span>
                    <span className="col-span-1 text-center">:</span>
                    <div className="col-span-9 font-mono">
                      {activeRow.nip || "—"}
                    </div>
                  </div>
                  <div className="grid grid-cols-12 items-center">
                    <span className="col-span-2">Jabatan</span>
                    <span className="col-span-1 text-center">:</span>
                    <div className="col-span-9">
                      {activeRow.jabatan || "Pelaksana"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Body Pernyataan */}
              <div className="space-y-3 text-justify text-xs leading-relaxed text-black">
                <p className="leading-relaxed">
                  Berdasarkan Surat Perintah Perjalanan Dinas (SPD) Nomor &nbsp;&nbsp;
                  <span className="font-mono font-semibold">{activeRow.nomorSpd || "01"}</span>
                  &nbsp;&nbsp; / &nbsp;&nbsp;
                  <span className="font-mono font-semibold">
                    {activeRow.nomorSt ||
                      (activeRow.isPejabat && header.nomorStPejabat
                        ? header.nomorStPejabat
                        : header.nomorStStaff || header.nomorStMaster || "ST-04/INS/KP.01/01/2026")}
                  </span>
                  &nbsp;&nbsp; tanggal &nbsp;&nbsp;
                  <span>{tanggalCetak}</span>, dengan ini kami menyatakan dengan sesungguhnya bahwa:
                </p>

                <p>
                  1. Biaya Transpor Pegawai dan/atau biaya penginapan di bawah ini yang tidak dapat diperoleh bukti-bukti pengeluarannya, meliputi :
                </p>

                {/* Table Daftar Riil */}
                <div className="pt-1 pb-1">
                  <table className="w-full border border-black text-xs font-sans border-collapse">
                    <thead>
                      <tr className="border-b border-black font-bold text-center bg-gray-50">
                        <th className="border border-black p-2 w-10">No</th>
                        <th className="border border-black p-2 text-left">Uraian</th>
                        <th className="border border-black p-2 text-right w-48">Jumlah</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => (
                        <tr key={item.id || idx} className="border-b border-black">
                          <td className="border border-black p-2 text-center">{idx + 1}</td>
                          <td className="border border-black p-2">{item.uraian}</td>
                          <td className="border border-black p-2 text-right font-mono">
                            <div className="flex justify-between px-2">
                              <span>Rp</span>
                              <span>{item.amount.toLocaleString("id-ID")}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="font-bold border-t border-black bg-gray-50">
                        <td colSpan={2} className="border border-black p-2 text-center uppercase tracking-wide">
                          Jumlah
                        </td>
                        <td className="border border-black p-2 text-right font-mono font-bold">
                          <div className="flex justify-between px-2">
                            <span>Rp</span>
                            <span>{totalRiil.toLocaleString("id-ID")}</span>
                          </div>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <p>
                  2. Jumlah uang tersebut pada angka 1 di atas benar-benar dikeluarkan untuk pelaksanaan perjalanan dinas dimaksud dan apabila di kemudian hari terdapat kelebihan atas pembayaran, kami bersedia untuk menyetorkan kelebihan tersebut ke kas negara.
                </p>

                <p>
                  Demikian pernyataan ini kami buat dengan sebenarnya, untuk dipergunakan sebagaimana mestinya.
                </p>
              </div>

              {/* Signatures Section: PPK (Kiri) & Pelaksana SPD (Kanan) */}
              <div className="pt-8 pb-4">
                <div className="grid grid-cols-2 text-left gap-8 text-xs font-sans">
                  {/* Left: PPK */}
                  <div className="space-y-16">
                    <div className="space-y-0.5">
                      <p>Mengetahui/Menyetujui</p>
                      <p className="font-semibold">Pejabat Pembuat Komitmen</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-normal">{header.ppkNama || "Arif Wibowo, S.H., M.H."}</p>
                      <p className="font-mono text-[11px]">NIP. &nbsp;&nbsp;&nbsp;{header.ppkNip || "19830124200801 1 006"}</p>
                    </div>
                  </div>

                  {/* Right: Pelaksana SPD */}
                  <div className="space-y-16 pl-6">
                    <div className="space-y-0.5">
                      <p>Jakarta, {tanggalCetak}</p>
                      <p className="font-semibold">Pelaksana SPD</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-normal">{activeRow.nama || "—"}</p>
                      <p className="font-mono text-[11px]">NIP. &nbsp;&nbsp;{activeRow.nip || "—"}</p>
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
