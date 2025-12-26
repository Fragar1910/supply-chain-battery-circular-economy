# 🚨 GUÍA DE EMERGENCIA: Solución Definitiva para Errores de Nonce

## Síntomas del Problema

- ❌ Error: "nonce (1) is lower than the current nonce"
- ❌ Todas las transacciones fallan después de la primera
- ❌ El problema persiste incluso después de recargar la página
- ❌ Afecta a todos los formularios (StartSecondLife, Transfer, etc.)

## Solución INMEDIATA (3 Pasos)

### 🔧 Opción A: Usando el Script Automático (RECOMENDADO)

```bash
# Desde la raíz del proyecto
./emergency-nonce-reset.sh
```

El script te preguntará qué hacer:
- **Opción 1**: Mantener el estado actual del blockchain (solo limpia caché del frontend)
- **Opción 2**: Resetear Anvil completamente (WARNING: pierdes todos los datos)

### 🖥️ Opción B: Pasos Manuales

#### Paso 1: Verificar el Nonce Actual

```bash
cast nonce 0x90F79bf6EB2c4f870365E785982E1f101E93b906 --rpc-url http://localhost:8545
```

**Anota este número**, lo necesitarás para verificar más tarde.

#### Paso 2: Limpiar TODO el Caché del Frontend

**Método 1 - Botón de Limpieza (Más Fácil):**
1. Abre `http://localhost:3000`
2. Busca el botón amarillo "Clear Wagmi Cache" en la esquina inferior derecha
3. Haz clic en él
4. Espera a que recargue (tarda 1 segundo)

**Método 2 - Manual (Si el botón no funciona):**
1. Abre DevTools (F12)
2. Ve a la pestaña **Console**
3. Pega este código y presiona Enter:

```javascript
// Limpieza completa de TODO el caché
console.log('🧹 Clearing ALL caches...');

// 1. LocalStorage
Object.keys(localStorage).forEach(key => {
  localStorage.removeItem(key);
  console.log('Removed:', key);
});

// 2. SessionStorage
Object.keys(sessionStorage).forEach(key => {
  sessionStorage.removeItem(key);
  console.log('Removed:', key);
});

// 3. IndexedDB
indexedDB.databases().then(dbs => {
  dbs.forEach(db => {
    if (db.name) {
      indexedDB.deleteDatabase(db.name);
      console.log('Deleted DB:', db.name);
    }
  });
});

console.log('✅ All caches cleared!');
console.log('🔄 Reloading in 2 seconds...');
setTimeout(() => location.reload(), 2000);
```

#### Paso 3: Resetear MetaMask

**CRÍTICO - NO OMITAS ESTE PASO:**

1. Abre MetaMask
2. Click en el icono de tu cuenta (arriba a la derecha)
3. Settings → Advanced
4. Scroll hasta el final
5. Click en "Reset Account"
6. Confirma la acción

**¿Qué hace esto?**
- Limpia el caché de nonce de MetaMask
- NO borra tus cuentas ni claves privadas
- Solo resetea el estado de transacciones

#### Paso 4: Verificación

1. Cierra el navegador **COMPLETAMENTE** (Cmd+Q en Mac, Alt+F4 en Windows)
2. Espera 5 segundos
3. Abre el navegador de nuevo
4. Ve a `http://localhost:3000`
5. Conecta tu wallet (tendrás que volver a autorizar)

**Verifica en la consola del navegador:**
```
🔧 NONCE FIX: Fetched fresh nonce from blockchain: 3
```

El número debe coincidir con el que anotaste en el Paso 1.

## Si AÚN falla...

### Opción de Último Recurso: Reset Completo

```bash
# 1. Matar todo
pkill anvil
pkill -f "next dev"

# 2. Limpiar navegador
# Cierra TODOS los tabs y el navegador completamente

# 3. Reiniciar Anvil
cd sc
anvil &
sleep 3

# 4. Redesplegar contratos
forge script script/DeployAll.s.sol --rpc-url localhost --broadcast

# 5. Reiniciar frontend
cd ../web
npm run dev

# 6. Espera 10 segundos antes de abrir el navegador

# 7. Abre en modo incógnito
# Chrome: Cmd+Shift+N (Mac) o Ctrl+Shift+N (Windows)
```

## Cambios Implementados en el Código

### 1. StartSecondLifeForm.tsx

**Obtención dinámica del nonce:**
```typescript
// Antes de cada transacción, obtiene el nonce fresco del blockchain
const nonce = await publicClient.getTransactionCount({
  address: address,
  blockTag: 'pending'
});

writeContract({
  ...params,
  nonce: nonce // Override explícito
});
```

**Limpieza automática cuando se detecta error:**
```typescript
if (isNonceError) {
  // Limpia localStorage y sessionStorage inmediatamente
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('wagmi.')) {
      localStorage.removeItem(key);
    }
  });

  Object.keys(sessionStorage).forEach(key => {
    if (key.startsWith('wagmi.')) {
      sessionStorage.removeItem(key);
    }
  });
}
```

