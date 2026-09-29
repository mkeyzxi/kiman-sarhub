import { MobileAsetDetail } from "./MobileAsetDetail";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MobileAsetDetail id={id} />;
}
