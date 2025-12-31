# Todo Tree Extension

Una extensión completa y avanzada para Visual Studio Code y Cursor que muestra todos los TODOs, FIXMEs, NOTES, HACKs y otros comentarios en un árbol organizado, con colores personalizables, filtros avanzados, integración con Git y visualización de deuda técnica.

## 🚀 Características Principales

### 📋 Visualización Organizada
- **Árbol de comentarios**: Muestra todos los comentarios organizados por archivo o por autor
- **Resumen visual con métricas**: Dashboard con totales, críticos y deuda técnica
- **Badge con contador**: Muestra el número total de TODOs en el icono del activity bar
- **Colores personalizables**: Sistema completo de highlights con fondo y texto personalizables
- **Iconos en el gutter**: Iconos visuales en el margen izquierdo junto a los números de línea

### 🎨 Sistema de Highlights Personalizables

La extensión soporta un sistema completo de highlights similar a Todo Tree clásico, con colores de fondo y texto completamente personalizables:

- **Foreground**: Color del texto del comentario
- **Background**: Color de fondo del comentario (con opacidad configurable)
- **Icon Colour**: Color del icono en el gutter
- **Gutter Icon**: Mostrar/ocultar iconos en el gutter
- **Opacidad**: Control de transparencia del fondo

### 📊 Tipos de Comentarios Soportados

#### Tipos Estándar
- **TODO**: Tareas pendientes
- **FIXME**: Bugs o problemas que necesitan corrección
- **NOTE**: Notas importantes o documentación
- **HACK**: Soluciones temporales o workarounds
- **XXX**: Código problemático o que necesita atención urgente

#### Tipos Adicionales
- **BUG**: Errores críticos
- **USEFUL**: Información útil o referencias
- **COMMENT**: Comentarios generales
- **LEARN**: Cosas para aprender o investigar
- **SEE NOTES**: Referencias a notas o documentación
- **POST**: Cosas para publicar o compartir
- **RECHECK**: Cosas para revisar o verificar
- **INCOMPLETE**: Código incompleto
- **`[ ]` y `[x]`**: Checkboxes (soportados antes del tipo)

### 🔍 Filtros Avanzados

- **Filtro por autor**: Desplegable con todos los autores detectados automáticamente
- **Filtro por tipo**: Filtra por tipo de comentario (TODO, FIXME, NOTE, etc.)
- **Búsqueda por texto**: Busca dentro del contenido de los comentarios
- **Filtro por antigüedad**: Filtra por deuda técnica (>3 meses) o recientes (<1 semana)
- **Focus automático**: Filtra automáticamente por el archivo activo
- **Filtros combinables**: Puedes combinar múltiples filtros simultáneamente

### 🎯 Vista por Autor

Alterna entre dos modos de visualización:
- **Por archivo** (default): Agrupa TODOs por archivo
- **Por autor**: Agrupa TODOs por autor/responsable

### 🔗 Integración con Git

- **Auto-autoría**: Detecta automáticamente el autor del commit usando Git Blame
- **Información de antigüedad**: Muestra cuándo fue creado el comentario
- **Indicadores de deuda técnica**:
  - 🟢 Reciente (< 2 semanas)
  - 🟡 Viejo (2 semanas - 3 meses)
  - 🔴 Deuda técnica (> 3 meses)
- **Hover rico**: Muestra información completa de Git (autor, fecha, commit hash)

### ⌨️ Navegación Rápida

- **Siguiente TODO**: `Ctrl+Alt+N` para navegar al siguiente TODO
- **Anterior TODO**: `Ctrl+Alt+P` para navegar al anterior TODO
- **Navegación inteligente**: Respeta los filtros activos y ordena por prioridad
- **Orden inteligente**: FIXME/XXX primero, luego TODO, luego NOTE/HACK

### 📝 Formatos Soportados

La extensión detecta comentarios en múltiples formatos:

