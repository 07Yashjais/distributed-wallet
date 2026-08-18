# ============================================
# Frontend Dockerfile - Distributed Wallet Web Client
# ============================================

# Step 1: Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build argument for API URL during Vite build
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Build the React application
RUN npm run build

# Step 2: Production Nginx stage
FROM nginx:alpine

# Copy built static files to Nginx web root
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

# Run Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
