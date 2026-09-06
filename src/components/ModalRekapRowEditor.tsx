"use client";

import React, { useState } from "react";
import { X, Save, FileSpreadsheet, Calculator } from "lucide-react";

interface ModalRekapRowEditorProps {
  isOpen: boolean;
  mode: "create" | "edit";
  initialData?: Record<string, unknown> | null;
  onClose: () => void;
  onSave: (row: Record<string, unknown>) => void;
}
const getDefaultFormData = (): Record<string, unknown> => ({
  "No SPBY": "",
  "JENIS PENGAJUAN": "RAMPUNG",
  "No SPM": "00073T",
  "": "",
  "NAMA PEGAWAI INTERNAL INSPEKTORAT": "",
  "NAMA EXTERNAL": "",
  NIP: "",
  Gol: "III/a",
  Jabatan: "Pelaksana",
  "Jenis Perdin": "Perdin Luar Kota",
  "Status Pegawai": "PNS",
  "Nama Kegiatan": "",
  "No Surat Tugas": "",
  "Unit Kerja": "INSPEKTORAT",
  Angkutan: "Angkutan Darat",
  "Berangkat dari-": "Jakarta",
  "Tujuan ke-": "",
  "Tgl Berangkat": new Date().toISOString().split("T")[0],
  "Tgl Kembali": new Date().toISOString().split("T")[0],
  "Nomor Tiket": "",
  "Nama Maskapai": "",
  "Kode Booking": "",
  "Boarding Pass (Ada/Tidak)": "ADA",
  "Nama Penginapan": "",
  "Tanggal Check In": "",
  "Tanggal Check Out": "",
  "Jumlah Hari Menginap": 0,
  "Lama Hari 100%": 1,
  "Lama Hari 40%": 0,
  "Total Hari": 1,
  "UH 100% ()": 0,
  "UH 40% ()": 0,
  "UH Fullboard/Fullday/Halfday/Diklat": 0,
  "Biaya Penginapan Biasa (Hotel)": 0,
  "Penginapan 30%": 0,
  "Biaya Fullboard/Fullday/Halfday ()": 0,
  "Kurs ()": 0,
  "Riil ()": 0,
  "Harga Fare Tiket Pergi ()": 0,
  "Harga FareTiket Pulang ()": 0,
  "Transport Jakarta PP": 0,
  "Transport Daerah PP": 0,
  "Biaya Transport ()": 0,
  "Sewa kendaraan ()": 0,
  "Representatif ()": 0,
  "Taksi Bandara": 0,
  "Biaya Reschedule ()": 0,
  Total: 0,
  "Nilai Nominal di Daftar Nominatif": 0,
  PENGEMBALIAN: 0,
});

