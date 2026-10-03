from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, SmallInteger, Time
from sqlalchemy.orm import relationship
from app.core.database import Base


class Especialidad(Base):
    __tablename__ = "especialidades"

    id          = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre      = Column(String(100), unique=True, nullable=False)
    descripcion = Column(String(255), nullable=True)
    activo      = Column(Boolean, nullable=False, default=True)

    medicos = relationship("Medico", back_populates="especialidad")


class Consultorio(Base):
    __tablename__ = "consultorios"

    id     = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String(50), unique=True, nullable=False)
    piso   = Column(String(20), nullable=True)
    activo = Column(Boolean, nullable=False, default=True)

    medicos = relationship("Medico", back_populates="consultorio")
    citas   = relationship("Cita", back_populates="consultorio")


class Medico(Base):
    __tablename__ = "medicos"

    id                    = Column(Integer, primary_key=True, index=True, autoincrement=True)
    usuario_id            = Column(Integer, ForeignKey("usuarios.id"), unique=True, nullable=False)
    especialidad_id       = Column(Integer, ForeignKey("especialidades.id"), nullable=False)
    consultorio_id        = Column(Integer, ForeignKey("consultorios.id"), nullable=True)
    nombre                = Column(String(80), nullable=False)
    apellido_paterno      = Column(String(80), nullable=False)
    apellido_materno      = Column(String(80), nullable=True)
    cedula_profesional    = Column(String(20), unique=True, nullable=False)
    telefono              = Column(String(20), nullable=True)
    email                 = Column(String(120), nullable=True)
    duracion_consulta_min = Column(SmallInteger, nullable=False, default=30)
    activo                = Column(Boolean, nullable=False, default=True)
    creado_en             = Column(DateTime, nullable=False, default=datetime.utcnow)

    usuario     = relationship("Usuario", back_populates="medico_perfil")
    especialidad = relationship("Especialidad", back_populates="medicos")
    consultorio  = relationship("Consultorio", back_populates="medicos")
    horarios     = relationship("HorarioMedico", back_populates="medico", cascade="all, delete-orphan")
    citas        = relationship("Cita", back_populates="medico")
    consultas    = relationship("Consulta", back_populates="medico")

    @property
    def nombre_completo(self) -> str:
        partes = [self.nombre, self.apellido_paterno, self.apellido_materno]
        return " ".join([p for p in partes if p])


class HorarioMedico(Base):
    __tablename__ = "horarios_medico"

    id          = Column(Integer, primary_key=True, index=True, autoincrement=True)
    medico_id   = Column(Integer, ForeignKey("medicos.id"), nullable=False)
    dia_semana  = Column(SmallInteger, nullable=False)  # 1=lunes ... 7=domingo
    hora_inicio = Column(Time, nullable=False)
    hora_fin    = Column(Time, nullable=False)

    medico = relationship("Medico", back_populates="horarios")
