import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase-server";
import type { UserProfile } from "@/types/supabase";
import { UserDetailClient } from "./client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DetailPenggunaPage({ params }: PageProps) {
  const { id } = await params;

  // Query langsung ke Supabase (bypass RLS via admin client).
  //
  // PENTING: jangan fetch API sendiri lewat `http://localhost:3000`.
  // Di lokal itu kebetulan jalan (dev server ada di port 3000), tapi di
  // Vercel tidak ada proses di localhost → fetch ditolak (ECONNREFUSED)
  // → Server Component crash → "This page couldn't load".
  const supabaseAdmin = createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  return <UserDetailClient user={data as UserProfile} />;
}