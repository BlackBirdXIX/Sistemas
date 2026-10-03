from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.orm import relationship
from app.core.database import Base


class Cita(Base):
    __tablename__ = "citas"

    id                 = Column(Integer, primary_key=True, index=True, autoincrement=True)
    paciente_id        = Column(Integer, ForeignKey("pacientes.id"), nullable=False)
    medico_id          = Column(Integer, ForeignKey("medicos.id"), nullable=False)
    consultorio_id     = Column(Integer, ForeignKey("consultorios.id"), nullable=True)
    fecha_hora_inicio  = Column(DateTime, nullable=False, index=True)
    fecha_hora_fin     = Column(DateTime, nullable=False)
    estado             = Column(
        SAEnum('programada', 'confirmada', 'en_curso', 'completada', 'cancelada', 'no_asistio'),
        nullable=False,
        default='programada',
        index=True
    )
    motivo             = Column(String(255), nullable=True)
    motivo_cancelacion = Column(String(255), nullable=True)
    creado_por         = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    creado_en          = Column(DateTime, nullable=False, default=datetime.utcnow)
    actualizado_en     = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    paciente    = relationship("Paciente", back_populates="citas")
    medico      = relationship("Medico", back_populates="citas")
    consultorio = relationship("Consultorio", back_populates="citas")
    consulta    = relationship("Consulta", back_populates="cita", uselist=False)
