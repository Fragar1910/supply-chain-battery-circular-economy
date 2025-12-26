# 🔧 Guía de Solución de Problemas - Transferencias de Dos Pasos

**Fecha**: 22 de Diciembre de 2025
**Estado**: Actualizado con fixes de timeout

---

## ✅ Problemas Resueltos

### 1. Toast Colgado ✓

**Problema**: El toast se quedaba en "Confirming transaction..." indefinidamente cuando una transacción fallaba.

**Solución Aplicada**:
- ✅ **AcceptTransferForm.tsx**: Agregado timeout safety net de 30 segundos
- ✅ **TransferOwnershipForm.tsx**: Ya tenía el timeout, mejorados los mensajes de error
- ✅ Mejor detección de errores específicos (reverted, not authorized, transfer pending, etc.)

---

## 🔍 Diagnóstico: "Transferencia no funciona desde manufacturer"

### Paso 1: Verificar Cuenta Conectada en MetaMask

La batería `NV-2024-001234` es propiedad de la cuenta **Admin** (Account 0):
```
Owner: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

**Verificar en MetaMask**:
1. Abrir MetaMask
2. Verificar que la cuenta conectada sea: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
3. Si estás en otra cuenta, cambiar a Account 0

### Paso 2: Verificar Roles

**Cuentas con rol de Manufacturer**:
- ✅ Account 0 (Admin): `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- ✅ Account 1 (Manufacturer): `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`

**Nota**: Ambas cuentas tienen el rol de manufacturer según el script de seed.

### Paso 3: Verificar Estado de la Batería

```bash
# Verificar owner actual
cast call 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 \
  "getOwner(bytes32)(address)" \
  "0x4e562d323032342d303031323334000000000000000000000000000000000000" \
  --rpc-url http://localhost:8545

# Verificar si hay transferencia pendiente
cast call 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 \
  "hasPendingTransfer(bytes32)(bool)" \
  "0x4e562d323032342d303031323334000000000000000000000000000000000000" \
  --rpc-url http://localhost:8545

# Verificar estado de la batería
cast call 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 \
  "getBatteryState(bytes32)(uint8)" \
  "0x4e562d323032342d303031323334000000000000000000000000000000000000" \
  --rpc-url http://localhost:8545
```

**Estados**:
- 0 = Manufactured
- 1 = Integrated
- 2 = FirstLife
- 3 = SecondLife
- 4 = EndOfLife
- 5 = Recycled

---

## 🚀 Pasos para Realizar una Transferencia Exitosa

### Opción A: Transferir como Admin (Owner Actual)

1. **En MetaMask**:
   - Conectar con Account 0: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`

2. **En la aplicación web**:
   - Ir a "Transfer Ownership"
   - BIN: `NV-2024-001234`
   - New Owner: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` (Account 1 - Manufacturer)
   - Transfer Type: `Manufacturer→OEM`
   - Click "Initiate Transfer"
   - Firmar en MetaMask

