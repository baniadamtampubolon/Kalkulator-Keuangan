"use client";

import React, { useState } from "react";
import { HeaderData } from "@/lib/types";
import { terbilang } from "@/lib/terbilang";
import { calculatePengadaanTotals, getSpjTypeMeta } from "@/lib/pengadaanHelper";
import { Printer, Edit3, RotateCcw } from "lucide-react";

interface KuitansiPengadaanDocProps {
  header: HeaderData;
}

export const KuitansiPengadaanDoc: React.FC<KuitansiPengadaanDocProps> = ({ header }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [renderKey, setRenderKey] = useState(0);
  const [useNetAmount, setUseNetAmount] = useState(false);

  const spjMeta = getSpjTypeMeta(header.spjType);
  const calc = calculatePengadaanTotals(header.pengadaanItems || [], header.pengadaanTax);

  const nominalKuitansi = useNetAmount ? calc.jumlahBersihRounded : Math.round(calc.subTotalBruto);

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
  const tahunAnggaran = header.tanggalSpd ? new Date(header.tanggalSpd).getFullYear() : 2026;

  const rawKegiatan = (header.keteranganKegiatan || "").trim();
  const sudahAdaTanggal = rawKegiatan
    ? /tanggal|tgl\b|\b\d{1,2}\s+(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\s+\d{4}/i.test(rawKegiatan)
    : false;

  const uraianPembayaran = rawKegiatan
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
    header.pengadaanTax?.penerimaNama ||
    header.penanggungJawabNama ||
    "Reni Sutaryo, S.Si., M.Adm.Pemb.";
  const rawPenerimaNip =
    header.pengadaanTax?.penerimaNip !== undefined
      ? header.pengadaanTax.penerimaNip
      : header.penanggungJawabNip || "19791126200604 2 014";
  const penerimaJabatanLabel =
    header.pengadaanTax?.penerimaJabatan || "Penanggung Jawab Kegiatan,";

  const handleResetCanvas = () => {
    setRenderKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6" key={renderKey}>
      {/* Scoped Print Portrait Style */}
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
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              Dokumen 1: Kuitansi {spjMeta.label}
            </h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${spjMeta.badgeColor}`}>
              {spjMeta.shortLabel}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Sesuai format resmi Kuitansi Excel ({useNetAmount ? "Menampilkan Nilai Bersih Setelah Pajak" : "Menampilkan Nilai Sub Total Bruto Sesuai Rumus Excel"})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Toggle Bruto vs Netto */}
          <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setUseNetAmount(false)}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                !useNetAmount
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Gunakan Sub Total Bruto sesuai rumus =Nominatif!G10 di Excel"
            >
              Nilai Bruto (Rp {Math.round(calc.subTotalBruto).toLocaleString("id-ID")})
            </button>
            <button
              type="button"
              onClick={() => setUseNetAmount(true)}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                useNetAmount
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Gunakan Jumlah Bersih Diterima setelah dipotong PPN & PPh"
            >
              Nilai Bersih (Rp {calc.jumlahBersihRounded.toLocaleString("id-ID")})
            </button>
          </div>

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
            <span>Cetak Kuitansi</span>
          </button>
        </div>
      </div>

      {isEditMode && (
        <div className="no-print p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 shrink-0 text-slate-700" />
            <span>
              <strong>Mode Edit Bebas Aktif:</strong> Seluruh teks pada kuitansi (nama, uraian, tanggal, angka, instansi, jabatan tanda tangan) dapat langsung Anda klik dan ubah secara bebas.
            </span>
          </div>
        </div>
      )}

      {/* Kuitansi Sheet */}
      <div
        style={{ fontFamily: "Tahoma, 'Segoe UI', Geneva, Verdana, sans-serif" }}
        contentEditable={isEditMode}
        suppressContentEditableWarning={true}
        className={`kwitansi-sheet bg-white text-black p-10 md:p-14 rounded-2xl shadow-md border border-slate-200 mx-auto max-w-[860px] text-xs leading-relaxed space-y-12 transition-all ${
          isEditMode ? "ring-2 ring-slate-300 ring-offset-2" : ""
        }`}
      >
        {/* Top Header: Instansi Name on Left + Box Table on Right */}
        <div className="flex justify-between items-start pt-2">
          <div className="w-1/2 pt-4">
            <h2 className="font-bold text-xs md:text-sm tracking-tight text-black uppercase">
              KEMENTERIAN KOORDINATOR BIDANG PANGAN
            </h2>
          </div>

          <div className="w-fit min-w-[260px] border border-black px-3 py-2 text-[11px] leading-tight space-y-1 shrink-0">
            <div className="grid grid-cols-[68px_14px_auto] items-center">
              <span>Sub Keg</span>
              <span className="text-center">:</span>
              <span className="font-mono font-medium whitespace-nowrap pl-1">
                {header.nomorKomp || "-"}
              </span>
            </div>
            <div className="grid grid-cols-[68px_14px_auto] items-center">
              <span>Akun</span>
              <span className="text-center">:</span>
              <span className="font-mono font-medium pl-1">
                {header.nomorMak || spjMeta.defaultMak || "-"}
              </span>
            </div>
            <div className="grid grid-cols-[68px_14px_auto] items-center">
              <span>Tanggal</span>
              <span className="text-center">:</span>
              <span className="whitespace-nowrap pl-1">{tanggalCetak}</span>
            </div>
            <div className="grid grid-cols-[68px_14px_auto] items-center">
              <span>APBN T.A</span>
              <span className="text-center">:</span>
              <span className="font-mono pl-1">{tahunAnggaran}</span>
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
          <div className="grid grid-cols-12 gap-1 pt-1 items-center">
            <span className="col-span-3 text-black">Uang sebesar</span>
            <span className="col-span-1 text-center">:</span>
            <div className="col-span-8 font-mono font-bold text-[13px]">
              Rp &nbsp;&nbsp;{nominalKuitansi.toLocaleString("id-ID")}
            </div>
          </div>

          {/* Terbilang */}
          <div className="grid grid-cols-12 gap-1 pt-1">
            <span className="col-span-3 text-black">Terbilang</span>
            <span className="col-span-1 text-center">:</span>
            <span className="col-span-8 italic font-normal text-black">
              {terbilang(nominalKuitansi)}
            </span>
          </div>

          {/* Untuk Pembayaran */}
          <div className="grid grid-cols-12 gap-1 pt-1">
            <span className="col-span-3 text-black">Untuk Pembayaran</span>
            <span className="col-span-1 text-center">:</span>
            <div className="col-span-8 text-justify leading-relaxed text-black">
              {uraianPembayaran}
            </div>
          </div>
        </div>

        {/* Signatures Section (3 Kolom Sesuai Excel Kuitansi) */}
        <div className="pt-16 pb-6">
          <div className="grid grid-cols-3 text-left gap-4 text-xs font-sans">
            {/* Baris 1: Header Jabatan */}
            <div className="space-y-0.5">
              <p>Setuju dibayar</p>
              <p>a.n Kuasa Pengguna Anggaran</p>
              <p>Pejabat Pembuat Komitmen</p>
              <p>Inspektorat</p>
            </div>

            <div className="space-y-0.5">
              <p className="invisible select-none">.</p>
              <p>Setuju dan lunas dibayar</p>
              <p>Bendahara Pengeluaran,</p>
            </div>

            <div className="space-y-0.5">
              <p className="invisible select-none">.</p>
              <p>{tanggalCetak}</p>
              <p>{penerimaJabatanLabel}</p>
            </div>

            {/* Baris 2: Nama & NIP */}
            <div className="space-y-0.5 pt-16">
              <p className="font-normal">{header.ppkNama || "Arif Wibowo, SH, MH"}</p>
              <p className="font-mono text-[11px]">
                {header.ppkNip
                  ? header.ppkNip.startsWith("NIP")
                    ? header.ppkNip
                    : `NIP. ${header.ppkNip}`
                  : "NIP. 19830124200801 1 006"}
              </p>
            </div>

            <div className="space-y-0.5 pt-16">
              <p className="font-normal">{bendaharaNama}</p>
              <p className="font-mono text-[11px]">{bendaharaNip}</p>
            </div>

            <div className="space-y-0.5 pt-16">
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
  );
};

