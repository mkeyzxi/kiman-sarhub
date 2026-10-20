import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

// Server-side Supabase client dengan service_role key (bypass RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Client dengan anon key untuk operasi normal
const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  }
);

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
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
  } catch (err: any) {
    return Response.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, nama, nip, role } = body;

    // Validasi
    if (!email || !password || !nama || !role) {
      return Response.json(
        { error: "Email, password, nama, dan role wajib diisi" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return Response.json(
        { error: "Password minimal 8 karakter" },
        { status: 400 }
      );
    }

    // Cek apakah email sudah terdaftar (pakai admin untuk bypass RLS)
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return Response.json(
        { error: "Email sudah terdaftar" },
        { status: 409 }
      );
    }

    // Buat user di auth.users via Admin API (service_role)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role,
        nip,
        nama,
      },
    });

    if (authError) {
      return Response.json(
        { error: authError.message },
        { status: 500 }
      );
    }

    // Upsert ke public.users (pakai admin client untuk bypass RLS)
    // Upsert menghindari error duplicate key jika ID sudah ada
    const { error: insertError } = await supabaseAdmin
      .from("users")
      .upsert({
        id: authData.user.id,
        email,
        nip: nip || "",
        nama,
        role,
        aktif: true,
        password_changed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (insertError) {
      // Rollback: hapus auth user jika insert gagal
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return Response.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return Response.json({
      data: {
        id: authData.user.id,
        email,
        nama,
        role,
      },
    });
  } catch (err: any) {
    return Response.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}