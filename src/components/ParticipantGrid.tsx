"use client";

import React, { useState } from "react";
import {
  ParticipantRow,
  Pegawai,
  SbmRate,
  ActiveCostKey,
  ActiveUhKey,
  RiilItem,
} from "@/lib/types";
import { calculateRowTotal, findSbmByProvince } from "@/lib/calc";
import { ModalTiket, ModalHotel, ModalRiil } from "./Modals";
import {
  Users,
  Plus,
  Trash2,
  Plane,
  Hotel,
  DollarSign,
  Sparkles,
} from "lucide-react";

interface ParticipantGridProps {
  rows: ParticipantRow[];
  setRows: React.Dispatch<React.SetStateAction<ParticipantRow[]>>;
  pegawaiList: Pegawai[];
  sbmList: SbmRate[];
  activeCols: Record<ActiveCostKey, boolean>;
  activeUh: Record<ActiveUhKey, boolean>;
  provinsiTujuan: string;
}

export const ParticipantGrid: React.FC<ParticipantGridProps> = ({
  rows,
  setRows,
  pegawaiList,
  sbmList,
  activeCols,
  activeUh,
  provinsiTujuan,
}) => {
  const currentSbm = findSbmByProvince(sbmList, provinsiTujuan);

  // Modal States
  const [modalTiketRow, setModalTiketRow] = useState<ParticipantRow | null>(null);
  const [modalHotelRow, setModalHotelRow] = useState<ParticipantRow | null>(null);
  const [modalRiilRow, setModalRiilRow] = useState<ParticipantRow | null>(null);

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
      handleUpdateRow(id, {
        kodeNama: found.kodeNama,
        nama: found.nama,
        nip: found.nip,
        golongan: found.golongan,
        jabatan: found.jabatan,
      });
    } else {
      handleUpdateRow(id, { nama });
    }
  };

  const handleAddRow = () => {
    const newId = Date.now().toString();
    const newRow: ParticipantRow = {
      id: newId,
      kodeNama: "",
      nama: "",
      nip: "",
      golongan: "III/a",
      jabatan: "Pelaksana",
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
      totalJumlah: currentSbm?.uhBiasa || 0,
    };

    setRows((prev) => [...prev, calculateRowTotal(newRow, currentSbm, activeUh, activeCols)]);
  };

  const handleRemoveRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const grandTotal = rows.reduce((acc, r) => acc + (r.totalJumlah || 0), 0);
  const totalHari = rows.reduce((acc, r) => acc + (r.lamaHari || 0), 0);

  return (
    <section className="glass-base rounded-3xl p-6 md:p-8 space-y-5">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-700 flex items-center justify-center border border-blue-500/20">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-slate-900">
              3. Tabel Rincian Peserta & Kalkulasi Biaya (Proses)
            </h2>
            <p className="text-xs text-slate-500">
              Input data pelaksana dinas, tanggal keberangkatan, rincian biaya tiket, hotel, dan pengeluaran riil
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddRow}
          className="btn-tactile flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pegawai</span>
        </button>
      </div>

      {/* Process Table with Translucent Glass Container */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white/40 backdrop-blur-md shadow-inner">
        <table className="w-full text-left text-xs border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-slate-100/70 border-b border-slate-200/80 text-slate-700 font-bold">
              <th className="p-3 w-10 text-center">No</th>
              <th className="p-3 min-w-[190px]">Nama Pegawai</th>
              <th className="p-3 min-w-[140px]">Gol / Jabatan</th>
              <th className="p-3 w-32">Tgl Berangkat</th>
              <th className="p-3 w-32">Tgl Pulang</th>
              <th className="p-3 w-14 text-center">Hari</th>

              {/* Dynamic Columns */}
              {activeUh.uhBiasa && <th className="p-3 text-right w-28">UH Biasa (Rp)</th>}
              {activeUh.uhBiasa60 && <th className="p-3 text-right w-28">UH 60% (Rp)</th>}
              {activeUh.uhHalfday && <th className="p-3 text-right w-28">UH Halfday (Rp)</th>}
              {activeUh.uhFullboard && <th className="p-3 text-right w-28">UH Fullboard (Rp)</th>}

              {activeCols.tiket && <th className="p-3 text-center w-28">Tiket PP</th>}
              {activeCols.dukunganTransportasi && <th className="p-3 text-right w-28">Duk. Transport</th>}
              {activeCols.transportasiDarat && <th className="p-3 text-right w-28">Trans. Darat (Rp)</th>}
              {activeCols.transportasiLokal && <th className="p-3 text-right w-28">Trans. Lokal (Rp)</th>}
              {activeCols.hotel && <th className="p-3 text-center w-28">Hotel</th>}
              {activeCols.penginapan30 && <th className="p-3 text-right w-28">Penginapan 30%</th>}
              {activeCols.pengRill && <th className="p-3 text-center w-28">Peng. Riil</th>}
              {activeCols.fulldayMeeting && <th className="p-3 text-right w-28">Fullday (Rp)</th>}
              {activeCols.fullboardMeeting && <th className="p-3 text-right w-28">Fullboard (Rp)</th>}
              {activeCols.representatif && <th className="p-3 text-right w-28">Representatif (Rp)</th>}
              {activeCols.belanjaBahan && <th className="p-3 text-right w-28">Belanja Bahan</th>}

              <th className="p-3 text-right w-36 font-black text-slate-900 bg-blue-50/50">
                Total Jumlah
              </th>
              <th className="p-3 w-10 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60">
            {rows.map((row, idx) => (
              <tr
                key={row.id}
                className="hover:bg-white/60 transition-colors duration-150 group"
              >
                {/* No */}
                <td className="p-3 text-center font-bold text-slate-500">{idx + 1}</td>

                {/* Nama Pegawai Dropdown */}
                <td className="p-2">
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
                  {row.nip && (
                    <span className="block text-[10px] font-mono text-slate-500 pl-1 pt-0.5">
                      NIP. {row.nip}
                    </span>
                  )}
                </td>

                {/* Gol / Jabatan */}
                <td className="p-2">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-[11px] px-1.5 py-0.5 rounded-md bg-slate-200/70 border border-slate-300/60 text-slate-800 shrink-0">
                      {row.golongan || "—"}
                    </span>
                    <span className="text-[11px] text-slate-600 truncate max-w-[130px]" title={row.jabatan}>
                      {row.jabatan || "Pelaksana"}
                    </span>
                  </div>
                </td>

                {/* Tgl Berangkat */}
                <td className="p-2">
                  <input
                    type="date"
                    value={row.tanggalMulai}
                    onChange={(e) => handleUpdateRow(row.id, { tanggalMulai: e.target.value })}
                    className="input-glass w-full h-8 px-2 text-xs cursor-pointer"
                  />
                </td>

                {/* Tgl Pulang */}
                <td className="p-2">
                  <input
                    type="date"
                    value={row.tanggalSelesai}
                    onChange={(e) => handleUpdateRow(row.id, { tanggalSelesai: e.target.value })}
                    className="input-glass w-full h-8 px-2 text-xs cursor-pointer"
                  />
                </td>

                {/* Lama Hari */}
                <td className="p-2 text-center font-bold text-slate-800">
                  {row.lamaHari} hr
                </td>

                {/* UH Biasa */}
                {activeUh.uhBiasa && (
                  <td className="p-2 text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                    Rp {row.biayaUhBiasa.toLocaleString("id-ID")}
                  </td>
                )}

                {/* UH 60% */}
                {activeUh.uhBiasa60 && (
                  <td className="p-2 text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                    Rp {row.biayaUhBiasa60.toLocaleString("id-ID")}
                  </td>
                )}

                {/* UH Halfday */}
                {activeUh.uhHalfday && (
                  <td className="p-2 text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                    Rp {row.biayaUhHalfday.toLocaleString("id-ID")}
                  </td>
                )}

                {/* UH Fullboard */}
                {activeUh.uhFullboard && (
                  <td className="p-2 text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                    Rp {row.biayaUhFullboard.toLocaleString("id-ID")}
                  </td>
                )}

                {/* Tiket Modal Trigger */}
                {activeCols.tiket && (
                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() => setModalTiketRow(row)}
                      className={`btn-tactile px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 mx-auto cursor-pointer border ${
                        row.tiket > 0
                          ? "bg-blue-50/80 border-blue-300 text-blue-800 font-bold"
                          : "glass-control text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Plane className="w-3 h-3" />
                      <span>{row.tiket > 0 ? `${(row.tiket / 1000).toFixed(0)}k` : "Input"}</span>
                    </button>
                  </td>
                )}

                {/* Dukungan Transport */}
                {activeCols.dukunganTransportasi && (
                  <td className="p-2">
                    <input
                      type="number"
                      value={row.dukunganTransportasi || ""}
                      onChange={(e) => handleUpdateRow(row.id, { dukunganTransportasi: parseFloat(e.target.value) || 0 })}
                      className="input-glass w-full h-8 px-2 text-right font-mono font-semibold text-xs"
                      placeholder="0"
                    />
                  </td>
                )}

                {/* Trans. Darat */}
                {activeCols.transportasiDarat && (
                  <td className="p-2">
                    <input
                      type="number"
                      value={row.transportasiDarat || ""}
                      onChange={(e) => handleUpdateRow(row.id, { transportasiDarat: parseFloat(e.target.value) || 0 })}
                      className="input-glass w-full h-8 px-2 text-right font-mono font-semibold text-xs"
                      placeholder="0"
                    />
                  </td>
                )}

                {/* Trans. Lokal */}
                {activeCols.transportasiLokal && (
                  <td className="p-2">
                    <input
                      type="number"
                      value={row.transportasiLokal || ""}
                      onChange={(e) => handleUpdateRow(row.id, { transportasiLokal: parseFloat(e.target.value) || 0 })}
                      className="input-glass w-full h-8 px-2 text-right font-mono font-semibold text-xs"
                      placeholder="0"
                    />
                  </td>
                )}

                {/* Hotel Modal Trigger */}
                {activeCols.hotel && (
                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() => setModalHotelRow(row)}
                      className={`btn-tactile px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 mx-auto cursor-pointer border ${
                        row.hotel > 0
                          ? "bg-amber-50/80 border-amber-300 text-amber-800 font-bold"
                          : "glass-control text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Hotel className="w-3 h-3" />
                      <span>{row.hotel > 0 ? `${(row.hotel / 1000).toFixed(0)}k` : "Input"}</span>
                    </button>
                  </td>
                )}

                {/* Penginapan 30% */}
                {activeCols.penginapan30 && (
                  <td className="p-2 text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                    Rp {(row.penginapan30 || 0).toLocaleString("id-ID")}
                  </td>
                )}

                {/* Peng. Riil Modal Trigger */}
                {activeCols.pengRill && (
                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() => setModalRiilRow(row)}
                      className={`btn-tactile px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 mx-auto cursor-pointer border ${
                        row.pengRill > 0
                          ? "bg-emerald-50/80 border-emerald-300 text-emerald-800 font-bold"
                          : "glass-control text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <DollarSign className="w-3 h-3" />
                      <span>{row.pengRill > 0 ? `${(row.pengRill / 1000).toFixed(0)}k` : "Input"}</span>
                    </button>
                  </td>
                )}

                {/* Fullday */}
                {activeCols.fulldayMeeting && (
                  <td className="p-2">
                    <input
                      type="number"
                      value={row.fulldayMeeting || ""}
                      onChange={(e) => handleUpdateRow(row.id, { fulldayMeeting: parseFloat(e.target.value) || 0 })}
                      className="input-glass w-full h-8 px-2 text-right font-mono font-semibold text-xs"
                      placeholder="0"
                    />
                  </td>
                )}

                {/* Fullboard */}
                {activeCols.fullboardMeeting && (
                  <td className="p-2">
                    <input
                      type="number"
                      value={row.fullboardMeeting || ""}
                      onChange={(e) => handleUpdateRow(row.id, { fullboardMeeting: parseFloat(e.target.value) || 0 })}
                      className="input-glass w-full h-8 px-2 text-right font-mono font-semibold text-xs"
                      placeholder="0"
                    />
                  </td>
                )}

                {/* Representatif */}
                {activeCols.representatif && (
                  <td className="p-2">
                    <input
                      type="number"
                      value={row.representatif || ""}
                      onChange={(e) => handleUpdateRow(row.id, { representatif: parseFloat(e.target.value) || 0 })}
                      className="input-glass w-full h-8 px-2 text-right font-mono font-semibold text-xs"
                      placeholder="0"
                    />
                  </td>
                )}

                {/* Belanja Bahan */}
                {activeCols.belanjaBahan && (
                  <td className="p-2">
                    <input
                      type="number"
                      value={row.belanjaBahan || ""}
                      onChange={(e) => handleUpdateRow(row.id, { belanjaBahan: parseFloat(e.target.value) || 0 })}
                      className="input-glass w-full h-8 px-2 text-right font-mono font-semibold text-xs"
                      placeholder="0"
                    />
                  </td>
                )}

                {/* Total Jumlah Row */}
                <td className="p-3 text-right font-mono font-black text-blue-700 bg-blue-50/40 whitespace-nowrap text-xs">
                  Rp {row.totalJumlah.toLocaleString("id-ID")}
                </td>

                {/* Delete Row Action */}
                <td className="p-2 text-center">
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
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-200/50 border-t-2 border-slate-300 font-bold text-slate-900 text-xs">
              <td colSpan={6} className="p-3 text-right uppercase tracking-wider">
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
          onSave={(val) => {
            handleUpdateRow(modalTiketRow.id, { tiket: val });
            setModalTiketRow(null);
          }}
        />
      )}

      {modalHotelRow && (
        <ModalHotel
          row={modalHotelRow}
          isOpen={true}
          onClose={() => setModalHotelRow(null)}
          onSave={(val, nama, rate, malam) => {
            handleUpdateRow(modalHotelRow.id, {
              hotel: val,
              namaHotel: nama,
              rateHotel: rate,
              malamHotel: malam,
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
    </section>
  );
};
