import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-server";
import type { UserProfile } from "@/types/supabase";
import { ProfileClient } from "./client";

export default async function ProfilePage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  // Ambil profile dari public.users (server-side, bypass RLS via admin client)
  const supabaseAdmin = createSupabaseAdminClient();
  const { data: profile, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return <ProfileClient initialProfile={null} />;
  }

  return <ProfileClient initialProfile={profile as UserProfile} />;
}
