"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { type EWSTicket, type TingkatKeparahan, type StatusTicket } from "./mock-data";

/**
 * Store tiket EWS:
 *
 * - **Tulis**: INSERT/UPDATE ke Supabase `ews_tickets` (Tahap 4).
 * - **Baca**: gabungan mock seed + in-memory sesi. Data Supabase di-merge
 *   oleh hook `useEwsTickets` di halaman yang membutuhkan (lihat
 *   `use-supabase-data.ts`).
 *
 * Supabase gagal/offline → tetap masuk in-memory (UI tidak hangus).
 */

let tickets: EWSTicket[] = [];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Dipakai saat render di server / saat snapshot diambil. */
function getServerSnapshot(): EWSTicket[] {
  return [];
}

export function useTickets(): EWSTicket[] {
  return useSyncExternalStore(subscribe, () => tickets, getServerSnapshot);
}

/**
 * Hook: tiket dari Supabase + in-memory, digabung.
 *
 * - In-memory (termasuk saat update status dalam sesi) selalu menang.
 * - Hasil fetch Supabase di-mapping penuh ke bentuk `EWSTicket` agar
 *   tipe identik dengan data in-memory.
 * - Semua setState dilakukan **setelah await** (async boundary) sehingga
 *   aman terhadap aturan lint `react-hooks/set-state-in-effect`.
 */
