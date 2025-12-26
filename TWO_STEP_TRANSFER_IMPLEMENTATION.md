# 🔄 Sistema de Transferencias de Dos Pasos - Implementación Completa

**Fecha**: 22 de Diciembre de 2025
**Estado**: ✅ Implementado - Pendiente de Compilación y Testing

---

## 📋 Resumen Ejecutivo

Se ha implementado exitosamente un **sistema de transferencias de dos pasos** con aceptación obligatoria del receptor para la transferencia de baterías en el sistema de pasaporte de baterías.

### Problemas Resueltos

1. ✅ **`transferOwnership` NO actualizaba el estado** de la batería
2. ✅ **`startSecondLife` NO actualizaba el estado** en BatteryRegistry
3. ✅ **No había mecanismo de aceptación** - Transferencias inmediatas sin consentimiento
4. ✅ **El frontend capturaba el tipo de transferencia** pero no lo usaba

---

## 🏗️ Arquitectura del Sistema

### Flujo de Transferencia (Opción 1 Implementada)

```
┌─────────────┐
│ 1. INITIATE │  Emisor firma initiateTransfer(bin, newOwner, newState)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  PENDING    │  Transferencia queda pendiente (7 días de validez)
│  TRANSFER   │  - Estado: NO cambia todavía
└──────┬──────┘  - Owner: NO cambia todavía
       │
       ├──────────┐
       │          │
       ▼          ▼
┌─────────────┐  ┌─────────────┐
│ 2A. ACCEPT  │  │ 2B. REJECT  │
│             │  │             │
│ Receptor    │  │ Receptor    │
│ acepta      │  │ rechaza     │
└──────┬──────┘  └──────┬──────┘
       │                │
       ▼                ▼
┌─────────────┐  ┌─────────────┐
│ COMPLETED   │  │ CANCELLED   │
│ - Owner ✓   │  │ Eliminado   │
│ - State ✓   │  │             │
└─────────────┘  └─────────────┘
```

### Otras Opciones Disponibles

- **Cancelación**: El emisor puede cancelar (`cancelTransfer`)
- **Expiración**: Después de 7 días, cualquiera puede limpiar (`clearExpiredTransfer`)

---

## 🔧 Cambios Implementados

### 1. Smart Contract: `BatteryRegistry.sol`

#### Nuevas Estructuras de Datos

```solidity
struct PendingTransfer {
    address from;           // Emisor de la transferencia
    address to;             // Receptor previsto
    BatteryState newState;  // Estado después de la transferencia
    uint64 initiatedAt;     // Timestamp de inicio
    bool isActive;          // Transferencia activa
}

mapping(bytes32 => PendingTransfer) public pendingTransfers;
uint256 public constant TRANSFER_EXPIRATION = 7 days;
```

#### Nuevas Funciones

| Función | Descripción | Quién puede llamarla |
|---------|-------------|---------------------|
| `initiateTransfer(bin, newOwner, newState)` | Inicia transferencia | Owner o Admin |
| `acceptTransfer(bin)` | Acepta transferencia | Receptor |
| `rejectTransfer(bin)` | Rechaza transferencia | Receptor |
| `cancelTransfer(bin)` | Cancela transferencia | Emisor o Admin |
| `clearExpiredTransfer(bin)` | Limpia transferencias expiradas | Cualquiera |

#### Funciones View

```solidity
getPendingTransfer(bin)        // Obtiene datos de transferencia pendiente
hasPendingTransfer(bin)        // Verifica si hay transferencia pendiente
isTransferExpired(bin)         // Verifica si expiró
getTransferTimeRemaining(bin)  // Obtiene tiempo restante
```

#### Validación de Transiciones de Estado

```solidity
function _validateStateTransition(BatteryState currentState, BatteryState newState)
```

**Transiciones válidas**:
- `Manufactured` → `Integrated` o `FirstLife`
- `Integrated` → `FirstLife`
- `FirstLife` → `SecondLife` o `EndOfLife`
- `SecondLife` → `EndOfLife`
- `EndOfLife` → `Recycled`
- `Recycled` → ❌ (Estado final)

#### Nuevos Eventos

