"use client";

import React, { useState } from "react";
import { HeaderData, ParticipantRow, Pegawai } from "@/lib/types";
import { Printer, Edit3, RotateCcw } from "lucide-react";
import { getPangkatByGolongan } from "@/data/pangkatGolongan";

interface SppdDepanDocProps {
  header: HeaderData;
  setHeader?: React.Dispatch<React.SetStateAction<HeaderData>>;
  rows: ParticipantRow[];
  setRows?: React.Dispatch<React.SetStateAction<ParticipantRow[]>>;
  pegawaiList?: Pegawai[];
}

export const SppdDepanDoc: React.FC<SppdDepanDocProps> = ({
  header,
  rows,
  pegawaiList = [],
}) => {
  const [viewMode, setViewMode] = useState<"all" | number>("all");
  const [isEditMode, setIsEditMode] = useState(false);
  const [renderKey, setRenderKey] = useState(0);

  if (!rows || rows.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400">
        Belum ada data peserta untuk mencetak SPPD Depan.
      </div>
    );
  }

  // Format date helper in Indonesian
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

  // Resolve pangkat from pegawaiList or standard pangkat by golongan
  const resolvePangkat = (row: ParticipantRow) => {
    if (pegawaiList && pegawaiList.length > 0) {
      const found = pegawaiList.find(
        (p) =>
          (row.nip && p.nip === row.nip) ||
          (row.nama && p.nama === row.nama) ||
          (row.kodeNama && p.kodeNama === row.kodeNama)
      );
      if (found?.pangkat && found.pangkat.trim() !== "") {
        return found.pangkat.trim();
      }
    }
    if (row.golongan) {
      const fromGol = getPangkatByGolongan(row.golongan);
      if (fromGol) return fromGol;
    }
    return "";
  };

  // Resolve tingkat biaya perdin (standar PMK)
  const resolveTingkatBiaya = (row: ParticipantRow) => {
    if (row.isPejabat) return "B";
    const gol = (row.golongan || "").toUpperCase();
    if (gol.startsWith("IV")) return "C";
    if (gol.startsWith("III")) return "C";
    if (gol.startsWith("II") || gol.startsWith("I")) return "D";
    return "";
  };

  // Concatenate Nomor Akun (Komponen) + Nomor MAK
  const getAkunCode = () => {
    const komp = (header.nomorKomp || "").trim();
    const mak = (header.nomorMak || "").trim();
    if (komp && mak) {
      if (komp.endsWith(mak)) return komp;
      return `${komp}.${mak}`;
    }
    return komp || mak || "-";
  };

  const displayedRows = viewMode === "all" ? rows : [rows[viewMode as number]];

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
              margin: 15mm 20mm 15mm 20mm !important;
            }
            body {
              background: #ffffff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .sppd-sheet {
              page-break-after: always !important;
              break-after: page !important;
              width: 100% !important;
              max-width: none !important;
              padding: 0 !important;
              margin: 0 !important;
              box-shadow: none !important;
              border: none !important;
            }
            .sppd-sheet:last-child {
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
            <span className="text-xs font-semibold text-slate-700">Tampilan SPPD Depan:</span>
            <select
              value={viewMode === "all" ? "all" : String(viewMode)}
              onChange={(e) => setViewMode(e.target.value === "all" ? "all" : parseInt(e.target.value))}
              className="input-clean h-8 px-3 text-xs font-semibold cursor-pointer"
            >
              <option value="all">⭐ Tampilkan Semua ({rows.length} Pegawai — Cetak Sekaligus)</option>
              {rows.map((r, i) => (
                <option key={r.id || i} value={i}>
                  Pegawai {i + 1}: {r.nama || r.namaExternal || "Tanpa Nama"} — SPD No. {r.nomorSpd || i + 1}
                </option>
              ))}
            </select>
          </div>

          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
            {viewMode === "all" ? `Menampilkan ${rows.length} Lembar SPPD Depan` : `Menampilkan 1 Lembar Pegawai`}
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
              {viewMode === "all" ? `Cetak Semua SPPD Depan (${rows.length} Lembar)` : `Cetak SPPD Depan Ini`}
            </span>
          </button>
        </div>
      </div>

      {isEditMode && (
        <div className="no-print p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 shrink-0 text-slate-700" />
            <span>
              <strong>Mode Edit Bebas Aktif:</strong> Seluruh teks pada lembar SPPD Depan (Kop, nomor SPD, tabel rincian 1-10, tanggal, hingga tanda tangan PPK) dapat langsung Anda klik dan ketik untuk penyesuaian sebelum mencetak.
            </span>
          </div>
        </div>
      )}

      {/* Sheets Container */}
      <div className="space-y-8">
        {displayedRows.map((r, index) => {
          const actualIndex = viewMode === "all" ? index : (viewMode as number);
          const nomorSpdDisplay = r.nomorSpd || String(actualIndex + 1);
          const tglBerangkatDisplay = formatDateIndo(r.tanggalMulai || header.tanggalSpd || new Date().toISOString());
          const tglKembaliDisplay = formatDateIndo(r.tanggalSelesai || r.tanggalMulai || header.tanggalSpd || new Date().toISOString());
          const pangkatStr = resolvePangkat(r);
          const golStr = r.golongan || "";
          const tingkatBiayaStr = resolveTingkatBiaya(r);

          // Pangkat & Golongan text
          let pangkatDanGolongan = "";
          if (pangkatStr && golStr) {
            pangkatDanGolongan = `${pangkatStr} / ${golStr}`;
          } else if (pangkatStr) {
            pangkatDanGolongan = `${pangkatStr} / `;
          } else if (golStr) {
            pangkatDanGolongan = `/ ${golStr}`;
          } else {
            pangkatDanGolongan = "/";
          }

          // Tujuan formatting
          const kotaTujuan = r.tujuanKota || (header.kotaTujuanList || [])[0] || "";
          const provTujuan = r.tujuanProvinsi || header.provinsiTujuan || "";

          // PPK data from input
          const ppkNama = header.ppkNama || "Arif Wibowo, S.H., M.H.";
          const ppkNip = header.ppkNip || "198301242008011006";

          // ST number for row 10
          const nomorStDisplay = r.nomorSt || header.nomorStStaff || header.nomorStMaster || "-";

          return (
            <div
              key={r.id || index}
              className="sppd-sheet bg-white text-black shadow-lg rounded-sm border border-slate-200 mx-auto max-w-[210mm] min-h-[297mm] p-[16mm_20mm] font-sans text-[12.5px] leading-relaxed"
            >
              {/* TOP HEADER: LEFT AGENCY & RIGHT SPD NUMBER */}
              <div className="flex justify-between items-start mb-6 text-[11px] leading-tight">
                {/* Left: Ministry header */}
                <div
                  className="w-[50%] font-bold tracking-tight text-center sm:text-center uppercase pt-1"
                  contentEditable={isEditMode}
                  suppressContentEditableWarning
                >
                  <div>KEMENTERIAN KOORDINATOR BIDANG PANGAN</div>
                  <div className="mt-0.5">REPUBLIK INDONESIA</div>
                </div>

                {/* Right: Lembar ke & Nomor */}
                <div
                  className="w-[45%] text-left pl-6"
                  contentEditable={isEditMode}
                  suppressContentEditableWarning
                >
                  <table className="w-full border-collapse">
                    <tbody>
                      <tr>
                        <td className="w-24 py-0.5">Lembar ke</td>
                        <td className="w-3 text-center py-0.5">:</td>
                        <td className="py-0.5">1</td>
                      </tr>
                      <tr>
                        <td className="py-0.5">Nomor</td>
                        <td className="text-center py-0.5">:</td>
                        <td className="py-0.5 font-medium">{nomorSpdDisplay}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5">Kode Nomor</td>
                        <td className="text-center py-0.5">:</td>
                        <td className="py-0.5"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* TITLE */}
              <div className="text-center mb-4">
                <h2
                  className="font-bold text-[13.5px] uppercase tracking-wide inline-block"
                  contentEditable={isEditMode}
                  suppressContentEditableWarning
                >
                  SURAT PERJALANAN DINAS (SPD)
                </h2>
              </div>

              {/* MAIN TABLE (10 ROWS) */}
              <div className="border-t border-black text-[12px] leading-normal">
                {/* ROW 1: Pejabat Pembuat Komitmen */}
                <div className="flex border-b border-black py-2">
                  <div className="w-8 shrink-0 text-left font-normal">1</div>
                  <div className="w-72 shrink-0 text-left pr-2">
                    Pejabat Pembuat Komitmen
                  </div>
                  <div className="flex-1 flex items-start">
                    <span className="w-4 shrink-0">:</span>
                    <span
                      className="flex-1"
                      contentEditable={isEditMode}
                      suppressContentEditableWarning
                    >
                      {ppkNama}
                    </span>
                  </div>
                </div>

                {/* ROW 2: Nama / NIP Pegawai */}
                <div className="flex border-b border-black py-2">
                  <div className="w-8 shrink-0 text-left font-normal">2</div>
                  <div className="w-72 shrink-0 text-left pr-2">
                    <div>Nama / NIP Pegawai yang melaksanakan</div>
                    <div>perjalanan dinas</div>
                  </div>
                  <div className="flex-1 flex flex-col items-start">
                    <div className="flex w-full">
                      <span className="w-4 shrink-0">:</span>
                      <span
                        className="flex-1 font-bold"
                        contentEditable={isEditMode}
                        suppressContentEditableWarning
                      >
                        {r.nama || r.namaExternal || "-"}
                      </span>
                    </div>
                    <div className="flex w-full mt-0.5">
                      <span className="w-4 shrink-0">:</span>
                      <span
                        className="flex-1"
                        contentEditable={isEditMode}
                        suppressContentEditableWarning
                      >
                        NIP {r.nip || "-"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ROW 3: Pangkat & Golongan, Jabatan / Instansi, Tingkat Biaya */}
                <div className="flex border-b border-black py-2">
                  <div className="w-8 shrink-0 text-left font-normal">3</div>
                  <div className="w-72 shrink-0 text-left pr-2 space-y-1">
                    <div className="flex">
                      <span className="w-5">a</span>
                      <span>Pangkat dan Golongan</span>
                    </div>
                    <div className="flex">
                      <span className="w-5">b</span>
                      <span>Jabatan / Instansi</span>
                    </div>
                    <div className="flex">
                      <span className="w-5">c</span>
                      <span>Tingkat Biaya Perjalanan Dinas</span>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col space-y-1">
                    <div className="flex w-full">
                      <span className="w-4 shrink-0">:</span>
                      <span
                        className="flex-1"
                        contentEditable={isEditMode}
                        suppressContentEditableWarning
                      >
                        a &nbsp;{pangkatDanGolongan}
                      </span>
                    </div>
                    <div className="flex w-full">
                      <span className="w-4 shrink-0">:</span>
                      <span
                        className="flex-1"
                        contentEditable={isEditMode}
                        suppressContentEditableWarning
                      >
                        b &nbsp;{r.jabatan || "-"}
                      </span>
                    </div>
                    <div className="flex w-full">
                      <span className="w-4 shrink-0">:</span>
                      <span
                        className="flex-1"
                        contentEditable={isEditMode}
                        suppressContentEditableWarning
                      >
                        c &nbsp;Tingkat : {tingkatBiayaStr}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ROW 4: Maksud Perjalanan Dinas */}
                <div className="flex border-b border-black py-2">
                  <div className="w-8 shrink-0 text-left font-normal">4</div>
                  <div className="w-72 shrink-0 text-left pr-2">
                    Maksud Perjalanan Dinas
                  </div>
                  <div className="flex-1 flex items-start">
                    <span className="w-4 shrink-0">:</span>
                    <span
                      className="flex-1 text-justify leading-relaxed"
                      contentEditable={isEditMode}
                      suppressContentEditableWarning
                    >
                      {header.keteranganKegiatan || "-"}
                    </span>
                  </div>
                </div>

                {/* ROW 5: Alat angkutan yang dipergunakan */}
                <div className="flex border-b border-black py-2">
                  <div className="w-8 shrink-0 text-left font-normal">5</div>
                  <div className="w-72 shrink-0 text-left pr-2">
                    Alat angkutan yang dipergunakan
                  </div>
                  <div className="flex-1 flex items-start">
                    <span className="w-4 shrink-0">:</span>
                    <span
                      className="flex-1"
                      contentEditable={isEditMode}
                      suppressContentEditableWarning
                    >
                      {header.alatAngkut || "-"}
                    </span>
                  </div>
                </div>

                {/* ROW 6: Tempat Berangkat & Tempat Tujuan */}
                <div className="flex border-b border-black py-2">
                  <div className="w-8 shrink-0 text-left font-normal">6</div>
                  <div className="w-72 shrink-0 text-left pr-2 space-y-1">
                    <div className="flex">
                      <span className="w-5">a.</span>
                      <span>Tempat berangkat</span>
                    </div>
                    <div className="flex">
                      <span className="w-5">b.</span>
                      <span>Tempat tujuan</span>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col space-y-1">
                    <div className="flex w-full">
                      <span className="w-4 shrink-0">:</span>
                      <span
                        className="flex-1"
                        contentEditable={isEditMode}
                        suppressContentEditableWarning
                      >
                        a. &nbsp;{header.berangkatDari || "Jakarta"}
                      </span>
                    </div>
                    <div className="flex w-full">
                      <span className="w-4 shrink-0">:</span>
                      <span
                        className="flex-1"
                        contentEditable={isEditMode}
                        suppressContentEditableWarning
                      >
                        b. &nbsp;
                        {kotaTujuan ? `${kotaTujuan}` : ""}
                        {kotaTujuan && provTujuan ? ` , ${provTujuan}` : provTujuan ? `${provTujuan}` : "-"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ROW 7: Lamanya Perjalanan Dinas, Tgl Berangkat, Tgl Harus Kembali */}
                <div className="flex border-b border-black py-2">
                  <div className="w-8 shrink-0 text-left font-normal">7</div>
                  <div className="w-72 shrink-0 text-left pr-2 space-y-1">
                    <div className="flex">
                      <span className="w-5">a</span>
                      <span>Lamanya perjalanan dinas</span>
                    </div>
                    <div className="flex">
                      <span className="w-5">b</span>
                      <span>Tanggal berangkat</span>
                    </div>
                    <div className="flex">
                      <span className="w-5">c</span>
                      <span>Tanggal harus kembali</span>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col space-y-1">
                    <div className="flex w-full">
                      <span className="w-4 shrink-0">:</span>
                      <span
                        className="flex-1"
                        contentEditable={isEditMode}
                        suppressContentEditableWarning
                      >
                        a. &nbsp;{r.lamaHari || 1} &nbsp;hari
                      </span>
                    </div>
                    <div className="flex w-full">
                      <span className="w-4 shrink-0">:</span>
                      <span
                        className="flex-1"
                        contentEditable={isEditMode}
                        suppressContentEditableWarning
                      >
                        b. &nbsp;{tglBerangkatDisplay}
                      </span>
                    </div>
                    <div className="flex w-full">
                      <span className="w-4 shrink-0">:</span>
                      <span
                        className="flex-1"
                        contentEditable={isEditMode}
                        suppressContentEditableWarning
                      >
                        c. &nbsp;{tglKembaliDisplay}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ROW 8: Pengikut (Dikosongkan sesuai permintaan) */}
                <div className="flex border-b border-black py-2">
                  <div className="w-8 shrink-0 text-left font-normal">8</div>
                  <div className="w-72 shrink-0 text-left pr-2 space-y-1">
                    <div>Pengikut :</div>
                    <div className="pl-4">1</div>
                    <div className="pl-4">2</div>
                  </div>
                  <div className="flex-1 flex flex-col space-y-1">
                    <div className="flex w-full">
                      <div className="w-4 shrink-0"></div>
                      <div className="w-44 text-left">Tanggal Lahir</div>
                      <div className="flex-1 text-left">Hubungan keluarga/keterangan</div>
                    </div>
                    <div className="flex w-full">
                      <span className="w-4 shrink-0">:</span>
                      <div className="w-44"></div>
                      <div className="flex-1"></div>
                    </div>
                    <div className="flex w-full">
                      <span className="w-4 shrink-0">:</span>
                      <div className="w-44"></div>
                      <div className="flex-1"></div>
                    </div>
                  </div>
                </div>

                {/* ROW 9: Pembebanan Anggaran */}
                <div className="flex border-b border-black py-2">
                  <div className="w-8 shrink-0 text-left font-normal">9</div>
                  <div className="w-72 shrink-0 text-left pr-2 space-y-1">
                    <div>Pembebanan anggaran :</div>
                    <div className="flex">
                      <span className="w-5">a</span>
                      <span>Instansi</span>
                    </div>
                    <div className="flex">
                      <span className="w-5">b</span>
                      <span>Akun</span>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col space-y-1">
                    <div className="h-5"></div>
                    <div className="flex w-full">
                      <span className="w-4 shrink-0">:</span>
                      <span
                        className="flex-1"
                        contentEditable={isEditMode}
                        suppressContentEditableWarning
                      >
                        a. &nbsp;Kementerian Koordinator Bidang Pangan
                      </span>
                    </div>
                    <div className="flex w-full">
                      <span className="w-4 shrink-0">:</span>
                      <span
                        className="flex-1 font-mono text-[11.5px]"
                        contentEditable={isEditMode}
                        suppressContentEditableWarning
                      >
                        b. &nbsp;{getAkunCode()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ROW 10: Keterangan lain - lain */}
                <div className="flex border-b border-black py-2">
                  <div className="w-8 shrink-0 text-left font-normal">10</div>
                  <div className="w-72 shrink-0 text-left pr-2">
                    Keterangan lain - lain
                  </div>
                  <div className="flex-1 flex items-start">
                    <span className="w-4 shrink-0">:</span>
                    <span
                      className="flex-1"
                      contentEditable={isEditMode}
                      suppressContentEditableWarning
                    >
                      {nomorStDisplay}
                    </span>
                  </div>
                </div>
              </div>

              {/* BOTTOM SIGNATURE BLOCK (RIGHT-ALIGNED) */}
              <div className="mt-8 flex justify-end">
                <div className="w-80 text-left space-y-0.5">
                  <div className="flex items-center">
                    <span className="w-28">Dikeluarkan di</span>
                    <span className="w-4">:</span>
                    <span
                      className="font-normal"
                      contentEditable={isEditMode}
                      suppressContentEditableWarning
                    >
                      Jakarta
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-28">Pada Tanggal</span>
                    <span className="w-4">:</span>
                    <span
                      className="font-normal"
                      contentEditable={isEditMode}
                      suppressContentEditableWarning
                    >
                      {tglBerangkatDisplay}
                    </span>
                  </div>

                  <div className="pt-4">
                    <div
                      className="font-normal"
                      contentEditable={isEditMode}
                      suppressContentEditableWarning
                    >
                      Pejabat Pembuat Komitmen
                    </div>

                    {/* Signature Space */}
                    <div className="h-20"></div>

                    <div>
                      <div
                        className="font-bold underline tracking-wide inline-block"
                        contentEditable={isEditMode}
                        suppressContentEditableWarning
                      >
                        {ppkNama}
                      </div>
                      <div
                        className="text-[11.5px] mt-0.5"
                        contentEditable={isEditMode}
                        suppressContentEditableWarning
                      >
                        NIP. {ppkNip}
                      </div>
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
