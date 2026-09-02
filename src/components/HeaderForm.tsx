"use client";

import React, { useState } from "react";
import { HeaderData, SbmRate, NomorMemo, Pegawai } from "@/lib/types";
import { getKabkotByProvinsi } from "@/data/kabkot";
import { ModalTambahPegawai } from "./ModalTambahPegawai";
import { Info, Plus, Trash2, UserPlus, Sparkles, Wand2, ArrowRight } from "lucide-react";

interface HeaderFormProps {
  header: HeaderData;
  setHeader: React.Dispatch<React.SetStateAction<HeaderData>>;
  sbmList: SbmRate[];
  memoList: NomorMemo[];
  pegawaiList: Pegawai[];
  onAddPegawai: (newPeg: Pegawai) => void;
  onApplyStToAll: (stNumber: string) => void;
  onGenerateMemoNumber: () => void;
}

export const HeaderForm: React.FC<HeaderFormProps> = ({
  header,
  setHeader,
  sbmList,
  pegawaiList,
  onAddPegawai,
  onApplyStToAll,
  onGenerateMemoNumber,
}) => {
  const [isModalTambahPegawaiOpen, setIsModalTambahPegawaiOpen] = useState(false);

  const availableKabkot = getKabkotByProvinsi(header.provinsiTujuan);

  const handleChange = (field: keyof HeaderData, value: any) => {
    setHeader((prev) => ({ ...prev, [field]: value }));
  };

  const handlePpkChange = (namaPegawai: string) => {
    const found = pegawaiList.find((p) => p.nama === namaPegawai);
    if (found) {
      setHeader((prev) => ({
        ...prev,
        ppkNama: found.nama,
        ppkNip: found.nip,
        ppkJabatan: found.jabatan,
      }));
    } else {
      setHeader((prev) => ({
        ...prev,
        ppkNama: namaPegawai,
      }));
    }
  };

  // Dynamic Kota handlers
  const handleKotaChange = (index: number, val: string) => {
    const updated = [...(header.kotaTujuanList || [""])];
    updated[index] = val;
    handleChange("kotaTujuanList", updated);
  };

  const handleAddKota = () => {
    const current = header.kotaTujuanList || [""];
    handleChange("kotaTujuanList", [...current, ""]);
  };

  const handleRemoveKota = (index: number) => {
    const current = header.kotaTujuanList || [""];
    if (current.length <= 1) return;
    const filtered = current.filter((_, idx) => idx !== index);
    handleChange("kotaTujuanList", filtered);
  };

  return (
    <section className="glass-base rounded-3xl p-6 md:p-8 space-y-6">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-700 flex items-center justify-center border border-blue-500/20">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-slate-900">
              1. Data Umum Kegiatan & Penomoran
            </h2>
            <p className="text-xs text-slate-500">
              Informasi dasar kegiatan, tujuan dinas, pejabat penandatangan, dan penomoran resmi
            </p>
          </div>
        </div>

        {/* Action: Tambah Pegawai Baru */}
        <button
          type="button"
          onClick={() => setIsModalTambahPegawaiOpen(true)}
          className="btn-tactile flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl glass-control hover:bg-white text-slate-800 text-xs font-bold cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5 text-blue-600" />
          <span>Tambah Pegawai Baru</span>
        </button>
      </div>

      {/* Main Coherent Form Grid (No Box-in-Box) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
        {/* Keterangan Kegiatan */}
        <div className="space-y-1.5 lg:col-span-2">
          <label className="block font-semibold text-slate-700">
            Keterangan Kegiatan Dinas (Kuitansi, SPD & Nominatif)
          </label>
          <textarea
            rows={2}
            value={header.keteranganKegiatan}
            onChange={(e) => handleChange("keteranganKegiatan", e.target.value)}
            placeholder="Contoh: Perjalanan Dinas dalam rangka Rapat Koordinasi..."
            className="input-glass w-full p-2.5 text-xs font-medium resize-none"
          />
        </div>

        {/* Keterangan Perihal Memorandum */}
        <div className="space-y-1.5">
          <label className="block font-semibold text-slate-700">
            Perihal Memorandum (Hal)
          </label>
          <textarea
            rows={2}
            value={header.keteranganMemo}
            onChange={(e) => handleChange("keteranganMemo", e.target.value)}
            placeholder="Contoh: Permintaan Pembayaran Langsung (LS)..."
            className="input-glass w-full p-2.5 text-xs font-medium resize-none"
          />
        </div>

        {/* Provinsi Tujuan */}
        <div className="space-y-1.5">
          <label className="block font-semibold text-slate-700">
            Provinsi Tujuan (SBM Otomatis)
          </label>
          <select
            value={header.provinsiTujuan}
            onChange={(e) => handleChange("provinsiTujuan", e.target.value)}
            className="input-glass w-full h-10 px-3 font-semibold cursor-pointer"
          >
            {sbmList.map((sbm) => (
              <option key={sbm.provinsi} value={sbm.provinsi}>
                {sbm.provinsi}
              </option>
            ))}
          </select>
        </div>

        {/* Kota/Kabupaten Tujuan (Dinamis +) */}
        <div className="space-y-1.5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <label className="block font-semibold text-slate-700">
              Kota / Kabupaten Tujuan
            </label>
            <button
              type="button"
              onClick={handleAddKota}
              className="btn-tactile flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50/70 hover:bg-blue-100/70 px-2 py-0.5 rounded-lg border border-blue-200/60 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Tambah Kota</span>
            </button>
          </div>

          <div className="space-y-2">
            {(header.kotaTujuanList || [""]).map((kota, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <select
                  value={kota}
                  onChange={(e) => handleKotaChange(idx, e.target.value)}
                  className="input-glass flex-1 h-10 px-3 font-medium cursor-pointer"
                >
                  <option value="">-- Pilih Kota/Kabupaten --</option>
                  {availableKabkot.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>

                {(header.kotaTujuanList || []).length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveKota(idx)}
                    className="p-2 rounded-xl text-rose-500 hover:bg-rose-50/80 border border-transparent hover:border-rose-200 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Unit Kerja */}
        <div className="space-y-1.5">
          <label className="block font-semibold text-slate-700">Unit Kerja</label>
          <input
            type="text"
            value={header.unitKerja}
            onChange={(e) => handleChange("unitKerja", e.target.value)}
            className="input-glass w-full h-10 px-3 font-medium"
          />
        </div>

        {/* PPK Selector */}
        <div className="space-y-1.5">
          <label className="block font-semibold text-slate-700">
            Pejabat Pembuat Komitmen (PPK)
          </label>
          <select
            value={header.ppkNama}
            onChange={(e) => handlePpkChange(e.target.value)}
            className="input-glass w-full h-10 px-3 font-semibold cursor-pointer"
          >
            {pegawaiList.map((p) => (
              <option key={p.kodeNama} value={p.nama}>
                {p.nama} ({p.jabatan})
              </option>
            ))}
          </select>
        </div>

        {/* Bendahara Pengeluaran */}
        <div className="space-y-1.5">
          <label className="block font-semibold text-slate-700">
            Bendahara Pengeluaran
          </label>
          <input
            type="text"
            value={header.bendahara}
            onChange={(e) => handleChange("bendahara", e.target.value)}
            className="input-glass w-full h-10 px-3 font-medium"
          />
        </div>

        {/* Petugas Verifikasi */}
        <div className="space-y-1.5">
          <label className="block font-semibold text-slate-700">
            Petugas Verifikasi
          </label>
          <input
            type="text"
            value={header.petugasVerifikasi}
            onChange={(e) => handleChange("petugasVerifikasi", e.target.value)}
            className="input-glass w-full h-10 px-3 font-medium"
          />
        </div>

        {/* Tanggal SPD & Tanggal Memo */}
        <div className="space-y-1.5">
          <label className="block font-semibold text-slate-700">Tanggal SPD</label>
          <input
            type="date"
            value={header.tanggalSpd}
            onChange={(e) => handleChange("tanggalSpd", e.target.value)}
            className="input-glass w-full h-10 px-3 font-medium cursor-pointer"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block font-semibold text-slate-700">Tanggal Memorandum</label>
          <input
            type="date"
            value={header.tanggalMemo}
            onChange={(e) => handleChange("tanggalMemo", e.target.value)}
            className="input-glass w-full h-10 px-3 font-medium cursor-pointer"
          />
        </div>

        {/* Nomor Memorandum (with auto generator) */}
        <div className="space-y-1.5">
          <label className="block font-semibold text-slate-700">
            Nomor Memorandum
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={header.nomorMemo}
              onChange={(e) => handleChange("nomorMemo", e.target.value)}
              className="input-glass flex-1 h-10 px-3 font-medium"
            />
            <button
              type="button"
              onClick={onGenerateMemoNumber}
              className="btn-tactile px-3 py-2 rounded-xl glass-control hover:bg-white text-blue-700 text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Ambil No</span>
            </button>
          </div>
        </div>

        {/* Nomor Surat Tugas Master */}
        <div className="space-y-1.5">
          <label className="block font-semibold text-slate-700">
            Nomor ST Master (Terapkan Massal)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={header.nomorStMaster}
              onChange={(e) => handleChange("nomorStMaster", e.target.value)}
              className="input-glass flex-1 h-10 px-3 font-medium"
            />
            <button
              type="button"
              onClick={() => onApplyStToAll(header.nomorStMaster)}
              className="btn-tactile px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
            >
              Terapkan
            </button>
          </div>
        </div>

        {/* MAK & Akun */}
        <div className="space-y-1.5">
          <label className="block font-semibold text-slate-700">Kode MAK</label>
          <input
            type="text"
            value={header.nomorMak}
            onChange={(e) => handleChange("nomorMak", e.target.value)}
            className="input-glass w-full h-10 px-3 font-mono font-medium"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block font-semibold text-slate-700">Kode Komponen</label>
          <input
            type="text"
            value={header.nomorKomp}
            onChange={(e) => handleChange("nomorKomp", e.target.value)}
            className="input-glass w-full h-10 px-3 font-mono font-medium"
          />
        </div>
      </div>

      {/* Modal Tambah Pegawai Baru */}
      <ModalTambahPegawai
        isOpen={isModalTambahPegawaiOpen}
        onClose={() => setIsModalTambahPegawaiOpen(false)}
        onSave={(newPeg) => {
          onAddPegawai(newPeg);
          setIsModalTambahPegawaiOpen(false);
        }}
      />
    </section>
  );
};
