import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import type { Database } from "@/types/supabase";

/**
 * Admin client dibuat lazily (saat dipakai) supaya modul ini aman
 * dievaluasi saat build/prerender — env tidak tersedia di worker build.
 */
let supabaseAdmin: SupabaseClient<Database> | null = null;

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    supabaseAdmin = createClient<Database>(
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
  return supabaseAdmin;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { newPassword } = body;

    if (!newPassword || newPassword.length < 8) {
      return Response.json(
        { error: "Password minimal 8 karakter" },
        { status: 400 }
      );
    }

    // Update password via Admin API
    const { data, error } = await getSupabaseAdmin().auth.admin.updateUserById(
      id,
      {
        password: newPassword,
      }
    );

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Sync: tandai password_changed di public.users + app_metadata
    await getSupabaseAdmin()
      .from("users")
      .update({ password_changed: true, updated_at: new Date().toISOString() })
      .eq("id", id);

    const admin = getSupabaseAdmin();
    const { data: authUser } = await admin.auth.admin.getUserById(id);
    await admin.auth.admin.updateUserById(id, {
      app_metadata: {
        ...(authUser?.user?.app_metadata ?? {}),
        password_changed: true,
      },
    });

    return Response.json({
      message: "Password berhasil diubah",
      data: { id: data.user.id, email: data.user.email },
    });
  } catch (err) {
    const error = err instanceof Error ? err : new Error("Internal server error");
    return Response.json({ error: error.message }, { status: 500 });
  }
}
