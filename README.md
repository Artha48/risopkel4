<div align="center">
  <h1>✨ OptiPath - Solver Modules</h1>
  <p><strong>Aplikasi Web Pendukung Pengambilan Keputusan (Riset Operasi)</strong></p>
  
  <p>
    <img src="https://img.shields.io/badge/Python-3.9+-blue.svg?style=flat-square&logo=python" alt="Python" />
    <img src="https://img.shields.io/badge/FastAPI-0.104-009688.svg?style=flat-square&logo=fastapi" alt="FastAPI" />
    <img src="https://img.shields.io/badge/Frontend-Vanilla_JS-F7DF1E.svg?style=flat-square&logo=javascript" alt="JavaScript" />
    <img src="https://img.shields.io/badge/Status-Completed-success.svg?style=flat-square" alt="Status" />
  </p>
</div>

---

## 📖 Deskripsi Proyek
**OptiPath** adalah sebuah aplikasi web yang mengimplementasikan pemecahan masalah matematis dari mata kuliah Riset Operasi. Dibangun menggunakan arsitektur modern (*Frontend-Backend terpisah*) oleh **Kelompok 4 (RISOP)**. Aplikasi ini memungkinkan pengguna untuk memecahkan dua masalah optimasi klasik:
1. **Metode Penugasan** menggunakan Algoritma Hungarian.
2. **Teori Jaringan** menggunakan *Critical Path Method* (CPM).

---

## 🚀 Fitur Utama
- **Modul 1: Metode Penugasan (Algoritma Hungarian)**
  - Pemecahan kasus Minimasi & Maksimasi.
  - Tabel matriks dinamis (Batas min. 8×8 hingga maks. 20×20).
  - Penjelasan transformasi matriks secara transparan per-langkah (*Step-by-step*).
  - Generator angka acak (Randomize).

- **Modul 2: Teori Jaringan (CPM — *Critical Path Method*)**
  - Pengurutan Topologis dan kalkulasi *Forward/Backward Pass* yang akurat.
  - **Perhitungan Detail Step-by-Step** (5 langkah terstruktur):
    1. **Langkah 1** — Identifikasi urutan kegiatan & struktur jaringan.
    2. **Langkah 2** — *Forward Pass*: perhitungan ES & EF per kegiatan dengan rumus.
    3. **Langkah 3** — *Backward Pass*: perhitungan LF & LS per kegiatan dengan rumus.
    4. **Langkah 4** — Kalkulasi Slack/Float & penentuan jalur kritis.
    5. **Langkah 5** — Tabel rekap hasil lengkap (ES, EF, LS, LF, Slack, Status).
  - Pembuatan **Network Diagram** secara otomatis (interaktif) menggunakan `vis.js`.
  - Penandaan Jalur Kritis (*Critical Path*) secara visual.
  - Validasi *Real-Time* (Anti-Duplicate ID) dan *Dirty-State Reset*.

---

## 📂 Struktur Direktori
```text
📦 risop-optipath/
 ┣ 📂 backend/
 ┃ ┣ 📜 main.py                  # Entry point API server (FastAPI)
 ┃ ┣ 📜 hungarian_solver.py      # Kelas algoritma Hungarian + SciPy
 ┃ ┗ 📜 cpm_solver.py            # Kelas pengolahan DAG dan Slack
 ┣ 📂 frontend/
 ┃ ┣ 📜 index.html               # Antarmuka web (UI) — Sidebar & layout utama
 ┃ ┗ 📜 script.js                # Manipulasi DOM, integrasi API, & rendering step-by-step
 ┗ 📜 requirements.txt           # Daftar pustaka (dependencies) Python
```

---

## 💻 Panduan Instalasi (Menjalankan secara Lokal)

Ikuti langkah-langkah di bawah ini untuk menjalankan aplikasi di komputer Anda (Localhost).

### 1. Prasyarat (Prerequisites)
Pastikan Anda sudah menginstal:
- **Python** (Versi 3.9 atau lebih baru).
- **Peramban Web Modern** (Chrome, Edge, atau Firefox).

### 2. Memulai Server Backend (API)
Buka terminal / Command Prompt (CMD) di dalam *root* folder proyek ini, lalu jalankan:

```bash
# Instal seluruh pustaka yang diperlukan
pip install -r requirements.txt

# Nyalakan server FastAPI
python -m uvicorn backend.main:app --reload
```
> **Penting:** Biarkan terminal tetap terbuka. Anda akan melihat keterangan bahwa server berjalan di `http://127.0.0.1:8000`.

### 3. Memulai Antarmuka Frontend
Aplikasi ini 100% *Client-Side* pada sisi depan, sehingga Anda tidak perlu menginstal server Node.js.
- Buka folder `frontend/`
- Klik dua kali pada file `index.html` untuk membukanya di peramban.
- Perhatikan pojok kanan atas layar; jika tertulis **API Backend: Connected 🟢**, selamat! Aplikasi siap digunakan.

---

## 👥 Pengembang (Credits)
Dibuat dengan ❤️ oleh **Kelompok 4 - Riset Operasi (Semester 6)** untuk memenuhi tugas akhir mata kuliah.
