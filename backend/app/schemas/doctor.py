from pydantic import BaseModel
from typing import Optional, List
from datetime import time
from app.schemas.user import UsuarioResponse

class EspecialidadCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None

class EspecialidadResponse(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str] = None

    class Config:
        from_attributes = True

class ConsultorioCreate(BaseModel):
    codigo_sala: str
    nombre: str
    ubicacion_piso: Optional[str] = None

class ConsultorioResponse(BaseModel):
    id: int
    codigo_sala: str
    nombre: str
    ubicacion_piso: Optional[str] = None

    class Config:
        from_attributes = True

class HorarioMedicoCreate(BaseModel):
    dia_semana: int  # 0=Lunes, 6=Domingo
    hora_inicio: time
    hora_fin: time

class HorarioMedicoResponse(BaseModel):
    id: int
    dia_semana: int
    hora_inicio: time
    hora_fin: time

    class Config:
        from_attributes = True

class MedicoCreate(BaseModel):
    usuario_id: int
    cedula_profesional: str
    especialidad_id: int
    consultorio_id: Optional[int] = None
    duracion_consulta_min: int = 30

class MedicoResponse(BaseModel):
    id: int
    usuario_id: int
    cedula_profesional: str
    especialidad_id: int
    consultorio_id: Optional[int] = None
    duracion_consulta_min: int
    usuario: UsuarioResponse
    especialidad: EspecialidadResponse
    consultorio: Optional[ConsultorioResponse] = None
    horarios: List[HorarioMedicoResponse] = []

    class Config:
        from_attributes = True
