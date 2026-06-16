import numpy as np


class HungarianSolver:
    """
    Menyelesaikan masalah penugasan menggunakan Algoritma Hungarian.
    Mendukung kasus minimasi dan maksimasi, serta matriks tidak persegi.
    Setiap langkah perhitungan disimpan agar dapat ditampilkan secara bertahap.
    """

    def __init__(self, cost_matrix, is_maximization=False):
        self.original_matrix = np.array(cost_matrix, dtype=float)
        self.num_rows, self.num_cols = self.original_matrix.shape
        self.is_maximization = is_maximization

        # Jadikan matriks persegi dengan padding nol jika perlu
        self.N = max(self.num_rows, self.num_cols)
        
        # Error Handling: Memastikan ukuran berada dalam rentang wajar agar tidak terjadi Memory Overflow
        if not (8 <= self.num_rows <= 20) or not (8 <= self.num_cols <= 20):
            raise ValueError(f"Ukuran matriks penugasan harus antara 8x8 dan 20x20. Saat ini: {self.num_rows}x{self.num_cols}")

        self.padded_matrix = np.zeros((self.N, self.N), dtype=float)
        self.padded_matrix[:self.num_rows, :self.num_cols] = self.original_matrix

        # Untuk kasus maksimasi, konversi ke minimasi: C' = max - C
        if self.is_maximization:
            self.max_val = np.max(self.original_matrix)
            self.matrix  = self.max_val - self.padded_matrix
        else:
            self.matrix = self.padded_matrix.copy()

        self.steps = []

    def solve(self):
        """Jalankan algoritma Hungarian dan kembalikan hasil penugasan beserta total biaya."""
        self.steps = []

        # Langkah 0: tampilkan matriks awal
        desc = "Matriks biaya penugasan awal."
        if self.is_maximization:
            desc += (
                f" Kasus maksimasi dikonversi ke minimasi dengan rumus C' = {self.max_val:.0f} - C."
            )
        if self.num_rows != self.num_cols:
            desc += (
                f" Karena matriks tidak persegi, ditambahkan baris/kolom dummy bernilai 0 "
                f"sehingga ukuran menjadi {self.N}x{self.N}."
            )
        self._add_step("Matriks Awal", desc, self.matrix.copy())

        # Langkah 1: pengurangan baris
        row_mins = np.min(self.matrix, axis=1)
        m = self.matrix.copy()
        for i in range(self.N):
            m[i] -= row_mins[i]
        self.matrix = m
        self._add_step(
            "Pengurangan Baris",
            "Kurangi setiap elemen baris dengan nilai terkecil pada baris tersebut. "
            "Setelah langkah ini, setiap baris memiliki minimal satu nilai nol.",
            self.matrix.copy(),
            row_mins=row_mins,
        )

        # Langkah 2: pengurangan kolom
        col_mins = np.min(self.matrix, axis=0)
        m = self.matrix.copy()
        for j in range(self.N):
            m[:, j] -= col_mins[j]
        self.matrix = m
        self._add_step(
            "Pengurangan Kolom",
            "Kurangi setiap elemen kolom dengan nilai terkecil pada kolom tersebut. "
            "Setelah langkah ini, setiap kolom memiliki minimal satu nilai nol.",
            self.matrix.copy(),
            col_mins=col_mins,
        )

        # Langkah 3 & 4: penutupan garis dan revisi matriks (loop hingga optimal)
        iteration = 1
        while True:
            match_row, match_col = self._max_matching()
            row_lines, col_lines = self._min_vertex_cover(match_row, match_col)
            num_lines = sum(row_lines) + sum(col_lines)

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
                break

            # Cari nilai terkecil yang tidak tertutup oleh garis apa pun (baris maupun kolom)
            uncovered = [
                self.matrix[r, c]
                for r in range(self.N) if not row_lines[r]
                for c in range(self.N) if not col_lines[c]
            ]
            min_val = min(uncovered) if uncovered else 0

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

            m = self.matrix.copy()
            for r in range(self.N):
                for c in range(self.N):
                    # 1. Sel yang TIDAK tertutup garis: Kurangi dengan nilai terkecil (min_val)
                    if not row_lines[r] and not col_lines[c]:
                        m[r, c] -= min_val
                    # 2. Sel yang berada di PERPOTONGAN dua garis: Tambahkan dengan nilai terkecil (min_val)
                    elif row_lines[r] and col_lines[c]:
                        m[r, c] += min_val
                    # 3. Sel yang dilewati satu garis saja dibiarkan tetap (tidak berubah)
            self.matrix = m

            self._add_step(
                f"Revisi Matriks — Sesudah (Iterasi {iteration})",
                f"Matriks setelah revisi: nilai {min_val:.0f} telah dikurangi dari sel yang tidak tertutup "
                "dan ditambahkan ke perpotongan garis. Perhatikan nilai nol baru yang muncul.",
                self.matrix.copy(),
            )
            iteration += 1

        # Kumpulkan hasil penugasan akhir
        final_assignments = []
        total_cost = 0
        for r in range(self.num_rows):
            c = match_row[r]
            if c != -1 and c < self.num_cols:
                cost = self.original_matrix[r, c]
                final_assignments.append({"row": r, "col": c, "cost": cost})
                total_cost += cost

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

    def _add_step(self, title, description, matrix, **kwargs):
        self.steps.append({
            "title":       title,
            "description": description,
            "matrix":      matrix,
            **kwargs,
        })

    def _max_matching(self):
        """Cari matching bipartit maksimal pada posisi nol menggunakan DFS augmenting path."""
        match_row = [-1] * self.N
        match_col = [-1] * self.N

        def dfs(r, visited):
            # Coba hubungkan baris r ke setiap kolom c
            for c in range(self.N):
                # Jika sel bernilai 0 dan kolom c belum dikunjungi pada iterasi DFS ini
                if abs(self.matrix[r, c]) < 1e-9 and not visited[c]:
                    visited[c] = True
                    # Jika kolom c belum dipasangkan, ATAU pasangan sebelumnya (match_col[c])
                    # berhasil menemukan jalur alternatif lain, maka pasangkan r dengan c
                    if match_col[c] < 0 or dfs(match_col[c], visited):
                        match_col[c] = r
                        match_row[r] = c
                        return True
            return False

        # Lakukan iterasi untuk mencari pasangan bagi setiap baris
        for r in range(self.N):
            dfs(r, [False] * self.N)

        return match_row, match_col

    def _min_vertex_cover(self, match_row, match_col):
        """
        Tentukan garis penutup nol minimum menggunakan Konig's Theorem.
        Hasilnya berupa dua list boolean: baris mana yang tertutup dan kolom mana yang tertutup.
        """
        marked_rows = [match_row[r] == -1 for r in range(self.N)]
        marked_cols = [False] * self.N

        changed = True
        while changed:
            changed = False
            for r in range(self.N):
                if marked_rows[r]:
                    for c in range(self.N):
                        if abs(self.matrix[r, c]) < 1e-9 and not marked_cols[c]:
                            marked_cols[c] = True
                            changed = True
            for c in range(self.N):
                if marked_cols[c]:
                    r = match_col[c]
                    if r != -1 and not marked_rows[r]:
                        marked_rows[r] = True
                        changed = True

        # Garis penutup = baris yang tidak ditandai + kolom yang ditandai
        row_lines = [not marked_rows[r] for r in range(self.N)]
        col_lines = [marked_cols[c]     for c in range(self.N)]
        return row_lines, col_lines
