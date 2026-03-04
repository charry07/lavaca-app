<div align="center">

# 🐄 La Vaca

### *Divide y paga cuentas entre amigos — sin dramas*

[![Node.js](https://img.shields.io/badge/Node.js-≥20-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-≥9-F69220?style=for-the-badge&logo=pnpm&logoColor=white)](https://pnpm.io/)
[![Expo](https://img.shields.io/badge/Expo-SDK51-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-Private-red?style=for-the-badge)](.)

---

> **La Vaca** es una app móvil para dividir y gestionar pagos grupales en tiempo real.  
> Crea una sesión, comparte el código o QR, y deja que la vaca lo maneje todo. 🐄

</div>

---

## ✨ Características principales

| Función | Descripción |
|---|---|
| ⚖️ **División igualitaria** | Divide el total en partes iguales automáticamente |
| 📊 **División por porcentaje** | Asigna % personalizados a cada participante |
| 🎰 **Ruleta** | Un participante aleatorio paga el total (¡o escapa!) |
| 📲 **QR + Código de unión** | Comparte la sesión al instante sin fricciones |
| 📷 **Escáner QR** | Escanea el QR con la cámara para unirte instantáneamente |
| ⚡ **Tiempo real** | Actualizaciones en vivo vía WebSockets (Socket.IO) — sin polling |
| 💳 **Múltiples métodos de pago** | Nequi, Daviplata, PSE, Transfiya, Cash y más |
| 🖼️ **Escaneo de recibo (OCR)** | Sube la foto y la vaca detecta el monto |
| 👥 **Grupos** | Crea grupos de amigos para sesiones recurrentes |
| 📰 **Feed de actividad** | Eventos sociales: pagadores rápidos, ganadores de ruleta, etc. |
| 🌗 **Glassmorphism UI** | Diseño premium oscuro con blur, gradientes y tokens de color |
| 🌐 **Multilenguaje** | Soporte i18n (Español, Inglés y más) |
| 🇨🇴 **Multi-moneda** | COP · USD · EUR |

---

## 🎰 Modos de división

```
┌─────────────────────────────────────────────────────────────┐
│                     SESIÓN: $120.000 COP                    │
├──────────────┬──────────────────┬───────────────────────────┤
│  ⚖️  IGUAL   │  📊  PORCENTAJE  │       🎰  RULETA          │
├──────────────┼──────────────────┼───────────────────────────┤
│  Ana  $30k   │  Ana    40% $48k │  Ana  ══╗                 │
│  Bob  $30k   │  Bob    35% $42k │  Bob  ══╬══► 🎯 Bob paga  │
│  Carl $30k   │  Carl   25% $30k │  Carl ══╝  todo $120k !   │
│  Día  $30k   │                  │  Día  (cowardly exit 🐔)  │
└──────────────┴──────────────────┴───────────────────────────┘
```

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                        LAVACA MONOREPO                          │
│                      (pnpm workspaces)                          │
│                                                                 │
│  ┌──────────────────────┐      ┌──────────────────────────┐    │
│  │   📱 @lavaca/mobile   │      │     🖥️  @lavaca/api       │    │
│  │  React Native + Expo │      │  Express + Socket.IO     │    │
│  │                      │◄────►│                          │    │
│  │  • Expo Router       │ REST │  • /api/sessions         │    │
│  │  • AuthContext       │  +   │  • /api/users            │    │
│  │  • i18n (ES/EN)      │  WS  │  • /api/feed             │    │
│  │  • ThemeContext      │      │  • /api/groups           │    │
│  │  • QR & Ruleta       │      │  • SQLite (mejor-sqlite3)│    │
│  └──────────────────────┘      └──────────────────────────┘    │
│              │                              │                   │
│              └──────────┬───────────────────┘                   │
│                         ▼                                       │
│              ┌──────────────────────┐                           │
│              │   📦 @lavaca/shared   │                           │
│              │  Tipos + Utilidades  │                           │
│              │  (TypeScript puro)   │                           │
│              └──────────────────────┘                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Estructura del proyecto

```
lavaca-app/
├── apps/
│   ├── mobile/                 # 📱 App React Native (Expo)
│   │   ├── app/
│   │   │   ├── (tabs)/         # Pestañas principales
│   │   │   │   ├── index.tsx   #  → Inicio / Sesiones activas
│   │   │   │   ├── feed.tsx    #  → Feed de actividad social
│   │   │   │   ├── groups.tsx  #  → Grupos de amigos
│   │   │   │   ├── history.tsx #  → Historial de pagos
│   │   │   │   └── profile.tsx #  → Perfil de usuario
│   │   │   ├── session/
│   │   │   │   └── [joinCode].tsx  # Vista de sesión en vivo
│   │   │   ├── group/
│   │   │   │   └── [id].tsx        # Detalle de grupo
│   │   │   ├── create.tsx      # Crear nueva sesión
│   │   │   ├── join.tsx        # Unirse con código
│   │   │   └── login.tsx       # Autenticación
│   │   └── src/
│   │       ├── auth/           # AuthContext + tokens
│   │       ├── components/     # GlassCard, SkeletonCard, EmptyState, ErrorState, Ruleta…
│   │       ├── hooks/          # useSocket, useSessionSocket (Socket.IO)
│   │       ├── i18n/           # Traducciones ES/EN/PT
│   │       ├── services/       # Cliente HTTP (api.ts)
│   │       ├── utils/          # baseUrl.ts, cameraPermission.ts
│   │       └── theme/          # ThemeContext claro/oscuro
│   │
│   └── api/                    # 🖥️ Backend Express
│       └── src/
│           ├── index.ts        # Entry point + Socket.IO
│           ├── db.ts           # Configuración SQLite
│           └── routes/
│               ├── sessions.ts # CRUD sesiones + pagos
│               ├── users.ts    # Registro / perfil
│               ├── groups.ts   # Grupos
│               └── feed.ts     # Eventos del feed
│
└── packages/
    └── shared/                 # 📦 Tipos y utilidades
        └── src/
            ├── types.ts        # Interfaces (Session, User, Debt…)
            └── utils.ts        # formatCOP, helpers
```

---

## 🚀 Primeros pasos

### Requisitos

| Herramienta | Versión mínima |
|---|---|
| Node.js | ≥ 20 |
| pnpm | ≥ 9 |
| Expo Go (dispositivo) | última |

### Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/charry07/lavaca-app.git
cd lavaca-app

# 2. Instalar dependencias (todos los workspaces)
pnpm install

# 3. Instalar paquetes nativos de Expo (si se instala en un entorno limpio)
cd apps/mobile
expo install expo-blur expo-linear-gradient expo-camera
pnpm add socket.io-client
```

### Desarrollo

```bash
# Iniciar la API backend (puerto 3001)
pnpm dev:api

# Iniciar la app móvil (Expo)
pnpm dev:mobile
```

> Escanea el QR con **Expo Go** en tu teléfono o presiona `i` para iOS / `a` para Android en el emulador.

### Verificar la API

```bash
curl http://localhost:3001/health
# → { "status": "ok", "name": "La Vaca API", "version": "0.1.0" }
```

---

## 🛰️ API Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/health` | Estado de la API |
| `POST` | `/api/sessions` | Crear sesión de pago |
| `GET` | `/api/sessions/:joinCode` | Obtener sesión por código |
| `POST` | `/api/sessions/:joinCode/join` | Unirse a una sesión |
| `POST` | `/api/sessions/:joinCode/pay` | Registrar pago |
| `GET` | `/api/users/:id` | Perfil de usuario |
| `GET` | `/api/groups` | Listar grupos |
| `GET` | `/api/feed` | Feed de eventos |

### WebSocket events

```
Cliente → Servidor       Servidor → Cliente
─────────────────────    ─────────────────────
join-session (code)      session-update (data)
leave-session (code)
```

> El cliente se une a la room del `joinCode` y recibe `session-update` con el objeto `PaymentSession` completo cada vez que un participante se une, paga, o la sesión cambia de estado.

---

## 🧩 Tipos principales

```typescript
// Un participante en una sesión de pago
interface Participant {
  userId: string;
  displayName: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'failed' | 'rejected';
  paymentMethod?: 'nequi' | 'daviplata' | 'pse' | 'transfiya' | 'cash' | 'other';
  isRouletteWinner?: boolean;   // 🎰 ganó la ruleta (paga todo)
  isRouletteCoward?: boolean;   // 🐔 se rindió antes de que la ruleta girara
}
```

---

## 🧱 Stack tecnológico

| Capa | Tecnología |
|---|---|
| **App móvil** | React Native · Expo · Expo Router |
| **Lenguaje** | TypeScript 5 |
| **Backend** | Node.js · Express · Socket.IO |
| **Base de datos** | SQLite (`better-sqlite3`) |
| **Monorepo** | pnpm workspaces |
| **Deploy** | Azure App Service + Azure Static Web Apps |
| **UI / Glassmorphism** | `expo-blur` · `expo-linear-gradient` |
| **Cámara / QR Scan** | `expo-camera` (`CameraView`) |
| **WebSocket cliente** | `socket.io-client` |
| **QR generación** | `react-native-qrcode-svg` |
| **OCR / Recibos** | Carga de imagen + procesamiento en API |

---

## 🔄 Flujo de una sesión

```
  [Admin crea sesión]
        │
        ▼
  ┌───────────┐    comparte QR / código
  │  Sesión   │──────────────────────────► [Participante se une]
  │  abierta  │◄──────────────────────────      join-session WS
  └───────────┘
        │
        │  cada pago actualiza en tiempo real
        ▼
  ┌───────────────────────────────┐
  │  ✅ confirmado   ⏳ pendiente  │
  │  ❌ rechazado   💸 recordatorio│
  └───────────────────────────────┘
        │
   todos pagan
        │
        ▼
  [Sesión cerrada → aparece en Feed + Historial]
```

---

## 📜 Scripts disponibles

```bash
pnpm dev:mobile       # Iniciar app Expo
pnpm dev:api          # Iniciar API con hot-reload
pnpm build:api        # Build de producción de la API
pnpm lint             # Lint en todos los workspaces
pnpm typecheck        # Verificación de tipos TypeScript
pnpm clean            # Limpiar builds
```

---

<div align="center">

Hecho con ☕ y 🐄 en Colombia.

</div>
