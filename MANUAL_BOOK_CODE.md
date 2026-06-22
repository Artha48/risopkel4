# Manual Book & Dokumentasi Arsitektur Kode Program
**Proyek:** OptiPath - Solver Modules (Metode Penugasan & Teori Jaringan)  
**Tim:** Kelompok 4 Riset Operasi (RISOP)

Dokumen ini merupakan panduan teknis mendalam (Deep-Dive) yang ditujukan bagi dosen penilai, pengembang lanjutan, atau auditor kode yang ingin memahami struktur, alur data (Data Flow), algoritma, dan logika spesifik di balik setiap baris kode pada aplikasi OptiPath.

---

## 🏗️ 1. Arsitektur Umum & Alur Data (Data Flow)
Aplikasi ini mengusung arsitektur **Client-Server (Frontend-Backend Terpisah)** bergaya RESTful API. 

**Alur Data (Data Flow):**
1. **Input (Client):** Pengguna berinteraksi dengan DOM HTML. Fungsi JavaScript menangkap angka-angka dari tabel HTML, memvalidasinya, dan merangkumnya menjadi format JSON.
2. **Transmisi (HTTP POST):** JavaScript mengirim (fetch) JSON tersebut ke endpoint FastAPI di `localhost:8000`.
3. **Validasi Server (Pydantic):** Server menerima JSON. Pydantic otomatis memverifikasi tipe data (apakah *integer*, matriks 2D, dll). Jika tidak sesuai, request langsung ditolak (422 Unprocessable Entity).
4. **Pemrosesan (Solver):** Algoritma `NumPy` dan `SciPy` mengeksekusi perhitungan matematis berat.
5. **Respons (Client):** JSON hasil (berisi langkah penyelesaian, nilai optimal, tabel ES/EF, koordinat network) dikembalikan ke peramban. JavaScript membedah JSON tersebut dan merekonstruksinya menjadi tampilan **step-by-step** dan visualisasi diagram (vis.js).

---

## 🐍 2. Dokumentasi Otak Kalkulasi (Backend Python)
Folder `backend/` dikembangkan dengan prinsip **Object-Oriented Programming (OOP)** untuk memudahkan pelacakan logika.

### A. `main.py` (Gerbang Utama API)
Fungsi utama file ini adalah mengatur lalu lintas data web dan validasi keamanan.
- **`CORSMiddleware`:** Konfigurasi keamanan krusial yang mengizinkan file `index.html` (berjalan di protokol `file://` atau server lokal beda port) untuk berinteraksi dengan API port 8000.
- **Model Keamanan `Pydantic`:**
  - `class MatrixRequest(BaseModel)`: Menjamin *payload* untuk Modul Metode Penugasan pasti memiliki `matrix` (List 2D array) dan `mode` (string: "min" atau "max").
  - `class CPMRequest(BaseModel)`: Menjamin *payload* Modul Teori Jaringan mematuhi format dictionary proyek.
- **Endpoints:**
  - `@app.post("/api/solve/hungarian")`: Endpoint untuk menerima data Metode Penugasan.
  - `@app.post("/api/solve/cpm")`: Endpoint untuk menerima data Teori Jaringan (CPM).

### B. `hungarian_solver.py` (Algoritma Metode Penugasan)
Membawa kelas `HungarianSolver` yang mengubah matriks penugasan menjadi alokasi paling optimal.
- **`def solve(...)`:** Titik masuk utama kelas. Jika *user* mengirim mode `max` (Maksimasi), matriks terlebih dahulu dikonversi dengan rumus: `Nilai_Maksimal_Matriks - Seluruh_Isi_Matriks`. (Ini adalah syarat mutlak agar algoritma Hungarian bisa memecahkan kasus maksimasi).
- **`linear_sum_assignment(cost_matrix)`:** Fungsi ini berasal dari perpustakaan `SciPy`. Fungsi ini memecahkan *Bipartite Matching / Assignment Problem* dalam kompleksitas waktu $O(n^3)$. Ini jauh lebih efisien dan kebal *crash* dibandingkan melakukan *brute-force* kombinatorial.
- **`step_records` (Perekaman Transparansi):** Untuk memenuhi syarat transparansi, kode ini mereplika langkah manual:
  1. Pengurangan Baris (*Row Reduction*): Mencari nilai terkecil per baris.
  2. Pengurangan Kolom (*Col Reduction*): Mencari nilai terkecil per kolom.
  Hasil reduksi ini dibungkus menjadi array dan dikembalikan ke antarmuka untuk ditampilkan kepada pengguna.

### C. `cpm_solver.py` (Kalkulator Teori Jaringan / CPM)
Membawa kelas `CPMSolver` yang sangat kompleks dalam mengolah *Directed Acyclic Graph* (DAG).
- **`_parse_predecessors(preds_str)`:** Fungsi *parser* yang mengubah teks input seperti `"A, B"` menjadi senarai Python murni `["A", "B"]`.
- **`_topological_sort()`:** Inti dari CPM. Algoritma ini memastikan perhitungan berurutan. Tidak mungkin menghitung kegiatan D jika kegiatan B dan C (sebagai *predecessor*-nya) belum selesai dihitung. 
- **`_calculate_forward_pass()`:**
  - Rumus Earliest Start (ES): `ES = Max(EF dari semua kegiatan predecessor)`
  - Rumus Earliest Finish (EF): `EF = ES + Durasi Kegiatan`
