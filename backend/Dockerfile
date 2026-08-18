# ============================================
# Backend Dockerfile - Distributed Wallet API & Workers
# ============================================

# Step 1: Base image with Node.js 20 on Alpine Linux
FROM node:20-alpine AS base

# Install build dependencies for native Node addons (e.g. bcrypt)
RUN apk add --no-cache python3 make g++ gcc libc-dev

WORKDIR /app

# Step 2: Install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Step 3: Copy application source code
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose backend API port
EXPOSE 5000

# Default command starts the API server
# (Overridden in docker-compose for worker containers)
CMD ["node", "src/server.js"]
