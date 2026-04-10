#!/usr/bin/env bash
# 一键部署脚本：拉代码 → 装依赖 → 构建 → 迁移数据库 → 重启 PM2
# 使用：在服务器上 cd /opt/villa-party-booking && bash deploy/deploy.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

log()  { printf '\033[1;34m[deploy]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[warn]\033[0m %s\n' "$*"; }
die()  { printf '\033[1;31m[error]\033[0m %s\n' "$*" >&2; exit 1; }

# ---- 0. 前置检查 ----
command -v node >/dev/null || die "未安装 Node.js"
command -v pm2  >/dev/null || die "未安装 PM2（npm i -g pm2）"
[ -f server/.env ] || die "server/.env 不存在，请从 deploy/.env.production.example 复制并填写"

# ---- 1. 拉取最新代码 ----
if [ -d .git ]; then
  log "拉取最新代码..."
  git fetch --all
  git pull --ff-only || warn "git pull 失败（可能本地有修改），跳过"
fi

# ---- 2. 后端 ----
log "【server】安装依赖..."
cd "$ROOT_DIR/server"
npm ci --omit=dev=false

log "【server】生成 Prisma Client..."
npx prisma generate

log "【server】执行数据库迁移..."
npx prisma migrate deploy

log "【server】构建..."
npm run build

# ---- 3. 前端 web ----
if [ -d "$ROOT_DIR/web" ]; then
  log "【web】安装依赖并构建..."
  cd "$ROOT_DIR/web"
  npm ci
  npm run build
fi

# ---- 4. 前端 admin ----
if [ -d "$ROOT_DIR/admin" ]; then
  log "【admin】安装依赖并构建..."
  cd "$ROOT_DIR/admin"
  npm ci
  npm run build
fi

# ---- 5. 启动 / 重启 PM2 ----
cd "$ROOT_DIR"
log "【pm2】启动/重启后端..."
if pm2 describe villa-server >/dev/null 2>&1; then
  pm2 reload deploy/ecosystem.config.js --update-env
else
  pm2 start deploy/ecosystem.config.js
fi

pm2 save

log "✅ 部署完成"
pm2 status
