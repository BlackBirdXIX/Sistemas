from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Numeric, Enum as SAEnum, SmallInteger, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class Expediente(Base):
    __tablename__ = "expedientes"

    id                                     = Column(Integer, primary_key=True, index=True, autoincrement=True)
    paciente_id                            = Column(Integer, ForeignKey("pacientes.id"), unique=True, nullable=False)
    numero_expediente                      = Column(String(20), unique=True, nullable=False)
    grupo_sanguineo                        = Column(SAEnum('A+','A-','B+','B-','AB+','AB-','O+','O-'), nullable=True)
    alergias                               = Column(Text, nullable=True)
    antecedentes_heredofamiliares          = Column(Text, nullable=True)
    antecedentes_personales_patologicos    = Column(Text, nullable=True)
    antecedentes_personales_no_patologicos = Column(Text, nullable=True)
    creado_por                             = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    creado_en                              = Column(DateTime, nullable=False, default=datetime.utcnow)
    actualizado_en                         = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    paciente  = relationship("Paciente", back_populates="expediente")
    consultas = relationship("Consulta", back_populates="expediente", order_by="desc(Consulta.fecha_consulta)")
    adjuntos  = relationship("Adjunto", back_populates="expediente")


class Consulta(Base):
    __tablename__ = "consultas"

    id                  = Column(Integer, primary_key=True, index=True, autoincrement=True)
    expediente_id       = Column(Integer, ForeignKey("expedientes.id"), nullable=False)
    cita_id             = Column(Integer, ForeignKey("citas.id"), unique=True, nullable=True)
    medico_id           = Column(Integer, ForeignKey("medicos.id"), nullable=False)
    fecha_consulta      = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    motivo_consulta     = Column(Text, nullable=False)
    exploracion_fisica  = Column(Text, nullable=True)
    peso_kg             = Column(Numeric(5, 2), nullable=True)
    talla_cm            = Column(Numeric(5, 1), nullable=True)
    presion_sistolica   = Column(SmallInteger, nullable=True)
    presion_diastolica  = Column(SmallInteger, nullable=True)
    frecuencia_cardiaca = Column(SmallInteger, nullable=True)
    temperatura_c       = Column(Numeric(4, 1), nullable=True)
    plan_tratamiento    = Column(Text, nullable=True)
    notas_evolucion     = Column(Text, nullable=True)
    eliminado_en        = Column(DateTime, nullable=True)   # borrado lógico
    creado_en           = Column(DateTime, nullable=False, default=datetime.utcnow)
    actualizado_en      = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    expediente   = relationship("Expediente", back_populates="consultas")
    cita         = relationship("Cita", back_populates="consulta")
    medico       = relationship("Medico", back_populates="consultas")
    diagnosticos = relationship("Diagnostico", back_populates="consulta", cascade="all, delete-orphan")
    receta       = relationship("Receta", back_populates="consulta", uselist=False, cascade="all, delete-orphan")
    adjuntos     = relationship("Adjunto", back_populates="consulta")


class CatCie10(Base):
    __tablename__ = "cat_cie10"

    codigo      = Column(String(10), primary_key=True)
    descripcion = Column(String(255), nullable=False)

    diagnosticos = relationship("Diagnostico", back_populates="cie10")


class Diagnostico(Base):
    __tablename__ = "diagnosticos"

    id            = Column(Integer, primary_key=True, index=True, autoincrement=True)
    consulta_id   = Column(Integer, ForeignKey("consultas.id"), nullable=False)
    cie10_codigo  = Column(String(10), ForeignKey("cat_cie10.codigo"), nullable=False)
    tipo          = Column(SAEnum('principal', 'secundario'), nullable=False, default='principal')
    observaciones = Column(String(255), nullable=True)

    consulta = relationship("Consulta", back_populates="diagnosticos")
    cie10    = relationship("CatCie10", back_populates="diagnosticos")


class Receta(Base):
    __tablename__ = "recetas"

    id                    = Column(Integer, primary_key=True, index=True, autoincrement=True)
    consulta_id           = Column(Integer, ForeignKey("consultas.id"), unique=True, nullable=False)
    folio                 = Column(String(20), unique=True, nullable=False)
    fecha_emision         = Column(DateTime, nullable=False, default=datetime.utcnow)
    indicaciones_generales = Column(Text, nullable=True)

    consulta     = relationship("Consulta", back_populates="receta")
    medicamentos = relationship("RecetaMedicamento", back_populates="receta", cascade="all, delete-orphan")


class RecetaMedicamento(Base):
    __tablename__ = "receta_medicamentos"

    id                  = Column(Integer, primary_key=True, index=True, autoincrement=True)
    receta_id           = Column(Integer, ForeignKey("recetas.id"), nullable=False)
    medicamento         = Column(String(150), nullable=False)
    dosis               = Column(String(80), nullable=False)
    frecuencia          = Column(String(80), nullable=False)
    duracion            = Column(String(80), nullable=False)
    via_administracion  = Column(String(50), nullable=True)
    indicaciones        = Column(String(255), nullable=True)

    receta = relationship("Receta", back_populates="medicamentos")


class Adjunto(Base):
    __tablename__ = "adjuntos"

    id             = Column(Integer, primary_key=True, index=True, autoincrement=True)
    expediente_id  = Column(Integer, ForeignKey("expedientes.id"), nullable=False)
    consulta_id    = Column(Integer, ForeignKey("consultas.id"), nullable=True)
    nombre_archivo = Column(String(255), nullable=False)
    ruta_archivo   = Column(String(500), nullable=False)
    tipo_mime      = Column(String(100), nullable=False)
    tamano_bytes   = Column(Integer, nullable=False)
    descripcion    = Column(String(255), nullable=True)
    subido_por     = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    subido_en      = Column(DateTime, nullable=False, default=datetime.utcnow)
    eliminado_en   = Column(DateTime, nullable=True)

    expediente = relationship("Expediente", back_populates="adjuntos")
    consulta   = relationship("Consulta", back_populates="adjuntos")
