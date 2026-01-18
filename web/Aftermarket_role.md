✅ Resumen de Pasos Completados

  1. Smart Contract - SecondLifeManager.sol (sc/src/SecondLifeManager.sol:383-436)


     Cambios realizados:
  - ✅ Removido requisito de certificación previa (isCertified modifier)
  - ✅ Añadida validación directa de SOH en startSecondLife:
    - Mínimo 70% (MIN_SECOND_LIFE_SOH = 7000)
    - Máximo 80% (MAX_FIRST_LIFE_SOH = 8000)
  - ✅ Permitido acceso tanto a AFTERMARKET_USER_ROLE como ADMIN_ROLE
  - ✅ Mensajes de error descriptivos

  2. Seed Data - SeedData.s.sol (sc/script/SeedData.s.sol)


     Baterías añadidas (SOH 70-80%):
  - ✅ NV-2024-006789: SOH 78%, 75 kWh, NMC, 2800 cycles
  - ✅ NV-2024-007890: SOH 75%, 80 kWh, LFP, 3200 cycles
  - ✅ NV-2024-008901: SOH 73%, 60 kWh, NMC, 2500 cycles
  - ✅ NV-2024-009012: SOH 77%, 100 kWh, NCA, 2200 cycles

     Total: 9 baterías en seed (4 nuevas + 5 existentes)

  3. Hooks Personalizados (web/src/hooks/useAftermarketBatteries.ts)


     Hooks creados:
  - ✅ useAvailableSecondLifeBatteries() - Lista de baterías disponibles (SOH 70-80%)
  - ✅ useAvailableBattery(bin) - Datos detallados de batería disponible
  - ✅ useSecondLifeBatteries() - Lista de baterías en segunda vida
  - ✅ useSecondLifeData(bin) - Datos de segunda vida de batería específica
  - ✅ useIsEligibleForSecondLife(bin) - Verificar elegibilidad

     Integración:
  - ✅ Exportados en hooks/index.ts
  - ✅ Integrados en AftermarketUserDashboard
  - ✅ Fallback a datos mock si no está conectado

  ---
  🧪 Paso 4: Testing Manual (Para ti)

  Prerequisitos

  1. Anvil debe estar corriendo:
  cd sc
  anvil

  2. Redeployar contratos con cambios:
  # En otra terminal
  cd sc
  ./deploy-and-seed.sh

  Esto:
  - Desplegará los contratos actualizados (incluyendo SecondLifeManager con nueva lógica)
  - Seedeará las 9 baterías (incluyendo las 4 nuevas con SOH 70-80%)
  - Asignará roles a las cuentas de prueba

  3. Iniciar la aplicación web:
  cd web
  npm run dev

  Testing Workflow

  A. Verificar baterías disponibles

  1. Conectar con cuenta Aftermarket User (Account #3)
    - Address: 0x90F79bf6EB2c4f870365E785982E1f101E93b906
    - Private Key: 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6
  2. Navegar a Aftermarket Dashboard:
    - http://localhost:3000/dashboard/aftermarket
  3. Verificar Tab "Available Batteries":
    - Deberías ver 4 baterías con SOH entre 70-80%:
        - NV-2024-006789 (SOH 78%)
      - NV-2024-007890 (SOH 75%)
      - NV-2024-008901 (SOH 73%)
      - NV-2024-009012 (SOH 77%)

  B. Iniciar Segunda Vida

  1. Click en "Start Second Life" en una batería disponible
  2. Completar formulario:
    - BIN: (pre-llenado) NV-2024-006789
    - Application Type: Residential Storage
    - Description: "Home solar storage system with 10kW inverter"
    - Owner/Operator: "John Smith Residence"
    - Location: "Barcelona, Spain"
    - Environmental Conditions: "Indoor, 15-25°C, 40-60% humidity"
    - Start Date: (fecha actual)
    - ✅ Cell Inspection Passed
    - ✅ Safety Tests Passed
    - New Connectors: "Anderson PowerPole 350A"
    - ✅ BMS Updated
    - ✅ UL 1974 Certified
    - Cert Number: "UL1974-2024-12345"
  3. Submit y verificar:
    - Toast "Waiting for signature..." → Aprobar en MetaMask
    - Toast "Confirming transaction..."
    - Toast "Second life started successfully!" con link a passport
    - Verificar que aparece en tab "Second Life Batteries"

  C. Verificar validaciones

  Prueba SOH fuera de rango:

  1. Intentar con batería SOH > 80% (NV-2024-001234, SOH 100%)
    - ❌ Debe mostrar error: "SOH too high, battery still suitable for first life"
  2. Intentar con batería SOH < 70% (NV-2024-004567, SOH 52%)
    - ❌ Debe mostrar error: "SOH too low for second life (minimum 70%)"

  Prueba sin rol:

  1. Desconectar y conectar con otra cuenta (e.g., OEM - Account #2)
  2. Ir a /dashboard/aftermarket
    - ❌ Debe mostrar "Access Denied" (ProtectedRoute)

  D. Verificar timeout fix

  1. Iniciar segunda vida pero rechazar la transacción en MetaMask
  2. Verificar:
    - Toast cambia a error inmediatamente
    - No queda stuck en "Confirming..."

  ---
  📂 Archivos Modificados/Creados

  Smart Contracts (sc/)

  - ✅ src/SecondLifeManager.sol - Actualizado startSecondLife()
  - ✅ script/SeedData.s.sol - Añadidas 4 baterías SOH 70-80%

  Web App (web/)

  - ✅ src/hooks/useAftermarketBatteries.ts - NUEVO - 5 hooks personalizados
  - ✅ src/hooks/index.ts - Exportados nuevos hooks
  - ✅ src/hooks/useBatteryList.ts - Actualizado con nuevas BINs
  - ✅ src/app/dashboard/aftermarket/page.tsx - Integrados hooks reales
  - ✅ src/lib/roleConstants.ts - Añadido AFTERMARKET_ROLE
  - ✅ src/components/forms/StartSecondLifeForm.tsx - Expandido con todos los campos
  - ✅ src/app/dashboard/page.tsx - Añadido link a Aftermarket

  ---
  🎯 Puntos de Verificación

  - Anvil corriendo en localhost:8545
  - Contratos desplegados con deploy-and-seed.sh
  - 9 baterías seedeadas correctamente
  - Web app corriendo en localhost:3000
  - Account #3 tiene rol AFTERMARKET_ROLE
  - Dashboard Aftermarket muestra 4 baterías disponibles
  - Formulario completo funciona
  - Validación SOH 70-80% funciona
  - Toast notifications funcionan correctamente
  - Timeout de 30s funciona

  Todo está listo para testing! 🚀