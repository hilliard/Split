# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests first for better layer caching
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies needed for the build)
RUN npm ci

# Copy the rest of the source code
COPY . .

# Build the Astro app
RUN npm run build

# Stage 2: Production
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy dependency manifests and install production dependencies only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy the built output from the builder stage
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "./dist/server/entry.mjs"]
