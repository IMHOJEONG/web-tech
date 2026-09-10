FROM node:24-bookworm-slim AS builder

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
WORKDIR /repo

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/eslint-config ./packages/eslint-config
COPY packages/docs-content-contract ./packages/docs-content-contract
COPY packages/typescript-config ./packages/typescript-config
COPY apps/docs-backend ./apps/docs-backend

RUN pnpm install --frozen-lockfile
RUN pnpm --filter docs-backend build
RUN pnpm --filter docs-backend deploy --legacy --prod /prod/docs-backend

FROM node:24-bookworm-slim AS runtime

ENV NODE_ENV=production
ENV PORT=8000
ENV CONTENT_DIR=/app/content/posts
WORKDIR /app

COPY --from=builder --chown=node:node /prod/docs-backend ./

EXPOSE 8000

USER node

CMD ["node", "dist/src/main.js"]
