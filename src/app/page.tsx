"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Navbar, ActiveTab } from "@/components/Navbar";
import { HeaderForm } from "@/components/HeaderForm";
import { ChecklistFilter } from "@/components/ChecklistFilter";
import { ParticipantGrid } from "@/components/ParticipantGrid";
import { KwitansiDoc } from "@/components/documents/KwitansiDoc";
import { MemorandumDoc } from "@/components/documents/MemorandumDoc";
import { NominatifDoc } from "@/components/documents/NominatifDoc";
import { RincianBiayaDoc } from "@/components/documents/RincianBiayaDoc";
import { BiayaRiilDoc } from "@/components/documents/BiayaRiilDoc";
import { SppdDepanDoc } from "@/components/documents/SppdDepanDoc";
import { KuitansiPengadaanDoc } from "@/components/documents/KuitansiPengadaanDoc";
import { NominatifPengadaanDoc } from "@/components/documents/NominatifPengadaanDoc";
import { syncAllAutoFitSheets } from "@/components/documents/PrintAutoFitSheet";
import { PengadaanSpjForm } from "@/components/PengadaanSpjForm";
import { LandingHomeView } from "@/components/LandingHomeView";
import { RekapPerdinTab } from "@/components/RekapPerdinTab";
import { DaftarKegiatanTab } from "@/components/DaftarKegiatanTab";
import { MonitoringAnggaranTab } from "@/components/MonitoringAnggaranTab";
import { DaftarMemorandumTab } from "@/components/DaftarMemorandumTab";
import { ModalDatabaseSync } from "@/components/ModalDatabaseSync";
import { ModalSelesaiSpj } from "@/components/ModalSelesaiSpj";
import { ModalConfirmNewSpj } from "@/components/ModalConfirmNewSpj";
import {
  ModalCetakBundel,
  BundlePrintContainer,
  BundleDocId,
} from "@/components/ModalCetakBundel";
import { ClassicSidebar } from "@/components/ClassicSidebar";
import { ManualBookView } from "@/components/ManualBookView";
import { Footer } from "@/components/Footer";
import { ArrowLeft } from "lucide-react";
import {
  MasterSyncData,
  getCachedMasterData,
  fetchMasterDataFromSheet,
  fetchKegiatanFromSheet,
  savePerdinToGoogleSheet,
  reserveMemoInGoogleSheet,
  checkAndAutoMigrateCache,
} from "@/lib/googleSheetsService";
import { saveOrUpdateRekapLocal } from "@/lib/rekapHelper";
import { mergeAndSortMemoList } from "@/lib/memoHelper";
import {
  generateIdKegiatan,
  saveKegiatanRecord,
  getNextNoKegiatan,
  getSavedKegiatanList,
} from "@/lib/kegiatanHelper";
import {
  getLatestRegisteredSpdNumber,
  formatSpdNumber,
  parseSpdNumber,
  saveLatestRegisteredSpdNumber,
} from "@/lib/spdHelper";

import {
  HeaderData,
  ParticipantRow,
  ActiveCostKey,
  ActiveUhKey,
  Pegawai,
  SbmRate,
  NomorMemo,
  SavedKegiatan,
  SpjDocType,
} from "@/lib/types";
import { calculateRowTotal, findSbmByProvince, generateNextMemoNumber, getDefaultMemoNumber } from "@/lib/calc";
import {
  SPJ_TYPE_LIST,
  getSpjTypeMeta,
  getDefaultPengadaanItems,
  getDefaultPengadaanTax,
  calculatePengadaanTotals,
  formatPegawaiBankRekening,
} from "@/lib/pengadaanHelper";
import { saveCustomItemDetail } from "@/data/mak_akun";

import pegawaiRaw from "@/data/pegawai.json";
import sbmRaw from "@/data/sbm.json";
import memoRaw from "@/data/nomor_memo.json";

// Runtime tracker agar async Cloud sync tidak bentrok dengan closure React & tanpa memicu react-hooks/immutability
const cloudSyncRuntime = {
  lastSyncAt: 0,
  isEditingExisting: false,
};

