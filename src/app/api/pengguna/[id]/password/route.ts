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

    return Response.json({
      message: "Password berhasil diubah",
      data: { id: data.user.id, email: data.user.email },
    });
  } catch (err: any) {
    return Response.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
