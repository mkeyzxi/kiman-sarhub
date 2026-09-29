# Sistem Desain (Design System) - Dashboard Pengadaan Barang

Dokumen ini berisi panduan gaya (style guide) dan struktur desain untuk pengembangan antarmuka (UI) Sistem Pengadaan Barang menggunakan framework Tailwind CSS.

---

## 1. Palet Warna (Color Palette)

Desain ini menghindari penggunaan warna hitam pekat (`#000000`) agar mata pengguna tidak cepat lelah, dan menggunakan palet warna `slate` (abu-abu kebiruan) untuk kesan modern dan elegan.

### Warna Utama (Primary)
*   **Primary (Base):** `#EF6905` (Oranye) — Digunakan untuk tombol utama, link aktif, ikon aktif, dan elemen call-to-action (CTA).
*   **Primary Hover:** `#d45d04` — Digunakan untuk efek *hover* pada tombol utama.
*   **Primary Light:** `#fdf0e6` — Digunakan untuk latar belakang elemen aktif (seperti menu sidebar yang sedang dipilih) atau *badge* status.

### Warna Teks (Text Colors)
*   **Heading/Judul Utama:** `slate-800` (`#1e293b`) — Warna paling gelap dalam sistem ini, digunakan untuk H1, judul kartu, dan teks penting.
*   **Teks Paragraf/Body:** `slate-600` (`#475569`) — Digunakan untuk teks biasa, label tabel, dan nama menu.
*   **Teks Keterangan/Sub-teks:** `slate-500` (`#64748b`) — Digunakan untuk tanggal, deksripsi kecil, dan *placeholder* input.

### Warna Latar (Background Colors)
*   **Latar Utama Aplikasi:** `slate-50` (`#f8fafc`) — Latar belakang untuk area konten utama. Memberikan kontras lembut dengan kartu konten.
*   **Latar Komponen (Card/Sidebar/Header):** `white` (`#ffffff`) — Digunakan pada panel, *card* statistik, tabel, header, dan sidebar.
*   **Garis Pemisah (Borders):** `slate-200` (`#e2e8f0`) & `slate-100` (`#f1f5f9`).

### Warna Status (Semantic Colors)
*   **Menunggu (Pending):** `primary` (`#EF6905`) dengan latar `primary-light`.
*   **Diproses (Processing):** `amber-500` dengan latar `amber-50` (Kuning/Emas).
*   **Selesai (Success):** `emerald-500` dengan latar `emerald-50` (Hijau).
*   **Ditolak (Danger):** `rose-600` dengan latar `rose-100` (Merah).

---

## 2. Tipografi (Typography)

Sistem menggunakan **satu jenis font** untuk menjaga konsistensi, yaitu **Inter** (sans-serif), yang sangat baik untuk antarmuka dashboard karena tingkat keterbacaannya yang tinggi.

*   **Font Family:** `'Inter', sans-serif`
*   **H1 (Judul Halaman):** 24px (`text-2xl`), Font Weight: Bold (`font-bold`), Warna: `slate-800`.
*   **H2 (Judul Bagian/Card):** 18px (`text-lg`), Font Weight: Semi-Bold (`font-semibold`), Warna: `slate-800`.
*   **Teks Body (Tabel/Paragraf):** 14px (`text-sm`), Font Weight: Normal/Medium, Warna: `slate-600`.
*   **Teks Keterangan (Caption):** 12px (`text-xs`), Font Weight: Normal, Warna: `slate-500`.

---

## 3. Komponen Tombol (Buttons)

Tombol didesain dengan sudut sedikit melengkung (rounded) dan bayangan (shadow) halus untuk elemen utama.

1.  **Tombol Utama (Primary Button)**
    *   **Style:** Background `#EF6905`, Text `white`, `rounded-lg` (radius 8px).
    *   **Hover:** Background berubah menjadi `#d45d04` dengan transisi halus (`transition-colors`).
    *   **Contoh Penggunaan:** Tombol "Buat Pengajuan", "Simpan", "Kirim".
2.  **Tombol Aksi Ikon (Icon Action Button)**
    *   **Style:** Latar transparan, Ikon berwarna `slate-400`.
    *   **Hover:** Warna ikon berubah menjadi `#EF6905`.
    *   **Contoh Penggunaan:** Ikon "mata" (Lihat detail) di dalam tabel, Ikon lonceng (notifikasi).