#### Comentarios de línea simple (`//`)
```javascript
// TODO: Implementar función
// TODO(autor): Tarea asignada
// FIXME: Corregir bug
// NOTE: Documentación importante
// TODO [ ] Tarea pendiente
// TODO [x] Tarea completada
```

#### Comentarios con `#` (Python, Ruby, Shell)
```python
# TODO: Migrar API
# FIXME(autor): Manejar excepción
# BUG: Error crítico
# USEFUL: Referencia importante
```

#### Comentarios con `--` (SQL, Lua)
```sql
-- TODO: Agregar índice
-- FIXME: Optimizar query
-- NOTE: Documentación
```

#### Comentarios multi-línea (`/* */`)
```javascript
/* TODO: Implementar sistema */
/* FIXME(autor): Arreglar bug */
/* NOTE: Información importante */
```

#### Comentarios en bloques (`/** */`)
```java
/**
 * TODO: Agregar documentación
 * FIXME: El método tiene un bug
 * NOTE: Ver documentación en wiki
 */
```

### 🎨 Auto-clasificación Inteligente

La extensión detecta automáticamente palabras clave y ajusta el tipo:

- **Palabras urgentes** → Se trata como FIXME:
  - "urgent", "crítico", "critical", "bug", "error", "fix"
- **Palabras temporales** → Se trata como HACK:
  - "temporal", "temporary", "workaround", "quick fix"

Ejemplo:
```javascript
// TODO: urgent - Corregir bug crítico  // Se muestra como FIXME
// TODO: temporal - Solución rápida     // Se muestra como HACK
```

## 📦 Instalación

1. Busca "Todo Tree" en el marketplace de VS Code
2. Haz clic en "Install"
3. La extensión aparecerá en el activity bar con el icono de checklist
4. ¡Listo! No requiere configuración adicional para empezar a usar

## 🎮 Uso

### Vista Básica

1. Abre el sidebar "Todo Tree" desde el activity bar
2. Verás un resumen visual con métricas al inicio
3. Los comentarios están organizados por archivo (o por autor si cambias el modo)
4. Haz clic en cualquier TODO para navegar directamente al código

### Resumen de Métricas

Al abrir el panel, verás un dashboard con:
- **Total de TODOs**: Contador general
- **Críticos**: FIXME + XXX con barra de progreso visual
- **Por tipo**: TODO, NOTE, HACK con contadores
- **Deuda técnica**: TODOs con más de 3 meses de antigüedad

### Filtros

#### Filtrar por Autor
1. Haz clic en el botón "Filtrar por autor" en el título del sidebar
2. Selecciona un autor del desplegable (muestra todos los autores detectados)
3. Selecciona "Todos los autores" para limpiar el filtro

#### Filtrar por Tipo
1. Haz clic en el botón "Filtrar por tipo" en el título del sidebar
2. Selecciona el tipo (TODO, FIXME, NOTE, HACK, XXX, etc.)
3. Selecciona "Todos" para limpiar el filtro

#### Buscar por Texto
1. Haz clic en el botón "Buscar en TODOs" en el título del sidebar
2. Escribe el texto a buscar en el contenido de los comentarios

#### Filtrar por Antigüedad
1. Ejecuta el comando "Filtrar por antigüedad" desde la paleta de comandos
2. Selecciona:
   - **Todos**: Sin filtro
   - **Solo Críticos (>3 meses)**: Solo TODOs con más de 3 meses
   - **Recientes (<1 semana)**: Solo TODOs con menos de 1 semana

#### Limpiar Filtros
- Haz clic en el botón "Limpiar filtros" (Alt+Click en el botón de autor)
- O ejecuta el comando "Limpiar filtros" desde la paleta de comandos

### Navegación Rápida

- **Siguiente TODO**: Presiona `Ctrl+Alt+N` (o `Cmd+Alt+N` en Mac)
- **Anterior TODO**: Presiona `Ctrl+Alt+P` (o `Cmd+Alt+P` en Mac)
- **Click en TODO**: Navega directamente a la línea del comentario

