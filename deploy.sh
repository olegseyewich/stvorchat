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

# Определение команды для Docker Compose
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
else
    echo "❌ Docker Compose не установлен. Установите Docker Compose и повторите попытку."
    exit 1
fi

# Функция для вызова docker compose с правильным синтаксисом
docker_compose() {
    if [ "$DOCKER_COMPOSE_CMD" = "docker-compose" ]; then
        docker-compose "$@"
    else
        docker compose "$@"
    fi
}

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
docker_compose -f $COMPOSE_FILE down || true

# Сборка и запуск
echo "🔨 Собираю и запускаю контейнеры..."
docker_compose -f $COMPOSE_FILE up --build -d

# Ждём запуска базы данных
echo "⏳ Ждём запуска базы данных..."
sleep 10

# Проверка, что контейнеры запущены
echo "🔍 Проверяю статус контейнеров..."
if ! docker_compose -f $COMPOSE_FILE ps | grep -q "Up"; then
    echo "⚠️  Некоторые контейнеры не запущены. Проверяю логи..."
    docker_compose -f $COMPOSE_FILE logs --tail=50
    exit 1
fi

# Миграции базы данных применяются автоматически при запуске контейнера
echo "📦 Миграции базы данных будут применены автоматически при запуске сервера..."
echo "⏳ Ждём запуска сервера и применения миграций..."
sleep 15

# Проверяем, что сервер запустился и миграции применены
echo "🔍 Проверяю логи сервера на наличие ошибок миграций..."
if docker_compose -f $COMPOSE_FILE logs server | grep -qi "migration.*error\|migration.*fail"; then
    echo "⚠️  Обнаружены ошибки в миграциях. Проверьте логи:"
    echo "   docker_compose -f $COMPOSE_FILE logs server"
else
    echo "✅ Миграции должны быть применены (проверьте логи для подтверждения)"
fi

echo "✅ Деплой завершён!"
echo ""
echo "📊 Статус контейнеров:"
docker_compose -f $COMPOSE_FILE ps

echo ""
echo "🔍 Логи:"
echo "   docker_compose -f $COMPOSE_FILE logs -f"
echo ""
echo "🛑 Остановка:"
echo "   docker_compose -f $COMPOSE_FILE down"

