/**
 * Helper Identitas Login berbasis NIP
 * 
 * Aturan identitas (sesuai data yang sudah ada di live):
 *   auth.users.email      = {nip}@basarnas.ac.id   (9/9 user sudah demikian)
 *   public.users.nip      = {nip}                 (16-18 digit, diisi Admin IT)
 *   public.users.email    = {nip}@basarnas.ac.id   (bisa diisi admin, tapi opsional)
 * 
 * Fungsi: nipToInternalEmail() mengubah NIP jadi email yang dipakai Supabase auth.
 * Jika admin tidak isi email saat register → email akan di-set otomatis menjadi {nip}@basarnas.ac.id
 */

// Domain email yang sudah terpaksa di data existing (9/9 user)
// Gunakan domain basarnas.ac.id karena sudah ada di seluruh data user
export const INTERNAL_EMAIL_DOMAIN = "basarnas.ac.id";

/**
 * Normalisasi NIP: hapus spasi, titik, garis bawah, dan trim.
 * Menjaga kompatibilitas dengan data yang sudah ada (biasanya tanpapunpun punct).
 */
export function normalizeNip(raw: string): string {
  return raw.replace(/[\s.\-_]/g, "").trim();
}

/**
 * Konversi NIP jadi email internal Supabase auth.
 * Contoh: "198208042009121003" → "198208042009121003@basarnas.ac.id"
 */
export function nipToInternalEmail(nip: string): string {
  return `${normalizeNip(nip).toLowerCase()}@${INTERNAL_EMAIL_DOMAIN}`;
}

/**
 * Validasi format NIP: harus 16-18 digit purely numeric.
 * NIP Basarnas standar 18 digit (YYYYMMDDXXXXXXXXX), boleh 16-18.
 */
export function isValidNip(nip: string): boolean {
  const cleaned = normalizeNip(nip);
  return /^\d{16,18}$/.test(cleaned);
}

/**
 * Ambil email kontak opsional dari data user (bisa diisi admin).
 * Jika user.email di public.users NULL/empty → kembalikan null.
 */
export function getEmailKontak(userEmail: string | null | undefined): string | null {
  if (!userEmail) return null;
  return userEmail.trim().length > 0 ? userEmail : null;
}