from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user, verify_doctor_patient_access
from app.models.medical_record import Expediente, Consulta
from app.models.patient import Paciente
from app.models.user import Usuario
from app.schemas.medical_record import ExpedienteResponse, ExpedienteUpdate, ConsultaResponse
from app.services.audit_service import registrar_auditoria

router = APIRouter()

@router.get("/patient/{patient_id}", response_model=ExpedienteResponse)
def get_patient_medical_record(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    # 1. Enforzar control de acceso estricto RBAC + ABAC (NOM-004)
    verify_doctor_patient_access(db, current_user, patient_id)

    expediente = db.query(Expediente).filter(Expediente.paciente_id == patient_id, Expediente.paciente_id.isnot(None)).first()
    if not expediente:
        raise HTTPException(status_code=404, detail="Expediente clínico no encontrado.")

    # Auditoría de acceso a datos personales sensibles (NOM-024)
    registrar_auditoria(db, current_user.id, "LECTURA", "ExpedienteClínico", entidad_id=str(expediente.id), detalles={"paciente_id": patient_id})
    return expediente

@router.put("/{record_id}", response_model=ExpedienteResponse)
def update_medical_record_antecedents(
    record_id: int,
    record_in: ExpedienteUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    expediente = db.query(Expediente).filter(Expediente.id == record_id, Expediente.paciente_id.isnot(None)).first()
    if not expediente:
        raise HTTPException(status_code=404, detail="Expediente clínico no encontrado.")

    # Enforzar control de acceso
    verify_doctor_patient_access(db, current_user, expediente.paciente_id)

    for field, value in record_in.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(expediente, field, value)

    db.commit()
    db.refresh(expediente)

    registrar_auditoria(db, current_user.id, "MODIFICACION", "ExpedienteClínico", entidad_id=str(expediente.id), detalles={"actualizacion": "antecedentes_alergias"})
    return expediente

@router.get("/patient/{patient_id}/timeline", response_model=List[ConsultaResponse])
def get_patient_consultation_timeline(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    verify_doctor_patient_access(db, current_user, patient_id)

    expediente = db.query(Expediente).filter(Expediente.paciente_id == patient_id, Expediente.paciente_id.isnot(None)).first()
    if not expediente:
        raise HTTPException(status_code=404, detail="Expediente clínico no encontrado.")

    consultas = db.query(Consulta).filter(Consulta.expediente_id == expediente.id, Consulta.eliminado_en.is_(None)).order_by(Consulta.fecha_consulta.desc()).all()
    
    registrar_auditoria(db, current_user.id, "LECTURA", "HistorialCronologico", entidad_id=str(expediente.id))
    return consultas
