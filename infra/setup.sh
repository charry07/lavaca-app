#!/bin/bash
# ─────────────────────────────────────────────────────────
# La Vaca 🐄 — Azure Infrastructure Setup
# ─────────────────────────────────────────────────────────
# Todo corre en UN SOLO App Service:
#   • Express API + Socket.io
#   • Expo Web frontend (archivos estáticos servidos por Express)
#
# Prerequisitos:
#   1. Azure CLI instalado (az --version)
#   2. Estar logueado (az login)
#   3. Tener una suscripción activa
#
# Uso:
#   chmod +x infra/setup.sh
#   ./infra/setup.sh
# ─────────────────────────────────────────────────────────

set -euo pipefail

# ── Configuración ────────────────────────────────────────
RESOURCE_GROUP="rg-lavaca"
LOCATION="eastus"
APP_SERVICE_PLAN="plan-lavaca"
APP_NAME="lavaca-api"                # Debe ser único globalmente
SKU="B1"                             # B1 = Basic (soportado en Azure for Students)

echo "🐄 La Vaca — Creando infraestructura en Azure..."
echo ""

# ── 1. Resource Group ────────────────────────────────────
echo "📦 Creando Resource Group: $RESOURCE_GROUP en $LOCATION..."
az group create \
  --name "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --output none 2>/dev/null || true

echo "   ✅ Resource Group listo"

# ── 2. App Service Plan ─────────────────────────────────
echo "📋 Creando App Service Plan: $APP_SERVICE_PLAN ($SKU)..."
az appservice plan create \
  --name "$APP_SERVICE_PLAN" \
  --resource-group "$RESOURCE_GROUP" \
  --sku "$SKU" \
  --is-linux \
  --output none 2>/dev/null || true

echo "   ✅ App Service Plan listo"

# ── 3. Web App (API + Frontend) ─────────────────────────
echo "🚀 Creando Web App: $APP_NAME..."
az webapp create \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --plan "$APP_SERVICE_PLAN" \
  --runtime "NODE:20-lts" \
  --output none 2>/dev/null || true

echo "   ✅ Web App lista"

# ── 4. Configurar WebSockets + Startup ──────────────────
echo "⚙️  Configurando WebSockets y startup..."
az webapp config set \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --web-sockets-enabled true \
  --startup-file "node dist/index.js" \
  --output none 2>/dev/null || true

# Variables de entorno
az webapp config appsettings set \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --settings NODE_ENV=production \
  --output none 2>/dev/null || true

echo "   ✅ Configuración aplicada"

# ── 5. Obtener Publish Profile para GitHub Actions ──────
echo "🔑 Descargando credenciales de deploy..."
az webapp deployment list-publishing-profiles \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --xml > /tmp/lavaca-publish-profile.xml 2>/dev/null

APP_URL="https://$APP_NAME.azurewebsites.net"

echo ""
echo "═══════════════════════════════════════════════════"
echo "🐄 ¡Infraestructura lista!"
echo "═══════════════════════════════════════════════════"
echo ""
echo "📍 Tu app estará en:"
echo "   🌐 $APP_URL"
echo "   🔌 API:  $APP_URL/api/sessions"
echo "   💚 Health: $APP_URL/health"
echo ""
echo "🔐 SIGUIENTE PASO — Configura el GitHub Secret:"
echo ""
echo "   1. Ve a: https://github.com/charry07/lavaca-app/settings/secrets/actions"
echo "   2. Click 'New repository secret'"
echo "   3. Nombre: AZURE_WEBAPP_PUBLISH_PROFILE"
echo "   4. Valor: copia el contenido del archivo con este comando:"
echo ""
echo "      cat /tmp/lavaca-publish-profile.xml | pbcopy"
echo ""
echo "   5. Haz push a main y el deploy arranca automáticamente"
echo ""
