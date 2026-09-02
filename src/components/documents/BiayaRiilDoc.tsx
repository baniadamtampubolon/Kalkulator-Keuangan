"use client";

import React, { useState } from "react";
import { HeaderData, ParticipantRow, ActiveCostKey } from "@/lib/types";
import { formatRupiah, terbilang } from "@/lib/terbilang";
import { Printer } from "lucide-react";

interface BiayaRiilDocProps {
  header: HeaderData;
  rows: ParticipantRow[];
  activeCols: Record<ActiveCostKey, boolean>;
}

export const BiayaRiilDoc: React.FC<BiayaRiilDocProps> = ({ header, rows, activeCols }) => {
  // Mode: "all" for bulk view/print, or a specific index
  const [viewMode, setViewMode] = useState<"all" | number>("all");

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

  return (
    <div className="space-y-6">
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
              uraian: "Transportasi Darat / Pengeluaran Riil",
              amount: 0,
            });
          }

          const totalRiil = items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);

          return (
            <div
              key={activeRow.id || index}
              style={{ fontFamily: "Tahoma, 'Segoe UI', Geneva, Verdana, sans-serif" }}
              className="riil-sheet bg-white text-black p-8 md:p-12 rounded-2xl shadow-md border border-slate-200 mx-auto max-w-[860px] text-xs font-sans leading-relaxed space-y-6"
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
                  <div className="grid grid-cols-12">
                    <span className="col-span-2">Nama</span>
                    <span className="col-span-1 text-center">:</span>
                    <span className="col-span-9 font-semibold">{activeRow.nama || "—"}</span>
                  </div>
                  <div className="grid grid-cols-12">
                    <span className="col-span-2">NIP</span>
                    <span className="col-span-1 text-center">:</span>
                    <span className="col-span-9 font-mono">{activeRow.nip || "—"}</span>
                  </div>
                  <div className="grid grid-cols-12">
                    <span className="col-span-2">Jabatan</span>
                    <span className="col-span-1 text-center">:</span>
                    <span className="col-span-9">{activeRow.jabatan || "Pelaksana"}</span>
                  </div>
                </div>
              </div>

              {/* Body Pernyataan */}
              <div className="space-y-3 text-justify text-xs leading-relaxed text-black">
                <p>
                  Berdasarkan Surat Perintah Perjalanan Dinas (SPD) Nomor &nbsp;&nbsp;
                  <span className="font-mono font-semibold">{activeRow.nomorSpd || "454"}</span> &nbsp;&nbsp; / &nbsp;&nbsp;
                  <span className="font-mono font-semibold">{header.nomorMak || "524111"}</span> &nbsp;&nbsp; tanggal &nbsp;&nbsp;
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
                      <p className="font-normal">{header.ppkNama || "Kunto Nugroho"}</p>
                      <p className="font-mono text-[11px]">NIP. &nbsp;&nbsp;&nbsp;{header.ppkNip || "198912142018011001"}</p>
                    </div>
                  </div>

                  {/* Right: Pelaksana SPD */}
                  <div className="space-y-16 pl-6">
                    <div className="space-y-0.5">
                      <p>Jakarta, {tanggalCetak}</p>
                      <p className="font-semibold">Pelaksana SPD</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-normal">{activeRow.nama || "Reni Sutaryo, S.Si., M.Adm.Pemb"}</p>
                      <p className="font-mono text-[11px]">NIP. &nbsp;&nbsp;{activeRow.nip || "19791126200604 2 014"}</p>
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
