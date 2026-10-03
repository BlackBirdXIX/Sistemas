from typing import Optional, Any, Literal
from sqlalchemy.orm import Session
from app.models.audit import BitacoraAuditoria

# Acciones válidas según el ENUM del esquema Sonnet
AccionAuditoria = Literal['login', 'logout', 'consulta', 'crear', 'modificar', 'cancelar', 'eliminar_logico']

def registrar_auditoria(
    db: Session,
    usuario_id: Optional[int],
    accion: str,
    entidad: str,
    entidad_id: Optional[int] = None,
    detalles: Optional[Any] = None,
    ip_origen: Optional[str] = "127.0.0.1"
):
    """
    Registra un evento en la Bitácora de Auditoría (NOM-024-SSA3-2012 / LFPDPPP).
    accion debe ser uno de: login, logout, consulta, crear, modificar, cancelar, eliminar_logico
    """
    # Normalizar acción al ENUM del esquema
    _mapa_accion = {
        "LOGIN_EXITOSO": "login",
        "LOGIN_FALLIDO": "login",
        "LOGIN_BLOQUEADO": "login",
        "LOGOUT": "logout",
        "LECTURA": "consulta",
        "CREACION": "crear",
        "MODIFICACION": "modificar",
        "CANCELACION": "cancelar",
        "ELIMINACION_LOGICA": "eliminar_logico",
    }
    accion_norm = _mapa_accion.get(accion.upper(), accion.lower())
    # Validar que sea un valor del ENUM
    valid_acciones = {'login', 'logout', 'consulta', 'crear', 'modificar', 'cancelar', 'eliminar_logico'}
    if accion_norm not in valid_acciones:
        accion_norm = 'consulta'  # fallback seguro

    detalle_dict = None
    if detalles is not None:
        if isinstance(detalles, dict):
            detalle_dict = detalles
        else:
            detalle_dict = {"info": str(detalles)}

    registro = BitacoraAuditoria(
        usuario_id=usuario_id,
        accion=accion_norm,
        entidad=entidad[:50],  # max 50 chars
        entidad_id=entidad_id,
        detalle=detalle_dict,
        ip=ip_origen
    )
    db.add(registro)
    db.commit()
