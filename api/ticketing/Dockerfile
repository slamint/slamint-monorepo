# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=20-slim

FROM node:${NODE_VERSION} AS base
WORKDIR /app
ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
ENV NX_DAEMON=false
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json nx.json tsconfig.base.json tsconfig.json ./
COPY eslint.config.mjs ./eslint.config.mjs
COPY common ./common
COPY api ./api
RUN pnpm install --frozen-lockfile
RUN pnpm nx run @slamint/ticketing:build
RUN pnpm nx run @slamint/ticketing:prune

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/common ./common
COPY --from=build /app/api/ticketing/dist ./app

EXPOSE 8083
CMD ["node", "app/main.js"]
