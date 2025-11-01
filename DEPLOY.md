# 🚀 Инструкция по деплою Stvor на VDS сервер

## Быстрый старт

### 1. Подготовка сервера

На VDS сервере должен быть установлен:
- **Docker** и **Docker Compose**
- **Git**

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y docker.io docker-compose git
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
# Перелогиньтесь после добавления в группу docker
```

### 2. Клонирование репозитория на сервер

```bash
cd /var/www  # или любая другая директория
git clone https://github.com/your-username/stvorchat.git
cd stvorchat
```

### 3. Создание .env файла

Создайте `.env` файл в корне проекта:

```bash
cp .env.example .env
nano .env
```

Заполните переменные:

```env
# База данных
POSTGRES_USER=stvar
POSTGRES_PASSWORD=strong_password_here
POSTGRES_DB=stvar

# JWT
JWT_SECRET=very_strong_secret_key_here
JWT_EXPIRES_IN=7d

# API
PORT=4000
CLIENT_ORIGIN=http://your-domain.com

# Frontend (для сборки)
VITE_API_URL=http://your-domain.com:4000
VITE_SOCKET_URL=http://your-domain.com:4000

# HTTP порт (для nginx)
HTTP_PORT=80
```

### 4. Запуск одной командой

```bash
chmod +x deploy.sh
./deploy.sh production
```

Всё! Проект запущен. API будет на `http://your-server:4000`, фронтенд на `http://your-server:80`.

---

## Автоматический деплой через GitHub Actions

### Настройка GitHub Secrets

1. Перейдите в Settings → Secrets and variables → Actions
2. Добавьте секреты:

- `SSH_PRIVATE_KEY` — приватный SSH ключ для доступа к серверу
- `SSH_USER` — пользователь на сервере (например, `root` или `ubuntu`)
- `SSH_HOST` — IP адрес или домен сервера
- `DEPLOY_PATH` — путь к проекту на сервере (например, `/var/www/stvorchat`)

### Генерация SSH ключа

```bash
# На локальной машине
ssh-keygen -t ed25519 -C "deploy@stvor"
# Скопируйте приватный ключ в GitHub Secrets (SSH_PRIVATE_KEY)
# Публичный ключ добавьте на сервер:
ssh-copy-id user@your-server
```

Теперь при каждом `git push` в `main` проект автоматически деплоится на сервер!

---

## Ручной деплой

### 1. Обновление кода на сервере

```bash
ssh user@your-server
cd /var/www/stvorchat
git pull origin main
```

### 2. Запуск деплоя

```bash
./deploy.sh production
```

---

## Полезные команды

### Просмотр логов

```bash
docker compose -f docker-compose.prod.yml logs -f
# Или для конкретного сервиса:
docker compose -f docker-compose.prod.yml logs -f server
docker compose -f docker-compose.prod.yml logs -f client
```

### Остановка

```bash
docker compose -f docker-compose.prod.yml down
```

### Перезапуск

```bash
docker compose -f docker-compose.prod.yml restart
```

### Пересборка после изменений

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

### Миграции базы данных

```bash
docker compose -f docker-compose.prod.yml exec server npx prisma migrate deploy
```

### Доступ к базе данных

```bash
docker compose -f docker-compose.prod.yml exec db psql -U stvar -d stvar
```

---

## Настройка домена и SSL (опционально)

### С Nginx как reverse proxy

Создайте конфигурацию `/etc/nginx/sites-available/stvor`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }

    location /socket.io {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/stvor /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL через Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Troubleshooting

### Проблема: Контейнеры не запускаются

```bash
# Проверьте логи
docker compose -f docker-compose.prod.yml logs

# Проверьте статус
docker compose -f docker-compose.prod.yml ps
```

### Проблема: База данных не подключается

```bash
# Проверьте, что контейнер БД запущен
docker compose -f docker-compose.prod.yml ps db

# Проверьте логи БД
docker compose -f docker-compose.prod.yml logs db
```

### Проблема: Порт занят

```bash
# Найдите процесс, использующий порт
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :4000

# Измените порты в .env или остановите конфликтующий процесс
```

---

## Обновление проекта

После изменений в коде:

```bash
# На сервере
cd /var/www/stvorchat
git pull
./deploy.sh production
```

Или через GitHub Actions (автоматически при push).

---

Готово! 🎉 Теперь у тебя есть автоматический деплой одной командой.

