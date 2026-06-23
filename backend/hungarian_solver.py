"""
==============================================================================
hungarian_solver.py

Modul Solver untuk Algoritma Hungarian (Metode Penugasan Optimal).
Menyelesaikan masalah Assignment Problem: meminimalkan (atau memaksimalkan)
total biaya penugasan n agen ke m pekerjaan/lokasi.

Algoritma Hungarian — Langkah-langkah:
  1. Pengurangan Baris  : Kurangi setiap baris dengan nilai minimumnya
  2. Pengurangan Kolom  : Kurangi setiap kolom dengan nilai minimumnya
  3. Penutupan Garis    : Temukan garis penutup minimum menggunakan König's Theorem
     a. _max_matching()     → Bipartite matching maksimum pada posisi nol (DFS augmenting path)
     b. _min_vertex_cover() → König's Theorem: konversi matching → minimum vertex cover
  4. Revisi Matriks     : Kurangi nilai minimum tak-tertutup, tambah ke perpotongan
  5. Ulangi 3–4         → Hingga jumlah garis penutup ≥ ukuran matriks (solusi optimal)

Fitur:
  - Mendukung kasus Maksimasi: dikonversi ke Minimasi dengan C' = max(C) − C
  - Mendukung matriks tidak persegi (m ≠ n): padding dengan kolom/baris dummy bernilai 0
  - Setiap langkah disimpan ke self.steps untuk ditampilkan step-by-step di frontend
  - Batas ukuran 8×8 hingga 20×20 untuk mencegah Memory Overflow
==============================================================================
"""

import numpy as np


