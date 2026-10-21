import { NextResponse } from "next/server";
import {
  createSupabaseAdminClient,
  getAuthenticatedUser,
} from "@/lib/supabase-server";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseAdmin = createSupabaseAdminClient();
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
  } catch (err) {
    const error = err instanceof Error ? err : new Error("Internal server error");
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { nama, nip, email } = body;

    // Peringatan: NIP = identitas login, tidak boleh diubah user sendiri
    // (hanya Admin IT). Jika user mencoba mengirim NIP, diabaikan.
    // Email boleh diubah (data kontak), tapi tidak memengaruhi login.

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (typeof nama === "string" && nama.trim()) {
      updatePayload.nama = nama.trim();
    }
    if (typeof email === "string") {
      updatePayload.email = email.trim();
    }

    const supabaseAdmin = createSupabaseAdminClient();
    const { data, error } = await supabaseAdmin
      .from("users")
      .update(updatePayload)
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Sync app_metadata (nama) — penting untuk login berikutnya.
    // Baca dulu metadata saat ini, lalu merge, supaya provider info GoTrue
    // tidak hilang.
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(user.id);
    const prevMeta: Record<string, unknown> = authUser?.user?.app_metadata ?? {};
    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      app_metadata: {
        ...prevMeta,
        nama: data.nama,
      },
    });

    return NextResponse.json({
      message: "Profil berhasil diperbarui",
      data,
    });
  } catch (err) {
    const error = err instanceof Error ? err : new Error("Internal server error");
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}