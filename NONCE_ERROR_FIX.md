# Nonce Error Fix - TransferOwnershipForm

## Problema Identificado

Cuando se realiza el siguiente flujo:
1. Usuario A (OEM, cuenta 0x3C4...) envía transferencia de batería NV-2024-001234
2. Usuario B (Fleet Operator, cuenta 0x99...) **rechaza** la transferencia
3. Usuario A intenta **inmediatamente** enviar otra transferencia de la misma batería
4. **Error de Nonce**: "Transaction nonce error / getTransactionCount"

### Causa Raíz

El error de nonce ocurre porque:
- Wagmi/Viem mantiene un cache del nonce de transacciones
- Cuando se rechaza una transferencia, el nonce en blockchain se actualiza
- Si se intenta enviar una nueva transacción inmediatamente, wagmi puede usar un nonce obsoleto del cache
- El blockchain rechaza la transacción porque el nonce ya fue usado

## Solución Implementada

### 1. Sistema de Detección y Reintento Inteligente

Se agregó un flag `isRetrying` que detecta errores de nonce y guía al usuario:

```typescript
const [isRetrying, setIsRetrying] = useState(false);
```

### 2. Detección de Errores de Nonce

Se detectan múltiples variantes del error de nonce:

```typescript
const isNonceError = 
  writeError.message.includes('nonce') ||
  writeError.message.includes('getTransactionCount') ||
  writeError.message.includes('replacement fee too low') ||
  writeError.message.includes('already known');
```

### 3. Manejo Especial de Nonce Errors

Cuando se detecta un error de nonce:

**Toast Notification:**
```typescript
toast.transactionError('Transaction nonce error', {
  description: 'Blockchain state not synced. Please wait 2-3 seconds and click "Initiate Transfer" again.',
  duration: 8000,
});
```

**Mensaje Visual en el Formulario:**
- Alerta amarilla visible en el formulario
- Instrucciones claras sobre qué hacer
- Tip educativo sobre la causa del problema

### 4. Reintento con Delay Automático

Cuando el usuario reintenta después de un error de nonce:

```typescript
if (isRetrying) {
  toast.info('Retrying transaction...', {
    description: 'Waiting for blockchain sync',
  });
  await new Promise(resolve => setTimeout(resolve, 2000));
  setIsRetrying(false);
}
```

### 5. Limpieza de Estado

El flag `isRetrying` se limpia en todos los escenarios:
- ✅ Cuando la transacción tiene éxito
- ✅ Cuando el usuario hace clic en "Transfer Another"
- ✅ Después del delay de reintento

## Cambios en el Código

### Archivo: TransferOwnershipForm.tsx

#### 1. Nuevo Estado
```typescript
const [isRetrying, setIsRetrying] = useState(false);
```

