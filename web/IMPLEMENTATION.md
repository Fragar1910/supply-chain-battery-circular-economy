# 🔋 Battery Circular Economy - Web Implementation

## 📋 Resumen Ejecutivo

Implementación completa de una aplicación web Next.js para la trazabilidad de baterías de vehículos eléctricos, cumpliendo con el EU Battery Passport 2027. La aplicación utiliza blockchain para garantizar transparencia y trazabilidad en todo el ciclo de vida de las baterías.

**Estado**: ✅ Fase 1 Completada - Páginas Principales y Componentes Core
**Framework**: Next.js 16.0.7 + React 19 + TypeScript
**Estilo**: Tailwind CSS 4 + shadcn-ui (Estilo Northvolt)
**Blockchain**: Ethereum/Anvil Local + Wagmi + RainbowKit + Ethers.js

---

## 🎯 Objetivos Cumplidos

### ✅ Fase 1: Setup y Componentes Base
- [x] Instalación de dependencias (recharts, reactflow, leaflet, html5-qrcode, lucide-react)
- [x] Configuración de shadcn-ui con Tailwind CSS 4
- [x] Estructura de carpetas para componentes
- [x] Componentes UI base (Button, Card, Badge, Skeleton, Tabs)
- [x] Utilidades CSS (cn function con clsx + tailwind-merge)

### ✅ Fase 2: Componentes Especializados
- [x] **BatteryCard** - Tarjeta resumen de batería
- [x] **SupplyChainGraph** - Visualización con react-flow
- [x] **CarbonFootprintChart** - Gráficos con recharts
- [x] **QRScanner** - Modo manual + modo cámara

### ✅ Fase 3: Páginas Principales
- [x] **Landing (/)** - Hero + Features + CTA
- [x] **Dashboard (/dashboard)** - KPIs generales + tabs
- [x] **Battery Passport (/passport/[bin])** - Trazabilidad completa

---

## 📦 Dependencias Instaladas

```json
{
  "dependencies": {
    "@rainbow-me/rainbowkit": "^2.2.10",
    "@tanstack/react-query": "^5.90.12",
    "ethers": "^6.16.0",
    "next": "16.0.7",
    "react": "19.2.0",
    "react-dom": "19.2.0",
    "viem": "^2.41.2",
    "wagmi": "^2.19.5",
    "recharts": "latest",
    "reactflow": "latest",
    "leaflet": "latest",
    "react-leaflet": "latest",
    "html5-qrcode": "latest",
    "class-variance-authority": "latest",
    "clsx": "latest",
    "tailwind-merge": "latest",
    "lucide-react": "latest"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.0.7",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

---

## 📁 Estructura de Archivos

```
web/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout con Web3 providers
│   │   ├── page.tsx                      # Landing page (Hero + Features)
│   │   ├── dashboard/
│   │   │   └── page.tsx                  # Dashboard general con KPIs
│   │   └── passport/
│   │       └── [bin]/
│   │           └── page.tsx              # Battery Passport dinámico
│   │
│   ├── components/
│   │   ├── ui/                           # shadcn-ui components
│   │   │   ├── button.tsx                # Variantes: default, destructive, outline, etc.
│   │   │   ├── card.tsx                  # Card + CardHeader + CardTitle + CardContent
│   │   │   ├── badge.tsx                 # Variantes: default, success, warning, etc.
│   │   │   ├── skeleton.tsx              # Loading placeholders
│   │   │   ├── tabs.tsx                  # Tabs + TabsList + TabsTrigger + TabsContent
│   │   │   └── index.ts                  # Barrel exports
│   │   │
│   │   ├── battery/                      # Battery-specific components
│   │   │   ├── BatteryCard.tsx           # Tarjeta resumen con SOH, carbon, status
│   │   │   ├── QRScanner.tsx             # Scanner con modo manual/cámara
│   │   │   └── index.ts
│   │   │
│   │   └── charts/                       # Visualization components
│   │       ├── CarbonFootprintChart.tsx  # Bar chart con recharts
│   │       ├── SupplyChainGraph.tsx      # Flow diagram con reactflow
│   │       └── index.ts
│   │
│   ├── lib/
│   │   ├── utils.ts                      # cn() utility function
│   │   ├── Web3Context.tsx               # RainbowKit + Wagmi providers
│   │   └── contracts/                    # Smart contract ABIs
│   │       ├── BatteryRegistry.ts
│   │       ├── RoleManager.ts
│   │       ├── SupplyChainTracker.ts
│   │       ├── DataVault.ts
│   │       ├── CarbonFootprint.ts
│   │       ├── SecondLifeManager.ts
│   │       ├── RecyclingManager.ts
│   │       └── index.ts
│   │
│   ├── hooks/
│   │   ├── useWallet.ts                  # Hook para wallet connection
│   │   ├── useContract.ts                # Hook para contract interactions
│   │   ├── useRole.ts                    # Hook para role checking
│   │   └── index.ts
│   │
│   └── config/
│       └── contracts.ts                  # Contract addresses + ABIs
│
├── public/
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── tailwind.config.js (implícito en Tailwind 4)
└── IMPLEMENTATION.md (este archivo)
```

---

## 🎨 Componentes Implementados

### 1. Componentes UI Base (shadcn-ui)

#### **Button** (`components/ui/button.tsx`)
```tsx
// Variantes disponibles
variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
size: 'default' | 'sm' | 'lg' | 'icon'

