"use client";

import React, { useState } from "react";
import { HeaderData, SbmRate, NomorMemo, Pegawai } from "@/lib/types";
import { getKabkotByProvinsi } from "@/data/kabkot";
import { ModalTambahPegawai } from "./ModalTambahPegawai";
import { Info, Plus, Trash2, UserPlus, Wand2 } from "lucide-react";

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

  const handleChange = <K extends keyof HeaderData>(field: K, value: HeaderData[K]) => {
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

            {/* Quick Suggestion Chips for Fast City Selection */}
            {availableKabkot.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10.5px] font-bold text-slate-400">Pilihan Cepat:</span>
                {availableKabkot.slice(0, 4).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      const list = header.kotaTujuanList || [""];
                      if (!list[0]) {
                        handleKotaChange(0, k);
                      } else if (!list.includes(k)) {
                        handleChange("kotaTujuanList", [...list, k]);
                      }
                    }}
                    className="btn-tactile text-[10.5px] px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200 font-medium cursor-pointer transition-all"
                  >
                    + {k}
                  </button>
                ))}
              </div>
            )}
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

        {/* Petugas Verifikasi Dropdown */}
        <div className="space-y-1.5">
          <label className="block font-semibold text-slate-700">
            Petugas Verifikasi
          </label>
          <select
            value={header.petugasVerifikasi}
            onChange={(e) => handleChange("petugasVerifikasi", e.target.value)}
            className="input-glass w-full h-10 px-3 font-semibold cursor-pointer"
          >
            <option value="">-- Pilih Petugas Verifikasi --</option>
            {header.petugasVerifikasi &&
              !pegawaiList.some(
                (p) =>
                  p.nama === header.petugasVerifikasi ||
                  `${p.nama}, NIP. ${p.nip}` === header.petugasVerifikasi ||
                  header.petugasVerifikasi.startsWith(p.nama)
              ) && (
                <option value={header.petugasVerifikasi}>
                  {header.petugasVerifikasi}
                </option>
              )}
            {pegawaiList.map((p) => {
              const fullFormatted = p.nip ? `${p.nama}, NIP. ${p.nip}` : p.nama;
              return (
                <option key={p.kodeNama} value={fullFormatted}>
                  {p.nama} ({p.jabatan})
                </option>
              );
            })}
          </select>
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
          <div className="flex items-center justify-between">
            <label className="block font-semibold text-slate-700">
              Nomor Memorandum
            </label>
            <span className="text-[10px] text-slate-500 font-mono">
              Default: M.xxx/INS/PPK/VIII/2026
            </span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={header.nomorMemo}
              onChange={(e) => handleChange("nomorMemo", e.target.value)}
              placeholder="M.xxx/INS/PPK/VIII/2026"
              className="input-glass flex-1 h-10 px-3 font-medium font-mono text-xs"
            />
            <button
              type="button"
              onClick={onGenerateMemoNumber}
              className="btn-tactile px-3 py-2 rounded-xl glass-control hover:bg-white text-blue-700 text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
              title="Generate nomor memo urut otomatis"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Ambil No</span>
            </button>
          </div>
          <p className="text-[10.5px] text-slate-500">
            Isi nilai <span className="font-mono font-bold text-amber-700 bg-amber-50 px-1 py-0.5 rounded border border-amber-200">xxx</span> pada format default atau gunakan tombol <span className="font-semibold text-blue-600">Ambil No</span>.
          </p>
        </div>

        {/* Penomoran Surat Tugas (ST Staf & ST Pejabat) */}
        <div className="space-y-3 md:col-span-2 lg:col-span-3 p-4 rounded-2xl bg-white/50 border border-slate-200/80 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5">
            <div>
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <span>Penomoran Surat Tugas (ST)</span>
              </h4>
              <p className="text-[11px] text-slate-500">
                Atur nomor Surat Tugas untuk staf dan opsi nomor ST terpisah untuk pejabat (Inspektur / Pimpinan)
              </p>
            </div>

            {/* Checkbox Toggle ST Pejabat */}
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none bg-white/80 px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs hover:bg-white transition-colors">
              <input
                type="checkbox"
                checked={header.useDifferentStPejabat || false}
                onChange={(e) => {
                  const checked = e.target.checked;
                  handleChange("useDifferentStPejabat", checked);
                  if (!checked) {
                    handleChange("nomorStPejabat", "");
                  }
                }}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span>Gunakan Nomor ST Berbeda untuk Pejabat / Inspektur</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {/* Input ST Staf */}
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-700">
                Nomor Surat Tugas (ST Staf / Utama)
              </label>
              <input
                type="text"
                value={header.nomorStStaff || header.nomorStMaster || ""}
                onChange={(e) => {
                  handleChange("nomorStStaff", e.target.value);
                  handleChange("nomorStMaster", e.target.value);
                }}
                placeholder="Contoh: ST-05/INS/KP.01/01/2026"
                className="input-glass w-full h-9 px-3 font-medium"
              />
            </div>

            {/* Input ST Pejabat */}
            {header.useDifferentStPejabat ? (
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-blue-800">
                  Nomor Surat Tugas Khusus Pejabat / Inspektur
                </label>
                <input
                  type="text"
                  value={header.nomorStPejabat || ""}
                  onChange={(e) => handleChange("nomorStPejabat", e.target.value)}
                  placeholder="Contoh: ST-04/INS/KP.01/01/2026"
                  className="input-glass w-full h-9 px-3 font-medium border-blue-300 bg-blue-50/30"
                />
              </div>
            ) : (
              <div className="flex items-center text-[11px] text-slate-500 italic pt-5">
                💡 Pejabat & staf menggunakan nomor Surat Tugas yang sama.
              </div>
            )}
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => onApplyStToAll(header.nomorStStaff || header.nomorStMaster || "")}
              className="btn-tactile px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold cursor-pointer shadow-sm"
            >
              Terapkan ST ke Seluruh Pegawai
            </button>
          </div>
        </div>

        {/* Kode Akun (MAK) & Sub Kegiatan (Komponen) */}
        <div className="space-y-1.5">
          <label className="block font-semibold text-slate-700">Kode Akun (Akun / MAK)</label>
          <input
            type="text"
            value={header.nomorMak}
            onChange={(e) => handleChange("nomorMak", e.target.value)}
            placeholder="Contoh: 524111"
            className="input-glass w-full h-10 px-3 font-mono font-medium"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block font-semibold text-slate-700">Sub Kegiatan (Sub Keg)</label>
          <input
            type="text"
            value={header.nomorKomp}
            onChange={(e) => handleChange("nomorKomp", e.target.value)}
            placeholder="Contoh: 051"
            className="input-glass w-full h-10 px-3 font-mono font-medium"
          />
        </div>

        {/* Data SPJ & Rekap Perdin (Administrasi Keuangan) */}
        <div className="md:col-span-2 lg:col-span-3 p-4 rounded-2xl bg-indigo-50/40 border border-indigo-200/70 shadow-2xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-200/60 pb-2">
            <div>
              <h4 className="font-bold text-indigo-950 text-xs flex items-center gap-1.5">
                <span>Administrasi SPJ & Rekap Perdin</span>
              </h4>
              <p className="text-[11px] text-slate-500">
                Atribut wajib pertanggungjawaban untuk sinkronisasi otomatis ke Tabel Rekap Perdin & Ekspor Excel
              </p>
            </div>
            <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-md bg-indigo-100/80 text-indigo-800 border border-indigo-200">
              Database SPJ
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Jenis Pengajuan*</label>
              <select
                value={header.jenisPengajuan || "RAMPUNG"}
                onChange={(e) => handleChange("jenisPengajuan", e.target.value as "RENCANA" | "RAMPUNG" | "MERAMPUNGKAN")}
                className="input-glass w-full h-9 px-2.5 font-bold text-indigo-900 bg-white cursor-pointer"
              >
                <option value="RAMPUNG">RAMPUNG</option>
                <option value="RENCANA">RENCANA</option>
                <option value="MERAMPUNGKAN">MERAMPUNGKAN</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">No. SPM*</label>
              <input
                type="text"
                value={header.noSpm || ""}
                onChange={(e) => handleChange("noSpm", e.target.value)}
                placeholder="Contoh: 00073T"
                className="input-glass w-full h-9 px-3 font-mono font-bold text-slate-800"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">No. SPBY</label>
              <input
                type="text"
                value={header.noSpby || ""}
                onChange={(e) => handleChange("noSpby", e.target.value)}
                placeholder="Nomor SPBY"
                className="input-glass w-full h-9 px-3 font-mono font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Jenis Perdin*</label>
              <select
                value={header.jenisPerdin || "Perdin Luar Kota"}
                onChange={(e) => handleChange("jenisPerdin", e.target.value as "Perdin Jabodetabekdung" | "Perdin Luar Kota" | "Perdin Luar Negeri")}
                className="input-glass w-full h-9 px-2.5 font-semibold text-slate-800 bg-white cursor-pointer"
              >
                <option value="Perdin Luar Kota">Perdin Luar Kota</option>
                <option value="Perdin Jabodetabekdung">Perdin Jabodetabekdung</option>
                <option value="Perdin Luar Negeri">Perdin Luar Negeri</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Berangkat Dari*</label>
              <input
                type="text"
                value={header.berangkatDari || "Jakarta"}
                onChange={(e) => handleChange("berangkatDari", e.target.value)}
                placeholder="Jakarta"
                className="input-glass w-full h-9 px-3 font-medium"
              />
            </div>
          </div>
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