3.  **Tombol Menu Aktif (Sidebar Active)**
    *   **Style:** Background `#fdf0e6`, Text & Icon `#EF6905`, `rounded-lg`.

---

## 4. Gaya Ikon (Iconography)

Menggunakan **FontAwesome** (atau bisa disesuaikan dengan Heroicons).
*   **Ikon Navigasi Aktif:** Menggunakan warna `#EF6905` agar pengguna tahu sedang berada di halaman mana.
*   **Ikon Navigasi Pasif:** Menggunakan warna `slate-400`.
*   **Ikon Kartu Statistik:** Ukuran besar (20-24px), diletakkan di dalam kotak membulat (`w-12 h-12 rounded-lg`) dengan warna latar yang sangat transparan sesuai dengan status.

---

## 5. Struktur Layout (Dari Awal hingga Akhir)

Layout menggunakan model **Fixed Full Screen** (`h-screen`) berbasis **Flexbox**. Artinya, halaman utama tidak akan pernah bergeser ke bawah (no window scrollbar), melainkan hanya area konten tengahnya saja yang bisa di-*scroll*.

### A. Pembagian Makro (Macro Layout)
Layar dibagi menjadi dua kolom utama (Flex Row):
1.  **Kiri (Sidebar):** Lebar tetap (fixed width `w-64` atau 256px).
2.  **Kanan (Wrapper Konten):** Fleksibel mengisi sisa ruang layar (`flex-1`).

### B. Detail Bagian (Micro Layout)

#### 1. Sidebar (Menu Navigasi Kiri)
*   **Posisi:** Kiri statis, disembunyikan di layar HP (mobile) dan hanya muncul pada ukuran tablet/desktop (`hidden md:flex`).
*   **Struktur Dalam:**
    *   **Header Logo (Atas):** Tinggi 64px (`h-16`), berisi Logo dan Teks aplikasi. Dipisahkan border bawah garis tipis.
    *   **Daftar Menu (Tengah):** Area yang bisa di-scroll (`overflow-y-auto`). Jarak antar menu menggunakan `space-y-1`.
    *   **Footer Akun (Bawah):** Area Logout, tetap menempel di bawah (border atas).

#### 2. Header (Bilah Atas)
*   **Posisi:** Berada di atas Wrapper Konten Kanan.
*   **Karakteristik:** Tinggi 64px (`h-16`), background putih, border bawah `slate-200`.
*   **Isi:** 
    *   Kiri: Tombol menu mobile (hamburger icon).
    *   Tengah/Kiri: Kolom Pencarian (Search bar) berbentuk pil (`rounded-full`) dengan latar `slate-100`.
    *   Kanan: Ikon Notifikasi (dengan titik notif), garis vertikal pemisah, dan Profil Pengguna (Nama, Jabatan, Avatar).

#### 3. Main Content (Area Konten Utama)
*   **Posisi:** Di bawah Header, mengambil sisa tinggi layar (`flex-1`).
*   **Karakteristik:** Background `slate-50`. **Hanya bagian ini yang bisa di-scroll secara vertikal** (`overflow-y-auto`). Memiliki *padding* seragam di semua sisi (`p-6`).
*   **Struktur Konten Biasa:**
    1.  **Page Title (Judul Halaman):** Berisi Judul (H1), Sub-judul/deskripsi, dan tombol aksi (Primary Button) di ujung kanan.
    2.  **Stats Cards (Kartu Statistik):** Menggunakan sistem Grid. 1 kolom di HP, 2 di tablet, 4 di desktop (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`). Setiap kartu berisi Teks abu-abu (Label), Angka tebal besar (Nilai), dan Ikon di kanan.
    3.  **Data Table (Tabel Data):** 
        *   Dibungkus dengan *card* putih (`bg-white rounded-xl shadow-sm border`).
        *   Tabel merespon pada layar kecil dengan bisa digeser horizontal (`overflow-x-auto`).
        *   Baris tabel (Row) dipisahkan oleh garis tipis (`divide-y divide-slate-100`) dan memiliki efek berubah warna sedikit (`hover:bg-slate-50/50`) ketika *cursor* diarahkan ke baris tersebut.
```