// Ejemplo de uso
<Button variant="outline" size="lg">Click me</Button>
```

#### **Card** (`components/ui/card.tsx`)
```tsx
<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
    <CardDescription>Descripción</CardDescription>
  </CardHeader>
  <CardContent>Contenido</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>
```

#### **Badge** (`components/ui/badge.tsx`)
```tsx
// Variantes disponibles
variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'

// Ejemplo
<Badge variant="success">First Life</Badge>
```

#### **Tabs** (`components/ui/tabs.tsx`)
```tsx
<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="details">Details</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">Content 1</TabsContent>
  <TabsContent value="details">Content 2</TabsContent>
</Tabs>
```

---

### 2. Componentes Especializados

#### **BatteryCard** (`components/battery/BatteryCard.tsx`)

**Props:**
```tsx
interface BatteryData {
  bin: string;
  manufacturer?: string;
  status: 'FirstLife' | 'SecondLife' | 'Recycled' | 'Manufactured';
  soh?: number; // State of Health (0-100)
  carbonFootprint?: number; // kg CO2
  manufactureDate?: string;
  currentOwner?: string;
  location?: string;
}

interface BatteryCardProps {
  battery: BatteryData;
  onClick?: () => void;
  className?: string;
}
```

**Características:**
- Badge de status con colores (FirstLife=green, SecondLife=yellow, Recycled=gray)
- Barra de progreso de SOH con colores dinámicos (>80%=green, >60%=yellow, <60%=red)
- Iconos de lucide-react (Battery, TrendingUp, Leaf, Calendar)
- Hover effects con scale y shadow
- Click handler para navegación

**Ejemplo de uso:**
```tsx
<BatteryCard
  battery={{
    bin: 'BAT-2024-001',
    manufacturer: 'Northvolt AB',
    status: 'FirstLife',
    soh: 98,
    carbonFootprint: 5600,
    manufactureDate: '2024-01-15',
  }}
  onClick={() => router.push('/passport/BAT-2024-001')}
/>
```

---

#### **SupplyChainGraph** (`components/charts/SupplyChainGraph.tsx`)

**Props:**
```tsx
interface SupplyChainEvent {
  id: string;
  role: 'Supplier' | 'Manufacturer' | 'OEM' | 'SecondLife' | 'Recycler';
  timestamp: string;
  actor: string;
  description: string;
}

