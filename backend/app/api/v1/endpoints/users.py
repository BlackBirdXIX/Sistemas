from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, require_roles
from app.models.user import Usuario
from app.schemas.user import UsuarioCreate, UsuarioUpdate, UsuarioResponse
from app.core.security import get_password_hash
from app.services.audit_service import registrar_auditoria

router = APIRouter()


@router.get("/roles")
def get_roles():
    return ["admin", "medico", "recepcion", "paciente"]


@router.get("", response_model=List[UsuarioResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles(["Administrador"]))
):
    return db.query(Usuario).filter(Usuario.activo == True).order_by(Usuario.id.desc()).all()


@router.post("", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_in: UsuarioCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles(["Administrador"]))
):
    username = user_in.username.lower().strip()
    existing = db.query(Usuario).filter(Usuario.username ==
                                        username, Usuario.activo == True).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="El nombre de usuario ya se encuentra registrado.")

    nuevo_usuario = Usuario(
        username=username,
        password_hash=get_password_hash(user_in.password),
        rol=user_in.rol,
        activo=True,
    )
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)

    registrar_auditoria(db, current_user.id, "CREACION", "Usuarios", entidad_id=str(
        nuevo_usuario.id), detalles={"username": nuevo_usuario.username, "rol": nuevo_usuario.rol})
    return nuevo_usuario


@router.put("/{user_id}", response_model=UsuarioResponse)
def update_user(
    user_id: int,
    user_in: UsuarioUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles(["Administrador"]))
):
    usuario = db.query(Usuario).filter(
        Usuario.id == user_id, Usuario.activo == True).first()
    if not usuario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Usuario no encontrado.")

    if user_in.username:
        usuario.username = user_in.username.lower().strip()
    if user_in.password:
        usuario.password_hash = get_password_hash(user_in.password)
    if user_in.rol is not None:
        usuario.rol = user_in.rol
    if user_in.activo is not None:
        usuario.activo = user_in.activo

    db.commit()
    db.refresh(usuario)

    registrar_auditoria(db, current_user.id, "MODIFICACION", "Usuarios", entidad_id=str(
        usuario.id), detalles={"username": usuario.username, "rol": usuario.rol})
    return usuario


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def soft_delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles(["Administrador"]))
):
    usuario = db.query(Usuario).filter(
        Usuario.id == user_id, Usuario.activo == True).first()
    if not usuario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Usuario no encontrado.")

    usuario.activo = False
    db.commit()

    registrar_auditoria(db, current_user.id, "ELIMINACION_LOGICA",
                        "Usuarios", entidad_id=str(user_id))
    return None
