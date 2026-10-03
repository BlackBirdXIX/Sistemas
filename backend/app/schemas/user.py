from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime


class UserLogin(BaseModel):
    username: str
    password: str


class UsuarioCreate(BaseModel):
    username: str
    password: str
    rol: Literal['admin', 'medico', 'recepcion', 'paciente']


class UsuarioUpdate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    rol: Optional[Literal['admin', 'medico', 'recepcion', 'paciente']] = None
    activo: Optional[bool] = None


class UsuarioResponse(BaseModel):
    id: int
    username: str
    rol: str
    activo: bool
    ultimo_login: Optional[datetime] = None
    creado_en: datetime

    class Config:
        from_attributes = True
