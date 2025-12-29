# Todo Tree Extension

Una extensión completa para Visual Studio Code y Cursor que muestra todos los TODOs, FIXMEs, NOTES, HACKs y otros comentarios en un árbol organizado en el sidebar, con colores personalizados, filtros avanzados y navegación rápida.

## 🚀 Características Principales

### 📋 Visualización Organizada
- **Árbol de comentarios**: Muestra todos los comentarios TODO, FIXME, NOTE, HACK, XXX organizados por archivo
- **Badge con contador**: Muestra el número total de TODOs en el icono del activity bar
- **Colores personalizados**: Cada tipo de comentario tiene su propio color tanto en el sidebar como en el editor
- **Iconos en el gutter**: Iconos visuales en el margen izquierdo junto a los números de línea

### 🎨 Colores por Tipo
- **TODO**: Color cyan/teal (azul claro)
- **FIXME**: Color rojo/naranja
- **NOTE**: Color amarillo/dorado
- **HACK**: Color naranja/marrón
- **XXX**: Color rojo

### 🔍 Filtros Avanzados
- **Filtro por autor**: Desplegable con todos los autores detectados automáticamente (formato: `TODO(autor):`)
- **Filtro por tipo**: Filtra por tipo de comentario (TODO, FIXME, NOTE, etc.)
- **Búsqueda por texto**: Busca dentro del contenido de los comentarios
- **Filtros combinables**: Puedes combinar múltiples filtros simultáneamente

### ⌨️ Navegación Rápida
- **Siguiente TODO**: `Ctrl+Alt+N` para navegar al siguiente TODO
- **Anterior TODO**: `Ctrl+Alt+P` para navegar al anterior TODO
- **Navegación inteligente**: Respeta los filtros activos y ordena por archivo y línea

### 📝 Formatos Soportados

La extensión detecta comentarios en múltiples formatos:

#### Comentarios de línea simple (`//`)
```javascript
// TODO: Implementar función
// TODO(autor): Tarea asignada
// FIXME: Corregir bug
// NOTE: Documentación importante
```

#### Comentarios con `#` (Python, Ruby, Shell)
```python
# TODO: Migrar API
# FIXME(autor): Manejar excepción
```

#### Comentarios con `--` (SQL, Lua)
```sql
-- TODO: Agregar índice
-- FIXME: Optimizar query
```

#### Comentarios multi-línea (`/* */`)
```javascript
/* TODO: Implementar sistema */
/* FIXME(autor): Arreglar bug */
```

#### Comentarios en bloques (`/** */`)
```java
/**
 * TODO: Agregar documentación
 * FIXME: El método tiene un bug
 */
```

### 🎯 Características Adicionales

- **Actualización automática**: Se actualiza automáticamente cuando se modifican archivos
- **Tutorial integrado**: Guía de uso en el sidebar
- **Iconos personalizados**: Iconos SVG en el gutter para cada tipo
- **Título dinámico**: Muestra los filtros activos en el título del sidebar

## 📦 Instalación

1. Busca "Todo Tree" en el marketplace de VS Code
2. Haz clic en "Install"
3. La extensión aparecerá en el activity bar con el icono de checklist

## 🎮 Uso

### Vista Básica

1. Abre el sidebar "Todo Tree" desde el activity bar
2. Verás todos los comentarios organizados por archivo
3. Haz clic en cualquier TODO para navegar directamente al código

### Filtros

#### Filtrar por Autor
1. Haz clic en el botón "Filtrar por autor" en el título del sidebar
2. Selecciona un autor del desplegable (muestra todos los autores detectados)
3. Selecciona "Todos los autores" para limpiar el filtro

#### Filtrar por Tipo
1. Haz clic en el botón "Filtrar por tipo" en el título del sidebar
2. Selecciona el tipo (TODO, FIXME, NOTE, HACK, XXX)
3. Selecciona "Todos" para limpiar el filtro

#### Buscar por Texto
1. Haz clic en el botón "Buscar en TODOs" en el título del sidebar
2. Escribe el texto a buscar en el contenido de los comentarios

#### Limpiar Filtros
- Haz clic en el botón "Limpiar filtros" (Alt+Click en el botón de autor)
- O ejecuta el comando "Limpiar filtros" desde la paleta de comandos

### Navegación Rápida

- **Siguiente TODO**: Presiona `Ctrl+Alt+N` (o `Cmd+Alt+N` en Mac)
- **Anterior TODO**: Presiona `Ctrl+Alt+P` (o `Cmd+Alt+P` en Mac)

### Formato de Comentarios con Autor

Para asignar TODOs a un autor/responsable, usa el formato:

```
// TODO(autor): Descripción de la tarea
// FIXME(juan): Descripción del bug
# NOTE(maria): Nota importante
```

El autor será detectado automáticamente y podrás filtrar por él.

## ⚙️ Configuración

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
  "todoTree.maxResults": 1000
}
```

## 🛠️ Comandos Disponibles

- `todoTree.refresh` - Refrescar la lista de TODOs
- `todoTree.reveal` - Revelar TODO en el editor
- `todoTree.filterByAuthor` - Filtrar por autor
- `todoTree.filterByType` - Filtrar por tipo
- `todoTree.searchText` - Buscar en TODOs
- `todoTree.nextTodo` - Siguiente TODO (`Ctrl+Alt+N`)
- `todoTree.previousTodo` - Anterior TODO (`Ctrl+Alt+P`)
- `todoTree.clearFilter` - Limpiar todos los filtros

## 📸 Capturas de Pantalla

La extensión muestra:
- Sidebar con árbol de TODOs organizados por archivo
- Colores distintivos para cada tipo de comentario
- Iconos en el gutter (margen izquierdo)
- Badge con contador en el activity bar
- Filtros avanzados en el título del sidebar

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo LICENSE para más detalles.

## 🐛 Reportar Problemas

Si encuentras algún problema o tienes sugerencias, por favor abre un issue en el repositorio.

## ✨ Agradecimientos

Inspirado en extensiones como "Todo Tree" y "Better Comments", combinando lo mejor de ambas en una solución completa.
# vscode-todo-ext
