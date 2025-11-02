FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma.config.ts ./
COPY tsconfig.json ./
COPY src ./src
COPY prisma ./prisma

# Используем фиктивный DATABASE_URL только для генерации клиента
# Реальный DATABASE_URL будет передан при запуске контейнера
ENV DATABASE_URL="postgres://user:password@localhost:5432/dbname"
RUN npx prisma generate
RUN npm run build
RUN npm prune --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/src/prisma ./src/prisma
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/dist ./dist

# Копируем миграции для применения при запуске (из исходников)
COPY --from=builder /app/prisma ./prisma

EXPOSE 4000

# Запуск миграций и сервера
CMD sh -c "npx prisma migrate deploy && node dist/index.js"

