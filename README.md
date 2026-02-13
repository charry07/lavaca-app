# La Vaca 🐄

Simple y sencillo de dividir y pagar cuentas.

## Estructura del Proyecto

```
lavaca-app/
  apps/
    mobile/     # App React Native (Expo + TypeScript)
    api/        # Backend API (Express + TypeScript + Socket.IO)
  packages/
    shared/     # Tipos y utilidades compartidas
```

## Requisitos

- Node.js >= 20
- pnpm >= 9

## Setup

```bash
pnpm install
```

## Desarrollo

```bash
# App movil
pnpm dev:mobile

# API backend
pnpm dev:api
```

## Stack

- **Mobile**: React Native + Expo + TypeScript
- **Backend**: Express + TypeScript + Socket.IO
- **Package Manager**: pnpm (monorepo con workspaces)
- **Deploy**: Azure (App Service + Static Web Apps)
