# =============================================================================
# 生产镜像（多阶段构建）
#
# 重要：构建阶段需要连接 PostgreSQL ——
#   1. `payload migrate` 在 builder 阶段执行（standalone 运行时不含 CLI）
#   2. `next build` 预渲染页面时会通过 Local API 查库（SSG）
# 因此构建命令要用 host 网络并传入 DATABASE_URL（见 docker-compose.yml 与 deploy.sh）
# =============================================================================

FROM node:24-alpine AS base
# 钉死 pnpm 版本（与本地/CI/lockfile 一致），杜绝 corepack 拉到更严格的默认版本
# 导致 ERR_PNPM_IGNORED_BUILDS 之类的行为漂移
RUN corepack enable pnpm && corepack prepare pnpm@10.33.0 --activate

# ---------- 依赖层 ----------
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm i --frozen-lockfile

# ---------- 构建层：迁移 + 构建 ----------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 构建期注入（compose 的 build.args 提供；PAYLOAD_SECRET 仅用于加载配置）。
# NEXT_PUBLIC_* 是 Next.js 构建期变量，必须在 next build 时存在才能编进前端 bundle，
# 只放运行时 env_file 不够——漏了 Turnstile site key 会导致前端 widget 不渲染、
# 表单提交无 token，而服务端有 secret 要求校验 → 403 Turnstile verification failed。
ARG DATABASE_URL
ARG PAYLOAD_SECRET
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY
ENV DATABASE_URL=$DATABASE_URL \
    PAYLOAD_SECRET=$PAYLOAD_SECRET \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY \
    NEXT_TELEMETRY_DISABLED=1

# 先跑数据库迁移（首次部署建表），再构建（预渲染需要查库）
#
# 注意 package.json 的 build 脚本把 --max-old-space-size 钉在 2048（生产 VPS 是
# 2 核 4GB，同机还跑着 Postgres 与上一版 app 容器）。这个值不是「越大越好」：
# 给的堆比可用内存大时，Node 不会及早 GC 而是一路申请，最终触发内核 OOM ——
# 被杀的往往是 sshd，表现为「构建到一半 SSH 断开且再也连不上」。
# 换更大的机器再往上调，别直接删。宁可慢，不要把机器闷死。
RUN pnpm payload migrate && pnpm build

# ---------- 运行层：仅 standalone 产物 ----------
FROM base AS runner
WORKDIR /app

# 部署的是哪个 commit —— 烧进运行层，不对外暴露。
# 没有它就只能靠翻 git log 猜「线上到底跑到哪一版」，每次部署都要猜一遍。
# 查看：docker compose exec app printenv GIT_SHA
ARG GIT_SHA=unknown
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    GIT_SHA=$GIT_SHA

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
