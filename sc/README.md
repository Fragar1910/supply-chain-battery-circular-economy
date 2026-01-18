# Smart Contracts - Battery Supply Chain

Este directorio contiene los contratos inteligentes para el sistema de trazabilidad de baterías en economía circular.

## 🚀 Deployment Automatizado

### Inicio Rápido

1. **Iniciar Anvil (en terminal separada):**
```bash
anvil
```

2. **Deploy completo + seed de datos:**
```bash
cd sc
./deploy-and-seed.sh
```

3. **Iniciar la aplicación web:**
```bash
cd ../web
npm run dev
```

4. **Abrir en navegador:**
```
http://localhost:3000
```

### ¿Qué hace el script automatizado?

El script `deploy-and-seed.sh` realiza las siguientes tareas **automáticamente**:

1. ✅ Despliega todos los 7 contratos (BatteryRegistry, RoleManager, etc.)
2. ✅ Exporta las direcciones a `deployments/local.json`
3. ✅ Copia las direcciones a `web/src/config/deployed-addresses.json`
4. ✅ Ejecuta seed de 5 baterías de prueba
5. ✅ Asigna roles a las cuentas de test de Anvil

### Archivos Clave

```
sc/
├── deploy-and-seed.sh          # Script principal (¡usa este!)
├── script/
│   ├── DeployAll.s.sol         # Deploy de todos los contratos
│   └── SeedData.s.sol          # Seed de datos de prueba
├── deployments/
│   └── local.json              # Direcciones desplegadas (auto-generado)
└── foundry.toml                # Configuración con permisos de escritura
```

### Opciones del Script

```bash
# Deploy completo + seed
./deploy-and-seed.sh

# Solo deploy (sin seed)
./deploy-and-seed.sh --skip-seed

# Solo seed (asume deploy previo)
./deploy-and-seed.sh --skip-deploy
```

## 📝 Baterías de Prueba

El seed automático crea estas baterías:

| BIN | Estado | SOH | Descripción |
|-----|--------|-----|-------------|
| `NV-2024-001234` | FirstLife | 100% | Batería nueva |
| `NV-2024-002345` | FirstLife | 85% | Batería usada |
| `NV-2024-003456` | SecondLife | 72% | Segunda vida |
| `NV-2024-004567` | SecondLife | 52% | Fin segunda vida |
| `NV-2024-005678` | Recycled | 45% | Reciclada |

### Probar en el Frontend

```
http://localhost:3000/passport/NV-2024-001234
```

## 🔑 Cuentas de Test (Anvil)

El script asigna roles automáticamente:

| Cuenta | Rol | Address |
|--------|-----|---------|
| Account 0 | Admin (todos los roles) | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` |
| Account 1 | Manufacturer | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` |
| Account 2 | OEM | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` |
| Account 3 | Aftermarket User | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` |
| Account 4 | Recycler | `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65` |

Private keys en: `web/MANUAL_TESTING_GUIDE.md`

## 🔄 Workflow Completo

### Paso 1: Desarrollo Local

```bash
# Terminal 1: Anvil
anvil

# Terminal 2: Deploy + Seed
cd sc
./deploy-and-seed.sh

# Terminal 3: Frontend
cd web
npm run dev
```

### Paso 2: Después de Modificar Contratos

Si modificas los contratos, simplemente vuelve a ejecutar:

```bash
./deploy-and-seed.sh
```

**Automáticamente:**
- ✅ Redeploya los contratos
- ✅ Actualiza las direcciones en el frontend
- ✅ Re-seed de datos de prueba
- ✅ No necesitas actualizar manualmente ningún archivo

### Paso 3: Verificar Deployment

```bash
# Ver direcciones desplegadas
cat deployments/local.json

# Verificar batería en blockchain
cast call $(cat deployments/local.json | jq -r '.BatteryRegistry') \
  "getBattery(bytes32)" \
  "0x4e562d323032342d303031323334000000000000000000000000000000000000"
```

## 🏗️ Arquitectura del Sistema

### Flujo de Direcciones

```
DeployAll.s.sol
  │
  ├─> Despliega contratos
  │
  └─> Exporta a deployments/local.json
        │
        └─> deploy-and-seed.sh copia a web/src/config/deployed-addresses.json
              │
              └─> web/src/config/contracts.ts importa automáticamente
                    │
                    └─> Frontend siempre usa direcciones actuales ✅
```

### Contratos Desplegados

1. **BatteryRegistry** - Registro central de baterías
2. **RoleManager** - Gestión de roles (Manufacturer, OEM, etc.)
3. **SupplyChainTracker** - Trazabilidad de eventos
4. **DataVault** - Almacenamiento de datos sensibles
5. **CarbonFootprint** - Tracking de emisiones CO2
6. **SecondLifeManager** - Gestión de segunda vida
7. **RecyclingManager** - Gestión de reciclaje

Todos con patrón **UUPS Proxy** para upgradeabilidad.

## 🐛 Troubleshooting

### Error: "Battery Not Found"

**Causa:** Frontend usa direcciones antiguas

**Solución:**
```bash
cd sc
./deploy-and-seed.sh
```

### Error: "Anvil not running"

**Causa:** Anvil no está ejecutándose

**Solución:**
```bash
# Terminal separada
anvil
```

### Error: "Transaction reverted"

**Causa:** Posiblemente permisos de rol incorrectos

**Solución:** Verifica que estás usando la cuenta correcta en MetaMask

### Error: "Failed to write to deployments/local.json"

**Causa:** Permisos de foundry.toml incorrectos

**Solución:** Ya está configurado en `foundry.toml`:
```toml
fs_permissions = [
    { access = "read-write", path = "./deployments" },
    { access = "read-write", path = "../web/src/config" }
]
```

## 📚 Foundry - Comandos Útiles

### Build & Test

```bash
# Compilar contratos
forge build

# Ejecutar tests
forge test

# Gas report
forge test --gas-report

# Coverage
forge coverage

# Formatear código
forge fmt
```

### Deploy Manual (sin script automatizado)

```bash
# Deploy a red específica
forge script script/DeployAll.s.sol:DeployAll \
  --rpc-url <your_rpc_url> \
  --private-key <your_private_key> \
  --broadcast

# Verificar contrato en Polygonscan (testnet/mainnet)
forge verify-contract <ADDRESS> <CONTRACT> --chain-id <CHAIN_ID>
```

### Cast - Interacción con Contratos

```bash
# Llamar función view
cast call <CONTRACT_ADDRESS> "functionName(args)"

# Enviar transacción
cast send <CONTRACT_ADDRESS> "functionName(args)" --private-key <KEY>

# Ver balance
cast balance <ADDRESS>

# Ver block number
cast block-number
```

## 🔗 Links Útiles

- Frontend: http://localhost:3000
- Battery Passport: http://localhost:3000/passport/NV-2024-001234
- Anvil RPC: http://127.0.0.1:8545
- Chain ID: 31337
- Foundry Book: https://book.getfoundry.sh/

## 📖 Más Información

- Ver `web/MANUAL_TESTING_GUIDE.md` para testing manual con MetaMask
- Ver `src/` para código de contratos
- Ver `test/` para tests unitarios
- Ver `script/` para scripts de deployment
