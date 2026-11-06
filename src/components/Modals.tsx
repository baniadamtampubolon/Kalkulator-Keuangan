"use client";

import React, { useState, useEffect } from "react";
import { ParticipantRow, RiilItem, TicketDetail } from "@/lib/types";
import { X, Plus, Trash2, Plane, Hotel, DollarSign, FileSpreadsheet } from "lucide-react";
import { CurrencyInput } from "./CurrencyInput";

// ============================================================================
// 1. Modal Tiket (Mendukung Multi-Leg Transit & Multi-Moda Transportasi)
// ============================================================================
interface ModalTiketProps {
  row: ParticipantRow;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    total: number,
    pergi: TicketDetail,
    pulang: TicketDetail,
    boardingPass: "ADA" | "TIDAK",
    pergiList?: TicketDetail[],
    pulangList?: TicketDetail[]
  ) => void;
}

export const ModalTiket: React.FC<ModalTiketProps> = ({ row, isOpen, onClose, onSave }) => {
  // Keberangkatan State (Array untuk mendukung multi-leg transit / multi-moda: misal Soetta-Ternate lalu Ternate-Morotai)
  const [pergiList, setPergiList] = useState<TicketDetail[]>(() => {
    if (row.tiketPergiList && row.tiketPergiList.length > 0) {
      return row.tiketPergiList;
    }
    return [
      {
        noTiket: row.tiketDetailPergi?.noTiket || "",
        kodeBooking: row.tiketDetailPergi?.kodeBooking || "",
        maskapai: row.tiketDetailPergi?.maskapai || "",
        noPenerbangan: row.tiketDetailPergi?.noPenerbangan || "",
        asal: row.tiketDetailPergi?.asal || "Jakarta (CGK)",
        tujuan: row.tiketDetailPergi?.tujuan || (row.tujuanKota ? `${row.tujuanKota}` : ""),
        tanggal: row.tiketDetailPergi?.tanggal || row.tanggalMulai || "",
        harga:
          row.tiketDetailPergi?.harga !== undefined
            ? row.tiketDetailPergi.harga
            : row.tiket ? Math.round(row.tiket / 2) : 0,
        moda: row.tiketDetailPergi?.moda || "Pesawat Udara",
      },
    ];
  });

  // Kepulangan State (Array untuk mendukung multi-leg transit / multi-moda)
  const [pulangList, setPulangList] = useState<TicketDetail[]>(() => {
    if (row.tiketPulangList && row.tiketPulangList.length > 0) {
      return row.tiketPulangList;
    }
    return [
      {
        noTiket: row.tiketDetailPulang?.noTiket || "",
        kodeBooking: row.tiketDetailPulang?.kodeBooking || "",
        maskapai: row.tiketDetailPulang?.maskapai || "",
        noPenerbangan: row.tiketDetailPulang?.noPenerbangan || "",
        asal: row.tiketDetailPulang?.asal || (row.tujuanKota ? `${row.tujuanKota}` : ""),
        tujuan: row.tiketDetailPulang?.tujuan || "Jakarta (CGK)",
        tanggal: row.tiketDetailPulang?.tanggal || row.tanggalSelesai || "",
        harga:
          row.tiketDetailPulang?.harga !== undefined
            ? row.tiketDetailPulang.harga
            : row.tiket ? Math.round(row.tiket / 2) : 0,
        moda: row.tiketDetailPulang?.moda || "Pesawat Udara",
      },
    ];
  });

  const [boardingPass, setBoardingPass] = useState<"ADA" | "TIDAK">(row.boardingPass || "ADA");

  if (!isOpen) return null;

  // Handlers Keberangkatan
  const handleAddLegPergi = () => {
    const prevLeg = pergiList[pergiList.length - 1];
    setPergiList([
      ...pergiList,
      {
        noTiket: "",
        kodeBooking: prevLeg?.kodeBooking || "",
        maskapai: "",
        noPenerbangan: "",
        asal: prevLeg?.tujuan || "",
        tujuan: row.tujuanKota ? `${row.tujuanKota}` : "",
        tanggal: prevLeg?.tanggal || row.tanggalMulai || "",
        harga: 0,
        moda: prevLeg?.moda || "Pesawat Udara",
      },
    ]);
  };

  const handleRemoveLegPergi = (idx: number) => {
    if (pergiList.length <= 1) return;
    setPergiList(pergiList.filter((_, i) => i !== idx));
  };

  const handleUpdateLegPergi = (idx: number, updates: Partial<TicketDetail>) => {
    setPergiList(pergiList.map((leg, i) => (i === idx ? { ...leg, ...updates } : leg)));
  };

  // Handlers Kepulangan
  const handleAddLegPulang = () => {
    const prevLeg = pulangList[pulangList.length - 1];
    setPulangList([
      ...pulangList,
      {
        noTiket: "",
        kodeBooking: prevLeg?.kodeBooking || "",
        maskapai: "",
        noPenerbangan: "",
        asal: prevLeg?.tujuan || "",
        tujuan: "Jakarta (CGK)",
        tanggal: prevLeg?.tanggal || row.tanggalSelesai || "",
        harga: 0,
        moda: prevLeg?.moda || "Pesawat Udara",
      },
    ]);
  };

  const handleRemoveLegPulang = (idx: number) => {
    if (pulangList.length <= 1) return;
    setPulangList(pulangList.filter((_, i) => i !== idx));
  };

  const handleUpdateLegPulang = (idx: number, updates: Partial<TicketDetail>) => {
    setPulangList(pulangList.map((leg, i) => (i === idx ? { ...leg, ...updates } : leg)));
  };

  const subtotalPergi = pergiList.reduce((acc, leg) => acc + (Number(leg.harga) || 0), 0);
  const subtotalPulang = pulangList.reduce((acc, leg) => acc + (Number(leg.harga) || 0), 0);
  const totalTiket = subtotalPergi + subtotalPulang;

  const handleSave = () => {
    const pergiPrimary: TicketDetail = {
      noTiket: pergiList.map((l) => l.noTiket).filter(Boolean).join(" / ") || pergiList[0]?.noTiket || "",
      kodeBooking: pergiList.map((l) => l.kodeBooking).filter(Boolean).join(" / ") || pergiList[0]?.kodeBooking || "",
      maskapai: pergiList.map((l) => l.maskapai).filter(Boolean).join(" + ") || pergiList[0]?.maskapai || "",
      noPenerbangan: pergiList.map((l) => l.noPenerbangan).filter(Boolean).join(" / ") || pergiList[0]?.noPenerbangan || "",
      asal: pergiList[0]?.asal || "Jakarta (CGK)",
      tujuan: pergiList[pergiList.length - 1]?.tujuan || "",
      tanggal: pergiList[0]?.tanggal || row.tanggalMulai || "",
      harga: subtotalPergi,
      moda: pergiList.map((l) => l.moda).filter(Boolean).join(" & ") || pergiList[0]?.moda || "Pesawat Udara",
    };

    const pulangPrimary: TicketDetail = {
      noTiket: pulangList.map((l) => l.noTiket).filter(Boolean).join(" / ") || pulangList[0]?.noTiket || "",
      kodeBooking: pulangList.map((l) => l.kodeBooking).filter(Boolean).join(" / ") || pulangList[0]?.kodeBooking || "",
      maskapai: pulangList.map((l) => l.maskapai).filter(Boolean).join(" + ") || pulangList[0]?.maskapai || "",
      noPenerbangan: pulangList.map((l) => l.noPenerbangan).filter(Boolean).join(" / ") || pulangList[0]?.noPenerbangan || "",
      asal: pulangList[0]?.asal || "",
      tujuan: pulangList[pulangList.length - 1]?.tujuan || "Jakarta (CGK)",
      tanggal: pulangList[0]?.tanggal || row.tanggalSelesai || "",
      harga: subtotalPulang,
      moda: pulangList.map((l) => l.moda).filter(Boolean).join(" & ") || pulangList[0]?.moda || "Pesawat Udara",
    };

    onSave(totalTiket, pergiPrimary, pulangPrimary, boardingPass, pergiList, pulangList);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md transition-all">
      <div className="bg-white/95 rounded-3xl w-full max-w-5xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5 text-slate-800">
            <Plane className="w-5 h-5 text-slate-700" />
            <div>
              <h3 className="font-bold text-sm md:text-base text-slate-900">
                Rincian Tiket Transportasi: <span className="text-blue-700">{row.nama || "Pelaksana Dinas"}</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Mendukung lebih dari satu tiket/moda dalam sekali jalan (multi-leg transit pesawat, kereta lanjutan, kapal, dll.)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - 2 Columns (Keberangkatan & Kepulangan) */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Kolom 1: Keberangkatan (Pergi) */}
            <div className="bg-slate-50/80 p-4.5 rounded-2xl border border-slate-200 space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-xs md:text-sm">
                  <Plane className="w-4 h-4 text-blue-600" />
                  <span>Keberangkatan (Pergi)</span>
                  <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold">
                    {pergiList.length} Rute
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Subtotal Pergi:</span>
                  <span className="text-xs font-bold font-mono text-blue-700">
                    Rp {subtotalPergi.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              {/* List Leg Pergi */}
              <div className="space-y-3">
                {pergiList.map((leg, idx) => (
                  <div key={idx} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <span>{idx === 0 ? "Rute 1 (Keberangkatan)" : `Rute ${idx + 1} (Transit / Lanjutan)`}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Selector Moda */}
                        <select
                          value={leg.moda || "Pesawat Udara"}
                          onChange={(e) => handleUpdateLegPergi(idx, { moda: e.target.value })}
                          className="input-glass h-7 px-2 text-[11px] font-semibold text-slate-700 bg-slate-50 cursor-pointer"
                        >
                          <option value="Pesawat Udara">✈️ Pesawat Udara</option>
                          <option value="Kereta Api">🚆 Kereta Api</option>
                          <option value="Angkutan Darat">🚗 Mobil / Darat</option>
                          <option value="Angkutan Laut">🚢 Kapal Laut</option>
                        </select>
                        {pergiList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLegPergi(idx)}
                            className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Hapus leg ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-0.5">
                        <label className="text-[10px] font-semibold text-slate-600">Maskapai / KA / Operator</label>
                        <input
                          type="text"
                          value={leg.maskapai || ""}
                          onChange={(e) => handleUpdateLegPergi(idx, { maskapai: e.target.value })}
                          placeholder={leg.moda?.includes("Kereta") ? "Contoh: KAI Argo Bromo" : "Contoh: PELITA / GARUDA"}
                          className="input-glass w-full h-8 px-2.5 text-xs font-medium"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <label className="text-[10px] font-semibold text-slate-600">No. Penerbangan / No. KA</label>
                        <input
                          type="text"
                          value={leg.noPenerbangan || ""}
                          onChange={(e) => handleUpdateLegPergi(idx, { noPenerbangan: e.target.value.toUpperCase() })}
                          placeholder={leg.moda?.includes("Kereta") ? "Contoh: KA 02" : "Contoh: IP202 / GA0323"}
                          className="input-glass w-full h-8 px-2.5 text-xs font-mono font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-0.5">
                        <label className="text-[10px] font-semibold text-slate-600">Kode Booking</label>
                        <input
                          type="text"
                          value={leg.kodeBooking || ""}
                          onChange={(e) => handleUpdateLegPergi(idx, { kodeBooking: e.target.value.toUpperCase() })}
                          placeholder="Contoh: CEWDYV"
                          className="input-glass w-full h-8 px-2.5 text-xs font-mono uppercase font-bold"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <label className="text-[10px] font-semibold text-slate-600">No. Tiket</label>
                        <input
                          type="text"
                          value={leg.noTiket || ""}
                          onChange={(e) => handleUpdateLegPergi(idx, { noTiket: e.target.value })}
                          placeholder="Contoh: 3008842858"
                          className="input-glass w-full h-8 px-2.5 text-xs font-mono font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-0.5">
                        <label className="text-[10px] font-semibold text-slate-600">Asal</label>
                        <input
                          type="text"
                          value={leg.asal || ""}
                          onChange={(e) => handleUpdateLegPergi(idx, { asal: e.target.value })}
                          placeholder="Jakarta (CGK)"
                          className="input-glass w-full h-8 px-2 text-xs font-medium"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <label className="text-[10px] font-semibold text-slate-600">Tujuan</label>
                        <input
                          type="text"
                          value={leg.tujuan || ""}
                          onChange={(e) => handleUpdateLegPergi(idx, { tujuan: e.target.value })}
                          placeholder="Ternate (TTE)"
                          className="input-glass w-full h-8 px-2 text-xs font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-0.5">
                        <label className="text-[10px] font-semibold text-slate-600">Tanggal</label>
                        <input
                          type="date"
                          value={leg.tanggal || ""}
                          onChange={(e) => handleUpdateLegPergi(idx, { tanggal: e.target.value })}
                          className="input-glass w-full h-8 px-2 text-xs font-medium cursor-pointer"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <label className="text-[10px] font-bold text-slate-800">Harga Fare (Rp)</label>
                        <CurrencyInput
                          value={leg.harga}
                          onChange={(val) => handleUpdateLegPergi(idx, { harga: val })}
                          placeholder="0"
                          className="input-glass w-full h-8 px-2 text-xs font-mono font-bold text-right text-slate-900 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tombol Tambah Leg Pergi */}
              <button
                type="button"
                onClick={handleAddLegPergi}
                className="btn-tactile w-full py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center gap-1.5 border border-blue-200 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Rute / Transit Keberangkatan (Leg {pergiList.length + 1})</span>
              </button>
            </div>

            {/* Kolom 2: Kepulangan (Pulang) */}
            <div className="bg-slate-50/80 p-4.5 rounded-2xl border border-slate-200 space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-xs md:text-sm">
                  <Plane className="w-4 h-4 text-emerald-600 rotate-90" />
                  <span>Kepulangan (Pulang)</span>
                  <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                    {pulangList.length} Rute
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Subtotal Pulang:</span>
                  <span className="text-xs font-bold font-mono text-emerald-700">
                    Rp {subtotalPulang.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              {/* List Leg Pulang */}
              <div className="space-y-3">
                {pulangList.map((leg, idx) => (
                  <div key={idx} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <span>{idx === 0 ? "Rute 1 (Kepulangan Awal)" : `Rute ${idx + 1} (Transit / Lanjutan)`}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Selector Moda */}
                        <select
                          value={leg.moda || "Pesawat Udara"}
                          onChange={(e) => handleUpdateLegPulang(idx, { moda: e.target.value })}
                          className="input-glass h-7 px-2 text-[11px] font-semibold text-slate-700 bg-slate-50 cursor-pointer"
                        >
                          <option value="Pesawat Udara">✈️ Pesawat Udara</option>
                          <option value="Kereta Api">🚆 Kereta Api</option>
                          <option value="Angkutan Darat">🚗 Mobil / Darat</option>
                          <option value="Angkutan Laut">🚢 Kapal Laut</option>
                        </select>
                        {pulangList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLegPulang(idx)}
                            className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Hapus leg ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-0.5">
                        <label className="text-[10px] font-semibold text-slate-600">Maskapai / KA / Operator</label>
                        <input
                          type="text"
                          value={leg.maskapai || ""}
                          onChange={(e) => handleUpdateLegPulang(idx, { maskapai: e.target.value })}
                          placeholder={leg.moda?.includes("Kereta") ? "Contoh: KAI Argo Bromo" : "Contoh: GARUDA INDONESIA"}
                          className="input-glass w-full h-8 px-2.5 text-xs font-medium"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <label className="text-[10px] font-semibold text-slate-600">No. Penerbangan / No. KA</label>
                        <input
                          type="text"
                          value={leg.noPenerbangan || ""}
                          onChange={(e) => handleUpdateLegPulang(idx, { noPenerbangan: e.target.value.toUpperCase() })}
                          placeholder={leg.moda?.includes("Kereta") ? "Contoh: KA 03" : "Contoh: GA0323"}
                          className="input-glass w-full h-8 px-2.5 text-xs font-mono font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-0.5">
                        <label className="text-[10px] font-semibold text-slate-600">Kode Booking</label>
                        <input
                          type="text"
                          value={leg.kodeBooking || ""}
                          onChange={(e) => handleUpdateLegPulang(idx, { kodeBooking: e.target.value.toUpperCase() })}
                          placeholder="Contoh: FENZC9"
                          className="input-glass w-full h-8 px-2.5 text-xs font-mono uppercase font-bold"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <label className="text-[10px] font-semibold text-slate-600">No. Tiket</label>
                        <input
                          type="text"
                          value={leg.noTiket || ""}
                          onChange={(e) => handleUpdateLegPulang(idx, { noTiket: e.target.value })}
                          placeholder="Contoh: 1264854319036"
                          className="input-glass w-full h-8 px-2.5 text-xs font-mono font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-0.5">
                        <label className="text-[10px] font-semibold text-slate-600">Asal</label>
                        <input
                          type="text"
                          value={leg.asal || ""}
                          onChange={(e) => handleUpdateLegPulang(idx, { asal: e.target.value })}
                          placeholder="Ternate (TTE)"
                          className="input-glass w-full h-8 px-2 text-xs font-medium"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <label className="text-[10px] font-semibold text-slate-600">Tujuan</label>
                        <input
                          type="text"
                          value={leg.tujuan || ""}
                          onChange={(e) => handleUpdateLegPulang(idx, { tujuan: e.target.value })}
                          placeholder="Jakarta (CGK)"
                          className="input-glass w-full h-8 px-2 text-xs font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-0.5">
                        <label className="text-[10px] font-semibold text-slate-600">Tanggal</label>
                        <input
                          type="date"
                          value={leg.tanggal || ""}
                          onChange={(e) => handleUpdateLegPulang(idx, { tanggal: e.target.value })}
                          className="input-glass w-full h-8 px-2 text-xs font-medium cursor-pointer"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <label className="text-[10px] font-bold text-slate-800">Harga Fare (Rp)</label>
                        <CurrencyInput
                          value={leg.harga}
                          onChange={(val) => handleUpdateLegPulang(idx, { harga: val })}
                          placeholder="0"
                          className="input-glass w-full h-8 px-2 text-xs font-mono font-bold text-right text-slate-900 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tombol Tambah Leg Pulang */}
              <button
                type="button"
                onClick={handleAddLegPulang}
                className="btn-tactile w-full py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center justify-center gap-1.5 border border-emerald-200 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Rute / Transit Kepulangan (Leg {pulangList.length + 1})</span>
              </button>
            </div>
          </div>

          {/* Bottom Bar: Boarding Pass & Total Fare */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-700">Status Boarding Pass:</label>
              <select
                value={boardingPass}
                onChange={(e) => setBoardingPass(e.target.value as "ADA" | "TIDAK")}
                className="input-glass h-8 px-3 text-xs font-medium text-slate-900 bg-white cursor-pointer"
              >
                <option value="ADA">ADA (Lengkap)</option>
                <option value="TIDAK">TIDAK (Belum Ada)</option>
              </select>
            </div>

            <div className="flex items-center gap-4 text-right">
              <div>
                <span className="text-[10px] text-slate-400 block">Total Pergi + Pulang:</span>
                <span className="text-xs text-slate-600 font-mono">
                  Rp {subtotalPergi.toLocaleString("id-ID")} + Rp {subtotalPulang.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="border-l border-slate-200 pl-4">
                <span className="text-[11px] font-semibold text-slate-500 block">Total Tiket PP:</span>
                <span className="text-base font-bold font-mono text-blue-900">
                  Rp {totalTiket.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="btn-tactile px-5 py-2 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold shadow-sm cursor-pointer"
          >
            Simpan Rincian Tiket
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 2. Modal Hotel (Layout Sesuai Gambar Referensi 2)
// ============================================================================
interface ModalHotelProps {
  row: ParticipantRow;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    total: number,
    namaHotel: string,
    rate: number,
    malam: number,
    checkIn: string,
    checkOut: string,
    kotaHotel: string,
    noBillFolio: string,
    noKamar: string
  ) => void;
}

export const ModalHotel: React.FC<ModalHotelProps> = ({ row, isOpen, onClose, onSave }) => {
  const [namaHotel, setNamaHotel] = useState<string>(row.namaHotel || "");
  const [kotaHotel, setKotaHotel] = useState<string>(row.kotaHotel || row.tujuanKota || "");
  const [checkIn, setCheckIn] = useState<string>(row.checkInHotel || row.tanggalMulai || "");
  const [checkOut, setCheckOut] = useState<string>(row.checkOutHotel || row.tanggalSelesai || "");
  const [noBillFolio, setNoBillFolio] = useState<string>(row.noBillFolio || "");
  const [noKamar, setNoKamar] = useState<string>(row.noKamar || "");
  const [malamHotel, setMalamHotel] = useState<number>(row.malamHotel || 1);
  const [rateHotel, setRateHotel] = useState<number>(row.rateHotel || 0);

  const handleCheckInChange = (newVal: string) => {
    setCheckIn(newVal);
    if (newVal && checkOut) {
      const d1 = new Date(newVal);
      const d2 = new Date(checkOut);
      if (!isNaN(d1.getTime()) && !isNaN(d2.getTime()) && d2 >= d1) {
        const diffDays = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 0) setMalamHotel(diffDays);
      }
    }
  };

  const handleCheckOutChange = (newVal: string) => {
    setCheckOut(newVal);
    if (checkIn && newVal) {
      const d1 = new Date(checkIn);
      const d2 = new Date(newVal);
      if (!isNaN(d1.getTime()) && !isNaN(d2.getTime()) && d2 >= d1) {
        const diffDays = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 0) setMalamHotel(diffDays);
      }
    }
  };

  if (!isOpen) return null;

  const total = rateHotel * malamHotel;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md transition-all">
      <div className="bg-white/95 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5 text-slate-800">
            <Hotel className="w-5 h-5 text-slate-700" />
            <h3 className="font-bold text-sm md:text-base text-slate-900">
              Penginapan: <span className="text-slate-800">{row.nama || "Pelaksana Dinas"}</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 block">Nama Hotel</label>
            <input
              type="text"
              value={namaHotel}
              onChange={(e) => setNamaHotel(e.target.value)}
              placeholder="Contoh: JW MARRIOTT SURABAYA / Hotel Santika"
              className="input-glass w-full h-10 px-3 text-xs font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700 block">Kota Hotel</label>
            <input
              type="text"
              value={kotaHotel}
              onChange={(e) => setKotaHotel(e.target.value)}
              placeholder="Contoh: Surabaya / Depok"
              className="input-glass w-full h-10 px-3 text-xs font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">Check-in</label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => handleCheckInChange(e.target.value)}
                className="input-glass w-full h-10 px-3 text-xs font-medium cursor-pointer"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">Check-out</label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => handleCheckOutChange(e.target.value)}
                className="input-glass w-full h-10 px-3 text-xs font-medium cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">No. Bill/Folio</label>
              <input
                type="text"
                value={noBillFolio}
                onChange={(e) => setNoBillFolio(e.target.value)}
                placeholder="Contoh: INV-2026-081"
                className="input-glass w-full h-10 px-3 text-xs font-mono font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">No. Kamar</label>
              <input
                type="text"
                value={noKamar}
                onChange={(e) => setNoKamar(e.target.value)}
                placeholder="Contoh: 1204"
                className="input-glass w-full h-10 px-3 text-xs font-mono font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">Malam</label>
              <input
                type="number"
                value={malamHotel}
                onChange={(e) => setMalamHotel(parseInt(e.target.value) || 1)}
                className="input-glass w-full h-10 px-3 text-xs font-bold text-center"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">Rate Per Malam (Rp)</label>
              <CurrencyInput
                value={rateHotel}
                onChange={(val) => setRateHotel(val)}
                placeholder="0"
                className="input-glass w-full h-10 px-3 text-xs font-mono font-bold text-right"
              />
            </div>
          </div>

          {/* Highlighted Total Biaya Hotel Box */}
          <div className="space-y-1 pt-1">
            <label className="font-bold text-slate-800 block text-xs">Total Biaya Hotel (Rp)</label>
            <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-right font-mono font-bold text-slate-900 text-base shadow-2xs">
              {total.toLocaleString("id-ID")}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() =>
              onSave(
                total,
                namaHotel,
                rateHotel,
                malamHotel,
                checkIn,
                checkOut,
                kotaHotel,
                noBillFolio,
                noKamar
              )
            }
            className="btn-tactile px-5 py-2 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold shadow-sm cursor-pointer"
          >
            Simpan Hotel
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 3. Modal Data Tambahan SPJ & Rekap Perdin (On-Demand Modal)
// ============================================================================
interface ModalSpjExtraProps {
  row: ParticipantRow;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    namaExternal?: string;
    sewaKendaraan?: number;
    taksiBandara?: number;
    biayaReschedule?: number;
    kurs?: number;
    pengembalian?: number;
  }) => void;
}

export const ModalSpjExtra: React.FC<ModalSpjExtraProps> = ({ row, isOpen, onClose, onSave }) => {
  const [namaExternal, setNamaExternal] = useState<string>(row.namaExternal || "");
  const [sewaKendaraan, setSewaKendaraan] = useState<number>(row.sewaKendaraan || 0);
  const [taksiBandara, setTaksiBandara] = useState<number>(row.taksiBandara || 0);
  const [biayaReschedule, setBiayaReschedule] = useState<number>(row.biayaReschedule || 0);
  const [kurs, setKurs] = useState<number>(row.kurs || 0);
  const [pengembalian, setPengembalian] = useState<number>(row.pengembalian || 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md transition-all">
      <div className="bg-white/95 rounded-3xl w-full max-w-md shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5 text-slate-800">
            <FileSpreadsheet className="w-5 h-5 text-slate-700" />
            <h3 className="font-bold text-sm text-slate-900">
              Data SPJ: <span className="text-slate-800">{row.nama || "Pelaksana Dinas"}</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-3.5 text-xs">
          <p className="text-slate-500 text-[11px]">
            Lengkapi data spesifik SPJ pertanggungjawaban untuk tabel Rekap Perdin (opsional sesuai kebutuhan):
          </p>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700 block">Nama External (Jika Non-Pegawai)</label>
            <input
              type="text"
              value={namaExternal}
              onChange={(e) => setNamaExternal(e.target.value)}
              placeholder="Kosongkan jika pegawai internal"
              className="input-glass w-full h-9 px-3 text-xs font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">Sewa Kendaraan (Rp)</label>
              <CurrencyInput
                value={sewaKendaraan}
                onChange={(val) => setSewaKendaraan(val)}
                placeholder="0"
                className="input-glass w-full h-9 px-3 text-xs font-mono font-bold text-right"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">Taksi Bandara (Rp)</label>
              <CurrencyInput
                value={taksiBandara}
                onChange={(val) => setTaksiBandara(val)}
                placeholder="0"
                className="input-glass w-full h-9 px-3 text-xs font-mono font-bold text-right"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">Biaya Reschedule (Rp)</label>
              <CurrencyInput
                value={biayaReschedule}
                onChange={(val) => setBiayaReschedule(val)}
                placeholder="0"
                className="input-glass w-full h-9 px-3 text-xs font-mono font-bold text-right"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">Kurs Valuta (Jika LN)</label>
              <CurrencyInput
                value={kurs}
                onChange={(val) => setKurs(val)}
                placeholder="0"
                className="input-glass w-full h-9 px-3 text-xs font-mono font-bold text-right"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700 block">Pengembalian Kas (Rp)</label>
            <CurrencyInput
              value={pengembalian}
              onChange={(val) => setPengembalian(val)}
              placeholder="0"
              className="input-glass w-full h-9 px-3 text-xs font-mono font-bold text-right"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() =>
              onSave({
                namaExternal,
                sewaKendaraan,
                taksiBandara,
                biayaReschedule,
                kurs,
                pengembalian,
              })
            }
            className="btn-tactile px-5 py-2 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold shadow-sm cursor-pointer"
          >
            Simpan Data SPJ
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 4. Modal Pengeluaran Riil
// ============================================================================
interface ModalRiilProps {
  row: ParticipantRow;
  isOpen: boolean;
  onClose: () => void;
  onSave: (items: RiilItem[]) => void;
}

export const ModalRiil: React.FC<ModalRiilProps> = ({ row, isOpen, onClose, onSave }) => {
  const [items, setItems] = useState<RiilItem[]>(() => {
    if (Array.isArray(row.riilItems) && row.riilItems.length > 0) {
      return row.riilItems;
    }
    if ((row.pengRill || 0) > 0) {
      return [{ id: "1", uraian: "Pengeluaran Riil", amount: row.pengRill }];
    }
    return [
      { id: "1", uraian: "Transportasi Darat PP (Taksi / Grab)", amount: 150000 },
      { id: "2", uraian: "Transportasi Lokal Daerah Tujuan", amount: 150000 },
    ];
  });

  useEffect(() => {
    if (!isOpen) return;
    Promise.resolve().then(() => {
      if (Array.isArray(row.riilItems) && row.riilItems.length > 0) {
        setItems(row.riilItems);
      } else if ((row.pengRill || 0) > 0) {
        setItems([{ id: "1", uraian: "Pengeluaran Riil", amount: row.pengRill }]);
      } else {
        setItems([
          { id: "1", uraian: "Transportasi Darat PP (Taksi / Grab)", amount: 150000 },
          { id: "2", uraian: "Transportasi Lokal Daerah Tujuan", amount: 150000 },
        ]);
      }
    });
  }, [row.riilItems, row.pengRill, row.id, isOpen]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { id: Date.now().toString(), uraian: "Pengeluaran Riil Lainnya", amount: 0 },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleUpdateItem = <K extends keyof RiilItem>(id: string, field: K, val: RiilItem[K]) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: val } : it))
    );
  };

  const total = items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md transition-all">
      <div className="glass-modal w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-200">
              <DollarSign className="w-4 h-4 text-slate-700" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">
              Daftar Pengeluaran Riil
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex justify-between items-center">
            <p className="text-slate-600">
              Pegawai: <strong className="text-slate-900">{row.nama || "—"}</strong>
            </p>
            <button
              type="button"
              onClick={handleAddItem}
              className="btn-tactile flex items-center gap-1 text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Tambah Baris</span>
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {items.map((it, idx) => (
              <div key={it.id} className="flex items-center gap-2">
                <span className="font-bold text-slate-400 w-4 text-center">{idx + 1}.</span>
                <input
                  type="text"
                  value={it.uraian}
                  onChange={(e) => handleUpdateItem(it.id, "uraian", e.target.value)}
                  placeholder="Uraian pengeluaran..."
                  className="input-glass flex-1 h-9 px-2.5 text-xs font-medium"
                />
                <CurrencyInput
                  value={it.amount}
                  onChange={(val) => handleUpdateItem(it.id, "amount", val)}
                  placeholder="Jumlah..."
                  className="input-glass w-28 h-9 px-2.5 text-xs font-mono font-bold text-right"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveItem(it.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-800">Total Pengeluaran Riil:</span>
            <span className="font-mono font-bold text-slate-900 text-sm">
              Rp {total.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={() => onSave(items)}
            className="btn-tactile px-4 py-2 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold shadow-sm cursor-pointer"
          >
            Simpan Daftar Riil
          </button>
        </div>
      </div>
    </div>
  );
};
