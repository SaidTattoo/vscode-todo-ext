/**
 * ARCHIVO DE EJEMPLO - TODO Tree Extension
 * 
 * Este archivo demuestra todos los tipos de comentarios y formas de usar la extensión.
 * Abre este archivo y luego abre el panel "Todo Tree" en el sidebar para ver los resultados.
 */

// ============================================================================
// 1. COMENTARIOS TODO - Tareas pendientes
// ============================================================================

// TODO: Implementar validación de email
// TODO: Agregar tests unitarios para esta función
// TODO: Mejorar el rendimiento de esta consulta

// TODO con autor (formato: TODO(autor): descripción)
// TODO(said): Revisar la lógica de autenticación
// TODO(juan): Optimizar consultas a la base de datos
// TODO(maria): Agregar manejo de errores

// TODO con auto-clasificación (palabras clave como "urgent" -> se trata como FIXME)
// TODO: urgent - Corregir bug crítico en el login
// TODO: crítico - Validar permisos antes de ejecutar
// TODO: bug importante - El formulario no valida campos requeridos

// ============================================================================
// 2. COMENTARIOS FIXME - Bugs o problemas que necesitan corrección
// ============================================================================

// FIXME: El timeout es muy corto, causa errores en conexiones lentas
// FIXME: Esta función no maneja el caso cuando el array está vacío
// FIXME: Memory leak - el event listener no se está removiendo

// FIXME con autor
// FIXME(said): El cálculo de impuestos está incorrecto
// FIXME(juan): La función retorna undefined en algunos casos
// FIXME(maria): Corregir el formato de fecha que causa error

// FIXME con auto-clasificación
// TODO: error crítico - La API falla cuando el token expira
// TODO: fix importante - El botón no se deshabilita correctamente

// ============================================================================
// 3. COMENTARIOS NOTE - Notas importantes o documentación
// ============================================================================

// NOTE: Esta función usa un algoritmo O(n log n) para mejor rendimiento
// NOTE: El orden de los parámetros es importante, no cambiar
// NOTE: Esta configuración debe coincidir con el servidor de producción

// NOTE con autor
// NOTE(said): Este código fue optimizado después de profiling
// NOTE(juan): La razón de este workaround está documentada en el ticket #123
// NOTE(maria): Cambiar esto requiere actualizar también la base de datos

// ============================================================================
// 4. COMENTARIOS HACK - Soluciones temporales o workarounds
// ============================================================================

// HACK: Solución temporal hasta que el backend implemente el endpoint correcto
// HACK: Usar setTimeout porque el evento no se dispara correctamente
// HACK: Workaround para un bug conocido en la versión 2.3.1 de la librería

// HACK con autor
// HACK(said): Temporal - reemplazar cuando el equipo de backend termine
// HACK(juan): Quick fix - necesita refactorización completa
// HACK(maria): Solución temporal hasta el próximo release

// HACK con auto-clasificación
// TODO: temporal - Esta solución debe reemplazarse pronto
// TODO: workaround - El API no soporta este caso todavía

// ============================================================================
// 5. COMENTARIOS XXX - Código problemático o que necesita atención urgente
// ============================================================================

// XXX: Este código es muy complejo y difícil de mantener
// XXX: Hay un problema de seguridad aquí que necesita revisión
// XXX: Performance issue - esta función es muy lenta con grandes volúmenes

// XXX con autor
// XXX(said): Revisar esta lógica, parece incorrecta
// XXX(juan): Posible race condition, necesita sincronización
// XXX(maria): Este código viola el principio DRY

// ============================================================================
// 6. COMENTARIOS EN BLOQUE (/* */) - Multi-línea
// ============================================================================

/* TODO: Refactorizar esta clase completa
   La estructura actual es difícil de mantener
   y necesita una arquitectura más limpia */

/* FIXME(said): El método calculateTotal tiene un bug
   cuando se aplican múltiples descuentos.
   Necesita revisión urgente. */

/* NOTE: Este bloque de código fue copiado de la documentación
   oficial y adaptado a nuestras necesidades.
   No modificar sin consultar primero. */

/* HACK: Solución temporal para el problema de timezone
   El servidor retorna fechas en UTC pero necesitamos local time
   TODO: Implementar correctamente cuando el backend esté listo */

// ============================================================================
// 7. COMENTARIOS EN DOCUMENTACIÓN JSDoc (/** */)
// ============================================================================

/**
 * TODO: Agregar validación de parámetros
 * FIXME: El retorno puede ser null en algunos casos
 * NOTE: Esta función es llamada desde múltiples lugares
 * 
 * @param {string} userId - ID del usuario
 * @returns {Promise<User>} - Objeto usuario
 */
async function getUserById(userId) {
    // Implementación...
}

/**
 * FIXME(said): El método de hash necesita actualizarse
 * a SHA-256 para cumplir con los nuevos estándares de seguridad
 * 
 * @param {string} password - Contraseña a hashear
 * @returns {string} - Hash de la contraseña
 */
function hashPassword(password) {
    // Implementación...
}

// ============================================================================
// 8. EJEMPLOS DE DEUDA TÉCNICA (comentarios antiguos)
// ============================================================================
// Nota: Estos comentarios aparecerán con 🔴 si tienen más de 3 meses en Git

// TODO: Migrar de jQuery a vanilla JavaScript (comentario antiguo)
// FIXME: El sistema de cache necesita actualización (comentario antiguo)
// NOTE: Esta API está deprecada, usar la nueva versión (comentario antiguo)

