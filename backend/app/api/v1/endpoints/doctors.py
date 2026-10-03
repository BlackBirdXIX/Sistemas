from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, require_roles
from app.models.doctor import Medico, HorarioMedico
from app.models.user import Usuario
from app.schemas.doctor import MedicoCreate, MedicoResponse, HorarioMedicoCreate, HorarioMedicoResponse
from app.services.audit_service import registrar_auditoria

router = APIRouter()

@router.get("", response_model=List[MedicoResponse])
def list_doctors(db: Session = Depends(get_db)):
    return db.query(Medico).filter(Medico.activo == True).all()

@router.post("", response_model=MedicoResponse, status_code=status.HTTP_201_CREATED)
def create_doctor(
    doctor_in: MedicoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles(["Administrador"]))
):
    # Validar cedula
    existing_cedula = db.query(Medico).filter(Medico.cedula_profesional == doctor_in.cedula_profesional.strip(), Medico.activo == True).first()
    if existing_cedula:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La cédula profesional ya se encuentra registrada.")

    usuario = db.query(Usuario).filter(Usuario.id == doctor_in.usuario_id, Usuario.activo == True).first()
    if not usuario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario asignado no existe.")

    nuevo_medico = Medico(
        usuario_id=doctor_in.usuario_id,
        cedula_profesional=doctor_in.cedula_profesional.strip(),
        especialidad_id=doctor_in.especialidad_id,
        consultorio_id=doctor_in.consultorio_id,
        duracion_consulta_min=doctor_in.duracion_consulta_min
    )
    db.add(nuevo_medico)
    db.commit()
    db.refresh(nuevo_medico)

    registrar_auditoria(db, current_user.id, "CREACION", "Médicos", entidad_id=str(nuevo_medico.id))
    return nuevo_medico

@router.get("/{doctor_id}", response_model=MedicoResponse)
def get_doctor(doctor_id: int, db: Session = Depends(get_db)):
    medico = db.query(Medico).filter(Medico.id == doctor_id, Medico.activo == True).first()
    if not medico:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Médico no encontrado.")
    return medico

@router.post("/{doctor_id}/schedules", response_model=List[HorarioMedicoResponse])
def set_doctor_schedules(
    doctor_id: int,
    schedules_in: List[HorarioMedicoCreate],
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles(["Administrador", "Médico"]))
):
    medico = db.query(Medico).filter(Medico.id == doctor_id, Medico.activo == True).first()
    if not medico:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Médico no encontrado.")

    # Reemplazar horarios
    db.query(HorarioMedico).filter(HorarioMedico.medico_id == doctor_id).delete()
    
    nuevos_horarios = []
    for sch in schedules_in:
        item = HorarioMedico(
            medico_id=doctor_id,
            dia_semana=sch.dia_semana,
            hora_inicio=sch.hora_inicio,
            hora_fin=sch.hora_fin
        )
        db.add(item)
        nuevos_horarios.append(item)

    db.commit()
    registrar_auditoria(db, current_user.id, "MODIFICACION", "HorariosMédicos", entidad_id=str(doctor_id))
    return nuevos_horarios
