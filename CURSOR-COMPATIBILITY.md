# Por qué la Extensión No se Ve en Cursor

## 🔍 El Problema

**Cursor usa OpenVSX** (Open Visual Studio Extensions) en lugar del Marketplace de VS Code. Por eso las extensiones publicadas solo en el Marketplace de VS Code no aparecen automáticamente en Cursor.

## ✅ Soluciones

### Solución 1: Publicar en OpenVSX (Recomendado para distribución)

Para que la extensión aparezca en Cursor automáticamente, debes publicarla también en OpenVSX:

1. **Crear cuenta en OpenVSX**:
   - Ve a: https://open-vsx.org/
   - Crea una cuenta (puedes usar GitHub, GitLab, o cuenta normal)

2. **Instalar ovsx CLI**:
   ```bash
   npm install -g @openvsx/cli
   ```

3. **Publicar en OpenVSX**:
   ```bash
   ovsx publish -p TU_PERSONAL_ACCESS_TOKEN
   ```
   
   **Nota**: Necesitas crear un token en OpenVSX (similar al de Azure DevOps)

4. **Sincronización automática**:
   - OpenVSX puede sincronizar automáticamente desde GitHub releases
   - O puedes publicar manualmente cada vez que actualices

### Solución 2: Instalación Manual en Cursor (Solución Rápida)

Los usuarios pueden instalar la extensión manualmente en Cursor:

1. **Descargar el archivo .vsix**:
   - Desde GitHub Releases
   - O desde el Marketplace de VS Code (con una extensión como "VSIX Manager")

2. **Instalar en Cursor**:
   - En Cursor, ve a Extensiones (`Ctrl+Shift+X`)
   - Haz clic en los "⋯" (tres puntos) en la parte superior
   - Selecciona **"Install from VSIX..."**
   - Selecciona el archivo `.vsix`

### Solución 3: Instalación desde GitHub Releases (Para Usuarios)

Si publicas releases en GitHub con los archivos `.vsix`, los usuarios pueden:

1. Ir a tu repositorio: https://github.com/SaidTattoo/vscode-todo-ext/releases
2. Descargar el archivo `.vsix` de la última release
3. Instalarlo manualmente en Cursor (paso 2 de arriba)

## 🔄 Mantener Ambas Publicaciones Sincronizadas

**Opción A: Publicar Manualmente en Ambos**:
- Publica en VS Code Marketplace: `vsce publish`
- Publica en OpenVSX: `ovsx publish`

**Opción B: GitHub Actions (Automático)**:
- Configura un workflow de GitHub Actions que publique automáticamente en ambos marketplaces cuando creas un release

## 📝 Recomendación

1. **Corto plazo**: Instalación manual desde `.vsix` para usuarios de Cursor
2. **Mediano plazo**: Publicar en OpenVSX también
3. **Largo plazo**: Automatizar con GitHub Actions

## 🔗 Recursos

- OpenVSX: https://open-vsx.org/
- Documentación de ovsx: https://github.com/open-vsx/publish-extensions
- GitHub Actions para publicación: https://github.com/marketplace/actions/publish-vscode-extension

