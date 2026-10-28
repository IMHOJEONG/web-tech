FROM node:24.22.1-bookworm-slim@sha256:55fb5f5a527ea2c5c4a95f963e48ef90aa38c7b346054fdc8ee9957a2b55d205 AS builder

COPY scripts/check-node-runtime.mts /opt/check-node-runtime.mts
RUN node /opt/check-node-runtime.mts

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
WORKDIR /repo

COPY package.json ./
COPY scripts/pnpm-bootstrap /opt/pnpm-bootstrap
COPY scripts/install-pnpm.mts /opt/install-pnpm.mts
RUN node --experimental-strip-types /opt/install-pnpm.mts /repo /opt/pnpm-bootstrap /pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/eslint-config ./packages/eslint-config
COPY packages/docs-content-contract ./packages/docs-content-contract
COPY packages/typescript-config ./packages/typescript-config
COPY apps/docs-backend ./apps/docs-backend

RUN pnpm install --frozen-lockfile
RUN pnpm --filter docs-backend build
RUN pnpm --filter docs-backend deploy --legacy --prod /prod/docs-backend

FROM node:24.22.1-bookworm-slim@sha256:55fb5f5a527ea2c5c4a95f963e48ef90aa38c7b346054fdc8ee9957a2b55d205 AS runtime

COPY scripts/check-node-runtime.mts /opt/check-node-runtime.mts
RUN node /opt/check-node-runtime.mts

ENV NODE_ENV=production
ENV PORT=8000
ENV CONTENT_DIR=/app/content/posts
WORKDIR /app

COPY --from=builder --chown=node:node /prod/docs-backend ./

EXPOSE 8000

USER node

CMD ["node", "dist/src/main.js"]
