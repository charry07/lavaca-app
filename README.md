<div align="center">

# 🐄 La Vaca

### *Divide y paga cuentas entre amigos — sin dramas*

[![Node.js](https://img.shields.io/badge/Node.js-≥20-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-≥9-F69220?style=for-the-badge&logo=pnpm&logoColor=white)](https://pnpm.io/)
[![Expo](https://img.shields.io/badge/Expo-SDK54-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
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
| ⚡ **Tiempo real** | Actualizaciones en vivo vía Supabase Realtime (`postgres_changes`) — sin polling |
| 👥 **Participantes frecuentes** | Los 7 más recientes aparecen al instante al crear una mesa; rellena con sugeridos si no hay suficientes |
| 👥 **Grupos** | Crea grupos de amigos para sesiones recurrentes |
| 📰 **Feed de actividad** | Eventos sociales: pagadores rápidos, ganadores de ruleta, etc. |
| 🌗 **Diseño espresso & dorado** | Paleta colombiana — fondo café, acento dorado, verde esmeralda; barra lateral de acento por estado en todas las tarjetas |
| 🌐 **Multilenguaje** | i18n completo: Español · Inglés · Português |
| 🇨🇴 **Multi-moneda** | COP · USD · EUR |
| 🔒 **Seguridad** | Helmet, CORS por entorno, rate limiting OTP, límite de body 256 KB |

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
│   ┌──────────────────────┐   ┌──────────────────────────────┐   │
│   │   📱 @lavaca/mobile   │   │       ☁️ Supabase            │   │
│   │  React Native + Expo │   │  Auth + Postgres + Realtime │   │
│   │                      │◄─►│                              │   │
│   │  • Expo Router       │   │  • users / sessions         │   │
│   │  • AuthContext       │   │  • participants / groups    │   │
│   │  • i18n (ES/EN/PT)   │   │  • feed_events              │   │
│   │  • ThemeContext      │   │  • RLS + migrations         │   │
│   │  • QR & Ruleta       │   │                              │   │
│   └──────────────────────┘   └──────────────────────────────┘   │
│                 │                        │                       │
│                 └──────────┬─────────────┘                       │
│                            ▼                                     │
│      ┌──────────────────────┐   ┌──────────────────────┐         │
│      │   📦 @lavaca/shared   │   │  📦 @lavaca/supabase │         │
│      │  Tipos + Utilidades  │   │  cliente compartido  │         │
│      └──────────────────────┘   └──────────────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Estructura del proyecto

```
lavaca-app/
├── apps/
│   ├── mobile/                 # 📱 App React Native (Expo SDK 54)
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
│   │   │   ├── join.tsx        # Unirse con código o QR
│   │   │   └── login.tsx       # Autenticación OTP
│   │   └── src/
│   │       ├── auth/           # AuthContext + flujo OTP
│   │       ├── components/     # GlassCard, SkeletonCard, EmptyState, ErrorState…
│   │       ├── constants/      # theme.ts — tokens de diseño
│   │       ├── hooks/          # useSocket, useSessionSocket (Supabase Realtime)
│   │       ├── i18n/           # Traducciones ES/EN/PT
│   │       ├── services/       # Cliente HTTP (api.ts)
│   │       └── theme/          # ThemeContext claro/oscuro
└── packages/
  ├── supabase/               # 📦 Cliente Supabase compartido
    └── shared/                 # 📦 Tipos y utilidades compartidas
        └── src/
            ├── types.ts        # Interfaces (Session, User, Participant, Debt…)
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

# 2. Instalar todas las dependencias (todos los workspaces)
pnpm install
```

### Desarrollo

```bash
# Terminal 1 — App móvil (Expo)
pnpm dev:mobile

# Para web (útil en desarrollo rápido)
cd apps/mobile && npx expo start --web
```

> Escanea el QR con **Expo Go** en tu teléfono o presiona `w` para web, `i` para iOS, `a` para Android.

### Backend actual

La app está migrando a Supabase (Auth, Postgres y Realtime). El backend Express local fue retirado del flujo principal.

---

## 🛰️ API Endpoints

### Usuarios

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/users/send-otp` | Enviar OTP al teléfono |
| `POST` | `/api/users/resend-otp` | Reenviar OTP (cooldown 60s) |
| `POST` | `/api/users/verify-otp` | Verificar código OTP |
| `POST` | `/api/users/register` | Registrar nuevo usuario |
| `POST` | `/api/users/login` | Login por teléfono |
| `GET` | `/api/users/search?q=` | Buscar usuarios (mín. 2 chars) |
| `GET` | `/api/users/random?limit=&exclude=` | Usuarios aleatorios para sugerencias |
| `GET` | `/api/users/:id` | Perfil de usuario |
| `PUT` | `/api/users/:id` | Actualizar perfil (avatar hasta 4 MB) |
| `DELETE` | `/api/users/:id` | Eliminar cuenta |
| `GET` | `/api/users/:id/history` | Historial de mesas |
| `GET` | `/api/users/:id/frequent?limit=7` | Personas con quienes más comparte mesas |

### Sesiones

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/sessions` | Crear sesión de pago |
| `GET` | `/api/sessions/:joinCode` | Obtener sesión por código |
| `POST` | `/api/sessions/:joinCode/join` | Unirse a una sesión |
| `POST` | `/api/sessions/:joinCode/split` | Calcular división |
| `POST` | `/api/sessions/:joinCode/pay` | Admin marca pago (directo) |
| `POST` | `/api/sessions/:joinCode/pay/report` | Participante reporta pago |
| `POST` | `/api/sessions/:joinCode/pay/approve` | Admin aprueba pago reportado |
| `PATCH` | `/api/sessions/:joinCode/close` | Cerrar sesión (admin) |
| `DELETE` | `/api/sessions/:joinCode` | Eliminar sesión (admin) |

### WebSocket events

```
Cliente → Servidor       Servidor → Cliente
─────────────────────    ─────────────────────
join-session (code)      session-update (data)
leave-session (code)
```

---

## 🎨 Sistema de diseño

La paleta está inspirada en el interior de un café colombiano de noche:

| Token | Valor (dark) | Significado |
|---|---|---|
| `background` | `#0f0f0e` | Fondo base — casi neutro oscuro |
| `surface2` | `#232220` | Superficie elevada — tarjetas |
| `accent` | `#f0a830` | Dorado — billetes de peso colombiano |
| `primary` | `#2ed97b` | Esmeralda tropical |
| `surfaceBorder` | `rgba(240,168,48,0.10)` | Borde dorado suave |

**Elemento firma:** Barra de acento izquierda de 3px en todas las tarjetas de sesión, historial y participantes — coloreada según el estado (verde=abierta, rojo=cerrada, gris=cancelada).

---

## 🧩 Tipos principales

```typescript
interface PaymentSession {
  id: string;
  joinCode: string;          // e.g. "VACA-Y6QM"
  adminId: string;
  totalAmount: number;
  currency: string;
  splitMode: 'equal' | 'percentage' | 'roulette';
  status: 'open' | 'closed' | 'cancelled';
  participants: Participant[];
  createdAt: Date;
}

interface Participant {
  userId: string;
  displayName: string;
  amount: number;
  status: 'pending' | 'reported' | 'confirmed' | 'rejected' | 'failed';
  isRouletteWinner?: boolean;   // 🎰 paga todo
  isRouletteCoward?: boolean;   // 🐔 escapó antes del giro
}
```

---

## 🧱 Stack tecnológico

| Capa | Tecnología |
|---|---|
| **App móvil** | React Native · Expo SDK 54 · Expo Router |
| **Lenguaje** | TypeScript 5 |
| **Backend** | Supabase (Auth · Postgres · Realtime) |
| **Seguridad** | Supabase Auth + RLS + políticas de entorno |
| **Base de datos** | PostgreSQL (Supabase) |
| **Monorepo** | pnpm workspaces |
| **UI** | `expo-blur` · `expo-linear-gradient` · diseño espresso & dorado |
| **Cámara / QR Scan** | `expo-camera` (`CameraView`) |
| **QR generación** | `react-native-qrcode-svg` |

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
        │  Admin divide la cuenta → cada participante recibe su monto
        ▼
  ┌─────────────────────────────────────┐
  │  pending → reported → confirmed     │
  │  (participante reporta, admin aprueba│
  └─────────────────────────────────────┘
        │
   todos confirmed
        │
        ▼
  [Admin cierra sesión → aparece en Feed + Historial]
```

---

## 📜 Scripts disponibles

```bash
pnpm dev:mobile       # Iniciar app Expo
pnpm typecheck        # Verificación de tipos TypeScript (todos los workspaces)
pnpm lint             # Lint en todos los workspaces
pnpm clean            # Limpiar builds
```

---

<div align="center">

Hecho con ☕ y 🐄 en Colombia.

</div>
