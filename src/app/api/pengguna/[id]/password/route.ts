import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import type { Database } from "@/types/supabase";
import { getAuthenticatedUser } from "@/lib/supabase-server";

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

/**
 * Guard: hanya ADMIN_IT yang boleh mereset password user.
 */
async function requireAdminIT() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return null;
  }
  const { data: row } = await getSupabaseAdmin()
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (row?.role !== "ADMIN_IT") {
    return null;
  }
  return user;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ── Otorisasi: hanya ADMIN_IT yang boleh mereset password ──────────
    const adminUser = await requireAdminIT();
    if (!adminUser) {
      return Response.json({ error: "Hanya admin yang boleh mengakses" }, { status: 403 });
    }

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

    const { data: authUser } = await getSupabaseAdmin().auth.admin.getUserById(id);
    await getSupabaseAdmin().auth.admin.updateUserById(id, {
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
