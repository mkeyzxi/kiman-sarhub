import type { ReactNode } from "react";
import { MobileNav } from "@/components/layout/mobile-nav";
import { MobileTopNav } from "@/components/layout/mobile-top-nav";

export default function MobileLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 md:pl-64">
      <MobileTopNav />
      <main className="mx-auto max-w-md px-4 pb-20 pt-6 sm:max-w-lg md:max-w-2xl md:px-6 lg:max-w-4xl lg:px-8 xl:max-w-6xl">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
