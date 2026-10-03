from typing import List
from datetime import datetime, timezone
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, require_roles, get_current_user, verify_doctor_patient_access, normalize_role_name
from app.models.medical_record import Expediente, Consulta, Diagnostico, Receta, RecetaMedicamento
from app.models.appointment import Cita
from app.models.doctor import Medico
from app.models.user import Usuario
from app.schemas.medical_record import ConsultaCreate, ConsultaResponse
from app.services.audit_service import registrar_auditoria

router = APIRouter()


@router.post("", response_model=ConsultaResponse, status_code=status.HTTP_201_CREATED)
def create_consultation(
    consult_in: ConsultaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_roles(["Administrador", "Médico"]))
):
    expediente = db.query(Expediente).filter(
        Expediente.id == consult_in.expediente_id, Expediente.paciente_id.isnot(None)).first()
    if not expediente:
        raise HTTPException(
            status_code=404, detail="Expediente no encontrado.")

    verify_doctor_patient_access(db, current_user, expediente.paciente_id)

    medico = db.query(Medico).filter(Medico.usuario_id ==
                                     current_user.id, Medico.activo == True).first()
    if not medico and normalize_role_name(current_user.rol) != "admin":
        raise HTTPException(
            status_code=403, detail="Perfil de médico no encontrado para este usuario.")

    medico_id = medico.id if medico else 1

    # 1. Registrar Consulta
    nueva_consulta = Consulta(
        expediente_id=consult_in.expediente_id,
        cita_id=consult_in.cita_id,
        medico_id=medico_id,
        motivo_consulta=consult_in.motivo_consulta,
        exploracion_fisica=consult_in.exploracion_fisica,
        peso_kg=consult_in.peso_kg,
        talla_cm=consult_in.talla_cm,
        presion_arterial=consult_in.presion_arterial,
        frecuencia_cardiaca=consult_in.frecuencia_cardiaca,
        temperatura_c=consult_in.temperatura_c,
        saturacion_oxigeno=consult_in.saturacion_oxigeno,
        plan_tratamiento=consult_in.plan_tratamiento,
        notas_evolucion=consult_in.notas_evolucion
    )
    db.add(nueva_consulta)
    db.flush()

    # 2. Registrar Diagnósticos CIE-10
    for diag in consult_in.diagnosticos:
        d_item = Diagnostico(
            consulta_id=nueva_consulta.id,
            codigo_cie10=diag.codigo_cie10.upper().strip(),
            descripcion=diag.descripcion.strip(),
            tipo=diag.tipo
        )
        db.add(d_item)

    # 3. Registrar Receta si viene incluida
    if consult_in.receta and consult_in.receta.medicamentos:
        folio = f"RX-{datetime.now().strftime('%Y%m%d')}-{nueva_consulta.id:04d}"
        nueva_receta = Receta(
            consulta_id=nueva_consulta.id,
            codigo_folio=folio,
            indicaciones_generales=consult_in.receta.indicaciones_generales
        )
        db.add(nueva_receta)
        db.flush()

        for med in consult_in.receta.medicamentos:
            m_item = RecetaMedicamento(
                receta_id=nueva_receta.id,
                medicamento=med.medicamento.strip(),
                dosis=med.dosis.strip(),
                frecuencia=med.frecuencia.strip(),
                duracion_dias=med.duracion_dias,
                via_administracion=med.via_administracion or "Oral"
            )
            db.add(m_item)

    # 4. Si la consulta proviene de una Cita, marcar la Cita como 'completada'
    if consult_in.cita_id:
        cita = db.query(Cita).filter(Cita.id == consult_in.cita_id).first()
        if cita:
            cita.estado = "completada"

    db.commit()
    db.refresh(nueva_consulta)

    registrar_auditoria(db, current_user.id, "CREACION", "ConsultaMédica", entidad_id=str(
        nueva_consulta.id), detalles={"motivo": nueva_consulta.motivo_consulta})
    return nueva_consulta


@router.get("/{consultation_id}", response_model=ConsultaResponse)
def get_consultation_detail(
    consultation_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    consulta = db.query(Consulta).filter(
        Consulta.id == consultation_id, Consulta.eliminado_en.is_(None)).first()
    if not consulta:
        raise HTTPException(status_code=404, detail="Consulta no encontrada.")

    verify_doctor_patient_access(
        db, current_user, consulta.expediente.paciente_id)
    return consulta
