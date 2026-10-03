from typing import List, Optional
from datetime import datetime, timezone
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.api.deps import get_db, require_roles
from app.models.patient import Paciente
from app.models.medical_record import Expediente
from app.models.user import Usuario
from app.schemas.patient import PacienteCreate, PacienteUpdate, PacienteResponse
from app.services.audit_service import registrar_auditoria

router = APIRouter()


def normalize_paciente_sexo(value: str | None) -> str:
    if value is None:
        return "otro"
    normalized = str(value).strip().lower()
    mapping = {
        "f": "F",
        "femenino": "F",
        "m": "M",
        "masculino": "M",
        "otro": "otro",
    }
    return mapping.get(normalized, "otro")


@router.get("", response_model=List[PacienteResponse])
def list_and_search_patients(
    q: Optional[str] = Query(
        None, description="Búsqueda por nombre, CURP o teléfono"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles(
        ["Administrador", "Médico", "Recepcionista"]))
):
    query = db.query(Paciente).filter(Paciente.activo == True)
    if q:
        search = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Paciente.nombre.ilike(search),
                Paciente.apellido_paterno.ilike(search),
                Paciente.apellido_materno.ilike(search),
                Paciente.curp.ilike(search),
                Paciente.telefono.ilike(search)
            )
        )
    return query.order_by(Paciente.creado_en.desc()).all()


@router.post("", response_model=PacienteResponse, status_code=status.HTTP_201_CREATED)
def create_patient(
    patient_in: PacienteCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles(
        ["Administrador", "Recepcionista", "Médico"]))
):
    # Validar duplicidad de CURP
    curp_upper = patient_in.curp.upper().strip()
    existing = db.query(Paciente).filter(
        Paciente.curp == curp_upper, Paciente.activo == True).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Ya existe un paciente registrado con la CURP {curp_upper}.")

    nuevo_paciente = Paciente(
        curp=curp_upper,
        nombre=patient_in.nombre.strip(),
        apellido_paterno=patient_in.primer_apellido.strip(),
        apellido_materno=patient_in.segundo_apellido.strip(
        ) if patient_in.segundo_apellido else None,
        fecha_nacimiento=patient_in.fecha_nacimiento,
        sexo=normalize_paciente_sexo(patient_in.genero),
        telefono=patient_in.telefono.strip(),
        email=patient_in.email.lower() if patient_in.email else None,
        direccion=patient_in.direccion,
        contacto_emergencia_nombre=patient_in.contacto_emergencia_nombre,
        contacto_emergencia_telefono=patient_in.contacto_emergencia_telefono,
    )
    db.add(nuevo_paciente)
    db.flush()

    # Auto-crear el Expediente Clínico asignado (NOM-004-SSA3-2012)
    folio_expediente = f"EXP-{datetime.now().strftime('%Y%m')}-{nuevo_paciente.id:04d}"
    nuevo_expediente = Expediente(
        paciente_id=nuevo_paciente.id,
        numero_expediente=folio_expediente
    )
    db.add(nuevo_expediente)

    db.commit()
    db.refresh(nuevo_paciente)

    registrar_auditoria(db, current_user.id, "CREACION", "Pacientes", entidad_id=str(
        nuevo_paciente.id), detalles={"curp": curp_upper, "nombre": nuevo_paciente.nombre_completo})
    return nuevo_paciente


@router.get("/{patient_id}", response_model=PacienteResponse)
def get_patient_detail(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles(
        ["Administrador", "Médico", "Recepcionista"]))
):
    paciente = db.query(Paciente).filter(
        Paciente.id == patient_id, Paciente.activo == True).first()
    if not paciente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Paciente no encontrado.")
    return paciente


@router.put("/{patient_id}", response_model=PacienteResponse)
def update_patient(
    patient_id: int,
    patient_in: PacienteUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles(
        ["Administrador", "Recepcionista", "Médico"]))
):
    paciente = db.query(Paciente).filter(
        Paciente.id == patient_id, Paciente.activo == True).first()
    if not paciente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Paciente no encontrado.")

    for field, value in patient_in.model_dump(exclude_unset=True).items():
        if field == "curp" and value:
            setattr(paciente, field, value.upper().strip())
        elif field == "primer_apellido" and value:
            setattr(paciente, "apellido_paterno", value.strip())
        elif field == "segundo_apellido" and value:
            setattr(paciente, "apellido_materno", value.strip())
        elif field == "genero" and value:
            setattr(paciente, "sexo", normalize_paciente_sexo(value))
        elif field == "email" and value:
            setattr(paciente, field, value.lower().strip())
        elif field == "contacto_emergencia_parentesco":
            continue
        elif value is not None and hasattr(paciente, field):
            setattr(paciente, field, value)

    db.commit()
    db.refresh(paciente)

    registrar_auditoria(db, current_user.id, "MODIFICACION", "Pacientes", entidad_id=str(
        paciente.id), detalles={"curp": paciente.curp})
    return paciente


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
def soft_delete_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(
        require_roles(["Administrador", "Recepcionista"]))
):
    paciente = db.query(Paciente).filter(
        Paciente.id == patient_id, Paciente.activo == True).first()
    if not paciente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Paciente no encontrado.")

    paciente.activo = False
    db.commit()

    registrar_auditoria(db, current_user.id, "ELIMINACION_LOGICA",
                        "Pacientes", entidad_id=str(patient_id))
    return None
