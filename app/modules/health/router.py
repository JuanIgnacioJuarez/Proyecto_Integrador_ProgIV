from fastapi import APIRouter, HTTPException, status
from sqlmodel import text

from app.core.database import engine

# todas las rutas de este archivo empiezan por "health"
router = APIRouter(prefix="/health", tags=["health"])

# Verifica que el servidor de FastAPI está encendido y respondiendo peticiones.
@router.get("/")
def health_check():
    return {"status": "ok"}

# Para probar la conexión, simplemente si devuelve un 1 ya empieza a funcionar
@router.get("/db")
def db_check():
    try:
        with engine.connect() as conn :
            conn.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        # ===== MODIFICACION =====
        # lo cambiamos para que cuando falle la DB devuelva 503 de verdad
        # (antes respondia 200 igual y quedaba confuso para cliente/monitoreo).
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database unavailable",
        ) from e
