import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

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

export async function GET(request: NextRequest) {
  try {
    // Ambil token dari Authorization header atau cookie
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized - Token tidak ditemukan" },
        { status: 401 }
      );
    }

    // Verifikasi token dan dapatkan user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized - Token tidak valid" },
        { status: 401 }
      );
    }

    // Ambil data profile dari public.users
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Profil tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized - Token tidak ditemukan" },
        { status: 401 }
      );
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized - Token tidak valid" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { nama, nip, email } = body;

    // Validasi email uniqueness jika email diubah
    if (email && email !== user.email) {
      const { data: existing } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("email", email)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: "Email sudah digunakan oleh pengguna lain" },
          { status: 409 }
        );
      }
    }

    // Update di public.users
    const { data, error } = await supabaseAdmin
      .from("users")
      .update({
        nama: nama || undefined,
        nip: nip || undefined,
        email: email || undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update auth user metadata
    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      email: email || undefined,
      user_metadata: {
        ...user.user_metadata,
        nama: nama || undefined,
        nip: nip || undefined,
      },
    });

    return NextResponse.json({
      message: "Profil berhasil diperbarui",
      data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}