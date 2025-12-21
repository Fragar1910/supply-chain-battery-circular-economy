# 🔋 Supply Chain Battery Circular Economy - Proyecto Educativo de Trazabilidad de Baterías

## 🎯 Visión General del Proyecto

**Supply Chain Battery Circular Economy** es un **proyecto educativo de 3 semanas** que implementa una aplicación descentralizada (DApp) de trazabilidad blockchain para gestionar el ciclo de vida completo de baterías de vehículos eléctricos, desde la extracción de materias primas hasta su reciclaje final, cumpliendo con la regulación europea del **Pasaporte Digital de Baterías (EU Battery Passport)** obligatorio a partir del **18 de febrero de 2027**.

### 🔑 **Decisiones Clave de Diseño**

#### **1. ✅ OpenZeppelin como Base (OBLIGATORIO)**
**Todos los smart contracts DEBEN heredar de OpenZeppelin Contracts**:

```solidity
// ✅ CORRECTO
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
contract BatteryRegistry is AccessControlUpgradeable { }

// ❌ INCORRECTO  
contract BatteryRegistry { 
    mapping(address => bool) admins; // Implementación desde cero (inseguro)
}
```

**Razones**:
- ✅ Simplificar desarrollo (no reinventar la rueda)
- ✅ Garantizar seguridad (contratos auditados)
- ✅ Reducir bugs (código battle-tested)
- ✅ Ahorro de tiempo (funcionalidades listas)

#### **2. 🔋 Baterías como NFT (No Tokens Fungibles)**
Cada batería es un **activo único** (NFT-like), NO token fungible:
- ✅ BIN único por batería (como NFT tokenId)
- ✅ Estado individual (SOH, ciclos)
- ✅ Ownership 1:1 (un propietario a la vez)
- ✅ Trazabilidad individual (EU Battery Passport)

*Ver sección "Sistema de Tokens NFT" para detalles.*

#### **3. 📱 QR Scanner con Modo Manual**
Modo manual por defecto para testing:
- ✅ Tests E2E sin cámara (CI/CD friendly)
- ✅ Input directo de BIN para verificación funcional
- ✅ Fallback si cámara no está disponible

*Ver FASE 3, Día 15-16 para implementación.*

### ⏱️ **Restricciones del Proyecto Educativo**
- **Duración**: 3 semanas
- **Objetivo**: Demostración funcional de concepto
- **Enfoque**: Parámetros críticos en blockchain, datos secundarios off-chain
- **Despliegue**: Red L2 optimizada para bajos costes de gas

### 🌐 **Red Blockchain Recomendada**

Para minimizar costes de gas y maximizar accesibilidad, se recomienda desplegar en **Layer 2 de Ethereum**:

#### **Opción 1: Polygon PoS (RECOMENDADO)**
- **Gas costs**: ~$0.001 - $0.01 por transacción
- **Ventajas**: 
  - Máxima compatibilidad con Ethereum (EVM-compatible)
  - Red madura con gran adopción
  - Bridge oficial con Ethereum mainnet
  - Fácil deploy con Foundry/Hardhat
  - Explorador: PolygonScan
- **RPC**: https://polygon-rpc.com
- **Faucet testnet**: https://faucet.polygon.technology (Mumbai)

#### **Opción 2: Optimism / Arbitrum**
- **Gas costs**: ~$0.01 - $0.05 por transacción
- **Ventajas**: 
  - Rollups optimísticos con seguridad de Ethereum
  - Menor coste que mainnet (10-100x)
  - Creciente ecosistema

#### **Opción 3: Ethereum Mainnet** (❌ NO RECOMENDADO para educativo)
- **Gas costs**: $5 - $50+ por transacción
- **Razón**: Costes prohibitivos para proyecto educativo

### 📊 **Estrategia de Datos: On-Chain vs Off-Chain**

Dado el tiempo limitado (3 semanas) y la optimización de costes, se adopta estrategia híbrida:

#### **Datos ON-CHAIN (Blockchain)** ✅
Almacenar solo datos **críticos** e **inmutables**:
- Identificadores únicos (BIN, VIN)
- Estado de batería (FirstLife, SecondLife, Recycled)
- Huella de carbono TOTAL (agregada)
- SOH en puntos críticos (manufacture, end-first-life, end-second-life)
- Hashes de certificaciones (IPFS CID)
- Transferencias entre roles (from, to, timestamp)
- Materiales recuperados en reciclaje (kg totales)

**Coste estimado**: ~0.1 - 0.5 MATIC por batería (ciclo completo)

#### **Datos OFF-CHAIN (Base de Datos / IPFS)** 📁
Almacenar datos **detallados** y **voluminosos**:
- Telemetría continua (SOH/SOC cada minuto)
- Documentos PDF (certificados, auditorías)
- Imágenes de productos
- Logs detallados de eventos
- Metadatos extensos de manufactura
- Reportes completos de reciclaje

**Solución**: 
- **IPFS/Arweave**: Documentos inmutables (hash guardado on-chain)
- **Base de datos tradicional** (opcional futuro): MongoDB/PostgreSQL para queries rápidas

### 🌍 Contexto Regulatorio: EU Battery Passport 2027

La Regulación de Baterías de la UE (EU) 2023/1542 establece que todas las baterías de vehículos eléctricos e industriales con capacidad superior a 2 kWh comercializadas en la UE deben tener un pasaporte digital accesible mediante código QR, que incluya:

#### **Datos Obligatorios del Pasaporte Digital (2027)**
- **Identificación única** de la batería (Battery Identification Number - BIN)
- **Características técnicas**: tipo, modelo, capacidad, química, peso
- **Huella de carbono** verificada por terceros (desde feb 2025)
- **Origen de materias primas** y trazabilidad completa
- **Porcentaje de materiales reciclados** (cobalto 16%, plomo 85%, litio 6%, níquel 6%)
- **Historial de uso**: estado de salud (SOH), estado de carga (SOC)
- **Información de sostenibilidad**: due diligence, certificaciones éticas
- **Datos de reciclabilidad**: contenido reciclable, instrucciones de desmontaje

#### **Estándares y Compatibilidad**
- Basado en **DIN DKE SPEC 99100** (estándar alemán para pasaportes de baterías)
- Compatible con **Catena-X** (red europea de intercambio de datos)
- Interoperable según **ISO 14040/14044** para análisis de ciclo de vida
- Integración con **GS1** para códigos de barras y sistemas de identificación

---

## 🏭 Actores del Sistema Extendido

### 1. ⛏️ **Raw Material Supplier (Proveedor de Materias Primas)**
- **Función**: Extrae y procesa minerales críticos para baterías
- **Responsabilidades**: Primera etapa de la cadena de suministro
- **Parámetros de Trazabilidad Clave**:
  - **Origen geográfico**: Mina/localización exacta (GPS)
  - **Tipo de mineral**: Litio, cobalto, níquel, manganeso, grafito
  - **Huella de carbono de extracción**: Emisiones Scope 1 y 2 (tCO₂e/kg)
  - **Consumo de agua**: Litros/kg de mineral extraído
  - **Certificación ética**:
    - No trabajo infantil (ILO Convention 182)
    - No trabajo forzado (ILO Convention 29)
    - Condiciones laborales justas (salario digno, seguridad)
  - **Certificaciones ambientales**: ISO 14001, certificados de minería responsable
  - **Impacto en biodiversidad**: Medidas de mitigación implementadas
  - **Comunidades locales**: Impacto social, consultas con comunidades indígenas
  - **Pureza del material**: % de pureza, contaminantes
  - **Método de extracción**: Cielo abierto, subterráneo, salmuera, etc.
  - **Fecha de extracción** y **lote/batch number**

### 2. 🏭 **Component Manufacturer (Fabricante de Componentes)**
- **Función**: Procesa materias primas en componentes de batería (ánodos, cátodos, electrolitos)
- **Responsabilidades**: Manufactura de células y módulos de batería
- **Parámetros de Trazabilidad Clave**:
  - **Química de la batería**: NMC, NCA, LFP, LTO, litio-metal
  - **Composición exacta**: Porcentaje de cada material (Co, Ni, Mn, Li)
  - **Huella de carbono de manufactura**: 
    - Emisiones de producción de material activo de cátodo
    - Emisiones de producción de células
    - Emisiones de ensamblaje de módulos
    - Total: kg CO₂e/kWh
  - **Consumo energético**: 
    - kWh/kWh de capacidad producida
    - % de energía renovable utilizada
  - **Trazabilidad de materiales**: Link a proveedores upstream
  - **Contenido reciclado**: % de materiales reciclados vs vírgenes
  - **Eficiencia de producción**: Tasa de rechazo, desperdicio de material
  - **Certificaciones**: ISO 9001, ISO 14001, ISO 50001
  - **Control de calidad**: 
    - Capacidad nominal (Ah)
    - Voltaje nominal y máximo (V)
    - Densidad energética (Wh/kg, Wh/L)
    - Resistencia interna (mΩ)
    - Ciclos de vida esperados
  - **Sustancias peligrosas**: Cumplimiento REACH, RoHS
  - **Fecha de manufactura**, **número de serie único**
  - **Planta de fabricación**: Ubicación, condiciones laborales

### 3. 🚗 **OEM (Original Equipment Manufacturer / Ensamblador de Vehículos)**
- **Función**: Integra baterías en vehículos eléctricos
- **Responsabilidades**: Ensamblaje final y primera venta
- **Parámetros de Trazabilidad Clave**:
  - **Integración del pack de baterías**:
    - Configuración del pack (número de módulos/células)
    - BMS (Battery Management System) instalado
    - Software versión y firmware
  - **Información del vehículo**:
    - VIN (Vehicle Identification Number)
    - Modelo del vehículo
    - Fecha de ensamblaje
  - **Huella de carbono del ensamblaje**: Emisiones en planta
  - **Trazabilidad completa upstream**: Links a todos los componentes
  - **Garantía inicial**: Términos, duración (años/km)
  - **Capacidad inicial certificada**: kWh, SOH inicial 100%
  - **Documentación técnica**: Manuales, especificaciones
  - **Certificaciones de seguridad**: Crash tests, certificados eléctricos
  - **Primera prueba de rendimiento**: Datos de aceptación de calidad
  - **Ubicación de venta**: País, distribuidor
  - **Fecha de primera matriculación**

### 4. 🚘 **Fleet Operator / First Owner (Usuario Principal / Primera Vida)**
- **Función**: Opera el vehículo eléctrico durante su vida útil principal
- **Responsabilidades**: Uso, mantenimiento y registro de datos de rendimiento
- **Parámetros de Trazabilidad Clave**:
  - **Datos de uso en tiempo real** (telemetría):
    - Ciclos de carga/descarga acumulados
    - Kilometraje total
    - Temperatura de operación (min/max/avg)
    - Profundidad de descarga (DoD) promedio
    - Tasa de carga promedio (C-rate)
  - **Estado de salud (SOH)**: % de capacidad restante vs original
  - **Estado de carga (SOC)**: % de carga actual
  - **Historial de mantenimiento**:
    - Servicios realizados
    - Reemplazos de componentes
    - Actualizaciones de software BMS
  - **Eventos críticos**:
    - Sobrecargas detectadas
    - Sobrecalentamientos
    - Accidentes/impactos
    - Fallos del BMS
  - **Patrones de carga**:
    - Tipo de cargadores utilizados (AC/DC, potencia)
    - Frecuencia de carga rápida vs lenta
  - **Condiciones ambientales**: Clima predominante, temperatura ambiente
  - **Historial de propietarios**: Cambios de titularidad
  - **Degradación observada**: Curva de degradación vs tiempo
  - **Fecha de fin de primera vida**: Cuando SOH < 80%

### 5. ♻️ **Aftermarket User (Usuario de Segunda Vida)**
- **Función**: **ROL NUEVO** - Utiliza la batería para aplicaciones estacionarias tras su vida en el vehículo
- **Responsabilidades**: Segunda vida de la batería en aplicaciones de menor exigencia
- **Parámetros de Trazabilidad Clave**:
  - **Evaluación inicial de segunda vida**:
    - SOH al inicio de segunda vida (típicamente 70-80%)
    - Capacidad restante (kWh)
    - Inspección de células individuales
    - Tests de seguridad
  - **Tipo de aplicación de segunda vida**:
    - **Almacenamiento residencial**: Solar home storage
    - **Almacenamiento comercial/industrial**: Peak shaving, backup
    - **Sistemas de energía renovable**: Integración con solar/eólica
    - **Microgrids**: Comunidades energéticas
    - **Estaciones de carga EV**: Almacenamiento intermedio
    - **Maquinaria ligera**: Carretillas elevadoras, AGVs
    - **Telecomunicaciones**: Torres de telecomunicación
  - **Reconfiguración del sistema**:
    - Nuevos conectores/carcasa
    - BMS actualizado para segunda vida
    - Certificación UL 1974 (sistemas repurposed)
  - **Rendimiento en segunda vida**:
    - Nuevos ciclos de carga/descarga
    - Degradación continua (SOH tracking)
    - Temperatura de operación
    - Eficiencia de round-trip
  - **Beneficios económicos y ambientales**:
    - Ahorro en costes vs batería nueva
    - Emisiones evitadas (tCO₂e)
    - kWh de energía renovable almacenada
  - **Tiempo estimado de segunda vida**: 10-15 años típicamente
  - **Fecha de inicio de segunda vida**
  - **Propietario/operador**: Hogar, empresa, utilidad
  - **Ubicación de instalación**: GPS, condiciones ambientales
  - **Fin de segunda vida**: Cuando SOH < 40-50%

### 6. ♻️ **Recycler (Reciclador)**
- **Función**: Recicla la batería al final de su vida útil, recuperando materiales valiosos
- **Responsabilidades**: Desmantelamiento seguro y recuperación de materiales
- **Parámetros de Trazabilidad Clave**:
  - **Recepción de batería**:
    - Estado final: SOH, daños físicos
    - Peso total
    - Química de la batería
    - Fecha de recepción
  - **Proceso de reciclaje**:
    - **Método utilizado**: Pirometalúrgico, hidrometalúrgico, reciclaje directo
    - **Eficiencia de recuperación por material**:
      - Litio: % recuperado (meta UE: 50% en 2027, 80% en 2031)
      - Cobalto: % recuperado (meta UE: 90%)
      - Níquel: % recuperado (meta UE: 90%)
      - Manganeso: % recuperado
      - Cobre: % recuperado (meta UE: 90%)
      - Aluminio: % recuperado
      - Grafito: % recuperado
  - **Materiales recuperados**:
    - Cantidad (kg) de cada material
    - Pureza de materiales recuperados
    - Destino: Nuevas baterías, otros usos industriales
  - **Gestión de residuos**:
    - Cantidad de residuos no reciclables
    - Método de disposición (vertedero, incineración)
    - Tratamiento de sustancias peligrosas
  - **Impacto ambiental del reciclaje**:
    - Consumo energético (kWh/kg batería)
    - Emisiones del proceso de reciclaje (tCO₂e)
    - Consumo de agua
    - Generación de residuos secundarios
  - **Certificaciones**: ISO 14001, certificados de reciclaje responsable
  - **Cumplimiento regulatorio**: Tasas de recolección UE (63% en 2027, 73% en 2030)
  - **Seguridad y salud**: Protocolos de descarga segura, protección de trabajadores
  - **Cierre del ciclo**: Materiales vuelven al Raw Material Supplier

### 7. 👑 **Regulatory Authority / Admin (Autoridad Reguladora)**
- **Función**: Supervisa el cumplimiento de regulaciones y audita el sistema
- **Responsabilidades**: Verificación, auditoría, emisión de certificados
- **Parámetros de Trazabilidad Clave**:
  - **Auditorías de cumplimiento**:
    - Verificación de huellas de carbono
    - Auditorías de due diligence
    - Inspecciones de condiciones laborales
    - Verificación de contenido reciclado
  - **Emisión de certificaciones**:
    - Aprobación de pasaportes digitales
    - Certificados de conformidad con EU Battery Regulation
  - **Monitoreo de mercado**:
    - Baterías comercializadas en la UE
    - Estadísticas de reciclaje
    - Cumplimiento de objetivos de economía circular
  - **Gestión de recall**: Coordinación de retiradas de mercado
  - **Sanciones**: Penalizaciones por incumplimiento
  - **Reportes agregados**: Impacto ambiental del sector, progreso hacia objetivos climáticos

