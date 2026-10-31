"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Wrench, Package, AlertTriangle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Label, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  type TingkatKeparahan,
} from "@/components/shared/mock-data";
import { addTicket } from "@/components/shared/ticket-store";
import {
  updateBeritaAcaraStatus,
} from "@/components/shared/db-writes";
import { useAsets, useSupabaseUsers } from "@/components/shared/use-supabase-data";
import { roleLabels, type UserRole } from "@/config/navigation";
import {
  useBeritaAcara,
  terapkanPatchBeritaAcara,
} from "@/components/shared/berita-acara-store";
import { DataLoading, DataError } from "@/components/shared/data-state";

const keparahanOptions: TingkatKeparahan[] = ["Rendah", "Sedang", "Tinggi"];

const keparahanHints: Record<TingkatKeparahan, string> = {
  Rendah: "Kerusakan ringan, unit masih bisa dipakai untuk operasional.",
  Sedang: "Unit berfungsi terbatas, perlu segera diperbaiki.",
  Tinggi: "Unit tidak dapat dipakai untuk operasional.",
};

/** Label jabatan ramah untuk dropdown petugas. */
const labelJabatan = (role: string): string =>
  roleLabels[role as UserRole] ?? role;

export default function BuatTiketPage() {
  // useSearchParams butuh batas Suspense pada prerender statis.
  return (
    <Suspense fallback={<DataLoading label="Menyiapkan form tiket…" />}>
      <BuatTiketForm />
    </Suspense>
  );
}

