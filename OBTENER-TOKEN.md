# Cómo Obtener el Personal Access Token (PAT)

## Paso a Paso

### 1. Ir a Azure DevOps

Abre tu navegador y ve a:
**https://dev.azure.com**

Inicia sesión con tu cuenta de Microsoft o GitHub (la misma que usas para VS Code Marketplace).

### 2. Crear o Seleccionar una Organización

- Si ya tienes una organización, selecciónala
- Si no tienes una, haz clic en "New organization" y créala (es gratis)

### 3. Ir a Personal Access Tokens

1. Haz clic en el **ícono de tu perfil** (arriba a la derecha)
2. Selecciona **"Personal access tokens"** del menú
   - O ve directamente a: https://dev.azure.com/_usersSettings/tokens

### 4. Crear un Nuevo Token

1. Haz clic en **"+ New Token"** o **"+ Create new token"**
2. Completa el formulario:

   **Name (Nombre):**
   ```
   VS Code Extensions
   ```
   (Puedes usar cualquier nombre descriptivo)

   **Organization (Organización):**
   - Selecciona tu organización de la lista desplegable

   **Expiration (Expiración):**
   - Selecciona el tiempo que quieres que dure (recomendado: **1 year** o **Custom defined** con 365 días)
   - Puedes elegir un período más corto si prefieres

   **Scopes (Permisos):**
   - Haz clic en **"Custom defined"**
   - Busca y marca la casilla **"Marketplace (Manage)"**
   - Esto dará permiso para publicar extensiones

3. Haz clic en **"Create"** o **"Generate"**

### 5. Copiar el Token

⚠️ **MUY IMPORTANTE**: El token solo se mostrará UNA VEZ. Cópialo inmediatamente.

- Haz clic en el botón **"Copy to clipboard"** o selecciona todo el texto del token
- **Guárdalo en un lugar seguro** (por ejemplo, en un gestor de contraseñas)

El token se verá algo así:
```
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 6. Usar el Token

Ahora puedes usar el token para publicar:

```bash
vsce publish -p TU_TOKEN_AQUI
```

O simplemente:

```bash
vsce publish
```

Y cuando te pida el token, pégalo.

## ⚠️ Consejos de Seguridad

1. **Nunca compartas tu token** públicamente (GitHub, foros, etc.)
2. **No lo incluyas en código** que vayas a compartir
3. **Guárdalo en un lugar seguro** (gestor de contraseñas)
4. **Revócalo** si sospechas que fue comprometido (desde la misma página de Personal Access Tokens)

## 🔄 Si Perdiste el Token

Si no copiaste el token y lo perdiste:
1. Ve de nuevo a Personal Access Tokens
2. Encuentra el token que creaste
3. Puedes verlo pero NO podrás copiarlo de nuevo
4. Si necesitas verlo, haz clic en "Show" (puede requerir confirmación)
5. O simplemente crea un nuevo token y revoca el anterior

## ✅ Verificación

Después de crear el token, deberías verlo listado en la página de Personal Access Tokens con:
- El nombre que le diste
- La fecha de creación
- La fecha de expiración
- Las organizaciones y scopes

## 🚀 Siguiente Paso

Una vez que tengas el token, ejecuta:

```bash
vsce publish -p TU_TOKEN_AQUI
```

¡Y tu extensión se actualizará automáticamente!

