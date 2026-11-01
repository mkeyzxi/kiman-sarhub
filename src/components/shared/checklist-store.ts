"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import {
  checklistHarianList,
  getChecklistHarianById,
  type ItemHasilPengecekan,
  type ChecklistHarian,
} from "@/components/shared/mock-data";

/**
 * Penyimpanan checklist harian:
 *
 * - **Tulis**: INSERT ke Supabase `checklist_harian` (Tahap 4).
 * - **Baca**: data Supabase + tulisan sesi berjalan (in-memory).
 *   SEED MOCK sengaja tidak digabung lagi supaya daftar & statistik
 *   (`Total/Lengkap/Belum Lengkap`) selalu nyata dari database.
 *
 * Bila Supabase gagal saat menulis, tulis tetap masuk in-memory supaya
 * UI tidak hangus; baca murni mengikuti database.
 */

// ── In-memory store (fallback / sesi berjalan) ──────────────────────────────
const memory: ChecklistHarian[] = [];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

/**
 * ID checklist baru — berbasis waktu unik (bentuk selaras `ba-…`).
 * Tanpa menyentuh seed/DB: kalaupun memori hangus antar sesi, ID tetap
 * unik sehingga tidak menabrak primary key saat INSERT ke database.
 */
function nextChecklistId(): string {
  return `chk-${Date.now()}`;
}

export interface InputChecklist {
  tanggal: string;
  unit: string;
  jenisUnit: "Kapal" | "Mobil" | "Motor" | "Perahu";
  templateId?: string;
  /** Nama pemeriksa (PJ) — terisi otomatis dari akun yang login. */
  pemeriksa: string;
  /** NIP user pemeriksa (untuk riwayat & auto-fill berita acara). */
  pemeriksaId?: string;
  itemChecked: number;
  itemTotal: number;
  items: ItemHasilPengecekan[];
  catatan: string;
  /** Aset BMN terkait (untuk mengisi otomatis berita acara). */
  asetId?: string;
}

export interface ChecklistBaru {
  id: string;
  status: "Lengkap" | "Belum Lengkap";
  /** true jika berhasil di-INSERT ke Supabase; false jika hanya in-memory. */
  persisted: boolean;
  error?: string;
}

/**
 * Tambah checklist:
 * 1. INSERT ke Supabase `checklist_harian`.
 * 2. Simpan juga in-memory sebagai fallback (sekaligus untuk halaman detail
 *    yang belum ke-merge).
 *
 * Jika Supabase gagal → tetap masuk memori, dan `persisted: false`.
 */
export async function tambahChecklist(
  input: InputChecklist
): Promise<ChecklistBaru> {
  const lengkap = input.itemChecked === input.itemTotal;
  const id = nextChecklistId();
  const baru: ChecklistHarian = {
    ...input,
    id,
    status: lengkap ? "Lengkap" : "Belum Lengkap",
  };
  memory.unshift(baru);
  emit();

  // INSERT ke Supabase
  let persisted = false;
  let error: string | undefined;
  try {
    const supa = getSupabaseBrowserClient();
    const { error: err } = await supa.from("checklist_harian").insert({
      id,
      tanggal: baru.tanggal,
      unit: baru.unit,
      jenis_unit: baru.jenisUnit,
      template_id: baru.templateId ?? null,
      pemeriksa: baru.pemeriksa,
      pemeriksa_id: baru.pemeriksaId ?? null,
      aset_id: baru.asetId ?? null,
      status: baru.status,
      item_checked: baru.itemChecked,
      item_total: baru.itemTotal,
      items: baru.items,
      catatan: baru.catatan,
    });
    if (err) {
      error = err.message;
      persisted = false;
      // Tampilkan error yang jelas — jangan sunyi
      if (err.message?.includes("PRO FEATURE") || err.code === "409") {
        // RLS policy error — tampilkan di console dan tetap lanjut dengan in-memory
        console.error("[checklist-store] RLS/INSERT error:", err.message, err.details);
      }
    } else {
      persisted = true;
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Gagal simpan ke Supabase";
    persisted = false;
    console.error("[checklist-store] INSERT exception:", e);
  }

  return { id, status: baru.status, persisted, error };
}

/**
 * Ambil satu checklist berdasarkan ID — gabungan mock seed, in-memory,
 * dan (opsional) Supabase.
 */
export function ambilChecklist(
  id: string
): (typeof checklistHarianList)[number] | undefined {
  // Data seed
  const seed = getChecklistHarianById(id);
  if (seed) return seed;

  // Data yang baru disimpan sesi ini
  const sesi = memory.find((c) => c.id === id);
  return sesi;
}

/**
 * Hook: checklist harian dari Supabase + in-memory, digabung.
 *
 * Supabase data di-fetch saat mount; in-memory data dari sesi berjalan
 * selalu terlihat (untuk detail halaman yang dibuat selama sesi ini).
 */
export function useChecklistsCombined(): {
  data: ChecklistHarian[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const [supaRows, setSupaRows] = useState<ChecklistHarian[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memoryData, setMemoryData] = useState<ChecklistHarian[]>(() => [
    ...memory,
  ]);
  const mounted = useRef(true);

  // Dapatkan data in-memory (dari emit) — selalu terlihat untuk halaman
  // detail checklist yang baru dibuat dalam sesi ini.
  useEffect(() => {
    listeners.add(() => setMemoryData([...memory]));
  }, []);

  const fetch_ = useCallback(async () => {
    try {
      const supa = getSupabaseBrowserClient();
      const { data, error: err } = await supa
        .from("checklist_harian")
        .select("*")
        .order("tanggal", { ascending: false });
      if (!mounted.current) return;
      if (err) {
        setError(err.message);
      } else {
        // Mapping snake_case → camelCase
        const mapped: ChecklistHarian[] = (data ?? []).map((r) => ({
          id: r.id,
          tanggal: r.tanggal,
          unit: r.unit,
          jenisUnit: r.jenis_unit as "Kapal" | "Mobil" | "Motor" | "Perahu",
          templateId: r.template_id ?? undefined,
          pemeriksa: r.pemeriksa,
          pemeriksaId: r.pemeriksa_id ?? undefined,
          asetId: r.aset_id ?? undefined,
          status: r.status as "Lengkap" | "Belum Lengkap",
          itemChecked: r.item_checked,
          itemTotal: r.item_total,
          items: (r.items as ItemHasilPengecekan[]) ?? [],
          catatan: r.catatan,
        }));
        setSupaRows(mapped);
        setError(null);
      }
      setLoading(false);
    } catch (e) {
      if (!mounted.current) return;
      setError(e instanceof Error ? e.message : "Gagal memuat checklist");
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

  // Gabungan: in-memory dulu (paling baru), lalu Supabase — dedup oleh id.
  // Seed mock TIDAK digabung: halaman & statistik harus mencerminkan isi
  // database (tanpa data contoh statis yang tidak nyata).
  const seen = new Set<string>();
  const data: ChecklistHarian[] = [];
  for (const c of [...memoryData, ...(supaRows ?? [])]) {
    if (!seen.has(c.id)) {
      seen.add(c.id);
      data.push(c);
    }
  }

  const refetch = useCallback(() => {
    setLoading(true);
    void fetch_();
  }, [fetch_]);

  return { data, loading, error, refetch };
}
