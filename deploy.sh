#!/bin/bash

# Скрипт для деплоя Stvor на сервер
# Использование: ./deploy.sh [production|staging]

set -e

ENV=${1:-production}
COMPOSE_FILE="docker-compose.prod.yml"

echo "🚀 Начинаю деплой Stvor ($ENV)..."

# Проверка наличия Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен. Установите Docker и повторите попытку."
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! command -v docker compose &> /dev/null; then
    echo "❌ Docker Compose не установлен. Установите Docker Compose и повторите попытку."
    exit 1
fi

# Проверка .env файла
if [ ! -f .env.production ] && [ ! -f .env ]; then
    echo "⚠️  Файл .env не найден. Создаю из .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "📝 Пожалуйста, отредактируйте .env файл с правильными значениями!"
        exit 1
    else
        echo "❌ Файл .env.example не найден. Создайте .env вручную."
        exit 1
    fi
fi

# Остановка старых контейнеров
echo "🛑 Останавливаю старые контейнеры..."
docker compose -f $COMPOSE_FILE down || true

# Сборка и запуск
echo "🔨 Собираю и запускаю контейнеры..."
docker compose -f $COMPOSE_FILE up --build -d

# Ждём запуска базы данных
echo "⏳ Ждём запуска базы данных..."
sleep 5

# Миграции базы данных (опционально, если не в Dockerfile)
echo "📦 Применяю миграции базы данных (если необходимо)..."
docker compose -f $COMPOSE_FILE exec -T server npx prisma migrate deploy 2>/dev/null || echo "Миграции будут применены автоматически при запуске сервера"

echo "✅ Деплой завершён!"
echo ""
echo "📊 Статус контейнеров:"
docker compose -f $COMPOSE_FILE ps

echo ""
echo "🔍 Логи:"
echo "   docker compose -f $COMPOSE_FILE logs -f"
echo ""
echo "🛑 Остановка:"
echo "   docker compose -f $COMPOSE_FILE down"

