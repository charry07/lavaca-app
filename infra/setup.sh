#!/bin/bash
# ─────────────────────────────────────────────────────────
# La Vaca 🐄 — Azure Infrastructure Setup
# ─────────────────────────────────────────────────────────
# Este script crea todos los recursos necesarios en Azure.
# Ejecutar UNA SOLA VEZ para crear la infraestructura.
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
LOCATION="eastus"                    # Cambiar si quieres otra región
APP_SERVICE_PLAN="plan-lavaca"
API_APP_NAME="lavaca-api"            # Debe ser único globalmente — cámbialo si está tomado
SWA_NAME="lavaca-web"                # Static Web App name
SKU="F1"                             # F1 = Free tier

echo "🐄 La Vaca — Creando infraestructura en Azure..."
echo ""

# ── 1. Resource Group ────────────────────────────────────
echo "📦 Creando Resource Group: $RESOURCE_GROUP en $LOCATION..."
az group create \
  --name "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --output none

echo "   ✅ Resource Group creado"

# ── 2. App Service Plan (para la API) ───────────────────
echo "📋 Creando App Service Plan: $APP_SERVICE_PLAN..."
az appservice plan create \
  --name "$APP_SERVICE_PLAN" \
  --resource-group "$RESOURCE_GROUP" \
  --sku "$SKU" \
  --is-linux \
  --output none

echo "   ✅ App Service Plan creado (Linux, $SKU)"

# ── 3. Web App para la API ──────────────────────────────
echo "🚀 Creando Web App para API: $API_APP_NAME..."
az webapp create \
  --name "$API_APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --plan "$APP_SERVICE_PLAN" \
  --runtime "NODE:20-lts" \
  --output none

# Habilitar WebSockets (necesario para Socket.io)
az webapp config set \
  --name "$API_APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --web-sockets-enabled true \
  --output none

# Configurar startup command
az webapp config set \
  --name "$API_APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --startup-file "node apps/api/dist/index.js" \
  --output none

echo "   ✅ Web App creada con WebSockets habilitados"
echo "   🌐 URL: https://$API_APP_NAME.azurewebsites.net"

# ── 4. Static Web App (para el frontend) ────────────────
echo "🌍 Creando Static Web App: $SWA_NAME..."
az staticwebapp create \
  --name "$SWA_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --source "https://github.com/charry07/lavaca-app" \
  --branch "main" \
  --app-location "/apps/mobile" \
  --output-location "dist" \
  --login-with-github \
  --output none

echo "   ✅ Static Web App creada"

# Obtener URL del SWA
SWA_URL=$(az staticwebapp show \
  --name "$SWA_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "defaultHostname" \
  --output tsv)

echo "   🌐 URL: https://$SWA_URL"

# ── 5. Variables de entorno de la API ────────────────────
API_URL="https://$API_APP_NAME.azurewebsites.net"

echo "⚙️  Configurando variables de entorno..."
az webapp config appsettings set \
  --name "$API_APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --settings \
    NODE_ENV=production \
    CORS_ORIGIN="https://$SWA_URL" \
  --output none

echo "   ✅ Variables configuradas"

# ── 6. Deployment credentials para GitHub Actions ────────
echo ""
echo "🔑 Obteniendo credenciales para GitHub Actions..."

# API publish profile
az webapp deployment list-publishing-profiles \
  --name "$API_APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --xml > /tmp/lavaca-api-publish-profile.xml

# SWA deployment token
SWA_TOKEN=$(az staticwebapp secrets list \
  --name "$SWA_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "properties.apiKey" \
  --output tsv)

echo ""
echo "═══════════════════════════════════════════════════"
echo "🐄 ¡Infraestructura creada exitosamente!"
echo "═══════════════════════════════════════════════════"
echo ""
echo "📍 Recursos creados:"
echo "   • Resource Group:  $RESOURCE_GROUP"
echo "   • API:             https://$API_APP_NAME.azurewebsites.net"
echo "   • Web:             https://$SWA_URL"
echo ""
echo "🔐 SIGUIENTE PASO — Configura estos GitHub Secrets:"
echo "   Ve a: https://github.com/charry07/lavaca-app/settings/secrets/actions"
echo ""
echo "   1. AZURE_WEBAPP_PUBLISH_PROFILE"
echo "      Valor: (contenido de /tmp/lavaca-api-publish-profile.xml)"
echo "      cat /tmp/lavaca-api-publish-profile.xml | pbcopy"
echo ""
echo "   2. AZURE_STATIC_WEB_APPS_API_TOKEN"
echo "      Valor: $SWA_TOKEN"
echo ""
echo "   3. REACT_APP_API_URL"
echo "      Valor: $API_URL"
echo ""
echo "═══════════════════════════════════════════════════"