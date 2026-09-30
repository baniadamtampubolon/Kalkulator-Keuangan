"use client";

import React from "react";
import { AlertTriangle, Plus, CloudUpload, X, RotateCcw } from "lucide-react";

interface ModalConfirmNewSpjProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmNew: () => void;
  onSaveAndNew?: () => void;
  hasUnsavedChanges: boolean;
}

export const ModalConfirmNewSpj: React.FC<ModalConfirmNewSpjProps> = ({
  isOpen,
  onClose,
  onConfirmNew,
  onSaveAndNew,
  hasUnsavedChanges,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
      <div className="relative w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-5">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-2xl bg-amber-100 text-amber-700 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">Mulai Pembuatan SPJ Baru?</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {hasUnsavedChanges
                ? "Form saat ini memiliki data atau perubahan yang belum disimpan ke database. Jika Anda membuat SPJ baru, perubahan yang belum tersimpan akan dibersihkan."
                : "Form akan direset bersih dan nomor ID Kegiatan baru akan di-generate secara otomatis untuk paket SPJ berikutnya."}
            </p>
          </div>
        </div>

        <div className="pt-2 space-y-2">
          {hasUnsavedChanges && onSaveAndNew && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onSaveAndNew();
              }}
              className="btn-tactile w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <CloudUpload className="w-4 h-4" />
              <span>Simpan Dulu & Buat SPJ Baru</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              onClose();
              onConfirmNew();
            }}
            className="btn-tactile w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Bersihkan Form & Buat SPJ Baru</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="btn-tactile w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
          >
            <span>Batal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
