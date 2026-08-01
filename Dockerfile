# syntax=docker/dockerfile:1

# ---------- Build stage ----------
FROM node:20-alpine AS builder

WORKDIR /app

# bcrypt is a native addon — needs a build toolchain on Alpine to compile
RUN apk add --no-cache python3 make g++

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

# Drop dev dependencies but keep the compiled native modules (bcrypt)
RUN npm prune --omit=dev

# ---------- Production stage ----------
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# libstdc++ is required at runtime by native addons (bcrypt)
RUN apk add --no-cache libstdc++

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

EXPOSE 3002

CMD ["node", "dist/main"]
