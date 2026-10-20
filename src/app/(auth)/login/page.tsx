"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { getDefaultPageForRole } from "@/config/navigation";
import { loginWithEmail } from "@/lib/auth";
import type { UserRole } from "@/components/shared/mock-data";
import Image from "next/image";

const LOGIN_BACKGROUND = "/login-background.webp";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Gunakan autentikasi Supabase yang sebenarnya
      const result = await loginWithEmail(email, password);

      if (result.error) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      if (result.data) {
        // Simpan role dari database (bukan hardcoded!)
        const userRole = result.data.role as UserRole;
        localStorage.setItem("userRole", userRole);
        localStorage.setItem("userEmail", result.data.email);
        localStorage.setItem("userNama", result.data.nama);

        // Redirect sesuai role dari database
        router.push(getDefaultPageForRole(userRole));
      }
    } catch (err: any) {
      setError(err.message || "Login gagal. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white">
      {/* Bagian Kiri - Branding (Hanya muncul di Desktop) */}
      <div
        className="relative hidden w-1/2 flex-col items-center justify-center bg-cover bg-center p-12 lg:flex"
        style={{ backgroundImage: `url(${LOGIN_BACKGROUND})` }}
      >
        {/* Overlay gelap agar teks putih tetap kontras */}
        <div className="absolute inset-0 bg-black/60"></div>

        <div className="relative z-10 flex flex-col items-center">
          {/* Logo muncul di desktop (kiri) dengan ukuran proporsional */}
          <Image 
            src="/logo-transparant.png" 
            alt="Logo Siap SAR" 
            width={180} 
            height={180} 
            className="mb-6 drop-shadow-lg"
          />
          <h1 className="text-center text-4xl font-extrabold tracking-tight text-white drop-shadow-md">
            Siap SAR
          </h1>
          <p className="mt-4 max-w-md text-center text-base font-medium leading-relaxed text-slate-100 drop-shadow">
            Sistem Informasi Aset Terpadu
            <br />
            Kantor Pencarian dan Pertolongan Kelas B Mamuju
          </p>
        </div>
      </div>

      {/* Bagian Kanan - Form Autentikasi */}
      <div className="flex w-full items-center justify-center p-8 sm:p-12 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Header Mobile: Logo muncul di sini karena panel kiri disembunyikan */}
          <div className="mb-10 flex flex-col items-center text-center lg:hidden">
            <Image 
              src="/logo-transparant.png" 
              alt="Logo Siap SAR" 
              width={80} 
              height={80} 
              className="mb-4"
            />
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">Siap SAR</h1>
            <p className="mt-2 text-sm font-medium text-slate-500">Kantor Pencarian dan Pertolongan Kelas B Mamuju</p>
          </div>

          {/* Header Desktop: Tanpa logo agar tidak redundan dengan panel kiri */}
          <div className="mb-8 hidden lg:block">
            <h2 className="text-3xl font-bold text-slate-800">Selamat Datang</h2>
            <p className="mt-2 text-base text-slate-500">Silakan masuk ke akun Anda untuk melanjutkan.</p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@basarnas.go.id"
                  className="h-12 pl-11 text-base"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  className="h-12 pl-11 pr-12 text-base"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 transition-colors hover:text-slate-700"
                >
                  {showPassword ? (
                    <EyeOff className="size-5" />
                  ) : (
                    <Eye className="size-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Remember me & Forgot password */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remember"
                  className="size-4 rounded border-slate-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="remember" className="cursor-pointer text-sm font-normal text-slate-600">
                  Ingat saya
                </Label>
              </div>
              <a
                href="#"
                className="text-sm font-semibold text-primary hover:underline"
              >
                Lupa password?
              </a>
            </div>

            {/* Submit */}
            <Button 
              type="submit" 
              className="h-12 w-full text-base font-semibold" 
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Masuk"
              )}
            </Button>
          </form>

          {/* Footer */}
          <p className="mt-12 text-center text-xs font-medium text-slate-400">
            &copy; {new Date().getFullYear()} Kantor Pencarian dan Pertolongan Kelas B Mamuju. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}