interface SupplyChainGraphProps {
  events: SupplyChainEvent[];
  className?: string;
}
```

**Características:**
- Visualización horizontal de etapas con react-flow
- Nodos con iconos emoji por rol (⛏️ Supplier, 🏭 Manufacturer, 🚗 OEM, 🔋 SecondLife, ♻️ Recycler)
- Colores personalizados por rol
- Edges animados con flechas
- MiniMap y controles de navegación incluidos
- Responsive y auto-fit

**Ejemplo de uso:**
```tsx
<SupplyChainGraph
  events={[
    { id: '1', role: 'Supplier', timestamp: '2023-11-20', actor: '0x123...', description: 'Lithium extraction' },
    { id: '2', role: 'Manufacturer', timestamp: '2024-01-15', actor: '0x456...', description: 'Battery manufactured' },
  ]}
/>
```

---

#### **CarbonFootprintChart** (`components/charts/CarbonFootprintChart.tsx`)

**Props:**
```tsx
interface CarbonFootprintData {
  stage: string;
  emissions: number;
  color?: string;
}

interface CarbonFootprintChartProps {
  data: CarbonFootprintData[];
  title?: string;
  description?: string;
  className?: string;
}
```

**Características:**
- Bar chart con recharts
- Colores personalizados por etapa
- Total de emisiones en descripción
- Tooltip con formato de números
- Responsive container (100% width, 300px height)
- Grid y axis labels configurados

**Ejemplo de uso:**
```tsx
<CarbonFootprintChart
  data={[
    { stage: 'Mining', emissions: 1200, color: '#3b82f6' },
    { stage: 'Manufacturing', emissions: 3400, color: '#10b981' },
  ]}
  title="Carbon Footprint by Stage"
  description="Total CO₂ emissions throughout the supply chain"
/>
```

---

#### **QRScanner** (`components/battery/QRScanner.tsx`)

**Props:**
```tsx
interface QRScannerProps {
  onScan: (bin: string) => void;
  onClose?: () => void;
  title?: string;
  description?: string;
}
```

**Características:**
- **Modo Manual**: Input de texto para BIN
- **Modo Cámara**: Escaneo real con html5-qrcode
- Toggle entre modos con botones
- Manejo de permisos de cámara
- Error handling para cámara no disponible
- Auto-stop de cámara al escanear código
- Clean UI con iconos (Keyboard, Camera)

**Ejemplo de uso:**
```tsx
<QRScanner
  onScan={(bin) => router.push(`/passport/${bin}`)}
  onClose={() => setShowScanner(false)}