export default function Home() {
  // Master data with runtime state (SSR-safe initial seed)
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>(pegawaiRaw as Pegawai[]);
  const [sbmList, setSbmList] = useState<SbmRate[]>(sbmRaw as SbmRate[]);
  const [memoList, setMemoList] = useState<NomorMemo[]>(memoRaw as NomorMemo[]);
  const [activeTab, setActiveTab] = useState<ActiveTab>("beranda");
  const [activeRekapType, setActiveRekapType] = useState<SpjDocType>("PERDIN");
  const [isDbModalOpen, setIsDbModalOpen] = useState<boolean>(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState<boolean>(false);
  const [isConfirmNewModalOpen, setIsConfirmNewModalOpen] = useState<boolean>(false);
  const [pendingNewSpjType, setPendingNewSpjType] = useState<SpjDocType | null>(null);
  const [isBundleModalOpen, setIsBundleModalOpen] = useState<boolean>(false);
  const [bundleDocsToPrint, setBundleDocsToPrint] = useState<BundleDocId[] | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [totalKegiatanCount, setTotalKegiatanCount] = useState<number>(0);

  // Safely hydrate saved kegiatan & memo counts on client mount and when updated
  useEffect(() => {
    const updateCount = () => {
      try {
        setTotalKegiatanCount(getSavedKegiatanList().length);
      } catch {
        // ignore
      }
    };
    const updateMemo = () => {
      try {
        setMemoList((prev) => mergeAndSortMemoList(prev));
      } catch {
        // ignore
      }
    };
    updateCount();
    window.addEventListener("storage", updateCount);
    window.addEventListener("kegiatan-list-updated", updateCount);
    window.addEventListener("memo-list-updated", updateMemo);
    return () => {
      window.removeEventListener("storage", updateCount);
      window.removeEventListener("kegiatan-list-updated", updateCount);
      window.removeEventListener("memo-list-updated", updateMemo);
    };
  }, []);


  // Active Cost Columns State (Default: Transportasi Darat PP only)
  const [activeCols, setActiveCols] = useState<Record<ActiveCostKey, boolean>>({
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

  // Active Uang Harian State (Default: UH Biasa 100% only)
  const [activeUh, setActiveUh] = useState<Record<ActiveUhKey, boolean>>({
    uhBiasa: true,
    uhBiasa60: false,
    uhBiasa40: false,
    uhHalfday: false,
    uhFullboard: false,
  });

  // Find default PPK (Arif Wibowo)
  const defaultPpk = pegawaiList.find((p) => (p?.nama || "").toLowerCase().includes("arif wibowo"));
  const todayStr = new Date().toISOString().split("T")[0];

  // Header Data State (Clean defaults with standardized ID Kegiatan)
  const [header, setHeader] = useState<HeaderData>({
    idKegiatan: generateIdKegiatan(todayStr, "001", "A"),
    kategoriSpj: "A",
    noKegiatanUrut: "001",
    keteranganKegiatan: "",
    keteranganMemo: "",
    provinsiTujuan: "JAWA BARAT",
    kotaTujuanList: [""],
    unitKerja: "Inspektorat",
    picInisiator: defaultPpk?.nama || "Arif Wibowo, S.H., M.H.",
    bendahara: "Raka Panji Wibowo, S.Kom, NIP. 19950408202012 1 001",
    petugasVerifikasi: "Noviarty Ningsi Sumirat, S.E, NIP. 19811112201001 2 001",
    nomorKomp: "",
    detailKomponen: "",
    nomorMak: "",
    itemDetail: "001",
    keteranganItemDetail: "",
    alatAngkut: "Angkutan Darat",
    tanggalSpd: todayStr,
    tanggalMemo: todayStr,
    nomorMemo: getDefaultMemoNumber(todayStr, "xxx"),
    nomorStMaster: "",
    ppkNama: defaultPpk?.nama || "Arif Wibowo, S.H., M.H.",
    ppkNip: defaultPpk?.nip || "19830124200801 1 006",
    ppkJabatan: defaultPpk?.jabatan || "Kepala Bagian Tata Usaha Inspektorat",
    penanggungJawabNama: "Reni Sutaryo, S.Si., M.Adm.Pemb",
    penanggungJawabNip: "19791126200604 2 014",
    penanggungJawabJabatan: "Inspektur",
    noSpby: "",
    jenisPengajuan: "RAMPUNG",
    noSpm: "",
    jenisPerdin: "Perdin Luar Kota",
    berangkatDari: "Jakarta",
  });

  // Save & Update State Tracking (Proses -> Rekap Perdin / Cloud)
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);
  const [savedBatchId, setSavedBatchId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isReservingMemo, setIsReservingMemo] = useState<boolean>(false);
  const [memoReserveFeedback, setMemoReserveFeedback] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);
  const [lastCloudSyncTime, setLastCloudSyncTime] = useState<string | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Track whether we are editing an existing activity and what its original ID, title, and memo were
  const [editingOriginalId, setEditingOriginalId] = useState<string | null>(null);
  const [editingOriginalTitle, setEditingOriginalTitle] = useState<string | null>(null);
  const [editingOriginalMemo, setEditingOriginalMemo] = useState<string | null>(null);

  // Participant Rows State (Clean initial empty row dengan nomor SPD berlanjut dari database)
  const [rows, setRows] = useState<ParticipantRow[]>(() => {
    const nextSpd = "01";
    const initSbm = findSbmByProvince(sbmRaw as SbmRate[], "JAWA BARAT");
    const initUhRate = initSbm?.uhBiasa || 430000;
    const initialRow: ParticipantRow = {
      id: "1",
      kodeNama: "",
      nama: "",
      nip: "",
      golongan: "",
      jabatan: "",
      tujuanKota: "",
      tujuanProvinsi: "JAWA BARAT",
      tanggalMulai: new Date().toISOString().split("T")[0],
      tanggalSelesai: new Date().toISOString().split("T")[0],
      lamaHari: 1,
      nomorSt: "",
      nomorSpd: nextSpd,
      hariUhBiasa: 1,
      biayaUhBiasa: initUhRate,
      hariUhBiasa60: 0,
      biayaUhBiasa60: 0,
      hariUhBiasa40: 0,
      biayaUhBiasa40: 0,
      hariUhHalfday: 0,
      biayaUhHalfday: 0,
      hariUhFullboard: 0,
      biayaUhFullboard: 0,
      tiket: 0,
      dukunganTransportasi: 0,
      transportasiDarat: 0,
      transportasiLokal: 0,
      transportJakartaPp: 0,
      transportDaerahPp: 0,
      hotel: 0,
      penginapan30: 0,
      fulldayMeeting: 0,
      fullboardMeeting: 0,
      representatif: 0,
      belanjaBahan: 0,
      pengRill: 0,
      riilItems: [],
      totalJumlah: initUhRate,
    };

    return [initialRow];
  });

  // Sinkronisasi data terbaru dari Cloud (dipakai saat buka halaman, klik dari Beranda, pindah tab, fokus jendela, dan setelah simpan)
  const syncCloudState = useCallback(
    async (opts?: { syncFreshDraftIds?: boolean; force?: boolean }) => {
      const now = Date.now();
      if (!opts?.force && now - cloudSyncRuntime.lastSyncAt < 4000) {
        return;
      }
      cloudSyncRuntime.lastSyncAt = now;

      try {
        const [masterRes, kegRes] = await Promise.all([
          fetchMasterDataFromSheet(),
          fetchKegiatanFromSheet(),
        ]);

        let latestMemoPool: NomorMemo[] = [];
        if (masterRes.success && masterRes.data) {
          if (masterRes.data.pegawai && masterRes.data.pegawai.length > 0) {
            setPegawaiList(masterRes.data.pegawai);
          }
          if (masterRes.data.sbm && masterRes.data.sbm.length > 0) {
            setSbmList(masterRes.data.sbm);
          }
          if (masterRes.data.memo && masterRes.data.memo.length > 0) {
            const merged = mergeAndSortMemoList(masterRes.data.memo);
            latestMemoPool = merged;
            setMemoList(merged);
          }
        }

        const latestKegiatanList = kegRes.success && kegRes.data ? kegRes.data : getSavedKegiatanList();
        if (kegRes.success && kegRes.data) {
          setTotalKegiatanCount(kegRes.data.length);
        }

        // Jika user sedang membuka draft baru yang belum disimpan & belum mengunci memo di Cloud, perbarui ID/Memo/SPD dari data Cloud terbaru
        if (opts?.syncFreshDraftIds && !cloudSyncRuntime.isEditingExisting) {
          setHeader((prev) => {
            if (prev.reservedMemo && prev.reservedMemo === prev.nomorMemo) {
              return prev;
            }
            const isBlankTitle = !prev.keteranganKegiatan || prev.keteranganKegiatan.trim() === "";
            const tgl = prev.tanggalSpd || new Date().toISOString().split("T")[0];
            const kat = prev.kategoriSpj || "A";
            const idExistsInCloud = latestKegiatanList.some(
              (k) => k.idKegiatan && prev.idKegiatan && k.idKegiatan.toLowerCase() === prev.idKegiatan.toLowerCase()
            );

            let nextId = prev.idKegiatan;
            let nextNo = prev.noKegiatanUrut;
            if (isBlankTitle || idExistsInCloud) {
              nextNo = getNextNoKegiatan(tgl, kat);
              nextId = generateIdKegiatan(tgl, nextNo, kat);
            }

            let nextMemo = prev.nomorMemo;
            const pool = latestMemoPool.length > 0 ? latestMemoPool : mergeAndSortMemoList([]);
            const memoStr = (prev.nomorMemo || "").trim();
            const memoUrutMatch = memoStr.match(/\bM\.?\s*(\d+)/i);
            const memoUrut = memoUrutMatch ? memoUrutMatch[1] : "";
            const memoCollides =
              Boolean(memoUrut) &&
              pool.some(
                (m) =>
                  String(m.nomor_urut || m.nomor || "").trim() === memoUrut &&
                  (String(m.status || "").toUpperCase() === "TERPAKAI" || Boolean(m.id_kegiatan_ref))
              );

            if (isBlankTitle || !memoStr || memoStr.toLowerCase().includes("xxx") || memoCollides) {
              nextMemo = generateNextMemoNumber(pool, undefined, prev.tanggalMemo || tgl).nextMemoNumber;
            }

            if (nextId === prev.idKegiatan && nextNo === prev.noKegiatanUrut && nextMemo === prev.nomorMemo) {
              return prev;
            }

            return {
              ...prev,
              noKegiatanUrut: nextNo,
              idKegiatan: nextId,
              nomorMemo: nextMemo,
            };
          });

          const latestSpd = getLatestRegisteredSpdNumber();
          if (latestSpd > 0) {
            setRows((prevRows) => {
              if (
                prevRows.length === 1 &&
                (!prevRows[0].nama || prevRows[0].nama.trim() === "") &&
                (!prevRows[0].namaExternal || prevRows[0].namaExternal.trim() === "")
              ) {
                const parsed = parseSpdNumber(prevRows[0].nomorSpd);
                if (parsed.num <= latestSpd) {
                  return [{ ...prevRows[0], nomorSpd: formatSpdNumber(latestSpd + 1) }];
                }
              }
              return prevRows;
            });
          }
        }
      } catch {
        // Ignore transient offline errors
      }
    },
    []
  );

  // Hydrate initial master & cloud data on mount, plus auto-refresh when tab regains focus
  useEffect(() => {
    let active = true;
    checkAndAutoMigrateCache();

    Promise.resolve().then(() => {
      if (!active) return;
      const cached = getCachedMasterData();
      if (cached) {
        if (cached.pegawai && cached.pegawai.length > 0) setPegawaiList(cached.pegawai);
        if (cached.sbm && cached.sbm.length > 0) setSbmList(cached.sbm);
        if (cached.memo && cached.memo.length > 0) setMemoList(mergeAndSortMemoList(cached.memo));
      }
      void syncCloudState({ syncFreshDraftIds: true, force: true });
    });

    const handleVisibilityOrFocus = () => {
      if (typeof document === "undefined" || document.visibilityState === "visible") {
        void syncCloudState({
          syncFreshDraftIds: !cloudSyncRuntime.isEditingExisting,
        });
      }
    };

    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);

    return () => {
      active = false;
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
    };
  }, [syncCloudState]);

  // Sync initial row nomorSpd with database continuation on client mount and whenever cloud data arrives
  useEffect(() => {
    const handleSpdSync = () => {
      const latest = getLatestRegisteredSpdNumber();
      if (latest > 0) {
        setRows((prev) => {
          // Hanya sesuaikan otomatis jika sedang di mode draft baru (belum diisi nama dan belum disimpan)
          if (
            !editingOriginalId &&
            !savedBatchId &&
            prev.length === 1 &&
            (!prev[0].nama || prev[0].nama.trim() === "") &&
            (!prev[0].namaExternal || prev[0].namaExternal.trim() === "")
          ) {
            const currentParsed = parseSpdNumber(prev[0].nomorSpd);
            if (currentParsed.num <= 1 || currentParsed.num <= latest) {
              return [{ ...prev[0], nomorSpd: formatSpdNumber(latest + 1) }];
            }
          }
          return prev;
        });
      }
    };

    handleSpdSync();
    window.addEventListener("spd-latest-updated", handleSpdSync);
    window.addEventListener("kegiatan-list-updated", handleSpdSync);
    window.addEventListener("storage", handleSpdSync);
    return () => {
      window.removeEventListener("spd-latest-updated", handleSpdSync);
      window.removeEventListener("kegiatan-list-updated", handleSpdSync);
      window.removeEventListener("storage", handleSpdSync);
    };
  }, [editingOriginalId, savedBatchId]);

  // Handlers for state updates with synchronized row recalculation
  const handleSetActiveCols: React.Dispatch<React.SetStateAction<Record<ActiveCostKey, boolean>>> = (action) => {
    setActiveCols((prevCols) => {
      const nextCols = typeof action === "function" ? action(prevCols) : action;
      const isMultiProv = Boolean(header.isMultiProvinsi && header.provinsiTujuan2);
      const sbm = isMultiProv ? undefined : findSbmByProvince(sbmList, header.provinsiTujuan);
      const sbmJakarta = findSbmByProvince(sbmList, header.berangkatDari || "DKI JAKARTA");
      const isActivatingTransportJkt = !prevCols.transportJakartaPp && nextCols.transportJakartaPp;
      const isActivatingTransportDaerah = !prevCols.transportDaerahPp && nextCols.transportDaerahPp;
      const forceRecalcTransport = !isMultiProv && (isActivatingTransportJkt || isActivatingTransportDaerah);

      setRows((prevRows) =>
        prevRows.map((r) =>
          calculateRowTotal(r, sbm, activeUh, nextCols, {
            sbmJakarta,
            forceRecalcTransport,
            isMultiProvinsi: isMultiProv,
          })
        )
      );
      return nextCols;
    });
  };

  const handleSetActiveUh: React.Dispatch<React.SetStateAction<Record<ActiveUhKey, boolean>>> = (action) => {
    setActiveUh((prevUh) => {
      const nextUh = typeof action === "function" ? action(prevUh) : action;
      const isMultiProv = Boolean(header.isMultiProvinsi && header.provinsiTujuan2);
      const sbm = isMultiProv ? undefined : findSbmByProvince(sbmList, header.provinsiTujuan);
      const sbmJakarta = findSbmByProvince(sbmList, header.berangkatDari || "DKI JAKARTA");

      setRows((prevRows) =>
        prevRows.map((r) => {
          const updatedRow = { ...r };

          // If a UH option is newly turned on, initialize its days to 1 (or lamaHari)
          // Catatan: Jika 2 provinsi dalam 1 ST, tidak menghitung otomatis dari SBM
          if (!prevUh.uhBiasa && nextUh.uhBiasa) {
            const hari = updatedRow.hariUhBiasa && updatedRow.hariUhBiasa > 0
              ? updatedRow.hariUhBiasa
              : Math.max(1, updatedRow.lamaHari || 1);
            updatedRow.hariUhBiasa = hari;
            if (!isMultiProv) {
              updatedRow.biayaUhBiasa = hari * (sbm?.uhBiasa || 0);
            }
          }
          if (!prevUh.uhBiasa60 && nextUh.uhBiasa60) {
            const hari = updatedRow.hariUhBiasa60 && updatedRow.hariUhBiasa60 > 0
              ? updatedRow.hariUhBiasa60
              : Math.max(1, updatedRow.lamaHari || 1);
            updatedRow.hariUhBiasa60 = hari;
            if (!isMultiProv) {
              updatedRow.biayaUhBiasa60 = Math.round(hari * (sbm?.uhBiasa || 0) * 0.6);
            }
          }
          if (!prevUh.uhBiasa40 && nextUh.uhBiasa40) {
            const hari = updatedRow.hariUhBiasa40 && updatedRow.hariUhBiasa40 > 0
              ? updatedRow.hariUhBiasa40
              : Math.max(1, updatedRow.lamaHari || 1);
            updatedRow.hariUhBiasa40 = hari;
            if (!isMultiProv) {
              updatedRow.biayaUhBiasa40 = Math.round(hari * (sbm?.uhBiasa || 0) * 0.4);
            }
          }
          if (!prevUh.uhHalfday && nextUh.uhHalfday) {
            const hari = updatedRow.hariUhHalfday && updatedRow.hariUhHalfday > 0
              ? updatedRow.hariUhHalfday
              : Math.max(1, updatedRow.lamaHari || 1);
            updatedRow.hariUhHalfday = hari;
            if (!isMultiProv) {
              updatedRow.biayaUhHalfday = hari * (sbm?.uhHalfday || 0);
            }
          }
          if (!prevUh.uhFullboard && nextUh.uhFullboard) {
            const hari = updatedRow.hariUhFullboard && updatedRow.hariUhFullboard > 0
              ? updatedRow.hariUhFullboard
              : Math.max(1, updatedRow.lamaHari || 1);
            updatedRow.hariUhFullboard = hari;
            if (!isMultiProv) {
              updatedRow.biayaUhFullboard = hari * (sbm?.uhFullboard || 0);
            }
          }

          return calculateRowTotal(updatedRow, sbm, nextUh, activeCols, {
            sbmJakarta,
            isMultiProvinsi: isMultiProv,
          });
        })
      );
      return nextUh;
    });
  };

  const handleSetHeader: React.Dispatch<React.SetStateAction<HeaderData>> = (action) => {
    setHeader((prevHeader) => {
      const nextHeader = typeof action === "function" ? action(prevHeader) : action;
      const isMultiProv = Boolean(nextHeader.isMultiProvinsi && nextHeader.provinsiTujuan2);

      // Hanya jalankan auto-recalc SBM jika BUKAN mode 2 provinsi
      if (!isMultiProv) {
        if (
          nextHeader.provinsiTujuan !== prevHeader.provinsiTujuan ||
          nextHeader.berangkatDari !== prevHeader.berangkatDari
        ) {
          const sbm = findSbmByProvince(sbmList, nextHeader.provinsiTujuan);
          const sbmJakarta = findSbmByProvince(sbmList, nextHeader.berangkatDari || "DKI JAKARTA");
          setRows((prevRows) =>
            prevRows.map((r) =>
              calculateRowTotal(r, sbm, activeUh, activeCols, {
                forceRecalcUh: true,
                forceRecalcTransport: true,
                sbmJakarta,
                isMultiProvinsi: false,
              })
            )
          );
        }
      }
      return nextHeader;
    });
  };

  // Handle Apply ST Massal (Staf & Pejabat)
  const handleApplyStToAll = (stNumber: string) => {
    setRows((prev) =>
      prev.map((r) => {
        const isOfficial =
          r.isPejabat ??
          (r.jabatan?.toLowerCase().includes("inspektur") ||
            r.jabatan?.toLowerCase().includes("kepala") ||
            r.golongan?.startsWith("IV"));

        let assignedSt = header.nomorStStaff || header.nomorStMaster || stNumber;
        if (header.useDifferentStPejabat && header.nomorStPejabat && isOfficial) {
          assignedSt = header.nomorStPejabat;
        }

        return {
          ...r,
          nomorSt: assignedSt,
          isPejabat: isOfficial,
        };
      })
    );
  };

  // Reservasi / Assign Langsung Nomor Memorandum ke Database Cloud saat klik "Gunakan Nomor"
  const handleGenerateMemoNumber = async () => {
    if (isReservingMemo) return;
    setIsReservingMemo(true);
    setMemoReserveFeedback(null);

    try {
      const today = header.tanggalSpd || new Date().toISOString().split("T")[0];
      const spjTypeNow = header.spjType || "PERDIN";
      const spjMetaNow = getSpjTypeMeta(spjTypeNow);
      const isPengadaanNow = spjTypeNow !== "PERDIN";

      const targetId =
        header.idKegiatan ||
        generateIdKegiatan(today, header.noKegiatanUrut || "001", header.kategoriSpj || "A");

      const currentPool = mergeAndSortMemoList(memoList);
      let requestedMemo = (header.nomorMemo || "").trim();
      if (!requestedMemo || requestedMemo.toLowerCase().includes("xxx")) {
        requestedMemo = generateNextMemoNumber(currentPool, undefined, header.tanggalMemo || today).nextMemoNumber;
      }

      const itemsNow =
        isPengadaanNow
          ? header.pengadaanItems && header.pengadaanItems.length > 0
            ? header.pengadaanItems
            : getDefaultPengadaanItems(spjTypeNow)
          : [];
      const currentGrandTotal = isPengadaanNow
        ? calculatePengadaanTotals(itemsNow, header.pengadaanTax).subTotalBruto
        : rows.reduce((acc, r) => acc + (r.totalJumlah || 0), 0);

      const perihalText =
        (header.keteranganKegiatan && header.keteranganKegiatan.trim()) ||
        (header.keteranganMemo && header.keteranganMemo.trim()) ||
        spjMetaNow.defaultPerihalMemo ||
        "Permintaan Pembayaran Langsung (LS) Perjalanan Dinas";

      const res = await reserveMemoInGoogleSheet({
        nomorMemo: requestedMemo,
        idKegiatan: targetId,
        oldIdKegiatan: editingOriginalId || savedBatchId || "",
        oldNomorMemo: editingOriginalMemo || "",
        reservedMemo: header.reservedMemo || "",
        tanggalMemo: header.tanggalMemo || today,
        perihal: perihalText,
        nominal: currentGrandTotal,
        mak: header.nomorMak || spjMetaNow.defaultMak || "524111",
        isNewRecord: !(editingOriginalId || savedBatchId),
      });

      if (res.success) {
        if (res.memoList && res.memoList.length > 0) {
          setMemoList(mergeAndSortMemoList(res.memoList));
        } else {
          setMemoList((prev) => mergeAndSortMemoList(prev));
        }

        const assignedMemo = res.assignedNomorMemo;
        const assignedId = res.assignedIdKegiatan || targetId;
        const idNumMatch = assignedId.match(/^KEG-\d{4}-(\d+)-/);

        setHeader((prev) => ({
          ...prev,
          idKegiatan: assignedId,
          noKegiatanUrut: idNumMatch ? idNumMatch[1] : prev.noKegiatanUrut,
          nomorMemo: assignedMemo,
          reservedMemo: res.offlineFallback ? prev.reservedMemo : assignedMemo,
        }));

        setMemoReserveFeedback({
          type: res.wasReassigned ? "info" : "success",
          text: res.nextAvailableMemo
            ? `${res.message} Nomor berikutnya tersedia: ${res.nextAvailableMemo}.`
            : res.message,
        });
      } else {
        setMemoReserveFeedback({
          type: "error",
          text: res.message,
        });
      }
    } finally {
      setIsReservingMemo(false);
    }
  };

  // Handle Add New Pegawai to master list
  const handleAddPegawai = (newPeg: Pegawai) => {
    setPegawaiList((prev) => [...prev, newPeg]);
  };

  const handleMasterSyncSuccess = (data: MasterSyncData) => {
    if (data.pegawai && data.pegawai.length > 0) {
      setPegawaiList(data.pegawai);
    }
    if (data.sbm && data.sbm.length > 0) {
      setSbmList(data.sbm);
    }
    if (data.memo && data.memo.length > 0) {
      setMemoList(data.memo);
    }
  };

  // Sync initial ID Kegiatan with database continuation on client mount and when database updates
  useEffect(() => {
    const syncInitialId = () => {
      setHeader((prev) => {
        if (!editingOriginalId && !savedBatchId && (!prev.keteranganKegiatan || prev.keteranganKegiatan.trim() === "")) {
          const tgl = prev.tanggalSpd || new Date().toISOString().split("T")[0];
          const kat = prev.kategoriSpj || "A";
          const nextNo = getNextNoKegiatan(tgl, kat);
          const nextId = generateIdKegiatan(tgl, nextNo, kat);
          return {
            ...prev,
            noKegiatanUrut: nextNo,
            idKegiatan: nextId,
          };
        }
        return prev;
      });
    };

    syncInitialId();
    window.addEventListener("kegiatan-list-updated", syncInitialId);
    return () => {
      window.removeEventListener("kegiatan-list-updated", syncInitialId);
    };
  }, [editingOriginalId, savedBatchId]);

  // Derive whether data is currently saved and whether any edits occurred since saving
  const currentSnapshot = JSON.stringify({ header, rows });
  const isSaved = Boolean(savedSnapshot);
  const hasChanges = isSaved && currentSnapshot !== savedSnapshot;

  // Helper navigasi tab sekaligus refresh ringan data Cloud saat membuka Beranda / Daftar Kegiatan / Daftar Memo
  const handleNavigateTab = useCallback(
    (tab: ActiveTab) => {
      setActiveTab(tab);
      if (tab === "beranda" || tab === "kegiatan" || tab === "daftar-memo") {
        void syncCloudState({ syncFreshDraftIds: tab === "beranda" });
      }
    },
    [syncCloudState]
  );

  // Edit kegiatan from Daftar Kegiatan
  const handleEditKegiatan = (kegiatan: SavedKegiatan) => {
    const normalizedHeader: HeaderData = {
      ...kegiatan.header,
      spjType: kegiatan.header.spjType || "PERDIN",
      reservedMemo: kegiatan.header.nomorMemo || kegiatan.header.reservedMemo,
    };
    cloudSyncRuntime.isEditingExisting = true;
    setMemoReserveFeedback(null);
    setHeader(normalizedHeader);
    setRows(kegiatan.rows);
    if (kegiatan.activeCols) setActiveCols(kegiatan.activeCols);
    if (kegiatan.activeUh) setActiveUh(kegiatan.activeUh);
    setEditingOriginalId(kegiatan.idKegiatan);
    setEditingOriginalTitle(kegiatan.namaKegiatan || kegiatan.header?.keteranganKegiatan || null);
    setEditingOriginalMemo(kegiatan.header?.nomorMemo || null);
    setSavedBatchId(kegiatan.idKegiatan);
    setSavedSnapshot(JSON.stringify({ header: normalizedHeader, rows: kegiatan.rows }));
    setIsCloudSynced(true);
    setLastCloudSyncTime(null);
    setActiveTab("input");
  };

  // Switch between Perjalanan Dinas (PERDIN) and the 4 Pengadaan SPJ types (KONSUMSI, ATK, SEWA, DIKLAT)
  const handleSwitchSpjType = (nextType: SpjDocType) => {
    const meta = getSpjTypeMeta(nextType);
    const allDefaultUraians = SPJ_TYPE_LIST.map((t) => t.defaultUraianKegiatan).filter(Boolean);
    const sharedPool = mergeAndSortMemoList(memoList);

    setHeader((prev) => {
      const currentType = prev.spjType || "PERDIN";
      const needsAutoMemo = !prev.nomorMemo || prev.nomorMemo.toLowerCase().includes("xxx");
      const assignedMemo = needsAutoMemo
        ? generateNextMemoNumber(sharedPool, undefined, prev.tanggalMemo || prev.tanggalSpd).nextMemoNumber
        : prev.nomorMemo;

      if (currentType === nextType) {
        return needsAutoMemo ? { ...prev, nomorMemo: assignedMemo } : prev;
      }

      const isCurrentUraianDefault =
        !prev.keteranganKegiatan ||
        prev.keteranganKegiatan.trim() === "" ||
        allDefaultUraians.includes(prev.keteranganKegiatan.trim());

      if (nextType === "PERDIN") {
        return {
          ...prev,
          spjType: "PERDIN",
          nomorMemo: assignedMemo,
          nomorMak: prev.nomorMak || "524111",
          keteranganMemo: "Permintaan Pembayaran Langsung (LS) Perjalanan Dinas",
          keteranganKegiatan: isCurrentUraianDefault ? "" : prev.keteranganKegiatan,
        };
      }

      const defaultPenerima = prev.penanggungJawabNama || "Reni Sutaryo, S.Si., M.Adm.Pemb";
      const foundPegawai = pegawaiList.find(
        (p) => p.nama.toLowerCase() === defaultPenerima.toLowerCase()
      );
      const defaultRek = formatPegawaiBankRekening(foundPegawai);

      return {
        ...prev,
        spjType: nextType,
        nomorMemo: assignedMemo,
        nomorKomp: "",
        detailKomponen: "",
        nomorMak: meta.defaultMak,
        itemDetail: "",
        keteranganItemDetail: "",
        keteranganMemo: meta.defaultPerihalMemo,
        keteranganKegiatan: isCurrentUraianDefault
          ? ""
          : prev.keteranganKegiatan,
        pengadaanItems: getDefaultPengadaanItems(nextType),
        pengadaanTax: getDefaultPengadaanTax(
          nextType,
          defaultPenerima,
          prev.penanggungJawabNip || foundPegawai?.nip || "19791126200604 2 014",
          defaultRek
        ),
      };
    });

    if (nextType !== "PERDIN" && (activeTab === "rincian" || activeTab === "riil" || activeTab === "spd")) {
      setActiveTab("input");
    }
  };

  // Start fresh kegiatan with clean state and next sequential ID (Sharing MASTER_MEMO pool & immediate Cloud refresh)
  const handleCreateNewKegiatan = (overrideType?: SpjDocType) => {
    cloudSyncRuntime.isEditingExisting = false;
    setEditingOriginalId(null);
    setEditingOriginalTitle(null);
    setEditingOriginalMemo(null);
    setPendingNewSpjType(null);
    setSaveFeedback(null);
    setMemoReserveFeedback(null);
    const today = new Date().toISOString().split("T")[0];
    const nextNo = getNextNoKegiatan(today, "A");
    const newId = generateIdKegiatan(today, nextNo, "A");
    const nextSpd = formatSpdNumber(getLatestRegisteredSpdNumber() + 1);
    const sbm = findSbmByProvince(sbmList, "JAWA BARAT");
    const uhRateBiasa = sbm?.uhBiasa || 430000;
    const uhRateHalfday = sbm?.uhHalfday || 95000;
    const uhRateFullboard = sbm?.uhFullboard || 130000;

    const initialRow: ParticipantRow = {
      id: "1",
      kodeNama: "",
      nama: "",
      nip: "",
      golongan: "",
      jabatan: "",
      tujuanKota: "",
      tujuanProvinsi: "JAWA BARAT",
      tanggalMulai: today,
      tanggalSelesai: today,
      lamaHari: 1,
      nomorSt: "",
      nomorSpd: nextSpd,
      hariUhBiasa: activeUh.uhBiasa ? 1 : 0,
      biayaUhBiasa: activeUh.uhBiasa ? uhRateBiasa : 0,
      hariUhBiasa60: activeUh.uhBiasa60 ? 1 : 0,
      biayaUhBiasa60: activeUh.uhBiasa60 ? Math.round(uhRateBiasa * 0.6) : 0,
      hariUhBiasa40: activeUh.uhBiasa40 ? 1 : 0,
      biayaUhBiasa40: activeUh.uhBiasa40 ? Math.round(uhRateBiasa * 0.4) : 0,
      hariUhHalfday: activeUh.uhHalfday ? 1 : 0,
      biayaUhHalfday: activeUh.uhHalfday ? uhRateHalfday : 0,
      hariUhFullboard: activeUh.uhFullboard ? 1 : 0,
      biayaUhFullboard: activeUh.uhFullboard ? uhRateFullboard : 0,
      tiket: 0,
      dukunganTransportasi: 0,
      transportasiDarat: 0,
      transportasiLokal: 0,
      transportJakartaPp: 0,
      transportDaerahPp: 0,
      hotel: 0,
      penginapan30: 0,
      fulldayMeeting: 0,
      fullboardMeeting: 0,
      representatif: 0,
      belanjaBahan: 0,
      pengRill: 0,
      riilItems: [],
      totalJumlah: 0,
    };

    const sbmJakarta = findSbmByProvince(sbmList, header.berangkatDari || "DKI JAKARTA");
    const calculatedInitialRow = calculateRowTotal(initialRow, sbm, activeUh, activeCols, { sbmJakarta });

    const sharedPool = mergeAndSortMemoList(memoList);
    const genMemo = generateNextMemoNumber(sharedPool, undefined, today);
    const currentType = overrideType || header.spjType || "PERDIN";
    const meta = getSpjTypeMeta(currentType);
    const defaultPenerima = header.penanggungJawabNama || "Reni Sutaryo, S.Si., M.Adm.Pemb";
    const foundPegawai = pegawaiList.find(
      (p) => p.nama.toLowerCase() === defaultPenerima.toLowerCase()
    );
    const defaultRek = formatPegawaiBankRekening(foundPegawai);

    setHeader((prev) => ({
      ...prev,
      spjType: currentType,
      idKegiatan: newId,
      kategoriSpj: "A",
      noKegiatanUrut: nextNo,
      keteranganKegiatan: "",
      keteranganMemo: meta.defaultPerihalMemo,
      nomorMemo: genMemo.nextMemoNumber,
      nomorStMaster: "",
      nomorStStaff: "",
      nomorStPejabat: "",
      useDifferentStPejabat: false,
      nomorKomp: currentType === "PERDIN" ? "CL.7458.ABR.006.075.EE" : "",
      detailKomponen:
        currentType === "PERDIN"
          ? "Kunjungan Lapangan terkait Koordinasi Implementasi NEK Pengendalian Emisi GRK"
          : "",
      nomorMak: meta.defaultMak,
      itemDetail: currentType === "PERDIN" ? "001" : "",
      keteranganItemDetail: "",
      noSpby: "",
      noSpm: "",
      jenisPengajuan: "RAMPUNG",
      tanggalSpd: today,
      tanggalMemo: today,
      reservedMemo: undefined,
      pengadaanItems: currentType === "PERDIN" ? undefined : getDefaultPengadaanItems(currentType),
      pengadaanTax:
        currentType === "PERDIN"
          ? undefined
          : getDefaultPengadaanTax(
              currentType,
              defaultPenerima,
              prev.penanggungJawabNip || foundPegawai?.nip || "19791126200604 2 014",
              defaultRek
            ),
    }));
    setRows([calculatedInitialRow]);
    setSavedBatchId(null);
    setSavedSnapshot(null);
    setIsCloudSynced(false);
    setLastCloudSyncTime(null);
    setActiveTab("input");
    // Segera tarik ID, Memo & SPD terbaru dari Cloud agar tidak bentrok dengan user lain
    void syncCloudState({ syncFreshDraftIds: true, force: true });
  };

  // Safe Request to Create New Kegiatan (Checks for unsaved changes without clobbering active SPJ type if cancelled)
  const handleRequestCreateNew = (overrideType?: SpjDocType) => {
    const isPengadaan = Boolean(header.spjType && header.spjType !== "PERDIN");
    const hasValidData = isPengadaan
      ? Boolean(header.keteranganKegiatan && header.keteranganKegiatan.trim() !== "")
      : rows.some((r) =>
          Boolean((r.nama && r.nama.trim() !== "") || (r.namaExternal && r.namaExternal.trim() !== ""))
        );
    if (hasChanges || (!isSaved && hasValidData)) {
      setPendingNewSpjType(overrideType || null);
      setIsConfirmNewModalOpen(true);
    } else {
      handleCreateNewKegiatan(overrideType);
    }
  };

  const handlePrintAllFromModal = () => {
    setIsCompletionModalOpen(false);
    setIsBundleModalOpen(true);
  };

  const handleStartBundlePrint = (selectedDocs: BundleDocId[]) => {
    if (!selectedDocs || selectedDocs.length === 0) return;
    setIsBundleModalOpen(false);
    setBundleDocsToPrint(selectedDocs);

    if (typeof window !== "undefined") {
      const cleanup = () => {
        setBundleDocsToPrint(null);
        window.removeEventListener("afterprint", cleanup);
      };
      window.addEventListener("afterprint", cleanup);

      // Beri waktu 180ms bagi DOM bundel & auto-fit CSS untuk ter-render penuh
      setTimeout(() => {
        syncAllAutoFitSheets();
        window.print();
      }, 180);
    }
  };

  const handleSaveOrUpdateData = async () => {
    const currentSpjType = header.spjType || "PERDIN";
    const isPengadaan = currentSpjType !== "PERDIN";
    const spjMeta = getSpjTypeMeta(currentSpjType);

    if (isPengadaan) {
      const items =
        header.pengadaanItems && header.pengadaanItems.length > 0
          ? header.pengadaanItems
          : getDefaultPengadaanItems(currentSpjType);
      const tax =
        header.pengadaanTax ||
        getDefaultPengadaanTax(
          currentSpjType,
          header.penanggungJawabNama || "Reni Sutaryo, S.Si., M.Adm.Pemb",
          header.penanggungJawabNip || "19791126200604 2 014"
        );
      const calc = calculatePengadaanTotals(items, tax);

      if (items.length === 0 || calc.subTotalBruto <= 0) {
        setSaveFeedback({
          type: "error",
          text: `Gagal menyimpan: Silakan isi minimal 1 item rincian ${spjMeta.shortLabel} dengan nominal di atas Rp 0.`,
        });
        return;
      }

      setIsSaving(true);
      try {
        const today = header.tanggalSpd || new Date().toISOString().split("T")[0];
        const idKegiatan =
          header.idKegiatan ||
          savedBatchId ||
          generateIdKegiatan(today, header.noKegiatanUrut || "001", header.kategoriSpj || "A");

        const sharedPool = mergeAndSortMemoList(memoList);
        let nomorMemoToSave = header.nomorMemo || "";
        if (!nomorMemoToSave || nomorMemoToSave.includes("xxx") || nomorMemoToSave.includes("...")) {
          const gen = generateNextMemoNumber(sharedPool, undefined, header.tanggalMemo || today);
          nomorMemoToSave = gen.nextMemoNumber;
        }

        const updatedHeader: HeaderData = {
          ...header,
          spjType: currentSpjType,
          idKegiatan,
          nomorMemo: nomorMemoToSave,
          keteranganKegiatan: header.keteranganKegiatan || spjMeta.defaultUraianKegiatan,
          keteranganMemo: header.keteranganMemo || spjMeta.defaultPerihalMemo,
          pengadaanItems: items,
          pengadaanTax: tax,
        };
        setHeader(updatedHeader);

        // Create a representative ParticipantRow so Daftar Kegiatan & Cloud Sync store the total & recipient
        const syntheticRow: ParticipantRow = {
          id: "1",
          kodeNama: spjMeta.shortLabel,
          nama: tax.penerimaNama || header.penanggungJawabNama || "Penanggung Jawab Kegiatan",
          nip: tax.penerimaNip || header.penanggungJawabNip || "",
          golongan: "",
          jabatan: tax.penerimaJabatan?.replace(/,\s*$/, "") || "Penanggung Jawab Kegiatan",
          tujuanKota: spjMeta.shortLabel,
          tujuanProvinsi: "DKI JAKARTA",
          tanggalMulai: today,
          tanggalSelesai: today,
          lamaHari: 1,
          nomorSt: "-",
          nomorSpd: "-",
          hariUhBiasa: 0,
          biayaUhBiasa: 0,
          hariUhBiasa60: 0,
          biayaUhBiasa60: 0,
          hariUhBiasa40: 0,
          biayaUhBiasa40: 0,
          hariUhHalfday: 0,
          biayaUhHalfday: 0,
          hariUhFullboard: 0,
          biayaUhFullboard: 0,
          tiket: 0,
          dukunganTransportasi: 0,
          transportasiDarat: 0,
          transportasiLokal: 0,
          transportJakartaPp: 0,
          transportDaerahPp: 0,
          hotel: 0,
          penginapan30: 0,
          fulldayMeeting: 0,
          fullboardMeeting: 0,
          representatif: 0,
          belanjaBahan: calc.subTotalBruto,
          pengRill: 0,
          riilItems: [],
          totalJumlah: calc.subTotalBruto,
        };

        const oldBatchId = editingOriginalId || savedBatchId || undefined;
        const oldNama = editingOriginalTitle || undefined;
        const oldMemo = editingOriginalMemo || undefined;
        const isUpdate = Boolean(oldBatchId);

        const sheetNameBySpj: Record<string, string> = {
          KONSUMSI: "REKAP_SPJ_KONSUMSI",
          SEWA: "REKAP_SPJ_SEWA_KENDARAAN",
          DIKLAT: "REKAP_SPJ_NARSUM",
          ATK: "REKAP_SPJ_ATK_SEMKIT",
        };
        const targetRekapSheetName = sheetNameBySpj[currentSpjType] || "REKAP_SPJ";

        saveKegiatanRecord(
          {
            idKegiatan,
            kategori: "A",
            namaKegiatan: updatedHeader.keteranganKegiatan || spjMeta.label,
            tanggalSpd: today,
            kotaTujuan: spjMeta.shortLabel,
            provinsiTujuan: "DKI JAKARTA",
            jumlahPeserta: items.length,
            grandTotal: calc.subTotalBruto,
            header: updatedHeader,
            rows: [syntheticRow],
            activeCols,
            activeUh,
            updatedAt: new Date().toISOString(),
          },
          oldBatchId,
          oldNama,
          oldMemo
        );
        setTotalKegiatanCount(getSavedKegiatanList().length);

        setEditingOriginalId(idKegiatan);
        setEditingOriginalTitle(updatedHeader.keteranganKegiatan || null);
        setEditingOriginalMemo(updatedHeader.nomorMemo || null);
        setSavedBatchId(idKegiatan);
        setSavedSnapshot(JSON.stringify({ header: updatedHeader, rows }));

        const isNewRecord = !oldBatchId;
        const sheetRes = await savePerdinToGoogleSheet(
          updatedHeader,
          [syntheticRow],
          undefined,
          oldBatchId,
          {
            activeCols,
            activeUh,
            oldNamaKegiatan: oldNama,
            oldNomorMemo: oldMemo,
            isNewRecord,
          }
        );

        const finalServerId = sheetRes.idKegiatan || idKegiatan;
        const finalServerMemo = sheetRes.assignedNomorMemo || updatedHeader.nomorMemo;
        const idNumMatch = finalServerId.match(/^KEG-\d{4}-(\d+)-/);
        const finalHeader: HeaderData = {
          ...updatedHeader,
          idKegiatan: finalServerId,
          noKegiatanUrut: idNumMatch ? idNumMatch[1] : updatedHeader.noKegiatanUrut,
          nomorMemo: finalServerMemo,
          reservedMemo: finalServerMemo,
        };

        if (sheetRes.success && (finalServerId !== idKegiatan || finalServerMemo !== updatedHeader.nomorMemo)) {
          saveKegiatanRecord(
            {
              idKegiatan: finalServerId,
              kategori: "A",
              namaKegiatan: finalHeader.keteranganKegiatan || spjMeta.label,
              tanggalSpd: today,
              kotaTujuan: spjMeta.shortLabel,
              provinsiTujuan: "DKI JAKARTA",
              jumlahPeserta: items.length,
              grandTotal: calc.subTotalBruto,
              header: finalHeader,
              rows: [syntheticRow],
              activeCols,
              activeUh,
              updatedAt: new Date().toISOString(),
            },
            idKegiatan,
            updatedHeader.keteranganKegiatan || undefined,
            updatedHeader.nomorMemo || undefined
          );
          setTotalKegiatanCount(getSavedKegiatanList().length);
        }

        cloudSyncRuntime.isEditingExisting = true;
        setHeader(finalHeader);
        setEditingOriginalId(finalServerId);
        setEditingOriginalTitle(finalHeader.keteranganKegiatan || null);
        setEditingOriginalMemo(finalHeader.nomorMemo || null);
        setSavedBatchId(finalServerId);
        setSavedSnapshot(JSON.stringify({ header: finalHeader, rows }));

        // Perbarui state memoList dari gabungan bersama & segera refresh Cloud agar daftar lain ter-update
        setMemoList((prev) => mergeAndSortMemoList(prev));

        if (sheetRes.success) {
          void syncCloudState({ force: true, syncFreshDraftIds: false });
          setIsCloudSynced(true);
          setLastCloudSyncTime(
            new Date().toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })
          );
          const reassignNote = sheetRes.wasAutoReassigned
            ? ` (Nomor otomatis disesuaikan ke ${finalServerId} · ${finalServerMemo} agar tidak bentrok dengan user lain)`
            : "";
          setSaveFeedback({
            type: "success",
            text:
              (isUpdate
                ? `Data ${spjMeta.label} berhasil diperbarui di ${targetRekapSheetName} & MASTER_MEMO (Database Cloud)!`
                : `Data ${spjMeta.label} berhasil disimpan ke ${targetRekapSheetName} & MASTER_MEMO (Database Cloud)!`) +
              reassignNote,
          });
        } else {
          setIsCloudSynced(false);
          setLastCloudSyncTime(null);
          setSaveFeedback({
            type: "info",
            text: `Data ${spjMeta.label} tersimpan di Daftar Kegiatan lokal, tetapi belum tersinkron ke Cloud. (${sheetRes.message})`,
          });
        }

        setIsCompletionModalOpen(true);
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        setSaveFeedback({
          type: "error",
          text: `Gagal menyimpan data: ${errMsg}`,
        });
      } finally {
        setIsSaving(false);
      }
      return;
    }

    if (rows.length === 0) {
      setSaveFeedback({
        type: "error",
        text: "Belum ada data pelaksana perjalanan dinas untuk disimpan.",
      });
      return;
    }

    const validRows = rows.filter(
      (r) => Boolean((r.nama && r.nama.trim() !== "") || (r.namaExternal && r.namaExternal.trim() !== ""))
    );

    if (validRows.length === 0) {
      setSaveFeedback({
        type: "error",
        text: "Gagal menyimpan: Silakan pilih minimal 1 nama pegawai/peserta pada tabel sebelum menyimpan.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const today = header.tanggalSpd || new Date().toISOString().split("T")[0];
      const idKegiatan =
        header.idKegiatan ||
        savedBatchId ||
        generateIdKegiatan(today, header.noKegiatanUrut || "001", header.kategoriSpj || "A");

      // Auto-assign sequential Nomor Memorandum jika masih kosong atau placeholder 'xxx' (Berbagi MASTER_MEMO)
      const sharedPool = mergeAndSortMemoList(memoList);
      let nomorMemoToSave = header.nomorMemo || "";
      if (!nomorMemoToSave || nomorMemoToSave.includes("xxx") || nomorMemoToSave.includes("...")) {
        const gen = generateNextMemoNumber(sharedPool, undefined, header.tanggalMemo || today);
        nomorMemoToSave = gen.nextMemoNumber;
      }

      const updatedHeader = { ...header, idKegiatan, nomorMemo: nomorMemoToSave };
      setHeader(updatedHeader);

      // Simpan custom item detail jika ada uraiannya
      if (header.itemDetail) {
        saveCustomItemDetail({
          kode: header.itemDetail,
          nama: header.keteranganItemDetail || `Item Detail ${header.itemDetail}`,
          kodeMak: header.nomorMak || "524111",
          kodeKomponen: header.nomorKomp || "CL.7458.ABR.006.075.EE",
        });
      }

      const oldBatchId = editingOriginalId || savedBatchId || undefined;
      const oldNama = editingOriginalTitle || undefined;
      const oldMemo = editingOriginalMemo || undefined;

      // 1. Simpan ke database master kegiatan lokal (Daftar Kegiatan)
      saveKegiatanRecord(
        {
          idKegiatan,
          kategori: (header.kategoriSpj === "NA" || (header.kategoriSpj as string) === "B" ? "NA" : "A") as "A" | "NA" | "B",
          namaKegiatan: header.keteranganKegiatan || "Kegiatan Tanpa Judul",
          tanggalSpd: header.tanggalSpd || today,
          kotaTujuan: updatedHeader.isMultiProvinsi
            ? [...(updatedHeader.kotaTujuanList || []), ...(updatedHeader.kotaTujuanList2 || [])].filter(Boolean).join(", ")
            : updatedHeader.kotaTujuanList?.[0] || "",
          provinsiTujuan: updatedHeader.isMultiProvinsi && updatedHeader.provinsiTujuan2
            ? `${updatedHeader.provinsiTujuan} & ${updatedHeader.provinsiTujuan2}`
            : updatedHeader.provinsiTujuan || "",
          jumlahPeserta: validRows.length,
          grandTotal: validRows.reduce((acc, r) => acc + (r.totalJumlah || 0), 0),
          header: updatedHeader,
          rows: validRows,
          activeCols,
          activeUh,
          updatedAt: new Date().toISOString(),
        },
        oldBatchId,
        oldNama,
        oldMemo
      );
      setTotalKegiatanCount(getSavedKegiatanList().length);

      // Perbarui nomor SPD tertinggi ke storage lokal
      const maxSpd = validRows.reduce((max, r) => {
        const parsed = parseSpdNumber(r.nomorSpd);
        return Math.max(max, parsed.num);
      }, 0);
      if (maxSpd > 0) {
        saveLatestRegisteredSpdNumber(maxSpd);
      }

      // 2. Simpan / perbarui ke Rekap Perdin lokal terlebih dahulu (instan)
      const { isUpdate } = saveOrUpdateRekapLocal(
        updatedHeader,
        validRows,
        idKegiatan,
        oldBatchId,
        oldNama,
        oldMemo
      );
      setEditingOriginalId(idKegiatan);
      setEditingOriginalTitle(updatedHeader.keteranganKegiatan || null);
      setEditingOriginalMemo(updatedHeader.nomorMemo || null);
      setSavedBatchId(idKegiatan);
      setSavedSnapshot(JSON.stringify({ header: updatedHeader, rows: validRows }));

      // 3. Kirim data transaksi dan baris rekap ke Google Spreadsheet Cloud
      const isNewRecord = !oldBatchId;
      const sheetRes = await savePerdinToGoogleSheet(
        updatedHeader,
        validRows,
        undefined,
        oldBatchId,
        {
          activeCols,
          activeUh,
          oldNamaKegiatan: oldNama,
          oldNomorMemo: oldMemo,
          isNewRecord,
        }
      );

      const finalServerId = sheetRes.idKegiatan || idKegiatan;
      const finalServerMemo = sheetRes.assignedNomorMemo || updatedHeader.nomorMemo;
      const idNumMatch = finalServerId.match(/^KEG-\d{4}-(\d+)-/);
      const finalHeader: HeaderData = {
        ...updatedHeader,
        idKegiatan: finalServerId,
        noKegiatanUrut: idNumMatch ? idNumMatch[1] : updatedHeader.noKegiatanUrut,
        nomorMemo: finalServerMemo,
        reservedMemo: finalServerMemo,
      };
      const serverSpdArr = sheetRes.assignedSpdNumbers;
      const validIdsSet = new Set(validRows.map((v) => v.id));
      let validCursor = 0;
      const finalRows =
        serverSpdArr && serverSpdArr.length === validRows.length
          ? rows.map((r) => {
              if (!validIdsSet.has(r.id)) return r;
              const srvSpd = serverSpdArr[validCursor++];
              return srvSpd ? { ...r, nomorSpd: srvSpd } : r;
            })
          : rows;
      const finalValidRows = finalRows.filter((r) => validIdsSet.has(r.id));

      if (
        sheetRes.success &&
        (finalServerId !== idKegiatan ||
          finalServerMemo !== updatedHeader.nomorMemo ||
          sheetRes.wasAutoReassigned)
      ) {
        saveKegiatanRecord(
          {
            idKegiatan: finalServerId,
            kategori: (finalHeader.kategoriSpj === "NA" || (finalHeader.kategoriSpj as string) === "B" ? "NA" : "A") as "A" | "NA" | "B",
            namaKegiatan: finalHeader.keteranganKegiatan || "Kegiatan Tanpa Judul",
            tanggalSpd: finalHeader.tanggalSpd || today,
            kotaTujuan: finalHeader.isMultiProvinsi
              ? [...(finalHeader.kotaTujuanList || []), ...(finalHeader.kotaTujuanList2 || [])].filter(Boolean).join(", ")
              : finalHeader.kotaTujuanList?.[0] || "",
            provinsiTujuan:
              finalHeader.isMultiProvinsi && finalHeader.provinsiTujuan2
                ? `${finalHeader.provinsiTujuan} & ${finalHeader.provinsiTujuan2}`
                : finalHeader.provinsiTujuan || "",
            jumlahPeserta: finalValidRows.length,
            grandTotal: finalValidRows.reduce((acc, r) => acc + (r.totalJumlah || 0), 0),
            header: finalHeader,
            rows: finalValidRows,
            activeCols,
            activeUh,
            updatedAt: new Date().toISOString(),
          },
          idKegiatan,
          updatedHeader.keteranganKegiatan || undefined,
          updatedHeader.nomorMemo || undefined
        );
        saveOrUpdateRekapLocal(
          finalHeader,
          finalValidRows,
          finalServerId,
          idKegiatan,
          updatedHeader.keteranganKegiatan || undefined,
          updatedHeader.nomorMemo || undefined
        );
        setTotalKegiatanCount(getSavedKegiatanList().length);
      }

      cloudSyncRuntime.isEditingExisting = true;
      setHeader(finalHeader);
      setRows(finalRows);
      setEditingOriginalId(finalServerId);
      setEditingOriginalTitle(finalHeader.keteranganKegiatan || null);
      setEditingOriginalMemo(finalHeader.nomorMemo || null);
      setSavedBatchId(finalServerId);
      setSavedSnapshot(JSON.stringify({ header: finalHeader, rows: finalValidRows }));

      setMemoList((prev) => mergeAndSortMemoList(prev));

      if (sheetRes.success) {
        void syncCloudState({ force: true, syncFreshDraftIds: false });
        setIsCloudSynced(true);
        setLastCloudSyncTime(
          new Date().toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
        );
        const reassignNote = sheetRes.wasAutoReassigned
          ? ` (Nomor otomatis disesuaikan ke ${finalServerId} · ${finalServerMemo} agar tidak bentrok dengan user lain)`
          : "";
        setSaveFeedback({
          type: "success",
          text:
            (isUpdate
              ? "Data SPJ berhasil diperbarui di Rekap Perdin & tersinkron ke Google Spreadsheet!"
              : "Data SPJ berhasil disimpan ke Rekap Perdin & tersinkron ke Google Spreadsheet!") +
            reassignNote,
        });
      } else {
        setIsCloudSynced(false);
        setLastCloudSyncTime(null);
        setSaveFeedback({
          type: "info",
          text: `Data tersimpan di Rekap Perdin & Daftar Kegiatan lokal. (${sheetRes.message})`,
        });
      }

      // Tampilkan Milestone Modal SPJ Selesai & Berhasil Disimpan
      setIsCompletionModalOpen(true);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setSaveFeedback({
        type: "error",
        text: `Gagal menyimpan data: ${errMsg}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const currentSpjType: SpjDocType = header.spjType || "PERDIN";
  const isPengadaan = currentSpjType !== "PERDIN";
  const pengadaanItemsActive =
    header.pengadaanItems && header.pengadaanItems.length > 0
      ? header.pengadaanItems
      : isPengadaan
      ? getDefaultPengadaanItems(currentSpjType)
      : [];
  const pengadaanCalcActive = calculatePengadaanTotals(pengadaanItemsActive, header.pengadaanTax);

  const grandTotal = isPengadaan
    ? pengadaanCalcActive.subTotalBruto
    : rows.reduce((acc, r) => acc + (r.totalJumlah || 0), 0);
  const activeCount = isPengadaan ? pengadaanItemsActive.length : rows.length;

  return (
    <>
      <div className={`app-shell-print-root min-h-screen flex flex-row bg-slate-100/60 dark:bg-slate-950 ${bundleDocsToPrint ? "no-print" : ""}`}>
        {/* Classic macOS / Safari-style Sidebar on the Left */}
      <ClassicSidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((prev) => !prev)}
        activeTab={activeTab}
        onSelectTab={(tab: ActiveTab) => {
          handleNavigateTab(tab);
          if (typeof window !== "undefined" && window.innerWidth < 1024) {
            setIsSidebarOpen(false);
          }
        }}
        onOpenDatabaseSync={() => setIsDbModalOpen(true)}
        onCreateNewKegiatan={handleRequestCreateNew}
        currentLoadedId={editingOriginalId || (isSaved ? header.idKegiatan : null)}
        hasChanges={hasChanges}
        totalKegiatanCount={totalKegiatanCount}
        memoCount={memoList.length}
        participantCount={activeCount}
        totalExpenditure={grandTotal}
        spjType={currentSpjType}
        onSelectSpjType={handleSwitchSpjType}
        activeRekapType={activeRekapType}
        onSelectRekapType={setActiveRekapType}
      />

      {/* Main Workspace (Full width when sidebar is collapsed, or flex-1 alongside) */}
      <div className="app-workspace-print-root flex-1 flex flex-col min-w-0 transition-all duration-300">
        {/* Top Navbar (Main Course Tabs Only) */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={handleNavigateTab}
          onPrint={() => {
            syncAllAutoFitSheets();
            window.print();
          }}
          onOpenBundlePrint={() => setIsBundleModalOpen(true)}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          isSidebarOpen={isSidebarOpen}
          onCreateNewKegiatan={handleRequestCreateNew}
          currentLoadedId={editingOriginalId || (isSaved ? header.idKegiatan : null)}
          isSaved={isSaved}
          hasChanges={hasChanges}
          participantCount={activeCount}
          totalExpenditure={grandTotal}
          spjType={currentSpjType}
        />

        {/* Main Content Area */}
        <main className="app-main-print-root flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-5 space-y-7 pb-14">
          {/* Tab Beranda (Landing Page Pemilihan Jenis SPJ) */}
          {activeTab === "beranda" && (
            <LandingHomeView
              currentSpjType={currentSpjType}
              currentLoadedId={editingOriginalId || (isSaved ? header.idKegiatan : null)}
              currentTitle={header.keteranganKegiatan}
              currentTotal={grandTotal}
              totalKegiatanCount={totalKegiatanCount}
              memoCount={memoList.length}
              pegawaiCount={pegawaiList.length}
              sbmCount={sbmList.length}
              onSelectSpjToWork={(type, createNew) => {
                if (createNew) {
                  handleRequestCreateNew(type);
                } else {
                  handleSwitchSpjType(type);
                  handleNavigateTab("input");
                }
              }}
              onContinueCurrentWork={() => handleNavigateTab("input")}
              onNavigateTab={(tab) => handleNavigateTab(tab)}
              onOpenDbModal={() => setIsDbModalOpen(true)}
            />
          )}

          {/* Primary Document Type Selector (Pilih Jenis SPJ yang Ingin Dikerjakan) */}
          {activeTab !== "beranda" &&
            activeTab !== "kegiatan" &&
            activeTab !== "rekap" &&
            activeTab !== "panduan" &&
            activeTab !== "monitoring" &&
            activeTab !== "daftar-memo" && (
              <div className="no-print bg-white dark:bg-slate-900 rounded-2xl px-4 py-3 border border-slate-200/90 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  Jenis SPJ
                </span>

                <div className="flex flex-wrap items-center gap-1.5">
                  {SPJ_TYPE_LIST.map((item) => {
                    const isSelected = currentSpjType === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSwitchSpjType(item.id)}
                        className={`btn-tactile px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer border ${
                          isSelected
                            ? "bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-800 dark:border-slate-100 font-semibold"
                            : "bg-slate-50/70 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 font-medium"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          {/* Secondary Management Tabs: Return Bar to Beranda / Input */}
          {(activeTab === "kegiatan" || activeTab === "rekap" || activeTab === "panduan" || activeTab === "monitoring" || activeTab === "daftar-memo") && (
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 no-print animate-fade-in">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleNavigateTab("beranda")}
                  className="btn-tactile inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 cursor-pointer transition-all"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
                  <span>Beranda</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigateTab("input")}
                  className="btn-tactile inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-200/80 dark:border-slate-700 cursor-pointer transition-all"
                >
                  <span>Input &amp; Kalkulator</span>
                </button>
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {activeTab === "kegiatan"
                  ? "Daftar Riwayat Kegiatan"
                  : activeTab === "rekap"
                  ? "Rekap Kegiatan"
                  : activeTab === "monitoring"
                  ? "Monitoring Anggaran"
                  : activeTab === "daftar-memo"
                  ? "Daftar Memorandum"
                  : "Buku Panduan"}
              </span>
            </div>
          )}

          {/* Tab 0: Input & Kalkulator */}
          {activeTab === "input" &&
            (isPengadaan ? (
              <PengadaanSpjForm
                header={header}
                setHeader={handleSetHeader}
                memoList={memoList}
                pegawaiList={pegawaiList}
                onGenerateMemoNumber={handleGenerateMemoNumber}
                isReservingMemo={isReservingMemo}
                memoReserveFeedback={memoReserveFeedback}
                onClearMemoFeedback={() => setMemoReserveFeedback(null)}
                onOpenDaftarKegiatan={() => handleNavigateTab("kegiatan")}
                onOpenDaftarMemo={() => handleNavigateTab("daftar-memo")}
                editingOriginalId={editingOriginalId}
                isSaved={isSaved}
                hasChanges={hasChanges}
                isSaving={isSaving}
                isCloudSynced={isCloudSynced}
                lastCloudSyncTime={lastCloudSyncTime}
                saveFeedback={saveFeedback}
                onSaveOrUpdate={handleSaveOrUpdateData}
                onClearFeedback={() => setSaveFeedback(null)}
                onNavigateTab={(tab) => handleNavigateTab(tab)}
              />
            ) : (
              <div className="space-y-7">
                <HeaderForm
                  header={header}
                  setHeader={handleSetHeader}
                  sbmList={sbmList}
                  memoList={memoList}
                  pegawaiList={pegawaiList}
                  onAddPegawai={handleAddPegawai}
                  onApplyStToAll={handleApplyStToAll}
                  onGenerateMemoNumber={handleGenerateMemoNumber}
                  isReservingMemo={isReservingMemo}
                  memoReserveFeedback={memoReserveFeedback}
                  onClearMemoFeedback={() => setMemoReserveFeedback(null)}
                  onOpenDaftarKegiatan={() => handleNavigateTab("kegiatan")}
                  onOpenDaftarMemo={() => handleNavigateTab("daftar-memo")}
                  editingOriginalId={editingOriginalId}
                />

                <ChecklistFilter
                  activeCols={activeCols}
                  setActiveCols={handleSetActiveCols}
                  activeUh={activeUh}
                  setActiveUh={handleSetActiveUh}
                />

                <ParticipantGrid
                  rows={rows}
                  setRows={setRows}
                  pegawaiList={pegawaiList}
                  sbmList={sbmList}
                  activeCols={activeCols}
                  activeUh={activeUh}
                  provinsiTujuan={header.provinsiTujuan}
                  header={header}
                  isSaved={isSaved}
                  hasChanges={hasChanges}
                  isSaving={isSaving}
                  saveFeedback={saveFeedback}
                  onSaveOrUpdate={handleSaveOrUpdateData}
                  onClearFeedback={() => setSaveFeedback(null)}
                />
              </div>
            ))}

          {/* Tab 1: Kwitansi */}
          {activeTab === "kwitansi" &&
            (isPengadaan ? (
              <KuitansiPengadaanDoc header={header} isBundleMode={Boolean(bundleDocsToPrint)} />
            ) : (
              <KwitansiDoc
                header={header}
                setHeader={setHeader}
                rows={rows}
                setRows={setRows}
                activeCols={activeCols}
                activeUh={activeUh}
                isBundleMode={Boolean(bundleDocsToPrint)}
              />
            ))}

          {/* Tab 2: Memorandum */}
          {activeTab === "memorandum" && (
            <MemorandumDoc
              header={header}
              setHeader={setHeader}
              rows={rows}
              setRows={setRows}
              isBundleMode={Boolean(bundleDocsToPrint)}
            />
          )}

          {/* Tab 3: Nominatif */}
          {activeTab === "nominatif" &&
            (isPengadaan ? (
              <NominatifPengadaanDoc header={header} isBundleMode={Boolean(bundleDocsToPrint)} />
            ) : (
              <NominatifDoc
                header={header}
                setHeader={setHeader}
                rows={rows}
                setRows={setRows}
                activeCols={activeCols}
                activeUh={activeUh}
                isBundleMode={Boolean(bundleDocsToPrint)}
              />
            ))}

          {/* Tab 4: Rincian Biaya */}
          {activeTab === "rincian" && (
            <RincianBiayaDoc
              header={header}
              setHeader={setHeader}
              rows={rows}
              setRows={setRows}
              activeCols={activeCols}
              activeUh={activeUh}
              isBundleMode={Boolean(bundleDocsToPrint)}
            />
          )}

          {/* Tab 5: Biaya Riil */}
          {activeTab === "riil" && (
            <BiayaRiilDoc
              header={header}
              setHeader={setHeader}
              rows={rows}
              setRows={setRows}
              activeCols={activeCols}
              isBundleMode={Boolean(bundleDocsToPrint)}
            />
          )}

          {/* Tab 6: SPPD Depan */}
          {activeTab === "spd" && (
            <SppdDepanDoc
              header={header}
              setHeader={setHeader}
              rows={rows}
              setRows={setRows}
              pegawaiList={pegawaiList}
              isBundleMode={Boolean(bundleDocsToPrint)}
            />
          )}

          {/* Rekap Kegiatan (5 Modul SPJ Database & Excel Export) */}
          {activeTab === "rekap" && (
            <RekapPerdinTab
              header={header}
              rows={rows}
              activeRekapType={activeRekapType}
              onSelectRekapType={setActiveRekapType}
            />
          )}

          {/* Monitoring Anggaran (SAKTI 16 Segmen Realization Report) */}
          {activeTab === "monitoring" && <MonitoringAnggaranTab />}

          {/* Buku Kendali & Daftar Memorandum Terdaftar */}
          {activeTab === "daftar-memo" && (
            <DaftarMemorandumTab
              memoList={memoList}
              onSelectMemo={(memoNumber, memoPerihal) => {
                setHeader((prev) => ({
                  ...prev,
                  nomorMemo: memoNumber,
                  keteranganMemo: memoPerihal || prev.keteranganMemo,
                }));
                setActiveTab("input");
              }}
              onLoadKegiatan={handleEditKegiatan}
              onRefreshMemo={async () => {
                await syncCloudState({ force: true, syncFreshDraftIds: false });
              }}
            />
          )}

          {/* Tab: Daftar Kegiatan */}
          {activeTab === "kegiatan" && (
            <DaftarKegiatanTab
              onEditKegiatan={handleEditKegiatan}
              onCreateNewKegiatan={handleRequestCreateNew}
              currentLoadedId={savedBatchId || header.idKegiatan}
            />
          )}

          {/* Tab 7: Panduan (Manual Book & Tutorial Setup Database) */}
          {activeTab === "panduan" && (
            <ManualBookView
              onOpenDatabaseSync={() => setIsDbModalOpen(true)}
              onNavigateToTab={(tab) => setActiveTab(tab as ActiveTab)}
            />
          )}
        </main>

        {/* Minimalist Web Footer */}
        <Footer />
      </div>

      {/* Modal Integrasi Database Google Spreadsheet */}
      <ModalDatabaseSync
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
        header={header}
        rows={rows}
        onMasterSyncSuccess={handleMasterSyncSuccess}
        currentPegawaiList={pegawaiList}
        currentSbmList={sbmList}
        currentMemoList={memoList}
      />

      {/* Milestone Modal: SPJ Selesai & Berhasil Disimpan */}
      <ModalSelesaiSpj
        isOpen={isCompletionModalOpen}
        onClose={() => setIsCompletionModalOpen(false)}
        header={header}
        rows={rows}
        isCloudSynced={isCloudSynced}
        lastCloudSyncTime={lastCloudSyncTime}
        onNavigateToTab={(tab) => handleNavigateTab(tab)}
        onPrintAll={handlePrintAllFromModal}
        onCreateNewKegiatan={() => {
          setIsCompletionModalOpen(false);
          handleCreateNewKegiatan();
        }}
      />

      {/* Safety Confirmation Modal: Buat SPJ Baru */}
      <ModalConfirmNewSpj
        isOpen={isConfirmNewModalOpen}
        onClose={() => {
          setIsConfirmNewModalOpen(false);
          setPendingNewSpjType(null);
        }}
        onConfirmNew={() => {
          const nextType = pendingNewSpjType || undefined;
          setIsConfirmNewModalOpen(false);
          setPendingNewSpjType(null);
          handleCreateNewKegiatan(nextType);
        }}
        onSaveAndNew={async () => {
          const nextType = pendingNewSpjType || undefined;
          setIsConfirmNewModalOpen(false);
          setPendingNewSpjType(null);
          await handleSaveOrUpdateData();
          handleCreateNewKegiatan(nextType);
        }}
        hasUnsavedChanges={hasChanges || (!isSaved && rows.some((r) => Boolean(r.nama && r.nama.trim() !== "")))}
      />

      {/* Modal Cetak Bundel (Checklist Dokumen 1-Klik) */}
      <ModalCetakBundel
        key={currentSpjType}
        isOpen={isBundleModalOpen}
        onClose={() => setIsBundleModalOpen(false)}
        spjType={currentSpjType}
        header={header}
        rows={rows}
        onStartPrintBundle={handleStartBundlePrint}
      />
    </div>

    {/* Container Khusus Print Bundel (Di luar flex-row agar lebar A4/Landscape akurat & CSS Named Pages bekerja) */}
    {bundleDocsToPrint && (
      <BundlePrintContainer
        selectedDocs={bundleDocsToPrint}
        spjType={currentSpjType}
        header={header}
        rows={rows}
        activeCols={activeCols}
        activeUh={activeUh}
        pegawaiList={pegawaiList}
        onCloseBundle={() => setBundleDocsToPrint(null)}
      />
    )}
    </>
  );
}
