# 🚀 Быстрая настройка автоматического деплоя

## Шаг 1: Закоммить и запушить код на GitHub

```bash
git add .
git commit -m "Initial commit: Stvor chat application"
git push -u origin main
```

## Шаг 2: Подготовка VDS сервера

Подключись к серверу по SSH:

```bash
ssh user@your-server-ip
```

Установи Docker и Docker Compose (если ещё нет):

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y docker.io docker-compose git
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
# Перелогинься после добавления в группу docker
```

## Шаг 3: Клонирование на сервер

```bash
cd /var/www  # или любая другая директория
git clone https://github.com/olegseyewich/stvorchat.git
cd stvorchat
```

## Шаг 4: Создание .env файла на сервере

```bash
nano .env
```

Добавь следующие переменные (замени на свои значения):

```env
# База данных
POSTGRES_USER=stvar
POSTGRES_PASSWORD=твой_сильный_пароль
POSTGRES_DB=stvar

# JWT
JWT_SECRET=твой_очень_сильный_секретный_ключ
JWT_EXPIRES_IN=7d

# API
PORT=4000
CLIENT_ORIGIN=http://твой-домен.com,http://твой-ip

# Frontend (для сборки)
VITE_API_URL=http://твой-домен.com:4000
VITE_SOCKET_URL=http://твой-домен.com:4000

# HTTP порт (для nginx)
HTTP_PORT=80
```

**Важно:** Замени `твой-домен.com` и `твой-ip` на реальные значения!

## Шаг 5: Первый запуск на сервере

```bash
chmod +x deploy.sh
./deploy.sh production
```

Проверь, что всё работает:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f
```

## Шаг 6: Настройка автоматического деплоя (GitHub Actions)

### 6.1 Генерация SSH ключа

На локальной машине (или на сервере):

```bash
ssh-keygen -t ed25519 -C "deploy@stvor" -f ~/.ssh/stvor_deploy
# НЕ устанавливай пароль (нажми Enter)
```

Скопируй приватный ключ:

```bash
cat ~/.ssh/stvor_deploy
# Скопируй весь вывод (включая -----BEGIN и -----END)
```

Добавь публичный ключ на сервер:

```bash
cat ~/.ssh/stvor_deploy.pub | ssh user@your-server "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

### 6.2 Добавление секретов в GitHub

1. Перейди на GitHub: https://github.com/olegseyewich/stvorchat
2. Settings → Secrets and variables → Actions
3. Нажми "New repository secret"
4. Добавь следующие секреты:

   - **SSH_PRIVATE_KEY**: весь приватный ключ из `~/.ssh/stvor_deploy` (включая `-----BEGIN OPENSSH PRIVATE KEY-----` и `-----END OPENSSH PRIVATE KEY-----`)
   - **SSH_USER**: пользователь на сервере (например, `root` или `ubuntu`)
   - **SSH_HOST**: IP адрес или домен сервера (например, `185.123.45.67` или `stvor.com`)
   - **DEPLOY_PATH**: путь к проекту на сервере (например, `/var/www/stvorchat`)

### 6.3 Проверка доступа

Проверь SSH подключение с ключом:

```bash
ssh -i ~/.ssh/stvor_deploy user@your-server "cd /var/www/stvorchat && pwd"
```

## Шаг 7: Готово! 🎉

Теперь при каждом `git push` в ветку `main` код автоматически задеплоится на сервер!

### Проверка работы

1. Сделай любое изменение в коде
2. Закоммить и запушь:

```bash
git add .
git commit -m "Test deployment"
git push origin main
```

3. Перейди в GitHub: Actions → посмотри, как выполняется деплой
4. После успешного деплоя изменения будут на сервере!

---

## Ручной деплой (если нужно)

Если автоматический деплой не настроен, можно обновить вручную:

```bash
# На сервере
cd /var/www/stvorchat
git pull origin main
./deploy.sh production
```

---

## Полезные команды

### Просмотр логов

```bash
docker compose -f docker-compose.prod.yml logs -f
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

### Статус контейнеров

```bash
docker compose -f docker-compose.prod.yml ps
```

---

## Troubleshooting

### Проблема: GitHub Actions не может подключиться

- Проверь, что SSH ключ добавлен в GitHub Secrets полностью
- Проверь, что публичный ключ добавлен на сервер в `~/.ssh/authorized_keys`
- Проверь, что все секреты (SSH_USER, SSH_HOST, DEPLOY_PATH) правильно указаны

### Проблема: Контейнеры не запускаются

```bash
docker compose -f docker-compose.prod.yml logs
docker compose -f docker-compose.prod.yml ps
```

### Проблема: База данных не подключается

Проверь `.env` файл - правильно ли указан пароль и другие параметры.