/>
```

---

## 📄 Páginas Implementadas

### 1. Landing Page (`/`)

**Ruta**: `app/page.tsx`

**Secciones:**
1. **Header** (sticky)
   - Logo + título
   - Botón "Dashboard" (si conectado)
   - ConnectButton (RainbowKit)

2. **Hero Section**
   - Badge "EU Regulation Compliant • Battery Passport 2027"
   - Título principal con gradiente
   - Descripción
   - CTAs: "Go to Dashboard" / "View Sample Passport"
   - Stats: Batteries Tracked, 100% Transparency, 2027 EU Compliant

3. **Features Section**
   - 4 cards con iconos:
     - Full Traceability (Globe)
     - Carbon Footprint (Leaf)
     - EU Compliant (Shield)
     - Circular Economy (Battery)

4. **Multi-Stakeholder Section**
   - 5 actores con iconos emoji
   - Suppliers, Manufacturers, OEMs, Second Life, Recyclers

5. **CTA Section**
   - Card con gradiente verde
   - "Ready to Get Started?"
   - ConnectButton o "Go to Dashboard"

6. **Footer**
   - Logo + copyright
   - "Powered by Blockchain Technology"

**Integración Blockchain:**
```tsx
const { data: totalBatteries } = useReadContract({
  address: CONTRACTS.BatteryRegistry.address,
  abi: CONTRACTS.BatteryRegistry.abi,
  functionName: 'totalBatteriesRegistered',
  query: { enabled: isConnected },
});
```

---

### 2. Dashboard (`/dashboard`)

**Ruta**: `app/dashboard/page.tsx`

**Secciones:**

1. **Header**
   - Back button a "/"
   - Título "Dashboard"
   - Botón "Scan QR"

2. **KPI Cards** (4 cards en grid)
   - Total Batteries (de BatteryRegistry)
   - Supply Chain Actors (de RoleManager)
   - Avg. Carbon Footprint (mock: 5.2 tons)
   - Avg. SOH (mock: 89%)

3. **Tabs**
   - **Overview**:
     - CarbonFootprintChart
     - Recent Batteries (grid de BatteryCards)

   - **Batteries**:
     - Search bar
     - Grid completo de BatteryCards

   - **Analytics**:
     - CarbonFootprintChart detallado
     - Status Distribution (badges con %)
     - Key Metrics (progress bars)

4. **QR Scanner Modal**
   - Overlay con backdrop blur
   - QRScanner component
   - onScan → redirect a `/passport/{bin}`

**Protección de Ruta:**
```tsx
if (!isConnected) {
  return <Card>Connect Wallet Required</Card>;
}
```

---

### 3. Battery Passport (`/passport/[bin]`)

**Ruta**: `app/passport/[bin]/page.tsx`

**Parámetro Dinámico:**
```tsx
interface BatteryPassportPageProps {
  params: Promise<{ bin: string }>;
}

const { bin } = use(params);
```

**Secciones:**

1. **Header**
   - Back button a "/dashboard"
   - Título "Battery Passport"
   - Botones: Share, Export

2. **Battery Header Card**
   - Icono de batería
   - BIN + Status badge
   - Manufacturer, fecha, ubicación
   - 2 stats destacados: SOH %, Carbon footprint

3. **Tabs** (4 pestañas)

   **a) Overview**:
   - Technical Specifications (Chemistry, Capacity, Weight, VIN)
   - Current Ownership (Owner address, Status, Location)
   - Performance Metrics (SOH bar, Remaining Capacity bar)

   **b) Supply Chain**:
   - SupplyChainGraph visual
   - Supply Chain Events (lista de eventos con badges)

   **c) Carbon**:
   - CarbonFootprintChart
   - Carbon Impact Details (breakdown por etapa con % y kg)

   **d) Timeline**:
   - Vertical timeline con dots y líneas
   - Cada evento: fecha, título, descripción, badge de rol

**Datos Mock** (en producción se reemplazarán con lecturas de blockchain):
```tsx
const batteryData = {
  bin: bin,
  vin: 'WBA12345678901234',
  manufacturer: 'Northvolt AB',
  manufactureDate: '2024-01-15',
  status: 'FirstLife',
  soh: 98,
  capacity: 85,
  chemistry: 'NMC811',
  weight: 450,
  location: 'Stockholm, Sweden',
  currentOwner: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  carbonFootprint: 5600,
};
```

---

## 🎨 Sistema de Diseño (Estilo Northvolt)

### Paleta de Colores

**Backgrounds:**
```css
/* Gradiente principal */
bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950

/* Cards */
bg-slate-900/50   /* Cards principales */
bg-slate-800/50   /* Cards secundarios */
bg-slate-800      /* Inputs, elementos sólidos */
```

**Borders:**
```css
border-slate-800  /* Bordes principales */
border-slate-700  /* Bordes secundarios */
```

**Text:**
```css
text-white        /* Títulos, contenido principal */
text-slate-400    /* Descripciones, labels */
text-slate-500    /* Texto terciario */
text-slate-300    /* Valores, datos importantes */
```

**Accents:**
```css
/* Green (Primary) */
bg-green-500, text-green-500, border-green-500

/* Status Colors */
blue-600    /* Manufactured */
green-600   /* First Life */
yellow-600  /* Second Life */
slate-600   /* Recycled */