3. **Aceptar la transferencia**:
   - En MetaMask, cambiar a Account 1 (OEM): `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
   - Ir a "Accept Transfer"
   - BIN: `NV-2024-001234`
   - Ver detalles de la transferencia
   - Click "Accept Transfer"
   - Firmar en MetaMask

### Opción B: Usar otra batería registrada

Si la batería NV-2024-001234 ya fue transferida, usa otra:

**Baterías disponibles en seed data**:
- `NV-2024-001234` (Owner: Admin)
- `NV-2024-002345` (Owner: Admin)
- `NV-2024-003456` (Owner: Admin)
- `NV-2024-004567` (Owner: Admin)
- `NV-2024-005678` (Owner: Admin)
- `NV-2024-006789` (Owner: Admin)
- `NV-2024-007890` (Owner: Admin)
- `NV-2024-008901` (Owner: Admin)
- `NV-2024-009012` (Owner: Admin)

---

## 🐛 Errores Comunes y Soluciones

### Error 1: "You are not the current owner of this battery"

**Causa**: Estás intentando transferir desde una cuenta que NO es la propietaria.

**Solución**:
1. Verificar quién es el owner actual (ver comando arriba)
2. Cambiar en MetaMask a la cuenta propietaria
3. Intentar de nuevo

### Error 2: "This battery already has a pending transfer"

**Causa**: Ya iniciaste una transferencia que no ha sido aceptada/rechazada/expirada.

**Solución**:
1. **Opción A - Cancelar transferencia**:
   ```javascript
   // En la consola del navegador o usando el formulario
   await batteryRegistry.cancelTransfer(binBytes32)
   ```

2. **Opción B - Esperar a que el receptor la acepte/rechace**

3. **Opción C - Esperar 7 días a que expire**

### Error 3: "Invalid state transition for this battery lifecycle"

**Causa**: El estado de destino no es válido para el estado actual de la batería.

**Transiciones válidas**:
- Manufactured (0) → Integrated (1) o FirstLife (2)
- Integrated (1) → FirstLife (2)
- FirstLife (2) → SecondLife (3) o EndOfLife (4)
- SecondLife (3) → EndOfLife (4)
- EndOfLife (4) → Recycled (5)
- Recycled (5) → ❌ (estado final)

**Solución**:
1. Verificar el estado actual de la batería
2. Seleccionar el tipo de transferencia correcto

### Error 4: "Transaction timeout - Transaction is taking too long"

**Causa**: La transacción tardó más de 30 segundos.

**Solución**:
1. Verificar que Anvil esté corriendo: `anvil`
2. Verificar que MetaMask esté conectado a `localhost:8545`
3. Verificar la consola del navegador para errores
4. Refrescar la página e intentar de nuevo

### Error 5: "Transaction reverted. No pending transfer found or you are not the recipient"

**Causa**: Intentas aceptar una transferencia que no existe o que no es para ti.

**Solución**:
1. Verificar que hay una transferencia pendiente:
   ```bash
   cast call 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 \
     "getPendingTransfer(bytes32)" \
     "[BIN_BYTES32]" \
     --rpc-url http://localhost:8545
   ```

2. Verificar que la cuenta conectada en MetaMask sea el destinatario (`to`)

---

## 🧪 Testing Manual Completo

### Test 1: Transferencia Exitosa (Manufacturer → OEM)

```bash
# Terminal 1: Anvil debe estar corriendo
anvil

# Terminal 2 (opcional): Ver logs
cast logs --rpc-url http://localhost:8545 --follow
```

**Pasos**:

1. **Iniciar Transferencia (Account 0 - Admin/Manufacturer)**:
   - MetaMask: Conectar con `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
   - Web App → Transfer Ownership
   - BIN: `NV-2024-001234`
   - New Owner: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` (Account 2 - OEM)
   - Type: `Manufacturer→OEM`
   - Click "Initiate Transfer"
   - **Resultado esperado**: Toast verde "Transfer initiated successfully! Recipient has 7 days to accept."

2. **Verificar Transferencia Pendiente**:
   ```bash
   cast call 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 \
     "hasPendingTransfer(bytes32)(bool)" \
     "0x4e562d323032342d303031323334000000000000000000000000000000000000" \
     --rpc-url http://localhost:8545
   ```
   **Resultado esperado**: `true`

3. **Aceptar Transferencia (Account 2 - OEM)**:
   - MetaMask: Cambiar a `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
   - Web App → Accept Transfer
   - BIN: `NV-2024-001234`
   - Ver detalles: From, To, New State, Time Remaining
   - Click "Accept Transfer"
   - **Resultado esperado**: Toast verde "Transfer accepted successfully! You are now the owner."

4. **Verificar Cambios**:
   ```bash
   # Verificar nuevo owner
   cast call 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 \
     "getOwner(bytes32)(address)" \
     "0x4e562d323032342d303031323334000000000000000000000000000000000000" \
     --rpc-url http://localhost:8545
   # Resultado esperado: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC

   # Verificar nuevo estado
   cast call 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 \
     "getBatteryState(bytes32)(uint8)" \
     "0x4e562d323032342d303031323334000000000000000000000000000000000000" \
     --rpc-url http://localhost:8545
   # Resultado esperado: 1 (Integrated)

   # Verificar que no hay transferencia pendiente
   cast call 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 \
     "hasPendingTransfer(bytes32)(bool)" \
     "0x4e562d323032342d303031323334000000000000000000000000000000000000" \
     --rpc-url http://localhost:8545
   # Resultado esperado: false
   ```

