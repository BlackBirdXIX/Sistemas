import io
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from app.models.medical_record import Receta


def generar_pdf_receta(receta: Receta) -> io.BytesIO:
    """
    Genera un documento PDF profesional para una receta médica oficial.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=0.5 * inch,
        leftMargin=0.5 * inch,
        topMargin=0.5 * inch,
        bottomMargin=0.5 * inch
    )

    story = []
    styles = getSampleStyleSheet()

    # Estilos personalizados
    header_title_style = ParagraphStyle(
        'HeaderTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        textColor=colors.HexColor('#0f766e'),  # Teal-700
        alignment=1,  # Center
        spaceAfter=4
    )

    header_sub_style = ParagraphStyle(
        'HeaderSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.HexColor('#374151'),
        alignment=1,
        spaceAfter=2
    )

    label_bold_style = ParagraphStyle(
        'LabelBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        textColor=colors.HexColor('#1f2937')
    )

    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.HexColor('#374151')
    )

    # 1. Encabezado de la Clínica
    story.append(Paragraph("CLÍNICA MÉDICA INTEGRAL", header_title_style))
    story.append(Paragraph(
        "Servicios Médicos de Alta Calidad y Expediente Electrónico", header_sub_style))
    story.append(
        Paragraph("NOM-004-SSA3-2012 / NOM-024-SSA3-2012 Compliant", header_sub_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=2,
                 color=colors.HexColor('#0f766e'), spaceAfter=15))

    # 2. Datos del Médico y Folio
    consulta = receta.consulta
    medico = consulta.medico
    paciente = consulta.expediente.paciente

    medico_nombre = medico.nombre_completo if medico else "Dr. Médico"
    especialidad = medico.especialidad.nombre if medico.especialidad else "Medicina General"
    cedula = medico.cedula_profesional

    datos_medico_html = f"<b>Médico Tratante:</b> Dr(a). {medico_nombre}<br/>" \
        f"<b>Especialidad:</b> {especialidad}<br/>" \
        f"<b>Cédula Profesional:</b> {cedula}"

    datos_receta_html = f"<b>Folio Receta:</b> {receta.codigo_folio}<br/>" \
        f"<b>Fecha de Emisión:</b> {receta.fecha_emision.strftime('%d/%m/%Y %H:%M')}<br/>" \
        f"<b>Expediente N°:</b> {consulta.expediente.numero_expediente}"

    tabla_encabezado_data = [
        [Paragraph(datos_medico_html, body_style),
         Paragraph(datos_receta_html, body_style)]
    ]

    tabla_encabezado = Table(tabla_encabezado_data, colWidths=[
                             4.0 * inch, 3.5 * inch])
    tabla_encabezado.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f0fdf4')),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#bbf7d0')),
    ]))
    story.append(tabla_encabezado)
    story.append(Spacer(1, 12))

    # 3. Datos del Paciente
    paciente_nombre = paciente.nombre_completo
    curp = paciente.curp
    edad_calc = ""
    if paciente.fecha_nacimiento:
        from datetime import date
        today = date.today()
        edad = today.year - paciente.fecha_nacimiento.year - \
            ((today.month, today.day) <
             (paciente.fecha_nacimiento.month, paciente.fecha_nacimiento.day))
        edad_calc = f" ({edad} años)"

    datos_paciente_html = f"<b>Paciente:</b> {paciente_nombre}{edad_calc} &nbsp;|&nbsp; <b>CURP:</b> {curp} &nbsp;|&nbsp; <b>Género:</b> {paciente.genero}"
    story.append(Paragraph(datos_paciente_html, label_bold_style))
    story.append(Spacer(1, 10))

    # Signos vitales resumidos si existen
    vistas = []
    if consulta.presion_arterial:
        vistas.append(f"T/A: {consulta.presion_arterial}")
    if consulta.peso_kg:
        vistas.append(f"Peso: {consulta.peso_kg} kg")
    if consulta.temperatura_c:
        vistas.append(f"Temp: {consulta.temperatura_c} °C")
    if vistas:
        story.append(Paragraph("<b>Signos Vitales:</b> " +
                     " | ".join(vistas), body_style))
        story.append(Spacer(1, 10))

    story.append(HRFlowable(width="100%", thickness=1,
                 color=colors.HexColor('#cbd5e1'), spaceAfter=12))

    # 4. Prescripción / Medicamentos
    story.append(Paragraph("<b>PRESCRIPCIÓN MÉDICA (Rx)</b>", ParagraphStyle('RxHeader',
                 parent=styles['Heading2'], fontSize=12, textColor=colors.HexColor('#0f766e'))))
    story.append(Spacer(1, 6))

    headers_meds = [Paragraph("<b>Medicamento</b>", label_bold_style),
                    Paragraph("<b>Dosis</b>", label_bold_style),
                    Paragraph("<b>Frecuencia</b>", label_bold_style),
                    Paragraph("<b>Duración</b>", label_bold_style),
                    Paragraph("<b>Vía</b>", label_bold_style)]

    rows_meds = [headers_meds]
    for med in receta.medicamentos:
        rows_meds.append([
            Paragraph(med.medicamento, body_style),
            Paragraph(med.dosis, body_style),
            Paragraph(med.frecuencia, body_style),
            Paragraph(f"{med.duracion_dias} días", body_style),
            Paragraph(med.via_administracion, body_style),
        ])

    tabla_meds = Table(rows_meds, colWidths=[
                       2.5 * inch, 1.3 * inch, 1.5 * inch, 1.1 * inch, 1.1 * inch])
    tabla_meds.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f1f5f9')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
    ]))
    story.append(tabla_meds)
    story.append(Spacer(1, 15))

    # 5. Indicaciones Generales
    if receta.indicaciones_generales:
        story.append(
            Paragraph("<b>INDICACIONES GENERALES:</b>", label_bold_style))
        story.append(Spacer(1, 4))
        story.append(
            Paragraph(receta.indicaciones_generales.replace("\n", "<br/>"), body_style))
        story.append(Spacer(1, 20))

    # 6. Pie de Página y Firma del Médico
    story.append(Spacer(1, 40))
    firma_table_data = [
        ["_______________________________________"],
        [f"Dr(a). {medico_nombre}"],
        [f"Céd. Prof. {cedula}"],
        ["Firma Autógrafa / Electrónica"]
    ]
    firma_table = Table(firma_table_data, colWidths=[3.5 * inch])
    firma_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#4b5563')),
    ]))
    story.append(firma_table)

    doc.build(story)
    buffer.seek(0)
    return buffer
