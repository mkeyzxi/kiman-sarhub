"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { roleLabels, roleDescriptions, getDefaultPageForRole } from "@/config/navigation";
import type { UserRole } from "@/components/shared/mock-data";
import Image from "next/image";

const roles: UserRole[] = [
  "ADMIN_IT",
  "PENGELOLA_BMN",
  "KAKANSAR",
  "OPERATOR_LAPANGAN",
];

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("OPERATOR_LAPANGAN");
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("userRole", selectedRole);
    router.push(getDefaultPageForRole(selectedRole));
  };

  return (
    <div className="flex min-h-screen w-full bg-white">
      
      {/* Bagian Kiri - Branding (Membentang ke ujung kiri) */}
      <div className="hidden w-1/2 flex-col items-center justify-center border-r border-slate-200 bg-slate-50 p-12 lg:flex">
        <div className="relative mb-8 flex size-40 items-center justify-center rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <Image 
            src="/logo-transparant.png" 
            alt="Logo Siap SAR" 
            width={120} 
            height={120} 
            className="object-contain" 
          />
        </div>
        <h1 className="text-center text-4xl font-extrabold tracking-tight text-slate-800">
          Siap SAR
        </h1>
        <p className="mt-4 max-w-md text-center text-base font-medium leading-relaxed text-slate-500">
          Sistem Informasi Aset Terpadu
          <br />
          Kantor Pencarian dan Pertolongan Kelas B Mamuju
        </p>
      </div>

      {/* Bagian Kanan - Form Autentikasi (Membentang ke ujung kanan) */}
      <div className="flex w-full items-center justify-center p-8 sm:p-12 lg:w-1/2">
        <div className="w-full max-w-md">
          
          {/* Header untuk mobile (muncul saat layar kecil karena panel kiri hilang) */}
          <div className="mb-10 flex flex-col items-center text-center lg:hidden">
             <div className="relative mb-6 flex size-24 items-center justify-center rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
              <Image 
                src="/logo-transparant.png" 
                alt="Logo Siap SAR" 
                width={64} 
                height={64} 
                className="object-contain" 
              />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Siap SAR</h1>
            <p className="mt-2 text-sm text-slate-500">Kantor Pencarian dan Pertolongan Kelas B Mamuju</p>
          </div>

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
            <Button type="submit" className="h-12 w-full text-base font-semibold" size="lg">
              Masuk
            </Button>
          </form>

          {/* Role Selector (Dev Mode) */}
          <div className="mt-10 border-t border-slate-100 pt-8">
            <p className="mb-5 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
              Masuk Sebagai (Mode Dev)
            </p>
            <div className="grid grid-cols-2 gap-3">
              {roles.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  className={`flex flex-col items-start rounded-xl border p-3.5 text-left transition-all ${
                    selectedRole === role
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`block text-xs font-bold ${
                      selectedRole === role ? "text-primary" : "text-slate-700"
                    }`}
                  >
                    {roleLabels[role]}
                  </span>
                  <span className="mt-1.5 line-clamp-2 block text-[10px] leading-relaxed text-slate-500">
                    {roleDescriptions[role]}
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Footer */}
          <p className="mt-12 text-center text-xs font-medium text-slate-400">
            &copy; {new Date().getFullYear()} Kantor Pencarian dan Pertolongan Kelas B Mamuju. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}