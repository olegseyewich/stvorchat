# Stvor — современный мессенджер

Stvor — это светлый фиолетовый мессенджер в атмосфере Nyx для русскоязычных пользователей. Он включает веб‑клиент на React, API на Node.js/Express, базу данных PostgreSQL и десктопную оболочку на Electron.

## 🚀 Быстрый старт

### Локальная разработка

```bash
# Backend
cd server
npm install
npx prisma migrate dev --name init
cp env.example .env
npm run dev

# Frontend (в другом терминале)
cd client
npm install
npm run dev

# Desktop (опционально)
cd desktop
npm install
npm run dev:electron
```

### Production деплой (Docker)

```bash
# Настройка
cp .env.example .env
# Отредактируйте .env с нужными значениями

# Запуск одной командой
chmod +x deploy.sh
./deploy.sh production
```

**Подробная инструкция по деплою**: см. [DEPLOY.md](./DEPLOY.md)

## 📦 Структура проекта

```
stvor/
├── client/      # Vite + React + Tailwind фронтенд
├── server/      # Express + Prisma + Socket.IO API
├── desktop/     # Electron оболочка и сборка .exe
├── docker-compose.yml        # Development
├── docker-compose.prod.yml   # Production
├── deploy.sh                 # Скрипт деплоя
└── README.md
```

## 🔧 Технологии

- **Frontend**: React, TypeScript, Vite, TailwindCSS, Zustand, Socket.IO
- **Backend**: Node.js, Express, TypeScript, Socket.IO, Prisma ORM
- **Database**: PostgreSQL
- **Desktop**: Electron
- **Deployment**: Docker, Docker Compose

## 📚 Документация

- [DEPLOY.md](./DEPLOY.md) — Инструкция по деплою на VDS сервер
- [server/env.example](./server/env.example) — Пример переменных окружения для сервера
- [client/.env.example](./client/.env.example) — Пример переменных окружения для клиента (опционально)

## 🎨 Особенности

- 🌓 Тёмная и светлая темы
- 💜 Градиенты и округлые углы в стиле Nyx
- 🔄 Обновления в реальном времени через Socket.IO
- 👥 Система друзей и комнат
- 💬 Прямые сообщения и групповые чаты

Приятного общения в Stvor! 💜