### Hover Rico

Pasa el mouse sobre cualquier TODO en el árbol para ver:
- Tipo de comentario (con indicador si fue auto-clasificado)
- Autor (del texto o de Git)
- Archivo y línea
- Fragmento de código (3-5 líneas alrededor)
- Información de Git (si está disponible):
  - Hash del commit (abreviado)
  - Fecha exacta del commit
  - Antigüedad con indicador visual

### Vista por Autor

Para cambiar a la vista por autor:
1. Abre `settings.json` (Ctrl+Shift+P → "Preferences: Open Settings (JSON)")
2. Agrega: `"todoTree.viewMode": "byAuthor"`
3. Los TODOs se agruparán por autor en lugar de por archivo

### Formato de Comentarios

#### Con Autor
```
// TODO(autor): Descripción de la tarea
// FIXME(juan): Descripción del bug
# NOTE(maria): Nota importante
```

#### Sin Autor (usa Git Blame automáticamente)
```
// TODO: Descripción de la tarea
// FIXME: Descripción del bug
```

#### Con Checkbox
```
// TODO [ ] Tarea pendiente
// TODO [x] Tarea completada
```

## ⚙️ Configuración

### Configuración Básica

Puedes personalizar la extensión en `settings.json`:

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
  },
  "todoTree.exclude": "**/node_modules/**,**/.git/**,**/dist/**,**/build/**",
  "todoTree.maxResults": 1000,
  "todoTree.viewMode": "byFile"
}
```

### Sistema de Highlights Personalizables

Configuración completa de colores y estilos (similar a Todo Tree clásico):

```json
{
  "todoTree.highlights.defaultHighlight": {
    "icon": "alert",
    "type": "text-and-comment",
    "foreground": "#000000",
    "background": "#FFFFFF",
    "opacity": 50,
    "iconColour": "#0000FF",
    "gutterIcon": true
  },
  "todoTree.highlights.customHighlight": {
    "TODO": {
      "icon": "check",
      "foreground": "#000000",
      "background": "#FFFF00",
      "iconColour": "#FFFF00",
      "gutterIcon": true
    },
    "FIXME": {
      "icon": "bug",
      "foreground": "#FFFFFF",
      "background": "#DEB887",
      "iconColour": "#DEB887",
      "gutterIcon": true
    },
    "NOTE": {
      "icon": "note",
      "foreground": "#FFFFFF",
      "background": "#6495ED",
      "iconColour": "#6495ED",
      "gutterIcon": true
    },
    "BUG": {
      "icon": "bug",
      "foreground": "#FFFFFF",
      "background": "#DC143C",
      "iconColour": "#DC143C",
      "gutterIcon": true
    },
    "USEFUL": {
      "icon": "note",
      "foreground": "#000000",
      "background": "#66CDAA",
      "iconColour": "#66CDAA",
      "gutterIcon": true
    },
    "COMMENT": {
      "icon": "note",
      "foreground": "#FFFFFF",
      "background": "#808080",
      "iconColour": "#808080",
      "gutterIcon": true
    },
    "LEARN": {
      "icon": "note",
      "foreground": "#FFFFFF",
      "background": "#FF69B4",
      "iconColour": "#FF69B4",
      "gutterIcon": true
    },
    "SEE NOTES": {
      "icon": "check",
      "foreground": "#FFFFFF",
      "background": "#008080",
      "iconColour": "#008080",
      "gutterIcon": true
    },
    "POST": {
      "icon": "check",
      "foreground": "#FFFFFF",
      "background": "#008000",
      "iconColour": "#008000",
      "gutterIcon": true
    },
    "[ ]": {
      "icon": "check",
      "foreground": "#000000",
      "background": "#FFFFFF",
      "iconColour": "#FFFF00",
      "gutterIcon": true
    },
    "[x]": {
      "icon": "check",
      "foreground": "#FFFFFF",
      "background": "#008000",
      "iconColour": "#008000",
      "gutterIcon": true
    }
  }
}
```

#### Propiedades de Highlight

- **`foreground`**: Color del texto del comentario (hex: `#RRGGBB`)
- **`background`**: Color de fondo del comentario (hex: `#RRGGBB`)
- **`iconColour`**: Color del icono en el gutter (hex: `#RRGGBB`)
- **`icon`**: Tipo de icono (`check`, `bug`, `note`, `alert`, `x`)
- **`gutterIcon`**: Mostrar/ocultar icono en el gutter (`true`/`false`)
- **`opacity`**: Opacidad del fondo (0-100, solo en `defaultHighlight`)

