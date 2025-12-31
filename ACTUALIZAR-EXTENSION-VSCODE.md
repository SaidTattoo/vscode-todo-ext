# Cómo Actualizar la Extensión en VS Code

## Problema: La extensión no se actualiza automáticamente

VS Code puede tardar un poco en detectar actualizaciones, o puede necesitar que la actualices manualmente.

## Solución 1: Forzar la Búsqueda de Actualizaciones

1. **Abre la vista de Extensiones**:
   - Haz clic en el icono de Extensiones en la barra lateral (o `Ctrl+Shift+X`)
   
2. **Busca tu extensión**:
   - Busca "Todo comments Enhanced" en la barra de búsqueda
   - O busca por publisher: "SaidRavest"

3. **Forzar actualización**:
   - Haz clic en el botón **"⭮" (Refresh)** en la parte superior de la vista de Extensiones
   - O usa el comando: `Ctrl+Shift+P` → "Extensions: Check for Extension Updates"

## Solución 2: Desinstalar y Reinstalar

Si la actualización no aparece:

1. **Desinstalar la extensión actual**:
   - En la vista de Extensiones, busca "Todo comments Enhanced"
   - Haz clic en el botón "Uninstall" (Desinstalar)
   - Reinicia VS Code

2. **Reinstalar la extensión**:
   - Busca "Todo comments Enhanced" en el Marketplace
   - Haz clic en "Install" (Instalar)
   - Esto instalará la última versión disponible (0.1.1)

## Solución 3: Verificar que la Versión Esté Publicada

Primero, verifica que realmente publicaste la versión 0.1.1:

1. Ve a: https://marketplace.visualstudio.com/manage
2. Busca tu extensión "Todo comments Enhanced"
3. Verifica que la versión más reciente sea **0.1.1**

**Si NO aparece la versión 0.1.1**, significa que aún no se ha publicado. Necesitas publicarla primero usando `vsce publish`.

## Solución 4: Instalar desde el archivo .vsix (Para Pruebas)

Si quieres probar la versión 0.1.1 antes de publicarla:

1. **Desinstala la versión actual** (si está instalada desde el Marketplace)

2. **Instala desde el archivo .vsix**:
   - En VS Code, ve a Extensiones
   - Haz clic en los **"⋯"** (tres puntos) en la parte superior
   - Selecciona **"Install from VSIX..."**
   - Navega a: `C:\Users\Kibernum\todo-ext\todo-tree-ext-0.1.1.vsix`
   - Selecciona el archivo y haz clic en "Install"

## Verificar la Versión Instalada

Para ver qué versión tienes instalada:

1. Abre la vista de Extensiones
2. Busca "Todo comments Enhanced"
3. Haz clic en la extensión para ver sus detalles
4. La versión se muestra en la información de la extensión

O usa el comando:
- `Ctrl+Shift+P` → "Extensions: Show Installed Extensions"
- Busca tu extensión y verás la versión

## ⚠️ Importante

- Las actualizaciones del Marketplace pueden tardar unos minutos en estar disponibles
- VS Code busca actualizaciones automáticamente, pero puedes forzarlo con Refresh
- Si publicaste recientemente, espera 5-10 minutos y luego intenta actualizar

## 🔄 Pasos Recomendados (En Orden)

1. **Verifica que publicaste la versión 0.1.1** en el Marketplace
2. Si no está publicada, publícala con `vsce publish -p TU_TOKEN`
3. Espera 5-10 minutos para que el Marketplace actualice
4. En VS Code, haz clic en Refresh en la vista de Extensiones
5. Si aún no aparece, desinstala y reinstala la extensión

