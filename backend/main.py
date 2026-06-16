from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Any, Optional

from .cpm_solver import CPMSolver
from .hungarian_solver import HungarianSolver

app = FastAPI(
    title="OptiPath API", 
    description="Backend API untuk Sistem Optimasi Riset Operasi (Hungarian & CPM)",
    version="2.0"
)

# Konfigurasi CORS (Cross-Origin Resource Sharing)
# Mengizinkan frontend (HTML/JS) untuk mengakses API secara aman dari domain manapun.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Pada level produksi, ganti "*" dengan domain yang spesifik
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Skema Data (Pydantic Models) ---
# Berfungsi untuk memvalidasi tipe data input (Error Handling) sebelum diproses oleh Solver.
# Jika tipe data tidak sesuai (misal: string diisi ke field matrix float), FastAPI otomatis memblokir (HTTP 422).

class HungarianRequest(BaseModel):
    cost_matrix: List[List[float]]
    is_maximization: bool = False

class CPMActivity(BaseModel):
    name: str
    duration: float
    predecessors: str | List[str]

class CPMRequest(BaseModel):
    activities: Dict[str, CPMActivity]

# --- Endpoints API ---

@app.get("/")
def read_root():
    """Endpoint verifikasi status kesehatan server (Health Check)."""
    return {"message": "OptiPath API is running"}

@app.post("/api/solve/hungarian")
def solve_hungarian(req: HungarianRequest):
    """
    Endpoint untuk Modul 1: Algoritma Hungarian.
    Menerima matriks biaya 2D, memprosesnya melalui HungarianSolver, 
    dan mengembalikan log langkah-langkah perhitungan secara transparan.
    """
    try:
        # Panggil modul solver yang telah dienkapsulasi dengan bersih (Modular)
        solver = HungarianSolver(req.cost_matrix, is_maximization=req.is_maximization)
        assignments, total_cost = solver.solve()
        
        # Format hasil langkah-langkah: Konversi dari NumPy Array ke List native Python
        # (Untuk menjamin kompatibilitas format JSON dan efisiensi memori)
        formatted_steps = []
        for step in solver.steps:
            formatted_step = {
                "title": step.get("title"),
                "description": step.get("description"),
                "matrix": step.get("matrix").tolist() if step.get("matrix") is not None else None,
            }
            # Include other step properties if present
            for k, v in step.items():
                if k not in ["title", "description", "matrix"]:
                    import numpy as np
                    if isinstance(v, np.ndarray):
                        formatted_step[k] = v.tolist()
                    else:
                        formatted_step[k] = v
            formatted_steps.append(formatted_step)

        return {
            "success": True,
            "assignments": assignments,
            "total_cost": total_cost,
            "steps": formatted_steps
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/solve/cpm")
def solve_cpm(req: CPMRequest):
    """
    Endpoint untuk Modul 2: Critical Path Method (CPM).
    Menerima list aktivitas, menghitung Forward/Backward Pass,
    dan menghasilkan diagram jaringan (Vis.js / Graphviz Format).
    """
    try:
        # Transformasi Pydantic model menjadi Dictionary standar agar tidak membebani memori
        activities_data = {
            k: {"name": v.name, "duration": v.duration, "predecessors": v.predecessors}
            for k, v in req.activities.items()
        }
        
        # Instansiasi objek CPMSolver
        solver = CPMSolver(activities_data)
        activities_result, total_duration = solver.solve()
        graphviz_dot = solver.generate_graphviz()

        return {
            "success": True,
            "activities": activities_result,
            "total_duration": total_duration,
            "graphviz_dot": graphviz_dot
        }
    except ValueError as ve:
        # Error penanganan khusus: misal siklus logika pada graf (Circular Dependency)
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        # Catch-all exception untuk mencegah server down secara tiba-tiba akibat crash tidak terduga
        raise HTTPException(status_code=500, detail=str(e))
