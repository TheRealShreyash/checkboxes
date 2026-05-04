# ☑️ 1K Checkboxes

A real-time collaborative checkbox app where every click is felt by everyone, everywhere. Inspired by [1 million checkboxes](https://eieio.games/blog/one-million-checkboxes/) by [@itseieio](https://x.com/itseieio).

**[→ Live at checkboxes.shreyxsh.me](https://checkboxes.shreyxsh.me)**

---

## What is this?

1000 checkboxes. Shared across all users in real time. Check one, everyone sees it instantly. The state persists across sessions via Redis.

---

## Stack

| Layer | Tech |
|---|---|
| Runtime | Node.js + Bun |
| Server | Express |
| Real-time | Socket.IO |
| State & Pub/Sub | Redis (Valkey) |
| Auth | [Iris](https://iris.shreyxsh.me) — my own OIDC server |
| Hosting | Render |

---

## Features

- **Real-time sync** — WebSocket-based, every checkbox change is broadcast to all connected clients instantly via Redis pub/sub
- **Persistent state** — checkbox state is stored in Redis and loaded on connect, so new users see the current state
- **Authentication** — OIDC-based auth using Iris, with `httpOnly` cookie-based access and refresh tokens
- **Rate limiting** — per-user rate limiting using Redis TTL keys, tied to `user.sub` from the JWT so page refreshes don't reset the cooldown
- **Live user count** — shows how many users are currently connected

---

## How it works

### Real-time sync
Three Redis connections are used — a `publisher`, a `subscriber`, and a standard `redis` client for reads/writes. When a user checks a box, the server updates Redis and publishes to an internal channel. The subscriber picks it up and broadcasts to all connected sockets via `io.emit`.

```
client clicks checkbox
  → socket.emit("client:checkbox:changed")
  → server updates Redis state
  → server publishes to Redis channel
  → subscriber receives message
  → io.emit("server:checkbox:changed") to all clients
```

### Auth flow
```
page load
  → requireAuth() → GET /auth/me
      ├── 200 OK → load checkboxes
      └── 401 → tryRefresh() → POST /auth/refresh-token
                    ├── success → window.location.reload()
                    └── fail → redirect to /login
```

The `tryRefresh` function is a singleton — if multiple components detect a 401 simultaneously, they all wait on the same promise instead of firing parallel refresh requests (which would consume the single-use refresh token multiple times).

### Rate limiting
Rate limits are stored in Redis with a TTL:
```
redis.set(`rate-limit-${user.sub}`, "1", "EX", 6)
```
Using `user.sub` instead of `socket.id` means refreshing the page doesn't bypass the cooldown.

---

## Running locally

**Prerequisites:** Node.js / Bun, Redis

```bash
# Clone the repo
git clone https://github.com/TheRealShreyash/checkboxes
cd checkboxes

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env
# Fill in the values

# Start Redis
docker compose up

# Run the server
bun run dev
```

### Environment variables

```env
PORT=8080
NODE_ENV=development

# Redis
REDIS_URL=                        # leave empty to use localhost

# Checkbox
CHECKBOX_STATE_KEY=checkbox-state
CHECKBOX_SIZE=1000

# Auth (OIDC)
IRIS_AUTH_URL=http://localhost:9090
CLIENT_ID=
CLIENT_SECRET=
CALLBACK_URL=http://localhost:8080/auth/callback

# CORS
BASE_URL_1=http://localhost:8080
BASE_URL_2=
```

---

## Project structure

```
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.routes.ts
│   │   ├── auth.services.ts
│   │   └── utils/token.ts
│   └── checkbox/
│       ├── checkbox.controller.ts
│       ├── checkbox.routes.ts
│       └── checkbox.services.ts
├── common/
│   ├── middlewares/
│   │   ├── authenticate.middleware.ts
│   │   └── validate.middleware.ts
│   └── utils/
├── public/
│   ├── index.html
│   ├── login.html
│   └── signup.html
├── redis-connection.ts
└── index.ts
```

---

## Blog

I wrote about the whole journey — WebSockets, auth nightmares, production debugging and everything in between.

**[→ How I Built 1K Checkboxes Using WebSockets](https://therealshreyash.hashnode.dev/how-i-built-1k-checkboxes-using-websockets)**

---

## Author

**Shreyash** — [@wedan_ on X](https://x.com/wedan_)