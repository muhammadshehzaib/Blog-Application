# syntax=docker/dockerfile:1

# ---------- Build stage ----------
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
RUN NODE_OPTIONS="--dns-result-order=ipv4first" npm install --no-audit --no-fund --prefer-offline

COPY . .
RUN npm run build

# Drop dev dependencies
RUN npm prune --omit=dev

# ---------- Production stage ----------
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

EXPOSE 3002

CMD ["node", "dist/main"]
