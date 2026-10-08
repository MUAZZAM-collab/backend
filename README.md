# Moazum Group — API

Node.js + Express + MongoDB backend for the Moazum Group website.

## Quick start

```bash
cd backend
npm install
cp .env.example .env
# edit .env with your MongoDB URI and admin token
npm run dev
```

Server runs on `http://localhost:5000`.

## Endpoints

### Public

| Method | Path | Description |
|---|---|---|
| `GET`  | `/health` | Health check |
| `POST` | `/api/enquiries` | Submit an enquiry |

### Admin (require `x-admin-token` header)

| Method | Path | Description |
|---|---|---|
| `POST`   | `/api/admin/login` | Verify an admin token |
| `GET`    | `/api/admin/enquiries` | List enquiries (filters + pagination) |
| `GET`    | `/api/admin/enquiries/:id` | Fetch one |
| `PATCH`  | `/api/admin/enquiries/:id` | Update status |
| `DELETE` | `/api/admin/enquiries/:id` | Delete |

### Admin list query params

- `status`: `new` | `read` | `archived`
- `division`: slug, e.g. `technology`
- `q`: search in name / email / message
- `page`: default `1`
- `limit`: default `50`, max `100`

## Example: submit an enquiry

```bash
curl -X POST http://localhost:5000/api/enquiries \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ali Khan",
    "email": "ali@example.com",
    "phone": "+92 300 1234567",
    "division": "technology",
    "divisionTitle": "Technology",
    "message": "I need a custom CRM built for my retail business."
  }'
```

## Example: list enquiries

```bash
curl http://localhost:5000/api/admin/enquiries \
  -H "x-admin-token: YOUR_ADMIN_TOKEN"
```

## Deploy

- **Render / Railway / Fly.io** — just set the env vars and deploy. The app reads `PORT` automatically.
- **Vercel** — this is a long-running server; if you must run it on Vercel, wrap the app in a serverless function instead. For a simple API, Render's free tier is easier.
- **MongoDB Atlas** — create a free M0 cluster, whitelist your host's IPs, use the SRV connection string.

## Security notes

- `helmet` sets sane security headers.
- `express-rate-limit` protects against brute-force and spam.
- Admin routes compare the token in constant time? **No** — for real production, replace `token !== expected` with `crypto.timingSafeEqual` to avoid timing attacks.
- Always use HTTPS in production (Render/Railway do this automatically).