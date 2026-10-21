import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase-server";
import type { UserProfile } from "@/types/supabase";
import { EditPenggunaClient } from "./client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPenggunaPage({ params }: PageProps) {
  const { id } = await params;

  // Fetch data di server (bypass RLS via admin client)
  const supabaseAdmin = createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  return <EditPenggunaClient user={data as UserProfile} />;
}
