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

import {
  HeaderData,
  ParticipantRow,
  ActiveCostKey,
  ActiveUhKey,
  Pegawai,
  SbmRate,
  NomorMemo,
} from "@/lib/types";
import { calculateRowTotal, findSbmByProvince } from "@/lib/calc";

import pegawaiRaw from "@/data/pegawai.json";
import sbmRaw from "@/data/sbm.json";
import memoRaw from "@/data/nomor_memo.json";

export default function Home() {
  // Master data with runtime state (pegawai can be added)
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>(pegawaiRaw as Pegawai[]);
  const sbmList: SbmRate[] = sbmRaw as SbmRate[];
  const memoList: NomorMemo[] = memoRaw as NomorMemo[];

  const [activeTab, setActiveTab] = useState<ActiveTab>("input");

  // Active Cost Columns State
  const [activeCols, setActiveCols] = useState<Record<ActiveCostKey, boolean>>({
    tiket: true,
    dukunganTransportasi: false,
    transportasiDarat: true,
    transportasiLokal: true,
    pengRill: true,
    hotel: true,
    penginapan30: false,
    fulldayMeeting: false,
    fullboardMeeting: false,
    representatif: false,
    belanjaBahan: false,
  });

  // Active Uang Harian State
  const [activeUh, setActiveUh] = useState<Record<ActiveUhKey, boolean>>({
    uhBiasa: true,
    uhBiasa60: false,
    uhHalfday: false,
    uhFullboard: false,
  });

  // Find default PPK (Arif Wibowo)
  const defaultPpk = pegawaiList.find((p) => p.nama.toLowerCase().includes("arif wibowo"));

  // Header Data State
  const [header, setHeader] = useState<HeaderData>({
    keteranganKegiatan:
      "Perjalanan Dinas dalam rangka Pembahasan Laporan Kinerja 2025 dan PKPT 2026 di Lingkungan Kemenko Bidang Pangan",
    keteranganMemo:
      "Perjalanan Dinas dalam rangka Pembahasan Laporan Kinerja 2025 dan PKPT 2026 di Lingkungan Kemenko Bidang Pangan",
    provinsiTujuan: "JAWA BARAT",
    kotaTujuanList: ["Kota Depok"],
    unitKerja: "Inspektorat",
    picInisiator: defaultPpk?.nama || "Arif Wibowo, S.H., M.H.",
    bendahara: "Raka Panji Wibowo, S.Kom, NIP. 19950408202012 1 001",
    petugasVerifikasi: "Nidya Hediyanti, NIP. 19920603 202521 2 034",
    nomorKomp: "051",
    nomorMak: "524111",
    itemDetail: "001",
    alatAngkut: "Angkutan Darat",
    tanggalSpd: new Date().toISOString().split("T")[0],
    tanggalMemo: new Date().toISOString().split("T")[0],
    nomorMemo: "M. 26 /INS/PPK/ III /2026",
    nomorStMaster: "ST-04/INS/KP.01/01/2026",
    ppkNama: defaultPpk?.nama || "Arif Wibowo, S.H., M.H.",
    ppkNip: defaultPpk?.nip || "19830124200801 1 006",
    ppkJabatan: defaultPpk?.jabatan || "Kepala Bagian Tata Usaha Inspektorat",
  });

  // Participant Rows State
  const [rows, setRows] = useState<ParticipantRow[]>(() => {
    const defaultProvSbm = findSbmByProvince(sbmList, "JAWA BARAT");
    const uh = defaultProvSbm?.uhBiasa || 430000;

    const sample1: ParticipantRow = {
      id: "1",
      kodeNama: "reni",
      nama: "Reni Sutaryo, S.Si., M.Adm.Pemb",
      nip: "19791126200604 2 014",
      golongan: "IV/c",
      jabatan: "Inspektur",
      tujuanKota: "Kota Depok",
      tujuanProvinsi: "JAWA BARAT",
      tanggalMulai: new Date().toISOString().split("T")[0],
      tanggalSelesai: new Date().toISOString().split("T")[0],
      lamaHari: 1,
      nomorSt: "ST-04/INS/KP.01/01/2026",
      nomorSpd: "01",
      hariUhBiasa: 1,
      biayaUhBiasa: uh,
      hariUhBiasa60: 0,
      biayaUhBiasa60: 0,
      hariUhHalfday: 0,
      biayaUhHalfday: 0,
      hariUhFullboard: 0,
      biayaUhFullboard: 0,
      tiket: 0,
      dukunganTransportasi: 0,
      transportasiDarat: 350000,
      transportasiLokal: 150000,
      transportJakartaPp: 0,
      transportDaerahPp: 0,
      hotel: 0,
      penginapan30: 0,
      fulldayMeeting: 0,
      fullboardMeeting: 0,
      representatif: 0,
      belanjaBahan: 0,
      pengRill: 300000,
      riilItems: [
        { id: "1", uraian: "Transportasi Darat PP (Taksi / Grab)", amount: 150000 },
        { id: "2", uraian: "Transportasi Lokal Daerah Tujuan", amount: 150000 },
      ],
      totalJumlah: uh + 350000 + 150000 + 300000,
    };

    const sample2: ParticipantRow = {
      id: "2",
      kodeNama: "arif",
      nama: "Arif Wibowo, S.H., M.H.",
      nip: "19830124200801 1 006",
      golongan: "IV/a",
      jabatan: "Kepala Bagian Tata Usaha Inspektorat",
      tujuanKota: "Kota Depok",
      tujuanProvinsi: "JAWA BARAT",
      tanggalMulai: new Date().toISOString().split("T")[0],
      tanggalSelesai: new Date().toISOString().split("T")[0],
      lamaHari: 1,
      nomorSt: "ST-04/INS/KP.01/01/2026",
      nomorSpd: "02",
      hariUhBiasa: 1,
      biayaUhBiasa: uh,
      hariUhBiasa60: 0,
      biayaUhBiasa60: 0,
      hariUhHalfday: 0,
      biayaUhHalfday: 0,
      hariUhFullboard: 0,
      biayaUhFullboard: 0,
      tiket: 0,
      dukunganTransportasi: 0,
      transportasiDarat: 350000,
      transportasiLokal: 150000,
      transportJakartaPp: 0,
      transportDaerahPp: 0,
      hotel: 0,
      penginapan30: 0,
      fulldayMeeting: 0,
      fullboardMeeting: 0,
      representatif: 0,
      belanjaBahan: 0,
      pengRill: 300000,
      riilItems: [
        { id: "1", uraian: "Transportasi Darat PP (Taksi / Grab)", amount: 150000 },
        { id: "2", uraian: "Transportasi Lokal Daerah Tujuan", amount: 150000 },
      ],
      totalJumlah: uh + 350000 + 150000 + 300000,
    };

    return [sample1, sample2];
  });

  // Re-calculate all rows when active cost, active uh, or province changes
  useEffect(() => {
    const sbm = findSbmByProvince(sbmList, header.provinsiTujuan);
    setRows((prev) =>
      prev.map((r) => calculateRowTotal(r, sbm, activeUh, activeCols))
    );
  }, [header.provinsiTujuan, activeCols, activeUh]);

  // Handle Apply ST Massal
  const handleApplyStToAll = (stNumber: string) => {
    setRows((prev) => prev.map((r) => ({ ...r, nomorSt: stNumber })));
  };

  // Handle Next Memo Number Generation
  const handleGenerateMemoNumber = () => {
    const romanMonths = [
      "I", "II", "III", "IV", "V", "VI",
      "VII", "VIII", "IX", "X", "XI", "XII",
    ];
    const now = new Date();
    const currentMonthRom = romanMonths[now.getMonth()];
    const currentYear = now.getFullYear();
    const nextSeq = memoList.length > 0 ? memoList.length + 1 : 26;
    const generated = `M. ${nextSeq} /INS/PPK/ ${currentMonthRom} /${currentYear}`;
    setHeader((prev) => ({ ...prev, nomorMemo: generated }));
  };

  // Handle Add New Pegawai to master list
  const handleAddPegawai = (newPeg: Pegawai) => {
    setPegawaiList((prev) => [...prev, newPeg]);
  };

  const grandTotal = rows.reduce((acc, r) => acc + (r.totalJumlah || 0), 0);

  return (
    <div className="min-h-screen pb-16 flex flex-col">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onPrint={() => window.print()}
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
              setHeader={setHeader}
              sbmList={sbmList}
              memoList={memoList}
              pegawaiList={pegawaiList}
              onAddPegawai={handleAddPegawai}
              onApplyStToAll={handleApplyStToAll}
              onGenerateMemoNumber={handleGenerateMemoNumber}
            />

            <ChecklistFilter
              activeCols={activeCols}
              setActiveCols={setActiveCols}
              activeUh={activeUh}
              setActiveUh={setActiveUh}
            />

            <ParticipantGrid
              rows={rows}
              setRows={setRows}
              pegawaiList={pegawaiList}
              sbmList={sbmList}
              activeCols={activeCols}
              activeUh={activeUh}
              provinsiTujuan={header.provinsiTujuan}
            />
          </div>
        )}

        {/* Tab 1: Kwitansi */}
        {activeTab === "kwitansi" && (
          <KwitansiDoc header={header} rows={rows} activeCols={activeCols} activeUh={activeUh} />
        )}

        {/* Tab 2: Memorandum */}
        {activeTab === "memorandum" && (
          <MemorandumDoc header={header} rows={rows} />
        )}

        {/* Tab 3: Nominatif */}
        {activeTab === "nominatif" && (
          <NominatifDoc header={header} rows={rows} activeCols={activeCols} activeUh={activeUh} />
        )}

        {/* Tab 4: Rincian Biaya */}
        {activeTab === "rincian" && (
          <RincianBiayaDoc header={header} rows={rows} activeCols={activeCols} activeUh={activeUh} />
        )}

        {/* Tab 5: Biaya Riil */}
        {activeTab === "riil" && (
          <BiayaRiilDoc header={header} rows={rows} activeCols={activeCols} />
        )}
      </main>
    </div>
  );
}
