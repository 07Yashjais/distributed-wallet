# 🌐 Complete Deployment Guide for Render (render.com)

This guide walks you through deploying the complete **Distributed Wallet System** (Frontend, Backend API, Workers, PostgreSQL, Redis, and Apache Kafka) to [Render](https://render.com).

---

## 📋 Architecture on Render

```text
[ React Frontend (Static Site) ]
             │
             ▼ (HTTPS / REST)
[ Backend API (Node.js Web Service) ]
    │            │             │
    ▼            ▼             ▼
[ Render PG ] [ Cloud Redis ] [ Cloud Kafka (Upstash) ]
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
[ Outbox Worker (Worker) ]            [ Transaction Worker (Worker) ]
```

---

## 🔑 Step 1: Set Up Free Cloud Services (Kafka & Redis)

Since Render does not host native Apache Kafka, you can use **Upstash** (which offers a 100% free serverless tier for both Kafka and Redis):

### 1. Free Cloud Kafka ([upstash.com](https://upstash.com))
1. Create a free account at [console.upstash.com](https://console.upstash.com).
2. Go to **Kafka** > **Create Cluster**.
   - Name: `wallet-kafka`
   - Region: Select region closest to your Render services (e.g. `US-East / Ohio`).
3. Under the **Topics** tab, create a topic: `wallet.transactions` (Partitions: `3`).
4. Under the **Details** tab, copy:
   - **Endpoint / Broker** (e.g. `your-cluster-name.upstash.io:9092`)
   - **Username**
   - **Password**

### 2. Free Cloud Redis ([upstash.com](https://upstash.com) or Render Redis)
1. In Upstash, go to **Redis** > **Create Database**.
2. Copy the **Node.js (ioredis) URL** (e.g. `rediss://default:your-password@your-endpoint.upstash.io:6379`).

---

## 🚀 Option A: 1-Click Deployment with Render Blueprint (`render.yaml`)

We have already configured `render.yaml` in your project root!

1. Push your repository to **GitHub** or **GitLab**.
2. Log in to [Render Dashboard](https://dashboard.render.com).
3. Click **New +** > **Blueprint**.
4. Connect your `distributed-wallet` repository.
5. Render will automatically detect `render.yaml` and configure:
   - **`distributed-wallet-db`**: PostgreSQL Database
   - **`distributed-wallet-api`**: Backend Web Service
   - **`distributed-wallet-frontend`**: Frontend Static Site
6. Fill in the prompted secret variables:
   - `REDIS_URL`: Your cloud Redis URL (e.g. `rediss://...`)
   - `KAFKA_BROKER`: Your Upstash Kafka endpoint
   - `KAFKA_SASL_USERNAME`: Your Upstash Kafka username
   - `KAFKA_SASL_PASSWORD`: Your Upstash Kafka password
7. Click **Apply**. Render will build and deploy your database and services!

---

## 🛠️ Option B: Manual UI Deployment (Step-by-Step)

If you prefer to configure services manually in the Render dashboard:

### 1. Create PostgreSQL Database
1. Go to **New +** > **PostgreSQL**.
2. Name: `distributed-wallet-db`
3. Database: `wallet_db`
4. User: `wallet_user`
5. Select **Free** plan and click **Create Database**.
6. Copy the **Internal Database URL** once provisioned.

---

### 2. Create Backend Web Service
1. Go to **New +** > **Web Service**.
2. Connect your Git repository.
3. Configure the service:
   - **Name**: `distributed-wallet-api`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: 
     - *Free tier (combines API + Workers in one container)*: `npm run start:all`
     - *Or standard API*: `npm start`
   - **Health Check Path**: `/health`
4. Add **Environment Variables**:

| Key | Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Production mode |
| `PORT` | `5000` | Render port (auto-set) |
| `DATABASE_URL` | *Your Render Internal DB URL* | Database connection string |
| `DATABASE_SSL` | `true` | Required for Render Postgres |
| `REDIS_URL` | `rediss://default:...@upstash.io:6379` | Upstash / Cloud Redis URL |
| `KAFKA_BROKER` | `your-cluster.upstash.io:9092` | Cloud Kafka broker |
| `KAFKA_SSL` | `true` | Enables TLS for Kafka |
| `KAFKA_SASL_USERNAME` | *Your Kafka username* | SASL username |
| `KAFKA_SASL_PASSWORD` | *Your Kafka password* | SASL password |
| `KAFKA_SASL_MECHANISM`| `scram-sha-256` | Authentication mechanism |
| `JWT_SECRET` | *Random 32+ character string* | Token signing secret |
| `CORS_ORIGIN` | `*` | Allowed client origins |

5. Click **Create Web Service**. Note your backend URL (e.g. `https://distributed-wallet-api.onrender.com`).

---

### 3. Initialize Database Schema
To create the tables on your Render PostgreSQL database:
1. In your Render Dashboard, go to your **`distributed-wallet-api`** service.
2. Open the **Shell** tab (or connect via Render CLI / `psql`).
3. Run:
```bash
npm run db:init
```
4. You will see: `✅ Database schema initialized successfully!`.

---

### 4. Create Frontend Static Site
1. Go to **New +** > **Static Site**.
2. Connect your Git repository.
3. Configure:
   - **Name**: `distributed-wallet-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Add **Environment Variable**:
   - `VITE_API_URL`: `https://your-backend-api.onrender.com/api` (Replace with your actual backend URL from step 2).
5. Under **Redirects/Rewrites**:
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - **Action**: `Rewrite` *(ensures React SPA routing works on page refreshes)*.
6. Click **Create Static Site**.

---

### 5. (Optional) Dedicated Background Workers (Paid Tier)
If using separate Render Background Workers instead of `npm run start:all`:
- **Outbox Worker**:
  - Name: `wallet-outbox-worker`
  - Root Directory: `backend`
  - Build Command: `npm install`
  - Start Command: `npm run start:outbox`
  - Same environment variables as the backend.
- **Transaction Worker**:
  - Name: `wallet-transaction-worker`
  - Root Directory: `backend`
  - Build Command: `npm install`
  - Start Command: `npm run start:worker`
  - Same environment variables as the backend.

---

## ✅ Verifying Your Deployment

1. **Backend Health Check**:
   Open `https://your-api.onrender.com/health` in your browser. You should receive:
   ```json
   {
     "status": "healthy",
     "services": {
       "api": "up",
       "database": "up",
       "redis": "up",
       "kafka": "up"
     }
   }
   ```
2. **Frontend UI**:
   Open `https://your-frontend.onrender.com`.
   - Register a new user account.
   - Perform a deposit / withdrawal.
   - Send money between wallets and watch live ledger and transaction updates!
