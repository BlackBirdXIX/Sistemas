import datetime
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, Base, engine
from app.models.user import Usuario
from app.models.doctor import Especialidad, Consultorio, Medico, HorarioMedico
from app.models.patient import Paciente
from app.models.medical_record import Expediente

def init_default_data():
    """
    Inicializa datos de prueba si la base de datos (por ejemplo SQLite en la nube) está vacía.
    """
    db: Session = SessionLocal()
    try:
        if db.query(Usuario).first():
            # Ya existen usuarios
            return

        print("[INIT DB] Base de datos sin usuarios. Sembrando datos por defecto para el sistema...")

        # 1. Usuarios con contraseña 'Clinica2026!'
        bcrypt_pass = "$2b$12$b02m5Hy33XQC5doGidfnBeKCCnxGYpykLQXwFzLi7.XPO2mXmon6."
        usuarios = [
            Usuario(id=1, username="admin", password_hash=bcrypt_pass, rol="admin"),
            Usuario(id=2, username="dr.ramirez", password_hash=bcrypt_pass, rol="medico"),
            Usuario(id=3, username="dra.lopez", password_hash=bcrypt_pass, rol="medico"),
            Usuario(id=4, username="dr.hernandez", password_hash=bcrypt_pass, rol="medico"),
            Usuario(id=5, username="recepcion1", password_hash=bcrypt_pass, rol="recepcion"),
            Usuario(id=6, username="recepcion2", password_hash=bcrypt_pass, rol="recepcion"),
        ]
        db.add_all(usuarios)
        db.flush()

        # 2. Especialidades
        specs = [
            Especialidad(id=1, nombre="Medicina General", descripcion="Atención primaria y consulta general"),
            Especialidad(id=2, nombre="Pediatría", descripcion="Atención médica de niños y adolescentes"),
            Especialidad(id=3, nombre="Cardiología", descripcion="Diagnóstico y tratamiento de enfermedades del corazón"),
            Especialidad(id=4, nombre="Ginecología", descripcion="Salud de la mujer"),
        ]
        db.add_all(specs)
        db.flush()

        # 3. Consultorios
        consultorios = [
            Consultorio(id=1, nombre="Consultorio 1", piso="Planta baja"),
            Consultorio(id=2, nombre="Consultorio 2", piso="Planta baja"),
            Consultorio(id=3, nombre="Consultorio 3", piso="Primer piso"),
        ]
        db.add_all(consultorios)
        db.flush()

        # 4. Médicos
        medicos = [
            Medico(
                id=1, usuario_id=2, especialidad_id=1, consultorio_id=1,
                nombre="Roberto", apellido_paterno="Ramírez", apellido_materno="Salgado",
                cedula_profesional="CED-1000001", telefono="7471000001", email="dr.ramirez@clinica.test",
                duracion_consulta_min=30
            ),
            Medico(
                id=2, usuario_id=3, especialidad_id=2, consultorio_id=2,
                nombre="Alejandra", apellido_paterno="López", apellido_materno="Fuentes",
                cedula_profesional="CED-1000002", telefono="7471000002", email="dra.lopez@clinica.test",
                duracion_consulta_min=30
            ),
            Medico(
                id=3, usuario_id=4, especialidad_id=3, consultorio_id=3,
                nombre="Héctor", apellido_paterno="Hernández", apellido_materno="Mejía",
                cedula_profesional="CED-1000003", telefono="7471000003", email="dr.hernandez@clinica.test",
                duracion_consulta_min=45
            ),
        ]
        db.add_all(medicos)
        db.flush()

        # Horarios de lunes a viernes
        horarios = []
        for m in medicos:
            for dia in range(1, 6):
                horarios.append(HorarioMedico(
                    medico_id=m.id,
                    dia_semana=dia,
                    hora_inicio=datetime.time(9, 0),
                    hora_fin=datetime.time(14, 0)
                ))
        db.add_all(horarios)
        db.flush()

        # 5. Pacientes y Expedientes de prueba
        pacientes_data = [
            ("MERA910314MGRXXX01", "Ana", "Martínez", "Ruiz", datetime.date(1991, 3, 14), "F", "7477000001", "paciente1@correo.test", "Calle Ficticia 3, Col. Centro"),
            ("GIPL850722HGRXXX02", "Luis", "García", "Pérez", datetime.date(1985, 7, 22), "M", "7477000002", "paciente2@correo.test", "Calle Ficticia 6, Col. Centro"),
            ("HOLM781105MGRXXX03", "María", "Hernández", "López", datetime.date(1978, 11, 5), "F", "7477000003", "paciente3@correo.test", "Calle Ficticia 9, Col. Centro"),
            ("RUSJ010130HGRXXX04", "José", "Ramírez", "Soto", datetime.date(2001, 1, 30), "M", "7477000004", "paciente4@correo.test", "Calle Ficticia 12, Col. Centro"),
            ("FADC690918MGRXXX05", "Carmen", "Flores", "Díaz", datetime.date(1969, 9, 18), "F", "7477000005", "paciente5@correo.test", "Calle Ficticia 15, Col. Centro"),
        ]

        for i, (curp, nom, ap_p, ap_m, fnac, sexo, tel, em, dir_) in enumerate(pacientes_data, start=1):
            p = Paciente(
                id=i, curp=curp, nombre=nom, apellido_paterno=ap_p, apellido_materno=ap_m,
                fecha_nacimiento=fnac, sexo=sexo, telefono=tel, email=em, direccion=dir_,
                creado_por=5
            )
            db.add(p)
            db.flush()
            exp = Expediente(
                paciente_id=p.id,
                numero_expediente=f"EXP-{str(i).zfill(5)}",
                grupo_sanguineo="O+",
                alergias="Ninguna conocida",
                creado_por=5
            )
            db.add(exp)

        db.commit()
        print("[INIT DB] ✅ Datos por defecto sembrados correctamente.")
    except Exception as e:
        print(f"[INIT DB WARN] Error al sembrar datos: {e}")
        db.rollback()
    finally:
        db.close()
