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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nama, nip, email, aktif } = body;

    // Update di public.users
    const { data, error } = await supabaseAdmin
      .from("users")
      .update({
        nama,
        nip: nip || "",
        email,
        aktif,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Update juga user_metadata di auth.users
    await supabaseAdmin.auth.admin.updateUserById(id, {
      user_metadata: { role: body.role, nip, nama },
    });

    return Response.json({
      message: "Pengguna berhasil diperbarui",
      data,
    });
  } catch (err: any) {
    return Response.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Soft delete: set aktif=false dan deleted_at timestamp
    const { data, error } = await supabaseAdmin
      .from("users")
      .update({
        aktif: false,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      message: "Pengguna berhasil dihapus (soft delete)",
      data,
    });
  } catch (err: any) {
    return Response.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}