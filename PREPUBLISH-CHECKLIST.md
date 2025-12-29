# Checklist Antes de Publicar

## ⚠️ IMPORTANTE: Completa estos campos antes de publicar

### 1. Actualizar `package.json`

Edita el archivo `package.json` y reemplaza:

```json
"publisher": "YOUR_PUBLISHER_NAME",  // ⬅️ CAMBIAR: Tu nombre de publisher único
"repository": {
  "type": "git",
  "url": "YOUR_REPOSITORY_URL"  // ⬅️ CAMBIAR: URL de tu repositorio (opcional pero recomendado)
}
```

**Nota sobre publisher:**
- Debe ser único y no puede cambiarse después
- Ejemplos válidos: "tu-usuario", "tu-empresa", "kibernum"
- No usar espacios ni caracteres especiales
- Se recomienda usar tu nombre de usuario de GitHub o Azure DevOps

### 2. Icono de la Extensión (Opcional pero Recomendado)

Crea un archivo `icon.png` (128x128 píxeles) en la raíz del proyecto.

Si no tienes un icono, puedes omitir esta línea del `package.json`:
```json
"icon": "icon.png",  // ⬅️ Remover esta línea si no tienes icono
```

### 3. Verificar Compilación

```bash
npm install
npm run compile
```

Debe compilar sin errores.

### 4. Probar Localmente

1. Presiona `F5` para ejecutar en una nueva ventana de VS Code
2. Verifica que todas las funcionalidades funcionen:
   - ✅ Sidebar muestra TODOs
   - ✅ Colores funcionan
   - ✅ Filtros funcionan
   - ✅ Navegación rápida funciona
   - ✅ Iconos en gutter aparecen

## 📋 Pasos para Publicar

Sigue las instrucciones detalladas en `PUBLISH.md`

### Resumen Rápido:

1. **Instalar vsce:**
   ```bash
   npm install -g @vscode/vsce
   ```

2. **Crear Personal Access Token:**
   - Ve a: https://dev.azure.com
   - Settings → Personal Access Tokens → New Token
   - Scope: "Marketplace (Manage)"
   - Copia el token

3. **Actualizar package.json** (ver arriba)

4. **Empaquetar:**
   ```bash
   vsce package
   ```

5. **Publicar:**
   ```bash
   vsce publish
   ```
   (Te pedirá el token)

## ✅ Checklist Final

- [ ] `package.json` tiene `publisher` correcto (NO "YOUR_PUBLISHER_NAME")
- [ ] `package.json` tiene `repository` (opcional pero recomendado)
- [ ] `README.md` está completo
- [ ] Compilación exitosa sin errores
- [ ] Probada localmente (F5)
- [ ] vsce instalado globalmente
- [ ] Personal Access Token creado
- [ ] Versión es correcta (0.1.0 para la primera publicación)

## 🎉 ¡Listo para Publicar!

Una vez completado el checklist, sigue las instrucciones en `PUBLISH.md`.

