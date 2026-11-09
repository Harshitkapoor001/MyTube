# MyTube

MyTube is a video sharing application with an existing Node.js, Express, MongoDB, Mongoose, JWT, and Cloudinary backend, plus a React/Vite frontend. The frontend lives in `frontend/`; the backend remains in `src/` and keeps its `/api/v1` routes.

## Features

- Responsive dark video discovery feed, search, locally matched category filters, video player, channel pages, and related videos.
- Cookie-authenticated sign in and registration, refresh-token retry, likes, subscriptions, comments, watch history, liked videos, and playlists.
- Creator studio with channel statistics and video management, upload progress, video publishing, and profile editing.
- Loading placeholders, useful empty/error states, responsive layouts, and keyboard focus styling.
- API-backed data only. The app does not invent sample API content. If the backend has no videos, the interface explains that state.

The backend currently has no category/tag metadata, dislike action, or notifications API. Category chips filter the currently loaded feed by text; no category is sent to the server. The video detail and channel profile APIs are protected, so those pages require a signed-in user. Registration currently requires an avatar because that is required by the existing backend.

## Requirements

- Node.js 20.19+ (required by Vite 8) and npm.
- MongoDB reachable by the backend.
- Cloudinary credentials for registration, avatar/video uploads, and image/video replacement.

## Environment setup

Copy `.env.example` to `.env`, then fill in the backend values with your own local configuration. Do not commit `.env` or put real credentials in the repository. The backend validates these required variables at startup:

| Variable                                                               | Purpose                                                           |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `PORT`                                                                 | Express listen port (for example `8000`)                          |
| `MONGODB_URI`                                                          | MongoDB server URI; database name `MyTube` is appended by the app |
| `CORS_ORIGIN`                                                          | Browser origin allowed by Express, including scheme and port      |
| `ACCESS_TOKEN_SECRET`, `ACCESS_TOKEN_EXPIRY`                           | Access JWT signing and lifetime                                   |
| `REFRESH_TOKEN_SECRET`, `REFRESH_TOKEN_EXPIRY`                         | Refresh JWT signing and lifetime                                  |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Existing Cloudinary integration                                   |

Use strong, different secrets for access and refresh tokens. For local development with Vite, set `CORS_ORIGIN=http://localhost:5173`. Leave `VITE_API_BASE_URL` empty for same-origin requests through the Vite proxy or the single-server production setup. Set `BACKEND_ORIGIN` if the local backend is not at `http://localhost:8000`. For a separately hosted frontend, set `VITE_API_BASE_URL` to the backend origin or API prefix when building (for example, `https://api.example.com` or `https://api.example.com/api`) and set the backend `CORS_ORIGIN` to the frontend's exact origin. Credentialed cross-origin cookies also require HTTPS in production.

## Local development

Install backend packages from the repository root and frontend packages from `frontend/`:

```bash
npm install
npm --prefix frontend install
cp .env.example .env
# Edit .env with your MongoDB, JWT, and Cloudinary settings.
npm run dev
```

In another terminal, start the frontend:

```bash
npm run dev:frontend
```

Open the Vite URL printed in the terminal (normally `http://localhost:5173`). Vite proxies `/api` and `/health` to `BACKEND_ORIGIN`. The existing backend must be running and its configured `CORS_ORIGIN` must include the Vite origin. You may start the backend with `npm start` instead of `npm run dev` when you do not need automatic reload.

## Production build and single-server deployment

Build the React frontend:

```bash
npm run build:frontend
```

This creates `frontend/dist/`. Start the existing Express server with:

```bash
npm start
```

Express serves the built frontend and its client-side routes after mounting the existing API routes. Requests under `/api/` and `/health` continue to reach their existing handlers. For a single-server deployment, set the required environment variables in the hosting provider's environment configuration, set `CORS_ORIGIN` to the public site origin, build the frontend, then run `npm start`. Keep MongoDB and Cloudinary configured as for the backend. Do not deploy `.env`; configure secrets directly in the host.

For separate frontend and backend hosting, build the frontend with `VITE_API_BASE_URL=https://your-api.example.com` (or include `/api` at the end), host `frontend/dist/` on a static host with SPA fallback to `index.html`, and configure backend `CORS_ORIGIN` to the exact HTTPS frontend origin. Cookies must be configured for cross-site use by the backend/hosting setup; the current backend's cookie options should be reviewed if the two services are on different sites. A same-site subdomain deployment may simplify cookie behavior.

### Render static frontend + Express API

For this repository's deployed services, configure the frontend Static Site with repository root as its root directory, build command `npm ci && npm --prefix frontend ci && npm run build:frontend`, and publish directory `frontend/dist`. Add this frontend build environment variable:

```text
VITE_API_BASE_URL=https://mytube-alz7.onrender.com/api
```

The frontend accepts an API origin or an API prefix ending in `/api` or `/api/v1`. On the Express Web Service, set `CORS_ORIGIN` to the frontend origin only (no `/api` path or trailing slash):

```text
CORS_ORIGIN=https://mytube-frontend-2m4f.onrender.com
```

Keep the backend's MongoDB, JWT, and Cloudinary environment variables set on the Web Service. After saving these settings, deploy the latest frontend build and restart/redeploy the backend so the CORS change takes effect.

## Backend API integration

The UI uses the existing `/api/v1` endpoints and response envelope (`{ success, data, message, ... }`). Requests include browser cookies with `credentials: "include"`; JSON content type is only sent when a request has a JSON body, avoiding unnecessary CORS preflights on feed GET requests. When an authenticated request returns 401, the client calls `/users/refresh_token` once and retries. It does not persist access or refresh tokens in browser storage.

Available integration includes video feed/search/upload/detail/update/delete/publish state, comments, likes, subscriptions, channel/profile data, creator stats/videos, history, playlists, and account sessions. The feed search uses the backend's `query` parameter. Some actions require authentication as defined in the existing route middleware. No API contract or database schema is replaced by the frontend.

## Useful scripts

```bash
npm run dev             # Existing Express backend with nodemon
npm start                # Existing Express backend
npm run dev:frontend     # React/Vite frontend
npm run build:frontend   # Production frontend bundle
npm run lint             # Existing backend Prettier check
```
