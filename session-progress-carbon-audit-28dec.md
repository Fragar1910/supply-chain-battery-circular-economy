# Sesión de Progreso: Carbon Audit Form & Security Improvements
**Fecha**: 28 de Diciembre 2025
**Proyecto**: Battery Circular Economy Platform - Supply Chain Traceability

---

## 📋 Índice
1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Tareas Completadas](#tareas-completadas)
3. [Cambios en la Interfaz de Usuario](#cambios-en-la-interfaz-de-usuario)
4. [Mejoras de Seguridad y Robustez](#mejoras-de-seguridad-y-robustez)
5. [Corrección del Role de Auditor](#corrección-del-role-de-auditor)
6. [Archivos Modificados](#archivos-modificados)
7. [Testing y Verificación](#testing-y-verificación)
8. [Próximos Pasos](#próximos-pasos)

---

## 🎯 Resumen Ejecutivo

Esta sesión se enfocó en mejorar el formulario de Carbon Emission (`AddCarbonEmissionForm`) con las siguientes mejoras clave:

- ✅ **UI/UX mejorado**: Formulario permanentemente visible, mejor navegación, success UI con badge y View Passport
- ✅ **Seguridad reforzada**: Protecciones contra loops infinitos, timeouts, manejo robusto de errores
- ✅ **Role Management corregido**: AUDITOR_ROLE ahora se exporta correctamente al frontend
- ✅ **Consistencia de código**: Patrón uniforme con todos los demás formularios del sistema

---

## ✅ Tareas Completadas

### 1. Mostrar Formulario Carbon Audit Permanentemente
**Objetivo**: El formulario debe estar siempre visible en el tab "Audits" junto a AuditRecyclingForm

**Implementación**:
```typescript
// web/src/app/dashboard/page.tsx:401-416
<TabsContent value="audits" className="space-y-6">
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <AuditRecyclingForm {...} />

    {/* Carbon Emission Form - Always visible */}
    <AddCarbonEmissionForm />
  </div>
</TabsContent>
```

**Cambios**:
- Removido el estado `showCarbonForm` (ya no se necesita toggle)
- Formulario renderizado permanentemente en grid layout
- Colocado lado a lado con AuditRecyclingForm para mejor UX

---

### 2. Botón "Carbon Audit Dashboard"
**Objetivo**: Cambiar el botón de toggle a navegación directa al dashboard completo del auditor

**Implementación**:
```typescript
// web/src/app/dashboard/page.tsx:307-318
{selectedTab === 'audits' && (
  <Link href="/dashboard/auditor">
    <Button variant="outline" size="sm" className="ml-4">
      <Leaf className="h-4 w-4 mr-2" />
      Carbon Audit Dashboard
    </Button>
  </Link>
)}
```

**Funcionalidad**:
- El botón ahora navega a `/dashboard/auditor`
- Muestra el formulario completo con información del battery passport
- Mejor separación de responsabilidades (quick access vs. full dashboard)

---

### 3. Success UI con View Passport
**Objetivo**: Mejorar la UI de éxito con badge verde y botón para ver el passport

**Implementación**:
```typescript
// web/src/components/forms/AddCarbonEmissionForm.tsx:295-327
{isConfirmed && hash && (
  <Card className="bg-green-500/10 border-green-500/50">
    <CardContent className="pt-6">
      <div className="space-y-4">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-green-500">Success!</p>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                Recorded
              </Badge>
            </div>
            <p className="text-sm text-green-400 mt-1">
              Carbon emission recorded successfully for battery {bin}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Transaction: {hash.slice(0, 10)}...{hash.slice(-8)}
            </p>
          </div>
        </div>

        {/* View Passport Button */}
        <Link href={`/passport/${bin}`}>
          <Button variant="outline" size="sm"
            className="w-full border-green-500/50 hover:bg-green-500/10">
            <ExternalLink className="h-4 w-4 mr-2" />
            View Battery Passport
          </Button>
        </Link>
      </div>
    </CardContent>
  </Card>
)}
```

**Características**:
- ✅ Badge verde con texto "Recorded"
- ✅ Mensaje de éxito detallado con BIN y hash de transacción
- ✅ Botón "View Battery Passport" que navega a `/passport/{bin}`
- ✅ Styling consistente con tema verde de éxito

---

### 4. Corrección del Role AUDITOR en Header
**Problema Identificado**: El badge de AUDITOR no se mostraba en el header

**Causa Raíz**: El deployment script no exportaba el `AUDITOR_ROLE` del contrato `CarbonFootprint`

**Solución Implementada**:
```solidity
// sc/script/DeployAll.s.sol:352-378
function exportRoleHashes() internal {
    string memory rolesJson = "roles";

    // Get role hashes from RoleManager
    bytes32 adminRole = roleManager.ADMIN_ROLE();
    bytes32 componentManufacturerRole = roleManager.COMPONENT_MANUFACTURER_ROLE();
    bytes32 oemRole = roleManager.OEM_ROLE();
    bytes32 fleetOperatorRole = roleManager.FLEET_OPERATOR_ROLE();
    bytes32 aftermarketUserRole = roleManager.AFTERMARKET_USER_ROLE();
    bytes32 recyclerRole = roleManager.RECYCLER_ROLE();

    // Get AUDITOR_ROLE from CarbonFootprint contract
    bytes32 auditorRole = carbonFootprint.AUDITOR_ROLE();

    // Serialize roles
    vm.serializeBytes32(rolesJson, "ADMIN_ROLE", adminRole);
    vm.serializeBytes32(rolesJson, "COMPONENT_MANUFACTURER_ROLE", componentManufacturerRole);
    vm.serializeBytes32(rolesJson, "OEM_ROLE", oemRole);
    vm.serializeBytes32(rolesJson, "FLEET_OPERATOR_ROLE", fleetOperatorRole);
    vm.serializeBytes32(rolesJson, "AFTERMARKET_USER_ROLE", aftermarketUserRole);
    vm.serializeBytes32(rolesJson, "RECYCLER_ROLE", recyclerRole);
    string memory finalRolesJson = vm.serializeBytes32(rolesJson, "AUDITOR_ROLE", auditorRole);

    // Write to deployments directory
    string memory rolesPath = string.concat(vm.projectRoot(), "/deployments/roles.json");
    vm.writeJson(finalRolesJson, rolesPath);
}
```

**Resultado**:
- El hash de `AUDITOR_ROLE` ahora se exporta a `deployments/roles.json`
- El frontend puede leer correctamente el role desde `web/src/config/deployed-roles.json`
- El hook `useRole('CarbonFootprint', 'AUDITOR_ROLE')` funcionará correctamente
- El badge aparecerá en el header después de redeployar

---

## 🔒 Mejoras de Seguridad y Robustez

### Problema Original
El formulario `AddCarbonEmissionForm` no tenía las protecciones necesarias contra:
- Loops infinitos en useEffect
- Transacciones colgadas sin timeout
- Manejo inadecuado de errores
- Estado inconsistente después de errores

### Patrón de Referencia
Se analizaron los formularios `RegisterBatteryForm` y `UpdateSOHForm` para extraer el patrón de protecciones.

---

### Protección 1: Prevención de Loops Infinitos en useEffect

**Problema**: Incluir funciones estables (`toast`, `reset`) en dependencias causa re-renders infinitos

**Solución**:
```typescript
// ❌ ANTES - Causa loops infinitos
useEffect(() => {
  if (isPending && !toastId) {
    const id = toast.transactionPending('Recording carbon emission...');
    setToastId(id);
  }
}, [isPending, toastId, toast]); // toast causa loop

// ✅ DESPUÉS - Dependencias optimizadas
useEffect(() => {
  if (isPending && !toastId) {
    const id = toast.transactionPending('Recording carbon emission...');
    setToastId(id);
  }
}, [isPending, toastId]); // toast removed - stable function
```

**Aplicado en**:
- ✅ useEffect de isPending (línea 53-58)
- ✅ useEffect de isConfirming (línea 61-72)
- ✅ useEffect de isConfirmed (línea 75-85)
- ✅ useEffect de writeError (línea 88-116)
- ✅ useEffect de confirmError (línea 119-145)
- ✅ useEffect de timeout (línea 148-163)

---

### Protección 2: Timeout de Seguridad (30 segundos)

**Problema**: Transacciones pueden quedarse colgadas indefinidamente

**Solución**:
```typescript
// Timeout safety net: clear toast if transaction takes too long (30 seconds)
useEffect(() => {
  if (isConfirming) {
    const timeoutId = setTimeout(() => {
      toast.dismiss(toastId);
      toast.transactionError('Transaction timeout', {
        description: 'Transaction is taking too long. Please check your wallet or try again.',
      });
      setToastId(undefined);
      confirmingToastShown.current = false;
      reset();
    }, 30000); // 30 seconds timeout

    return () => clearTimeout(timeoutId); // Cleanup
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [isConfirming]); // toast, reset removed - stable functions
```

**Características**:
- Timeout de 30 segundos durante confirmación
- Limpia el toast y muestra error específico
- Reset del estado del contrato
- Cleanup function para cancelar timeout si la confirmación termina antes

---

### Protección 3: Manejo Separado de Errores

**writeError vs confirmError**: Diferentes tipos de errores requieren diferentes handlers

#### writeError Handler
```typescript
// Handle errors during transaction submission (wallet, validation, etc.)
useEffect(() => {
  if (writeError && toastId) {
    toast.dismiss(toastId);

    let errorMsg = writeError.message;

    if (writeError.message.includes('User rejected')) {
      errorMsg = 'Transaction rejected by user';
    } else if (writeError.message.includes('insufficient funds')) {
      errorMsg = 'Insufficient funds for transaction';
    } else if (writeError.message.includes('Battery does not exist')) {
      errorMsg = 'Battery not found. Please verify the BIN.';
    } else if (writeError.message.includes('Emission must be positive')) {
      errorMsg = 'Emission amount must be greater than 0.';
    } else if (writeError.message.includes('exceeds maximum')) {
      errorMsg = 'Emission amount exceeds the maximum allowed (100,000 kg CO₂e).';
    } else if (writeError.message.includes('AccessControl') ||
               writeError.message.toLowerCase().includes('auditor')) {
      errorMsg = 'Not authorized. Only accounts with AUDITOR_ROLE can record emissions. ' +
                 'Please connect with the Auditor account (Account #6).';
    }

    toast.transactionError('Failed to record emission', {
      description: errorMsg,
    });
    setToastId(undefined);
    confirmingToastShown.current = false;
    reset(); // Reset the write contract state
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [writeError, toastId]); // toast, reset removed - stable functions
```

#### confirmError Handler
```typescript
// Handle errors during transaction confirmation (reverted, access control, etc.)
useEffect(() => {
  if (confirmError && toastId) {
    toast.dismiss(toastId);

    let errorMsg = confirmError.message;

    if (confirmError.message.includes('reverted')) {
      errorMsg = 'Transaction reverted. You may not be authorized or there may be a validation error.';
    } else if (confirmError.message.toLowerCase().includes('accesscontrol') ||
               confirmError.message.toLowerCase().includes('auditor')) {
      errorMsg = 'Access denied: Only accounts with AUDITOR_ROLE can record emissions. ' +
                 'Please connect with the Auditor account (Account #6).';
    } else if (confirmError.message.includes('Battery does not exist')) {
      errorMsg = 'Battery not found. Please verify the BIN.';
    } else if (confirmError.message.includes('Emission must be positive')) {
      errorMsg = 'Emission amount must be greater than 0.';
    } else if (confirmError.message.includes('exceeds maximum')) {
      errorMsg = 'Emission amount exceeds the maximum allowed (100,000 kg CO₂e).';
    }

    toast.transactionError('Transaction confirmation failed', {
      description: errorMsg,
    });
    setToastId(undefined);
    confirmingToastShown.current = false;
    reset();
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [confirmError, toastId]); // toast, reset removed - stable functions
```

**Mensajes de Error Cubiertos**:
- ✅ User rejected transaction
- ✅ Insufficient funds
- ✅ Battery not found
- ✅ Invalid emission amount (must be > 0)
- ✅ Emission exceeds maximum (100,000 kg CO₂e)
- ✅ Access control / AUDITOR_ROLE required
- ✅ Transaction reverted
- ✅ Generic fallback messages

---

### Protección 4: Mejoras en useWaitForTransactionReceipt

**Problema**: Sin configuración, no hay reintentos automáticos ni control de cuándo ejecutar

**Solución**:
```typescript
const {
  isLoading: isConfirming,
  isSuccess: isConfirmed,
  error: confirmError
} = useWaitForTransactionReceipt({
  hash,
  query: {
    enabled: !!hash,      // Solo ejecuta si hay hash válido
    retry: 3,             // Reintenta hasta 3 veces
    retryDelay: 1000,     // 1 segundo entre reintentos
  },
});
```

**Beneficios**:
- No ejecuta queries innecesarias cuando no hay hash
- Reintentos automáticos en caso de fallos temporales de red
- Delay configurado para no saturar el RPC

---

### Protección 5: Control de Estado del Toast

**Problema**: Múltiples toasts "Confirming..." pueden aparecer si el componente re-renderiza

**Solución**:
```typescript
const confirmingToastShown = useRef(false);

useEffect(() => {
  if (isConfirming && !confirmingToastShown.current) {
    if (toastId) toast.dismiss(toastId);
    const id = toast.loading('Confirming transaction...', {
      description: 'Waiting for blockchain confirmation',
    });
    setToastId(id);
    confirmingToastShown.current = true;
  } else if (!isConfirming) {
    confirmingToastShown.current = false; // Reset cuando termina
  }
}, [isConfirming]);
```

**Características**:
- `useRef` persiste entre renders sin causar re-renders
- Flag se setea en `true` cuando se muestra el toast
- Flag se resetea en `false` cuando termina la confirmación
- Previene múltiples toasts durante el mismo ciclo de confirmación

---

### Protección 6: Reset del Estado en Todos los Errores

**Problema**: El estado de `useWriteContract` puede quedar "sucio" después de un error

**Solución**: Llamar `reset()` en todos los handlers de error:
```typescript
// En writeError
reset(); // Reset the write contract state

// En confirmError
reset();

// En timeout
reset();
```

**Beneficio**: El formulario queda listo para una nueva transacción sin estado residual

---

### Protección 7: Tipo de Toast ID Consistente

**Problema**: Inconsistencia en el tipo del toast ID entre formularios

**Solución**:
```typescript
// ❌ ANTES
const [toastId, setToastId] = useState<string | null>(null);

// ✅ DESPUÉS (consistente con otros formularios)
const [toastId, setToastId] = useState<string | number | undefined>();
```

**Cambios asociados**:
```typescript
// ❌ ANTES
setToastId(null);

// ✅ DESPUÉS
setToastId(undefined);
```

---

## 📊 Comparación: Antes vs Después

### Antes
```typescript
// ❌ Sin protecciones
const { writeContract, data: hash, error: writeError, isPending: isWriting } = useWriteContract();

const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
  hash,
});

useEffect(() => {
  if (isWriting && !toastId) {
    const id = toast.transactionPending('Recording carbon emission...');
    setToastId(id);
  }
}, [isWriting, toastId, toast]); // ⚠️ Loop infinito

useEffect(() => {
  if (writeError && toastId) {
    toast.dismiss(toastId);
    toast.transactionError('Failed to record emission', {
      description: writeError.message, // ⚠️ Mensaje genérico
    });
    setToastId(null);
    // ⚠️ No hay reset()
  }
}, [writeError, toastId, toast]); // ⚠️ Loop infinito

// ⚠️ No hay handler de confirmError
// ⚠️ No hay timeout
```

### Después
```typescript
// ✅ Con todas las protecciones
const { writeContract, data: hash, error: writeError, isPending: isWriting, reset } = useWriteContract();

const {
  isLoading: isConfirming,
  isSuccess: isConfirmed,
  error: confirmError
} = useWaitForTransactionReceipt({
  hash,
  query: {
    enabled: !!hash,
    retry: 3,
    retryDelay: 1000,
  },
});

// ✅ Dependencias optimizadas
useEffect(() => {
  if (isWriting && !toastId) {
    const id = toast.transactionPending('Recording carbon emission...');
    setToastId(id);
  }
}, [isWriting, toastId]); // toast removed - stable function

// ✅ Mensajes específicos + reset
useEffect(() => {
  if (writeError && toastId) {
    toast.dismiss(toastId);

    let errorMsg = writeError.message;
    if (writeError.message.includes('User rejected')) {
      errorMsg = 'Transaction rejected by user';
    } else if (writeError.message.includes('insufficient funds')) {
      errorMsg = 'Insufficient funds for transaction';
    }
    // ... más casos específicos

    toast.transactionError('Failed to record emission', {
      description: errorMsg,
    });
    setToastId(undefined);
    confirmingToastShown.current = false;
    reset(); // ✅ Reset state
  }
}, [writeError, toastId]);

// ✅ Handler de confirmError
useEffect(() => {
  if (confirmError && toastId) {
    // ... manejo específico de errores de confirmación
    reset();
  }
}, [confirmError, toastId]);

// ✅ Timeout de 30 segundos
useEffect(() => {
  if (isConfirming) {
    const timeoutId = setTimeout(() => {
      toast.transactionError('Transaction timeout', {
        description: 'Transaction is taking too long. Please check your wallet or try again.',
      });
      setToastId(undefined);
      reset();
    }, 30000);

    return () => clearTimeout(timeoutId);
  }
}, [isConfirming]);
```

---

## 📁 Archivos Modificados

### 1. `web/src/app/dashboard/page.tsx`
**Cambios**:
- Removido estado `showCarbonForm`
- Cambiado botón de toggle a Link de navegación
- Formulario permanentemente visible en tab Audits

**Líneas modificadas**: 43-46, 307-318, 401-416

---

### 2. `web/src/components/forms/AddCarbonEmissionForm.tsx`
**Cambios principales**:
- ✅ Agregado `reset` a useWriteContract
- ✅ Agregado `confirmError` a useWaitForTransactionReceipt
- ✅ Configuración de query con enabled, retry, retryDelay
- ✅ Tipo de toastId cambiado a `string | number | undefined`
- ✅ 6 useEffect con protecciones completas
- ✅ Success UI mejorado con badge y View Passport button

**Líneas modificadas**: 34, 37-50, 52-163, 295-327

**Protecciones agregadas**:
- Loop infinito prevention
- Timeout de 30 segundos
- Manejo de writeError
- Manejo de confirmError
- Control de toast con useRef
- Reset en todos los errores

---

### 3. `sc/script/DeployAll.s.sol`
**Cambios**:
- Agregado export de `AUDITOR_ROLE` desde CarbonFootprint
- Serialización del role hash en roles.json

**Líneas modificadas**: 352-378

**Código agregado**:
```solidity
// Get AUDITOR_ROLE from CarbonFootprint contract
bytes32 auditorRole = carbonFootprint.AUDITOR_ROLE();

// Serialize roles
// ... (otros roles)
string memory finalRolesJson = vm.serializeBytes32(rolesJson, "AUDITOR_ROLE", auditorRole);
```

---

### 4. `web/src/components/layout/DashboardLayout.tsx`
**Estado actual**: Ya tiene el código correcto para detectar AUDITOR_ROLE

**Línea 24**:
```typescript
const { hasRole: isAuditor } = useRole('CarbonFootprint', 'AUDITOR_ROLE');
```

**Línea 44**:
```typescript
if (isAuditor === true) userRoles.push('AUDITOR');
```

**Nota**: El badge aparecerá después de redeployar porque ahora el role hash se exporta correctamente.

---

## 🧪 Testing y Verificación

### Testing Manual Requerido

#### 1. Verificar Deployment y Role Export
```bash
cd /Users/paco/Documents/CodeCrypto/PFM_Traza_Fragar/supply-chain-battery-circular-economy/sc
./deploy-and-seed.sh
```

**Verificar**:
- ✅ `deployments/roles.json` contiene `AUDITOR_ROLE`
- ✅ `web/src/config/deployed-roles.json` se actualiza automáticamente
- ✅ Auditor account (0x976EA74026E726554dB657fA54763abd0C3a0aa9) tiene el role

#### 2. Verificar Badge de Auditor en Header
1. Conectar con cuenta Auditor (Account #6)
2. Ir a `/dashboard`
3. **Verificar**: Badge "AUDITOR" aparece en el header junto a otros roles

#### 3. Testing del Formulario - Happy Path
1. Conectar con cuenta Auditor
2. Ir a `/dashboard` → tab "Audits"
3. **Verificar**: Formulario Carbon Emission visible permanentemente
4. Llenar formulario con datos válidos:
   - BIN: NV-2024-001234
   - Phase: Manufacturing
   - kg CO₂e: 3400
   - Description: Test emission
   - Evidence Hash: (dejar vacío o poner IPFS CID)
5. Clic en "Record Emission"
6. **Verificar**:
   - ✅ Toast "Recording carbon emission..."
   - ✅ Toast "Confirming transaction..."
   - ✅ Toast "Carbon emission recorded successfully!"
   - ✅ Success card con badge verde "Recorded"
   - ✅ Botón "View Battery Passport" funcional

#### 4. Testing de Protecciones - Error Cases

**Test 4.1: User Rejection**
1. Llenar formulario
2. Rechazar transacción en wallet
3. **Verificar**: Toast error "Transaction rejected by user"
4. **Verificar**: Formulario listo para nuevo intento

**Test 4.2: Access Control**
1. Desconectar Auditor
2. Conectar con otra cuenta (sin AUDITOR_ROLE)
3. Intentar registrar emisión
4. **Verificar**: Error "Not authorized. Only accounts with AUDITOR_ROLE..."

**Test 4.3: Battery Not Found**
1. Usar BIN inválido (ej: "FAKE-9999-999999")
2. Enviar transacción
3. **Verificar**: Error "Battery not found. Please verify the BIN."

**Test 4.4: Invalid Emission Amount**
1. Poner kg CO₂e = 0
2. **Verificar**: Validación en frontend o error "Emission amount must be greater than 0"
3. Poner kg CO₂e = 200000 (excede máximo)
4. **Verificar**: Error "Emission amount exceeds the maximum allowed (100,000 kg CO₂e)"

**Test 4.5: Timeout (requiere red lenta)**
1. Configurar MetaMask con RPC muy lento
2. Enviar transacción
3. Esperar 30 segundos
4. **Verificar**: Toast "Transaction timeout" aparece
5. **Verificar**: Estado reseteado, formulario listo

#### 5. Testing del Botón "Carbon Audit Dashboard"
1. Ir a `/dashboard` → tab "Audits"
2. Clic en botón "Carbon Audit Dashboard"
3. **Verificar**: Navega a `/dashboard/auditor`
4. **Verificar**: Formulario completo con información adicional del auditor

#### 6. Testing de Prevención de Loops
1. Abrir DevTools → Console
2. Usar formulario normalmente
3. **Verificar**: No hay warnings de "Maximum update depth exceeded"
4. **Verificar**: No hay re-renders excesivos

---

## 🔍 Checklist de Verificación Post-Deployment

### Frontend
- [ ] Badge AUDITOR aparece en header con cuenta correcta
- [ ] Formulario visible permanentemente en tab Audits
- [ ] Botón "Carbon Audit Dashboard" navega correctamente
- [ ] Success UI muestra badge verde y botón View Passport
- [ ] Toasts aparecen en orden correcto (pending → confirming → success)
- [ ] No hay loops infinitos en console
- [ ] Timeout funciona después de 30 segundos

### Smart Contracts
- [ ] `deployments/roles.json` contiene AUDITOR_ROLE hash
- [ ] Account #6 tiene AUDITOR_ROLE en CarbonFootprint
- [ ] Función `addEmission` solo ejecutable por auditor
- [ ] Transacción revierte si no tienes AUDITOR_ROLE

### Error Handling
- [ ] User rejection muestra mensaje apropiado
- [ ] Insufficient funds detectado correctamente
- [ ] Access control errors muestran mensaje claro
- [ ] Battery not found detectado
- [ ] Invalid amounts muestran validación
- [ ] Todos los errores llaman reset()

---

## 🚀 Próximos Pasos

### Inmediato
1. **Redeployar contratos**:
   ```bash
   cd sc
   ./deploy-and-seed.sh
   ```

2. **Verificar deployed-roles.json** contiene AUDITOR_ROLE

3. **Testing manual** siguiendo la guía de Testing y Verificación

### Corto Plazo
1. **Aplicar mismo patrón** a otros formularios que aún no tienen protecciones:
   - ChangeBatteryStateForm
   - IntegrateBatteryForm
   - RecordCriticalEventForm
   - RecordMaintenanceForm
   - Etc.

2. **Documentar patrón** de protecciones en guía de desarrollo para nuevos formularios

3. **Tests automatizados** para verificar:
   - Role assignment correcto
   - Error handling
   - Toast lifecycle
   - Timeout behavior

### Medio Plazo
1. **Mejorar UX del formulario**:
   - Auto-complete de BIN desde batteries registradas
   - Validación en tiempo real
   - Sugerencias de emissions por fase
   - IPFS upload directo para evidence

2. **Dashboard de auditor mejorado**:
   - Tabla de todas las emisiones registradas
   - Filtros por batería, fase, fecha
   - Gráficos de carbon footprint
   - Export a CSV/PDF

3. **Notificaciones**:
   - Email cuando se registra emisión
   - Alertas si emisión excede threshold
   - Resumen mensual para auditor

---

## 📝 Notas Técnicas

### Patrón de Protecciones Estándar

Este patrón debe aplicarse a TODOS los formularios que usan `useWriteContract`:

```typescript
// 1. Imports necesarios
import { useState, useEffect, useRef } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useToast } from '@/hooks';

// 2. Estado del formulario
const [toastId, setToastId] = useState<string | number | undefined>();
const confirmingToastShown = useRef(false);

// 3. Hooks de Wagmi con configuración
const { writeContract, data: hash, error: writeError, isPending, reset } = useWriteContract();

const {
  isLoading: isConfirming,
  isSuccess,
  error: confirmError
} = useWaitForTransactionReceipt({
  hash,
  query: {
    enabled: !!hash,
    retry: 3,
    retryDelay: 1000,
  },
});

// 4. useEffect para isPending
useEffect(() => {
  if (isPending && !toastId) {
    const id = toast.transactionPending('Processing...');
    setToastId(id);
  }
}, [isPending, toastId]);

// 5. useEffect para isConfirming
useEffect(() => {
  if (isConfirming && !confirmingToastShown.current) {
    if (toastId) toast.dismiss(toastId);
    const id = toast.loading('Confirming transaction...', {
      description: 'Waiting for blockchain confirmation',
    });
    setToastId(id);
    confirmingToastShown.current = true;
  } else if (!isConfirming) {
    confirmingToastShown.current = false;
  }
}, [isConfirming]);

// 6. useEffect para isSuccess
useEffect(() => {
  if (isSuccess && toastId) {
    toast.dismiss(toastId);
    toast.transactionSuccess('Success!', {
      description: 'Transaction completed',
    });
    setToastId(undefined);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [isSuccess, toastId]);

// 7. useEffect para writeError
useEffect(() => {
  if (writeError && toastId) {
    toast.dismiss(toastId);

    let errorMsg = writeError.message;
    // ... manejo específico de errores

    toast.transactionError('Transaction failed', {
      description: errorMsg,
    });
    setToastId(undefined);
    confirmingToastShown.current = false;
    reset();
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [writeError, toastId]);

// 8. useEffect para confirmError
useEffect(() => {
  if (confirmError && toastId) {
    toast.dismiss(toastId);

    let errorMsg = confirmError.message;
    // ... manejo específico de errores

    toast.transactionError('Confirmation failed', {
      description: errorMsg,
    });
    setToastId(undefined);
    confirmingToastShown.current = false;
    reset();
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [confirmError, toastId]);

// 9. useEffect para timeout
useEffect(() => {
  if (isConfirming) {
    const timeoutId = setTimeout(() => {
      toast.dismiss(toastId);
      toast.transactionError('Transaction timeout', {
        description: 'Transaction is taking too long. Please check your wallet or try again.',
      });
      setToastId(undefined);
      confirmingToastShown.current = false;
      reset();
    }, 30000); // 30 seconds

    return () => clearTimeout(timeoutId);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [isConfirming]);
```

---

## 🎓 Lecciones Aprendidas

### 1. Dependencias de useEffect
**Lección**: Funciones como `toast` y `reset` son estables (referencia constante), incluirlas en dependencias causa loops infinitos.

**Solución**: Remover de dependencias + agregar `eslint-disable-next-line react-hooks/exhaustive-deps`

### 2. Manejo de Errores Separado
**Lección**: `writeError` y `confirmError` son diferentes tipos de errores que requieren mensajes distintos.

**Solución**: Dos useEffect separados con lógica específica para cada caso

### 3. Timeout es Crítico
**Lección**: Transacciones pueden colgarse por problemas de red, gas, RPC, etc.

**Solución**: Timeout de 30 segundos con cleanup para evitar memory leaks

### 4. Estado del Toast
**Lección**: Re-renders pueden causar múltiples toasts del mismo tipo.

**Solución**: `useRef` para flag que no causa re-renders pero persiste estado

### 5. Role Export
**Lección**: Roles de contratos especializados (CarbonFootprint) deben exportarse manualmente.

**Solución**: Agregar export en `exportRoleHashes()` del deployment script

---

## 📚 Referencias

### Archivos de Referencia
- `RegisterBatteryForm.tsx` - Patrón completo de protecciones
- `UpdateSOHForm.tsx` - Manejo de roles y validación
- `TransferOwnershipForm.tsx` - Success UI y navegación

### Documentación Relacionada
- [Wagmi useWriteContract](https://wagmi.sh/react/api/hooks/useWriteContract)
- [Wagmi useWaitForTransactionReceipt](https://wagmi.sh/react/api/hooks/useWaitForTransactionReceipt)
- [React useEffect](https://react.dev/reference/react/useEffect)
- [React useRef](https://react.dev/reference/react/useRef)

### Smart Contracts
- `CarbonFootprint.sol` - Definición de AUDITOR_ROLE
- `DeployAll.s.sol` - Export de roles
- `SeedData.s.sol` - Asignación de roles en seed

---

## 🏁 Conclusión

Esta sesión logró:

✅ **Mejorar significativamente la UX** del formulario de Carbon Emission
✅ **Implementar protecciones robustas** contra loops infinitos y transacciones colgadas
✅ **Corregir el export de AUDITOR_ROLE** para que el badge aparezca en el header
✅ **Establecer un patrón estándar** para todos los formularios del sistema
✅ **Mejorar la seguridad y estabilidad** de la aplicación

El formulario `AddCarbonEmissionForm` ahora es **robusto, seguro y consistente** con el resto del sistema.

---

**Documento generado**: 28 de Diciembre 2025
**Sesión**: Carbon Audit Form & Security Improvements
**Status**: ✅ Completado - Pendiente de deployment y testing
