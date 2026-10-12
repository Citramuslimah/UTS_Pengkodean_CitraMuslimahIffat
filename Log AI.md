# Log Penggunaan AI

**Proyek:** UTS Pengkodean, Soal 3 - Voucher Entri Transaksi Kas Keluar  
**Tanggal pencatatan:** 13 Oktober 2026

| Tahap | Alat | Penggunaan dan hasil | Status |
|---|---|---|---|
| Rancangan awal | Gemini Canvas | Kode prototype React/Firebase diberikan oleh pengguna sebagai hasil Gemini Canvas. Kode tersebut menjadi acuan rancangan formulir, indikator debit-kredit, dan tampilan daftar voucher. | Sumber awal diterima. Transkrip prompt asli Gemini tidak disertakan; `Prompt Gemini.md` berisi prompt acuan yang disusun dari kebutuhan tugas dan fitur prototype. |
| Perbaikan prototype | GitHub Copilot | Mengubah berkas Soal 3 yang sebelumnya berisi salinan JSX menjadi HTML/CSS/JavaScript yang dapat dibuka langsung. Menambahkan kalkulasi keseimbangan, mode penyimpanan lokal, audit log, rancangan integrasi Supabase/PostgreSQL, dan kontrol draft. | Diterapkan dan diuji di browser. |
| Penyesuaian tampilan dan CRUD | GitHub Copilot | Menyesuaikan tata letak dengan referensi pengguna serta menguji tambah/hapus baris, posting, edit dan hapus draft, pembatasan perubahan voucher POSTED, audit, dan tampilan ponsel. | Diterapkan dan diuji di browser. |
| Persiapan analisis sumber | NotebookLM | Prompt untuk meninjau prototype terhadap sumber PSAK/standar yang diunggah pengguna disimpan di `Prompt NotebookLM.md`. Prompt membatasi analisis pada sumber yang diunggah dan meminta sitasi untuk temuan berbasis sumber. | Prompt disiapkan; analisis NotebookLM belum dijalankan dan hasilnya belum tersedia. |

## Catatan verifikasi

- JavaScript diperiksa dengan `node --check` dan tidak ditemukan kesalahan editor pada berkas web.
- Uji browser mencakup keseimbangan jurnal, kondisi tombol posting, tambah/hapus baris, CRUD voucher draft, audit trail, dan lebar halaman ponsel.
- Koneksi Supabase belum dikonfigurasi. Integrasi cloud dan SQL perlu dijalankan serta diverifikasi pada proyek Supabase/PostgreSQL pengguna.
- `psql` tidak tersedia di lingkungan kerja, sehingga skrip SQL belum diuji pada server PostgreSQL.
- Dokumen ini mencatat proses yang diketahui dalam sesi pengerjaan; bukan bukti bahwa seluruh keluaran AI atau analisis standar akuntansi telah diverifikasi.
