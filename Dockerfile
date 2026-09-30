# ==============================================================================
# MedraLink EMR Management Platform - Production Multi-Stage Dockerfile
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Client Frontend SPA
# ------------------------------------------------------------------------------
FROM node:22-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Build Server Backend
# ------------------------------------------------------------------------------
FROM node:22-alpine AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 3: Production Runtime
# ------------------------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=5000

# Install lightweight runtime utilities (curl for healthchecks, tzdata for timezones)
RUN apk add --no-cache curl tzdata

# Install production-only server dependencies
COPY server/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled backend artifacts and database schema
COPY --from=server-builder /app/server/dist ./dist
COPY --from=server-builder /app/server/src/db/schema.sql ./dist/db/schema.sql
COPY --from=server-builder /app/server/src/db/schema.sql ./src/db/schema.sql

# Copy compiled frontend SPA bundle
COPY --from=client-builder /app/client/dist ./client/dist

# Setup persistent storage directories for uploads and local database
RUN mkdir -p uploads data && chown -R node:node /app

USER node

EXPOSE 5000

HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

CMD ["node", "dist/server.js"]
