from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings


def create_app_engine():
    """
    Conecta a MySQL usando las credenciales del .env.
    La base de datos 'clinica' ya debe existir (creada por el script 01_esquema_clinica.sql).
    Si la conexión falla, usa SQLite como respaldo para desarrollo.
    """
    mysql_url = settings.get_database_url()
    try:
        engine = create_engine(
            mysql_url,
            pool_pre_ping=True,
            pool_recycle=3600,
            echo=False
        )
        # Verificar conexión real
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print(f"[DATABASE] ✅ Conectado a MySQL 8 → base '{settings.DB_NAME}'")
        return engine
    except Exception as e:
        print(f"[DATABASE WARN] No se pudo conectar a MySQL ('{e}'). Activando SQLite de respaldo...")
        fallback_url = "sqlite:///./clinica.db"
        engine = create_engine(fallback_url, connect_args={"check_same_thread": False}, echo=False)
        return engine


engine = create_app_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