---

## 📊 Matriz de Parámetros de Trazabilidad OPTIMIZADA (Proyecto Educativo)

### **Estrategia de Almacenamiento**

| Símbolo | Significado |
|---------|-------------|
| ⛓️ | **ON-CHAIN**: Almacenado directamente en blockchain |
| 📁 | **OFF-CHAIN**: Almacenado en IPFS/DB, hash en blockchain |
| 🔮 | **FUTURO**: Implementación opcional post-MVP |

---

### **Raw Material Supplier (Proveedor de Materias Primas)**

| Parámetro | Tipo | Almacenamiento | Obligatorio | Justificación |
|-----------|------|----------------|-------------|---------------|
| **Batch ID único** | String | ⛓️ | ✅ | Identificador crítico |
| **Tipo de mineral** | Enum | ⛓️ | ✅ | Trazabilidad básica |
| **Ubicación extracción (GPS)** | String | ⛓️ | ✅ | Transparencia origen |
| **Huella carbono extracción (kgCO₂e/kg)** | uint256 | ⛓️ | ✅ | Dato crítico regulatorio |
| **Certificación ética (hash)** | bytes32 | ⛓️ | ✅ | Hash IPFS de certificado |
| **Fecha de extracción** | uint256 | ⛓️ | ✅ | Timestamp Unix |
| Método de extracción | String | 📁 | ⭕ | Detalles en IPFS |
| Consumo de agua detallado | Float | 📁 | ⭕ | Métrica secundaria |
| Pureza del material (%) | Float | 📁 | ⭕ | QA interno |
| Auditorías laborales | PDF | 📁 | ⭕ | Documento completo |

**On-chain total**: ~6 campos críticos  
**Gas estimado**: ~0.05 MATIC por batch

---

### **Component Manufacturer (Fabricante de Componentes)**

| Parámetro | Tipo | Almacenamiento | Obligatorio | Justificación |
|-----------|------|----------------|-------------|---------------|
| **BIN (Battery ID Number)** | String | ⛓️ | ✅ | Identificador único global |
| **Química batería** | Enum | ⛓️ | ✅ | Dato técnico crítico |
| **Capacidad nominal (Wh)** | uint256 | ⛓️ | ✅ | Especificación clave |
| **Huella carbono manufactura (kgCO₂e)** | uint256 | ⛓️ | ✅ | Regulatorio UE |
| **% Contenido reciclado** | uint8 | ⛓️ | ✅ | Regulatorio UE 2027 |
| **Batch materias primas (array IDs)** | bytes32[] | ⛓️ | ✅ | Trazabilidad upstream |
| **Fecha manufactura** | uint256 | ⛓️ | ✅ | Timestamp Unix |
| **SOH inicial** | uint8 | ⛓️ | ✅ | 100% (referencia) |
| Composición detallada (Co,Ni,Mn,Li %) | Struct | 📁 | ⭕ | Detalles técnicos |
| Tests de calidad (voltaje, resistencia) | JSON | 📁 | ⭕ | QA interno |
| Certificados ISO 9001 | PDF | 📁 | ⭕ | Documentación |
| Consumo energético producción | Float | 📁 | 🔮 | Métrica futura |

**On-chain total**: ~8 campos críticos  
**Gas estimado**: ~0.1 MATIC por batería

---

### **OEM (Original Equipment Manufacturer)**

| Parámetro | Tipo | Almacenamiento | Obligatorio | Justificación |
|-----------|------|----------------|-------------|---------------|
| **VIN (Vehicle ID)** | String | ⛓️ | ✅ | Vinculación vehículo-batería |
| **BIN (ya existente)** | String | ⛓️ | ✅ | Referencia a batería |
| **Configuración pack** | String | ⛓️ | ✅ | Ej: "96S1P" (96 series, 1 paralelo) |
| **Capacidad total pack (Wh)** | uint256 | ⛓️ | ✅ | Puede ser suma de módulos |
| **BMS versión firmware** | String | ⛓️ | ✅ | Critical para updates OTA |
| **Fecha ensamblaje** | uint256 | ⛓️ | ✅ | Timestamp |
| **Garantía (años)** | uint8 | ⛓️ | ✅ | Dato contractual |
| Huella carbono ensamblaje | uint256 | 📁 | ⭕ | Sumado en total |
| Tests de aceptación QA | PDF | 📁 | ⭕ | Documentación |
| Manuales técnicos | PDF | 📁 | 🔮 | Referencias |

**On-chain total**: ~7 campos  
**Gas estimado**: ~0.05 MATIC

---

### **Fleet Operator / First Owner (Usuario Primera Vida)**

| Parámetro | Tipo | Almacenamiento | Obligatorio | Justificación |
|-----------|------|----------------|-------------|---------------|
| **Ciclos totales** | uint32 | ⛓️ | ✅ | Métrica de uso clave |
| **Kilometraje total** | uint32 | ⛓️ | ✅ | Correlación con degradación |
| **SOH actual** | uint8 | ⛓️ | ✅ | Estado crítico (0-100%) |
| **SOH al fin primera vida** | uint8 | ⛓️ | ✅ | Típicamente ~70-80% |
| **Fecha fin primera vida** | uint256 | ⛓️ | ✅ | Timestamp |
| **Eventos críticos (count)** | uint8 | ⛓️ | ✅ | Sobrecargas, sobrecalent. |
| Telemetría detallada (SOC, temp cada min) | TimeSeries | 📁 | ⭕ | Base de datos off-chain |
| Historial mantenimiento | Array | 📁 | ⭕ | Logs detallados |
| Actualizaciones firmware OTA | Array | 📁 | 🔮 | Histórico técnico |
| Patrones de carga (% fast DC) | Float | 📁 | 🔮 | Análisis ML |

**On-chain total**: ~6 campos  
**Gas estimado**: ~0.03 MATIC (actualizaciones periódicas)

---

### **Aftermarket User (Usuario Segunda Vida)** ⭐ NUEVO

| Parámetro | Tipo | Almacenamiento | Obligatorio | Justificación |
|-----------|------|----------------|-------------|---------------|
| **Tipo aplicación segunda vida** | Enum | ⛓️ | ✅ | Clasificación clave |
| **SOH inicio segunda vida** | uint8 | ⛓️ | ✅ | Estado inicial (70-80%) |
| **Ubicación instalación (GPS)** | String | ⛓️ | ✅ | Trazabilidad geográfica |
| **Fecha inicio segunda vida** | uint256 | ⛓️ | ✅ | Timestamp |
| **Certificación UL 1974 (hash)** | bytes32 | ⛓️ | ✅ | Hash IPFS certificado |
| **SOH al fin segunda vida** | uint8 | ⛓️ | ✅ | Estado final (~40-50%) |
| **Fecha fin segunda vida** | uint256 | ⛓️ | ✅ | Timestamp |
| **kWh almacenados (total)** | uint64 | ⛓️ | ✅ | Métrica de uso |
| Nuevos ciclos segunda vida | uint32 | 📁 | ⭕ | Detalle en DB |
| Eficiencia round-trip (%) | Float | 📁 | ⭕ | Métrica técnica |
| Ahorro económico vs nueva | Float | 📁 | 🔮 | Cálculo informativo |
| tCO₂e evitadas | Float | 📁 | 🔮 | Impacto ambiental |

**Enums de Aplicación Segunda Vida**:
```solidity
enum SecondLifeApp {
    ResidentialStorage,    // Home solar storage
    CommercialStorage,     // Empresas, peak shaving
    RenewableIntegration, // Solar/wind farms
    Microgrid,            // Comunidades energéticas
    EVCharging,           // Estaciones de carga
    LightMachinery,       // Carretillas, AGVs
    Telecom               // Torres telecom
}
```

**On-chain total**: ~8 campos  
**Gas estimado**: ~0.06 MATIC

---

### **Recycler (Reciclador)**

| Parámetro | Tipo | Almacenamiento | Obligatorio | Justificación |
|-----------|------|----------------|-------------|---------------|
| **Método reciclaje** | Enum | ⛓️ | ✅ | Pyrometallurgical/Hydro/Direct |
| **Fecha recepción** | uint256 | ⛓️ | ✅ | Timestamp |
| **Litio recuperado (g)** | uint32 | ⛓️ | ✅ | Regulatorio UE (50% en 2027) |
| **Cobalto recuperado (g)** | uint32 | ⛓️ | ✅ | Regulatorio UE (90% meta) |
| **Níquel recuperado (g)** | uint32 | ⛓️ | ✅ | Regulatorio UE (90% meta) |
| **Cobre recuperado (g)** | uint32 | ⛓️ | ✅ | Regulatorio UE (90% meta) |
| **Tasa recuperación global (%)** | uint8 | ⛓️ | ✅ | KPI principal |
| **Certificado reciclaje (hash)** | bytes32 | ⛓️ | ✅ | Hash IPFS |
| Manganeso recuperado | uint32 | 📁 | ⭕ | Dato secundario |
| Aluminio, grafito | uint32 | 📁 | ⭕ | Datos adicionales |
| Consumo energético proceso | Float | 📁 | 🔮 | Métrica ambiental |
| Emisiones proceso (kgCO₂e) | Float | 📁 | 🔮 | LCA detallado |

**On-chain total**: ~8 campos  
**Gas estimado**: ~0.08 MATIC

---

### **Regulatory Authority (Autoridad Reguladora)**

| Parámetro | Tipo | Almacenamiento | Obligatorio | Justificación |
|-----------|------|----------------|-------------|---------------|
| **Aprobación huella carbono** | bool | ⛓️ | ✅ | Verificación oficial |
| **Timestamp verificación** | uint256 | ⛓️ | ✅ | Auditoría |
| **Certificaciones emitidas (hashes)** | bytes32[] | ⛓️ | ✅ | Lista de aprobaciones |
| **Sanciones aplicadas** | bool | ⛓️ | ⭕ | Incumplimientos |
| Reportes de auditoría | PDF | 📁 | ⭕ | Documentación completa |
| Estadísticas sectoriales | JSON | 📁 | 🔮 | Análisis agregado |

**On-chain total**: ~4 campos  
**Gas estimado**: ~0.02 MATIC por verificación

---

## 💰 **Coste Total Estimado por Batería (Ciclo Completo en Polygon)**

| Etapa | Operaciones | Gas Estimado (MATIC) | Coste USD (@$0.80/MATIC) |
|-------|-------------|----------------------|--------------------------|
| Raw Material Supplier | Register batch | 0.05 | $0.04 |
| Component Manufacturer | Register battery + link materials | 0.10 | $0.08 |
| OEM | Integrate in vehicle | 0.05 | $0.04 |
| Fleet Operator | 5 updates durante vida útil | 0.15 | $0.12 |
| Aftermarket User | Start + updates + end | 0.10 | $0.08 |
| Recycler | Register recycling + materials | 0.08 | $0.06 |
| Transfers (6 transferencias) | Approve/accept | 0.12 | $0.10 |
| **TOTAL** | **Ciclo completo** | **~0.65 MATIC** | **~$0.52** |

**Conclusión**: Coste **ultra-bajo** en Polygon vs **$50-500 en Ethereum mainnet**. ✅

---

## 🌐 Referencia de Implementación Real: Northvolt

### **Northvolt Connected Battery Platform**

**URL**: https://northvolt.com/products/systems/connected-battery/

Northvolt, fabricante europeo líder en baterías sostenibles, ha implementado una plataforma de trazabilidad digital que sirve como **referencia de diseño para nuestro frontend**:

#### **Características Clave de Northvolt (Inspiración)**:

1. **Telemetría en Tiempo Real**:
   - Monitoreo remoto de SOH, SOC, temperatura
   - Análisis de degradación mediante ML/AI
   - Actualizaciones OTA (Over-The-Air) de firmware

2. **Trazabilidad Completa (Cradle to Grave)**:
   - Seguimiento desde materias primas hasta reciclaje
   - QR code único para cada batería
   - API para acceso a datos en tiempo real

3. **Manufactura Digitalizada (Connected Factory)**:
   - Captura de datos en cada paso de producción
   - Digital Twin de líneas de producción
   - Trazabilidad de componentes con metadata

4. **Sostenibilidad**:
   - 100% energía renovable en fabricación
   - 90% menor huella de carbono vs baterías con energía fósil
   - Programa Revolt: reciclaje de hasta 95% de materiales

5. **Due Diligence**:
   - Sourcing ético de cobalto fuera de zonas de conflicto
   - Certificaciones de condiciones laborales
   - Transparencia en supply chain

#### **Nuestro Frontend: Implementación Northvolt-style en Node.js**

Desarrollaremos una aplicación web **inspirada en el diseño y UX de Northvolt** utilizando:

**Stack Frontend**:
```javascript
// Backend: Node.js + Express
- Node.js v18+ (runtime)
- Express.js (servidor web)
- ethers.js (interacción blockchain)

// Frontend: Next.js 14 (React framework)
- Next.js 14 App Router (SSR + CSR)
- TypeScript (type safety)
- Tailwind CSS (styling moderno)
- Shadcn UI (componentes premium)
- Recharts (gráficos y analytics)
- React Flow (visualización de grafos)
- Leaflet (mapas interactivos)
```

**Características del Frontend**:
- ✅ **Dashboard estilo Northvolt**: KPIs en tiempo real, gráficos modernos
- ✅ **Battery Passport Viewer**: Visualización completa de trazabilidad con QR
- ✅ **Mapas interactivos**: Trazabilidad geográfica de supply chain
- ✅ **Grafos de flujo**: Visualización de relaciones entre actores
- ✅ **Responsive design**: Mobile-first (PWA)
- ✅ **Dark/Light mode**: Tema moderno y profesional

**Inspiración de Diseño**:
- Dashboard minimalista con métricas clave destacadas
- Paleta de colores: Verde (sostenibilidad) + Azul (tecnología)
- Tipografía: Sans-serif moderna (Inter, Outfit)
- Animaciones suaves con Framer Motion
- Data visualization clara y accesible

---

## 🔗 Arquitectura del Sistema Blockchain

### **Stack Tecnológico**

#### **Smart Contracts (Solidity)**
```
- Lenguaje: Solidity ^0.8.20
- Framework: Foundry (forge, anvil, cast)
- Red de Desarrollo: Anvil (local)
- Librerías: OpenZeppelin Contracts v5.0+ (ESENCIAL)
  - AccessControl: Gestión de roles
  - ReentrancyGuard: Protección contra reentrancy
  - Pausable: Circuit breaker
  - UUPS Proxy: Upgradeability
  - Counters: IDs autoincrementales
- Patrón: Upgradeable Proxy Pattern (OpenZeppelin UUPS)
- Testing: Foundry Test Suite + Fuzzing + Invariant Tests
```

#### **Frontend (React + TypeScript)**
```
- Framework: React 18 con Vite
- Lenguaje: TypeScript
- Styling: Tailwind CSS + Shadcn UI
- Web3: ethers.js v6
- State Management: Zustand / React Context
- Maps: Leaflet (trazabilidad geográfica)
- Charts: Recharts (visualización datos)
```

#### **Backend (Node.js)**
```
- Runtime: Node.js 18+
- Framework: Express.js
- API REST: Para servicios auxiliares (IPFS, indexación)
- Base de datos auxiliar: PostgreSQL (opcional, para caché)
```

#### **Testing**
```
- Smart Contracts: Foundry (unit, integration, fuzzing)
- E2E Tests: Playwright
- Coverage: forge coverage + Playwright coverage
```

#### **Deployment**
```
- Desarrollo: Anvil (local blockchain)
- Futuro (documentado): Sepolia testnet, Mainnet/L2
```

### **Estructura de Smart Contracts**

