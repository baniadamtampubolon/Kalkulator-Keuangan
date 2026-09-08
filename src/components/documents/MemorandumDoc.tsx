"use client";

import React, { useState } from "react";
import { HeaderData, ParticipantRow } from "@/lib/types";
import { Printer, Edit3, RotateCcw } from "lucide-react";
import { parseMakHierarchy } from "@/data/mak_akun";
import { terbilang } from "@/lib/terbilang";

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

  const fullMakCode = (() => {
    const komp = (header.nomorKomp || "CL.7458.ABR.006.051.0A").trim();
    const mak = (header.nomorMak || "524111").trim();
    if (komp && mak) {
      if (komp.endsWith(mak)) return komp;
      return `${komp}.${mak}`;
    }
    return komp || mak || "CL.7458.ABR.006.051.0A.524111";
  })();

  const hierarchy = parseMakHierarchy(header.nomorKomp, header.nomorMak);

  // Signatory formatting for Page 2
  const bendaharaRaw = header.bendahara || "Raka Panji Wibowo, NIP 199504082020121001";
  const bendaharaNama = bendaharaRaw.split(",")[0].trim() || "Raka Panji Wibowo";
  const bendaharaNip = bendaharaRaw.includes("NIP")
    ? bendaharaRaw.substring(bendaharaRaw.indexOf("NIP")).trim()
    : "NIP 199504082020121001";

  const penanggungJawabRaw = header.penanggungJawabNama || "Reni Sutaryo";
  const penanggungJawabNama = penanggungJawabRaw.split(",")[0].trim() || "Reni Sutaryo";
  const penanggungJawabNip = header.penanggungJawabNip
    ? (header.penanggungJawabNip.startsWith("NIP")
        ? header.penanggungJawabNip
        : `NIP ${header.penanggungJawabNip}`)
    : "NIP 19791126 200604 2 014";

  const ppkNama = header.ppkNama || "Arif Wibowo, SH, MH";
  const ppkNip = header.ppkNip
    ? (header.ppkNip.startsWith("NIP")
        ? header.ppkNip
        : `NIP. ${header.ppkNip}`)
    : "NIP. 198301242008011006";

  const verifikatorRaw = header.petugasVerifikasi || "Noviarty Ningsi Sumirat, NIP 19811112201001 2 001";
  let verifikatorNama = "Noviarty Ningsi Sumirat";
  let verifikatorNip = "NIP 19811112201001 2 001";

  if (verifikatorRaw.toLowerCase().includes("taufik")) {
    verifikatorNama = "Taufik Prasetyo";
    verifikatorNip = "NIP 19900826202521 1 026";
  } else if (verifikatorRaw.toLowerCase().includes("novi")) {
    verifikatorNama = "Noviarty Ningsi Sumirat";
    verifikatorNip = "NIP 19811112201001 2 001";
  } else {
    verifikatorNama = verifikatorRaw.split(",")[0].trim() || "Noviarty Ningsi Sumirat";
    verifikatorNip = verifikatorRaw.includes("NIP")
      ? verifikatorRaw.substring(verifikatorRaw.indexOf("NIP")).replace(/NIP\.?\s*/i, "NIP ").trim()
      : "NIP 19811112201001 2 001";
  }

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
            <span>Cetak Memorandum (2 Hal)</span>
          </button>
        </div>
      </div>

      {isEditMode && (
        <div className="no-print p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 shrink-0 text-slate-700" />
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
            isEditMode ? "ring-2 ring-slate-300 ring-offset-2" : ""
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
              <strong>Rp{grandTotal.toLocaleString("id-ID")}</strong> yang dibebankan pada APBN satuan kerja Kementerian Koordinator Bidang Pangan tahun anggaran {tahunAnggaran} dengan MAK.{fullMakCode.replace(/^MAK\./, "")}
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
            isEditMode ? "ring-2 ring-slate-300 ring-offset-2" : ""
          }`}
        >
          {/* Header Lampiran Surat */}
          <div className="space-y-1.5 pt-2">
            <h2 className="font-bold text-xs md:text-sm tracking-wide uppercase text-black">
              LAMPIRAN SURAT
            </h2>
            <div className="space-y-0.5 text-xs">
              <div className="grid grid-cols-12 max-w-sm">
                <span className="col-span-3">Nomor</span>
                <span className="col-span-1 text-center">:</span>
                <span className="col-span-8">{header.nomorMemo || "M.330/INS/PPK/IX/2026"}</span>
              </div>
              <div className="grid grid-cols-12 max-w-sm">
                <span className="col-span-3">Tanggal</span>
                <span className="col-span-1 text-center">:</span>
                <span className="col-span-8">{tanggalMemo}</span>
              </div>
            </div>
          </div>

          {/* Tabel Detail MAK & Akun */}
          <div className="pt-2">
            <table className="w-full border border-black text-xs font-sans border-collapse">
              <thead>
                <tr className="border-b border-black">
                  <th className="border-r border-black p-2 text-left font-normal w-[32%] leading-tight">
                    Kegiatan, Output, Komponen, Sub Komponen, Akun
                  </th>
                  <th className="border-r border-black p-2 text-center font-normal w-[42%]">
                    Uraian
                  </th>
                  <th className="border-r border-black p-2 text-center font-normal w-[8%]">
                    Vol
                  </th>
                  <th className="p-2 text-center font-normal w-[18%]">
                    Jumlah (Rp.)
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* 1. Baris Kegiatan & Output */}
                <tr className="border-b border-black">
                  <td className="border-r border-black p-2 align-top font-mono">
                    {hierarchy.kegOutputCode}
                  </td>
                  <td colSpan={3} className="p-2 align-top">
                    {hierarchy.kegOutputUraian}
                  </td>
                </tr>

                {/* 2. Baris Komponen */}
                <tr className="border-b border-black">
                  <td className="border-r border-black p-2 align-top font-mono">
                    {hierarchy.komponenCode}
                  </td>
                  <td colSpan={3} className="p-2 align-top">
                    {hierarchy.komponenUraian}
                  </td>
                </tr>

                {/* 3. Baris Sub Komponen */}
                <tr className="border-b border-black">
                  <td className="border-r border-black p-2 align-top font-mono">
                    {hierarchy.subKomponenCode}
                  </td>
                  <td colSpan={3} className="p-2 align-top">
                    {hierarchy.subKomponenUraian}
                  </td>
                </tr>

                {/* 4. Baris Akun MAK & Nominal */}
                <tr>
                  <td className="border-r border-black p-2 align-top font-mono">
                    {hierarchy.akunCode}
                  </td>
                  <td colSpan={3} className="p-2 align-top">
                    <div className="flex justify-between items-center pr-2">
                      <span>{hierarchy.akunUraian}</span>
                      <span className="font-bold font-sans text-[13px]">
                        Rp{grandTotal.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Terbilang di bawah tabel */}
            <div className="pt-2 flex items-start text-xs font-sans">
              <div className="w-24 shrink-0 flex justify-between pr-2">
                <span>Terbilang</span>
                <span>:</span>
              </div>
              <div className="font-bold text-black flex-1 leading-snug">
                {terbilang(grandTotal).toLowerCase()}
              </div>
            </div>
          </div>

          {/* Grid 4 Kolom Tanda Tangan (2 Baris x 2 Kolom) */}
          <div className="pt-8 pb-4 space-y-12">
            {/* Baris Atas: Bendahara & Penanggungjawab */}
            <div className="grid grid-cols-2 gap-x-12 text-center text-xs font-sans">
              {/* Kiri Atas: Bendahara Pengeluaran */}
              <div className="flex flex-col justify-between min-h-[130px]">
                <p>Bendahara Pengeluaran,</p>
                <div className="space-y-0.5">
                  <p className="font-normal">{bendaharaNama}</p>
                  <p className="font-mono text-[11px]">{bendaharaNip}</p>
                </div>
              </div>

              {/* Kanan Atas: Penanggungjawab Kegiatan */}
              <div className="flex flex-col justify-between min-h-[130px]">
                <p>Penanggungjawab Kegiatan,</p>
                <div className="space-y-0.5">
                  <p className="font-normal">{penanggungJawabNama}</p>
                  <p className="font-mono text-[11px]">{penanggungJawabNip}</p>
                </div>
              </div>
            </div>

            {/* Baris Bawah: PPK Inspektorat & Petugas Verifikasi */}
            <div className="grid grid-cols-2 gap-x-12 text-center text-xs font-sans">
              {/* Kiri Bawah: Mengetahui/menyetujui PPK Inspektorat */}
              <div className="flex flex-col justify-between min-h-[140px]">
                <div>
                  <p>Mengetahui/menyetujui,</p>
                  <p>Pejabat pembuat Komitmen</p>
                  <p>Inspektorat</p>
                </div>
                <div className="space-y-0.5">
                  <p className="font-normal">{ppkNama}</p>
                  <p className="font-mono text-[11px]">{ppkNip}</p>
                </div>
              </div>

              {/* Kanan Bawah: Petugas Verifikasi */}
              <div className="flex flex-col justify-between min-h-[140px]">
                <p>Petugas Verifikasi,</p>
                <div className="space-y-0.5">
                  <p className="font-normal">{verifikatorNama}</p>
                  <p className="font-mono text-[11px]">{verifikatorNip}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
