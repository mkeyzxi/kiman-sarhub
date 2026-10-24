/**
 * Supabase Database Types
 * Dibuat berdasarkan integrasi email-based auth
 *
 * CATATAN PENTING:
 * 1. Tipe `UserRole` didefinisikan lokal di file ini (bukan di-import dari
 *    `mock-data.ts`) untuk menghindari circular dependency.
 * 2. Semua tipe table menggunakan `type` alias, BUKAN `interface`.
 *    reason: `interface` pada tabel PostgREST memicu batas inferensi tipe
 *    TypeScript sehingga hasil query `.from("users").select(...)` di-infer
 *    sebagai `never` dan `insert()` menolak argumen.
 */

/** Role pengguna yang tersedia di sistem */
export type UserRole =
  | "ADMIN_IT"
  | "PENGELOLA_BMN"
  | "KAKANSAR"
  | "OPERATOR_LAPANGAN";

// ─── Public Schema: users table ──────────────────────────────────────────────

export type UserRow = {
  id: string;
  email: string;
  nip: string | null;
  nama: string;
  role: UserRole;
  aktif: boolean;
  password_changed: boolean;
  /** Opsional — tersedia setelah migration `add_deleted_at.sql` dijalankan */
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type UserInsert = {
  id: string;
  email: string;
  nip?: string | null;
  nama: string;
  role: UserRole;
  aktif?: boolean;
  password_changed?: boolean;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type UserUpdate = {
  id?: string;
  email?: string;
  nip?: string | null;
  nama?: string;
  role?: UserRole;
  aktif?: boolean;
  password_changed?: boolean;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

// ─── Tabel master data (Tahap 2) ────────────────────────────────────────────
//
// Kolom referensi user (penanggung_jawab, user_id, dst.) menyimpan **NIP**
// (text) dengan FK ke public.users(nip) — sesuai keputusan proyek.

export type AsetRow = {
  id: string;
  nama: string;
  kode: string;
  nup: string;
  kategori: string;
  status: string;
  lokasi: string;
  tanggal_penetapan: string | null;
  gambar: string;
  kondisi: string;
  /** NIP penanggung jawab (FK → public.users.nip). */
  penanggung_jawab: string | null;
  keterangan: string;
  kode_barang: string;
  merk: string;
  tipe: string;
  no_stnk: string;
  no_polisi: string;
  tanggal_perolehan: string | null;
  no_psp: string;
  tanggal_psp: string | null;
  nilai_perolehan: number;
  nilai_penyusutan: number;
  nilai_buku: number;
  umur_aset_tahun: number;
  jumlah_foto: number;
  status_penggunaan: string;
  kode_register: string;
  status_bmn: string;
  created_at: string;
  updated_at: string;
};

export type AsetInsert = Omit<AsetRow, "created_at" | "updated_at"> & {
  created_at?: string;
  updated_at?: string;
};

export type AsetUpdate = Partial<AsetInsert>;

export type RiwayatAsetRow = {
  id: number;
  aset_id: string;
  tanggal: string;
  aksi: string;
  keterangan: string;
  /** NIP user (FK → public.users.nip). */
  user_id: string | null;
  created_at: string;
};

export type RiwayatAsetInsert = Omit<RiwayatAsetRow, "id" | "created_at"> & {
  created_at?: string;
};

export type EwsTicketRow = {
  id: string;
  aset_id: string | null;
  judul: string;
  deskripsi: string;
  tingkat_keparahan: string;
  status: string;
  tanggal_buat: string | null;
  tanggal_update: string | null;
  /** NIP petugas (FK → public.users.nip). */
  assigned_to: string | null;
  created_at: string;
};

export type EwsTicketInsert = Omit<EwsTicketRow, "created_at"> & {
  created_at?: string;
};

export type AntreanVerifikasiRow = {
  id: string;
  tipe: string;
  judul: string;
  deskripsi: string;
  status: string;
  tanggal_buat: string | null;
  /** NIP pembuat (FK → public.users.nip). */
  created_by: string | null;
  catatan_revisi: string;
  created_at: string;
};

export type AntreanVerifikasiInsert = Omit<AntreanVerifikasiRow, "created_at"> & {
  created_at?: string;
};

export type ChecklistTemplateRow = {
  id: string;
  nama: string;
  kategori: string;
  periode: string;
  jenis_armada: string;
  sumber: string;
  created_at: string;
};

export type ChecklistItemRow = {
  template_id: string;
  item_id: string;
  label: string;
  wajib: boolean;
  kondisi: string;
  keterangan: string;
  is_kritis: boolean;
};

export type NotificationRow = {
  id: string;
  judul: string;
  pesan: string;
  tipe: string;
  dibaca: boolean;
  tanggal: string;
  created_at: string;
};

export type ActivityLogRow = {
  id: string;
  /** NIP user (FK → public.users.nip). */
  user_id: string | null;
  aksi: string;
  target: string;
  tanggal: string;
  detail: string;
  created_at: string;
};

export type RiwayatOperasiRow = {
  id: string;
  tanggal: string;
  jenis: string;
  lokasi: string;
  durasi: string;
  personel: number;
  hasil: string;
  keterangan: string;
  created_at: string;
};

export type ApprovalRow = {
  id: string;
  kode: string;
  nama_aset: string;
  kategori: string;
  /** NIP pengaju (FK → public.users.nip). */
  pengajuan_oleh: string | null;
  tanggal: string;
  status: string;
  alasan: string;
  rincian: unknown;
  created_at: string;
};

export type LogbookPerjalananRow = {
  id: string;
  tanggal: string;
  jam_berangkat: string;
  jam_kembali: string;
  rute: string;
  tujuan: string;
  kategori_unit: string;
  jenis_unit: string;
  nahkoda: string;
  jumlah_personel: number;
  bbm_sebelum: string;
  bbm_sesudah: string;
  endurance_awal: string;
  endurance_akhir: string;
  km_sebelum: string;
  km_sesudah: string;
  status: string;
  catatan: string;
  tanggal_simpan: string | null;
  tanggal_lengkap: string | null;
  created_at: string;
};

export type ChecklistHarianRow = {
  id: string;
  tanggal: string;
  unit: string;
  jenis_unit: string;
  template_id: string | null;
  pemeriksa: string;
  /** NIP pemeriksa (FK → public.users.nip). */
  pemeriksa_id: string | null;
  aset_id: string | null;
  status: string;
  item_checked: number;
  item_total: number;
  items: unknown;
  catatan: string;
  created_at: string;
};

export type BeritaAcaraRow = {
  id: string;
  tanggal: string;
  nama_aset: string;
  kode_aset: string;
  nomor: string;
  aset_id: string | null;
  checklist_id: string;
  tiket_id: string | null;
  /** NIP pengaju (FK → public.users.nip). */
  pengaju_id: string | null;
  pelapor: string;
  pelapor_jabatan: string;
  pengaju_nama: string;
  pengaju_jabatan: string;
  tanggal_buat: string | null;
  tanggal_update: string | null;
  status: string;
  kendala: unknown;
  foto_bukti: unknown;
  uraian: string;
  alasan_penolakan: string;
  keterangan: string;
  created_at: string;
};

/**
 * Tipe Database untuk generic Supabase client.
 * Format ini mengikuti hasil generate `supabase gen types`.
 */
export type Database = {
  public: {
    Tables: {
      users: {
        Row: UserRow;
        Insert: UserInsert;
        Update: UserUpdate;
        Relationships: [];
      };
      asets: {
        Row: AsetRow;
        Insert: AsetInsert;
        Update: AsetUpdate;
        Relationships: [
          {
            foreignKeyName: "asets_penanggung_jawab_fkey";
            columns: ["penanggung_jawab"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["nip"];
          }
        ];
      };
      riwayat_aset: {
        Row: RiwayatAsetRow;
        Insert: RiwayatAsetInsert;
        Update: Partial<RiwayatAsetInsert>;
        Relationships: [
          {
            foreignKeyName: "riwayat_aset_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["nip"];
          }
        ];
      };
      ews_tickets: {
        Row: EwsTicketRow;
        Insert: EwsTicketInsert;
        Update: Partial<EwsTicketInsert>;
        Relationships: [];
      };
      antrean_verifikasi: {
        Row: AntreanVerifikasiRow;
        Insert: AntreanVerifikasiInsert;
        Update: Partial<AntreanVerifikasiInsert>;
        Relationships: [];
      };
      checklist_templates: {
        Row: ChecklistTemplateRow;
        Insert: Omit<ChecklistTemplateRow, "created_at">;
        Update: Partial<Omit<ChecklistTemplateRow, "created_at">>;
        Relationships: [];
      };
      checklist_items: {
        Row: ChecklistItemRow;
        Insert: ChecklistItemRow;
        Update: Partial<ChecklistItemRow>;
        Relationships: [];
      };
      notifications: {
        Row: NotificationRow;
        Insert: Omit<NotificationRow, "created_at">;
        Update: Partial<Omit<NotificationRow, "created_at">>;
        Relationships: [];
      };
      activity_log: {
        Row: ActivityLogRow;
        Insert: Omit<ActivityLogRow, "created_at">;
        Update: Partial<Omit<ActivityLogRow, "created_at">>;
        Relationships: [];
      };
      riwayat_operasi: {
        Row: RiwayatOperasiRow;
        Insert: Omit<RiwayatOperasiRow, "created_at">;
        Update: Partial<Omit<RiwayatOperasiRow, "created_at">>;
        Relationships: [];
      };
      approvals: {
        Row: ApprovalRow;
        Insert: Omit<ApprovalRow, "created_at">;
        Update: Partial<Omit<ApprovalRow, "created_at">>;
        Relationships: [];
      };
      logbook_perjalanan: {
        Row: LogbookPerjalananRow;
        Insert: Omit<LogbookPerjalananRow, "created_at">;
        Update: Partial<Omit<LogbookPerjalananRow, "created_at">>;
        Relationships: [];
      };
      checklist_harian: {
        Row: ChecklistHarianRow;
        Insert: Omit<ChecklistHarianRow, "created_at">;
        Update: Partial<Omit<ChecklistHarianRow, "created_at">>;
        Relationships: [];
      };
      berita_acara: {
        Row: BeritaAcaraRow;
        Insert: Omit<BeritaAcaraRow, "created_at">;
        Update: Partial<Omit<BeritaAcaraRow, "created_at">>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      /** Operator menyerahkan kerusakan: ubah status+kondisi aset + riwayat. */
      serahkan_kerusakan_aset: {
        Args: {
          p_aset_id: string;
          p_kondisi: string;
          p_keterangan: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      user_role: UserRole;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// ─── Convenience types ───────────────────────────────────────────────────────

/**
 * User profile dari tabel public.users.
 * `nip` & `deleted_at` bisa null.
 */
export type UserProfile = UserRow;

/**
 * Form data untuk login (NIP-based authentication).
 * `email` masih ada untuk kompatibilitas — lihat `loginWithEmail()`.
 */
export type LoginFormData = {
  nip: string;
  password: string;
};

/**
 * Form data untuk login lama (email-based) — masih didukung,
 * tapi bukan jalur utama. Jalur utama sekarang `loginWithNip()`.
 */
export type LoginEmailFormData = {
  email: string;
  password: string;
};

/**
 * Metadata khusus untuk fitur impersonation ("Masuk Sebagai" Mode Dev).
 */
export type ImpersonationMetadata = {
  impersonating?: string;
  dev_mode?: boolean;
  dev_role?: UserRole;
  [key: string]: unknown;
};

// CATATAN: Module augmentation untuk `@supabase/supabase-js` SENGAJA tidak
// digunakan di sini. Augmentasi `interface User` / `interface Session`
// membuat TypeScript mengalami circular type inference sehingga hasil
// query `.from("users").select(...)` menjadi `never`.
//
// Jika metadata dev dibutuhkan, gunakan type assertion lokal di tempat
// yang membutuhkannya (lihat `src/lib/auth.ts` → `ImpersonationMetadata`).
