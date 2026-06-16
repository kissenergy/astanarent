# Production plan

## Current recommendation

For the first public launch, use the web version first.

```text
Users
  -> Cloudflare Pages frontend
  -> Cloudflare DNS / proxy
  -> Linux VPS with Docker
  -> Go API + Postgres + file storage
```

Cloudflare Pages is good for the frontend. The current Go API and Postgres database still need a Linux server, because Cloudflare Pages cannot run Docker containers or Postgres.

## Minimum paid pieces

```text
Required:
- Domain
- Small Linux VPS for Docker, Go API, Postgres, and backups

Optional at MVP stage:
- Cloudflare R2 for photos/videos

Mobile stores later:
- Google Play developer account
- Apple Developer Program
```

## Cloudflare Pages settings

```text
Repository: kissenergy/astanarent
Production branch: prod
Build command: npm ci && npx expo export --platform web
Build output directory: dist
Environment:
  EXPO_PUBLIC_API_URL=https://api.your-domain.kz/api
```

## VPS environment

```env
API_PORT=8080
POSTGRES_PORT=5432
POSTGRES_DB=rent_astana
POSTGRES_USER=rent
POSTGRES_PASSWORD=replace-with-strong-password
JWT_SECRET=replace-with-long-random-secret
PUBLIC_BASE_URL=https://api.your-domain.kz
FILE_STORAGE_PATH=/data/bazarent
```

Start on the server:

```bash
sudo mkdir -p /data/bazarent
docker compose up -d --build
```

## Mobile apps

Do not start with App Store and Google Play unless the web version is already validated by real users.

Recommended order:

```text
1. Launch web version
2. Let realtors and clients use it
3. Fix product issues
4. Build Android/iOS with Expo EAS
5. Publish to Google Play and App Store
```
