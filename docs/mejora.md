
# Mejora 12. Filtrar asistencia y eventos por macro o programa

## Prompt para Kiro

```text
Ajusta los módulos de eventos y asistencia para trabajar por macro o programa.

Problema:
Actualmente se muestran todas las personas registradas y no existe una discriminación clara por macro o programa.

Antes de implementar:
1. Revisa cómo se relacionan actualmente personas, eventos, macros y programas.
2. Determina si una persona puede pertenecer a una o varias macros o programas.
3. Determina si un evento puede pertenecer a una o varias macros o programas.
4. Revisa permisos, reportes, filtros y registros históricos.

Cambios requeridos:
- Permitir asignar uno o varios macros o programas a un evento, según el modelo existente.
- Al tomar asistencia, mostrar por defecto solo las personas vinculadas con el macro o programa del evento.
- Agregar filtros por macro, programa, evento, estado de asistencia y búsqueda por nombre o documento.
- Mostrar un resumen de presentes, ausentes, justificados y sin marcar dentro del filtro actual.
- Evitar registrar dos veces la asistencia de la misma persona al mismo evento.
- Definir el comportamiento de personas vinculadas con más de un macro o programa.
- Mantener acceso a eventos históricos.
- Aplicar permisos para que cada usuario vea únicamente los macros o programas autorizados, si el sistema ya maneja ese alcance.

Pruebas de aceptación:
- Un evento puede asociarse con su macro o programa.
- La lista de asistencia muestra únicamente las personas correspondientes.
- Cambiar el filtro actualiza la lista y los conteos.
- Una persona vinculada con varios programas no se duplica en el mismo evento.
- Los reportes respetan los filtros.
- Los eventos antiguos continúan visibles.
```