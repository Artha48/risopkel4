# Dokumentasi Skenario Pengujian (Testing)
**Proyek:** OptiPath - Solver Modules (Metode Penugasan & Teori Jaringan)  
**Tim:** Kelompok 4 Riset Operasi (RISOP)

Dokumen ini memuat skenario pengujian (Test Cases) yang digunakan untuk memverifikasi fungsionalitas, logika bisnis, dan penanganan kesalahan (Error Handling) dari aplikasi OptiPath.

---

## 🏗️ Modul 1: Metode Penugasan (Hungarian Algorithm)

### Skenario 1.1: Validasi Batas Ukuran Matriks
- **Langkah Pengujian:** Mengubah input "Jumlah Baris" atau "Jumlah Kolom" menjadi nilai di bawah 8 atau di atas 20.
- **Hasil yang Diharapkan:** Aplikasi menampilkan pesan error bahwa dimensi minimal adalah 8×8 dan maksimal 20×20, lalu menolak membuat tabel.
- **Status:** ✅ LULUS (*PASS*)

### Skenario 1.2: Fungsionalitas Pengisian Otomatis (Random)
- **Langkah Pengujian:** Memilih mode "Random" dan mengeklik "Ganti Ukuran / Reset Matriks".
- **Hasil yang Diharapkan:** Seluruh sel matriks terisi penuh secara otomatis dengan angka acak antara 10 hingga 100 tanpa ada sel yang kosong.
- **Status:** ✅ LULUS (*PASS*)

### Skenario 1.3: Validasi Sel Kosong pada Mode Manual
- **Langkah Pengujian:** Memilih mode "Manual", mengosongkan salah satu sel matriks, lalu menekan "Jalankan Optimasi".
- **Hasil yang Diharapkan:** Aplikasi menampilkan peringatan *Alert* ("Terdapat sel matriks yang masih kosong") dan mencegat proses pengiriman data ke server API.
- **Status:** ✅ LULUS (*PASS*)

### Skenario 1.4: Perhitungan Optimasi Minimasi & Maksimasi
- **Langkah Pengujian:** Menekan tombol "Jalankan Optimasi" untuk masalah Minimasi, lalu mengulanginya untuk masalah Maksimasi.
- **Hasil yang Diharapkan:** 
  1. API merespons dengan Langkah-Langkah Reduksi Baris/Kolom.
  2. Matriks hasil akhir menunjukkan penugasan yang optimal (sel yang dipilih disorot warna hijau).
  3. Total Biaya / Keuntungan Optimal dihitung dan ditampilkan di atas tabel dengan benar.
- **Status:** ✅ LULUS (*PASS*)

---

## 🕸️ Modul 2: Teori Jaringan (Critical Path Method — CPM)

### Skenario 2.1: Validasi Batas Kapasitas Kegiatan
- **Langkah Pengujian:** Menghapus baris hingga tersisa 7 kegiatan, lalu menekan "Hitung Jalur Kritis". Kemudian mencoba menambahkan lebih dari 20 kegiatan.
- **Hasil yang Diharapkan:** Aplikasi memberikan peringatan *Alert* dan tidak mengizinkan kalkulasi berjalan saat jumlah kegiatan di luar rentang 8 hingga 20.
- **Status:** ✅ LULUS (*PASS*)

### Skenario 2.2: Pencegahan Input ID Ganda (Real-Time Validation)
- **Langkah Pengujian:** Mengetikkan ID Kegiatan (contoh: "A") pada suatu baris, lalu mengetikkan huruf "A" kembali di baris yang berbeda.
- **Hasil yang Diharapkan:** Secara *real-time* (saat itu juga), kolom yang baru diketik akan memancarkan warna merah terang, dan muncul *Alert* peringatan. Program tidak dapat dikalkulasi hingga ID tersebut diubah menjadi unik.
- **Status:** ✅ LULUS (*PASS*)

### Skenario 2.3: Validasi Kelengkapan Kolom Isian
- **Langkah Pengujian:** Membiarkan kolom Deskripsi atau Durasi kosong pada salah satu baris, lalu menekan "Hitung Jalur Kritis".
- **Hasil yang Diharapkan:** Sistem memindai seluruh baris, menemukan kekosongan, mencegat kalkulasi, dan menampilkan pesan *Alert* agar semua data wajib diisi penuh.
- **Status:** ✅ LULUS (*PASS*)

