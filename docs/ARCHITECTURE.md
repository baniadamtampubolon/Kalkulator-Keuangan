# System Architecture & Technical Design Document (ARCHITECTURE.md)
## Aplikasi Kalkulator Keuangan & Pertanggungjawaban Perjalanan Dinas (Inspektorat)

| Attribute | Detail |
| :--- | :--- |
| **Project** | **Kalkulator Keuangan & Rekapitulasi SPPD/Honorarium** |
| **Document Version** | 1.0.0 |
| **Status** | Approved Design Blueprint |
| **Target Stack** | Next.js / FastAPI + PostgreSQL / SQLite + Playwright PDF Engine |

---

## 1. System Overview & Architectural Style

Aplikasi ini menggunakan pola arsitektur **Clean Architecture / Modular Monolith** dengan pendekatan API-First. Pilihan ini diambil untuk menjamin kemudahan perawatan, pengujian independen pada *calculation engine* (SBM & Pajak), serta kesederhanaan *deployment*.

```mermaid
graph TB
    subgraph Client Layer (Presentation)
        UI[Web Single Page Application<br/>React / Next.js / Vanilla JS]
        PrintEngine[Browser Print CSS Engine]
    end

    subgraph API & Application Layer
        API[RESTful API Gateway<br/>FastAPI / Node.js]
        Auth[Auth & RBAC Middleware]
        CalcEngine[Calculation & SBM Engine]
        DocGen[Document & PDF Generator Engine]
        TerbilangService[Terbilang Generator Service]
    end

    subgraph Data & Persistence Layer
        DB[(PostgreSQL / SQLite)]
        SBMData[SBM Cache / Master Reference]
    end

    UI -->|JSON REST API| API
    UI -->|Print View| PrintEngine
    API --> Auth
    API --> CalcEngine
    API --> DocGen
    CalcEngine --> SBMData
    DocGen --> TerbilangService
    API --> DB
```

---

## 2. Calculation Engine Specification (Aturan Bisnis & Formulasi)

### 2.1 Engine Perhitungan Uang Harian & Paket Meeting
- **Komponen Uang Harian (UH)**:
  $$\text{Total UH} = \text{Lama Hari} \times \text{SBM\_Uang\_Harian}(\text{Provinsi})$$
  *(Lama Hari dihitung dari $\text{DATEDIF}(\text{Tgl Pulang}, \text{Tgl Berangkat}) + 1$)*

- **Komponen Uang Saku Meeting (UHM)**:
  $$\text{Total UHM} = \text{Lama Hari} \times \text{SBM\_Uang\_Saku}(\text{Provinsi}, \text{Tipe Paket})$$
  *(Tipe Paket: `fullday`, `halfday`, `fullboard`)*

- **Total Biaya Dinas per Pegawai**:
  $$\text{Total Biaya} = \text{Total UH} + \text{Total UHM} + \text{Hotel} + \text{Tiket PP} + \text{Representatif} + \sum \text{Transport Riil} + \text{Transport JKT/Daerah PP}$$

### 2.2 Engine Perhitungan Honorarium Narasumber & PPh 21
- **Brutto**:
  $$\text{Brutto} = \text{Jumlah OJ} \times \text{Tarif Satuan}$$
- **Pajak PPh 21**:
  $$\text{PPh 21 Nominal} = \text{Brutto} \times \text{Persentase Pajak}$$
  *Rule Persentase Pajak PPh 21:*
  - PNS Golongan IV / Eselon I-II: **15%** ($0.15$)
  - PNS Golongan III: **5%** ($0.05$)
  - PNS Golongan I & II / Non-PNS (Ber-NPWP): **5%** ($0.05$)
  - Non-PNS (Tanpa NPWP): **6%** ($0.06$)
- **Netto**:
  $$\text{Netto} = \text{Brutto} - \text{PPh 21 Nominal}$$

