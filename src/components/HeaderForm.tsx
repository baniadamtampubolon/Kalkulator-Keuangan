"use client";

import React, { useState } from "react";
import { HeaderData, SbmRate, NomorMemo, Pegawai } from "@/lib/types";
import { getKabkotByProvinsi } from "@/data/kabkot";
import {
  LIST_NOMOR_MAK,
  LIST_NOMOR_KOMPONEN,
  getMakAkunName,
  getKomponenName,
  getItemDetailsForMak,
  OPSI_PERIHAL_MEMORANDUM,
} from "@/data/mak_akun";
import { generateIdKegiatan } from "@/lib/kegiatanHelper";
import { getMonthRoman, updateMemoNumberWithDate } from "@/lib/calc";
import { ModalTambahPegawai } from "./ModalTambahPegawai";
import {
  FileText,
  MapPin,
  Landmark,
  FileCheck2,
  Users2,
  Plus,
  Trash2,
  UserPlus,
  Wand2,
  CheckCircle2,
  FolderKanban,
} from "lucide-react";

interface HeaderFormProps {
  header: HeaderData;
  setHeader: React.Dispatch<React.SetStateAction<HeaderData>>;
  sbmList: SbmRate[];
  memoList: NomorMemo[];
  pegawaiList: Pegawai[];
  onAddPegawai: (newPeg: Pegawai) => void;
  onApplyStToAll: (stNumber: string) => void;
  onGenerateMemoNumber: () => void;
  onOpenDaftarKegiatan?: () => void;
}

