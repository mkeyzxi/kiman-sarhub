'use client'

import {Suspense, useState} from 'react'
import {useRouter, useSearchParams} from 'next/navigation'
import {Lock, Eye, EyeOff, Loader2, AlertTriangle, UserRound} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Input, Label} from '@/components/ui/input'
import {getDefaultPageForRole} from '@/config/navigation'
import {loginWithNip, INACTIVE_ACCOUNT_MESSAGE} from '@/lib/auth'
import {isValidNip, normalizeNip} from '@/lib/auth-identity'
import type {UserRole} from '@/components/shared/mock-data'
import Image from 'next/image'

const LOGIN_BACKGROUND = '/login-background.webp'

export default function LoginPage() {
  // `useSearchParams` memerlukan Suspense boundary agar halaman bisa
  // di-prerender secara statis.
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  )
}

function LoginSkeleton() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-slate-500">Memuat...</p>
      </div>
    </div>
  )
}

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [nip, setNip] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Pesan dari query param (mis. "?error=Akun Anda nonaktif. Silahkan
  // menghubungi admin.") — dibaca langsung, tanpa setState di dalam effect.
  const paramError = searchParams.get('error')

  // Error yang ditampilkan: pesan dari URL lebih diprioritaskan
  const error = paramError ?? formError

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    // Validasi NIP 16-18 digit di client (instan, tanpa RTT)
    if (!isValidNip(nip)) {
      setFormError("NIP tidak valid. Harus 16-18 digit angka.")
      return
    }

    setIsLoading(true)

    try {
      // Gunakan autentikasi Supabase dengan NIP (email dipetakan otomatis)
      const result = await loginWithNip(normalizeNip(nip), password)

      if (result.error) {
        setFormError(result.error)
        setIsLoading(false)
        return
      }

      if (result.data) {
        // Simpan role dari database (bukan hardcoded!)
        const userRole = result.data.role as UserRole
        localStorage.setItem('userRole', userRole)
        localStorage.setItem('userNip', result.data.nip ?? nip)
        localStorage.setItem('userNama', result.data.nama)

        // Redirect sesuai role dari database
        router.push(getDefaultPageForRole(userRole))
      }
    } catch (err) {
      const error = err as Error
      setFormError(error.message || 'Login gagal. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-white">
      {/* Bagian Kiri - Branding (Hanya muncul di Desktop) */}
      <div
        className="relative hidden w-1/2 flex-col items-center justify-center bg-cover bg-center p-12 lg:flex"
        style={{backgroundImage: `url(${LOGIN_BACKGROUND})`}}
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
            <p className="mt-2 text-sm font-medium text-slate-500">
              Kantor Pencarian dan Pertolongan Kelas B Mamuju
            </p>
          </div>

          {/* Header Desktop: Tanpa logo agar tidak redundan dengan panel kiri */}
          <div className="mb-8 hidden lg:block">
            <h2 className="text-3xl font-bold text-slate-800">Selamat Datang</h2>
            <p className="mt-2 text-base text-slate-500">
              Silakan masuk ke akun Anda untuk melanjutkan.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            {/* NIP — identitas login */}
            <div className="space-y-2">
              <Label htmlFor="nip">NIP</Label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                <Input
                  id="nip"
                  type="text"
                  inputMode="numeric"
                  placeholder="Masukkan NIP"
                  className="h-12 pl-11 text-base font-mono tracking-wider"
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  required
                  minLength={16}
                  maxLength={18}
                />
              </div>
              <p className="text-xs text-slate-400">
                Masukkan NIP Anda (16-18 digit) untuk login.
              </p>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
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
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div
                role="alert"
                aria-live="assertive"
                className={
                  error === INACTIVE_ACCOUNT_MESSAGE
                    ? 'flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800'
                    : 'rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600'
                }
              >
                {error === INACTIVE_ACCOUNT_MESSAGE && (
                  <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
                )}
                <div>
                  {error === INACTIVE_ACCOUNT_MESSAGE && (
                    <p className="font-semibold">Akses Ditolak</p>
                  )}
                  <p className={error === INACTIVE_ACCOUNT_MESSAGE ? 'mt-0.5' : ''}>{error}</p>
                </div>
              </div>
            )}

            {/* Remember me & Forgot password */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="remember" className="peer sr-only" />
                <label
                  htmlFor="remember"
                  className="
      relative flex items-center justify-center size-4 rounded-full border border-slate-300 bg-white cursor-pointer
      transition-all duration-100 ease-out
      hover:border-primary/80
      active:scale-90 active:ring-2 active:ring-primary/30
      peer-checked:bg-primary peer-checked:border-primary
      peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40
    "
                >
                  <svg
                    className="size-3 text-white scale-0 transition-transform duration-100 ease-out peer-checked:scale-100"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </label>
                <Label
                  htmlFor="remember"
                  className="cursor-pointer text-sm font-normal text-slate-600 select-none"
                >
                  Ingat saya
                </Label>
              </div>
              <a href="#" className="text-sm font-semibold text-primary hover:underline">
                Hubungi Admin IT
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
                'Masuk'
              )}
            </Button>
          </form>

          {/* Footer */}
          <p className="mt-12 text-center text-xs font-medium text-slate-400">
            &copy; {new Date().getFullYear()} Kantor Pencarian dan Pertolongan Kelas B Mamuju. All
            rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
