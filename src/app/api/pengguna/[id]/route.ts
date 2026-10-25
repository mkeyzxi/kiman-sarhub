import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import type { Database, UserUpdate } from "@/types/supabase";

// Server-side Supabase client dengan service_role key (bypass RLS).
// Dibuat lazily — modul harus aman dievaluasi oleh worker build (env tidak
// selalu tersedia pada fase "collect page data").
let adminRefKlien: SupabaseClient<Database> | null = null;

function supaAdmin(): SupabaseClient<Database> {
  if (!adminRefKlien) {
    adminRefKlien = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return adminRefKlien;
}

/** Domain email internal untuk auth.users. */
const INTERNAL_EMAIL_DOMAIN = "basarnas.ac.id";

/**
 * Generate email internal dari NIP untuk auth.users.
 * Format: {nip}@basarnas.ac.id.
 */
function generateInternalEmail(nip: string): string {
  return `${nip.toLowerCase().replace(/[\s.\-_]/g, "")}@${INTERNAL_EMAIL_DOMAIN}`;
}

/**
 * Helper: baca app_metadata user saat ini untuk dipertahankan field
 * `provider`/`providers` bawaan GoTrue saat menulis ulang app_metadata.
 */
async function readAuthAppMetadata(userId: string): Promise<Record<string, unknown>> {
  const { data: authUser } = await supaAdmin().auth.admin.getUserById(userId);
  return authUser?.user?.app_metadata ?? {
    provider: "email",
    providers: ["email"],
  } as Record<string, unknown>;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supaAdmin()
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return Response.json(
        { error: "Pengguna tidak ditemukan" },
        { status: 404 }
      );
    }

    return Response.json({ data });
  } catch (err) {
    const error = err instanceof Error ? err : new Error("Internal server error");
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nama, nip, email, role, aktif } = body;

    // ── Normalisasi & validasi NIP (karena NIP = identitas login) ─────
    const normalizeNip = nip ? String(nip).replace(/[\s.\-_]/g, "").trim() : undefined;
    if (normalizeNip && !/^\d{16,18}$/.test(normalizeNip)) {
      return Response.json(
        { error: "Format NIP tidak valid. Harus 16-18 digit angka." },
        { status: 400 }
      );
    }

    // Cek keunikan NIP baru (jika ada)
    if (normalizeNip) {
      const { data: other } = await supaAdmin()
      .from("users")
        .select("id")
        .eq("nip", normalizeNip)
        .neq("id", id)
        .maybeSingle();
      if (other) {
        return Response.json(
          { error: "NIP sudah terdaftar untuk pengguna lain" },
          { status: 409 }
        );
      }
    }

    // ── Update public.users ────────────────────────────────────────────
    const updatePayload: UserUpdate = {
      updated_at: new Date().toISOString(),
    };
    if (nama !== undefined) updatePayload.nama = nama;
    if (role !== undefined) updatePayload.role = role;
    if (aktif !== undefined) updatePayload.aktif = aktif;
    if (normalizeNip) updatePayload.nip = normalizeNip;
    if (email !== undefined) updatePayload.email = email;

    const { data, error } = await supaAdmin()
      .from("users")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // ── Jika NIP berubah, update auth.users.email (sinkronkan) ────────
    // Login pakai NIP → email internal, jadi kalau NIP berubah, email
    // identitas di auth.users juga harus ikut berubah, agar NIP baru
    // bisa dipakai untuk login.
    let authEmailToUpdate: string | undefined;
    const existingEmailBefore = data.email;
    const existingNipBefore = (await supaAdmin()
      .from("users")
      .select("nip")
      .eq("id", id)
      .single()
      .then((r) => r.data?.nip ?? ""));

    // Jika NIP yang baru ≠ NIP yang lama → perlu regenerate email auth
    if (normalizeNip && normalizeNip !== existingNipBefore) {
      authEmailToUpdate = generateInternalEmail(normalizeNip);
    }

    // ── Sync auth.users: user_metadata + app_metadata + email ────────
    const authUpdate: Record<string, unknown> = {
      user_metadata: {
        role: role ?? data.role,
        nip: normalizeNip ?? data.nip,
        nama: nama ?? data.nama,
      },
    };

    // app_metadata — pertahankan provider info GoTrue
    const prevMeta = await readAuthAppMetadata(id);
    authUpdate.app_metadata = {
      ...prevMeta,
      role: role ?? data.role,
      nip: normalizeNip ?? data.nip,
      nama: nama ?? data.nama,
      aktif: aktif ?? data.aktif,
      password_changed: data.password_changed,
    };

    // Email hanya update jika NIP berubah (identitas login ikut berubah)
    if (authEmailToUpdate) {
      authUpdate.email = authEmailToUpdate;
    }

    await supaAdmin().auth.admin.updateUserById(id, authUpdate);

    // ── Sync email di public.users jika NIP berubah ───────────────────
    if (authEmailToUpdate && email === undefined) {
      await supaAdmin()
      .from("users")
        .update({ email: authEmailToUpdate })
        .eq("id", id);
    }

    return Response.json({
      message: "Pengguna berhasil diperbarui",
      data,
    });
  } catch (err) {
    const error = err instanceof Error ? err : new Error("Internal server error");
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Soft delete: set aktif=false.
    const updatePayload: UserUpdate = {
      aktif: false,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supaAdmin()
      .from("users")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Sync app_metadata.aktif = false agar JWT berikutnya tahu akun sudah nonaktif
    const prevMeta = await readAuthAppMetadata(id);
    await supaAdmin().auth.admin.updateUserById(id, {
      app_metadata: {
        ...prevMeta,
        aktif: false,
        password_changed: data.password_changed,
      },
    });

    return Response.json({
      message: "Pengguna berhasil dihapus (soft delete)",
      data,
    });
  } catch (err) {
    const error = err instanceof Error ? err : new Error("Internal server error");
    return Response.json({ error: error.message }, { status: 500 });
  }
}