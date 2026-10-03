from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user, verify_doctor_patient_access
from app.models.medical_record import Receta
from app.models.user import Usuario
from app.services.pdf_service import generar_pdf_receta
from app.services.audit_service import registrar_auditoria

router = APIRouter()

@router.get("/{prescription_id}/pdf")
def download_prescription_pdf(
    prescription_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    receta = db.query(Receta).filter(Receta.id == prescription_id, Receta.id.isnot(None)).first()
    if not receta:
        raise HTTPException(status_code=404, detail="Receta médica no encontrada.")

    # Validar permisos de acceso al expediente del paciente
    verify_doctor_patient_access(db, current_user, receta.consulta.expediente.paciente_id)

    pdf_buffer = generar_pdf_receta(receta)

    registrar_auditoria(db, current_user.id, "IMPRESION_PDF", "Recetas", entidad_id=str(receta.id), detalles={"folio": receta.codigo_folio})

    filename = f"Receta_{receta.codigo_folio}.pdf"
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={filename}"}
    )
