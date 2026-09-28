# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS build

RUN corepack enable && corepack prepare pnpm@10.22.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json apps/server/
COPY apps/client/package.json apps/client/
COPY packages/shared/package.json packages/shared/

RUN pnpm install --frozen-lockfile

COPY packages/shared packages/shared
COPY apps/server apps/server
COPY apps/client apps/client

RUN pnpm build

FROM node:22-bookworm-slim AS run

RUN corepack enable && corepack prepare pnpm@10.22.0 --activate

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV CLIENT_DIST=/app/apps/client/dist

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json apps/server/
COPY apps/client/package.json apps/client/
COPY packages/shared/package.json packages/shared/

RUN pnpm install --frozen-lockfile --prod

COPY --from=build /app/packages/shared/dist packages/shared/dist
COPY --from=build /app/apps/server/dist apps/server/dist
COPY --from=build /app/apps/client/dist apps/client/dist

WORKDIR /app/apps/server
EXPOSE 8080

CMD ["node", "dist/index.js"]
