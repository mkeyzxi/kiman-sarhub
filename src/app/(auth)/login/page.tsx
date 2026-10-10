"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LifeBuoy, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { roleLabels, roleDescriptions, getDefaultPageForRole } from "@/config/navigation";
import type { UserRole } from "@/components/shared/mock-data";

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
    <div className="w-full max-w-md">
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex size-14 items-center justify-center rounded-xl bg-primary">
            <LifeBuoy className="size-8 text-white" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-800">Siap SAR</h1>
          <p className="mt-1 text-sm text-slate-500">
            Sistem Informasi Aset Terpadu
          </p>
        </div>

        {/* Form */}
        <form className="space-y-4" onSubmit={handleLogin}>
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
              <Input
                id="email"
                type="email"
                placeholder="nama@basarnas.go.id"
                className="pl-9"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Masukkan password"
                className="pl-9 pr-9"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>

          {/* Remember me & Forgot password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                className="size-4 rounded border-slate-200 text-primary focus:ring-primary"
              />
              <Label htmlFor="remember" className="font-normal">
                Ingat saya
              </Label>
            </div>
            <a
              href="#"
              className="text-sm font-medium text-primary hover:text-primary-hover"
            >
              Lupa password?
            </a>
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full" size="lg">
            Masuk
          </Button>
        </form>

        {/* Role Selector */}
        <div className="mt-8 border-t border-slate-100 pt-6">
          <p className="mb-3 text-center text-xs font-medium uppercase tracking-wider text-slate-500">
            Masuk Sebagai (Mode Dev)
          </p>
          <div className="grid grid-cols-2 gap-2">
            {roles.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setSelectedRole(role)}
                className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${
                  selectedRole === role
                    ? "border-primary bg-primary-light"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <span
                  className={`block text-xs font-semibold ${
                    selectedRole === role ? "text-primary" : "text-slate-700"
                  }`}
                >
                  {roleLabels[role]}
                </span>
                <span className="block text-[10px] text-slate-400 mt-0.5 leading-tight">
                  {roleDescriptions[role]}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-6 text-center text-xs text-slate-500">
        &copy; 2026 Kantor Pencarian dan Pertolongan Kelas B Mamuju. All
        rights reserved.
      </p>
    </div>
  );
}
