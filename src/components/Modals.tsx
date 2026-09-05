"use client";

import React, { useState } from "react";
import { ParticipantRow, RiilItem, TicketDetail } from "@/lib/types";
import { X, Plus, Trash2, Plane, Hotel, DollarSign, FileSpreadsheet } from "lucide-react";

// ============================================================================
// 1. Modal Tiket (2-Column Layout Sesuai Gambar Referensi 1)
// ============================================================================
interface ModalTiketProps {
  row: ParticipantRow;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    total: number,
    pergi: TicketDetail,
    pulang: TicketDetail,
    boardingPass: "ADA" | "TIDAK"
  ) => void;
}

export const ModalTiket: React.FC<ModalTiketProps> = ({ row, isOpen, onClose, onSave }) => {
  // Keberangkatan State
  const [pergi, setPergi] = useState<TicketDetail>(() => ({
    noTiket: row.tiketDetailPergi?.noTiket || "",
    kodeBooking: row.tiketDetailPergi?.kodeBooking || "",
    maskapai: row.tiketDetailPergi?.maskapai || "",
    noPenerbangan: row.tiketDetailPergi?.noPenerbangan || "",
    asal: row.tiketDetailPergi?.asal || "Jakarta (CGK)",
    tujuan: row.tiketDetailPergi?.tujuan || (row.tujuanKota ? `${row.tujuanKota}` : ""),
    tanggal: row.tiketDetailPergi?.tanggal || row.tanggalMulai || "",
    harga: row.tiketDetailPergi?.harga !== undefined ? row.tiketDetailPergi.harga : (row.tiket ? Math.round(row.tiket / 2) : 0),
  }));

  // Kepulangan State
  const [pulang, setPulang] = useState<TicketDetail>(() => ({
    noTiket: row.tiketDetailPulang?.noTiket || "",
    kodeBooking: row.tiketDetailPulang?.kodeBooking || "",
    maskapai: row.tiketDetailPulang?.maskapai || "",
    noPenerbangan: row.tiketDetailPulang?.noPenerbangan || "",
    asal: row.tiketDetailPulang?.asal || (row.tujuanKota ? `${row.tujuanKota}` : ""),
    tujuan: row.tiketDetailPulang?.tujuan || "Jakarta (CGK)",
    tanggal: row.tiketDetailPulang?.tanggal || row.tanggalSelesai || "",
    harga: row.tiketDetailPulang?.harga !== undefined ? row.tiketDetailPulang.harga : (row.tiket ? Math.round(row.tiket / 2) : 0),
  }));

  const [boardingPass, setBoardingPass] = useState<"ADA" | "TIDAK">(row.boardingPass || "ADA");

  if (!isOpen) return null;

  const totalTiket = (Number(pergi.harga) || 0) + (Number(pulang.harga) || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md transition-all">
      <div className="bg-white/95 rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5 text-blue-800">
            <Plane className="w-5 h-5" />
            <h3 className="font-bold text-sm md:text-base text-slate-900">
              Tiket: <span className="text-blue-700">{row.nama || "Pelaksana Dinas"}</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - 2 Columns */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Kolom 1: Keberangkatan */}
            <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/90 space-y-3.5">
              <div className="flex items-center gap-2 font-bold text-blue-700 text-xs md:text-sm border-b border-slate-200 pb-2">
                <Plane className="w-4 h-4" />
                <span>Keberangkatan</span>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">No. Tiket</label>
                <input
                  type="text"
                  value={pergi.noTiket || ""}
                  onChange={(e) => setPergi({ ...pergi, noTiket: e.target.value })}
                  placeholder="Contoh: 3008842858"
                  className="input-glass w-full h-9 px-3 text-xs font-mono font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">Kode Booking</label>
                <input
                  type="text"
                  value={pergi.kodeBooking || ""}
                  onChange={(e) => setPergi({ ...pergi, kodeBooking: e.target.value.toUpperCase() })}
                  placeholder="Contoh: CEWDYV"
                  className="input-glass w-full h-9 px-3 text-xs font-mono uppercase font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">Maskapai</label>
                <input
                  type="text"
                  value={pergi.maskapai || ""}
                  onChange={(e) => setPergi({ ...pergi, maskapai: e.target.value })}
                  placeholder="Contoh: PELITA AIR / GARUDA"
                  className="input-glass w-full h-9 px-3 text-xs font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">No. Penerbangan / KA</label>
                <input
                  type="text"
                  value={pergi.noPenerbangan || ""}
                  onChange={(e) => setPergi({ ...pergi, noPenerbangan: e.target.value.toUpperCase() })}
                  placeholder="Contoh: IP202 / GA0323"
                  className="input-glass w-full h-9 px-3 text-xs font-mono font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Asal</label>
                  <input
                    type="text"
                    value={pergi.asal || ""}
                    onChange={(e) => setPergi({ ...pergi, asal: e.target.value })}
                    placeholder="Jakarta (CGK)"
                    className="input-glass w-full h-9 px-2.5 text-xs font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Tujuan</label>
                  <input
                    type="text"
                    value={pergi.tujuan || ""}
                    onChange={(e) => setPergi({ ...pergi, tujuan: e.target.value })}
                    placeholder="Surabaya (SUB)"
                    className="input-glass w-full h-9 px-2.5 text-xs font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">Tanggal Keberangkatan</label>
                <input
                  type="date"
                  value={pergi.tanggal || ""}
                  onChange={(e) => setPergi({ ...pergi, tanggal: e.target.value })}
                  className="input-glass w-full h-9 px-3 text-xs font-medium cursor-pointer"
                />
              </div>

              <div className="space-y-1 pt-1">
                <label className="text-[11px] font-bold text-slate-800">Harga Fare Pergi (Rp)</label>
                <input
                  type="number"
                  value={pergi.harga !== undefined && pergi.harga !== 0 ? pergi.harga : ""}
                  onChange={(e) => setPergi({ ...pergi, harga: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="input-glass w-full h-9 px-3 text-xs font-mono font-black text-right text-blue-900 bg-white"
                />
              </div>
            </div>

            {/* Kolom 2: Kepulangan */}
            <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/90 space-y-3.5">
              <div className="flex items-center gap-2 font-bold text-amber-700 text-xs md:text-sm border-b border-slate-200 pb-2">
                <Plane className="w-4 h-4 rotate-90" />
                <span>Kepulangan</span>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">No. Tiket</label>
                <input
                  type="text"
                  value={pulang.noTiket || ""}
                  onChange={(e) => setPulang({ ...pulang, noTiket: e.target.value })}
                  placeholder="Contoh: 1264854319036"
                  className="input-glass w-full h-9 px-3 text-xs font-mono font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">Kode Booking</label>
                <input
                  type="text"
                  value={pulang.kodeBooking || ""}
                  onChange={(e) => setPulang({ ...pulang, kodeBooking: e.target.value.toUpperCase() })}
                  placeholder="Contoh: FENZC9"
                  className="input-glass w-full h-9 px-3 text-xs font-mono uppercase font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">Maskapai</label>
                <input
                  type="text"
                  value={pulang.maskapai || ""}
                  onChange={(e) => setPulang({ ...pulang, maskapai: e.target.value })}
                  placeholder="Contoh: GARUDA INDONESIA"
                  className="input-glass w-full h-9 px-3 text-xs font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">No. Penerbangan / KA</label>
                <input
                  type="text"
                  value={pulang.noPenerbangan || ""}
                  onChange={(e) => setPulang({ ...pulang, noPenerbangan: e.target.value.toUpperCase() })}
                  placeholder="Contoh: GA0323"
                  className="input-glass w-full h-9 px-3 text-xs font-mono font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Asal</label>
                  <input
                    type="text"
                    value={pulang.asal || ""}
                    onChange={(e) => setPulang({ ...pulang, asal: e.target.value })}
                    placeholder="SURABAYA JUANDA"
                    className="input-glass w-full h-9 px-2.5 text-xs font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Tujuan</label>
                  <input
                    type="text"
                    value={pulang.tujuan || ""}
                    onChange={(e) => setPulang({ ...pulang, tujuan: e.target.value })}
                    placeholder="JAKARTA SOEKARNO HATTA"
                    className="input-glass w-full h-9 px-2.5 text-xs font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">Tanggal Kepulangan</label>
                <input
                  type="date"
                  value={pulang.tanggal || ""}
                  onChange={(e) => setPulang({ ...pulang, tanggal: e.target.value })}
                  className="input-glass w-full h-9 px-3 text-xs font-medium cursor-pointer"
                />
              </div>

              <div className="space-y-1 pt-1">
                <label className="text-[11px] font-bold text-slate-800">Harga Fare Pulang (Rp)</label>
                <input
                  type="number"
                  value={pulang.harga !== undefined && pulang.harga !== 0 ? pulang.harga : ""}
                  onChange={(e) => setPulang({ ...pulang, harga: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="input-glass w-full h-9 px-3 text-xs font-mono font-black text-right text-amber-900 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Bottom Bar: Boarding Pass & Total Fare */}
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-700">Status Boarding Pass:</label>
              <select
                value={boardingPass}
                onChange={(e) => setBoardingPass(e.target.value as "ADA" | "TIDAK")}
                className="input-glass h-8 px-3 text-xs font-bold text-blue-800 bg-white"
              >
                <option value="ADA">ADA (Lengkap)</option>
                <option value="TIDAK">TIDAK (Belum Ada)</option>
              </select>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-semibold text-slate-500 block">Total Tiket PP:</span>
              <span className="text-base font-black font-mono text-blue-900">
                Rp {totalTiket.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-200 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => onSave(totalTiket, pergi, pulang, boardingPass)}
            className="btn-tactile px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-md cursor-pointer"
          >
            Simpan Tiket
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
        <div className="px-6 py-4 border-b border-amber-200/60 flex items-center justify-between bg-amber-50/60">
          <div className="flex items-center gap-2.5 text-amber-900">
            <Hotel className="w-5 h-5 text-amber-700" />
            <h3 className="font-bold text-sm md:text-base text-amber-950">
              Penginapan: <span className="text-amber-800">{row.nama || "Pelaksana Dinas"}</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
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
              <input
                type="number"
                value={rateHotel || ""}
                onChange={(e) => setRateHotel(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="input-glass w-full h-10 px-3 text-xs font-mono font-bold text-right"
              />
            </div>
          </div>

          {/* Highlighted Total Biaya Hotel Box (Exact Sesuai Gambar 2) */}
          <div className="space-y-1 pt-1">
            <label className="font-bold text-slate-800 block text-xs">Total Biaya Hotel (Rp)</label>
            <div className="p-3.5 rounded-xl bg-amber-100/80 border border-amber-300 text-right font-mono font-black text-amber-950 text-base shadow-2xs">
              {total.toLocaleString("id-ID")}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-200 flex justify-end gap-2.5">
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
            className="btn-tactile px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md cursor-pointer"
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
        <div className="px-6 py-4 border-b border-indigo-200/60 flex items-center justify-between bg-indigo-50/60">
          <div className="flex items-center gap-2.5 text-indigo-900">
            <FileSpreadsheet className="w-5 h-5 text-indigo-700" />
            <h3 className="font-bold text-sm text-indigo-950">
              Data SPJ: <span className="text-indigo-800">{row.nama || "Pelaksana Dinas"}</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
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
              <input
                type="number"
                value={sewaKendaraan || ""}
                onChange={(e) => setSewaKendaraan(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="input-glass w-full h-9 px-3 text-xs font-mono font-bold text-right"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">Taksi Bandara (Rp)</label>
              <input
                type="number"
                value={taksiBandara || ""}
                onChange={(e) => setTaksiBandara(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="input-glass w-full h-9 px-3 text-xs font-mono font-bold text-right"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">Biaya Reschedule (Rp)</label>
              <input
                type="number"
                value={biayaReschedule || ""}
                onChange={(e) => setBiayaReschedule(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="input-glass w-full h-9 px-3 text-xs font-mono font-bold text-right"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">Kurs Valuta (Jika LN)</label>
              <input
                type="number"
                value={kurs || ""}
                onChange={(e) => setKurs(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="input-glass w-full h-9 px-3 text-xs font-mono font-bold text-right"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700 block">Pengembalian Kas (Rp)</label>
            <input
              type="number"
              value={pengembalian || ""}
              onChange={(e) => setPengembalian(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="input-glass w-full h-9 px-3 text-xs font-mono font-bold text-right"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-200 flex justify-end gap-2.5">
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
            className="btn-tactile px-5 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold shadow-md cursor-pointer"
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
    return [
      { id: "1", uraian: "Transportasi Darat PP (Taksi / Grab)", amount: 150000 },
      { id: "2", uraian: "Transportasi Lokal Daerah Tujuan", amount: 150000 },
    ];
  });

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
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center border border-emerald-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">
              Daftar Pengeluaran Riil
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer">
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
              className="btn-tactile flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50/80 px-2.5 py-1 rounded-lg border border-emerald-300/80 cursor-pointer"
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
                <input
                  type="number"
                  value={it.amount}
                  onChange={(e) => handleUpdateItem(it.id, "amount", parseFloat(e.target.value) || 0)}
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

          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex justify-between items-center text-xs">
            <span className="font-semibold text-emerald-900">Total Pengeluaran Riil:</span>
            <span className="font-mono font-black text-emerald-900 text-sm">
              Rp {total.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/80">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-white/60 cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={() => onSave(items)}
            className="btn-tactile px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-xs font-bold shadow-md cursor-pointer"
          >
            Simpan Daftar Riil
          </button>
        </div>
      </div>
    </div>
  );
};