- **`_calculate_backward_pass()`:**
  - Dimulai dari node terakhir proyek.
  - Rumus Latest Finish (LF): `LF = Min(LS dari semua kegiatan successor)`
  - Rumus Latest Start (LS): `LS = LF - Durasi Kegiatan`
- **`_identify_critical_path()`:** Menghitung waktu kelonggaran (*Slack / Float*) dengan rumus `Slack = LF - EF`. Jika nilai Slack bernilai 0 (Tepat Waktu), kegiatan tersebut dilabeli `is_critical = True`.
- **`get_network_data()`:** Modul khusus yang menyusun format `nodes` dan `edges` (garis penghubung) agar bisa langsung dibaca dan dianimasikan oleh *library* `vis.js` di antarmuka.

---

## 🌐 3. Dokumentasi Antarmuka (Frontend JavaScript)
Folder `frontend/` mengatur manipulasi *Document Object Model* (DOM) dan pengalaman pengguna (UX).

### A. Kerangka Dasar (`index.html`)
- Menggunakan pendekatan *Single-Page Application* semu, di mana konten Modul 1 dan Modul 2 di-*inject* secara dinamis ke dalam elemen `#module-container` oleh JavaScript.
- Sidebar navigasi menampilkan:
  - 🏠 **Home** — halaman beranda (opacity emoji 100%).
  - 🏢 **Metode Penugasan** — modul Hungarian Algorithm.
  - 📈 **Teori Jaringan** — modul Critical Path Method.
- Semua gaya (CSS) disematkan secara internal agar *file* portabel. Desain mengadopsi prinsip antarmuka "Notion" (tipografi modern, *border-radius* halus, bayangan samar, indikator *pill-shaped*).

### B. Otak Interaksi (`script.js`)
Terbagi atas puluhan blok fungsi *event listener* dan pembangkit elemen HTML (*HTML Generators*).

**Fitur DOM Manipulation Modul 1 — Metode Penugasan (Hungarian):**
- **`setupMatrix()`:** Membaca nilai dari *dropdown* (8×8 hingga 20×20). Menggunakan *looping* untuk menghasilkan tag `<input type="number">` ke dalam tag `<table>`. Terintegrasi dengan fungsi `Math.random()` jika *user* menginginkan *auto-fill* nilai.
- **Validasi Kekosongan:** Fungsi pengecekan yang menggunakan metode *flagging* (`let hasEmpty = false`). Jika ada *string* kosong (`""`), fungsi akan memblokir pengiriman *fetch* dan membangkitkan `alert()`.

**Fitur Lanjutan Modul 2 — Teori Jaringan (CPM):**
- **`addCpmRow(id, name, duration, preds)`:** Fungsi *builder* dinamis yang melempar (*append*) baris `<tr class="cpm-row">` baru ke dalam tabel HTML setiap kali pengguna meminta tambahan kegiatan.
- **Validasi Instan & Dirty State Reset (`oninput` Events):**
  - Mengikat *Event Listener* global pada tag `<tbody id="cpm-tbody">`. 
  - Saat ada interaksi ketikan pada kotak ID, skrip ini segera menarik seluruh array ID menggunakan `document.querySelectorAll('.cpm-id')` dan melakukan `Array.some()`. Jika terjadi duplikasi, properti `borderColor` otomatis diubah menjadi merah.
  - Skrip ini juga mengeksekusi `document.getElementById('cpm-results-container').style.display = 'none'` setiap ada elemen tabel yang diubah, guna menanggulangi pembacaan "Data Kotor/Usang".
- **`renderCpmResults()` — Perhitungan Detail Step-by-Step (5 Langkah):**  
  Setelah API merespons, JavaScript merender hasil secara bertahap ke dalam 5 *step-card* berwarna berbeda:
  1. **Langkah 1 (Ungu):** Tabel identifikasi urutan topologis kegiatan beserta predecessor masing-masing.
  2. **Langkah 2 (Hijau):** *Forward Pass* — setiap kegiatan ditampilkan beserta rumus `ES = max(EF predecessor)` dan `EF = ES + Durasi` secara eksplisit per baris.
  3. **Langkah 3 (Kuning):** *Backward Pass* — setiap kegiatan ditampilkan beserta rumus `LF = min(LS successor)` dan `LS = LF − Durasi` secara eksplisit per baris.
  4. **Langkah 4 (Violet):** Kalkulasi Slack — kartu ringkasan per kegiatan dengan rumus `Slack = LS − ES` dan penandaan kritis.
  5. **Langkah 5 (Hitam):** Tabel rekap lengkap (ES, EF, LS, LF, Slack, Status) dengan warna kode yang konsisten: hijau = forward, kuning = backward, merah = kritis.
- **`drawVisjsNetwork(nodes, edges)`:** Skrip canggih penyambung visual. 
  - Membaca properti `is_critical` dari data JSON server.
  - Menetapkan struktur *Hierarchical Layout* bertipe *Directed* agar bentuk graf bercabang rapi dari kiri ke kanan.
  - Kegiatan (*Node*) kritis disuntikkan properti warna `#FEE2E2` (merah muda) dengan garis batas merah tua agar visualisasi Jalur Kritis tampak sangat mencolok.