```solidity
event TransferInitiated(bytes32 indexed bin, address indexed from, address indexed to, BatteryState newState, uint64 timestamp);
event TransferAccepted(bytes32 indexed bin, address indexed from, address indexed to, BatteryState newState, uint64 timestamp);
event TransferRejected(bytes32 indexed bin, address indexed from, address indexed to, uint64 timestamp);
event TransferCancelled(bytes32 indexed bin, address indexed from, address indexed to, uint64 timestamp);
event TransferExpired(bytes32 indexed bin, address indexed from, address indexed to, uint64 timestamp);
```

---

### 2. Smart Contract: `SecondLifeManager.sol`

#### Cambios Implementados

```solidity
function startSecondLife(...) {
    // ... código existente ...

    // ✅ NUEVO: Actualiza el estado en BatteryRegistry
    batteryRegistry.changeBatteryState(bin, BatteryRegistry.BatteryState.SecondLife);

    emit SecondLifeStarted(...);
}

function endSecondLife(bin) {
    // ... código existente ...

    // ✅ NUEVO: Actualiza el estado en BatteryRegistry
    batteryRegistry.changeBatteryState(bin, BatteryRegistry.BatteryState.EndOfLife);

    emit SecondLifeEnded(...);
}
```

**Resultado**: Ahora cuando se inicia o termina la segunda vida, el estado se actualiza automáticamente en BatteryRegistry.

---

### 3. Frontend: `TransferOwnershipForm.tsx`

#### Cambios Implementados

1. **Mapeo de tipos de transferencia a estados**:
```typescript
const TRANSFER_TYPE_TO_STATE: Record<string, number> = {
  'Manufacturer→OEM': 1,      // Integrated
  'OEM→Customer': 2,          // FirstLife
  'Customer→SecondLife': 3,   // SecondLife
  'SecondLife→Recycler': 4,   // EndOfLife
  'Customer→Recycler': 4,     // EndOfLife
};
```

2. **Nueva función de submit**:
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  const newState = TRANSFER_TYPE_TO_STATE[formData.transferType] || 2;

  writeContract({
    functionName: 'initiateTransfer',  // ✅ NUEVO (antes: 'transferOwnership')
    args: [binBytes32, formData.newOwner, newState],  // ✅ Incluye estado
  });
};
```

3. **Mensajes actualizados**:
   - Toast: "Transfer initiated successfully! The recipient has 7 days to accept."
   - Botón: "Initiate Transfer" (antes: "Transfer Ownership")
   - Info box: Explica el proceso de dos pasos

---

### 4. Nuevo Componente: `AcceptTransferForm.tsx`

**Ubicación**: `web/src/components/forms/AcceptTransferForm.tsx`

#### Características

- ✅ Consulta transferencias pendientes con `getPendingTransfer`
- ✅ Muestra detalles completos de la transferencia:
  - Emisor (From)
  - Receptor (To)
  - Nuevo estado (New State)
  - Tiempo restante (countdown)
  - Fecha de inicio
- ✅ Validación de receptor (solo el destinatario puede aceptar)
- ✅ Dos botones de acción:
  - **Accept Transfer** (verde) → Llama `acceptTransfer(bin)`
  - **Reject Transfer** (rojo) → Llama `rejectTransfer(bin)`
- ✅ Feedback visual completo con toasts
- ✅ Navegación al pasaporte después de aceptar

#### UI Preview

```
┌────────────────────────────────────────────┐
│ Accept or Reject Transfer                  │
├────────────────────────────────────────────┤
│ Battery ID: [NV-2024-001234    ]           │
│                                            │
│ ┌────────────────────────────────────┐     │
│ │ Pending Transfer Details   🕐 5d 2h│     │
│ ├────────────────────────────────────┤     │
│ │ From:     0x1234...5678            │     │
│ │ To:       You                      │     │
│ │ New State: SecondLife              │     │
│ │ Initiated: Dec 22, 2025 10:00 AM   │     │
│ └────────────────────────────────────┘     │
│                                            │
│ [✓ Accept Transfer] [✗ Reject Transfer]   │
└────────────────────────────────────────────┘
```

---

## 📝 Pasos Siguientes (Para Completar)

### 1. Compilar Contratos 🔨

```bash
cd sc
forge build
```

Esto generará los nuevos ABIs con las funciones:
- `initiateTransfer`
- `acceptTransfer`
- `rejectTransfer`
- `cancelTransfer`
- `clearExpiredTransfer`
- `getPendingTransfer`
- `hasPendingTransfer`
- `isTransferExpired`
- `getTransferTimeRemaining`

### 2. Actualizar ABI en Frontend 🔄

```bash
# Copiar los nuevos ABIs al proyecto web
cd ..
npm run update-contracts
# O manualmente copiar:
cp sc/out/BatteryRegistry.sol/BatteryRegistry.json web/src/lib/contracts/abi/
```

### 3. Redeployar Contratos (Anvil Local) 🚀

```bash
# Terminal 1: Iniciar Anvil
anvil

