import re


class CPMSolver:
    """
    Menyelesaikan masalah penjadwalan proyek menggunakan Critical Path Method (CPM).
    Melakukan Forward Pass, Backward Pass, kalkulasi Slack, dan penentuan jalur kritis.
    Menghasilkan representasi diagram jaringan dalam format Graphviz DOT.
    """

    def __init__(self, activities_data):
        """
        activities_data: dict dengan format
            { 'A': {'name': str, 'duration': float, 'predecessors': str|list} }
        """
        self.activities = {}
        for act_id, val in activities_data.items():
            preds = self._parse_predecessors(val.get("predecessors", ""))
            self.activities[act_id.strip().upper()] = {
                "name":        val.get("name", "").strip(),
                "duration":    float(val.get("duration", 0)),
                "predecessors": preds,
                "es": 0.0, "ef": 0.0,
                "ls": 0.0, "lf": 0.0,
                "slack": 0.0,
                "is_critical": False,
            }

        self.topo_order    = []
        self.successors    = {}
        self.in_degree     = {}
        self.total_duration = 0.0

    @staticmethod
    def _parse_predecessors(raw):
        """Ubah string predecessor (misal 'A, B' atau ['A', 'B']) menjadi list ID bersih."""
        if isinstance(raw, list):
            preds = [str(p).strip().upper() for p in raw]
        else:
            preds = [p.strip().upper() for p in re.split(r"[,;\s]+", str(raw))]
        return [p for p in preds if p and p not in {"-", "NONE", "N/A"}]

    def _build_graph(self):
        """Bangun struktur graph (successors dan in-degree) dari daftar kegiatan."""
        self.successors = {k: [] for k in self.activities}
        self.in_degree  = {k: 0  for k in self.activities}
        for u, val in self.activities.items():
            for p in val["predecessors"]:
                if p in self.activities:
                    self.successors[p].append(u)
                    self.in_degree[u] += 1

    def _topological_sort(self):
        """Urutkan kegiatan secara topologi (Kahn's algorithm). Lempar ValueError jika ada siklus."""
        self._build_graph()
        
        # Inisialisasi antrean (queue) dengan node/kegiatan yang tidak memiliki predecessor (in_degree = 0)
        queue = sorted(k for k in self.activities if self.in_degree[k] == 0)
        self.topo_order = []

        # Proses antrean selama masih ada kegiatan
        while queue:
            u = queue.pop(0)  # Ambil node paling awal
            self.topo_order.append(u)  # Masukkan ke dalam urutan topologi
            
            # Kurangi derajat masuk (in_degree) untuk semua kegiatan yang bergantung padanya (successors)
            for v in self.successors[u]:
                self.in_degree[v] -= 1
                # Jika sebuah successor sudah tidak memiliki predecessor lagi, masukkan ke antrean
                if self.in_degree[v] == 0:
                    queue.append(v)
                    queue.sort()  # Urutkan abjad agar jalur lebih deterministik

        # Jika panjang urutan topologi kurang dari jumlah kegiatan, berarti terdapat siklus (circular dependency)
        if len(self.topo_order) != len(self.activities):
            raise ValueError(
                "Terdeteksi siklus pada daftar kegiatan. "
                "Periksa kembali kolom predecessor — pastikan tidak ada kegiatan yang "
                "saling menjadi pendahulu satu sama lain."
            )

    def solve(self):
        """
        Jalankan Forward Pass dan Backward Pass, hitung Slack, dan tandai jalur kritis.
        Kembalikan dict hasil kegiatan dan total durasi proyek.
        """
        if not self.activities:
            return {}, 0.0

        self._topological_sort()

        # 1. Forward Pass: Hitung waktu mulai awal (ES) dan waktu selesai awal (EF) dari awal ke akhir
        for u in self.topo_order:
            act   = self.activities[u]
            # ES adalah nilai maksimum dari EF semua predecessor-nya
            es    = max(
                (self.activities[p]["ef"] for p in act["predecessors"] if p in self.activities),
                default=0.0  # Jika tidak ada predecessor, mulai dari 0
            )
            act["es"] = es
            act["ef"] = es + act["duration"]  # EF = ES + durasi

        # Total durasi proyek adalah nilai EF tertinggi di antara semua kegiatan
        self.total_duration = max(a["ef"] for a in self.activities.values())

        # 2. Backward Pass: Hitung waktu selesai paling lambat (LF) dan mulai paling lambat (LS)
        # Secara default, inisialisasi semua LF dengan total durasi penyelesaian proyek
        for act in self.activities.values():
            act["lf"] = self.total_duration

        # Lakukan iterasi mundur (dari akhir ke awal) berdasarkan urutan topologi
        for u in reversed(self.topo_order):
            act      = self.activities[u]
            act["ls"] = act["lf"] - act["duration"]  # LS = LF - durasi
            
            # Untuk setiap predecessor, perbarui LF-nya menjadi nilai minimum dari LS semua successor-nya
            for p in act["predecessors"]:
                if p in self.activities:
                    self.activities[p]["lf"] = min(self.activities[p]["lf"], act["ls"])

        # 3. Kalkulasi Slack (Float) dan penetapan Jalur Kritis (Critical Path)
        for act in self.activities.values():
            act["slack"]       = act["ls"] - act["es"]  # Jeda toleransi waktu (keterlambatan maksimal)
            act["is_critical"] = abs(act["slack"]) < 1e-9  # Jika slack mendekati 0, maka ia kritis

        return self.activities, self.total_duration

    def generate_graphviz(self):
        """
        Hasilkan kode Graphviz DOT untuk diagram jaringan kerja.
        Desain Modern Minimalist "Wah": garis tajam, warna high-contrast, ortho routing.
        """
        lines = [
            "digraph G {",
            "    rankdir=LR;",
            "    nodesep=0.8;",
            "    ranksep=1.5;",
            "    splines=ortho;",
            "    bgcolor=transparent;",
            '    node [shape=plaintext, fontname="Inter, Helvetica, sans-serif", margin=0];',
            '    edge [fontname="Inter, Helvetica, sans-serif", arrowsize=0.8];',
            "",
        ]

        for act_id, act in self.activities.items():
            es, dur, ef = act["es"], act["duration"], act["ef"]
            ls, lf, slack = act["ls"], act["lf"], act["slack"]
            desc = act["name"][:18] + ("..." if len(act["name"]) > 18 else "")
            desc = desc.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

            if act["is_critical"]:
                border = "#EF4444"
                header_bg = "#EF4444"
                header_fg = "#FFFFFF"
                cell_bg = "#FEF2F2"
                slack_bg = "#FECACA"
                slack_fg = "#991B1B"
                border_w = "2"
            else:
                border = "#3B82F6"
                header_bg = "#3B82F6"
                header_fg = "#FFFFFF"
                cell_bg = "#EFF6FF"
                slack_bg = "#DBEAFE"
                slack_fg = "#1E3A8A"
                border_w = "1"

            # Create a more structured, impressive modern HTML table layout
            lines += [
                f"    {act_id} [",
                f"        label=<",
                f'            <table border="{border_w}" cellborder="1" cellspacing="0" cellpadding="8" color="{border}" bgcolor="{cell_bg}" style="rounded">',
                f"                <tr>",
                f'                    <td colspan="3" bgcolor="{header_bg}" align="center" cellpadding="10">',
                f'                        <font color="{header_fg}" point-size="14"><b>{act_id}</b></font><br/>',
                f'                        <font color="{header_fg}" point-size="10">{desc}</font>',
                f"                    </td>",
                f"                </tr>",
                f"                <tr>",
                f'                    <td align="center"><font point-size="9" color="#64748B">ES</font><br/><font point-size="12" color="#0F172A"><b>{es:.0f}</b></font></td>',
                f'                    <td align="center" bgcolor="{cell_bg}"><font point-size="9" color="#64748B">Durasi</font><br/><font point-size="12" color="#0F172A"><b>{dur:.0f}</b></font></td>',
                f'                    <td align="center"><font point-size="9" color="#64748B">EF</font><br/><font point-size="12" color="#0F172A"><b>{ef:.0f}</b></font></td>',
                f"                </tr>",
                f"                <tr>",
                f'                    <td align="center"><font point-size="9" color="#64748B">LS</font><br/><font point-size="12" color="#0F172A"><b>{ls:.0f}</b></font></td>',
                f'                    <td align="center" bgcolor="{slack_bg}"><font point-size="9" color="{slack_fg}">Slack</font><br/><font point-size="12" color="{slack_fg}"><b>{slack:.0f}</b></font></td>',
                f'                    <td align="center"><font point-size="9" color="#64748B">LF</font><br/><font point-size="12" color="#0F172A"><b>{lf:.0f}</b></font></td>',
                f"                </tr>",
                f"            </table>",
                f"        >",
                f"    ];",
            ]

        lines.append("")
        for act_id, act in self.activities.items():
            for p in act["predecessors"]:
                if p in self.activities:
                    if act["is_critical"] and self.activities[p]["is_critical"]:
                        opts = 'color="#EF4444", penwidth=3.0, fontcolor="#EF4444"'
                    else:
                        opts = 'color="#94A3B8", penwidth=1.5, fontcolor="#94A3B8"'
                    lines.append(f"    {p} -> {act_id} [{opts}];")

        lines.append("}")
        return "\n".join(lines)
