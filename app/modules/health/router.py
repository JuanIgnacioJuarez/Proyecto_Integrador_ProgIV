from fastapi import APIRouter
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
        return {"status": "error", "database": str(e)}