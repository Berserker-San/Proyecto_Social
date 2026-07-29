# Mejora 8. Registrar detalles de medicamentos

## Prompt para Kiro

```text
Amplía la sección de medicamentos en "Salud y Bienestar".

Cuando la persona responda "Sí" a "¿Toma algún medicamento?", el sistema debe permitir registrar:
- Nombre del medicamento.
- Concentración o dosis.
- Frecuencia de consumo.

Antes de implementar:
1. Revisa si actualmente existe un único campo de texto.
2. Determina si el sistema debe permitir uno o varios medicamentos.
3. Revisa cómo se muestran estos datos en consultas, edición, reportes y CSV.

Implementación preferida:
- Si una persona puede registrar varios medicamentos, crear una lista dinámica con opción de agregar y retirar filas.
- Cada fila debe contener nombre, concentración o dosis y frecuencia.
- Al cambiar la respuesta a "No", solicitar confirmación antes de eliminar detalles ya registrados.
- Validar que no existan filas completamente vacías.
- Mantener la información histórica que esté guardada en el campo anterior.

Pruebas de aceptación:
- Al responder "No", los campos de medicamentos permanecen ocultos.
- Al responder "Sí", se muestran los campos requeridos.
- Se puede guardar y editar la información.
- Si se permiten varios medicamentos, cada uno se conserva de manera independiente.
- Los datos históricos se migran o se presentan sin pérdida.
```