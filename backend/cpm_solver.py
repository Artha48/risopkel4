"""
==============================================================================
cpm_solver.py

Modul Solver untuk Critical Path Method (CPM).
Mengimplementasikan seluruh algoritma penjadwalan jaringan proyek:

  1. _parse_predecessors()   — Normalisasi input predecessor (str/list → list bersih)
  2. _build_graph()          — Bangun struktur adjacency list (successor + in-degree)
  3. _topological_sort()     — Urutkan kegiatan secara topologis (Kahn's Algorithm)
  4. solve()                 — Orkestrasi: Forward Pass → Backward Pass → Slack → Kritis
  5. _find_all_critical_paths() — DFS untuk enumerasi SEMUA jalur kritis
  6. generate_graphviz()     — Generator kode DOT untuk visualisasi Graphviz

Algoritma Inti:
  - Forward Pass : ES = max(EF predecessor), EF = ES + Durasi
  - Backward Pass: LF = min(LS successor),  LS = LF − Durasi
  - Slack        : LS − ES; jika Slack = 0 → kegiatan kritis
  - DFS          : Enumerasi semua path dari node awal kritis ke node akhir kritis
==============================================================================
"""

import re


class CPMSolver:
    """
    Menyelesaikan masalah penjadwalan proyek menggunakan Critical Path Method (CPM).
    Melakukan Forward Pass, Backward Pass, kalkulasi Slack, dan penentuan jalur kritis.
    Mendukung deteksi MULTIPLE CRITICAL PATHS, validasi Circular Dependency,
    dan sanitasi Negative Slack agar sesuai standar Riset Operasi.
    """

    def __init__(self, activities_data):
        """
        Inisialisasi solver dengan data kegiatan dari request frontend.

        Parameter:
            activities_data (dict): Format
                { 'A': {'name': str, 'duration': float, 'predecessors': str|list} }

        Setiap kegiatan diinisialisasi dengan nilai ES/EF/LS/LF/Slack = 0.0
        karena nilai-nilai ini akan diisi pada fase Forward/Backward Pass di solve().
        """
        self.activities = {}
        for act_id, val in activities_data.items():
            # Normalisasi predecessor: string "A, B" → list ['A', 'B']
            preds = self._parse_predecessors(val.get("predecessors", ""))
            # Simpan setiap kegiatan dengan ID yang sudah di-uppercase dan stripped
            self.activities[act_id.strip().upper()] = {
                "name":         val.get("name", "").strip(),
                "duration":     float(val.get("duration", 0)),
                "predecessors": preds,
                # Nilai-nilai CPM (diisi saat solve() dipanggil)
                "es": 0.0,           # Earliest Start
                "ef": 0.0,           # Earliest Finish
                "ls": 0.0,           # Latest Start
                "lf": 0.0,           # Latest Finish
                "slack": 0.0,        # Float / Kelonggaran
                "is_critical": False,      # True jika slack = 0
                "slack_warning": False,    # True jika slack sempat negatif sebelum di-clamp
            }

        # Struktur data graph yang akan diisi oleh _build_graph()
        self.topo_order     = []    # Urutan topologis kegiatan
        self.successors     = {}    # Peta successor: { 'A': ['C', 'D'], ... }
        self.in_degree      = {}    # Jumlah predecessor aktif per kegiatan
        self.total_duration = 0.0   # Durasi total proyek (EF terbesar)
        self.critical_paths = []    # Semua jalur kritis yang ditemukan (list of lists)

    # =========================================================================
    # BAGIAN 1: PARSING & KONSTRUKSI GRAPH
    # =========================================================================

    @staticmethod
    def _parse_predecessors(raw):
        """
        Normalisasi input predecessor dari berbagai format menjadi list ID bersih.

        Contoh input yang didukung:
          - String  : "A, B"  → ['A', 'B']
          - String  : "A; B"  → ['A', 'B']
          - String  : "-"     → []   (tidak ada predecessor)
          - String  : "NONE"  → []
          - List    : ['a', 'b'] → ['A', 'B']

        Semua ID di-uppercase agar pencocokan case-insensitive.
        """
        if isinstance(raw, list):
            # Input sudah berupa list — langsung normalisasi
            preds = [str(p).strip().upper() for p in raw]
        else:
            # Input berupa string — pisahkan dengan koma, titik koma, atau spasi
            preds = [p.strip().upper() for p in re.split(r"[,;\s]+", str(raw))]
        # Filter nilai sentinel yang berarti "tidak ada predecessor"
        return [p for p in preds if p and p not in {"-", "NONE", "N/A"}]

    def _build_graph(self):
        """
        Membangun struktur adjacency list dari daftar kegiatan.

        Hasil:
          - self.successors : dict { node: [successor, ...] }
            Digunakan untuk traversal Forward Pass dan DFS jalur kritis.
          - self.in_degree  : dict { node: int }
            Jumlah predecessor yang belum diproses per node.
            Digunakan oleh Kahn's Algorithm di _topological_sort().

        Kompleksitas: O(V + E) — V = jumlah kegiatan, E = jumlah edge predecessor.
        """
        # Inisialisasi semua node dengan successor kosong dan in-degree 0
        self.successors = {k: [] for k in self.activities}
        self.in_degree  = {k: 0  for k in self.activities}

        # Iterasi setiap kegiatan dan daftarkan dirinya ke successor predecessornya
        for u, val in self.activities.items():
            for p in val["predecessors"]:
                if p in self.activities:           # Abaikan predecessor yang tidak valid
                    self.successors[p].append(u)   # u adalah successor dari p
                    self.in_degree[u] += 1          # u memiliki satu predecessor lebih

    def _topological_sort(self):
        """
        Mengurutkan kegiatan secara topologis menggunakan Kahn's Algorithm (BFS berbasis queue).

        Algoritma:
          1. Masukkan semua node dengan in-degree = 0 (tidak punya predecessor) ke queue.
          2. Ambil node dari queue → tambahkan ke topo_order → kurangi in-degree successornya.
          3. Jika in-degree successor menjadi 0, masukkan ke queue.
          4. Ulangi hingga queue kosong.

        Deteksi Siklus:
          Jika panjang topo_order < jumlah kegiatan setelah proses selesai,
          berarti ada kegiatan yang tidak bisa diproses → terdapat siklus (Circular Dependency).
          Contoh: A bergantung B dan B bergantung A → keduanya tidak pernah in-degree = 0.

        Raises:
            ValueError: Jika ditemukan Circular Dependency, dengan nama kegiatan yang terlibat.
        """
        # Langkah 1: Bangun graph dan in-degree sebelum memulai sorting
        self._build_graph()

        # Langkah 2: Masukkan semua node sumber (in-degree = 0) ke queue, urutkan secara alfabet
        # agar output deterministik (urutan konsisten di setiap run)
        queue = sorted(k for k in self.activities if self.in_degree[k] == 0)
        self.topo_order = []

        # Langkah 3: Proses queue secara FIFO (BFS)
        while queue:
            u = queue.pop(0)               # Ambil node paling awal (sorted)
            self.topo_order.append(u)

            # Kurangi in-degree semua successor; jika menjadi 0, masukkan ke queue
            for v in self.successors[u]:
                self.in_degree[v] -= 1
                if self.in_degree[v] == 0:
                    queue.append(v)
                    queue.sort()           # Jaga urutan deterministik

        # Langkah 4: Deteksi siklus — node yang tidak masuk topo_order berarti terlibat siklus
        if len(self.topo_order) != len(self.activities):
            unresolved = sorted(
                k for k in self.activities if k not in self.topo_order
            )
            raise ValueError(
                f"Terdeteksi ketergantungan melingkar (Circular Dependency) pada kegiatan: "
                f"{', '.join(unresolved)}. "
                f"Contoh: jika A membutuhkan B dan B membutuhkan A, keduanya tidak akan "
                f"pernah bisa dimulai. Periksa kembali kolom predecessor pada kegiatan tersebut."
            )

    # =========================================================================
    # BAGIAN 2: SOLVER UTAMA — FORWARD PASS, BACKWARD PASS, SLACK
    # =========================================================================

    def solve(self):
        """
        Orkestrasi seluruh algoritma CPM secara berurutan:
          1. _topological_sort()           — Urutan valid kegiatan (deteksi siklus)
          2. Forward Pass                  — Hitung ES dan EF tiap kegiatan
          3. Backward Pass                 — Hitung LF dan LS tiap kegiatan
          4. Kalkulasi Slack               — Slack = LS − ES; tandai kegiatan kritis
          5. _find_all_critical_paths()    — Enumerasi semua jalur kritis via DFS

        Returns:
            tuple: (activities_dict, total_duration, critical_paths_list)
              - activities_dict   : dict semua kegiatan beserta nilai ES/EF/LS/LF/Slack
              - total_duration    : float durasi total proyek
              - critical_paths_list: list of lists — semua jalur kritis yang ditemukan
        """
        # Guard: kembalikan kosong jika tidak ada kegiatan
        if not self.activities:
            return {}, 0.0, []

        # Langkah 0: Validasi urutan dan bangun graph
        self._topological_sort()

        # ── FORWARD PASS ──────────────────────────────────────────────────────
        # Diproses dari kegiatan paling awal ke paling akhir (urutan topologis).
        # Rumus:
        #   ES = max(EF semua predecessor) → jika tidak ada predecessor, ES = 0
        #   EF = ES + Durasi
        for u in self.topo_order:
            act = self.activities[u]
            # Ambil EF terbesar dari semua predecessor yang terdaftar
            es = max(
                (self.activities[p]["ef"] for p in act["predecessors"] if p in self.activities),
                default=0.0,    # Kegiatan tanpa predecessor mulai di t=0
            )
            act["es"] = round(es, 6)                       # Simpan ES dengan presisi 6 desimal
            act["ef"] = round(es + act["duration"], 6)     # EF = ES + Durasi

        # Total durasi proyek = EF terbesar di antara semua kegiatan akhir
        self.total_duration = max(a["ef"] for a in self.activities.values())

        # ── BACKWARD PASS ─────────────────────────────────────────────────────
        # Diproses dari kegiatan paling akhir ke paling awal (urutan terbalik topologis).
        # Rumus:
        #   LF = min(LS semua successor) → jika tidak ada successor, LF = total_duration
        #   LS = LF − Durasi

        # Inisialisasi: semua kegiatan diset LF = total_duration (asumsi semua adalah akhir)
        for act in self.activities.values():
            act["lf"] = self.total_duration

        # Proses mundur: perbarui LF predecessor berdasarkan LS kegiatan saat ini
        for u in reversed(self.topo_order):
            act       = self.activities[u]
            act["ls"] = round(act["lf"] - act["duration"], 6)  # LS = LF − Durasi

            # Propagasikan ke predecessor: LF predecessor = min(LF lama, LS kegiatan ini)
            for p in act["predecessors"]:
                if p in self.activities:
                    # LF predecessor dibatasi oleh LS successor yang paling awal
                    self.activities[p]["lf"] = min(self.activities[p]["lf"], act["ls"])

        # ── KALKULASI SLACK & SANITASI NEGATIF ───────────────────────────────
        # Slack = LS − ES (setara dengan LF − EF).
        # Slack = 0 → kegiatan berada di jalur kritis (tidak boleh ditunda sama sekali).
        # Slack > 0 → kegiatan bisa ditunda sebanyak nilai Slack tanpa menunda proyek.
        # Slack < 0 → seharusnya mustahil dalam CPM valid; kemungkinan floating-point drift.
        for act in self.activities.values():
            raw_slack = round(act["ls"] - act["es"], 6)

            if raw_slack < -1e-9:
                # Slack negatif: anomali — tampilkan nilai asli tapi beri flag peringatan
                # Frontend akan menampilkan ikon ⚠ di sebelah nilai Slack
                act["slack"]         = round(raw_slack, 4)
                act["slack_warning"] = True
            else:
                # Slack normal: clamp ke 0 jika sangat mendekati nol (floating-point noise)
                act["slack"]         = max(0.0, round(raw_slack, 6))
                act["slack_warning"] = False

            # Tandai kritis: slack dianggap nol jika kurang dari threshold 1e-9
            act["is_critical"] = abs(raw_slack) < 1e-9

        # ── ENUMERASI JALUR KRITIS ────────────────────────────────────────────
        # Setelah semua kegiatan ditandai is_critical, cari SEMUA jalur kritis
        # dari node awal hingga node akhir menggunakan DFS.
        self.critical_paths = self._find_all_critical_paths()

        return self.activities, self.total_duration, self.critical_paths

    # =========================================================================
    # BAGIAN 3: ENUMERASI SEMUA JALUR KRITIS (DFS)
    # =========================================================================

    def _find_all_critical_paths(self):
        """
        Mencari SEMUA jalur kritis dari node awal hingga node akhir menggunakan
        Depth-First Search (DFS) pada subgraph kegiatan kritis.

        Definisi:
          - Node awal kritis : kegiatan kritis yang tidak punya predecessor kritis
            (titik masuk jalur kritis di jaringan)
          - Node akhir kritis: kegiatan kritis yang tidak punya successor kritis
            (titik keluar / akhir jalur kritis)

        Algoritma DFS:
          Mulai dari setiap start_node → jelajahi successor kritis secara rekursif
          → jika mencapai end_node, simpan path saat ini ke all_paths.

        Returns:
            list of lists: Setiap elemen adalah satu jalur kritis (list ID kegiatan berurutan).
            Contoh: [['A', 'D', 'E', 'H'], ['A', 'D', 'F', 'H']]
        """
        # Identifikasi node awal: kritis, tapi tidak ada predecessor yang juga kritis
        start_nodes = [
            k for k, a in self.activities.items()
            if a["is_critical"] and not any(
                p in self.activities and self.activities[p]["is_critical"]
                for p in a["predecessors"]
            )
        ]

        # Identifikasi node akhir: kritis, tapi tidak ada successor yang juga kritis
        end_nodes = set(
            k for k, a in self.activities.items()
            if a["is_critical"] and not any(
                s in self.activities and self.activities[s]["is_critical"]
                for s in self.successors.get(k, [])
            )
        )

        all_paths = []

        def dfs(node, current_path):
            """
            DFS rekursif menelusuri subgraph kritis.
            Setiap node hanya boleh dikunjungi sekali per jalur (path tidak mengandung siklus).

            Parameter:
                node         : ID kegiatan yang sedang dikunjungi
                current_path : List kegiatan yang sudah dikunjungi pada jalur ini
            """
            current_path.append(node)          # Masukkan node ke jalur aktif

            if node in end_nodes:
                # Mencapai node akhir — simpan salinan jalur ini sebagai jalur kritis lengkap
                all_paths.append(list(current_path))
            else:
                # Lanjutkan DFS ke successor yang juga bersifat kritis
                for succ in self.successors.get(node, []):
                    if self.activities[succ]["is_critical"]:
                        dfs(succ, current_path)

            current_path.pop()  # Backtrack: keluarkan node dari jalur aktif

        # Mulai DFS dari setiap node awal kritis
        for start in start_nodes:
            dfs(start, [])

        # Fallback: jika DFS gagal menemukan jalur (edge case pada graph tidak terhubung),
        # kembalikan semua kegiatan kritis dalam urutan topologis sebagai satu jalur tunggal
        if not all_paths:
            fallback = [
                k for k in self.topo_order if self.activities[k]["is_critical"]
            ]
            if fallback:
                all_paths = [fallback]

        return all_paths

    # =========================================================================
    # BAGIAN 4: GENERATOR VISUALISASI GRAPHVIZ DOT
    # =========================================================================

    def generate_graphviz(self):
        """
        Menghasilkan kode Graphviz DOT untuk diagram jaringan proyek.

        Format diagram: setiap node adalah tabel HTML dengan layout:
          ┌────────────────────────────┐
          │         ID + Nama          │  ← Header (merah=kritis, biru=normal)
          ├──────┬─────────┬───────────┤
          │  ES  │  Durasi │    EF     │  ← Baris Forward Pass
          ├──────┼─────────┼───────────┤
          │  LS  │  Slack  │    LF     │  ← Baris Backward Pass
          └──────┴─────────┴───────────┘

        Konvensi warna:
          - Kegiatan kritis  : border merah (#EF4444), header merah solid
          - Kegiatan normal  : border biru  (#3B82F6), header biru solid
          - Edge kritis      : merah tebal (penwidth=3.0)
          - Edge normal      : abu tipis   (penwidth=1.5)

        Returns:
            str: Kode DOT lengkap siap di-render oleh Graphviz/d3-graphviz.
        """
        # Pengaturan global diagram: orientasi kiri-ke-kanan, splines ortogonal
        lines = [
            "digraph G {",
            "    rankdir=LR;",         # Left-to-Right layout
            "    nodesep=0.8;",        # Jarak vertikal antar node dalam rank yang sama
            "    ranksep=1.5;",        # Jarak horizontal antar rank (level)
            "    splines=ortho;",      # Garis edge lurus/ortogonal (tidak melengkung)
            "    bgcolor=transparent;",
            '    node [shape=plaintext, fontname="Inter, Helvetica, sans-serif", margin=0];',
            '    edge [fontname="Inter, Helvetica, sans-serif", arrowsize=0.8];',
            "",
        ]

        # ── Bangun setiap node sebagai tabel HTML label ──
        for act_id, act in self.activities.items():
            es, dur, ef   = act["es"],    act["duration"], act["ef"]
            ls, lf, slack = act["ls"],    act["lf"],       act["slack"]

            # Potong nama kegiatan jika terlalu panjang (maks 18 karakter + "...")
            desc = act["name"][:18] + ("..." if len(act["name"]) > 18 else "")
            # Escape karakter HTML khusus agar tidak merusak format DOT label
            desc = desc.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

            # Tentukan skema warna berdasarkan status kritis
            if act["is_critical"]:
                # Kegiatan kritis: skema merah
                border    = "#EF4444"; header_bg = "#EF4444"; header_fg = "#FFFFFF"
                cell_bg   = "#FEF2F2"; slack_bg  = "#FECACA"; slack_fg  = "#991B1B"
                border_w  = "2"        # Border lebih tebal untuk kritis
            else:
                # Kegiatan normal: skema biru
                border    = "#3B82F6"; header_bg = "#3B82F6"; header_fg = "#FFFFFF"
                cell_bg   = "#EFF6FF"; slack_bg  = "#DBEAFE"; slack_fg  = "#1E3A8A"
                border_w  = "1"

            # Tambahkan simbol ⚠ jika terjadi anomali slack negatif
            slack_warning_label = " ⚠" if act.get("slack_warning") else ""

            # Susun label HTML table untuk node Graphviz
            lines += [
                f"    {act_id} [",
                f"        label=<",
                f'            <table border="{border_w}" cellborder="1" cellspacing="0" cellpadding="8" color="{border}" bgcolor="{cell_bg}" style="rounded">',
                f"                <tr>",
                # Baris header: ID kegiatan (bold besar) + nama singkat
                f'                    <td colspan="3" bgcolor="{header_bg}" align="center" cellpadding="10">',
                f'                        <font color="{header_fg}" point-size="14"><b>{act_id}</b></font><br/>',
                f'                        <font color="{header_fg}" point-size="10">{desc}</font>',
                f"                    </td>",
                f"                </tr>",
                f"                <tr>",
                # Baris Forward Pass: ES | Durasi | EF
                f'                    <td align="center"><font point-size="9" color="#64748B">ES</font><br/><font point-size="12" color="#0F172A"><b>{es:.0f}</b></font></td>',
                f'                    <td align="center" bgcolor="{cell_bg}"><font point-size="9" color="#64748B">Durasi</font><br/><font point-size="12" color="#0F172A"><b>{dur:.0f}</b></font></td>',
                f'                    <td align="center"><font point-size="9" color="#64748B">EF</font><br/><font point-size="12" color="#0F172A"><b>{ef:.0f}</b></font></td>',
                f"                </tr>",
                f"                <tr>",
                # Baris Backward Pass: LS | Slack | LF
                f'                    <td align="center"><font point-size="9" color="#64748B">LS</font><br/><font point-size="12" color="#0F172A"><b>{ls:.0f}</b></font></td>',
                f'                    <td align="center" bgcolor="{slack_bg}"><font point-size="9" color="{slack_fg}">Slack{slack_warning_label}</font><br/><font point-size="12" color="{slack_fg}"><b>{slack:.0f}</b></font></td>',
                f'                    <td align="center"><font point-size="9" color="#64748B">LF</font><br/><font point-size="12" color="#0F172A"><b>{lf:.0f}</b></font></td>',
                f"                </tr>",
                f"            </table>",
                f"        >",
                f"    ];",
            ]

        # ── Bangun edge (panah) antar node ──
        lines.append("")
        for act_id, act in self.activities.items():
            for p in act["predecessors"]:
                if p in self.activities:
                    # Edge kritis: kedua endpoint adalah kegiatan kritis → warna merah tebal
                    if act["is_critical"] and self.activities[p]["is_critical"]:
                        opts = 'color="#EF4444", penwidth=3.0, fontcolor="#EF4444"'
                    else:
                        # Edge normal: warna abu tipis
                        opts = 'color="#94A3B8", penwidth=1.5, fontcolor="#94A3B8"'
                    lines.append(f"    {p} -> {act_id} [{opts}];")

        lines.append("}")
        return "\n".join(lines)
