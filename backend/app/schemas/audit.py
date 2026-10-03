from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.schemas.user import UsuarioResponse

class BitacoraResponse(BaseModel):
    id: int
    usuario_id: Optional[int] = None
    accion: str
    modulo: str
    entidad_id: Optional[str] = None
    detalles_json: Optional[str] = None
    ip_origen: Optional[str] = None
    created_at: datetime
    usuario: Optional[UsuarioResponse] = None

    class Config:
        from_attributes = True
