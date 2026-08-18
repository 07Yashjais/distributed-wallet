# 🚀 Distributed Wallet System - Docker Setup

A production-grade distributed wallet application featuring double-entry ledger transactions, transactional outbox pattern, asynchronous event processing with Apache Kafka, Redis caching, and a React web dashboard.

---

## 🏗️ Architecture & Services

The complete system is containerized into 7 services orchestrated via `docker-compose`:

| Service | Technology | Port | Description |
| :--- | :--- | :--- | :--- |
| **`frontend`** | React + Vite + Nginx | `3000`, `5173` | Responsive web client with SPA routing & reverse proxy |
| **`backend`** | Node.js Express | `5000` | Core REST API for Auth, Wallets, Transfers, Transactions |
| **`outbox-worker`**| Node.js Worker | Internal | Polls `outbox_events` and publishes messages to Kafka |
| **`transaction-worker`** | Node.js Worker | Internal | Consumes and processes events from Kafka `wallet.transactions` |
| **`postgres`** | PostgreSQL 16 Alpine | `5432` | Relational database with automatic schema initialization |
| **`redis`** | Redis 7 Alpine | `6379` | Fast distributed caching and rate-limiting store |
| **`kafka`** | Apache Kafka (KRaft) | `9092` | Event streaming broker (Zero-Zookeeper) |

---

## ⚡ Quick Start

### 1. Build and Start all Services
Run the following command from the root directory:

```bash
docker compose up --build
```

To run in detached (background) mode:
```bash
docker compose up -d --build
```

### 2. Access the Application
- **Frontend Dashboard:** [http://localhost:3000](http://localhost:3000) (or [http://localhost:5173](http://localhost:5173))
- **Backend API:** [http://localhost:5000](http://localhost:5000)
- **Health Check:** [http://localhost:5000/health](http://localhost:5000/health)

---

## 🛠️ Common Docker Commands

### View Service Logs
```bash
# Stream logs from all services
docker compose logs -f

# Stream logs from a specific service
docker compose logs -f backend
docker compose logs -f outbox-worker
docker compose logs -f transaction-worker
```

### Check Running Containers
```bash
docker compose ps
```

### Stop All Services
```bash
# Stop containers
docker compose stop

# Stop and remove containers + networks
docker compose down

# Stop and remove containers + networks + persistent volumes
docker compose down -v
```

---

## ⚙️ Environment Configuration

To customize configuration, copy `.env.docker.example` to `.env`:

```bash
cp .env.docker.example .env
```

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `DB_USER` | `wallet_user` | PostgreSQL username |
| `DB_PASSWORD` | `wallet_password` | PostgreSQL password |
| `DB_NAME` | `wallet_db` | PostgreSQL database name |
| `DATABASE_URL` | `postgresql://wallet_user:wallet_password@postgres:5432/wallet_db` | Connection string |
| `DATABASE_SSL` | `false` | `true` for cloud DBs (e.g. Neon), `false` for local Docker |
| `REDIS_URL` | `redis://redis:6379` | Redis server address |
| `KAFKA_BROKER` | `kafka:29092` | Kafka broker inside docker network |
| `JWT_SECRET` | `distributed_wallet_secret...` | Secret key for JWT tokens |
| `CORS_ORIGIN` | `*` | Allowed CORS origins |
| `VITE_API_URL` | `http://localhost:5000/api` | Backend API base URL for frontend |

---

## 🌐 Cloud Deployment (Render.com)

To deploy this full stack to the cloud using Render:
- See the step-by-step guide in [RENDER_DEPLOYMENT.md](file:///c:/Users/07yas/distributed-wallet/RENDER_DEPLOYMENT.md).
- Or use the 1-click Render Blueprint file [render.yaml](file:///c:/Users/07yas/distributed-wallet/render.yaml).

