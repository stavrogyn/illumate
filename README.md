# PSY Monorepo

Therapy Management System — монорепозиторий с фронтендом на Next.js и бекендом на NestJS.

## 📦 Структура

```
psy-monorepo/
├── apps/
│   ├── web/          # Next.js frontend (React 19)
│   └── api/          # NestJS backend
├── packages/
│   ├── contracts/    # Shared types, DTOs, validators (Valibot)
│   ├── eslint-config/
│   └── typescript-config/
├── turbo.json
└── package.json
```

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
yarn install
```

### 2. Настройка окружения

```bash
# Для API
cp apps/api/.env.example apps/api/.env
# Отредактируйте .env файл
```

### 3. Запуск в режиме разработки

```bash
# Запустить все приложения
yarn dev

# Или отдельно
yarn workspace @psy/web dev
yarn workspace @psy/api dev
```

## 🔧 Скрипты

| Команда          | Описание                                 |
| ---------------- | ---------------------------------------- |
| `yarn dev`       | Запуск всех приложений в dev режиме      |
| `yarn build`     | Сборка всех приложений                   |
| `yarn lint`      | Линтинг всех приложений                  |
| `yarn typecheck` | Проверка типов                           |
| `yarn clean`     | Очистка node_modules и артефактов сборки |

## 📚 Приложения

### Web (Next.js)

- **URL:** http://localhost:3000
- **Технологии:** Next.js 16, React 19, Tailwind CSS 4, Effector, React Query

### API (NestJS)

- **URL:** http://localhost:4000
- **Swagger:** http://localhost:4000/docs
- **Технологии:** NestJS 10, TypeORM, PostgreSQL, JWT Auth

## 📦 Packages

### @psy/contracts

Общие типы и схемы валидации между frontend и backend:

- Auth DTOs (Register, Login)
- Client entities
- Session entities
- Valibot schemas для runtime валидации

### @psy/typescript-config

Базовые TypeScript конфигурации:

- `base.json` — общая конфигурация
- `nextjs.json` — для Next.js приложений
- `nestjs.json` — для NestJS приложений

### @psy/eslint-config

ESLint конфигурации:

- `base.js` — общие правила
- `nextjs.js` — правила для Next.js
- `nestjs.js` — правила для NestJS

## 🗄️ База данных

```bash
# Создание PostgreSQL базы
createdb db

# Или через Docker
docker run --name db -e POSTGRES_PASSWORD=your_password -e POSTGRES_DB=db -p 5432:5432 -d postgres:14
```

## 📝 Лицензия

MIT
