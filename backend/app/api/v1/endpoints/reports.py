from datetime import datetime, date, timedelta, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.api.deps import get_db, require_roles
from app.models.appointment import Cita
from app.models.patient import Paciente
from app.models.doctor import Medico
from app.models.user import Usuario
from app.schemas.report import DashboardReportResponse
from app.services.audit_service import registrar_auditoria

router = APIRouter()


@router.get("/dashboard", response_model=DashboardReportResponse)
def get_dashboard_kpis(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles(
        ["Administrador", "Médico", "Recepcionista"]))
):
    today = date.today()

    # 1. Citas del día
    citas_today_query = db.query(Cita).filter(
        Cita.estado != 'eliminada',
        func.date(Cita.fecha_hora_inicio) == today
    )
    citas_hoy = citas_today_query.count()
    citas_completadas_hoy = citas_today_query.filter(
        Cita.estado == "completada").count()
    citas_canceladas_hoy = citas_today_query.filter(
        Cita.estado == "cancelada").count()

    # 2. Tasa de inasistencia (no_asistio / total historicos de citas completadas+no_asistio)
    total_asistencia = db.query(Cita).filter(
        Cita.estado != 'eliminada', Cita.estado.in_(["completada", "no_asistio"])).count()
    total_no_asistio = db.query(Cita).filter(
        Cita.estado != 'eliminada', Cita.estado == "no_asistio").count()
    tasa_inasistencia = round(
        (total_no_asistio / total_asistencia * 100), 1) if total_asistencia > 0 else 0.0

    # 3. Totales de pacientes y médicos
    total_pacientes = db.query(Paciente).filter(
        Paciente.activo == True).count()
    total_medicos = db.query(Medico).filter(Medico.activo == True).count()

    # 4. Citas por médico
    medicos = db.query(Medico).filter(Medico.activo == True).all()
    citas_por_medico = []
    for med in medicos:
        if med.usuario and med.usuario.medico_perfil:
            nombre = med.nombre_completo
        else:
            nombre = f"Médico #{med.id}"
        cnt = db.query(Cita).filter(Cita.medico_id == med.id,
                                    Cita.estado != 'eliminada').count()
        citas_por_medico.append({"medico_nombre": nombre, "total_citas": cnt})

    # 5. Ocupación semanal (últimos 7 días)
    dias_semana = []
    dias_nombre = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
    start_of_week = today - timedelta(days=today.weekday())
    for i in range(7):
        day_date = start_of_week + timedelta(days=i)
        cnt = db.query(Cita).filter(
            Cita.estado != 'eliminada',
            func.date(Cita.fecha_hora_inicio) == day_date
        ).count()
        dias_semana.append(
            {"dia": f"{dias_nombre[i]} {day_date.strftime('%d/%m')}", "total_citas": cnt})

    # 6. Pacientes nuevos por mes (últimos 6 meses)
    pacientes_mes = []
    for i in range(5, -1, -1):
        target_month = (today.month - i - 1) % 12 + 1
        target_year = today.year + (today.month - i - 1) // 12
        cnt = db.query(Paciente).filter(
            Paciente.activo == True,
            func.extract('year', Paciente.creado_en) == target_year,
            func.extract('month', Paciente.creado_en) == target_month
        ).count()
        mes_str = f"{target_month:02d}/{target_year}"
        pacientes_mes.append({"mes": mes_str, "total_pacientes": cnt})

    registrar_auditoria(db, current_user.id, "LECTURA", "DashboardReportes")

    return {
        "citas_hoy": citas_hoy,
        "citas_completadas_hoy": citas_completadas_hoy,
        "citas_canceladas_hoy": citas_canceladas_hoy,
        "tasa_inasistencia_porcentaje": tasa_inasistencia,
        "total_pacientes_activos": total_pacientes,
        "total_medicos": total_medicos,
        "citas_por_medico": citas_por_medico,
        "ocupacion_semanal": dias_semana,
        "pacientes_nuevos_mes": pacientes_mes
    }
