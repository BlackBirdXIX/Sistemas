from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    users,
    patients,
    doctors,
    specialties,
    consulting_rooms,
    appointments,
    medical_records,
    consultations,
    prescriptions,
    reports,
    audit
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Autenticación"])
api_router.include_router(users.router, prefix="/users", tags=["Usuarios"])
api_router.include_router(patients.router, prefix="/patients", tags=["Pacientes"])
api_router.include_router(doctors.router, prefix="/doctors", tags=["Médicos"])
api_router.include_router(specialties.router, prefix="/specialties", tags=["Especialidades"])
api_router.include_router(consulting_rooms.router, prefix="/consulting-rooms", tags=["Consultorios"])
api_router.include_router(appointments.router, prefix="/appointments", tags=["Citas"])
api_router.include_router(medical_records.router, prefix="/medical-records", tags=["Expediente Clínico"])
api_router.include_router(consultations.router, prefix="/consultations", tags=["Consultas Médicas"])
api_router.include_router(prescriptions.router, prefix="/prescriptions", tags=["Recetas Médicas"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reportes"])
api_router.include_router(audit.router, prefix="/audit-logs", tags=["Auditoría"])
