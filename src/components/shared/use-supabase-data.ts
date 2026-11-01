/**
 * Supabase data hooks untuk semua halaman master data.
 *
 * - **Sumber data**: Supabase (anon key, session via @supabase/ssr) → RLS
 *   menentukan baris yang terlihat per role.
 * - **Error**: TIDAK ada fallback mock — halaman menampilkan state error
 *   (skeleton saat loading, kartu error + tombol coba lagi saat gagal).
 * - Mapping snake_case → camelCase ada di `supabase-mock-mapper.ts`.
 * - Identitas user memakai **NIP (text)**; FK `public.users(nip)`.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { Database } from "@/types/supabase";
import type {
  AsetRow,
  RiwayatAsetRow,
  LogbookPerjalananRow,
  ChecklistHarianRow,
  EwsTicketRow,
  NotificationRow,
  ActivityLogRow,
  RiwayatOperasiRow,
  BeritaAcaraRow,
  AntreanVerifikasiRow,
  ChecklistTemplateRow,
  ChecklistItemRow,
  UserRow,
} from "@/types/supabase";
import {
  mapAsets,
  mapLogbooks,
  mapChecklists,
  mapEwsTickets,
  mapNotifications,
  mapActivityLog,
  mapRiwayatOperasi,
  mapBeritaAcara,
  mapAntreanVerifikasi,
  mapChecklistTemplates,
  type AsetMapped,
  type LogbookMapped,
  type ChecklistMapped,
  type EwsTicketMapped,
  type NotifikasiMapped,
  type LogAktivitasMapped,
  type RiwayatOperasiMapped,
  type BeritaAcaraMapped,
  type AntreanVerifikasiMapped,
  type ChecklistTemplateMapped,
} from "@/components/shared/supabase-mock-mapper";

/** Nama tabel yang terdaftar di `Database["public"]["Tables"]`. */
type TableName = keyof Database["public"]["Tables"];

// ─── Data hidup: menyembuhkan tampilan usang ─────────────────────────────────

interface OpsiDataHidup {
  /** Fetch berulang yang aman dipanggil (`fetch_` dari hook). */
  ambil: () => void;
  /** True bila data pertama sudah termuat — mencegah fetch dobel saat pasang. */
  siap: () => boolean;
}

/**
 * Pembaruan hidup: ambil ulang data saat window kembali fokus, saat tab
 * kembali terlihat, dan tiap 60 detik selama tab terbuka.
 *
 * Tanpa ini, perubahan yang terjadi dari halaman lain (mis. aset kembali
 * "Standby" setelah tiket maintenance selesai) tidak pernah dibaca halaman
 * dashboard yang masih terpasang — pengguna melihat badge usang sampai
 * browser dimuat ulang.
 */
function gunakanDataHidup(opsi: OpsiDataHidup): void {
  // Tahan callback terbaru di ref supaya listener tidak perlu dipasang ulang.
  const konsisten = useRef(opsi);
  konsisten.current = opsi;
  useEffect(() => {
    const layak = () =>
      typeof document !== "undefined" &&
      document.visibilityState === "visible" &&
      konsisten.current.siap();
    const saatFokus = () => {
      if (layak()) konsisten.current.ambil();
    };
    const saatTabDilihat = () => {
      if (layak()) konsisten.current.ambil();
    };
    const detak = setInterval(() => {
      if (layak()) konsisten.current.ambil();
    }, 60_000);
    window.addEventListener("focus", saatFokus);
    document.addEventListener("visibilitychange", saatTabDilihat);
    return () => {
      clearInterval(detak);
      window.removeEventListener("focus", saatFokus);
      document.removeEventListener("visibilitychange", saatTabDilihat);
    };
  }, []);
}

