# Quick Test Guide - Recycling & Auditing Flow

## Pre-requisitos

### 1. Iniciar Anvil
```bash
anvil --chain-id 31337
```

### 2. Desplegar Contratos
```bash
cd sc
./deploy-and-seed.sh
```

### 3. Iniciar Frontend
```bash
cd web
npm run dev
```

Abrir: http://localhost:3000

---

## Test Completo: Reciclar y Auditar una Batería

### Paso 1: Reciclar Batería (Recycler)

**Cuenta a Usar:** Account #4 (Recycler)
- **Address:** `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65`
- **Private Key:** `0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a`

**Importar en MetaMask:**
1. MetaMask → Settings → Import Account
2. Pegar private key
3. Conectar en http://localhost:3000

**Reciclar Batería:**
1. Ir a RecycleBatteryForm
2. **BIN:** `NV-2024-001234` (o cualquier batería con SOH < 50%)
3. **Recycling Method:** Hydrometallurgical
4. **Facility:** EcoRecycle Plant Madrid
5. **Materials:**
   - Lithium: 10 kg, 95%
   - Cobalt: 5 kg, 92%
   - Nickel: 8 kg, 90%
6. **Notes:** (opcional)
7. Click "Recycle Battery"
8. Confirmar en MetaMask

**Resultado Esperado:**
- ✅ Toast verde: "Battery recycled successfully!"
- ✅ Ver transaction hash
- ✅ Estado de batería = Recycled

---

### Paso 2: Verificar Datos en CLI (Opcional)

```bash
# Verificar datos de reciclaje
cast call 0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82 \
  "getRecyclingData(bytes32)" \
  $(cast --format-bytes32-string "NV-2024-001234") \
  --rpc-url http://localhost:8545
```

**Debe retornar:**
- Recycler address (no 0x000...)
- Recycled date > 0
- Method ID (0-3)
- Input weight > 0
- Facility hash (no 0x000...)

**O usar script de verificación:**
```bash
./verify-recycle-fix.sh
```

---

### Paso 3: Auditar Batería (Auditor)

**Cuenta a Usar:** Account #6 (Auditor)
- **Address:** `0x976EA74026E726554dB657fA54763abd0C3a0aa9`
- **Private Key:** `0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba`

**Cambiar cuenta en MetaMask:**
1. Click en cuenta actual
2. Seleccionar Account #6 (0x976EA...3a0aa9)
3. O importar con private key si no está

**Auditar:**
1. Ir a AuditRecyclingForm
2. **BIN:** `NV-2024-001234` (la que acabamos de reciclar)
3. Click "Fetch Data"

**Verificar Datos Mostrados:**
- ✅ Recycler: `0x15d3...6A65`
- ✅ Recycled Date: (timestamp visible)
- ✅ Method ID: 1 (Hydrometallurgical)
- ✅ Status: Pending Audit

**Completar Auditoría:**
4. Seleccionar: **Approve** ó **Reject**
5. **Notes:** "All materials properly recovered and documented"
6. Click "Submit Audit"
7. Confirmar en MetaMask

**Resultado Esperado:**
- ✅ Toast verde: "Recycling audit submitted successfully!"
- ✅ Estado actualizado a "Audited"

---

## Verificar Header (Roles)

### Recycler
**Conectar:** Account #4
**Header debe mostrar:** Badge verde "RECYCLER"

### Auditor
**Conectar:** Account #6
**Header debe mostrar:** Badge verde "AUDITOR"

---

## Errores Comunes y Soluciones

### ❌ "Battery Not Recycled"
**Problema:** Intentaste auditar una batería que no ha sido reciclada
**Solución:** Primero recicla la batería con RecycleBatteryForm

### ❌ "Missing RECYCLER_ROLE"
**Problema:** No estás conectado con Account #4
**Solución:** Cambiar a Account #4 en MetaMask

### ❌ "Missing AUDITOR_ROLE"
**Problema:** No estás conectado con Account #6
**Solución:** Cambiar a Account #6 en MetaMask

### ❌ Datos muestran "N/A"
**Problema:** La batería fue reciclada antes del fix
**Solución:** Reciclar una batería NUEVA (el fix ya está aplicado)

### ❌ "Battery must be in recycled state"
**Problema:** La batería no fue reciclada correctamente en RecyclingManager
**Solución:**
1. Verificar con: `./verify-recycle-fix.sh`
2. Reciclar una nueva batería (el fix ya está aplicado)

---

## Cuentas de Prueba (Anvil)

```
Account #0 (Admin):
  Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
  PK: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

Account #1 (Component Manufacturer):
  Address: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
  PK: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

Account #2 (OEM):
  Address: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
  PK: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a

Account #3 (Aftermarket User):
  Address: 0x90F79bf6EB2c4f870365E785982E1f101E93b906
  PK: 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6

Account #4 (Recycler): ⭐
  Address: 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65
  PK: 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a

Account #5 (Fleet Operator):
  Address: 0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc
  PK: 0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba

Account #6 (Auditor): ⭐
  Address: 0x976EA74026E726554dB657fA54763abd0C3a0aa9
  PK: 0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba
```

---

## Contratos Desplegados

```
BatteryRegistry: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
RoleManager: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
SupplyChainTracker: 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
DataVault: 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9
CarbonFootprint: 0x5FC8d32690cc91D4c39d9d3abcBD16989F875707
SecondLifeManager: 0xa513E6E4b8f2a923D98304ec87F64353C4D5C853
RecyclingManager: 0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82
```

---

## Baterías de Prueba

### Baterías con SOH < 50% (Listas para Reciclar)
```
NV-2024-001234
NV-2024-001235
NV-2024-001236
```

### ⚠️ NO usar para testing después del fix
```
NV-2025-000003 (tiene datos incompletos de reciclaje anterior)
```

---

## Archivos de Documentación

- **AUDITOR_ROLE_COMPLETE_FIX.md** - Fix del rol Auditor y AuditRecyclingForm
- **RECYCLEBATTERY_FORM_FIX.md** - Fix crítico de RecycleBatteryForm (registro en RecyclingManager)
- **AUDITFORM_DATA_PARSING_FIX.md** - Fix de parseo de datos en AuditRecyclingForm (índices correctos)
- **verify-recycle-fix.sh** - Script de verificación automática
- **MANUAL_TESTING_GUIDE.md** - Guía completa de testing manual

---

## Flujo End-to-End Esperado

```
1. Recycler (Account #4)
   └─> RecycleBatteryForm
       └─> RecyclingManager.startRecycling()
           ✅ Registra datos completos de reciclaje
           ✅ Cambia estado a Recycled
           ✅ Status: PendingAudit

2. Auditor (Account #6)
   └─> AuditRecyclingForm
       └─> Fetch Data
           ✅ Muestra todos los datos de reciclaje
           ✅ Recycler, Date, Method, Status visibles
       └─> Submit Audit
           └─> RecyclingManager.auditRecycling()
               ✅ Status: Audited/Rejected
               ✅ Flow completado
```

---

**Última Actualización:** 26 Diciembre 2024
**Status:** ✅ TESTED & WORKING

**¡Listo para probar!** 🎉
