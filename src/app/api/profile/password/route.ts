import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  createServerSupabaseClient,
  createSupabaseAdminClient,
  getAuthenticatedUser,
} from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password baru minimal 8 karakter" },
        { status: 400 }
      );
    }

    // Verifikasi password saat ini via sign-in attempt dengan anon key.
    // NIP = identitas login → email identitas di auth.users = {nip}@basarnas.ac.id.
    // Ambil NIP dari user_metadata di user auth (sudah di-backfill oleh
    // repair-auth-metadata.mjs). Fallback ke user.email prefix jika NIP belum ada.
    const supabaseAnon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Baca user_metadata (butuh service_role; fallback: prefix dari user.email)
    const supabaseAdmin = createSupabaseAdminClient();
    const { data: authUserResp } =
      await supabaseAdmin.auth.admin.getUserById(user.id);
    const nip =
      (authUserResp?.user?.user_metadata as Record<string, unknown> | undefined)?.nip ??
      user.email!.split("@")[0];

    const { error: signInError } = await supabaseAnon.auth.signInWithPassword({
      email: `${nip}@basarnas.ac.id`,
      password: currentPassword,
    });

    if (signInError) {
      return NextResponse.json(
        { error: "Password saat ini salah" },
        { status: 400 }
      );
    }

    // Update password via server client (session-based,writing back to cookies)
    const supabase = await createServerSupabaseClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Tandai di public.users bahwa password sudah pernah diubah
    // (pakai client service_role yang sudah dibuat di atas)
    await supabaseAdmin
      .from("users")
      .update({
        password_changed: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    return NextResponse.json({ message: "Password berhasil diubah" });
  } catch (err) {
    const error = err instanceof Error ? err : new Error("Internal server error");
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
