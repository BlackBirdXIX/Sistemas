from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, not_
from fastapi import HTTPException, status
from app.models.appointment import Cita

def validar_disponibilidad_cita(
    db: Session,
    medico_id: int,
    consultorio_id: int,
    fecha_hora_inicio: datetime,
    fecha_hora_fin: datetime,
    cita_id_actual: int = None
):
    """
    Verifica que NO existan empalmes de horario para el Médico ni para el Consultorio.
    Condición de empalme: (Inicio_existente < Fin_propuesto) AND (Fin_existente > Inicio_propuesto)
    Ignora citas canceladas o eliminadas.
    """
    # 1. Empalme del Médico
    query_medico = db.query(Cita).filter(
        Cita.estado != 'eliminada',
        Cita.medico_id == medico_id,
        Cita.estado.notin_(["cancelada"]),
        Cita.fecha_hora_inicio < fecha_hora_fin,
        Cita.fecha_hora_fin > fecha_hora_inicio
    )
    if cita_id_actual:
        query_medico = query_medico.filter(Cita.id != cita_id_actual)

    empalme_medico = query_medico.first()
    if empalme_medico:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"El médico ya tiene una cita agendada en ese horario ({empalme_medico.fecha_hora_inicio.strftime('%H:%M')} - {empalme_medico.fecha_hora_fin.strftime('%H:%M')})."
        )

    # 2. Empalme del Consultorio
    query_consultorio = db.query(Cita).filter(
        Cita.estado != 'eliminada',
        Cita.consultorio_id == consultorio_id,
        Cita.estado.notin_(["cancelada"]),
        Cita.fecha_hora_inicio < fecha_hora_fin,
        Cita.fecha_hora_fin > fecha_hora_inicio
    )
    if cita_id_actual:
        query_consultorio = query_consultorio.filter(Cita.id != cita_id_actual)

    empalme_consultorio = query_consultorio.first()
    if empalme_consultorio:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"El consultorio ya se encuentra ocupado en ese horario por otra consulta."
        )
