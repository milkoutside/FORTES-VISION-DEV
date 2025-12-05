## Docker запуск

Порты:

- 8000 — Nginx (Laravel)
- 5173 — Vite HMR (npm run watch)
- 6001 — Laravel Echo Server (Socket.IO)
- 3306 — MySQL
- 6379 — Redis

Шаги запуска:

1. Собрать и поднять контейнеры:

```bash
docker compose up -d --build
```

2. Установить зависимости и миграции (внутри PHP-контейнера `app`):

```bash
docker compose exec app composer install
docker compose exec app php artisan migrate
```

3. Открыть приложение: `http://localhost:8000`.

Vite HMR: `http://localhost:5173`. Echo-сервер: `ws://localhost:6001`.
