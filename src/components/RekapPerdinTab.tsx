"use client";

import React, { useState } from "react";
import { HeaderData, ParticipantRow } from "@/lib/types";
import { Download, FileSpreadsheet, Search, Database } from "lucide-react";
import * as XLSX from "xlsx";

interface RekapPerdinTabProps {
  header: HeaderData;
  rows: ParticipantRow[];
  onOpenDatabaseSync?: () => void;
}

export const RekapPerdinTab: React.FC<RekapPerdinTabProps> = ({ header, rows, onOpenDatabaseSync }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRows = rows.filter((r) =>
    (r.nama || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.nip || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.jabatan || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const grandTotal = rows.reduce((acc, r) => acc + (r.totalJumlah || 0), 0);

  // Export to Excel (.xlsx) matching contoh-rekap perdin.xlsx
  const handleExportExcel = () => {
    // 1. Column Headers (Exact standard of Rekap Perdin)
    const headers = [
      "No SPBY",
      "JENIS PENGAJUAN",
      "No SPM",
      "",
      "NAMA PEGAWAI INTERNAL INSPEKTORAT",
      "NAMA EXTERNAL",
      "NIP",
      "Gol",
      "Jabatan",
      "Jenis Perdin",
      "Status Pegawai",
      "Nama Kegiatan",
      "No Surat Tugas",
      "Unit Kerja",
      "Angkutan",
      "Berangkat dari-",
      "Tujuan ke-",
      "Tgl Berangkat",
      "Tgl Kembali",
      "Nomor Tiket",
      "Nama Maskapai",
      "Kode Booking",
      "Boarding Pass (Ada/Tidak)",
      "Nama Penginapan",
      "Tanggal Check In",
      "Tanggal Check Out",
      "Jumlah Hari Menginap",
      "Lama Hari 100%",
      "Lama Hari 40%",
      "Total Hari",
      "UH 100% ()",
      "UH 40% ()",
      "UH Fullboard/Fullday/Halfday/Diklat",
      "Biaya Penginapan Biasa (Hotel)",
      "Penginapan 30%",
      "Biaya Fullboard/Fullday/Halfday ()",
      "Kurs ()",
      "Riil ()",
      "Harga Fare Tiket Pergi ()",
      "Harga FareTiket Pulang ()",
      "Transport Jakarta PP",
      "Transport Daerah PP",
      "Biaya Transport ()",
      "Sewa kendaraan ()",
      "Representatif ()",
      "Taksi Bandara",
      "Biaya Reschedule ()",
      "Total",
      "Nilai Nominal di Daftar Nominatif",
      "PENGEMBALIAN",
    ];

    // 2. Data Rows
    const dataRows = rows.map((r) => {
      // Format tiket multiline if available
      const noTiket =
        r.tiketDetailPergi?.noTiket || r.tiketDetailPulang?.noTiket
          ? `Berangkat : ${r.tiketDetailPergi?.noTiket || "-"}\r\nPulang : ${r.tiketDetailPulang?.noTiket || "-"}`
          : "";

      const maskapai =
        r.tiketDetailPergi?.maskapai || r.tiketDetailPulang?.maskapai
          ? `Berangkat : ${r.tiketDetailPergi?.maskapai || "-"}\r\nPulang : ${r.tiketDetailPulang?.maskapai || "-"}`
          : "";

      const kodeBooking =
        r.tiketDetailPergi?.kodeBooking || r.tiketDetailPulang?.kodeBooking
          ? `Berangkat : ${r.tiketDetailPergi?.kodeBooking || "-"}\r\nPulang : ${r.tiketDetailPulang?.kodeBooking || "-"}`
          : "";

      const farePergi =
        r.tiketDetailPergi?.harga !== undefined
          ? r.tiketDetailPergi.harga
          : (r.tiket ? Math.round(r.tiket / 2) : "");

      const farePulang =
        r.tiketDetailPulang?.harga !== undefined
          ? r.tiketDetailPulang.harga
          : (r.tiket ? Math.round(r.tiket / 2) : "");

      const biayaTransport =
        (r.transportasiDarat || 0) + (r.transportasiLokal || 0) + (r.dukunganTransportasi || 0);

      const biayaMeeting = (r.fulldayMeeting || 0) + (r.fullboardMeeting || 0);
      const uhMeeting = (r.biayaUhHalfday || 0) + (r.biayaUhFullboard || 0);

      return [
        header.noSpby || "",
        header.jenisPengajuan || "RAMPUNG",
        header.noSpm || "",
        "",
        r.namaExternal ? "" : r.nama,
        r.namaExternal || "",
        r.nip || "",
        r.golongan || "",
        r.jabatan || "",
        header.jenisPerdin || "Perdin Luar Kota",
        r.nip ? "PNS" : "",
        header.keteranganKegiatan || "",
        r.nomorSt || header.nomorStStaff || header.nomorStMaster || "",
        header.unitKerja || "INSPEKTORAT",
        header.alatAngkut || "Angkutan Darat",
        header.berangkatDari || "Jakarta",
        r.tujuanKota || header.provinsiTujuan || "",
        r.tanggalMulai || "",
        r.tanggalSelesai || "",
        noTiket,
        maskapai,
        kodeBooking,
        r.boardingPass || (r.tiket > 0 ? "ADA" : ""),
        r.namaHotel || "",
        r.checkInHotel || (r.hotel > 0 ? r.tanggalMulai : ""),
        r.checkOutHotel || (r.hotel > 0 ? r.tanggalSelesai : ""),
        r.malamHotel || (r.hotel > 0 ? 1 : ""),
        r.hariUhBiasa || "",
        r.hariUhBiasa60 || "",
        r.lamaHari || 1,
        r.biayaUhBiasa || "",
        r.biayaUhBiasa60 || "",
        uhMeeting || "",
        r.hotel || "",
        r.penginapan30 || "",
        biayaMeeting || "",
        r.kurs || "",
        r.pengRill || "",
        farePergi,
        farePulang,
        r.transportJakartaPp || "",
        r.transportDaerahPp || "",
        biayaTransport || "",
        r.sewaKendaraan || "",
        r.representatif || "",
        r.taksiBandara || "",
        r.biayaReschedule || "",
        r.totalJumlah || 0,
        r.totalJumlah || 0,
        r.pengembalian || "",
      ];
    });

    const worksheetData = [headers, ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    // Auto-fit column widths
    const colWidths = headers.map((h, i) => {
      let maxLen = h.length;
      dataRows.forEach((row) => {
        const val = String(row[i] || "");
        if (val.length > maxLen) maxLen = Math.min(val.length, 45);
      });
      return { wch: Math.max(maxLen + 2, 12) };
    });
    ws["!cols"] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Perdin");

    const safeTitle = (header.keteranganKegiatan || "Rekap_Perdin")
      .slice(0, 30)
      .replace(/[/\\?%*:|"<>]/g, "_");
    const fileName = `Rekap_Perdin_${safeTitle}_${new Date().toISOString().split("T")[0]}.xlsx`;

    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Action Controls */}
      <div className="glass-base rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm md:text-base font-bold text-slate-900">
                  Tabel Rekap Perdin Inspektorat
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  48 Kolom SPJ Lengkap
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Format database pertanggungjawaban dinas resmi terintegrasi dengan kalkulasi SBM dan modal rincian
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari pegawai / NIP..."
                className="input-glass h-9 pl-8 pr-3 text-xs w-48 sm:w-60 font-medium"
              />
            </div>

            {onOpenDatabaseSync && (
              <button
                type="button"
                onClick={onOpenDatabaseSync}
                className="btn-tactile flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md shadow-slate-900/20 cursor-pointer"
              >
                <Database className="w-3.5 h-3.5 text-blue-400" />
                <span>Simpan ke Spreadsheet</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportExcel}
              className="btn-tactile flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md shadow-emerald-700/20 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor ke Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Quick Meta Info Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-200/60 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/80">
            <span className="text-[10px] font-semibold text-slate-500 block uppercase">Jenis Pengajuan</span>
            <span className="font-bold text-indigo-900">{header.jenisPengajuan || "RAMPUNG"}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/80">
            <span className="text-[10px] font-semibold text-slate-500 block uppercase">No. SPM</span>
            <span className="font-mono font-bold text-slate-900">{header.noSpm || "—"}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/80">
            <span className="text-[10px] font-semibold text-slate-500 block uppercase">Jenis Perdin</span>
            <span className="font-semibold text-slate-900">{header.jenisPerdin || "Perdin Luar Kota"}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-200/80">
            <span className="text-[10px] font-semibold text-blue-700 block uppercase">Total Anggaran</span>
            <span className="font-mono font-black text-blue-900">Rp {grandTotal.toLocaleString("id-ID")}</span>
          </div>
        </div>
      </div>

      {/* 48-Column Database Table View */}
      <div className="glass-base rounded-3xl p-4 shadow-sm border border-slate-200/80 overflow-hidden space-y-3">
        <div className="flex items-center justify-between px-2">
          <span className="text-xs font-bold text-slate-700">
            Menampilkan {filteredRows.length} dari {rows.length} Pegawai Terdaftar
          </span>
          <span className="text-[11px] text-slate-500">
            Geser horizontal untuk melihat seluruh 48 kolom data
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200/90 max-h-[600px] overflow-y-auto">
          <table className="w-full text-[11px] border-collapse bg-white whitespace-nowrap">
            <thead className="sticky top-0 z-20 bg-slate-100/95 backdrop-blur-md border-b-2 border-slate-300 font-bold text-slate-800 text-[10.5px]">
              <tr>
                <th className="p-2.5 border-r border-slate-200 text-center w-10">No</th>
                <th className="p-2.5 border-r border-slate-200">No SPBY</th>
                <th className="p-2.5 border-r border-slate-200">Jenis Pengajuan</th>
                <th className="p-2.5 border-r border-slate-200">No SPM</th>
                <th className="p-2.5 border-r border-slate-200 sticky left-0 bg-slate-100 z-30 shadow-xs">
                  Nama Pegawai Internal
                </th>
                <th className="p-2.5 border-r border-slate-200">Nama External</th>
                <th className="p-2.5 border-r border-slate-200">NIP</th>
                <th className="p-2.5 border-r border-slate-200">Gol</th>
                <th className="p-2.5 border-r border-slate-200">Jabatan</th>
                <th className="p-2.5 border-r border-slate-200">Jenis Perdin</th>
                <th className="p-2.5 border-r border-slate-200">No Surat Tugas</th>
                <th className="p-2.5 border-r border-slate-200">Angkutan</th>
                <th className="p-2.5 border-r border-slate-200">Berangkat dari</th>
                <th className="p-2.5 border-r border-slate-200">Tujuan ke</th>
                <th className="p-2.5 border-r border-slate-200">Tgl Berangkat</th>
                <th className="p-2.5 border-r border-slate-200">Tgl Kembali</th>
                <th className="p-2.5 border-r border-slate-200">Nomor Tiket</th>
                <th className="p-2.5 border-r border-slate-200">Maskapai</th>
                <th className="p-2.5 border-r border-slate-200">Kode Booking</th>
                <th className="p-2.5 border-r border-slate-200">Boarding Pass</th>
                <th className="p-2.5 border-r border-slate-200">Nama Penginapan</th>
                <th className="p-2.5 border-r border-slate-200">Check In</th>
                <th className="p-2.5 border-r border-slate-200">Check Out</th>
                <th className="p-2.5 border-r border-slate-200 text-center">Hari Inap</th>
                <th className="p-2.5 border-r border-slate-200 text-center">Total Hari</th>
                <th className="p-2.5 border-r border-slate-200 text-right">UH Biasa</th>
                <th className="p-2.5 border-r border-slate-200 text-right">UH 60%</th>
                <th className="p-2.5 border-r border-slate-200 text-right">Hotel</th>
                <th className="p-2.5 border-r border-slate-200 text-right">Penginapan 30%</th>
                <th className="p-2.5 border-r border-slate-200 text-right">Meeting</th>
                <th className="p-2.5 border-r border-slate-200 text-right">Riil</th>
                <th className="p-2.5 border-r border-slate-200 text-right">Fare Pergi</th>
                <th className="p-2.5 border-r border-slate-200 text-right">Fare Pulang</th>
                <th className="p-2.5 border-r border-slate-200 text-right">Trans. Jakarta PP</th>
                <th className="p-2.5 border-r border-slate-200 text-right">Trans. Daerah PP</th>
                <th className="p-2.5 border-r border-slate-200 text-right">Trans. Darat/Lokal</th>
                <th className="p-2.5 border-r border-slate-200 text-right">Sewa Kendaraan</th>
                <th className="p-2.5 border-r border-slate-200 text-right">Representatif</th>
                <th className="p-2.5 border-r border-slate-200 text-right font-black text-blue-900 bg-blue-100/50">
                  Total Biaya
                </th>
                <th className="p-2.5 text-right font-semibold text-slate-700">Pengembalian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {filteredRows.map((r, idx) => {
                const noTiket =
                  r.tiketDetailPergi?.noTiket || r.tiketDetailPulang?.noTiket
                    ? `${r.tiketDetailPergi?.noTiket || "-"} / ${r.tiketDetailPulang?.noTiket || "-"}`
                    : "-";
                const maskapai =
                  r.tiketDetailPergi?.maskapai || r.tiketDetailPulang?.maskapai
                    ? `${r.tiketDetailPergi?.maskapai || "-"} / ${r.tiketDetailPulang?.maskapai || "-"}`
                    : "-";
                const kodeBooking =
                  r.tiketDetailPergi?.kodeBooking || r.tiketDetailPulang?.kodeBooking
                    ? `${r.tiketDetailPergi?.kodeBooking || "-"} / ${r.tiketDetailPulang?.kodeBooking || "-"}`
                    : "-";

                const transTotal =
                  (r.transportasiDarat || 0) + (r.transportasiLokal || 0) + (r.dukunganTransportasi || 0);

                return (
                  <tr key={r.id || idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-2 border-r border-slate-200 text-center font-bold text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="p-2 border-r border-slate-200 font-mono text-slate-600">
                      {header.noSpby || "—"}
                    </td>
                    <td className="p-2 border-r border-slate-200 font-semibold text-indigo-900">
                      {header.jenisPengajuan || "RAMPUNG"}
                    </td>
                    <td className="p-2 border-r border-slate-200 font-mono font-bold text-slate-800">
                      {header.noSpm || "—"}
                    </td>
                    <td className="p-2 border-r border-slate-200 font-bold text-slate-900 sticky left-0 bg-white shadow-xs">
                      {r.nama || "—"}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-slate-600">
                      {r.namaExternal || "—"}
                    </td>
                    <td className="p-2 border-r border-slate-200 font-mono text-slate-600">
                      {r.nip || "—"}
                    </td>
                    <td className="p-2 border-r border-slate-200 font-medium">
                      {r.golongan || "—"}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-slate-700">
                      {r.jabatan || "Pelaksana"}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-slate-700">
                      {header.jenisPerdin || "Perdin Luar Kota"}
                    </td>
                    <td className="p-2 border-r border-slate-200 font-mono text-slate-700">
                      {r.nomorSt || header.nomorStStaff || header.nomorStMaster || "—"}
                    </td>
                    <td className="p-2 border-r border-slate-200">
                      {header.alatAngkut || "Angkutan Darat"}
                    </td>
                    <td className="p-2 border-r border-slate-200">
                      {header.berangkatDari || "Jakarta"}
                    </td>
                    <td className="p-2 border-r border-slate-200 font-medium text-slate-800">
                      {r.tujuanKota || header.provinsiTujuan}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-slate-600">
                      {r.tanggalMulai}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-slate-600">
                      {r.tanggalSelesai}
                    </td>
                    <td className="p-2 border-r border-slate-200 font-mono text-slate-700">
                      {noTiket}
                    </td>
                    <td className="p-2 border-r border-slate-200">
                      {maskapai}
                    </td>
                    <td className="p-2 border-r border-slate-200 font-mono font-bold text-blue-800">
                      {kodeBooking}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-center">
                      <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${
                        r.boardingPass === "ADA" || (r.tiket > 0 && r.boardingPass !== "TIDAK")
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        {r.boardingPass || (r.tiket > 0 ? "ADA" : "-")}
                      </span>
                    </td>
                    <td className="p-2 border-r border-slate-200 font-medium">
                      {r.namaHotel || "—"}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-slate-600">
                      {r.checkInHotel || (r.hotel > 0 ? r.tanggalMulai : "—")}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-slate-600">
                      {r.checkOutHotel || (r.hotel > 0 ? r.tanggalSelesai : "—")}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-center font-bold">
                      {r.malamHotel || (r.hotel > 0 ? 1 : "—")}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-center font-bold">
                      {r.lamaHari}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono">
                      {r.biayaUhBiasa ? `Rp ${r.biayaUhBiasa.toLocaleString("id-ID")}` : "—"}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono">
                      {r.biayaUhBiasa60 ? `Rp ${r.biayaUhBiasa60.toLocaleString("id-ID")}` : "—"}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono">
                      {r.hotel ? `Rp ${r.hotel.toLocaleString("id-ID")}` : "—"}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono">
                      {r.penginapan30 ? `Rp ${r.penginapan30.toLocaleString("id-ID")}` : "—"}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono">
                      {r.fulldayMeeting || r.fullboardMeeting ? `Rp ${(r.fulldayMeeting + r.fullboardMeeting).toLocaleString("id-ID")}` : "—"}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono">
                      {r.pengRill ? `Rp ${r.pengRill.toLocaleString("id-ID")}` : "—"}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono">
                      {r.tiketDetailPergi?.harga ? `Rp ${r.tiketDetailPergi.harga.toLocaleString("id-ID")}` : "—"}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono">
                      {r.tiketDetailPulang?.harga ? `Rp ${r.tiketDetailPulang.harga.toLocaleString("id-ID")}` : "—"}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono">
                      {r.transportJakartaPp ? `Rp ${r.transportJakartaPp.toLocaleString("id-ID")}` : "—"}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono">
                      {r.transportDaerahPp ? `Rp ${r.transportDaerahPp.toLocaleString("id-ID")}` : "—"}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono">
                      {transTotal ? `Rp ${transTotal.toLocaleString("id-ID")}` : "—"}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono">
                      {r.sewaKendaraan ? `Rp ${r.sewaKendaraan.toLocaleString("id-ID")}` : "—"}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono">
                      {r.representatif ? `Rp ${r.representatif.toLocaleString("id-ID")}` : "—"}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono font-black text-blue-900 bg-blue-50/50">
                      Rp {r.totalJumlah.toLocaleString("id-ID")}
                    </td>
                    <td className="p-2 text-right font-mono text-slate-600">
                      {r.pengembalian ? `Rp ${r.pengembalian.toLocaleString("id-ID")}` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-200/90 font-bold border-t-2 border-slate-300 text-slate-900">
              <tr>
                <td colSpan={5} className="p-2.5 text-center uppercase tracking-wider">
                  Total ({rows.length} Pegawai Terdaftar)
                </td>
                <td colSpan={33} className="p-2.5 text-right">
                  Grand Total Keseluruhan:
                </td>
                <td className="p-2.5 text-right font-mono font-black text-blue-950 bg-blue-100">
                  Rp {grandTotal.toLocaleString("id-ID")}
                </td>
                <td className="p-2.5 text-right font-mono"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
