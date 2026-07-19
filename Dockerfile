# syntax=docker/dockerfile:1

# ---- deps: install exact lockfile dependencies ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# Cache mount keeps downloaded packages across builds, even when the lockfile
# changes — only the delta is fetched.
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund

# ---- dev: Expo dev server (use with docker-compose expo-tunnel/expo-dev) ----
FROM deps AS dev
COPY . .
EXPOSE 8081
CMD ["npx", "expo", "start"]

# ---- build: production web export ----
# EXPO_PUBLIC_* values are baked into the bundle at build time (client-safe).
FROM deps AS build
COPY . .
ARG EXPO_PUBLIC_APPWRITE_ENDPOINT
ARG EXPO_PUBLIC_APPWRITE_PROJECT_ID
ARG EXPO_PUBLIC_APPWRITE_QUIZ_FUNCTION_ID
ARG EXPO_PUBLIC_SENTRY_DSN
ENV EXPO_PUBLIC_APPWRITE_ENDPOINT=$EXPO_PUBLIC_APPWRITE_ENDPOINT \
    EXPO_PUBLIC_APPWRITE_PROJECT_ID=$EXPO_PUBLIC_APPWRITE_PROJECT_ID \
    EXPO_PUBLIC_APPWRITE_QUIZ_FUNCTION_ID=$EXPO_PUBLIC_APPWRITE_QUIZ_FUNCTION_ID \
    EXPO_PUBLIC_SENTRY_DSN=$EXPO_PUBLIC_SENTRY_DSN
RUN npm run build

# ---- web: serve the static export ----
# Serves plain HTTP on 8080 for LOCAL testing only. In production, put this
# behind a platform that terminates TLS and redirects HTTP->HTTPS
# (Appwrite Sites does this out of the box).
FROM nginx:alpine AS web
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
