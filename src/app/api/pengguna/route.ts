import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import type { Database } from "@/types/supabase";

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

/** Domain email internal untuk auth.users (sesuai data live existing). */
const INTERNAL_EMAIL_DOMAIN = "basarnas.ac.id";

/**
 * Helper: generate email internal dari NIP.
 * Format: {nip}@basarnas.ac.id (sesuai data yang sudah ada di live).
 */
function generateInternalEmail(nip: string): string {
  return `${nip.toLowerCase().replace(/[\s.\-_]/g, "")}@${INTERNAL_EMAIL_DOMAIN}`;
}

export async function GET() {
  try {
    const { data, error } = await supaAdmin()
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return Response.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return Response.json({ data });
  } catch (err) {
    const error = err instanceof Error ? err : new Error("Internal server error");
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, nama, nip, role } = body;

    // Validasi: nama, role, password, NIP wajib
    if (!nama || !role || !password || !nip) {
      return Response.json(
        { error: "Nama, password, role, dan NIP wajib diisi" },
        { status: 400 }
      );
    }

    // Password minimal 8 karakter
    if (password.length < 8) {
      return Response.json(
        { error: "Password minimal 8 karakter" },
        { status: 400 }
      );
    }

    // Normalisasi NIP (buang spasi/titik/dash) & validasi 16-18 digit
    const normalizeNip = String(nip).replace(/[\s.\-_]/g, "").trim();
    if (!/^\d{16,18}$/.test(normalizeNip)) {
      return Response.json(
        { error: "Format NIP tidak valid. Harus 16-18 digit angka." },
        { status: 400 }
      );
    }

    // Cek NIP sudah terdaftar?
    const { data: existingByNip } = await supaAdmin()
      .from("users")
      .select("id")
      .eq("nip", normalizeNip)
      .single();

    if (existingByNip) {
      return Response.json(
        { error: "NIP sudah terdaftar" },
        { status: 409 }
      );
    }

    // Tentukan email: yang diinput admin, atau fallback synthetic dari NIP.
    // Jika admin menginput email domain @basarnas.ac.id, pastikan prefixnya
    // NIP user ini (untuk mencegah email sintetis milik user lain).
    let internalEmail = email;
    if (internalEmail && typeof internalEmail === "string") {
      const trimmed = internalEmail.trim();
      internalEmail = trimmed;
      if (trimmed.toLowerCase().endsWith(`@${INTERNAL_EMAIL_DOMAIN}`)) {
        const prefix = trimmed.toLowerCase().split("@")[0];
        if (prefix !== normalizeNip.toLowerCase()) {
          return Response.json(
            {
              error: `Email @${INTERNAL_EMAIL_DOMAIN} harus sesuai NIP ini (${normalizeNip}).`,
            },
            { status: 400 }
          );
        }
      }
    } else {
      internalEmail = generateInternalEmail(normalizeNip);
    }

    // Email kontak (di public.users) — bisa berbeda dari auth email.
    // Jika admin tidak isi → pakai email internal sebagai placeholder,
    // supaya tidak ada baris kosong.
    const publicUsersEmail =
      internalEmail && internalEmail.trim()
        ? internalEmail
        : generateInternalEmail(normalizeNip);

    // Buat user di auth.users via Admin API (service_role)
    const { data: authData, error: authError } = await supaAdmin().auth.admin.createUser({
      email: internalEmail,
      password,
      email_confirm: true,
      user_metadata: {
        role,
        nip: normalizeNip,
        nama,
      },
      // app_metadata diisi di langkah berikutnya (setelah auth user jadi)
    });

    if (authError) {
      return Response.json(
        { error: authError.message },
        { status: 500 }
      );
    }

    const newUserId = authData.user.id;

    // Upsert ke public.users
    const { error: insertError } = await supaAdmin()
      .from("users")
      .upsert({
        id: newUserId,
        email: publicUsersEmail,
        nip: normalizeNip,
        nama,
        role,
        aktif: true,
        password_changed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });

    if (insertError) {
      // Rollback: hapus auth user jika insert gagal
      await supaAdmin().auth.admin.deleteUser(newUserId);
      return Response.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    // Sync app_metadata ke auth.users (untuk performa login 0 RTT)
    await supaAdmin().auth.admin.updateUserById(newUserId, {
      app_metadata: {
        // Pertahankan provider info bawaan GoTrue
        provider: "email",
        providers: ["email"],
        // Data otorisasi untuk JWT
        role,
        nip: normalizeNip,
        nama,
        aktif: true,
        password_changed: false,
      },
    });

    return Response.json({
      data: {
        id: newUserId,
        email: internalEmail,
        nama,
        role,
      },
    });
  } catch (err) {
    const error = err instanceof Error ? err : new Error("Internal server error");
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}