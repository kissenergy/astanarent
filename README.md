# Rent Astana

Mobile app + Go backend for an Astana apartment rental feed.

## What Runs Where

The mobile app is not hosted in Docker. It runs on the user's phone after it is installed.

Docker runs only the backend infrastructure:

```text
api       Go HTTP API, JWT auth, uploads, business logic
postgres  Postgres database
volume    host folder for listing photos/videos
```

The mobile app calls the API over HTTP:

```text
iPhone / Android / Web
  -> EXPO_PUBLIC_API_URL
  -> Go API
  -> Postgres + file storage
```

## Local Development

Create local env:

```powershell
Copy-Item .env.example .env
```

Edit `.env` and set the file storage path for your computer:

```env
FILE_STORAGE_PATH=C:/Users/zhanat/Desktop/bazarent
```

Create the storage folder if it does not exist:

```powershell
New-Item -ItemType Directory -Force C:\Users\zhanat\Desktop\bazarent
```

Start backend and Postgres:

```powershell
docker compose up -d --build
```

Backend health:

```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:8080/health
```

Start Expo:

```powershell
npm.cmd run start:clear
```

For iPhone on local Wi-Fi, `.env` must point to the laptop IP:

```env
EXPO_PUBLIC_API_URL=http://10.85.33.89:8080/api
```

Storage folder on Windows:

```text
C:\Users\zhanat\Desktop\bazarent
```

If the laptop Wi-Fi IP changes, update `EXPO_PUBLIC_API_URL` in `.env` and restart Expo.

## Another Computer

After cloning the repository:

```powershell
cd rent-astana
Copy-Item .env.example .env
npm.cmd install
docker compose up -d --build
npm.cmd run start:clear
```

The manager only needs:

```text
Docker Desktop
Node.js
Expo Go on phone
```

On another Windows computer, change this line in `.env`:

```env
FILE_STORAGE_PATH=C:/Users/<username>/Desktop/bazarent
```

For a phone test, also change:

```env
EXPO_PUBLIC_API_URL=http://<laptop-wifi-ip>:8080/api
```

If the database volume already exists and you want a clean test database:

```powershell
docker compose down -v
docker compose up -d --build
```

## Backend Structure

```text
backend/cmd/api              entrypoint
backend/internal/app         composition root
backend/internal/config      env config
backend/internal/db          database connection
backend/internal/modules     domain modules
backend/internal/platform    shared infra helpers
backend/migrations           Postgres schema and seed data
```

## API

Public:

```text
GET /health
GET /api/listings
GET /api/listings/{id}
```

Auth:

```text
POST /api/auth/register
POST /api/auth/login
GET /api/auth/me
```

Protected:

```text
POST /api/listings
PATCH /api/listings/{id}
POST /api/listings/{id}/media
POST /api/listings/{id}/reviews
POST /api/listings/{id}/favorite
GET /api/realtor/listings
GET /api/favorites
PATCH /api/auth/me
GET /api/admin/users
PATCH /api/admin/users/{id}/role
```

## Roles

Users register with a Kazakhstan phone number. Phone is the primary unique identifier.

```text
+7 707 522 68 39
```

This phone number is the local admin number. When this phone registers, the backend marks the user as admin. Admin can open `Пользователи` in profile and grant or remove the realtor role.

Only users with role `realtor` can publish listings. The add-listing button is visible only for realtors.

## Linux VPS

On Linux, do not edit `docker-compose.yml`. Use `.env`:

```env
FILE_STORAGE_PATH=/data/bazarent
PUBLIC_BASE_URL=https://api.example.kz
EXPO_PUBLIC_API_URL=https://api.example.kz/api
JWT_SECRET=replace-with-long-random-secret
```

Create the folder on the server:

```bash
sudo mkdir -p /data/bazarent
```
