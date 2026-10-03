import sys
import os
from datetime import datetime, date, time, timedelta, timezone

# Añadir directorio app al path de Python
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models import (
    Rol, Usuario, Especialidad, Consultorio, Medico, HorarioMedico,
    Paciente, Expediente, Cita, Consulta, Diagnostico, Receta, RecetaMedicamento
)

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    print("[INFO] Iniciando población de datos ficticios para pruebas (Seed Data)...")

    # 1. Crear Roles
    roles_dict = {}
    roles_nombres = ["Administrador", "Médico", "Recepcionista", "Paciente"]
    for r_nom in roles_nombres:
        rol = db.query(Rol).filter(Rol.nombre == r_nom).first()
        if not rol:
            rol = Rol(nombre=r_nom, descripcion=f"Rol de {r_nom}")
            db.add(rol)
            db.flush()
        roles_dict[r_nom] = rol.id

    # 2. Crear Especialidades
    especialidades_dict = {}
    specs_data = [
        ("Medicina General", "Atención médica primaria y preventiva"),
        ("Pediatría", "Atención médica de niñas, niños y adolescentes"),
        ("Cardiología", "Diagnóstico y tratamiento de afecciones del corazón")
    ]
    for nom, desc in specs_data:
        spec = db.query(Especialidad).filter(Especialidad.nombre == nom).first()
        if not spec:
            spec = Especialidad(nombre=nom, descripcion=desc)
            db.add(spec)
            db.flush()
        especialidades_dict[nom] = spec.id

    # 3. Crear Consultorios
    consultorios_dict = {}
    rooms_data = [
        ("CONS-101", "Consultorio General 1", "Planta Baja - Ala Norte"),
        ("CONS-102", "Consultorio de Pediatría", "Planta Baja - Ala Sur"),
        ("CONS-201", "Consultorio de Cardiología", "Piso 2 - Especialidades")
    ]
    for cod, nom, ub in rooms_data:
        room = db.query(Consultorio).filter(Consultorio.codigo_sala == cod).first()
        if not room:
            room = Consultorio(codigo_sala=cod, nombre=nom, ubicacion_piso=ub)
            db.add(room)
            db.flush()
        consultorios_dict[cod] = room.id

    # 4. Crear Usuarios y Médicos
    # 4.1 Admin
    if not db.query(Usuario).filter(Usuario.email == "admin@clinica.mx").first():
        admin = Usuario(
            rol_id=roles_dict["Administrador"],
            email="admin@clinica.mx",
            password_hash=get_password_hash("admin123"),
            nombre="Carlos",
            primer_apellido="Administrador",
            segundo_apellido="Sistema",
            telefono="5551234567"
        )
        db.add(admin)

    # 4.2 Recepcionistas
    recepcionistas_data = [
        ("recepcion1@clinica.mx", "Ana", "Gómez", "Torres", "5559876543"),
        ("recepcion2@clinica.mx", "Mariana", "Hernández", "Cruz", "5558765432")
    ]
    for em, nom, p_ap, s_ap, tel in recepcionistas_data:
        if not db.query(Usuario).filter(Usuario.email == em).first():
            usr = Usuario(
                rol_id=roles_dict["Recepcionista"],
                email=em,
                password_hash=get_password_hash("recep123"),
                nombre=nom,
                primer_apellido=p_ap,
                segundo_apellido=s_ap,
                telefono=tel
            )
            db.add(usr)

    # 4.3 Médicos
    medicos_data = [
        ("dr.garcia@clinica.mx", "Alejandro", "García", "Mendoza", "5551112233", "MED-12345678", "Medicina General", "CONS-101"),
        ("dra.martinez@clinica.mx", "Sofia", "Martínez", "Ríos", "5552223344", "PED-87654321", "Pediatría", "CONS-102"),
        ("dr.lopez@clinica.mx", "Roberto", "López", "Vázquez", "5553334455", "CAR-45678912", "Cardiología", "CONS-201")
    ]

    medicos_objs = []
    for em, nom, p_ap, s_ap, tel, ced, spec_nom, room_cod in medicos_data:
        usr = db.query(Usuario).filter(Usuario.email == em).first()
        if not usr:
            usr = Usuario(
                rol_id=roles_dict["Médico"],
                email=em,
                password_hash=get_password_hash("medico123"),
                nombre=nom,
                primer_apellido=p_ap,
                segundo_apellido=s_ap,
                telefono=tel
            )
            db.add(usr)
            db.flush()

        medico = db.query(Medico).filter(Medico.usuario_id == usr.id).first()
        if not medico:
            medico = Medico(
                usuario_id=usr.id,
                cedula_profesional=ced,
                especialidad_id=especialidades_dict[spec_nom],
                consultorio_id=consultorios_dict[room_cod],
                duracion_consulta_min=30
            )
            db.add(medico)
            db.flush()

            # Asignar horarios de Lunes a Viernes (08:00 a 16:00)
            for dia in range(5):
                sch = HorarioMedico(
                    medico_id=medico.id,
                    dia_semana=dia,
                    hora_inicio=time(8, 0),
                    hora_fin=time(16, 0)
                )
                db.add(sch)
        medicos_objs.append(medico)

    db.commit()

    # 5. Crear 20 Pacientes ficticios con Expedientes
    pacientes_ficticios = [
        ("JUAN MANUEL", "PÉREZ", "SÁNCHEZ", "PESJ850315HDFRNN01", "1985-03-15", "Masculino", "5554441101", "juan.perez@test.com"),
        ("MARÍA ELENA", "GÓMEZ", "LOZANO", "GOLM900720BDFRR02", "1990-07-20", "Femenino", "5554441102", "maria.gomez@test.com"),
        ("RICARDO", "ALVAREZ", "DOMÍNGUEZ", "ALDR781105HDFLN03", "1978-11-05", "Masculino", "5554441103", "ricardo.alvarez@test.com"),
        ("VALENTINA", "DÍAZ", "RODRÍGUEZ", "DIRV950112MDFRR04", "1995-01-12", "Femenino", "5554441104", "valentina.diaz@test.com"),
        ("FERNANDO", "TORRES", "CASTRO", "TOCF820930HDFNN05", "1982-09-30", "Masculino", "5554441105", "fernando.torres@test.com"),
        ("CAMILA", "RAMÍREZ", "FLORES", "RAFC980425MDFRR06", "1998-04-25", "Femenino", "5554441106", "camila.ramirez@test.com"),
        ("GABRIEL", "MORALES", "VARGAS", "MOVG880618HDFNN07", "1988-06-18", "Masculino", "5554441107", "gabriel.morales@test.com"),
        ("SOPHIA", "ORTIZ", "REYES", "ORSF010214MDFRR08", "2001-02-14", "Femenino", "5554441108", "sophia.ortiz@test.com"),
        ("DIEGO", "RUIZ", "MENDOZA", "RUMD931208HDFNN09", "1993-12-08", "Masculino", "5554441109", "diego.ruiz@test.com"),
        ("ISABELLA", "CHÁVEZ", "SILVA", "CASI960819MDFRR10", "1996-08-19", "Femenino", "5554441110", "isabella.chavez@test.com"),
        ("MATEO", "MEDINA", "ROMERO", "MERM870503HDFNN11", "1987-05-03", "Masculino", "5554441111", "mateo.medina@test.com"),
        ("LUCÍA", "HERRERA", "GUZMÁN", "HEGL021022MDFRR12", "2002-10-22", "Femenino", "5554441112", "lucia.herrera@test.com"),
        ("EMILIANO", "JIMÉNEZ", "MORENO", "JIME840117HDFNN13", "1984-01-17", "Masculino", "5554441113", "emiliano.jimenez@test.com"),
        ("VICTORIA", "VARGAS", "RÍOS", "VARV910606MDFRR14", "1991-06-06", "Femenino", "5554441114", "victoria.vargas@test.com"),
        ("SANTIAGO", "CASTILLO", "AGUILAR", "CAAS891111HDFNN15", "1989-11-11", "Masculino", "5554441115", "santiago.castillo@test.com"),
        ("XIMENA", "SOTO", "PEÑA", "SOPX970304MDFRR16", "1997-03-04", "Femenino", "5554441116", "ximena.soto@test.com"),
        ("LEONARDO", "LARA", "DELGADO", "LADL860729HDFNN17", "1986-07-29", "Masculino", "5554441117", "leonardo.lara@test.com"),
        ("REGINA", "RIOS", "CAMPOS", "RICR000515MDFRR18", "2000-05-15", "Femenino", "5554441118", "regina.rios@test.com"),
        ("SEBASTIÁN", "VEGA", "IBÁÑEZ", "VEIS920909HDFNN19", "1992-09-09", "Masculino", "5554441119", "sebastian.vega@test.com"),
        ("RENATA", "PALACIOS", "SANTOS", "PASR031201MDFRR20", "2003-12-01", "Femenino", "5554441120", "renata.palacios@test.com"),
    ]

    pacientes_objs = []
    for nom, p_ap, s_ap, curp, f_nac, gen, tel, em in pacientes_ficticios:
        p = db.query(Paciente).filter(Paciente.curp == curp).first()
        if not p:
            f_nac_dt = datetime.strptime(f_nac, "%Y-%m-%d").date()
            p = Paciente(
                curp=curp,
                nombre=nom,
                primer_apellido=p_ap,
                segundo_apellido=s_ap,
                fecha_nacimiento=f_nac_dt,
                genero=gen,
                telefono=tel,
                email=em,
                direccion="Av. Insurgentes Sur #1234, CDMX",
                contacto_emergencia_nombre=f"Contacto Emergencia de {nom}",
                contacto_emergencia_telefono="5550000000",
                contacto_emergencia_parentesco="Familiar"
            )
            db.add(p)
            db.flush()

            # Expediente
            exp_folio = f"EXP-{datetime.now().strftime('%Y%m')}-{p.id:04d}"
            exp = Expediente(
                paciente_id=p.id,
                numero_expediente=exp_folio,
                antecedentes_heredofamiliares="Padre con diabetes mellitus tipo 2, Madre con hipertensión.",
                antecedentes_patologicos="Apendicectomía a los 15 años. Negó transfusiones.",
                antecedentes_no_patologicos="Tabaquismo ocasional. Niega etilismo.",
                alergias="Penicilina y AINES (Metamizol).",
                grupo_sanguineo="O+"
            )
            db.add(exp)
        pacientes_objs.append(p)

    db.commit()

    # 6. Crear Citas y Consultas de demostración
    med_garcia = medicos_objs[0]
    p1 = pacientes_objs[0]
    p2 = pacientes_objs[1]

    today_dt = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    
    # Cita 1 hoy
    cita1 = Cita(
        paciente_id=p1.id,
        medico_id=med_garcia.id,
        consultorio_id=med_garcia.consultorio_id,
        fecha_hora_inicio=today_dt + timedelta(hours=1),
        fecha_hora_fin=today_dt + timedelta(hours=1, minutes=30),
        estado="completada",
        tipo_recordatorio="whatsapp"
    )
    db.add(cita1)
    db.flush()

    # Consulta para Cita 1 con Diagnóstico CIE-10 y Receta
    exp1 = db.query(Expediente).filter(Expediente.paciente_id == p1.id).first()
    cons1 = Consulta(
        expediente_id=exp1.id,
        cita_id=cita1.id,
        medico_id=med_garcia.id,
        motivo_consulta="Paciente masculino acude por cefalea pulsátil de 3 días de evolución y fatiga.",
        exploracion_fisica="Consciente, orientado, mucosas bien hidratadas. Campos pulmonares limpios.",
        peso_kg=78.50,
        talla_cm=175.00,
        presion_arterial="135/85",
        frecuencia_cardiaca=78,
        temperatura_c=36.60,
        saturacion_oxigeno=98,
        plan_tratamiento="Modificación de estilo de vida, reducción de sodio y esquema farmacológico.",
        notas_evolucion="Paciente muestra buena respuesta inicial. Se cita en 2 semanas."
    )
    db.add(cons1)
    db.flush()

    d1 = Diagnostico(
        consulta_id=cons1.id,
        codigo_cie10="I10",
        descripcion="Hipertensión Esencial (Primaria)",
        tipo="definitivo"
    )
    db.add(d1)

    rec1 = Receta(
        consulta_id=cons1.id,
        codigo_folio=f"RX-{datetime.now().strftime('%Y%m%d')}-{cons1.id:04d}",
        indicaciones_generales="Tomar medicamentos con abundante agua después de los alimentos. Evitar consumo de sal."
    )
    db.add(rec1)
    db.flush()

    med_rec1 = RecetaMedicamento(
        receta_id=rec1.id,
        medicamento="Losartán 50 mg Tabletas",
        dosis="1 tableta cada 24 horas",
        frecuencia="Cada 24 horas (Mañana)",
        duracion_dias=30,
        via_administracion="Oral"
    )
    med_rec2 = RecetaMedicamento(
        receta_id=rec1.id,
        medicamento="Paracetamol 500 mg Tabletas",
        dosis="1 tableta cada 8 horas en caso de dolor",
        frecuencia="Cada 8 horas",
        duracion_dias=5,
        via_administracion="Oral"
    )
    db.add(med_rec1)
    db.add(med_rec2)

    # Cita 2 hoy
    cita2 = Cita(
        paciente_id=p2.id,
        medico_id=med_garcia.id,
        consultorio_id=med_garcia.consultorio_id,
        fecha_hora_inicio=today_dt + timedelta(hours=3),
        fecha_hora_fin=today_dt + timedelta(hours=3, minutes=30),
        estado="confirmada",
        tipo_recordatorio="email"
    )
    db.add(cita2)

    db.commit()
    print("[EXITO] Base de datos poblada correctamente con usuarios, médicos, 20 pacientes, citas y expedientes de prueba.")

if __name__ == "__main__":
    seed_database()
