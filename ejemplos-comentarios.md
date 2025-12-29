# Ejemplos de Comentarios Soportados por la Extensión Todo Tree

Esta extensión soporta los siguientes tipos de comentarios TODO, FIXME, NOTE, HACK y XXX en múltiples formatos de comentarios.

## Tipos de Comentarios Soportados

- **TODO**: Tareas pendientes
- **FIXME**: Código que necesita ser corregido
- **NOTE**: Notas importantes
- **HACK**: Soluciones temporales o workarounds
- **XXX**: Código problemático o que necesita atención

---

## Formatos Soportados

### 1. Comentarios de línea simple (//) - JavaScript, TypeScript, Java, C#, C++, Go, etc.

```javascript
// TODO: Implementar función de validación
// FIXME: Este código tiene un bug conocido
// NOTE: Esta optimización mejora el rendimiento en un 50%
// HACK: Solución temporal hasta que se arregle el API
// XXX: Este código necesita refactorización urgente

// Con autor/responsable
// TODO(said): Agregar validación de email
// FIXME(juan): Corregir cálculo de impuestos
// NOTE(maria): Documentar mejor esta función
// HACK(pedro): Workaround para bug del framework
// XXX(ana): Revisar esta lógica con el equipo
```

### 2. Comentarios con # - Python, Ruby, Shell, YAML, etc.

```python
# TODO: Migrar a la nueva versión de la API
# FIXME: Manejar excepción cuando la conexión falla
# NOTE: Este módulo es usado por múltiples servicios
# HACK: Usar variable global temporalmente
# XXX: Este algoritmo tiene complejidad O(n²), optimizar

# Con autor/responsable
# TODO(carlos): Implementar cache para mejorar performance
# FIXME(laura): Agregar manejo de errores
# NOTE(miguel): Esta función es thread-safe
# HACK(sofia): Parche temporal para problema de encoding
# XXX(luis): Refactorizar este código legacy
```

### 3. Comentarios con -- - SQL, Lua, Haskell, Ada, etc.

```sql
-- TODO: Agregar índice para mejorar consultas
-- FIXME: Esta query es muy lenta, optimizar
-- NOTE: Esta tabla es usada por el sistema de reportes
-- HACK: Usar UNION en lugar de JOIN por limitación del ORM
-- XXX: Revisar lógica de esta stored procedure

-- Con autor/responsable
-- TODO(diego): Normalizar tabla de usuarios
-- FIXME(patricia): Corregir cálculo de totales
-- NOTE(ricardo): Esta vista se actualiza cada hora
-- HACK(fernanda): Workaround para limitación del motor SQL
-- XXX(roberto): Migrar a stored procedure con parámetros
```

### 4. Comentarios multi-línea (/* */) - C, JavaScript, TypeScript, Java, etc.

```javascript
/* TODO: Implementar sistema de logs */
/* FIXME: Corregir memory leak en esta función */
/* NOTE: Esta sección es crítica para el rendimiento */
/* HACK: Solución temporal hasta actualizar la librería */
/* XXX: Este código es legacy y necesita modernización */

/* Con autor/responsable */
/* TODO(andres): Refactorizar esta clase */
/* FIXME(beatriz): Arreglar race condition */
/* NOTE(cristina): Esta función es llamada 1000 veces/seg */
/* HACK(daniel): Parche para compatibilidad con IE11 */
/* XXX(elena): Revisar seguridad de este endpoint */
```

### 5. Comentarios dentro de bloques multi-línea (*) - Java, JavaScript, etc.

```java
/**
 * Esta es una función importante
 * TODO: Agregar documentación completa
 * FIXME: El método tiene un bug en el edge case
 * NOTE: Este método es usado por el sistema de autenticación
 * HACK: Usar reflection temporalmente
 * XXX: Refactorizar esta clase completa
 */

/**
 * TODO(victor): Implementar método de búsqueda
 * FIXME(gabriela): Manejar timeout de la conexión
 * NOTE(hernan): Esta clase implementa el patrón Singleton
 * HACK(irene): Workaround para bug conocido en JDK
 * XXX(jorge): Esta clase viola el principio SOLID
 */
```

---

## Variaciones Soportadas

### Con dos puntos (:) - Opcional

```javascript
// TODO: Tarea pendiente
// TODO Tarea pendiente (sin dos puntos también funciona)
// TODO(said): Tarea con autor
// TODO(said) Tarea con autor sin dos puntos
```

### Con espacios - Flexible

```javascript
//TODO: Sin espacio funciona
// TODO : Con espacios funciona
//  TODO  : Múltiples espacios funcionan
```

---

## Ejemplo Completo por Lenguaje

### JavaScript/TypeScript

```javascript
// TODO: Implementar autenticación
// FIXME(juan): Corregir bug en función calculateTotal
// NOTE: Este código usa el patrón Observer
// HACK: Usar any temporalmente hasta tipar correctamente
// XXX: Refactorizar toda esta sección

function example() {
    /* TODO: Agregar validación */
    /* FIXME(maria): Arreglar cálculo */
    /* NOTE: Este bloque es crítico */
    /* HACK: Solución temporal */
    /* XXX: Código legacy */
}
```

### Python

```python
# TODO: Implementar clase de validación
# FIXME(carlos): Corregir manejo de excepciones
# NOTE: Esta función es async
# HACK: Usar threading temporalmente
# XXX: Migrar a Python 3.9+

def example():
    # TODO: Agregar type hints
    # FIXME: Arreglar bug con None
    pass
```

### SQL

```sql
-- TODO: Agregar constraints
-- FIXME(diego): Optimizar esta query
-- NOTE: Esta tabla se actualiza diariamente
-- HACK: Usar función deprecated temporalmente
-- XXX: Migrar a nueva estructura

SELECT * FROM users
-- TODO: Agregar WHERE clause
```

### Java

```java
// TODO: Implementar método
// FIXME(andres): Corregir null pointer
// NOTE: Esta clase es thread-safe
// HACK: Usar synchronized temporalmente
// XXX: Refactorizar

/**
 * TODO(victor): Documentar mejor
 * FIXME: Arreglar bug conocido
 */
public class Example {
    // TODO: Implementar
}
```

---

## Notas Importantes

1. **Sensibilidad a mayúsculas/minúsculas**: Los tipos son case-insensitive
   - `TODO`, `todo`, `Todo` funcionan igual

2. **Filtro por autor**: Puedes filtrar por autor usando el comando `todoTree.filterByAuthor`
   - Formato: `TODO(author): descripción`
   - Ejemplo: `TODO(said): implementar feature` → se puede filtrar por "said"

3. **Colores y iconos**: Cada tipo tiene su color e icono distintivo en el sidebar y en el gutter

4. **Actualización automática**: Los comentarios se detectan automáticamente al guardar archivos

---

## Configuración Personalizada

Los tipos y patrones pueden ser configurados en `settings.json`:

```json
{
  "todoTree.patterns": {
    "TODO": {
      "icon": "check",
      "color": "blue"
    },
    "FIXME": {
      "icon": "bug",
      "color": "red"
    }
  }
}
```

