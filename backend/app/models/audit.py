from datetime import datetime
from sqlalchemy import Column, BigInteger, Integer, String, DateTime, ForeignKey, JSON, Enum as SAEnum
from sqlalchemy.orm import relationship
from app.core.database import Base


class BitacoraAuditoria(Base):
    __tablename__ = "bitacora_auditoria"

    id         = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    accion     = Column(
        SAEnum('login', 'logout', 'consulta', 'crear', 'modificar', 'cancelar', 'eliminar_logico'),
        nullable=False,
        index=True
    )
    entidad    = Column(String(50), nullable=False)
    entidad_id = Column(Integer, nullable=True)
    detalle    = Column(JSON, nullable=True)
    ip         = Column(String(45), nullable=True)
    creado_en  = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)

    usuario = relationship("Usuario", back_populates="auditorias")
