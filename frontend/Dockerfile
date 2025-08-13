# Stage 1: Install dependencies
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install

# Stage 2: Build the application
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Production image
FROM node:18-alpine
WORKDIR /app
# Copy package.json first for better layer caching
COPY --from=builder /app/package.json ./package.json
# Copy node_modules
COPY --from=builder /app/node_modules ./node_modules
# Copy the built application
COPY --from=builder /app/.next ./.next
# Create public directory (Next.js will work without it)
RUN mkdir -p ./public

EXPOSE 3000
CMD ["npm", "start"]