#### **⚠️ IMPORTANTE: Sistema de Baterías como NFT (No Tokens Fungibles)**

**Decisión de Diseño**: Este proyecto implementa baterías como **activos únicos** (similar a NFT/ERC-721), NO como tokens fungibles (ERC-20).

**Justificación Técnica**:

1. **Realismo del Dominio**:
   - Cada batería física es ÚNICA con su propio historial
   - BIN (Battery Identification Number) único por batería
   - Estado individual (SOH, ciclos, temperatura) no transferible
   - Cumplimiento EU Battery Passport: trazabilidad individual obligatoria

2. **Comparación con Supply Chain Genérico**:
   
   **❌ Modelo Token Fungible (Genérico)**:
   ```solidity
   // Aceite de oliva: 1000 litros intercambiables
   Token { 
       id: 1, 
       name: "Aceite Extra Virgen",
       totalSupply: 1000,
       balance[usuario1]: 50 litros,
       balance[usuario2]: 30 litros
   }
   ```
   
   **✅ Modelo Batería NFT (Específico)**:
   ```solidity
   // Batería única con historial individual
   Battery {
       bin: "NV-2024-001234",  // ID único (como NFT tokenId)
       vin: "TESLA-XYZ-789",   // Vehículo específico
       sohCurrent: 87%,        // Estado actual individual
       totalCycles: 1523,      // Historia única
       owner: 0x123...         // Un propietario a la vez
   }
   ```

3. **Mapeo de Conceptos**:
   | Concepto Supply Chain | Implementación Battery | Razón |
   |----------------------|------------------------|-------|
   | `tokenId` | `bin` | Identificador único |
   | `totalSupply` | N/A | Cada batería es única, no hay "supply" |
   | `balance[address]` | `owner` | Ownership 1:1, no balance |
   | `parentId` | `upstreamMaterials[]` | Múltiples materiales upstream |
   | `features` (JSON) | Structs tipados | Validación y eficiencia |

**Ventajas del Enfoque NFT para Baterías**:
- ✅ Trazabilidad individual completa (requerido por EU)
- ✅ Estado dinámico por batería (SOH, ciclos, temperatura)
- ✅ Historial de propietarios (primera vida, segunda vida, reciclaje)
- ✅ Cumplimiento regulatorio (pasaporte digital único)
- ✅ Menos gas costs (no mappings de balances)
- ✅ Más simple (ownership directo)

**Cuándo usar Tokens Fungibles vs NFT**:
- **Fungible**: Commodities (litio a granel, aceite, granos) donde unidades son intercambiables
- **NFT**: Productos únicos (baterías, vehículos, joyas) con trazabilidad individual

#### **Contratos Principales**

**NOTA CRÍTICA**: Todos los contratos **DEBEN** heredar de OpenZeppelin para:
- ✅ Simplificar desarrollo (no reinventar la rueda)
- ✅ Garantizar seguridad (contratos auditados)
- ✅ Reducir bugs (código battle-tested)
- ✅ Ahorro de tiempo (funcionalidades listas)

1. **`BatteryRegistry.sol`**
   ```solidity
   // SPDX-License-Identifier: MIT
   pragma solidity ^0.8.20;
   
   import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
   import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
   import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
   import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
   import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
   
   contract BatteryRegistry is 
       Initializable,
       AccessControlUpgradeable,
       PausableUpgradeable,
       ReentrancyGuardUpgradeable,
       UUPSUpgradeable 
   {
       bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
       bytes32 public constant OEM_ROLE = keccak256("OEM_ROLE");
       bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
   }
   ```
   - **Funcionalidad**: Registro central de todas las baterías (BIN único)
   - **OpenZeppelin**: AccessControl (roles), Pausable (emergency), ReentrancyGuard, UUPS (upgradeability)
   - **Eventos**: BatteryRegistered, StatusUpdated, SOHUpdated

2. **`RoleManager.sol`**
   ```solidity
   import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
   import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
   
   contract RoleManager is AccessControlUpgradeable, UUPSUpgradeable {
       bytes32 public constant RAW_MATERIAL_SUPPLIER = keccak256("RAW_MATERIAL_SUPPLIER");
       bytes32 public constant COMPONENT_MANUFACTURER = keccak256("COMPONENT_MANUFACTURER");
       bytes32 public constant OEM_ROLE = keccak256("OEM_ROLE");
       bytes32 public constant FLEET_OPERATOR = keccak256("FLEET_OPERATOR");
       bytes32 public constant AFTERMARKET_USER = keccak256("AFTERMARKET_USER");
       bytes32 public constant RECYCLER_ROLE = keccak256("RECYCLER_ROLE");
       bytes32 public constant REGULATORY_AUTHORITY = keccak256("REGULATORY_AUTHORITY");
   }
   ```
   - **Funcionalidad**: Gestión de roles y permisos
   - **OpenZeppelin**: AccessControl (maneja TODA la lógica de roles automáticamente)
   - **Funciones heredadas**: `grantRole()`, `revokeRole()`, `hasRole()`, `renounceRole()`

3. **`SupplyChainTracker.sol`**
   ```solidity
   import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
   import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
   import "@openzeppelin/contracts/utils/Counters.sol";
   
   contract SupplyChainTracker is 
       AccessControlUpgradeable, 
       ReentrancyGuardUpgradeable 
   {
       using Counters for Counters.Counter;
       Counters.Counter private _transferIdCounter;
   }
   ```
   - **Funcionalidad**: Registro de transferencias entre actores
   - **OpenZeppelin**: ReentrancyGuard (protección ataques), Counters (IDs autoincrementales)
   - **Validación**: Flujo dirigido RawMaterial → Manufacturer → OEM → Fleet → Aftermarket → Recycler

4. **`DataVault.sol`**
   ```solidity
   import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
   import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
   
   contract DataVault is AccessControlUpgradeable, PausableUpgradeable {
       bytes32 public constant DATA_WRITER_ROLE = keccak256("DATA_WRITER_ROLE");
       bytes32 public constant DATA_READER_ROLE = keccak256("DATA_READER_ROLE");
   }
   ```
   - **Funcionalidad**: Almacenamiento seguro de parámetros de trazabilidad
   - **OpenZeppelin**: AccessControl (permisos granulares READ/WRITE), Pausable
   - **Hash IPFS**: Almacena hash de documentos (certificados, auditorías)

5. **`CarbonFootprint.sol`**
   ```solidity
   import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
   
   contract CarbonFootprint is AccessControlUpgradeable {
       bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
       bytes32 public constant EMITTER_ROLE = keccak256("EMITTER_ROLE");
   }
   ```
   - **Funcionalidad**: Cálculo y verificación de huella de carbono
   - **OpenZeppelin**: AccessControl (solo VERIFIER_ROLE puede verificar emisiones)
   - **Agregación**: Suma emisiones por etapa (extracción, manufactura, transporte, uso, reciclaje)

6. **`SecondLifeManager.sol`** (NUEVO - Rol Aftermarket)
   ```solidity
   import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
   import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
   
   contract SecondLifeManager is 
       AccessControlUpgradeable,
       ReentrancyGuardUpgradeable 
   {
       bytes32 public constant AFTERMARKET_USER = keccak256("AFTERMARKET_USER");
   }
   ```
   - **Funcionalidad**: Gestión específica de baterías en segunda vida (post-vehículo)
   - **OpenZeppelin**: ReentrancyGuard, AccessControl
   - **Aplicaciones**: Residential storage, commercial storage, microgrids, etc.

7. **`RecyclingManager.sol`**
   ```solidity
   import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
   import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
   import "@openzeppelin/contracts/utils/Counters.sol";
   
   contract RecyclingManager is 
       AccessControlUpgradeable,
       ReentrancyGuardUpgradeable 
   {
       using Counters for Counters.Counter;
       bytes32 public constant RECYCLER_ROLE = keccak256("RECYCLER_ROLE");
   }
   ```
   - **Funcionalidad**: Gestión de procesos de reciclaje y recuperación de materiales
   - **OpenZeppelin**: Counters (IDs), ReentrancyGuard, AccessControl
   - **Verificación**: Tasas de recuperación vs metas UE (Li 50% en 2027, 80% en 2031)

**Instalación de OpenZeppelin**:
```bash
cd sc

# Instalar OpenZeppelin con Foundry
forge install OpenZeppelin/openzeppelin-contracts-upgradeable
forge install OpenZeppelin/openzeppelin-contracts

# Actualizar foundry.toml
echo '[dependencies]
"@openzeppelin/contracts" = { version = "5.0.0" }
"@openzeppelin/contracts-upgradeable" = { version = "5.0.0" }' >> foundry.toml

# Remapear imports (crear remappings.txt)
echo '@openzeppelin/contracts/=lib/openzeppelin-contracts/contracts/
@openzeppelin/contracts-upgradeable/=lib/openzeppelin-contracts-upgradeable/contracts/' > remappings.txt
```

#### **Estructuras de Datos Clave (Base de Datos Blockchain)**

