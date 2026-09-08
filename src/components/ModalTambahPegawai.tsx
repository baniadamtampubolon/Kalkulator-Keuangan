"use client";

import React, { useState } from "react";
import { Pegawai } from "@/lib/types";
import { X, UserPlus, RefreshCw, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { savePegawaiToGoogleSheet } from "@/lib/googleSheetsService";
import {
  LIST_PANGKAT_GOLONGAN,
  getPangkatByGolongan,
  getGolonganKodeByPangkat,
} from "@/data/pangkatGolongan";

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
  const [golongan, setGolongan] = useState("IIIa");
  const [pangkat, setPangkat] = useState("Penata Muda");
  const [jabatan, setJabatan] = useState("");
  const [jenisKelamin, setJenisKelamin] = useState("Laki-laki");
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  const handleGolonganChange = (newGol: string) => {
    setGolongan(newGol);
    const autoPangkat = getPangkatByGolongan(newGol);
    if (autoPangkat) {
      setPangkat(autoPangkat);
    } else if (newGol === "Non-PNS") {
      setPangkat("Non-PNS");
    }
    // Catatan: Kolom Jabatan sengaja dibiarkan kosong agar diisi manual oleh pengguna
  };

  const handlePangkatChange = (newPangkat: string) => {
    setPangkat(newPangkat);
    const matchedGol = getGolonganKodeByPangkat(newPangkat);
    if (matchedGol) {
      setGolongan(matchedGol);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return;

    setIsSaving(true);
    setFeedback(null);

    const kodeNama = nama.trim().split(" ")[0].replace(/[^a-zA-Z]/g, "") || "Peg";
    const newPeg: Pegawai = {
      kodeNama,
      no: Date.now().toString().slice(-4),
      nama: nama.trim(),
      nip: nip.trim(),
      golongan: golongan.trim(),
      pangkat: pangkat.trim(),
      jabatan: jabatan.trim() || "Pelaksana",
      jenisKelamin: jenisKelamin,
      kelasJabatan: "",
      namaBank: "",
      nomorRekening: "",
    };

    try {
      const res = await savePegawaiToGoogleSheet(newPeg);
      setIsSaving(false);
      if (res.success) {
        onSave(newPeg);
        setFeedback({ type: "success", text: res.message || "Pegawai berhasil disimpan ke MASTER_PEGAWAI!" });
        setTimeout(() => {
          setNama("");
          setNip("");
          setGolongan("IIIa");
          setPangkat("Penata Muda");
          setJabatan("");
          setFeedback(null);
          onClose();
        }, 1200);
      } else {
        setFeedback({ type: "error", text: res.message || "Gagal menyimpan pegawai." });
      }
    } catch (err: unknown) {
      setIsSaving(false);
      const errMsg = err instanceof Error ? err.message : String(err);
      setFeedback({ type: "error", text: `Terjadi kesalahan: ${errMsg}` });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md transition-all animate-in fade-in duration-200">
      <div className="glass-modal w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-200">
              <UserPlus className="w-4 h-4 text-slate-700" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Tambah Pegawai ke Master Data
              </h3>
              <p className="text-[11px] text-slate-500">
                Tersimpan otomatis ke database cloud <code>MASTER_PEGAWAI</code>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {feedback && (
          <div
            className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 flex items-start gap-2 text-xs animate-in fade-in duration-200"
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-slate-900 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-slate-900 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 leading-tight">{feedback.text}</div>
          </div>
        )}

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
                onChange={(e) => handleGolonganChange(e.target.value)}
                className="input-glass w-full h-10 px-3 font-semibold cursor-pointer"
              >
                {LIST_PANGKAT_GOLONGAN.map((item) => (
                  <option key={item.golonganKode} value={item.golonganKode}>
                    {item.golonganKode}
                  </option>
                ))}
                <option value="Non-PNS">Non-PNS</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700">
                  Pangkat ASN
                </label>
                <span className="text-[10px] text-[#0071e3] font-medium flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5" />
                  Otomatis
                </span>
              </div>
              <input
                type="text"
                value={pangkat}
                onChange={(e) => handlePangkatChange(e.target.value)}
                placeholder="Contoh: Penata Muda"
                className="input-glass w-full h-10 px-3 font-medium bg-slate-50/70"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700">
                  Jabatan Kedinasan
                </label>
                <span className="text-[10px] text-slate-400 font-normal">Isi manual</span>
              </div>
              <input
                type="text"
                value={jabatan}
                onChange={(e) => setJabatan(e.target.value)}
                placeholder="Contoh: Auditor Ahli Muda"
                className="input-glass w-full h-10 px-3 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Jenis Kelamin
              </label>
              <select
                value={jenisKelamin}
                onChange={(e) => setJenisKelamin(e.target.value)}
                className="input-glass w-full h-10 px-3 font-semibold cursor-pointer"
              >
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200/80">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-white/60 cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving || !nama.trim()}
              className="btn-tactile px-4 py-2 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold shadow-sm cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
              <span>{isSaving ? "Menyimpan ke Cloud..." : "Simpan ke Database"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

