# Configuración de GitHub Actions para Publicación Automática

Este workflow automatiza la publicación de la extensión en:
- ✅ VS Code Marketplace
- ✅ OpenVSX (para Cursor)
- ✅ GitHub Releases (archivo .vsix)

## 🚀 Configuración Inicial

### Paso 1: Crear Personal Access Token para VS Code Marketplace

1. Ve a: https://dev.azure.com
2. Settings (⚙️) → Personal Access Tokens → New Token
3. Configura:
   - **Name**: `GitHub Actions - VS Code Marketplace`
   - **Organization**: Tu organización
   - **Expiration**: 1 año (o más)
   - **Scopes**: "Custom defined" → "Marketplace (Manage)"
4. **Copia el token** (solo se muestra una vez)

### Paso 2: Crear Personal Access Token para OpenVSX

1. Ve a: https://open-vsx.org/
2. Inicia sesión (puedes usar GitHub)
3. Ve a tu perfil → Settings → Personal Access Tokens
4. Crea un nuevo token:
   - **Name**: `GitHub Actions - OpenVSX`
   - **Expiration**: El que prefieras
5. **Copia el token**

### Paso 3: Agregar Secrets en GitHub

1. Ve a tu repositorio: https://github.com/SaidTattoo/vscode-todo-ext
2. Ve a **Settings** → **Secrets and variables** → **Actions**
3. Haz clic en **"New repository secret"**
4. Agrega estos dos secrets:

   **Secret 1:**
   - **Name**: `VSCE_PAT`
   - **Value**: (Pega el token de Azure DevOps del Paso 1)

   **Secret 2:**
   - **Name**: `OPENVSX_PAT`
   - **Value**: (Pega el token de OpenVSX del Paso 2)

### Paso 4: Verificar el Workflow

El archivo `.github/workflows/publish.yml` ya está creado y configurado. Solo necesitas:
1. Hacer commit y push del archivo
2. Verificar que esté en la rama `main` o `master`

## 📦 Cómo Usar

### Opción 1: Publicar con un Release (Recomendado)

1. **Actualiza la versión en `package.json`**:
   ```json
   "version": "0.2.0"
   ```

2. **Haz commit y push**:
   ```bash
   git add package.json
   git commit -m "Bump version to 0.2.0"
   git push
   ```

3. **Crea un Release en GitHub**:
   - Ve a: https://github.com/SaidTattoo/vscode-todo-ext/releases
   - Haz clic en **"Create a new release"**
   - **Tag version**: `v0.2.0` (debe coincidir con la versión en package.json)
   - **Release title**: `v0.2.0 - Nuevas características`
   - **Description**: Describe los cambios
   - Haz clic en **"Publish release"**

4. **GitHub Actions se ejecutará automáticamente**:
   - Compilará la extensión
   - Publicará en VS Code Marketplace
   - Publicará en OpenVSX
   - Adjuntará el .vsix al release

### Opción 2: Ejecutar Manualmente

1. Ve a: https://github.com/SaidTattoo/vscode-todo-ext/actions
2. Selecciona el workflow **"Publish Extension"**
3. Haz clic en **"Run workflow"**
4. Selecciona la rama (normalmente `main`)
5. Haz clic en **"Run workflow"**

## ✅ Verificación

Después de que el workflow se complete:

1. **VS Code Marketplace**:
   - Ve a: https://marketplace.visualstudio.com/manage
   - Verifica que la nueva versión esté publicada

2. **OpenVSX**:
   - Ve a: https://open-vsx.org/
   - Busca tu extensión
   - Verifica que la nueva versión esté disponible

3. **GitHub Release**:
   - Ve a: https://github.com/SaidTattoo/vscode-todo-ext/releases
   - Verifica que el archivo `.vsix` esté adjunto

## 🔍 Troubleshooting

### Error: "VSCE_PAT not found"
- Verifica que el secret esté creado en GitHub
- Verifica que el nombre sea exactamente `VSCE_PAT`

### Error: "Publisher verification failed"
- Verifica que el token tenga el scope correcto
- Verifica que el publisher en `package.json` coincida con tu cuenta

### Error: "OpenVSX publish failed"
- Si no tienes cuenta en OpenVSX aún, el workflow continuará (tiene `continue-on-error: true`)
- Crea la cuenta en OpenVSX y vuelve a ejecutar el workflow

### El workflow no se ejecuta
- Verifica que el archivo esté en `.github/workflows/publish.yml`
- Verifica que esté en la rama correcta (`main` o `master`)
- Verifica que los triggers estén configurados correctamente

## 📝 Notas Importantes

1. **Versión en package.json**: Debe coincidir con el tag del release
2. **Semantic Versioning**: Usa `MAJOR.MINOR.PATCH` (ej: 0.2.0)
3. **Tokens**: Los tokens deben tener los permisos correctos
4. **Primera publicación**: La primera vez puede requerir configuración adicional en OpenVSX

## 🎯 Próximos Pasos

1. ✅ Configurar los secrets
2. ✅ Hacer commit del workflow
3. ✅ Crear un release de prueba
4. ✅ Verificar que todo funcione
5. ✅ Documentar el proceso para futuras versiones

## 🔗 Recursos

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [VS Code Extension Publishing](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [OpenVSX Publishing](https://github.com/open-vsx/publish-extensions)

