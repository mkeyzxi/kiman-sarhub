# PRODUCT REQUIREMENTS DOCUMENT (PRD)

## Sistem Informasi Aset Terpadu (Dashboard Siap SAR)

**Unit Kerja:** Kantor Pencarian dan Pertolongan Kelas B Mamuju

---

## 1. Ringkasan Eksekutif

Dashboard Siap SAR adalah platform manajemen aset berbasis **Progressive Web App (PWA)** dan **Web Dashboard** yang dirancang untuk menegakkan **Chain of Custody** (rantai pertanggungjawaban) Barang Milik Negara (BMN).

Sistem ini mengeliminasi masalah *"barang tidak diketahui siapa yang bawa"* melalui:

- Sistem checkout/check-in
- Pemindaian instan
- Penguncian status aset otomatis
- Early Warning System (EWS) untuk pemeliharaan

---

## 2. Rekomendasi Tech Stack (Solo Developer 1 Bulan)

Untuk memenuhi deadline 1 bulan oleh 1 orang, pengembangan **dilarang** menggunakan arsitektur microservices atau memisahkan repo Frontend/Backend.

| Komponen | Teknologi | Keterangan |
|----------|-----------|------------|
| **Framework Utama** | Next.js (App Router) | Satu codebase untuk Mobile PWA & Web Admin |
| **Backend & Database** | Supabase (PostgreSQL) | BaaS untuk Auth, Database, Storage, dan Realtime WebSockets otomatis |
| **UI Components** | Tailwind CSS + shadcn/ui | Komponen UI yang konsisten |
| **Offline Engine (Mobile)** | Dexie.js (IndexedDB) + Service Workers (PWA) | Menjalankan aplikasi tanpa internet |
| **Scanner** | html5-qrcode | Akses kamera langsung di web browser |

---

## 3. Matriks Peran Pengguna (Role-Based Access Control)

Sistem memiliki **5 Role** utama:

| Role | Contoh | Tanggung Jawab |
|------|--------|---------------|
| **Administrator** (Tim IT) | — | Kelola master data, backup data, pantau System Log |
| **Pengelola BMN** (Admin Aset) | Kak Medlyn | Eksekutor data harian. Menambah data dari SAKTI/SIMAN, membuat tiket maintenance, merespons EWS |
| **Verifikator** (Kaur Umum) | Pak Kaul | Memeriksa hasil inventarisasi, laporan kerusakan, dan menyetujui draf data BMN sebelum sah masuk sistem |
| **Pimpinan** (Kepala Kantor) | Pak Kansar | Memantau Readiness Index, approval final data BMN, dan memantau notifikasi real-time |
| **Pengguna** (Personel Lapangan / Rescuer) | — | Menggunakan PWA Mobile untuk scan barcode, checkout/check-in operasi, dan isi checklist kesiapan |

---

## 4. Alur Kerja Sistem Utama (Core Workflows)

### A. Alur Sinkronisasi Master Data (SIMAN / SAKTI)

Berdasarkan Flowchart Master Data, sistem menerima data aset dari sistem eksternal (SIMAN/SAKTI) melalui mekanisme berikut:

1. **Import Data** — Pengelola BMN mengimpor file dari SIMAN/SAKTI
2. **Validasi Otomatis** — Sistem memvalidasi format dan kelengkapan data
3. **Verifikasi** — Verifikator memeriksa dan menyetujui data
4. **Publikasi** — Data resmi masuk ke Master Data BMN

### B. Alur Checkout / Check-in Aset

1. **Scan** — Personel lapangan memindai QR Code aset
2. **Checkout** — Personel meminjam aset (status berubah menjadi "Dipinjam")
3. **Check-in** — Personel mengembalikan aset (status berubah menjadi "Siaga")
4. **Handshake** — Serah-terima antar personel dengan konfirmasi digital

### C. Alur Early Warning System (EWS)

1. **Deteksi** — Sistem mendeteksi aset yang rusak atau habis masa pakai
2. **Tiket Maintenance** — Pengelola BMN membuat tiket perbaikan
3. **Proses Perbaikan** — Status aset menjadi "Sedang Diperbaiki"
4. **Selesai** — Aset kembali ke status "Siaga"

---

## 5. Struktur Halaman & Routing (Next.js App Router)