/* Semantic Colors */
red-600     /* Destructive, alerts */
purple-500  /* EU Compliance */
```

### Tipografía

```css
/* Headings */
text-5xl md:text-6xl font-bold  /* Hero titles */
text-3xl font-bold              /* Section titles */
text-2xl font-bold              /* Card titles */
text-xl font-bold               /* Page titles */
text-lg font-semibold           /* Subsections */

/* Body */
text-sm                         /* Default text */
text-xs                         /* Small text, labels */
text-base                       /* Regular text */
```

### Efectos y Transiciones

```css
/* Hover Effects */
hover:shadow-lg hover:scale-[1.02]  /* Cards */
hover:bg-slate-800                   /* Buttons, links */
hover:border-green-500/50            /* Interactive borders */

/* Transitions */
transition-all                       /* Smooth transitions */
transition-colors                    /* Color transitions */

/* Backdrop */
backdrop-blur-sm                     /* Header, modals */
```

### Spacing

```css
/* Container */
max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8

/* Gaps */
gap-4   /* Grid items */
gap-6   /* Larger grids */
gap-8   /* Sections */

/* Padding */
p-4, p-6, p-8   /* Card padding */
py-24           /* Section spacing */
```

---

## 🔧 Hooks Personalizados

### **useWallet** (`hooks/useWallet.ts`)
```tsx
const { address, balance, isConnected, isCorrectNetwork } = useWallet();
```

**Retorna:**
- `address`: string | undefined - Dirección de la wallet conectada
- `balance`: string | undefined - Balance en ETH
- `isConnected`: boolean - Estado de conexión
- `isCorrectNetwork`: boolean - Verifica si está en Anvil (chainId 31337)

---

### **useRole** (`hooks/useRole.ts`)
```tsx
const { hasRole, isLoading } = useRole('BatteryRegistry', 'ADMIN_ROLE');
```

**Parámetros:**
- `contractName`: 'BatteryRegistry' | 'RoleManager' | etc.
- `role`: string - Nombre del rol (ej: 'ADMIN_ROLE', 'MANUFACTURER_ROLE')

**Retorna:**
- `hasRole`: boolean - Si el usuario tiene el rol
- `isLoading`: boolean - Estado de carga

---

### **useContract** (`hooks/useContract.ts`)
```tsx
const { read, write, isLoading, error } = useContract('BatteryRegistry');
```

**Funcionalidad:**
- Wrapper para interacciones con contratos
- Manejo de errores automático
- Loading states

---

## 🔗 Integración Blockchain

### Configuración de Contratos (`config/contracts.ts`)

```tsx
export const CONTRACTS = {
  BatteryRegistry: {
    address: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    abi: [...],
  },
  RoleManager: {
    address: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    abi: [...],
  },
  // ... otros contratos
};
```

### Lecturas de Datos

**Ejemplo - Total Batteries:**
```tsx
const { data: totalBatteries } = useReadContract({
  address: CONTRACTS.BatteryRegistry.address,
  abi: CONTRACTS.BatteryRegistry.abi,
  functionName: 'totalBatteriesRegistered',
  query: {
    enabled: isConnected,
  },
});
```

### Escrituras (pendiente implementar en formularios)
```tsx
const { writeContract } = useWriteContract();

