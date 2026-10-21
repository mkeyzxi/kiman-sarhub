import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

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
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(id, {
      password: newPassword,
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Sync: tandai password_changed di public.users + app_metadata
    await supabaseAdmin
      .from("users")
      .update({ password_changed: true, updated_at: new Date().toISOString() })
      .eq("id", id);

    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(id);
    await supabaseAdmin.auth.admin.updateUserById(id, {
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
