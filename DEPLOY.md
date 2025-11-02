# 🚀 Инструкция по деплою Stvor на VDS сервер

## Быстрый старт

### 1. Подготовка сервера

На VDS сервере должен быть установлен:
- **Docker** и **Docker Compose**
- **Git**

**Важно:** База данных PostgreSQL **НЕ** требует отдельной установки - она автоматически запускается в Docker контейнере вместе с приложением.

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y docker.io docker-compose git
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
# Перелогиньтесь после добавления в группу docker
```

#### Проверка установки Docker

```bash
docker --version
docker compose version
```

Если команды не работают, перелогиньтесь после добавления в группу docker или выполните `newgrp docker`.

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

**Важно:** Все пароли и секретные ключи нужно придумать самостоятельно - база данных создаётся с нуля, и вы задаёте все параметры сами.

Заполните переменные (замените все значения на свои):

```env
# База данных
POSTGRES_USER=stvar
POSTGRES_PASSWORD=ваш_сильный_пароль_здесь
POSTGRES_DB=stvar

# JWT (секретный ключ для токенов)
JWT_SECRET=ваш_очень_сильный_секретный_ключ_здесь
JWT_EXPIRES_IN=7d
```

#### Как создать надёжные пароли

**Для POSTGRES_PASSWORD:**
- Минимум 16 символов
- Комбинация букв (верхний и нижний регистр), цифр и спецсимволов
- Пример: `MyStr0ng!Passw0rd#2024`

**Для JWT_SECRET:**
- Минимум 32 символа
- Случайная строка (можно использовать генератор)
- Пример: `your_jwt_secret_key_minimum_32_characters_here` (замени на свой!)

Можно использовать онлайн генераторы или команду:

```bash
# Генерация случайного пароля (Linux/Mac)
openssl rand -base64 32

# Или в PowerShell (Windows)
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

**⚠️ ВАЖНО:** Сохраните пароли в надёжном месте! Если потеряете пароль от базы данных, данные будут недоступны.

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

**База данных PostgreSQL автоматически запущена в Docker контейнере** и доступна только внутри Docker сети. Данные сохраняются в Docker volume `db-data`.

#### Проверка работы всех сервисов

```bash
# Статус всех контейнеров (должны быть "Up")
docker compose -f docker-compose.prod.yml ps

# Проверка логов базы данных
docker compose -f docker-compose.prod.yml logs db

# Проверка подключения к базе
docker compose -f docker-compose.prod.yml exec db psql -U stvar -d stvar -c "SELECT version();"
```

Если все контейнеры в статусе "Up" - всё работает правильно! 🎉

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

Подключитесь к серверу по SSH:

```bash
ssh user@your-server
```

Перейдите в директорию проекта и обновите код:

```bash
cd /var/www/stvorchat  # или путь, где находится проект
git pull origin main
```

**Если возникают конфликты** (изменения локально на сервере):

```bash
# Сохранить локальные изменения (если нужно)
git stash

# Или просто перезаписать изменения с сервера
git fetch origin
git reset --hard origin/main
```

### 2. Запуск деплоя

После обновления кода запустите деплой:

```bash
# Убедитесь, что скрипт исполняемый
chmod +x deploy.sh

# Запустите деплой
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

База данных PostgreSQL запущена в Docker контейнере и доступна только внутри Docker сети.

```bash
# Подключение к PostgreSQL через контейнер
docker compose -f docker-compose.prod.yml exec db psql -U stvar -d stvar

# Выполнение SQL команды
docker compose -f docker-compose.prod.yml exec db psql -U stvar -d stvar -c "SELECT * FROM users;"

# Список таблиц
docker compose -f docker-compose.prod.yml exec db psql -U stvar -d stvar -c "\dt"
```

### Резервное копирование базы данных

```bash
# Создание дампа базы данных
docker compose -f docker-compose.prod.yml exec db pg_dump -U stvar stvar > backup_$(date +%Y%m%d_%H%M%S).sql

# Восстановление из дампа
cat backup_20241201_120000.sql | docker compose -f docker-compose.prod.yml exec -T db psql -U stvar -d stvar
```

### Использование внешней базы данных (опционально)

Если нужно использовать существующую PostgreSQL базу данных на сервере (не в Docker):

1. Отредактируйте `docker-compose.prod.yml` и закомментируйте сервис `db`:

```yaml
  # db:
  #   image: postgres:16
  #   ...
```

2. В `.env` файле укажите внешнюю базу данных:

```env
DATABASE_URL=postgres://user:password@host:5432/database
```

3. Или укажите в переменных окружения сервера:

```env
DATABASE_URL=postgres://stvar:password@localhost:5432/stvar
```

**Примечание:** Для работы с внешней БД на сервере должна быть установлена PostgreSQL, но для большинства случаев использования Docker контейнера достаточно.

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

# Проверьте, что БД отвечает
docker compose -f docker-compose.prod.yml exec db pg_isready -U stvar

# Проверьте переменные окружения в .env файле
cat .env | grep POSTGRES

# Попробуйте перезапустить контейнер БД
docker compose -f docker-compose.prod.yml restart db
```

### Проблема: База данных не создаётся / миграции не применяются

```bash
# Проверьте логи сервера на наличие ошибок миграций
docker compose -f docker-compose.prod.yml logs server | grep -i migrate

# Примените миграции вручную
docker compose -f docker-compose.prod.yml exec server npx prisma migrate deploy

# Проверьте, что БД доступна из контейнера server
docker compose -f docker-compose.prod.yml exec server ping db
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


