"use client";

import React, { useState, useEffect } from "react";
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
import { PengadaanSpjForm } from "@/components/PengadaanSpjForm";
import { LandingHomeView } from "@/components/LandingHomeView";
import { RekapPerdinTab } from "@/components/RekapPerdinTab";
import { DaftarKegiatanTab } from "@/components/DaftarKegiatanTab";
import { MonitoringAnggaranTab } from "@/components/MonitoringAnggaranTab";
import { DaftarMemorandumTab } from "@/components/DaftarMemorandumTab";
import { ModalDatabaseSync } from "@/components/ModalDatabaseSync";
import { ModalSelesaiSpj } from "@/components/ModalSelesaiSpj";
import { ModalConfirmNewSpj } from "@/components/ModalConfirmNewSpj";
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
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [totalKegiatanCount, setTotalKegiatanCount] = useState<number>(0);

  // Asynchronous client-side cache hydration & Google Sheets background sync
  useEffect(() => {
    let isMounted = true;

    // 0. Auto-heal: Bersihkan cache usang versi lama secara otomatis tanpa campur tangan user
    checkAndAutoMigrateCache();

    // 1. Hydrate from localStorage cache asynchronously after initial render
    Promise.resolve().then(() => {
      const cached = getCachedMasterData();
      if (isMounted && cached) {
        if (cached.pegawai && cached.pegawai.length > 0) setPegawaiList(cached.pegawai);
        if (cached.sbm && cached.sbm.length > 0) setSbmList(cached.sbm);
        if (cached.memo && cached.memo.length > 0) setMemoList(cached.memo);
      }
    });

    // 2. Fetch latest data from Google Sheets Cloud
    fetchMasterDataFromSheet().then((res) => {
      if (isMounted && res.success && res.data) {
        if (res.data.pegawai && res.data.pegawai.length > 0) setPegawaiList(res.data.pegawai);
        if (res.data.sbm && res.data.sbm.length > 0) setSbmList(res.data.sbm);
        if (res.data.memo && res.data.memo.length > 0) setMemoList(res.data.memo);
      }
    });

    // 3. Fetch latest kegiatan list from Google Sheets Cloud for cross-device synchronization
    fetchKegiatanFromSheet().then((res) => {
      if (isMounted && res.success && res.data) {
        setTotalKegiatanCount(res.data.length);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Safely hydrate saved kegiatan count on client mount
  useEffect(() => {
    const updateCount = () => {
      try {
        setTotalKegiatanCount(getSavedKegiatanList().length);
      } catch {
        // ignore
      }
    };
    updateCount();
    window.addEventListener("storage", updateCount);
    return () => window.removeEventListener("storage", updateCount);
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

  // Save & Update State Tracking (Proses -> Rekap Perdin)
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);
  const [savedBatchId, setSavedBatchId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
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

  // Handle Next Memo Number Generation (Berbagi Nomor Memorandum di seluruh 5 jenis SPJ)
  const handleGenerateMemoNumber = () => {
    const sharedPool = mergeAndSortMemoList(memoList);
    const { nextMemoNumber } = generateNextMemoNumber(
      sharedPool,
      header.nomorMemo,
      header.tanggalMemo
    );
    setHeader((prev) => ({ ...prev, nomorMemo: nextMemoNumber }));
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

  // Edit kegiatan from Daftar Kegiatan
  const handleEditKegiatan = (kegiatan: SavedKegiatan) => {
    const normalizedHeader: HeaderData = {
      ...kegiatan.header,
      spjType: kegiatan.header.spjType || "PERDIN",
    };
    setHeader(normalizedHeader);
    setRows(kegiatan.rows);
    if (kegiatan.activeCols) setActiveCols(kegiatan.activeCols);
    if (kegiatan.activeUh) setActiveUh(kegiatan.activeUh);
    setEditingOriginalId(kegiatan.idKegiatan);
    setEditingOriginalTitle(kegiatan.namaKegiatan || kegiatan.header?.keteranganKegiatan || null);
    setEditingOriginalMemo(kegiatan.header?.nomorMemo || null);
    setSavedBatchId(kegiatan.idKegiatan);
    setSavedSnapshot(JSON.stringify({ header: normalizedHeader, rows: kegiatan.rows }));
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
        nomorKomp: meta.defaultKomp,
        detailKomponen: meta.defaultDetailKomp,
        nomorMak: meta.defaultMak,
        itemDetail: meta.defaultItemDetail,
        keteranganItemDetail: meta.defaultKeteranganItemDetail,
        keteranganMemo: meta.defaultPerihalMemo,
        keteranganKegiatan: isCurrentUraianDefault
          ? meta.defaultUraianKegiatan
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

  // Start fresh kegiatan with clean state and next sequential ID (Sharing MASTER_MEMO pool)
  const handleCreateNewKegiatan = (overrideType?: SpjDocType) => {
    setEditingOriginalId(null);
    setEditingOriginalTitle(null);
    setEditingOriginalMemo(null);
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
      keteranganKegiatan: currentType === "PERDIN" ? "" : meta.defaultUraianKegiatan,
      keteranganMemo: meta.defaultPerihalMemo,
      nomorMemo: genMemo.nextMemoNumber,
      nomorStMaster: "",
      nomorStStaff: "",
      nomorStPejabat: "",
      useDifferentStPejabat: false,
      nomorKomp: currentType === "PERDIN" ? "CL.7458.ABR.006.075.EE" : meta.defaultKomp,
      detailKomponen:
        currentType === "PERDIN"
          ? "Kunjungan Lapangan terkait Koordinasi Implementasi NEK Pengendalian Emisi GRK"
          : meta.defaultDetailKomp,
      nomorMak: meta.defaultMak,
      itemDetail: currentType === "PERDIN" ? "001" : meta.defaultItemDetail,
      keteranganItemDetail: currentType === "PERDIN" ? "" : meta.defaultKeteranganItemDetail,
      noSpby: "",
      noSpm: "",
      jenisPengajuan: "RAMPUNG",
      tanggalSpd: today,
      tanggalMemo: today,
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
    setActiveTab("input");
  };

  // Safe Request to Create New Kegiatan (Checks for unsaved changes)
  const handleRequestCreateNew = (overrideType?: SpjDocType) => {
    const isPengadaan = Boolean(header.spjType && header.spjType !== "PERDIN");
    const hasValidData = isPengadaan
      ? Boolean(header.keteranganKegiatan && header.keteranganKegiatan.trim() !== "")
      : rows.some((r) =>
          Boolean((r.nama && r.nama.trim() !== "") || (r.namaExternal && r.namaExternal.trim() !== ""))
        );
    if (hasChanges || (!isSaved && hasValidData)) {
      if (overrideType) handleSwitchSpjType(overrideType);
      setIsConfirmNewModalOpen(true);
    } else {
      handleCreateNewKegiatan(overrideType);
    }
  };

  const handlePrintAllFromModal = () => {
    setActiveTab("kwitansi");
    setTimeout(() => {
      window.print();
    }, 350);
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
          }
        );

        // Perbarui state memoList dari gabungan bersama
        setMemoList((prev) => mergeAndSortMemoList(prev));

        if (sheetRes.success) {
          setSaveFeedback({
            type: "success",
            text: isUpdate
              ? `Data ${spjMeta.label} berhasil diperbarui di ${targetRekapSheetName} & MASTER_MEMO!`
              : `Data ${spjMeta.label} berhasil disimpan ke ${targetRekapSheetName} & MASTER_MEMO!`,
          });
        } else {
          setSaveFeedback({
            type: "info",
            text: `Data ${spjMeta.label} tersimpan di Daftar Kegiatan lokal. (${sheetRes.message})`,
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
        }
      );

      setMemoList((prev) => mergeAndSortMemoList(prev));

      if (sheetRes.success) {
        setSaveFeedback({
          type: "success",
          text: isUpdate
            ? "Data SPJ berhasil diperbarui di Rekap Perdin & tersinkron ke Google Spreadsheet!"
            : "Data SPJ berhasil disimpan ke Rekap Perdin & tersinkron ke Google Spreadsheet!",
        });
      } else {
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
    <div className="min-h-screen flex flex-row bg-slate-100/60 dark:bg-slate-950">
      {/* Classic macOS / Safari-style Sidebar on the Left */}
      <ClassicSidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((prev) => !prev)}
        activeTab={activeTab}
        onSelectTab={(tab: ActiveTab) => {
          setActiveTab(tab);
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
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        {/* Top Navbar (Main Course Tabs Only) */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onPrint={() => window.print()}
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
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-4 space-y-6 pb-12">
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
                  setActiveTab("input");
                }
              }}
              onContinueCurrentWork={() => setActiveTab("input")}
              onNavigateTab={(tab) => setActiveTab(tab)}
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
              <div className="no-print bg-white/95 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setActiveTab("beranda")}
                    className="btn-tactile inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 cursor-pointer transition-all"
                    title="Kembali ke Halaman Utama (Landing Page)"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Beranda</span>
                  </button>
                  <span className="text-xs font-bold text-slate-800 whitespace-nowrap">
                    Jenis SPJ Aktif:
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {SPJ_TYPE_LIST.map((item) => {
                    const isSelected = currentSpjType === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSwitchSpjType(item.id)}
                        className={`btn-tactile px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                          isSelected
                            ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/90"
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
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-white/95 border border-slate-200/90 shadow-2xs backdrop-blur-md no-print animate-fade-in">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("beranda")}
                  className="btn-tactile inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold cursor-pointer transition-all"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Beranda Pilihan SPJ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("input")}
                  className="btn-tactile inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-200 cursor-pointer transition-all"
                >
                  <span>Ke Input &amp; Kalkulator</span>
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <span className="hidden sm:inline">Layar Penuh</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="font-semibold text-slate-700">
                  {activeTab === "kegiatan"
                    ? "Daftar Riwayat Kegiatan"
                    : activeTab === "rekap"
                    ? "Rekap Kegiatan (5 Modul SPJ)"
                    : activeTab === "monitoring"
                    ? "Monitoring Anggaran (16 Segmen)"
                    : activeTab === "daftar-memo"
                    ? "Buku Kendali & Daftar Memorandum Terdaftar"
                    : "Buku Panduan & Tutorial"}
                </span>
              </div>
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
                onOpenDaftarKegiatan={() => setActiveTab("kegiatan")}
                onOpenDaftarMemo={() => setActiveTab("daftar-memo")}
                onCreateNewKegiatan={handleRequestCreateNew}
                editingOriginalId={editingOriginalId}
                isSaved={isSaved}
                hasChanges={hasChanges}
                isSaving={isSaving}
                saveFeedback={saveFeedback}
                onSaveOrUpdate={handleSaveOrUpdateData}
                onClearFeedback={() => setSaveFeedback(null)}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            ) : (
              <div className="space-y-6">
                <HeaderForm
                  header={header}
                  setHeader={handleSetHeader}
                  sbmList={sbmList}
                  memoList={memoList}
                  pegawaiList={pegawaiList}
                  onAddPegawai={handleAddPegawai}
                  onApplyStToAll={handleApplyStToAll}
                  onGenerateMemoNumber={handleGenerateMemoNumber}
                  onOpenDaftarKegiatan={() => setActiveTab("kegiatan")}
                  onOpenDaftarMemo={() => setActiveTab("daftar-memo")}
                  onCreateNewKegiatan={handleRequestCreateNew}
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
              <KuitansiPengadaanDoc header={header} />
            ) : (
              <KwitansiDoc
                header={header}
                setHeader={setHeader}
                rows={rows}
                setRows={setRows}
                activeCols={activeCols}
                activeUh={activeUh}
              />
            ))}

          {/* Tab 2: Memorandum */}
          {activeTab === "memorandum" && (
            <MemorandumDoc
              header={header}
              setHeader={setHeader}
              rows={rows}
              setRows={setRows}
            />
          )}

          {/* Tab 3: Nominatif */}
          {activeTab === "nominatif" &&
            (isPengadaan ? (
              <NominatifPengadaanDoc header={header} />
            ) : (
              <NominatifDoc
                header={header}
                setHeader={setHeader}
                rows={rows}
                setRows={setRows}
                activeCols={activeCols}
                activeUh={activeUh}
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
                const res = await fetchMasterDataFromSheet();
                if (res.success && res.data?.memo) {
                  setMemoList(res.data.memo);
                }
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
        onNavigateToTab={(tab) => setActiveTab(tab)}
        onPrintAll={handlePrintAllFromModal}
        onCreateNewKegiatan={() => {
          setIsCompletionModalOpen(false);
          handleCreateNewKegiatan();
        }}
      />

      {/* Safety Confirmation Modal: Buat SPJ Baru */}
      <ModalConfirmNewSpj
        isOpen={isConfirmNewModalOpen}
        onClose={() => setIsConfirmNewModalOpen(false)}
        onConfirmNew={() => {
          setIsConfirmNewModalOpen(false);
          handleCreateNewKegiatan();
        }}
        onSaveAndNew={async () => {
          setIsConfirmNewModalOpen(false);
          await handleSaveOrUpdateData();
          handleCreateNewKegiatan();
        }}
        hasUnsavedChanges={hasChanges || (!isSaved && rows.some((r) => Boolean(r.nama && r.nama.trim() !== "")))}
      />
    </div>
  );
}
