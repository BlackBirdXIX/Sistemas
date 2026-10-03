from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.schemas.patient import PacienteResponse
from app.schemas.doctor import MedicoResponse, ConsultorioResponse

class CitaCreate(BaseModel):
    paciente_id: int
    medico_id: int
    consultorio_id: int
    fecha_hora_inicio: datetime
    duracion_minutos: Optional[int] = 30
    tipo_recordatorio: Optional[str] = "email"

class CitaUpdateStatus(BaseModel):
    estado: str  # programada, confirmada, en_curso, completada, cancelada, no_asistio
    motivo_cancelacion: Optional[str] = None

class CitaReschedule(BaseModel):
    nueva_fecha_hora_inicio: datetime
    consultorio_id: Optional[int] = None

class CitaResponse(BaseModel):
    id: int
    paciente_id: int
    medico_id: int
    consultorio_id: int
    fecha_hora_inicio: datetime
    fecha_hora_fin: datetime
    estado: str
    motivo_cancelacion: Optional[str] = None
    tipo_recordatorio: str
    recordatorio_enviado: Optional[datetime] = None
    created_at: datetime

    paciente: Optional[PacienteResponse] = None
    medico: Optional[MedicoResponse] = None
    consultorio: Optional[ConsultorioResponse] = None

    class Config:
        from_attributes = True