```solidity
// ============================================================================
// BATTERY REGISTRY - Registro Central de Baterías
// ============================================================================

/// @notice Estructura principal que representa una batería en el sistema
/// @dev Almacenada en mapping: batteryRegistry[bin] => Battery
struct Battery {
    string bin;                    // Battery Identification Number único (ej: "NV-2024-001234")
    string vin;                    // Vehicle Identification Number (opcional, si está en vehículo)
    string chemistry;              // Química de batería: "NMC811", "LFP", "NCA", etc.
    uint256 capacityWh;            // Capacidad nominal en Wh (ej: 75000 = 75kWh)
    uint256 manufactureDate;       // Timestamp de fecha de manufactura
    address componentManufacturer; // Dirección del fabricante de componentes
    address oem;                   // Dirección del OEM que ensambló (0x0 si aún no ensamblado)
    BatteryStatus status;          // Estado actual en el ciclo de vida
    uint8 sohCurrent;              // State of Health actual (0-100%)
    uint8 socCurrent;              // State of Charge actual (0-100%)
    uint256 totalCycles;           // Ciclos totales de carga/descarga
    bool isActive;                 // Indica si la batería está activa en el sistema
}

/// @notice Enumeración de estados posibles de una batería en su ciclo de vida
/// @dev Sigue el flujo: Manufactured → InService → EndOfFirstLife → InSecondLife → Recycling → Recycled
enum BatteryStatus { 
    Manufactured,      // Batería fabricada, aún no integrada en vehículo
    InService,         // En uso en vehículo (primera vida)
    EndOfFirstLife,    // Fin de primera vida (SOH < 80%), pendiente decisión
    InSecondLife,      // En aplicación de segunda vida (aftermarket)
    EndOfSecondLife,   // Fin de segunda vida (SOH < 40%), debe ir a reciclaje
    InRecycling,       // En proceso de reciclaje
    Recycled           // Reciclada, materiales recuperados y devueltos a supply chain
}

// ============================================================================
// MATERIAL TRACEABILITY - Trazabilidad de Materias Primas
// ============================================================================

/// @notice Trazabilidad de materias primas desde extracción
/// @dev Un batch de material puede usarse en múltiples baterías
struct MaterialTrace {
    bytes32 batchId;               // ID único del batch de material
    string materialType;           // "Lithium", "Cobalt", "Nickel", "Manganese", "Graphite"
    address supplier;              // Dirección del Raw Material Supplier
    string origin;                 // País/Región de extracción (ej: "Chile", "DRC")
    string gpsCoordinates;         // Coordenadas GPS de la mina (lat,long)
    uint256 quantityKg;            // Cantidad en kilogramos
    uint256 extractionDate;        // Timestamp de extracción
    uint256 carbonFootprint;       // Huella de carbono en gCO2e/kg
    uint256 waterConsumption;      // Consumo de agua en L/kg
    uint8 purityPercentage;        // Pureza del material (0-100%)
    bool ethicalCertified;         // Certificación ética (no trabajo infantil/forzado)
    string certificationHash;      // Hash IPFS de certificados (ISO 14001, Fair Labor, etc.)
    ExtractionMethod method;       // Método de extracción utilizado
}

/// @notice Métodos de extracción de minerales
enum ExtractionMethod {
    OpenPit,           // Cielo abierto
    Underground,       // Subterráneo
    Brine,             // Salmuera (para litio)
    Recycled           // Material reciclado (cierre del ciclo)
}

// ============================================================================
// MANUFACTURING DATA - Datos de Manufactura
// ============================================================================

/// @notice Datos de manufactura de componentes de batería
/// @dev Incluye datos de producción de cátodo, ánodo, célula y pack
struct ManufacturingData {
    string bin;                    // BIN de la batería asociada
    bytes32[] upstreamMaterials;   // Array de batchIds de materiales usados
    uint256 productionDate;        // Timestamp de producción
    string plantLocation;          // Ubicación de planta (GPS)
    ChemistryComposition composition; // Composición química detallada
    QualityMetrics quality;        // Métricas de calidad
    CarbonFootprint carbonFootprint; // Huella de carbono de manufactura
    uint256 energyConsumedKwh;     // Energía consumida en producción (kWh)
    uint8 renewableEnergyPercent;  // % de energía renovable usada (0-100%)
    uint8 recycledContentPercent;  // % de contenido reciclado total (0-100%)
    string certificationHash;      // Hash IPFS de certificados (ISO 9001, etc.)
}

/// @notice Composición química detallada de la batería
struct ChemistryComposition {
    uint8 cobaltPercent;           // % de cobalto (0-100)
    uint8 nickelPercent;           // % de níquel (0-100)
    uint8 manganesePercent;        // % de manganeso (0-100)
    uint8 lithiumPercent;          // % de litio (0-100)
    uint8 graphitePercent;         // % de grafito (0-100)
    uint8 otherPercent;            // % de otros materiales (0-100)
}

/// @notice Métricas de calidad de la batería
struct QualityMetrics {
    uint256 capacityAh;            // Capacidad en Ah (miliAh)
    uint256 voltageNominalMv;      // Voltaje nominal en mV
    uint256 voltageMaxMv;          // Voltaje máximo en mV
    uint256 energyDensityWhPerKg;  // Densidad energética Wh/kg
    uint256 internalResistanceMohm; // Resistencia interna en mΩ
    uint32 expectedCycles;         // Ciclos de vida esperados
    uint8 defectRate;              // Tasa de defectos en producción (0-100 representa 0-10.0%)
}

/// @notice Huella de carbono desglosada por etapa
struct CarbonFootprint {
    uint256 extractionEmissions;   // kgCO2e de extracción de materias primas
    uint256 cathodeProductionEmissions; // kgCO2e de producción de cátodo
    uint256 cellProductionEmissions; // kgCO2e de producción de célula
    uint256 assemblyEmissions;     // kgCO2e de ensamblaje de pack
    uint256 transportEmissions;    // kgCO2e de transporte (acumulado)
    uint256 totalEmissions;        // kgCO2e total (suma de anteriores)
    bool verified;                 // Verificado por tercero (autoridad o oráculo)
    address verifier;              // Dirección del verificador
}

// ============================================================================
// OEM INTEGRATION - Integración en Vehículo
// ============================================================================

/// @notice Datos de integración de batería en vehículo por OEM
struct OEMData {
    string bin;                    // BIN de la batería
    string vin;                    // VIN del vehículo
    string vehicleModel;           // Modelo del vehículo (ej: "Tesla Model 3")
    uint256 integrationDate;       // Timestamp de integración
    PackConfiguration packConfig;  // Configuración del pack de baterías
    string bmsModel;               // Modelo del BMS (Battery Management System)
    string firmwareVersion;        // Versión de firmware inicial del BMS
    WarrantyTerms warranty;        // Términos de garantía
    string testReportHash;         // Hash IPFS de reporte de test de aceptación
    string saleCountry;            // País de primera venta
    uint256 firstRegistrationDate; // Fecha de primera matriculación
}

/// @notice Configuración del pack de baterías
struct PackConfiguration {
    uint16 numberOfModules;        // Número de módulos en el pack
    uint16 cellsPerModule;         // Células por módulo
    uint16 totalCells;             // Total de células (modules * cells)
    uint256 totalCapacityWh;       // Capacidad total del pack en Wh
    uint256 totalWeightKg;         // Peso total del pack en kg (multiplicado por 1000 para precisión)
    string configuration;          // Configuración (ej: "96s2p" = 96 series, 2 parallel)
}

/// @notice Términos de garantía de la batería
struct WarrantyTerms {
    uint256 durationYears;         // Duración en años
    uint256 durationKm;            // Duración en kilómetros
    uint8 minSOHGuaranteed;        // SOH mínimo garantizado (0-100%)
    string termsHash;              // Hash IPFS de términos completos
}

// ============================================================================
// FIRST LIFE TELEMETRY - Telemetría de Primera Vida
// ============================================================================

/// @notice Datos de telemetría y uso durante primera vida (en vehículo)
/// @dev Actualizados periódicamente por Fleet Operator
struct FirstLifeData {
    string bin;                    // BIN de la batería
    uint256 totalCycles;           // Ciclos totales de carga/descarga
    uint256 totalKm;               // Kilómetros totales recorridos
    uint256 totalOperatingHours;   // Horas totales de operación
    uint8 currentSOH;              // SOH actual (0-100%)
    uint8 currentSOC;              // SOC actual (0-100%)
    TemperatureStats tempStats;    // Estadísticas de temperatura
    ChargingPatterns chargingPatterns; // Patrones de carga
    EventCounters events;          // Contadores de eventos críticos
    uint256 lastUpdateTimestamp;   // Timestamp de última actualización
    uint256 endOfLifeDate;         // Timestamp cuando SOH < 80% (fin primera vida)
}

/// @notice Estadísticas de temperatura de operación
struct TemperatureStats {
    int16 minTempCelsius;          // Temperatura mínima registrada (°C * 10 para decimal)
    int16 maxTempCelsius;          // Temperatura máxima registrada (°C * 10)
    int16 avgTempCelsius;          // Temperatura promedio (°C * 10)
}

/// @notice Patrones de carga observados
struct ChargingPatterns {
    uint8 fastChargeDCPercent;     // % de veces carga rápida DC (0-100)
    uint8 slowChargeACPercent;     // % de veces carga lenta AC (0-100)
    uint16 avgChargePowerKw;       // Potencia promedio de carga en kW
    uint16 avgDepthOfDischarge;    // Profundidad de descarga promedia (0-10000 = 0-100.00%)
    uint16 avgCRate;               // C-rate promedio (multiplicado por 100, ej: 150 = 1.5C)
}

/// @notice Contadores de eventos críticos
struct EventCounters {
    uint32 overchargeEvents;       // Número de sobrecargas detectadas
    uint32 overheatEvents;         // Número de sobrecalentamientos
    uint32 bmsFailures;            // Número de fallos del BMS
    uint32 accidents;              // Número de accidentes registrados
    string maintenanceHash;        // Hash IPFS de historial de mantenimiento
}

// ============================================================================
// SECOND LIFE - Segunda Vida (Aftermarket)
// ============================================================================

/// @notice Registro de batería en segunda vida (aplicaciones aftermarket)
/// @dev Estado: InSecondLife
struct SecondLifeRecord {
    string bin;                    // BIN de la batería
    SecondLifeApplication applicationType; // Tipo de aplicación
    uint256 startDate;             // Timestamp de inicio de segunda vida
    uint8 sohAtStart;              // SOH al inicio de segunda vida (70-80% típicamente)
    uint256 remainingCapacityWh;   // Capacidad restante en Wh
    InstallationDetails installation; // Detalles de instalación
    SecondLifePerformance performance; // Datos de rendimiento
    SecondLifeBenefits benefits;   // Beneficios económicos y ambientales
    string certificationHash;      // Hash IPFS de certificación UL 1974 u equivalente
    uint256 endDate;               // Timestamp de fin de segunda vida (0 si aún activa)
}

/// @notice Tipos de aplicaciones de segunda vida
enum SecondLifeApplication {
    ResidentialStorage,    // Almacenamiento residencial (home battery)
    CommercialStorage,     // Almacenamiento comercial/industrial
    RenewableIntegration,  // Integración con renovables (solar/eólica)
    Microgrid,            // Microgrids y comunidades energéticas
    EVCharging,           // Estaciones de carga EV (buffer storage)
    LightMachinery,       // Maquinaria ligera (carretillas, AGVs)
    Telecom,              // Torres de telecomunicación
    GridServices          // Servicios a la red (peak shaving, frequency regulation)
}

/// @notice Detalles de instalación en segunda vida
struct InstallationDetails {
    string location;               // Ubicación GPS (lat,long)
    address owner;                 // Dirección del propietario aftermarket
    OwnerType ownerType;           // Tipo de propietario
    uint256 installedCapacityWh;   // Capacidad total instalada del sistema (puede incluir múltiples baterías)
    string hardwareModifications;  // Descripción de modificaciones (nueva carcasa, BMS, etc.)
}

/// @notice Tipos de propietarios aftermarket
enum OwnerType {
    Residential,           // Residencial (hogar)
    Commercial,           // Comercial (empresa)
    Utility,              // Utilidad (compañía eléctrica)
    Government,           // Gubernamental
    NGO                   // ONG
}

/// @notice Datos de rendimiento en segunda vida
struct SecondLifePerformance {
    uint256 cyclesInSecondLife;    // Ciclos de carga/descarga en segunda vida
    uint8 currentSOH;              // SOH actual en segunda vida
    uint16 roundTripEfficiency;    // Eficiencia round-trip (0-10000 = 0-100.00%)
    uint256 totalEnergyStoredKwh;  // Total kWh almacenados acumulados
    uint256 lastUpdateTimestamp;   // Última actualización de datos
}

/// @notice Beneficios económicos y ambientales de segunda vida
struct SecondLifeBenefits {
    uint256 costSavingsVsNew;      // Ahorro en EUR vs batería nueva (multiplicado por 100)
    uint256 co2Avoided;            // tCO2e evitadas vs producción nueva (multiplicado por 1000)
    uint256 renewableEnergyStored; // kWh de energía renovable almacenada
    uint256 calculatedDate;        // Timestamp de cálculo de beneficios
}

// ============================================================================
// RECYCLING - Reciclaje y Recuperación de Materiales
// ============================================================================

/// @notice Registro de proceso de reciclaje de batería
/// @dev Estado: InRecycling o Recycled
struct RecyclingRecord {
    string bin;                    // BIN de la batería
    address recycler;              // Dirección del Recycler
    uint256 receptionDate;         // Timestamp de recepción
    uint8 sohAtReception;          // SOH al recibir
    uint256 totalWeightKg;         // Peso total de la batería (kg * 1000)
    RecyclingMethod method;        // Método de reciclaje utilizado
    uint256 processStartDate;      // Timestamp de inicio de proceso
    uint256 processEndDate;        // Timestamp de fin de proceso (0 si en curso)
    MaterialRecovery[] materialsRecovered; // Array de materiales recuperados
    RecyclingImpact impact;        // Impacto ambiental del proceso
    string certificationHash;      // Hash IPFS de certificados de reciclaje
    bool cycleClosed;              // True si material ya fue devuelto a supply chain
}

/// @notice Métodos de reciclaje
enum RecyclingMethod {
    Pyrometallurgical,     // Pirometalúrgico (fundición a altas temperaturas)
    Hydrometallurgical,    // Hidrometalúrgico (lixiviación química)
    DirectRecycling,       // Reciclaje directo (recuperación de cátodo intacto)
    Hybrid                 // Híbrido (combinación de métodos)
}

/// @notice Recuperación de un material específico
struct MaterialRecovery {
    string materialType;           // "Lithium", "Cobalt", "Nickel", "Manganese", "Copper", "Aluminum", "Graphite"
    uint256 quantityRecoveredKg;   // Cantidad recuperada en kg (multiplicado por 1000 para gramos)
    uint256 totalQuantityKg;       // Cantidad total en batería original (kg * 1000)
    uint8 recoveryRate;            // Tasa de recuperación (0-100%)
    uint8 purity;                  // Pureza del material recuperado (0-100%)
    string destination;            // Destino del material ("NewBattery", "Industrial", "Resale")
}

/// @notice Impacto ambiental del proceso de reciclaje
struct RecyclingImpact {
    uint256 energyConsumedKwh;     // Energía consumida en el proceso (kWh)
    uint256 emissionsKgCO2e;       // Emisiones del proceso (kg CO2e)
    uint256 waterConsumedLiters;   // Agua consumida (litros)
    uint256 wasteGeneratedKg;      // Residuos no reciclables generados (kg * 1000)
    string wasteDisposalMethod;    // Método de disposición de residuos
}

// ============================================================================
// TRANSFER TRACKING - Trazabilidad de Transferencias
// ============================================================================

/// @notice Registro de transferencia de batería entre actores
/// @dev Sigue el flujo: RawMaterialSupplier → ComponentManufacturer → OEM → FleetOperator → AftermarketUser → Recycler
struct TransferRecord {
    uint256 transferId;            // ID único de transferencia
    string bin;                    // BIN de la batería transferida (o batchId si es material)
    TransferType transferType;     // Tipo de transferencia
    address from;                  // Actor que envía
    address to;                    // Actor que recibe
    Role fromRole;                 // Rol del emisor
    Role toRole;                   // Rol del receptor
    uint256 initiatedDate;         // Timestamp de inicio de transferencia
    uint256 completedDate;         // Timestamp de aprobación (0 si pendiente/rechazada)
    TransferStatus status;         // Estado de la transferencia
    string metadataHash;           // Hash IPFS de metadata adicional (documentos, reportes)
    string rejectionReason;        // Razón de rechazo (si aplica)
}

/// @notice Tipos de transferencias
enum TransferType {
    Material,              // Transferencia de materia prima (batch)
    Component,             // Transferencia de componente/batería
    Vehicle,               // Transferencia de vehículo completo
    SecondLifeUnit,        // Transferencia de unidad de segunda vida
    RecyclingTransfer      // Transferencia a reciclaje
}

/// @notice Estados de transferencia
enum TransferStatus {
    Pending,               // Pendiente de aprobación por receptor
    Approved,              // Aprobada y completada
    Rejected,              // Rechazada por receptor
    Cancelled              // Cancelada por emisor
}

/// @notice Roles de actores en el sistema
enum Role {
    None,                  // Sin rol asignado
    Admin,                 // Administrador del sistema
    RawMaterialSupplier,   // Proveedor de materias primas
    ComponentManufacturer, // Fabricante de componentes
    OEM,                   // Ensamblador de vehículos
    FleetOperator,         // Operador de flota / primer propietario
    AftermarketUser,       // Usuario de segunda vida
    Recycler,              // Reciclador
    RegulatoryAuthority    // Autoridad reguladora
}

// ============================================================================
// USER MANAGEMENT - Gestión de Usuarios
// ============================================================================

/// @notice Información de usuario en el sistema
struct User {
    address userAddress;           // Dirección Ethereum del usuario
    Role role;                     // Rol asignado
    UserStatus status;             // Estado de la solicitud de rol
    string companyName;            // Nombre de la empresa/organización
    string companyRegistration;    // Número de registro de la empresa
    string location;               // Ubicación (país, ciudad)
    uint256 registrationDate;      // Timestamp de registro
    uint256 approvalDate;          // Timestamp de aprobación (0 si no aprobado)
    address approvedBy;            // Dirección del admin que aprobó
    string certificationHash;      // Hash IPFS de documentos de certificación
}

/// @notice Estados de usuario en el sistema
enum UserStatus {
    Pending,               // Solicitud pendiente de aprobación
    Approved,              // Aprobado y activo
    Rejected,              // Solicitud rechazada
    Suspended,             // Suspendido temporalmente
    Revoked                // Rol revocado permanentemente
}

// ============================================================================
// REGULATORY COMPLIANCE - Cumplimiento Regulatorio
// ============================================================================

/// @notice Verificación de cumplimiento regulatorio
struct ComplianceVerification {
    string bin;                    // BIN de la batería
    ComplianceType complianceType; // Tipo de cumplimiento
    bool verified;                 // Estado de verificación
    address verifier;              // Dirección de la autoridad que verificó
    uint256 verificationDate;      // Timestamp de verificación
    string reportHash;             // Hash IPFS de reporte de verificación
    string notes;                  // Notas adicionales
}

/// @notice Tipos de cumplimiento regulatorio
enum ComplianceType {
    CarbonFootprint,       // Verificación de huella de carbono
    EthicalSourcing,       // Verificación de sourcing ético
    RecycledContent,       // Verificación de contenido reciclado
    RecoveryRates,         // Verificación de tasas de recuperación en reciclaje
    DueDiligence,          // Verificación de due diligence completa
    BatteryPassport        // Verificación de pasaporte completo
}
```

---

## 🛡️ Seguridad de Smart Contracts - Prevención de Vulnerabilidades

### **Vulnerabilidades Críticas a Prevenir**

Este proyecto debe implementar protecciones contra las vulnerabilidades más comunes en smart contracts. Cada contrato debe pasar tests específicos para estas vulnerabilidades.

#### **1. Reentrancy Attacks**
```solidity
// ❌ VULNERABLE
function transferBattery(string memory _bin, address _to) external {
    // External call ANTES de actualizar estado
    (bool success,) = _to.call{value: msg.value}("");
    batteryOwners[_bin] = _to; // Estado actualizado DESPUÉS
}

// ✅ PROTEGIDO (Checks-Effects-Interactions Pattern)
function transferBattery(string memory _bin, address _to) external nonReentrant {
    require(batteryOwners[_bin] == msg.sender, "Not owner");
    
    // 1. CHECKS: Validaciones
    require(_to != address(0), "Invalid address");
    
    // 2. EFFECTS: Actualizar estado PRIMERO
    batteryOwners[_bin] = _to;
    emit BatteryTransferred(_bin, msg.sender, _to);
    
    // 3. INTERACTIONS: External calls AL FINAL
    if (msg.value > 0) {
        (bool success,) = _to.call{value: msg.value}("");
        require(success, "Transfer failed");
    }
}
```

**Test Foundry para Reentrancy**:
```solidity
function testReentrancyProtection() public {
    // Deploy malicious contract que intenta reentrancy
    MaliciousReceiver attacker = new MaliciousReceiver(batteryRegistry);
    
    // Setup batería
    vm.prank(manufacturer);
    batteryRegistry.registerBattery("TEST-001", ...);
    
    // Transferir a atacante
    vm.prank(manufacturer);
    batteryRegistry.transferBattery("TEST-001", address(attacker));
    
    // Atacante intenta reentrancy en fallback
    vm.expectRevert("ReentrancyGuard: reentrant call");
    attacker.attack();
}
```

#### **2. Integer Overflow/Underflow**
```solidity
// ❌ VULNERABLE (Solidity < 0.8.0)
uint256 totalCycles = 1000000;
totalCycles += 1; // Podría hacer overflow

// ✅ PROTEGIDO (Solidity >= 0.8.0 tiene checks automáticos)
// Usar Solidity ^0.8.20
pragma solidity ^0.8.20;

uint256 totalCycles = type(uint256).max;
totalCycles += 1; // Revert automático con "Arithmetic overflow"

// Para operaciones intencionales que pueden overflow, usar unchecked
function incrementCyclesUnsafe(uint256 _cycles) internal pure returns (uint256) {
    unchecked {
        return _cycles + 1; // Sin checks, usar con EXTREMA precaución
    }
}
```

**Test Foundry para Overflow**:
```solidity
function testOverflowProtection() public {
    vm.prank(fleetOperator);
    batteryRegistry.registerBattery("TEST-001", ...);
    
    // Intentar overflow en totalCycles
    vm.prank(fleetOperator);
    vm.expectRevert(); // Solidity 0.8+ revierte automáticamente
    batteryRegistry.updateCycles("TEST-001", type(uint256).max);
    
    vm.prank(fleetOperator);
    batteryRegistry.updateCycles("TEST-001", type(uint256).max - 1);
    
    vm.prank(fleetOperator);
    vm.expectRevert(); // Overflow al sumar +1
    batteryRegistry.incrementCycles("TEST-001");
}
```