export function useTicketsCombined(): {
  data: EWSTicket[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const [supaData, setSupaData] = useState<EWSTicket[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memoryData, setMemoryData] = useState<EWSTicket[]>(() => [...tickets]);
  const mounted = useRef(true);

  // Ikut pembaruan in-memory (tiket baru / ubah status) lewat emit().
  useEffect(() => {
    listeners.add(() => setMemoryData([...tickets]));
  }, []);

  const fetch_ = useCallback(async () => {
    try {
      const supa = getSupabaseBrowserClient();
      const { data, error: err } = await supa
        .from("ews_tickets")
        .select("*")
        .order("tanggal_buat", { ascending: false });
      if (!mounted.current) return;
      if (err) {
        setError(err.message);
      } else {
        const mapped: EWSTicket[] = (data ?? []).map((r) => ({
          id: r.id,
          asetId: r.aset_id ?? "",
          judul: r.judul,
          deskripsi: r.deskripsi,
          tingkatKeparahan: r.tingkat_keparahan as TingkatKeparahan,
          status: r.status as StatusTicket,
          tanggalBuat: r.tanggal_buat ?? "",
          tanggalUpdate: r.tanggal_update ?? "",
          assignedTo: r.assigned_to ?? "",
        }));
        setSupaData(mapped);
        setError(null);
      }
      setLoading(false);
    } catch (e) {
      if (!mounted.current) return;
      setError(e instanceof Error ? e.message : "Gagal memuat tiket EWS");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    // Defer 0 ms agar effect body tidak memanggil setState sinkron.
    const t = setTimeout(() => void fetch_(), 0);
    return () => {
      mounted.current = false;
      clearTimeout(t);
    };
  }, [fetch_]);

  // Gabungan: in-memory dulu (sesi berjalan), lalu Supabase.
  // Seed mock ewsTickets DIBUANG — hanya database + sesi yang ditampilkan.
  const seen = new Set<string>();
  const data: EWSTicket[] = [];
  for (const t of [...memoryData, ...(supaData ?? [])]) {
    if (!seen.has(t.id)) {
      seen.add(t.id);
      data.push(t);
    }
  }

  const refetch = useCallback(() => {
    setLoading(true);
    void fetch_();
  }, [fetch_]);

  return { data, loading, error, refetch };
}

export function getTicketById(id: string): EWSTicket | undefined {
  return tickets.find((t) => t.id === id);
}

export type TicketBaru = Omit<
  EWSTicket,
  "id" | "status" | "tanggalBuat" | "tanggalUpdate"
>;

/** Mapping tiket in-memory → baris Supabase (snake_case). */
function toSupabaseRow(t: EWSTicket) {
  return {
    id: t.id,
    aset_id: t.asetId ?? null,
    judul: t.judul,
    deskripsi: t.deskripsi,
    tingkat_keparahan: t.tingkatKeparahan,
    status: t.status,
    tanggal_buat: t.tanggalBuat ?? null,
    tanggal_update: t.tanggalUpdate ?? null,
    assigned_to: t.assignedTo ?? null,
  };
}

async function persistInsert(t: EWSTicket): Promise<void> {
  try {
    const supa = getSupabaseBrowserClient();
    const res = await supa.from("ews_tickets").insert(toSupabaseRow(t));
    if (res.error) {
      // Jangan senyap: INSERT gagal (RLS/FK/konflik) wajib terlihat —
      // tiket yang gagal tersimpan membuat penyambungan BA (tiket_id FK)
      // menabrak konstraint "Referensi tidak valid".
      console.error(
        "[ews_tickets] INSERT tiket gagal:",
        res.error.message,
        res.error.details ?? "",
        res.error.hint ?? ""
      );
    }
  } catch (e) {
    console.error("[ews_tickets] INSERT tiket gagal (jaringan):", e);
  }
}

/** Susun objek tiket baru (status "Menunggu", tanggal hari ini). */
function buatTiketBaru(data: TicketBaru): EWSTicket {
  const hariIni = new Date().toISOString().slice(0, 10);
  return {
    ...data,
    id: `ews-${String(tickets.length + 1).padStart(3, "0")}`,
    status: "Menunggu",
    tanggalBuat: hariIni,
    tanggalUpdate: hariIni,
  };
}

async function persistUpdate(id: string, t: EWSTicket): Promise<void> {
  try {
    const supa = getSupabaseBrowserClient();
    await supa.from("ews_tickets").update({ status: t.status, tanggal_update: t.tanggalUpdate }).eq("id", id);
  } catch {
    // Offline / Supabase belum dikonfigurasi — abaikan.
  }
}

export function addTicket(data: TicketBaru): EWSTicket {
  const tiket = buatTiketBaru(data);
  tickets = [tiket, ...tickets];
  emit();
  // Persist ke Supabase (fire-and-forget; error dicatat ke console).
  void persistInsert(tiket);
  return tiket;
}

/**
 * Buat tiket + TULIS Supabase dengan jaminan tersimpan — versi async yang
 * di-`await` form BMN sebelum tiket disambungkan ke berita acara: bila
 * INSERT ditolak (RLS/FK), error melempar ke form dan tiket di-revert dari
 * in-memory. Tanpa ini, UPDATE `berita_acara.tiket_id` berjalan walau tiket
 * belum ada di database → FK violation ("Referensi tidak valid").
 */
export async function tambahTiketSupabase(data: TicketBaru): Promise<EWSTicket> {
  const tiket = buatTiketBaru(data);
  tickets = [tiket, ...tickets];
  emit();
  try {
    const supa = getSupabaseBrowserClient();
    const { error } = await supa.from("ews_tickets").insert(toSupabaseRow(tiket));
    if (error) throw new Error(error.message);
    return tiket;
  } catch (e) {
    // Gagal tersimpan → cabut dari in-memory agar UI & penomoran jujur.
    tickets = tickets.filter((x) => x.id !== tiket.id);
    emit();
    const raw = e instanceof Error ? e.message : String(e);
    throw new Error(`Tiket gagal disimpan: ${raw}`);
  }
}

export function updateTicketStatus(id: string, status: EWSTicket["status"]): void {
  tickets = tickets.map((t) =>
    t.id === id
      ? { ...t, status, tanggalUpdate: new Date().toISOString().slice(0, 10) }
      : t
  );
  emit();
  // Persist update ke Supabase.
  const updated = tickets.find((t) => t.id === id);
  if (updated) void persistUpdate(id, updated);
}
