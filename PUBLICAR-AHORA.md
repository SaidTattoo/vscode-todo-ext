# Publicar la Extensión - Instrucciones

## Opción 1: Ejecutar con Token (Recomendado)

Ejecuta este comando reemplazando `TU_PERSONAL_ACCESS_TOKEN` con tu token real:

```bash
vsce publish -p TU_PERSONAL_ACCESS_TOKEN
```

## Opción 2: Ejecutar Interactivamente

Ejecuta simplemente:

```bash
vsce publish
```

Y cuando te pida:
1. **Personal Access Token**: Pega tu PAT de Azure DevOps
2. **Publisher name**: `SaidRavest`

## 🔑 Si no tienes un Personal Access Token

1. Ve a: https://dev.azure.com
2. Settings (⚙️) → Personal Access Tokens → New Token
3. Nombre: "VS Code Extensions"
4. Organización: Selecciona tu organización
5. Expiración: 1 año (o el que prefieras)
6. Scopes: "Custom defined" → "Marketplace (Manage)"
7. Crea y copia el token (solo se muestra una vez)

## ✅ Lo que hará vsce

- Detectará que ya existe la extensión "todo-tree-ext" con publisher "SaidRavest"
- Actualizará automáticamente de la versión 0.1.0 a 0.1.1
- Publicará la nueva versión en el Marketplace

## ⚠️ Importante

No necesitas cambiar el nombre. vsce actualiza automáticamente la extensión existente cuando el `name` y `publisher` coinciden.

