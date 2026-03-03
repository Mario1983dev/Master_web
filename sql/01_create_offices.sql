-- =========================================================
-- SOLUSOFT - MASTER CONTABILIDAD
-- Script: 01_master_offices.sql
-- Objeto: Tabla OFFICES (Tenants del sistema)
-- Base de datos: contabilidad_master
-- =========================================================

USE contabilidad_master;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------
-- Eliminar tabla si existe (solo entorno desarrollo)
-- ---------------------------------------------------------
DROP TABLE IF EXISTS offices;

-- ---------------------------------------------------------
-- Crear tabla offices
-- ---------------------------------------------------------
CREATE TABLE offices (
  id INT AUTO_INCREMENT PRIMARY KEY,

  rut VARCHAR(12) NOT NULL,
  name VARCHAR(120) NOT NULL,
  legal_name VARCHAR(160) NULL,

  email VARCHAR(120) NULL,
  phone VARCHAR(30) NULL,

  status TINYINT NOT NULL DEFAULT 1, -- 1=Activa, 0=Inactiva

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_offices_rut (rut),
  KEY idx_offices_status (status)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------
-- Datos de ejemplo (puedes borrar si quieres)
-- ---------------------------------------------------------
INSERT INTO offices (rut, name, legal_name, email, phone, status)
VALUES
('76123456-7', 'Oficina Santiago', 'SoluSoft SPA', 'contacto@solusoftspa.cl', '+56 9 1111 2222', 1),
('76987654-3', 'Oficina Valparaíso', 'Cliente Demo Ltda', 'demo@cliente.cl', '+56 9 3333 4444', 1);