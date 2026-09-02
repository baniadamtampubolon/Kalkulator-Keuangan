"use client";

import React, { useState } from "react";
import { HeaderData, ParticipantRow, ActiveCostKey, ActiveUhKey } from "@/lib/types";
import { terbilang, formatRupiah } from "@/lib/terbilang";
import { Printer, Users, Eye } from "lucide-react";

interface KwitansiDocProps {
  header: HeaderData;
  rows: ParticipantRow[];
  activeCols: Record<ActiveCostKey, boolean>;
  activeUh: Record<ActiveUhKey, boolean>;
}

export const KwitansiDoc: React.FC<KwitansiDocProps> = ({
  header,
  rows,
}) => {
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

  const kotaTujuanText = (header.kotaTujuanList || []).filter(Boolean).join(", ") || header.provinsiTujuan;
  const tahunAnggaran = header.tanggalSpd ? new Date(header.tanggalSpd).getFullYear() : new Date().getFullYear();

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
          }
        `,
        }}
      />

      {/* Navigation Toolbar */}
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

        <button
          onClick={() => window.print()}
          className="btn-tactile flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>
            {viewMode === "all" ? `Cetak Semua Kuitansi (${rows.length} Lembar)` : `Cetak Kuitansi Ini`}
          </span>
        </button>
      </div>

      {/* Kwitansi Sheets Container (Render all sequentially) */}
      <div className="space-y-8">
        {displayedRows.map((activeRow, index) => {
          const tanggalCetak = formatDateIndo(activeRow.tanggalMulai || header.tanggalSpd || new Date().toISOString());
          const uraianPembayaran = header.keteranganKegiatan.toLowerCase().includes("tanggal")
            ? header.keteranganKegiatan
            : `${header.keteranganKegiatan}, pada Tanggal ${formatDateIndo(activeRow.tanggalMulai)} di ${activeRow.tujuanKota || kotaTujuanText}, ${header.provinsiTujuan}`;

          return (
            <div
              key={activeRow.id || index}
              style={{ fontFamily: "Tahoma, 'Segoe UI', Geneva, Verdana, sans-serif" }}
              className="kwitansi-sheet bg-white text-black p-10 md:p-14 rounded-2xl shadow-md border border-slate-200 mx-auto max-w-[860px] text-xs leading-relaxed space-y-12"
            >
              {/* Top Header: Instansi Name on Left + Box Table on Right */}
              <div className="flex justify-between items-start pt-2">
                {/* Left: Instansi Header */}
                <div className="w-1/2 pt-4">
                  <h2 className="font-bold text-xs md:text-sm tracking-tight text-black uppercase">
                    KEMENTERIAN KOORDINATOR BIDANG PANGAN
                  </h2>
                </div>

                {/* Right: Box Metadata Table */}
                <div className="w-56 border border-black p-2 text-[11px] leading-tight space-y-1">
                  <div className="grid grid-cols-12">
                    <span className="col-span-5">Sub Keg</span>
                    <span className="col-span-1">:</span>
                    <span className="col-span-6 font-mono font-medium">{header.nomorKomp || ""}</span>
                  </div>
                  <div className="grid grid-cols-12">
                    <span className="col-span-5">Akun</span>
                    <span className="col-span-1">:</span>
                    <span className="col-span-6 font-mono font-medium">{header.nomorMak || "524111"}</span>
                  </div>
                  <div className="grid grid-cols-12">
                    <span className="col-span-5">Tanggal</span>
                    <span className="col-span-1">:</span>
                    <span className="col-span-6 text-right whitespace-nowrap">{tanggalCetak}</span>
                  </div>
                  <div className="grid grid-cols-12">
                    <span className="col-span-5">APBN T.A</span>
                    <span className="col-span-1">:</span>
                    <span className="col-span-6 text-right font-mono">{tahunAnggaran}</span>
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
                <div className="grid grid-cols-12 gap-1 pt-1">
                  <span className="col-span-3 text-black">Uang sebesar</span>
                  <span className="col-span-1 text-center">:</span>
                  <span className="col-span-8 font-mono">
                    Rp{activeRow.totalJumlah.toLocaleString("id-ID")}
                  </span>
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
                  <span className="col-span-8 text-justify leading-relaxed text-black">
                    {uraianPembayaran}
                  </span>
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
                      <p className="font-normal">{header.ppkNama || "Kunto Nugroho"}</p>
                      <p className="font-mono text-[11px]">NIP. {header.ppkNip || "198912142018011001"}</p>
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
                      <p className="font-normal">{activeRow.nama || "Reni Sutaryo, S.Si., M.Adm.Pemb"}</p>
                      <p className="font-mono text-[11px]">NIP. {activeRow.nip || "19791126200604 2 014"}</p>
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