export const HeaderForm: React.FC<HeaderFormProps> = ({
  header,
  setHeader,
  sbmList,
  memoList,
  pegawaiList,
  onAddPegawai,
  onApplyStToAll,
  onGenerateMemoNumber,
  onOpenDaftarKegiatan,
}) => {
  const [isModalTambahPegawaiOpen, setIsModalTambahPegawaiOpen] = useState(false);
  const [isCustomItemDetail, setIsCustomItemDetail] = useState(false);

  // Daftar item detail sub-kategori MAK yang cocok dengan nomor Komponen & nomor MAK aktif
  const availableItemDetails = React.useMemo(() => {
    return getItemDetailsForMak(header.nomorKomp, header.nomorMak);
  }, [header.nomorKomp, header.nomorMak]);

  // Mode input Perihal Memorandum: dropdown preset vs custom textarea (dihitung otomatis tanpa effect)
  const [isManualOverride, setIsManualOverride] = useState<boolean | null>(null);
  const isCustomMemo =
    isManualOverride !== null
      ? isManualOverride
      : Boolean(header.keteranganMemo && !OPSI_PERIHAL_MEMORANDUM.includes(header.keteranganMemo));

  // Deteksi nomor memorandum terakhir yang sudah terdaftar di master database
  const latestMemoInfo = React.useMemo(() => {
    if (!memoList || memoList.length === 0) return null;
    let maxNum = 0;
    let lastMemoStr = "";
    for (const m of memoList) {
      let numVal = 0;
      if (m.nomor_urut && !isNaN(Number(m.nomor_urut))) {
        numVal = Number(m.nomor_urut);
      } else if (m.nomor && !isNaN(parseInt(m.nomor, 10))) {
        numVal = parseInt(m.nomor, 10);
      } else {
        const str = m.format_lengkap || m.noMemo || "";
        if (str) {
          const match = str.match(/\bM\.?(\d+)/i) || str.match(/(\d+)/);
          if (match) numVal = parseInt(match[1], 10);
        }
      }

      const isUsed = Boolean(
        (m.status && String(m.status).trim().toUpperCase().includes("TERPAKAI")) ||
        (m.id_kegiatan_ref && String(m.id_kegiatan_ref).trim().length > 0) ||
        (m.perihal && String(m.perihal).trim().length > 0) ||
        (m.tanggal_memo && String(m.tanggal_memo).trim().length > 0) ||
        (m.noMemo && m.tanggal)
      );

      if (isUsed && numVal > maxNum) {
        maxNum = numVal;
        lastMemoStr = m.format_lengkap || m.noMemo || `M.${numVal}${m.unit || "/INS/PPK/"}${m.bulanRomawi || "XI"}${m.tahun || "/2026"}`;
      }
    }
    return {
      lastMemoStr: lastMemoStr || (maxNum > 0 ? `M.${maxNum}/INS/PPK/XI/2026` : null),
      maxNum: maxNum || 320,
    };
  }, [memoList]);

  // Bulan Romawi (I-XII) dan Tahun otomatis mengikuti Tanggal Memo
  const currentMemoRomanMonth = React.useMemo(() => {
    return getMonthRoman(header.tanggalMemo) || getMonthRoman(new Date()) || "XI";
  }, [header.tanggalMemo]);

  const currentMemoYear = React.useMemo(() => {
    if (header.tanggalMemo) {
      const d = new Date(header.tanggalMemo);
      if (!isNaN(d.getTime())) return String(d.getFullYear());
    }
    return String(new Date().getFullYear());
  }, [header.tanggalMemo]);

  const availableKabkot = getKabkotByProvinsi(header.provinsiTujuan);

  // Opsi Petugas Verifikasi khusus: Hanya Taufik Prasetyo & Noviarty Ningsi Sumirat (Noviati)
  const verifikatorOptions = React.useMemo(() => {
    const foundTaufik = pegawaiList.find(
      (p) => p.kodeNama === "Taufik" || (p.nama && p.nama.toLowerCase().includes("taufik"))
    );
    const foundNovi = pegawaiList.find(
      (p) =>
        p.kodeNama === "Novi" ||
        (p.nama && (p.nama.toLowerCase().includes("noviart") || p.nama.toLowerCase().includes("noviat")))
    );

    const taufikObj = {
      nama: foundTaufik?.nama || "Taufik Prasetyo, SKom",
      nip: foundTaufik?.nip || "19900826202521 1 026",
      value: foundTaufik?.nip
        ? `${foundTaufik.nama}, NIP. ${foundTaufik.nip}`
        : "Taufik Prasetyo, SKom, NIP. 19900826202521 1 026",
      label: `Taufik Prasetyo, SKom (${foundTaufik?.jabatan || "Penata Layanan Operasional"})`,
    };

    const noviObj = {
      nama: foundNovi?.nama || "Noviarty Ningsi Sumirat, S.E",
      nip: foundNovi?.nip || "19811112201001 2 001",
      value: foundNovi?.nip
        ? `${foundNovi.nama}, NIP. ${foundNovi.nip}`
        : "Noviarty Ningsi Sumirat, S.E, NIP. 19811112201001 2 001",
      label: `Noviarty Ningsi Sumirat, S.E (${foundNovi?.jabatan || "Penyusun Bahan Kebijakan"})`,
    };

    return [taufikObj, noviObj];
  }, [pegawaiList]);

  const handleChange = <K extends keyof HeaderData>(field: K, value: HeaderData[K]) => {
    // Otomatis sinkronkan bulan Romawi dan tahun pada nomor memo saat tanggalMemo berubah
    if (field === "tanggalMemo" && typeof value === "string") {
      setHeader((prev) => {
        const next = { ...prev, [field]: value };
        if (prev.nomorMemo && prev.nomorMemo.trim() !== "") {
          next.nomorMemo = updateMemoNumberWithDate(prev.nomorMemo, value);
        }
        return next;
      });
      return;
    }
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

  const handlePenanggungJawabChange = (namaPegawai: string) => {
    const found = pegawaiList.find((p) => p.nama === namaPegawai);
    if (found) {
      setHeader((prev) => ({
        ...prev,
        penanggungJawabNama: found.nama,
        penanggungJawabNip: found.nip,
        penanggungJawabJabatan: found.jabatan,
      }));
    } else {
      setHeader((prev) => ({
        ...prev,
        penanggungJawabNama: namaPegawai,
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

  const updateIdKegiatan = (newDate?: string, newUrut?: string, newKategori?: "A" | "B") => {
    const d = newDate !== undefined ? newDate : header.tanggalSpd;
    const u = newUrut !== undefined ? newUrut : (header.noKegiatanUrut || "01");
    const k = newKategori !== undefined ? newKategori : (header.kategoriSpj || "A");
    const newId = generateIdKegiatan(d, u, k);
    setHeader((prev) => ({
      ...prev,
      tanggalSpd: d,
      noKegiatanUrut: u,
      kategoriSpj: k,
      idKegiatan: newId,
    }));
  };

  return (
    <div className="space-y-4">
      {/* -------------------------------------------------------------
          SEKSI 1: INFORMASI & NARASI KEGIATAN
          ------------------------------------------------------------- */}
      <section className="form-card p-4 md:p-5 space-y-3.5">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs border border-slate-300/70 shadow-2xs">
              1
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs md:text-sm font-bold text-slate-900 tracking-tight">
                  Informasi & Narasi Kegiatan
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  Wajib Diisi
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                Deskripsi resmi untuk Kwitansi, SPD, Daftar Nominatif, dan Nota Dinas
              </p>
            </div>
          </div>
          <FileText className="w-4 h-4 text-slate-400 hidden sm:block" />
        </div>

        {/* Sub-panel Identitas Berkas SPJ & Klasifikasi Kegiatan */}
        <div className="p-2.5 sm:p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white border border-slate-200/90 text-slate-600 flex items-center justify-center shrink-0 shadow-2xs">
              <FolderKanban className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                  ID Kegiatan
                </span>
                <span className="px-2 py-0.5 rounded-md font-mono font-bold text-xs bg-white text-slate-800 border border-slate-200/90 shadow-2xs">
                  {header.idKegiatan || generateIdKegiatan(header.tanggalSpd, header.noKegiatanUrut || "01", header.kategoriSpj || "A")}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-200/60 text-slate-600 border border-slate-300/50">
                  {(header.kategoriSpj || "A") === "A" ? "Kategori A • ASN (PNS/PPPK)" : "Kategori B • Non-ASN (Eksternal)"}
                </span>
              </div>
              <p className="text-[10.5px] text-slate-400 mt-0.5">
                Pengenal berkas SPJ baku untuk integrasi database & rekapitulasi seluruh pelaksana
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* Segmented Control Kategori A / B (macOS Style) */}
            <div className="inline-flex rounded-lg bg-slate-200/60 p-0.5 text-xs font-medium border border-slate-300/40">
              <button
                type="button"
                onClick={() => updateIdKegiatan(header.tanggalSpd, header.noKegiatanUrut, "A")}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  (header.kategoriSpj || "A") === "A"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="Pilih ASN jika peserta memiliki NIP dan pangkat/jabatan"
              >
                ASN [A]
              </button>
              <button
                type="button"
                onClick={() => updateIdKegiatan(header.tanggalSpd, header.noKegiatanUrut, "B")}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  (header.kategoriSpj || "A") === "B"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="Pilih Non-ASN jika peserta adalah eksternal / narasumber"
              >
                Non-ASN [B]
              </button>
            </div>

            {/* No Urut Input */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200/90 rounded-lg px-2 py-1 shadow-2xs">
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">No:</span>
              <input
                type="text"
                maxLength={3}
                value={header.noKegiatanUrut || "01"}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, "");
                  updateIdKegiatan(header.tanggalSpd, val, header.kategoriSpj);
                }}
                className="w-7 text-center text-xs font-mono font-bold text-slate-800 focus:outline-hidden"
                title="Nomor Urut Kegiatan pada tanggal terpilih (contoh: 01, 02)"
              />
            </div>

            {/* Tombol Lihat Daftar Kegiatan */}
            {onOpenDaftarKegiatan && (
              <button
                type="button"
                onClick={onOpenDaftarKegiatan}
                className="btn-tactile inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-lg shadow-2xs hover:border-slate-300 transition-all cursor-pointer"
                title="Buka Daftar Kegiatan Tersimpan"
              >
                <FolderKanban className="w-3.5 h-3.5 text-slate-500" />
                <span>Daftar Kegiatan</span>
              </button>
            )}
          </div>
        </div>


        <div className="form-group-panel">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Keterangan Kegiatan Dinas */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-800 flex items-center gap-1">
                <span>Keterangan Kegiatan Dinas</span>
                <span className="text-red-500 font-bold">*</span>
              </label>
              <textarea
                rows={3}
                value={header.keteranganKegiatan}
                onChange={(e) => handleChange("keteranganKegiatan", e.target.value)}
                placeholder="Contoh: Perjalanan Dinas dalam rangka Rapat Koordinasi Nasional Kebijakan Pangan..."
                className="input-human w-full p-2.5 text-xs font-normal resize-none"
              />
              <p className="text-[10.5px] text-slate-400">
                Uraian ini tercetak sebagai bunyi kegiatan resmi pada seluruh lembar SPJ.
              </p>
            </div>

            {/* Perihal Memorandum */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-800 flex items-center gap-1">
                  <span>Perihal Memorandum (Nota Dinas)</span>
                  <span className="text-red-500 font-bold">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (isCustomMemo) {
                      setIsManualOverride(false);
                      if (!OPSI_PERIHAL_MEMORANDUM.includes(header.keteranganMemo)) {
                        handleChange("keteranganMemo", "");
                      }
                    } else {
                      setIsManualOverride(true);
                    }
                  }}
                  className="text-[11px] text-[#0071e3] hover:text-[#0077ed] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {isCustomMemo ? "Gunakan Pilihan Dropdown" : "Ketik Kustom / Edit"}
                </button>
              </div>

              {!isCustomMemo ? (
                <div className="space-y-1.5">
                  <select
                    value={
                      OPSI_PERIHAL_MEMORANDUM.includes(header.keteranganMemo)
                        ? header.keteranganMemo
                        : header.keteranganMemo
                        ? "__CUSTOM__"
                        : ""
                    }
                    onChange={(e) => {
                      if (e.target.value === "__CUSTOM__") {
                        setIsManualOverride(true);
                      } else {
                        setIsManualOverride(false);
                        handleChange("keteranganMemo", e.target.value);
                      }
                    }}
                    className="input-human w-full h-9.5 px-3 font-semibold text-slate-900 cursor-pointer bg-white"
                  >
                    <option value="">-- Pilih Perihal Memorandum --</option>
                    {OPSI_PERIHAL_MEMORANDUM.map((opsi) => (
                      <option key={opsi} value={opsi}>
                        {opsi}
                      </option>
                    ))}
                    <option value="__CUSTOM__">✏️ Ketik Manual / Perihal Kustom...</option>
                  </select>

                  {header.keteranganMemo && (
                    <div className="text-[11px] text-slate-700 bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1.5 leading-relaxed flex items-center justify-between gap-2">
                      <span className="truncate">
                        <strong className="text-slate-900">Perihal Terpilih:</strong> {header.keteranganMemo}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <textarea
                    rows={3}
                    value={header.keteranganMemo}
                    onChange={(e) => handleChange("keteranganMemo", e.target.value)}
                    placeholder="Contoh: Permintaan Pembayaran Langsung (LS) Biaya Perjalanan Dinas Luar Kota..."
                    className="input-human w-full p-2.5 text-xs font-normal resize-none"
                    autoFocus
                  />
                </div>
              )}

              <p className="text-[10.5px] text-slate-400">
                Uraian perihal pada nota dinas internal pengajuan pencairan anggaran ke PPK.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          SEKSI 2: DESTINASI & MODA TRANSPORTASI (PENENTU SBM)
          ------------------------------------------------------------- */}
      <section className="form-card p-4 md:p-5 space-y-3.5">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs border border-slate-300/70 shadow-2xs">
              2
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs md:text-sm font-bold text-slate-900 tracking-tight">
                  Destinasi & Pengaturan Perjalanan
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  Tarif SBM PMK
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                Menentukan pagu standar biaya masukan (Uang Harian & Pagu Hotel) dan rute kedinasan
              </p>
            </div>
          </div>
          <MapPin className="w-4 h-4 text-slate-400 hidden sm:block" />
        </div>

        <div className="form-group-panel space-y-3.5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
            {/* Kolom Kiri: Provinsi & Kota Tujuan */}
            <div className="space-y-3 p-3.5 bg-white rounded-xl border border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block border-b border-slate-100 pb-1">
                Lokasi Tujuan (Target Dinas)
              </span>

              {/* Provinsi Tujuan SBM */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-800 flex items-center gap-1">
                  <span>Provinsi Tujuan (SBM)</span>
                  <span className="text-red-500 font-bold">*</span>
                </label>
                <select
                  value={header.provinsiTujuan}
                  onChange={(e) => handleChange("provinsiTujuan", e.target.value)}
                  className="input-human w-full h-9.5 px-3 font-semibold text-slate-900 cursor-pointer"
                >
                  {sbmList.map((sbm) => (
                    <option key={sbm.provinsi} value={sbm.provinsi}>
                      {sbm.provinsi}
                    </option>
                  ))}
                </select>
              </div>

              {/* Kota / Kabupaten Tujuan */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-800 flex items-center gap-1">
                    <span>Kota / Kabupaten di {header.provinsiTujuan}</span>
                    <span className="text-red-500 font-bold">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddKota}
                    className="btn-tactile flex items-center gap-1 text-[11px] font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-lg border border-slate-300 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Tambah Kota</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  {(header.kotaTujuanList || [""]).map((kota, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        value={kota}
                        onChange={(e) => handleKotaChange(idx, e.target.value)}
                        className="input-human flex-1 h-9 px-2.5 font-medium cursor-pointer"
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
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 border border-transparent hover:border-slate-300 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {availableKabkot.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-400 font-medium">Pilihan cepat:</span>
                    {availableKabkot.slice(0, 5).map((k) => (
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
                        className="btn-tactile text-[10px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-medium cursor-pointer"
                      >
                        + {k}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Kolom Kanan: Parameter Perjalanan */}
            <div className="space-y-3 p-3.5 bg-white rounded-xl border border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block border-b border-slate-100 pb-1">
                Rute Keberangkatan & Moda Transportasi
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Kota Keberangkatan */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-800">
                    Berangkat Dari
                  </label>
                  <input
                    type="text"
                    value={header.berangkatDari || "Jakarta"}
                    onChange={(e) => handleChange("berangkatDari", e.target.value)}
                    placeholder="Jakarta"
                    className="input-human w-full h-9.5 px-3 font-medium"
                  />
                  <span className="text-[10px] text-slate-400">Default: Jakarta</span>
                </div>

                {/* Moda Transportasi */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-800">
                    Alat Angkutan
                  </label>
                  <select
                    value={header.alatAngkut || "Angkutan Darat"}
                    onChange={(e) => handleChange("alatAngkut", e.target.value)}
                    className="input-human w-full h-9.5 px-2.5 font-medium cursor-pointer"
                  >
                    <option value="Angkutan Darat">Angkutan Darat (Mobil/Kereta/Bus)</option>
                    <option value="Pesawat Udara">Pesawat Udara</option>
                    <option value="Angkutan Laut">Angkutan Laut / Kapal</option>
                  </select>
                </div>
              </div>

              {/* Jenis Perdin */}
              <div className="space-y-1 pt-1">
                <label className="font-semibold text-slate-800">
                  Jenis Perjalanan Dinas
                </label>
                <select
                  value={header.jenisPerdin || "Perdin Luar Kota"}
                  onChange={(e) =>
                    handleChange(
                      "jenisPerdin",
                      e.target.value as "Perdin Jabodetabekdung" | "Perdin Luar Kota" | "Perdin Luar Negeri"
                    )
                  }
                  className="input-human w-full h-9.5 px-3 font-semibold text-slate-800 cursor-pointer"
                >
                  <option value="Perdin Luar Kota">Perdin Luar Kota (Standar Tarif SBM)</option>
                  <option value="Perdin Jabodetabekdung">Perdin Jabodetabek & Bandung (Lokal)</option>
                  <option value="Perdin Luar Negeri">Perdin Luar Negeri</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          SEKSI 3: PENOMORAN DOKUMEN & SURAT TUGAS (LEGALITAS)
          ------------------------------------------------------------- */}
      <section className="form-card p-4 md:p-5 space-y-3.5">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs border border-slate-300/70 shadow-2xs">
              3
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs md:text-sm font-bold text-slate-900 tracking-tight">
                  Penomoran Dokumen & Surat Tugas (ST)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  Dasar Hukum SPJ
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                Register penomoran resmi Surat Tugas dan Memorandum pengajuan pembiayaan dinas
              </p>
            </div>
          </div>
          <FileCheck2 className="w-4 h-4 text-slate-400 hidden sm:block" />
        </div>

        <div className="form-group-panel space-y-4">
          {/* Sub-panel 1: Tanggal SPD, Memo & Nomor Memo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Tanggal SPD */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-800 flex items-center gap-1">
                <span>Tanggal SPD</span>
                <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="date"
                value={header.tanggalSpd}
                onChange={(e) => {
                  const val = e.target.value;
                  updateIdKegiatan(val, header.noKegiatanUrut, header.kategoriSpj);
                }}
                className="input-human w-full h-9.5 px-3 font-medium cursor-pointer"
              />
              <span className="text-[10px] text-slate-400">Tanggal penetapan SPD resmi</span>
            </div>

            {/* Tanggal Memo */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-800 flex items-center gap-1">
                <span>Tanggal Memo</span>
                <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="date"
                value={header.tanggalMemo}
                onChange={(e) => handleChange("tanggalMemo", e.target.value)}
                className="input-human w-full h-9.5 px-3 font-medium cursor-pointer"
              />
              <span className="text-[10px] text-slate-400">Tanggal pengantar nota dinas</span>
            </div>

            {/* Nomor Memorandum + Ambil Nomor */}
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5">
                  <label className="font-semibold text-slate-800">
                    Nomor Memorandum
                  </label>
                  <span
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/80 font-semibold"
                    title={`Bulan Romawi otomatis mengikuti Tanggal Memo: ${currentMemoRomanMonth}/${currentMemoYear}`}
                  >
                    Bulan {currentMemoRomanMonth}
                  </span>
                </div>
                {latestMemoInfo?.lastMemoStr && (
                  <span className="text-[10px] text-slate-500 font-normal truncate max-w-[190px]" title={`Nomor terakhir terdaftar di database master: ${latestMemoInfo.lastMemoStr}`}>
                    Terakhir: <strong className="font-mono text-slate-700">{latestMemoInfo.lastMemoStr}</strong>
                  </span>
                )}
              </div>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={header.nomorMemo}
                  onChange={(e) => handleChange("nomorMemo", e.target.value)}
                  placeholder={latestMemoInfo ? `Contoh: M.${latestMemoInfo.maxNum + 1}/INS/PPK/${currentMemoRomanMonth}/${currentMemoYear}` : `M.xxx/INS/PPK/${currentMemoRomanMonth}/${currentMemoYear}`}
                  className="input-human flex-1 h-9.5 px-2.5 font-mono text-xs font-semibold"
                />
                <button
                  type="button"
                  onClick={onGenerateMemoNumber}
                  className="btn-tactile px-3 py-1.5 rounded-lg bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
                  title={`Generate nomor urut memorandum berikutnya dengan Bulan Romawi (${currentMemoRomanMonth}) mengikuti tanggal memo`}
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Ambil No</span>
                </button>
              </div>
              <span className="text-[10px] text-slate-400">
                {latestMemoInfo 
                  ? `Otomatis urutan berikutnya: M.${latestMemoInfo.maxNum + 1}/INS/PPK/${currentMemoRomanMonth}/${currentMemoYear} (Bulan Romawi ${currentMemoRomanMonth})` 
                  : `Otomatis generate dari register master memorandum (Bulan Romawi ${currentMemoRomanMonth})`}
              </span>
            </div>
          </div>

          {/* Sub-panel 2: Penomoran Surat Tugas (ST) */}
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <span className="font-bold text-slate-900">Penomoran Surat Tugas (ST)</span>

              <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors">
                <input
                  type="checkbox"
                  checked={header.useDifferentStPejabat || false}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    handleChange("useDifferentStPejabat", checked);
                    if (!checked) handleChange("nomorStPejabat", "");
                  }}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-500 cursor-pointer"
                />
                <span className="font-medium">Gunakan nomor ST terpisah untuk Pejabat / Inspektur</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
              {/* ST Utama / Staf Pelaksana */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-800 flex items-center gap-1">
                  <span>Nomor ST Utama / Staf Pelaksana</span>
                  <span className="text-red-500 font-bold">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={header.nomorStStaff || header.nomorStMaster || ""}
                    onChange={(e) => {
                      handleChange("nomorStStaff", e.target.value);
                      handleChange("nomorStMaster", e.target.value);
                    }}
                    placeholder="Contoh: ST-05/INS/01/2026"
                    className="input-human flex-1 h-9.5 px-3 font-mono font-bold text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => onApplyStToAll(header.nomorStStaff || header.nomorStMaster || "")}
                    className="btn-tactile px-3 py-1.5 rounded-lg bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0"
                    title="Salin nomor ST ini ke seluruh baris peserta di bawah"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Terapkan ke Semua</span>
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Nomor surat tugas ini berlaku untuk rombongan dinas atau staf pelaksana.
                </span>
              </div>

              {/* ST Khusus Pejabat (Jika dicentang) */}
              {header.useDifferentStPejabat ? (
                <div className="space-y-1 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <label className="font-bold text-slate-900 flex items-center gap-1">
                    <span>Nomor ST Khusus Pejabat (Inspektur / Eselon)</span>
                    <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={header.nomorStPejabat || ""}
                    onChange={(e) => handleChange("nomorStPejabat", e.target.value)}
                    placeholder="Contoh: ST-01/SESMEN/01/2026"
                    className="input-human w-full h-9.5 px-3 font-mono font-bold text-slate-900 border-slate-300"
                  />
                  <span className="text-[10px] text-slate-500 block">
                    Khusus disematkan pada lembar SPD personil berstatus Pejabat / Golongan IV.
                  </span>
                </div>
              ) : (
                <div className="hidden md:flex items-center h-full p-2.5 rounded-lg border border-dashed border-slate-200 text-slate-400 text-[11px] italic">
                  Seluruh peserta menggunakan nomor ST yang sama. Centang opsi di atas bila pejabat memiliki ST tersendiri.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          SEKSI 4: PEMBEBANAN ANGGARAN & SPJ (STANDAR DIPA)
          ------------------------------------------------------------- */}
      <section className="form-card p-4 md:p-5 space-y-3.5">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs border border-slate-300/70 shadow-2xs">
              4
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs md:text-sm font-bold text-slate-900 tracking-tight">
                  Pembebanan Anggaran & Pertanggungjawaban SPJ
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  Standar DIPA Terisi Otomatis
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                Kode akun anggaran DIPA, jenis pengajuan biaya, dan nomor SPM (dapat disesuaikan jika perlu)
              </p>
            </div>
          </div>
          <Landmark className="w-4 h-4 text-slate-400 hidden sm:block" />
        </div>

        <div className="form-group-panel space-y-3.5 text-xs">
          {/* Baris 1: NOMOR KOMPONEN & NOMOR MAK (Sesuai Gambar 1, 2, 3) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
            {/* NOMOR KOMPONEN */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">
                  NOMOR KOMPONEN
                </label>
                {getKomponenName(header.nomorKomp) && (
                  <span
                    className="text-[10px] font-medium text-slate-500 truncate max-w-[240px]"
                    title={getKomponenName(header.nomorKomp)}
                  >
                    {getKomponenName(header.nomorKomp)}
                  </span>
                )}
              </div>
              <select
                value={header.nomorKomp || ""}
                onChange={(e) => handleChange("nomorKomp", e.target.value)}
                className="input-human w-full h-10 px-3 font-mono font-semibold text-slate-900 cursor-pointer text-xs"
              >
                <option value="">-- Pilih Komponen --</option>
                {LIST_NOMOR_KOMPONEN.map((k) => (
                  <option key={k.kode} value={k.kode}>
                    {k.kode} - {k.nama}
                  </option>
                ))}
                {header.nomorKomp &&
                  !LIST_NOMOR_KOMPONEN.some((k) => k.kode === header.nomorKomp) && (
                    <option value={header.nomorKomp}>
                      {header.nomorKomp}
                      {getKomponenName(header.nomorKomp) ? ` - ${getKomponenName(header.nomorKomp)}` : ""}
                    </option>
                  )}
              </select>
            </div>

            {/* NOMOR MAK */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">
                  NOMOR MAK
                </label>
                {getMakAkunName(header.nomorMak) && (
                  <span
                    className="text-[10px] font-medium text-slate-500 truncate max-w-[240px]"
                    title={getMakAkunName(header.nomorMak)}
                  >
                    {getMakAkunName(header.nomorMak)}
                  </span>
                )}
              </div>
              <select
                value={header.nomorMak || ""}
                onChange={(e) => handleChange("nomorMak", e.target.value)}
                className="input-human w-full h-10 px-3 font-mono font-semibold text-slate-900 cursor-pointer text-xs"
              >
                <option value="">-- Pilih MAK --</option>
                {LIST_NOMOR_MAK.map((m) => (
                  <option key={m.kode} value={m.kode}>
                    {m.kode} - {m.nama}
                  </option>
                ))}
                {header.nomorMak &&
                  !LIST_NOMOR_MAK.some((m) => m.kode === header.nomorMak) && (
                    <option value={header.nomorMak}>
                      {header.nomorMak}
                      {getMakAkunName(header.nomorMak) ? ` - ${getMakAkunName(header.nomorMak)}` : ""}
                    </option>
                  )}
              </select>
            </div>
          </div>

          {/* Baris 2: Unit Kerja, Item Detail, Pengajuan, No. SPM */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-0.5">
            {/* Unit Kerja */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Unit Kerja</label>
              <input
                type="text"
                value={header.unitKerja}
                onChange={(e) => handleChange("unitKerja", e.target.value)}
                className="input-default w-full h-9 px-2.5 font-medium"
              />
            </div>

            {/* Item Detail */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700">Item Detail</label>
                {availableItemDetails.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsCustomItemDetail(!isCustomItemDetail)}
                    className="text-[10px] font-medium text-slate-500 hover:text-slate-800 underline transition-colors cursor-pointer"
                  >
                    {isCustomItemDetail ? "Pilih dari daftar" : "Custom"}
                  </button>
                )}
              </div>
              {!isCustomItemDetail && availableItemDetails.length > 0 ? (
                <select
                  value={
                    availableItemDetails.find(
                      (i) => i.fullLabel === header.itemDetail || i.kode === header.itemDetail
                    )?.fullLabel || header.itemDetail || ""
                  }
                  onChange={(e) => {
                    if (e.target.value === "__CUSTOM__") {
                      setIsCustomItemDetail(true);
                    } else {
                      handleChange("itemDetail", e.target.value);
                    }
                  }}
                  className="input-human w-full h-9 px-2 font-mono font-medium text-slate-900 cursor-pointer text-xs truncate"
                  title={header.itemDetail || "Pilih Item Detail"}
                >
                  <option value="">-- Pilih Item Detail ({availableItemDetails.length}) --</option>
                  {availableItemDetails.map((item) => (
                    <option key={item.kode} value={item.fullLabel}>
                      {item.fullLabel}
                    </option>
                  ))}
                  <option value="__CUSTOM__">✏️ Ketik Manual Lainnya...</option>
                  {header.itemDetail &&
                    !availableItemDetails.some(
                      (i) => i.fullLabel === header.itemDetail || i.kode === header.itemDetail
                    ) && (
                      <option value={header.itemDetail}>
                        {header.itemDetail} (Custom)
                      </option>
                    )}
                </select>
              ) : (
                <input
                  type="text"
                  value={header.itemDetail}
                  onChange={(e) => handleChange("itemDetail", e.target.value)}
                  placeholder="001 atau nama item detail"
                  className="input-default w-full h-9 px-2.5 font-mono font-bold text-slate-800 text-xs"
                />
              )}
            </div>

            {/* Jenis Pengajuan */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Pengajuan</label>
              <select
                value={header.jenisPengajuan || "RAMPUNG"}
                onChange={(e) =>
                  handleChange(
                    "jenisPengajuan",
                    e.target.value as "RENCANA" | "RAMPUNG" | "MERAMPUNGKAN"
                  )
                }
                className="input-human w-full h-9 px-2 font-bold text-slate-800 cursor-pointer"
              >
                <option value="RAMPUNG">RAMPUNG</option>
                <option value="RENCANA">RENCANA</option>
                <option value="MERAMPUNGKAN">MERAMPUNGKAN</option>
              </select>
            </div>

            {/* No SPM */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">No. SPM</label>
              <input
                type="text"
                value={header.noSpm || ""}
                onChange={(e) => handleChange("noSpm", e.target.value)}
                placeholder="00073T"
                className="input-default w-full h-9 px-2.5 font-mono font-bold text-slate-800"
              />
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          SEKSI 5: PEJABAT PENANDATANGAN & VERIFIKASI
          ------------------------------------------------------------- */}
      <section className="form-card p-4 md:p-5 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs border border-slate-300/70 shadow-2xs">
              5
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs md:text-sm font-bold text-slate-900 tracking-tight">
                  Pejabat Penandatangan & Verifikasi
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  Tanda Tangan Dokumen
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                Penetapan PPK, Bendahara Pengeluaran, dan Petugas Verifikator Berkas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Users2 className="w-4 h-4 text-slate-400 hidden sm:block mr-1" />
            <button
              type="button"
              onClick={() => setIsModalTambahPegawaiOpen(true)}
              className="btn-tactile flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold cursor-pointer shadow-2xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Tambah Pegawai Baru</span>
            </button>
          </div>
        </div>

        <div className="form-group-panel">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* PPK Selector */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-800 flex items-center gap-1">
                <span>Pejabat Pembuat Komitmen (PPK)</span>
                <span className="text-red-500 font-bold">*</span>
              </label>
              <select
                value={header.ppkNama}
                onChange={(e) => handlePpkChange(e.target.value)}
                className="input-human w-full h-9.5 px-3 font-semibold text-slate-900 cursor-pointer"
              >
                {pegawaiList.map((p) => (
                  <option key={p.kodeNama} value={p.nama}>
                    {p.nama} ({p.jabatan})
                  </option>
                ))}
              </select>
              <span className="text-[10.5px] text-slate-400 block">
                Tanda tangan kiri pada Nominatif & Kuitansi (Arif Wibowo).
              </span>
            </div>

            {/* Bendahara Pengeluaran */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-800 flex items-center gap-1">
                <span>Bendahara Pengeluaran</span>
                <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="text"
                value={header.bendahara}
                onChange={(e) => handleChange("bendahara", e.target.value)}
                className="input-human w-full h-9.5 px-3 font-medium text-slate-900"
              />
              <span className="text-[10.5px] text-slate-400 block">
                Tanda tangan tengah pada Nominatif (Raka Panji).
              </span>
            </div>

            {/* Penanggung Jawab Kegiatan */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-800 flex items-center gap-1">
                <span>Penanggung Jawab Kegiatan</span>
                <span className="text-red-500 font-bold">*</span>
              </label>
              <select
                value={header.penanggungJawabNama || "Reni Sutaryo, S.Si., M.Adm.Pemb"}
                onChange={(e) => handlePenanggungJawabChange(e.target.value)}
                className="input-human w-full h-9.5 px-3 font-semibold text-slate-900 cursor-pointer"
              >
                {pegawaiList.map((p) => (
                  <option key={p.kodeNama} value={p.nama}>
                    {p.nama} ({p.jabatan})
                  </option>
                ))}
              </select>
              <span className="text-[10.5px] text-slate-400 block">
                Tanda tangan kanan pada Nominatif (Reni Sutaryo).
              </span>
            </div>

            {/* Petugas Verifikasi (Hanya Taufik Prasetyo & Noviarty) */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-800 flex items-center gap-1">
                <span>Petugas Verifikasi</span>
                <span className="text-[10px] font-medium text-slate-400">(Taufik / Noviarty)</span>
              </label>
              <select
                value={
                  header.petugasVerifikasi && header.petugasVerifikasi.toLowerCase().includes("taufik")
                    ? verifikatorOptions[0].value
                    : header.petugasVerifikasi &&
                      (header.petugasVerifikasi.toLowerCase().includes("noviart") ||
                        header.petugasVerifikasi.toLowerCase().includes("noviat"))
                    ? verifikatorOptions[1].value
                    : header.petugasVerifikasi
                }
                onChange={(e) => handleChange("petugasVerifikasi", e.target.value)}
                className="input-human w-full h-9.5 px-2.5 font-medium cursor-pointer"
              >
                <option value="">-- Pilih Petugas Verifikasi --</option>
                {verifikatorOptions.map((v) => (
                  <option key={v.value} value={v.value}>
                    {v.label}
                  </option>
                ))}
                {header.petugasVerifikasi &&
                  !verifikatorOptions.some(
                    (v) =>
                      v.value === header.petugasVerifikasi ||
                      header.petugasVerifikasi.toLowerCase().includes("taufik") ||
                      header.petugasVerifikasi.toLowerCase().includes("novi")
                  ) && (
                    <option value={header.petugasVerifikasi}>
                      {header.petugasVerifikasi}
                    </option>
                  )}
              </select>
              <span className="text-[10.5px] text-slate-400 block">
                Pemeriksa kelengkapan berkas bukti riil dan tiket (Taufik Prasetyo / Noviarty).
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Modal Tambah Pegawai Baru */}
      <ModalTambahPegawai
        isOpen={isModalTambahPegawaiOpen}
        onClose={() => setIsModalTambahPegawaiOpen(false)}
        onSave={(newPeg) => {
          onAddPegawai(newPeg);
        }}
      />
    </div>
  );
};

