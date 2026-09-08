"use client";

import React, { useState } from "react";
import {
  ParticipantRow,
  Pegawai,
  SbmRate,
  ActiveCostKey,
  ActiveUhKey,
  HeaderData,
} from "@/lib/types";
import { calculateRowTotal, findSbmByProvince } from "@/lib/calc";
import { ModalTiket, ModalHotel, ModalRiil, ModalSpjExtra } from "./Modals";
import { CurrencyInput } from "./CurrencyInput";
import {
  Users,
  Plus,
  Trash2,
  Plane,
  Hotel,
  DollarSign,
  FileSpreadsheet,
  Zap,
  Copy,
} from "lucide-react";

interface ParticipantGridProps {
  rows: ParticipantRow[];
  setRows: React.Dispatch<React.SetStateAction<ParticipantRow[]>>;
  pegawaiList: Pegawai[];
  sbmList: SbmRate[];
  activeCols: Record<ActiveCostKey, boolean>;
  activeUh: Record<ActiveUhKey, boolean>;
  provinsiTujuan: string;
  header: HeaderData;
}

export const ParticipantGrid: React.FC<ParticipantGridProps> = ({
  rows,
  setRows,
  pegawaiList,
  sbmList,
  activeCols,
  activeUh,
  provinsiTujuan,
  header,
}) => {
  const currentSbm = findSbmByProvince(sbmList, provinsiTujuan);

  // Modal States
  const [modalTiketRow, setModalTiketRow] = useState<ParticipantRow | null>(null);
  const [modalHotelRow, setModalHotelRow] = useState<ParticipantRow | null>(null);
  const [modalRiilRow, setModalRiilRow] = useState<ParticipantRow | null>(null);
  const [modalSpjRow, setModalSpjRow] = useState<ParticipantRow | null>(null);

  const handleUpdateRow = (id: string, updates: Partial<ParticipantRow>) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const merged = { ...r, ...updates };
        return calculateRowTotal(merged, currentSbm, activeUh, activeCols);
      })
    );
  };

  const handleSelectPegawai = (id: string, nama: string) => {
    const found = pegawaiList.find((p) => p.nama === nama);
    if (found) {
      const isOfficial =
        found.jabatan?.toLowerCase().includes("inspektur") ||
        found.jabatan?.toLowerCase().includes("kepala") ||
        found.golongan?.startsWith("IV");

      let defaultSt = header.nomorStStaff || header.nomorStMaster || "";
      if (header.useDifferentStPejabat && header.nomorStPejabat && isOfficial) {
        defaultSt = header.nomorStPejabat;
      }

      handleUpdateRow(id, {
        kodeNama: found.kodeNama,
        nama: found.nama,
        nip: found.nip,
        golongan: found.golongan,
        jabatan: found.jabatan,
        isPejabat: isOfficial,
        nomorSt: defaultSt,
      });
    } else {
      handleUpdateRow(id, {
        kodeNama: "",
        nama: "",
        nip: "",
        golongan: "",
        jabatan: "",
        isPejabat: false,
        nomorSt: "",
      });
    }
  };

  const handleAddRow = () => {
    const nextNum = rows.length + 1;
    const newId = `row_${nextNum}`;
    const newRow: ParticipantRow = {
      id: newId,
      kodeNama: "",
      nama: "",
      nip: "",
      golongan: "",
      jabatan: "",
      tujuanKota: "",
      tujuanProvinsi: provinsiTujuan,
      tanggalMulai: new Date().toISOString().split("T")[0],
      tanggalSelesai: new Date().toISOString().split("T")[0],
      lamaHari: 1,
      nomorSt: "",
      nomorSpd: `${rows.length + 1}`,
      hariUhBiasa: 1,
      biayaUhBiasa: currentSbm?.uhBiasa || 0,
      hariUhBiasa60: 0,
      biayaUhBiasa60: 0,
      hariUhHalfday: 0,
      biayaUhHalfday: 0,
      hariUhFullboard: 0,
      biayaUhFullboard: 0,
      tiket: 0,
      dukunganTransportasi: 0,
      transportasiDarat: 0,
      transportasiLokal: 0,
      transportJakartaPp: 0,
      transportDaerahPp: 0,
      hotel: 0,
      penginapan30: 0,
      fulldayMeeting: 0,
      fullboardMeeting: 0,
      representatif: 0,
      belanjaBahan: 0,
      pengRill: 0,
      riilItems: [],
      totalJumlah: activeUh.uhBiasa ? currentSbm?.uhBiasa || 0 : 0,
    };

    setRows((prev) => [...prev, calculateRowTotal(newRow, currentSbm, activeUh, activeCols)]);
  };

  const handleDuplicateLastRow = () => {
    if (rows.length === 0) return;
    const lastRow = rows[rows.length - 1];
    const nextNum = rows.length + 1;
    const newId = `row_${nextNum}`;
    const newRow: ParticipantRow = {
      ...lastRow,
      id: newId,
      nomorSpd: `${nextNum}`,
      nama: "",
      kodeNama: "",
      nip: "",
      golongan: "",
      jabatan: "",
      isPejabat: false,
    };
    setRows((prev) => [...prev, calculateRowTotal(newRow, currentSbm, activeUh, activeCols)]);
  };

  const handleSyncDatesAndCityToAll = () => {
    if (rows.length <= 1) return;
    const firstRow = rows[0];
    const { tanggalMulai, tanggalSelesai, tujuanKota, tujuanProvinsi } = firstRow;

    setRows((prev) =>
      prev.map((r, idx) => {
        if (idx === 0) return r;
        const merged: ParticipantRow = {
          ...r,
          tanggalMulai,
          tanggalSelesai,
          tujuanKota,
          tujuanProvinsi: tujuanProvinsi || provinsiTujuan,
        };
        return calculateRowTotal(merged, currentSbm, activeUh, activeCols);
      })
    );
  };

  const handleRemoveRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const grandTotal = rows.reduce((acc, r) => acc + (r.totalJumlah || 0), 0);
  const totalHari = rows.reduce((acc, r) => acc + (r.lamaHari || 0), 0);

  return (
    <section className="glass-base rounded-2xl p-4 md:p-6 space-y-4">
      {/* Section Header & Ergonomic Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/70">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center">
            <Users className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs md:text-sm font-bold tracking-tight text-slate-800">
                Rincian Peserta & Perhitungan Biaya
              </h2>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/80">
                {rows.length} pegawai
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Kelola pelaksana dinas, durasi, moda transportasi, dan komponen pengeluaran
            </p>
          </div>
        </div>

        {/* Quick Batch Actions */}
        <div className="flex flex-wrap items-center gap-1.5">
          {rows.length > 1 && (
            <button
              type="button"
              onClick={handleSyncDatesAndCityToAll}
              className="btn-tactile inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 text-xs font-medium cursor-pointer transition-all shadow-2xs"
              title="Salin tanggal dan kota tujuan dari Pegawai Baris 1 ke semua baris peserta lainnya"
            >
              <Zap className="w-3 h-3 text-slate-600" />
              <span>Samakan Tgl & Kota</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDuplicateLastRow}
            className="btn-tactile inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 text-xs font-medium cursor-pointer transition-all shadow-2xs"
            title="Tambah baris baru dengan menyalin pengaturan tanggal, kota, dan transport baris sebelumnya"
          >
            <Copy className="w-3 h-3 text-slate-600" />
            <span>Duplikat Baris</span>
          </button>

          <button
            type="button"
            onClick={handleAddRow}
            className="btn-tactile inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Pegawai</span>
          </button>
        </div>
      </div>

      {/* Process Table Container with Smooth Horizontal Scroll & Sticky Columns */}
      <div className="overflow-x-auto rounded-xl border border-slate-200/70 bg-white/60 shadow-2xs">
        <table className="w-full text-left text-xs border-collapse min-w-max">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200/70 text-slate-600 font-semibold whitespace-nowrap text-[11px]">
              <th className="p-2.5 w-12 min-w-[48px] text-center sticky left-0 bg-slate-50 z-20 shadow-[1px_0_3px_rgba(0,0,0,0.03)]">
                No
              </th>
              <th className="p-2.5 w-64 min-w-[240px] sticky left-12 bg-slate-50 z-20 shadow-[2px_0_4px_rgba(0,0,0,0.04)]">
                Nama Pegawai
              </th>
              <th className="p-2.5 w-44 min-w-[170px]">Gol / Jabatan</th>
              <th className="p-2.5 w-20 min-w-[75px] text-center">No. SPD</th>
              <th className="p-2.5 w-48 min-w-[180px]">Nomor ST</th>
              <th className="p-2.5 w-44 min-w-[160px] text-center">Nomor Komponen</th>
              <th className="p-2.5 w-24 min-w-[95px] text-center">Kode Akun</th>
              <th className="p-2.5 w-36 min-w-[135px]">Kota Tujuan</th>
              <th className="p-2.5 w-32 min-w-[130px]">Tgl Berangkat</th>
              <th className="p-2.5 w-32 min-w-[130px]">Tgl Pulang</th>
              <th className="p-2.5 w-16 min-w-[60px] text-center" title="Lama Perjalanan Dinas Kalender">Durasi</th>

              {/* Dynamic Cost & UH Columns */}
              {activeUh.uhBiasa && <th className="p-2.5 w-48 min-w-[185px] text-right">UH Biasa (Hari & Rp)</th>}
              {activeUh.uhBiasa60 && <th className="p-2.5 w-48 min-w-[185px] text-right">UH 60% (Hari & Rp)</th>}
              {activeUh.uhHalfday && <th className="p-2.5 w-48 min-w-[185px] text-right">UH Halfday (Hari & Rp)</th>}
              {activeUh.uhFullboard && <th className="p-2.5 w-48 min-w-[185px] text-right">UH Fullboard (Hari & Rp)</th>}

              {activeCols.tiket && <th className="p-2.5 w-28 min-w-[110px] text-center">Tiket PP</th>}
              {activeCols.dukunganTransportasi && <th className="p-2.5 w-32 min-w-[125px] text-right">Duk. Transport</th>}
              {activeCols.transportasiDarat && <th className="p-2.5 w-36 min-w-[140px] text-right">Trans. Darat (Rp)</th>}
              {activeCols.transportasiLokal && <th className="p-2.5 w-36 min-w-[140px] text-right">Trans. Lokal (Rp)</th>}
              {activeCols.transportJakartaPp && <th className="p-2.5 w-36 min-w-[140px] text-right">Jakarta PP (Rp)</th>}
              {activeCols.transportDaerahPp && <th className="p-2.5 w-36 min-w-[140px] text-right">Daerah PP (Rp)</th>}
              {activeCols.hotel && <th className="p-2.5 w-28 min-w-[110px] text-center">Hotel</th>}
              {activeCols.penginapan30 && <th className="p-2.5 w-32 min-w-[125px] text-right">Penginapan 30%</th>}
              {activeCols.pengRill && <th className="p-2.5 w-28 min-w-[110px] text-center">Peng. Riil</th>}
              {activeCols.fulldayMeeting && <th className="p-2.5 w-32 min-w-[125px] text-right">Fullday (Rp)</th>}
              {activeCols.fullboardMeeting && <th className="p-2.5 w-32 min-w-[125px] text-right">Fullboard (Rp)</th>}
              {activeCols.representatif && <th className="p-2.5 w-32 min-w-[125px] text-right">Representatif (Rp)</th>}
              {activeCols.belanjaBahan && <th className="p-2.5 w-32 min-w-[125px] text-right">Belanja Bahan</th>}

              <th className="p-2.5 w-36 min-w-[145px] text-right font-bold text-slate-800 bg-slate-100/70">
                Total Jumlah
              </th>
              <th className="p-2.5 w-12 min-w-[48px] text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60">
            {rows.map((row, idx) => (
              <tr
                key={row.id}
                className="hover:bg-white/80 transition-colors duration-150 group"
              >
                {/* No (Sticky) */}
                <td className="p-2.5 text-center font-medium text-slate-400 sticky left-0 bg-white/95 group-hover:bg-slate-50/95 z-10 shadow-[1px_0_3px_rgba(0,0,0,0.03)] text-xs">
                  {idx + 1}
                </td>

                {/* Nama Pegawai Dropdown (Sticky) */}
                <td className="p-2 w-64 min-w-[240px] sticky left-12 bg-white/95 group-hover:bg-slate-50/95 z-10 shadow-[2px_0_4px_rgba(0,0,0,0.04)]">
                  <select
                    value={row.nama}
                    onChange={(e) => handleSelectPegawai(row.id, e.target.value)}
                    className="input-glass w-full h-8 px-2 font-semibold text-slate-900 text-xs cursor-pointer"
                  >
                    <option value="">-- Pilih Pegawai --</option>
                    {pegawaiList.map((p) => (
                      <option key={p.kodeNama} value={p.nama}>
                        {p.nama}
                      </option>
                    ))}
                  </select>
                  {row.nip ? (
                    <span className="block text-[10px] font-mono text-slate-400 pl-1 pt-0.5 whitespace-nowrap">
                      NIP. {row.nip}
                    </span>
                  ) : null}
                </td>

                {/* Gol / Jabatan */}
                <td className="p-2 w-44 min-w-[170px]">
                  {row.nama ? (
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 shrink-0">
                        {row.golongan || "—"}
                      </span>
                      <span className="text-[11px] text-slate-600 truncate max-w-[110px]" title={row.jabatan}>
                        {row.jabatan || "Pelaksana"}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-300 italic text-[11px]">—</span>
                  )}
                </td>

                {/* No. SPD */}
                <td className="p-2 w-20 min-w-[75px]">
                  <input
                    type="text"
                    value={row.nomorSpd || ""}
                    onChange={(e) => handleUpdateRow(row.id, { nomorSpd: e.target.value })}
                    placeholder="01"
                    className="input-glass w-full h-8 px-1.5 text-center font-mono font-semibold text-xs"
                  />
                </td>

                {/* Nomor ST */}
                <td className="p-2 w-48 min-w-[180px]">
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={row.nomorSt || ""}
                      onChange={(e) => handleUpdateRow(row.id, { nomorSt: e.target.value })}
                      placeholder={header.nomorStStaff || header.nomorStMaster || "ST-..."}
                      className="input-glass w-full h-8 px-2 font-mono text-[11px] font-normal"
                    />
                    {header.useDifferentStPejabat && (
                      <div className="flex items-center gap-1 text-[9px]">
                        <span className="text-slate-400">Pilih:</span>
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateRow(row.id, {
                              isPejabat: false,
                              nomorSt: header.nomorStStaff || header.nomorStMaster || "",
                            })
                          }
                          className={`px-1.5 py-0.5 rounded transition-all cursor-pointer font-medium ${
                            !row.isPejabat
                              ? "bg-[#0071e3] text-white font-semibold"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          }`}
                        >
                          ST Staf
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateRow(row.id, {
                              isPejabat: true,
                              nomorSt: header.nomorStPejabat || header.nomorStStaff || header.nomorStMaster || "",
                            })
                          }
                          className={`px-1.5 py-0.5 rounded transition-all cursor-pointer font-medium ${
                            row.isPejabat
                              ? "bg-[#0071e3] text-white font-semibold"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          ST Pejabat
                        </button>
                      </div>
                    )}
                  </div>
                </td>

                {/* Nomor Komponen */}
                <td className="p-2 w-44 min-w-[160px] text-center font-mono text-slate-700">
                  <span
                    className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200/80 text-[11px] font-medium"
                    title={header.nomorKomp || "Belum dipilih"}
                  >
                    {header.nomorKomp || "-"}
                  </span>
                </td>

                {/* Kode Akun */}
                <td className="p-2 w-24 min-w-[95px] text-center font-mono text-slate-700">
                  <span
                    className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200/80 text-[11px]"
                    title={header.nomorMak || "Belum dipilih"}
                  >
                    {header.nomorMak || "-"}
                  </span>
                </td>

                {/* Kota Tujuan */}
                <td className="p-2 w-36 min-w-[135px]">
                  <select
                    value={row.tujuanKota || header.kotaTujuanList?.[0] || ""}
                    onChange={(e) => handleUpdateRow(row.id, { tujuanKota: e.target.value })}
                    className="input-glass w-full h-8 px-2 text-xs font-medium cursor-pointer"
                  >
                    {(header.kotaTujuanList || []).filter(Boolean).length > 0 ? (
                      (header.kotaTujuanList || []).filter(Boolean).map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))
                    ) : (
                      <option value={header.provinsiTujuan}>{header.provinsiTujuan}</option>
                    )}
                  </select>
                </td>

                {/* Tgl Berangkat */}
                <td className="p-2 w-32 min-w-[130px]">
                  <input
                    type="date"
                    value={row.tanggalMulai}
                    onChange={(e) => handleUpdateRow(row.id, { tanggalMulai: e.target.value })}
                    className="input-glass w-full h-8 px-1.5 text-xs cursor-pointer"
                  />
                </td>

                {/* Tgl Pulang */}
                <td className="p-2 w-32 min-w-[130px]">
                  <input
                    type="date"
                    value={row.tanggalSelesai}
                    onChange={(e) => handleUpdateRow(row.id, { tanggalSelesai: e.target.value })}
                    className="input-glass w-full h-8 px-1.5 text-xs cursor-pointer"
                  />
                </td>

                {/* Durasi Perjalanan Dinas */}
                <td className="p-2 w-16 min-w-[60px] text-center font-mono font-medium text-slate-700">
                  {row.lamaHari} hr
                </td>

                {/* UH Biasa */}
                {activeUh.uhBiasa && (
                  <td className="p-2 w-48 min-w-[185px] text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <div className="flex items-center gap-0.5 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/80 shadow-2xs" title="Jumlah hari uang harian yang dibayarkan">
                        <input
                          type="number"
                          min={0}
                          value={row.hariUhBiasa !== undefined ? row.hariUhBiasa : row.lamaHari}
                          onChange={(e) => {
                            const newHari = Math.max(0, parseInt(e.target.value) || 0);
                            const rate = currentSbm?.uhBiasa || 0;
                            handleUpdateRow(row.id, {
                              hariUhBiasa: newHari,
                              biayaUhBiasa: newHari * rate,
                            });
                          }}
                          className="w-8 h-5 text-center font-mono font-bold text-xs bg-transparent focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-400 font-medium">hr</span>
                      </div>
                      <div className="relative flex items-center bg-[#f1f3f5] focus-within:bg-white border border-slate-200 focus-within:border-slate-800 rounded px-1.5 py-0.5 shadow-2xs transition-all">
                        <span className="text-[10px] text-slate-400 font-medium mr-1 select-none">Rp</span>
                        <CurrencyInput
                          value={row.biayaUhBiasa}
                          onChange={(val) => handleUpdateRow(row.id, { biayaUhBiasa: val })}
                          className="w-20 text-right font-mono font-medium text-xs bg-transparent focus:outline-none text-slate-900"
                          placeholder="0"
                          title="Nominal Uang Harian (Editable: dapat disesuaikan bila dipotong uang makan/lainnya)"
                        />
                      </div>
                    </div>
                  </td>
                )}

                {/* UH 60% */}
                {activeUh.uhBiasa60 && (
                  <td className="p-2 w-48 min-w-[185px] text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <div className="flex items-center gap-0.5 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/80 shadow-2xs" title="Jumlah hari UH 60% yang dibayarkan">
                        <input
                          type="number"
                          min={0}
                          value={row.hariUhBiasa60 !== undefined ? row.hariUhBiasa60 : row.lamaHari}
                          onChange={(e) => {
                            const newHari = Math.max(0, parseInt(e.target.value) || 0);
                            const rate = currentSbm?.uhBiasa || 0;
                            handleUpdateRow(row.id, {
                              hariUhBiasa60: newHari,
                              biayaUhBiasa60: Math.round(newHari * rate * 0.6),
                            });
                          }}
                          className="w-8 h-5 text-center font-mono font-bold text-xs bg-transparent focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-400 font-medium">hr</span>
                      </div>
                      <div className="relative flex items-center bg-[#f1f3f5] focus-within:bg-white border border-slate-200 focus-within:border-slate-800 rounded px-1.5 py-0.5 shadow-2xs transition-all">
                        <span className="text-[10px] text-slate-400 font-medium mr-1 select-none">Rp</span>
                        <CurrencyInput
                          value={row.biayaUhBiasa60}
                          onChange={(val) => handleUpdateRow(row.id, { biayaUhBiasa60: val })}
                          className="w-20 text-right font-mono font-medium text-xs bg-transparent focus:outline-none text-slate-900"
                          placeholder="0"
                          title="Nominal UH 60% (Editable: dapat disesuaikan)"
                        />
                      </div>
                    </div>
                  </td>
                )}

                {/* UH Halfday */}
                {activeUh.uhHalfday && (
                  <td className="p-2 w-48 min-w-[185px] text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <div className="flex items-center gap-0.5 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/80 shadow-2xs" title="Jumlah hari UH Halfday yang dibayarkan">
                        <input
                          type="number"
                          min={0}
                          value={row.hariUhHalfday !== undefined ? row.hariUhHalfday : row.lamaHari}
                          onChange={(e) => {
                            const newHari = Math.max(0, parseInt(e.target.value) || 0);
                            const rate = currentSbm?.uhHalfday || 0;
                            handleUpdateRow(row.id, {
                              hariUhHalfday: newHari,
                              biayaUhHalfday: newHari * rate,
                            });
                          }}
                          className="w-8 h-5 text-center font-mono font-bold text-xs bg-transparent focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-400 font-medium">hr</span>
                      </div>
                      <div className="relative flex items-center bg-[#f1f3f5] focus-within:bg-white border border-slate-200 focus-within:border-slate-800 rounded px-1.5 py-0.5 shadow-2xs transition-all">
                        <span className="text-[10px] text-slate-400 font-medium mr-1 select-none">Rp</span>
                        <CurrencyInput
                          value={row.biayaUhHalfday}
                          onChange={(val) => handleUpdateRow(row.id, { biayaUhHalfday: val })}
                          className="w-20 text-right font-mono font-medium text-xs bg-transparent focus:outline-none text-slate-900"
                          placeholder="0"
                          title="Nominal UH Halfday (Editable: dapat disesuaikan)"
                        />
                      </div>
                    </div>
                  </td>
                )}

                {/* UH Fullboard */}
                {activeUh.uhFullboard && (
                  <td className="p-2 w-48 min-w-[185px] text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <div className="flex items-center gap-0.5 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/80 shadow-2xs" title="Jumlah hari UH Fullboard yang dibayarkan">
                        <input
                          type="number"
                          min={0}
                          value={row.hariUhFullboard !== undefined ? row.hariUhFullboard : row.lamaHari}
                          onChange={(e) => {
                            const newHari = Math.max(0, parseInt(e.target.value) || 0);
                            const rate = currentSbm?.uhFullboard || 0;
                            handleUpdateRow(row.id, {
                              hariUhFullboard: newHari,
                              biayaUhFullboard: newHari * rate,
                            });
                          }}
                          className="w-8 h-5 text-center font-mono font-bold text-xs bg-transparent focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-400 font-medium">hr</span>
                      </div>
                      <div className="relative flex items-center bg-[#f1f3f5] focus-within:bg-white border border-slate-200 focus-within:border-slate-800 rounded px-1.5 py-0.5 shadow-2xs transition-all">
                        <span className="text-[10px] text-slate-400 font-medium mr-1 select-none">Rp</span>
                        <CurrencyInput
                          value={row.biayaUhFullboard}
                          onChange={(val) => handleUpdateRow(row.id, { biayaUhFullboard: val })}
                          className="w-20 text-right font-mono font-medium text-xs bg-transparent focus:outline-none text-slate-900"
                          placeholder="0"
                          title="Nominal UH Fullboard (Editable: dapat disesuaikan)"
                        />
                      </div>
                    </div>
                  </td>
                )}

                {/* Tiket Modal Trigger */}
                {activeCols.tiket && (
                  <td className="p-2 w-28 min-w-[110px] text-center">
                    <button
                      type="button"
                      onClick={() => setModalTiketRow(row)}
                      className={`btn-tactile inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer border transition-all ${
                        row.tiket > 0
                          ? "bg-slate-100 border-slate-300 text-slate-800 font-semibold"
                          : "glass-control text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          row.tiket > 0 ? "bg-[#0071e3]" : "bg-slate-300"
                        }`}
                      />
                      <Plane className="w-3 h-3 text-slate-500" />
                      <span>{row.tiket > 0 ? `Rp ${(row.tiket / 1000).toFixed(0)}k` : "Input"}</span>
                    </button>
                  </td>
                )}

                {/* Dukungan Transport */}
                {activeCols.dukunganTransportasi && (
                  <td className="p-2 w-32 min-w-[125px]">
                    <CurrencyInput
                      value={row.dukunganTransportasi}
                      onChange={(val) => handleUpdateRow(row.id, { dukunganTransportasi: val })}
                      className="input-glass w-full h-8 px-2 text-right font-mono font-medium text-xs"
                      placeholder="0"
                    />
                  </td>
                )}

                {/* Trans. Darat */}
                {activeCols.transportasiDarat && (
                  <td className="p-2 w-36 min-w-[140px]">
                    <CurrencyInput
                      value={row.transportasiDarat}
                      onChange={(val) => handleUpdateRow(row.id, { transportasiDarat: val })}
                      className="input-glass w-full h-8 px-2 text-right font-mono font-medium text-xs"
                      placeholder="0"
                    />
                  </td>
                )}

                {/* Trans. Lokal */}
                {activeCols.transportasiLokal && (
                  <td className="p-2 w-36 min-w-[140px]">
                    <CurrencyInput
                      value={row.transportasiLokal}
                      onChange={(val) => handleUpdateRow(row.id, { transportasiLokal: val })}
                      className="input-glass w-full h-8 px-2 text-right font-mono font-medium text-xs"
                      placeholder="0"
                    />
                  </td>
                )}

                {/* Trans. Jakarta PP */}
                {activeCols.transportJakartaPp && (
                  <td className="p-2 w-36 min-w-[140px]">
                    <CurrencyInput
                      value={row.transportJakartaPp}
                      onChange={(val) => handleUpdateRow(row.id, { transportJakartaPp: val })}
                      className="input-glass w-full h-8 px-2 text-right font-mono font-medium text-xs"
                      placeholder="0"
                    />
                  </td>
                )}

                {/* Trans. Daerah PP */}
                {activeCols.transportDaerahPp && (
                  <td className="p-2 w-36 min-w-[140px]">
                    <CurrencyInput
                      value={row.transportDaerahPp}
                      onChange={(val) => handleUpdateRow(row.id, { transportDaerahPp: val })}
                      className="input-glass w-full h-8 px-2 text-right font-mono font-medium text-xs"
                      placeholder="0"
                    />
                  </td>
                )}

                {/* Hotel Modal Trigger */}
                {activeCols.hotel && (
                  <td className="p-2 w-28 min-w-[110px] text-center">
                    <button
                      type="button"
                      onClick={() => setModalHotelRow(row)}
                      className={`btn-tactile inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer border transition-all ${
                        row.hotel > 0
                          ? "bg-slate-100 border-slate-300 text-slate-800 font-semibold"
                          : "glass-control text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          row.hotel > 0 ? "bg-[#0071e3]" : "bg-slate-300"
                        }`}
                      />
                      <Hotel className="w-3 h-3 text-slate-500" />
                      <span>{row.hotel > 0 ? `Rp ${(row.hotel / 1000).toFixed(0)}k` : "Input"}</span>
                    </button>
                  </td>
                )}

                {/* Penginapan 30% */}
                {activeCols.penginapan30 && (
                  <td className="p-2 w-32 min-w-[125px] text-right font-mono font-medium text-slate-800 whitespace-nowrap">
                    Rp {(row.penginapan30 || 0).toLocaleString("id-ID")}
                  </td>
                )}

                {/* Peng. Riil Modal Trigger */}
                {activeCols.pengRill && (
                  <td className="p-2 w-28 min-w-[110px] text-center">
                    <button
                      type="button"
                      onClick={() => setModalRiilRow(row)}
                      className={`btn-tactile inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer border transition-all ${
                        row.pengRill > 0
                          ? "bg-slate-100 border-slate-300 text-slate-800 font-semibold"
                          : "glass-control text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          row.pengRill > 0 ? "bg-[#0071e3]" : "bg-slate-300"
                        }`}
                      />
                      <DollarSign className="w-3 h-3 text-slate-500" />
                      <span>{row.pengRill > 0 ? `Rp ${(row.pengRill / 1000).toFixed(0)}k` : "Input"}</span>
                    </button>
                  </td>
                )}

                {/* Fullday */}
                {activeCols.fulldayMeeting && (
                  <td className="p-2 w-32 min-w-[125px]">
                    <CurrencyInput
                      value={row.fulldayMeeting}
                      onChange={(val) => handleUpdateRow(row.id, { fulldayMeeting: val })}
                      className="input-glass w-full h-8 px-2 text-right font-mono font-medium text-xs"
                      placeholder="0"
                    />
                  </td>
                )}

                {/* Fullboard */}
                {activeCols.fullboardMeeting && (
                  <td className="p-2 w-32 min-w-[125px]">
                    <CurrencyInput
                      value={row.fullboardMeeting}
                      onChange={(val) => handleUpdateRow(row.id, { fullboardMeeting: val })}
                      className="input-glass w-full h-8 px-2 text-right font-mono font-medium text-xs"
                      placeholder="0"
                    />
                  </td>
                )}

                {/* Representatif */}
                {activeCols.representatif && (
                  <td className="p-2 w-32 min-w-[125px]">
                    <CurrencyInput
                      value={row.representatif}
                      onChange={(val) => handleUpdateRow(row.id, { representatif: val })}
                      className="input-glass w-full h-8 px-2 text-right font-mono font-medium text-xs"
                      placeholder="0"
                    />
                  </td>
                )}

                {/* Belanja Bahan */}
                {activeCols.belanjaBahan && (
                  <td className="p-2 w-32 min-w-[125px]">
                    <CurrencyInput
                      value={row.belanjaBahan}
                      onChange={(val) => handleUpdateRow(row.id, { belanjaBahan: val })}
                      className="input-glass w-full h-8 px-2 text-right font-mono font-medium text-xs"
                      placeholder="0"
                    />
                  </td>
                )}

                {/* Total Jumlah Row */}
                <td className="p-2.5 w-36 min-w-[145px] text-right font-mono font-bold text-slate-900 bg-slate-100/50 whitespace-nowrap text-xs">
                  Rp {row.totalJumlah.toLocaleString("id-ID")}
                </td>

                {/* Actions (SPJ Details & Delete) */}
                <td className="p-2 w-12 min-w-[48px] text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      onClick={() => setModalSpjRow(row)}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
                      title="Edit Data Tambahan SPJ & Rekap Perdin"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                    </button>
                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(row.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                        title="Hapus Pegawai Ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100/80 border-t border-slate-200 text-slate-700 font-semibold text-xs whitespace-nowrap">
              <td colSpan={11} className="p-3 text-right">
                Total Keseluruhan ({rows.length} Pegawai): &nbsp;&nbsp;
                <span className="font-mono text-slate-900">{totalHari} hr</span>
              </td>
              <td colSpan={100} className="p-3 text-right font-mono font-bold text-sm text-slate-900">
                Rp {grandTotal.toLocaleString("id-ID")}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Modals Container */}
      {modalTiketRow && (
        <ModalTiket
          row={modalTiketRow}
          isOpen={true}
          onClose={() => setModalTiketRow(null)}
          onSave={(total, pergi, pulang, boardingPass) => {
            handleUpdateRow(modalTiketRow.id, {
              tiket: total,
              tiketDetailPergi: pergi,
              tiketDetailPulang: pulang,
              boardingPass: boardingPass,
            });
            setModalTiketRow(null);
          }}
        />
      )}

      {modalHotelRow && (
        <ModalHotel
          row={modalHotelRow}
          isOpen={true}
          onClose={() => setModalHotelRow(null)}
          onSave={(
            total,
            namaHotel,
            rate,
            malam,
            checkIn,
            checkOut,
            kotaHotel,
            noBillFolio,
            noKamar
          ) => {
            handleUpdateRow(modalHotelRow.id, {
              hotel: total,
              namaHotel: namaHotel,
              rateHotel: rate,
              malamHotel: malam,
              checkInHotel: checkIn,
              checkOutHotel: checkOut,
              kotaHotel: kotaHotel,
              noBillFolio: noBillFolio,
              noKamar: noKamar,
            });
            setModalHotelRow(null);
          }}
        />
      )}

      {modalRiilRow && (
        <ModalRiil
          row={modalRiilRow}
          isOpen={true}
          onClose={() => setModalRiilRow(null)}
          onSave={(items) => {
            const totalRiil = items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
            handleUpdateRow(modalRiilRow.id, {
              riilItems: items,
              pengRill: totalRiil,
            });
            setModalRiilRow(null);
          }}
        />
      )}

      {modalSpjRow && (
        <ModalSpjExtra
          row={modalSpjRow}
          isOpen={true}
          onClose={() => setModalSpjRow(null)}
          onSave={(data) => {
            handleUpdateRow(modalSpjRow.id, {
              namaExternal: data.namaExternal,
              sewaKendaraan: data.sewaKendaraan,
              taksiBandara: data.taksiBandara,
              biayaReschedule: data.biayaReschedule,
              kurs: data.kurs,
              pengembalian: data.pengembalian,
            });
            setModalSpjRow(null);
          }}
        />
      )}
    </section>
  );
};
