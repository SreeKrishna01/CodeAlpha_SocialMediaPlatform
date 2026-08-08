# Circle — Social Media App

A full-stack social feed app (MongoDB + Express + React + Node), styled after the
"Stories. Connections. Moments." design: home feed, stories bar, For you / Following /
Trending tabs, post cards with like/comment/share, and a Join-a-Circle promo.

```
social-app/
├── server/     Express + MongoDB API (Node.js)
└── client/     React app (Vite)
```

## 1. Prerequisites

- Node.js 18+
- A MongoDB database — either:
  - Local: install MongoDB Community and run it on `mongodb://127.0.0.1:27017`, or
  - Cloud: a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (recommended if you don't want to install MongoDB locally)

## 2. Backend setup

```bash
cd server
npm install
cp .env.example .env
# edit .env and set MONGO_URI (and a random JWT_SECRET)
npm run seed     # populates demo users, posts, stories, circles
npm run dev       # starts the API on http://localhost:5000
```

Demo login after seeding: **sree@example.com / password123**

### API overview

| Method | Route                        | Description                  |
|--------|-------------------------------|-------------------------------|
| POST   | /api/auth/register            | Create an account             |
| POST   | /api/auth/login               | Log in, returns JWT           |
| GET    | /api/auth/me                  | Current user (auth required)  |
| GET    | /api/posts                    | Paginated feed                |
| POST   | /api/posts                    | Create a post (auth)          |
| POST   | /api/posts/:id/like           | Toggle like (auth)            |
| POST   | /api/posts/:id/comments       | Add a comment (auth)          |
| POST   | /api/posts/:id/share          | Increment share count (auth)  |
| GET    | /api/stories                  | Active stories                |
| POST   | /api/stories                  | Create a story (auth)         |
| GET    | /api/users/:username          | Public profile + posts        |
| POST   | /api/users/:id/follow         | Toggle follow (auth)          |
| GET    | /api/users/search?q=          | Search users                  |

## 3. Frontend setup

In a second terminal:

```bash
cd client
npm install
npm run dev        # starts on http://localhost:5173
```

Vite proxies `/api` requests to `http://localhost:5000`, so no CORS config is needed
in development.

## 4. Build for production

```bash
cd client && npm run build   # outputs client/dist
cd ../server && npm start    # serve the API (add static hosting for dist/ if desired)
```

## Notes

- Passwords are hashed with bcrypt; sessions use JWT (30-day expiry).
- Stories auto-expire after 24 hours via a MongoDB TTL index.
- Seed data uses [DiceBear](https://www.dicebear.com/) avatars and Unsplash photos —
  swap in your own image hosting/CDN for production.
- The Explore, Circles, Saved, Alerts, Messages, and Profile screens are wired up as
  routes with placeholder content — the API layer already supports Circles and user
  profiles if you want to build those views out next.