#### **3. Access Control Vulnerabilities**
```solidity
// ❌ VULNERABLE
function approveBattery(string memory _bin) external {
    // Cualquiera puede aprobar!
    batteries[_bin].status = BatteryStatus.Approved;
}

// ✅ PROTEGIDO
function approveBattery(string memory _bin) external onlyRole(REGULATORY_AUTHORITY) {
    require(batteries[_bin].status == BatteryStatus.Pending, "Not pending");
    batteries[_bin].status = BatteryStatus.Approved;
    emit BatteryApproved(_bin, msg.sender);
}

// Usar OpenZeppelin AccessControl
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

contract BatteryRegistry is AccessControlUpgradeable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant RECYCLER_ROLE = keccak256("RECYCLER_ROLE");
    
    modifier onlyManufacturer() {
        require(hasRole(MANUFACTURER_ROLE, msg.sender), "Not manufacturer");
        _;
    }
}
```

**Test Foundry para Access Control**:
```solidity
function testUnauthorizedAccessReverts() public {
    address unauthorized = address(0x999);
    
    vm.prank(unauthorized);
    vm.expectRevert("AccessControl: account 0x999 is missing role MANUFACTURER_ROLE");
    batteryRegistry.registerBattery("TEST-001", ...);
    
    // Solo manufacturer puede registrar
    vm.prank(manufacturer);
    batteryRegistry.registerBattery("TEST-001", ...); // Success
}

function testRoleTransition() public {
    // Solo admin puede asignar roles
    vm.prank(nonAdmin);
    vm.expectRevert();
    roleManager.grantRole(MANUFACTURER_ROLE, manufacturer);
    
    vm.prank(admin);
    roleManager.grantRole(MANUFACTURER_ROLE, manufacturer); // Success
}
```

#### **4. Front-Running / Transaction Ordering**
```solidity
// ❌ VULNERABLE
mapping(string => uint256) public batteryPrices;

function setBatteryPrice(string memory _bin, uint256 _price) external {
    batteryPrices[_bin] = _price;
}

function buyBattery(string memory _bin) external payable {
    uint256 price = batteryPrices[_bin];
    require(msg.value >= price, "Insufficient payment");
    // Compra al precio actual (atacante puede front-run setBatteryPrice)
}

// ✅ PROTEGIDO (Commit-Reveal Scheme)
mapping(bytes32 => uint256) private commitments;

function commitPurchase(bytes32 _commitment) external {
    commitments[_commitment] = block.timestamp;
}

function revealPurchase(string memory _bin, uint256 _maxPrice, bytes32 _salt) external payable {
    bytes32 commitment = keccak256(abi.encodePacked(msg.sender, _bin, _maxPrice, _salt));
    require(commitments[commitment] > 0, "No commitment");
    require(block.timestamp >= commitments[commitment] + 1, "Too early");
    
    uint256 price = batteryPrices[_bin];
    require(price <= _maxPrice, "Price too high");
    require(msg.value >= price, "Insufficient payment");
    
    delete commitments[commitment];
    // Procesar compra
}
```

**Test Foundry para Front-Running**:
```solidity
function testFrontRunningProtection() public {
    // User comitea compra con max price 10 ETH
    bytes32 salt = keccak256("secret");
    bytes32 commitment = keccak256(abi.encodePacked(user, "BAT-001", 10 ether, salt));
    
    vm.prank(user);
    marketplace.commitPurchase(commitment);
    
    // Atacante ve commitment en mempool y intenta subir precio
    vm.prank(attacker);
    marketplace.setBatteryPrice("BAT-001", 15 ether);
    
    // User revela después de 1 bloque
    vm.warp(block.timestamp + 2);
    vm.prank(user);
    vm.expectRevert("Price too high"); // Protegido
    marketplace.revealPurchase{value: 10 ether}("BAT-001", 10 ether, salt);
}
```

#### **5. Denial of Service (DoS)**
```solidity
// ❌ VULNERABLE (Unbounded Loop)
address[] public batteryOwners;

function distributeRewards() external {
    for (uint i = 0; i < batteryOwners.length; i++) {
        // Si array es muy grande, se queda sin gas
        payable(batteryOwners[i]).transfer(1 ether);
    }
}

// ✅ PROTEGIDO (Pull over Push Pattern)
mapping(address => uint256) public pendingRewards;

function calculateReward(address _owner) external onlyAdmin {
    pendingRewards[_owner] += 1 ether;
    emit RewardCalculated(_owner, 1 ether);
}

function claimReward() external {
    uint256 amount = pendingRewards[msg.sender];
    require(amount > 0, "No rewards");
    
    pendingRewards[msg.sender] = 0; // Protección contra reentrancy
    
    (bool success,) = msg.sender.call{value: amount}("");
    require(success, "Transfer failed");
    
    emit RewardClaimed(msg.sender, amount);
}
```

**Test Foundry para DoS**:
```solidity
function testDoSPrevention() public {
    // Registrar 1000 baterías
    for (uint i = 0; i < 1000; i++) {
        vm.prank(manufacturer);
        batteryRegistry.registerBattery(string(abi.encodePacked("BAT-", i)), ...);
    }
    
    // Calcular rewards NO debe fallar por gas
    vm.prank(admin);
    uint256 gasBefore = gasleft();
    batteryRegistry.calculateRewardsForAll();
    uint256 gasUsed = gasBefore - gasleft();
    
    // Verificar que usa gas razonable (< 10M)
    assertLt(gasUsed, 10_000_000);
    
    // Cada usuario puede reclamar individualmente
    vm.prank(owner1);
    batteryRegistry.claimReward();
}
```

#### **6. Timestamp Manipulation**
```solidity
// ❌ VULNERABLE
function checkWarranty(string memory _bin) external view returns (bool) {
    Battery memory battery = batteries[_bin];
    // Minero puede manipular block.timestamp ±15 segundos
    return block.timestamp < battery.warrantyExpiry;
}

// ✅ PROTEGIDO (No usar timestamp para lógica crítica)
function checkWarranty(string memory _bin) external view returns (bool) {
    Battery memory battery = batteries[_bin];
    // Usar block.number en vez de timestamp cuando sea posible
    return block.number < battery.warrantyExpiryBlock;
}

// Si DEBES usar timestamp, ten tolerancia
function isWithinGracePeriod(string memory _bin) external view returns (bool) {
    Battery memory battery = batteries[_bin];
    uint256 gracePeriod = 7 days; // Tolerancia de 7 días, no 15 segundos
    return block.timestamp < battery.warrantyExpiry + gracePeriod;
}
```

**Test Foundry para Timestamp**:
```solidity
function testTimestampManipulation() public {
    vm.prank(manufacturer);
    batteryRegistry.registerBattery("BAT-001", ...);
    
    // Simular timestamp futuro (minero malicioso)
    vm.warp(block.timestamp + 365 days - 10 seconds);
    
    // Warranty debería estar expirada
    assertTrue(batteryRegistry.checkWarranty("BAT-001"));
    
    // Pero con grace period, aún válida
    vm.warp(block.timestamp + 20 seconds);
    assertFalse(batteryRegistry.checkWarranty("BAT-001"));
}
```

#### **7. Unchecked External Calls**
```solidity
// ❌ VULNERABLE
function notifyRecipient(address _to, string memory _bin) external {
    _to.call(abi.encodeWithSignature("onBatteryReceived(string)", _bin));
    // Si falla, continúa silenciosamente
}

// ✅ PROTEGIDO
function notifyRecipient(address _to, string memory _bin) external {
    (bool success, bytes memory data) = _to.call(
        abi.encodeWithSignature("onBatteryReceived(string)", _bin)
    );
    
    if (!success) {
        // Manejar el error apropiadamente
        emit NotificationFailed(_to, _bin);
        // Opcional: revert si es crítico
        revert("Notification failed");
    }
}
```

**Test Foundry para External Calls**:
```solidity
function testFailedExternalCall() public {
    // Deploy contract que siempre revierte
    FailingReceiver failing = new FailingReceiver();
    
    vm.prank(manufacturer);
    batteryRegistry.registerBattery("BAT-001", ...);
    
    vm.prank(manufacturer);
    vm.expectRevert("Notification failed");
    batteryRegistry.transferBattery("BAT-001", address(failing));
}
```

#### **8. Delegatecall to Untrusted Callee**
```solidity
// ❌ VULNERABLE
function execute(address _target, bytes memory _data) external {
    // Delegatecall ejecuta código en contexto de este contrato
    (bool success,) = _target.delegatecall(_data);
    require(success, "Delegatecall failed");
}

// ✅ PROTEGIDO (Evitar delegatecall o whitelist estricta)
mapping(address => bool) public trustedImplementations;

function execute(address _target, bytes memory _data) external onlyAdmin {
    require(trustedImplementations[_target], "Untrusted implementation");
    (bool success,) = _target.delegatecall(_data);
    require(success, "Delegatecall failed");
}

// Mejor: Usar patrón Proxy transparente de OpenZeppelin
```

**Test Foundry para Delegatecall**:
```solidity
function testUntrustedDelegatecall() public {
    address malicious = address(new MaliciousImplementation());
    
    vm.prank(admin);
    vm.expectRevert("Untrusted implementation");
    batteryRegistry.execute(malicious, abi.encodeWithSignature("destroy()"));
    
    // Agregar a whitelist
    vm.prank(admin);
    batteryRegistry.addTrustedImplementation(trustedImpl);
    
    // Ahora puede ejecutar
    vm.prank(admin);
    batteryRegistry.execute(trustedImpl, abi.encodeWithSignature("upgrade()"));
}
```

### **Testing de Seguridad con Foundry**

#### **Fuzzing (Property-Based Testing)**
```solidity
// Test que ejecuta miles de veces con inputs aleatorios
function testFuzz_SOHNeverExceeds100(uint8 _soh) public {
    vm.assume(_soh <= 100); // Asumimos input válido
    
    vm.prank(manufacturer);
    batteryRegistry.registerBattery("BAT-FUZZ", address(0), _soh, ...);
    
    Battery memory bat = batteryRegistry.getBattery("BAT-FUZZ");
    assertLe(bat.sohCurrent, 100, "SOH exceeded 100");
}

function testFuzz_TransferValidation(address _from, address _to, string memory _bin) public {
    // Foundry probará miles de combinaciones de from/to/bin
    vm.assume(_from != address(0));
    vm.assume(_to != address(0));
    vm.assume(_from != _to);
    
    // Setup
    vm.prank(_from);
    batteryRegistry.registerBattery(_bin, ...);
    
    // Transfer debe siempre actualizar ownership correctamente
    vm.prank(_from);
    batteryRegistry.transferBattery(_bin, _to);
    
    assertEq(batteryRegistry.ownerOf(_bin), _to);
}
```

#### **Invariant Testing**
```solidity
// Invariantes que SIEMPRE deben ser true
contract InvariantBatteryRegistry is Test {
    BatteryRegistry registry;
    
    function setUp() public {
        registry = new BatteryRegistry();
        targetContract(address(registry));
    }
    
    // Este invariante se verifica después de CADA acción
    function invariant_TotalSupplyMatchesOwnership() public {
        uint256 totalSupply = registry.totalSupply();
        uint256 countedOwnership = 0;
        
        for (uint256 i = 0; i < totalSupply; i++) {
            if (registry.ownerOf(i) != address(0)) {
                countedOwnership++;
            }
        }
        
        assertEq(totalSupply, countedOwnership, "Supply mismatch");
    }
    
    function invariant_SOHNeverIncreases() public {
        // SOH solo puede decrecer o mantenerse, nunca aumentar
        // Foundry verifica esto después de cada transacción aleatoria
    }
}
```

#### **Coverage Testing**
```bash
# Ejecutar tests con coverage
forge coverage

# Generar reporte HTML
forge coverage --report lcov
genhtml lcov.info -o coverage/

# Objetivo: >95% coverage en todos los contratos
```

### **Checklist de Seguridad Pre-Deployment**

- [ ] ✅ Todos los contratos usan Solidity ^0.8.20 (protección overflow)
- [ ] ✅ OpenZeppelin ReentrancyGuard en funciones críticas
- [ ] ✅ OpenZeppelin AccessControl para todos los roles
- [ ] ✅ Checks-Effects-Interactions pattern en todas las funciones
- [ ] ✅ Pull over Push pattern para transferencias de valor
- [ ] ✅ No loops sin límite (bounded iterations)
- [ ] ✅ Validación de todos los inputs (`require` statements)
- [ ] ✅ Todos los `call`, `delegatecall` tienen manejo de errores
- [ ] ✅ No uso de `tx.origin` (usar `msg.sender`)
- [ ] ✅ Events emitidos para todas las acciones críticas
- [ ] ✅ Tests de fuzzing para funciones críticas
- [ ] ✅ Invariant tests para propiedades globales
- [ ] ✅ Coverage >95% en todos los contratos
- [ ] ✅ Slither sin errores críticos
- [ ] ✅ Análisis con Mythril completado
- [ ] ✅ Documentación NatSpec completa
- [ ] ✅ Upgrade strategy definida (UUPS Proxy)
- [ ] ✅ Circuit breakers / pause functionality implementada
- [ ] ✅ Timelock en funciones administrativas críticas

---

## 🧪 Estrategia de Testing Completa

### **1. Testing de Smart Contracts (Foundry)**

#### **Estructura de Tests**
```
sc/test/
├── unit/                          # Tests unitarios por contrato
│   ├── BatteryRegistry.t.sol
│   ├── RoleManager.t.sol
│   ├── SupplyChainTracker.t.sol
│   ├── DataVault.t.sol
│   ├── CarbonFootprint.t.sol
│   ├── SecondLifeManager.t.sol
│   └── RecyclingManager.t.sol
├── integration/                   # Tests de integración entre contratos
│   ├── FullSupplyChain.t.sol     # Flujo completo RawMaterial → Recycler
│   ├── RoleWorkflows.t.sol       # Workflows por rol
│   └── TransferFlows.t.sol       # Tests de transferencias complejas
├── invariant/                     # Invariant/property-based tests
│   ├── BatteryInvariants.t.sol
│   └── SupplyChainInvariants.t.sol
├── fuzz/                          # Fuzzing tests
│   ├── FuzzBattery.t.sol
│   └── FuzzTransfers.t.sol
└── security/                      # Tests específicos de seguridad
    ├── Reentrancy.t.sol
    ├── AccessControl.t.sol
    ├── Overflow.t.sol
    └── FrontRunning.t.sol
```

#### **Ejemplo de Test Unitario**
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/BatteryRegistry.sol";

