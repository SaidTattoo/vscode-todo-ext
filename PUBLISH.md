# Guía para Publicar la Extensión

## Prerequisitos

1. **Cuenta en Visual Studio Marketplace**
   - Visita: https://marketplace.visualstudio.com/manage
   - Inicia sesión con tu cuenta de Microsoft/GitHub

2. **Instalar vsce (Visual Studio Code Extensions)**
   ```bash
   npm install -g @vscode/vsce
   ```

3. **Obtener Personal Access Token (PAT)**
   - Ve a: https://dev.azure.com
   - Crea una organización (si no tienes una)
   - Settings (⚙️) → Personal Access Tokens → New Token
   - Nombre: "VS Code Extensions"
   - Organización: Selecciona tu organización
   - Expiración: Selecciona un período (recomendado: 1 año)
   - Scopes: Selecciona "Custom defined" → "Marketplace (Manage)"
   - Copia el token (solo se muestra una vez)

## Preparación del package.json

Antes de publicar, actualiza estos campos en `package.json`:

```json
{
  "publisher": "TU_NOMBRE_PUBLISHER",  // Ejemplo: "tu-usuario" o "tu-empresa"
  "repository": {
    "type": "git",
    "url": "https://github.com/tu-usuario/tu-repositorio.git"
  }
}
```

**Nota importante**: El `publisher` debe ser único y no puede cambiarse después. Elige bien.

## Pasos para Publicar

### 1. Compilar la Extensión

```bash
npm install
npm run compile
```

### 2. Empaquetar la Extensión

```bash
vsce package
```

Esto creará un archivo `.vsix` con el nombre `todo-tree-ext-0.1.0.vsix`

### 3. Publicar la Extensión

#### Opción A: Publicación Directa (Recomendada para la primera vez)

```bash
vsce publish
```

Te pedirá:
- Tu Personal Access Token (el que creaste anteriormente)
- Tu publisher name (debe coincidir con el del package.json)

#### Opción B: Publicar desde un archivo .vsix

Si ya tienes un archivo .vsix:

```bash
vsce publish -p TU_PERSONAL_ACCESS_TOKEN
```

O sube el archivo manualmente en: https://marketplace.visualstudio.com/manage

### 4. Actualizar la Versión

Para futuras actualizaciones:

1. **Actualiza la versión en package.json** (siguiendo Semantic Versioning):
   ```json
   "version": "0.1.1"  // patch: correcciones de bugs
   "version": "0.2.0"  // minor: nuevas características
   "version": "1.0.0"  // major: cambios incompatibles
   ```

2. **Publica la nueva versión**:
   ```bash
   vsce publish
   ```

## Verificación

Después de publicar:

1. Visita: https://marketplace.visualstudio.com
2. Busca tu extensión por nombre o publisher
3. Debería aparecer disponible para instalar

## Checklist Antes de Publicar

- [ ] Compilado sin errores (`npm run compile`)
- [ ] `package.json` tiene `publisher` correcto
- [ ] `package.json` tiene `repository` (opcional pero recomendado)
- [ ] README.md está completo y actualizado
- [ ] README.md tiene descripción clara
- [ ] Icono de la extensión (icon.png) en la raíz (opcional)
- [ ] Versión actualizada según cambios
- [ ] Probada la extensión localmente

## Comandos Útiles

```bash
# Empaquetar sin publicar
vsce package

# Ver información del paquete
vsce ls

# Publicar una versión específica
vsce publish 1.0.0

# Publicar con token desde variable de entorno
export VSCE_PAT=tu_token
vsce publish

# Validar el package.json
vsce package --no-yarn
```

## Solución de Problemas

### Error: "The Personal Access Token verification failed"
- Verifica que el token tenga el scope "Marketplace (Manage)"
- Asegúrate de que el token no haya expirado

### Error: "Publisher name is required"
- Asegúrate de tener `"publisher"` en package.json

### Error: "Publisher ID not found"
- Necesitas crear un publisher en: https://marketplace.visualstudio.com/manage/publishers
- O el publisher debe coincidir con tu cuenta

## Recursos Adicionales

- [Documentación oficial de vsce](https://github.com/microsoft/vscode-vsce)
- [Guía de publicación de extensiones](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [Visual Studio Marketplace](https://marketplace.visualstudio.com/)

