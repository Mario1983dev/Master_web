# QA pendiente en API / BD - ERP SOLUSOFT

Este paquete corrige y refuerza principalmente el Web Angular. Para cerrar la etapa profesional de QA, falta implementar en la API/BD:

## Asientos
- Validar en backend que Debe = Haber.
- Rechazar líneas vacías o incompletas.
- Rechazar líneas con Debe y Haber al mismo tiempo.
- Rechazar montos negativos.
- Validar empresa seleccionada y permisos del usuario.
- Validar período contable activo y estado abierto/cerrado.

## Logs técnicos
- Registrar errores reales del backend con usuario, empresa, endpoint, módulo, acción, fecha/hora y detalle técnico.
- No mostrar el error técnico completo al usuario final.

## Auditoría
Crear tabla básica `audit_log` para registrar:
- user_id
- company_id
- module
- action
- record_id
- description
- created_at

Acciones iniciales sugeridas:
- ASIENTOS_CREATE
- ASIENTOS_UPDATE
- ASIENTOS_VOID
- EMPRESAS_CREATE/UPDATE
- USUARIOS_CREATE/UPDATE
- SII_IMPORT
- SII_GENERATE_ENTRIES

## Importador SII
- Validar duplicados reales por empresa, período, tipo de libro y archivo.
- Validar filas antes de importar.
- Evitar generar asientos duplicados si el libro ya tiene asiento generado.

## Backups
- Crear respaldo manual de BD.
- Luego automatizar respaldo diario o semanal.
- Guardar backups fuera de la BD.
