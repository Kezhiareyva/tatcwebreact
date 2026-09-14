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

# Expose backend port
EXPOSE 3001

# Start production backend server
CMD ["npm", "start"]
