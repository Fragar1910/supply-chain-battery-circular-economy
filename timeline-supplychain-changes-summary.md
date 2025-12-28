# Timeline y Supply Chain del Battery Passport - Resumen de Cambios

**Documento**: Cambios efectuados en Timeline y Supply Chain Events
**Fecha de Referencia**: Implementación actual del sistema
**Ubicación**: Battery Passport Page (`/passport/[bin]`)

---

## 📋 Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Timeline del Battery Passport](#timeline-del-battery-passport)
3. [Supply Chain Traceability](#supply-chain-traceability)
4. [Hooks y Data Fetching](#hooks-y-data-fetching)
5. [Integración de Eventos](#integración-de-eventos)
6. [Componentes Visuales](#componentes-visuales)
7. [Arquitectura de Datos](#arquitectura-de-datos)
8. [Código de Referencia](#código-de-referencia)

---

## 🎯 Resumen Ejecutivo

El sistema de Timeline y Supply Chain del Battery Passport obtiene **datos reales de la blockchain** mediante múltiples hooks especializados que leen eventos de diferentes smart contracts:

### Características Clave:
- ✅ **Datos 100% reales**: No hay datos mock, todo viene de eventos blockchain
- ✅ **8 tipos de eventos diferentes**: Registration, Transfer, Integration, SOH, Second Life, Recycling, Telemetry, Critical, Carbon Footprint
- ✅ **Ordenamiento cronológico**: Todos los eventos se ordenan por timestamp
- ✅ **Visualización dual**: Timeline vertical + Supply Chain Graph horizontal
- ✅ **Colores por tipo de evento**: Cada tipo tiene su color distintivo
- ✅ **Metadata completa**: Transaction hashes, actors, roles, valores específicos

---

## 📅 Timeline del Battery Passport

### Ubicación en la UI
```typescript
// web/src/app/passport/[bin]/page.tsx:701-760
<TabsContent value="timeline" className="space-y-6">
  <Card className="bg-slate-900/50 border-slate-800">
    <CardHeader>
      <CardTitle>Battery Lifecycle Timeline</CardTitle>
      <CardDescription>
        Complete history of this battery - {timeline.length} events recorded
      </CardDescription>
    </CardHeader>
    <CardContent>
      {/* Renderiza eventos en formato vertical con dots de colores */}
    </CardContent>
  </Card>
</TabsContent>
```

### Tipos de Eventos del Timeline

#### 1. **Registration Event** 🏭
```typescript
{
  id: `registration-${bin}`,
  type: 'registration',
  title: 'Battery Manufactured',
  description: 'Battery manufactured by ${manufacturer}',
  role: 'Component Manufacturer',
  color: 'bg-blue-500',
  metadata: {
    chemistry: battery.chemistry,
    capacityKwh: Number(battery.capacityKwh),
    sohManufacture: Number(battery.sohManufacture) / 100,
  }
}
```
**Fuente**: `BatteryRegistry.getBattery()` - manufacture date

---

#### 2. **Transfer Events** 🔄
```typescript
{
  id: transfer.id,
  type: 'transfer',
  title: 'Ownership Transfer #${index + 1}',
  description: 'Battery transferred from ${from} to ${to}',
  role: 'Owner',
  color: 'bg-purple-500',
  metadata: {
    from: transfer.from,
    to: transfer.to,
    blockNumber: transfer.blockNumber,
    transactionHash: transfer.transactionHash,
  }
}
```
**Fuente**: `useTransferHistory(bin)` - Lee eventos `BatteryTransferred` de la blockchain

---

#### 3. **Integration Event** 🚗
```typescript
{
  id: `integration-${bin}`,
  type: 'integration',
  title: 'Battery Integrated into Vehicle',
  description: 'Battery integrated into vehicle ${vin}',
  role: 'OEM',
  color: 'bg-cyan-500',
  metadata: {
    vin: vinStr,
  }
}
```
**Fuente**: `BatteryRegistry.getBattery()` - VIN + integration date
**Condición**: Solo si VIN no es vacío y integration date > 0

---

#### 4. **SOH Update Events** 📊
```typescript
{
  id: sohEvent.id,
  type: 'sohUpdate',
  title: 'State of Health Updated',
  description: 'Battery SOH updated from ${previousSOH}% to ${newSOH}% (${cycles} cycles)',
  color: 'bg-orange-500',
  metadata: {
    previousSOH: sohEvent.previousSOH,
    currentSOH: sohEvent.newSOH,
    cyclesCompleted: sohEvent.cycles,
    transactionHash: sohEvent.transactionHash,
  }
}
```
**Fuente**: `useSOHEvents(bin)` - Lee eventos `SOHUpdated` del BatteryRegistry

---

#### 5. **Second Life Events** 🔋
```typescript
// Started Second Life
{
  id: slEvent.id,
  type: 'stateChange',
  title: 'Started Second Life',
  description: 'Battery repurposed for second life: ${applicationType}. Operator: ${operator}',
  role: 'Aftermarket User',
  color: 'bg-yellow-500',
  metadata: {
    newState: 'SecondLife',
    applicationType: slEvent.applicationType,
    transactionHash: slEvent.transactionHash,
  }
}

// Ended Second Life
{
  id: slEvent.id,
  type: 'stateChange',
  title: 'Ended Second Life',
  description: 'Second life ended. Battery ready for recycling.',
  role: 'Aftermarket User',
  color: 'bg-yellow-500',
}
```
**Fuente**: `useSecondLifeEvents(bin)` - Lee eventos del SecondLifeManager
**Tipos**: `SecondLifeStarted`, `SecondLifeEnded`

---

#### 6. **Recycling Events** ♻️
```typescript
// Recycling Started
{
  id: recyclingEvent.id,
  type: 'recycling',
  title: 'Recycling Started',
  description: 'Battery received at recycling facility: ${facility}',
  role: 'Recycler',
  color: 'bg-green-500',
}

// Recycling Completed
{
  id: recyclingEvent.id,
  type: 'recycling',
  title: 'Recycling Completed',
  description: 'Battery materials recovered and recycled according to EU regulations',
  role: 'Recycler',
  color: 'bg-green-500',
  metadata: {
    carbonFootprint: Number(battery.carbonFootprintTotal),
  }
}
```
**Fuente**: `useRecyclingEvents(bin)` - Lee eventos del RecyclingManager
**Tipos**: `RecyclingStarted`, `RecyclingCompleted`

---

#### 7. **Telemetry Events** 📡
```typescript
{
  id: dvEvent.id,
  type: 'sohUpdate', // Visual consistency
  title: 'Telemetry Recorded',
  description: 'SOH: ${soh}%, SOC: ${soc}%, Mileage: ${mileage} km, Cycles: ${chargeCycles}. Recorded by ${recordedByName}',
  role: 'Fleet Operator',
  color: 'bg-orange-500',
  metadata: {
    soh: dvEvent.soh,
    soc: dvEvent.soc,
    mileage: dvEvent.mileage,
    chargeCycles: dvEvent.chargeCycles,
    transactionHash: dvEvent.transactionHash,
  }
}
```
**Fuente**: `useDataVaultEvents(bin)` - Lee eventos `TelemetryRecorded` del DataVault

---

#### 8. **Maintenance Events** 🔧
```typescript
{
  id: dvEvent.id,
  type: 'maintenance',
  title: '${maintenanceTypeName} Performed',
  description: 'Maintenance performed by ${technicianId}. Recorded by ${recordedByName}',
  role: 'Fleet Operator',
  color: 'bg-indigo-500',
  metadata: {
    maintenanceType: dvEvent.maintenanceType, // Inspection, Repair, Upgrade, etc.
    technicianId: dvEvent.technicianId,
    serviceDate: dvEvent.serviceDate,
    transactionHash: dvEvent.transactionHash,
  }
}
```
**Fuente**: `useDataVaultEvents(bin)` - Lee eventos `MaintenanceRecorded` del DataVault
**Tipos de Mantenimiento**: Inspection, Repair, Upgrade, Calibration, Testing, Other

---

#### 9. **Critical Events** ⚠️
```typescript
{
  id: dvEvent.id,
  type: 'critical',
  title: '⚠️ ${eventTypeName}',
  description: 'Critical event detected (${severityName} severity). Recorded by ${recordedByName}',
  role: 'Fleet Operator',
  color: 'bg-red-500',
  metadata: {
    eventType: dvEvent.eventType, // Overheating, Overcurrent, etc.
    severity: dvEvent.severity, // Low, Medium, High, Critical
    eventDate: dvEvent.eventDate,
    transactionHash: dvEvent.transactionHash,
  }
}
```
**Fuente**: `useDataVaultEvents(bin)` - Lee eventos `CriticalEventRecorded` del DataVault
**Tipos de Eventos Críticos**: Overheating, Overcurrent, Overvoltage, Undervoltage, Short Circuit, Collision, Fire, Other

---

#### 10. **Carbon Footprint Events** 🌱
```typescript
{
  id: carbonEvent.id,
  type: 'carbonFootprint',
  title: 'Carbon Emission Recorded: ${phaseName}',
  description: '${kgCO2e} kg CO₂e added for ${phaseName}. Recorded by ${recordedByName}',
  role: 'Carbon Auditor',
  color: 'bg-green-500', // Podría ser otro color
  metadata: {
    phase: carbonEvent.phase,
    phaseName: carbonEvent.phaseName,
    kgCO2e: carbonEvent.kgCO2e,
    transactionHash: carbonEvent.transactionHash,
  }
}
```
**Fuente**: `useCarbonFootprintEvents(bin)` - Lee eventos `EmissionAdded` del CarbonFootprint
**Lifecycle Phases**:
- 0: Raw Material Extraction
- 1: Manufacturing
- 2: Transportation
- 3: First Life Usage
- 4: Second Life Usage
- 5: Recycling

---

### Renderizado del Timeline

```typescript
// web/src/app/passport/[bin]/page.tsx:714-756
timeline.map((event, index) => {
  const eventColors = {
    registration: 'bg-blue-500',
    transfer: 'bg-purple-500',
    stateChange: 'bg-yellow-500',
    sohUpdate: 'bg-orange-500',
    integration: 'bg-cyan-500',
    recycling: 'bg-green-500',
    maintenance: 'bg-indigo-500',
    critical: 'bg-red-500',
  };
  const dotColor = eventColors[event.type] || 'bg-green-500';

  return (
    <div key={event.id || index} className="flex gap-4">
      {/* Dot de color */}
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 ${dotColor} rounded-full ring-4 ring-slate-800`} />
        {index < timeline.length - 1 && (
          <div className="w-0.5 h-full bg-slate-700 mt-2" />
        )}
      </div>

      {/* Contenido del evento */}
      <div className="flex-1 pb-8">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-medium text-white">{event.title}</p>
          {event.role && (
            <Badge variant="outline" className="text-xs">
              {event.role}
            </Badge>
          )}
        </div>
        <p className="text-xs text-slate-500 mb-2">{event.date}</p>
        <p className="text-sm text-slate-400">{event.description}</p>
        {event.actor && (
          <p className="text-xs text-slate-600 mt-1 font-mono">
            Actor: {event.actor.slice(0, 6)}...{event.actor.slice(-4)}
          </p>
        )}
      </div>
    </div>
  );
})
```

---

## 🔗 Supply Chain Traceability

### Ubicación en la UI
```typescript
// web/src/app/passport/[bin]/page.tsx:613-661
<TabsContent value="supply-chain" className="space-y-6">
  <Card className="bg-slate-900/50 border-slate-800">
    <CardHeader>
      <CardTitle>Supply Chain Traceability</CardTitle>
      <CardDescription>
        Complete journey from raw materials to current location
      </CardDescription>
    </CardHeader>
    <CardContent>
      <SupplyChainGraph events={supplyChainEvents} />
    </CardContent>
  </Card>

  {/* Events List */}
  <Card>
    <CardHeader>
      <CardTitle>Supply Chain Events</CardTitle>
      <CardDescription>
        {transferCount} ownership transfer{transferCount !== 1 ? 's' : ''} recorded on blockchain
      </CardDescription>
    </CardHeader>
    <CardContent>
      {/* Lista de eventos con badge de rol */}
    </CardContent>
  </Card>
</TabsContent>
```

### Construcción de Supply Chain Events

```typescript
// web/src/app/passport/[bin]/page.tsx:273-305
const supplyChainEvents: SupplyChainEvent[] = useMemo(() => {
  const events: SupplyChainEvent[] = [];

  // 1. Add initial manufacturing event
  if (parsedBatteryData) {
    events.push({
      id: '0',
      role: 'Manufacturer',
      timestamp: parsedBatteryData.manufactureDate
        ? `${parsedBatteryData.manufactureDate}T00:00:00Z`
        : new Date().toISOString(),
      actor: parsedBatteryData.manufacturer,
      description: 'Battery manufactured and registered',
    });
  }

  // 2. Add transfer events from blockchain logs using address mapping
  if (transferHistoryData && transferHistoryData.length > 0) {
    transferHistoryData.forEach((transfer, index) => {
      // Use actual address to determine role
      const role = getSupplyChainRole(transfer.to);
      const displayName = getDisplayName(transfer.to);

      events.push({
        id: String(index + 1),
        role, // 'Supplier' | 'Manufacturer' | 'OEM' | 'Owner' | 'SecondLife' | 'Recycler'
        timestamp: new Date(transfer.timestamp * 1000).toISOString(),
        actor: transfer.to,
        description: `Battery transferred to ${displayName} (${transfer.to.slice(0, 6)}...${transfer.to.slice(-4)})`,
      });
    });
  }

  return events;
}, [transferHistoryData, parsedBatteryData]);
```

### Role Mapping para Supply Chain

El hook `getSupplyChainRole(address)` mapea direcciones Ethereum a roles del supply chain:

```typescript
// web/src/lib/roleMapping.ts
export function getSupplyChainRole(address: string):
  'Supplier' | 'Manufacturer' | 'OEM' | 'Owner' | 'SecondLife' | 'Recycler' {

  const roleInfo = getRoleFromAddress(address);

  switch (roleInfo.role) {
    case 'Admin':
      return 'Manufacturer'; // Admin acts as initial manufacturer
    case 'ComponentManufacturer':
      return 'Manufacturer';
    case 'OEM':
      return 'OEM';
    case 'FleetOperator':
      return 'Owner'; // ✅ Changed from 'OEM' to 'Owner' in session
    case 'AftermarketUser':
      return 'SecondLife';
    case 'Recycler':
      return 'Recycler';
    default:
      return 'Manufacturer'; // Default fallback
  }
}
```

**Cambio reciente**: FleetOperator ahora se muestra como "Owner" en lugar de "OEM" para mejor claridad.

---

## 🎨 SupplyChainGraph Component

### Características del Grafo
- **Librería**: ReactFlow
- **Layout**: Horizontal (izquierda a derecha)
- **Animación**: Edges animados con flechas
- **Colores por rol**: Cada rol tiene color distintivo
- **Iconos**: Emojis representativos por rol

### Configuración de Roles

```typescript
// web/src/components/charts/SupplyChainGraph.tsx:31-47
const roleColors = {
  Supplier: { bg: '#3b82f6', border: '#2563eb' },     // Blue
  Manufacturer: { bg: '#10b981', border: '#059669' },  // Green
  OEM: { bg: '#8b5cf6', border: '#7c3aed' },          // Purple
  Owner: { bg: '#06b6d4', border: '#0891b2' },        // Cyan ✅ NEW
  SecondLife: { bg: '#f59e0b', border: '#d97706' },   // Amber
  Recycler: { bg: '#6b7280', border: '#4b5563' },     // Gray
};

const roleIcons = {
  Supplier: '⛏️',
  Manufacturer: '🏭',
  OEM: '🚗',
  Owner: '👤',      // ✅ NEW
  SecondLife: '🔋',
  Recycler: '♻️',
};
```

### Generación de Nodos

```typescript
// web/src/components/charts/SupplyChainGraph.tsx:51-79
const initialNodes: Node[] = events.map((event, index) => {
  const color = roleColors[event.role];
  return {
    id: event.id,
    type: 'default',
    data: {
      label: (
        <div className="text-center px-2 py-1">
          <div className="text-2xl mb-1">{roleIcons[event.role]}</div>
          <div className="font-semibold text-sm">{event.role}</div>
          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            {new Date(event.timestamp).toLocaleDateString()}
          </div>
        </div>
      ),
    },
    position: { x: index * 250, y: 100 }, // Horizontal spacing
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    style: {
      background: color.bg,
      color: 'white',
      border: `2px solid ${color.border}`,
      borderRadius: '8px',
      padding: '10px',
      minWidth: '150px',
    },
  };
});
```

### Generación de Edges

```typescript
// web/src/components/charts/SupplyChainGraph.tsx:82-93
const initialEdges: Edge[] = events.slice(0, -1).map((event, index) => ({
  id: `e${event.id}-${events[index + 1].id}`,
  source: event.id,
  target: events[index + 1].id,
  type: 'smoothstep',
  animated: true,
  style: { stroke: '#64748b', strokeWidth: 2 },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#64748b',
  },
}));
```

---

## 🔌 Hooks y Data Fetching

### useTimelineEvents Hook

**Archivo**: `web/src/hooks/useTimelineEvents.ts`

**Responsabilidad**: Combinar eventos de TODAS las fuentes en un timeline unificado

**Hooks internos utilizados**:
```typescript
const { transfers } = useTransferHistory(bin);
const { events: secondLifeEvents } = useSecondLifeEvents(bin);
const { events: recyclingEvents } = useRecyclingEvents(bin);
const { events: dataVaultEvents } = useDataVaultEvents(bin);
const { events: sohEvents } = useSOHEvents(bin);
const { events: carbonEvents } = useCarbonFootprintEvents(bin);
```

**Proceso**:
1. Leer battery data de `BatteryRegistry.getBattery()`
2. Agregar evento de registration (manufacture date)
3. Agregar transfers de `useTransferHistory`
4. Agregar evento de integration si hay VIN
5. Agregar eventos de second life
6. Agregar eventos de recycling
7. Agregar eventos de SOH updates
8. Agregar eventos de telemetry, maintenance, critical
9. Agregar eventos de carbon footprint
10. **Ordenar cronológicamente** por timestamp

**Return**:
```typescript
return {
  timeline: TimelineEvent[],  // Ordenado cronológicamente
  isLoading: boolean,
};
```

---

### useTransferHistory Hook

**Archivo**: `web/src/hooks/useTransferHistory.ts`

**Responsabilidad**: Leer eventos `BatteryTransferred` de la blockchain

**Implementación**:
```typescript
const { data: logs } = useContractEvent({
  address: CONTRACTS.BatteryRegistry.address,
  abi: CONTRACTS.BatteryRegistry.abi,
  eventName: 'BatteryTransferred',
  // Filter por BIN
});

// Parse logs y construir array de transfers
const transfers = logs.map(log => ({
  id: `transfer-${log.blockNumber}-${log.transactionIndex}`,
  from: log.args.from,
  to: log.args.to,
  timestamp: log.blockTimestamp,
  blockNumber: log.blockNumber,
  transactionHash: log.transactionHash,
}));
```

---

### useSecondLifeEvents Hook

**Archivo**: `web/src/hooks/useSecondLifeEvents.ts`

**Eventos leídos**:
- `SecondLifeStarted`: Cuando se inicia second life
- `SecondLifeEnded`: Cuando termina second life

**Datos extraídos**:
```typescript
{
  id: string,
  type: 'started' | 'ended',
  timestamp: number,
  operator: address,
  applicationType: number, // 0-7 (Home Storage, Grid, Renewable, etc.)
  transactionHash: string,
}
```

---

### useRecyclingEvents Hook

**Archivo**: `web/src/hooks/useRecyclingEvents.ts`

**Eventos leídos**:
- `RecyclingStarted`: Batería recibida en facility
- `RecyclingCompleted`: Proceso completado

**Datos extraídos**:
```typescript
{
  id: string,
  type: 'started' | 'completed',
  timestamp: number,
  facility: address,
  transactionHash: string,
}
```

---

### useDataVaultEvents Hook

**Archivo**: `web/src/hooks/useDataVaultEvents.ts`

**Eventos leídos**:
- `TelemetryRecorded`: SOH, SOC, mileage, cycles
- `MaintenanceRecorded`: Tipo de mantenimiento, técnico, fecha
- `CriticalEventRecorded`: Tipo de evento, severidad, fecha

**Datos extraídos**:
```typescript
// Telemetry
{
  type: 'telemetry',
  soh: number,
  soc: number,
  mileage: number,
  chargeCycles: number,
  recordedBy: address,
  timestamp: number,
}

// Maintenance
{
  type: 'maintenance',
  maintenanceType: number, // 0-5 (Inspection, Repair, etc.)
  technicianId: string,
  serviceDate: number,
  recordedBy: address,
  timestamp: number,
}

// Critical
{
  type: 'critical',
  eventType: number, // 0-7 (Overheating, Overcurrent, etc.)
  severity: number, // 0-3 (Low, Medium, High, Critical)
  eventDate: number,
  recordedBy: address,
  timestamp: number,
}
```

---

### useSOHEvents Hook

**Archivo**: `web/src/hooks/useSOHEvents.ts`

**Evento leído**: `SOHUpdated`

**Datos extraídos**:
```typescript
{
  id: string,
  previousSOH: number, // Percentage (0-100)
  newSOH: number,      // Percentage (0-100)
  cycles: number,
  timestamp: number,
  transactionHash: string,
}
```

---

### useCarbonFootprintEvents Hook

**Archivo**: `web/src/hooks/useCarbonFootprintEvents.ts`

**Evento leído**: `EmissionAdded`

**Datos extraídos**:
```typescript
{
  id: string,
  phase: number, // 0-5
  phaseName: string, // Raw Materials, Manufacturing, etc.
  kgCO2e: number,
  recordedBy: address,
  timestamp: number,
  transactionHash: string,
}
```

---

## 📊 Arquitectura de Datos

### Flujo de Datos: Blockchain → Timeline

```
┌─────────────────────────────────────────────────────────────────┐
│                      SMART CONTRACTS                            │
├─────────────────────────────────────────────────────────────────┤
│  BatteryRegistry  │  SecondLifeManager  │  RecyclingManager    │
│  DataVault        │  CarbonFootprint    │  SupplyChainTracker  │
└─────────────────────────────────────────────────────────────────┘
                            ↓ Events
┌─────────────────────────────────────────────────────────────────┐
│                      SPECIALIZED HOOKS                          │
├─────────────────────────────────────────────────────────────────┤
│  useTransferHistory()       │  Read: BatteryTransferred        │
│  useSecondLifeEvents()      │  Read: SecondLifeStarted/Ended   │
│  useRecyclingEvents()       │  Read: RecyclingStarted/Completed│
│  useDataVaultEvents()       │  Read: Telemetry/Maintenance/... │
│  useSOHEvents()             │  Read: SOHUpdated                │
│  useCarbonFootprintEvents() │  Read: EmissionAdded             │
└─────────────────────────────────────────────────────────────────┘
                            ↓ Parsed Events
┌─────────────────────────────────────────────────────────────────┐
│                    useTimelineEvents()                          │
│  - Combines all events from specialized hooks                  │
│  - Adds registration event from battery data                   │
│  - Adds integration event if VIN exists                        │
│  - Sorts all events chronologically                            │
│  - Returns unified timeline array                              │
└─────────────────────────────────────────────────────────────────┘
                            ↓ timeline[]
┌─────────────────────────────────────────────────────────────────┐
│                  PASSPORT PAGE COMPONENT                        │
│  - Receives timeline array                                     │
│  - Renders vertical timeline with colored dots                 │
│  - Shows role badges, timestamps, descriptions                 │
│  - Displays metadata (tx hash, actors, values)                 │
└─────────────────────────────────────────────────────────────────┘
```

### Flujo de Datos: Blockchain → Supply Chain Graph

```
┌─────────────────────────────────────────────────────────────────┐
│                      BatteryRegistry                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                   useTransferHistory(bin)                       │
│  - Read BatteryTransferred events                              │
│  - Parse logs into transfer objects                            │
│  - Return { transfers[], transferCount }                       │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│              PASSPORT PAGE (Supply Chain Events)                │
│  - Add manufacturing event (from battery data)                 │
│  - Add transfer events (from useTransferHistory)               │
│  - Map addresses to roles using getSupplyChainRole()           │
│  - Map addresses to names using getDisplayName()               │
└─────────────────────────────────────────────────────────────────┘
                            ↓ supplyChainEvents[]
┌─────────────────────────────────────────────────────────────────┐
│                    SupplyChainGraph                             │
│  - Generate ReactFlow nodes (one per event)                    │
│  - Generate ReactFlow edges (between consecutive events)       │
│  - Apply colors and icons based on role                        │
│  - Render horizontal flow graph                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 💻 Código de Referencia

### Ejemplo de TimelineEvent Type

```typescript
export interface TimelineEvent {
  id: string;
  date: string;                    // ISO date string (YYYY-MM-DD)
  timestamp: number;               // Unix timestamp in seconds
  title: string;                   // Display title
  description: string;             // Detailed description
  type: 'registration' | 'transfer' | 'stateChange' | 'sohUpdate' |
        'integration' | 'recycling' | 'maintenance' | 'critical' |
        'carbonFootprint';
  role?: string;                   // Actor role (optional)
  actor?: string;                  // Ethereum address (optional)
  metadata?: Record<string, any>; // Additional data (optional)
}
```

### Ejemplo de SupplyChainEvent Type

```typescript
export interface SupplyChainEvent {
  id: string;
  role: 'Supplier' | 'Manufacturer' | 'OEM' | 'Owner' | 'SecondLife' | 'Recycler';
  timestamp: string;               // ISO date string
  actor: string;                   // Ethereum address
  description: string;             // Event description
}
```

### Ejemplo de Evento de Timeline Completo

```typescript
// Carbon Footprint Event (completo)
{
  id: "carbon-123456789-0",
  date: "2024-12-28",
  timestamp: 1735401600,
  title: "Carbon Emission Recorded: Manufacturing",
  description: "3400 kg CO₂e added for Manufacturing. Recorded by Auditor Account",
  type: "carbonFootprint",
  role: "Carbon Auditor",
  actor: "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
  metadata: {
    phase: 1,
    phaseName: "Manufacturing",
    kgCO2e: 3400,
    transactionHash: "0xabc123...",
  }
}
```

### Ejemplo de Integración en Passport Page

```typescript
// web/src/app/passport/[bin]/page.tsx

// 1. Get timeline data
const { timeline: timelineEvents } = useTimelineEvents(bin);

// 2. Get transfer history for supply chain
const { transfers: transferHistoryData, transferCount } = useTransferHistory(bin);

// 3. Build supply chain events
const supplyChainEvents = useMemo(() => {
  const events = [];

  // Manufacturing
  events.push({
    id: '0',
    role: 'Manufacturer',
    timestamp: parsedBatteryData.manufactureDate,
    actor: parsedBatteryData.manufacturer,
    description: 'Battery manufactured and registered',
  });

  // Transfers
  transferHistoryData.forEach((transfer, index) => {
    events.push({
      id: String(index + 1),
      role: getSupplyChainRole(transfer.to),
      timestamp: new Date(transfer.timestamp * 1000).toISOString(),
      actor: transfer.to,
      description: `Battery transferred to ${getDisplayName(transfer.to)}`,
    });
  });

  return events;
}, [transferHistoryData, parsedBatteryData]);

// 4. Render in tabs
<Tabs>
  <TabsContent value="timeline">
    {/* Render vertical timeline with timelineEvents */}
  </TabsContent>

  <TabsContent value="supply-chain">
    <SupplyChainGraph events={supplyChainEvents} />
    {/* List of supply chain events */}
  </TabsContent>
</Tabs>
```

---

## 🎯 Resumen de Mejoras Recientes

### Cambio 1: FleetOperator → Owner
**Ubicación**: `web/src/lib/roleMapping.ts`
```typescript
// ❌ ANTES
case 'FleetOperator':
  return 'OEM';

// ✅ DESPUÉS
case 'FleetOperator':
  return 'Owner';
```

**Impacto**:
- Supply Chain Graph ahora muestra "Owner" 👤 en cyan
- Timeline events de Fleet Operator muestran rol "Owner"
- Mejor claridad semántica (Fleet Operator = Owner del vehículo)

### Cambio 2: Agregado de Carbon Footprint Events
**Ubicación**: `web/src/hooks/useTimelineEvents.ts` (líneas 333-355)

**Nuevo tipo de evento**:
- Tipo: `carbonFootprint`
- Color: (necesita definirse en eventColors)
- Role: "Carbon Auditor"
- Metadata: phase, phaseName, kgCO2e, transactionHash

**Hook nuevo**: `useCarbonFootprintEvents(bin)`

---

## 📚 Referencias

### Archivos Clave
- **Passport Page**: `web/src/app/passport/[bin]/page.tsx`
- **Timeline Hook**: `web/src/hooks/useTimelineEvents.ts`
- **Transfer History**: `web/src/hooks/useTransferHistory.ts`
- **Second Life Events**: `web/src/hooks/useSecondLifeEvents.ts`
- **Recycling Events**: `web/src/hooks/useRecyclingEvents.ts`
- **DataVault Events**: `web/src/hooks/useDataVaultEvents.ts`
- **SOH Events**: `web/src/hooks/useSOHEvents.ts`
- **Carbon Events**: `web/src/hooks/useCarbonFootprintEvents.ts`
- **Supply Chain Graph**: `web/src/components/charts/SupplyChainGraph.tsx`
- **Role Mapping**: `web/src/lib/roleMapping.ts`

### Smart Contracts
- **BatteryRegistry**: Registration, transfers, SOH updates
- **SecondLifeManager**: Second life start/end
- **RecyclingManager**: Recycling start/complete
- **DataVault**: Telemetry, maintenance, critical events
- **CarbonFootprint**: Emission records

---

## 🏁 Conclusión

El sistema de Timeline y Supply Chain del Battery Passport es una **implementación completa de trazabilidad blockchain** que:

✅ **Lee datos 100% reales** de múltiples smart contracts
✅ **Combina 8+ tipos de eventos** diferentes en un timeline unificado
✅ **Ordena cronológicamente** todos los eventos
✅ **Visualiza de dos formas**: Timeline vertical + Supply Chain Graph horizontal
✅ **Mapea roles correctamente** usando address mapping
✅ **Muestra metadata completa** incluyendo transaction hashes
✅ **Es extensible** - fácil agregar nuevos tipos de eventos

La arquitectura de hooks especializados permite **modularidad y reutilización**, donde cada hook se enfoca en leer un tipo específico de evento, y `useTimelineEvents` los combina todos en un timeline coherente y ordenado.

---

**Documento generado**: 28 de Diciembre 2025
**Sistema**: Battery Circular Economy Platform - Battery Passport
**Status**: ✅ Documentación Completa