await writeContract({
  address: CONTRACTS.BatteryRegistry.address,
  abi: CONTRACTS.BatteryRegistry.abi,
  functionName: 'registerBattery',
  args: [bin, manufacturer, capacity, chemistry],
});
```

---

## 🚀 Comandos de Desarrollo

### Instalación
```bash
npm install
```

### Desarrollo
```bash
npm run dev
# Servidor en http://localhost:3000
```

### Build
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

---

## 📊 Rendimiento y Optimización

### Next.js 16 con Turbopack
- **Tiempo de inicio**: ~500-600ms
- **Hot reload**: <100ms
- **Build optimizado**: Automático con Next.js

### Lazy Loading
- Componentes cargados bajo demanda
- Dynamic imports para modales pesados (QRScanner)

### Imágenes
- Next/Image para optimización automática
- WebP support

---

## 🔒 Seguridad

### Wallet Connection
- RainbowKit con múltiples wallets soportadas
- Network validation (Anvil chainId 31337)
- Auto-disconnect en cambio de red

### Smart Contracts
- ABIs inmutables en config
- Validación de addresses
- Error handling en todas las llamadas

### Input Validation
- TypeScript strict mode
- Props validation con interfaces
- Form validation (pendiente en formularios)

---

## 📱 Responsive Design

### Breakpoints
```css
sm: 640px   /* Tablets */
md: 768px   /* Desktop pequeño */
lg: 1024px  /* Desktop */
xl: 1280px  /* Desktop grande */
```

### Grid Systems
```tsx
/* Mobile-first */
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4

/* Ejemplo de KPI cards */
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  <Card>...</Card>
</div>
```

---

## 🧪 Testing (Pendiente)

### Plan de Testing
1. **Unit Tests**: Componentes aislados con Jest + React Testing Library
2. **Integration Tests**: Flujos de usuario con Playwright
3. **E2E Tests**: Interacciones con blockchain en testnet
4. **Visual Regression**: Chromatic o Percy

---

## 🎯 Próximos Pasos (En Desarrollo)

### 1. Layout Común con Sidebar
- Sidebar navigation persistente
- Menú colapsable en mobile
- Active state en rutas
- User profile section

### 2. Role-Specific Dashboards
- `/dashboard/supplier` - Gestión de materias primas
- `/dashboard/manufacturer` - Producción de baterías
- `/dashboard/oem` - Integración en vehículos
- `/dashboard/recycler` - Procesamiento de fin de vida

### 3. Integración Real con Contratos
- Reemplazar datos mock con lecturas reales
- Event listeners para actualizaciones en tiempo real
- Optimistic updates en UI

### 4. Formularios
- Registro de nuevas baterías
- Transferencia de ownership
- Actualización de SOH
- Registro de eventos de supply chain

### 5. Mapas con Leaflet
- Mapa interactivo de ubicaciones
- Markers por tipo de actor
- Tooltips con información
- Rutas de transporte

### 6. Autenticación y Permisos
- Sistema de roles basado en RoleManager
- Protected routes por rol
- UI condicional según permisos
- Admin panel para gestión de roles

---

## 📚 Referencias

### Documentación
- [Next.js 16](https://nextjs.org/docs)
- [Tailwind CSS 4](https://tailwindcss.com/docs)
- [shadcn-ui](https://ui.shadcn.com/)
- [Wagmi](https://wagmi.sh/)
- [RainbowKit](https://rainbowkit.com/)
- [Recharts](https://recharts.org/)
- [React Flow](https://reactflow.dev/)

### Diseño
- Inspiración: [Northvolt](https://northvolt.com/)
- Colores: Slate/Gray + Green/Emerald
- Icons: [Lucide React](https://lucide.dev/)

---

## 👥 Contribución

### Git Workflow
```bash
# Crear rama para nueva feature
git checkout -b feature/role-dashboards

# Commit con mensaje descriptivo
git commit -m "feat: add supplier dashboard with material tracking"

# Push y crear PR
git push origin feature/role-dashboards
```

### Convenciones de Código
- TypeScript strict mode
- ESLint + Prettier
- Conventional Commits
- Component naming: PascalCase
- File naming: PascalCase para componentes, camelCase para utils

---

## 📄 Licencia

Este proyecto es parte de un Proyecto Final de Máster (PFM) educativo.

---

**Última actualización**: 2024-12-07
**Versión**: 1.0.0
**Estado**: ✅ Fase 1 Completada, Fase 2 En Desarrollo
