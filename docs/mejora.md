# Mejora 4. Ampliar ciudad, barrio y corregimiento

## Prompt para Kiro

```text
Ajusta el registro de ubicación para permitir personas que viven dentro y fuera de Cali.

Necesidad:
Actualmente existen personas de lugares como Bitaco y participantes vinculados con Fanalca, por lo que las opciones de ciudad, barrio y corregimiento deben ser más amplias.

Antes de implementar:
1. Revisa si ciudad, barrio, corregimiento, comuna y departamento se manejan como listas, texto, catálogos o llaves foráneas.
2. Revisa si el sistema asume que todas las personas viven en Cali.
3. Identifica filtros, reportes y validaciones que dependan de esa suposición.

Propuesta funcional:
- Incluir departamento o región cuando no exista.
- Permitir seleccionar una ciudad o municipio.
- Mostrar comuna solo cuando la ubicación corresponda a Cali.
- Permitir registrar barrio o corregimiento según corresponda.
- Agregar la opción "Otro" con campo de texto controlado cuando el lugar no exista en el catálogo.
- Evitar que un usuario tenga que seleccionar una comuna de Cali si vive fuera de Cali.
- Mantener los datos históricos sin pérdida.

Pruebas de aceptación:
- Se puede registrar una persona residente en Cali.
- Se puede registrar una persona residente fuera de Cali.
- La comuna se solicita únicamente cuando aplica.
- Se puede registrar un corregimiento.
- Los filtros y reportes distinguen correctamente ciudad, barrio y corregimiento.