"use client";

import React, { useState } from "react";
import { HeaderData, ParticipantRow } from "@/lib/types";
import { Printer, Edit3, RotateCcw } from "lucide-react";

interface MemorandumDocProps {
  header: HeaderData;
  setHeader?: React.Dispatch<React.SetStateAction<HeaderData>>;
  rows: ParticipantRow[];
  setRows?: React.Dispatch<React.SetStateAction<ParticipantRow[]>>;
}

export const MemorandumDoc: React.FC<MemorandumDocProps> = ({
  header,
  rows,
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [renderKey, setRenderKey] = useState(0);

  // Format dates
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

  const grandTotal = rows.reduce((acc, r) => acc + (r.totalJumlah || 0), 0);
  const tanggalMemo = formatDateIndo(header.tanggalMemo || new Date().toISOString());
  const kotaTujuanText = (header.kotaTujuanList || []).filter(Boolean).join(", ") || header.provinsiTujuan;
  const tahunAnggaran = header.tanggalSpd ? new Date(header.tanggalSpd).getFullYear() : new Date().getFullYear();

  const perihalText = header.keteranganMemo || header.keteranganKegiatan || "Permohonan Dana Perjalanan Dinas";

  const handleResetCanvas = () => {
    setRenderKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6" key={renderKey}>
      {/* Scoped Print Portrait Style for 2-Page Memo */}
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
            .print-page-memo {
              width: 100% !important;
              max-width: none !important;
              padding: 0 !important;
              margin: 0 !important;
              box-shadow: none !important;
              border: none !important;
            }
            .memo-page-1 {
              page-break-after: always !important;
              break-after: page !important;
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

      {/* Action Toolbar with Edit on Canvas */}
      <div className="no-print glass-floating rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Dokumen 2: Memorandum Dinas & Lampiran Anggaran (2 Halaman)
          </h3>
          <p className="text-xs text-slate-500">
            Halaman 1 Nota Pengajuan Dana, Halaman 2 Rincian POK / MAK dengan 4 Kolom Tanda Tangan
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Edit on Canvas Toggle */}
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
            className="btn-tactile flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Memorandum (2 Hal)</span>
          </button>
        </div>
      </div>

      {isEditMode && (
        <div className="no-print p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              <strong>Mode Edit Bebas Aktif:</strong> Seluruh teks pada Memorandum (kop instansi, nomor surat, perihal, narasi alinea, rincian MAK, hingga 4 kolom tanda tangan) dapat langsung Anda klik dan edit secara bebas.
            </span>
          </div>
        </div>
      )}

      {/* Outer Wrapper for Multi-Page Sheet */}
      <div className="space-y-8">
        {/* ========================================================================= */}
        {/* HALAMAN 1: MEMORANDUM DINAS                                               */}
        {/* ========================================================================= */}
        <div
          style={{ fontFamily: "Tahoma, 'Segoe UI', Geneva, Verdana, sans-serif" }}
          contentEditable={isEditMode}
          suppressContentEditableWarning={true}
          className={`print-page print-page-memo memo-page-1 bg-white text-black p-8 md:p-12 rounded-2xl shadow-md border border-slate-200 mx-auto max-w-[860px] text-xs leading-relaxed space-y-5 transition-all ${
            isEditMode ? "ring-2 ring-blue-400/40 ring-offset-2" : ""
          }`}
        >
          {/* Header Kop Garuda & Instansi */}
          <div className="flex items-center gap-4 border-b-2 border-black pb-3">
            {/* Official Garuda / Kemenko Pangan Logo */}
            <div className="w-20 h-20 shrink-0 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-kemenkopangan.png"
                alt="Logo Kementerian Koordinator Bidang Pangan"
                className="w-20 h-20 object-contain"
              />
            </div>

            {/* Instansi Text */}
            <div className="flex-1 text-center space-y-0.5">
              <h1 className="font-bold text-xs md:text-sm tracking-wide text-black uppercase">
                KEMENTERIAN KOORDINATOR BIDANG PANGAN
              </h1>
              <h2 className="font-bold text-xs md:text-sm tracking-wide text-black uppercase">
                REPUBLIK INDONESIA
              </h2>
              <p className="text-[11px] text-black pt-1">
                Graha Mandiri, Jl. Imam Bonjol No. 61, Jakarta Pusat 10310
              </p>
              <p className="text-[11px] text-black">
                Email: kemenkopangan@kemenkopangan.go.id
              </p>
            </div>
          </div>

          {/* Title: MEMORANDUM */}
          <div className="text-center pt-2 space-y-0.5">
            <h2 className="font-bold text-xs md:text-sm tracking-widest uppercase text-black">
              MEMORANDUM
            </h2>
            <p className="text-xs font-semibold font-sans">
              Nomor : &nbsp;&nbsp;{header.nomorMemo || "M.xxx/INS/PPK/VIII/2026"}
            </p>
          </div>

          {/* Metadata Table / Note Header */}
          <div className="border-b border-black pb-3 space-y-1 text-xs">
            <div className="grid grid-cols-12 gap-1">
              <span className="col-span-2">Yth</span>
              <span className="col-span-1 text-center">:</span>
              <span className="col-span-9">Kuasa Pengguna Anggaran</span>
            </div>
            <div className="grid grid-cols-12 gap-1">
              <span className="col-span-2">Dari</span>
              <span className="col-span-1 text-center">:</span>
              <span className="col-span-9">Pejabat Pembuat Komitmen Inspektorat</span>
            </div>
            <div className="grid grid-cols-12 gap-1 items-start">
              <span className="col-span-2">Hal</span>
              <span className="col-span-1 text-center">:</span>
              <span className="col-span-9 text-justify">{perihalText}</span>
            </div>
            <div className="grid grid-cols-12 gap-1">
              <span className="col-span-2">Lampiran</span>
              <span className="col-span-1 text-center">:</span>
              <div className="col-span-9 space-y-0.5">
                <p>1. Surat Tugas</p>
                <p>2. Daftar Nominatif</p>
              </div>
            </div>
            <div className="grid grid-cols-12 gap-1 pt-0.5 items-center">
              <span className="col-span-2">Tanggal</span>
              <span className="col-span-1 text-center">:</span>
              <span className="col-span-9">{tanggalMemo}</span>
            </div>
          </div>

          {/* Body Narrative */}
          <div className="space-y-4 text-justify text-xs md:text-[12px] leading-relaxed pt-2">
            <p>
              Sehubungan dengan {header.keteranganKegiatan || "kegiatan perjalanan dinas"} pada Tanggal {formatDateIndo(rows[0]?.tanggalMulai || header.tanggalSpd)} di {kotaTujuanText}, {header.provinsiTujuan} dengan ini kami mengajukan permohonan dana sebesar{" "}
              <strong>Rp{grandTotal.toLocaleString("id-ID")}</strong> yang dibebankan pada APBN satuan kerja Kementerian Koordinator Bidang Pangan tahun anggaran {tahunAnggaran} dengan MAK.CL.7459.ABR.006.071.CC.{header.nomorMak || "524111"}
            </p>

            <p>
              Atas perhatian dan kerjasamanya, kami ucapkan terima kasih.
            </p>
          </div>

          {/* Signature Section Page 1 (PPK Kanan) */}
          <div className="pt-16 pb-4 flex justify-end">
            <div className="w-64 space-y-16 text-left text-xs">
              <div>
                <p>Pejabat Pembuat Komitmen</p>
                <p>Inspektorat</p>
              </div>
              <div className="space-y-0.5">
                <p className="font-bold">{header.ppkNama || "Arif Wibowo, S.H., M.H."}</p>
                <p className="font-mono text-[11px]">NIP. {header.ppkNip || "19830124200801 1 006"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* HALAMAN 2: LAMPIRAN SURAT (PEMBEBANAN ANGGARAN & 4 TTD)                   */}
        {/* ========================================================================= */}
        <div
          style={{ fontFamily: "Tahoma, 'Segoe UI', Geneva, Verdana, sans-serif" }}
          contentEditable={isEditMode}
          suppressContentEditableWarning={true}
          className={`print-page print-page-memo bg-white text-black p-8 md:p-12 rounded-2xl shadow-md border border-slate-200 mx-auto max-w-[860px] text-xs leading-relaxed space-y-6 transition-all ${
            isEditMode ? "ring-2 ring-blue-400/40 ring-offset-2" : ""
          }`}
        >
          {/* Header Lampiran Surat */}
          <div className="space-y-1 pt-2">
            <h2 className="font-bold text-xs md:text-sm tracking-wide uppercase text-black">
              LAMPIRAN SURAT
            </h2>
            <div className="space-y-0.5 text-xs">
              <div className="grid grid-cols-12 max-w-md">
                <span className="col-span-3">Nomor</span>
                <span className="col-span-1 text-center">:</span>
                <span className="col-span-8">{header.nomorMemo || "M.xxx/INS/PPK/VIII/2026"}</span>
              </div>
              <div className="grid grid-cols-12 max-w-md">
                <span className="col-span-3">Tanggal</span>
                <span className="col-span-1 text-center">:</span>
                <span className="col-span-8">{tanggalMemo}</span>
              </div>
            </div>
          </div>

          {/* Judul Bagian Pembebanan Anggaran */}
          <div className="pt-2">
            <p className="font-bold text-black uppercase">
              PEMBEBANAN ANGGARAN
            </p>
          </div>

          {/* Tabel POK / MAK Pembebanan Anggaran */}
          <div className="pt-1">
            <table className="w-full border border-black text-xs font-sans border-collapse">
              <thead>
                <tr className="border-b border-black font-bold text-center bg-gray-50 text-black">
                  <th className="border border-black p-2 w-10">No</th>
                  <th className="border border-black p-2 text-left">Kode MAK / POK</th>
                  <th className="border border-black p-2 text-left">Uraian Akun Kegiatan</th>
                  <th className="border border-black p-2 text-right w-44">Jumlah (Rp)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-black">
                  <td className="border border-black p-2 text-center align-top">1</td>
                  <td className="border border-black p-2 font-mono align-top">
                    7459.ABR.006.071.CC.{header.nomorMak || "524111"}
                  </td>
                  <td className="border border-black p-2 align-top">
                    <p className="font-semibold">{header.keteranganKegiatan || "Perjalanan Dinas Jabatan"}</p>
                    <p className="text-[11px] text-gray-700 pt-0.5">
                      Tujuan: {kotaTujuanText}, {header.provinsiTujuan} ({rows.length} Orang)
                    </p>
                  </td>
                  <td className="border border-black p-2 text-right font-mono font-bold align-top">
                    <div className="flex justify-between px-2">
                      <span>Rp</span>
                      <span>{grandTotal.toLocaleString("id-ID")}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="font-bold border-t border-black bg-gray-50 text-black">
                  <td colSpan={3} className="border border-black p-2 text-center uppercase tracking-wider">
                    Total Anggaran
                  </td>
                  <td className="border border-black p-2 text-right font-mono font-bold">
                    <div className="flex justify-between px-2">
                      <span>Rp</span>
                      <span>{grandTotal.toLocaleString("id-ID")}</span>
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Grid 4 Kolom Tanda Tangan */}
          <div className="pt-12 pb-4">
            <div className="grid grid-cols-2 gap-x-12 gap-y-16 text-left text-xs font-sans">
              {/* 1. Kiri Atas: PIC / Inisiator Kegiatan */}
              <div className="space-y-16">
                <div>
                  <p>Inisiator Kegiatan,</p>
                </div>
                <div className="space-y-0.5">
                  <p className="font-semibold underline">{header.picInisiator || "Arif Wibowo, S.H., M.H."}</p>
                  <p className="font-mono text-[11px]">NIP. 19830124200801 1 006</p>
                </div>
              </div>

              {/* 2. Kanan Atas: Petugas Verifikasi */}
              <div className="space-y-16 pl-6">
                <div>
                  <p>Petugas Verifikasi,</p>
                </div>
                <div className="space-y-0.5">
                  <p className="font-semibold underline">
                    {header.petugasVerifikasi.split(",")[0] || "Nidya Hediyanti"}
                  </p>
                  <p className="font-mono text-[11px]">
                    {header.petugasVerifikasi.includes("NIP")
                      ? header.petugasVerifikasi.substring(header.petugasVerifikasi.indexOf("NIP"))
                      : "NIP. 19920603 202521 2 034"}
                  </p>
                </div>
              </div>

              {/* 3. Kiri Bawah: Bendahara Pengeluaran */}
              <div className="space-y-16">
                <div>
                  <p>Bendahara Pengeluaran,</p>
                </div>
                <div className="space-y-0.5">
                  <p className="font-semibold underline">
                    {header.bendahara.split(",")[0] || "Raka Panji Wibowo, S.Kom"}
                  </p>
                  <p className="font-mono text-[11px]">
                    {header.bendahara.includes("NIP")
                      ? header.bendahara.substring(header.bendahara.indexOf("NIP"))
                      : "NIP. 19950408202012 1 001"}
                  </p>
                </div>
              </div>

              {/* 4. Kanan Bawah: Pejabat Pembuat Komitmen (PPK) */}
              <div className="space-y-16 pl-6">
                <div>
                  <p>Pejabat Pembuat Komitmen,</p>
                </div>
                <div className="space-y-0.5">
                  <p className="font-semibold underline">{header.ppkNama || "Arif Wibowo, S.H., M.H."}</p>
                  <p className="font-mono text-[11px]">NIP. {header.ppkNip || "19830124200801 1 006"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