## 🛠️ Comandos Disponibles

- `todoTree.refresh` - Refrescar la lista de TODOs
- `todoTree.reveal` - Revelar TODO en el editor
- `todoTree.filterByAuthor` - Filtrar por autor
- `todoTree.filterByType` - Filtrar por tipo
- `todoTree.filterByAge` - Filtrar por antigüedad
- `todoTree.searchText` - Buscar en TODOs
- `todoTree.nextTodo` - Siguiente TODO (`Ctrl+Alt+N`)
- `todoTree.previousTodo` - Anterior TODO (`Ctrl+Alt+P`)
- `todoTree.clearFilter` - Limpiar todos los filtros

## 🎯 Características Avanzadas

### Integración con Git

La extensión se integra automáticamente con Git para:
- **Detectar autor**: Si un TODO no tiene autor en el texto, usa Git Blame
- **Calcular antigüedad**: Muestra cuánto tiempo tiene el comentario
- **Indicadores visuales**: 🟢🟡🔴 según la antigüedad
- **Información de commit**: Hash y fecha en el hover

**Nota**: Requiere que el proyecto esté en un repositorio Git. Si Git no está disponible, la extensión funciona normalmente sin esta información.

### Rendimiento Optimizado

- **Cache inteligente**: Solo re-parsea archivos que cambiaron
- **Escaneo incremental**: Prioriza archivos abiertos y recientemente modificados
- **Lazy loading de Git**: La información de Git se carga solo cuando se necesita
- **Debounce**: Evita actualizaciones excesivas mientras escribes

### Labels Informativos

Los archivos en el árbol muestran:
- Total de TODOs del archivo
- Conteo de TODOs críticos (FIXME + XXX)
- Ejemplo: `archivo.ts (5 • 2 críticos)`

### Colapso Inteligente

- Archivos con solo NOTE: Colapsados por defecto
- Archivos con FIXME o XXX: Expandidos automáticamente
- Respeta las acciones manuales del usuario

## 📸 Ejemplo Visual

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 15 TODOs encontrados

🔴 Críticos: 3 ▰▰▱▱▱▱▱▱ 20%
   🔵2  🟡5  🟠1

⚠️ Deuda Técnica: 2 ▰▱▱▱▱▱▱▱ 13%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 Guía de Uso
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

userService.ts (5 • 2 críticos)
  ├─ L24: [Git: Said] Arreglar bug (hace 4 meses) 🔴
  ├─ L45: [Juan] Optimizar query 🟡
  └─ L67: Agregar validación 🟢
```

## 🔧 Requisitos

- Visual Studio Code 1.74.0 o superior
- Cursor (compatible)
- Git (opcional, para funcionalidades de Git Blame)

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo LICENSE para más detalles.

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 🐛 Reportar Problemas

Si encuentras algún problema o tienes sugerencias, por favor abre un issue en el repositorio.

## ✨ Agradecimientos

Inspirado en extensiones como "Todo Tree" y "Better Comments", combinando lo mejor de ambas en una solución completa con características avanzadas de Git y visualización de deuda técnica.

## 📚 Archivo de Ejemplo

Incluye un archivo `ejemplo-todos.js` con ejemplos de todos los tipos de comentarios y formatos soportados. Ábrelo para ver todas las funcionalidades en acción.