contract BatteryRegistryTest is Test {
    BatteryRegistry public registry;
    
    address admin = address(0x1);
    address manufacturer = address(0x2);
    address oem = address(0x3);
    
    function setUp() public {
        vm.prank(admin);
        registry = new BatteryRegistry();
        
        vm.prank(admin);
        registry.grantRole(MANUFACTURER_ROLE, manufacturer);
    }
    
    function test_RegisterBattery() public {
        string memory bin = "NV-2024-001";
        
        vm.prank(manufacturer);
        registry.registerBattery(bin, "NMC811", 75000, ...);
        
        Battery memory bat = registry.getBattery(bin);
        assertEq(bat.bin, bin);
        assertEq(bat.chemistry, "NMC811");
        assertEq(bat.capacityWh, 75000);
        assertEq(bat.sohCurrent, 100);
    }
    
    function testFail_UnauthorizedRegister() public {
        // Usuario sin rol no puede registrar
        vm.prank(address(0x999));
        registry.registerBattery("BAT-001", "NMC", 50000, ...);
    }
    
    function test_UpdateSOH() public {
        vm.prank(manufacturer);
        registry.registerBattery("BAT-001", "LFP", 60000, ...);
        
        vm.prank(manufacturer);
        registry.updateSOH("BAT-001", 95);
        
        Battery memory bat = registry.getBattery("BAT-001");
        assertEq(bat.sohCurrent, 95);
    }
    
    function testFuzz_SOHBounds(uint8 _soh) public {
        vm.assume(_soh <= 100);
        
        vm.prank(manufacturer);
        registry.registerBattery("FUZZ-BAT", "NMC", 70000, ...);
        
        vm.prank(manufacturer);
        registry.updateSOH("FUZZ-BAT", _soh);
        
        Battery memory bat = registry.getBattery("FUZZ-BAT");
        assertLe(bat.sohCurrent, 100);
        assertGe(bat.sohCurrent, 0);
    }
}
```

#### **Ejemplo de Test de Integración**
```solidity
contract FullSupplyChainTest is Test {
    BatteryRegistry public batteryRegistry;
    RoleManager public roleManager;
    SupplyChainTracker public tracker;
    SecondLifeManager public secondLife;
    RecyclingManager public recycling;
    
    address supplier = address(0x1);
    address manufacturer = address(0x2);
    address oem = address(0x3);
    address fleetOp = address(0x4);
    address aftermarket = address(0x5);
    address recycler = address(0x6);
    
    function setUp() public {
        // Deploy todos los contratos
        // Asignar roles
        // ...
    }
    
    function test_CompleteLifecycle() public {
        // 1. Raw Material Supplier registra material
        vm.prank(supplier);
        bytes32 batchId = tracker.registerMaterial("Lithium", "Chile", 1000);
        
        // 2. Component Manufacturer recibe material y crea batería
        vm.prank(manufacturer);
        tracker.receiveTransfer(batchId);
        
        vm.prank(manufacturer);
        string memory bin = "FULL-2024-001";
        batteryRegistry.registerBattery(bin, batchId, "NMC811", 75000);
        
        // 3. OEM integra batería en vehículo
        vm.prank(manufacturer);
        tracker.transferToOEM(bin, oem);
        
        vm.prank(oem);
        tracker.approveTransfer();
        batteryRegistry.integrateInVehicle(bin, "VIN123456");
        
        // 4. Fleet Operator usa batería (primera vida)
        vm.prank(oem);
        tracker.transferToFleet(bin, fleetOp);
        
        vm.prank(fleetOp);
        tracker.approveTransfer();
        
        // Simular uso: 1000 ciclos, SOH baja a 75%
        vm.prank(fleetOp);
        for (uint i = 0; i < 1000; i++) {
            batteryRegistry.incrementCycles(bin);
        }
        batteryRegistry.updateSOH(bin, 75);
        
        // 5. Aftermarket User inicia segunda vida
        vm.prank(fleetOp);
        tracker.transferToAftermarket(bin, aftermarket);
        
        vm.prank(aftermarket);
        tracker.approveTransfer();
        secondLife.startSecondLife(
            bin, 
            SecondLifeApplication.ResidentialStorage,
            "40.7128,-74.0060" // GPS
        );
        
        // Simular uso segunda vida: 500 ciclos, SOH baja a 45%
        vm.warp(block.timestamp + 5 years);
        vm.prank(aftermarket);
        batteryRegistry.updateSOH(bin, 45);
        
        // 6. Recycler recicla batería
        vm.prank(aftermarket);
        tracker.transferToRecycler(bin, recycler);
        
        vm.prank(recycler);
        tracker.approveTransfer();
        recycling.startRecycling(bin, RecyclingMethod.Hydrometallurgical);
        
        // Registrar materiales recuperados
        vm.prank(recycler);
        recycling.recordMaterialRecovery(bin, "Lithium", 5000, 4000); // 5kg total, 4kg recuperado = 80%
        recycling.recordMaterialRecovery(bin, "Cobalt", 3000, 2700); // 90% recovery
        recycling.recordMaterialRecovery(bin, "Nickel", 7000, 6300); // 90% recovery
        
        // 7. Verificar estado final
        Battery memory bat = batteryRegistry.getBattery(bin);
        assertEq(uint(bat.status), uint(BatteryStatus.Recycled));
        
        RecyclingRecord memory rec = recycling.getRecord(bin);
        assertEq(rec.recoveryRates["Lithium"], 80);
        assertEq(rec.recoveryRates["Cobalt"], 90);
        
        // Verificar que cumple con metas UE 2031
        assertGe(rec.recoveryRates["Lithium"], 80, "Lithium recovery < 80%");
        assertGe(rec.recoveryRates["Cobalt"], 90, "Cobalt recovery < 90%");
        assertGe(rec.recoveryRates["Nickel"], 90, "Nickel recovery < 90%");
    }
}
```

#### **Ejecución de Tests**
```bash
# Tests unitarios
forge test --match-path test/unit/**

# Tests de integración
forge test --match-path test/integration/**

# Tests de seguridad
forge test --match-path test/security/**

# Fuzzing (100k runs)
forge test --fuzz-runs 100000

# Invariant testing
forge test --match-path test/invariant/**

# Coverage report
forge coverage --report lcov

# Gas report
forge test --gas-report

# Todos los tests con verbosidad
forge test -vvv
```

### **2. Testing E2E (Playwright)**

#### **Estructura de Tests E2E**
```
web/e2e/
├── fixtures/                      # Setup y helpers
│   ├── blockchain.ts             # Setup Anvil, deploy contracts
│   ├── wallets.ts                # Setup wallets de prueba
│   └── testData.ts               # Datos de prueba
├── specs/                         # Tests por funcionalidad
│   ├── auth.spec.ts              # Conexión MetaMask, registro
│   ├── supplier.spec.ts          # Flujo Raw Material Supplier
│   ├── manufacturer.spec.ts      # Flujo Component Manufacturer
│   ├── oem.spec.ts               # Flujo OEM
│   ├── fleetOperator.spec.ts     # Flujo Fleet Operator
│   ├── aftermarket.spec.ts       # Flujo Aftermarket User
│   ├── recycler.spec.ts          # Flujo Recycler
│   ├── authority.spec.ts         # Flujo Regulatory Authority
│   ├── passport.spec.ts          # Battery Passport viewer
│   ├── qr.spec.ts                # QR code scan
│   └── fullFlow.spec.ts          # Flujo completo end-to-end
├── utils/                         # Utilidades
│   ├── metamask.ts               # Interacciones con MetaMask
│   ├── contracts.ts              # Helpers para llamar contratos
│   └── assertions.ts             # Assertions custom
└── playwright.config.ts           # Configuración Playwright
```

#### **Configuración de Playwright**
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/specs',
  fullyParallel: false, // Tests secuenciales (blockchain state)
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Un worker para mantener estado consistente
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],
  use: {
    baseURL: 'http://localhost:5173', // Vite dev server
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'] },
    },
  ],
  
  webServer: [
    {
      command: 'anvil --port 8545',
      port: 8545,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run dev',
      port: 5173,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
```

#### **Ejemplo de Test E2E**
```typescript
// e2e/specs/fullFlow.spec.ts
import { test, expect } from '@playwright/test';
import { setupBlockchain, deployContracts } from '../fixtures/blockchain';
import { connectMetaMask, switchAccount } from '../utils/metamask';
import { getContract } from '../utils/contracts';

test.describe('Full Supply Chain Flow', () => {
  let contracts: any;
  let wallets: any;
  
  test.beforeAll(async () => {
    // Deploy contracts en Anvil
    const deployment = await deployContracts();
    contracts = deployment.contracts;
    wallets = deployment.wallets;
  });
  
  test('Complete battery lifecycle from supplier to recycler', async ({ page, context }) => {
    // ============================================
    // 1. RAW MATERIAL SUPPLIER
    // ============================================
    await test.step('Supplier registers material', async () => {
      await page.goto('/');
      
      // Conectar MetaMask con cuenta de supplier
      await connectMetaMask(page, wallets.supplier.privateKey);
      
      // Navegar a panel de supplier
      await page.click('text=Dashboard');
      await expect(page.locator('h1')).toContainText('Raw Material Supplier');
      
      // Registrar nuevo batch de litio
      await page.click('button:has-text("Register Material")');
      await page.fill('input[name="materialType"]', 'Lithium');
      await page.fill('input[name="origin"]', 'Chile');
      await page.fill('input[name="quantityKg"]', '1000');
      await page.fill('input[name="carbonFootprint"]', '500');
      
      // Upload certificado ético
      await page.setInputFiles('input[type="file"]', 'test-data/ethical-cert.pdf');
      
      await page.click('button:has-text("Submit")');
      
      // Verificar transacción exitosa
      await expect(page.locator('.toast-success')).toContainText('Material registered');
      
      // Verificar en tabla
      await expect(page.locator('table tbody tr').first()).toContainText('Lithium');
    });
    
    // ============================================
    // 2. COMPONENT MANUFACTURER
    // ============================================
    await test.step('Manufacturer receives material and creates battery', async () => {
      // Cambiar cuenta a manufacturer
      await switchAccount(page, wallets.manufacturer.privateKey);
      await page.reload();
      
      await page.click('text=Dashboard');
      await expect(page.locator('h1')).toContainText('Component Manufacturer');
      
      // Ver materiales pendientes
      await page.click('text=Pending Transfers');
      await page.click('button:has-text("Accept")'); // Aceptar transferencia de litio
      
      await expect(page.locator('.toast-success')).toContainText('Transfer accepted');
      
      // Crear nueva batería
      await page.click('text=Register Battery');
      await page.fill('input[name="bin"]', 'TEST-E2E-001');
      await page.selectOption('select[name="chemistry"]', 'NMC811');
      await page.fill('input[name="capacityWh"]', '75000');
      
      // Seleccionar materiales upstream
      await page.check('input[value="lithium-batch-1"]');
      
      await page.click('button:has-text("Create Battery")');
      
      await expect(page.locator('.toast-success')).toContainText('Battery registered');
    });
    
    // ============================================
    // 3. OEM
    // ============================================
    await test.step('OEM integrates battery in vehicle', async () => {
      await switchAccount(page, wallets.oem.privateKey);
      await page.reload();
      
      await page.click('text=Pending Transfers');
      await page.click('button:has-text("Accept")'); // Aceptar batería
      
      // Integrar en vehículo
      await page.click('text=Integrate Battery');
      await page.fill('input[name="bin"]', 'TEST-E2E-001');
      await page.fill('input[name="vin"]', 'VIN-E2E-123456');
      await page.fill('input[name="vehicleModel"]', 'Tesla Model 3');
      
      await page.click('button:has-text("Integrate")');
      
      await expect(page.locator('.toast-success')).toContainText('Battery integrated');
    });
    
    // ============================================
    // 4. FLEET OPERATOR (Primera Vida)
    // ============================================
    await test.step('Fleet operator uses battery', async () => {
      await switchAccount(page, wallets.fleetOperator.privateKey);
      await page.reload();
      
      await page.click('text=Pending Transfers');
      await page.click('button:has-text("Accept")');
      
      // Ver dashboard de batería
      await page.click('text=TEST-E2E-001');
      
      // Verificar SOH inicial
      await expect(page.locator('.soh-value')).toContainText('100%');
      
      // Simular telemetría (actualizar SOH después de uso)
      await page.click('button:has-text("Update Telemetry")');
      await page.fill('input[name="totalCycles"]', '1000');
      await page.fill('input[name="soh"]', '75');
      await page.fill('input[name="totalKm"]', '150000');
      
      await page.click('button:has-text("Update")');
      
      await expect(page.locator('.soh-value')).toContainText('75%');
      await expect(page.locator('.status-badge')).toContainText('End of First Life');
    });
    
    // ============================================
    // 5. AFTERMARKET USER (Segunda Vida)
    // ============================================
    await test.step('Aftermarket user repurposes battery', async () => {
      await switchAccount(page, wallets.aftermarket.privateKey);
      await page.reload();
      
      await page.click('text=Pending Transfers');
      await page.click('button:has-text("Accept")');
      
      // Iniciar segunda vida
      await page.click('text=Start Second Life');
      await page.selectOption('select[name="applicationType"]', 'ResidentialStorage');
      await page.fill('input[name="location"]', '40.7128,-74.0060');
      
      // Upload certificación UL 1974
      await page.setInputFiles('input[type="file"]', 'test-data/ul-cert.pdf');
      
      await page.click('button:has-text("Submit")');
      
      await expect(page.locator('.toast-success')).toContainText('Second life started');
      await expect(page.locator('.status-badge')).toContainText('In Second Life');
      
      // Simular uso en segunda vida
      await page.click('button:has-text("Update Performance")');
      await page.fill('input[name="cyclesInSecondLife"]', '500');
      await page.fill('input[name="soh"]', '45');
      
      await page.click('button:has-text("Update")');
      
      await expect(page.locator('.soh-value')).toContainText('45%');
    });
    
    // ============================================
    // 6. RECYCLER
    // ============================================
    await test.step('Recycler processes battery', async () => {
      await switchAccount(page, wallets.recycler.privateKey);
      await page.reload();
      
      await page.click('text=Pending Transfers');
      await page.click('button:has-text("Accept")');
      
      // Iniciar reciclaje
      await page.click('text=Start Recycling');
      await page.selectOption('select[name="method"]', 'Hydrometallurgical');
      
      await page.click('button:has-text("Start Process")');
      
      // Registrar materiales recuperados
      await page.click('text=Record Recovery');
      
      await page.fill('input[name="lithium-recovered"]', '4000'); // 4kg de 5kg = 80%
      await page.fill('input[name="cobalt-recovered"]', '2700'); // 2.7kg de 3kg = 90%
      await page.fill('input[name="nickel-recovered"]', '6300'); // 6.3kg de 7kg = 90%
      
      await page.click('button:has-text("Submit")');
      
      await expect(page.locator('.toast-success')).toContainText('Recovery recorded');
      
      // Verificar tasas de recuperación
      await expect(page.locator('.recovery-lithium')).toContainText('80%');
      await expect(page.locator('.recovery-cobalt')).toContainText('90%');
      
      // Verificar cumplimiento metas UE
      await expect(page.locator('.compliance-badge')).toContainText('EU Compliant');
    });
    
    // ============================================
    // 7. BATTERY PASSPORT VIEWER (Público)
    // ============================================
    await test.step('View complete battery passport', async () => {
      // Ir a página pública de pasaporte (sin wallet)
      await page.goto('/passport/TEST-E2E-001');
      
      // Verificar datos básicos
      await expect(page.locator('.bin-value')).toContainText('TEST-E2E-001');
      await expect(page.locator('.vin-value')).toContainText('VIN-E2E-123456');
      await expect(page.locator('.chemistry-value')).toContainText('NMC811');
      
      // Verificar supply chain graph
      await expect(page.locator('.supply-chain-node')).toHaveCount(6); // 6 actores
      
      // Verificar huella de carbono
      await expect(page.locator('.total-carbon')).toBeVisible();
      
      // Verificar timeline
      await expect(page.locator('.timeline-event')).toHaveCount(7); // 7 eventos principales
      
      // Verificar certificaciones
      await expect(page.locator('.certification-item')).toHaveCount(2); // Ético + UL 1974
      
      // Verificar mapa con ubicaciones
      await expect(page.locator('.leaflet-container')).toBeVisible();
      
      // Verificar datos de segunda vida
      await expect(page.locator('.second-life-section')).toBeVisible();
      await expect(page.locator('.application-type')).toContainText('Residential Storage');
      
      // Verificar datos de reciclaje
      await expect(page.locator('.recycling-section')).toBeVisible();
      await expect(page.locator('.recovery-rate-lithium')).toContainText('80%');
    });
  });
  
  test('QR code scan and passport access', async ({ page }) => {
    await page.goto('/scan');
    
    // Simular escaneo de QR (en real usaría cámara)
    await page.evaluate(() => {
      window.postMessage({
        type: 'QR_SCANNED',
        data: '/passport/TEST-E2E-001'
      }, '*');
    });
    
    // Debe redirigir a passport
    await expect(page).toHaveURL(/.*passport\/TEST-E2E-001/);
    await expect(page.locator('.bin-value')).toContainText('TEST-E2E-001');
  });
});
```

#### **Ejecución de Tests E2E**
```bash
# Instalar Playwright
npm install -D @playwright/test
npx playwright install

# Ejecutar todos los tests
npx playwright test

# Ejecutar tests específicos
npx playwright test fullFlow

# Modo debug
npx playwright test --debug

# Modo headed (ver navegador)
npx playwright test --headed

# Generar reporte
npx playwright show-report

# Tests solo en Chrome
npx playwright test --project=chromium

# Tests en paralelo (cuidado con blockchain state)
npx playwright test --workers=1
```

### **3. Coverage y Reportes**

#### **Smart Contract Coverage**
```bash
# Generar coverage
forge coverage --report lcov

# Convertir a HTML
genhtml lcov.info --output-directory coverage/html

# Ver reporte
open coverage/html/index.html

# Coverage por contrato
forge coverage --report summary
```

#### **E2E Coverage**
```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    coverage: {
      enabled: true,
      exclude: ['node_modules/**', 'e2e/**'],
    },
  },
});
```

```bash
# Ejecutar con coverage
npx playwright test --coverage

# Ver reporte
npx nyc report --reporter=html
open coverage/index.html
```

### **4. CI/CD Integration**

#### **GitHub Actions Workflow**
```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  smart-contracts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Foundry
        uses: foundry-rs/foundry-toolchain@v1
      
      - name: Run Forge tests
        run: |
          cd sc
          forge test -vvv
      
      - name: Check coverage
        run: |
          cd sc
          forge coverage --report lcov
          lcov --list lcov.info
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./sc/lcov.info
  
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd web
          npm ci
      
      - name: Install Playwright
        run: |
          cd web
          npx playwright install --with-deps
      
      - name: Run E2E tests
        run: |
          cd web
          npx playwright test
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: web/playwright-report/
```

---

## 🎨 Diseño de Interfaz de Usuario

#### **1. Dashboard Principal**
- **KPIs Globales**:
  - Total de baterías registradas en sistema
  - Total de emisiones CO₂e evitadas (vs producción virgen)
  - % Materiales reciclados en circulación
  - Tasa de reciclaje actual vs objetivo UE
- **Mapa Interactivo**: Visualización geográfica de supply chain
- **Timeline**: Flujo de una batería seleccionada desde mina hasta reciclaje

#### **2. Battery Passport Viewer** (Acceso Público)
- **Escaneo QR Code**: Lector QR integrado (móvil)
- **Visualización de Datos**:
  - Datos básicos: BIN, VIN, capacidad, SOH actual
  - Trazabilidad: Grafo visual de actores involucrados
  - Huella de carbono: Desglose por etapa (extracción, manufactura, transporte, uso, reciclaje)
  - Certificaciones: Lista de certificados (clickeable → IPFS)
  - Timeline: Eventos clave en la vida de la batería
- **Nivel de Acceso**: Datos públicos vs privados según rol

#### **3. Panel de Rol Específico**

**Raw Material Supplier**:
- Registrar nuevo batch de material
- Cargar certificaciones éticas/ambientales
- Ver materiales enviados a Component Manufacturers
- Dashboard de sostenibilidad (emisiones, consumo agua, etc.)

**Component Manufacturer**:
- Registrar nueva batería/célula
- Vincular materias primas recibidas (upstream)
- Cargar datos de producción (huella carbono, calidad)
- Transferir a OEMs
- Dashboard de eficiencia producción

**OEM**:
- Registrar integración batería en vehículo (VIN+BIN)
- Cargar datos de configuración pack
- Transferir a Fleet Operator/First Owner
- Dashboard de garantías activas

**Fleet Operator / First Owner**:
- Ver estado de baterías en flota
- Actualizar datos de telemetría (automático vía API BMS)
- Ver predicciones de vida útil
- Iniciar proceso de segunda vida o reciclaje
- Dashboard de rendimiento

**Aftermarket User**:
- Solicitar certificación de segunda vida
- Registrar instalación y tipo de aplicación
- Ver datos de rendimiento en segunda vida
- Dashboard de ahorro económico/ambiental

**Recycler**:
- Registrar recepción de batería
- Cargar datos de proceso de reciclaje
- Registrar materiales recuperados
- Enviar materiales reciclados a supply chain (cerrar ciclo)
- Dashboard de tasas de recuperación

**Regulatory Authority**:
- Auditar registros completos
- Verificar cumplimiento de normativas
- Emitir certificaciones
- Ver reportes agregados del sector
- Dashboard de compliance sectorial

---

## 🔐 Gestión de Privacidad y Permisos

### **Niveles de Acceso a Datos**

| Dato | Público | Propietario | Autoridad | Notas |
|------|---------|-------------|-----------|-------|
| BIN | ✅ | ✅ | ✅ | Identificador público |
| VIN | ❌ | ✅ | ✅ | Privacidad vehículo |
| Huella carbono agregada | ✅ | ✅ | ✅ | Dato público UE |
| Huella carbono desglosada | ⭕ | ✅ | ✅ | Opcional público |
| Certificaciones éticas | ✅ | ✅ | ✅ | Transparencia obligada |
| Origen materias primas | ✅ | ✅ | ✅ | Transparencia UE |
| SOH/SOC en tiempo real | ❌ | ✅ | ⭕ | Privacidad propietario |
| Historial propietarios | ❌ | ✅ | ✅ | Privacidad GDPR |
| Datos telemetría detallados | ❌ | ✅ | ⭕ | Solo con consentimiento |
| Tasas de reciclaje | ✅ | ✅ | ✅ | Transparencia UE |

**Implementación**:
- **zkSNARKs** (opcional): Proofs de cumplimiento sin revelar datos sensibles
- **Encriptación off-chain**: Datos sensibles en IPFS encriptados, clave solo para autorizados
- **Consent Management**: Sistema de permisos granular (ERC-735 Identity)

---

## 🚀 Plan de Desarrollo ACELERADO con Cursor y Claude (3 Semanas)

### **Metodología de Trabajo**

Este proyecto está diseñado para ser desarrollado en **3 semanas** utilizando **Cursor IDE** con integración de **Claude AI** en **modo plan**. 

#### **Flujo de Trabajo Cursor + Claude**

1. **Planificación con Claude**:
   ```
   Usuario: "Modo plan activado. Necesito desarrollar [componente X]."
   Claude: 
   - Analiza requisitos
   - Propone arquitectura optimizada
   - Desglosa en tareas priorizadas
   - Presenta plan detallado
   - Espera confirmación del usuario
   ```

2. **Desarrollo Iterativo**:
   ```
   Usuario: "Aprobado, procede con la implementación."
   Claude:
   - Genera código optimizado para gas
   - Explica decisiones técnicas
   - Propone tests esenciales
   - Solicita validación antes de continuar
   ```

3. **Revisión y Refinamiento**:
   ```
   Usuario: "Revisa el código y optimiza."
   Claude:
   - Analiza uso de gas
   - Identifica optimizaciones
   - Propone refactorings
   - Actualiza tests
   ```

---

### **SEMANA 1: Smart Contracts Core (Fundamentos)**

**Objetivo**: Contratos principales desplegados y testeados en local

#### **Día 1-2: Setup y Contratos Base**
**Prompt para Claude**:
```
Modo plan: Configurar proyecto Foundry para Supply Chain Battery.
Crear contratos base:
1. BatteryRegistry.sol - registro central de baterías
2. RoleManager.sol - gestión de roles
3. SupplyChainTracker.sol - transferencias entre roles

Enfoque: SOLO datos críticos on-chain (ver matriz optimizada).
Optimización: Storage packing, usar bytes32 en vez de string donde posible.
Tests: Foundry con >90% coverage.
```

**Tareas**:
- [x] Inicializar Foundry: `forge init sc`
- [x] Instalar OpenZeppelin: `forge install OpenZeppelin/openzeppelin-contracts`
- [x] Crear `BatteryRegistry.sol` con structs optimizados
- [x] Crear `RoleManager.sol` con enums de roles
- [x] Crear `SupplyChainTracker.sol` con validación de flujo
- [x] Escribir tests: `forge test --gas-report`
- [x] Ejecutar coverage: `forge coverage`

**Entregable**: 3 contratos con tests pasando

---

#### **Día 3-4: Contratos Especializados**
**Prompt para Claude**:
```
Modo plan: Desarrollar contratos especializados:
1. DataVault.sol - almacenar parámetros de trazabilidad (SOLO on-chain críticos)
2. CarbonFootprint.sol - agregar emisiones CO2
3. SecondLifeManager.sol - gestión segunda vida (NUEVO rol)
4. RecyclingManager.sol - registro de reciclaje

Usar mappings anidados para eficiencia.
Eventos para cada acción (indexación futura con The Graph).
```

**Tareas**:
- [x] Implementar `DataVault.sol` con control de acceso
- [x] Implementar `CarbonFootprint.sol` con agregación
- [x] Implementar `SecondLifeManager.sol` (rol aftermarket)
- [x] Implementar `RecyclingManager.sol`
- [x] Integrar todos los contratos en un deployment script
- [x] Tests de integración: flujo completo

**Entregable**: 7 contratos integrados

---

#### **Día 5-7: Optimización y Deploy Local**
**Prompt para Claude**:
```
Modo plan: Optimizar gas y preparar deployment.
- Ejecutar `forge snapshot` para baseline
- Aplicar storage packing en structs
- Usar batch operations donde posible
- Configurar Upgradeable Proxies (OpenZeppelin UUPS)
- Deploy en Anvil local
- Script de inicialización (setup roles admin)

```

**Tareas**:
- [x] `forge snapshot` → guardar gas baseline
- [x] Refactorizar structs (optimizar slots de storage)
- [x] Implementar UUPS Proxy pattern (upgradeability)
- [x] Crear `Deploy.s.sol` script
- [x] Deploy en Anvil: `anvil` + `forge script`
- [x] Crear `Initialize.s.sol` (setup admin, roles)
- [x] Testear upgrade de contratos

**Entregable**: Contratos desplegados localmente, gas optimizado (~30% reducción)

---

### **SEMANA 2: Frontend Base (Node.js + Next.js)**

**Objetivo**: Aplicación web funcional con conexión a blockchain

#### **Día 8-9: Setup Frontend y Web3**
**Prompt para Claude**:
```
Modo plan: Inicializar proyecto Next.js 14 con TypeScript.
Stack: Node.js + Express (backend opcional) + Next.js (frontend).
Configurar:
- Web3Context con ethers.js
- Conexión MetaMask
- Custom hooks: useWallet, useContract, useRole
- Configuración de contratos (ABIs, addresses)
```

**Tareas**:
- [x] `npx create-next-app@latest web --typescript --tailwind --app`
- [x] `cd web && npm install ethers@6 @rainbow-me/rainbowkit wagmi viem`
- [x] Crear `lib/Web3Context.tsx`
- [x] Crear hooks: `hooks/useWallet.ts`, `hooks/useContract.ts`
- [x] Copiar ABIs de contratos: `web/lib/contracts/`
- [x] Crear `config/contracts.ts` con addresses de Anvil
- [x] Testear conexión MetaMask en desarrollo

**Entregable**: Frontend conectado a MetaMask y contratos locales

---

#### **Día 10-11: Páginas Core y Componentes**
**Prompt para Claude**:
```
Modo plan: Desarrollar páginas principales estilo Northvolt.
Páginas:
1. Landing (/) - Hero + Connect Wallet
2. Dashboard (/dashboard) - KPIs generales
3. Battery Passport (/passport/[bin]) - Trazabilidad completa
4. Role Dashboard (/dashboard/supplier, /dashboard/manufacturer, etc.)

Componentes clave:
- BatteryCard - tarjeta resumen
- SupplyChainGraph - visualización con react-flow
- CarbonFootprintChart - gráfico con recharts
- QRScanner - escaneo de QR

Instalar: shadcn-ui, recharts, react-flow, leaflet, react-qr-scanner
```

**Tareas**:
- [x] Instalar dependencias UI: `npx shadcn-ui@latest init`
- [x] Instalar charts: `npm install recharts react-flow-renderer leaflet react-qr-scanner`
- [x] Crear páginas: `/app/page.tsx`, `/app/dashboard/page.tsx`, `/app/passport/[bin]/page.tsx`
- [x] Crear componentes: `BatteryCard`, `SupplyChainGraph`, `CarbonChart`
- [x] Implementar layouts responsive con Tailwind
- [x] Crear Header con navegación por rol
- [x] Testear responsive en móvil

**Entregable**: UI completa, responsive, estilo Northvolt

---

#### **Día 12-14: Funcionalidades por Rol (MVP)**
**Prompt para Claude**:
```
Modo plan: Implementar funcionalidades ESENCIALES por rol.

PRIORIDAD ALTA (MVP):
1. Component Manufacturer: Registrar batería nueva
2. OEM: Vincular batería a vehículo (VIN+BIN)
3. Fleet Operator: Ver estado, actualizar SOH
4. Aftermarket User: Iniciar segunda vida
5. Recycler: Registrar reciclaje

PRIORIDAD BAJA (Opcional):
- Raw Material Supplier (simular con datos mock)
- Dashboards avanzados con analytics
- Exportar reportes CSV
```

**Tareas**:
- [x] Formulario `RegisterBattery.tsx` (Component Manufacturer)
- [x] Formulario `IntegrateBattery.tsx` (OEM)
- [x] Dashboard `FleetOperator.tsx` con tabla de baterías
- [x] Formulario `StartSecondLife.tsx` (Aftermarket)
- [x] Formulario `RegisterRecycling.tsx` (Recycler)
- [x] Integrar llamadas a contratos con ethers.js
- [x] Manejo de errores y loading states
- [x] Toast notifications para transacciones

**Entregable**: Flujo MVP funcional: Manufacturer → OEM → Fleet → Aftermarket → Recycler

---

### **SEMANA 3: Integración, Testing y Deploy**

**Objetivo**: App desplegada en testnet, documentada y demo lista

#### **Día 15-16: Funcionalidades Avanzadas**
**Prompt para Claude**:
```
Modo plan: Implementar features de valor añadido.

Features:
1. QR Code generation y scanning con MODO MANUAL para testing
   IMPORTANTE: El QR scanner DEBE tener input manual de BIN para evitar problemas en tests
   - Modo cámara (producción): Escaneo real con react-qr-scanner
   - Modo manual (testing): Input de texto para ingresar BIN directamente
   - Modo manual por defecto para facilitar testing y verificación funcional
2. IPFS integration (Pinata) para certificados
3. Gráfico de trazabilidad completa (react-flow graph)
4. Mapa con ubicaciones (Leaflet)
5. Predicción SOH con línea de tendencia

Optimizar: Lazy loading de componentes pesados.
```

**Tareas**:
- [x] Generar QR codes con `qrcode.react`: `/passport/[bin]` QR
- [x] **Crear componente `QRScanner.tsx` con MODO DUAL**:
  ```typescript
  // components/QRScanner.tsx
  import { useState } from 'react';
  import QrReader from 'react-qr-scanner';
  import { useNavigate } from 'react-router-dom';
  
  type ScanMode = 'camera' | 'manual';
  
  export function QRScanner() {
    const [mode, setMode] = useState<ScanMode>('manual'); // Manual por defecto
    const [manualBin, setManualBin] = useState('');
    const navigate = useNavigate();
    
    const handleScan = (bin: string) => {
      if (bin) navigate(`/passport/${bin}`);
    };
    
    return (
      <div className="qr-scanner-container">
        <h2>Buscar Batería</h2>
        
        {/* Toggle entre modos */}
        <div className="mode-selector">
          <button onClick={() => setMode('manual')} className={mode === 'manual' ? 'active' : ''}>
            ✍️ Ingresar BIN
          </button>
          <button onClick={() => setMode('camera')} className={mode === 'camera' ? 'active' : ''}>
            📷 Escanear QR
          </button>
        </div>
        
        {/* Modo Manual - PRIORITARIO PARA TESTING */}
        {mode === 'manual' && (
          <div className="manual-mode">
            <form onSubmit={(e) => { e.preventDefault(); handleScan(manualBin.trim()); }}>
              <label htmlFor="bin-input">Ingresa el BIN de la batería</label>
              <input
                id="bin-input"
                type="text"
                placeholder="Ejemplo: NV-2024-001234"
                value={manualBin}
                onChange={(e) => setManualBin(e.target.value)}
              />
              <button type="submit">🔍 Buscar Batería</button>
            </form>
            <div className="hint-box">
              <p>💡 <strong>Modo Manual</strong></p>
              <ul>
                <li>Ideal para testing y verificación funcional</li>
                <li>No requiere cámara (evita problemas en CI/CD)</li>
                <li>Funciona en cualquier dispositivo</li>
              </ul>
            </div>
          </div>
        )}
        
        {/* Modo Cámara - Solo para producción */}
        {mode === 'camera' && (
          <div className="camera-mode">
            <QrReader
              delay={300}
              onError={(err) => { 
                console.error(err); 
                setMode('manual'); // Fallback a manual
              }}
              onScan={(data) => data && handleScan(data.text)}
              style={{ width: '100%', maxWidth: '500px' }}
            />
            <button onClick={() => setMode('manual')}>
              ⚠️ ¿Problemas con la cámara? Usa modo manual
            </button>
          </div>
        )}
      </div>
    );
  }
  ```
- [x] Setup Pinata IPFS: `npm install pinata-web3`
- [x] Componente FileUpload con IPFS
- [x] Grafo de supply chain con react-flow (nodos = roles, edges = transfers)
- [x] Mapa con Leaflet mostrando ubicaciones
- [x] Gráfico SOH degradation con predicción lineal
- [x] Optimizar bundle: code splitting, lazy load
- [x] **Tests E2E para QRScanner usando modo manual**:
  ```typescript
  // e2e/specs/qr.spec.ts
  test('QR scanner manual mode for testing', async ({ page }) => {
    await page.goto('/scan');
    
    // Verificar modo manual por defecto
    await expect(page.locator('button:has-text("Ingresar BIN")')).toHaveClass(/active/);
    
    // Usar input manual (sin cámara)
    await page.fill('input[placeholder*="BIN"]', 'TEST-E2E-001');
    await page.press('input[placeholder*="BIN"]', 'Enter');
    
    // Verificar redirección
    await expect(page).toHaveURL(/.*\/passport\/TEST-E2E-001/);
  });
  ```

**Entregable**: Features premium implementadas

---

#### **Día 17-18: Deploy en Polygon Mumbai Testnet**
**Prompt para Claude**:
```
Modo plan: Deployment en testnet Polygon Mumbai.

