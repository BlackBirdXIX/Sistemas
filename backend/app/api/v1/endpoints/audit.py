from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.api.deps import get_db, require_roles
from app.models.audit import BitacoraAuditoria
from app.models.user import Usuario
from app.schemas.audit import BitacoraResponse

router = APIRouter()

@router.get("", response_model=List[BitacoraResponse])
def get_audit_logs(
    modulo: Optional[str] = Query(None),
    accion: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles(["Administrador"]))
):
    query = db.query(BitacoraAuditoria)
    if modulo:
        query = query.filter(BitacoraAuditoria.modulo == modulo)
    if accion:
        query = query.filter(BitacoraAuditoria.accion == accion)
    return query.order_by(BitacoraAuditoria.created_at.desc()).limit(limit).all()
