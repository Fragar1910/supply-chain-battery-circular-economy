# Fix: Manufacturer Battery Registration Form

## Problema Identificado

El formulario de registro de baterías en `/dashboard/manufacturer` se quedaba colgado con el mensaje "Registering battery..." y no completaba la transacción.

## Causa Raíz

El formulario tenía **3 errores críticos** al llamar al contrato `registerBattery`:

### 1. BIN no convertido a bytes32
```typescript
// ❌ ANTES (INCORRECTO)
args: [formData.bin, ...]  // String

// ✅ AHORA (CORRECTO)
const binBytes32 = binToBytes32(formData.bin);
args: [binBytes32, ...]  // bytes32
```

### 2. Chemistry enviado como string en lugar de enum
```typescript
// ❌ ANTES (INCORRECTO)
chemistry: 'NMC811'  // String - el contrato espera número

// ✅ AHORA (CORRECTO)
chemistry: '1'  // Enum value (1 = NMC, 2 = NCA, 3 = LFP, etc.)
const chemistryEnum = parseInt(formData.chemistry);
```

**Mapeo del Enum Chemistry** (según `BatteryRegistry.sol`):
- `0` = Unknown
- `1` = NMC (Nickel Manganese Cobalt)
- `2` = NCA (Nickel Cobalt Aluminum)
- `3` = LFP (Lithium Iron Phosphate)
- `4` = LTO (Lithium Titanate Oxide)
- `5` = LiMetal (Lithium Metal)

### 3. Argumentos faltantes
```typescript
// ❌ ANTES (INCORRECTO) - Solo 6 argumentos
args: [bin, chemistry, capacity, weight, manufacturer, date]

// ✅ AHORA (CORRECTO) - Según ABI del contrato
// function registerBattery(bytes32 bin, Chemistry chemistry, uint32 capacityKwh, uint256 carbonFootprint, bytes32 ipfsCertHash)
args: [
  binBytes32,           // bytes32
  chemistryEnum,        // uint8 (enum)
  capacityKwh,          // uint32
  carbonFootprint,      // uint256
  ipfsCertHash          // bytes32
]
```

## Cambios Realizados

### Archivo: `web/src/components/forms/RegisterBatteryForm.tsx`

1. **Import agregado** (línea 7):
   ```typescript
   import { binToBytes32 } from '@/lib/binUtils';
   ```

2. **Chemistry options actualizadas** (líneas 92-100):
   ```typescript
   const chemistryOptions = [
     { value: '1', label: 'NMC (Nickel Manganese Cobalt)', key: 'NMC' },
     { value: '2', label: 'NCA (Nickel Cobalt Aluminum)', key: 'NCA' },
     { value: '3', label: 'LFP (Lithium Iron Phosphate)', key: 'LFP' },
     { value: '4', label: 'LTO (Lithium Titanate Oxide)', key: 'LTO' },
     { value: '5', label: 'LiMetal (Lithium Metal)', key: 'LiMetal' },
   ];
   ```

3. **Default chemistry cambiado** (línea 39):
   ```typescript
   chemistry: '1', // Default to NMC (enum value 1)
   ```

4. **Llamada al contrato corregida** (líneas 138-176):
   ```typescript
   const binBytes32 = binToBytes32(formData.bin);
   const chemistryEnum = parseInt(formData.chemistry);
   const capacityKwh = Math.floor(Number(formData.capacity));
   const carbonFootprint = BigInt(capacityKwh * 100);
   const ipfsCertHash = '0x0000000000000000000000000000000000000000000000000000000000000000';

   writeContract({
     address: CONTRACTS.BatteryRegistry.address,
     abi: CONTRACTS.BatteryRegistry.abi,
     functionName: 'registerBattery',
     args: [binBytes32, chemistryEnum, capacityKwh, carbonFootprint, ipfsCertHash],
   });
   ```

5. **Campo de capacidad mejorado** (línea 280):
   ```typescript
   step="1"  // Solo números enteros
   min="1"
   placeholder="75"
   <p className="text-xs text-slate-500">Nominal capacity in kWh (whole numbers)</p>
   ```

## Cómo Probar

### 1. Conectar con cuenta Manufacturer

En MetaMask, importar la cuenta de test:
```
Address: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
```

### 2. Navegar al formulario
```
http://localhost:3000/dashboard/manufacturer
```

### 3. Completar formulario de prueba
- **BIN**: Presionar "Generate" o escribir manualmente (ej: `TEST-2024-123456`)
- **Chemistry**: Seleccionar cualquier opción (ej: NMC)
- **Capacity**: Escribir `75` (número entero)
- **Weight**: Escribir `450`
- **Manufacturer**: Escribir `Test Company`
- **Date**: Usar fecha actual (default)

### 4. Presionar "Register Battery"

**Flujo esperado:**
1. ✅ MetaMask abre popup para confirmar transacción
2. ✅ Toast: "Registering battery..."
3. ✅ Usuario confirma en MetaMask
4. ✅ Toast: "Confirming transaction..."
5. ✅ Toast verde: "Battery registered successfully!"
6. ✅ Mensaje de éxito muestra el transaction hash

### 5. Verificar batería registrada

```bash
# Verificar en blockchain
cast call <BATTERY_REGISTRY_ADDRESS> \
  "getBattery(bytes32)" \
  "0x544553542d323032342d313233343536000000000000000000000000000000"
```

O visitar:
```
http://localhost:3000/passport/TEST-2024-123456
```

## Debugging

Si aún hay problemas, verificar en consola del navegador:

```javascript
// El log debe mostrar algo como:
{
  bin: "0x544553542d323032342d313233343536000000000000000000000000000000",
  chemistry: 1,
  capacityKwh: 75,
  carbonFootprint: "7500",
  ipfsCertHash: "0x0000000000000000000000000000000000000000000000000000000000000000"
}
```

## Notas Adicionales

- El campo **weight** (peso) actualmente no se envía al contrato, solo capacity
- El **carbonFootprint** se calcula automáticamente como `capacityKwh * 100 kg CO2e`
- El **ipfsCertHash** está vacío por ahora (se puede agregar funcionalidad IPFS después)
- La validación de BIN permite formato flexible: `XX-YYYY-NNNN` o `XXX-YYYY-NNNNNN`

## Archivos Relacionados

- `web/src/components/forms/RegisterBatteryForm.tsx` - Formulario corregido
- `web/src/lib/binUtils.ts` - Función `binToBytes32()`
- `sc/src/BatteryRegistry.sol` - Definición de enum Chemistry y función registerBattery
