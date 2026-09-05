"use client";

import React from "react";
import { ActiveCostKey, ActiveUhKey } from "@/lib/types";
import { Check, DollarSign, CalendarCheck, Zap, RotateCcw } from "lucide-react";

interface ChecklistFilterProps {
  activeCols: Record<ActiveCostKey, boolean>;
  setActiveCols: React.Dispatch<React.SetStateAction<Record<ActiveCostKey, boolean>>>;
  activeUh: Record<ActiveUhKey, boolean>;
  setActiveUh: React.Dispatch<React.SetStateAction<Record<ActiveUhKey, boolean>>>;
}

export const ChecklistFilter: React.FC<ChecklistFilterProps> = ({
  activeCols,
  setActiveCols,
  activeUh,
  setActiveUh,
}) => {
  const costList: { key: ActiveCostKey; label: string }[] = [
    { key: "tiket", label: "Tiket Pesawat/Kereta" },
    { key: "dukunganTransportasi", label: "Dukungan Transport" },
    { key: "transportasiDarat", label: "Transportasi Darat PP" },
    { key: "transportasiLokal", label: "Transportasi Lokal" },
    { key: "transportJakartaPp", label: "Transportasi Jakarta PP" },
    { key: "transportDaerahPp", label: "Transportasi Daerah PP" },
    { key: "pengRill", label: "Pengeluaran Riil" },
    { key: "hotel", label: "Hotel / Penginapan" },
    { key: "penginapan30", label: "Penginapan 30% SBM" },
    { key: "fulldayMeeting", label: "Paket Fullday" },
    { key: "fullboardMeeting", label: "Paket Fullboard" },
    { key: "representatif", label: "Uang Representatif" },
    { key: "belanjaBahan", label: "Belanja Bahan" },
  ];

  const uhList: { key: ActiveUhKey; label: string; sub: string }[] = [
    { key: "uhBiasa", label: "UH Biasa (100%)", sub: "Luar Kota Reguler" },
    { key: "uhBiasa60", label: "UH 60%", sub: "Diklat / Workshop" },
    { key: "uhHalfday", label: "UH Halfday", sub: "Paket Rapat Siang" },
    { key: "uhFullboard", label: "UH Fullboard", sub: "Paket Menginap" },
  ];

  const toggleCost = (key: ActiveCostKey) => {
    setActiveCols((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleUh = (key: ActiveUhKey) => {
    setActiveUh((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // 1-Click Preset Handlers to minimize clicks
  const applyPresetDarat = () => {
    setActiveCols({
      tiket: false,
      dukunganTransportasi: false,
      transportasiDarat: true,
      transportasiLokal: false,
      transportJakartaPp: false,
      transportDaerahPp: false,
      pengRill: false,
      hotel: false,
      penginapan30: false,
      fulldayMeeting: false,
      fullboardMeeting: false,
      representatif: false,
      belanjaBahan: false,
    });
    setActiveUh({
      uhBiasa: true,
      uhBiasa60: false,
      uhHalfday: false,
      uhFullboard: false,
    });
  };

  const applyPresetUdara = () => {
    setActiveCols({
      tiket: true,
      dukunganTransportasi: false,
      transportasiDarat: true,
      transportasiLokal: true,
      transportJakartaPp: false,
      transportDaerahPp: false,
      pengRill: false,
      hotel: true,
      penginapan30: false,
      fulldayMeeting: false,
      fullboardMeeting: false,
      representatif: false,
      belanjaBahan: false,
    });
    setActiveUh({
      uhBiasa: true,
      uhBiasa60: false,
      uhHalfday: false,
      uhFullboard: false,
    });
  };

  const applyPresetFullboard = () => {
    setActiveCols({
      tiket: false,
      dukunganTransportasi: false,
      transportasiDarat: true,
      transportasiLokal: false,
      transportJakartaPp: false,
      transportDaerahPp: false,
      pengRill: false,
      hotel: false,
      penginapan30: false,
      fulldayMeeting: false,
      fullboardMeeting: true,
      representatif: false,
      belanjaBahan: false,
    });
    setActiveUh({
      uhBiasa: false,
      uhBiasa60: false,
      uhHalfday: false,
      uhFullboard: true,
    });
  };

  return (
    <section className="space-y-4 text-xs">
      {/* Quick Preset Toolbar (Minimal Click Ergonomics) */}
      <div className="glass-subtle rounded-2xl p-3 px-4 flex flex-wrap items-center justify-between gap-3 border border-slate-200/80">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
            Preset Cepat 1-Klik:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={applyPresetDarat}
            className="btn-tactile px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white text-slate-800 font-bold text-[11px] border border-slate-200/80 shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            <span>🚗</span>
            <span>Standar Darat PP</span>
          </button>

          <button
            type="button"
            onClick={applyPresetUdara}
            className="btn-tactile px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white text-slate-800 font-bold text-[11px] border border-slate-200/80 shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            <span>✈️</span>
            <span>Udara + Hotel + Transport</span>
          </button>

          <button
            type="button"
            onClick={applyPresetFullboard}
            className="btn-tactile px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white text-slate-800 font-bold text-[11px] border border-slate-200/80 shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            <span>🏨</span>
            <span>Paket Fullboard Meeting</span>
          </button>

          <button
            type="button"
            onClick={applyPresetDarat}
            className="btn-tactile px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium text-[11px] border border-slate-200 cursor-pointer flex items-center gap-1"
            title="Reset ke pengaturan default"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 1. Komponen Biaya Aktif (Liquid Glass Segmented Controls) */}
        <div className="glass-base rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200/80">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center border border-emerald-500/20">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-xs md:text-sm">
                2. Komponen Biaya yang Digunakan
              </h3>
              <p className="text-[11px] text-slate-500">
                Pilih komponen biaya dinas yang akan dihitung dan ditampilkan pada tabel proses
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {costList.map(({ key, label }) => {
              const isActive = activeCols[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleCost(key)}
                  className={`btn-tactile flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                    isActive
                      ? "glass-control-active font-bold"
                      : "glass-control text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all ${
                      isActive
                        ? "bg-blue-600 border-blue-600 text-white shadow-2xs"
                        : "border-slate-300/80 bg-white/60"
                    }`}
                  >
                    {isActive && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Jenis Uang Harian (Liquid Glass Segmented Controls) */}
        <div className="glass-base rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200/80">
            <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center border border-amber-500/20">
              <CalendarCheck className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-xs md:text-sm">
                Jenis Uang Harian (SBM PMK)
              </h3>
              <p className="text-[11px] text-slate-500">
                Pilih standar tarif uang saku SBM sesuai skema pelaksanaan kegiatan
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {uhList.map(({ key, label, sub }) => {
              const isActive = activeUh[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleUh(key)}
                  className={`btn-tactile flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-semibold cursor-pointer ${
                    isActive
                      ? "glass-control-active font-bold"
                      : "glass-control text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-md shrink-0 flex items-center justify-center border transition-all ${
                      isActive
                        ? "bg-blue-600 border-blue-600 text-white shadow-2xs"
                        : "border-slate-300/80 bg-white/60"
                    }`}
                  >
                    {isActive && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                  <div className="text-left leading-tight">
                    <span className="block font-semibold">{label}</span>
                    <span className="text-[9.5px] text-slate-500 font-normal">{sub}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
