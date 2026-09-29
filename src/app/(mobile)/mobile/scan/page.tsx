"use client";

import { useState } from "react";
import Link from "next/link";
import { Zap, ZapOff, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MobileScanPage() {
  const [flashOn, setFlashOn] = useState(false);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Camera Placeholder */}
      <div className="relative flex h-[60vh] w-full max-w-2xl items-center justify-center overflow-hidden rounded-2xl bg-slate-900">
        {/* Scan Frame */}
        <div className="relative h-64 w-64">
          {/* Corner Brackets */}
          <div className="absolute left-0 top-0 h-10 w-10 rounded-tl-lg border-l-4 border-t-4 border-white" />
          <div className="absolute right-0 top-0 h-10 w-10 rounded-tr-lg border-r-4 border-t-4 border-white" />
          <div className="absolute bottom-0 left-0 h-10 w-10 rounded-bl-lg border-b-4 border-l-4 border-white" />
          <div className="absolute bottom-0 right-0 h-10 w-10 rounded-br-lg border-b-4 border-r-4 border-white" />

          {/* Scan Line Animation */}
          <div className="absolute left-2 right-2 top-1/2 h-0.5 -translate-y-1/2 animate-pulse bg-primary/60" />
        </div>

        {/* Instruction Overlay */}
        <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-2 px-8 text-center">
          <p className="text-sm font-medium text-white">
            Arahkan kamera ke QR Code
          </p>
          <p className="text-xs text-slate-400">
            Pastikan QR Code berada di dalam bingkai
          </p>
        </div>

        {/* Flash Toggle */}
        <button
          onClick={() => setFlashOn(!flashOn)}
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-colors hover:bg-white/20"
          aria-label={flashOn ? "Matikan flash" : "Nyalakan flash"}
        >
          {flashOn ? (
            <Zap className="h-5 w-5 text-amber-400" />
          ) : (
            <ZapOff className="h-5 w-5 text-white" />
          )}
        </button>

        {/* Flash Status Indicator */}
        {flashOn && (
          <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-amber-400/20 px-3 py-1">
            <Zap className="h-3 w-3 text-amber-400" />
            <span className="text-xs font-medium text-amber-400">Flash Aktif</span>
          </div>
        )}
      </div>

      {/* Input Manual Button */}
      <div className="w-full">
        <Link href="/mobile/aset" className="block">
          <Button variant="outline" size="lg" className="w-full gap-2">
            <Keyboard className="h-5 w-5" />
            Input Manual
          </Button>
        </Link>
      </div>
    </div>
  );
}
