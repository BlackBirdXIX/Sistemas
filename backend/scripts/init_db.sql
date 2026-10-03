-- Script SQL de Creación de Base de Datos y Usuario de Aplicación
-- Sistema de Citas y Expedientes Médicos - México

CREATE DATABASE IF NOT EXISTS `clinica` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Crear usuario de aplicación y otorgar privilegios
CREATE USER IF NOT EXISTS 'clinica_user'@'localhost' IDENTIFIED BY 'clinica_pass123';
GRANT ALL PRIVILEGES ON `clinica`.* TO 'clinica_user'@'localhost';
FLUSH PRIVILEGES;

USE `clinica`;

-- Las tablas son gestionadas automáticamente por Alembic y SQLAlchemy 2.0 ORM.
