# UX QA v0.9.18 · ERP SOLUSOFT

Primera ronda segura de mejoras UX sin tocar lógica contable ni rutas principales.

## Cambios aplicados

- Estilos globales base en `src/styles.scss`.
- Identificador visible de build: `ERP SOLUSOFT v0.9.18 · UX QA`.
- Mejora visual del Dashboard de Oficina.
- Rediseño UX de Libro Mayor:
  - encabezado más claro,
  - filtros ordenados,
  - estados de carga/vacío,
  - tabla más legible,
  - botón PDF más distinguible.
- Rediseño UX de Balance de comprobación:
  - encabezado más profesional,
  - filtros ordenados,
  - estados claros,
  - tabla más legible,
  - totales destacados.
- Ajustes responsive básicos para pantallas pequeñas.

## Archivos modificados

- `src/styles.scss`
- `src/app/pages/office/office-dashboard/office-dashboard.html`
- `src/app/pages/office/office-dashboard/office-dashboard.scss`
- `src/app/pages/office/ledger-report/ledger-report.component.html`
- `src/app/pages/office/ledger-report/ledger-report.component.scss`
- `src/app/pages/office/trial-balance/trial-balance.component.html`
- `src/app/pages/office/trial-balance/trial-balance.component.scss`

## Instalación sugerida

1. Respaldar tu carpeta `Master_web` actual.
2. Reemplazar los archivos modificados o copiar esta carpeta sobre tu proyecto.
3. Ejecutar:

```bash
npm install
npm run build
```

4. Copiar el build generado al `public` de la API.
5. Probar Dashboard, Libro Mayor, Balance y PDF.