function BuatTiketForm() {
  // Prefill dari berita acara yang telah di-acc KAKANSAR:
  // /bmn/maintenance/buat?aset=<asetId>&ba=<baId>
  const searchParams = useSearchParams();
  const asetPrefill = searchParams.get("aset") ?? "";
  const baId = searchParams.get("ba") ?? "";

  // Aset dari Supabase.
  const { data: asetList, loading, error, refetch } = useAsets();
  // Daftar BA — dipakai untuk penyambungan tiket dan penapisan kandidat aset.
  const baSemua = useBeritaAcara();
  // Daftar pengguna dari Supabase (bukan mock) — dropdown "Ditugaskan
  // Kepada"; value NIP agar tersimpan ke ews_tickets.assigned_to (NIP).
  const { data: userSemua } = useSupabaseUsers();

  const [formData, setFormData] = useState({
    asetId: asetPrefill,
    judul: "",
    deskripsi: "",
    tingkatKeparahan: "Sedang" as TingkatKeparahan,
    assignedTo: "",
  });
  // "Ditugaskan Kepada" terisi otomatis dari penanggung jawab aset; bila
  // pengguna memilih sendiri, pilihan manual dipertahankan sampai aset
  // diganti (lalu kembali otomatis mengikuti PJ aset baru).
  const [assignedToManual, setAssignedToManual] = useState(false);

  const router = useRouter();
  const [menyimpan, setMenyimpan] = useState(false);
  const [gagal, setGagal] = useState<string | null>(null);

  // ── Dasar penerbitan tiket: BERITA ACARA yang di-acc KAKANSAR ──
  //
  // Dropdown "Pilih Aset Rusak" hanya menampilkan aset yang memiliki
  // berita acara berstatus "Disetujui" dan belum menerbitkan tiket.
  // Aset rusak yang BA-nya masih draf/diproses/ditolak — atau BA-nya
  // sudah dinikahkan dengan tiket — tidak muncul di daftar.
  const baDisetujuiAktif = baSemua.filter(
    (b) => b.status === "Disetujui" && !b.tiketId && !!b.asetId
  );

  /** BA "Disetujui" (belum punya tiket) milik sebuah aset, bila ada. */
  const baDisetujuiUntuk = (asetId: string) =>
    baDisetujuiAktif.find((b) => b.asetId === asetId);

  // Banner penyambungan BA:
  // - prefill URL (?ba=...) → BA yang jadi dasar tiket;
  // - pemilihan aset manual di dropdown → BA "Disetujui" milik aset
  //   tersebut (tersambung otomatis, buatan keduanya terlacak dua arah).
  const baTersambung = baId
    ? baSemua.find((b) => b.id === baId)
    : formData.asetId
      ? baDisetujuiUntuk(formData.asetId)
      : undefined;

  // BA tidak sah → penerbitan tiket diblokir: tidak ketemu, belum
  // "Disetujui", atau sudah punya tiket.
  const baTidakSah =
    (!!baId && !baTersambung) ||
    (!!baTersambung &&
      (baTersambung.status !== "Disetujui" || !!baTersambung.tiketId));

  if (loading) {
    return <DataLoading label="Memuat daftar aset…" />;
  }
  if (error) {
    return (
      <DataError
        error={error}
        onRetry={refetch}
        label="Gagal memuat aset dari database"
      />
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Tiket hanya boleh terbit dari berita acara yang sah milik aset
    // terpilih ("Disetujui" dan belum punya tiket).
    if (baTidakSah) {
      setGagal(
        baTersambung
          ? "Berita acara terkait belum disetujui KAKANSAR atau sudah punya tiket — tiket tidak dapat diterbitkan."
          : "Berita acara terkait tidak ditemukan — tiket tidak dapat diterbitkan."
      );
      return;
    }
    setMenyimpan(true);
    setGagal(null);
    const tiket = addTicket({
      asetId: formData.asetId,
      judul: formData.judul,
      deskripsi: formData.deskripsi,
      tingkatKeparahan: formData.tingkatKeparahan,
      assignedTo: assignedToEfektif,
    });

    // Sambungkan tiket ke berita acara yang jadi dasarnya (status BA tetap
    // "Disetujui" — hanya tiket_id yang diisi) supaya kartu BA tampil di
    // detail tiket dan alur bisa dilacak dua arah. BA yang terisi tiket_id
    // otomatis menyisihkan asetnya dari dropdown penerbitan berikutnya.
    const baEfektif = baId || baTersambung?.id || "";
    if (baEfektif) {
      try {
        await updateBeritaAcaraStatus(baEfektif, "Disetujui", {
          tiketId: tiket.id,
        });
        terapkanPatchBeritaAcara(baEfektif, { tiketId: tiket.id });
      } catch (e) {
        setGagal(
          e instanceof Error
            ? e.message
            : "Gagal menyambungkan tiket ke berita acara"
        );
        setMenyimpan(false);
        return;
      }
    }

    router.push("/bmn/maintenance");
  };

  const asetTerpilih = asetList.find((a) => a.id === formData.asetId);

  // Dropdown hanya memuat aset yang berita acaranya sudah "Disetujui"
  // KAKANSAR (dan belum punya tiket). Aset rusak yang alur BA-nya masih
  // berjalan / ditolak tidak ditampilkan — tiket tidak boleh terbit tanpa
  // persetujuan berita acara.
  const asetKandidat = asetList.filter((a) => !!baDisetujuiUntuk(a.id));

  // ── Autofill "Ditugaskan Kepada" ──
  // Petugas pelaksana default = operator lapangan penanggung jawab aset
  // terpilih (NIP dari kolom asets.penanggung_jawab). Nilai tetap bisa
  // diubah manual lewat dropdown bila penugasan berbeda.
  const nipPJ = asetTerpilih?.penanggungJawab ?? "";
  const userPJ = nipPJ ? userSemua.find((u) => u.nip === nipPJ) : undefined;
  const namaPJ = userPJ?.nama ?? "";
  const assignedToEfektif =
    !assignedToManual && nipPJ ? nipPJ : formData.assignedTo;

  return (
    <div className="max-w-3xl space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link href="/bmn/maintenance">
          <Button variant="ghost" size="icon" aria-label="Kembali">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Buat Tiket Maintenance</h1>
          <p className="mt-1 text-sm text-slate-500">
            Laporkan kerusakan atau kebutuhan perawatan sebuah aset
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Aset */}
        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
            <Package className="h-5 w-5 text-primary" />
            Aset Bermasalah
          </h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="asetId">Pilih Aset Rusak</Label>
              <Select
                id="asetId"
                value={formData.asetId}
                onChange={(e) => {
                  // Aset diganti → penugasan kembali otomatis mengikuti
                  // penanggung jawab aset baru.
                  setFormData({
                    ...formData,
                    asetId: e.target.value,
                    assignedTo: "",
                  });
                  setAssignedToManual(false);
                }}
                // Dari alur berita acara: aset dikunci sesuai BA — memilih
                // aset lain akan memutus relasi BA ↔ tiket.
                disabled={!!baId}
                required
              >
                <option value="">Pilih aset (berita acara sudah disetujui)</option>
                {asetKandidat.map((aset) => (
                  <option key={aset.id} value={aset.id}>
                    {aset.kode} ({aset.nama}) — {aset.status}
                  </option>
                ))}
              </Select>
              {asetList.length > 0 && asetKandidat.length === 0 && (
                <p className="mt-1 text-xs text-slate-500">
                  Belum ada aset dengan berita acara berstatus
                  &quot;Disetujui&quot;. Aset masuk ke daftar ini setelah alurnya
                  selesai: operator mengisi berita acara &rarr; &quot;Serahkan
                  ke BMN&quot; &rarr; BMN mengisi nomor surat &rarr; KAKANSAR
                  meng-acc berita acara. Aset yang BA-nya belum di-acc atau
                  sudah menerbitkan tiket tidak ditampilkan.
                </p>
              )}
            </div>

            {/* Banner BA tidak sah (prefill URL ke BA yang belum di-acc /
                sudah punya tiket) → penerbitan diblokir */}
            {baTidakSah && (
              <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                <p className="text-xs text-rose-800">
                  {baTersambung ? (
                    <>
                      Berita acara{" "}
                      <strong>{baTersambung.nomor || baTersambung.id}</strong>{" "}
                      berstatus &quot;{baTersambung.status}&quot;
                      {baTersambung.tiketId
                        ? " dan sudah menerbitkan tiket"
                        : " (belum di-acc KAKANSAR)"}{" "}
                      — tiket tidak dapat diterbitkan dari berita acara ini.
                    </>
                  ) : (
                    "Berita acara yang ditunjuk tidak ditemukan — tiket tidak dapat diterbitkan."
                  )}
                </p>
              </div>
            )}

            {/* Banner penyambungan berita acara (prefill dari halaman BA BMN,
                atau otomatis saat aset dipilih manual di dropdown) */}
            {baTersambung && !baTidakSah && (
              <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                <p className="text-xs text-blue-800">
                  Tiket ini akan disambungkan ke berita acara{" "}
                  <strong>{baTersambung.nomor || baTersambung.id}</strong>{" "}
                  ({baTersambung.namaAset}) yang telah disetujui KAKANSAR.
                  {baId
                    ? " Aset sudah terpilih otomatis di dropdown di atas."
                    : " Sambungan dibuat otomatis dari aset yang dipilih di dropdown."}
                </p>
              </div>
            )}

            {asetTerpilih && (
              <div className="grid grid-cols-1 gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Kondisi Saat Ini
                  </p>
                  <p className="text-sm font-medium text-slate-800">
                    {asetTerpilih.kondisi}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Status
                  </p>
                  <p className="text-sm font-medium text-slate-800">
                    {asetTerpilih.status}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Lokasi
                  </p>
                  <p className="text-sm font-medium text-slate-800">
                    {asetTerpilih.lokasi}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Detail Kerusakan */}
        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
            <Wrench className="h-5 w-5 text-primary" />
            Detail Kerusakan
          </h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="judul">Judul Tiket</Label>
              <Input
                id="judul"
                placeholder="Contoh: Mesin Rescue Truck Bunyi Kasar"
                value={formData.judul}
                onChange={(e) =>
                  setFormData({ ...formData, judul: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deskripsi">Deskripsi</Label>
              <Textarea
                id="deskripsi"
                rows={5}
                placeholder="Jelaskan gejala kerusakan, kapan terjadi, dan dampaknya terhadap operasional..."
                value={formData.deskripsi}
                onChange={(e) =>
                  setFormData({ ...formData, deskripsi: e.target.value })
                }
                required
              />
            </div>
          </div>
        </Card>

        {/* Severity & Petugas */}
        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
            <AlertTriangle className="h-5 w-5 text-primary" />
            Severity &amp; Penanggung Jawab
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tingkatKeparahan">Tingkat Keparahan</Label>
              <Select
                id="tingkatKeparahan"
                value={formData.tingkatKeparahan}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tingkatKeparahan: e.target.value as TingkatKeparahan,
                  })
                }
              >
                {keparahanOptions.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </Select>
              <p className="mt-1 text-xs text-slate-500">
                {keparahanHints[formData.tingkatKeparahan]}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignedTo">Ditugaskan Kepada</Label>
              <Select
                id="assignedTo"
                value={assignedToEfektif}
                onChange={(e) => {
                  setAssignedToManual(true);
                  setFormData({ ...formData, assignedTo: e.target.value });
                }}
                required
              >
                <option value="">Pilih petugas</option>
                {userSemua
                  .filter((u) => u.aktif)
                  .map((u) => (
                    <option key={u.nip || u.id} value={u.nip}>
                      {u.nama} ({labelJabatan(u.role)})
                    </option>
                  ))}
              </Select>
              <p className="mt-1 text-xs text-slate-500">
                {nipPJ
                  ? `Otomatis terisi ${namaPJ || nipPJ} — operator lapangan penanggung jawab aset ini.`
                  : "Aset terpilih belum memiliki penanggung jawab terdaftar — pilih petugas secara manual."}
              </p>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/bmn/maintenance">
            <Button variant="outline">Batal</Button>
          </Link>
          <Button type="submit" disabled={menyimpan}>
            {menyimpan ? "Menyimpan..." : "Buat Tiket"}
          </Button>
        </div>
        {gagal && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
            {gagal}
          </p>
        )}
      </form>
    </div>
  );
}