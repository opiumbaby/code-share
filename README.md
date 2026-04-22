# CodeShare

CodeShare — клиент‑серверное приложение для публикации и обсуждения фрагментов кода. Пользователи могут создавать сниппеты, добавлять теги, собирать подборки в коллекции, оставлять комментарии и сохранять понравившиеся работы в избранное.

## Проект создан студентами группы 23м
- Вижевитов Андрей
- Макаров Никита

---

## Возможности

- Регистрация и вход по email
- Создание и редактирование сниппетов
- Теги и фильтрация по тегам и языкам
- Коллекции сниппетов (папки)
- Комментарии и избранное
- Профиль пользователя

---

## Структура проекта
- `src/app` — страницы и UI
- `src/server` — tRPC‑роутеры и логика сервера
- `src/server/db` — схемы Drizzle
- `src/lib` — клиентские/серверные утилиты

---

## Технологии

- **Next.js** (App Router)
- **TypeScript**
- **tRPC** — типобезопасный API
- **Drizzle ORM** — работа с базой данных
- **Better-auth** — аутентификация
- **PostgreSQL** — база данных
- **Vitest** — unit-тесты
- **Playwright** — e2e-тесты

---


## Запуск проекта

### Быстрый запуск в Docker (рекомендуется)

Требования:
- Docker Desktop

Запуск:

```bash
npm run docker:up
```


```bash
APP_PORT=3000 BETTER_AUTH_URL=http://localhost:3000 npm run docker:up
```

Что произойдет автоматически:
- поднимется PostgreSQL в контейнере `codeshare-db`
- применится схема БД (`db:push`)
- загрузятся сиды (`db:seed`)
- запустится Next.js на `http://localhost:3000`



Остановка:

```bash
npm run docker:down
```

Если нужно удалить данные БД (volume) и поднять проект с нуля:

```bash
docker compose down -v
npm run docker:up
```

---

### 1. Клонировать репозиторий

```bash
git clone <url-репозитория>
cd codeshare
```

### 2. Установить зависимости

```bash
npm install
```

### 3. Настроить переменные окружения

Создать файл `.env` в корне проекта:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/codeshare
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-secret-key-here
```

### 4. Создать базу данных

```bash
psql -U postgres -c "CREATE DATABASE codeshare;"
```

### 5. Применить миграции

```bash
npm run db:push
```

### 6. Заполнить базу начальными данными (опционально)

```bash
node scripts/seed.js
```

Это создаст тестового пользователя `demo@example.com`, несколько сниппетов, тегов и коллекцию.

### 7. Запустить проект в режиме разработки

```bash
npm run dev
```


---


## Тесты

### Unit-тесты (Vitest)


```bash
npx vitest run
```

### E2E-тесты (Playwright)


```bash
# Установить браузер Playwright
npx playwright install

# Запустить все e2e-тесты
npx playwright test

```

---
