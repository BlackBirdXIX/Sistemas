-- Script de configuración de usuario para clinica_app
-- Ejecutar como root antes de los scripts de Sonnet

-- Crear/reemplazar usuario clinica_app con la contraseña indicada
DROP USER IF EXISTS 'clinica_app'@'localhost';
CREATE USER 'clinica_app'@'localhost' IDENTIFIED BY 'Elpollo123';

-- Los permisos se otorgarán después de crear la base (script 01 la crea)
-- Por ahora damos permisos globales temporales para que pueda conectar
GRANT ALL PRIVILEGES ON clinica.* TO 'clinica_app'@'localhost';
FLUSH PRIVILEGES;

SELECT 'Usuario clinica_app creado correctamente' AS resultado;