Berdasarkan PRD dan kebutuhan alur sistem untuk 5 role pengguna, estimasi total keseluruhan mencapai sekitar **16 hingga 18 halaman/rute utama**.

> **Catatan Penting:** Untuk menghemat waktu pengerjaan (mengingat ini dikerjakan oleh 1 programmer), banyak aksi seperti pengisian form atau konfirmasi handshake sebaiknya menggunakan **Pop-up/Modal Dialog** dari shadcn/ui alih-alih membuat halaman utuh yang baru.

### 5.1 Halaman Global (Shared) — 3 Halaman

| Route | Keterangan |
|-------|------------|
| `/login` | Gerbang otentikasi tunggal (SSO) untuk kelima role (Admin, Pengelola, Verifikator, Pimpinan, Lapangan) |
| `/404` | Halaman standar jika URL tidak ditemukan |
| `/403` | Halaman penolakan akses (misal: personel lapangan mencoba mengakses URL Dasbor Pimpinan) |

### 5.2 Modul Mobile PWA (Personel Lapangan) — 4 Halaman Utama

| Route | Keterangan |
|-------|------------|
| `/mobile/dashboard` | Beranda PWA berisi daftar barang yang sedang dipegang (status checkout) dan notifikasi handshake serah-terima yang menggantung |
| `/mobile/scan` | Layar full-screen kamera untuk Zero-Friction Scan |
| `/mobile/aset/[id]` | Halaman detail singkat aset setelah di-scan, berisi tombol aksi dinamis (Checkout Pinjam, Check-in Kembali, atau Handshake Serah-Terima) |
| `/mobile/checklist/[id]` | Form dinamis untuk mengisi parameter kelayakan barang (Pra-Operasi / Pasca-Operasi) |

### 5.3 Modul Pengelola BMN (Admin Aset) — 4 Halaman Utama

| Route | Keterangan |
|-------|------------|
| `/dashboard/bmn` | Tabel utama Master Data (format SIMAN V2) dengan fitur pencarian dan filter status (Siaga, Dipinjam, Rusak) |
| `/dashboard/bmn/tambah` | Form kompleks untuk menginput draf data aset baru dan upload dokumen (BPKB/STNK) |
| `/dashboard/bmn/[id]` | Detail aset utuh yang mencakup riwayat pemakaian (Audit Trail) dan tombol Generator/Cetak Label QR Code |
| `/dashboard/ews` | Pusat kendali (Panel EWS) yang menampilkan daftar antrean barang rusak dan manajemen status "Tiket Maintenance" |

### 5.4 Modul Verifikator — 2 Halaman Utama

| Route | Keterangan |
|-------|------------|
| `/dashboard/verifikasi` | Tabel daftar antrean draf data aset atau laporan kerusakan yang menunggu diperiksa |
| `/dashboard/verifikasi/[id]` | Halaman komparasi detail untuk menyetujui data atau mengembalikannya ke Pengelola BMN dengan catatan revisi |

### 5.5 Modul Pimpinan (Executive) — 3 Halaman Utama

| Route | Keterangan |
|-------|------------|
| `/dashboard/executive` | Layar utama (Live Monitoring) berisi grafik Readiness Index secara real-time dan alert jika kesiapan alat di bawah 95% |
| `/dashboard/executive/audit` | Papan Audit Kepatuhan berupa tabel ranking personel yang paling sering telat mengembalikan barang atau mengabaikan checklist |
| `/dashboard/executive/approval` | Daftar klik cepat untuk Approval tahap akhir terhadap BMN baru yang sudah lolos dari Verifikator |

---

## 6. Strategi Pengembangan Solo Developer

Untuk solo developer, strategi krusialnya adalah **memusatkan kerumitan di komponen, bukan di halaman**.

**Contoh implementasi:**

- Saat Pengelola BMN ingin merespons panel EWS menjadi *"Sedang Diperbaiki"*, jangan buat halaman `/dashboard/ews/edit` baru
- Cukup gunakan **Slide-over** atau **Dialog Modal** di halaman yang sama agar proses kerja terasa jauh lebih cepat

---

## 7. Ringkasan Jumlah Halaman

| Modul | Jumlah Halaman |
|-------|----------------|
| Global (Shared) | 3 |
| Mobile PWA | 4 |
| Pengelola BMN | 4 |
| Verifikator | 2 |
| Pimpinan | 3 |
| **Total** | **16** |
