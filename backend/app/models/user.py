from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SAEnum, SmallInteger
from sqlalchemy.orm import relationship
from app.core.database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id                = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username          = Column(String(50), unique=True, nullable=False, index=True)
    password_hash     = Column(String(255), nullable=False)
    rol               = Column(SAEnum('admin', 'medico', 'recepcion', 'paciente'), nullable=False)
    activo            = Column(Boolean, nullable=False, default=True)
    intentos_fallidos = Column(SmallInteger, nullable=False, default=0)
    bloqueado_hasta   = Column(DateTime, nullable=True)
    ultimo_login      = Column(DateTime, nullable=True)
    creado_en         = Column(DateTime, nullable=False, default=datetime.utcnow)
    actualizado_en    = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    medico_perfil = relationship("Medico", back_populates="usuario", uselist=False)
    auditorias    = relationship("BitacoraAuditoria", back_populates="usuario")
