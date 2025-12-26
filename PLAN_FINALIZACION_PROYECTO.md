# 🎯 PLAN DE FINALIZACIÓN DEL PROYECTO

**Proyecto**: Supply Chain Battery Circular Economy
**Fecha inicio**: 2025-12-17
**Tiempo estimado total**: 5-7 días
**Objetivo**: MVP completamente funcional con tests E2E preparados

---

## 📋 ÍNDICE DE FASES

1. [Fase 1: Completar Formularios Web (Día 1-2)](#fase-1-completar-formularios-web)
2. [Fase 2: Testing Manual Completo (Día 2-3)](#fase-2-testing-manual-completo)
3. [Fase 3: Setup Tests E2E con Playwright (Día 3-4)](#fase-3-setup-tests-e2e-con-playwright)
4. [Fase 4: Implementar Suites E2E (Día 4-5)](#fase-4-implementar-suites-e2e)
5. [Fase 5: Deployment Testnet (Día 6)](#fase-5-deployment-testnet-opcional)
6. [Fase 6: Refinamiento Final (Día 7)](#fase-6-refinamiento-final)

---

## 🔴 FASE 1: COMPLETAR FORMULARIOS WEB

**Duración**: 1.5-2 días
**Prioridad**: CRÍTICA
**Bloqueante**: Sí (necesarios para flujo MVP completo)

### Objetivo
Implementar los 5 formularios faltantes para completar todas las operaciones de smart contracts.

---

### Tarea 1.1: Implementar IntegrateBatteryForm.tsx ⭐ CRÍTICO

**Tiempo estimado**: 3-4 horas

#### Ubicación
`/web/src/components/forms/IntegrateBatteryForm.tsx`

#### Especificaciones

**Propósito**: Vincular batería (BIN) a vehículo (VIN) - Operación OEM

**Smart Contract**: `BatteryRegistry.integrateBattery(bytes32 bin, bytes32 vin)`

**Campos del formulario**:
```typescript
{
  bin: string,              // Battery Identification Number (NV-2024-001234)
  vin: string,              // Vehicle Identification Number (17 caracteres)
  vehicleModel: string,     // Modelo del vehículo (ej: Tesla Model 3, BMW iX)
  integrationDate: Date     // Fecha de integración (default: hoy)
}
```

**Validaciones**:
- BIN: Formato válido (regex: `^[A-Z]{2}-\d{4}-\d{6}$`)
- VIN: 17 caracteres alfanuméricos (estándar ISO 3779)
- Battery state debe ser "Manufactured" (verificar on-chain)
- Usuario debe tener rol OEM_ROLE

**Flujo**:
1. Usuario ingresa BIN → fetch battery data from blockchain
2. Verificar estado = Manufactured
3. Ingresar VIN (validación formato)
4. Ingresar modelo de vehículo
5. Seleccionar fecha (default hoy)
6. Submit → Transaction
7. Success → Actualizar estado a "Integrated"
8. Redirect a `/passport/{bin}` para ver VIN vinculado

**Transacción**:
```typescript
const binBytes32 = stringToBytes32(bin);
const vinBytes32 = stringToBytes32(vin);

const { writeContract } = useContractWrite({
  address: contracts.BatteryRegistry.address,
  abi: contracts.BatteryRegistry.abi,
  functionName: 'integrateBattery',
  args: [binBytes32, vinBytes32],
});
```

**Estados de UI**:
- Idle: Formulario vacío
- Loading: Fetching battery data
- Pending: Transaction enviada a MetaMask
- Confirming: Esperando confirmación blockchain
- Success: Toast + redirect
- Error: Mostrar mensaje de error claro

**Integración en Dashboard**:
- Añadir en OEM Dashboard (`/web/src/app/dashboard/oem/page.tsx`)
- Tab "Integrate Battery" o sección expandible
- Botón "Integrate Battery" que toggle el formulario

**Testing Manual**:
- Registrar batería nueva (con Manufacturer)
- Cambiar a cuenta OEM
- Integrar batería con VIN válido
- Verificar en Battery Passport que VIN aparece
- Verificar estado cambió a "Integrated"

---

### Tarea 1.2: Implementar StartSecondLifeForm.tsx ⭐ CRÍTICO

**Tiempo estimado**: 3-4 horas

#### Ubicación
`/web/src/components/forms/StartSecondLifeForm.tsx`

#### Especificaciones

**Propósito**: Iniciar segunda vida de batería (aftermarket)

**Smart Contract**: `SecondLifeManager.startSecondLife(bytes32 bin, ApplicationType applicationType, bytes32 installationHash)`

**Campos del formulario**:
```typescript
{
  bin: string,                    // Battery ID
  applicationType: ApplicationType, // Enum
  installationLocation: string,   // Dirección de instalación
  capacity: number,               // Capacidad disponible (calculada desde SOH)
  installationHash: string,       // IPFS hash (opcional, default: bytes32(0))
  notes: string                   // Notas opcionales
}
```

**Application Types** (Enum):
```solidity
enum ApplicationType {
  HomeStorage,      // 0: Residential energy storage
  Microgrid,        // 1: Community microgrid
  Grid,             // 2: Grid-scale storage
  Commercial,       // 3: Commercial building backup
  Industrial        // 4: Industrial applications
}
```

**Validaciones**:
- BIN debe existir
- Battery state debe ser "FirstLife" o "EndOfLife" (SOH < 80%)
- SOH debe ser 50-80% (rango aceptable para second life)
- Usuario debe tener rol AFTERMARKET_USER_ROLE

**Flujo**:
1. Ingresar BIN → fetch battery data
2. Verificar SOH está en rango 50-80%
3. Mostrar capacidad disponible calculada (SOH × Capacity)
4. Seleccionar tipo de aplicación (dropdown)
5. Ingresar ubicación de instalación
6. (Opcional) Subir certificado de instalación a IPFS
7. Submit → Transaction
8. Success → Estado cambia a "SecondLife"

**Cálculo de capacidad disponible**:
```typescript
const availableCapacity = (battery.sohCurrent / 100) * battery.capacityKwh;
// Ejemplo: SOH 65% × 75 kWh = 48.75 kWh disponible
```

**Transacción**:
```typescript
const binBytes32 = stringToBytes32(bin);
const installationHashBytes32 = installationHash
  ? ipfsHashToBytes32(installationHash)
  : ethers.ZeroHash;

const { writeContract } = useContractWrite({
  address: contracts.SecondLifeManager.address,
  abi: contracts.SecondLifeManager.abi,
  functionName: 'startSecondLife',
  args: [binBytes32, applicationType, installationHashBytes32],
});
```

**Integración en Dashboard**:
- Crear nuevo dashboard: `/web/src/app/dashboard/aftermarket/page.tsx` O
- Añadir en General Dashboard (`/dashboard`) en tab "Second Life"

**Testing Manual**:
- Usar batería con SOH < 80% (actualizar SOH de batería existente)
- Cambiar a cuenta Aftermarket User (crear rol si no existe)
- Iniciar segunda vida con tipo "Home Storage"
- Verificar estado cambió a "SecondLife"
- Verificar datos en Battery Passport

---

### Tarea 1.3: Implementar RecycleBatteryForm.tsx ⭐ CRÍTICO

**Tiempo estimado**: 3-4 horas

#### Ubicación
`/web/src/components/forms/RecycleBatteryForm.tsx`

#### Especificaciones

**Propósito**: Registrar batería como reciclada

**Smart Contract**: `BatteryRegistry.recycleBattery(bytes32 bin)`

**Campos del formulario**:
```typescript
{
  bin: string,                // Battery ID
  recyclingMethod: string,    // Hydrometallurgical, Pyrometallurgical, Direct
  facility: string,           // Nombre de la planta de reciclaje
  materialsRecovered: Array<{ // Materiales recuperados
    material: string,         // Lithium, Cobalt, Nickel, etc.
    quantityKg: number,       // Cantidad en kg
    purity: number            // Pureza en %
  }>,
  notes: string               // Notas adicionales
}
```

**Validaciones**:
- BIN debe existir
- Battery state debe ser "EndOfLife" (SOH < 50%)
- Usuario debe tener rol RECYCLER_ROLE
- Materiales recovered debe ser array no vacío

**Flujo**:
1. Ingresar BIN → fetch battery data
2. Verificar estado = EndOfLife (si no, mostrar error)
3. Seleccionar método de reciclaje (dropdown)
4. Ingresar nombre de la planta
5. Añadir materiales recuperados (tabla dinámica):
   - Botón "Add Material"
   - Campos: Material (dropdown), Quantity (kg), Purity (%)
   - Botón "Remove" por fila
6. Submit → Transaction
7. Success → Estado cambia a "Recycled"

**Materiales comunes**:
- Lithium (Li)
- Cobalt (Co)
- Nickel (Ni)
- Manganese (Mn)
- Copper (Cu)
- Aluminum (Al)
- Graphite (C)

**Transacción**:
```typescript
// 1. Marcar batería como reciclada
const binBytes32 = stringToBytes32(bin);

await writeContract({
  address: contracts.BatteryRegistry.address,
  abi: contracts.BatteryRegistry.abi,
  functionName: 'recycleBattery',
  args: [binBytes32],
});

// 2. (Opcional) Registrar materiales en RecyclingManager
// Esto puede ser una transacción separada o batch
```

**UI Especial**: Tabla dinámica de materiales
```tsx
<div className="materials-table">
  <table>
    <thead>
      <tr>
        <th>Material</th>
        <th>Quantity (kg)</th>
        <th>Purity (%)</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {materials.map((material, index) => (
        <tr key={index}>
          <td>
            <Select value={material.material} onChange={...}>
              <option>Lithium</option>
              <option>Cobalt</option>
              ...
            </Select>
          </td>
          <td><Input type="number" value={material.quantityKg} /></td>
          <td><Input type="number" value={material.purity} /></td>
          <td><Button onClick={() => removeMaterial(index)}>Remove</Button></td>
        </tr>
      ))}
    </tbody>
  </table>
  <Button onClick={addMaterial}>+ Add Material</Button>
</div>
```

**Integración en Dashboard**:
- Añadir en Recycler Dashboard (`/web/src/app/dashboard/recycler/page.tsx`)
- Tab "Recycle Battery" o sección expandible
- Mostrar lista de baterías "EndOfLife" disponibles para reciclar

**Testing Manual**:
- Crear batería y actualizar SOH a < 50% (EndOfLife)
- Cambiar a cuenta Recycler
- Registrar reciclaje con materiales recuperados
- Verificar estado cambió a "Recycled"
- Verificar datos en Battery Passport

---

### Tarea 1.4: Implementar ChangeBatteryStateForm.tsx ✅ COMPLETADO

**Tiempo estimado**: 2 horas
**Estado**: ✅ **IMPLEMENTADO Y CORREGIDO** (24-DIC-2025)

#### Ubicación
`/web/src/components/forms/ChangeBatteryStateForm.tsx`

#### Especificaciones

**Propósito**: Cambiar estado del ciclo de vida manualmente (para correcciones o testing)

**✅ Mejoras Aplicadas**:
- ✅ useRef añadido para evitar infinite loops en toast
- ✅ Manejo correcto de transacciones con toast notifications
- ✅ Validación de roles implementada
- ✅ Success badge con transaction hash
- ✅ "Change Another" button funcional

**Smart Contract**: `BatteryRegistry.changeBatteryState(bytes32 bin, BatteryState newState)`

**Campos del formulario**:
```typescript
{
  bin: string,            // Battery ID
  currentState: string,   // Estado actual (read-only, fetched)
  newState: BatteryState, // Estado nuevo (dropdown)
  reason: string          // Razón del cambio (opcional)
}
```

**Battery States**:
```solidity
enum BatteryState {
  Manufactured,   // 0
  Integrated,     // 1
  FirstLife,      // 2
  SecondLife,     // 3
  EndOfLife,      // 4
  Recycled        // 5
}
```

**Validaciones**:
- BIN debe existir
- newState debe ser diferente de currentState
- Usuario debe tener rol OPERATOR_ROLE o ADMIN_ROLE

**Flujo**:
1. Ingresar BIN → fetch battery data
2. Mostrar estado actual (read-only badge)
3. Seleccionar nuevo estado (dropdown)
4. Ingresar razón del cambio (opcional)
5. Submit → Transaction
6. Success → Estado actualizado

**Transacción**:
```typescript
const binBytes32 = stringToBytes32(bin);

const { writeContract } = useContractWrite({
  address: contracts.BatteryRegistry.address,
  abi: contracts.BatteryRegistry.abi,
  functionName: 'changeBatteryState',
  args: [binBytes32, newState],
});
```

**Integración en Dashboard**: ✅ COMPLETADO (24-DIC-2025)
- ✅ Integrado en General Dashboard (`/dashboard`)
- ✅ Tab "Operations" → Card "Battery Operations"
- ✅ Implementado como Tab 2: "Change State" dentro de UpdateSOHForm
- ✅ Usa componente Tabs de shadcn/ui para navegación
- ✅ Accesible junto a "Update SOH" (Tab 1)

**Detalles de Implementación**:
- **Archivo**: `/web/src/components/forms/UpdateSOHForm.tsx`
- **Estructura**: Tabs con 2 opciones
  - Tab 1: "Update SOH" (UpdateSOH form original)
  - Tab 2: "Change State" (ChangeBatteryStateForm integrado)
- **UX**: Operaciones relacionadas agrupadas en un solo lugar
- **Permisos**: Ambos tabs requieren OPERATOR_ROLE

**Testing Manual**:
- [ ] Como admin/operator, acceder a `/dashboard` → Operations tab
- [ ] Verificar tabs "Update SOH" y "Change State" visibles
- [ ] Cambiar estado de batería manualmente
- [ ] Verificar cambio en Battery Passport
- [ ] Verificar evento emitido
- [ ] Verificar navegación entre tabs funciona correctamente

**Documentación**:
- Ver `CHANGEBATTERYSTATE_INTEGRATION.md` para detalles completos

---

### Tarea 1.5: Implementar AuditRecyclingForm.tsx ✅ COMPLETADO

**Tiempo estimado**: 2 horas
**Estado**: ✅ **IMPLEMENTADO Y CORREGIDO** (24-DIC-2025)

#### Ubicación
`/web/src/components/forms/AuditRecyclingForm.tsx`

#### Especificaciones

**Propósito**: Auditar proceso de reciclaje (aprobar/rechazar)

**✅ Mejoras Aplicadas**:
- ✅ useRef añadido para evitar infinite loops en toast
- ✅ Manejo correcto de transacciones con toast notifications
- ✅ Success badge con transaction hash
- ✅ Radio buttons para Approve/Reject
- ✅ Validación de auditor role

**Smart Contract**: `RecyclingManager.auditRecycling(bytes32 bin, bool approved)`

**Campos del formulario**:
```typescript
{
  bin: string,         // Battery ID
  approved: boolean,   // Aprobado/Rechazado (radio buttons)
  auditNotes: string,  // Notas de auditoría
  auditor: string      // Nombre del auditor (opcional)
}
```

**Validaciones**:
- BIN debe existir y estar en estado "Recycled"
- Usuario debe tener rol AUDITOR_ROLE
- Audit notes requerido si rejected

**Flujo**:
1. Ingresar BIN → fetch recycling data
2. Mostrar materiales recuperados y método
3. Radio buttons: Approve / Reject
4. Ingresar notas de auditoría
5. Submit → Transaction
6. Success → Auditoría registrada

**Transacción**:
```typescript
const binBytes32 = stringToBytes32(bin);

const { writeContract } = useContractWrite({
  address: contracts.RecyclingManager.address,
  abi: contracts.RecyclingManager.abi,
  functionName: 'auditRecycling',
  args: [binBytes32, approved],
});
```

**Integración en Dashboard**:
- Crear dashboard de Auditor o
- Añadir en General Dashboard en tab "Audits"

---

### Checklist Fase 1

- [x] IntegrateBatteryForm.tsx implementado y testeado ✅
- [x] StartSecondLifeForm.tsx implementado y testeado ✅
- [x] RecycleBatteryForm.tsx implementado y testeado ✅
- [x] ChangeBatteryStateForm.tsx implementado y testeado ✅
- [x] AuditRecyclingForm.tsx implementado ✅
- [x] Todos los formularios integrados en dashboards correspondientes ✅
- [x] Validaciones de roles funcionando ✅
- [x] Toast notifications configuradas ✅
- [x] Transaction states manejados correctamente ✅
- [x] **BONUS: Infinite loops completamente eliminados** ✅ (24-DIC-2025)
  - [x] 19 archivos corregidos (7 constantes + 12 formularios)
  - [x] useRef implementado en todos los formularios
  - [x] layout.tsx y Web3Context.tsx optimizados

**Estado Fase 1:** ✅ **100% COMPLETADA**

---

## 🟡 FASE 2: TESTING MANUAL COMPLETO

**Duración**: 1 día
**Prioridad**: ALTA
**Dependencia**: Fase 1 completada

### Objetivo
Ejecutar todos los tests manuales según MANUAL_TESTING_GUIDE.md y verificar flujo completo.

---

### Tarea 2.1: Ejecutar Tests Manuales 1-5

**Según MANUAL_TESTING_GUIDE.md:**

#### Test 1: Ver Battery Passport ✅ (Ya funcional)
- [x] Abrir `/passport/NV-2024-001234`
- [x] Verificar datos: BIN, Capacity, SOH, State, Chemistry, Carbon Footprint
- [x] Verificar tabs: Overview, Supply Chain, Carbon Footprint, Lifecycle
- [x] Verificar mapa (LocationMap) se renderiza

#### Test 2: Registrar Nueva Batería ✅ (Ya funcional)
- [x] Conectar con Cuenta 1 (Manufacturer)
- [x] Navegar a `/dashboard/manufacturer`
- [x] Completar formulario RegisterBattery
- [x] Submit y firmar transacción
- [x] Verificar toast notification
- [x] Verificar en Battery Passport

#### Test 3: Actualizar SOH ✅ (Ya funcional)
- [x] Conectar con Cuenta 0 (Admin)
- [x] Navegar a `/dashboard` → Tab "Operations"
- [x] Completar formulario UpdateSOH
- [x] Submit y firmar transacción
- [x] Verificar SOH actualizado en Battery Passport
- [x] Verificar gráfico de SOH refleja cambio

#### Test 4: Transferir Propiedad ⚠️ **PENDIENTE**
- [ ] Conectar con Cuenta 1 (Manufacturer) - owner de batería seeded
- [ ] Usar formulario TransferOwnership
- [ ] BIN: NV-2024-001234
- [ ] New Owner: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC (Cuenta 2 - OEM)
- [ ] Transfer Type: Manufacturer → OEM
- [ ] Notes: "Transfer to OEM for vehicle integration"
- [ ] Submit y firmar transacción
- [ ] Verificar toast notification "Ownership Transferred Successfully"
- [ ] Ir a `/passport/NV-2024-001234`
- [ ] Verificar Current Owner ahora es 0x3C44...
- [ ] Verificar evento "OwnershipTransferred" en Supply Chain tab

#### Test 5: Event Listeners en Tiempo Real 🟡 (Parcialmente testeado)
- [ ] Abrir dos pestañas:
  - Pestaña A: `/dashboard/manufacturer`
  - Pestaña B: `/passport/NV-2024-001234`
- [ ] En Pestaña A: Actualizar SOH de batería NV-2024-001234
- [ ] En Pestaña B: Verificar toast notification aparece automáticamente
- [ ] Verificar SOH se actualiza sin refrescar (si auto-refresh implementado)

---

### Tarea 2.2: Testear Nuevos Formularios (Fase 1)

#### Test 6: Integrar Batería (OEM) **NUEVO**
- [ ] **Prerequisito**: Registrar batería nueva con Manufacturer
- [ ] Conectar con Cuenta 2 (OEM)
- [ ] Navegar a `/dashboard/oem`
- [ ] Usar formulario IntegrateBattery:
  - BIN: [batería recién registrada]
  - VIN: 1HGBH41JXMN109186 (ejemplo VIN válido)
  - Vehicle Model: Tesla Model 3
  - Integration Date: [hoy]
- [ ] Submit y firmar transacción
- [ ] Verificar toast notification "Battery Integrated Successfully"
- [ ] Ir a Battery Passport
- [ ] Verificar VIN aparece en datos
- [ ] Verificar estado cambió a "Integrated"

#### Test 7: Iniciar Segunda Vida (Aftermarket) **NUEVO**
- [ ] **Prerequisito**: Batería con SOH < 80%
- [ ] Actualizar SOH de batería a 65% (con Operator)
- [ ] Conectar con Cuenta 3 (Aftermarket User)
- [ ] Navegar a dashboard correspondiente
- [ ] Usar formulario StartSecondLife:
  - BIN: [batería con SOH 65%]
  - Application Type: Home Storage
  - Installation Location: "123 Main St, Barcelona"
  - Notes: "Residential backup system"
- [ ] Submit y firmar transacción
- [ ] Verificar toast notification "Second Life Started Successfully"
- [ ] Ir a Battery Passport
- [ ] Verificar estado cambió a "SecondLife"
- [ ] Verificar nueva capacidad disponible calculada

#### Test 8: Registrar Reciclaje (Recycler) **NUEVO**
- [ ] **Prerequisito**: Batería con SOH < 50% (EndOfLife)
- [ ] Actualizar SOH de batería a 45% (con Operator)
- [ ] Conectar con Cuenta 4 (Recycler)
- [ ] Navegar a `/dashboard/recycler`
- [ ] Usar formulario RecycleBattery:
  - BIN: [batería con SOH 45%]
  - Recycling Method: Hydrometallurgical
  - Facility: "EcoRecycle Plant Madrid"
  - Materials Recovered:
    - Lithium: 5.2 kg, Purity: 95%
    - Cobalt: 3.1 kg, Purity: 92%
    - Nickel: 6.8 kg, Purity: 91%
- [ ] Submit y firmar transacción
- [ ] Verificar toast notification "Battery Recycled Successfully"
- [ ] Ir a Battery Passport
- [ ] Verificar estado cambió a "Recycled"
- [ ] Verificar materiales recuperados aparecen

---

### Tarea 2.3: Testear Flujo Completo End-to-End

**Objetivo**: Verificar ciclo de vida completo de una batería desde manufactura hasta reciclaje

**Pasos**:
1. [ ] **Manufacture** (Cuenta 1 - Manufacturer)
   - Registrar batería nueva: BIN "TEST-E2E-001"
   - Verificar estado: Manufactured, SOH: 100%

2. [ ] **Integration** (Cuenta 2 - OEM)
   - Transferir propiedad de Manufacturer a OEM
   - Integrar batería con VIN
   - Verificar estado: Integrated

3. [ ] **First Life** (Cuenta 0 - Operator)
   - Cambiar estado a FirstLife (ChangeBatteryStateForm)
   - Actualizar SOH a 95%
   - Actualizar SOH a 85%
   - Verificar gráfico de degradación

4. [ ] **Transfer to Aftermarket** (Cuenta 2 - OEM)
   - Actualizar SOH a 70% (fin de primera vida)
   - Transferir propiedad a Aftermarket User (Cuenta 3)

5. [ ] **Second Life** (Cuenta 3 - Aftermarket User)
   - Iniciar segunda vida (Home Storage)
   - Verificar estado: SecondLife

6. [ ] **End of Life** (Cuenta 0 - Operator)
   - Actualizar SOH a 45%
   - Cambiar estado a EndOfLife
   - Transferir propiedad a Recycler (Cuenta 4)

7. [ ] **Recycling** (Cuenta 4 - Recycler)
   - Registrar reciclaje con materiales recuperados
   - Verificar estado: Recycled

8. [ ] **Verification** (Cualquier usuario)
   - Abrir Battery Passport de TEST-E2E-001
   - Verificar Supply Chain tab muestra todos los eventos
   - Verificar Carbon Footprint acumulado
   - Verificar Lifecycle graph muestra degradación completa

---

### Checklist Fase 2

- [ ] Test 1-3 re-verificados (ya funcionales)
- [ ] Test 4 (Transfer Ownership) completado
- [ ] Test 5 (Event Listeners) completado
- [ ] Test 6 (Integrate Battery) completado
- [ ] Test 7 (Start Second Life) completado
- [ ] Test 8 (Register Recycling) completado
- [ ] Flujo completo E2E manual verificado
- [ ] Todos los eventos aparecen en Supply Chain tab
- [ ] Gráficos y visualizaciones funcionando
- [ ] No hay errores en consola del navegador

---

## 🟢 FASE 3: SETUP TESTS E2E CON PLAYWRIGHT

**Duración**: 1 día
**Prioridad**: ALTA
**Dependencia**: Fase 2 completada

### Objetivo
Configurar Playwright para tests E2E automatizados con simulación de wallet.

---

### Tarea 3.1: Instalar y Configurar Playwright

**Tiempo estimado**: 1-2 horas

#### Paso 1: Instalar Playwright

```bash
cd web
npm install -D @playwright/test
npx playwright install
```

#### Paso 2: Crear `playwright.config.ts`

```typescript
// web/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Sequential para blockchain
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker para evitar race conditions

  reporter: [
    ['html'],
    ['list']
  ],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

#### Paso 3: Añadir scripts en `package.json`

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

---

### Tarea 3.2: Configurar Wallet Mock/Simulation

**Tiempo estimado**: 3-4 horas

#### Opción A: Synpress (Recomendado para MetaMask)

Synpress es un plugin de Playwright diseñado específicamente para testing de dApps con MetaMask.

```bash
npm install -D @synthetixio/synpress
```

**Configuración**:
```typescript
// e2e/fixtures/metamask.ts
import { chromium, type BrowserContext } from '@playwright/test';
import { initialSetup } from '@synthetixio/synpress/commands/metamask';
import { prepareMetamask } from '@synthetixio/synpress/helpers';

export async function setupMetaMask(): Promise<BrowserContext> {
  const browserContext = await prepareMetamask(
    process.env.SEED_PHRASE || 'test test test test test test test test test test test junk'
  );

  await initialSetup(chromium, {
    secretWordsOrPrivateKey: process.env.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    network: 'localhost',
    password: 'TestPassword123',
    enableAdvancedSettings: true,
  });

  return browserContext;
}
```

#### Opción B: Mock de Wallet Programático

Si Synpress es muy complejo, crear mock de wallet:

```typescript
// e2e/helpers/wallet-mock.ts
import { Page } from '@playwright/test';

export async function mockWalletConnection(page: Page, address: string) {
  // Inyectar mock de window.ethereum
  await page.addInitScript((address) => {
    (window as any).ethereum = {
      isMetaMask: true,
      selectedAddress: address,
      chainId: '0x7a69', // 31337 en hex (Anvil)

      request: async ({ method, params }: any) => {
        console.log('Mock Wallet Request:', method, params);

        switch (method) {
          case 'eth_requestAccounts':
            return [address];

          case 'eth_accounts':
            return [address];

          case 'eth_chainId':
            return '0x7a69';

          case 'personal_sign':
            // Mock signature
            return '0xmocksignature...';

          case 'eth_sendTransaction':
            // Mock transaction hash
            return '0xmocktxhash' + Math.random().toString(36).substring(7);

          default:
            throw new Error(`Unhandled method: ${method}`);
        }
      },

      on: (event: string, handler: any) => {
        console.log('Mock Wallet Event Listener:', event);
      },
    };
  }, address);
}
```

**Uso en test**:
```typescript
import { test } from '@playwright/test';
import { mockWalletConnection } from './helpers/wallet-mock';

test('register battery with mocked wallet', async ({ page }) => {
  const manufacturerAddress = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

  await mockWalletConnection(page, manufacturerAddress);
  await page.goto('/dashboard/manufacturer');

  // Ahora wallet está "conectado"
  // Proceder con test...
});
```

---

### Tarea 3.3: Crear Helpers y Fixtures

**Tiempo estimado**: 2 horas

#### Helper: Conversión BIN ↔ Bytes32

```typescript
// e2e/helpers/blockchain.ts
import { ethers } from 'ethers';

export function stringToBytes32(str: string): string {
  return ethers.encodeBytes32String(str);
}

export function bytes32ToString(bytes32: string): string {
  return ethers.decodeBytes32String(bytes32);
}
```

#### Helper: Esperar Transacción

```typescript
// e2e/helpers/transactions.ts
import { Page, expect } from '@playwright/test';

export async function waitForTransaction(page: Page, timeout = 30000) {
  // Esperar toast de success
  await expect(page.locator('[data-testid="toast-success"]')).toBeVisible({ timeout });

  // Esperar que transaction hash aparezca
  const txHash = await page.locator('[data-testid="transaction-hash"]').textContent();
  expect(txHash).toMatch(/^0x[a-fA-F0-9]{64}$/);

  return txHash;
}
```

#### Fixture: Accounts

```typescript
// e2e/fixtures/accounts.ts
export const ACCOUNTS = {
  admin: {
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    role: 'ADMIN',
  },
  manufacturer: {
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
    role: 'MANUFACTURER',
  },
  oem: {
    address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    privateKey: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
    role: 'OEM',
  },
  aftermarket: {
    address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    privateKey: '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6',
    role: 'AFTERMARKET_USER',
  },
  recycler: {
    address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
    privateKey: '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a',
    role: 'RECYCLER',
  },
};
```

---

### Checklist Fase 3

- [ ] Playwright instalado y configurado
- [ ] `playwright.config.ts` creado
- [ ] Scripts npm añadidos
- [ ] Wallet mock/simulation funcionando
- [ ] Helpers creados (blockchain, transactions)
- [ ] Fixtures creados (accounts)
- [ ] Test básico funcionando (ej: home page loads)
- [ ] Documentación de setup en README

---

## 🔵 FASE 4: IMPLEMENTAR SUITES E2E

**Duración**: 1-2 días
**Prioridad**: ALTA
**Dependencia**: Fase 3 completada

### Objetivo
Crear suites de tests E2E para cada flujo crítico del MVP.

---

### Tarea 4.1: Suite 1 - Manufacturer Flow

**Archivo**: `e2e/specs/manufacturer.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { mockWalletConnection } from '../helpers/wallet-mock';
import { ACCOUNTS } from '../fixtures/accounts';
import { waitForTransaction } from '../helpers/transactions';

test.describe('Manufacturer Flow', () => {
  test.beforeEach(async ({ page }) => {
    await mockWalletConnection(page, ACCOUNTS.manufacturer.address);
  });

  test('should register new battery successfully', async ({ page }) => {
    await page.goto('/dashboard/manufacturer');

    // Wait for wallet connection
    await expect(page.locator('[data-testid="wallet-address"]')).toContainText('0x7099');

    // Click "Register New Battery" button
    await page.click('button:has-text("Register New Battery")');

    // Fill form
    const bin = `E2E-${Date.now()}`;
    await page.fill('[name="bin"]', bin);
    await page.selectOption('[name="chemistry"]', 'NMC');
    await page.fill('[name="capacity"]', '75');
    await page.fill('[name="manufacturer"]', 'Northvolt AB');

    // Submit
    await page.click('button[type="submit"]:has-text("Register")');

    // Wait for transaction
    const txHash = await waitForTransaction(page);
    expect(txHash).toBeTruthy();

    // Verify redirect to passport
    await expect(page).toHaveURL(`/passport/${bin}`);

    // Verify battery data
    await expect(page.locator('[data-testid="battery-bin"]')).toContainText(bin);
    await expect(page.locator('[data-testid="battery-chemistry"]')).toContainText('NMC');
    await expect(page.locator('[data-testid="battery-capacity"]')).toContainText('75 kWh');
    await expect(page.locator('[data-testid="battery-soh"]')).toContainText('100%');
  });

  test('should show validation error for invalid BIN format', async ({ page }) => {
    await page.goto('/dashboard/manufacturer');

    await page.click('button:has-text("Register New Battery")');
    await page.fill('[name="bin"]', 'INVALID');
    await page.fill('[name="capacity"]', '75');

    await page.click('button[type="submit"]');

    await expect(page.locator('[data-testid="error-bin"]')).toBeVisible();
  });
});
```

---

### Tarea 4.2: Suite 2 - OEM Flow

**Archivo**: `e2e/specs/oem.spec.ts`

```typescript
test.describe('OEM Flow', () => {
  const testBIN = 'OEM-TEST-001';

  test.beforeAll(async () => {
    // Setup: Register battery as manufacturer first
    // This could be a shared fixture
  });

  test('should integrate battery with VIN', async ({ page }) => {
    await mockWalletConnection(page, ACCOUNTS.oem.address);
    await page.goto('/dashboard/oem');

    // Fill integration form
    await page.fill('[name="bin"]', testBIN);
    await page.fill('[name="vin"]', '1HGBH41JXMN109186');
    await page.fill('[name="vehicleModel"]', 'Tesla Model 3');

    await page.click('button[type="submit"]:has-text("Integrate")');

    await waitForTransaction(page);

    // Verify VIN in battery passport
    await page.goto(`/passport/${testBIN}`);
    await expect(page.locator('[data-testid="battery-vin"]')).toContainText('1HGBH41JXMN109186');
    await expect(page.locator('[data-testid="battery-state"]')).toContainText('Integrated');
  });
});
```

---

### Tarea 4.3: Suite 3 - Complete Lifecycle

**Archivo**: `e2e/specs/complete-lifecycle.spec.ts`

```typescript
test.describe('Complete Battery Lifecycle', () => {
  const testBIN = `LIFECYCLE-${Date.now()}`;

  test('should complete full lifecycle from manufacture to recycling', async ({ page }) => {
    // 1. MANUFACTURE
    await mockWalletConnection(page, ACCOUNTS.manufacturer.address);
    await page.goto('/dashboard/manufacturer');

    // Register battery
    // ... (código de registro)

    // 2. INTEGRATION (OEM)
    await mockWalletConnection(page, ACCOUNTS.oem.address);
    await page.goto('/dashboard/oem');

    // Integrate battery
    // ... (código de integración)

    // 3. UPDATE SOH (OPERATOR)
    await mockWalletConnection(page, ACCOUNTS.admin.address);
    await page.goto('/dashboard');

    // Update SOH to 70%
    // ... (código de actualización SOH)

    // 4. SECOND LIFE (AFTERMARKET)
    await mockWalletConnection(page, ACCOUNTS.aftermarket.address);
    await page.goto('/dashboard/aftermarket');

    // Start second life
    // ... (código de segunda vida)

    // 5. RECYCLING (RECYCLER)
    await mockWalletConnection(page, ACCOUNTS.recycler.address);
    await page.goto('/dashboard/recycler');

    // Recycle battery
    // ... (código de reciclaje)

    // 6. VERIFICATION
    await page.goto(`/passport/${testBIN}`);

    // Verify all states were recorded
    await page.click('tab:has-text("Supply Chain")');

    const events = page.locator('[data-testid="supply-chain-event"]');
    await expect(events).toHaveCount(6); // Registered, Integrated, SOH Updated, Second Life, Recycled

    // Verify final state
    await expect(page.locator('[data-testid="battery-state"]')).toContainText('Recycled');
  });
});
```

---

### Checklist Fase 4

- [ ] Suite Manufacturer Flow implementada
- [ ] Suite OEM Flow implementada
- [ ] Suite Operator Flow (SOH updates) implementada
- [ ] Suite Transfer Ownership implementada
- [ ] Suite Aftermarket Flow implementada
- [ ] Suite Recycler Flow implementada
- [ ] Suite Complete Lifecycle implementada
- [ ] Todos los tests pasando (green)
- [ ] Coverage > 80% de flujos críticos
- [ ] CI/CD configurado (opcional)

---

## 🟣 FASE 5: DEPLOYMENT TESTNET (Opcional)

**Duración**: 1 día
**Prioridad**: MEDIA
**Dependencia**: Fases 1-4 completadas

### Objetivo
Desplegar smart contracts en Polygon Mumbai testnet y frontend en Vercel.

*(Detalles de deployment omitidos por brevedad, ver README_PFM líneas 2897-2927)*

---

## 🟠 FASE 6: REFINAMIENTO FINAL

**Duración**: 1 día
**Prioridad**: BAJA
**Dependencia**: Todas las fases anteriores

### Objetivo
Pulir detalles, mejorar UX, documentar.

### Tareas:
- [ ] Mejorar mensajes de error
- [ ] Añadir loading skeletons
- [ ] Optimizar imágenes
- [ ] Actualizar documentación
- [ ] Crear video demo (5 min)
- [ ] Preparar presentación

---

## 📊 RESUMEN DE TIEMPOS

| Fase | Duración | Prioridad | Bloqueante |
|------|----------|-----------|------------|
| Fase 1: Formularios Web | 1.5-2 días | CRÍTICA | Sí |
| Fase 2: Testing Manual | 1 día | ALTA | Sí |
| Fase 3: Setup Playwright | 1 día | ALTA | Sí |
| Fase 4: Suites E2E | 1-2 días | ALTA | No |
| Fase 5: Deployment Testnet | 1 día | MEDIA | No |
| Fase 6: Refinamiento | 1 día | BAJA | No |
| **TOTAL** | **5.5-7 días** | | |

---

## ✅ CRITERIOS DE ÉXITO

### MVP Completo
- [x] Smart contracts testeados >90% coverage
- [ ] 8 formularios funcionando (actualmente 3/8)
- [ ] Flujo completo operativo: Manufacturer → OEM → Operator → Aftermarket → Recycler
- [ ] Tests manuales 1-8 completados
- [ ] Tests E2E automatizados pasando
- [ ] Documentación completa

### Entregables
- [ ] Código en repositorio GitHub
- [ ] Tests E2E ejecutables con `npm run test:e2e`
- [ ] Documentación actualizada (README, USER_GUIDE)
- [ ] Video demo (opcional pero recomendado)

---

## 🚀 QUICK START - Próximos Pasos Inmediatos

### Hoy (Día 1)
1. ✅ Crear este documento de planificación
2. ⏭️ Implementar IntegrateBatteryForm.tsx
3. ⏭️ Testear manualmente integración OEM

### Mañana (Día 2)
4. ⏭️ Implementar StartSecondLifeForm.tsx
5. ⏭️ Implementar RecycleBatteryForm.tsx
6. ⏭️ Testear formularios nuevos

### Día 3
7. ⏭️ Ejecutar Test 4 (Transfer Ownership)
8. ⏭️ Flujo completo E2E manual
9. ⏭️ Setup Playwright

### Día 4-5
10. ⏭️ Implementar suites E2E
11. ⏭️ Debugging y ajustes

---

**Documento creado por**: Claude Code
**Última actualización**: 2025-12-17
**Estado**: Listo para ejecución
