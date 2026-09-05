"use client";

import React, { useState, useCallback } from "react";
import {
  X,
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Save,
  Link2,
  ShieldCheck,
  Zap,
} from "lucide-react";
import {
  getGasApiUrl,
  setGasApiUrl,
  testGasConnection,
  fetchMasterDataFromSheet,
  savePerdinToGoogleSheet,
  MasterSyncData,
} from "@/lib/googleSheetsService";
import { HeaderData, ParticipantRow, Pegawai, SbmRate, NomorMemo } from "@/lib/types";

interface ModalDatabaseSyncProps {
  isOpen: boolean;
  onClose: () => void;
  header: HeaderData;
  rows: ParticipantRow[];
  onMasterSyncSuccess?: (data: MasterSyncData) => void;
  currentPegawaiList: Pegawai[];
  currentSbmList: SbmRate[];
  currentMemoList: NomorMemo[];
}

export const ModalDatabaseSync: React.FC<ModalDatabaseSyncProps> = ({
  isOpen,
  onClose,
  header,
  rows,
  onMasterSyncSuccess,
}) => {
  const [url, setUrl] = useState<string>(() => (typeof window !== "undefined" ? getGasApiUrl() : ""));
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "idle" | "success" | "error" | "info"; text: string }>({
    type: "idle",
    text: "",
  });
  const [isConnected, setIsConnected] = useState<boolean | null>(() => {
    if (typeof window !== "undefined") {
      const saved = getGasApiUrl();
      return Boolean(saved && saved.trim() !== "");
    }
    return null;
  });

  const checkHealth = useCallback(async (targetUrl: string) => {
    if (!targetUrl) {
      setIsConnected(false);
      setStatusMessage({ type: "error", text: "Mohon masukkan URL Web App terlebih dahulu." });
      return;
    }
    setIsTesting(true);
    setStatusMessage({ type: "info", text: "Menguji koneksi ke Google Spreadsheet..." });
    const res = await testGasConnection(targetUrl);
    setIsTesting(false);
    if (res.success) {
      setIsConnected(true);
      setStatusMessage({ type: "success", text: res.message });
    } else {
      setIsConnected(false);
      setStatusMessage({ type: "error", text: res.message });
    }
  }, []);

  const handleSaveUrl = () => {
    setGasApiUrl(url);
    checkHealth(url);
  };

  const handleManualTest = () => {
    setGasApiUrl(url);
    checkHealth(url);
  };

  const handleSaveToSheet = async () => {
    if (!url) {
      setStatusMessage({ type: "error", text: "Mohon masukkan URL Google Apps Script Web App terlebih dahulu." });
      return;
    }
    setIsSaving(true);
    setStatusMessage({ type: "info", text: "Menyimpan transaksi kegiatan & 48 kolom rekap ke Google Spreadsheet..." });
    const res = await savePerdinToGoogleSheet(header, rows, url);
    setIsSaving(false);
    if (res.success) {
      setIsConnected(true);
      setStatusMessage({ type: "success", text: res.message });
    } else {
      setStatusMessage({ type: "error", text: res.message });
    }
  };

  const handleFetchMaster = async () => {
    if (!url) {
      setStatusMessage({ type: "error", text: "Mohon masukkan URL Web App terlebih dahulu." });
      return;
    }
    setIsSyncing(true);
    setStatusMessage({ type: "info", text: "Menarik data Pegawai, SBM, dan Register Memo dari Google Spreadsheet..." });
    const res = await fetchMasterDataFromSheet(url);
    setIsSyncing(false);
    if (res.success && res.data) {
      setIsConnected(true);
      if (onMasterSyncSuccess) {
        onMasterSyncSuccess(res.data);
      }
      setStatusMessage({
        type: "success",
        text: `Berhasil sinkronisasi master data! (${res.data.pegawai?.length || 0} Pegawai, ${res.data.sbm?.length || 0} SBM Provinsi).`,
      });
    } else {
      setStatusMessage({ type: "error", text: res.message || "Gagal sinkronisasi data master." });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shadow-inner">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight">Integrasi Database Google Spreadsheet</h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    isConnected
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`}
                  />
                  {isConnected ? "Terhubung" : "Belum Terhubung"}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Penyimpanan data transaksi Perdin & sinkronisasi Rekap 48 Kolom
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-700">
          {/* URL Configuration Section */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              URL Web App Google Apps Script (Deployment Exec URL)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs font-mono rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>
              <button
                onClick={handleManualTest}
                disabled={isTesting || !url}
                className="btn-tactile px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-amber-400" />}
                <span>Uji Koneksi</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              💡 Salin URL hasil <strong>Deploy Web App</strong> dari Google Apps Script spreadsheet Anda. Pastikan opsi <em>Who has access</em> dipilih <strong>Anyone</strong>.
            </p>
          </div>

          {/* Status Alert */}
          {statusMessage.text && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs animate-in fade-in duration-200 ${
                statusMessage.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : statusMessage.type === "error"
                  ? "bg-rose-50 border-rose-200 text-rose-800"
                  : "bg-blue-50 border-blue-200 text-blue-800"
              }`}
            >
              {statusMessage.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
              {statusMessage.type === "error" && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
              {statusMessage.type === "info" && <RefreshCw className="w-4 h-4 text-blue-600 shrink-0 mt-0.5 animate-spin" />}
              <div className="flex-1 leading-relaxed">{statusMessage.text}</div>
            </div>
          )}

          {/* Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
            {/* Action 1: Save Perdin */}
            <div className="p-4 rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                    <Save className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">Simpan Transaksi Perdin</h4>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Kirim data kegiatan saat ini ({rows.length} peserta, total Rp{" "}
                  {rows.reduce((s, r) => s + (r.totalJumlah || 0), 0).toLocaleString("id-ID")}) ke tab <code>DB_KEGIATAN</code>, <code>DB_PESERTA</code>, dan <code>REKAP_PERDIN_48KOLOM</code>.
                </p>
              </div>
              <button
                onClick={handleSaveToSheet}
                disabled={isSaving || !url}
                className="btn-tactile w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Simpan ke Google Sheets</span>
              </button>
            </div>

            {/* Action 2: Pull Master Data */}
            <div className="p-4 rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">Tarik Data Master</h4>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Perbarui daftar Pegawai, Tarif SBM PMK 2026, dan Register Nomor Memo langsung dari spreadsheet ke aplikasi.
                </p>
              </div>
              <button
                onClick={handleFetchMaster}
                disabled={isSyncing || !url}
                className="btn-tactile w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
              >
                {isSyncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>Tarik Master Pegawai & SBM</span>
              </button>
            </div>
          </div>

          {/* Quick Info & Guide */}
          <div className="p-3.5 rounded-xl bg-slate-100/70 border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-[11px] leading-relaxed">
              <p className="font-semibold text-slate-800">Prinsip Keamanan & Cadangan Otomatis:</p>
              <p>
                Setiap penyimpanan akan langsung diamankan dengan <code>LockService</code> di Google Apps Script untuk mencegah tabrakan data, dan disalin ke memori lokal browser Anda sebagai cadangan offline.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">
            {isConnected ? "Status: Online (Google Sheets)" : "Status: Siap Terhubung"}
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleSaveUrl}
              className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition-all cursor-pointer"
            >
              Simpan Pengaturan
            </button>
            <button
              onClick={onClose}
              className="btn-tactile px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
