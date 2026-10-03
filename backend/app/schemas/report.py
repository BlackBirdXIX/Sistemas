from pydantic import BaseModel
from typing import List, Dict, Any

class CitasPorMedicoStat(BaseModel):
    medico_nombre: str
    total_citas: int

class OcupacionSemanalStat(BaseModel):
    dia: str
    total_citas: int

class PacientesNuevosMesStat(BaseModel):
    mes: str
    total_pacientes: int

class DashboardReportResponse(BaseModel):
    citas_hoy: int
    citas_completadas_hoy: int
    citas_canceladas_hoy: int
    tasa_inasistencia_porcentaje: float
    total_pacientes_activos: int
    total_medicos: int
    citas_por_medico: List[CitasPorMedicoStat]
    ocupacion_semanal: List[OcupacionSemanalStat]
    pacientes_nuevos_mes: List[PacientesNuevosMesStat]