# Terminal 2: Deployar contratos
cd sc
forge script script/DeployAll.s.sol:DeployAll --rpc-url http://localhost:8545 --broadcast

# Terminal 3: Seed data
forge script script/SeedData.s.sol:SeedData --rpc-url http://localhost:8545 --broadcast
```

### 4. Testing Manual 🧪

#### Prueba 1: Transferencia Completa (Aceptada)

1. **Como Manufacturer** (Account 1):
   ```
   - Ir a "Transfer Ownership"
   - BIN: NV-2024-001234
   - New Owner: <dirección del OEM - Account 2>
   - Type: Manufacturer→OEM
   - Click "Initiate Transfer"
   - Firmar con MetaMask
   ```

2. **Como OEM** (Account 2):
   ```
   - Cambiar cuenta en MetaMask a Account 2
   - Ir a "Accept Transfer"
   - BIN: NV-2024-001234
   - Ver detalles de transferencia pendiente
   - Click "Accept Transfer"
   - Firmar con MetaMask
   ```

3. **Verificar**:
   ```
   - Ir al passport de la batería
   - Verificar que el owner cambió a Account 2
   - Verificar que el estado cambió a "Integrated"
   ```

#### Prueba 2: Transferencia Rechazada

1. **Como Owner actual**:
   - Iniciar transferencia a otro usuario

2. **Como Receptor**:
   - Ir a "Accept Transfer"
   - Click "Reject Transfer"
   - Firmar transacción

3. **Verificar**:
   - El owner NO cambió
   - El estado NO cambió
   - La transferencia pendiente fue eliminada

#### Prueba 3: Cancelación de Transferencia

1. **Como Owner**:
   - Iniciar transferencia

2. **Como Owner (mismo usuario)**:
   - Llamar `cancelTransfer(bin)` desde contract interaction

3. **Verificar**:
   - Transferencia eliminada
   - Receptor ya no puede aceptar

### 5. Testing Automatizado 🤖

Crear tests en Foundry:

```bash
cd sc
forge test --match-contract BatteryRegistryTransferTest -vvv
```

**Tests a crear**:
- ✅ `test_InitiateTransfer` - Transferencia se crea correctamente
- ✅ `test_AcceptTransfer` - Aceptación actualiza owner y estado
- ✅ `test_RejectTransfer` - Rechazo elimina transferencia
- ✅ `test_CancelTransfer` - Emisor puede cancelar
- ✅ `test_RevertWhen_NotRecipient` - Solo receptor puede aceptar
- ✅ `test_RevertWhen_TransferExpired` - No se puede aceptar después de 7 días
- ✅ `test_RevertWhen_InvalidStateTransition` - Valida transiciones
- ✅ `test_ClearExpiredTransfer` - Limpieza de transferencias expiradas

### 6. Integración en UI Principal 🎨

#### Agregar en Dashboard

```typescript
// web/src/app/dashboard/page.tsx

import { AcceptTransferForm } from '@/components/forms';

// Agregar sección para transferencias pendientes
<section>
  <h2>Pending Transfers</h2>
  <AcceptTransferForm />
