from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1.api import api_router

# Importar todos los modelos para inicialización de tablas
import app.models

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="API para el Sistema de Citas y Expedientes Médicos de la Clínica Médica México (NOM-004-SSA3-2012 / NOM-024-SSA3-2012)"
)

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En desarrollo permite todos los orígenes del frontend Vite
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    # Las tablas ya fueron creadas por 01_esquema_clinica.sql
    # No llamamos create_all para no interferir con el esquema de MySQL
    pass

@app.get("/")
def root():
    return {
        "status": "online",
        "system": settings.PROJECT_NAME,
        "version": "1.0.0",
        "docs": "/docs"
    }

app.include_router(api_router, prefix=settings.API_V1_STR)