Pasos:
1. Configurar RPC Mumbai en foundry.toml
2. Obtener MATIC de testnet desde faucet
3. Deploy contratos: `forge script --rpc-url mumbai --broadcast --verify`
4. Copiar addresses deployadas
5. Update frontend config con addresses de testnet
6. Deploy frontend en Vercel
7. Testear app completa en testnet
```

**Tareas**:
- [x] Crear cuenta en https://www.alchemy.com → RPC Mumbai
- [x] Faucet: https://faucet.polygon.technology → obtener MATIC testnet
- [x] Actualizar `foundry.toml`:
  ```toml
  [rpc_endpoints]
  mumbai = "https://polygon-mumbai.g.alchemy.com/v2/YOUR_KEY"
  ```
- [x] Deploy: `forge script script/Deploy.s.sol --rpc-url mumbai --broadcast --verify --etherscan-api-key YOUR_POLYGONSCAN_KEY`
- [x] Actualizar `web/config/contracts.ts` con addresses
- [x] Deploy frontend: `vercel --prod`
- [x] Testear: registrar batería completa en testnet
- [x] Verificar contratos en Mumbai PolygonScan

**Entregable**: App live en testnet

---

#### **Día 19-20: Testing, Documentación y Video**
**Prompt para Claude**:
```
Modo plan: Testing final y documentación.

