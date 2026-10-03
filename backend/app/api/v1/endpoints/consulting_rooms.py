from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, require_roles
from app.models.doctor import Consultorio
from app.models.user import Usuario
from app.schemas.doctor import ConsultorioCreate, ConsultorioResponse
from app.services.audit_service import registrar_auditoria

router = APIRouter()

@router.get("", response_model=List[ConsultorioResponse])
def list_consulting_rooms(db: Session = Depends(get_db)):
    return db.query(Consultorio).filter(Consultorio.activo == True).all()

@router.post("", response_model=ConsultorioResponse, status_code=status.HTTP_201_CREATED)
def create_consulting_room(
    room_in: ConsultorioCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles(["Administrador"]))
):
    existing = db.query(Consultorio).filter(Consultorio.nombre == room_in.nombre, Consultorio.activo == True).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El código de consultorio ya existe.")

    nuevo = Consultorio(
        codigo_sala=room_in.codigo_sala.upper().strip(),
        nombre=room_in.nombre.strip(),
        ubicacion_piso=room_in.ubicacion_piso
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)

    registrar_auditoria(db, current_user.id, "CREACION", "Consultorios", entidad_id=str(nuevo.id))
    return nuevo
