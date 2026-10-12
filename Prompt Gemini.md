# Prompt Gemini Canvas

## Instruksi

Buat rancangan antarmuka web berbahasa Indonesia untuk aplikasi Voucher Entri Transaksi Kas Keluar perusahaan ritel. Gunakan HTML, Tailwind CSS, dan React. Tampilkan header gelap dengan identitas RetailERP Finance & Ledger, navigasi Formulir Voucher, Daftar Voucher, dan Arsitektur & Keamanan, lalu susun halaman formulir dua kolom: formulir jurnal di kiri dan indikator keseimbangan di kanan. Gunakan tampilan yang rapi, ringkas, responsif, serta mudah digunakan di desktop dan ponsel.

Formulir harus memuat nomor voucher, tanggal transaksi, deskripsi utama, dan rincian jurnal dinamis. Setiap baris jurnal menyediakan pilihan akun COA, nama akun, keterangan baris, debit, kredit, dan aksi hapus. Sediakan tombol untuk menambah baris dan pertahankan minimal dua baris. Saat akun dipilih, tampilkan nama akun terkait.

Hitung total debit, total kredit, dan selisih secara langsung ketika input berubah. Tampilkan indikator Balanced atau Not Balanced. Tombol Submit & Post hanya boleh aktif jika header lengkap, minimal dua baris jurnal bernilai, semua akun dipilih, nominal tidak negatif, satu baris tidak mengisi debit dan kredit sekaligus, total debit sama dengan total kredit, dan jumlahnya lebih besar dari nol. Simpan sebagai Draft boleh digunakan meskipun jurnal belum seimbang.

Sediakan daftar voucher berstatus DRAFT dan POSTED. Draft dapat diedit, diposting setelah semua validasi terpenuhi, dan dihapus. Voucher POSTED tidak boleh diubah atau dihapus; tampilkan bahwa koreksi harus melalui jurnal pembalik. Catat pembuatan, perubahan draft/status, posting, dan penghapusan draft pada riwayat audit beserta waktu dan ringkasan peristiwa.

Jelaskan bahwa validasi antarmuka hanya membantu pengguna dan backend PostgreSQL/Supabase harus menghitung ulang total serta memvalidasi transaksi secara atomik. Sertakan skema SQL untuk voucher, baris jurnal, dan audit log. Jangan menyebut transaksi tersimpan ke cloud jika belum ada konfigurasi dan koneksi backend. Gunakan data contoh berbahasa Indonesia dan pastikan seluruh tombol serta kontrol benar-benar berfungsi.
