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
