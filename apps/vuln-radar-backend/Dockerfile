# syntax=docker/dockerfile:1.7
#
# IMPORTANT:
# - build context must be the workspace root
# - example:
#   docker build -f apps/vuln-radar-backend/Dockerfile .
# - Railway service root must also point to the repo root if this Dockerfile is used

FROM node:24.22.1-bookworm-slim@sha256:55fb5f5a527ea2c5c4a95f963e48ef90aa38c7b346054fdc8ee9957a2b55d205 AS base

COPY scripts/check-node-runtime.mts /opt/check-node-runtime.mts
RUN node /opt/check-node-runtime.mts

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /repo
COPY package.json ./
COPY scripts/pnpm-bootstrap /opt/pnpm-bootstrap
COPY scripts/install-pnpm.mts /opt/install-pnpm.mts
RUN node --experimental-strip-types /opt/install-pnpm.mts /repo /opt/pnpm-bootstrap /pnpm

FROM base AS build

WORKDIR /repo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/vuln-radar-backend ./apps/vuln-radar-backend
COPY packages/typescript-config ./packages/typescript-config
COPY packages/eslint-config ./packages/eslint-config
COPY packages/tailwind-config ./packages/tailwind-config

RUN pnpm install --filter vuln-radar-backend... --frozen-lockfile
RUN pnpm --filter vuln-radar-backend build
RUN pnpm --filter vuln-radar-backend deploy --prod --legacy /prod/vuln-radar-backend

FROM node:24.22.1-bookworm-slim@sha256:55fb5f5a527ea2c5c4a95f963e48ef90aa38c7b346054fdc8ee9957a2b55d205 AS runtime

COPY scripts/check-node-runtime.mts /opt/check-node-runtime.mts
RUN node /opt/check-node-runtime.mts

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY --from=build /prod/vuln-radar-backend ./

EXPOSE 4000

CMD ["node", "dist/src/main.js"]