### Test 2: Rechazo de Transferencia

1. Iniciar transferencia (igual que Test 1)
2. Como receptor, click "Reject Transfer" en lugar de "Accept Transfer"
3. Verificar que el owner NO cambió
4. Verificar que el estado NO cambió
5. Verificar que no hay transferencia pendiente

### Test 3: Cancelación de Transferencia

1. Iniciar transferencia
2. Como emisor (mismo que inició), usar `cancelTransfer`:
   ```javascript
   // En consola del navegador
   const binBytes32 = '0x4e562d323032342d303031323334000000000000000000000000000000000000';
   const tx = await batteryRegistry.cancelTransfer(binBytes32);
   await tx.wait();
   ```
3. Verificar que no hay transferencia pendiente

### Test 4: Timeout Safety Net

1. Desconectar Anvil (simular blockchain down)
2. Intentar iniciar una transferencia
3. **Resultado esperado**: Después de ~30 segundos, toast rojo "Transaction timeout"
4. No debe quedar colgado indefinidamente

---

## 📊 Checklist de Diagnóstico

Antes de reportar un bug, verifica:

- [ ] Anvil está corriendo (`anvil` en terminal)
- [ ] MetaMask conectado a `http://localhost:8545`
- [ ] Cuenta conectada en MetaMask es la correcta
- [ ] La cuenta tiene fondos (Anvil da fondos automáticamente)
- [ ] El owner de la batería es la cuenta conectada
- [ ] No hay transferencia pendiente para esa batería
- [ ] El estado de la batería permite la transición deseada
- [ ] Los contratos están desplegados (`deployments/local.json` existe)
- [ ] La consola del navegador no muestra errores (F12)

---

## 🔧 Comandos Útiles

### Ver Detalles de una Batería

```bash
BIN_BYTES32="0x4e562d323032342d303031323334000000000000000000000000000000000000"
REGISTRY="0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"

echo "Owner:"
cast call $REGISTRY "getOwner(bytes32)(address)" $BIN_BYTES32 --rpc-url http://localhost:8545

echo "State:"
cast call $REGISTRY "getBatteryState(bytes32)(uint8)" $BIN_BYTES32 --rpc-url http://localhost:8545

echo "Has Pending Transfer:"
cast call $REGISTRY "hasPendingTransfer(bytes32)(bool)" $BIN_BYTES32 --rpc-url http://localhost:8545
```

### Ver Transferencia Pendiente

```bash
cast call $REGISTRY "getPendingTransfer(bytes32)" $BIN_BYTES32 --rpc-url http://localhost:8545
```

### Cancelar Transferencia (como Owner)

```bash
# Desde cuenta del owner
cast send $REGISTRY "cancelTransfer(bytes32)" $BIN_BYTES32 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --rpc-url http://localhost:8545
```

### Limpiar Transferencia Expirada (cualquiera)

```bash
# Después de 7 días
cast send $REGISTRY "clearExpiredTransfer(bytes32)" $BIN_BYTES32 \
  --private-key [CUALQUIER_PRIVATE_KEY] \
  --rpc-url http://localhost:8545
```

---

## 📞 Soporte Adicional

Si después de seguir esta guía sigues teniendo problemas:

1. **Captura de pantalla** del error en el navegador (F12 → Console)
2. **Cuenta conectada** en MetaMask
3. **BIN** de la batería que intentas transferir
4. **Tipo de transferencia** que seleccionaste
5. **Logs de Anvil** (output del terminal)

---

## ✅ Mejoras Implementadas

### AcceptTransferForm.tsx
- [x] Timeout safety net de 30 segundos
- [x] Mejor manejo de errores (reverted, expired, not authorized)
- [x] Retry logic (3 intentos, 1s entre intentos)

### TransferOwnershipForm.tsx
- [x] Timeout safety net ya existente
- [x] Mensajes de error mejorados para:
  - Transfer already pending
  - Cannot transfer to yourself
  - Invalid state transition
  - Not authorized
- [x] Retry logic ya existente

---

**Versión**: 1.1.0
**Última actualización**: 22 Diciembre 2025
