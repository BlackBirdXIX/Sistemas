from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from app.schemas.patient import PacienteResponse
from app.schemas.doctor import MedicoResponse

class DiagnosticoCreate(BaseModel):
    codigo_cie10: str
    descripcion: str
    tipo: str = "definitivo"

class DiagnosticoResponse(BaseModel):
    id: int
    codigo_cie10: str
    descripcion: str
    tipo: str

    class Config:
        from_attributes = True

class RecetaMedicamentoCreate(BaseModel):
    medicamento: str
    dosis: str
    frecuencia: str
    duracion_dias: int
    via_administracion: Optional[str] = "Oral"

class RecetaMedicamentoResponse(BaseModel):
    id: int
    medicamento: str
    dosis: str
    frecuencia: str
    duracion_dias: int
    via_administracion: str

    class Config:
        from_attributes = True

class RecetaCreate(BaseModel):
    indicaciones_generales: Optional[str] = None
    medicamentos: List[RecetaMedicamentoCreate]

class RecetaResponse(BaseModel):
    id: int
    consulta_id: int
    codigo_folio: str
    fecha_emision: datetime
    indicaciones_generales: Optional[str] = None
    medicamentos: List[RecetaMedicamentoResponse] = []

    class Config:
        from_attributes = True

class ConsultaCreate(BaseModel):
    expediente_id: int
    cita_id: Optional[int] = None
    motivo_consulta: str
    exploracion_fisica: Optional[str] = None
    peso_kg: Optional[Decimal] = None
    talla_cm: Optional[Decimal] = None
    presion_arterial: Optional[str] = None
    frecuencia_cardiaca: Optional[int] = None
    temperatura_c: Optional[Decimal] = None
    saturacion_oxigeno: Optional[int] = None
    plan_tratamiento: Optional[str] = None
    notas_evolucion: Optional[str] = None
    diagnosticos: List[DiagnosticoCreate] = []
    receta: Optional[RecetaCreate] = None

class ConsultaResponse(BaseModel):
    id: int
    expediente_id: int
    cita_id: Optional[int] = None
    medico_id: int
    fecha_hora: datetime
    motivo_consulta: str
    exploracion_fisica: Optional[str] = None
    peso_kg: Optional[Decimal] = None
    talla_cm: Optional[Decimal] = None
    presion_arterial: Optional[str] = None
    frecuencia_cardiaca: Optional[int] = None
    temperatura_c: Optional[Decimal] = None
    saturacion_oxigeno: Optional[int] = None
    plan_tratamiento: Optional[str] = None
    notas_evolucion: Optional[str] = None
    medico: Optional[MedicoResponse] = None
    diagnosticos: List[DiagnosticoResponse] = []
    receta: Optional[RecetaResponse] = None

    class Config:
        from_attributes = True

class ExpedienteUpdate(BaseModel):
    antecedentes_heredofamiliares: Optional[str] = None
    antecedentes_patologicos: Optional[str] = None
    antecedentes_no_patologicos: Optional[str] = None
    alergias: Optional[str] = None
    grupo_sanguineo: Optional[str] = None

class ExpedienteResponse(BaseModel):
    id: int
    paciente_id: int
    numero_expediente: str
    antecedentes_heredofamiliares: Optional[str] = None
    antecedentes_patologicos: Optional[str] = None
    antecedentes_no_patologicos: Optional[str] = None
    alergias: Optional[str] = None
    grupo_sanguineo: Optional[str] = None
    created_at: datetime
    paciente: Optional[PacienteResponse] = None

    class Config:
        from_attributes = True
