-- =====================================================================
--  SISTEMA DE CITAS Y EXPEDIENTES MÉDICOS  |  Script 2: DATOS DE PRUEBA
--  Ejecutar DESPUÉS de 01_esquema_clinica.sql
--  Todos los datos son FICTICIOS. Contraseña de TODOS los usuarios de prueba:
--      Clinica2026!
--  (cámbialas o bórralas antes de usar el sistema con datos reales)
-- =====================================================================
USE clinica;

-- 1. USUARIOS (hash bcrypt de 'Clinica2026!')
INSERT INTO usuarios (id, username, password_hash, rol) VALUES
 (1,'admin',        '$2b$12$b02m5Hy33XQC5doGidfnBeKCCnxGYpykLQXwFzLi7.XPO2mXmon6.','admin'),
 (2,'dr.ramirez',   '$2b$12$b02m5Hy33XQC5doGidfnBeKCCnxGYpykLQXwFzLi7.XPO2mXmon6.','medico'),
 (3,'dra.lopez',    '$2b$12$b02m5Hy33XQC5doGidfnBeKCCnxGYpykLQXwFzLi7.XPO2mXmon6.','medico'),
 (4,'dr.hernandez', '$2b$12$b02m5Hy33XQC5doGidfnBeKCCnxGYpykLQXwFzLi7.XPO2mXmon6.','medico'),
 (5,'recepcion1',   '$2b$12$b02m5Hy33XQC5doGidfnBeKCCnxGYpykLQXwFzLi7.XPO2mXmon6.','recepcion'),
 (6,'recepcion2',   '$2b$12$b02m5Hy33XQC5doGidfnBeKCCnxGYpykLQXwFzLi7.XPO2mXmon6.','recepcion');


-- 2. ESPECIALIDADES Y CONSULTORIOS
INSERT INTO especialidades (id, nombre, descripcion) VALUES
 (1,'Medicina General','Atención primaria y consulta general'),
 (2,'Pediatría','Atención médica de niños y adolescentes'),
 (3,'Cardiología','Diagnóstico y tratamiento de enfermedades del corazón'),
 (4,'Ginecología','Salud de la mujer');

INSERT INTO consultorios (id, nombre, piso) VALUES
 (1,'Consultorio 1','Planta baja'),
 (2,'Consultorio 2','Planta baja'),
 (3,'Consultorio 3','Primer piso');

-- 3. MÉDICOS
INSERT INTO medicos (id, usuario_id, especialidad_id, consultorio_id, nombre, apellido_paterno, apellido_materno, cedula_profesional, telefono, email, duracion_consulta_min) VALUES
 (1,2,1,1,'Roberto','Ramírez','Salgado','CED-1000001','7471000001','dr.ramirez@clinica.test',30),
 (2,3,2,2,'Alejandra','López','Fuentes','CED-1000002','7471000002','dra.lopez@clinica.test',30),
 (3,4,3,3,'Héctor','Hernández','Mejía','CED-1000003','7471000003','dr.hernandez@clinica.test',45);

-- Horarios: lunes a viernes (1-5)
INSERT INTO horarios_medico (medico_id, dia_semana, hora_inicio, hora_fin)
SELECT m.id, d.dia, '09:00:00', '14:00:00'
FROM medicos m
JOIN (SELECT 1 AS dia UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5) d;

