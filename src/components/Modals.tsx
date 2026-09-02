"use client";

import React, { useState } from "react";
import { ParticipantRow, RiilItem, SbmRate } from "@/lib/types";
import { X, Plus, Trash2, Plane, Hotel, DollarSign } from "lucide-react";

// ============================================================================
// 1. Modal Tiket
// ============================================================================
interface ModalTiketProps {
  row: ParticipantRow;
  isOpen: boolean;
  onClose: () => void;
  onSave: (val: number) => void;
}

export const ModalTiket: React.FC<ModalTiketProps> = ({ row, isOpen, onClose, onSave }) => {
  const [tiketAmount, setTiketAmount] = useState<number>(row.tiket || 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md transition-all">
      <div className="glass-modal w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-700 flex items-center justify-center border border-blue-500/20">
              <Plane className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">
              Rincian Tiket Transportasi PP
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <p className="text-slate-600">
            Pegawai: <strong className="text-slate-900">{row.nama || "—"}</strong>
          </p>
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nominal Tiket PP (Rupiah)
            </label>
            <input
              type="number"
              value={tiketAmount}
              onChange={(e) => setTiketAmount(parseFloat(e.target.value) || 0)}
              className="input-glass w-full h-10 px-3 text-sm font-bold font-mono"
            />
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
            onClick={() => onSave(tiketAmount)}
            className="btn-tactile px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-md cursor-pointer"
          >
            Simpan Nominal
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 2. Modal Hotel
// ============================================================================
interface ModalHotelProps {
  row: ParticipantRow;
  isOpen: boolean;
  onClose: () => void;
  onSave: (val: number, namaHotel: string, rate: number, malam: number) => void;
}

export const ModalHotel: React.FC<ModalHotelProps> = ({ row, isOpen, onClose, onSave }) => {
  const [namaHotel, setNamaHotel] = useState<string>(row.namaHotel || "");
  const [rateHotel, setRateHotel] = useState<number>(row.rateHotel || 0);
  const [malamHotel, setMalamHotel] = useState<number>(row.malamHotel || 1);

  if (!isOpen) return null;

  const total = rateHotel * malamHotel;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md transition-all">
      <div className="glass-modal w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center border border-amber-500/20">
              <Hotel className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">
              Rincian Penginapan / Hotel
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <p className="text-slate-600">
            Pegawai: <strong className="text-slate-900">{row.nama || "—"}</strong>
          </p>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nama Hotel / Penginapan
            </label>
            <input
              type="text"
              value={namaHotel}
              onChange={(e) => setNamaHotel(e.target.value)}
              placeholder="Contoh: Hotel Santika Depok"
              className="input-glass w-full h-10 px-3 text-xs font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tarif / Malam (Rp)
              </label>
              <input
                type="number"
                value={rateHotel}
                onChange={(e) => setRateHotel(parseFloat(e.target.value) || 0)}
                className="input-glass w-full h-10 px-3 text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Jumlah Malam
              </label>
              <input
                type="number"
                value={malamHotel}
                onChange={(e) => setMalamHotel(parseInt(e.target.value) || 1)}
                className="input-glass w-full h-10 px-3 text-xs font-bold text-center"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 flex justify-between items-center text-xs">
            <span className="font-semibold text-amber-900">Total Biaya Hotel:</span>
            <span className="font-mono font-black text-amber-900 text-sm">
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
            onClick={() => onSave(total, namaHotel, rateHotel, malamHotel)}
            className="btn-tactile px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 text-white text-xs font-bold shadow-md cursor-pointer"
          >
            Simpan Hotel
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 3. Modal Pengeluaran Riil
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

  const handleUpdateItem = (id: string, field: keyof RiilItem, val: any) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: val } : it))
    );
  };

  const total = items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md transition-all">
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
