# UTS Pengkodean

Kumpulan berkas tugas UTS Pengkodean. Folder `Kode SQL` berisi soal basis data dan prototype web Soal 3. Folder `Prompt` menyimpan prompt AI serta log penggunaannya.

## Soal 3: Voucher Kas Keluar

Buka [halaman prototype](Kode%20SQL/Soal%203/index.html) langsung di browser. Prototype menyediakan entri jurnal dinamis, kalkulasi debit-kredit langsung, daftar voucher, edit/hapus draft, penguncian voucher POSTED, dan riwayat audit.

Secara default, aplikasi berjalan dalam mode demo dan menyimpan data di `localStorage` browser. Untuk menghubungkan Supabase:

1. Jalankan [skrip database](Kode%20SQL/Soal%203/database.sql) di SQL Editor proyek Supabase.
2. Isi `SUPABASE_URL` dan `SUPABASE_ANON_KEY` pada [script.js](Kode%20SQL/Soal%203/script.js).
3. Buka kembali `index.html` dan uji alur simpan serta daftar voucher.

Policy akses pada skrip SQL dibuat terbuka untuk kebutuhan demo kelas. Tinjau dan batasi Row Level Security sebelum memakai data nyata; jangan pernah menaruh `service_role` key di kode browser.

## Prompt dan Log AI

- [Prompt Gemini Canvas](Prompt/Prompt%20Gemini.md)
- [Prompt NotebookLM untuk tinjauan berbasis sumber](Prompt/Prompt%20NotebookLM.md)
- [Log penggunaan AI dan status verifikasi](Prompt/Log%20AI.md)

NotebookLM harus menggunakan hanya sumber yang diunggah pengguna. Prompt yang disimpan meminta sitasi untuk temuan berbasis sumber dan melarang klaim kepatuhan PSAK tanpa bukti yang cukup.

## Berkas Soal 3

- `index.html`: antarmuka web yang dapat dibuka langsung.
- `style.css`: gaya dan tata letak responsif.
- `script.js`: interaksi, validasi, kalkulasi, CRUD demo, dan konfigurasi Supabase.
- `database.sql`: tabel, fungsi transaksi, validasi database, dan audit trigger PostgreSQL.
- `prompt.md`: dokumentasi prompt Gemini Canvas dan penyesuaian prototype.
