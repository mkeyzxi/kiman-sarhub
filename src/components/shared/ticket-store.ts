"use client";

import { useSyncExternalStore } from "react";
import { ewsTickets, type EWSTicket } from "./mock-data";

/**
 * Store tiket sederhana di sisi klien.
 *
 * Data awal berasal dari mock-data, lalu bisa ditambah / diubah saat sesi
 * berjalan. Bert purposely modul-level (bukan context) supaya tidak perlu
 * provider di layout dan tetap konsisten antar halaman.
 *
 * Catatan: ini hanya bertahan selama tab browser masih terbuka. Saat proyek
 * pindah ke backend, fungsi di bawah tinggal diganti dengan fetch.
 */

let tickets: EWSTicket[] = [...ewsTickets];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Dipakai saat render di server / saat snapshot diambil. */
function getServerSnapshot(): EWSTicket[] {
  return ewsTickets;
}

export function useTickets(): EWSTicket[] {
  return useSyncExternalStore(subscribe, () => tickets, getServerSnapshot);
}

export function getTicketById(id: string): EWSTicket | undefined {
  return tickets.find((t) => t.id === id);
}

export type TicketBaru = Omit<
  EWSTicket,
  "id" | "status" | "tanggalBuat" | "tanggalUpdate"
>;

export function addTicket(data: TicketBaru): EWSTicket {
  const hariIni = new Date().toISOString().slice(0, 10);
  const tiket: EWSTicket = {
    ...data,
    id: `ews-${String(tickets.length + 1).padStart(3, "0")}`,
    status: "Menunggu",
    tanggalBuat: hariIni,
    tanggalUpdate: hariIni,
  };

  tickets = [tiket, ...tickets];
  emit();
  return tiket;
}

export function updateTicketStatus(id: string, status: EWSTicket["status"]): void {
  tickets = tickets.map((t) =>
    t.id === id
      ? { ...t, status, tanggalUpdate: new Date().toISOString().slice(0, 10) }
      : t
  );
  emit();
}