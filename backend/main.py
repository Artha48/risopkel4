"""
==============================================================================
main.py

Entry Point Backend API untuk Aplikasi OptiPath.
Dibangun menggunakan FastAPI — framework Python modern untuk REST API.

Endpoint yang tersedia:
  GET  /                       → Health check (cek status server)
  POST /api/solve/hungarian    → Modul 1: Algoritma Hungarian (Assignment Problem)
  POST /api/solve/cpm          → Modul 2: Critical Path Method (Penjadwalan Proyek)

Arsitektur:
  - Validasi input dilakukan di level Pydantic Model (otomatis oleh FastAPI)
  - Logika solver dienkapsulasi di modul terpisah (hungarian_solver, cpm_solver)
  - Error handling berlapis: input validation → ValueError → TypeError → Exception
  - CORS dikonfigurasi agar frontend HTML/JS bisa memanggil API dari browser

Dependensi:
  - fastapi       : Framework REST API
  - pydantic      : Validasi & parsing data request
  - uvicorn       : ASGI server (jalankan dengan: uvicorn backend.main:app --reload)
==============================================================================
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Any, Optional

# Import modul solver dari sub-paket backend
from .cpm_solver import CPMSolver
from .hungarian_solver import HungarianSolver

# ── Inisialisasi Aplikasi FastAPI ─────────────────────────────────────────────
app = FastAPI(
    title="OptiPath API",
    description="Backend API untuk Sistem Optimasi Riset Operasi (Hungarian & CPM)",
    version="2.0"
)

# ── Konfigurasi CORS (Cross-Origin Resource Sharing) ─────────────────────────
# Diperlukan agar browser mengizinkan request dari frontend (HTML/JS)
# yang berjalan di origin berbeda (misal: file:// atau localhost:3000)
# ke API yang berjalan di localhost:8000.
# PENTING: Di lingkungan produksi, ganti allow_origins=["*"] dengan
# domain frontend yang spesifik untuk keamanan lebih baik.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # Izinkan semua origin (development only)
    allow_credentials=True,    # Izinkan pengiriman cookies/auth header
    allow_methods=["*"],       # Izinkan semua HTTP method (GET, POST, dsb)
    allow_headers=["*"],       # Izinkan semua HTTP header
)

# ============================================================================
# SKEMA DATA — PYDANTIC MODELS
# ============================================================================
# Pydantic models berfungsi sebagai "kontrak data" antara frontend dan backend.
# FastAPI secara otomatis:
#   1. Mem-parse body JSON request menjadi objek Python sesuai model
#   2. Memvalidasi tipe data setiap field
#   3. Mengembalikan HTTP 422 (atau 400 via handler kustom) jika validasi gagal
#
# Keuntungan: validasi input non-numerik (mis. huruf "A" pada field float)
# langsung ditangani tanpa perlu kode validasi manual di setiap endpoint.

from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

# ── Global Handler: Request Validation Error ──────────────────────────────────
# Override respons default FastAPI (HTTP 422 Unprocessable Entity) menjadi
# HTTP 400 Bad Request dengan pesan error yang ramah dalam Bahasa Indonesia.
#
# Kasus yang ditangani:
#   - Pengguna memasukkan huruf "A" pada sel matriks (field List[List[float]])
#   - Pengguna memasukkan simbol khusus atau teks pada field numerik
#   - Body request tidak sesuai format JSON yang diharapkan
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    # Ekstrak informasi error pertama dari Pydantic untuk pesan yang lebih spesifik
    errors      = exc.errors()
    first_error = errors[0] if errors else {}

    # Bangun string lokasi field bermasalah: misal "body → cost_matrix → 2 → 3"
    loc = " → ".join(str(l) for l in first_error.get("loc", []))

    # Susun pesan error yang informatif dan ramah pengguna
    friendly_msg = (
        f"Input tidak valid pada field '{loc}'. "
        "Pastikan semua sel matriks berisi angka bulat atau desimal "
        "(tidak boleh mengandung huruf, simbol, atau karakter khusus)."
        if loc else
        "Input tidak valid. Pastikan semua sel matriks berisi angka "
        "(tidak mengandung huruf atau simbol khusus)."
    )
    return JSONResponse(
        status_code=400,
        content={"success": False, "detail": friendly_msg}
    )


# ── Model Request: Hungarian Algorithm ───────────────────────────────────────
class HungarianRequest(BaseModel):
    """
    Schema validasi untuk request endpoint /api/solve/hungarian.

    Fields:
        cost_matrix    : Matriks biaya 2D berisi angka desimal.
                         Contoh: [[10, 20], [30, 40]]
                         Pydantic akan menolak otomatis jika ada elemen non-numerik.
        is_maximization: False (default) → cari biaya minimum.
                         True → cari keuntungan maksimum (solver mengonversi ke minimasi).
    """
    cost_matrix: List[List[float]]   # Matriks biaya N×M — harus berisi angka semua
    is_maximization: bool = False     # Mode optimasi: False=minimasi, True=maksimasi


# ── Model Request: CPM ───────────────────────────────────────────────────────
class CPMActivity(BaseModel):
    """
    Schema satu kegiatan CPM dalam request /api/solve/cpm.

    Fields:
        name        : Nama/deskripsi kegiatan (misal "Produksi Shooting Lapangan")
        duration    : Durasi kegiatan dalam satuan hari (harus ≥ 0)
        predecessors: Predecessor kegiatan ini.
                      Bisa berupa string "A, B" atau list ["A", "B"].
                      Nilai "-", "NONE", atau "" berarti tidak ada predecessor.
    """
    name:         str                # Nama deskriptif kegiatan
    duration:     float              # Durasi dalam hari (float untuk fleksibilitas)
    predecessors: str | List[str]    # Predecessor: string atau list string


class CPMRequest(BaseModel):
    """
    Schema validasi untuk request endpoint /api/solve/cpm.

    Fields:
        activities: Dictionary kegiatan, di mana key adalah ID (misal "A", "B")
                    dan value adalah objek CPMActivity.
                    Contoh: {"A": {"name": "...", "duration": 5, "predecessors": "-"}}
    """
    activities: Dict[str, CPMActivity]   # Peta ID kegiatan → detail kegiatan


# ============================================================================
# ENDPOINTS API
# ============================================================================

@app.get("/")
def read_root():
    """
    Endpoint Health Check — verifikasi bahwa server API berjalan dengan normal.
    Dipanggil oleh frontend saat halaman pertama kali dibuka untuk mengecek
    status koneksi API (indikator hijau/merah di topbar).
    """
    return {"message": "OptiPath API is running"}


@app.post("/api/solve/hungarian")
def solve_hungarian(req: HungarianRequest):
    """
    Endpoint Modul 1: Algoritma Hungarian (Assignment Problem).

    Alur Pemrosesan:
      1. Pydantic memvalidasi request body → field non-numerik langsung ditolak (HTTP 400)
      2. HungarianSolver memproses matriks step-by-step:
           a. Inisialisasi & padding matriks
           b. Pengurangan baris & kolom
           c. Loop: matching bipartit → garis penutup → revisi matriks
           d. Penugasan akhir & total biaya
      3. Konversi NumPy array → list Python native (agar JSON-serializable)
      4. Kembalikan semua langkah + hasil penugasan ke frontend

    Error Handling Berlapis:
      - RequestValidationError → HTTP 400: nilai non-numerik dari Pydantic (handler global)
      - ValueError             → HTTP 400: ukuran matriks di luar batas 8x8–20x20
      - TypeError              → HTTP 400: tipe data tidak valid yang lolos dari Pydantic
      - Exception              → HTTP 500: bug internal yang tidak terduga
    """
    import numpy as np
    try:
        # ── Panggil HungarianSolver — solver dienkapsulasi terpisah (Modular) ──
        solver = HungarianSolver(req.cost_matrix, is_maximization=req.is_maximization)
        assignments, total_cost = solver.solve()

        # ── Konversi langkah-langkah: NumPy Array → List Python native ──────
        # FastAPI tidak bisa men-serialize NumPy ndarray secara langsung ke JSON.
        # Setiap array harus dikonversi ke list Python dengan .tolist().
        formatted_steps = []
        for step in solver.steps:
            formatted_step = {
                "title":       step.get("title"),
                "description": step.get("description"),
                # Konversi matriks NumPy ke nested list Python
                "matrix":      step.get("matrix").tolist() if step.get("matrix") is not None else None,
            }
            # Konversi properti tambahan (row_lines, col_mins, dsb) jika berupa ndarray
            for k, v in step.items():
                if k not in ["title", "description", "matrix"]:
                    formatted_step[k] = v.tolist() if isinstance(v, np.ndarray) else v
            formatted_steps.append(formatted_step)

        # Kembalikan respons sukses dengan semua data yang dibutuhkan frontend
        return {
            "success":     True,
            "assignments": assignments,    # List penugasan akhir { row, col, cost }
            "total_cost":  total_cost,     # Total biaya/keuntungan optimal
            "steps":       formatted_steps # Semua langkah untuk tampilan step-by-step
        }

    except ValueError as ve:
        # ValueError dari HungarianSolver: ukuran matriks tidak valid (di luar 8x8–20x20)
        # atau konversi nilai gagal karena input tidak terduga.
        raise HTTPException(status_code=400, detail=str(ve))

    except TypeError as te:
        # TypeError: nilai non-numerik yang lolos dari validasi Pydantic (sangat jarang).
        # Mengembalikan pesan ramah daripada membiarkan crash jadi HTTP 500.
        raise HTTPException(
            status_code=400,
            detail=(
                "Tipe data tidak valid pada matriks. "
                "Pastikan semua sel berisi angka (bukan huruf atau simbol). "
                f"Detail teknis: {str(te)}"
            )
        )

    except Exception as e:
        # Catch-all: hanya untuk bug internal yang tidak terduga (bukan kesalahan input).
        # HTTP 500 menandakan masalah di sisi server, bukan sisi pengguna.
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.post("/api/solve/cpm")
def solve_cpm(req: CPMRequest):
    """
    Endpoint Modul 2: Critical Path Method (Teori Jaringan).

    Alur Pemrosesan:
      1. Pydantic memvalidasi request body → field tidak lengkap langsung ditolak
      2. Transformasi Pydantic Model → dict Python standar (untuk CPMSolver)
      3. CPMSolver memproses jaringan:
           a. _parse_predecessors() → normalisasi format predecessor
           b. _topological_sort()   → Kahn's Algorithm (deteksi siklus)
           c. Forward Pass          → hitung ES, EF
           d. Backward Pass         → hitung LF, LS
           e. Slack + Kritis        → identifikasi jalur kritis
           f. _find_all_critical_paths() → DFS enumerasi semua jalur kritis
      4. generate_graphviz() → kode DOT untuk visualisasi jaringan
      5. Kembalikan hasil lengkap ke frontend

    Error Handling:
      - ValueError  → HTTP 400: Circular Dependency terdeteksi, atau input tidak valid
      - Exception   → HTTP 500: crash internal yang tidak terduga
    """
    try:
        # ── Transformasi Pydantic Model → dict standar ──────────────────────
        # CPMSolver menerima dict Python biasa, bukan objek Pydantic.
        # Konversi dilakukan di sini agar CPMSolver tetap independen dari FastAPI.
        activities_data = {
            k: {
                "name":         v.name,
                "duration":     v.duration,
                "predecessors": v.predecessors   # Bisa str atau list[str]
            }
            for k, v in req.activities.items()
        }

        # ── VALIDASI BACKEND: Jumlah Kegiatan (8–20) ───────────────────────
        # Validasi ini WAJIB ada di sisi backend sebagai lapis kedua keamanan.
        # Frontend sudah memvalidasi, namun request langsung ke API (misal via
        # Postman/curl) dapat melewati validasi frontend sepenuhnya.
        # Batasan 8–20 kegiatan sesuai spesifikasi soal Riset Operasi.
        num_activities = len(activities_data)
        if num_activities == 0:
            raise HTTPException(
                status_code=400,
                detail="Tidak ada kegiatan yang dikirim. Harap masukkan minimal 8 kegiatan."
            )
        if num_activities < 8:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Jumlah kegiatan terlalu sedikit: {num_activities}. "
                    "Sistem membutuhkan minimal 8 kegiatan untuk dapat diproses. "
                    "Harap tambahkan kegiatan hingga mencapai minimal 8."
                )
            )
        if num_activities > 20:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Jumlah kegiatan terlalu banyak: {num_activities}. "
                    "Sistem hanya mendukung maksimal 20 kegiatan untuk menjaga "
                    "performa kalkulasi dan keterbacaan diagram. "
                    "Harap kurangi jumlah kegiatan hingga maksimal 20."
                )
            )

        # ── VALIDASI BACKEND: Durasi Tidak Boleh Negatif ───────────────────
        # Durasi negatif secara fisik tidak mungkin terjadi. Validasi ini
        # mencegah Forward Pass menghasilkan nilai EF yang tidak logis.
        for act_id, act in activities_data.items():
            if act["duration"] < 0:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Durasi kegiatan '{act_id}' bernilai negatif ({act['duration']}). "
                        "Durasi kegiatan harus bernilai nol atau positif."
                    )
                )

        # ── Instansiasi dan jalankan CPMSolver ─────────────────────────────
        # CPMSolver akan melakukan: _topological_sort (Kahn's Algorithm + deteksi
        # Circular Dependency) → Forward Pass → Backward Pass → Slack → Jalur Kritis.
        solver = CPMSolver(activities_data)
        activities_result, total_duration, critical_paths = solver.solve()

        # ── Generate kode Graphviz DOT untuk visualisasi jaringan ──────────
        graphviz_dot = solver.generate_graphviz()

        # Kembalikan semua hasil ke frontend
        return {
            "success":        True,
            "activities":     activities_result,   # Dict semua kegiatan + nilai ES/EF/LS/LF/Slack
            "total_duration": total_duration,      # Durasi total proyek (hari)
            "critical_paths": critical_paths,      # Semua jalur kritis [ ['A','D','E'], ... ]
            "graphviz_dot":   graphviz_dot         # Kode DOT untuk Graphviz
        }

    except HTTPException:
        # Re-raise HTTPException yang kita lempar sendiri di atas (validasi manual)
        # agar tidak tertangkap oleh catch-all Exception di bawah
        raise

    except ValueError as ve:
        # ValueError dari CPMSolver:
        #   - Circular Dependency (Kahn's Algorithm mendeteksi siklus)
        #   - Predecessor tidak terdaftar
        # Pesan error dari solver sudah informatif dan ramah pengguna (Bahasa Indonesia).
        raise HTTPException(status_code=400, detail=str(ve))

    except Exception as e:
        # Catch-all: mencegah server crash total akibat bug internal yang tidak terduga.
        # Di lingkungan produksi, log exception ini ke sistem monitoring (Sentry, dsb).
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
