# Fix para Error de Node.js en GitHub Actions

## ❌ Error Encontrado

```
ReferenceError: File is not defined
```

Este error ocurre con Node.js 18 y ciertas versiones de `vsce`.

## ✅ Solución Aplicada

1. **Actualizado Node.js de 18 a 20** (más estable y compatible)
2. **Removido el flag `--no-yarn`** (vsce detecta automáticamente npm/yarn)

## Cambios Realizados

### `.github/workflows/publish.yml`
- `node-version: '18'` → `node-version: '20'`
- `vsce package --no-yarn` → `vsce package`

### `.github/workflows/ci.yml`
- `node-version: '18'` → `node-version: '20'`
- `vsce package --no-yarn` → `vsce package`

## 📝 Nota

El flag `--no-yarn` no es necesario porque:
- Tu proyecto usa `npm` (tienes `package-lock.json`)
- `vsce` detecta automáticamente el gestor de paquetes
- El flag estaba causando conflictos con la versión de Node.js

## ✅ Próximos Pasos

1. Hacer commit de los cambios:
   ```bash
   git add .github/workflows/
   git commit -m "Fix: Update Node.js to v20 and remove --no-yarn flag"
   git push
   ```

2. El workflow debería funcionar correctamente ahora

