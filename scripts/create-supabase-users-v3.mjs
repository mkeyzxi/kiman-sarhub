/**
 * Script v3: Membuat user Supabase via Admin API + SQL langsung
 * Jalankan dengan: node scripts/create-supabase-users-v3.mjs
 * 
 * Perubahan:
 * 1. Delete penuh via SQL (bypass RLS dengan service_role)
 * 2. Upsert untuk public.users
 * 3. Verifikasi setiap langkah
 */

import { createClient } from '@supabase/supabase-js';

// Konfigurasi Supabase
const SUPABASE_URL = 'https://yzswezcgttegsrqisrfq.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_MaYZXFo-08LcmBAY9W9H7g_MbVPz5Q2';
const SUPABASE_ANON_KEY = 'sb_publishable_jePkTZY_0kzZenRCN3Dzyg_U0VlZ8s-';

// Buat client dengan service_role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Data user dari data-role.md
const users = [
  {
    email: '198208042009121003@basarnas.ac.id',
    password: 'password123',
    role: 'ADMIN_IT',
    nip: '198208042009121003',
    nama: 'Mahmud Afandi',
  },
  {
    email: '199810212022032001@basarnas.ac.id',
    password: 'password123',
    role: 'PENGELOLA_BMN',
    nip: '199810212022032001',
    nama: 'Medline',
  },
  {
    email: '200006042025061006@basarnas.ac.id',
    password: 'password123',
    role: 'ADMIN_IT',
    nip: '200006042025061006',
    nama: 'Oky Juneva Marsel',
  },
  {
    email: '198607222007121001@basarnas.ac.id',
    password: 'password123',
    role: 'OPERATOR_LAPANGAN',
    nip: '198607222007121001',
    nama: 'Andi Juli Adenam Syariyanto',
  },
  {
    email: '198212022007121002@basarnas.ac.id',
    password: 'password123',
    role: 'OPERATOR_LAPANGAN',
    nip: '198212022007121002',
    nama: 'Hasril',
  },
  {
    email: '198908082010121001@basarnas.ac.id',
    password: 'password123',
    role: 'OPERATOR_LAPANGAN',
    nip: '198908082010121001',
    nama: 'Agustang',
  },
  {
    email: '199806052022031001@basarnas.ac.id',
    password: 'password123',
    role: 'OPERATOR_LAPANGAN',
    nip: '199806052022031001',
    nama: 'Muhammad Adiaksa',
  },
  {
    email: '199811292022031001@basarnas.ac.id',
    password: 'password123',
    role: 'OPERATOR_LAPANGAN',
    nip: '199811292022031001',
    nama: 'Andrie Nurseta',
  },
];

// ============================================================
// STEP 1: BERSIHKAN DATA LAMA (DENGAN SQL LANGSUNG)
// ============================================================
async function cleanup() {
  console.log('=== STEP 1: Bersihkan Data Lama ===\n');

  // Cek apakah service_role key valid
  const { data: authTest, error: authTestError } = await supabase.auth.admin.listUsers();
  if (authTestError) {
    console.error('SERVICE ROLE KEY TIDAK VALID!');
    console.error('Error:', authTestError.message);
    console.error('\nPastikan service_role key benar di file script.');
    process.exit(1);
  }
  console.log(`Service role key valid. ${authTest.users.length} auth users ditemukan.`);

  // Hapus semua auth users
  for (const user of authTest.users) {
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) {
      console.error(`  Gagal menghapus auth user ${user.email}: ${error.message}`);
    } else {
      console.log(`  Dihapus: ${user.email}`);
    }
  }

  // Hapus public.users dengan SQL langsung (bypass RLS)
  const { data: deleteData, error: deleteError } = await supabase.rpc('exec_sql', {
    sql_query: 'DELETE FROM public.users;'
  }).maybeSingle();

  if (deleteError) {
    // Fallback: coba delete via SDK
    const { error: sdkDeleteError } = await supabase
      .from('users')
      .delete()
      .gte('created_at', '1900-01-01'); // Hapus semua
    
    if (sdkDeleteError) {
      console.error('  Gagal membersihkan public.users:', sdkDeleteError.message);
    } else {
      console.log('  public.users berhasil dikosongkan (via SDK)');
    }
  } else {
    console.log('  public.users berhasil dikosongkan (via SQL)');
  }

  console.log('');
}

// ============================================================
// STEP 2: BUAT USER BARU
// ============================================================
async function createUsers() {
  console.log('=== STEP 2: Membuat User Baru ===\n');

  for (const user of users) {
    try {
      // 1. Buat auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          role: user.role,
          nip: user.nip,
          nama: user.nama,
        },
      });

      if (authError) {
        console.error(`Gagal membuat auth user ${user.email}: ${authError.message}`);
        continue;
      }

      console.log(`Auth user dibuat: ${user.email}`);
      console.log(`  ID: ${authData.user.id}`);

      // 2. Insert ke public.users (dengan upsert)
      const { error: insertError } = await supabase
        .from('users')
        .upsert({
          id: authData.user.id,
          email: user.email,
          nip: user.nip,
          nama: user.nama,
          role: user.role,
          aktif: true,
          password_changed: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

      if (insertError) {
        console.error(`  Gagal insert ke public.users: ${insertError.message}`);
        // Coba delete auth user yang sudah dibuat
        await supabase.auth.admin.deleteUser(authData.user.id);
      } else {
        console.log(`  Profile dibuat di public.users\n`);
      }
    } catch (err) {
      console.error(`Error: ${err.message}\n`);
    }
  }
}

// ============================================================
// STEP 3: VERIFIKASI
// ============================================================
async function verify() {
  console.log('=== STEP 3: Verifikasi ===\n');

  // Cek auth users
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error('Gagal memverifikasi auth users:', authError.message);
    return;
  }

  console.log(`Auth users: ${authUsers.users.length} user(s) ditemukan`);
  for (const u of authUsers.users) {
    console.log(`  - ${u.email} (ID: ${u.id})`);
  }

  // Cek public.users
  const { data: publicUsers, error: publicError } = await supabase
    .from('users')
    .select('id, email, nip, nama, role, aktif')
    .order('role');

  if (publicError) {
    console.error('Gagal memverifikasi public.users:', publicError.message);
    return;
  }

  console.log(`\nPublic users: ${publicUsers.length} user(s) ditemukan`);
  for (const u of publicUsers) {
    console.log(`  - [${u.role}] ${u.nama} (${u.email})`);
  }

  console.log('\n=== SELESAI ===');
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log('=== SUPABASE USER CREATION SCRIPT v3 ===\n');

  await cleanup();
  await createUsers();
  await verify();
}

main();