/**
 * ============================================================================
 * script.js
 *
 * Logika Utama Frontend untuk Aplikasi OptiPath.
 * Mengontrol rendering modul (SPA), komunikasi API (Fetch), serta
 * validasi input pengguna secara dinamis.
 *
 * Modul Utama:
 * 1. Metode Penugasan (Hungarian Algorithm):
 *    - Setup matriks dinamis (8x8 hingga 20x20)
 *    - Navigasi keyboard antar sel matriks (Arrow Keys + Enter)
 *    - Validasi "dirty state" dan tipe data numerik secara real-time
 *    - Rendering langkah-langkah visual termasuk garis penutup (coverage lines)
 *    - Modular: setiap tahap rendering dipecah ke fungsi terpisah
 * 2. Teori Jaringan (CPM):
 *    - Input aktivitas dinamis
 *    - Pengolahan Forward/Backward Pass melalui API
 *    - Visualisasi graf interaktif menggunakan library Vis.js
 *
 * Arsitektur Modular:
 *  - collectMatrix()          → kumpulkan data dari sel matriks input
 *  - validateMatrix()         → validasi sel kosong & non-numerik
 *  - renderStepMatrix()       → render matriks satu langkah Hungarian
 *  - renderStepCard()         → render satu kartu langkah
 *  - renderAllSteps()         → render semua langkah ke DOM
 *  - renderAssignments()      → render tabel hasil penugasan akhir
 *  - buildMatrixHTML()        → bangun string HTML tabel matriks input
 * ============================================================================
 */

// ── Konstanta URL API backend (FastAPI) ──────────────────────────────────────
const API_URL = 'http://127.0.0.1:8000';