const ModalRekapRowEditorDialog: React.FC<ModalRekapRowEditorProps> = ({
  mode,
  initialData,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Record<string, unknown>>(() => {
    return initialData ? { ...initialData } : getDefaultFormData();
  });
  const [activeSubTab, setActiveSubTab] = useState<"admin" | "travel" | "costs" | "other">("admin");


  const handleChange = (field: string, value: unknown) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Auto-calculate Total if cost components change
      const costFields = [
        "UH 100% ()",
        "UH 40% ()",
        "UH Fullboard/Fullday/Halfday/Diklat",
        "Biaya Penginapan Biasa (Hotel)",
        "Penginapan 30%",
        "Biaya Fullboard/Fullday/Halfday ()",
        "Riil ()",
        "Harga Fare Tiket Pergi ()",
        "Harga FareTiket Pulang ()",
        "Transport Jakarta PP",
        "Transport Daerah PP",
        "Biaya Transport ()",
        "Sewa kendaraan ()",
        "Representatif ()",
        "Taksi Bandara",
        "Biaya Reschedule ()",
      ];

      const sum = costFields.reduce((acc, f) => acc + (Number(updated[f]) || 0), 0);
      updated["Total"] = sum;
      updated["Nilai Nominal di Daftar Nominatif"] = sum;

      return updated;
    });
  };

  const handleRecalculateTotal = () => {
    const costFields = [
      "UH 100% ()",
      "UH 40% ()",
      "UH Fullboard/Fullday/Halfday/Diklat",
      "Biaya Penginapan Biasa (Hotel)",
      "Penginapan 30%",
      "Biaya Fullboard/Fullday/Halfday ()",
      "Riil ()",
      "Harga Fare Tiket Pergi ()",
      "Harga FareTiket Pulang ()",
      "Transport Jakarta PP",
      "Transport Daerah PP",
      "Biaya Transport ()",
      "Sewa kendaraan ()",
      "Representatif ()",
      "Taksi Bandara",
      "Biaya Reschedule ()",
    ];

    const sum = costFields.reduce((acc, f) => acc + (Number(formData[f]) || 0), 0);
    setFormData((prev) => ({
      ...prev,
      Total: sum,
      "Nilai Nominal di Daftar Nominatif": sum,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-slate-200 text-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight text-slate-900">
                {mode === "create" ? "Tambah Baris Rekap Perdin (48 Kolom)" : "Edit Data Rekap Perdin"}
              </h3>
              <p className="text-[11px] text-slate-500">
                {mode === "create"
                  ? "Input data transaksi pertanggungjawaban dinas langsung ke database rekap"
                  : `Ubah data rekap untuk: ${formData["NAMA PEGAWAI INTERNAL INSPEKTORAT"] || formData["NAMA EXTERNAL"] || "Pegawai"}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveSubTab("admin")}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-all cursor-pointer ${
              activeSubTab === "admin"
                ? "border-[#0071e3] text-[#0071e3]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            1. Administrasi & Pegawai
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("travel")}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-all cursor-pointer ${
              activeSubTab === "travel"
                ? "border-[#0071e3] text-[#0071e3]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            2. Kegiatan & Transportasi
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("costs")}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-all cursor-pointer ${
              activeSubTab === "costs"
                ? "border-[#0071e3] text-[#0071e3]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            3. Uang Harian & Penginapan
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("other")}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-all cursor-pointer ${
              activeSubTab === "other"
                ? "border-[#0071e3] text-[#0071e3]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            4. Biaya Lainnya & Total
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs text-slate-700">
          {/* TAB 1: ADMINISTRASI & PEGAWAI */}
          {activeSubTab === "admin" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">No. SPBY</label>
                  <input
                    type="text"
                    value={String(formData["No SPBY"] || "")}
                    onChange={(e) => handleChange("No SPBY", e.target.value)}
                    placeholder="Contoh: 0012/SPBY/2026"
                    className="input-glass w-full h-8 px-2.5 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Jenis Pengajuan</label>
                  <select
                    value={String(formData["JENIS PENGAJUAN"] || "RAMPUNG")}
                    onChange={(e) => handleChange("JENIS PENGAJUAN", e.target.value)}
                    className="input-glass w-full h-8 px-2 text-xs font-medium cursor-pointer"
                  >
                    <option value="RAMPUNG">RAMPUNG</option>
                    <option value="RENCANA">RENCANA</option>
                    <option value="MERAMPUNGKAN">MERAMPUNGKAN</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">No. SPM</label>
                  <input
                    type="text"
                    value={String(formData["No SPM"] || "")}
                    onChange={(e) => handleChange("No SPM", e.target.value)}
                    placeholder="00073T"
                    className="input-glass w-full h-8 px-2.5 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Nama Pegawai Internal</label>
                  <input
                    type="text"
                    value={String(formData["NAMA PEGAWAI INTERNAL INSPEKTORAT"] || "")}
                    onChange={(e) => handleChange("NAMA PEGAWAI INTERNAL INSPEKTORAT", e.target.value)}
                    placeholder="Nama Pegawai Internal"
                    className="input-glass w-full h-8 px-2.5 text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Nama External (Jika Ada)</label>
                  <input
                    type="text"
                    value={String(formData["NAMA EXTERNAL"] || "")}
                    onChange={(e) => handleChange("NAMA EXTERNAL", e.target.value)}
                    placeholder="Kosongkan jika pegawai internal"
                    className="input-glass w-full h-8 px-2.5 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-slate-700">NIP</label>
                  <input
                    type="text"
                    value={String(formData["NIP"] || "")}
                    onChange={(e) => handleChange("NIP", e.target.value)}
                    placeholder="19800512..."
                    className="input-glass w-full h-8 px-2.5 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Golongan</label>
                  <input
                    type="text"
                    value={String(formData["Gol"] || "")}
                    onChange={(e) => handleChange("Gol", e.target.value)}
                    placeholder="III/a"
                    className="input-glass w-full h-8 px-2.5 text-xs text-center font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Status Pegawai</label>
                  <select
                    value={String(formData["Status Pegawai"] || "PNS")}
                    onChange={(e) => handleChange("Status Pegawai", e.target.value)}
                    className="input-glass w-full h-8 px-2 text-xs cursor-pointer"
                  >
                    <option value="PNS">PNS</option>
                    <option value="Non-PNS">Non-PNS</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Jabatan</label>
                  <input
                    type="text"
                    value={String(formData["Jabatan"] || "")}
                    onChange={(e) => handleChange("Jabatan", e.target.value)}
                    placeholder="Auditor Muda / Pelaksana"
                    className="input-glass w-full h-8 px-2.5 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Unit Kerja</label>
                  <input
                    type="text"
                    value={String(formData["Unit Kerja"] || "INSPEKTORAT")}
                    onChange={(e) => handleChange("Unit Kerja", e.target.value)}
                    placeholder="INSPEKTORAT"
                    className="input-glass w-full h-8 px-2.5 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KEGIATAN & TRANSPORTASI */}
          {activeSubTab === "travel" && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Nama Kegiatan Dinas</label>
                <textarea
                  rows={2}
                  value={String(formData["Nama Kegiatan"] || "")}
                  onChange={(e) => handleChange("Nama Kegiatan", e.target.value)}
                  placeholder="Deskripsi kegiatan perjalanan dinas"
                  className="input-glass w-full p-2.5 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">No. Surat Tugas (ST)</label>
                  <input
                    type="text"
                    value={String(formData["No Surat Tugas"] || "")}
                    onChange={(e) => handleChange("No Surat Tugas", e.target.value)}
                    placeholder="ST-05/INS/01/2026"
                    className="input-glass w-full h-8 px-2.5 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Jenis Perdin</label>
                  <select
                    value={String(formData["Jenis Perdin"] || "Perdin Luar Kota")}
                    onChange={(e) => handleChange("Jenis Perdin", e.target.value)}
                    className="input-glass w-full h-8 px-2 text-xs cursor-pointer"
                  >
                    <option value="Perdin Luar Kota">Perdin Luar Kota</option>
                    <option value="Perdin Jabodetabekdung">Perdin Jabodetabekdung</option>
                    <option value="Perdin Luar Negeri">Perdin Luar Negeri</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Moda Angkutan</label>
                  <select
                    value={String(formData["Angkutan"] || "Angkutan Darat")}
                    onChange={(e) => handleChange("Angkutan", e.target.value)}
                    className="input-glass w-full h-8 px-2 text-xs cursor-pointer"
                  >
                    <option value="Angkutan Darat">Angkutan Darat</option>
                    <option value="Pesawat Udara">Pesawat Udara</option>
                    <option value="Kereta Api">Kereta Api</option>
                    <option value="Kapal Laut">Kapal Laut</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Berangkat dari</label>
                  <input
                    type="text"
                    value={String(formData["Berangkat dari-"] || "Jakarta")}
                    onChange={(e) => handleChange("Berangkat dari-", e.target.value)}
                    placeholder="Jakarta"
                    className="input-glass w-full h-8 px-2.5 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Tujuan ke</label>
                  <input
                    type="text"
                    value={String(formData["Tujuan ke-"] || "")}
                    onChange={(e) => handleChange("Tujuan ke-", e.target.value)}
                    placeholder="Kota / Provinsi Tujuan"
                    className="input-glass w-full h-8 px-2.5 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Tgl Berangkat</label>
                  <input
                    type="date"
                    value={String(formData["Tgl Berangkat"] || "")}
                    onChange={(e) => handleChange("Tgl Berangkat", e.target.value)}
                    className="input-glass w-full h-8 px-2 text-xs cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Tgl Kembali</label>
                  <input
                    type="date"
                    value={String(formData["Tgl Kembali"] || "")}
                    onChange={(e) => handleChange("Tgl Kembali", e.target.value)}
                    className="input-glass w-full h-8 px-2 text-xs cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Total Durasi Hari</label>
                  <input
                    type="number"
                    min={1}
                    value={Number(formData["Total Hari"]) || 1}
                    onChange={(e) => handleChange("Total Hari", parseInt(e.target.value) || 1)}
                    className="input-glass w-full h-8 px-2.5 text-xs font-mono text-center"
                  />
                </div>
              </div>

              {/* Rincian Tiket */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                <span className="font-semibold text-slate-800 block text-[11.5px]">Rincian Tiket Pesawat / KA</span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-medium text-slate-600">No. Tiket</label>
                    <input
                      type="text"
                      value={String(formData["Nomor Tiket"] || "")}
                      onChange={(e) => handleChange("Nomor Tiket", e.target.value)}
                      placeholder="No Tiket"
                      className="input-glass w-full h-7 px-2 text-[11px] font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-medium text-slate-600">Maskapai</label>
                    <input
                      type="text"
                      value={String(formData["Nama Maskapai"] || "")}
                      onChange={(e) => handleChange("Nama Maskapai", e.target.value)}
                      placeholder="Maskapai"
                      className="input-glass w-full h-7 px-2 text-[11px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-medium text-slate-600">Kode Booking</label>
                    <input
                      type="text"
                      value={String(formData["Kode Booking"] || "")}
                      onChange={(e) => handleChange("Kode Booking", e.target.value.toUpperCase())}
                      placeholder="Kode Booking"
                      className="input-glass w-full h-7 px-2 text-[11px] font-mono uppercase"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-medium text-slate-600">Boarding Pass</label>
                    <select
                      value={String(formData["Boarding Pass (Ada/Tidak)"] || "ADA")}
                      onChange={(e) => handleChange("Boarding Pass (Ada/Tidak)", e.target.value)}
                      className="input-glass w-full h-7 px-2 text-[11px] cursor-pointer"
                    >
                      <option value="ADA">ADA</option>
                      <option value="TIDAK">TIDAK</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-medium text-slate-600">Harga Fare Pergi (Rp)</label>
                    <input
                      type="number"
                      value={Number(formData["Harga Fare Tiket Pergi ()"]) || 0}
                      onChange={(e) => handleChange("Harga Fare Tiket Pergi ()", parseFloat(e.target.value) || 0)}
                      className="input-glass w-full h-7 px-2 text-[11px] font-mono text-right"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-medium text-slate-600">Harga Fare Pulang (Rp)</label>
                    <input
                      type="number"
                      value={Number(formData["Harga FareTiket Pulang ()"]) || 0}
                      onChange={(e) => handleChange("Harga FareTiket Pulang ()", parseFloat(e.target.value) || 0)}
                      className="input-glass w-full h-7 px-2 text-[11px] font-mono text-right"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: UANG HARIAN & PENGINAPAN */}
          {activeSubTab === "costs" && (
            <div className="space-y-4">
              {/* Uang Harian Section (Separation of Duration vs Paid UH Days) */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 text-[11.5px]">
                    Uang Harian (Hari yang Dibayarkan & Tarif SBM)
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Durasi dinas: {String(formData["Total Hari"] || 1)} hr
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1.5">
                    <span className="font-medium text-slate-700 block">UH Biasa (100%)</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500">Lama Hari</label>
                        <input
                          type="number"
                          min={0}
                          value={Number(formData["Lama Hari 100%"]) || 0}
                          onChange={(e) => handleChange("Lama Hari 100%", parseInt(e.target.value) || 0)}
                          className="input-glass w-full h-7 px-2 text-[11px] font-mono text-center"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500">Total Biaya (Rp)</label>
                        <input
                          type="number"
                          value={Number(formData["UH 100% ()"]) || 0}
                          onChange={(e) => handleChange("UH 100% ()", parseFloat(e.target.value) || 0)}
                          className="input-glass w-full h-7 px-2 text-[11px] font-mono text-right"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1.5">
                    <span className="font-medium text-slate-700 block">UH Diklat / Workshop (60%)</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500">Lama Hari</label>
                        <input
                          type="number"
                          min={0}
                          value={Number(formData["Lama Hari 40%"]) || 0}
                          onChange={(e) => handleChange("Lama Hari 40%", parseInt(e.target.value) || 0)}
                          className="input-glass w-full h-7 px-2 text-[11px] font-mono text-center"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500">Total Biaya (Rp)</label>
                        <input
                          type="number"
                          value={Number(formData["UH 40% ()"]) || 0}
                          onChange={(e) => handleChange("UH 40% ()", parseFloat(e.target.value) || 0)}
                          className="input-glass w-full h-7 px-2 text-[11px] font-mono text-right"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10.5px] font-medium text-slate-600">
                    UH Fullboard / Fullday / Halfday (Rp)
                  </label>
                  <input
                    type="number"
                    value={Number(formData["UH Fullboard/Fullday/Halfday/Diklat"]) || 0}
                    onChange={(e) =>
                      handleChange("UH Fullboard/Fullday/Halfday/Diklat", parseFloat(e.target.value) || 0)
                    }
                    className="input-glass w-full h-7 px-2 text-[11px] font-mono text-right"
                  />
                </div>
              </div>

              {/* Penginapan & Hotel Section */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                <span className="font-semibold text-slate-800 block text-[11.5px]">Akomodasi / Penginapan</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10.5px] font-medium text-slate-600">Nama Hotel / Penginapan</label>
                    <input
                      type="text"
                      value={String(formData["Nama Penginapan"] || "")}
                      onChange={(e) => handleChange("Nama Penginapan", e.target.value)}
                      placeholder="Nama Hotel"
                      className="input-glass w-full h-7 px-2 text-[11px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-medium text-slate-600">Jumlah Malam</label>
                    <input
                      type="number"
                      min={0}
                      value={Number(formData["Jumlah Hari Menginap"]) || 0}
                      onChange={(e) => handleChange("Jumlah Hari Menginap", parseInt(e.target.value) || 0)}
                      className="input-glass w-full h-7 px-2 text-[11px] font-mono text-center"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-medium text-slate-600">Tgl Check In</label>
                    <input
                      type="date"
                      value={String(formData["Tanggal Check In"] || "")}
                      onChange={(e) => handleChange("Tanggal Check In", e.target.value)}
                      className="input-glass w-full h-7 px-2 text-[11px] cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-medium text-slate-600">Tgl Check Out</label>
                    <input
                      type="date"
                      value={String(formData["Tanggal Check Out"] || "")}
                      onChange={(e) => handleChange("Tanggal Check Out", e.target.value)}
                      className="input-glass w-full h-7 px-2 text-[11px] cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-medium text-slate-600">Biaya Hotel Riil (Rp)</label>
                    <input
                      type="number"
                      value={Number(formData["Biaya Penginapan Biasa (Hotel)"]) || 0}
                      onChange={(e) =>
                        handleChange("Biaya Penginapan Biasa (Hotel)", parseFloat(e.target.value) || 0)
                      }
                      className="input-glass w-full h-7 px-2 text-[11px] font-mono text-right"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-medium text-slate-600">Penginapan 30% SBM (Rp)</label>
                    <input
                      type="number"
                      value={Number(formData["Penginapan 30%"]) || 0}
                      onChange={(e) => handleChange("Penginapan 30%", parseFloat(e.target.value) || 0)}
                      className="input-glass w-full h-7 px-2 text-[11px] font-mono text-right"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BIAYA LAINNYA & RINGKASAN TOTAL */}
          {activeSubTab === "other" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Transport Jakarta PP</label>
                  <input
                    type="number"
                    value={Number(formData["Transport Jakarta PP"]) || 0}
                    onChange={(e) => handleChange("Transport Jakarta PP", parseFloat(e.target.value) || 0)}
                    className="input-glass w-full h-8 px-2 text-xs font-mono text-right"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Transport Daerah PP</label>
                  <input
                    type="number"
                    value={Number(formData["Transport Daerah PP"]) || 0}
                    onChange={(e) => handleChange("Transport Daerah PP", parseFloat(e.target.value) || 0)}
                    className="input-glass w-full h-8 px-2 text-xs font-mono text-right"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Biaya Transport Darat/Lokal</label>
                  <input
                    type="number"
                    value={Number(formData["Biaya Transport ()"]) || 0}
                    onChange={(e) => handleChange("Biaya Transport ()", parseFloat(e.target.value) || 0)}
                    className="input-glass w-full h-8 px-2 text-xs font-mono text-right"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Sewa Kendaraan (Rp)</label>
                  <input
                    type="number"
                    value={Number(formData["Sewa kendaraan ()"]) || 0}
                    onChange={(e) => handleChange("Sewa kendaraan ()", parseFloat(e.target.value) || 0)}
                    className="input-glass w-full h-8 px-2 text-xs font-mono text-right"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Taksi Bandara (Rp)</label>
                  <input
                    type="number"
                    value={Number(formData["Taksi Bandara"]) || 0}
                    onChange={(e) => handleChange("Taksi Bandara", parseFloat(e.target.value) || 0)}
                    className="input-glass w-full h-8 px-2 text-xs font-mono text-right"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Biaya Reschedule (Rp)</label>
                  <input
                    type="number"
                    value={Number(formData["Biaya Reschedule ()"]) || 0}
                    onChange={(e) => handleChange("Biaya Reschedule ()", parseFloat(e.target.value) || 0)}
                    className="input-glass w-full h-8 px-2 text-xs font-mono text-right"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Pengeluaran Riil (Rp)</label>
                  <input
                    type="number"
                    value={Number(formData["Riil ()"]) || 0}
                    onChange={(e) => handleChange("Riil ()", parseFloat(e.target.value) || 0)}
                    className="input-glass w-full h-8 px-2 text-xs font-mono text-right"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Paket Meeting / Fullboard</label>
                  <input
                    type="number"
                    value={Number(formData["Biaya Fullboard/Fullday/Halfday ()"]) || 0}
                    onChange={(e) =>
                      handleChange("Biaya Fullboard/Fullday/Halfday ()", parseFloat(e.target.value) || 0)
                    }
                    className="input-glass w-full h-8 px-2 text-xs font-mono text-right"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Uang Representatif (Rp)</label>
                  <input
                    type="number"
                    value={Number(formData["Representatif ()"]) || 0}
                    onChange={(e) => handleChange("Representatif ()", parseFloat(e.target.value) || 0)}
                    className="input-glass w-full h-8 px-2 text-xs font-mono text-right"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Kurs Valuta (Jika LN)</label>
                  <input
                    type="number"
                    value={Number(formData["Kurs ()"]) || 0}
                    onChange={(e) => handleChange("Kurs ()", parseFloat(e.target.value) || 0)}
                    className="input-glass w-full h-8 px-2 text-xs font-mono text-right"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-rose-700">Pengembalian Kas (Rp)</label>
                  <input
                    type="number"
                    value={Number(formData["PENGEMBALIAN"]) || 0}
                    onChange={(e) => handleChange("PENGEMBALIAN", parseFloat(e.target.value) || 0)}
                    className="input-glass w-full h-8 px-2 text-xs font-mono text-right text-rose-700 bg-rose-50/40"
                  />
                </div>
              </div>

              {/* Grand Total Box */}
              <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block text-xs">Total Biaya SPJ Perdin:</span>
                  <span className="text-[11px] text-slate-500">
                    Akumulasi otomatis seluruh komponen biaya yang diinput
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleRecalculateTotal}
                    className="btn-tactile text-[11px] px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 flex items-center gap-1 cursor-pointer"
                    title="Hitung ulang total penjumlahan"
                  >
                    <Calculator className="w-3 h-3" />
                    <span>Hitung Ulang</span>
                  </button>
                  <span className="font-mono font-black text-sm md:text-base text-slate-900">
                    Rp {(Number(formData["Total"]) || 0).toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              {activeSubTab === "admin"
                ? "Langkah 1 dari 4: Identitas & Administrasi"
                : activeSubTab === "travel"
                ? "Langkah 2 dari 4: Detail Perjalanan"
                : activeSubTab === "costs"
                ? "Langkah 3 dari 4: Uang Harian & Penginapan"
                : "Langkah 4 dari 4: Komponen Lain & Total"}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-tactile px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="btn-tactile px-4 py-1.5 rounded-lg bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Baris Rekap</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export const ModalRekapRowEditor: React.FC<ModalRekapRowEditorProps> = (props) => {
  if (!props.isOpen) return null;
  const dialogKey = props.initialData
    ? `${props.mode}_${String(props.initialData["NIP"] || props.initialData["NAMA PEGAWAI INTERNAL INSPEKTORAT"] || "")}_${String(props.initialData["Total"] || "")}`
    : `create_${props.mode}`;

  return <ModalRekapRowEditorDialog key={dialogKey} {...props} />;
};

