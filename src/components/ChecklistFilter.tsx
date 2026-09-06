"use client";

import React from "react";
import { ActiveCostKey, ActiveUhKey } from "@/lib/types";
import { Check, Sparkles, RotateCcw } from "lucide-react";

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
  const transportCosts: { key: ActiveCostKey; label: string }[] = [
    { key: "tiket", label: "Tiket Pesawat / Kereta" },
    { key: "transportasiDarat", label: "Transportasi Darat PP" },
    { key: "dukunganTransportasi", label: "Dukungan Transport" },
    { key: "transportasiLokal", label: "Transportasi Lokal" },
    { key: "transportJakartaPp", label: "Transport Jakarta PP" },
    { key: "transportDaerahPp", label: "Transport Daerah PP" },
  ];

  const accommodationCosts: { key: ActiveCostKey; label: string }[] = [
    { key: "hotel", label: "Hotel / Penginapan" },
    { key: "penginapan30", label: "Penginapan 30% SBM" },
    { key: "fulldayMeeting", label: "Paket Fullday" },
    { key: "fullboardMeeting", label: "Paket Fullboard" },
  ];

  const otherCosts: { key: ActiveCostKey; label: string }[] = [
    { key: "pengRill", label: "Pengeluaran Riil" },
    { key: "representatif", label: "Uang Representatif" },
    { key: "belanjaBahan", label: "Belanja Bahan" },
  ];

  const uhList: { key: ActiveUhKey; label: string; sub: string }[] = [
    { key: "uhBiasa", label: "UH Biasa (100%)", sub: "Luar kota reguler" },
    { key: "uhBiasa60", label: "UH 60%", sub: "Diklat / workshop" },
    { key: "uhHalfday", label: "UH Halfday", sub: "Paket rapat siang" },
    { key: "uhFullboard", label: "UH Fullboard", sub: "Paket menginap" },
  ];

  const toggleCost = (key: ActiveCostKey) => {
    setActiveCols((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleUh = (key: ActiveUhKey) => {
    setActiveUh((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // 1-Click Preset Handlers
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

  const renderCostChip = (key: ActiveCostKey, label: string) => {
    const isActive = activeCols[key];
    return (
      <button
        key={key}
        type="button"
        onClick={() => toggleCost(key)}
        className={`btn-tactile inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
          isActive
            ? "glass-control-active text-slate-900 font-semibold"
            : "glass-control text-slate-600 hover:text-slate-900 hover:bg-white/80"
        }`}
      >
        <span
          className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${
            isActive
              ? "bg-[#0071e3] border-[#0071e3] text-white"
              : "border-slate-300 bg-white/70"
          }`}
        >
          {isActive && <Check className="w-2.5 h-2.5 stroke-[3]" />}
        </span>
        <span>{label}</span>
      </button>
    );
  };

  return (
    <section className="glass-base rounded-2xl p-4 md:p-5 space-y-4">
      {/* Preset Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3.5 border-b border-slate-200/70">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-slate-200 text-slate-700 flex items-center justify-center">
            <Sparkles className="w-3 h-3" />
          </span>
          <span className="text-xs font-semibold text-slate-800">
            Preset Cepat Skema Biaya
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={applyPresetDarat}
            className="btn-tactile px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs border border-slate-200/80 shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <span>🚗</span>
            <span>Standar Darat PP</span>
          </button>

          <button
            type="button"
            onClick={applyPresetUdara}
            className="btn-tactile px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs border border-slate-200/80 shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <span>✈️</span>
            <span>Udara + Hotel</span>
          </button>

          <button
            type="button"
            onClick={applyPresetFullboard}
            className="btn-tactile px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs border border-slate-200/80 shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <span>🏨</span>
            <span>Fullboard Meeting</span>
          </button>

          <button
            type="button"
            onClick={applyPresetDarat}
            className="btn-tactile px-2 py-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 font-medium text-xs cursor-pointer inline-flex items-center gap-1"
            title="Reset ke pengaturan default"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Komponen Biaya & Uang Harian */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1">
        {/* Kolom Kiri: Komponen Biaya (Categorized) */}
        <div className="lg:col-span-8 space-y-3">
          <div className="flex items-baseline justify-between">
            <h3 className="text-xs font-semibold text-slate-800">
              Komponen Biaya yang Dihitung
            </h3>
            <span className="text-[11px] text-slate-400">
              Pilih komponen yang relevan dengan kegiatan
            </span>
          </div>

          <div className="space-y-2.5">
            {/* Transportasi */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-medium text-slate-400 w-24 shrink-0">
                Transportasi:
              </span>
              <div className="flex flex-wrap gap-1.5 flex-1">
                {transportCosts.map((c) => renderCostChip(c.key, c.label))}
              </div>
            </div>

            {/* Akomodasi & Rapat */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-medium text-slate-400 w-24 shrink-0">
                Akomodasi:
              </span>
              <div className="flex flex-wrap gap-1.5 flex-1">
                {accommodationCosts.map((c) => renderCostChip(c.key, c.label))}
              </div>
            </div>

            {/* Lainnya */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-medium text-slate-400 w-24 shrink-0">
                Lain-lain:
              </span>
              <div className="flex flex-wrap gap-1.5 flex-1">
                {otherCosts.map((c) => renderCostChip(c.key, c.label))}
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Jenis Uang Harian SBM */}
        <div className="lg:col-span-4 space-y-3 lg:border-l lg:border-slate-200/70 lg:pl-5">
          <div>
            <h3 className="text-xs font-semibold text-slate-800">
              Jenis Uang Harian (SBM PMK)
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Standar tarif uang saku sesuai skema dinas
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-1.5">
            {uhList.map(({ key, label, sub }) => {
              const isActive = activeUh[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleUh(key)}
                  className={`btn-tactile flex items-center justify-between p-2 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                    isActive
                      ? "glass-control-active text-slate-900 font-semibold"
                      : "glass-control text-slate-600 hover:text-slate-900 hover:bg-white/80"
                  }`}
                >
                  <div className="text-left leading-tight">
                    <span className="block">{label}</span>
                    <span className="text-[10px] text-slate-400 font-normal">{sub}</span>
                  </div>
                  <span
                    className={`w-3.5 h-3.5 rounded shrink-0 ml-2 flex items-center justify-center border transition-all ${
                      isActive
                        ? "bg-[#0071e3] border-[#0071e3] text-white"
                        : "border-slate-300 bg-white/70"
                    }`}
                  >
                    {isActive && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