#### 2. Función handleSubmit Modificada
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!validateForm()) return;

  // Delay automático si es reintento
  if (isRetrying) {
    toast.info('Retrying transaction...', {
      description: 'Waiting for blockchain sync',
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsRetrying(false);
  }

  // ... resto del código
};
```

#### 3. Manejo de Errores Mejorado
```typescript
useEffect(() => {
  if (writeError && toastId) {
    toast.dismiss(toastId);

    const isNonceError = writeError.message.includes('nonce') ||
                        writeError.message.includes('getTransactionCount') ||
                        writeError.message.includes('replacement fee too low') ||
                        writeError.message.includes('already known');

    if (isNonceError) {
      setIsRetrying(true);
      toast.transactionError('Transaction nonce error', {
        description: 'Blockchain state not synced. Please wait 2-3 seconds and click "Initiate Transfer" again.',
        duration: 8000,
      });
    } else {
      // ... manejo normal de errores
    }
  }
}, [writeError, toastId]);
```

#### 4. Mensaje Visual de Reintento
```tsx
{/* Retry Message (Nonce Error) */}
{isRetrying && !isSuccess && (
  <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-start gap-2">
    <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
    <div>
      <p className="font-semibold text-yellow-500">Nonce Error Detected</p>
      <p className="text-sm text-yellow-400 mt-1">
        The blockchain is still processing a previous transaction. 
        Please wait 2-3 seconds and click "Initiate Transfer" again.
      </p>
      <p className="text-xs text-yellow-300 mt-2">
        💡 Tip: This usually happens when you reject a transfer and 
        immediately try to send a new one. The blockchain needs a moment to sync.
      </p>
    </div>
  </div>
)}
```

## Flujo de Usuario Mejorado

### Antes del Fix:
1. Usuario A envía transferencia → Usuario B rechaza
2. Usuario A intenta enviar nuevamente
3. ❌ Error críptico: "nonce error"
4. Usuario confundido, no sabe qué hacer
5. Posible necesidad de recargar página

### Después del Fix:
1. Usuario A envía transferencia → Usuario B rechaza
2. Usuario A intenta enviar nuevamente
3. ⚠️ Alerta clara: "Nonce Error Detected"
4. 📝 Instrucción: "Espera 2-3 segundos e intenta de nuevo"
5. 💡 Tip educativo sobre la causa
6. Usuario espera 2-3 segundos → hace clic nuevamente
7. ✅ Sistema detecta reintento, espera automáticamente 2 segundos
8. ✅ Transacción se envía exitosamente

## Beneficios

### 1. Experiencia de Usuario
- ✅ Mensajes de error claros y educativos
- ✅ Instrucciones paso a paso
- ✅ Feedback visual distintivo (alerta amarilla vs roja)
- ✅ No requiere recarga de página

### 2. Robustez Técnica
- ✅ Detección automática de errores de nonce
- ✅ Delay automático en reintentos
- ✅ Múltiples variantes de error cubiertas
- ✅ Limpieza adecuada de estado

### 3. Educación del Usuario
- ✅ Explica por qué ocurre el error
- ✅ Da contexto sobre el flujo de dos pasos
- ✅ Ayuda a entender el comportamiento de blockchain

## Testing

### Escenario de Prueba:

1. **Setup:**
   - Cuenta OEM (0x3C4...): Tiene batería NV-2024-001234
   - Cuenta Fleet Operator (0x99...): Destinatario

2. **Pasos:**
   ```
   1. Conectar con cuenta OEM
   2. Ir a Dashboard → Transfers
   3. Transferir NV-2024-001234 a cuenta Fleet Operator
   4. Confirmar en MetaMask
   5. Esperar confirmación (2 segundos)
   
   6. Cambiar a cuenta Fleet Operator
   7. Ir a Dashboard → Transfers → Accept/Reject
   8. RECHAZAR la transferencia
   9. Confirmar en MetaMask
   10. Esperar confirmación (2 segundos)
   
   11. Cambiar de vuelta a cuenta OEM
   12. INMEDIATAMENTE intentar transferir de nuevo la misma batería
   ```

3. **Resultado Esperado:**
   ```
   - ⚠️ Alerta amarilla visible: "Nonce Error Detected"
   - 📝 Mensaje: "Please wait 2-3 seconds and click 'Initiate Transfer' again"
   - 💡 Tip educativo sobre reject → transfer
   - Usuario espera 2-3 segundos
   - Usuario hace clic en "Initiate Transfer"
   - Toast: "Retrying transaction... Waiting for blockchain sync"
   - Delay automático de 2 segundos
   - ✅ Transacción enviada exitosamente
   - ✅ Toast verde de confirmación
   ```

## Otros Formularios

Este mismo patrón se puede aplicar a otros formularios que puedan tener problemas de nonce:
- AcceptTransferForm
- RegisterBatteryForm
- UpdateSOHForm
- RecycleBatteryForm
- etc.

## Conclusión

El fix del error de nonce proporciona:
1. **Detección automática** de problemas de sincronización
2. **Manejo graceful** con mensajes claros
3. **Reintento inteligente** con delay automático
4. **Educación del usuario** sobre el comportamiento del sistema

Esto mejora significativamente la UX en escenarios de transacciones rápidas y secuenciales.

---

**Fecha:** 2024-12-25  
**Versión:** 1.0.0  
**Archivo:** TransferOwnershipForm.tsx
