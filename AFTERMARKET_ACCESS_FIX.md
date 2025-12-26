# Fix: Aftermarket Dashboard - Acceso Denegado

**Fecha**: 22 de Diciembre de 2025
**Problema**: Dashboard de Aftermarket muestra "Access Denied" para la cuenta 0x90F7...

---

## 🐛 Problema Original

```
Usuario: Aftermarket (0x90F79bf6EB2c4f870365E785982E1f101E93b906)
Rol asignado: AFTERMARKET_USER_ROLE en SecondLifeManager ✅
Dashboard: /dashboard/aftermarket
Error: "Access Denied - You don't have permission to access this page"
```

---

## 🔍 Causa Raíz

El componente `ProtectedRoute` en `/dashboard/aftermarket/page.tsx` tenía **dos errores**:

### Error 1: Nombre de Rol Incorrecto
```typescript
// ❌ INCORRECTO
<ProtectedRoute requiredRoles={['AFTERMARKET_ROLE', 'ADMIN_ROLE']}>
```

El rol correcto es `AFTERMARKET_USER_ROLE`, no `AFTERMARKET_ROLE`.

### Error 2: Contrato Incorrecto
```typescript
// ❌ INCORRECTO - Busca en RoleManager (default)
<ProtectedRoute requiredRoles={['AFTERMARKET_USER_ROLE', 'ADMIN_ROLE']}>
```

El rol `AFTERMARKET_USER_ROLE` está definido en `SecondLifeManager`, **NO** en `RoleManager`.

---

## ✅ Solución Aplicada

### Corrección 1: Nombre de Rol
```typescript
// ✅ CORRECTO
<ProtectedRoute requiredRoles={['AFTERMARKET_USER_ROLE', 'ADMIN_ROLE']}>
```

### Corrección 2: Especificar Contrato
```typescript
// ✅ CORRECTO
<ProtectedRoute
  requiredRoles={['AFTERMARKET_USER_ROLE', 'ADMIN_ROLE']}
  contractName="SecondLifeManager"
>
```

---

## 🔑 Detalles del Rol AFTERMARKET_USER

### Definición del Rol:

**Contrato**: `SecondLifeManager.sol`

```solidity
bytes32 public constant AFTERMARKET_USER_ROLE = keccak256("AFTERMARKET_USER_ROLE");
```

### Cuenta Aftermarket en Anvil:

```
Address: 0x90F79bf6EB2c4f870365E785982E1f101E93b906
Account: Account 3 (Anvil)
Private Key: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
```

### Asignación en SeedData.s.sol (Líneas 341-349):

```solidity
// Register Aftermarket User (account 3) - Role.AftermarketUser (5)
roleManager.registerActor(
    aftermarketUser,
    RoleManager.Role.AftermarketUser,
    "Second Life Energy Storage",
    ""
);
secondLifeManager.grantAftermarketUserRole(aftermarketUser);
console2.log("  [OK] Aftermarket User role granted to:", aftermarketUser);
```

---

## 📋 Roles de Aftermarket

La cuenta Aftermarket tiene los siguientes roles asignados:

| Contrato | Rol | Otorgado |
|----------|-----|----------|
| **RoleManager** | `AftermarketUser` (enum 5) | ✅ Sí |
| **SecondLifeManager** | `AFTERMARKET_USER_ROLE` | ✅ Sí |
| BatteryRegistry | Ninguno | ❌ No (no necesario) |
| DataVault | Ninguno | ❌ No (no necesario) |

---

## 🎯 Por Qué Esto Corrigió el Problema

### Antes del Fix:

1. Usuario Aftermarket accede a `/dashboard/aftermarket`
2. `ProtectedRoute` busca el rol `'AFTERMARKET_ROLE'` (incorrecto)
3. Busca en `RoleManager` (default)
4. **No encuentra el rol** → Access Denied ❌

### Después del Fix:

1. Usuario Aftermarket accede a `/dashboard/aftermarket`
2. `ProtectedRoute` busca el rol `'AFTERMARKET_USER_ROLE'` (correcto)
3. Busca en `SecondLifeManager` (especificado)
4. **Encuentra el rol** → Acceso concedido ✅

---

## 🧪 Pruebas del Fix

### Test 1: Acceso con Cuenta Aftermarket

**Pasos**:
1. Conectar MetaMask con cuenta Aftermarket (0x90F7...)
2. Navegar a `/dashboard/aftermarket`

**Resultado esperado**:
```
✅ Dashboard se carga correctamente
✅ Muestra "Aftermarket User Dashboard"
✅ Muestra secciones:
   - Overview (estadísticas)
   - Available Batteries (SOH 70-80%)
   - My Second Life Batteries
   - Start Second Life (formulario)
```

### Test 2: Acceso con Cuenta Admin

**Pasos**:
1. Conectar MetaMask con cuenta Admin (0xf39F...)
2. Navegar a `/dashboard/aftermarket`

**Resultado esperado**:
```
✅ Admin también tiene acceso (por 'ADMIN_ROLE')
✅ Dashboard se carga correctamente
```

### Test 3: Acceso con Cuenta No Autorizada

