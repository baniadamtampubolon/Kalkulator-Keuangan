"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Search, ChevronDown, Check, X, User } from "lucide-react";
import { Pegawai } from "@/lib/types";

interface EmployeeSearchSelectProps {
  value: string;
  onSelect: (pegawaiName: string) => void;
  pegawaiList: Pegawai[];
  nip?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const EmployeeSearchSelect: React.FC<EmployeeSearchSelectProps> = ({
  value,
  onSelect,
  pegawaiList,
  nip,
  placeholder = "-- Pilih Pegawai --",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; placeAbove: boolean }>({
    top: 0,
    left: 0,
    width: 260,
    placeAbove: false,
  });

  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter employees based on search query (name, nip, golongan, jabatan)
  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return pegawaiList;
    const q = searchQuery.toLowerCase().trim();
    return pegawaiList.filter((p) => {
      const matchName = (p.nama || "").toLowerCase().includes(q);
      const matchNip = (p.nip || "").replace(/\s+/g, "").includes(q.replace(/\s+/g, ""));
      const matchGol = (p.golongan || "").toLowerCase().includes(q);
      const matchJabatan = (p.jabatan || "").toLowerCase().includes(q);
      return matchName || matchNip || matchGol || matchJabatan;
    });
  }, [pegawaiList, searchQuery]);

  // Calculate dropdown positioning
  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = 300; // approximate max height
    const spaceBelow = window.innerHeight - rect.bottom;
    const placeAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

    const width = Math.max(rect.width, 280);

    setCoords({
      top: placeAbove ? rect.top - 6 : rect.bottom + 6,
      left: Math.min(rect.left, window.innerWidth - width - 12),
      width,
      placeAbove,
    });
  };

  const handleOpen = () => {
    if (disabled) return;
    updatePosition();
    setSearchQuery("");
    setHighlightedIndex(0);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchQuery("");
  };

  // Auto focus input when opened
  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const t = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Close when clicking outside or scrolling
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        handleClose();
      }
    };

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        handleOpen();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredList.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredList.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredList[highlightedIndex]) {
        onSelect(filteredList[highlightedIndex].nama);
        handleClose();
      } else if (searchQuery.trim()) {
        onSelect(searchQuery.trim());
        handleClose();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleClose();
    }
  };

  const selectedPegawai = useMemo(
    () => pegawaiList.find((p) => p.nama === value),
    [pegawaiList, value]
  );

  return (
    <div className="relative w-full" onKeyDown={handleKeyDown}>
      {/* Trigger Box */}
      <div
        ref={triggerRef}
        onClick={isOpen ? handleClose : handleOpen}
        className={`input-glass w-full min-h-[32px] px-2 py-1 flex items-center justify-between gap-1.5 cursor-pointer select-none transition-all ${
          isOpen ? "ring-2 ring-blue-500/30 border-blue-500 bg-white" : "hover:border-slate-300"
        } ${disabled ? "opacity-50 cursor-not-allowed bg-slate-100" : ""}`}
        tabIndex={disabled ? -1 : 0}
        title={value ? `Terpilih: ${value}` : "Klik untuk mencari pegawai"}
      >
        <div className="flex-1 min-w-0 pr-1">
          {value ? (
            <div className="truncate text-xs font-semibold text-slate-900 leading-tight">
              {value}
            </div>
          ) : (
            <span className="text-slate-400 text-xs italic">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {value && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect("");
              }}
              className="p-0.5 rounded-full hover:bg-slate-200/80 text-slate-400 hover:text-slate-600 transition-colors"
              title="Kosongkan pilihan"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-blue-600" : ""
            }`}
          />
        </div>
      </div>

      {/* Sub-label: NIP */}
      {(nip || selectedPegawai?.nip) && (
        <span className="block text-[10px] font-mono text-slate-400 pl-1 pt-0.5 whitespace-nowrap">
          NIP. {nip || selectedPegawai?.nip}
        </span>
      )}

      {/* Portal Dropdown Menu */}
      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "fixed",
              top: coords.placeAbove ? undefined : `${coords.top}px`,
              bottom: coords.placeAbove ? `${window.innerHeight - coords.top}px` : undefined,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
            }}
            className="z-[9999] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-100 text-xs flex flex-col max-h-72"
          >
            {/* Search Input Header */}
            <div className="p-2 border-b border-slate-100 bg-slate-50/80 sticky top-0 z-10 flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Cari nama, NIP, atau jabatan..."
                className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Employee List */}
            <div className="overflow-y-auto flex-1 divide-y divide-slate-100/60 p-1">
              {filteredList.length === 0 ? (
                <div className="py-5 px-3 text-center space-y-2">
                  <User className="w-5 h-5 mx-auto text-slate-300" />
                  <p className="text-xs text-slate-600">Pegawai tidak ditemukan di master data</p>
                  {searchQuery.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(searchQuery.trim());
                        handleClose();
                      }}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Gunakan nama: &ldquo;{searchQuery.trim()}&rdquo;</span>
                    </button>
                  )}
                </div>
              ) : (
                filteredList.map((p, index) => {
                  const isSelected = p.nama === value;
                  const isHighlighted = index === highlightedIndex;

                  return (
                    <div
                      key={p.kodeNama || p.nama || index}
                      onClick={() => {
                        onSelect(p.nama);
                        handleClose();
                      }}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={`px-2.5 py-2 rounded-lg cursor-pointer transition-colors flex items-start justify-between gap-2 ${
                        isHighlighted ? "bg-blue-50/80 text-blue-950" : "hover:bg-slate-50"
                      } ${isSelected ? "bg-blue-100/60 font-semibold" : ""}`}
                    >
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-xs truncate ${
                              isSelected ? "font-bold text-blue-900" : "font-medium text-slate-800"
                            }`}
                          >
                            {p.nama}
                          </span>
                          {p.golongan && (
                            <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200/80 text-slate-600 font-semibold shrink-0">
                              {p.golongan}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono flex-wrap">
                          {p.nip && <span>NIP. {p.nip}</span>}
                          {p.jabatan && (
                            <span className="text-slate-400 truncate max-w-[150px] font-sans">
                              • {p.jabatan}
                            </span>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Status */}
            <div className="px-2.5 py-1.5 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
              <span>{filteredList.length} pegawai ditemukan</span>
              <span className="font-mono text-[9.5px]">Enter untuk pilih</span>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
