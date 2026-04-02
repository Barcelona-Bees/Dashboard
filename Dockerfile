# Multi-stage: build Vite app, run Express API + static dist on one port (Plan A).

FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS builder
WORKDIR /app
COPY . .
# Same-origin API calls in production (Express serves /temp, /Humidity, etc.)
ARG VITE_API_BASE=
ENV VITE_API_BASE=${VITE_API_BASE}
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY src ./src
EXPOSE 8080
ENV PORT=8080
CMD ["node", "src/backend/appLayer/al.js"]
