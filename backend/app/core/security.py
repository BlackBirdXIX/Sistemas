from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Tuple
from jose import jwt, JWTError
import bcrypt
from app.core.config import settings

# Rastreos de intentos fallidos en memoria por email: {email: (intentos, bloqueado_hasta_datetime)}
FAILED_LOGIN_ATTEMPTS: Dict[str, Tuple[int, Optional[datetime]]] = {}
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 15

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    # Truncar a 72 bytes por norma de bcrypt si excede
    pwd_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def check_login_lockout(email: str) -> Tuple[bool, Optional[str]]:
    """
    Retorna (esta_bloqueado, mensaje_error).
    Si sobrepasa 5 intentos y el tiempo de bloqueo no ha expirado, bloquea.
    """
    if email in FAILED_LOGIN_ATTEMPTS:
        attempts, lockout_until = FAILED_LOGIN_ATTEMPTS[email]
        if lockout_until and datetime.now(timezone.utc) < lockout_until:
            remaining = int((lockout_until - datetime.now(timezone.utc)).total_seconds() / 60) + 1
            return True, f"Cuenta bloqueada temporalmente por 5 intentos fallidos. Intente de nuevo en {remaining} minuto(s)."
        elif lockout_until and datetime.now(timezone.utc) >= lockout_until:
            # Expiró el tiempo de bloqueo, reiniciamos el contador
            FAILED_LOGIN_ATTEMPTS[email] = (0, None)
    return False, None

def record_failed_login(email: str) -> int:
    """Registra intento fallido y activa bloqueo si alcanza los 5 intentos."""
    attempts, _ = FAILED_LOGIN_ATTEMPTS.get(email, (0, None))
    attempts += 1
    lockout_until = None
    if attempts >= MAX_FAILED_ATTEMPTS:
        lockout_until = datetime.now(timezone.utc) + timedelta(minutes=LOCKOUT_MINUTES)
    FAILED_LOGIN_ATTEMPTS[email] = (attempts, lockout_until)
    return attempts

def reset_failed_logins(email: str):
    """Limpia los intentos fallidos al autenticarse exitosamente."""
    if email in FAILED_LOGIN_ATTEMPTS:
        del FAILED_LOGIN_ATTEMPTS[email]

def create_access_token(subject: str, role: str, expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "sub": str(subject),
        "role": role,
        "type": "access",
        "exp": expire
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def create_refresh_token(subject: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)
    to_encode = {
        "sub": str(subject),
        "role": role,
        "type": "refresh",
        "exp": expire
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None
