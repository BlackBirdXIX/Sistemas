-- =====================================================================
--  SISTEMA DE CITAS Y EXPEDIENTES MÉDICOS  |  Script 1: ESQUEMA
--  Motor: MySQL 8.x  |  Codificación: utf8mb4
--  Ejecutar completo en MySQL Workbench (rayo amarillo, sin seleccionar nada).
-- =====================================================================

DROP DATABASE IF EXISTS clinica;   -- ⚠ borra la base si ya existía (útil al reiniciar pruebas)
CREATE DATABASE clinica
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE clinica;

-- ---------------------------------------------------------------------
-- 1. USUARIOS (login). Cada médico tiene su propio usuario y contraseña.
--    La contraseña se guarda SOLO como hash bcrypt, nunca en texto plano.
-- ---------------------------------------------------------------------
CREATE TABLE usuarios (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username          VARCHAR(50)  NOT NULL,
  password_hash     VARCHAR(255) NOT NULL,
  rol               ENUM('admin','medico','recepcion','paciente') NOT NULL,
  activo            TINYINT(1)   NOT NULL DEFAULT 1,
  intentos_fallidos TINYINT UNSIGNED NOT NULL DEFAULT 0,
  bloqueado_hasta   DATETIME     NULL,
  ultimo_login      DATETIME     NULL,
  creado_en         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_usuarios_username UNIQUE (username)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 2. CATÁLOGOS: especialidades y consultorios
-- ---------------------------------------------------------------------
CREATE TABLE especialidades (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(100) NOT NULL,
  descripcion VARCHAR(255) NULL,
  activo      TINYINT(1)   NOT NULL DEFAULT 1,
  CONSTRAINT uq_especialidades_nombre UNIQUE (nombre)
) ENGINE=InnoDB;

CREATE TABLE consultorios (
  id      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre  VARCHAR(50)  NOT NULL,          -- p. ej. "Consultorio 1"
  piso    VARCHAR(20)  NULL,
  activo  TINYINT(1)   NOT NULL DEFAULT 1,
  CONSTRAINT uq_consultorios_nombre UNIQUE (nombre)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 3. MÉDICOS (cada médico está ligado a UN usuario)
-- ---------------------------------------------------------------------
CREATE TABLE medicos (
  id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id           INT UNSIGNED NOT NULL,
  especialidad_id      INT UNSIGNED NOT NULL,
  consultorio_id       INT UNSIGNED NULL,
  nombre               VARCHAR(80)  NOT NULL,
  apellido_paterno     VARCHAR(80)  NOT NULL,
  apellido_materno     VARCHAR(80)  NULL,
  cedula_profesional   VARCHAR(20)  NOT NULL,
  telefono             VARCHAR(20)  NULL,
  email                VARCHAR(120) NULL,
  duracion_consulta_min SMALLINT UNSIGNED NOT NULL DEFAULT 30,
  activo               TINYINT(1)   NOT NULL DEFAULT 1,
  creado_en            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_medicos_usuario  UNIQUE (usuario_id),
  CONSTRAINT uq_medicos_cedula   UNIQUE (cedula_profesional),
  CONSTRAINT fk_medicos_usuario      FOREIGN KEY (usuario_id)      REFERENCES usuarios(id),
  CONSTRAINT fk_medicos_especialidad FOREIGN KEY (especialidad_id) REFERENCES especialidades(id),
  CONSTRAINT fk_medicos_consultorio  FOREIGN KEY (consultorio_id)  REFERENCES consultorios(id)
) ENGINE=InnoDB;

-- Horario semanal de atención (dia_semana: 1 = lunes ... 7 = domingo)
CREATE TABLE horarios_medico (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  medico_id   INT UNSIGNED NOT NULL,
  dia_semana  TINYINT UNSIGNED NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin    TIME NOT NULL,
  CONSTRAINT ck_horario_dia   CHECK (dia_semana BETWEEN 1 AND 7),
  CONSTRAINT ck_horario_horas CHECK (hora_fin > hora_inicio),
  CONSTRAINT fk_horarios_medico FOREIGN KEY (medico_id) REFERENCES medicos(id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 4. PACIENTES
-- ---------------------------------------------------------------------
CREATE TABLE pacientes (
  id                      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id              INT UNSIGNED NULL,           -- solo si el paciente tendrá acceso (fase 2)
  curp                    CHAR(18)     NULL,
  nombre                  VARCHAR(80)  NOT NULL,
  apellido_paterno        VARCHAR(80)  NOT NULL,
  apellido_materno        VARCHAR(80)  NULL,
  fecha_nacimiento        DATE         NOT NULL,
  sexo                    ENUM('F','M','otro') NOT NULL,
  telefono                VARCHAR(20)  NULL,
  email                   VARCHAR(120) NULL,
  direccion               VARCHAR(255) NULL,
  contacto_emergencia_nombre   VARCHAR(120) NULL,
  contacto_emergencia_telefono VARCHAR(20)  NULL,
  activo                  TINYINT(1)   NOT NULL DEFAULT 1,   -- borrado lógico
  creado_por              INT UNSIGNED NULL,
  creado_en               TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_pacientes_curp    UNIQUE (curp),
  CONSTRAINT uq_pacientes_usuario UNIQUE (usuario_id),
  CONSTRAINT fk_pacientes_usuario    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  CONSTRAINT fk_pacientes_creado_por FOREIGN KEY (creado_por) REFERENCES usuarios(id),
  INDEX idx_pacientes_nombre (apellido_paterno, apellido_materno, nombre),
  INDEX idx_pacientes_telefono (telefono)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 5. CITAS
-- ---------------------------------------------------------------------
CREATE TABLE citas (
  id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  paciente_id        INT UNSIGNED NOT NULL,
  medico_id          INT UNSIGNED NOT NULL,
  consultorio_id     INT UNSIGNED NULL,
  fecha_hora_inicio  DATETIME NOT NULL,
  fecha_hora_fin     DATETIME NOT NULL,
  estado             ENUM('programada','confirmada','en_curso','completada','cancelada','no_asistio')
                     NOT NULL DEFAULT 'programada',
  motivo             VARCHAR(255) NULL,
  motivo_cancelacion VARCHAR(255) NULL,
  creado_por         INT UNSIGNED NULL,
  creado_en          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT ck_citas_horas CHECK (fecha_hora_fin > fecha_hora_inicio),
  CONSTRAINT fk_citas_paciente    FOREIGN KEY (paciente_id)    REFERENCES pacientes(id),
  CONSTRAINT fk_citas_medico      FOREIGN KEY (medico_id)      REFERENCES medicos(id),
  CONSTRAINT fk_citas_consultorio FOREIGN KEY (consultorio_id) REFERENCES consultorios(id),
  CONSTRAINT fk_citas_creado_por  FOREIGN KEY (creado_por)     REFERENCES usuarios(id),
  INDEX idx_citas_medico_fecha   (medico_id, fecha_hora_inicio),
  INDEX idx_citas_paciente_fecha (paciente_id, fecha_hora_inicio),
  INDEX idx_citas_estado         (estado)
) ENGINE=InnoDB;

-- Recordatorios (la app los enviará por correo/WhatsApp; por ahora solo se registran)
CREATE TABLE recordatorios (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cita_id      INT UNSIGNED NOT NULL,
  canal        ENUM('email','whatsapp','sms') NOT NULL,
  enviar_en    DATETIME NOT NULL,
  enviado      TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_recordatorios_cita FOREIGN KEY (cita_id) REFERENCES citas(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 6. EXPEDIENTE CLÍNICO (uno por paciente)
-- ---------------------------------------------------------------------
CREATE TABLE expedientes (
  id                          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  paciente_id                 INT UNSIGNED NOT NULL,
  numero_expediente           VARCHAR(20)  NOT NULL,
  grupo_sanguineo             ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NULL,
  alergias                    TEXT NULL,
  antecedentes_heredofamiliares        TEXT NULL,
  antecedentes_personales_patologicos  TEXT NULL,
  antecedentes_personales_no_patologicos TEXT NULL,
  creado_por                  INT UNSIGNED NULL,
  creado_en                   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_expedientes_paciente UNIQUE (paciente_id),
  CONSTRAINT uq_expedientes_numero   UNIQUE (numero_expediente),
  CONSTRAINT fk_expedientes_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
  CONSTRAINT fk_expedientes_creado_por FOREIGN KEY (creado_por) REFERENCES usuarios(id)
) ENGINE=InnoDB;

CREATE TABLE consultas (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  expediente_id       INT UNSIGNED NOT NULL,
  cita_id             INT UNSIGNED NULL,
  medico_id           INT UNSIGNED NOT NULL,
  fecha_consulta      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  motivo_consulta     TEXT NOT NULL,
  exploracion_fisica  TEXT NULL,
  peso_kg             DECIMAL(5,2) NULL,
  talla_cm            DECIMAL(5,1) NULL,
  presion_sistolica   SMALLINT UNSIGNED NULL,
  presion_diastolica  SMALLINT UNSIGNED NULL,
  frecuencia_cardiaca SMALLINT UNSIGNED NULL,
  temperatura_c       DECIMAL(4,1) NULL,
  plan_tratamiento    TEXT NULL,
  notas_evolucion     TEXT NULL,
  eliminado_en        DATETIME NULL,                 -- borrado lógico
  creado_en           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_consultas_cita UNIQUE (cita_id),
  CONSTRAINT fk_consultas_expediente FOREIGN KEY (expediente_id) REFERENCES expedientes(id),
  CONSTRAINT fk_consultas_cita       FOREIGN KEY (cita_id)       REFERENCES citas(id),
  CONSTRAINT fk_consultas_medico     FOREIGN KEY (medico_id)     REFERENCES medicos(id),
  INDEX idx_consultas_expediente_fecha (expediente_id, fecha_consulta)
) ENGINE=InnoDB;

-- Historial de versiones: guarda el estado anterior de una consulta cada vez que se edita
CREATE TABLE consultas_historial (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  consulta_id    INT UNSIGNED NOT NULL,
  version        INT UNSIGNED NOT NULL,
  contenido_json JSON NOT NULL,
  modificado_por INT UNSIGNED NULL,
  modificado_en  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_consultas_hist_consulta FOREIGN KEY (consulta_id) REFERENCES consultas(id),
  CONSTRAINT fk_consultas_hist_usuario  FOREIGN KEY (modificado_por) REFERENCES usuarios(id),
  CONSTRAINT uq_consultas_hist_version UNIQUE (consulta_id, version)
) ENGINE=InnoDB;

-- Catálogo CIE-10 (se carga una versión resumida en el script 2; puedes ampliarlo)
CREATE TABLE cat_cie10 (
  codigo      VARCHAR(10)  NOT NULL PRIMARY KEY,
  descripcion VARCHAR(255) NOT NULL,
  INDEX idx_cie10_desc (descripcion)
) ENGINE=InnoDB;

CREATE TABLE diagnosticos (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  consulta_id   INT UNSIGNED NOT NULL,
  cie10_codigo  VARCHAR(10)  NOT NULL,
  tipo          ENUM('principal','secundario') NOT NULL DEFAULT 'principal',
  observaciones VARCHAR(255) NULL,
  CONSTRAINT fk_diagnosticos_consulta FOREIGN KEY (consulta_id)  REFERENCES consultas(id),
  CONSTRAINT fk_diagnosticos_cie10    FOREIGN KEY (cie10_codigo) REFERENCES cat_cie10(codigo)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 7. RECETAS
-- ---------------------------------------------------------------------
CREATE TABLE recetas (
  id                    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  consulta_id           INT UNSIGNED NOT NULL,
  folio                 VARCHAR(20)  NOT NULL,
  fecha_emision         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  indicaciones_generales TEXT NULL,
  CONSTRAINT uq_recetas_folio UNIQUE (folio),
  CONSTRAINT fk_recetas_consulta FOREIGN KEY (consulta_id) REFERENCES consultas(id)
) ENGINE=InnoDB;

CREATE TABLE receta_medicamentos (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  receta_id        INT UNSIGNED NOT NULL,
  medicamento      VARCHAR(150) NOT NULL,
  dosis            VARCHAR(80)  NOT NULL,       -- p. ej. "500 mg"
  frecuencia       VARCHAR(80)  NOT NULL,       -- p. ej. "cada 8 horas"
  duracion         VARCHAR(80)  NOT NULL,       -- p. ej. "7 días"
  via_administracion VARCHAR(50) NULL,
  indicaciones     VARCHAR(255) NULL,
  CONSTRAINT fk_recetameds_receta FOREIGN KEY (receta_id) REFERENCES recetas(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 8. ADJUNTOS (la app guarda el archivo en disco; aquí solo la ruta y metadatos)
-- ---------------------------------------------------------------------
CREATE TABLE adjuntos (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  expediente_id  INT UNSIGNED NOT NULL,
  consulta_id    INT UNSIGNED NULL,
  nombre_archivo VARCHAR(255) NOT NULL,
  ruta_archivo   VARCHAR(500) NOT NULL,
  tipo_mime      VARCHAR(100) NOT NULL,
  tamano_bytes   INT UNSIGNED NOT NULL,
  descripcion    VARCHAR(255) NULL,
  subido_por     INT UNSIGNED NULL,
  subido_en      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  eliminado_en   DATETIME NULL,
  CONSTRAINT fk_adjuntos_expediente FOREIGN KEY (expediente_id) REFERENCES expedientes(id),
  CONSTRAINT fk_adjuntos_consulta   FOREIGN KEY (consulta_id)   REFERENCES consultas(id),
  CONSTRAINT fk_adjuntos_usuario    FOREIGN KEY (subido_por)    REFERENCES usuarios(id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 9. BITÁCORA DE AUDITORÍA (quién vio / creó / modificó qué y cuándo)
-- ---------------------------------------------------------------------
CREATE TABLE bitacora_auditoria (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT UNSIGNED NULL,
  accion      ENUM('login','logout','consulta','crear','modificar','cancelar','eliminar_logico') NOT NULL,
  entidad     VARCHAR(50) NOT NULL,            -- p. ej. 'expediente', 'cita', 'paciente'
  entidad_id  INT UNSIGNED NULL,
  detalle     JSON NULL,
  ip          VARCHAR(45) NULL,
  creado_en   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_bitacora_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  INDEX idx_bitacora_entidad (entidad, entidad_id),
  INDEX idx_bitacora_usuario_fecha (usuario_id, creado_en)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 10. TRIGGERS: evitar citas empalmadas (mismo médico o mismo consultorio)
--     Las citas canceladas / no asistió / completadas no bloquean el horario.
-- ---------------------------------------------------------------------
DELIMITER $$

CREATE TRIGGER trg_citas_no_empalme_insert
BEFORE INSERT ON citas
FOR EACH ROW
BEGIN
  IF NEW.estado IN ('programada','confirmada','en_curso') THEN
    IF EXISTS (
      SELECT 1 FROM citas c
      WHERE c.medico_id = NEW.medico_id
        AND c.estado IN ('programada','confirmada','en_curso')
        AND NEW.fecha_hora_inicio < c.fecha_hora_fin
        AND NEW.fecha_hora_fin    > c.fecha_hora_inicio
    ) THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El médico ya tiene una cita en ese horario';
    END IF;

    IF NEW.consultorio_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM citas c
      WHERE c.consultorio_id = NEW.consultorio_id
        AND c.estado IN ('programada','confirmada','en_curso')
        AND NEW.fecha_hora_inicio < c.fecha_hora_fin
        AND NEW.fecha_hora_fin    > c.fecha_hora_inicio
    ) THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El consultorio ya está ocupado en ese horario';
    END IF;
  END IF;
END$$

CREATE TRIGGER trg_citas_no_empalme_update
BEFORE UPDATE ON citas
FOR EACH ROW
BEGIN
  IF NEW.estado IN ('programada','confirmada','en_curso') THEN
    IF EXISTS (
      SELECT 1 FROM citas c
      WHERE c.id <> OLD.id
        AND c.medico_id = NEW.medico_id
        AND c.estado IN ('programada','confirmada','en_curso')
        AND NEW.fecha_hora_inicio < c.fecha_hora_fin
        AND NEW.fecha_hora_fin    > c.fecha_hora_inicio
    ) THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El médico ya tiene una cita en ese horario';
    END IF;

    IF NEW.consultorio_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM citas c
      WHERE c.id <> OLD.id
        AND c.consultorio_id = NEW.consultorio_id
        AND c.estado IN ('programada','confirmada','en_curso')
        AND NEW.fecha_hora_inicio < c.fecha_hora_fin
        AND NEW.fecha_hora_fin    > c.fecha_hora_inicio
    ) THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El consultorio ya está ocupado en ese horario';
    END IF;
  END IF;
END$$

-- Historial de versiones: antes de editar una consulta, guarda cómo estaba
CREATE TRIGGER trg_consultas_historial
BEFORE UPDATE ON consultas
FOR EACH ROW
BEGIN
  DECLARE v_version INT UNSIGNED;
  SELECT COALESCE(MAX(version), 0) + 1 INTO v_version
    FROM consultas_historial WHERE consulta_id = OLD.id;

  INSERT INTO consultas_historial (consulta_id, version, contenido_json)
  VALUES (OLD.id, v_version, JSON_OBJECT(
    'motivo_consulta',    OLD.motivo_consulta,
    'exploracion_fisica', OLD.exploracion_fisica,
    'peso_kg',            OLD.peso_kg,
    'talla_cm',           OLD.talla_cm,
    'presion_sistolica',  OLD.presion_sistolica,
    'presion_diastolica', OLD.presion_diastolica,
    'frecuencia_cardiaca',OLD.frecuencia_cardiaca,
    'temperatura_c',      OLD.temperatura_c,
    'plan_tratamiento',   OLD.plan_tratamiento,
    'notas_evolucion',    OLD.notas_evolucion
  ));
END$$

DELIMITER ;

-- ---------------------------------------------------------------------
-- 11. VISTAS ÚTILES PARA EL DASHBOARD
-- ---------------------------------------------------------------------
CREATE VIEW v_agenda AS
SELECT
  c.id                AS cita_id,
  c.fecha_hora_inicio,
  c.fecha_hora_fin,
  c.estado,
  c.motivo,
  m.id                AS medico_id,
  CONCAT(m.nombre,' ',m.apellido_paterno) AS medico,
  p.id                AS paciente_id,
  CONCAT(p.nombre,' ',p.apellido_paterno,' ',COALESCE(p.apellido_materno,'')) AS paciente,
  co.nombre           AS consultorio
FROM citas c
JOIN medicos m        ON m.id = c.medico_id
JOIN pacientes p      ON p.id = c.paciente_id
LEFT JOIN consultorios co ON co.id = c.consultorio_id;

CREATE VIEW v_citas_por_medico_mes AS
SELECT
  m.id AS medico_id,
  CONCAT(m.nombre,' ',m.apellido_paterno) AS medico,
  DATE_FORMAT(c.fecha_hora_inicio,'%Y-%m') AS mes,
  COUNT(*) AS total_citas,
  SUM(c.estado = 'completada') AS completadas,
  SUM(c.estado = 'no_asistio') AS inasistencias,
  ROUND(100 * SUM(c.estado = 'no_asistio') / COUNT(*), 1) AS pct_inasistencia
FROM citas c
JOIN medicos m ON m.id = c.medico_id
GROUP BY m.id, medico, mes;

-- ---------------------------------------------------------------------
-- 12. USUARIO DE LA APLICACIÓN (el que pondrás en el .env)
--     ⚠ Cambia la contraseña por una tuya antes de ejecutar.
-- ---------------------------------------------------------------------
CREATE USER IF NOT EXISTS 'clinica_app'@'localhost' IDENTIFIED BY 'CambiaEstaClave_123';
GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE ON clinica.* TO 'clinica_app'@'localhost';
FLUSH PRIVILEGES;

-- Verificación rápida
SHOW TABLES;