-- 4. PACIENTES (20 ficticios) -- CURP inventadas, no corresponden a personas reales
INSERT INTO pacientes (id, curp, nombre, apellido_paterno, apellido_materno, fecha_nacimiento, sexo, telefono, email, direccion, contacto_emergencia_nombre, contacto_emergencia_telefono, creado_por) VALUES
 (1,'MERA910314MGRXXX01','Ana','Martínez','Ruiz','1991-03-14','F','7477000001','paciente1@correo.test','Calle Ficticia 3, Col. Centro','Contacto de Ana','7478000001',5),
 (2,'GIPL850722HGRXXX02','Luis','García','Pérez','1985-07-22','M','7477000002','paciente2@correo.test','Calle Ficticia 6, Col. Centro','Contacto de Luis','7478000002',5),
 (3,'HOLM781105MGRXXX03','María','Hernández','López','1978-11-05','F','7477000003','paciente3@correo.test','Calle Ficticia 9, Col. Centro','Contacto de María','7478000003',5),
 (4,'RUSJ010130HGRXXX04','José','Ramírez','Soto','2001-01-30','M','7477000004','paciente4@correo.test','Calle Ficticia 12, Col. Centro','Contacto de José','7478000004',5),
 (5,'FADC690918MGRXXX05','Carmen','Flores','Díaz','1969-09-18','F','7477000005','paciente5@correo.test','Calle Ficticia 15, Col. Centro','Contacto de Carmen','7478000005',5),
 (6,'TEVM950509HGRXXX06','Miguel','Torres','Vega','1995-05-09','M','7477000006','paciente6@correo.test','Calle Ficticia 18, Col. Centro','Contacto de Miguel','7478000006',5),
 (7,'SIML881227MGRXXX07','Laura','Sánchez','Mora','1988-12-27','F','7477000007','paciente7@correo.test','Calle Ficticia 21, Col. Centro','Contacto de Laura','7478000007',5),
 (8,'JOOC740402HGRXXX08','Carlos','Jiménez','Ortiz','1974-04-02','M','7477000008','paciente8@correo.test','Calle Ficticia 24, Col. Centro','Contacto de Carlos','7478000008',5),
 (9,'CURS150811MGRXXX09','Sofía','Castillo','Reyes','2015-08-11','F','7477000009','paciente9@correo.test','Calle Ficticia 27, Col. Centro','Contacto de Sofía','7478000009',5),
 (10,'MACD120219HGRXXX00','Diego','Morales','Cruz','2012-02-19','M','7477000010','paciente10@correo.test','Calle Ficticia 30, Col. Centro','Contacto de Diego','7478000010',5),
 (11,'VELP820625MGRXXX01','Patricia','Vargas','Luna','1982-06-25','F','7477000011','paciente11@correo.test','Calle Ficticia 33, Col. Centro','Contacto de Patricia','7478000011',5),
 (12,'RINF661013HGRXXX02','Fernando','Rojas','Núñez','1966-10-13','M','7477000012','paciente12@correo.test','Calle Ficticia 36, Col. Centro','Contacto de Fernando','7478000012',5),
 (13,'MOSG990303MGRXXX03','Gabriela','Mendoza','Silva','1999-03-03','F','7477000013','paciente13@correo.test','Calle Ficticia 39, Col. Centro','Contacto de Gabriela','7478000013',5),
 (14,'AUPR900929HGRXXX04','Ricardo','Aguilar','Ponce','1990-09-29','M','7477000014','paciente14@correo.test','Calle Ficticia 42, Col. Centro','Contacto de Ricardo','7478000014',5),
 (15,'GARE570116MGRXXX05','Elena','Guerrero','Rivas','1957-01-16','F','7477000015','paciente15@correo.test','Calle Ficticia 45, Col. Centro','Contacto de Elena','7478000015',5),
 (16,'NESA800707HGRXXX06','Andrés','Navarro','Salas','1980-07-07','M','7477000016','paciente16@correo.test','Calle Ficticia 48, Col. Centro','Contacto de Andrés','7478000016',5),
 (17,'DIIP031121MGRXXX07','Paola','Domínguez','Ibarra','2003-11-21','F','7477000017','paciente17@correo.test','Calle Ficticia 51, Col. Centro','Contacto de Paola','7478000017',5),
 (18,'COLJ720530HGRXXX08','Jorge','Cabrera','Lara','1972-05-30','M','7477000018','paciente18@correo.test','Calle Ficticia 54, Col. Centro','Contacto de Jorge','7478000018',5),
 (19,'EUCR631208MGRXXX09','Rosa','Estrada','Campos','1963-12-08','F','7477000019','paciente19@correo.test','Calle Ficticia 57, Col. Centro','Contacto de Rosa','7478000019',5),
 (20,'PABE080424HGRXXX00','Emilio','Paredes','Bravo','2008-04-24','M','7477000020','paciente20@correo.test','Calle Ficticia 60, Col. Centro','Contacto de Emilio','7478000020',5);

-- 5. EXPEDIENTES (uno por paciente)
INSERT INTO expedientes (paciente_id, numero_expediente, grupo_sanguineo, alergias, creado_por)
SELECT p.id, CONCAT('EXP-', LPAD(p.id, 5, '0')),
       ELT(1 + (p.id MOD 8),'O+','A+','B+','O-','AB+','A-','B-','AB-'),
       CASE WHEN p.id MOD 4 = 0 THEN 'Penicilina' ELSE 'Ninguna conocida' END,
       5
FROM pacientes p;

-- 6. CATÁLOGO CIE-10 (muestra reducida; amplía con el catálogo oficial)
INSERT INTO cat_cie10 (codigo, descripcion) VALUES
 ('J00','Rinofaringitis aguda (resfriado común)'),
 ('J06.9','Infección aguda de las vías respiratorias superiores, no especificada'),
 ('J20.9','Bronquitis aguda, no especificada'),
 ('A09','Diarrea y gastroenteritis de presunto origen infeccioso'),
 ('K29.7','Gastritis, no especificada'),
 ('I10','Hipertensión esencial (primaria)'),
 ('E11.9','Diabetes mellitus tipo 2 sin complicaciones'),
 ('E66.9','Obesidad, no especificada'),
 ('M54.5','Lumbago'),
 ('R51','Cefalea'),
 ('N39.0','Infección de vías urinarias, sitio no especificado'),
 ('L20.9','Dermatitis atópica, no especificada'),
 ('Z00.0','Examen médico general'),
 ('Z00.1','Control de salud de rutina del niño'),
 ('Z34.9','Supervisión de embarazo normal, no especificado');


