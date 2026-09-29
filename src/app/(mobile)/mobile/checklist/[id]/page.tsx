import { MobileChecklist } from "./MobileChecklist";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MobileChecklist id={id} />;
}
