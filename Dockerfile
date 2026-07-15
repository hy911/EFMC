# =============================================================================
# 生产镜像（多阶段构建）
#
# 重要：构建阶段需要连接 PostgreSQL ——
#   1. `payload migrate` 在 builder 阶段执行（standalone 运行时不含 CLI）
#   2. `next build` 预渲染页面时会通过 Local API 查库（SSG）
# 因此构建命令要用 host 网络并传入 DATABASE_URL（见 docker-compose.yml 与 deploy.sh）
# =============================================================================

FROM node:24-alpine AS base

# ---------- 依赖层 ----------
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable pnpm && pnpm i --frozen-lockfile

# ---------- 构建层：迁移 + 构建 ----------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 构建期注入（compose 的 build.args 提供；PAYLOAD_SECRET 仅用于加载配置）
ARG DATABASE_URL
ARG PAYLOAD_SECRET
ARG NEXT_PUBLIC_SITE_URL
ENV DATABASE_URL=$DATABASE_URL \
    PAYLOAD_SECRET=$PAYLOAD_SECRET \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_TELEMETRY_DISABLED=1

# 先跑数据库迁移（首次部署建表），再构建（预渲染需要查库）
RUN corepack enable pnpm && pnpm payload migrate && pnpm build

# ---------- 运行层：仅 standalone 产物 ----------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# 媒体上传目录（挂持久化卷）
RUN mkdir -p /app/uploads && chown nextjs:nodejs /app/uploads

COPY --from=builder /app/public ./public
RUN mkdir .next && chown nextjs:nodejs .next
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
