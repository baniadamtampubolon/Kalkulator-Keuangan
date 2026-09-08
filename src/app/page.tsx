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
import { RekapPerdinTab } from "@/components/RekapPerdinTab";
import { ModalDatabaseSync } from "@/components/ModalDatabaseSync";
import { ManualBookView } from "@/components/ManualBookView";
import { Footer } from "@/components/Footer";
import {
  MasterSyncData,
  getCachedMasterData,
  fetchMasterDataFromSheet,
} from "@/lib/googleSheetsService";

import {
  HeaderData,
  ParticipantRow,
  ActiveCostKey,
  ActiveUhKey,
  Pegawai,
  SbmRate,
  NomorMemo,
} from "@/lib/types";
import { calculateRowTotal, findSbmByProvince, generateNextMemoNumber } from "@/lib/calc";

import pegawaiRaw from "@/data/pegawai.json";
import sbmRaw from "@/data/sbm.json";
import memoRaw from "@/data/nomor_memo.json";

export default function Home() {
  // Master data with runtime state (SSR-safe initial seed)
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>(pegawaiRaw as Pegawai[]);
  const [sbmList, setSbmList] = useState<SbmRate[]>(sbmRaw as SbmRate[]);
  const [memoList, setMemoList] = useState<NomorMemo[]>(memoRaw as NomorMemo[]);

  // Asynchronous client-side cache hydration & Google Sheets background sync
  useEffect(() => {
    let isMounted = true;

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

    return () => {
      isMounted = false;
    };
  }, []);



  const [activeTab, setActiveTab] = useState<ActiveTab>("input");
  const [isDbModalOpen, setIsDbModalOpen] = useState<boolean>(false);


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
    uhHalfday: false,
    uhFullboard: false,
  });

  // Find default PPK (Arif Wibowo)
  const defaultPpk = pegawaiList.find((p) => (p?.nama || "").toLowerCase().includes("arif wibowo"));

  // Header Data State (Clean defaults as requested)
  const [header, setHeader] = useState<HeaderData>({
    keteranganKegiatan: "",
    keteranganMemo: "",
    provinsiTujuan: "JAWA BARAT",
    kotaTujuanList: [""],
    unitKerja: "Inspektorat",
    picInisiator: defaultPpk?.nama || "Arif Wibowo, S.H., M.H.",
    bendahara: "Raka Panji Wibowo, S.Kom, NIP. 19950408202012 1 001",
    petugasVerifikasi: "Noviarty Ningsi Sumirat, S.E, NIP. 19811112201001 2 001",
    nomorKomp: "CL.7458.ABR.006.051.0A",
    nomorMak: "524111",
    itemDetail: "001",
    alatAngkut: "Angkutan Darat",
    tanggalSpd: new Date().toISOString().split("T")[0],
    tanggalMemo: new Date().toISOString().split("T")[0],
    nomorMemo: "",
    nomorStMaster: "",
    ppkNama: defaultPpk?.nama || "Arif Wibowo, S.H., M.H.",
    ppkNip: defaultPpk?.nip || "19830124200801 1 006",
    ppkJabatan: defaultPpk?.jabatan || "Kepala Bagian Tata Usaha Inspektorat",
    penanggungJawabNama: "Reni Sutaryo, S.Si., M.Adm.Pemb",
    penanggungJawabNip: "19791126200604 2 014",
    penanggungJawabJabatan: "Inspektur",
    noSpby: "",
    jenisPengajuan: "RAMPUNG",
    noSpm: "00073T",
    jenisPerdin: "Perdin Luar Kota",
    berangkatDari: "Jakarta",
  });

  // Participant Rows State (Clean initial empty row)
  const [rows, setRows] = useState<ParticipantRow[]>(() => {
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
      nomorSpd: "01",
      hariUhBiasa: 1,
      biayaUhBiasa: 0,
      hariUhBiasa60: 0,
      biayaUhBiasa60: 0,
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
      totalJumlah: 0,
    };

    return [initialRow];
  });

  // Handlers for state updates with synchronized row recalculation
  const handleSetActiveCols: React.Dispatch<React.SetStateAction<Record<ActiveCostKey, boolean>>> = (action) => {
    setActiveCols((prevCols) => {
      const nextCols = typeof action === "function" ? action(prevCols) : action;
      const sbm = findSbmByProvince(sbmList, header.provinsiTujuan);
      setRows((prevRows) => prevRows.map((r) => calculateRowTotal(r, sbm, activeUh, nextCols)));
      return nextCols;
    });
  };

  const handleSetActiveUh: React.Dispatch<React.SetStateAction<Record<ActiveUhKey, boolean>>> = (action) => {
    setActiveUh((prevUh) => {
      const nextUh = typeof action === "function" ? action(prevUh) : action;
      const sbm = findSbmByProvince(sbmList, header.provinsiTujuan);
      setRows((prevRows) => prevRows.map((r) => calculateRowTotal(r, sbm, nextUh, activeCols)));
      return nextUh;
    });
  };

  const handleSetHeader: React.Dispatch<React.SetStateAction<HeaderData>> = (action) => {
    setHeader((prevHeader) => {
      const nextHeader = typeof action === "function" ? action(prevHeader) : action;
      if (nextHeader.provinsiTujuan !== prevHeader.provinsiTujuan) {
        const sbm = findSbmByProvince(sbmList, nextHeader.provinsiTujuan);
        setRows((prevRows) => prevRows.map((r) => calculateRowTotal(r, sbm, activeUh, activeCols, { forceRecalcUh: true })));
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

  // Handle Next Memo Number Generation
  const handleGenerateMemoNumber = () => {
    const { nextMemoNumber } = generateNextMemoNumber(
      memoList,
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

  const grandTotal = rows.reduce((acc, r) => acc + (r.totalJumlah || 0), 0);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onPrint={() => window.print()}
        onOpenDatabaseSync={() => setIsDbModalOpen(true)}
        participantCount={rows.length}
        totalExpenditure={grandTotal}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 pt-4 space-y-6">
        {/* Tab 0: Input & Kalkulator */}
        {activeTab === "input" && (
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
            />
          </div>
        )}

        {/* Tab 1: Kwitansi */}
        {activeTab === "kwitansi" && (
          <KwitansiDoc
            header={header}
            setHeader={setHeader}
            rows={rows}
            setRows={setRows}
            activeCols={activeCols}
            activeUh={activeUh}
          />
        )}

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
        {activeTab === "nominatif" && (
          <NominatifDoc
            header={header}
            setHeader={setHeader}
            rows={rows}
            setRows={setRows}
            activeCols={activeCols}
            activeUh={activeUh}
          />
        )}

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

        {/* Tab 6: Rekap Perdin (48-Column SPJ Database & Excel Export) */}
        {activeTab === "rekap" && (
          <RekapPerdinTab
            header={header}
            rows={rows}
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
    </div>
  );
}
