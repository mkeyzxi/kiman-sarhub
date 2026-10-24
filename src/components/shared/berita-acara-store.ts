"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import {
  beritaAcaraList,
  getBeritaAcaraById,
  getBeritaAcaraByTiketId,
  type BeritaAcara,
  type BarisKendala,
  type StatusBeritaAcara,
} from "@/components/shared/mock-data";
import type { BeritaAcaraRow } from "@/types/supabase";

/**
 * Store berita acara di sisi klien (modul-level, seperti `ticket-store`).
 *
 * - **Tulis**: INSERT/UPDATE ke Supabase `berita_acara` (Tahap 4).
 * - **Baca**: gabungan mock seed + in-memory sesi. Supabase data di-merge
 *   oleh hook `useBeritaAcara` di halaman yang membutuhkan.
 *
 * Supabase gagal/offline → tetap masuk in-memory (UI tidak hangus).
 */

// ── In-memory fallback ────────────────────────────────────────────────────────
// Mutasi di bawah tetap memutasi `beritaAcaraList` (mock-data) sebagai
// sumber data lokal; Supabase ditangani fire-and-forget.

export function useBeritaAcara(): BeritaAcara[] {
  // Hidrasi: data Supabase digabung ke `beritaAcaraList` sekali per sesi,
  // lalu komponen yang memasang hook dirender ulang agar pembacaan fungsi
  // (`beritaAcaraByTiket`, `beritaAcaraByChecklist`, …) melihat baris DB.
  const [, setPutaran] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      void mulaiHidrasi().then(() => setPutaran((n) => n + 1));
    }, 0);
    return () => clearTimeout(t);
  }, []);
  return beritaAcaraList;
}

/** Primitif hidrasi — dipakai halaman yang perlu jaminan data DB sudah ada. */
export function mulaiHidrasi(): Promise<void> {
  if (!hidrasiPromise) {
    hidrasiPromise = (async () => {
      try {
        const supa = getSupabaseBrowserClient();
        const { data, error } = await supa.from("berita_acara").select("*");
        if (error || !data) return;
        for (const r of data as unknown as BeritaAcaraRow[]) {
          if (beritaAcaraList.some((b) => b.id === r.id)) continue;
          beritaAcaraList.push(mapDariSupabase(r));
        }
      } catch {
        // Supabase belum siap — biarkan data in-memory saja.
      }
    })();
  }
  return hidrasiPromise;
}

let hidrasiPromise: Promise<void> | null = null;

/** Konversi baris berita_acara (snake_case) → bentuk aplikasi. */
function mapDariSupabase(r: BeritaAcaraRow): BeritaAcara {
  return {
    id: r.id,
    tanggal: r.tanggal,
    namaAset: r.nama_aset,
    kodeAset: r.kode_aset ?? "",
    nomor: r.nomor ?? "",
    asetId: r.aset_id ?? "",
    checklistId: r.checklist_id || undefined,
    tiketId: r.tiket_id || undefined,
    pengajuId: r.pengaju_id || undefined,
    pelapor: r.pelapor,
    pelaporJabatan: r.pelapor_jabatan,
    pengajuNama: r.pengaju_nama || undefined,
    pengajuJabatan: r.pengaju_jabatan || undefined,
    tanggalBuat: r.tanggal_buat ?? "",
    tanggalUpdate: r.tanggal_update ?? "",
    status: r.status as StatusBeritaAcara,
    kendala: Array.isArray(r.kendala) ? (r.kendala as BarisKendala[]) : [],
    fotoBukti: Array.isArray(r.foto_bukti) ? (r.foto_bukti as string[]) : [],
    uraian: r.uraian,
    alasanPenolakan: r.alasan_penolakan || undefined,
    keterangan: r.keterangan,
  };
}

/** Ambil satu berita acara berdasarkan ID. */
export function beritaAcaraById(id: string): BeritaAcara | undefined {
  return getBeritaAcaraById(id);
}

/** Ambil berita acara berdasarkan tiket terkait (bila ada). */
export function beritaAcaraByTiket(tiketId: string): BeritaAcara | undefined {
  return getBeritaAcaraByTiketId(tiketId);
}

/** Ambil berita acara yang dibuat dari sebuah checklist. */
export function beritaAcaraByChecklist(
  checklistId: string
): BeritaAcara | undefined {
  return beritaAcaraList.find((b) => b.checklistId === checklistId);
}

/** Daftar berita acara milik sebuah aset. */
export function beritaAcaraByAset(asetId: string): BeritaAcara[] {
  return beritaAcaraList.filter((b) => b.asetId === asetId);
}

// ── Helpers Supabase ─────────────────────────────────────────────────────────

function toSupabaseRow(b: BeritaAcara) {
  return {
    id: b.id,
    tanggal: b.tanggal,
    nama_aset: b.namaAset,
    kode_aset: b.kodeAset,
    nomor: b.nomor,
    aset_id: b.asetId ?? "",
    checklist_id: b.checklistId ?? "",
    tiket_id: b.tiketId ?? "",
    pengaju_id: b.pengajuId ?? "",
    pelapor: b.pelapor,
    pelapor_jabatan: b.pelaporJabatan,
    pengaju_nama: b.pengajuNama ?? "",
    pengaju_jabatan: b.pengajuJabatan ?? "",
    tanggal_buat: b.tanggalBuat ?? "",
    tanggal_update: b.tanggalUpdate ?? "",
    status: b.status,
    kendala: b.kendala ?? null,
    foto_bukti: b.fotoBukti ?? null,
    uraian: b.uraian,
    alasan_penolakan: b.alasanPenolakan ?? "",
    keterangan: b.keterangan,
  };
}

