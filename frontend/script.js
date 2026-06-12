const API_URL = 'http://127.0.0.1:8000';

document.addEventListener('DOMContentLoaded', () => {
    // Check API status
    fetch(`${API_URL}/`)
        .then(res => res.json())
        .then(() => {
            const apiStatus = document.getElementById('api-status');
            if(apiStatus) {
                apiStatus.innerHTML = 'API Backend: Connected 🟢';
                apiStatus.style.color = '#10B981';
            }
        })
        .catch(() => {
            const apiStatus = document.getElementById('api-status');
            if(apiStatus) {
                apiStatus.innerHTML = 'API Backend: Disconnected 🔴';
                apiStatus.style.color = '#EF4444';
            }
        });

    const navDashboard = document.getElementById('nav-dashboard');
    const navHungarian = document.getElementById('nav-hungarian');
    const navCpm = document.getElementById('nav-cpm');
    const container = document.getElementById('module-container');

    function setActiveNav(activeNav) {
        navDashboard.classList.remove('active');
        navHungarian.classList.remove('active');
        navCpm.classList.remove('active');
        activeNav.classList.add('active');
    }

    function renderDashboard() {
        setActiveNav(navDashboard);
        document.getElementById('topbar-breadcrumb').innerText = 'Home';
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

    function renderHungarian() {
        setActiveNav(navHungarian);
        document.getElementById('topbar-breadcrumb').innerText = 'Assignment Model';
        container.innerHTML = `
            <div class="op-module-wrap">
                <div class="page-icon">🏢</div>
                <h1 class="op-module-title">Assignment Model</h1>
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
                    
                    <div class="table-responsive" id="matrix-container" style="margin-top: 1rem;"></div>
                    
                    <button class="btn btn-primary" id="btn-solve" style="margin-top: 1.5rem;">
                        <span class="spinner" id="btn-solve-spinner" style="display:none;"></span> 
                        <span id="btn-solve-text">Jalankan Optimasi</span>
                    </button>
                </div>
                
                <!-- Hasil Kalkulasi -->
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

        setupMatrix(8, 8, true);

        document.getElementById('btn-generate').addEventListener('click', () => {
            const r = parseInt(document.getElementById('matrix-rows').value) || 8;
            const c = parseInt(document.getElementById('matrix-cols').value) || 8;
            const isRandom = document.getElementById('input-method').value === 'random';
            setupMatrix(r, c, isRandom);
        });

        // Add input validation feedback
        document.getElementById('opt-mode').addEventListener('change', function() {
            if(this.value) this.classList.remove('is-invalid');
            document.getElementById('results-container').style.display = 'none';
        });

        // Sembunyikan hasil jika tabel matriks diubah
        document.getElementById('matrix-container').addEventListener('input', () => {
            document.getElementById('results-container').style.display = 'none';
        });

        document.getElementById('btn-solve').addEventListener('click', solveHungarian);
    }

    // -- Hungarian methods --
    function setupMatrix(rows, cols, isRandom) {
        // Enforce 8 to 20 boundary
        rows = Math.max(8, Math.min(20, rows));
        cols = Math.max(8, Math.min(20, cols));
        document.getElementById('matrix-rows').value = rows;
        document.getElementById('matrix-cols').value = cols;

        const c = document.getElementById('matrix-container');
        let html = '<table class="matrix-table" style="table-layout: fixed; width: max-content;">';
        for(let i=0; i<rows; i++) {
            html += '<tr>';
            for(let j=0; j<cols; j++) {
                const val = isRandom ? (Math.floor(Math.random() * 90) + 10) : '';
                // Right aligned for numeric input readability
                html += `<td><input type="number" class="matrix-cell text-right" style="width: 65px;" data-row="${i}" data-col="${j}" value="${val}"></td>`;
            }
            html += '</tr>';
        }
        html += '</table>';
        c.innerHTML = html;
    }

    async function solveHungarian() {
        const rows = parseInt(document.getElementById('matrix-rows').value);
        const cols = parseInt(document.getElementById('matrix-cols').value);
        const modeSelect = document.getElementById('opt-mode');
        const mode = modeSelect.value;
        const btn = document.getElementById('btn-solve');
        const spinner = document.getElementById('btn-solve-spinner');
        const btnText = document.getElementById('btn-solve-text');
        
        if (!mode) {
            modeSelect.classList.add('is-invalid'); // Visual error indication
            modeSelect.focus();
            return;
        }

        let matrix = [];
        let hasEmpty = false;
        
        for(let i=0; i<rows; i++) {
            let row = [];
            for(let j=0; j<cols; j++) {
                const input = document.querySelector(`.matrix-cell[data-row="${i}"][data-col="${j}"]`);
                if (input.value.trim() === '') hasEmpty = true;
                row.push(parseFloat(input.value) || 0);
            }
            matrix.push(row);
        }

        if (hasEmpty) {
            alert('Gagal: Terdapat sel matriks yang masih kosong. Harap lengkapi semua angka di dalam tabel matriks sebelum menjalankan optimasi.');
            return;
        }

        // Loading State
        btn.disabled = true;
        spinner.style.display = 'inline-block';
        btnText.innerText = "Memproses...";

        try {
            const res = await fetch(`${API_URL}/api/solve/hungarian`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cost_matrix: matrix,
                    is_maximization: mode === 'max'
                })
            });
            const data = await res.json();
            
            if(data.success) {
                document.getElementById('res-total').innerText = "Rp " + (data.total_cost * 10000).toLocaleString('id-ID');
                
                document.getElementById('results-container').style.display = 'block';

                // Render Steps
                const stepsViewer = document.getElementById('steps-viewer');
                let stepsHtml = '';
                data.steps.forEach((step, idx) => {
                    stepsHtml += `
                    <div class="step-card">
                        <h4 class="step-title">Tahap ${idx + 1}: ${step.title}</h4>
                        <p class="step-desc">${step.description}</p>
                    `;
                    if (step.matrix) {
                        stepsHtml += '<div class="table-responsive"><table class="matrix-table" style="font-size: 0.8rem; text-align: right;">';
                        step.matrix.forEach(r => {
                            stepsHtml += '<tr>';
                            r.forEach(val => {
                                const isZero = Math.abs(val) < 1e-9;
                                stepsHtml += `<td style="padding: 0.4rem 0.6rem; ${isZero ? 'color: #EF4444; font-weight: bold; background: #FEF2F2;' : 'color: #334155;'}">${Math.round(val)}</td>`;
                            });
                            stepsHtml += '</tr>';
                        });
                        stepsHtml += '</table></div>';
                    }
                    stepsHtml += `</div>`;
                });
                stepsViewer.innerHTML = stepsHtml;
                
                // Render Final Assignments
                const list = document.getElementById('assignments-list');
                let html = '<ul style="list-style: none; padding: 0;">';
                data.assignments.forEach(a => {
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
            } else {
                alert('Error: ' + data.detail);
            }
        } catch (e) {
            alert('Gagal terhubung ke API. Pastikan uvicorn backend.main:app berjalan.');
        } finally {
            btn.disabled = false;
            spinner.style.display = 'none';
            btnText.innerText = "Jalankan Optimasi";
        }
    }


    // CPM Logic
    function renderCpm() {
        setActiveNav(navCpm);
        document.getElementById('topbar-breadcrumb').innerText = 'Project Scheduling';
        container.innerHTML = `
            <div class="op-module-wrap">
                <div class="page-icon">📈</div>
                <h1 class="op-module-title">Project Scheduling</h1>
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
                                <!-- Rows injected here -->
                            </tbody>
                        </table>
                    </div>
                    
                    <button class="btn btn-primary" id="btn-solve-cpm">
                        <span class="spinner" id="btn-cpm-spinner" style="display:none;"></span> 
                        <span id="btn-cpm-text">Hitung Jalur Kritis</span>
                    </button>
                </div>
                
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
                        <h3 class="op-ch-title" style="margin-bottom: 1rem;">Perhitungan Detail (Table)</h3>
                        <div id="cpm-table-container"></div>
                    </div>
                    
                    <div class="notion-section" style="margin-top: 2rem;">
                        <h3 class="op-ch-title" style="margin-bottom: 1rem;">Visualisasi Jaringan</h3>
                        <div id="cpm-graphviz" style="overflow: auto; text-align: center; border: 1px solid rgba(55,53,47,0.09); border-radius: 4px; padding: 1rem; background: #FFFFFF;"></div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('btn-cpm-add').addEventListener('click', () => addCpmRow());
        document.getElementById('btn-cpm-reset').addEventListener('click', initCpmRows);
        document.getElementById('btn-cpm-template').addEventListener('click', loadKasus9);
        document.getElementById('btn-solve-cpm').addEventListener('click', solveCpm);
        
        // Validasi Real-time: Sorot merah ID ganda dan tampilkan alert SECARA INSTAN (event 'input')
        document.getElementById('cpm-tbody').addEventListener('input', (e) => {
            // Sembunyikan hasil lama jika tabel diubah
            document.getElementById('cpm-results-container').style.display = 'none';

            if (e.target.classList.contains('cpm-id')) {
                const currentVal = e.target.value.trim().toUpperCase();
                
                // Hapus sorotan merah sebelumnya (reset)
                e.target.style.borderColor = '';
                e.target.style.backgroundColor = '';
                e.target.value = currentVal; // Otomatis jadikan huruf kapital
                
                if (!currentVal) return;
                
                const allIds = Array.from(document.querySelectorAll('.cpm-id'));
                // Cek apakah ada input ID lain yang nilainya sama persis dengan yang baru saja diketik
                const isDuplicate = allIds.some(input => input !== e.target && input.value.trim().toUpperCase() === currentVal);
                
                if (isDuplicate) {
                    // Beri sorotan merah jika duplikat
                    e.target.style.borderColor = '#EF4444';
                    e.target.style.backgroundColor = '#FEF2F2';
                    // Tampilkan pesan peringatan
                    alert(`Peringatan: ID Kegiatan "${currentVal}" sudah digunakan pada baris lain. Harap ubah menjadi ID yang unik!`);
                }
            }
        });
        
        initCpmRows(); // load 8 default empty rows to enforce manual filling
    }

    function addCpmRow(id='', name='', duration='', preds='') {
        const tbody = document.getElementById('cpm-tbody');
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

    function initCpmRows() {
        document.getElementById('cpm-results-container').style.display = 'none';
        const tbody = document.getElementById('cpm-tbody');
        tbody.innerHTML = '';
        const defaultIds = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
        defaultIds.forEach(id => {
            addCpmRow(id, '', '', '');
        });
    }

    function loadKasus9() {
        document.getElementById('cpm-results-container').style.display = 'none';
        // Deteksi ukuran baris saat ini
        const currentRowCount = document.querySelectorAll('.cpm-row').length;
        let size = currentRowCount < 8 ? 8 : currentRowCount;

        const tbody = document.getElementById('cpm-tbody');
        tbody.innerHTML = '';
        
        // Memastikan ID kegiatan (A-J) unik semua
        addCpmRow('A', 'Riset Ide & Penulisan Naskah', '5', '-');
        addCpmRow('B', 'Pembuatan Storyboard', '3', 'A');
        addCpmRow('C', 'Perizinan Lokasi & Casting', '4', 'A');
        addCpmRow('D', 'Produksi Shooting Lapangan', '7', 'B, C');
        addCpmRow('E', 'Editing Kasar (Offline)', '5', 'D');
        addCpmRow('F', 'Sound Design & Scoring', '3', 'E');
        addCpmRow('G', 'Color Grading & VFX', '3', 'E');
        if (size >= 8) addCpmRow('H', 'Review Internal & Revisi', '2', 'F, G');
        if (size >= 9) addCpmRow('I', 'Ekspor & Publikasi Konten', '1', 'H');
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

    async function solveCpm() {
        const btn = document.getElementById('btn-solve-cpm');
        const spinner = document.getElementById('btn-cpm-spinner');
        const btnText = document.getElementById('btn-cpm-text');
        
        const rows = document.querySelectorAll('.cpm-row');
        let activities = {};
        let duplicateId = false;
        let incompleteData = false;
        
        rows.forEach(row => {
            const idInput = row.querySelector('.cpm-id');
            const id = idInput.value.trim().toUpperCase();
            const name = row.querySelector('.cpm-name').value.trim();
            const durStr = row.querySelector('.cpm-duration').value.trim();
            const dur = parseFloat(durStr) || 0;
            const preds = row.querySelector('.cpm-preds').value.trim();
            
            // Cegah program berjalan jika ada SATU SAJA kolom wajib yang belum terisi di baris manapun
            if (!id || !name || durStr === '') {
                incompleteData = true;
            } else {
                if (activities[id]) duplicateId = true;
                activities[id] = { name: name, duration: dur, predecessors: preds };
            }
        });

        const actCount = Object.keys(activities).length;

        if (incompleteData) {
            alert('Gagal: Terdapat data yang belum lengkap. Pastikan seluruh baris telah terisi ID Kegiatan, Deskripsi Tugas, dan Durasinya.');
            return;
        }

        if (duplicateId) {
            alert('Gagal: Terdapat duplikasi ID Kegiatan (kolom ID bersorot merah). Harap gunakan ID yang unik untuk setiap kegiatan.');
            return;
        }

        if (actCount < 8 || actCount > 20) {
            alert(`Jumlah kegiatan saat ini: ${actCount}. Sesuai kapasitas, harap masukkan minimal 8 kegiatan dan maksimal 20 kegiatan.`);
            return;
        }

        btn.disabled = true;
        spinner.style.display = 'inline-block';
        btnText.innerText = "Kalkulasi Berjalan...";

        try {
            const res = await fetch(`${API_URL}/api/solve/cpm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ activities: activities })
            });
            const data = await res.json();
            
            if (data.success) {
                document.getElementById('cpm-results-container').style.display = 'block';
                document.getElementById('cpm-total-duration').innerHTML = `${data.total_duration} <span style="font-size: 1rem; color: #64748B;">Hari</span>`;
                
                // Extract critical path
                const acts = data.activities;
                const cpList = Object.keys(acts).filter(k => acts[k].is_critical).sort((a,b) => acts[a].es - acts[b].es);
                document.getElementById('cpm-critical-path').innerText = cpList.join(' → ');

                // Build Table Detail
                let tableHtml = `
                    <div class="table-responsive">
                        <table class="matrix-table" style="text-align: center; width: 100%;">
                            <thead>
                                <tr>
                                    <th style="border-bottom: 2px solid rgba(55,53,47,0.16);">ID</th>
                                    <th class="text-left" style="border-bottom: 2px solid rgba(55,53,47,0.16);">Deskripsi</th>
                                    <th class="text-right" style="border-bottom: 2px solid rgba(55,53,47,0.16);">Durasi</th>
                                    <th class="text-right" title="Earliest Start" style="border-bottom: 2px solid rgba(55,53,47,0.16);">ES</th>
                                    <th class="text-right" title="Earliest Finish" style="border-bottom: 2px solid rgba(55,53,47,0.16);">EF</th>
                                    <th class="text-right" title="Latest Start" style="border-bottom: 2px solid rgba(55,53,47,0.16);">LS</th>
                                    <th class="text-right" title="Latest Finish" style="border-bottom: 2px solid rgba(55,53,47,0.16);">LF</th>
                                    <th class="text-right" title="Kelonggaran Waktu" style="border-bottom: 2px solid rgba(55,53,47,0.16);">Slack</th>
                                </tr>
                            </thead>
                            <tbody>
                `;
                
                Object.keys(acts).sort().forEach(id => {
                    const a = acts[id];
                    const isCrit = a.is_critical;
                    const rowBg = isCrit ? 'background: rgba(235, 87, 87, 0.05);' : 'background: transparent;';
                    const textColor = isCrit ? 'color: #EB5757; font-weight: 600;' : 'color: #37352F;';
                    
                    tableHtml += `
                        <tr style="${rowBg}">
                            <td style="${textColor}">${id}</td>
                            <td class="text-left" style="${textColor}">${a.name}</td>
                            <td class="text-right" style="color: rgba(55,53,47,0.65);">${a.duration}</td>
                            <td class="text-right" style="color: rgba(55,53,47,0.65); font-weight: 500;">${a.es}</td>
                            <td class="text-right" style="color: rgba(55,53,47,0.65); font-weight: 500;">${a.ef}</td>
                            <td class="text-right" style="color: rgba(55,53,47,0.65); font-weight: 500;">${a.ls}</td>
                            <td class="text-right" style="color: rgba(55,53,47,0.65); font-weight: 500;">${a.lf}</td>
                            <td class="text-right" style="${isCrit ? 'color: #EB5757; font-weight: 600;' : 'color: rgba(55,53,47,0.4); font-weight: 500;'}">${a.slack}</td>
                        </tr>
                    `;
                });
                tableHtml += '</tbody></table></div>';
                
                document.getElementById('cpm-table-container').innerHTML = tableHtml;

                // Render Vis.js Network
                const graphvizDiv = document.getElementById('cpm-graphviz');
                graphvizDiv.innerHTML = '';
                graphvizDiv.style.height = '500px';
                graphvizDiv.style.border = '1px solid rgba(55,53,47,0.16)';
                graphvizDiv.style.borderRadius = '8px';
                graphvizDiv.style.backgroundColor = '#FAFAFA';

                if (window.vis) {
                    const acts = data.activities;
                    const nodes = [];
                    const edges = [];
                    
                    Object.keys(acts).forEach(id => {
                        const a = acts[id];
                        const isCrit = a.is_critical;
                        const desc = a.name.length > 20 ? a.name.substring(0, 20) + '...' : a.name;
                        
                        nodes.push({
                            id: id,
                            label: `<b>${id}</b>\n<i>${desc}</i>\n\nES: <b>${a.es}</b> | EF: <b>${a.ef}</b>\nLS: <b>${a.ls}</b> | LF: <b>${a.lf}</b>\nSlack: <b>${a.slack}</b>`,
                            shape: 'box',
                            font: { 
                                multi: 'html', 
                                face: 'Inter, sans-serif',
                                color: isCrit ? '#991B1B' : '#1E3A8A',
                                size: 14,
                                align: 'center'
                            },
                            color: {
                                background: isCrit ? '#FEF2F2' : '#EFF6FF',
                                border: isCrit ? '#EF4444' : '#3B82F6',
                                highlight: { background: isCrit ? '#FECACA' : '#DBEAFE', border: isCrit ? '#DC2626' : '#2563EB' }
                            },
                            borderWidth: isCrit ? 3 : 1,
                            shadow: true,
                            margin: 15
                        });
                        
                        a.predecessors.forEach(p => {
                            if (acts[p]) {
                                const critEdge = isCrit && acts[p].is_critical;
                                edges.push({
                                    from: p,
                                    to: id,
                                    arrows: 'to',
                                    color: { color: critEdge ? '#EF4444' : '#94A3B8', highlight: critEdge ? '#DC2626' : '#64748B' },
                                    width: critEdge ? 3 : 1.5,
                                    smooth: { type: 'cubicBezier', forceDirection: 'horizontal', roundness: 0.4 }
                                });
                            }
                        });
                    });
                    
                    const netData = { nodes: new vis.DataSet(nodes), edges: new vis.DataSet(edges) };
                    const options = {
                        layout: {
                            hierarchical: {
                                direction: 'LR',
                                sortMethod: 'directed',
                                levelSeparation: 250,
                                nodeSpacing: 120
                            }
                        },
                        physics: false,
                        interaction: { dragNodes: true, zoomView: true, dragView: true, hover: true }
                    };
                    new vis.Network(graphvizDiv, netData, options);
                } else {
                    graphvizDiv.innerText = "Library Vis.js tidak dimuat. Refresh halaman jika koneksi internet terputus.";
                }
                
            } else {
                alert('Error: ' + data.detail);
            }
        } catch (e) {
            alert('Gagal terhubung ke API. Pastikan uvicorn backend.main:app berjalan.');
        } finally {
            btn.disabled = false;
            spinner.style.display = 'none';
            btnText.innerText = "Hitung Jalur Kritis";
        }
    }

    // Initialize listeners
    navDashboard.addEventListener('click', renderDashboard);
    navHungarian.addEventListener('click', renderHungarian);
    navCpm.addEventListener('click', renderCpm);
    
    // Load default
    renderDashboard();
});