class HungarianSolver:
    """
    Menyelesaikan masalah penugasan menggunakan Algoritma Hungarian.
    Mendukung kasus minimasi dan maksimasi, serta matriks tidak persegi.
    Setiap langkah perhitungan disimpan agar dapat ditampilkan secara bertahap.
    """

    def __init__(self, cost_matrix, is_maximization=False):
        """
        Inisialisasi solver dengan matriks biaya dan mode optimasi.

        Parameter:
            cost_matrix      (list[list[float]]): Matriks biaya 2D dari input pengguna.
            is_maximization  (bool): True jika mencari nilai MAKSIMUM (keuntungan/skor).
                                     False (default) jika mencari nilai MINIMUM (biaya).

        Langkah inisialisasi:
          1. Konversi ke NumPy array (dtype float) untuk operasi matriks efisien.
          2. Validasi ukuran: harus antara 8×8 dan 20×20.
          3. Padding ke matriks persegi N×N jika baris ≠ kolom (dummy = 0).
          4. Jika maksimasi: transformasi C' = max(C) − C (konversi ke minimasi setara).
        """
        self.original_matrix = np.array(cost_matrix, dtype=float)
        self.num_rows, self.num_cols = self.original_matrix.shape
        self.is_maximization = is_maximization

        # N = ukuran matriks persegi yang akan diproses (max antara baris dan kolom)
        self.N = max(self.num_rows, self.num_cols)

        # Validasi ukuran: mencegah overhead memori pada matriks terlalu kecil/besar
        if not (8 <= self.num_rows <= 20) or not (8 <= self.num_cols <= 20):
            raise ValueError(
                f"Ukuran matriks penugasan harus antara 8x8 dan 20x20. "
                f"Saat ini: {self.num_rows}x{self.num_cols}"
            )

        # Padding: buat matriks N×N dengan nol, lalu isi bagian kiri-atas dengan matriks asli
        # Baris/kolom dummy (nilai 0) merepresentasikan kegiatan/agen fiktif yang tidak nyata
        self.padded_matrix = np.zeros((self.N, self.N), dtype=float)
        self.padded_matrix[:self.num_rows, :self.num_cols] = self.original_matrix

        # Konversi kasus maksimasi → minimasi menggunakan rumus: C' = max(C) − C
        # Penjelasan: meminimalkan C' setara dengan memaksimalkan C
        if self.is_maximization:
            self.max_val = np.max(self.original_matrix)
            self.matrix  = self.max_val - self.padded_matrix   # Matriks terkonversi
        else:
            self.matrix = self.padded_matrix.copy()   # Kasus minimasi: gunakan langsung

        # Daftar langkah-langkah yang akan diisi selama proses solve()
        self.steps = []

    # =========================================================================
    # FUNGSI UTAMA: ORKESTRASI ALGORITMA HUNGARIAN
    # =========================================================================

    def solve(self):
        """
        Jalankan algoritma Hungarian lengkap dan kembalikan hasil penugasan beserta total biaya.

        Urutan eksekusi:
          Step 0 : Tampilkan matriks awal (sebelum pengurangan)
          Step 1 : _reduce_rows()  — Pengurangan baris
          Step 2 : _reduce_cols()  — Pengurangan kolom
          Step 3+: Loop hingga optimal:
                    a. _max_matching()        → Temukan matching bipartit maksimum
                    b. _min_vertex_cover()    → König's Theorem → garis penutup minimum
                    c. Cek: jumlah garis ≥ N? → Optimal, break
                    d. _revise_matrix()       → Revisi nilai matriks, ulangi loop
          Step n : Tampilkan hasil penugasan akhir + total biaya

        Returns:
            tuple:
              - final_assignments (list[dict]): [{"row": r, "col": c, "cost": v}, ...]
              - total_cost        (float)     : Total biaya optimal dari matriks asli
        """
        self.steps = []  # Reset steps untuk setiap pemanggilan solve()

        # ── STEP 0: Tampilkan matriks awal ──────────────────────────────────
        desc = "Matriks biaya penugasan awal."
        if self.is_maximization:
            # Jelaskan transformasi maksimasi → minimasi
            desc += (
                f" Kasus maksimasi dikonversi ke minimasi dengan rumus C' = {self.max_val:.0f} - C."
            )
        if self.num_rows != self.num_cols:
            # Jelaskan padding dummy untuk matriks tidak persegi
            desc += (
                f" Karena matriks tidak persegi, ditambahkan baris/kolom dummy bernilai 0 "
                f"sehingga ukuran menjadi {self.N}x{self.N}."
            )
        self._add_step("Matriks Awal", desc, self.matrix.copy())

        # ── STEP 1: Pengurangan Baris ──────────────────────────────────────
        self._reduce_rows()

        # ── STEP 2: Pengurangan Kolom ──────────────────────────────────────
        self._reduce_cols()

        # ── STEP 3–N: Loop Penutupan Garis & Revisi Matriks ───────────────
        # Setiap iterasi: cari garis penutup minimum, cek optimalitas, revisi jika belum optimal
        iteration = 1
        while True:
            # Temukan matching bipartit maksimum pada sel bernilai 0 (DFS augmenting path)
            match_row, match_col = self._max_matching()

            # Konversi matching ke minimum vertex cover (garis penutup minimum) via König's Theorem
            row_lines, col_lines = self._min_vertex_cover(match_row, match_col)
            num_lines = sum(row_lines) + sum(col_lines)

            # Kondisi optimal: jumlah garis penutup = ukuran matriks N
            # (König's Theorem: matching maksimum = vertex cover minimum dalam bipartite graph)
            if num_lines >= self.N:
                self._add_step(
                    "Penutupan Garis Optimal",
                    f"Jumlah garis penutup nol ({num_lines}) sudah sama dengan ukuran matriks ({self.N}). "
                    "Penugasan optimal dapat ditentukan.",
                    self.matrix.copy(),
                    row_lines=row_lines,
                    col_lines=col_lines,
                    is_optimal=True,
                )
                break  # Keluar dari loop — matriks sudah optimal

            # Belum optimal: lakukan revisi matriks dan ulangi
            self._revise_matrix(iteration, row_lines, col_lines, num_lines)
            iteration += 1

        # ── Kumpulkan hasil penugasan akhir dari matching terakhir ──────────
        # Hanya ambil penugasan dalam dimensi asli (abaikan baris/kolom dummy)
        final_assignments = []
        total_cost = 0
        for r in range(self.num_rows):
            c = match_row[r]
            if c != -1 and c < self.num_cols:
                cost = self.original_matrix[r, c]   # Ambil dari matriks ASLI (bukan yang dikonversi)
                final_assignments.append({"row": r, "col": c, "cost": cost})
                total_cost += cost

        # Tampilkan step akhir: ringkasan penugasan optimal
        label = "biaya minimum" if not self.is_maximization else "keuntungan maksimum"
        self._add_step(
            "Hasil Penugasan Optimal",
            f"Penugasan optimal ditemukan. Total {label} adalah {total_cost:.0f}.",
            self.matrix.copy(),
            assignments=final_assignments,
            total_cost=total_cost,
            is_final=True,
        )

        return final_assignments, total_cost

    # =========================================================================
    # BAGIAN 1: PENGURANGAN BARIS & KOLOM
    # =========================================================================

    def _reduce_rows(self):
        """
        LANGKAH 1 — Pengurangan Baris (Row Reduction).

        Algoritma:
          Untuk setiap baris i: matrix[i] -= min(matrix[i])
          → Setelah langkah ini, setiap baris memiliki minimal satu elemen bernilai 0.

        Tujuan: Memastikan setiap agen memiliki setidaknya satu pilihan biaya 0
        (relatif) sehingga penugasan tanpa biaya tambahan selalu dimungkinkan.

        Catatan:
          Pembulatan ke 6 desimal digunakan untuk mencegah floating-point drift
          yang dapat menyebabkan nilai yang seharusnya 0 menjadi 1e-15 atau sejenisnya.
        """
        row_mins = np.min(self.matrix, axis=1)  # Nilai minimum per baris (shape: N,)
        m = self.matrix.copy()
        for i in range(self.N):
            m[i] -= row_mins[i]   # Kurangi setiap elemen baris ke-i dengan minimumnya
        # Bulatkan ke 6 desimal untuk menghindari floating-point accumulation
        self.matrix = np.round(m, 6)

        # Catat langkah ini beserta nilai minimum per baris (untuk ditampilkan di frontend)
        self._add_step(
            "Pengurangan Baris",
            "Kurangi setiap elemen baris dengan nilai terkecil pada baris tersebut. "
            "Setelah langkah ini, setiap baris memiliki minimal satu nilai nol.",
            self.matrix.copy(),
            row_mins=row_mins,
        )

    def _reduce_cols(self):
        """
        LANGKAH 2 — Pengurangan Kolom (Column Reduction).

        Algoritma:
          Untuk setiap kolom j: matrix[:, j] -= min(matrix[:, j])
          → Setelah langkah ini, setiap kolom juga memiliki minimal satu elemen bernilai 0.

        Tujuan: Memperluas jangkauan nilai 0 sehingga matching awal lebih banyak,
        mengurangi iterasi revisi yang diperlukan.

        Catatan:
          Setelah pengurangan baris, nilai minimum kolom mungkin sudah 0 (jika baris
          sudah mencakup seluruh kolom). Langkah ini memastikan keduanya terpenuhi.
        """
        col_mins = np.min(self.matrix, axis=0)  # Nilai minimum per kolom (shape: N,)
        m = self.matrix.copy()
        for j in range(self.N):
            m[:, j] -= col_mins[j]   # Kurangi setiap elemen kolom ke-j dengan minimumnya
        # Bulatkan kembali setelah pengurangan kolom
        self.matrix = np.round(m, 6)

        self._add_step(
            "Pengurangan Kolom",
            "Kurangi setiap elemen kolom dengan nilai terkecil pada kolom tersebut. "
            "Setelah langkah ini, setiap kolom memiliki minimal satu nilai nol.",
            self.matrix.copy(),
            col_mins=col_mins,
        )

    # =========================================================================
    # BAGIAN 2: REVISI MATRIKS
    # =========================================================================

    def _revise_matrix(self, iteration, row_lines, col_lines, num_lines):
        """
        LANGKAH 4 — Revisi Matriks (jika garis penutup belum cukup).

        Algoritma:
          1. Temukan nilai minimum dari semua sel yang TIDAK tertutup garis (min_val).
          2. Kurangi min_val dari setiap sel yang tidak tertutup.
          3. Tambahkan min_val ke setiap sel pada PERPOTONGAN dua garis (baris+kolom).
          4. Sel yang tertutup hanya satu garis (baris ATAU kolom) tidak berubah.

        Tujuan:
          Menciptakan nol baru di sel yang tidak tertutup, sehingga pada iterasi
          berikutnya jumlah garis penutup bertambah dan matching dapat diperluas.

        Parameter:
            iteration   (int)  : Nomor iterasi revisi (untuk label langkah)
            row_lines   (list) : Boolean list — baris mana yang tertutup garis horizontal
            col_lines   (list) : Boolean list — kolom mana yang tertutup garis vertikal
            num_lines   (int)  : Jumlah total garis penutup saat ini
        """
        # Kumpulkan semua nilai sel yang tidak tertutup oleh garis apapun
        uncovered = [
            self.matrix[r, c]
            for r in range(self.N) if not row_lines[r]
            for c in range(self.N) if not col_lines[c]
        ]
        # Nilai minimum dari sel tidak tertutup — ini yang akan dikurangkan
        min_val = min(uncovered) if uncovered else 0

        # Catat status SEBELUM revisi (untuk visualisasi di frontend)
        self._add_step(
            f"Revisi Matriks — Sebelum (Iterasi {iteration})",
            f"Garis penutup nol ({num_lines}) belum cukup (perlu {self.N}). "
            f"Nilai terkecil yang tidak tertutup adalah {min_val:.0f}. "
            "Nilai ini akan dikurangi dari semua sel yang tidak tertutup "
            "dan ditambahkan ke sel pada perpotongan garis.",
            self.matrix.copy(),
            row_lines=row_lines,
            col_lines=col_lines,
            min_uncovered=min_val,
        )

        # Terapkan revisi ke setiap sel berdasarkan status coveragenya
        m = self.matrix.copy()
        for r in range(self.N):
            for c in range(self.N):
                if not row_lines[r] and not col_lines[c]:
                    # Sel tidak tertutup: kurangi min_val → menciptakan nol baru
                    m[r, c] -= min_val
                elif row_lines[r] and col_lines[c]:
                    # Perpotongan dua garis: tambahkan min_val → menjaga nilai relatif
                    m[r, c] += min_val
                # Sel yang tertutup hanya satu garis: TIDAK diubah
        self.matrix = np.round(m, 6)  # Bulatkan untuk mencegah floating-point drift

        # Catat status SESUDAH revisi
        self._add_step(
            f"Revisi Matriks — Sesudah (Iterasi {iteration})",
            f"Matriks setelah revisi: nilai {min_val:.0f} telah dikurangi dari sel yang tidak tertutup "
            "dan ditambahkan ke perpotongan garis. Perhatikan nilai nol baru yang muncul.",
            self.matrix.copy(),
        )

    # =========================================================================
    # BAGIAN 3: MATCHING BIPARTIT & VERTEX COVER (KÖNIG'S THEOREM)
    # =========================================================================

    def _max_matching(self):
        """
        Mencari matching bipartit maksimum pada posisi nol menggunakan
        DFS Augmenting Path (Hungarian Matching Algorithm).

        Konsep:
          Matriks yang telah direduksi memiliki banyak nilai 0.
          Kita ingin memilih sebanyak mungkin sel bernilai 0 sedemikian hingga
          tidak ada dua sel yang berbagi baris atau kolom (ini adalah matching bipartit).

          Sisi kiri graph bipartit: baris matriks (agen)
          Sisi kanan graph bipartit: kolom matriks (pekerjaan/UMKM)
          Edge: ada jika matrix[row][col] ≈ 0

        Algoritma DFS Augmenting Path:
          Untuk setiap baris r yang belum dipasangkan:
            → Coba temukan kolom c dengan matrix[r][c] = 0 yang belum terpakai.
            → Jika kolom c sudah dipasangkan dengan baris lain (match_col[c]),
              coba cari jalur augmenting untuk baris lama itu (rekursi DFS).
            → Jika jalur ditemukan: pasangkan r ↔ c, return True.

        Kompleksitas: O(N³) dalam kasus terburuk (N baris × N DFS × N kolom).

        Returns:
            tuple:
              - match_row (list[int]): match_row[r] = kolom yang dipasangkan ke baris r, atau -1
              - match_col (list[int]): match_col[c] = baris yang dipasangkan ke kolom c, atau -1
        """
        match_row = [-1] * self.N   # match_row[r] = kolom yang dipasangkan ke baris r (-1 jika belum)
        match_col = [-1] * self.N   # match_col[c] = baris yang dipasangkan ke kolom c (-1 jika belum)

        def dfs(r, visited):
            """
            DFS Augmenting Path untuk baris r.
            Mencari jalur augmenting dari baris r ke kolom yang bebas atau dapat dilepaskan.

            Parameter:
                r       (int)       : Baris yang sedang dicoba untuk dipasangkan
                visited (list[bool]): Kolom yang sudah dikunjungi pada iterasi DFS ini
                                      (mencegah loop tak terbatas)
            Returns:
                bool: True jika berhasil menemukan pasangan untuk baris r
            """
            for c in range(self.N):
                # Hanya pertimbangkan sel dengan nilai mendekati 0 (threshold 1e-9)
                # dan kolom yang belum dikunjungi pada iterasi DFS ini
                if abs(self.matrix[r, c]) < 1e-9 and not visited[c]:
                    visited[c] = True   # Tandai kolom ini sudah dicoba

                    # Jika kolom c belum dipasangkan (match_col[c] = -1):
                    # langsung pasangkan r ↔ c.
                    # Jika sudah dipasangkan dengan baris lain (match_col[c] = r2):
                    # coba temukan jalur augmenting untuk r2 (augmenting path).
                    if match_col[c] < 0 or dfs(match_col[c], visited):
                        # Perbarui pasangan: baris r dipasangkan ke kolom c
                        match_col[c] = r
                        match_row[r] = c
                        return True   # Berhasil menemukan pasangan
            return False   # Tidak ada jalur augmenting yang tersedia untuk baris r

        # Coba pasangkan setiap baris secara berurutan
        for r in range(self.N):
            # visited di-reset untuk setiap baris baru (setiap DFS independen)
            dfs(r, [False] * self.N)

        return match_row, match_col

    def _min_vertex_cover(self, match_row, match_col):
        """
        Menentukan Minimum Vertex Cover (garis penutup minimum) dari matching maksimum
        menggunakan König's Theorem pada bipartite graph.

        König's Theorem:
          Dalam bipartite graph, ukuran matching maksimum = ukuran minimum vertex cover.
          Teorema ini menjamin bahwa sejumlah garis (baris + kolom) sama dengan
          jumlah matching dapat menutupi SEMUA nilai 0 dalam matriks.

        Algoritma (berdasarkan König's Theorem):
          1. Tandai (mark) semua baris yang TIDAK terpasang dalam matching (unmatched rows).
          2. Untuk setiap baris yang ditandai: tandai juga kolom yang terhubung ke baris ini
             melalui sel bernilai 0 (zero cells).
          3. Untuk setiap kolom yang ditandai: tandai juga baris yang terpasang ke kolom
             ini dalam matching (matched row of marked column).
          4. Ulangi 2–3 hingga tidak ada perubahan (konvergensi).
          5. Hasil:
             - Baris yang TIDAK ditandai → masuk garis horizontal (row_lines = True)
             - Kolom yang DITANDAI → masuk garis vertikal (col_lines = True)

        Parameter:
            match_row (list[int]): Hasil dari _max_matching() — pasangan kolom tiap baris
            match_col (list[int]): Hasil dari _max_matching() — pasangan baris tiap kolom

        Returns:
            tuple:
              - row_lines (list[bool]): True jika baris ke-i ditutup garis horizontal
              - col_lines (list[bool]): True jika kolom ke-j ditutup garis vertikal
        """
        # Langkah 1: Tandai semua baris yang tidak terpasang (unmatched rows)
        marked_rows = [match_row[r] == -1 for r in range(self.N)]
        marked_cols = [False] * self.N

        # Langkah 2–4: Propagasi penandaan (alternating tree construction)
        changed = True
        while changed:
            changed = False

            # Dari baris yang ditandai: tandai kolom yang memiliki sel 0
            for r in range(self.N):
                if marked_rows[r]:
                    for c in range(self.N):
                        if abs(self.matrix[r, c]) < 1e-9 and not marked_cols[c]:
                            marked_cols[c] = True   # Tandai kolom c
                            changed = True

            # Dari kolom yang ditandai: tandai baris yang dipasangkan ke kolom tersebut
            for c in range(self.N):
                if marked_cols[c]:
                    r = match_col[c]   # Baris yang dipasangkan ke kolom c dalam matching
                    if r != -1 and not marked_rows[r]:
                        marked_rows[r] = True   # Tandai baris pasangan
                        changed = True

        # Langkah 5: Konversi marking ke garis penutup
        # Garis baris: baris yang TIDAK ditandai (terpasang dalam matching, tidak di alternating tree)
        row_lines = [not marked_rows[r] for r in range(self.N)]
        # Garis kolom: kolom yang DITANDAI (terhubung ke baris tidak terpasang via zero)
        col_lines = [marked_cols[c]     for c in range(self.N)]

        return row_lines, col_lines

    # =========================================================================
    # UTILITAS: TAMBAH LANGKAH KE LOG
    # =========================================================================

    def _add_step(self, title, description, matrix, **kwargs):
        """
        Menambahkan satu langkah ke dalam daftar self.steps untuk ditampilkan
        secara step-by-step di frontend.

        Setiap langkah berisi:
          - title       : Nama langkah (misal "Pengurangan Baris")
          - description : Penjelasan teks langkah ini
          - matrix      : Snapshot matriks pada saat langkah ini (NumPy array)
          - **kwargs    : Data tambahan opsional:
              row_mins      (ndarray) : Nilai minimum per baris (untuk langkah reduce_rows)
              col_mins      (ndarray) : Nilai minimum per kolom (untuk langkah reduce_cols)
              row_lines     (list)    : Boolean list garis baris (untuk langkah penutupan)
              col_lines     (list)    : Boolean list garis kolom (untuk langkah penutupan)
              min_uncovered (float)   : Nilai minimum tak-tertutup (untuk langkah revisi)
              assignments   (list)    : Hasil penugasan akhir (untuk langkah terakhir)
              total_cost    (float)   : Total biaya optimal (untuk langkah terakhir)
              is_optimal    (bool)    : True jika ini adalah langkah penutupan optimal
              is_final      (bool)    : True jika ini adalah langkah hasil akhir
        """
        self.steps.append({
            "title":       title,
            "description": description,
            "matrix":      matrix,
            **kwargs,        # Sertakan semua data tambahan yang relevan
        })