-- 7. CITAS DE EJEMPLO (fechas relativas a HOY para que siempre haya agenda)
--    Pasadas (completadas) y futuras (programadas/confirmadas). Sin empalmes.
INSERT INTO citas (id, paciente_id, medico_id, consultorio_id, fecha_hora_inicio, fecha_hora_fin, estado, motivo, creado_por) VALUES
 (1, 1, 1, 1, TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 7 DAY),'09:00:00'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 7 DAY),'09:30:00'), 'completada', 'Tos y malestar general', 5),
 (2, 2, 1, 1, TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 7 DAY),'09:30:00'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 7 DAY),'10:00:00'), 'completada', 'Dolor de espalda baja', 5),
 (3, 9, 2, 2, TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 3 DAY),'10:00:00'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 3 DAY),'10:30:00'), 'completada', 'Control de niño sano', 6),
 (4, 5, 3, 3, TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 2 DAY),'11:00:00'), TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 2 DAY),'11:45:00'), 'no_asistio', 'Revisión de presión arterial', 6),
 (5, 3, 1, 1, TIMESTAMP(CURDATE(),'10:00:00'), TIMESTAMP(CURDATE(),'10:30:00'), 'confirmada', 'Dolor de cabeza frecuente', 5),
 (6, 4, 1, 1, TIMESTAMP(CURDATE(),'10:30:00'), TIMESTAMP(CURDATE(),'11:00:00'), 'programada', 'Consulta general', 5),
 (7, 10, 2, 2, TIMESTAMP(CURDATE(),'11:00:00'), TIMESTAMP(CURDATE(),'11:30:00'), 'programada', 'Fiebre y dolor de garganta', 6),
 (8, 12, 3, 3, TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 1 DAY),'09:00:00'), TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 1 DAY),'09:45:00'), 'programada', 'Control de hipertensión', 5),
 (9, 15, 3, 3, TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 1 DAY),'09:45:00'), TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 1 DAY),'10:30:00'), 'programada', 'Electrocardiograma de control', 5),
 (10, 6, 1, 1, TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 2 DAY),'12:00:00'), TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 2 DAY),'12:30:00'), 'programada', 'Revisión por gastritis', 6);

-- 8. CONSULTAS, DIAGNÓSTICOS Y RECETAS de las citas completadas
INSERT INTO consultas (id, expediente_id, cita_id, medico_id, fecha_consulta, motivo_consulta, exploracion_fisica, peso_kg, talla_cm, presion_sistolica, presion_diastolica, frecuencia_cardiaca, temperatura_c, plan_tratamiento) VALUES
 (1, 1, 1, 1, TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 7 DAY),'09:05:00'), 'Tos y malestar general de 3 días de evolución', 'Faringe hiperémica, sin datos de dificultad respiratoria', 62.5, 163.0, 110, 70, 78, 37.4, 'Reposo, hidratación y tratamiento sintomático'),
 (2, 2, 2, 1, TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 7 DAY),'09:35:00'), 'Dolor en región lumbar tras esfuerzo físico', 'Contractura paravertebral lumbar, sin déficit neurológico', 84.0, 175.0, 125, 82, 74, 36.6, 'Antiinflamatorio, calor local y reposo relativo'),
 (3, 9, 3, 2, TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 3 DAY),'10:05:00'), 'Control de niño sano', 'Desarrollo acorde a la edad, sin hallazgos patológicos', 28.0, 128.0, 95, 60, 88, 36.5, 'Continuar esquema de vacunación y alimentación balanceada');

INSERT INTO diagnosticos (consulta_id, cie10_codigo, tipo) VALUES
 (1,'J06.9','principal'),
 (2,'M54.5','principal'),
 (3,'Z00.1','principal');

INSERT INTO recetas (id, consulta_id, folio, indicaciones_generales) VALUES
 (1, 1, 'REC-000001', 'Tomar abundantes líquidos y reposar. Regresar si hay fiebre mayor a 38.5 °C.'),
 (2, 2, 'REC-000002', 'Evitar cargar objetos pesados durante una semana.');

INSERT INTO receta_medicamentos (receta_id, medicamento, dosis, frecuencia, duracion, via_administracion, indicaciones) VALUES
 (1, 'Paracetamol', '500 mg', 'cada 8 horas', '5 días', 'Oral', 'Si hay fiebre o dolor'),
 (1, 'Ambroxol', '30 mg', 'cada 8 horas', '5 días', 'Oral', 'Después de los alimentos'),
 (2, 'Naproxeno', '250 mg', 'cada 12 horas', '5 días', 'Oral', 'Tomar con alimentos');

-- 9. BITÁCORA INICIAL
INSERT INTO bitacora_auditoria (usuario_id, accion, entidad, entidad_id, detalle) VALUES
 (1, 'crear', 'usuario', 2, JSON_OBJECT('nota','Alta de usuarios de prueba'));

-- Verificación rápida
SELECT 'usuarios' AS tabla, COUNT(*) AS filas FROM usuarios
UNION ALL SELECT 'medicos', COUNT(*) FROM medicos
UNION ALL SELECT 'pacientes', COUNT(*) FROM pacientes
UNION ALL SELECT 'citas', COUNT(*) FROM citas
UNION ALL SELECT 'consultas', COUNT(*) FROM consultas;
