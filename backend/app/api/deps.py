import unicodedata
from typing import Generator, List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.security import decode_token
from app.models.user import Usuario
from app.models.doctor import Medico
from app.models.appointment import Cita

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def normalize_role_name(role: str | None) -> str:
    if role is None:
        return ""
    normalized = unicodedata.normalize("NFKD", str(role)).encode(
        "ascii", "ignore").decode("ascii")
    normalized = normalized.strip().lower()
    aliases = {
        "administrador": "admin",
        "admin": "admin",
        "medico": "medico",
        "med": "medico",
        "recepcionista": "recepcion",
        "recepcion": "recepcion",
        "paciente": "paciente",
    }
    return aliases.get(normalized, normalized)


def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> Usuario:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales de acceso",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_token(token)
    if payload is None or payload.get("type") != "access":
        raise credentials_exception

    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    usuario = db.query(Usuario).filter(
        Usuario.id == int(user_id),
        Usuario.activo == True
    ).first()
    if usuario is None:
        raise credentials_exception
    return usuario


def require_roles(allowed_roles: List[str]):
    """
    Control de Acceso Basado en Roles (RBAC).
    Verifica que el usuario actual posea uno de los roles permitidos.
    El campo rol es un ENUM string: 'admin', 'medico', 'recepcion', 'paciente'.
    """
    allowed_normalized = {normalize_role_name(role) for role in allowed_roles}

    def role_checker(current_user: Usuario = Depends(get_current_user)):
        if normalize_role_name(current_user.rol) not in allowed_normalized:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acceso denegado. Se requiere uno de los siguientes roles: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker


def verify_doctor_patient_access(db: Session, current_user: Usuario, paciente_id: int):
    """
    Control de Acceso Basado en Propiedad (ABAC).
    Un Médico solo puede acceder a pacientes que tienen o han tenido citas con él.
    Administradores tienen acceso global.
    Recepcionistas NO tienen acceso a expedientes clínicos.
    """
    rol = normalize_role_name(current_user.rol)

    if rol == "admin":
        return True

    if rol == "recepcion":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso restringido: Las recepcionistas no tienen permiso para consultar expedientes clínicos (NOM-004-SSA3-2012)."
        )

    if rol == "medico":
        medico = db.query(Medico).filter(
            Medico.usuario_id == current_user.id,
            Medico.activo == True
        ).first()
        if not medico:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                                detail="Perfil de médico no encontrado.")

        cita_relacionada = db.query(Cita).filter(
            Cita.medico_id == medico.id,
            Cita.paciente_id == paciente_id
        ).first()

        if not cita_relacionada:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acceso denegado. Solo puede consultar expedientes de pacientes asignados a sus citas."
            )
        return True

    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                        detail="Acceso no autorizado.")
