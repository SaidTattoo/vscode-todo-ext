# Cómo Actualizar la Extensión - Guía Rápida

## Pasos para Subir una Nueva Versión

### 1. Actualizar Versión ✅ (YA HECHO)
- Versión actualizada de `0.1.0` a `0.1.1` en `package.json`
- Compilación exitosa

### 2. Empaquetar la Extensión

```bash
vsce package
```

Esto creará el archivo `todo-tree-ext-0.1.1.vsix`

### 3. Publicar la Nueva Versión

Tienes dos opciones:

#### Opción A: Publicar directamente (Recomendado)

```bash
vsce publish
```

Te pedirá tu Personal Access Token (PAT) de Azure DevOps.

#### Opción B: Publicar desde el archivo .vsix

```bash
vsce publish -p TU_PERSONAL_ACCESS_TOKEN
```

O sube el archivo `.vsix` manualmente en:
https://marketplace.visualstudio.com/manage

## Semantic Versioning

Para futuras actualizaciones, sigue estas reglas:

- **Patch (0.1.1)**: Correcciones de bugs, mejoras menores
- **Minor (0.2.0)**: Nuevas funcionalidades (compatibles)
- **Major (1.0.0)**: Cambios incompatibles o grandes refactorizaciones

## Cambios en esta versión (0.1.1)

- ✅ Color de NOTE cambiado a azul/celeste (#569CD6)
- ✅ Mejora en detección de anotaciones anidadas dentro de comentarios multi-línea
- ✅ Integración del regex unificado del pull para mejor rendimiento
- ✅ Soporte para múltiples anotaciones en la misma línea