Testing:
- Ejecutar suite completa de tests: `forge test`
- Coverage: `forge coverage` → target >90%
- E2E manual: Flujo completo en testnet
- Security: `slither .` (static analysis)

Documentación:
- README.md actualizado con instrucciones
- ARCHITECTURE.md con diagramas
- USER_GUIDE.md con screenshots
- API.md (auto-generado con `forge doc`)

Video Demo:
- Script de 5 min mostrando flujo completo
- Grabación con OBS/Loom
- Subir a YouTube
```

**Tareas**:
- [x] `forge test -vvv` → verificar todos los tests
- [x] `forge coverage` → >90% coverage
- [x] Instalar Slither: `pip install slither-analyzer`
- [x] `slither .` → revisar warnings críticos
- [x] Escribir README.md completo
- [x] Crear ARCHITECTURE.md con mermaid diagrams
- [x] Crear USER_GUIDE.md con capturas
- [x] `forge doc` → generar API docs
- [x] Escribir script video demo (5 min)
- [x] Grabar video: conexión → registro → transferencia → visualización
- [x] Editar y subir a YouTube

**Entregable**: Proyecto completo, documentado y con demo

---

#### **Día 21: Pulido Final y Entrega**
**Checklist Final**:

**Smart Contracts**:
- [x] 7 contratos desplegados en Mumbai testnet
- [x] Tests >90% coverage
- [x] Gas optimizado (<0.65 MATIC por batería ciclo completo)
- [x] Slither sin warnings críticos
- [x] Verificados en PolygonScan

**Frontend**:
- [x] Desplegado en Vercel (producción)
- [x] Responsive (mobile + desktop)
- [x] Conexión MetaMask funcional
- [x] Flujo completo operativo: Manufacturer → Recycler
- [x] QR codes + IPFS + Visualizaciones

**Documentación**:
- [x] README.md con setup instructions
- [x] ARCHITECTURE.md
- [x] USER_GUIDE.md
- [x] Video demo en YouTube (5 min)

**Repositorio**:
- [x] Código en GitHub público
- [x] .gitignore configurado (.env, node_modules)
- [x] LICENSE (MIT)
- [x] CHANGELOG.md

---

## ✅ Entregables Finales (3 Semanas)

### **1. Smart Contracts** ✅
- Repositorio: `supply-chain-battery/sc/`
- Contratos: BatteryRegistry, RoleManager, SupplyChainTracker, DataVault, CarbonFootprint, SecondLifeManager, RecyclingManager
- Tests: >90% coverage
- Deployed: Polygon Mumbai Testnet
- Verified: PolygonScan

### **2. Frontend** ✅
- Repositorio: `supply-chain-battery/web/`
- Stack: Next.js 14 + TypeScript + Tailwind + Shadcn UI
- Desplegado: Vercel (https://your-app.vercel.app)
- Features: Dashboard, Battery Passport, QR, IPFS, Mapas, Gráficos

### **3. Documentación** ✅
- README.md: Instrucciones completas
- ARCHITECTURE.md: Diagramas y decisiones técnicas
- USER_GUIDE.md: Guía de usuario por rol
- API.md: Documentación de contratos (auto-generada)

### **4. Demo** ✅
- Video: YouTube (5 minutos)
- Contenido: Conexión, registro de batería, transferencias, visualización de trazabilidad, segunda vida, reciclaje
- Link: [Tu video aquí]

---

## 🎯 Alcance del Proyecto Educativo (MVP)

### **Incluido en MVP (3 semanas)** ✅

**Blockchain**:
- ✅ 7 smart contracts con datos críticos on-chain
- ✅ Sistema de roles y permisos
- ✅ Transferencias entre actores con aprobación
- ✅ Trazabilidad completa (grafo de flujo)
- ✅ Huella de carbono agregada
- ✅ Segunda vida de baterías (Aftermarket User)
- ✅ Reciclaje con tasas de recuperación

**Frontend**:
- ✅ Conexión MetaMask (Polygon Mumbai)
- ✅ Dashboard general con KPIs
- ✅ Battery Passport viewer (QR)
- ✅ Formularios por rol (Manufacturer, OEM, Fleet, Aftermarket, Recycler)
- ✅ Visualizaciones: gráficos, mapas, supply chain graph
- ✅ IPFS para certificados
- ✅ Responsive design

### **Excluido del MVP (Futuro)** 🔮

**Opcional - Post-proyecto**:
- ❌ Raw Material Supplier completo (usar datos mock)
- ❌ Telemetría en tiempo real con BMS simulado
- ❌ Machine Learning para predicción SOH
- ❌ The Graph subgraph para indexación rápida
- ❌ Tests E2E automatizados (Playwright)
- ❌ CI/CD con GitHub Actions
- ❌ Multi-idioma (i18n)
- ❌ Notificaciones push
- ❌ Exportar reportes PDF
- ❌ Base de datos off-chain (MongoDB)
- ❌ Deploy en mainnet Polygon

---

## 🎓 Objetivos de Aprendizaje Alcanzados

Al completar este proyecto educativo de 3 semanas con Cursor y Claude, habrás aprendido:

### **Blockchain y Smart Contracts**
- ✅ Desarrollo de smart contracts complejos en Solidity
- ✅ Optimización de gas y storage
- ✅ Testing exhaustivo con Foundry
- ✅ Patrón Upgradeable Proxy (OpenZeppelin)
- ✅ Security best practices y auditing

### **Frontend Web3**
- ✅ Integración de MetaMask con Next.js
- ✅ Uso de ethers.js para interacción con blockchain
- ✅ Gestión de estado Web3 (Context, hooks)
- ✅ UI/UX para aplicaciones descentralizadas

### **Arquitectura de Sistemas**
- ✅ Diseño de sistemas de trazabilidad complejos
- ✅ Gestión de roles y permisos
- ✅ Privacidad y protección de datos (GDPR compliance)
- ✅ Integración de sistemas externos (IPFS, oráculos)

### **Sostenibilidad y Regulación**
- ✅ Comprensión profunda del EU Battery Passport
- ✅ Cálculo de huella de carbono (LCA)
- ✅ Due diligence en supply chains
- ✅ Economía circular y reciclaje

### **Desarrollo con AI (Cursor + Claude)**
- ✅ Uso eficiente de AI para planificación de proyectos
- ✅ Prompt engineering para desarrollo de código
- ✅ Iteración y refinamiento con AI
- ✅ Testing y debugging asistido por AI

---

## 🌟 Características Diferenciadoras

Este proyecto va más allá de un simple supply chain tracker genérico:

### **1. Cumplimiento Regulatorio Real**
- Diseñado específicamente para cumplir EU Battery Regulation 2023/1542
- Parámetros de trazabilidad basados en estándares oficiales (DIN DKE SPEC 99100)
- Compatibilidad con Catena-X y otros frameworks europeos

### **2. Rol de Segunda Vida (Innovación)**
- **Aftermarket User** es un rol único que refleja la realidad de la economía circular
- Tracking completo de baterías en aplicaciones post-vehículo (home storage, microgrids, etc.)
- Cálculo de beneficios económicos y ambientales de la reutilización

### **3. Granularidad de Datos**
- Más de 150 parámetros de trazabilidad específicos por rol
- Desde GPS de extracción de mineral hasta pureza de materiales reciclados
- Datos éticos y de sostenibilidad como ciudadanos de primera clase

### **4. Experiencia de Usuario Superior**
- Dashboards personalizados por rol con KPIs relevantes
- Visualizaciones avanzadas (grafos, mapas, timelines, Sankey diagrams)
- QR codes para acceso instantáneo desde móvil
- PWA para uso offline

### **5. Preparado para Producción**
- Arquitectura modular y upgradeable
- Security audit ready (Slither, Mythril)
- Optimización de gas
- Documentación exhaustiva

---

## 🚀 Próximos Pasos (Post-Proyecto)

### **Mejoras Futuras**
1. **Integración con Oráculos**:
   - Chainlink para datos en tiempo real (precios de materiales, tasas de cambio)
   - Oráculos de IoT para telemetría automática de BMS

2. **Machine Learning**:
   - Predicción de degradación de baterías (SOH forecasting)
   - Detección de anomalías en patrones de uso
   - Optimización de matching para segunda vida

3. **DeFi Integration**:
   - Tokenización de baterías como NFTs (ERC-721)
   - Marketplace de baterías de segunda vida
   - Carbon credits trading

4. **Interoperabilidad**:
   - API pública para terceros (OEMs, recyclers)
   - Integración con sistemas legacy (SAP, Oracle)
   - Cross-chain bridges (Ethereum ↔ Polygon ↔ Optimism)

5. **Governance**:
   - DAO para decisiones de protocolo
   - Token de gobernanza para stakeholders
   - Votaciones on-chain para actualizaciones

---

## 📚 Referencias y Recursos

### **Regulación y Estándares**
- [EU Battery Regulation (EU) 2023/1542](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32023R1542)
- [DIN DKE SPEC 99100 Battery Passport](https://www.dke.de/en/standards-and-specifications/din-spec-99100-battery-passport)
- [Catena-X Data Space](https://catena-x.net/)
- [Global Battery Alliance Battery Passport](https://www.globalbattery.org/battery-passport/)

### **Fabricantes de Referencia**
- [Northvolt - Connected Battery](https://northvolt.com/products/systems/connected-battery/)
- [OPTEL - Battery Traceability](https://www.optelgroup.com/en/solution/battery-traceability/)
- [Minespider - Supply Chain Traceability](https://www.minespider.com/)
- [BATRIX - Digital Battery Passport](https://www.batrix.io/)

### **Documentación Técnica**
- [Solidity Documentation](https://docs.soliditylang.org/)
- [Foundry Book](https://book.getfoundry.sh/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Next.js Documentation](https://nextjs.org/docs)
- [ethers.js Documentation](https://docs.ethers.org/)

### **Sostenibilidad y LCA**
- [ISO 14040/14044 Life Cycle Assessment](https://www.iso.org/standard/37456.html)
- [JRC Battery Carbon Footprint Methodology](https://joint-research-centre.ec.europa.eu/)
- [Circular Economy Action Plan](https://environment.ec.europa.eu/strategy/circular-economy-action-plan_en)

---

## ✅ Checklist Final

### **Smart Contracts**
- [ ] 7 contratos principales desarrollados y testeados
- [ ] Tests con >95% coverage
- [ ] Gas optimizado (<5M gas para operaciones comunes)
- [ ] Security audit completo (Slither + Mythril)
- [ ] Deployed en testnet y verificado

### **Frontend**
- [ ] 20+ páginas/vistas implementadas
- [ ] Componentes reutilizables (Shadcn UI)
- [ ] Integración Web3 completa
- [ ] Responsive design (mobile-first)
- [ ] PWA configurado

### **Funcionalidad**
- [ ] Flujo completo RawMaterialSupplier → Recycler funcional
- [ ] QR codes generación y escaneo
- [ ] Dashboards personalizados por rol
- [ ] Gráficos y visualizaciones avanzadas
- [ ] IPFS integración para documentos

### **Documentación**
- [ ] README.md actualizado
- [ ] ARCHITECTURE.md con diagramas
- [ ] USER_GUIDE.md completo
- [ ] DEVELOPER_GUIDE.md
- [ ] Video demo grabado

### **Despliegue**
- [ ] Contratos en testnet
- [ ] Frontend en Vercel/Netlify
- [ ] GitHub Actions CI/CD
- [ ] Repositorio público

---

## 🎉 ¡Adelante con el Desarrollo!

Este README_PFM.md es tu guía completa para desarrollar el proyecto **Supply Chain Battery Circular Economy**. Utiliza **Cursor** con **Claude AI en modo plan** para maximizar tu productividad y aprendizaje.

**Recuerda**:
- Pregunta a Claude cada vez que tengas dudas
- Activa el modo plan para tareas complejas
- Itera y refina con ayuda de la AI
- Testea frecuentemente
- Documenta a medida que avanzas

**¡Éxito en tu proyecto y en tu contribución a un futuro más sostenible! 🌍🔋♻️**

---

**Proyecto desarrollado para cumplir con EU Battery Passport Regulation 2027**  
**Tecnologías**: Solidity, Foundry, Next.js, TypeScript, ethers.js, Blockchain  
**Objetivo**: Trazabilidad completa de baterías de vehículos eléctricos en economía circular  
**Autor**: [Francisco Hipolito Garcia Martinez]  
**Fecha**: Diciembre 2025
