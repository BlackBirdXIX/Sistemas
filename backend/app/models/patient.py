from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, Date, DateTime, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from app.core.database import Base


class Paciente(Base):
    __tablename__ = "pacientes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey(
        "usuarios.id"), unique=True, nullable=True)
    curp = Column(String(18), unique=True, index=True, nullable=True)
    nombre = Column(String(80), nullable=False)
    apellido_paterno = Column(String(80), nullable=False)
    apellido_materno = Column(String(80), nullable=True)
    fecha_nacimiento = Column(Date, nullable=False)
    sexo = Column(SAEnum('F', 'M', 'otro'), nullable=False)
    telefono = Column(String(20), index=True, nullable=True)
    email = Column(String(120), nullable=True)
    direccion = Column(String(255), nullable=True)
    contacto_emergencia_nombre = Column(String(120), nullable=True)
    contacto_emergencia_telefono = Column(String(20), nullable=True)
    activo = Column(Boolean, nullable=False, default=True)
    creado_por = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    creado_en = Column(DateTime, nullable=False, default=datetime.utcnow)
    actualizado_en = Column(DateTime, nullable=False,
                            default=datetime.utcnow, onupdate=datetime.utcnow)

    citas = relationship("Cita", back_populates="paciente")
    expediente = relationship(
        "Expediente", back_populates="paciente", uselist=False, cascade="all, delete-orphan")

    @property
    def primer_apellido(self) -> str:
        return self.apellido_paterno

    @primer_apellido.setter
    def primer_apellido(self, value: str):
        self.apellido_paterno = value

    @property
    def segundo_apellido(self) -> str | None:
        return self.apellido_materno

    @segundo_apellido.setter
    def segundo_apellido(self, value: str | None):
        self.apellido_materno = value

    @property
    def genero(self) -> str:
        mapping = {"F": "Femenino", "M": "Masculino", "otro": "Otro"}
        return mapping.get(self.sexo, str(self.sexo))

    @genero.setter
    def genero(self, value: str):
        normalized = str(value or '').strip().lower()
        mapping = {
            "f": "F",
            "femenino": "F",
            "m": "M",
            "masculino": "M",
            "otro": "otro",
        }
        self.sexo = mapping.get(normalized, "otro")

    @property
    def created_at(self):
        return self.creado_en

    @property
    def contacto_emergencia_parentesco(self):
        return None

    @contacto_emergencia_parentesco.setter
    def contacto_emergencia_parentesco(self, value):
        return None

    @property
    def nombre_completo(self) -> str:
        partes = [self.nombre, self.apellido_paterno, self.apellido_materno]
        return " ".join([p for p in partes if p])
