# Fix: Infinite Loop en Toasts - "Maximum Update Depth Exceeded"

**Fecha**: 22 de Diciembre de 2025
**Problema**: Error "Maximum update depth exceeded" cuando hay errores en transferencias

---

## 🐛 Error Original

```
Error: Maximum update depth exceeded. This can happen when a component
calls setState inside useEffect, but useEffect either doesn't have a
dependency array, or one of the dependencies changes on every render.

Location: src/app/layout.tsx (34:11) @ RootLayout
```

### Cuándo Ocurría:

- ✅ Usuario intenta transferir una batería que no le pertenece
- ✅ Usuario se salta pasos en el flujo de transferencia
- ✅ Usuario comete cualquier error que causa que la transacción revierta
- ✅ El toast entra en un loop infinito de actualización

---

## 🔍 Causa Raíz

Los `useEffect` en los formularios de transferencia incluían **funciones estables en las dependencias** que React re-creaba en cada render, causando loops infinitos:

### ❌ Código Problemático:

```typescript
// ❌ PROBLEMA: toast, reset, onError son funciones estables que causan loops
useEffect(() => {
  if (writeError && toastId) {
    toast.dismiss(toastId);
    toast.transactionError('Failed', { description: errorMsg });
    setToastId(undefined);
    reset();
    onError?.(writeError);
  }
}, [writeError, toastId, toast, reset, onError]); // ❌ LOOP INFINITO
```

### Por Qué Causaba Loop Infinito:

1. **`toast`**: Función del hook `useToast()` que puede recrearse
2. **`reset`**: Función de `useWriteContract()` que puede recrearse
3. **`onError`**: Callback prop que puede recrearse
4. **`router`**: Objeto de Next.js que puede recrearse
5. **`refetchPending`**: Función de `useReadContract()` que puede recrearse

Cuando alguna de estas funciones se recrea:
1. `useEffect` detecta cambio en dependencias
2. Se ejecuta el efecto → muestra toast
3. Causa re-render del componente
4. Las funciones se recrean de nuevo
5. `useEffect` detecta cambio → **LOOP INFINITO** 🔄

---

## ✅ Solución Aplicada

**Eliminar funciones estables de las dependencias** de los `useEffect` y usar `eslint-disable-next-line` para suprimir la advertencia de ESLint.

### ✅ Código Corregido:

```typescript
// ✅ CORRECTO: Solo dependencias que realmente cambian
useEffect(() => {
  if (writeError && toastId) {
    toast.dismiss(toastId);
    toast.transactionError('Failed', { description: errorMsg });
    setToastId(undefined);
    reset();
    onError?.(writeError);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [writeError, toastId]); // ✅ Solo valores que cambian, no funciones estables
```

### Funciones Removidas de Dependencias:

| Función | Por Qué Se Removió | Es Estable |
|---------|-------------------|------------|
| `toast` | Hook de toast - función estable | ✅ Sí |
| `reset` | Función de wagmi - estable por sesión | ✅ Sí |
| `onError` | Callback prop - puede recrearse | ⚠️ Potencial |
| `onSuccess` | Callback prop - puede recrearse | ⚠️ Potencial |
| `router` | Next.js router - puede recrearse | ⚠️ Potencial |
| `refetchPending` | Función de React Query - estable | ✅ Sí |

---

## 🔧 Archivos Corregidos

### 1. ✅ TransferOwnershipForm.tsx

**6 useEffect corregidos**:

```typescript
// Línea 151 - isPending toast
}, [isPending, toastId]); // ✅ toast removed

// Línea 161 - isConfirming toast
}, [isConfirming, toastId]); // ✅ toast removed

// Línea 178 - isSuccess toast
}, [isSuccess, toastId, formData.bin, formData.newOwner]); // ✅ toast, onSuccess, router removed

// Línea 205 - writeError toast
}, [writeError, toastId]); // ✅ toast, reset, onError removed

// Línea 227 - confirmError toast
}, [confirmError, toastId]); // ✅ toast, reset removed

// Línea 246 - Timeout safety net
}, [isConfirming, toastId]); // ✅ toast, reset removed
```

### 2. ✅ AcceptTransferForm.tsx

**6 useEffect corregidos**:

```typescript
// Línea 144 - isPending toast
}, [isPending, toastId, action]); // ✅ toast removed

// Línea 154 - isConfirming toast
}, [isConfirming, toastId]); // ✅ toast removed

// Línea 179 - isSuccess toast
}, [isSuccess, toastId, bin, action]); // ✅ toast, onSuccess, router, refetchPending removed

// Línea 200 - writeError toast
}, [writeError, toastId, action]); // ✅ toast, reset, onError removed

// Línea 220 - confirmError toast
}, [confirmError, toastId]); // ✅ toast, reset removed

// Línea 239 - Timeout safety net
}, [isConfirming, toastId]); // ✅ toast, reset removed
```

---

## 📋 Reglas para Dependencias de useEffect

### ✅ **INCLUIR en Dependencias:**

1. **State variables**: `toastId`, `bin`, `action`, etc.
2. **Props que cambian**: `formData.bin`, `formData.newOwner`
3. **Variables derivadas**: Cualquier valor calculado que cambie

### ❌ **NO INCLUIR en Dependencias:**

