import { notFound } from "next/navigation";
import { UserDetailClient } from "./client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DetailPenggunaPage({ params }: PageProps) {
  const { id } = await params;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/pengguna/${id}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    notFound();
  }

  const json = await res.json();

  if (json.error || !json.data) {
    notFound();
  }

  return <UserDetailClient user={json.data} />;
}