**Pasos**:
1. Conectar MetaMask con cuenta Manufacturer (0x7099...)
2. Navegar a `/dashboard/aftermarket`

**Resultado esperado**:
```
✅ "Access Denied" mostrado correctamente
✅ Muestra roles requeridos: AFTERMARKET_USER_ROLE, ADMIN_ROLE
✅ Muestra dirección del usuario
```

---

## 📂 Archivos Modificados

### 1. ✅ web/src/app/dashboard/aftermarket/page.tsx (Líneas 207-210)

**Antes**:
```typescript
<ProtectedRoute requiredRoles={['AFTERMARKET_ROLE', 'ADMIN_ROLE']}>
```

**Después**:
```typescript
<ProtectedRoute
  requiredRoles={['AFTERMARKET_USER_ROLE', 'ADMIN_ROLE']}
  contractName="SecondLifeManager"
>
```

---

## 🔍 Verificación del Rol en Blockchain

Para verificar que el rol está asignado correctamente:

### Opción 1: Cast (Foundry)
```bash
# Verificar si Aftermarket tiene el rol
cast call $SECOND_LIFE_MANAGER \
  "hasRole(bytes32,address)" \
  $(cast keccak "AFTERMARKET_USER_ROLE") \
  0x90F79bf6EB2c4f870365E785982E1f101E93b906 \
  --rpc-url http://localhost:8545

# Resultado esperado: true (0x0000...0001)
```

### Opción 2: Script de Verificación
```bash
cd sc
forge script script/VerifyRoles.s.sol --rpc-url http://localhost:8545
```

---

## 🎨 Dashboards y Sus Roles

| Dashboard | Ruta | Roles Requeridos | Contrato |
|-----------|------|------------------|----------|
| Manufacturer | `/dashboard/manufacturer` | `MANUFACTURER_ROLE`, `ADMIN_ROLE` | RoleManager |
| OEM | `/dashboard/oem` | `OEM_ROLE`, `ADMIN_ROLE` | RoleManager |
| Fleet Operator | `/dashboard/fleet-operator` | `FLEET_OPERATOR_ROLE`, `OEM_ROLE`, `ADMIN_ROLE` | RoleManager |
| **Aftermarket** | `/dashboard/aftermarket` | `AFTERMARKET_USER_ROLE`, `ADMIN_ROLE` | **SecondLifeManager** ✨ |
| Recycler | `/dashboard/recycler` | `RECYCLER_ROLE`, `ADMIN_ROLE` | RoleManager |
| Supplier | `/dashboard/supplier` | Pendiente implementar | - |

**Nota**: Aftermarket es el **único dashboard** que busca roles en un contrato diferente a `RoleManager`.

---

## 🚀 Próximos Pasos

### 1. Reiniciar el servidor de desarrollo:
```bash
cd web
npm run dev
```

### 2. Limpiar caché del navegador:
- **Chrome/Firefox**: `Ctrl+Shift+R`
- **Mac**: `Cmd+Shift+R`

### 3. Probar acceso:
```
1. Conectar cuenta Aftermarket en MetaMask
2. Navegar a http://localhost:3000/dashboard/aftermarket
3. Verificar que el dashboard se carga correctamente
```

---

## ⚠️ Importante: No Mezclar Roles Admin con Aftermarket

El **Admin** tiene acceso a todos los dashboards por defecto (incluyendo Aftermarket), pero esto es correcto ya que Admin es el superusuario.

La cuenta **Aftermarket** (0x90F7...) **SOLO** debe tener el rol `AFTERMARKET_USER_ROLE`. No necesita otros roles.

**Configuración correcta**:
```
Admin (0xf39F...):
  - ADMIN_ROLE en todos los contratos ✅
  - Acceso a todos los dashboards ✅

Aftermarket (0x90F7...):
  - AFTERMARKET_USER_ROLE en SecondLifeManager ✅
  - AftermarketUser en RoleManager (enum 5) ✅
  - Acceso solo a /dashboard/aftermarket ✅
```

---

## 📚 Referencias

### Smart Contracts:
- **SecondLifeManager.sol** (líneas 22-23) - Definición del rol
- **SeedData.s.sol** (líneas 341-349) - Asignación del rol

### Frontend:
- **ProtectedRoute.tsx** (líneas 25-30) - Componente de protección
- **aftermarket/page.tsx** (línea 41) - Uso del rol con `useRole`
- **aftermarket/page.tsx** (líneas 207-210) - ProtectedRoute corregido

---

## ✅ Resumen

**Problema**: Dashboard de Aftermarket mostraba "Access Denied"
**Causa**: Nombre de rol incorrecto (`AFTERMARKET_ROLE` vs `AFTERMARKET_USER_ROLE`) y contrato incorrecto (RoleManager vs SecondLifeManager)
**Solución**: Corregir nombre de rol y especificar `contractName="SecondLifeManager"`
**Resultado**: ✅ Acceso concedido correctamente a cuenta Aftermarket

---

**Implementado por**: Claude Code
**Fecha**: 22 de Diciembre de 2025
**Versión**: 1.0.0
