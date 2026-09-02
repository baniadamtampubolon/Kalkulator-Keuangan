"use client";

import React from "react";
import { HeaderData, ParticipantRow } from "@/lib/types";
import { formatRupiah, terbilang } from "@/lib/terbilang";
import { Printer } from "lucide-react";

interface MemorandumDocProps {
  header: HeaderData;
  rows: ParticipantRow[];
}

export const MemorandumDoc: React.FC<MemorandumDocProps> = ({ header, rows }) => {
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

  const grandTotal = rows.reduce((acc, r) => acc + (r.totalJumlah || 0), 0);
  const tanggalMemo = formatDateIndo(header.tanggalMemo || header.tanggalSpd || new Date().toISOString());
  const tahunAnggaran = header.tanggalSpd ? new Date(header.tanggalSpd).getFullYear() : new Date().getFullYear();

  const kotaTujuanText = (header.kotaTujuanList || []).filter(Boolean).join(", ") || header.provinsiTujuan;

  // First row participant as PJ Kegiatan
  const pjKegiatan = rows[0] || {
    nama: "Reni Sutaryo, S.Si., M.Adm.Pemb",
    nip: "19791126 200604 2 014",
  };

  const perihalText = header.keteranganMemo || "Permintaan Pembayaran Langsung (LS) Biaya Perjalanan Dinas";

  return (
    <div className="space-y-6">
      {/* Scoped Print Style for Multi-Page Document */}
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
            .memo-page-1 {
              page-break-after: always !important;
              break-after: page !important;
            }
            .print-page-memo {
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
          }
        `,
        }}
      />

      {/* Action Toolbar */}
      <div className="no-print glass-floating rounded-2xl p-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              Dokumen 2: Memorandum Dinas (2 Halaman)
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
              Format Resmi 2 Halaman
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Halaman 1: Nota dinas pengajuan biaya &middot; Halaman 2: Lampiran pembebanan anggaran POK / MAK
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="btn-tactile flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Cetak Memorandum (2 Hal)</span>
        </button>
      </div>

      {/* Outer Wrapper for Multi-Page Sheet */}
      <div className="space-y-8">
        {/* ========================================================================= */}
        {/* HALAMAN 1: MEMORANDUM DINAS                                               */}
        {/* ========================================================================= */}
        <div
          style={{ fontFamily: "Tahoma, 'Segoe UI', Geneva, Verdana, sans-serif" }}
          className="print-page print-page-memo memo-page-1 bg-white text-black p-8 md:p-12 rounded-2xl shadow-md border border-slate-200 mx-auto max-w-[860px] text-xs leading-relaxed space-y-5"
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
              Nomor : &nbsp;&nbsp;{header.nomorMemo || "M.269/INS/PPK/VIII/2026"}
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
            <div className="grid grid-cols-12 gap-1">
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
            <div className="grid grid-cols-12 gap-1 pt-0.5">
              <span className="col-span-2">Tanggal</span>
              <span className="col-span-1 text-center">:</span>
              <span className="col-span-9">{tanggalMemo}</span>
            </div>
          </div>

          {/* Body Narrative */}
          <div className="space-y-4 text-justify text-xs md:text-[12px] leading-relaxed pt-2">
            <p>
              Sehubungan dengan {header.keteranganKegiatan} pada Tanggal {formatDateIndo(rows[0]?.tanggalMulai || header.tanggalSpd)} di {kotaTujuanText}, {header.provinsiTujuan} dengan ini kami mengajukan permohonan dana sebesar{" "}
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
                <p className="font-bold">{header.ppkNama || "Kunto Nugroho"}</p>
                <p className="font-mono text-[11px]">NIP. {header.ppkNip || "198912142018011001"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* HALAMAN 2: LAMPIRAN SURAT (PEMBEBANAN ANGGARAN & 4 TTD)                   */}
        {/* ========================================================================= */}
        <div
          style={{ fontFamily: "Tahoma, 'Segoe UI', Geneva, Verdana, sans-serif" }}
          className="print-page print-page-memo bg-white text-black p-8 md:p-12 rounded-2xl shadow-md border border-slate-200 mx-auto max-w-[860px] text-xs leading-relaxed space-y-6"
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
                <span className="col-span-8">{header.nomorMemo || "M.269/INS/PPK/VIII/2026"}</span>
              </div>
              <div className="grid grid-cols-12 max-w-md">
                <span className="col-span-3">Tanggal</span>
                <span className="col-span-1 text-center">:</span>
                <span className="col-span-8">{tanggalMemo}</span>
              </div>
            </div>
          </div>

          {/* Table Pembebanan Anggaran POK / MAK */}
          <div className="pt-2">
            <table className="w-full border border-black text-xs font-sans border-collapse">
              <thead>
                <tr className="border-b border-black font-bold text-left bg-gray-50">
                  <th className="border-r border-black p-2 w-40">Kegiatan, Output, Komponen, Sub Komponen, Akun</th>
                  <th className="border-r border-black p-2">Uraian</th>
                  <th className="border-r border-black p-2 w-12 text-center">Vol</th>
                  <th className="p-2 w-36 text-center">Jumlah (Rp.)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-black">
                  <td className="border-r border-black p-2 font-mono">7459.ABR.006</td>
                  <td className="border-r border-black p-2">Rekomendasi Kebijakan Program Prioritas Nasional Bidang Tata Niaga dan Distribusi Pangan</td>
                  <td className="border-r border-black p-2 text-center"></td>
                  <td className="p-2 text-right"></td>
                </tr>
                <tr className="border-b border-black">
                  <td className="border-r border-black p-2 font-mono">071.</td>
                  <td className="border-r border-black p-2">Koordinasi Implementasi NEK Pengendalian Emisi GRK</td>
                  <td className="border-r border-black p-2 text-center"></td>
                  <td className="p-2 text-right"></td>
                </tr>
                <tr className="border-b border-black">
                  <td className="border-r border-black p-2 font-mono">CC</td>
                  <td className="border-r border-black p-2">Koordinasi Implementasi NEK Pengendalian Emisi GRK</td>
                  <td className="border-r border-black p-2 text-center"></td>
                  <td className="p-2 text-right"></td>
                </tr>
                <tr className="border-b border-black">
                  <td className="border-r border-black p-2 font-mono">{header.nomorMak || "524111"}</td>
                  <td className="border-r border-black p-2">
                    {header.nomorMak === "524114"
                      ? "Belanja Perjalanan Dinas Paket Meeting Luar Kota"
                      : "Belanja Perjalanan Dinas Biasa"}
                  </td>
                  <td className="border-r border-black p-2 text-center"></td>
                  <td className="p-2 text-right font-mono font-bold">
                    Rp{grandTotal.toLocaleString("id-ID")}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Terbilang Row */}
            <div className="grid grid-cols-12 border-b border-x border-black p-2 text-xs">
              <span className="col-span-2 font-bold">Terbilang</span>
              <span className="col-span-1 text-center font-bold">:</span>
              <span className="col-span-9 font-bold italic">
                {terbilang(grandTotal).toLowerCase()}
              </span>
            </div>
          </div>

          {/* Signatures Section Page 2 (4 Pihak: 2 Baris x 2 Kolom) */}
          <div className="pt-8 pb-4 space-y-10 text-xs font-sans">
            {/* Row 1: Bendahara (Kiri) & Penanggungjawab Kegiatan (Kanan) */}
            <div className="grid grid-cols-2 text-left gap-8">
              {/* Bendahara */}
              <div className="space-y-16">
                <div>
                  <p>Bendahara Pengeluaran,</p>
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold underline">{header.bendahara.split(",")[0] || "Raka Panji Wibowo"}</p>
                  <p className="font-mono text-[11px]">
                    {header.bendahara.includes("NIP")
                      ? header.bendahara.substring(header.bendahara.indexOf("NIP"))
                      : "NIP. 19950408202012 1 001"}
                  </p>
                </div>
              </div>

              {/* Penanggungjawab Kegiatan */}
              <div className="space-y-16 pl-6">
                <div>
                  <p>Penanggungjawab Kegiatan,</p>
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold underline">{pjKegiatan.nama || "Reni Sutaryo"}</p>
                  <p className="font-mono text-[11px]">NIP. {pjKegiatan.nip || "19791126 200604 2 014"}</p>
                </div>
              </div>
            </div>

            {/* Row 2: PPK (Kiri) & Petugas Verifikasi (Kanan) */}
            <div className="grid grid-cols-2 text-left gap-8 pt-2">
              {/* PPK */}
              <div className="space-y-16">
                <div className="space-y-0.5">
                  <p>Mengetahui/menyetujui,</p>
                  <p>Pejabat pembuat Komitmen</p>
                  <p>Inspektorat</p>
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold underline">{header.ppkNama || "Kunto Nugroho"}</p>
                  <p className="font-mono text-[11px]">NIP. {header.ppkNip || "198912142018011001"}</p>
                </div>
              </div>

              {/* Petugas Verifikasi */}
              <div className="space-y-16 pl-6">
                <div className="space-y-0.5">
                  <p>Petugas Verifikasi,</p>
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold underline">{header.petugasVerifikasi?.split(",")[0] || "Taufik Prasetyo"}</p>
                  <p className="font-mono text-[11px]">
                    {header.petugasVerifikasi?.includes("NIP")
                      ? header.petugasVerifikasi.substring(header.petugasVerifikasi.indexOf("NIP"))
                      : "NIP. 19900826202521 1 026"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
