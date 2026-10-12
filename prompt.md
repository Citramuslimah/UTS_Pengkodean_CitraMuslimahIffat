# Dokumentasi Prompt Gemini Canvas

## Prompt instruksi

> Buat rancangan antarmuka web berbahasa Indonesia untuk formulir Voucher Entri Transaksi Kas Keluar pada perusahaan ritel. Gunakan HTML, Tailwind CSS, dan React. Formulir berisi nomor voucher, tanggal, deskripsi transaksi, serta rincian jurnal dinamis dengan pilihan akun COA, keterangan per baris, debit, dan kredit. Sediakan tombol tambah dan hapus baris, dengan minimal dua baris jurnal.
>
> Hitung total debit dan kredit secara otomatis setiap kali input berubah. Tampilkan indikator seimbang/tidak seimbang beserta nominal selisih. Tombol Submit & Post hanya aktif jika header lengkap, akun dipilih, nominal valid, minimal dua baris bernilai, dan total debit sama dengan total kredit serta lebih besar dari nol. Setiap baris hanya boleh berisi debit atau kredit.
>
> Sediakan daftar voucher dengan status DRAFT dan POSTED. Draft dapat diedit, diposting, atau dihapus, sedangkan voucher POSTED terkunci. Sertakan riwayat audit yang mencatat pembuatan, perubahan isi/status, dan penghapusan draft. Jelaskan pemisahan validasi antarmuka dan validasi backend PostgreSQL/Supabase; simpan transaksi secara atomik dan catat perubahan melalui audit log database. Buat tampilan yang rapi, responsif, mudah dibaca, dan gunakan data contoh berbahasa Indonesia.

## Penyesuaian implementasi

Kode awal Gemini Canvas menggunakan JSX, React, dan Firebase, sehingga tidak dapat dibuka langsung sebagai `index.html` statis dan tidak sesuai dengan pilihan basis data Supabase/PostgreSQL pada soal. Proyek Soal 3 ini dipisahkan menjadi HTML/CSS/JavaScript biasa agar dapat dibuka langsung. Mode demo menyimpan voucher dan audit log di `localStorage`; integrasi Supabase bersifat opsional dan memerlukan URL serta anon key pada `script.js` dan eksekusi skema `database.sql`.
