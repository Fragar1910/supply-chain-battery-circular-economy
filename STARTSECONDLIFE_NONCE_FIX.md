# StartSecondLifeForm - Nonce Error Fix

## Problema Principal: Caché de Nonce Obsoleto

**Error**: `Nonce provided (1) is lower than current nonce (2)`
**Cuenta**: 0x90F79bf6EB2c4f870365E785982E1f101E93b906 (Aftermarket)
**Batería**: NV-2024-002345

---

## Solución INMEDIATA

### 1. Limpiar Caché del Navegador

```
Option 1: Hard Refresh
- Chrome/Edge: Ctrl+Shift+R (Windows) o Cmd+Shift+R (Mac)
- Firefox: Ctrl+F5

Option 2: Clear Site Data
- F12 → Application → Clear storage → Clear site data
- Reconectar wallet
```

### 2. O Resetear MetaMask

```
MetaMask → Settings → Advanced → Clear activity tab data
```

---

## Fixes Aplicados en Código

### StartSecondLifeForm.tsx:

1. **Prevención de doble submit**:
```typescript
if (isPending || isConfirming) {
  console.warn('⚠️ Transaction already in progress');
  return;
}
```

2. **Validación de applicationType** (1-7):
```typescript
if (applicationType < 1 || applicationType > 7) {
  toast.error('Invalid application type');
  return;
}
```

---

## Verificación Pre-Transacción

### Verificar nonce actual:
```bash
cast nonce 0x90F79bf6EB2c4f870365E785982E1f101E93b906 --rpc-url http://localhost:8545
# Resultado actual: 2
```

### Verificar batería existe y SOH:
```bash
cast call 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 \
  "getBatteryData(bytes32)" \
  $(cast --format-bytes32-string "NV-2024-002345") \
  --rpc-url http://localhost:8545
```

Verificar: `sohCurrent` entre 7000-8000 (70%-80%)

### Verificar rol AFTERMARKET:
```bash
cast call 0xa513E6E4b8f2a923D98304ec87F64353C4D5C853 \
  "hasRole(bytes32,address)(bool)" \
  0x84362fbf9c4883b5bfb0da1fb34b83de16bfa153b7e4491e57aba76ad5c7bbda \
  0x90F79bf6EB2c4f870365E785982E1f101E93b906 \
  --rpc-url http://localhost:8545
# Esperado: true
```

---

## Pasos para Probar

1. **Limpiar caché** (Hard Refresh: Cmd+Shift+R)
2. **Conectar** Account #3: 0x90F79bf6...
3. **StartSecondLifeForm** con BIN: NV-2024-002345
4. **Llenar formulario**:
   - Application Type: Residential Storage
   - Description: Home energy storage
   - Location: Madrid, Spain
   - ✓ Cell Inspection Passed
   - ✓ Safety Tests Passed
5. **Submit** → Verificar nonce en MetaMask debe ser >= 2
6. **Confirmar** transacción

---

## Validaciones del Contrato

SecondLifeManager verifica:
- ✅ Battery exists
- ✅ Not already in second life  
- ✅ Has AFTERMARKET_USER_ROLE
- ✅ ApplicationType válido (1-7)
- ✅ SOH entre 70%-80% (7000-8000 basis points)

---

## Conversiones Verificadas

✅ BIN → bytes32: `binToBytes32("NV-2024-002345")`
✅ ApplicationType → uint8: `Number(formData.applicationType)` validado 1-7
✅ InstallationHash → bytes32: `binToBytes32(hash)` o bytes32(0)

**Status**: ✅ Código arreglado - Limpiar caché y probar
