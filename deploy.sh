#!/bin/bash

set -e

echo "🚀 Iniciando despliegue del backend..."
echo "================================================"

# ── GIT PULL ───────────────────────────────────────
echo ""
echo "📥 [1/3] Obteniendo últimos cambios de main..."
git pull origin main

echo ""
echo "✅ Repositorio actualizado."

# ── DOCKER BUILD ───────────────────────────────────
echo ""
echo "🐳 [2/3] Construyendo imagen del backend..."
docker compose build backend

echo ""
echo "✅ Imagen construida exitosamente."

# ── DOCKER UP ─────────────────────────────────────
echo ""
echo "▶️  [3/3] Levantando el servicio..."
docker compose up -d backend

echo ""
echo "================================================"
echo "🎉 ¡Backend desplegado exitosamente!"
