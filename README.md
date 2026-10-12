# UTS Pengkodean dan Pemograman 

## Identitas tugas

<table>
  <thead>
    <tr>
      <th align="center">Keterangan</th>
      <th align="center">Detail</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Nama</td>
      <td>Citra Muslimah Iffat</td>
    </tr>
    <tr>
      <td>NIM</td>
      <td>12030124120054</td>
    </tr>
    <tr>
      <td>Mata Kuliah</td>
      <td>Pengkodean dan Pemograman</td>
    </tr>
    <tr>
      <td>Kelas</td>
      <td>D</td>
    </tr>
    <tr>
      <td>Dosen Pengampu</td>
      <td>Dr. Totok Dewayanto, S.E., M.Si., Akt.</td>
    </tr>
  </tbody>
</table>

**Disusun untuk memenuhi Tugas Project UTS Pengkodean dan Pemograman.**

## Deskripsi Proyek

Aplikasi Voucher Kas Keluar dirancang sebagai purwarupa sistem informasi akuntansi yang membantu pengguna mencatat transaksi pengeluaran kas dan menyusun jurnal berdasarkan akun yang digunakan.

Aplikasi menyediakan formulir pencatatan voucher, rincian jurnal yang dapat ditambahkan secara dinamis, serta kalkulasi total debit dan kredit secara otomatis. Sistem juga dirancang untuk mendukung validasi transaksi, pengelolaan voucher, dan pencatatan aktivitas sebagai bagian dari pengendalian internal.

Selain pengembangan antarmuka web, proyek ini mencakup rancangan basis data menggunakan SQL dan dokumentasi penggunaan AI untuk membantu proses pembuatan serta evaluasi logika bisnis aplikasi.

## Fitur Aplikasi

**1. Pencatatan Voucher Kas Keluar**

- Mengisi informasi utama voucher dan keterangan transaksi.

- Menambahkan rincian akun jurnal sesuai kebutuhan transaksi.

- Memasukkan nominal debit dan kredit untuk setiap baris jurnal.

**2. Perhitungan dan Validasi Jurnal**

- Menghitung total debit dan kredit secara otomatis.

- Menampilkan indikator keseimbangan jurnal.

- Membantu memeriksa kelengkapan data sebelum transaksi disimpan.

- Memvalidasi transaksi berdasarkan aturan bisnis yang diterapkan dalam aplikasi.

**3. Pengelolaan Voucher**

- Menampilkan daftar voucher yang telah dicatat.

- Mengedit atau menghapus voucher yang masih berstatus DRAFT, sesuai aturan yang diterapkan.

- Menerapkan pembatasan perubahan terhadap voucher berstatus POSTED.

- Menyediakan ringkasan transaksi sebelum proses penyimpanan atau posting.

**4. Jejak Audit dan Integritas Data**

- Mendukung pencatatan aktivitas transaksi.

- Menyediakan rancangan penguncian transaksi yang telah diposting.

- Mendukung penerapan validasi dan audit trail melalui basis data PostgreSQL.

- Menjadi dasar pengembangan mekanisme koreksi transaksi melalui jurnal pembalik tanpa menghapus catatan asli.

## Teknologi yang Digunakan

**HTML**: Menyusun struktur halaman aplikasi.

**CSS**: Mengatur tampilan, tata letak, dan responsivitas antarmuka.

**JavaScript**: Mengatur interaksi pengguna, perhitungan debit-kredit, validasi, dan pengelolaan data pada sisi aplikasi.

**SQL**: Mendefinisikan tabel, fungsi, trigger, validasi, dan mekanisme audit pada basis data.

**Supabase**: Menyediakan layanan basis data PostgreSQL untuk penyimpanan transaksi apabila konfigurasi telah diaktifkan.

**Gemini**: Membantu proses pembuatan dan penyempurnaan purwarupa aplikasi.

**NotebookLM**: Membantu meninjau aturan bisnis berdasarkan sumber referensi yang diunggah.

## Penggunaan AI

AI digunakan sebagai alat bantu dalam proses pengembangan dan evaluasi purwarupa, bukan sebagai pengganti verifikasi kode maupun sumber akuntansi.

**Gemini**

Digunakan untuk membantu menyusun dan mengembangkan antarmuka aplikasi, menambahkan interaksi, serta menyempurnakan logika pencatatan voucher berdasarkan kebutuhan tugas.

**NotebookLM**

Digunakan untuk membantu meninjau aturan bisnis aplikasi berdasarkan referensi yang diunggah. Evaluasi diarahkan pada validasi debit-kredit, pencatatan transaksi, pengendalian perubahan data, dan relevansi aturan dengan standar akuntansi yang digunakan sebagai sumber.

**Dokumentasi Penggunaan AI**

Prompt, hasil penggunaan, dan catatan verifikasi disimpan dalam folder Prompt/. Hasil AI tetap perlu diperiksa terhadap kode aktual, struktur basis data, dan sumber referensi. Pernyataan mengenai kesesuaian terhadap PSAK tidak dapat dianggap terbukti hanya berdasarkan keluaran AI.