### 2.3 Terbilang Generator Algorithm
Fungsi `terbilang(amount: number) -> string` mengonversi angka numerik rupiah menjadi kalimat dalam Bahasa Indonesia:
*Contoh*: `24300000` $\rightarrow$ `"Dua Puluh Empat Juta Tiga Ratus Ribu Rupiah"`.

---

## 3. Database Schema Design (SQL DDL Specification)

```sql
-- 1. Master Pegawai
CREATE TABLE master_pegawai (
    id VARCHAR(36) PRIMARY KEY,
    kode_nama VARCHAR(50) UNIQUE NOT NULL,
    nama VARCHAR(255) NOT NULL,
    nip VARCHAR(50),
    jenis_kelamin VARCHAR(20),
    pangkat VARCHAR(100),
    golongan VARCHAR(20) NOT NULL, -- contoh: 'IV/c', 'III/d'
    jabatan VARCHAR(255),
    kelas_jabatan INT,
    nama_bank VARCHAR(100),
    nomor_rekening VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Master SBM (Satuan Biaya Masukan PMK)
CREATE TABLE master_sbm (
    id SERIAL PRIMARY KEY,
    provinsi VARCHAR(100) UNIQUE NOT NULL,
    uh_biasa DECIMAL(12,2) NOT NULL,
    uh_saku_fullday DECIMAL(12,2) NOT NULL,
    uh_saku_fullboard DECIMAL(12,2) NOT NULL,
    hotel_eselon1 DECIMAL(12,2) NOT NULL,
    hotel_eselon2 DECIMAL(12,2) NOT NULL,
    hotel_eselon3_gol4 DECIMAL(12,2) NOT NULL,
    hotel_eselon4_kebawah DECIMAL(12,2) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Master Pejabat Penandatangan
CREATE TABLE master_pejabat (
    id VARCHAR(36) PRIMARY KEY,
    peran VARCHAR(50) NOT NULL, -- 'PPK', 'BENDAHARA', 'PJ_KEGIATAN'
    nama VARCHAR(255) NOT NULL,
    nip VARCHAR(50) NOT NULL,
    jabatan VARCHAR(255) NOT NULL,
    unit_kerja VARCHAR(255) NOT NULL
);

-- 4. Transaksi Kegiatan Dinas (Header)
CREATE TABLE kegiatan_dinas (
    id VARCHAR(36) PRIMARY KEY,
    nomor_st VARCHAR(100),
    nomor_memo VARCHAR(100),
    maksud_tujuan TEXT NOT NULL,
    kota_tujuan VARCHAR(100) NOT NULL,
    provinsi_id INT REFERENCES master_sbm(id),
    tgl_berangkat DATE NOT NULL,
    tgl_pulang DATE NOT NULL,
    lama_hari INT NOT NULL,
    mak_kode VARCHAR(50) NOT NULL, -- '524111', '524114', '524119'
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Detail Peserta Perjalanan Dinas (Rincian Transaksi)
CREATE TABLE rincian_proses_dinas (
    id VARCHAR(36) PRIMARY KEY,
    kegiatan_id VARCHAR(36) REFERENCES kegiatan_dinas(id) ON DELETE CASCADE,
    pegawai_id VARCHAR(36) REFERENCES master_pegawai(id),
    uh_biasa DECIMAL(12,2) DEFAULT 0,
    jml_uh DECIMAL(12,2) DEFAULT 0,
    uh_meeting DECIMAL(12,2) DEFAULT 0,
    jml_uh_meeting DECIMAL(12,2) DEFAULT 0,
    total_uh DECIMAL(12,2) DEFAULT 0,
    hotel_cost DECIMAL(12,2) DEFAULT 0,
    penginapan_riil DECIMAL(12,2) DEFAULT 0,
    tiket_pp DECIMAL(12,2) DEFAULT 0,
    representatif DECIMAL(12,2) DEFAULT 0,
    kendaraan VARCHAR(100) DEFAULT 'Angkutan Darat',
    transport_riil1 DECIMAL(12,2) DEFAULT 0,
    transport_riil2 DECIMAL(12,2) DEFAULT 0,
    transport_riil3 DECIMAL(12,2) DEFAULT 0,
    dukungan_transport DECIMAL(12,2) DEFAULT 0,
    fullboard_meeting DECIMAL(12,2) DEFAULT 0,
    fullday_meeting DECIMAL(12,2) DEFAULT 0,
    transport_jkt_pp DECIMAL(12,2) DEFAULT 0,
    transport_daerah_pp DECIMAL(12,2) DEFAULT 0,
    total_akhir DECIMAL(12,2) NOT NULL,
    catatan TEXT
);

-- 6. Transaksi Honorarium Narasumber
CREATE TABLE transaksi_narsum (
    id VARCHAR(36) PRIMARY KEY,
    pegawai_id VARCHAR(36) REFERENCES master_pegawai(id),
    maksud_tujuan TEXT NOT NULL,
    tanggal DATE NOT NULL,
    tarif_satuan DECIMAL(12,2) NOT NULL,
    jml_oj DECIMAL(5,2) NOT NULL,
    brutto DECIMAL(12,2) NOT NULL,
    pph_percent DECIMAL(4,2) NOT NULL, -- 0.05, 0.15
    pph_nominal DECIMAL(12,2) NOT NULL,
    netto DECIMAL(12,2) NOT NULL,
    nomor_sk VARCHAR(100),
    nomor_memo VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. API Endpoints Specification (RESTful)

### 4.1 Master Data API
- `GET /api/v1/pegawai` - Mengambil daftar pegawai (search, filter, pagination).
- `POST /api/v1/pegawai` - Menambah data pegawai baru.
- `PUT /api/v1/pegawai/:id` - Mengubah data pegawai.
- `GET /api/v1/sbm` - Mengambil daftar SBM per provinsi.
- `PUT /api/v1/sbm/:id` - Mengubah tarif SBM provinsi.

### 4.2 Engine Transaksi API
- `POST /api/v1/dinas/calculate` - Kalkulator cepat / preview estimasi biaya tanpa menyimpan.
- `POST /api/v1/dinas` - Menyimpan paket kegiatan dinas & detail transaksi peserta.
- `GET /api/v1/dinas/:id` - Detail transaksi kegiatan dinas.
- `POST /api/v1/narsum` - Menyimpan pengajuan honorarium narsum.

### 4.3 Export & Document Generator API
- `GET /api/v1/export/memorandum/:kegiatan_id` - Generasi PDF/HTML Memorandum Dinas.
- `GET /api/v1/export/nominatif/:kegiatan_id` - Generasi PDF/HTML Daftar Nominatif.
- `GET /api/v1/export/kwitansi/:kegiatan_id` - Generasi PDF/HTML Kwitansi + Terbilang.
- `GET /api/v1/export/package-zip/:kegiatan_id` - Download seluruh berkas pertanggungjawaban (DOC-01 s.d. DOC-11) dalam bentuk **ZIP file**.

---

## 5. Strategi Generasi Dokumen Cetak (PDF & Print View)

Untuk memastikan dokumen cetak memilik kepatuhan piksel (*pixel perfection*) dengan format cetak resmi APBN saat ini, digunakan strategi **HTML Template + CSS @page Print Styling / Playwright PDF Renderer**:

1. **Template Engine**: Template dokumen dibuat menggunakan HTML5 + CSS Grid/Flexbox yang mengadaptasi layout sheet Excel (seperti `Memorandum.html`, `Nominatif.html`, `Kwitansi.html`).
2. **Standard Paper Size**: Disesuaikan dengan kertas kerja standar pemerintah (**A4** / **F4 (Folio)**).
3. **CSS `@media print` Page Breaks**:
   ```css
   @page {
       size: A4 portrait;
       margin: 15mm;
   }
   .page-break {
       page-break-after: always;
   }
   .table-nominatif {
       width: 100%;
       border-collapse: collapse;
   }
   ```
4. **PDF Generator Service**: Headless Chrome (Playwright) merender halaman HTML menjadi PDF beresolusi tinggi secara otomatis di background.
