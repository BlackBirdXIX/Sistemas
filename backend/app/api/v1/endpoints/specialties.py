from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, require_roles
from app.models.doctor import Especialidad
from app.models.user import Usuario
from app.schemas.doctor import EspecialidadCreate, EspecialidadResponse
from app.services.audit_service import registrar_auditoria

router = APIRouter()

@router.get("", response_model=List[EspecialidadResponse])
def list_specialties(db: Session = Depends(get_db)):
    return db.query(Especialidad).filter(Especialidad.activo == True).all()

@router.post("", response_model=EspecialidadResponse, status_code=status.HTTP_201_CREATED)
def create_specialty(
    spec_in: EspecialidadCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles(["Administrador"]))
):
    existing = db.query(Especialidad).filter(Especialidad.nombre.ilike(spec_in.nombre), Especialidad.activo == True).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Especialidad ya existente.")

    nueva = Especialidad(
        nombre=spec_in.nombre.strip(),
        descripcion=spec_in.descripcion
    )
    db.add(nueva)
    db.commit()
    db.refresh(nueva)

    registrar_auditoria(db, current_user.id, "CREACION", "Especialidades", entidad_id=str(nueva.id))
    return nueva
