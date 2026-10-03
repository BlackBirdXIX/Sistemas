from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date, datetime


class PacienteCreate(BaseModel):
    curp: str
    nombre: str
    primer_apellido: str
    segundo_apellido: Optional[str] = None
    fecha_nacimiento: date
    genero: str
    telefono: str
    email: Optional[EmailStr] = None
    direccion: Optional[str] = None
    contacto_emergencia_nombre: Optional[str] = None
    contacto_emergencia_telefono: Optional[str] = None
    contacto_emergencia_parentesco: Optional[str] = None


class PacienteUpdate(BaseModel):
    curp: Optional[str] = None
    nombre: Optional[str] = None
    primer_apellido: Optional[str] = None
    segundo_apellido: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    genero: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[EmailStr] = None
    direccion: Optional[str] = None
    contacto_emergencia_nombre: Optional[str] = None
    contacto_emergencia_telefono: Optional[str] = None
    contacto_emergencia_parentesco: Optional[str] = None


class PacienteResponse(BaseModel):
    id: int
    curp: str
    nombre: str
    primer_apellido: str
    segundo_apellido: Optional[str] = None
    fecha_nacimiento: date
    genero: str
    telefono: str
    email: Optional[str] = None
    direccion: Optional[str] = None
    contacto_emergencia_nombre: Optional[str] = None
    contacto_emergencia_telefono: Optional[str] = None
    contacto_emergencia_parentesco: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