async function persistInsert(b: BeritaAcara): Promise<void> {
  try {
    const supa = getSupabaseBrowserClient();
    await supa.from("berita_acara").insert(toSupabaseRow(b));
  } catch {
    // Offline / Supabase belum dikonfigurasi — abaikan, data in-memory.
  }
}

async function persistUpdate(id: string, patch: Record<string, unknown>): Promise<void> {
  try {
    const supa = getSupabaseBrowserClient();
    await supa.from("berita_acara").update(patch as never).eq("id", id);
  } catch {
    // Offline / Supabase belum dikonfigurasi — abaikan.
  }
}

/**
 * Tambah berita acara baru (status "Draf") — mutasi in-memory + persist
 * fire-and-forget ke Supabase.
 */
export function tambahBeritaAcaraSupabase(
  input: Omit<BeritaAcara, "id" | "status" | "tanggalBuat" | "tanggalUpdate"> & {
    pengajuId?: string;
    pengajuNama?: string;
    pengajuJabatan?: string;
    tiketId?: string;
    checklistId?: string;
  }
): BeritaAcara {
  const hariIni = new Date().toISOString().slice(0, 10);
  const ba: BeritaAcara = {
    ...input,
    id: `ba-${Date.now()}`,
    status: "Draf",
    tanggalBuat: hariIni,
    tanggalUpdate: hariIni,
  };
  beritaAcaraList.unshift(ba);
  // Persist ke Supabase (fire-and-forget, silent).
  void persistInsert(ba);
  return ba;
}

/**
 * Ubah status berita acara sekaligus catat keputusan — mutasi in-memory +
 * persist ke Supabase.
 */
export function ubahStatusBeritaAcaraSupabase(
  id: string,
  status: BeritaAcara["status"],
  extra: Partial<
    Pick<
      BeritaAcara,
      | "alasanPenolakan"
      | "keterangan"
      | "pengajuId"
      | "pengajuNama"
      | "pengajuJabatan"
      | "tiketId"
    >
  > = {}
): BeritaAcara | undefined {
  const ba = getBeritaAcaraById(id);
  if (!ba) return undefined;
  ba.status = status;
  ba.tanggalUpdate = new Date().toISOString().slice(0, 10);
  if (extra.alasanPenolakan !== undefined)
    ba.alasanPenolakan = extra.alasanPenolakan;
  if (extra.keterangan !== undefined) ba.keterangan = extra.keterangan;
  if (extra.pengajuId !== undefined) ba.pengajuId = extra.pengajuId;
  if (extra.pengajuNama !== undefined) ba.pengajuNama = extra.pengajuNama;
  if (extra.pengajuJabatan !== undefined)
    ba.pengajuJabatan = extra.pengajuJabatan;
  if (extra.tiketId !== undefined) ba.tiketId = extra.tiketId;

  void persistUpdate(id, {
    status,
    tanggal_update: ba.tanggalUpdate,
    ...(extra.alasanPenolakan !== undefined ? { alasan_penolakan: extra.alasanPenolakan } : {}),
    ...(extra.keterangan !== undefined ? { keterangan: extra.keterangan } : {}),
    ...(extra.tiketId !== undefined ? { tiket_id: extra.tiketId } : {}),
  });
  return ba;
}

/**
 * Perbarui isi berita acara (bagian yang diisi PJ) — mutasi in-memory +
 * persist ke Supabase.
 */
export function ubahIsiBeritaAcaraSupabase(
  id: string,
  isi: Partial<
    Pick<
      BeritaAcara,
      "nomor" | "uraian" | "kendala" | "fotoBukti" | "namaAset" | "kodeAset"
    >
  >
): BeritaAcara | undefined {
  const ba = getBeritaAcaraById(id);
  if (!ba) return undefined;
  if (isi.nomor !== undefined) ba.nomor = isi.nomor;
  if (isi.uraian !== undefined) ba.uraian = isi.uraian;
  if (isi.kendala !== undefined) ba.kendala = isi.kendala;
  if (isi.fotoBukti !== undefined) ba.fotoBukti = isi.fotoBukti;
  if (isi.namaAset !== undefined) ba.namaAset = isi.namaAset;
  if (isi.kodeAset !== undefined) ba.kodeAset = isi.kodeAset;
  ba.tanggalUpdate = new Date().toISOString().slice(0, 10);

  void persistUpdate(id, {
    ...(isi.nomor !== undefined ? { nomor: isi.nomor } : {}),
    ...(isi.uraian !== undefined ? { uraian: isi.uraian } : {}),
    ...(isi.kendala !== undefined ? { kendala: isi.kendala } : {}),
    ...(isi.fotoBukti !== undefined ? { foto_bukti: isi.fotoBukti } : {}),
    ...(isi.namaAset !== undefined ? { nama_aset: isi.namaAset } : {}),
    ...(isi.kodeAset !== undefined ? { kode_aset: isi.kodeAset } : {}),
    tanggal_update: ba.tanggalUpdate,
  });
  return ba;
}
