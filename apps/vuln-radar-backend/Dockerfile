# syntax=docker/dockerfile:1.7
#
# IMPORTANT:
# - build context must be the workspace root
# - example:
#   docker build -f apps/vuln-radar-backend/Dockerfile .
# - Railway service root must also point to the repo root if this Dockerfile is used

FROM node:22-bookworm-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

FROM base AS build

WORKDIR /repo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/vuln-radar-backend ./apps/vuln-radar-backend
COPY packages/typescript-config ./packages/typescript-config
COPY packages/eslint-config ./packages/eslint-config
COPY packages/tailwind-config ./packages/tailwind-config

RUN pnpm install --filter vuln-radar-backend... --frozen-lockfile
RUN pnpm --filter vuln-radar-backend build
RUN pnpm --filter vuln-radar-backend deploy --prod /prod/vuln-radar-backend

FROM node:22-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY --from=build /prod/vuln-radar-backend ./

EXPOSE 4000

CMD ["node", "dist/main"]
