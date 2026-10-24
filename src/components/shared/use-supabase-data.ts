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
  ApprovalRow,
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
  mapApprovals,
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
  type ApprovalMapped,
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

export function useApprovals(): SupabaseQueryResult<ApprovalMapped> {
  return useSupabaseTable<ApprovalRow, ApprovalMapped>(
    "approvals",
    "*",
    mapApprovals,
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
