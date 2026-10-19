FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js production bundle
ENV NODE_ENV=production
RUN npm run build

# Port diambil dari env PORT (diisi docker-compose dari BACKEND_PORT2 di .env).
# Start production backend server
CMD ["npm", "start"]
