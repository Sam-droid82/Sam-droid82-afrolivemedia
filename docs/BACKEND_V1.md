# Afrolivestream API foundation (v1)

This package adds a small Node.js/Express API foundation and a PostgreSQL schema to the existing React/Vite prototype.

## Included

- `GET /` service metadata
- `GET /api/health` service and optional database health check
- `GET /api/catalog` published content listing with category, type, search and pagination filters
- `GET /api/catalog/:slug` published content detail
- `GET /api/channels` active channel directory (intentionally excludes stream URLs)
- Helmet security headers, origin allow-list CORS, request body limit, and rate limiting
- Initial PostgreSQL tables for content, channels and audit events
- Rights status fields and a database constraint that prevents publishing content unless rights are approved

## Run locally

Requirements: Node.js 20+ and PostgreSQL 14+.

1. Copy `server/.env.example` to `server/.env` and update `DATABASE_URL` and `CORS_ORIGINS`.
2. Create a dedicated development database and apply the schema:

   ```bash
   psql "$DATABASE_URL" -f server/db/schema.sql
   ```

3. Install and start the API:

   ```bash
   cd server
   npm install
   npm run check
   npm run dev
   ```

4. Visit `http://localhost:4000/api/health`.

Without `DATABASE_URL`, the health route returns `database: not_configured`; catalogue routes return 503 until a database is configured. This is deliberate, not a production-ready data source.

## API examples

```bash
curl http://localhost:4000/api/health
curl 'http://localhost:4000/api/catalog?category=Documentary&limit=12&offset=0'
curl http://localhost:4000/api/channels
```

## Important limitations

- No admin/login endpoints are included yet. Do not expose write routes or claim the admin preview is secure authentication.
- No real playback, transcoding, CDN, subscriptions, payments or analytics are included.
- `stream_url` is stored in the database for future controlled use but is deliberately not returned from public endpoints.
- The rights constraint checks approval status only; a production publish workflow must also validate evidence, territorial/platform rights and expiry dates.
- Only content owned by Afrolivestream or covered by explicit online distribution rights should be published. Free-to-air availability alone is not permission to rebroadcast.
- Configure TLS, secret storage, backups, monitoring, database least-privilege users, migrations and production CORS origins before launch.
