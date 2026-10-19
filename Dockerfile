# Stage 1: Build the React application
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve static build
FROM node:20-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/dist ./dist

# Port diambil dari env PORT (diisi docker-compose dari FRONTEND_PORT2 di .env).
CMD ["sh", "-c", "exec serve -s dist -l ${PORT:?PORT wajib diisi}"]
