"use client";

import React, { useMemo, useState } from "react";
import { AnggaranRow, formatPercent, formatRupiah } from "@/lib/anggaranHelper";
import { PieChart as PieChartIcon, BarChart3 } from "lucide-react";

interface MonitoringAnggaranChartsProps {
  allRows: AnggaranRow[];
  selectedProgram: "all" | "WA" | "CL";
  selectedFilter: "all" | "524" | "521" | "522";
  periode: string;
  onSelectFilter: (filter: "all" | "524" | "521" | "522") => void;
  onSelectProgram: (prog: "all" | "WA" | "CL") => void;
}

type BarChartViewMode = "kelompok" | "mak" | "komponen";
type DonutSliceKey = "realLalu" | "realIni" | "sisa" | null;

function formatShortRupiah(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000_000) {
    return `${sign}Rp ${(abs / 1_000_000_000).toFixed(2).replace(".", ",")} M`;
  }
  if (abs >= 1_000_000) {
    return `${sign}Rp ${(abs / 1_000_000).toFixed(1).replace(".", ",")} Jt`;
  }
  if (abs >= 1_000) {
    return `${sign}Rp ${Math.round(abs / 1_000).toLocaleString("id-ID")} Rb`;
  }
  return formatRupiah(value);
}

export const MonitoringAnggaranCharts: React.FC<MonitoringAnggaranChartsProps> = ({
  allRows,
  selectedProgram,
  selectedFilter,
  periode,
  onSelectFilter,
  onSelectProgram,
}) => {
  const [barMode, setBarMode] = useState<BarChartViewMode>("kelompok");
  const [hoveredSlice, setHoveredSlice] = useState<DonutSliceKey>(null);
  const [hoveredBarId, setHoveredBarId] = useState<string | null>(null);

  const rowMap = useMemo(() => {
    const m = new Map<string, AnggaranRow>();
    allRows.forEach((r) => m.set(r.id, r));
    return m;
  }, [allRows]);

  // Rows scoped strictly to active Program selector
  const programRows = useMemo(() => {
    if (selectedProgram === "all") return allRows;
    return allRows.filter((r) => {
      if (r.type === "total") return false;
      let curr: AnggaranRow | undefined = r;
      while (curr) {
        if (curr.type === "program" && curr.kode === selectedProgram) return true;
        if (!curr.parentId) return false;
        curr = rowMap.get(curr.parentId);
      }
      return false;
    });
  }, [allRows, selectedProgram, rowMap]);

  // Donut figures: respects both Program AND optional Akun filter
  const summaryStats = useMemo(() => {
    if (selectedFilter === "all") {
      const target =
        selectedProgram === "all"
          ? allRows.find((r) => r.type === "total")
          : allRows.find((r) => r.type === "program" && r.kode === selectedProgram);
      return {
        label: selectedProgram === "all" ? "Total Pagu DIPA" : `Program ${selectedProgram}`,
        pagu: target?.pagu || 0,
        realLalu: target?.realLalu || 0,
        realIni: target?.realIni || 0,
        realSd: target?.realSd || 0,
        sisa: target?.sisa || 0,
        persen: target?.persen || 0,
      };
    }

    const matchingAkun = programRows.filter(
      (r) => r.type === "akun" && r.kode.startsWith(selectedFilter)
    );
    const pagu = matchingAkun.reduce((s, r) => s + r.pagu, 0);
    const realLalu = matchingAkun.reduce((s, r) => s + r.realLalu, 0);
    const realIni = matchingAkun.reduce((s, r) => s + r.realIni, 0);
    const realSd = matchingAkun.reduce((s, r) => s + r.realSd, 0);
    const sisa = matchingAkun.reduce((s, r) => s + r.sisa, 0);
    const persen = pagu > 0 ? (realSd / pagu) * 100 : 0;
    const filterName =
      selectedFilter === "524"
        ? "Perjalanan Dinas (524)"
        : selectedFilter === "522"
        ? "Sewa & Jasa (522)"
        : "Bahan & Honor (521)";
    return { label: filterName, pagu, realLalu, realIni, realSd, sisa, persen };
  }, [allRows, programRows, selectedProgram, selectedFilter]);

  // Program comparison cards for WA vs CL
  const programBreakdown = useMemo(() => {
    return ["WA", "CL"].map((code) => {
      const row = allRows.find((r) => r.type === "program" && r.kode === code);
      return {
        kode: code as "WA" | "CL",
        title: code === "WA" ? "Program WA — Inspektorat" : "Program CL — Tata Niaga & Pangan",
        pagu: row?.pagu || 0,
        realSd: row?.realSd || 0,
        realIni: row?.realIni || 0,
        sisa: row?.sisa || 0,
        persen: row?.persen || 0,
      };
    });
  }, [allRows]);

  // Account Group breakdown (524, 522, 521)
  const kelompokData = useMemo(() => {
    const groups: {
      filterKey: "524" | "522" | "521";
      kode: string;
      label: string;
      barColor: string;
      badgeClass: string;
    }[] = [
      {
        filterKey: "524",
        kode: "524xxx",
        label: "Belanja Perjalanan Dinas",
        barColor: "bg-blue-500",
        badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300",
      },
      {
        filterKey: "522",
        kode: "522xxx",
        label: "Belanja Sewa & Jasa",
        barColor: "bg-violet-500",
        badgeClass: "bg-violet-100 text-violet-800 dark:bg-violet-900/60 dark:text-violet-300",
      },
      {
        filterKey: "521",
        kode: "521xxx",
        label: "Belanja Bahan & Honor",
        barColor: "bg-emerald-500",
        badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300",
      },
    ];

    return groups.map((g) => {
      const matches = programRows.filter((r) => r.type === "akun" && r.kode.startsWith(g.filterKey));
      const pagu = matches.reduce((s, r) => s + r.pagu, 0);
      const realLalu = matches.reduce((s, r) => s + r.realLalu, 0);
      const realIni = matches.reduce((s, r) => s + r.realIni, 0);
      const realSd = matches.reduce((s, r) => s + r.realSd, 0);
      const sisa = matches.reduce((s, r) => s + r.sisa, 0);
      const persen = pagu > 0 ? (realSd / pagu) * 100 : 0;
      return { ...g, pagu, realLalu, realIni, realSd, sisa, persen };
    });
  }, [programRows]);

  // Detailed 6-digit MAK breakdown sorted by Pagu desc
  const makBreakdown = useMemo(() => {
    const map = new Map<
      string,
      { id: string; kode: string; label: string; pagu: number; realLalu: number; realIni: number; realSd: number; sisa: number }
    >();
    programRows
      .filter((r) => r.type === "akun" && (selectedFilter === "all" || r.kode.startsWith(selectedFilter)))
      .forEach((r) => {
        const key = r.kode.slice(0, 6);
        const existing = map.get(key);
        if (existing) {
          existing.pagu += r.pagu;
          existing.realLalu += r.realLalu;
          existing.realIni += r.realIni;
          existing.realSd += r.realSd;
          existing.sisa += r.sisa;
        } else {
          map.set(key, {
            id: `mak-${key}`,
            kode: key,
            label: r.uraian,
            pagu: r.pagu,
            realLalu: r.realLalu,
            realIni: r.realIni,
            realSd: r.realSd,
            sisa: r.sisa,
          });
        }
      });

    return Array.from(map.values())
      .map((item) => ({
        ...item,
        persen: item.pagu > 0 ? (item.realSd / item.pagu) * 100 : 0,
      }))
      .sort((a, b) => b.pagu - a.pagu)
      .slice(0, 7);
  }, [programRows, selectedFilter]);

  // Top Komponen breakdown sorted by Pagu desc
  const komponenBreakdown = useMemo(() => {
    return programRows
      .filter((r) => r.type === "komponen")
      .map((r) => {
        const parentRo = r.parentId ? rowMap.get(r.parentId) : undefined;
        return {
          id: r.id,
          kode: parentRo?.kode ? `${parentRo.kode}.${r.kode}` : r.kode,
          label: r.uraian,
          pagu: r.pagu,
          realLalu: r.realLalu,
          realIni: r.realIni,
          realSd: r.realSd,
          sisa: r.sisa,
          persen: r.persen,
        };
      })
      .sort((a, b) => b.pagu - a.pagu)
      .slice(0, 7);
  }, [programRows, rowMap]);

  // Donut SVG geometry (circumference = 2 * pi * 58)
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const safePagu = Math.max(1, summaryStats.pagu);
  const ratioLalu = Math.min(1, Math.max(0, summaryStats.realLalu / safePagu));
  const ratioIni = Math.min(1 - ratioLalu, Math.max(0, summaryStats.realIni / safePagu));
  const ratioSisa = Math.max(0, 1 - ratioLalu - ratioIni);

  const dashLalu = ratioLalu * circumference;
  const dashIni = ratioIni * circumference;
  const dashSisa = ratioSisa * circumference;

  const activeMonth = periode.split(" ")[0] || "Ini";

  const centerReadout = useMemo(() => {
    if (hoveredSlice === "realLalu") {
      return {
        title: "Periode Lalu",
        pct: formatPercent((summaryStats.realLalu / safePagu) * 100),
        val: formatShortRupiah(summaryStats.realLalu),
        color: "text-emerald-600 dark:text-emerald-400",
      };
    }
    if (hoveredSlice === "realIni") {
      return {
        title: `Bulan ${activeMonth}`,
        pct: formatPercent((summaryStats.realIni / safePagu) * 100),
        val: formatShortRupiah(summaryStats.realIni),
        color: "text-amber-600 dark:text-amber-400",
      };
    }
    if (hoveredSlice === "sisa") {
      return {
        title: "Sisa Anggaran",
        pct: formatPercent((Math.max(0, summaryStats.sisa) / safePagu) * 100),
        val: formatShortRupiah(summaryStats.sisa),
        color: "text-indigo-600 dark:text-indigo-400",
      };
    }
    return {
      title: "Total Serapan",
      pct: formatPercent(summaryStats.persen),
      val: formatShortRupiah(summaryStats.realSd),
      color: "text-slate-900 dark:text-white",
    };
  }, [hoveredSlice, summaryStats, safePagu, activeMonth]);

  const maxBarPagu = useMemo(() => {
    if (barMode === "mak") {
      return Math.max(1, ...makBreakdown.map((m) => m.pagu));
    }
    if (barMode === "komponen") {
      return Math.max(1, ...komponenBreakdown.map((k) => k.pagu));
    }
    return Math.max(1, ...kelompokData.map((g) => g.pagu));
  }, [barMode, makBreakdown, komponenBreakdown, kelompokData]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 no-print">
      {/* LEFT CARD: SVG DONUT SERAPAN & KOMPOSISI PAGU */}
      <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 flex flex-col justify-between gap-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-center shrink-0">
              <PieChartIcon className="w-3.5 h-3.5" />
            </span>
            <h2 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
              Proporsi Serapan Anggaran
            </h2>
          </div>
          <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
            {summaryStats.label}
          </span>
        </div>

        {/* SVG Donut Chart */}
        <div className="flex items-center justify-center py-1">
          <div className="relative w-44 h-44">
            <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90 overflow-visible">
              {/* Background Base Ring */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="transparent"
                className="stroke-slate-100 dark:stroke-slate-800"
                strokeWidth={20}
              />

              {/* Slice 3: Sisa Dana */}
              {dashSisa > 0 && (
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke="#6366f1"
                  strokeOpacity={hoveredSlice && hoveredSlice !== "sisa" ? 0.2 : 0.28}
                  strokeWidth={hoveredSlice === "sisa" ? 24 : 20}
                  strokeDasharray={`${dashSisa} ${circumference}`}
                  strokeDashoffset={-(dashLalu + dashIni)}
                  className="transition-all duration-300 cursor-pointer"
                  onMouseEnter={() => setHoveredSlice("sisa")}
                  onMouseLeave={() => setHoveredSlice(null)}
                />
              )}

              {/* Slice 1: Realisasi Periode Lalu */}
              {dashLalu > 0 && (
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke="#10b981"
                  strokeOpacity={hoveredSlice && hoveredSlice !== "realLalu" ? 0.45 : 1}
                  strokeWidth={hoveredSlice === "realLalu" ? 24 : 20}
                  strokeDasharray={`${dashLalu} ${circumference}`}
                  strokeDashoffset={0}
                  className="transition-all duration-300 cursor-pointer"
                  onMouseEnter={() => setHoveredSlice("realLalu")}
                  onMouseLeave={() => setHoveredSlice(null)}
                />
              )}

              {/* Slice 2: Realisasi Bulan Ini */}
              {dashIni > 0 && (
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke="#f59e0b"
                  strokeOpacity={hoveredSlice && hoveredSlice !== "realIni" ? 0.45 : 1}
                  strokeWidth={hoveredSlice === "realIni" ? 24 : 20}
                  strokeDasharray={`${dashIni} ${circumference}`}
                  strokeDashoffset={-dashLalu}
                  className="transition-all duration-300 cursor-pointer"
                  onMouseEnter={() => setHoveredSlice("realIni")}
                  onMouseLeave={() => setHoveredSlice(null)}
                />
              )}
            </svg>

            {/* Donut Center Readout */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {centerReadout.title}
              </span>
              <span className={`text-xl font-black tracking-tight tabular-nums ${centerReadout.color}`}>
                {centerReadout.pct}
              </span>
              <span className="text-[10.5px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                {centerReadout.val}
              </span>
            </div>
          </div>
        </div>

        {/* Interactive Legend */}
        <div className="space-y-1.5 text-xs">
          <div
            onMouseEnter={() => setHoveredSlice("realLalu")}
            onMouseLeave={() => setHoveredSlice(null)}
            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-emerald-50/70 dark:hover:bg-emerald-950/30 transition-colors cursor-default"
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 shrink-0" />
              <span className="font-medium text-slate-700 dark:text-slate-300">Periode Lalu</span>
            </div>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
              {formatShortRupiah(summaryStats.realLalu)}
            </span>
          </div>

          <div
            onMouseEnter={() => setHoveredSlice("realIni")}
            onMouseLeave={() => setHoveredSlice(null)}
            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-amber-50/80 dark:hover:bg-amber-950/30 transition-colors cursor-default"
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 shrink-0" />
              <span className="font-medium text-slate-700 dark:text-slate-300">Bulan {activeMonth}</span>
            </div>
            <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
              {formatShortRupiah(summaryStats.realIni)}
            </span>
          </div>

          <div
            onMouseEnter={() => setHoveredSlice("sisa")}
            onMouseLeave={() => setHoveredSlice(null)}
            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-indigo-50/70 dark:hover:bg-indigo-950/30 transition-colors cursor-default"
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-400/50 border border-indigo-400 shrink-0" />
              <span className="font-medium text-slate-700 dark:text-slate-300">Sisa Anggaran</span>
            </div>
            <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300">
              {formatShortRupiah(summaryStats.sisa)}
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT CARD: HORIZONTAL BAR CHART BREAKDOWN (KELOMPOK / MAK / KOMPONEN) */}
      <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 flex flex-col justify-between gap-4">
        {/* Header + Chart View Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#0071e3] dark:text-blue-400 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center shrink-0">
              <BarChart3 className="w-3.5 h-3.5" />
            </span>
            <h2 className="text-xs font-bold text-slate-800 dark:text-slate-100">
              Realisasi vs Pagu Anggaran
            </h2>
          </div>

          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-[11px]">
            {(
              [
                { id: "kelompok", label: "Kelompok Akun" },
                { id: "mak", label: "Per Kode MAK" },
                { id: "komponen", label: "Top Komponen" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setBarMode(tab.id)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  barMode === tab.id
                    ? "bg-white dark:bg-slate-900 text-[#0071e3] dark:text-blue-400 shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mode 1: Kelompok Akun + Program WA/CL mini comparison */}
        {barMode === "kelompok" && (
          <div className="space-y-4">
            <div className="space-y-3">
              {kelompokData.map((item) => {
                const trackWidthPct = Math.max(6, (item.pagu / maxBarPagu) * 100);
                const realLaluPct = item.pagu > 0 ? Math.min(100, (item.realLalu / item.pagu) * 100) : 0;
                const realIniPct = item.pagu > 0 ? Math.min(100 - realLaluPct, (item.realIni / item.pagu) * 100) : 0;
                const isSelected = selectedFilter === item.filterKey;

                return (
                  <button
                    key={item.filterKey}
                    type="button"
                    onClick={() => onSelectFilter(isSelected ? "all" : item.filterKey)}
                    onMouseEnter={() => setHoveredBarId(item.filterKey)}
                    onMouseLeave={() => setHoveredBarId(null)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-blue-50/50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700"
                        : "bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/70 border-slate-200/70 dark:border-slate-800"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`px-1.5 py-0.5 rounded font-mono text-[10.5px] font-bold ${item.badgeClass}`}>
                          {item.kode}
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {item.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 text-[11px] font-mono">
                        <span className="text-slate-500 dark:text-slate-400">
                          {formatShortRupiah(item.realSd)} / {formatShortRupiah(item.pagu)}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded font-bold ${
                            item.persen >= 90
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : item.persen >= 50
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                              : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {formatPercent(item.persen)}
                        </span>
                      </div>
                    </div>

                    {/* Proportional Track (scaled to largest category pagu) */}
                    <div
                      className="h-3 rounded-full bg-slate-200/80 dark:bg-slate-700/70 overflow-hidden flex transition-all"
                      style={{ width: `${trackWidthPct}%` }}
                    >
                      <div
                        className={`${item.barColor} h-full transition-all duration-500`}
                        style={{ width: `${realLaluPct}%` }}
                        title={`Periode Lalu: ${formatRupiah(item.realLalu)}`}
                      />
                      {realIniPct > 0 && (
                        <div
                          className="bg-amber-400 h-full transition-all duration-500"
                          style={{ width: `${realIniPct}%` }}
                          title={`Bulan Ini: ${formatRupiah(item.realIni)}`}
                        />
                      )}
                    </div>

                    {hoveredBarId === item.filterKey && (
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[10.5px] font-mono text-slate-500 dark:text-slate-400">
                        <span>Pagu: {formatRupiah(item.pagu)}</span>
                        <span>Bulan Ini: {formatRupiah(item.realIni)}</span>
                        <span className="text-indigo-700 dark:text-indigo-300 font-semibold">
                          Sisa: {formatRupiah(item.sisa)}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Program WA vs CL quick visual bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {programBreakdown.map((p) => {
                const active = selectedProgram === p.kode;
                const fillPct = Math.min(100, Math.max(0, p.persen));
                return (
                  <button
                    key={p.kode}
                    type="button"
                    onClick={() => onSelectProgram(active ? "all" : p.kode)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      active
                        ? "bg-purple-50/70 dark:bg-purple-950/30 border-purple-300 dark:border-purple-700"
                        : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 border-slate-200/80 dark:border-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-[11px] mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={`px-1.5 py-0.5 rounded font-mono font-bold text-[10px] ${
                            p.kode === "WA"
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300"
                              : "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300"
                          }`}
                        >
                          {p.kode}
                        </span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                          {p.title}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-100 shrink-0">
                        {formatPercent(p.persen)}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-1">
                      <div
                        className={p.kode === "WA" ? "bg-purple-500 h-full rounded-full" : "bg-indigo-500 h-full rounded-full"}
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10.5px] font-mono text-slate-500 dark:text-slate-400">
                      <span>Real: {formatShortRupiah(p.realSd)}</span>
                      <span>Pagu: {formatShortRupiah(p.pagu)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Mode 2 & 3: Per Kode MAK or Top Komponen */}
        {(barMode === "mak" || barMode === "komponen") && (
          <div className="space-y-2.5">
            {(barMode === "mak" ? makBreakdown : komponenBreakdown).map((row) => {
              const trackWidthPct = Math.max(8, (row.pagu / maxBarPagu) * 100);
              const realLaluPct = row.pagu > 0 ? Math.min(100, (row.realLalu / row.pagu) * 100) : 0;
              const realIniPct = row.pagu > 0 ? Math.min(100 - realLaluPct, (row.realIni / row.pagu) * 100) : 0;

              return (
                <div
                  key={row.id}
                  onMouseEnter={() => setHoveredBarId(row.id)}
                  onMouseLeave={() => setHoveredBarId(null)}
                  className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold shrink-0 ${
                          barMode === "mak"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300"
                            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300"
                        }`}
                      >
                        {row.kode}
                      </span>
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate" title={row.label}>
                        {row.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] font-mono shrink-0">
                      <span className="text-slate-500 dark:text-slate-400">
                        {formatShortRupiah(row.realSd)} / {formatShortRupiah(row.pagu)}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded font-bold ${
                          row.persen >= 90
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : row.persen >= 50
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                            : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {formatPercent(row.persen)}
                      </span>
                    </div>
                  </div>

                  <div
                    className="h-2.5 rounded-full bg-slate-200/80 dark:bg-slate-700/70 overflow-hidden flex"
                    style={{ width: `${trackWidthPct}%` }}
                  >
                    <div
                      className={
                        row.persen >= 90
                          ? "bg-emerald-500 h-full transition-all duration-500"
                          : "bg-blue-500 h-full transition-all duration-500"
                      }
                      style={{ width: `${realLaluPct}%` }}
                    />
                    {realIniPct > 0 && (
                      <div
                        className="bg-amber-400 h-full transition-all duration-500"
                        style={{ width: `${realIniPct}%` }}
                      />
                    )}
                  </div>

                  {hoveredBarId === row.id && (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-[10.5px] font-mono text-slate-500 dark:text-slate-400">
                      <span>Pagu: {formatRupiah(row.pagu)}</span>
                      <span>Lalu: {formatRupiah(row.realLalu)}</span>
                      <span>Bulan Ini: {formatRupiah(row.realIni)}</span>
                      <span className="text-indigo-700 dark:text-indigo-300 font-semibold">
                        Sisa: {formatRupiah(row.sisa)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