### Skenario 2.4: Fungsionalitas Ekstensi Dinamis "Template Kasus 9"
- **Langkah Pengujian:** Menambah baris tabel hingga berukuran 12, lalu menekan "Muat Template Kasus 9".
- **Hasil yang Diharapkan:** Sistem mendeteksi ada 12 baris dan secara cerdas mengisi data *dummy*/cerita buatan (dari ID A hingga L) secara otomatis, tanpa menyisakan 1 sel pun yang kosong atau ID yang ganda.
- **Status:** ✅ LULUS (*PASS*)

### Skenario 2.5: Kalkulasi Akurat Forward Pass, Backward Pass, dan Slack
- **Langkah Pengujian:** Memasukkan data kegiatan normal beserta kegiatan pendahulunya (Predecessor), lalu menjalankan kalkulasi.
- **Hasil yang Diharapkan:** API menghitung nilai Earliest Start (ES), Earliest Finish (EF), Latest Start (LS), Latest Finish (LF), dan Slack secara sempurna. Kegiatan yang memiliki nilai `Slack = 0` otomatis ditandai sebagai Jalur Kritis.
- **Status:** ✅ LULUS (*PASS*)

### Skenario 2.6: Tampilan Perhitungan Detail Step-by-Step (5 Langkah)
- **Langkah Pengujian:** Menjalankan kalkulasi CPM dengan data lengkap, lalu memeriksa section "Perhitungan Detail Step-by-Step" di bawah hasil.
- **Hasil yang Diharapkan:** Aplikasi menampilkan 5 *step-card* terstruktur:
  1. **Langkah 1** — Tabel urutan topologis & daftar predecessor tiap kegiatan.
  2. **Langkah 2** — *Forward Pass*: rumus `ES = max(EF predecessor)` dan `EF = ES + Durasi` ditampilkan per kegiatan. Kegiatan kritis diberi badge merah "KRITIS".
  3. **Langkah 3** — *Backward Pass*: rumus `LF = min(LS successor)` dan `LS = LF − Durasi` ditampilkan per kegiatan.
  4. **Langkah 4** — Kalkulasi Slack: kartu per kegiatan dengan rumus `Slack = LS − ES`.
  5. **Langkah 5** — Tabel rekap lengkap dengan kolom Status (⚡ Kritis / Normal).
- **Status:** ✅ LULUS (*PASS*)

### Skenario 2.7: Visualisasi Interaktif Network Diagram
- **Langkah Pengujian:** Memeriksa area bawah hasil kalkulasi CPM. Melakukan *Zoom in/out* dan menggeser (*drag*) salah satu lingkaran node kegiatan.
- **Hasil yang Diharapkan:** Diagram vis.js berhasil dirender secara dinamis. Garis panah menunjukkan urutan *Predecessor* dengan benar. Node yang berada pada Jalur Kritis diwarnai merah mencolok. Diagram bersifat interaktif (bisa ditarik dan di-*zoom*).
- **Status:** ✅ LULUS (*PASS*)

---

## 🔒 Uji Keamanan Status Kotor (Dirty State Reset)
- **Langkah Pengujian:** Menjalankan optimasi hingga hasil perhitungan keluar. Setelah itu, secara iseng mengubah satu angka durasi / biaya di dalam tabel input.
- **Hasil yang Diharapkan:** Begitu tabel diklik dan diketik, **seluruh kontainer hasil hitungan lama akan otomatis disembunyikan/hilang**. Ini menghindari kesalahan fatal di mana pengguna membaca hasil analisis lama padahal data input baru saja diubah.
- **Status:** ✅ LULUS (*PASS*)

---

## 🧭 Uji Navigasi Sidebar
- **Langkah Pengujian:** Mengeklik menu 🏠 **Home**, 🏢 **Metode Penugasan**, dan 📈 **Teori Jaringan** secara bergantian.
- **Hasil yang Diharapkan:** Setiap item sidebar memuat konten modul yang sesuai secara dinamis. Breadcrumb di topbar berubah mengikuti modul yang aktif. Emoji 🏠 Home tampil dengan opacity penuh (100%).
- **Status:** ✅ LULUS (*PASS*)