// ============================================================================
// INISIALISASI: Berjalan setelah DOM siap
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {

    // ── Cek koneksi ke API backend saat halaman pertama kali dibuka ──
    fetch(`${API_URL}/`)
        .then(res => res.json())
        .then(() => {
            const apiStatus = document.getElementById('api-status');
            if (apiStatus) {
                apiStatus.innerHTML = 'API Backend: Connected 🟢';
                apiStatus.style.color = '#10B981';
            }
        })
        .catch(() => {
            // Jika backend tidak berjalan, tampilkan status merah
            const apiStatus = document.getElementById('api-status');
            if (apiStatus) {
                apiStatus.innerHTML = 'API Backend: Disconnected 🔴';
                apiStatus.style.color = '#EF4444';
            }
        });

    // ── Referensi elemen navigasi sidebar ──
    const navDashboard = document.getElementById('nav-dashboard');
    const navHungarian = document.getElementById('nav-hungarian');
    const navCpm       = document.getElementById('nav-cpm');
    const container    = document.getElementById('module-container');

    // ── Utility: atur item navigasi aktif ──
    function setActiveNav(activeNav) {
        navDashboard.classList.remove('active');
        navHungarian.classList.remove('active');
        navCpm.classList.remove('active');
        activeNav.classList.add('active');
    }

    // ============================================================================
    // MODUL DASHBOARD: Halaman beranda
    // ============================================================================
    function renderDashboard() {
        setActiveNav(navDashboard);
        document.getElementById('topbar-breadcrumb').innerText = 'Home';
        // Render HTML halaman beranda dengan kartu navigasi ke modul utama
        container.innerHTML = `
            <div class="op-module-wrap">
                <h1 class="op-module-title">Beranda</h1>
                <p class="op-module-sub">Selamat datang di OptiPath — pilih modul dari sidebar untuk memulai.</p>
            </div>
            <div class="notion-divider"></div>
            <div class="notion-section">
                <div class="op-ch">
                    <div>
                        <h2 class="op-ch-title">Modul Tersedia</h2>
                        <p class="op-ch-subtitle">Pilih modul di bawah ini untuk memulai analisis.</p>
                    </div>
                </div>
                <div class="grid-2">
                    <div style="padding:1.2rem; border-radius:4px; border:1px solid rgba(55,53,47,0.16); cursor: pointer; transition: background 0.1s;" onmouseover="this.style.background='rgba(55,53,47,0.04)'" onmouseout="this.style.background='transparent'" onclick="document.getElementById('nav-hungarian').click()">
                        <div style="font-size:1.8rem; font-weight:bold; margin-bottom:0.8rem; color:#4F46E5;">H</div>
                        <div style="font-weight:600; color:#37352F; font-size:1rem; margin-bottom:0.2rem;">Model Penugasan (Assignment)</div>
                        <div style="font-size:0.85rem; color:rgba(55,53,47,0.65); line-height:1.4">Algoritma Hungarian — Minimasi biaya penugasan agen ke lokasi UMKM</div>
                    </div>
                    <div style="padding:1.2rem; border-radius:4px; border:1px solid rgba(55,53,47,0.16); cursor: pointer; transition: background 0.1s;" onmouseover="this.style.background='rgba(55,53,47,0.04)'" onmouseout="this.style.background='transparent'" onclick="document.getElementById('nav-cpm').click()">
                        <div style="font-size:1.5rem; font-weight:bold; margin-bottom:0.5rem; color:#37352F;">❖</div>
                        <div style="font-weight:600; color:#37352F; font-size:1rem; margin-bottom:0.2rem;">Teori Jaringan (CPM)</div>
                        <div style="font-size:0.85rem; color:rgba(55,53,47,0.65); line-height:1.4">Critical Path Method — Penjadwalan produksi konten digital</div>
                    </div>
                </div>
            </div>
        `;
    }

    // ============================================================================
    // MODUL HUNGARIAN: Render halaman utama Metode Penugasan
    // ============================================================================
    function renderHungarian() {
        setActiveNav(navHungarian);
        document.getElementById('topbar-breadcrumb').innerText = 'Metode Penugasan';
        // Render template HTML lengkap untuk modul Hungarian
        container.innerHTML = `
            <div class="op-module-wrap">
                <div class="page-icon">🏢</div>
                <h1 class="op-module-title">Metode Penugasan</h1>
                <p class="op-module-sub" style="margin-bottom: 2rem;">Algoritma Hungarian — Optimasi penugasan agen ke lokasi UMKM.</p>
                
                <div class="notion-props">
                    <div class="notion-prop-row">
                        <div class="notion-prop-label"><span>👤</span> Created by</div>
                        <div class="notion-prop-val"><span class="notion-badge">kelompok 4 risop</span></div>
                    </div>
                    <div class="notion-prop-row">
                        <div class="notion-prop-label"><span>⚙️</span> Solver</div>
                        <div class="notion-prop-val">Hungarian Algorithm</div>
                    </div>
                </div>
            </div>
            <div style="max-width: 1000px;">
                <div class="notion-section">
                    <div class="op-ch">
                        <div>
                            <h2 class="op-ch-title">Konfigurasi Matriks</h2>
                            <p class="op-ch-subtitle">Minimal 8x8, maksimal 20x20.</p>
                        </div>
                    </div>
                    <div class="grid-2" style="gap: 1rem; margin-bottom: 1rem;">
                        <div class="form-group">
                            <label>Jumlah Baris (Agen)</label>
                            <input type="number" id="matrix-rows" class="form-control" value="8" min="8" max="20">
                        </div>
                        <div class="form-group">
                            <label>Jumlah Kolom (UMKM)</label>
                            <input type="number" id="matrix-cols" class="form-control" value="8" min="8" max="20">
                        </div>
                    </div>
                    <div class="grid-2" style="gap: 1rem; margin-bottom: 1rem;">
                        <div class="form-group">
                            <label>Jenis Optimasi (Wajib Pilih)</label>
                            <select id="opt-mode" class="form-control">
                                <option value="">-- Pilih Jenis Optimasi --</option>
                                <option value="min">Minimasi (Biaya)</option>
                                <option value="max">Maksimasi (Keuntungan/Skor)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Metode Pengisian Data</label>
                            <select id="input-method" class="form-control">
                                <option value="random">Acak (Generator Bilangan Random)</option>
                                <option value="manual">Manual (Isi Per Sel)</option>
                            </select>
                        </div>
                    </div>
                    <button class="btn btn-ghost" id="btn-generate" style="margin-bottom: 1.5rem; width: 100%;">Ganti Ukuran / Reset Matriks</button>
                    
                    <!-- Dirty-state banner: muncul saat data diubah tapi belum dikalkulasi ulang -->
                    <div id="matrix-dirty-banner">
                        ✏️ Data matriks telah diubah &mdash; klik <strong>Jalankan Optimasi</strong> untuk memperbarui hasil.
                    </div>

                    <div class="matrix-scroll-wrapper" id="matrix-container" style="margin-top: 0.5rem;"></div>
                    
                    <!-- Sticky solve bar agar tombol selalu terlihat saat scroll matriks besar -->
                    <div class="solve-sticky-bar">
                        <button class="btn btn-primary" id="btn-solve">
                            <span class="spinner" id="btn-solve-spinner" style="display:none;"></span> 
                            <span id="btn-solve-text">Jalankan Optimasi</span>
                        </button>
                        <span id="matrix-size-info" style="font-size:0.8rem; color:rgba(55,53,47,0.45);">8 × 8 = 64 sel</span>
                    </div>
                </div>
                
                <!-- Hasil Kalkulasi: tersembunyi hingga API mengembalikan data sukses -->
                <div id="results-container" style="display: none;">
                    <div class="notion-divider"></div>
                    <div class="result-box">
                        <div class="result-label">TOTAL NILAI OPTIMAL</div>
                        <div class="result-value" id="res-total">--</div>
                    </div>
                    <div class="notion-section" id="steps-container" style="margin-top: 2rem;">
                        <h3 class="op-ch-title" style="margin-bottom: 1rem;">Langkah Perhitungan</h3>
                        <div id="steps-viewer" style="margin-bottom: 2rem;">
                        </div>
                        
                        <h3 class="op-ch-title" style="margin-bottom: 1rem;">Kesimpulan</h3>
                        <div id="assignments-list"></div>
                    </div>
                </div>
            </div>
        `;

        // Inisialisasi matriks default 8x8 dengan nilai acak
        setupMatrix(8, 8, true);

        // ── Event: Tombol "Ganti Ukuran / Reset Matriks" ──
        document.getElementById('btn-generate').addEventListener('click', () => {
            const rowInput = document.getElementById('matrix-rows');
            const colInput = document.getElementById('matrix-cols');
            const r = parseInt(rowInput.value) || 0;
            const c = parseInt(colInput.value) || 0;
            
            // Validasi dimensi: harus antara 8 dan 20
            let hasError = false;
            
            if (r < 8 || r > 20) {
                rowInput.style.borderColor = '#EF4444';
                rowInput.style.backgroundColor = '#FEF2F2';
                hasError = true;
            } else {
                rowInput.style.borderColor = '';
                rowInput.style.backgroundColor = '';
            }
            
            if (c < 8 || c > 20) {
                colInput.style.borderColor = '#EF4444';
                colInput.style.backgroundColor = '#FEF2F2';
                hasError = true;
            } else {
                colInput.style.borderColor = '';
                colInput.style.backgroundColor = '';
            }
            
            if (hasError) {
                alert("Gagal: Dimensi minimal adalah 8x8 dan maksimal 20x20. Silakan perbaiki ukuran yang berwarna merah.");
                return;
            }

            const isRandom = document.getElementById('input-method').value === 'random';
            setupMatrix(r, c, isRandom);
        });

        // ── Event: Bersihkan border error saat nilai dimensi diubah ──
        document.getElementById('matrix-rows').addEventListener('input', function() {
            this.style.borderColor = '';
            this.style.backgroundColor = '';
        });
        document.getElementById('matrix-cols').addEventListener('input', function() {
            this.style.borderColor = '';
            this.style.backgroundColor = '';
        });

        // ── Event: Sembunyikan hasil lama jika mode optimasi diubah ──
        document.getElementById('opt-mode').addEventListener('change', function() {
            if (this.value) this.classList.remove('is-invalid');
            document.getElementById('results-container').style.display = 'none';
        });

        document.getElementById('input-method').addEventListener('change', function() {
            document.getElementById('results-container').style.display = 'none';
        });

        // ── Event: Validasi real-time tiap sel input matriks ──
        // Mendeteksi karakter non-numerik (misal huruf "A") dan menampilkan dirty-state
        document.getElementById('matrix-container').addEventListener('input', (e) => {
            document.getElementById('results-container').style.display = 'none';
            if (e.target.classList.contains('matrix-cell')) {
                const raw = e.target.value.trim();
                // Cek apakah nilai bukan angka valid (termasuk huruf, simbol, dll)
                const isInvalid = raw !== '' && (isNaN(Number(raw)) || e.target.validity.badInput);
                if (isInvalid) {
                    // Sorot merah jika input non-numerik (mis. huruf "A")
                    e.target.style.borderColor = '#EF4444';
                    e.target.style.backgroundColor = '#FEF2F2';
                    e.target.title = '⚠ Input harus berupa angka';
                    e.target.classList.remove('dirty');
                } else {
                    // Reset style dan tandai sebagai "dirty" (amber) jika valid namun belum dikalkulasi
                    e.target.style.borderColor = '';
                    e.target.style.backgroundColor = '';
                    e.target.title = '';
                    e.target.classList.add('dirty');
                }
                // Tampilkan banner "data telah diubah" di atas tabel
                const banner = document.getElementById('matrix-dirty-banner');
                if (banner) banner.classList.add('visible');
            }
        });

        // ── Event: Navigasi Keyboard antar sel matriks ──
        // Arrow keys + Enter untuk pindah sel seperti spreadsheet
        document.getElementById('matrix-container').addEventListener('keydown', (e) => {
            if (!e.target.classList.contains('matrix-cell')) return;
            const r      = parseInt(e.target.dataset.row);
            const colIdx = parseInt(e.target.dataset.col);
            const totalCols = parseInt(e.target.dataset.cols);
            const totalRows = parseInt(e.target.dataset.rows);

            let nextR = r, nextC = colIdx;
            if (e.key === 'ArrowRight' || (e.key === 'Enter' && !e.shiftKey)) {
                // Maju ke kanan; jika di kolom akhir, turun ke baris berikutnya
                nextC = colIdx + 1;
                if (nextC >= totalCols) { nextC = 0; nextR = r + 1; }
            } else if (e.key === 'ArrowLeft') {
                // Mundur ke kiri; jika di kolom pertama, naik ke baris sebelumnya
                nextC = colIdx - 1;
                if (nextC < 0) { nextC = totalCols - 1; nextR = r - 1; }
            } else if (e.key === 'ArrowDown') {
                nextR = r + 1;
            } else if (e.key === 'ArrowUp') {
                nextR = r - 1;
            } else if (e.key === 'Tab') {
                return; // Biarkan perilaku Tab browser default berjalan
            } else {
                return; // Abaikan key lain
            }

            e.preventDefault();
            // Pastikan target berada dalam batas matriks
            if (nextR < 0 || nextR >= totalRows || nextC < 0 || nextC >= totalCols) return;
            const next = document.querySelector(`.matrix-cell[data-row="${nextR}"][data-col="${nextC}"]`);
            if (next) { next.focus(); next.select(); }
        });

        // ── Event: Excel-like Bulk Paste ──
        // Mendukung paste data dari Excel (tab-separated, newline-per-row)
        document.getElementById('matrix-container').addEventListener('paste', (e) => {
            if (!e.target.classList.contains('matrix-cell')) return;
            e.preventDefault();
            
            const pasteData = (e.clipboardData || window.clipboardData).getData('text');
            if (!pasteData) return;

            const startRow = parseInt(e.target.dataset.row);
            const startCol = parseInt(e.target.dataset.col);
            let currentRows = parseInt(e.target.dataset.rows);
            let currentCols = parseInt(e.target.dataset.cols);

            // Parsing teks: baris dipisah newline, kolom dipisah tab (format Excel)
            const pasteLines = pasteData.trim().split(/\r?\n/);
            const pastedRows = pasteLines.length;
            const pastedCols = Math.max(...pasteLines.map(r => r.split('\t').length));

            const reqRows = Math.min(20, startRow + pastedRows);
            const reqCols = Math.min(20, startCol + pastedCols);

            // Auto-expand matriks jika paste melebihi ukuran saat ini (max 20x20)
            if (reqRows > currentRows || reqCols > currentCols) {
                const finalRows = Math.max(currentRows, reqRows);
                const finalCols = Math.max(currentCols, reqCols);
                
                // Simpan data lama sebelum re-render matriks
                let oldData = [];
                for (let i = 0; i < currentRows; i++) {
                    let rowData = [];
                    for (let j = 0; j < currentCols; j++) {
                        const input = document.querySelector(`.matrix-cell[data-row="${i}"][data-col="${j}"]`);
                        rowData.push(input ? input.value : '');
                    }
                    oldData.push(rowData);
                }
                
                // Render ulang dengan ukuran diperbesar, lalu kembalikan data lama
                setupMatrix(finalRows, finalCols, false);
                for (let i = 0; i < currentRows; i++) {
                    for (let j = 0; j < currentCols; j++) {
                        const input = document.querySelector(`.matrix-cell[data-row="${i}"][data-col="${j}"]`);
                        if (input && oldData[i][j] !== '') {
                            input.value = oldData[i][j];
                        }
                    }
                }
                
                currentRows = finalRows;
                currentCols = finalCols;
            }

            // Isi sel dengan data paste baris per baris
            for (let i = 0; i < pasteLines.length; i++) {
                const targetRow = startRow + i;
                if (targetRow >= currentRows) break; // Jangan melebihi batas

                const cells = pasteLines[i].split('\t');
                for (let j = 0; j < cells.length; j++) {
                    const targetCol = startCol + j;
                    if (targetCol >= currentCols) break;

                    const cellInput = document.querySelector(`.matrix-cell[data-row="${targetRow}"][data-col="${targetCol}"]`);
                    if (cellInput) {
                        cellInput.value = cells[j].trim();
                        // Trigger event 'input' agar validasi & dirty-state berjalan otomatis
                        cellInput.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                }
            }
        });

        // ── Event: Tombol "Jalankan Optimasi" ──
        document.getElementById('btn-solve').addEventListener('click', solveHungarian);
    }

    // ============================================================================
    // MODUL HUNGARIAN — SUB-FUNGSI SETUP MATRIKS
    // ============================================================================

    /**
     * setupMatrix(rows, cols, isRandom)
     * Membangun tabel matriks input di DOM dengan ukuran yang ditentukan.
     * Jika isRandom=true, sel diisi bilangan acak 10–99.
     * Membatasi dimensi ke rentang [8, 20].
     */
    function setupMatrix(rows, cols, isRandom) {
        // Paksa dimensi berada dalam batas yang diizinkan
        rows = Math.max(8, Math.min(20, rows));
        cols = Math.max(8, Math.min(20, cols));
        document.getElementById('matrix-rows').value = rows;
        document.getElementById('matrix-cols').value = cols;

        // Perbarui label info ukuran di sticky bar
        const sizeInfo = document.getElementById('matrix-size-info');
        if (sizeInfo) sizeInfo.textContent = `${rows} × ${cols} = ${rows * cols} sel`;

        const c = document.getElementById('matrix-container');
        // Render HTML tabel dan sisipkan ke container
        c.innerHTML = buildMatrixHTML(rows, cols, isRandom);

        // Reset indikator dirty-state
        const banner = document.getElementById('matrix-dirty-banner');
        if (banner) banner.classList.remove('visible');
        c.querySelectorAll('.matrix-cell.dirty').forEach(el => el.classList.remove('dirty'));
    }

    /**
     * buildMatrixHTML(rows, cols, isRandom)
     * Membangun string HTML untuk tabel matriks input.
     * Setiap sel adalah <input type="number"> dengan data-row, data-col, dsb.
     * Header baris (A1…An) dan kolom (K1…Kn) bersifat sticky.
     * @returns {string} HTML tabel lengkap
     */
    function buildMatrixHTML(rows, cols, isRandom) {
        // Baris header kolom (sticky top) — K1, K2, …, Kn
        let html = '<table class="matrix-table" style="table-layout: fixed; width: max-content; border-collapse: collapse;">';
        html += '<thead><tr><th style="min-width:36px;">&nbsp;</th>';
        for (let j = 0; j < cols; j++) {
            html += `<th>K${j + 1}</th>`;
        }
        html += '</tr></thead><tbody>';

        // Baris data: setiap sel adalah input numerik
        for (let i = 0; i < rows; i++) {
            html += `<tr><td>A${i + 1}</td>`; // Label baris (sticky left)
            for (let j = 0; j < cols; j++) {
                // Nilai acak 10–99 untuk mode random, kosong untuk mode manual
                const val = isRandom ? (Math.floor(Math.random() * 90) + 10) : '';
                html += `<td><input type="number" class="matrix-cell text-right" style="width:60px; min-width:60px;" data-row="${i}" data-col="${j}" data-cols="${cols}" data-rows="${rows}" value="${val}" tabindex="0" autocomplete="off"></td>`;
            }
            html += '</tr>';
        }
        html += '</tbody></table>';
        return html;
    }

    // ============================================================================
    // MODUL HUNGARIAN — SUB-FUNGSI PENGUMPULAN & VALIDASI DATA MATRIKS
    // ============================================================================

    /**
     * collectMatrix(rows, cols)
     * Membaca nilai dari setiap sel input matriks dan mengembalikan array 2D.
     * @returns {{ matrix: number[][]|null, error: string|null }}
     * Jika ada sel tidak ditemukan, kembalikan error string.
     */
    function collectMatrix(rows, cols) {
        const matrix = [];
        for (let i = 0; i < rows; i++) {
            let row = [];
            for (let j = 0; j < cols; j++) {
                const input = document.querySelector(`.matrix-cell[data-row="${i}"][data-col="${j}"]`);
                if (!input) {
                    // Sel tidak ditemukan — tabel tidak sinkron dengan dimensi
                    return { matrix: null, error: 'Gagal: Tabel matriks di layar tidak sinkron dengan ukuran input. Silakan klik "Ganti Ukuran / Reset Matriks" terlebih dahulu.' };
                }
                row.push({ raw: input.value.trim(), badInput: input.validity.badInput });
            }
            matrix.push(row);
        }
        return { matrix, error: null };
    }

    /**
     * validateMatrix(rawMatrix)
     * Memvalidasi setiap sel: tidak boleh kosong, harus angka valid.
     * Mendeteksi karakter non-numerik (huruf "A", simbol, dll).
     * @param {Array} rawMatrix - Hasil dari collectMatrix (berisi { raw, badInput })
     * @returns {{ valid: boolean, error: string|null, numMatrix: number[][] }}
     */
    function validateMatrix(rawMatrix) {
        let hasEmpty = false;
        const numMatrix = [];

        for (const row of rawMatrix) {
            const numRow = [];
            for (const cell of row) {
                if (cell.raw === '') {
                    // Sel masih kosong — belum diisi oleh pengguna
                    hasEmpty = true;
                } else if (cell.badInput || isNaN(Number(cell.raw))) {
                    // Input bukan angka: bisa berupa huruf, simbol, dsb.
                    return {
                        valid: false,
                        error: 'Gagal: Input harus berupa angka. Ditemukan karakter tidak valid (mis. huruf atau simbol) pada matriks.',
                        numMatrix: null
                    };
                }
                numRow.push(parseFloat(cell.raw) || 0);
            }
            numMatrix.push(numRow);
        }

        if (hasEmpty) {
            return {
                valid: false,
                error: 'Gagal: Terdapat sel matriks yang masih kosong. Harap lengkapi semua angka di dalam tabel matriks sebelum menjalankan optimasi.',
                numMatrix: null
            };
        }

        // Cek apakah ada sel masih berwarna merah (ditandai sebagai non-numerik sebelumnya)
        const invalidCells = document.querySelectorAll('.matrix-cell[style*="#EF4444"]');
        if (invalidCells.length > 0) {
            return {
                valid: false,
                error: 'Gagal: Terdapat sel yang berisi karakter non-angka (ditandai merah). Harap perbaiki terlebih dahulu.',
                numMatrix: null
            };
        }

        return { valid: true, error: null, numMatrix };
    }

    // ============================================================================
    // MODUL HUNGARIAN — SUB-FUNGSI RENDER HASIL LANGKAH-LANGKAH
    // ============================================================================

    /**
     * renderStepMatrix(step)
     * Membangun HTML tabel matriks untuk satu langkah algoritma Hungarian.
     * Menampilkan garis baris (biru) dan kolom (ungu) jika ada coverage lines.
     * Nilai nol ditampilkan sebagai lingkaran merah bold.
     * @param {Object} step - Satu objek langkah dari API (berisi matrix, row_lines, col_lines)
     * @returns {string} HTML string tabel langkah
     */
    function renderStepMatrix(step) {
        const rl = step.row_lines || []; // Daftar baris yang tertutup garis
        const cl = step.col_lines || []; // Daftar kolom yang tertutup garis
        const N  = step.matrix.length;
        const hasLines = step.row_lines || step.col_lines;

        // Caption legenda garis penutup (hanya muncul jika ada garis)
        const lineCount = (rl.filter(Boolean).length) + (cl.filter(Boolean).length);
        const lineCaption = hasLines
            ? `<div style="font-size:0.78rem; margin-bottom:0.5rem; color:rgba(55,53,47,0.6);">
                <span style="display:inline-flex;align-items:center;gap:0.3rem;">
                  <span style="width:20px;height:3px;background:#3B82F6;display:inline-block;border-radius:2px;"></span>Garis baris (horizontal)
                </span>
                &nbsp;&nbsp;
                <span style="display:inline-flex;align-items:center;gap:0.3rem;">
                  <span style="width:3px;height:16px;background:#8B5CF6;display:inline-block;border-radius:2px;"></span>Garis kolom (vertikal)
                </span>
                &nbsp;&nbsp;
                <strong style="color:#37352F;">${lineCount} garis penutup</strong> dibutuhkan dari total ${N}
               </div>`
            : '';

        // Bangun tabel HTML: header kolom K1…KN
        let html = `<div class="table-responsive" style="position:relative;">${lineCaption}`;
        html += `<table class="matrix-table" style="font-size:0.8rem;text-align:right;border-collapse:collapse;">`;
        html += '<thead><tr><th style="background:#F7F7F5;font-size:0.7rem;color:rgba(55,53,47,0.5);padding:0.3rem 0.5rem;border:1px solid rgba(55,53,47,0.08);"></th>';

        for (let cIdx = 0; cIdx < N; cIdx++) {
            const isCovCol = cl[cIdx];
            // Header kolom ungu jika tertutup garis vertikal
            html += `<th style="font-size:0.7rem;padding:0.3rem 0.5rem;text-align:center;
                background:${isCovCol ? 'rgba(139,92,246,0.08)' : '#F7F7F5'};
                color:${isCovCol ? '#7C3AED' : 'rgba(55,53,47,0.5)'};
                border:1px solid rgba(55,53,47,0.08);
                border-left-width:${isCovCol ? '2px' : '1px'};
                border-left-color:${isCovCol ? '#8B5CF6' : 'rgba(55,53,47,0.08)'};
                border-right-width:${isCovCol ? '2px' : '1px'};
                border-right-color:${isCovCol ? '#8B5CF6' : 'rgba(55,53,47,0.08)'};
                ">K${cIdx + 1}</th>`;
        }
        html += '</tr></thead><tbody>';

        // Baris data matriks dengan highlight berdasarkan coverage
        step.matrix.forEach((r, rIdx) => {
            const isCovRow = rl[rIdx];
            // Baris kritis: border atas/bawah tebal biru
            const rowBorderTop    = isCovRow ? 'border-top:2.5px solid #3B82F6;' : 'border-top:1px solid rgba(55,53,47,0.06);';
            const rowBorderBottom = isCovRow ? 'border-bottom:2.5px solid #3B82F6;' : 'border-bottom:1px solid rgba(55,53,47,0.06);';

            html += `<tr>`;
            // Label baris (A1…An) dengan warna biru jika tertutup garis horizontal
            html += `<td style="font-size:0.7rem;color:${isCovRow ? '#2563EB' : 'rgba(55,53,47,0.45)'};font-weight:600;
                background:${isCovRow ? 'rgba(59,130,246,0.06)' : '#F7F7F5'};padding:0.3rem 0.5rem;
                border:1px solid rgba(55,53,47,0.08);${rowBorderTop}${rowBorderBottom}
                border-right:${isCovRow ? '2.5px solid #3B82F6' : '1px solid rgba(55,53,47,0.08)'};
                ">A${rIdx + 1}</td>`;

            r.forEach((val, cIdx) => {
                const isCovCol = cl[cIdx];
                const isZero   = Math.abs(val) < 1e-9;

                // Warna latar berdasarkan tipe coverage:
                // perpotongan dua garis → hatch diagonal; satu garis → warna tunggal
                let bg = 'transparent';
                if (isCovRow && isCovCol) {
                    bg = 'repeating-linear-gradient(45deg,rgba(139,92,246,0.06),rgba(139,92,246,0.06) 6px,rgba(59,130,246,0.06) 6px,rgba(59,130,246,0.06) 12px)';
                } else if (isCovRow) {
                    bg = 'rgba(59,130,246,0.05)';
                } else if (isCovCol) {
                    bg = 'rgba(139,92,246,0.05)';
                }

                // Border sel: biru untuk garis baris, ungu untuk garis kolom
                const bTop    = isCovRow ? '2.5px solid #3B82F6' : '1px solid rgba(55,53,47,0.06)';
                const bBottom = isCovRow ? '2.5px solid #3B82F6' : '1px solid rgba(55,53,47,0.06)';
                const bLeft   = isCovCol ? '2.5px solid #8B5CF6' : '1px solid rgba(55,53,47,0.06)';
                const bRight  = isCovCol ? '2.5px solid #8B5CF6' : '1px solid rgba(55,53,47,0.06)';

                // Nilai nol ditampilkan sebagai lingkaran merah agar mudah diidentifikasi
                const valDisplay = isZero
                    ? `<span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:#EF4444;color:#fff;font-weight:700;font-size:0.75rem;">0</span>`
                    : `<span style="color:${(isCovRow || isCovCol) ? 'rgba(55,53,47,0.7)' : '#334155'}">${Number.isInteger(val) ? val : val.toFixed(1)}</span>`;

                html += `<td style="padding:0.3rem 0.5rem;text-align:center;
                    background:${bg};
                    border-top:${bTop};border-bottom:${bBottom};
                    border-left:${bLeft};border-right:${bRight};
                    min-width:42px;">${valDisplay}</td>`;
            });
            html += '</tr>';
        });
        html += '</tbody></table></div>';
        return html;
    }

    /**
     * renderStepCard(step, idx)
     * Membungkus satu langkah algoritma (judul + deskripsi + matriks) dalam kartu HTML.
     * @param {Object} step - Data satu langkah dari API
     * @param {number} idx  - Indeks urutan langkah (0-based)
     * @returns {string} HTML string kartu langkah
     */
    function renderStepCard(step, idx) {
        // Judul dan deskripsi teks dari API
        let html = `
        <div class="step-card">
            <h4 class="step-title">Tahap ${idx + 1}: ${step.title}</h4>
            <p class="step-desc">${step.description}</p>
        `;
        // Render matriks jika tersedia di langkah ini
        if (step.matrix) {
            html += renderStepMatrix(step);
        }
        html += `</div>`;
        return html;
    }

    /**
     * renderAllSteps(steps)
     * Menggabungkan semua kartu langkah menjadi satu blok HTML
     * dan menyisipkannya ke elemen #steps-viewer di DOM.
     * @param {Array} steps - Array langkah dari response API
     */
    function renderAllSteps(steps) {
        const stepsViewer = document.getElementById('steps-viewer');
        // Gabungkan seluruh kartu langkah dengan map + join
        stepsViewer.innerHTML = steps.map((step, idx) => renderStepCard(step, idx)).join('');
    }

    /**
     * renderAssignments(assignments, rows, cols, totalCost)
     * Menampilkan tabel hasil penugasan akhir (Agen → UMKM + biaya).
     * Hanya menampilkan penugasan yang berada dalam dimensi matriks asli
     * (mengabaikan baris/kolom dummy dari padding).
     * @param {Array}  assignments - Array { row, col, cost } dari API
     * @param {number} rows        - Jumlah baris aktual
     * @param {number} cols        - Jumlah kolom aktual
     * @param {number} totalCost   - Total biaya optimal
     */
    function renderAssignments(assignments, rows, cols, totalCost) {
        const list = document.getElementById('assignments-list');
        let html = '<ul style="list-style: none; padding: 0;">';
        assignments.forEach(a => {
            // Abaikan penugasan ke baris/kolom dummy (di luar dimensi asli)
            if (a.row < rows && a.col < cols) {
                html += `
                <li style="margin-bottom: 0.5rem; padding: 0.8rem; background: transparent; border: 1px solid rgba(55,53,47,0.16); border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 500; color: #37352F;">Agen ${a.row + 1} &rarr; UMKM ${a.col + 1}</span>
                    <span style="color: #37352F; font-weight: 700;">Rp ${(a.cost * 10000).toLocaleString('id-ID')}</span>
                </li>`;
            }
        });
        html += '</ul>';
        list.innerHTML = html;

        // Tampilkan total biaya optimal di elemen hasil
        document.getElementById('res-total').innerText = "Rp " + (totalCost * 10000).toLocaleString('id-ID');
        document.getElementById('results-container').style.display = 'block';
    }

    // ============================================================================
    // MODUL HUNGARIAN — FUNGSI UTAMA SOLVER (ORCHESTRATOR)
    // ============================================================================

    /**
     * solveHungarian()
     * Fungsi utama yang mengorkestrasi seluruh alur penyelesaian Hungarian:
     * 1. Membaca & memvalidasi input matriks (collectMatrix + validateMatrix)
     * 2. Mengirim request POST ke API backend
     * 3. Merender hasil langkah-langkah (renderAllSteps)
     * 4. Merender tabel penugasan akhir (renderAssignments)
     * Semua sub-logika didelegasikan ke fungsi terpisah untuk modularitas.
     */
    async function solveHungarian() {
        const rows = parseInt(document.getElementById('matrix-rows').value);
        const cols = parseInt(document.getElementById('matrix-cols').value);
        
        // Validasi dimensi dasar sebelum lanjut
        if (rows < 8 || rows > 20 || cols < 8 || cols > 20) {
            alert(`Gagal: Ukuran matriks harus minimal 8x8 dan maksimal 20x20. Saat ini input: ${rows}x${cols}.`);
            return;
        }

        // Validasi jenis optimasi wajib dipilih (Minimasi/Maksimasi)
        const modeSelect = document.getElementById('opt-mode');
        const mode       = modeSelect.value;
        if (!mode) {
            modeSelect.classList.add('is-invalid');
            modeSelect.focus();
            alert('Gagal: Jenis Optimasi (Minimasi/Maksimasi) belum dipilih. Harap pilih salah satu untuk melanjutkan.');
            return;
        }

        // ── Langkah 1: Kumpulkan data sel matriks ──
        const { matrix: rawMatrix, error: collectError } = collectMatrix(rows, cols);
        if (collectError) {
            alert(collectError);
            return;
        }

        // ── Langkah 2: Validasi tipe data setiap sel (numerik, tidak kosong) ──
        const { valid, error: validateError, numMatrix } = validateMatrix(rawMatrix);
        if (!valid) {
            alert(validateError);
            return;
        }

        // ── Langkah 3: Tampilkan loading state ──
        const btn     = document.getElementById('btn-solve');
        const spinner = document.getElementById('btn-solve-spinner');
        const btnText = document.getElementById('btn-solve-text');
        btn.disabled = true;
        spinner.style.display = 'inline-block';
        btnText.innerText = "Memproses...";
        showLoadingOverlay('Sedang menghitung optimasi penugasan…');

        try {
            // ── Langkah 4: Kirim request ke API backend ──
            const res = await fetch(`${API_URL}/api/solve/hungarian`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cost_matrix: numMatrix,
                    is_maximization: mode === 'max'
                })
            });
            const data = await res.json();
            
            // Selesai kalkulasi: hapus semua dirty-state dari sel matriks
            document.querySelectorAll('.matrix-cell.dirty').forEach(el => el.classList.remove('dirty'));
            const banner = document.getElementById('matrix-dirty-banner');
            if (banner) banner.classList.remove('visible');

            if (data.success) {
                // ── Langkah 5: Render langkah-langkah ke DOM ──
                renderAllSteps(data.steps);

                // ── Langkah 6: Render tabel penugasan akhir ──
                renderAssignments(data.assignments, rows, cols, data.total_cost);
            } else {
                // Backend mengembalikan error (mis. ukuran matriks tidak valid)
                alert('Error dari server: ' + (data.detail || 'Terjadi kesalahan.'));
            }
        } catch (e) {
            // Gagal terhubung ke server (jaringan, atau backend tidak berjalan)
            alert('Gagal terhubung ke API. Pastikan python -m uvicorn backend.main:app berjalan.');
        } finally {
            // Selalu kembalikan tombol ke keadaan semula setelah request selesai
            btn.disabled = false;
            spinner.style.display = 'none';
            btnText.innerText = "Jalankan Optimasi";
            hideLoadingOverlay();
        }
    }


    // ============================================================================
    // MODUL CPM: Render halaman Teori Jaringan
    // ============================================================================
    function renderCpm() {
        setActiveNav(navCpm);
        document.getElementById('topbar-breadcrumb').innerText = 'Teori Jaringan';
        // Render template HTML lengkap untuk modul CPM
        container.innerHTML = `
            <div class="op-module-wrap">
                <div class="page-icon">📈</div>
                <h1 class="op-module-title">Teori Jaringan</h1>
                <p class="op-module-sub" style="margin-bottom: 2rem;">Hitung waktu mulai tercepat/terlambat dan identifikasi jalur kritis menggunakan CPM.</p>
                
                <div class="notion-props">
                    <div class="notion-prop-row">
                        <div class="notion-prop-label"><span>👤</span> Created by</div>
                        <div class="notion-prop-val"><span class="notion-badge">kelompok 4 risop</span></div>
                    </div>
                    <div class="notion-prop-row">
                        <div class="notion-prop-label"><span>⚙️</span> Method</div>
                        <div class="notion-prop-val">Critical Path Method (CPM)</div>
                    </div>
                </div>
            </div>
            
            <div style="max-width: 1100px;">
                <div class="notion-section">
                    <div class="op-ch">
                        <div>
                            <h2 class="op-ch-title">Input Data Kegiatan</h2>
                            <p class="op-ch-subtitle">Minimal 8, maksimal 20 kegiatan. Isi ID, Deskripsi, Durasi, dan Predecessor secara manual.</p>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 1rem; margin-bottom: 1.2rem;">
                        <button class="btn btn-ghost" id="btn-cpm-add">+ Tambah Baris</button>
                        <button class="btn btn-danger-ghost" id="btn-cpm-reset">Reset Tabel</button>
                        <button class="btn btn-ghost" style="color: #2383E2; border-color: rgba(35, 131, 226, 0.4); background: rgba(35, 131, 226, 0.05);" id="btn-cpm-template">🎬 Muat Template Kasus 9</button>
                    </div>
                    
                    <div class="table-responsive" style="margin-bottom: 1.5rem;">
                        <table class="matrix-table" id="cpm-table" style="text-align: left; margin-bottom: 0;">
                            <thead>
                                <tr>
                                    <th style="width: 80px;">ID</th>
                                    <th>Deskripsi Tugas</th>
                                    <th style="width: 120px;" class="text-right">Durasi</th>
                                    <th>Predecessor</th>
                                    <th style="width: 60px;" class="text-center">Hapus</th>
                                </tr>
                            </thead>
                            <tbody id="cpm-tbody">
                                <!-- Baris kegiatan diisi dinamis oleh JavaScript -->
                            </tbody>
                        </table>
                    </div>
                    
                    <button class="btn btn-primary" id="btn-solve-cpm">
                        <span class="spinner" id="btn-cpm-spinner" style="display:none;"></span> 
                        <span id="btn-cpm-text">Hitung Jalur Kritis</span>
                    </button>
                </div>
                
                <!-- Kontainer hasil CPM: tersembunyi hingga kalkulasi berhasil -->
                <div id="cpm-results-container" style="display:none;">
                    <div class="notion-divider"></div>
                    <div class="grid-2">
                        <div class="result-box">
                            <div class="result-label">TOTAL WAKTU PENYELESAIAN</div>
                            <div class="result-value" id="cpm-total-duration">-- <span style="font-size: 1rem; color: rgba(55,53,47,0.65);">Hari</span></div>
                        </div>
                        <div class="result-box" style="border-left-color: #EB5757; background: rgba(235, 87, 87, 0.05);">
                            <div class="result-label" style="color: #EB5757;">JALUR KRITIS (CRITICAL PATH)</div>
                            <div class="result-value" id="cpm-critical-path" style="font-size: 1.5rem; color: #37352F;">--</div>
                        </div>
                    </div>
                    
                    <div class="notion-section" style="margin-top: 2rem;">
                        <h3 class="op-ch-title" style="margin-bottom: 1rem;">Perhitungan Detail Step-by-Step</h3>
                        <div id="cpm-table-container"></div>
                    </div>
                    
                    <div class="notion-section" style="margin-top: 2rem;">
                        <h3 class="op-ch-title" style="margin-bottom: 1rem;">Visualisasi Jaringan</h3>
                        <div id="cpm-graphviz" style="overflow: auto; text-align: center; border: 1px solid rgba(55,53,47,0.09); border-radius: 4px; padding: 1rem; background: #FFFFFF;"></div>
                    </div>
                </div>
            </div>
        `;

        // ── Event: Tombol aksi tabel CPM ──
        document.getElementById('btn-cpm-add').addEventListener('click', () => addCpmRow());
        document.getElementById('btn-cpm-reset').addEventListener('click', initCpmRows);
        document.getElementById('btn-cpm-template').addEventListener('click', loadKasus9);
        document.getElementById('btn-solve-cpm').addEventListener('click', solveCpm);
        
        // ── Event: Validasi real-time ID ganda pada tabel CPM ──
        document.getElementById('cpm-tbody').addEventListener('input', (e) => {
            // Sembunyikan hasil lama jika tabel diubah
            document.getElementById('cpm-results-container').style.display = 'none';

            if (e.target.classList.contains('cpm-id')) {
                const currentVal = e.target.value.trim().toUpperCase();
                
                // Reset style dan konversi ke huruf kapital otomatis
                e.target.style.borderColor = '';
                e.target.style.backgroundColor = '';
                e.target.value = currentVal;
                
                if (!currentVal) return;
                
                // Cek duplikasi ID: bandingkan dengan semua input ID lain di tabel
                const allIds = Array.from(document.querySelectorAll('.cpm-id'));
                const isDuplicate = allIds.some(input => input !== e.target && input.value.trim().toUpperCase() === currentVal);
                
                if (isDuplicate) {
                    // Sorot merah dan tampilkan peringatan duplikat
                    e.target.style.borderColor = '#EF4444';
                    e.target.style.backgroundColor = '#FEF2F2';
                    alert(`Peringatan: ID Kegiatan "${currentVal}" sudah digunakan pada baris lain. Harap ubah menjadi ID yang unik!`);
                }
            }
        });
        
        // Muat 8+ baris default kosong agar pengguna wajib mengisi manual
        initCpmRows();
    }

    // ============================================================================
    // MODUL CPM — SUB-FUNGSI MANAJEMEN TABEL KEGIATAN
    // ============================================================================

    /**
     * addCpmRow(id, name, duration, preds)
     * Menambahkan satu baris kegiatan baru ke tabel CPM.
     * Batas maksimal 20 baris (sesuai constraint soal).
     */
    function addCpmRow(id = '', name = '', duration = '', preds = '') {
        const tbody = document.getElementById('cpm-tbody');
        if (tbody.children.length >= 20) {
            alert("Batas maksimal kegiatan tercapai. Tidak dapat menambahkan lebih dari 20 kegiatan.");
            return;
        }
        const tr = document.createElement('tr');
        tr.className = 'cpm-row';
        tr.innerHTML = `
            <td><input type="text" class="cpm-id form-control" value="${id}" placeholder="A"></td>
            <td><input type="text" class="cpm-name form-control" value="${name}" placeholder="Cth: Mengumpulkan Data"></td>
            <td><input type="number" class="cpm-duration form-control text-right" value="${duration}" min="0"></td>
            <td><input type="text" class="cpm-preds form-control" value="${preds}" placeholder="A, B (Kosongkan jika awal)"></td>
            <td class="text-center"><button class="btn btn-danger-ghost" style="padding: 0.4rem 0.8rem;" onclick="this.closest('tr').remove(); document.getElementById('cpm-results-container').style.display = 'none';">X</button></td>
        `;
        tbody.appendChild(tr);
        document.getElementById('cpm-results-container').style.display = 'none';
    }

    /**
     * initCpmRows()
     * Reset tabel CPM dan isi ulang dengan 9 baris default kosong (ID A–I).
     * Memenuhi batas minimum 8 kegiatan sesuai constraint soal.
     */
    function initCpmRows() {
        document.getElementById('cpm-results-container').style.display = 'none';
        const tbody = document.getElementById('cpm-tbody');
        tbody.innerHTML = '';
        // 9 baris default dengan ID A hingga I
        const defaultIds = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
        defaultIds.forEach(id => addCpmRow(id, '', '', ''));
    }

    /**
     * loadKasus9()
     * Memuat data template "Kasus 9" — proyek konten digital (A–J).
     * Ukuran template disesuaikan dengan jumlah baris saat ini di tabel.
     */
    function loadKasus9() {
        document.getElementById('cpm-results-container').style.display = 'none';
        // Pertahankan ukuran minimal 8 baris
        const currentRowCount = document.querySelectorAll('.cpm-row').length;
        let size = currentRowCount < 8 ? 8 : currentRowCount;

        const tbody = document.getElementById('cpm-tbody');
        tbody.innerHTML = '';
        
        // Data kegiatan template: proyek produksi konten digital A–J (wajib) + K–T (opsional)
        addCpmRow('A', 'Riset Ide & Penulisan Naskah', '5', '-');
        addCpmRow('B', 'Pembuatan Storyboard', '3', 'A');
        addCpmRow('C', 'Perizinan Lokasi & Casting', '4', 'A');
        addCpmRow('D', 'Produksi Shooting Lapangan', '7', 'B, C');
        addCpmRow('E', 'Editing Kasar (Offline)', '5', 'D');
        addCpmRow('F', 'Sound Design & Scoring', '3', 'E');
        addCpmRow('G', 'Color Grading & VFX', '3', 'E');
        if (size >= 8)  addCpmRow('H', 'Review Internal & Revisi', '2', 'F, G');
        if (size >= 9)  addCpmRow('I', 'Ekspor & Publikasi Konten', '1', 'H');
        if (size >= 10) addCpmRow('J', 'Distribusi Kampanye & Evaluasi', '2', 'I');
        if (size >= 11) addCpmRow('K', 'Analisis Metrik Kinerja', '3', 'J');
        if (size >= 12) addCpmRow('L', 'Penyusunan Laporan Akhir', '2', 'K');
        if (size >= 13) addCpmRow('M', 'Presentasi ke Klien', '1', 'L');
        if (size >= 14) addCpmRow('N', 'Pengarsipan File Master', '1', 'M');
        if (size >= 15) addCpmRow('O', 'Pembubaran Tim Proyek', '1', 'N');
        if (size >= 16) addCpmRow('P', 'Pencairan Dana Tahap Akhir', '2', 'O');
        if (size >= 17) addCpmRow('Q', 'Audit Keuangan Proyek', '3', 'P');
        if (size >= 18) addCpmRow('R', 'Penutupan Kontrak Vendor', '2', 'Q');
        if (size >= 19) addCpmRow('S', 'Penulisan Lesson Learned', '2', 'R');
        if (size >= 20) addCpmRow('T', 'Perayaan Selesainya Proyek', '1', 'S');
    }

    // ============================================================================
    // MODUL CPM — FUNGSI UTAMA SOLVER CPM
    // ============================================================================

    /**
     * solveCpm()
     * Fungsi utama yang mengorkestrasi alur CPM:
     * 1. Membaca dan memvalidasi tabel kegiatan
     * 2. Mengirim request POST ke API backend
     * 3. Merender hasil Forward Pass, Backward Pass, Slack, dan Summary
     * 4. Merender visualisasi jaringan Vis.js
     */
    async function solveCpm() {
        const btn     = document.getElementById('btn-solve-cpm');
        const spinner = document.getElementById('btn-cpm-spinner');
        const btnText = document.getElementById('btn-cpm-text');
        
        // ── Kumpulkan data dari setiap baris tabel CPM ──
        const rows = document.querySelectorAll('.cpm-row');
        let activities    = {};
        let duplicateId   = false;
        let incompleteData = false;
        
        rows.forEach(row => {
            const idInput = row.querySelector('.cpm-id');
            const id      = idInput.value.trim().toUpperCase();
            const name    = row.querySelector('.cpm-name').value.trim();
            const durInput = row.querySelector('.cpm-duration');
            const durStr  = durInput.value.trim();
            const dur     = parseFloat(durStr) || 0;
            const preds   = row.querySelector('.cpm-preds').value.trim();
            
            // Cek durasi non-numerik atau kolom wajib kosong
            if (durInput.validity.badInput || (durStr !== '' && isNaN(Number(durStr)))) {
                incompleteData = true;
            }
            if (!id || !name || durStr === '') {
                incompleteData = true;
            } else {
                if (activities[id]) duplicateId = true;
                activities[id] = { name, duration: dur, predecessors: preds };
            }
        });

        const actCount = Object.keys(activities).length;

        // ── Validasi kelengkapan data tabel ──
        if (incompleteData) {
            alert('Gagal: Terdapat data yang belum lengkap atau input durasi bukan angka. Pastikan seluruh baris telah terisi ID Kegiatan, Deskripsi Tugas, dan Durasinya (harus berupa angka).');
            return;
        }

        // ── Validasi logis: durasi, predecessor, self-referencing, duplikat ──
        let invalidPred          = null;
        let selfReferencingPred  = null;
        let negativeDurationAct  = null;

        Object.keys(activities).forEach(id => {
            const act = activities[id];
            
            // Durasi tidak boleh negatif (secara fisik tidak mungkin)
            if (act.duration < 0) negativeDurationAct = id;

            // Parsing predecessor: pisahkan dengan koma, titik koma, atau spasi
            const predsRaw = act.predecessors;
            const preds = predsRaw.split(/[,;\s]+/).map(p => p.trim().toUpperCase()).filter(p => p && p !== '-' && p !== 'NONE' && p !== 'N/A');
            
            preds.forEach(p => {
                if (!activities[p]) {
                    invalidPred = p; // Predecessor tidak terdaftar di tabel
                } else if (p === id) {
                    selfReferencingPred = p; // Kegiatan tidak bisa menjadi predecessor dirinya sendiri
                }
            });
        });
        
        if (negativeDurationAct) {
            alert(`Gagal: Durasi untuk kegiatan "${negativeDurationAct}" bernilai negatif. Secara logika, waktu kegiatan tidak boleh kurang dari nol.`);
            return;
        }
        if (invalidPred) {
            alert(`Gagal: ID Predecessor "${invalidPred}" belum didaftarkan pada tabel kegiatan. Harap masukkan ID yang valid.`);
            return;
        }
        if (selfReferencingPred) {
            alert(`Gagal: Kegiatan "${selfReferencingPred}" tidak bisa memiliki predecessor dirinya sendiri (Self-Referencing). Hal ini menyalahi logika urutan.`);
            return;
        }
        if (duplicateId) {
            alert('Gagal: Terdapat duplikasi ID Kegiatan. Harap gunakan ID yang unik untuk setiap baris tugas.');
            return;
        }
        if (actCount < 8 || actCount > 20) {
            alert(`Jumlah kegiatan saat ini: ${actCount}. Sesuai kapasitas, harap masukkan minimal 8 kegiatan dan maksimal 20 kegiatan.`);
            return;
        }

        // ── Loading state ──
        btn.disabled = true;
        spinner.style.display = 'inline-block';
        btnText.innerText = "Kalkulasi Berjalan...";
        showLoadingOverlay('Sedang menghitung jalur kritis…');

        try {
            // ── Kirim data ke API backend ──
            const res  = await fetch(`${API_URL}/api/solve/cpm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ activities })
            });
            const data = await res.json();
            
            if (data.success) {
                document.getElementById('cpm-results-container').style.display = 'block';
                document.getElementById('cpm-total-duration').innerHTML = `${data.total_duration} <span style="font-size: 1rem; color: #64748B;">Hari</span>`;
                
                const acts         = data.activities;
                const criticalPaths = data.critical_paths || [];

                // ── Peringatan anomali slack negatif ──
                // Slack negatif tidak mungkin terjadi dalam CPM valid, menandakan input bermasalah
                const hasNegativeSlack = Object.values(acts).some(a => a.slack_warning);
                if (hasNegativeSlack) {
                    const warnEl = document.createElement('div');
                    warnEl.style.cssText = 'background:#FEF3C7; border:1px solid #F59E0B; border-radius:4px; padding:0.8rem 1rem; margin-bottom:1rem; font-size:0.85rem; color:#92400E;';
                    warnEl.innerHTML = '⚠️ <strong>Perhatian:</strong> Terdeteksi nilai Slack negatif pada satu atau lebih kegiatan. Hal ini secara teoritis tidak mungkin terjadi dalam CPM yang valid. Periksa kembali apakah ada durasi yang tidak masuk akal atau predecessor yang salah.';
                    document.getElementById('cpm-results-container').prepend(warnEl);
                }

                // ── Render jalur kritis: satu atau lebih jalur ──
                const cpContainer = document.getElementById('cpm-critical-path');
                if (criticalPaths.length === 0) {
                    cpContainer.innerText = '—';
                } else if (criticalPaths.length === 1) {
                    cpContainer.innerText = criticalPaths[0].join(' → ');
                } else {
                    // Tampilkan setiap jalur kritis pada baris terpisah dengan badge nomor
                    cpContainer.innerHTML = criticalPaths.map((path, i) =>
                        `<div style="margin-bottom:0.4rem;">
                            <span style="font-size:0.7rem; background:#EF4444; color:#fff; padding:0.1rem 0.4rem; border-radius:10px; margin-right:6px;">Jalur ${i + 1}</span>
                            <span style="font-size:1.1rem; font-weight:700;">${path.join(' → ')}</span>
                        </div>`
                    ).join('');
                }

                // Urutan topologis berdasarkan ES (Earliest Start)
                const topoOrder = Object.keys(acts).sort((a, b) => acts[a].es - acts[b].es || a.localeCompare(b));

                // Helper: format daftar predecessor menjadi HTML bold
                const getPredLabel = (id) => {
                    const preds = acts[id].predecessors;
                    if (!preds || preds.length === 0) return '<em style="color: rgba(55,53,47,0.4);">Tidak ada (awal jaringan)</em>';
                    return preds.map(p => `<strong>${p}</strong>`).join(', ');
                };

                // ── LANGKAH 1: Struktur Jaringan & Urutan Topologis ──
                let detailHtml = `
                <div class="step-card" style="border-left: 3px solid #6366F1; background: rgba(99,102,241,0.04); border-radius: 4px; padding: 1.2rem 1.5rem; margin-bottom: 1.2rem;">
                    <div style="display:flex; align-items:center; gap:0.6rem; margin-bottom:0.8rem;">
                        <span style="background:#6366F1; color:#fff; font-weight:700; font-size:0.75rem; padding:0.2rem 0.6rem; border-radius:20px; letter-spacing:0.05em;">LANGKAH 1</span>
                        <h4 style="margin:0; font-size:0.95rem; font-weight:700; color:#37352F;">Identifikasi Urutan Kegiatan & Struktur Jaringan</h4>
                    </div>
                    <p style="font-size:0.85rem; color:rgba(55,53,47,0.65); margin-bottom:1rem; line-height:1.6;">
                        Langkah pertama adalah menentukan urutan topologis kegiatan — setiap kegiatan hanya dapat dimulai setelah semua <em>predecessor</em>-nya selesai. 
                        Urutan ini menjadi dasar Forward Pass dan Backward Pass.
                    </p>
                    <div class="table-responsive">
                        <table class="matrix-table" style="width:100%; font-size:0.85rem;">
                            <thead>
                                <tr>
                                    <th style="width:60px;">ID</th>
                                    <th class="text-left">Nama Kegiatan</th>
                                    <th class="text-right" style="width:90px;">Durasi (Hari)</th>
                                    <th class="text-left">Predecessor</th>
                                </tr>
                            </thead>
                            <tbody>
                `;
                topoOrder.forEach(id => {
                    const a = acts[id];
                    detailHtml += `
                        <tr>
                            <td style="font-weight:700; color:#6366F1;">${id}</td>
                            <td class="text-left" style="color:#37352F;">${a.name}</td>
                            <td class="text-right" style="color:#37352F; font-weight:600;">${a.duration}</td>
                            <td class="text-left" style="color:#37352F;">${getPredLabel(id)}</td>
                        </tr>
                    `;
                });
                detailHtml += `</tbody></table></div></div>`;

                // ── LANGKAH 2: Forward Pass (ES & EF) ──
                // ES = max(EF predecessor); EF = ES + Durasi
                detailHtml += `
                <div class="step-card" style="border-left: 3px solid #10B981; background: rgba(16,185,129,0.04); border-radius: 4px; padding: 1.2rem 1.5rem; margin-bottom: 1.2rem;">
                    <div style="display:flex; align-items:center; gap:0.6rem; margin-bottom:0.8rem;">
                        <span style="background:#10B981; color:#fff; font-weight:700; font-size:0.75rem; padding:0.2rem 0.6rem; border-radius:20px; letter-spacing:0.05em;">LANGKAH 2</span>
                        <h4 style="margin:0; font-size:0.95rem; font-weight:700; color:#37352F;">Forward Pass — Perhitungan ES & EF</h4>
                    </div>
                    <p style="font-size:0.85rem; color:rgba(55,53,47,0.65); margin-bottom:1rem; line-height:1.6;">
                        <strong>ES (Earliest Start)</strong> = nilai EF terbesar dari semua predecessor.<br>
                        <strong>EF (Earliest Finish)</strong> = ES + Durasi kegiatan.<br>
                        Kegiatan tanpa predecessor memiliki ES = 0.
                    </p>
                `;
                topoOrder.forEach(id => {
                    const a     = acts[id];
                    const preds = a.predecessors || [];
                    let esFormula = '', esFormulaDetail = '';
                    if (preds.length === 0) {
                        esFormula      = `ES<sub>${id}</sub> = 0`;
                        esFormulaDetail = `<span style="color:rgba(55,53,47,0.4);font-size:0.78rem;">(awal jaringan — tidak ada predecessor)</span>`;
                    } else if (preds.length === 1) {
                        const p         = preds[0];
                        const ef_p      = acts[p] ? acts[p].ef : '?';
                        esFormula       = `ES<sub>${id}</sub> = EF<sub>${p}</sub>`;
                        esFormulaDetail = `= <strong>${ef_p}</strong>`;
                    } else {
                        const parts     = preds.map(p => `EF<sub>${p}</sub>=${acts[p] ? acts[p].ef : '?'}`).join(', ');
                        esFormula       = `ES<sub>${id}</sub> = max(${parts})`;
                        esFormulaDetail = `= <strong>${a.es}</strong>`;
                    }
                    const isCrit = a.is_critical;
                    detailHtml += `
                        <div style="display:flex; align-items:flex-start; gap:1rem; padding:0.8rem; margin-bottom:0.5rem; border-radius:4px; background:${isCrit ? 'rgba(235,87,87,0.06)' : 'rgba(55,53,47,0.03)'}; border:1px solid ${isCrit ? 'rgba(235,87,87,0.2)' : 'rgba(55,53,47,0.09)'};">
                            <div style="min-width:32px; height:32px; border-radius:50%; background:${isCrit ? '#EF4444' : '#10B981'}; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:700; font-size:0.85rem; flex-shrink:0;">${id}</div>
                            <div style="flex:1; min-width:0;">
                                <div style="font-weight:600; font-size:0.85rem; color:#37352F; margin-bottom:0.4rem;">${a.name} ${isCrit ? '<span style="font-size:0.7rem; background:#EF4444; color:#fff; padding:0.1rem 0.4rem; border-radius:10px; margin-left:4px;">KRITIS</span>' : ''}</div>
                                <!-- Rumus ES dalam kotak formula hijau -->
                                <div style="display:flex; flex-wrap:wrap; gap:0.3rem; align-items:center; font-family:monospace; font-size:0.8rem; background:rgba(16,185,129,0.06); border:1px solid rgba(16,185,129,0.15); border-radius:4px; padding:0.35rem 0.6rem; margin-bottom:0.3rem; color:#065F46;">
                                    📐 ${esFormula} ${esFormulaDetail}
                                </div>
                                <!-- Rumus EF: ES + Durasi -->
                                <div style="display:flex; flex-wrap:wrap; gap:0.3rem; align-items:center; font-family:monospace; font-size:0.8rem; background:rgba(16,185,129,0.04); border:1px solid rgba(16,185,129,0.1); border-radius:4px; padding:0.35rem 0.6rem; color:#065F46;">
                                    ➡ EF<sub>${id}</sub> = ES + Durasi = <strong>${a.es}</strong> + <strong>${a.duration}</strong> = <strong style="color:#047857;">${a.ef}</strong>
                                </div>
                            </div>
                            <div style="display:flex; gap:0.8rem; flex-shrink:0;">
                                <div style="text-align:center; padding:0.4rem 0.8rem; background:#fff; border:1px solid rgba(16,185,129,0.3); border-radius:4px;">
                                    <div style="font-size:0.7rem; color:#10B981; font-weight:600;">ES</div>
                                    <div style="font-size:1.1rem; font-weight:700; color:#37352F;">${a.es}</div>
                                </div>
                                <div style="text-align:center; padding:0.4rem 0.8rem; background:#fff; border:1px solid rgba(16,185,129,0.3); border-radius:4px;">
                                    <div style="font-size:0.7rem; color:#10B981; font-weight:600;">EF</div>
                                    <div style="font-size:1.1rem; font-weight:700; color:#37352F;">${a.ef}</div>
                                </div>
                            </div>
                        </div>
                    `;
                });
                detailHtml += `
                    <div style="margin-top:0.8rem; padding:0.8rem 1rem; background:rgba(16,185,129,0.1); border-radius:4px; font-size:0.85rem; color:#065F46;">
                        ✅ <strong>Total Durasi Proyek</strong> = EF terbesar dari semua kegiatan = <strong>${data.total_duration} Hari</strong>
                    </div>
                </div>`;

                // ── LANGKAH 3: Backward Pass (LF & LS) ──
                // LF = min(LS successor); LS = LF - Durasi
                const revOrder = [...topoOrder].reverse();
                detailHtml += `
                <div class="step-card" style="border-left: 3px solid #F59E0B; background: rgba(245,158,11,0.04); border-radius: 4px; padding: 1.2rem 1.5rem; margin-bottom: 1.2rem;">
                    <div style="display:flex; align-items:center; gap:0.6rem; margin-bottom:0.8rem;">
                        <span style="background:#F59E0B; color:#fff; font-weight:700; font-size:0.75rem; padding:0.2rem 0.6rem; border-radius:20px; letter-spacing:0.05em;">LANGKAH 3</span>
                        <h4 style="margin:0; font-size:0.95rem; font-weight:700; color:#37352F;">Backward Pass — Perhitungan LF & LS</h4>
                    </div>
                    <p style="font-size:0.85rem; color:rgba(55,53,47,0.65); margin-bottom:1rem; line-height:1.6;">
                        <strong>LF (Latest Finish)</strong> = nilai LS terkecil dari semua successor. Kegiatan akhir memiliki LF = Total Durasi Proyek.<br>
                        <strong>LS (Latest Start)</strong> = LF − Durasi kegiatan.<br>
                        Backward Pass dilakukan dari kegiatan akhir ke awal.
                    </p>
                `;

                // Bangun peta successor untuk menampilkan formula LF secara akurat
                const successorMap = {};
                topoOrder.forEach(id => { successorMap[id] = []; });
                topoOrder.forEach(id => {
                    (acts[id].predecessors || []).forEach(p => {
                        if (successorMap[p]) successorMap[p].push(id);
                    });
                });

                revOrder.forEach(id => {
                    const a      = acts[id];
                    const succs  = successorMap[id] || [];
                    let lfFormula = '', lfFormulaDetail = '';
                    if (succs.length === 0) {
                        lfFormula       = `LF<sub>${id}</sub> = Total Durasi`;
                        lfFormulaDetail = `= <strong>${data.total_duration}</strong> <span style="color:rgba(55,53,47,0.4);font-size:0.78rem;">(kegiatan akhir)</span>`;
                    } else if (succs.length === 1) {
                        const s         = succs[0];
                        lfFormula       = `LF<sub>${id}</sub> = LS<sub>${s}</sub>`;
                        lfFormulaDetail = `= <strong>${acts[s].ls}</strong>`;
                    } else {
                        const parts     = succs.map(s => `LS<sub>${s}</sub>=${acts[s].ls}`).join(', ');
                        lfFormula       = `LF<sub>${id}</sub> = min(${parts})`;
                        lfFormulaDetail = `= <strong>${a.lf}</strong>`;
                    }
                    const isCrit = a.is_critical;
                    detailHtml += `
                        <div style="display:flex; align-items:flex-start; gap:1rem; padding:0.8rem; margin-bottom:0.5rem; border-radius:4px; background:${isCrit ? 'rgba(235,87,87,0.06)' : 'rgba(55,53,47,0.03)'}; border:1px solid ${isCrit ? 'rgba(235,87,87,0.2)' : 'rgba(55,53,47,0.09)'};">
                            <div style="min-width:32px; height:32px; border-radius:50%; background:${isCrit ? '#EF4444' : '#F59E0B'}; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:700; font-size:0.85rem; flex-shrink:0;">${id}</div>
                            <div style="flex:1; min-width:0;">
                                <div style="font-weight:600; font-size:0.85rem; color:#37352F; margin-bottom:0.4rem;">${a.name} ${isCrit ? '<span style="font-size:0.7rem; background:#EF4444; color:#fff; padding:0.1rem 0.4rem; border-radius:10px; margin-left:4px;">KRITIS</span>' : ''}</div>
                                <!-- Rumus LF dalam kotak formula kuning -->
                                <div style="display:flex; flex-wrap:wrap; gap:0.3rem; align-items:center; font-family:monospace; font-size:0.8rem; background:rgba(245,158,11,0.06); border:1px solid rgba(245,158,11,0.15); border-radius:4px; padding:0.35rem 0.6rem; margin-bottom:0.3rem; color:#92400E;">
                                    📐 ${lfFormula} ${lfFormulaDetail}
                                </div>
                                <!-- Rumus LS: LF - Durasi -->
                                <div style="display:flex; flex-wrap:wrap; gap:0.3rem; align-items:center; font-family:monospace; font-size:0.8rem; background:rgba(245,158,11,0.04); border:1px solid rgba(245,158,11,0.1); border-radius:4px; padding:0.35rem 0.6rem; color:#92400E;">
                                    ⬅ LS<sub>${id}</sub> = LF − Durasi = <strong>${a.lf}</strong> − <strong>${a.duration}</strong> = <strong style="color:#B45309;">${a.ls}</strong>
                                </div>
                            </div>
                            <div style="display:flex; gap:0.8rem; flex-shrink:0;">
                                <div style="text-align:center; padding:0.4rem 0.8rem; background:#fff; border:1px solid rgba(245,158,11,0.3); border-radius:4px;">
                                    <div style="font-size:0.7rem; color:#D97706; font-weight:600;">LS</div>
                                    <div style="font-size:1.1rem; font-weight:700; color:#37352F;">${a.ls}</div>
                                </div>
                                <div style="text-align:center; padding:0.4rem 0.8rem; background:#fff; border:1px solid rgba(245,158,11,0.3); border-radius:4px;">
                                    <div style="font-size:0.7rem; color:#D97706; font-weight:600;">LF</div>
                                    <div style="font-size:1.1rem; font-weight:700; color:#37352F;">${a.lf}</div>
                                </div>
                            </div>
                        </div>
                    `;
                });
                detailHtml += `</div>`;

                // ── LANGKAH 4: Kalkulasi Slack & Penentuan Jalur Kritis ──
                // Slack = LS - ES; Slack = 0 → Kegiatan kritis
                detailHtml += `
                <div class="step-card" style="border-left: 3px solid #8B5CF6; background: rgba(139,92,246,0.04); border-radius: 4px; padding: 1.2rem 1.5rem; margin-bottom: 1.2rem;">
                    <div style="display:flex; align-items:center; gap:0.6rem; margin-bottom:0.8rem;">
                        <span style="background:#8B5CF6; color:#fff; font-weight:700; font-size:0.75rem; padding:0.2rem 0.6rem; border-radius:20px; letter-spacing:0.05em;">LANGKAH 4</span>
                        <h4 style="margin:0; font-size:0.95rem; font-weight:700; color:#37352F;">Kalkulasi Slack (Float) & Penentuan Jalur Kritis</h4>
                    </div>
                    <p style="font-size:0.85rem; color:rgba(55,53,47,0.65); margin-bottom:1rem; line-height:1.6;">
                        <strong>Slack</strong> = LS − ES (atau LF − EF). Ini adalah kelonggaran waktu maksimal sebelum kegiatan menyebabkan keterlambatan proyek.<br>
                        Kegiatan dengan <strong>Slack = 0</strong> disebut <strong>kegiatan kritis</strong> dan membentuk jalur kritis.
                    </p>
                    <div style="display:flex; flex-wrap:wrap; gap:0.6rem;">
                `;
                topoOrder.forEach(id => {
                    const a      = acts[id];
                    const isCrit = a.is_critical;
                    detailHtml += `
                        <div style="padding:0.7rem 1rem; border-radius:6px; background:${isCrit ? 'rgba(235,87,87,0.08)' : 'rgba(55,53,47,0.04)'}; border:1px solid ${isCrit ? 'rgba(235,87,87,0.25)' : 'rgba(55,53,47,0.1)'}; min-width:160px; flex:1;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.3rem;">
                                <span style="font-weight:700; color:${isCrit ? '#EF4444' : '#37352F'}; font-size:0.9rem;">${id} — ${a.name.length > 18 ? a.name.substring(0, 18) + '…' : a.name}</span>
                                ${isCrit ? '<span style="font-size:0.65rem; background:#EF4444; color:#fff; padding:0.1rem 0.4rem; border-radius:10px;">KRITIS</span>' : ''}
                            </div>
                            <div style="font-size:0.78rem; color:rgba(55,53,47,0.6); font-family:monospace;">Slack = LS − ES = ${a.ls} − ${a.es} = <strong style="color:${isCrit ? '#EF4444' : '#8B5CF6'};">${a.slack}</strong></div>
                        </div>
                    `;
                });
                detailHtml += `</div></div>`;

                // ── LANGKAH 5: Tabel Rekap Hasil Lengkap ──
                detailHtml += `
                <div class="step-card" style="border-left: 3px solid #37352F; background: rgba(55,53,47,0.03); border-radius: 4px; padding: 1.2rem 1.5rem; margin-bottom: 1.2rem;">
                    <div style="display:flex; align-items:center; gap:0.6rem; margin-bottom:0.8rem;">
                        <span style="background:#37352F; color:#fff; font-weight:700; font-size:0.75rem; padding:0.2rem 0.6rem; border-radius:20px; letter-spacing:0.05em;">LANGKAH 5</span>
                        <h4 style="margin:0; font-size:0.95rem; font-weight:700; color:#37352F;">Tabel Rekap Hasil Lengkap</h4>
                    </div>
                    <p style="font-size:0.85rem; color:rgba(55,53,47,0.65); margin-bottom:1rem; line-height:1.6;">
                        Berikut adalah rekap seluruh nilai ES, EF, LS, LF, dan Slack untuk semua kegiatan. Baris dengan latar merah menandakan kegiatan kritis.
                    </p>
                    <div class="table-responsive">
                        <table class="matrix-table" style="text-align: center; width: 100%; font-size:0.85rem;">
                            <thead>
                                <tr>
                                    <th style="border-bottom: 2px solid rgba(55,53,47,0.16);">ID</th>
                                    <th class="text-left" style="border-bottom: 2px solid rgba(55,53,47,0.16);">Nama Kegiatan</th>
                                    <th class="text-right" style="border-bottom: 2px solid rgba(55,53,47,0.16);">Durasi</th>
                                    <th class="text-right" title="Earliest Start" style="border-bottom: 2px solid rgba(55,53,47,0.16); color:#10B981;">ES</th>
                                    <th class="text-right" title="Earliest Finish" style="border-bottom: 2px solid rgba(55,53,47,0.16); color:#10B981;">EF</th>
                                    <th class="text-right" title="Latest Start" style="border-bottom: 2px solid rgba(55,53,47,0.16); color:#D97706;">LS</th>
                                    <th class="text-right" title="Latest Finish" style="border-bottom: 2px solid rgba(55,53,47,0.16); color:#D97706;">LF</th>
                                    <th class="text-right" title="Kelonggaran Waktu" style="border-bottom: 2px solid rgba(55,53,47,0.16); color:#8B5CF6;">Slack</th>
                                    <th style="border-bottom: 2px solid rgba(55,53,47,0.16);">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                `;
                topoOrder.forEach(id => {
                    const a        = acts[id];
                    const isCrit   = a.is_critical;
                    const hasWarn  = a.slack_warning;
                    // Warna latar baris: kuning untuk anomali, merah untuk kritis, transparan untuk normal
                    const rowBg    = hasWarn
                        ? 'background: rgba(245,158,11,0.06);'
                        : (isCrit ? 'background: rgba(235, 87, 87, 0.06);' : 'background: transparent;');
                    const idColor  = isCrit ? 'color: #EF4444; font-weight: 700;' : 'color: #37352F; font-weight: 700;';
                    const slackStyle = hasWarn
                        ? 'color:#D97706; font-weight:700;'
                        : (isCrit ? 'color:#EF4444; font-weight:700;' : 'color:#8B5CF6; font-weight:600;');
                    const slackDisplay = hasWarn
                        ? `${a.slack} <span title="Slack negatif — anomali input" style="color:#D97706;">⚠</span>`
                        : `${a.slack}`;
                    const statusBadge = hasWarn
                        ? `<span style="font-size:0.7rem; background:#F59E0B; color:#fff; padding:0.2rem 0.5rem; border-radius:10px; white-space:nowrap;">⚠ Anomali</span>`
                        : (isCrit
                            ? `<span style="font-size:0.7rem; background:#EF4444; color:#fff; padding:0.2rem 0.5rem; border-radius:10px; white-space:nowrap;">⚡ Kritis</span>`
                            : `<span style="font-size:0.7rem; background:rgba(55,53,47,0.1); color:rgba(55,53,47,0.6); padding:0.2rem 0.5rem; border-radius:10px; white-space:nowrap;">Normal</span>`);
                    detailHtml += `
                        <tr style="${rowBg}">
                            <td style="${idColor}">${id}</td>
                            <td class="text-left" style="color:#37352F;">${a.name}</td>
                            <td class="text-right" style="color: rgba(55,53,47,0.65);">${a.duration}</td>
                            <td class="text-right" style="color:#10B981; font-weight:600;">${a.es}</td>
                            <td class="text-right" style="color:#10B981; font-weight:600;">${a.ef}</td>
                            <td class="text-right" style="color:#D97706; font-weight:600;">${a.ls}</td>
                            <td class="text-right" style="color:#D97706; font-weight:600;">${a.lf}</td>
                            <td class="text-right" style="${slackStyle}">${slackDisplay}</td>
                            <td style="text-align:center;">${statusBadge}</td>
                        </tr>
                    `;
                });
                detailHtml += `</tbody></table></div></div>`;

                // Sisipkan semua langkah ke DOM
                document.getElementById('cpm-table-container').innerHTML = detailHtml;

                // ── Render Visualisasi Jaringan Vis.js ──
                const graphvizDiv = document.getElementById('cpm-graphviz');
                graphvizDiv.innerHTML = '';
                graphvizDiv.style.height = '500px';
                graphvizDiv.style.border = '1px solid rgba(55,53,47,0.16)';
                graphvizDiv.style.borderRadius = '8px';
                graphvizDiv.style.backgroundColor = '#FAFAFA';

                if (window.vis) {
                    const actsVis = data.activities;
                    const nodes   = [];
                    const edges   = [];
                    
                    // Bangun node Vis.js: merah untuk kritis, biru untuk normal
                    Object.keys(actsVis).forEach(id => {
                        const a      = actsVis[id];
                        const isCrit = a.is_critical;
                        const desc   = a.name.length > 20 ? a.name.substring(0, 20) + '...' : a.name;
                        
                        nodes.push({
                            id: id,
                            label: isCrit
                                ? `<b>⚡ ${id}</b>\n<i>${desc}</i>\n\nES: <b>${a.es}</b> | EF: <b>${a.ef}</b>\nLS: <b>${a.ls}</b> | LF: <b>${a.lf}</b>\n<b style="color:#DC2626">Slack: ${a.slack}</b>`
                                : `<b>${id}</b>\n<i>${desc}</i>\n\nES: <b>${a.es}</b> | EF: <b>${a.ef}</b>\nLS: <b>${a.ls}</b> | LF: <b>${a.lf}</b>\nSlack: <b>${a.slack}</b>`,
                            shape: 'box',
                            font: {
                                multi: 'html',
                                face: 'Inter, sans-serif',
                                color: isCrit ? '#7F1D1D' : '#1E3A8A',
                                size: isCrit ? 15 : 13,
                                align: 'center',
                                bold: { color: isCrit ? '#7F1D1D' : '#1E3A8A', size: isCrit ? 16 : 14 }
                            },
                            color: {
                                // Kritis: merah solid; Normal: biru muda
                                background: isCrit ? '#FEE2E2' : '#EFF6FF',
                                border:     isCrit ? '#DC2626' : '#93C5FD',
                                highlight: { background: isCrit ? '#FECACA' : '#DBEAFE', border: isCrit ? '#B91C1C' : '#3B82F6' },
                                hover:     { background: isCrit ? '#FCA5A5' : '#BFDBFE', border: isCrit ? '#EF4444' : '#60A5FA' }
                            },
                            // Border lebih tebal untuk node kritis (visual emphasis)
                            borderWidth:         isCrit ? 4 : 1,
                            borderWidthSelected: isCrit ? 5 : 2,
                            // Glow merah untuk kritis, abu tipis untuk normal
                            shadow: isCrit
                                ? { enabled: true, color: 'rgba(220,38,38,0.45)', size: 14, x: 0, y: 0 }
                                : { enabled: true, color: 'rgba(55,53,47,0.1)', size: 6, x: 1, y: 2 },
                            margin: 14
                        });
                        
                        // Bangun edge (panah) dari predecessor ke node
                        a.predecessors.forEach(p => {
                            if (actsVis[p]) {
                                const critEdge = isCrit && actsVis[p].is_critical;
                                edges.push({
                                    from: p,
                                    to: id,
                                    arrows: { to: { enabled: true, scaleFactor: critEdge ? 1.4 : 0.9 } },
                                    // Jalur kritis: merah tebal; jalur biasa: abu tipis
                                    color: {
                                        color:     critEdge ? '#DC2626' : '#CBD5E1',
                                        highlight: critEdge ? '#B91C1C' : '#64748B',
                                        hover:     critEdge ? '#EF4444' : '#94A3B8'
                                    },
                                    width:  critEdge ? 4 : 1.5,
                                    dashes: false,
                                    shadow: critEdge
                                        ? { enabled: true, color: 'rgba(220,38,38,0.3)', size: 8, x: 0, y: 0 }
                                        : false,
                                    smooth: { type: 'cubicBezier', forceDirection: 'horizontal', roundness: 0.4 }
                                });
                            }
                        });
                    });
                    
                    const netData = { nodes: new vis.DataSet(nodes), edges: new vis.DataSet(edges) };

                    // Layout adaptif: jarak antar level dan node disesuaikan jumlah node
                    const nodeCount = Object.keys(actsVis).length;
                    const levelSep  = nodeCount >= 15 ? 180 : nodeCount >= 10 ? 220 : 260;
                    const nodeSpac  = nodeCount >= 15 ? 80  : nodeCount >= 10 ? 100 : 130;
                    // Tinggi kontainer adaptif: lebih banyak node → lebih tinggi
                    graphvizDiv.style.height = nodeCount >= 15 ? '680px' : nodeCount >= 10 ? '580px' : '480px';

                    const options = {
                        layout: {
                            hierarchical: {
                                enabled:             true,
                                direction:           'LR', // Kiri ke kanan
                                sortMethod:          'directed',
                                levelSeparation:     levelSep,
                                nodeSpacing:         nodeSpac,
                                treeSpacing:         nodeSpac,
                                blockShifting:       true,
                                edgeMinimization:    true,
                                parentCentralization: true,
                                shakeTowards:        'leaves'
                            }
                        },
                        nodes: { widthConstraint: { minimum: 100, maximum: 160 } },
                        // Physics aktif hanya saat stabilisasi awal agar node tidak tumpang tindih
                        physics: {
                            enabled: true,
                            stabilization: { enabled: true, iterations: 250, updateInterval: 25, fit: true },
                            hierarchicalRepulsion: {
                                centralGravity:  0.0,
                                springLength:    nodeSpac,
                                springConstant:  0.01,
                                nodeDistance:    nodeSpac + 20,
                                damping:         0.09
                            },
                            solver: 'hierarchicalRepulsion'
                        },
                        interaction: {
                            dragNodes:    true,
                            zoomView:     true,
                            dragView:     true,
                            hover:        true,
                            tooltipDelay: 200
                        }
                    };

                    const network = new vis.Network(graphvizDiv, netData, options);

                    // Setelah stabilisasi: nonaktifkan physics & zoom fit agar diagram pas layar
                    network.once('stabilizationIterationsDone', () => {
                        network.setOptions({ physics: { enabled: false } });
                        network.fit({ animation: { duration: 400, easingFunction: 'easeInOutQuad' } });
                    });
                    // Fallback: paksa fit setelah 1.5 detik jika event tidak terpanggil
                    setTimeout(() => {
                        network.setOptions({ physics: { enabled: false } });
                        network.fit({ animation: { duration: 300, easingFunction: 'easeInOutQuad' } });
                    }, 1500);
                } else {
                    graphvizDiv.innerText = "Library Vis.js tidak dimuat. Refresh halaman jika koneksi internet terputus.";
                }
                
            } else {
                // Backend mengembalikan error (mis. siklus dependensi / input tidak valid)
                alert('Error: ' + data.detail);
            }
        } catch (e) {
            // Gagal terhubung ke server
            alert('Gagal terhubung ke API. Pastikan python -m uvicorn backend.main:app berjalan.');
        } finally {
            // Kembalikan tombol ke keadaan semula
            btn.disabled = false;
            spinner.style.display = 'none';
            btnText.innerText = "Hitung Jalur Kritis";
            hideLoadingOverlay();
        }
    }

    // ============================================================================
    // UTILITIES: Loading Overlay
    // ============================================================================

    /**
     * showLoadingOverlay(message)
     * Menampilkan overlay blur-putih dengan spinner dan pesan custom.
     * Dibuat sekali dan dipakai ulang untuk setiap proses kalkulasi.
     * @param {string} message - Teks pesan yang ditampilkan di bawah spinner
     */
    function showLoadingOverlay(message) {
        let overlay = document.getElementById('loading-overlay');
        if (!overlay) {
            // Buat elemen overlay jika belum ada
            overlay = document.createElement('div');
            overlay.id = 'loading-overlay';
            overlay.style.cssText = [
                'position:fixed', 'inset:0', 'z-index:9999',
                'background:rgba(255,255,255,0.82)',
                'backdrop-filter:blur(4px)',
                '-webkit-backdrop-filter:blur(4px)',
                'display:flex', 'flex-direction:column',
                'align-items:center', 'justify-content:center',
                'gap:1rem', 'transition:opacity 0.2s'
            ].join(';');
            overlay.innerHTML = `
                <div style="
                    width:48px; height:48px;
                    border:4px solid rgba(55,53,47,0.1);
                    border-top-color:#4F46E5;
                    border-radius:50%;
                    animation:spin 0.8s linear infinite;
                "></div>
                <div id="loading-overlay-msg" style="
                    font-size:0.95rem; font-weight:600;
                    color:#37352F; letter-spacing:0.01em;
                "></div>
                <div style="font-size:0.78rem; color:rgba(55,53,47,0.45);">
                    Mohon tunggu, jangan tutup halaman ini
                </div>
            `;
            document.body.appendChild(overlay);
            // Inject keyframe @keyframes spin sekali ke <head>
            if (!document.getElementById('loading-keyframe')) {
                const style = document.createElement('style');
                style.id = 'loading-keyframe';
                style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
                document.head.appendChild(style);
            }
        }
        document.getElementById('loading-overlay-msg').textContent = message || 'Sedang memproses…';
        overlay.style.display = 'flex';
        overlay.style.opacity = '1';
    }

    /**
     * hideLoadingOverlay()
     * Menyembunyikan overlay dengan transisi fade-out 200ms.
     */
    function hideLoadingOverlay() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => { overlay.style.display = 'none'; }, 200);
        }
    }

    // ============================================================================
    // INISIALISASI EVENT LISTENER NAVIGASI
    // ============================================================================
    navDashboard.addEventListener('click', renderDashboard);
    navHungarian.addEventListener('click', renderHungarian);
    navCpm.addEventListener('click', renderCpm);
    
    // Render halaman beranda sebagai tampilan default saat pertama kali dibuka
    renderDashboard();
});
