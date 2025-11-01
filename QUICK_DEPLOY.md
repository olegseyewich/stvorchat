# 🚀 Быстрый деплой за 5 минут

## Шаг 1: Инициализация Git (если ещё нет)

```bash
# На локальной машине
cd stvorchat
git init
git add .
git commit -m "Initial commit"

# Создай репозиторий на GitHub/GitLab
# Затем:
git remote add origin https://github.com/your-username/stvorchat.git
git branch -M main
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
git clone https://github.com/your-username/stvorchat.git
cd stvorchat
```

## Шаг 4: Настройка .env

```bash
cp .env.example .env
nano .env
```

**Важно!** Замени значения:

```env
POSTGRES_PASSWORD=твой_сильный_пароль
JWT_SECRET=твой_очень_сильный_секретный_ключ
CLIENT_ORIGIN=http://твой-домен.com,http://твой-ip
VITE_API_URL=http://твой-домен.com:4000
VITE_SOCKET_URL=http://твой-домен.com:4000
```

## Шаг 5: Запуск одной командой!

```bash
chmod +x deploy.sh
./deploy.sh production
```

**Готово!** 🎉 

Проект запущен:
- **Frontend**: http://твой-ip или http://твой-домен.com
- **API**: http://твой-ip:4000 или http://твой-домен.com:4000

---

## Обновление после изменений

### Вариант 1: Ручной деплой

```bash
# На сервере
cd /var/www/stvorchat
git pull
./deploy.sh production
```

### Вариант 2: Автоматический деплой (GitHub Actions)

См. [DEPLOY.md](./DEPLOY.md) — раздел "Автоматический деплой через GitHub Actions"

---

## Полезные команды

```bash
# Просмотр логов
docker compose -f docker-compose.prod.yml logs -f

# Остановка
docker compose -f docker-compose.prod.yml down

# Перезапуск
docker compose -f docker-compose.prod.yml restart

# Статус
docker compose -f docker-compose.prod.yml ps
```

---

**Всё!** Теперь при каждом `git push` изменения можно легко задеплоить на сервер одной командой. 💜

