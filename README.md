# Money Notebook

Money Notebook is a production-ready personal finance manager with a React/Vite frontend, Express backend, JWT auth with refresh tokens, and MongoDB Atlas persistence.

## File Structure

```text
root/
  client/
    src/
      api/client.js
      components/
      context/
      pages/
      utils/
    .env.example
    index.html
    package.json
    postcss.config.js
    tailwind.config.js
    vercel.json
    vite.config.js
  server/
    src/
      config/
      controllers/
      middleware/
      models/
      routes/
      utils/
      app.js
      server.js
    .env.example
    package.json
  render.yaml
  package.json
```

## Local Setup

1. Install dependencies:

```bash
npm run install:all
```

2. Create `server/.env`:

```env
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/money-notebook?retryWrites=true&w=majority
JWT_SECRET=replace-with-a-long-random-secret
PORT=5000
CORS_ORIGIN=http://localhost:5173
```

3. Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

4. Start the backend and frontend in separate terminals:

```bash
npm run dev:server
npm run dev:client
```

## MongoDB Atlas Deployment

1. Create a MongoDB Atlas account and a new project.
2. Create a free or dedicated cluster.
3. Add a database user with read/write access.
4. Add your Render outbound access. For the fastest first deploy, add `0.0.0.0/0`; for stricter production use, allow only Render egress IPs if your Render plan supports static outbound IPs.
5. Copy the driver connection string and set it as `MONGO_URI`.

## Render Backend Deployment

1. Push this repo to GitHub.
2. In Render, create a new Web Service from the repo.
3. Use:
   - Root directory: `server`
   - Build command: `npm install`
   - Start command: `npm start`
4. Set environment variables:
   - `MONGO_URI`: your Atlas connection string
   - `JWT_SECRET`: a long random secret
   - `CORS_ORIGIN`: your deployed Vercel URL
   - `NODE_ENV`: `production`
5. Deploy and copy the Render service URL.

## Vercel Frontend Deployment

1. In Vercel, import the same GitHub repo.
2. Set root directory to `client`.
3. Use Vite defaults:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Set environment variable:
   - `VITE_API_URL`: `https://YOUR-RENDER-SERVICE.onrender.com/api`
5. Deploy.
6. Return to Render and set `CORS_ORIGIN` to the exact Vercel production URL, then redeploy the backend.

## API Routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `PUT /api/auth/profile`
- `GET|POST /api/accounts`
- `PUT|DELETE /api/accounts/:id`
- `GET|POST /api/transactions`
- `PUT|DELETE /api/transactions/:id`
- `GET|POST /api/categories`
- `PUT|DELETE /api/categories/:id`
- `GET /api/analytics/dashboard`
- `GET|POST /api/budgets`
- `DELETE /api/budgets/:id`

## Production Notes

- Backend uses `process.env.PORT || 5000`.
- Frontend reads every API call from `VITE_API_URL`.
- CORS allows credentials and validates origins through `CORS_ORIGIN`.
- Transaction writes use MongoDB sessions so balance updates stay consistent with transaction records.
- Refresh tokens are rotated and stored as bcrypt hashes.
