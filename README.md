# Лабораторна №5 — Marketplace з API Gateway

## Що зроблено

- Додано три домени й сервіси (імітація): Users, Products, Orders.
- Реалізовано повний набір дій, які були у консольному застосунку: реєстрація/логін, перегляд/створення/видалення товарів із перевіркою власника, робота з замовленнями (перегляд своїх, створення, пошук за ID, оновлення статусу, скасування), перегляд/оновлення користувача.
- API Gateway шар проксіює виклики до сервісів: `/api/gateway/*` → `/api/service/*`.
- Веб-інтерфейс (`public/index.html`) покриває всі сценарії з дружньою обробкою помилок.
- Усе працює локально на `http://localhost:3000`.

## Запуск

1. Встановіть залежності:
   - `npm install`
2. Запустіть сервер:
   - `npm start`
3. Відкрийте: `http://localhost:3000`.

## Сутність предметної галузі

- User: `{ id, username, email, fullName, password }`.
- Product: `{ id, ownerId, title, description, price, category, status, quantity, imageUrl }`.
- Order: `{ id, buyerId, productId, status }`.

## Контролери сервісів (імітація мікросервісів)

Product Service:

- GET `/api/service/products` (+ `?ownerId=`)
- GET `/api/service/products/:id`
- POST `/api/service/products`
- PUT `/api/service/products/:id`
- DELETE `/api/service/products/:id`

Order Service:

- GET `/api/service/orders/users/:userId`
- GET `/api/service/orders/:id`
- POST `/api/service/orders`
- PUT `/api/service/orders/:id/:status`
- DELETE `/api/service/orders/:id`

User Service:

- GET `/api/service/users`
- GET `/api/service/users/:id`
- POST `/api/service/users`
- PUT `/api/service/users/:id`
- DELETE `/api/service/users/:id`

## Контролери API Gateway

- `/api/gateway/products[/:id]`
- `/api/gateway/orders` (`/users/:userId`, `/:id`, `/:id/:status`)
- `/api/gateway/users[/:id]`
- Демо-контракти: `/api/service/openapi.json`, `/api/gateway/openapi.json`

## Веб-сторінка

- Розділ «Аутентифікація»: реєстрація, логін, logout, whoami (localStorage).
- «Товари»: всі/мої, пошук за ID, створення, видалення свого.
- «Замовлення»: мої, створити (за productId), знайти за ID, оновлення статусу, скасування.
- «Контракти»: показ демо OpenAPI JSON.

## Приклади запитів

- Products: `GET /api/gateway/products?ownerId=1`, `POST /api/gateway/products { ownerId, title, price, quantity }`.
- Orders: `POST /api/gateway/orders { buyerId, productId }`, `PUT /api/gateway/orders/1/shipped`.
- Users: `POST /api/gateway/users { username, password }`.

## Висновки

- API Gateway уніфікує звернення клієнта та приховує внутрішні сервіси.
- Навіть in-memory реалізація дозволяє швидко продемонструвати весь функціонал консолі у вебі з дружньою UX-обробкою помилок.
