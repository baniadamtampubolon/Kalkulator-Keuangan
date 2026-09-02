"use client";

import React, { useState } from "react";
import { Pegawai } from "@/lib/types";
import { X, UserPlus } from "lucide-react";

interface ModalTambahPegawaiProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pegawai: Pegawai) => void;
}

export const ModalTambahPegawai: React.FC<ModalTambahPegawaiProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [nama, setNama] = useState("");
  const [nip, setNip] = useState("");
  const [golongan, setGolongan] = useState("III/a");
  const [jabatan, setJabatan] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return;

    const newPeg: Pegawai = {
      kodeNama: nama.toLowerCase().split(" ")[0] || "peg",
      no: Date.now().toString(),
      nama: nama.trim(),
      nip: nip.trim(),
      golongan: golongan.trim(),
      jabatan: jabatan.trim() || "Pelaksana",
      jenisKelamin: "",
      pangkat: "",
    };

    onSave(newPeg);
    setNama("");
    setNip("");
    setGolongan("III/a");
    setJabatan("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md transition-all">
      <div className="glass-modal w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-700 flex items-center justify-center border border-blue-500/20">
              <UserPlus className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">
              Tambah Pegawai ke Master Data
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nama Lengkap & Gelar *
            </label>
            <input
              type="text"
              required
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: Budi Santoso, S.E., M.Si."
              className="input-glass w-full h-10 px-3 font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              NIP (Nomor Induk Pegawai)
            </label>
            <input
              type="text"
              value={nip}
              onChange={(e) => setNip(e.target.value)}
              placeholder="Contoh: 19850101 201001 1 001"
              className="input-glass w-full h-10 px-3 font-mono font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Golongan Ruang
              </label>
              <select
                value={golongan}
                onChange={(e) => setGolongan(e.target.value)}
                className="input-glass w-full h-10 px-3 font-semibold cursor-pointer"
              >
                <option value="I/a">I/a</option>
                <option value="I/b">I/b</option>
                <option value="I/c">I/c</option>
                <option value="I/d">I/d</option>
                <option value="II/a">II/a</option>
                <option value="II/b">II/b</option>
                <option value="II/c">II/c</option>
                <option value="II/d">II/d</option>
                <option value="III/a">III/a</option>
                <option value="III/b">III/b</option>
                <option value="III/c">III/c</option>
                <option value="III/d">III/d</option>
                <option value="IV/a">IV/a</option>
                <option value="IV/b">IV/b</option>
                <option value="IV/c">IV/c</option>
                <option value="IV/d">IV/d</option>
                <option value="IV/e">IV/e</option>
                <option value="Non-PNS">Non-PNS / PPNPN</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Jabatan Kedinasan
              </label>
              <input
                type="text"
                value={jabatan}
                onChange={(e) => setJabatan(e.target.value)}
                placeholder="Contoh: Auditor Muda"
                className="input-glass w-full h-10 px-3 font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-white/60 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn-tactile px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-md cursor-pointer"
            >
              Simpan Pegawai
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