export interface SupabaseQueryResult<M> {
  data: M[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UrutanKolom {
  col: string;
  ascending?: boolean;
}

/** Tipe user Supabase yang dipakai halaman admin/pimpinan. */
export interface UserInfo {
  id: string;
  nip: string;
  nama: string;
  email: string;
  role: string;
  aktif: boolean;
}

function mapUser(r: UserRow): UserInfo {
  return {
    id: r.id,
    nip: r.nip ?? "",
    nama: r.nama,
    email: r.email,
    role: r.role,
    aktif: r.aktif,
  };
}

/**
 * Hook generik: fetch 1 tabel + mapping.
 *
 * Pemanggilan `setState` hanya dilakukan **setelah await** (async boundary),
 * sehingga tidak ada setState sinkron di dalam effect — aman terhadap
 * aturan lint `react-hooks/set-state-in-effect`.
 */
function useSupabaseTable<T, M>(
  table: TableName,
  select: string,
  mapFn: (rows: T[]) => M[],
  orderBy?: UrutanKolom
): SupabaseQueryResult<M> {
  const [rows, setRows] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const fetch_ = useCallback(async () => {
    try {
      const supa = getSupabaseBrowserClient();
      let builder = supa.from(table).select(select as never);
      if (orderBy) {
        builder = builder.order(orderBy.col, {
          ascending: orderBy.ascending ?? false,
        });
      }
      const { data, error: err } = await builder;
      if (!mounted.current) return;
      if (err) {
        setError(err.message);
      } else {
        setRows((data as unknown as T[]) ?? []);
        setError(null);
      }
      setLoading(false);
    } catch (e) {
      if (!mounted.current) return;
      setError(e instanceof Error ? e.message : "Gagal memuat data");
      setLoading(false);
    }
    // orderBy opsional: kolom & arah dipecah ke primitif agar tidak
    // memicu re-fetch karena object identity berubah tiap render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, select, orderBy?.col, orderBy?.ascending]);

  useEffect(() => {
    mounted.current = true;
    // Defer fetch ke task berikut (0 ms) agar effect body tidak memanggil
    // setState sinkron — pola lint-safe untuk efek fetch async.
    const t = setTimeout(() => void fetch_(), 0);
    return () => {
      mounted.current = false;
      clearTimeout(t);
    };
  }, [fetch_]);

  const data = useMemo(
    () => (rows !== null ? mapFn(rows) : []),
    [rows, mapFn]
  );

  const refetch = useCallback(() => {
    setLoading(true);
    void fetch_();
  }, [fetch_]);

  return { data, loading, error, refetch };
}

// ─── Hooks per domain ────────────────────────────────────────────────────────

/** Aset + seluruh riwayatnya (2 query digabung). */
export function useAsets(): SupabaseQueryResult<AsetMapped> {
  const [asetRows, setAsetRows] = useState<AsetRow[] | null>(null);
  const [riwRows, setRiwRows] = useState<RiwayatAsetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const fetch_ = useCallback(async () => {
    try {
      const supa = getSupabaseBrowserClient();
      const [{ data: aData, error: aErr }, { data: rData }] = await Promise.all([
        supa.from("asets").select("*"),
        supa.from("riwayat_aset").select("*"),
      ]);
      if (!mounted.current) return;
      if (aErr) {
        setError(aErr.message);
      } else {
        setAsetRows((aData as unknown as AsetRow[]) ?? []);
        setRiwRows((rData as unknown as RiwayatAsetRow[]) ?? []);
        setError(null);
      }
      setLoading(false);
    } catch (e) {
      if (!mounted.current) return;
      setError(e instanceof Error ? e.message : "Gagal memuat aset");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    // Defer fetch ke task berikut (0 ms) agar effect body tidak memanggil
    // setState sinkron — pola lint-safe untuk efek fetch async.
    const t = setTimeout(() => void fetch_(), 0);
    return () => {
      mounted.current = false;
      clearTimeout(t);
    };
  }, [fetch_]);

  const data = useMemo(
    () => (asetRows !== null ? mapAsets(asetRows, riwRows) : []),
    [asetRows, riwRows]
  );

  // Data hidup — hanya setelah ambil pertama selesai (tidak dobel saat pasang).
  const sudahDimuat = useRef(false);
  useEffect(() => {
    if (asetRows !== null) sudahDimuat.current = true;
  }, [asetRows]);
  gunakanDataHidup({ ambil: fetch_, siap: () => sudahDimuat.current });

  const refetch = useCallback(() => {
    setLoading(true);
    void fetch_();
  }, [fetch_]);

  return { data, loading, error, refetch };
}

/** Aset tunggal + riwayatnya (untuk halaman detail/edit). */
export interface UseAsetByIdResult {
  data: AsetMapped | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAsetById(id: string | undefined): UseAsetByIdResult {
  const [row, setRow] = useState<AsetRow | null>(null);
  const [riw, setRiw] = useState<RiwayatAsetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const fetch_ = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    try {
      const supa = getSupabaseBrowserClient();
      const [a, r] = await Promise.all([
        supa.from("asets").select("*").eq("id", id).maybeSingle(),
        supa.from("riwayat_aset").select("*").eq("aset_id", id),
      ]);
      if (!mounted.current) return;
      if (a.error) {
        setError(a.error.message);
      } else {
        setRow((a.data as AsetRow | null) ?? null);
        setRiw((r.data as unknown as RiwayatAsetRow[]) ?? []);
        setError(null);
      }
      setLoading(false);
    } catch (e) {
      if (!mounted.current) return;
      setError(e instanceof Error ? e.message : "Gagal memuat aset");
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    mounted.current = true;
    // Defer fetch ke task berikut (0 ms) agar effect body tidak memanggil
    // setState sinkron — pola lint-safe untuk efek fetch async.
    const t = setTimeout(() => void fetch_(), 0);
    return () => {
      mounted.current = false;
      clearTimeout(t);
    };
  }, [fetch_]);

  const data = useMemo(
    () => (row !== null ? (mapAsets([row], riw)[0] ?? null) : null),
    [row, riw]
  );

  const refetch = useCallback(() => {
    setLoading(true);
    void fetch_();
  }, [fetch_]);

  return { data, loading, error, refetch };
}

export function useLogbooks(): SupabaseQueryResult<LogbookMapped> {
  return useSupabaseTable<LogbookPerjalananRow, LogbookMapped>(
    "logbook_perjalanan",
    "*",
    mapLogbooks,
    { col: "tanggal_simpan", ascending: false }
  );
}

export function useChecklists(): SupabaseQueryResult<ChecklistMapped> {
  return useSupabaseTable<ChecklistHarianRow, ChecklistMapped>(
    "checklist_harian",
    "*",
    mapChecklists,
    { col: "tanggal", ascending: false }
  );
}

export function useChecklistTemplates(): SupabaseQueryResult<ChecklistTemplateMapped> {
  const [tplRows, setTplRows] = useState<ChecklistTemplateRow[] | null>(null);
  const [itemRows, setItemRows] = useState<ChecklistItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const fetch_ = useCallback(async () => {
    try {
      const supa = getSupabaseBrowserClient();
      const [{ data: tData, error: tErr }, { data: iData }] = await Promise.all([
        supa.from("checklist_templates").select("*"),
        supa.from("checklist_items").select("*"),
      ]);
      if (!mounted.current) return;
      if (tErr) {
        setError(tErr.message);
      } else {
        setTplRows((tData as unknown as ChecklistTemplateRow[]) ?? []);
        setItemRows((iData as unknown as ChecklistItemRow[]) ?? []);
        setError(null);
      }
      setLoading(false);
    } catch (e) {
      if (!mounted.current) return;
      setError(e instanceof Error ? e.message : "Gagal memuat template");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    // Defer fetch ke task berikut (0 ms) agar effect body tidak memanggil
    // setState sinkron — pola lint-safe untuk efek fetch async.
    const t = setTimeout(() => void fetch_(), 0);
    return () => {
      mounted.current = false;
      clearTimeout(t);
    };
  }, [fetch_]);

  const data = useMemo(
    () => (tplRows !== null ? mapChecklistTemplates(tplRows, itemRows) : []),
    [tplRows, itemRows]
  );

  const refetch = useCallback(() => {
    setLoading(true);
    void fetch_();
  }, [fetch_]);

  return { data, loading, error, refetch };
}

export function useEwsTickets(): SupabaseQueryResult<EwsTicketMapped> {
  return useSupabaseTable<EwsTicketRow, EwsTicketMapped>(
    "ews_tickets",
    "*",
    mapEwsTickets,
    { col: "tanggal_buat", ascending: false }
  );
}

export function useNotifications(): SupabaseQueryResult<NotifikasiMapped> {
  return useSupabaseTable<NotificationRow, NotifikasiMapped>(
    "notifications",
    "*",
    mapNotifications,
    { col: "tanggal", ascending: false }
  );
}

export function useActivityLog(): SupabaseQueryResult<LogAktivitasMapped> {
  return useSupabaseTable<ActivityLogRow, LogAktivitasMapped>(
    "activity_log",
    "*",
    mapActivityLog,
    { col: "tanggal", ascending: false }
  );
}

export function useRiwayatOperasi(): SupabaseQueryResult<RiwayatOperasiMapped> {
  return useSupabaseTable<RiwayatOperasiRow, RiwayatOperasiMapped>(
    "riwayat_operasi",
    "*",
    mapRiwayatOperasi,
    { col: "tanggal", ascending: false }
  );
}

export function useBeritaAcara(): SupabaseQueryResult<BeritaAcaraMapped> {
  return useSupabaseTable<BeritaAcaraRow, BeritaAcaraMapped>(
    "berita_acara",
    "*",
    mapBeritaAcara,
    { col: "tanggal_buat", ascending: false }
  );
}

export function useAntreanVerifikasi(): SupabaseQueryResult<AntreanVerifikasiMapped> {
  return useSupabaseTable<AntreanVerifikasiRow, AntreanVerifikasiMapped>(
    "antrean_verifikasi",
    "*",
    mapAntreanVerifikasi,
    { col: "tanggal_buat", ascending: false }
  );
}

/** Daftar pengguna (dipakai halaman Admin IT). */
export function useSupabaseUsers(): SupabaseQueryResult<UserInfo> {
  return useSupabaseTable<UserRow, UserInfo>(
    "users",
    "*",
    // Urutkan di luar query agar tidak andalkan kolom tertentu:
    (rows) =>
      [...rows].map(mapUser).sort((a, b) => a.nama.localeCompare(b.nama))
  );
}

// ─── KARTU PENANGGUNG JAWAB (monitor alur kerusakan → perbaikan) ───────────

export interface KartuPJ {
  /** NIP penanggung jawab (kunci unik kartu). */
  nip: string;
  /** Nama operator — dari DB users; fallback mock bila belum ada di DB. */
  nama: string;
  /** Aset yang sedang dimonitor (yang punya BA atau tiket EWS). */
  aset: {
    id: string;
    kode: string;
    nama: string;
    status: string;
    /** Merek aset (bila ada) — untuk menampilkan "nama · merek · tipe". */
    merk?: string;
    /** Tipe aset (bila ada). */
    tipe?: string;
  };
  /** Tahap alur saat ini: 0–4 (lihat `labelTahap`). */
  tahap: number;
  /** Label ramah tahap untuk kartu. */
  labelTahap: string;
  /** Warna badge tahap. */
  warnaTahap: "slate" | "blue" | "amber" | "emerald";
  /** Tiket EWS yang sedang / sudah dikerjakan (undefined bila belum ada). */
  tiket?: {
    id: string;
    judul: string;
    status: "Menunggu" | "Diproses" | "Selesai";
  };
  /** Perbaikan sudah selesai (EWS tiket status "Selesai"). */
  perbaikanSelesai: boolean;
}

export const labelTahap: Record<number, string> = {
  0: "Menunggu laporan",
  1: "Menunggu nomor surat BMN",
  2: "Menunggu keputusan KAKANSAR",
  3: "Perbaikan dikerjakan",
  4: "Perbaikan selesai",
};

/**
 * Kartu per penanggung jawab kendaraan: merangkai `users`, `asets`,
 * `berita_acara`, `ews_tickets` per NIP penanggung jawab, lalu menghitung
 * tahap alur kerusakan + apakah perbaikan sudah selesai.
 *
 * Hanya menampilkan PJ yang **punya alur** (BA terkait asetnya, atau tiket
 * EWS yang diarahkan ke asetnya) — aset sehat tanpa laporan tidak
 * membuat kartu.
 */
export function useKartuPenanggungJawab(): SupabaseQueryResult<KartuPJ> {
  const usersQ = useSupabaseTable<UserRow, UserInfo>(
    "users",
    "*",
    (rows) => rows.map(mapUser)
  );
  const asetsQ = useAsets();
  const baQ = useSupabaseTable<BeritaAcaraRow, BeritaAcaraMapped>(
    "berita_acara",
    "*",
    mapBeritaAcara,
    { col: "tanggal_buat", ascending: false }
  );
  const ewQ = useSupabaseTable<EwsTicketRow, EwsTicketMapped>(
    "ews_tickets",
    "*",
    mapEwsTickets,
    { col: "tanggal_buat", ascending: false }
  );

  const loading = usersQ.loading || asetsQ.loading || baQ.loading || ewQ.loading;
  const error = usersQ.error ?? asetsQ.error ?? baQ.error ?? ewQ.error;

  const cards = useMemo<KartuPJ[]>(() => {
    if (loading) return [];
    const usersData = usersQ.data;
    const asetsData = asetsQ.data;
    const baData = baQ.data;
    const ewData = ewQ.data;

    // Aset punya BA atau tiket EWS — hanya aset inilah yang "punya alur".
    const asetDenganAlur = asetsData.filter((a) => {
      const adaBA = baData.some((b) => b.asetId === a.id);
      const adaTiket = ewData.some(
        (t) => t.asetId === a.id && t.assignedTo === a.penanggungJawab
      );
      return adaBA || adaTiket;
    });

    // Satu kartu per penanggung jawab; aset yang dimonitor = aset alurnya
    // yang paling "baru" (urut tanggalBA/terbaru tiket).
    const pjMap = new Map<string, { aset: (typeof asetsData)[0]; tahap: number }>();
    for (const aset of asetDenganAlur) {
      const pj = aset.penanggungJawab;
      if (!pj) continue;

      // Cari BA terkait aset ini — tahap BA: Diserahkan→1, Diproses→2,
      // Disetujui/Ditolak→3 (diteruskan ke tiket).
      let tahapBA = 0;
      const baAset = baData
        .filter((b) => b.asetId === aset.id)
        .sort((a, b) => (b.tanggalBuat ?? "").localeCompare(a.tanggalBuat ?? ""))[0];
      if (baAset) {
        switch (baAset.status) {
          case "Draf":
            tahapBA = 0;
            break;
          case "Diserahkan":
            tahapBA = 1;
            break;
          case "Diproses":
            tahapBA = 2;
            break;
          case "Disetujui":
          case "Ditolak":
            tahapBA = 3;
            break;
        }
      }

      // Tiket EWS diarahkan ke PJ ini (aset sama) — tahap: ada tiket = 3,
      // tiket "Selesai" = 4.
      let tahapTiket = 0;
      const tiketPJ = ewData.find(
        (t) => t.asetId === aset.id && t.assignedTo === pj
      );
      if (tiketPJ) tahapTiket = 3;
      if (tiketPJ?.status === "Selesai") tahapTiket = 4;

      // Tahap kartu = max(BA, Tiket) — alur maju ke arah perbaikan.
      const tahap = Math.max(tahapBA, tahapTiket);

      const prev = pjMap.get(pj);
      if (!prev || tahap > prev.tahap) {
        pjMap.set(pj, { aset, tahap });
      }
    }

    // Rangkai nama dari DB users; fallback NIP polos bila NIP tidak ada di
    // tabel users (mis. belum di-seed).
    const cariNama = (nip: string): string => {
      const u = usersData.find((x) => x.nip === nip);
      if (u?.nama) return u.nama;
      return `NIP ${nip}`;
    };

    const kartu: KartuPJ[] = [];
    for (const [nip, { aset, tahap }] of pjMap) {
      const tiketPJ = ewData.find((t) => t.asetId === aset.id && t.assignedTo === nip);
      const warna =
        tahap === 0 ? "slate" : tahap === 4 ? "emerald" : tahap === 3 ? "amber" : "blue";
      kartu.push({
        nip,
        nama: cariNama(nip),
        aset: {
          id: aset.id,
          kode: aset.kode,
          nama: aset.nama,
          status: aset.status,
          merk: aset.merk,
          tipe: aset.tipe,
        },
        tahap,
        labelTahap: labelTahap[tahap] ?? "—",
        warnaTahap: warna,
        tiket: tiketPJ
          ? {
              id: tiketPJ.id,
              judul: tiketPJ.judul,
              status: tiketPJ.status as "Menunggu" | "Diproses" | "Selesai",
            }
          : undefined,
        perbaikanSelesai: tiketPJ?.status === "Selesai" ? true : false,
      });
    }

    // Urutan: tahap terbesar dulu (yang paling butuh perhatian di bawah),
    // lalu nama PJ naik.
    return kartu.sort((a, b) => b.tahap - a.tahap || a.nama.localeCompare(b.nama));
  }, [usersQ.data, asetsQ.data, baQ.data, ewQ.data, loading]);

  const refetch = useCallback(() => {
    usersQ.refetch();
    asetsQ.refetch();
    baQ.refetch();
    ewQ.refetch();
  }, [usersQ, asetsQ, baQ, ewQ]);

  return { data: cards, loading, error, refetch };
}

// ─── AUDIT KEPATUHAN (dihitung dari jejak nyata database) ────────────────────

export interface BarisAuditKepatuhan {
  /** NIP personel. */
  personelId: string;
  nama: string;
  /** Role/ jabatan token dari DB users. */
  jabatan: string;
  /**
   * "Telat Kembali" — aset rusak yang masih dipegang personel (penanggung
   * jawabnya) DAN tidak ada berita acara apapun untuk aset itu: unit
   * seharusnya diserahkan ke unit service via BA, tapi ditarik terus.
   */
  telatKembali: number;
  /**
   * "Abaikan Checklist" — checklist miliknya (pemeriksa) yang tanggalnya
   * SUDAH LEWAT dari hari ini namun masih "Belum Lengkap".
   */
  abaikanChecklist: number;
  /** Untuk kartu "Pelanggaran Bulan Ini": subset bulan berjalan. */
  telatBulanIni: number;
  abaikanBulanIni: number;
  /** 100 dikurangi hukuman per pelanggaran (lihat konstanta di bawah). */
  skorKepatuhan: number;
  /** Kalimat singkat tiap pelanggaran — untuk kolom rincian. */
  rincian: string[];
}

/** Bobot hukuman skor per jenis pelanggaran. */
const BOBOT_TELAT_KEMBALI = 12;
const BOBOT_ABAIKAN_CHECKLIST = 8;
/** Selisih tanggal disimpan ISO "yyyy-mm-dd" → hitung selisih hari. */
const SATU_HARI_MS = 86_400_000;

const clampSkor = (n: number) => Math.max(0, Math.min(100, n));

/**
 * Ringkasan kartu statistik halaman audit — dihitung dari baris per personel.
 */
export function hitungRingkasanAudit(rows: BarisAuditKepatuhan[]): {
  totalPersonel: number;
  rataSkor: number;
  pelanggaranBulanIni: number;
} {
  const totalPersonel = rows.length;
  const rataSkor =
    totalPersonel === 0
      ? 0
      : Math.round(rows.reduce((s, r) => s + r.skorKepatuhan, 0) / totalPersonel);
  const pelanggaranBulanIni = rows.reduce(
    (s, r) => s + r.telatBulanIni + r.abaikanBulanIni,
    0
  );
  return { totalPersonel, rataSkor, pelanggaranBulanIni };
}

/**
 * Audit kepatuhan otomatis: rangkai `users` × `asets` × `checklist_harian` ×
 * `berita_acara`, lalu hitung pelanggaran per personel:
 *
 *   • Telat Kembali     = aset rusak dipegang TANPA berita acara
 *                         (unit belum "dikembalikan" ke unit service).
 *   • Abaikan Checklist = checklist lewat tanggal masih "Belum Lengkap".
 *
 * Skor kepatuhan = 100 − bobot × jumlah pelanggaran (dipotok 0–100).
 * Semua dari database — tidak ada seed mock.
 */
export function useAuditKepatuhan(): SupabaseQueryResult<BarisAuditKepatuhan> {
  const usersQ = useSupabaseTable<UserRow, UserInfo>(
    "users",
    "*",
    (rows) => rows.map(mapUser)
  );
  const asetsQ = useAsets();
  const checklistQ = useSupabaseTable<ChecklistHarianRow, ChecklistMapped>(
    "checklist_harian",
    "*",
    mapChecklists,
    { col: "tanggal", ascending: false }
  );
  const baQ = useSupabaseTable<BeritaAcaraRow, BeritaAcaraMapped>(
    "berita_acara",
    "*",
    mapBeritaAcara,
    { col: "tanggal_buat", ascending: false }
  );

  const loading =
    usersQ.loading || asetsQ.loading || checklistQ.loading || baQ.loading;
  const error =
    usersQ.error ?? asetsQ.error ?? checklistQ.error ?? baQ.error;

  const data = useMemo<BarisAuditKepatuhan[]>(() => {
    if (loading) return [];
    const hariIni = new Date().toISOString().slice(0, 10);
    const awalBulan = hariIni.slice(0, 8) + "01";
    // Aset yang sudah "dikembalikan via berita acara" (status apa pun).
    const asetSudahDilaporkan = new Set(
      baQ.data.map((b) => b.asetId).filter(Boolean) as string[]
    );
    const lewatHari = (tanggal: string) =>
      Math.max(
        0,
        Math.round(
          (new Date(hariIni).getTime() - new Date(tanggal).getTime()) /
            SATU_HARI_MS
        )
      );

    const rows: BarisAuditKepatuhan[] = usersQ.data
      .filter((u) => u.aktif && u.nip)
      .map((u) => {
        const nip = u.nip;
        // 1) Telat kembali — aset rusak dipegang tanpa laporan BA.
        const asetTelat = asetsQ.data.filter(
          (a) =>
            a.penanggungJawab === nip &&
            (a.kondisi === "Rusak Ringan" || a.kondisi === "Rusak Berat") &&
            !asetSudahDilaporkan.has(a.id)
        );
        // 2) Abaikan checklist — lewat tanggal & masih belum lengkap.
        const ckLewat = checklistQ.data.filter(
          (c) =>
            c.pemeriksaId === nip &&
            c.status === "Belum Lengkap" &&
            !!c.tanggal &&
            c.tanggal < hariIni
        );
        const telat = asetTelat.length;
        const abaikan = ckLewat.length;
        const rincian: string[] = [
          ...asetTelat.map(
            (a) =>
              `Unit ${a.kode ? a.kode + " · " : ""}${a.nama} rusak (${a.kondisi}) — belum diserahkan lewat berita acara`
          ),
          ...ckLewat.map(
            (c) =>
              `Checklist ${c.tanggal} · ${c.unit} — lewat ${lewatHari(c.tanggal)} hari, masih Belum Lengkap`
          ),
        ];
        const abaikanBulanIni = ckLewat.filter((c) => c.tanggal >= awalBulan)
          .length;
        return {
          personelId: nip,
          nama: u.nama,
          jabatan: u.role,
          telatKembali: telat,
          abaikanChecklist: abaikan,
          telatBulanIni: telat, // pelanggaran masih berjalan → masuk bulan ini
          abaikanBulanIni,
          skorKepatuhan: clampSkor(
            100 -
              telat * BOBOT_TELAT_KEMBALI -
              abaikan * BOBOT_ABAIKAN_CHECKLIST
          ),
          rincian,
        };
      });

    // Skor tertinggi dulu; seri → pelanggaran sedikit dulu; seri → nama naik.
    return rows.sort(
      (a, b) =>
        b.skorKepatuhan - a.skorKepatuhan ||
        a.telatKembali +
          a.abaikanChecklist -
          (b.telatKembali + b.abaikanChecklist) ||
        a.nama.localeCompare(b.nama)
    );
  }, [usersQ.data, asetsQ.data, checklistQ.data, baQ.data, loading]);

  const refetch = useCallback(() => {
    usersQ.refetch();
    asetsQ.refetch();
    checklistQ.refetch();
    baQ.refetch();
  }, [usersQ, asetsQ, checklistQ, baQ]);

  return { data, loading, error, refetch };
}