</section>
```

#### Agregar Notificaciones

Crear un hook para notificar transferencias pendientes:

```typescript
// web/src/hooks/usePendingTransfers.ts
export function usePendingTransfers(userAddress: string) {
  // Escuchar eventos TransferInitiated donde to === userAddress
  // Mostrar badge/notificación en el navbar
}
```

---

## 🔐 Seguridad y Validaciones

### Validaciones Implementadas

1. ✅ **Solo el owner actual** puede iniciar transferencias
2. ✅ **Solo el receptor** puede aceptar/rechazar
3. ✅ **Solo el emisor** puede cancelar
4. ✅ **Transiciones de estado validadas** - No se permiten saltos inválidos
5. ✅ **Expiración de 7 días** - Previene transferencias abandonadas
6. ✅ **No auto-transferencia** - No puedes transferir a ti mismo
7. ✅ **Una transferencia pendiente por batería** - Previene conflictos

### Eventos de Auditoría

Todos los eventos están **indexados** para The Graph:
- `TransferInitiated` - Quién inició, a quién, qué estado
- `TransferAccepted` - Quién aceptó, cuándo
- `TransferRejected` - Quién rechazó, cuándo
- `TransferCancelled` - Quién canceló, cuándo
- `TransferExpired` - Cuándo expiró

---

## 📊 Mejoras Futuras (Opcional)

### 1. Notificaciones Push
- Integrar con EPNS (Ethereum Push Notification Service)
- Notificar al receptor cuando recibe una transferencia

### 2. Batch Transfers
- Permitir transferir múltiples baterías a la vez
- Útil para flotas grandes

### 3. Transferencia con Condiciones
- Transferencia condicionada a pago (escrow)
- Transferencia con fecha de inicio futura

### 4. Historial de Transferencias
- Mostrar todas las transferencias pasadas
- Gráfico de la cadena de custodia

### 5. Dashboard de Transferencias
- Vista de todas las transferencias pendientes del usuario
- Filtros por estado, fecha, tipo

---

## 🎯 Resumen de Archivos Modificados/Creados

### Smart Contracts
- ✅ `sc/src/BatteryRegistry.sol` - Sistema completo de dos pasos
- ✅ `sc/src/SecondLifeManager.sol` - Actualización de estados
- ✅ `sc/script/SeedData.s.sol` - Fix de emisiones de carbono

### Frontend
- ✅ `web/src/components/forms/TransferOwnershipForm.tsx` - Usar `initiateTransfer`
- ✅ `web/src/components/forms/AcceptTransferForm.tsx` - **NUEVO** componente
- ✅ `web/src/components/forms/index.ts` - Export del nuevo componente

### Documentación
- ✅ `TWO_STEP_TRANSFER_IMPLEMENTATION.md` - Este documento

---

## ✅ Checklist de Implementación

### Completado ✓
- [x] Implementar `PendingTransfer` struct y storage
- [x] Implementar `initiateTransfer` function
- [x] Implementar `acceptTransfer` function
- [x] Implementar `rejectTransfer` function
- [x] Implementar `cancelTransfer` function
- [x] Implementar `clearExpiredTransfer` function
- [x] Implementar validación de transiciones de estado
- [x] Agregar eventos para todas las acciones
- [x] Actualizar `SecondLifeManager` para cambiar estados
- [x] Actualizar `TransferOwnershipForm` para nuevo flujo
- [x] Crear `AcceptTransferForm` component
- [x] Fix de seed data (emisiones de carbono)

### Pendiente ⏳
- [ ] Compilar contratos con `forge build`
- [ ] Actualizar ABIs en frontend
- [ ] Redeployar en Anvil local
- [ ] Testing manual del flujo completo
- [ ] Crear tests automatizados en Foundry
- [ ] Integrar `AcceptTransferForm` en dashboard
- [ ] Agregar notificaciones de transferencias pendientes
- [ ] Documentar en manual de usuario

---

## 🚀 Comando Rápido para Deploy

```bash
# Todo en uno (después de compilar)
cd sc && \
forge build && \
forge script script/DeployAll.s.sol:DeployAll --rpc-url http://localhost:8545 --broadcast && \
forge script script/SeedData.s.sol:SeedData --rpc-url http://localhost:8545 --broadcast && \
cd ../web && \
npm run dev
```

---

## 📞 Soporte

Si encuentras problemas durante el testing:
1. Verifica que Anvil esté corriendo
2. Verifica que MetaMask esté conectado a `localhost:8545`
3. Verifica que las cuentas tengan fondos
4. Revisa la consola del navegador para errores
5. Revisa los logs de Foundry para errores de contrato

---

**Implementado por**: Claude Code
**Fecha**: 22 de Diciembre de 2025
**Versión**: 1.0.0