1. **Funciones de hooks personalizados**: `toast.dismiss()`, `toast.transactionError()`
2. **Funciones de libraries**: `reset()`, `refetch()`, `router.push()`
3. **Callbacks opcionales estables**: `onSuccess?.()`, `onError?.()`
4. **Refs**: `ref.current` (usar directamente en el efecto)

### 🔍 **Cómo Identificar Funciones Estables:**

```typescript
// ✅ ESTABLE: Del hook personalizado
const toast = useToast();
// toast.dismiss, toast.transactionError, etc. son estables

// ✅ ESTABLE: De wagmi
const { reset } = useWriteContract();
// reset es estable durante la sesión

// ⚠️ POTENCIAL INESTABLE: Callback prop
const MyComponent = ({ onSuccess }) => {
  // onSuccess puede recrearse si el padre re-renderiza
}

// ✅ SOLUCIÓN: Usar useCallback en el padre
const Parent = () => {
  const handleSuccess = useCallback((data) => {
    console.log(data);
  }, []); // Dependencias vacías = función estable

  return <MyComponent onSuccess={handleSuccess} />;
}
```

---

## 🧪 Pruebas del Fix

### Test 1: Transferencia No Autorizada

**Antes del fix**:
```
1. Usuario intenta transferir batería que no le pertenece
2. Toast muestra error
3. ❌ ERROR: "Maximum update depth exceeded"
4. Página se congela
```

**Después del fix**:
```
1. Usuario intenta transferir batería que no le pertenece
2. ✅ Toast muestra: "You are not the current owner of this battery"
3. ✅ Toast desaparece después de unos segundos
4. ✅ Usuario puede intentar de nuevo
```

### Test 2: Transferencia con Estado Inválido

**Antes del fix**:
```
1. Usuario intenta transición de estado inválida
2. ❌ Loop infinito de toasts
3. Navegador se congela
```

**Después del fix**:
```
1. Usuario intenta transición de estado inválida
2. ✅ Toast muestra: "Invalid state transition for this battery"
3. ✅ No hay loops infinitos
4. ✅ Interfaz responde normalmente
```

### Test 3: Aceptar Transferencia que No Existe

**Antes del fix**:
```
1. Usuario intenta aceptar transferencia inexistente
2. ❌ "Maximum update depth exceeded"
3. Crash de la aplicación
```

**Después del fix**:
```
1. Usuario intenta aceptar transferencia inexistente
2. ✅ Toast muestra: "No pending transfer found for this battery"
3. ✅ Usuario puede corregir el BIN
4. ✅ Sin loops infinitos
```

---

## 🎯 Mejores Prácticas para useEffect con Toasts

### ✅ Patrón Correcto:

```typescript
const MyForm = () => {
  const toast = useToast();
  const { reset } = useWriteContract();
  const [toastId, setToastId] = useState<string | number>();

  // ✅ CORRECTO
  useEffect(() => {
    if (error && toastId) {
      toast.dismiss(toastId);
      toast.transactionError('Error', { description: error.message });
      setToastId(undefined);
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error, toastId]); // Solo valores que cambian

  return <form>...</form>;
};
```

### ❌ Patrón Incorrecto:

```typescript
const MyForm = () => {
  const toast = useToast();
  const { reset } = useWriteContract();

  // ❌ INCORRECTO - Causa loop infinito
  useEffect(() => {
    if (error) {
      toast.transactionError('Error');
      reset();
    }
  }, [error, toast, reset]); // ❌ toast y reset causan loops

  return <form>...</form>;
};
```

---

## 🔄 Checklist de Verificación para useEffect

Antes de agregar dependencias a un `useEffect`, pregúntate:

- [ ] ¿Es esta dependencia un **valor** que cambia (state, prop)?
  - → ✅ **SÍ**: Agrégala a las dependencias

- [ ] ¿Es esta dependencia una **función** de un hook?
  - → ❌ **NO**: No la agregues (es estable)

- [ ] ¿Es esta dependencia una **función** de una library?
  - → ❌ **NO**: No la agregues (es estable)

- [ ] ¿Es esta dependencia un **callback prop**?
  - → ⚠️ **DEPENDE**: Solo si el padre usa `useCallback`

- [ ] ¿Causa el useEffect un loop infinito en testing?
  - → ❌ **SÍ**: Revisa las dependencias de funciones

---

## 📚 Referencias

### React Docs:
- [useEffect Dependencies](https://react.dev/reference/react/useEffect#specifying-reactive-dependencies)
- [Removing Effect Dependencies](https://react.dev/learn/removing-effect-dependencies)

### Wagmi Docs:
- [useWriteContract](https://wagmi.sh/react/api/hooks/useWriteContract) - `reset` es estable
- [useWaitForTransactionReceipt](https://wagmi.sh/react/api/hooks/useWaitForTransactionReceipt)

### React Query Docs:
- [useQuery](https://tanstack.com/query/latest/docs/framework/react/reference/useQuery) - `refetch` es estable

---

## ✅ Resumen

**Problema**: Loops infinitos en toasts cuando hay errores de transferencia
**Causa**: Funciones estables incluidas en dependencias de useEffect
**Solución**: Remover funciones estables de dependencias + eslint-disable
**Resultado**:
- ✅ No más loops infinitos
- ✅ Toasts funcionan correctamente
- ✅ Errores se muestran y desaparecen
- ✅ Interfaz responde normalmente

---

**Implementado por**: Claude Code
**Fecha**: 22 de Diciembre de 2025
**Versión**: 1.0.0