// ============================================================================
// 9. COMENTARIOS CON VARIOS TIPOS EN UNA LÍNEA
// ============================================================================

// TODO: Implementar | FIXME: Bug conocido | NOTE: Documentar mejor

// ============================================================================
// 10. CASOS ESPECIALES Y EDGE CASES
// ============================================================================

// TODO: Sin descripción (se mostrará "Sin descripción")
// FIXME: 
// NOTE: 

// TODO con formato alternativo
// TODO - Implementar feature
// TODO Implementar feature (sin dos puntos)

// TODO con múltiples palabras clave
// TODO: urgent crítico importante - Este es un caso de alta prioridad

// ============================================================================
// 11. EJEMPLOS DE USO DE LA EXTENSIÓN
// ============================================================================

/*
 * CÓMO USAR LA EXTENSIÓN:
 * 
 * 1. Abre el panel "Todo Tree" en el sidebar (icono de checklist)
 * 
 * 2. VER MÉTRICAS:
 *    - Arriba verás un resumen con totales, críticos, y deuda técnica
 *    - Las barras visuales muestran porcentajes
 * 
 * 3. FILTRAR:
 *    - Por autor: Click en el icono de filtro → "Filtrar por autor"
 *    - Por tipo: Click en el icono de filtro → "Filtrar por tipo"
 *    - Por texto: Click en el icono de búsqueda → Escribe tu búsqueda
 *    - Por antigüedad: Usa el comando "Filtrar por antigüedad"
 * 
 * 4. NAVEGAR:
 *    - Click en cualquier TODO para ir a esa línea
 *    - Ctrl+Alt+N: Siguiente TODO
 *    - Ctrl+Alt+P: Anterior TODO
 * 
 * 5. HOVER:
 *    - Pasa el mouse sobre un TODO para ver:
 *      - Información de Git (autor, fecha, commit)
 *      - Fragmento de código alrededor
 *      - Antigüedad del comentario
 * 
 * 6. VISTA POR AUTOR:
 *    - Configura "todoTree.viewMode": "byAuthor" en settings.json
 *    - Los TODOs se agruparán por autor en lugar de por archivo
 * 
 * 7. INDICADORES DE DEUDA TÉCNICA:
 *    - 🟢 Reciente (< 2 semanas)
 *    - 🟡 Viejo (2 semanas - 3 meses)
 *    - 🔴 Deuda técnica (> 3 meses)
 */

// ============================================================================
// 12. EJEMPLOS DE AUTO-CLASIFICACIÓN
// ============================================================================

// Estos comentarios se auto-clasifican basándose en palabras clave:

// TODO: urgent - Se trata como FIXME automáticamente
// TODO: crítico - Se trata como FIXME automáticamente
// TODO: bug importante - Se trata como FIXME automáticamente
// TODO: temporal - Se trata como HACK automáticamente
// TODO: workaround - Se trata como HACK automáticamente

// ============================================================================
// 13. NUEVOS TIPOS DE COMENTARIOS (BUG, USEFUL, COMMENT, LEARN, etc.)
// ============================================================================

// BUG: Error crítico en el sistema de autenticación
// BUG: El botón no responde al hacer click
// BUG(said): Memory leak en el componente de video

// USEFUL: Este patrón de código es útil para otros proyectos
// USEFUL: Referencia a documentación importante
// USEFUL(juan): Ejemplo de implementación de singleton

// COMMENT: Explicación adicional sobre esta función
// COMMENT: Nota sobre el comportamiento esperado
// COMMENT(maria): Contexto histórico de esta decisión

// LEARN: Investigar más sobre este algoritmo
// LEARN: Estudiar la implementación de esta librería
// LEARN(said): Revisar mejores prácticas para este caso

// SEE NOTES: Ver documentación en el archivo notes.md
// SEE NOTES: Consultar el ticket #456 para más detalles
// SEE NOTES(juan): Revisar comentarios en el PR #123

// POST: Publicar este código en el blog técnico
// POST: Compartir esta solución con el equipo
// POST(maria): Documentar este patrón en la wiki

// RECHECK: Verificar que esta lógica sigue siendo correcta
// RECHECK: Revisar después del cambio en la API
// RECHECK(said): Validar después de actualizar dependencias

// INCOMPLETE: Falta implementar la validación de errores
// INCOMPLETE: Pendiente agregar tests unitarios
// INCOMPLETE(juan): Completar la función de exportación

// Comentarios con checkboxes
// TODO [ ] Implementar feature pendiente
// TODO [x] Feature completada
// FIXME [ ] Bug por corregir
// NOTE [x] Documentación actualizada

// ============================================================================
// 14. FUNCIONES DE EJEMPLO CON TODOs
// ============================================================================

function ejemploFuncionConTodos() {
    // TODO: Agregar validación de entrada
    // FIXME: Manejar el caso cuando data es null
    // NOTE: Esta función se usa en 5 lugares diferentes
    
    const data = getData();
    
    // HACK: Usar JSON.parse dos veces por un bug en la API
    const parsed = JSON.parse(JSON.parse(data));
    
    // XXX: Este código es muy complejo, necesita simplificación
    return processedData;
}

// TODO(said): Refactorizar esta función completa
// FIXME(juan): El error handling no es suficiente
// NOTE(maria): Esta función es crítica para el sistema
async function otraFuncionEjemplo() {
    try {
        // Implementación...
    } catch (error) {
        // TODO: Mejorar el manejo de errores
        console.error(error);
    }
}

// ============================================================================
// FIN DEL ARCHIVO DE EJEMPLO
// ============================================================================

