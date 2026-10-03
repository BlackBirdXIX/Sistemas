from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime
from app.api.deps import get_db, get_current_user
from app.core.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    check_login_lockout,
    record_failed_login,
    reset_failed_logins,
    decode_token
)
from app.schemas.token import Token
from app.schemas.user import UsuarioResponse, UserLogin
from app.models.user import Usuario
from app.services.audit_service import registrar_auditoria

router = APIRouter()


@router.post("/login", response_model=Token)
def login(
    request: Request,
    login_data: UserLogin,
    db: Session = Depends(get_db)
):
    ip_client = request.client.host if request.client else "127.0.0.1"
    username = login_data.username.lower().strip()

    # 1. Verificar bloqueo temporal
    is_locked, lock_msg = check_login_lockout(username)
    if is_locked:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=lock_msg
        )

    # 2. Buscar usuario por username
    usuario = db.query(Usuario).filter(
        Usuario.username == username,
        Usuario.activo == True
    ).first()

    if not usuario or not verify_password(login_data.password, usuario.password_hash):
        intentos = record_failed_login(username)
        restantes = 5 - intentos
        msg = "Credenciales incorrectas."
        if restantes > 0:
            msg += f" Le quedan {restantes} intento(s) antes del bloqueo temporal."
        else:
            msg += " Su cuenta ha sido bloqueada temporalmente por 15 minutos."
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=msg)

    if not usuario.activo:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Usuario inactivo.")

    # 3. Login exitoso
    reset_failed_logins(username)

    # Actualizar ultimo_login
    usuario.ultimo_login = datetime.utcnow()
    db.commit()

    rol = usuario.rol
    access_token  = create_access_token(subject=usuario.id, role=rol)
    refresh_token = create_refresh_token(subject=usuario.id, role=rol)

    try:
        registrar_auditoria(db, usuario.id, "login", "usuarios", detalles={"rol": rol}, ip_origen=ip_client)
    except Exception:
        pass  # La auditoría no debe bloquear el login

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/refresh", response_model=Token)
def refresh_token_endpoint(refresh_token: str, db: Session = Depends(get_db)):
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh Token inválido o expirado")

    user_id = payload.get("sub")
    usuario = db.query(Usuario).filter(Usuario.id == int(user_id), Usuario.activo == True).first()
    if not usuario:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no encontrado")

    rol = usuario.rol
    new_access_token  = create_access_token(subject=usuario.id, role=rol)
    new_refresh_token = create_refresh_token(subject=usuario.id, role=rol)

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }


@router.get("/me", response_model=UsuarioResponse)
def read_current_user(current_user: Usuario = Depends(get_current_user)):
    return current_user
