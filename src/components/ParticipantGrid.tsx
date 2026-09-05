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
import {
  Users,
  Plus,
  Trash2,
  Plane,
  Hotel,
  DollarSign,
  FileSpreadsheet,
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
    <section className="glass-base rounded-3xl p-6 md:p-8 space-y-5">
      {/* Section Header & Ergonomic Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-700 flex items-center justify-center border border-blue-500/20">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-tight text-slate-900">
                3. Tabel Rincian Peserta & Kalkulasi Biaya (Proses)
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {rows.length} Pegawai
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Pilih pegawai pelaksana dinas, tanggal keberangkatan, rincian transportasi, dan pengeluaran terkait
            </p>
          </div>
        </div>

        {/* Quick Batch Actions (Click Minimization) */}
        <div className="flex flex-wrap items-center gap-2">
          {rows.length > 1 && (
            <button
              type="button"
              onClick={handleSyncDatesAndCityToAll}
              className="btn-tactile flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 text-[11px] font-bold cursor-pointer transition-all shadow-2xs"
              title="Salin tanggal dan kota tujuan dari Pegawai Baris 1 ke semua baris peserta lainnya"
            >
              <span>⚡</span>
              <span>Samakan Tgl & Kota Baris 1 ke Semua</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDuplicateLastRow}
            className="btn-tactile flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white text-slate-800 border border-slate-300/80 text-[11px] font-semibold cursor-pointer transition-all shadow-2xs"
            title="Tambah baris baru dengan menyalin pengaturan tanggal, kota, dan transport baris sebelumnya"
          >
            <span>📋</span>
            <span>Duplikat Baris</span>
          </button>

          <button
            type="button"
            onClick={handleAddRow}
            className="btn-tactile flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-sm shadow-blue-600/20 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Pegawai</span>
          </button>
        </div>
      </div>

      {/* Process Table Container with Smooth Horizontal Scroll & Sticky Columns */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white/40 backdrop-blur-md shadow-inner">
        <table className="w-full text-left text-xs border-collapse min-w-max">
          <thead>
            <tr className="bg-slate-100/90 border-b border-slate-200/80 text-slate-700 font-bold whitespace-nowrap">
              <th className="p-3 w-12 min-w-[48px] text-center sticky left-0 bg-slate-100/95 z-20 shadow-[1px_0_3px_rgba(0,0,0,0.03)]">
                No
              </th>
              <th className="p-3 w-64 min-w-[240px] sticky left-12 bg-slate-100/95 z-20 shadow-[3px_0_6px_rgba(0,0,0,0.05)]">
                Nama Pegawai
              </th>
              <th className="p-3 w-48 min-w-[180px]">Gol / Jabatan</th>
              <th className="p-3 w-20 min-w-[80px] text-center">No. SPD</th>
              <th className="p-3 w-48 min-w-[190px]">Nomor ST</th>
              <th className="p-3 w-28 min-w-[110px] text-center">Kode Akun</th>
              <th className="p-3 w-36 min-w-[140px]">Kota Tujuan</th>
              <th className="p-3 w-36 min-w-[135px]">Tgl Berangkat</th>
              <th className="p-3 w-36 min-w-[135px]">Tgl Pulang</th>
              <th className="p-3 w-20 min-w-[70px] text-center">Hari</th>

              {/* Dynamic Cost & UH Columns */}
              {activeUh.uhBiasa && <th className="p-3 w-36 min-w-[135px] text-right">UH Biasa (Rp)</th>}
              {activeUh.uhBiasa60 && <th className="p-3 w-36 min-w-[135px] text-right">UH 60% (Rp)</th>}
              {activeUh.uhHalfday && <th className="p-3 w-36 min-w-[135px] text-right">UH Halfday (Rp)</th>}
              {activeUh.uhFullboard && <th className="p-3 w-36 min-w-[135px] text-right">UH Fullboard (Rp)</th>}

              {activeCols.tiket && <th className="p-3 w-32 min-w-[120px] text-center">Tiket PP</th>}
              {activeCols.dukunganTransportasi && <th className="p-3 w-36 min-w-[135px] text-right">Duk. Transport</th>}
              {activeCols.transportasiDarat && <th className="p-3 w-40 min-w-[150px] text-right">Trans. Darat (Rp)</th>}
              {activeCols.transportasiLokal && <th className="p-3 w-40 min-w-[150px] text-right">Trans. Lokal (Rp)</th>}
              {activeCols.transportJakartaPp && <th className="p-3 w-40 min-w-[150px] text-right">Trans. Jakarta PP (Rp)</th>}
              {activeCols.transportDaerahPp && <th className="p-3 w-40 min-w-[150px] text-right">Trans. Daerah PP (Rp)</th>}
              {activeCols.hotel && <th className="p-3 w-32 min-w-[120px] text-center">Hotel</th>}
              {activeCols.penginapan30 && <th className="p-3 w-36 min-w-[135px] text-right">Penginapan 30%</th>}
              {activeCols.pengRill && <th className="p-3 w-32 min-w-[120px] text-center">Peng. Riil</th>}
              {activeCols.fulldayMeeting && <th className="p-3 w-36 min-w-[135px] text-right">Fullday (Rp)</th>}
              {activeCols.fullboardMeeting && <th className="p-3 w-36 min-w-[135px] text-right">Fullboard (Rp)</th>}
              {activeCols.representatif && <th className="p-3 w-36 min-w-[135px] text-right">Representatif (Rp)</th>}
              {activeCols.belanjaBahan && <th className="p-3 w-36 min-w-[135px] text-right">Belanja Bahan</th>}

              <th className="p-3 w-44 min-w-[165px] text-right font-black text-slate-900 bg-blue-50/70">
                Total Jumlah
              </th>
              <th className="p-3 w-12 min-w-[48px] text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60">
            {rows.map((row, idx) => (
              <tr
                key={row.id}
                className="hover:bg-white/60 transition-colors duration-150 group"
              >
                {/* No (Sticky) */}
                <td className="p-3 text-center font-bold text-slate-500 sticky left-0 bg-white/95 group-hover:bg-slate-50/95 z-10 shadow-[1px_0_3px_rgba(0,0,0,0.03)]">
                  {idx + 1}
                </td>

                {/* Nama Pegawai Dropdown (Sticky) */}
                <td className="p-2 w-64 min-w-[240px] sticky left-12 bg-white/95 group-hover:bg-slate-50/95 z-10 shadow-[3px_0_6px_rgba(0,0,0,0.05)]">
                  <select
                    value={row.nama}
                    onChange={(e) => handleSelectPegawai(row.id, e.target.value)}
                    className="input-glass w-full h-9 px-2.5 font-bold text-slate-900 text-xs cursor-pointer"
                  >
                    <option value="">-- Pilih Pegawai --</option>
                    {pegawaiList.map((p) => (
                      <option key={p.kodeNama} value={p.nama}>
                        {p.nama}
                      </option>
                    ))}
                  </select>
                  {row.nip ? (
                    <span className="block text-[10px] font-mono text-slate-500 pl-1 pt-0.5 whitespace-nowrap">
                      NIP. {row.nip}
                    </span>
                  ) : null}
                </td>

                {/* Gol / Jabatan */}
                <td className="p-2 w-44 min-w-[170px]">
                  {row.nama ? (
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[11px] px-2 py-0.5 rounded-md bg-slate-200/70 border border-slate-300/60 text-slate-800 shrink-0">
                        {row.golongan || "—"}
                      </span>
                      <span className="text-[11px] text-slate-700 truncate max-w-[110px] font-medium" title={row.jabatan}>
                        {row.jabatan || "Pelaksana"}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic text-[11px]">—</span>
                  )}
                </td>

                {/* No. SPD */}
                <td className="p-2 w-20 min-w-[80px]">
                  <input
                    type="text"
                    value={row.nomorSpd || ""}
                    onChange={(e) => handleUpdateRow(row.id, { nomorSpd: e.target.value })}
                    placeholder="01"
                    className="input-glass w-full h-8 px-2 text-center font-mono font-bold text-xs"
                  />
                </td>

                {/* Nomor ST */}
                <td className="p-2 w-52 min-w-[200px]">
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={row.nomorSt || ""}
                      onChange={(e) => handleUpdateRow(row.id, { nomorSt: e.target.value })}
                      placeholder={header.nomorStStaff || header.nomorStMaster || "ST-..."}
                      className="input-glass w-full h-8 px-2 font-mono text-[11px] font-medium"
                    />
                    {header.useDifferentStPejabat && (
                      <div className="flex items-center gap-1 text-[9px]">
                        <span className="text-slate-400 font-medium">Pilih:</span>
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateRow(row.id, {
                              isPejabat: false,
                              nomorSt: header.nomorStStaff || header.nomorStMaster || "",
                            })
                          }
                          className={`px-1.5 py-0.5 rounded transition-all cursor-pointer font-bold ${
                            !row.isPejabat
                              ? "bg-slate-700 text-white shadow-2xs"
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
                          className={`px-1.5 py-0.5 rounded transition-all cursor-pointer font-bold ${
                            row.isPejabat
                              ? "bg-blue-600 text-white shadow-2xs"
                              : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                          }`}
                        >
                          ST Pejabat
                        </button>
                      </div>
                    )}
                  </div>
                </td>

                {/* Kode Akun */}
                <td className="p-2 w-28 min-w-[110px] text-center font-mono font-bold text-slate-800">
                  <span className="px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs">
                    {header.nomorMak || "524111"}
                  </span>
                </td>

                {/* Kota Tujuan */}
                <td className="p-2 w-36 min-w-[140px]">
                  <select
                    value={row.tujuanKota || header.kotaTujuanList?.[0] || ""}
                    onChange={(e) => handleUpdateRow(row.id, { tujuanKota: e.target.value })}
                    className="input-glass w-full h-8 px-2 text-xs font-semibold cursor-pointer"
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
                <td className="p-2 w-36 min-w-[135px]">
                  <input
                    type="date"
                    value={row.tanggalMulai}
                    onChange={(e) => handleUpdateRow(row.id, { tanggalMulai: e.target.value })}
                    className="input-glass w-full h-8 px-2 text-xs cursor-pointer"
                  />
                </td>

                {/* Tgl Pulang */}
                <td className="p-2 w-36 min-w-[135px]">
                  <input
                    type="date"
                    value={row.tanggalSelesai}
                    onChange={(e) => handleUpdateRow(row.id, { tanggalSelesai: e.target.value })}
                    className="input-glass w-full h-8 px-2 text-xs cursor-pointer"
                  />
                </td>

                {/* Lama Hari */}
                <td className="p-2 w-20 min-w-[70px] text-center font-bold text-slate-800">
                  {row.lamaHari} hr
                </td>

                {/* UH Biasa */}
                {activeUh.uhBiasa && (
                  <td className="p-2 w-36 min-w-[135px] text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                    Rp {row.biayaUhBiasa.toLocaleString("id-ID")}
                  </td>
                )}

                {/* UH 60% */}
                {activeUh.uhBiasa60 && (
                  <td className="p-2 w-36 min-w-[135px] text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                    Rp {row.biayaUhBiasa60.toLocaleString("id-ID")}
                  </td>
                )}

                {/* UH Halfday */}
                {activeUh.uhHalfday && (
                  <td className="p-2 w-36 min-w-[135px] text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                    Rp {row.biayaUhHalfday.toLocaleString("id-ID")}
                  </td>
                )}

                {/* UH Fullboard */}
                {activeUh.uhFullboard && (
                  <td className="p-2 w-36 min-w-[135px] text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                    Rp {row.biayaUhFullboard.toLocaleString("id-ID")}
                  </td>
                )}

                {/* Tiket Modal Trigger */}
                {activeCols.tiket && (
                  <td className="p-2 w-32 min-w-[120px] text-center">
                    <button
                      type="button"
                      onClick={() => setModalTiketRow(row)}
                      className={`btn-tactile px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 mx-auto cursor-pointer border ${
                        row.tiket > 0
                          ? "bg-blue-50/80 border-blue-300 text-blue-800 font-bold"
                          : "glass-control text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Plane className="w-3 h-3" />
                      <span>{row.tiket > 0 ? `Rp ${(row.tiket / 1000).toFixed(0)}k` : "Input"}</span>
                    </button>
                  </td>
                )}

                {/* Dukungan Transport */}
                {activeCols.dukunganTransportasi && (
                  <td className="p-2 w-36 min-w-[135px]">
                    <input
                      type="number"
                      value={row.dukunganTransportasi || ""}
                      onChange={(e) => handleUpdateRow(row.id, { dukunganTransportasi: parseFloat(e.target.value) || 0 })}
                      className="input-glass w-full h-8 px-2 text-right font-mono font-bold text-xs"
                      placeholder="0"
                    />
                  </td>
                )}

                {/* Trans. Darat */}
                {activeCols.transportasiDarat && (
                  <td className="p-2 w-40 min-w-[150px]">
                    <input
                      type="number"
                      value={row.transportasiDarat || ""}
                      onChange={(e) => handleUpdateRow(row.id, { transportasiDarat: parseFloat(e.target.value) || 0 })}
                      className="input-glass w-full h-8 px-2 text-right font-mono font-bold text-xs"
                      placeholder="0"
                    />
                  </td>
                )}

                {/* Trans. Lokal */}
                {activeCols.transportasiLokal && (
                  <td className="p-2 w-40 min-w-[150px]">
                    <input
                      type="number"
                      value={row.transportasiLokal || ""}
                      onChange={(e) => handleUpdateRow(row.id, { transportasiLokal: parseFloat(e.target.value) || 0 })}
                      className="input-glass w-full h-8 px-2 text-right font-mono font-bold text-xs"
                      placeholder="0"
                    />
                  </td>
                )}

                {/* Trans. Jakarta PP */}
                {activeCols.transportJakartaPp && (
                  <td className="p-2 w-40 min-w-[150px]">
                    <input
                      type="number"
                      value={row.transportJakartaPp || ""}
                      onChange={(e) => handleUpdateRow(row.id, { transportJakartaPp: parseFloat(e.target.value) || 0 })}
                      className="input-glass w-full h-8 px-2 text-right font-mono font-bold text-xs"
                      placeholder="0"
                    />
                  </td>
                )}

                {/* Trans. Daerah PP */}
                {activeCols.transportDaerahPp && (
                  <td className="p-2 w-40 min-w-[150px]">
                    <input
                      type="number"
                      value={row.transportDaerahPp || ""}
                      onChange={(e) => handleUpdateRow(row.id, { transportDaerahPp: parseFloat(e.target.value) || 0 })}
                      className="input-glass w-full h-8 px-2 text-right font-mono font-bold text-xs"
                      placeholder="0"
                    />
                  </td>
                )}

                {/* Hotel Modal Trigger */}
                {activeCols.hotel && (
                  <td className="p-2 w-32 min-w-[120px] text-center">
                    <button
                      type="button"
                      onClick={() => setModalHotelRow(row)}
                      className={`btn-tactile px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 mx-auto cursor-pointer border ${
                        row.hotel > 0
                          ? "bg-amber-50/80 border-amber-300 text-amber-800 font-bold"
                          : "glass-control text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Hotel className="w-3 h-3" />
                      <span>{row.hotel > 0 ? `Rp ${(row.hotel / 1000).toFixed(0)}k` : "Input"}</span>
                    </button>
                  </td>
                )}

                {/* Penginapan 30% */}
                {activeCols.penginapan30 && (
                  <td className="p-2 w-36 min-w-[135px] text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                    Rp {(row.penginapan30 || 0).toLocaleString("id-ID")}
                  </td>
                )}

                {/* Peng. Riil Modal Trigger */}
                {activeCols.pengRill && (
                  <td className="p-2 w-32 min-w-[120px] text-center">
                    <button
                      type="button"
                      onClick={() => setModalRiilRow(row)}
                      className={`btn-tactile px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 mx-auto cursor-pointer border ${
                        row.pengRill > 0
                          ? "bg-emerald-50/80 border-emerald-300 text-emerald-800 font-bold"
                          : "glass-control text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <DollarSign className="w-3 h-3" />
                      <span>{row.pengRill > 0 ? `Rp ${(row.pengRill / 1000).toFixed(0)}k` : "Input"}</span>
                    </button>
                  </td>
                )}

                {/* Fullday */}
                {activeCols.fulldayMeeting && (
                  <td className="p-2 w-36 min-w-[135px]">
                    <input
                      type="number"
                      value={row.fulldayMeeting || ""}
                      onChange={(e) => handleUpdateRow(row.id, { fulldayMeeting: parseFloat(e.target.value) || 0 })}
                      className="input-glass w-full h-8 px-2 text-right font-mono font-bold text-xs"
                      placeholder="0"
                    />
                  </td>
                )}

                {/* Fullboard */}
                {activeCols.fullboardMeeting && (
                  <td className="p-2 w-36 min-w-[135px]">
                    <input
                      type="number"
                      value={row.fullboardMeeting || ""}
                      onChange={(e) => handleUpdateRow(row.id, { fullboardMeeting: parseFloat(e.target.value) || 0 })}
                      className="input-glass w-full h-8 px-2 text-right font-mono font-bold text-xs"
                      placeholder="0"
                    />
                  </td>
                )}

                {/* Representatif */}
                {activeCols.representatif && (
                  <td className="p-2 w-36 min-w-[135px]">
                    <input
                      type="number"
                      value={row.representatif || ""}
                      onChange={(e) => handleUpdateRow(row.id, { representatif: parseFloat(e.target.value) || 0 })}
                      className="input-glass w-full h-8 px-2 text-right font-mono font-bold text-xs"
                      placeholder="0"
                    />
                  </td>
                )}

                {/* Belanja Bahan */}
                {activeCols.belanjaBahan && (
                  <td className="p-2 w-36 min-w-[135px]">
                    <input
                      type="number"
                      value={row.belanjaBahan || ""}
                      onChange={(e) => handleUpdateRow(row.id, { belanjaBahan: parseFloat(e.target.value) || 0 })}
                      className="input-glass w-full h-8 px-2 text-right font-mono font-bold text-xs"
                      placeholder="0"
                    />
                  </td>
                )}

                {/* Total Jumlah Row */}
                <td className="p-3 w-44 min-w-[165px] text-right font-mono font-black text-blue-700 bg-blue-50/50 whitespace-nowrap text-xs">
                  Rp {row.totalJumlah.toLocaleString("id-ID")}
                </td>

                {/* Actions (SPJ Details & Delete) */}
                <td className="p-2 w-16 min-w-[64px] text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      onClick={() => setModalSpjRow(row)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/80 cursor-pointer transition-colors"
                      title="Edit Data Tambahan SPJ & Rekap Perdin"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                    </button>
                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(row.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50/80 cursor-pointer transition-colors"
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
            <tr className="bg-slate-200/60 border-t-2 border-slate-300 font-bold text-slate-900 text-xs whitespace-nowrap">
              <td colSpan={10} className="p-3 text-right uppercase tracking-wider">
                Total Keseluruhan ({rows.length} Pegawai): &nbsp;&nbsp;
                <span className="font-mono">{totalHari} hr</span>
              </td>
              <td colSpan={100} className="p-3 text-right font-mono font-black text-sm text-blue-800">
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