### 2. ClearCacheButton.tsx

**Limpieza más agresiva:**
- Limpia TODO localStorage (no solo wagmi.*)
- Limpia TODO sessionStorage
- Intenta limpiar IndexedDB
- Usa `queryClient.removeQueries()` además de `.clear()`

## Prevención: Mejores Prácticas

### ✅ HACER:

1. **Después de resetear Anvil:**
   ```bash
   ./emergency-nonce-reset.sh
   ```

2. **Al cambiar de cuenta:**
   - Click en "Clear Wagmi Cache"
   - Reconectar wallet

3. **Al inicio de cada sesión de desarrollo:**
   - Hard refresh (Cmd+Shift+R)
   - Verificar nonce en consola

4. **Antes de transacciones importantes:**
   - Verificar que el nonce en consola es correcto
   - Buscar el log: `🔧 NONCE FIX: Fetched fresh nonce`

### ❌ EVITAR:

1. **NO resetear Anvil sin limpiar frontend**
   - Siempre ejecuta el script después

2. **NO usar F5 normal**
   - Usa Cmd+Shift+R (hard refresh)

3. **NO ignorar los warnings de nonce**
   - Si ves el error una vez, limpia TODO inmediatamente

4. **NO hacer transacciones rápidas consecutivas**
   - Espera 2-3 segundos entre transacciones

## Debugging: Logs Importantes

### Logs Correctos (TODO bien) ✅

```
🔧 NONCE FIX: Fetched fresh nonce from blockchain: 3
=== START SECOND LIFE DEBUG ===
Account Address: 0x90F79bf6EB2c4f870365E785982E1f101E93b906
Current Nonce: 3
================================
```

### Logs de Error (Problema detectado) ❌

```
🚨 NONCE ERROR DETECTED - Attempting to clear all caches...
🗑️ Removed from localStorage: wagmi.store
🗑️ Removed from sessionStorage: wagmi.cache
```

### Logs Después de Limpieza ✅

```
🧹 Starting aggressive cache clear...
✓ React Query cache cleared
✓ Cleared 5 localStorage keys
✓ Cleared 3 sessionStorage keys
✓ Deleted IndexedDB: wagmi
✅ ALL caches cleared - reloading page in 1 second...
🔄 After reload, you MUST reconnect your wallet
```

## Verificación Final

### Checklist Antes de Probar:

- [ ] Anvil está corriendo: `ps aux | grep anvil`
- [ ] Nonce del blockchain conocido: `cast nonce 0x90F7...906`
- [ ] Frontend corriendo: `http://localhost:3000` carga
- [ ] Caché limpiado: Botón clickeado o script ejecutado
- [ ] MetaMask reseteado: Settings → Advanced → Reset Account
- [ ] Navegador cerrado completamente y reabierto
- [ ] Wallet reconectado

### Checklist Durante Transacción:

- [ ] Consola muestra: `🔧 NONCE FIX: Fetched fresh nonce`
- [ ] El nonce mostrado coincide con `cast nonce`
- [ ] NO hay errores en consola antes de confirmar en MetaMask
- [ ] MetaMask muestra el nonce correcto en la transacción

### Checklist Después de Transacción:

- [ ] Toast verde de success
- [ ] Transaction hash visible
- [ ] No hay error de nonce
- [ ] Siguiente transacción usa nonce + 1

## Contacto de Soporte

Si después de seguir TODOS estos pasos aún tienes problemas:

1. **Captura estos datos:**
   ```bash
   # Nonce del blockchain
   cast nonce 0x90F79bf6EB2c4f870365E785982E1f101E93b906 --rpc-url http://localhost:8545

   # Estado de Anvil
   ps aux | grep anvil

   # Logs del navegador (consola)
   # Captura de pantalla del error completo
   ```

2. **Información del sistema:**
   - Sistema operativo
   - Navegador y versión
   - Node.js version: `node --version`
   - Wagmi version: `cat web/package.json | grep wagmi`

3. **Pasos exactos que seguiste**

## Resumen Ejecutivo

### El problema:
Múltiples capas de caché (Wagmi + React Query + localStorage + MetaMask) causan desincronización del nonce.

### La solución:
1. Limpieza agresiva de TODOS los cachés
2. Obtención dinámica del nonce desde blockchain
3. Reset de cuenta MetaMask
4. Cierre completo del navegador

### La prevención:
- Usar script `emergency-nonce-reset.sh` después de resetear Anvil
- Hard refresh (Cmd+Shift+R) regularmente
- Botón "Clear Wagmi Cache" después de cambios importantes

---

**Creado:** 2024-12-26
**Última actualización:** 2024-12-26
**Versión:** 3.0 (Solución de Emergencia)
**Status:** ✅ PROBADO Y FUNCIONANDO
**Prioridad:** CRÍTICA
