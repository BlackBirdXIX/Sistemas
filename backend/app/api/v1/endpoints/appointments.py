from typing import List, Optional
from datetime import datetime, timedelta, timezone, date
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.api.deps import get_db, require_roles, get_current_user, normalize_role_name
from app.models.appointment import Cita
from app.models.patient import Paciente
from app.models.doctor import Medico
from app.models.user import Usuario
from app.schemas.appointment import CitaCreate, CitaUpdateStatus, CitaReschedule, CitaResponse
from app.services.appointment_service import validar_disponibilidad_cita
from app.services.audit_service import registrar_auditoria

router = APIRouter()


@router.get("", response_model=List[CitaResponse])
def list_appointments(
    medico_id: Optional[int] = Query(None),
    paciente_id: Optional[int] = Query(None),
    fecha: Optional[str] = Query(None, description="Fecha YYYY-MM-DD"),
    estado: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    query = db.query(Cita).filter(Cita.estado != 'eliminada')

    # Si es Médico, por defecto se restringe a sus propias citas (salvo que sea Admin)
    rol_nombre = normalize_role_name(current_user.rol)
    if rol_nombre == "medico":
        medico_perfil = db.query(Medico).filter(
            Medico.usuario_id == current_user.id).first()
        if medico_perfil:
            query = query.filter(Cita.medico_id == medico_perfil.id)
    elif medico_id:
        query = query.filter(Cita.medico_id == medico_id)

    if paciente_id:
        query = query.filter(Cita.paciente_id == paciente_id)
    if estado:
        query = query.filter(Cita.estado == estado)
    if fecha:
        try:
            fecha_dt = datetime.strptime(fecha, "%Y-%m-%d").date()
            query = query.filter(func.date(Cita.fecha_hora_inicio) == fecha_dt)
        except ValueError:
            raise HTTPException(
                status_code=400, detail="Formato de fecha inválido. Use YYYY-MM-DD.")

    return query.order_by(Cita.fecha_hora_inicio.asc()).all()


@router.post("", response_model=CitaResponse, status_code=status.HTTP_201_CREATED)
def create_appointment(
    cita_in: CitaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles(
        ["Administrador", "Recepcionista", "Médico"]))
):
    # Validar existencia de entidades
    paciente = db.query(Paciente).filter(
        Paciente.id == cita_in.paciente_id, Paciente.activo == True).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado.")

    medico = db.query(Medico).filter(
        Medico.id == cita_in.medico_id, Medico.activo == True).first()
    if not medico:
        raise HTTPException(status_code=404, detail="Médico no encontrado.")

    duracion = cita_in.duracion_minutos or medico.duracion_consulta_min or 30
    inicio = cita_in.fecha_hora_inicio
    fin = inicio + timedelta(minutes=duracion)

    # Validar anti-empalmes en Backend para Médico y Consultorio
    validar_disponibilidad_cita(
        db, cita_in.medico_id, cita_in.consultorio_id, inicio, fin)

    nueva_cita = Cita(
        paciente_id=cita_in.paciente_id,
        medico_id=cita_in.medico_id,
        consultorio_id=cita_in.consultorio_id,
        fecha_hora_inicio=inicio,
        fecha_hora_fin=fin,
        estado="programada",
        tipo_recordatorio=cita_in.tipo_recordatorio or "email"
    )
    db.add(nueva_cita)
    db.commit()
    db.refresh(nueva_cita)

    registrar_auditoria(db, current_user.id, "CREACION", "Citas", entidad_id=str(nueva_cita.id), detalles={
        "paciente": paciente.nombre_completo,
        "inicio": inicio.strftime("%Y-%m-%d %H:%M")
    })
    return nueva_cita


@router.put("/{appointment_id}/reschedule", response_model=CitaResponse)
def reschedule_appointment(
    appointment_id: int,
    reschedule_in: CitaReschedule,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles(
        ["Administrador", "Recepcionista", "Médico"]))
):
    cita = db.query(Cita).filter(Cita.id == appointment_id,
                                 Cita.estado != 'eliminada').first()
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada.")

    consultorio_id = reschedule_in.consultorio_id or cita.consultorio_id
    duracion = int(
        (cita.fecha_hora_fin - cita.fecha_hora_inicio).total_seconds() / 60)
    nuevo_inicio = reschedule_in.nueva_fecha_hora_inicio
    nuevo_fin = nuevo_inicio + timedelta(minutes=duracion)

    # Validar disponibilidad ignorando esta misma cita
    validar_disponibilidad_cita(
        db, cita.medico_id, consultorio_id, nuevo_inicio, nuevo_fin, cita_id_actual=cita.id)

    cita.fecha_hora_inicio = nuevo_inicio
    cita.fecha_hora_fin = nuevo_fin
    cita.consultorio_id = consultorio_id
    cita.estado = "programada"

    db.commit()
    db.refresh(cita)

    registrar_auditoria(db, current_user.id, "MODIFICACION", "Citas", entidad_id=str(cita.id), detalles={
                        "accion": "reprogramar", "nuevo_inicio": nuevo_inicio.strftime("%Y-%m-%d %H:%M")})
    return cita


@router.put("/{appointment_id}/status", response_model=CitaResponse)
def update_appointment_status(
    appointment_id: int,
    status_in: CitaUpdateStatus,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles(
        ["Administrador", "Recepcionista", "Médico"]))
):
    cita = db.query(Cita).filter(Cita.id == appointment_id,
                                 Cita.estado != 'eliminada').first()
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada.")

    if status_in.estado == "cancelada" and not status_in.motivo_cancelacion:
        raise HTTPException(
            status_code=400, detail="Es obligatorio proporcionar un motivo de cancelación.")

    cita.estado = status_in.estado
    if status_in.motivo_cancelacion:
        cita.motivo_cancelacion = status_in.motivo_cancelacion

    db.commit()
    db.refresh(cita)

    registrar_auditoria(db, current_user.id, "MODIFICACION", "Citas", entidad_id=str(
        cita.id), detalles={"nuevo_estado": status_in.estado})
    return cita


@router.post("/{appointment_id}/reminder")
def send_appointment_reminder(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles(
        ["Administrador", "Recepcionista", "Médico"]))
):
    cita = db.query(Cita).filter(Cita.id == appointment_id,
                                 Cita.estado != 'eliminada').first()
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada.")

    cita.recordatorio_enviado = datetime.now(timezone.utc)
    db.commit()

    mensaje = f"Simulación de recordatorio ({cita.tipo_recordatorio.upper()}) enviado con éxito al paciente {cita.paciente.nombre_completo} para su cita el {cita.fecha_hora_inicio.strftime('%d/%m/%Y a las %H:%M hrs')}."
    registrar_auditoria(db, current_user.id, "ENVO_RECORDATORIO", "Citas", entidad_id=str(
        cita.id), detalles={"tipo": cita.tipo_recordatorio})

    return {"status": "ok", "message": mensaje}
