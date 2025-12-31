# Solución al Error: "Extension name already exists"

## ❌ El Problema

Si estás intentando subir la extensión desde la interfaz web del Marketplace (https://marketplace.visualstudio.com/manage), verás el error:
> "The extension 'todo-tree-ext' already exists in the Marketplace"

## ✅ La Solución Correcta

**NO necesitas cambiar el nombre.** Si ya tienes la extensión publicada con el mismo `name` y `publisher`, simplemente usa `vsce publish` desde la terminal. Esto actualizará automáticamente tu extensión existente.

### Pasos Correctos:

1. **Asegúrate de tener la versión actualizada en package.json** ✅
   - Ya está actualizada a `0.1.1`

2. **Compila la extensión** ✅
   ```bash
   npm run compile
   ```

3. **Publica usando vsce desde la terminal** ⚠️ IMPORTANTE
   ```bash
   vsce publish
   ```
   
   **NO uses la interfaz web para actualizar**, solo para la primera publicación o para verificar.

4. **Cuando te pida el Personal Access Token:**
   - Pega tu PAT de Azure DevOps
   - Asegúrate de que el publisher sea: `SaidRavest`

5. **vsce automáticamente:**
   - Detectará que ya existe una extensión con ese nombre y publisher
   - Actualizará la versión existente a 0.1.1
   - Publicará la nueva versión

## 🔍 ¿Por qué funciona vsce pero no la web?

- **vsce publish**: Detecta si la extensión ya existe y la actualiza automáticamente
- **Interfaz web**: Intenta crear una nueva extensión, por eso da error si el nombre ya existe

## 📝 Nota Importante

Si realmente necesitas cambiar el nombre (NO recomendado), tendrías que:
1. Crear una nueva extensión con nombre diferente
2. Perder todas las estadísticas y reseñas de la anterior
3. Los usuarios tendrían que instalar la "nueva" extensión

**Por eso es mejor usar `vsce publish` para actualizar la existente.**

