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
  RotateCcw,
  CloudDownload,
  Users,
  MapPin,
  FileSpreadsheet,
  Lock,
  Unlock,
  KeyRound,
} from "lucide-react";
import {
  getGasApiUrl,
  setGasApiUrl,
  resetGasApiUrl,
  getDefaultGasApiUrl,
  testGasConnection,
  fetchMasterDataFromSheet,
  fetchRekapFromSheet,
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
  currentPegawaiList,
  currentSbmList,
  currentMemoList,
}) => {
  const ADMIN_PIN = "311001";
  const [url, setUrl] = useState<string>(() => (typeof window !== "undefined" ? getGasApiUrl() : ""));
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");

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

  const handleClose = () => {
    setIsUnlocked(false);
    setShowPinModal(false);
    setPinInput("");
    setPinError("");
    onClose();
  };

  const handleVerifyPin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pinInput.trim() === ADMIN_PIN) {
      setIsUnlocked(true);
      setShowPinModal(false);
      setPinInput("");
      setPinError("");
      setStatusMessage({
        type: "success",
        text: "Otorisasi Admin berhasil! URL Web App Google Apps Script kini dapat diedit.",
      });
    } else {
      setPinError("PIN Admin salah! Akses ditolak.");
    }
  };

  const handleLockAgain = () => {
    setIsUnlocked(false);
    setStatusMessage({
      type: "info",
      text: "Konfigurasi URL Web App telah dikunci kembali.",
    });
  };

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
    if (!isUnlocked) {
      setShowPinModal(true);
      setPinError("Buka kunci PIN Admin terlebih dahulu untuk menyimpan URL.");
      return;
    }
    setGasApiUrl(url);
    checkHealth(url);
    setIsUnlocked(false);
  };

  const handleResetUrl = () => {
    if (!isUnlocked) {
      setShowPinModal(true);
      setPinError("Buka kunci PIN Admin terlebih dahulu untuk mereset URL.");
      return;
    }
    const defaultUrl = resetGasApiUrl();
    setUrl(defaultUrl);
    checkHealth(defaultUrl);
  };

  const handleManualTest = () => {
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

  const handleFetchAllData = async () => {
    if (!url) {
      setStatusMessage({ type: "error", text: "Mohon masukkan URL Web App terlebih dahulu." });
      return;
    }
    setIsSyncing(true);
    setStatusMessage({ type: "info", text: "Menarik data Master (Pegawai, SBM, Memo) & Rekap 48 Kolom dari Google Spreadsheet..." });
    
    // Fetch master data & rekap data in parallel
    const [resMaster, resRekap] = await Promise.all([
      fetchMasterDataFromSheet(url),
      fetchRekapFromSheet(url),
    ]);

    setIsSyncing(false);
    if (resMaster.success && resMaster.data) {
      setIsConnected(true);
      if (onMasterSyncSuccess) {
        onMasterSyncSuccess(resMaster.data);
      }
      const rekapCount = resRekap.data?.length ?? 0;
      setStatusMessage({
        type: "success",
        text: `Berhasil sinkronisasi seluruh data Cloud! (${resMaster.data.pegawai?.length || 0} Pegawai, ${resMaster.data.sbm?.length || 0} SBM Provinsi, ${rekapCount} Baris Rekap Perdin).`,
      });
    } else {
      setStatusMessage({ type: "error", text: resMaster.message || resRekap.message || "Gagal sinkronisasi data." });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-200">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Koneksi Database Google Sheets</h3>
                <span
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 border border-slate-200"
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-[#0071e3]" : "bg-slate-400"}`}
                  />
                  {isConnected ? "Terhubung" : "Belum Terhubung"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Penyimpanan transaksi dinas & sinkronisasi Rekap 48 Kolom
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-slate-200/60 text-slate-700 flex items-center justify-center shrink-0">
                <Users className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-[10px] font-medium text-slate-400">Pegawai Aktif</div>
                <div className="text-xs font-bold text-slate-900">{currentPegawaiList.length} orang</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-slate-200/60 text-slate-700 flex items-center justify-center shrink-0">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-[10px] font-medium text-slate-400">Tarif SBM</div>
                <div className="text-xs font-bold text-slate-900">{currentSbmList.length} provinsi</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-slate-200/60 text-slate-700 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-[10px] font-medium text-slate-400">Register Memo</div>
                <div className="text-xs font-bold text-slate-900">{currentMemoList.length} nomor</div>
              </div>
            </div>
          </div>

          {/* URL Configuration Section */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="block text-[11px] font-semibold text-slate-700">
                  URL Web App Google Apps Script
                </label>
                {isUnlocked ? (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                    <Unlock className="w-2.5 h-2.5" />
                    Admin Terbuka
                  </span>
                ) : (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 border border-slate-300 inline-flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5 text-slate-600" />
                    Terkunci PIN
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isUnlocked && getDefaultGasApiUrl() && (
                  <button
                    type="button"
                    onClick={handleResetUrl}
                    className="text-[11px] text-slate-500 hover:text-slate-800 font-medium inline-flex items-center gap-1 cursor-pointer"
                    title="Kembalikan ke URL default sistem (.env)"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset ke default</span>
                  </button>
                )}

                {isUnlocked ? (
                  <button
                    type="button"
                    onClick={handleLockAgain}
                    className="btn-tactile text-[11px] px-2.5 py-1 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium inline-flex items-center gap-1 cursor-pointer"
                    title="Kunci kembali URL agar aman dari perubahan"
                  >
                    <Lock className="w-3 h-3" />
                    <span>Kunci URL</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setShowPinModal(true);
                      setPinError("");
                      setPinInput("");
                    }}
                    className="btn-tactile text-[11px] px-2.5 py-1 rounded-md bg-[#0071e3] hover:bg-[#0077ed] text-white font-medium inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                    title="Masukkan PIN Admin untuk mengubah URL"
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>Buka Kunci PIN</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                {isUnlocked ? (
                  <Link2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                )}
                <input
                  type={isUnlocked ? "text" : "password"}
                  disabled={!isUnlocked}
                  readOnly={!isUnlocked}
                  placeholder={isUnlocked ? "https://script.google.com/macros/s/.../exec" : "••••••••••••••••••••••••••••••••••••••••••••"}
                  value={isUnlocked ? url : "••••••••••••••••••••••••••••••••••••••••••••"}
                  onChange={(e) => {
                    if (isUnlocked) setUrl(e.target.value);
                  }}
                  className={`w-full pl-8 pr-2.5 py-1.5 text-xs font-mono rounded-lg border transition-all ${
                    isUnlocked
                      ? "border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-300 focus:border-slate-400"
                      : "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed select-none"
                  }`}
                  title={isUnlocked ? "URL Google Apps Script" : "URL dikunci dengan PIN Admin"}
                />
              </div>
              <button
                type="button"
                onClick={handleManualTest}
                disabled={isTesting || !url}
                className="btn-tactile px-3 py-1.5 rounded-lg bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-medium inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-blue-100" />}
                <span>Uji Koneksi</span>
              </button>
            </div>
            {!isUnlocked ? (
              <p className="text-[10.5px] text-amber-700 bg-amber-50/80 border border-amber-200/60 rounded-lg p-2 leading-relaxed flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>URL Web App dikunci dengan PIN Admin untuk melindungi endpoint database dari salah ketik atau pengubahan yang tidak disengaja.</span>
              </p>
            ) : (
              <p className="text-[10.5px] text-slate-400 leading-relaxed">
                Pastikan deployment Web App di Google Apps Script memiliki akses &ldquo;Anyone&rdquo;. Klik &quot;Kunci URL&quot; setelah selesai mengubah.
              </p>
            )}
          </div>

          {/* Status Alert */}
          {statusMessage.text && (
            <div
              className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-2 text-xs text-slate-800"
            >
              {statusMessage.type === "success" && <CheckCircle2 className="w-3.5 h-3.5 text-slate-800 shrink-0 mt-0.5" />}
              {statusMessage.type === "error" && <AlertCircle className="w-3.5 h-3.5 text-slate-800 shrink-0 mt-0.5" />}
              {statusMessage.type === "info" && <RefreshCw className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5 animate-spin" />}
              <div className="flex-1 leading-relaxed text-[11px]">{statusMessage.text}</div>
            </div>
          )}

          {/* Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {/* Action 1: Save Perdin */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center">
                    <Save className="w-3.5 h-3.5" />
                  </span>
                  <h4 className="text-xs font-semibold text-slate-900">Simpan Transaksi Perdin</h4>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Kirim kegiatan saat ini ({rows.length} peserta, total Rp{" "}
                  {rows.reduce((s, r) => s + (r.totalJumlah || 0), 0).toLocaleString("id-ID")}) ke database spreadsheet.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSaveToSheet}
                disabled={isSaving || !url}
                className="btn-tactile w-full py-2 px-3 rounded-lg bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-medium inline-flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Simpan ke Google Sheets</span>
              </button>
            </div>

            {/* Action 2: Pull Master + Rekap Data */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center">
                    <CloudDownload className="w-3.5 h-3.5" />
                  </span>
                  <h4 className="text-xs font-semibold text-slate-900">Tarik Seluruh Data Cloud</h4>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Perbarui master Pegawai, tarif SBM PMK 2026, Register Memo, serta data Rekap 48 Kolom dari Google Sheets.
                </p>
              </div>
              <button
                type="button"
                onClick={handleFetchAllData}
                disabled={isSyncing || !url}
                className="btn-tactile w-full py-2 px-3 rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-300/80 text-xs font-medium inline-flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                {isSyncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>Tarik Data Master & Rekap</span>
              </button>
            </div>
          </div>

          {/* Quick Info & Guide */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-600 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-[10.5px] leading-relaxed">
              <span className="font-semibold text-slate-700">Keamanan Transaksi & Sinkronisasi:</span>
              <p className="text-slate-500">
                Penyimpanan ke Google Sheets menggunakan penguncian transaksi (LockService) untuk mencegah tumpang tindih data. Data master juga dicadangkan otomatis ke penyimpanan lokal browser.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">
            {isConnected ? "Status: Online (Google Sheets)" : "Status: Siap Terhubung"}
          </span>
          <div className="flex gap-2">
            {isUnlocked && (
              <button
                type="button"
                onClick={handleSaveUrl}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300/80 text-xs font-medium transition-colors cursor-pointer"
              >
                Simpan Pengaturan
              </button>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="btn-tactile px-3.5 py-1.5 rounded-lg bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-medium transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

      {/* PIN Verification Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xs w-full p-5 space-y-4">
            <div className="text-center space-y-1.5">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center mx-auto border border-slate-200">
                <Lock className="w-5 h-5 text-slate-800" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Masukkan PIN Admin</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Pengubahan URL Web App Google Apps Script dikunci demi keamanan database.
              </p>
            </div>

            <form onSubmit={handleVerifyPin} className="space-y-3">
              <div>
                <input
                  type="password"
                  autoFocus
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError("");
                  }}
                  placeholder="******"
                  className="w-full text-center tracking-[0.4em] font-mono text-xl py-2 px-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 focus:border-[#0071e3] bg-slate-50 focus:bg-white transition-all text-slate-900"
                />
                {pinError && (
                  <p className="text-[11px] text-rose-600 font-medium text-center mt-1.5 flex items-center justify-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{pinError}</span>
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowPinModal(false);
                    setPinInput("");
                    setPinError("");
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold cursor-pointer shadow-2xs transition-all"
                >
                  Buka Kunci
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

