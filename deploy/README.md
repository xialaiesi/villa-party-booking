# 部署说明

本目录包含 Villa Party Booking 的生产部署资源。

## 架构

```
   ┌─────────────┐
   │   Nginx     │  80 / 443
   └──┬──┬──┬────┘
      │  │  │
 /api │  │  │ /  → web/dist
      │  │  └─→ /admin → admin/dist
      ▼  │
 ┌──────┐│
 │ Node ││ 3000 (PM2)
 │ Nest ││
 └──┬───┘│
    │    │
    ▼    ▼
 MySQL  Redis  (Docker 或系统服务)
                COS (远端，存图)
```

## 文件

| 文件 | 用途 |
|------|------|
| `deploy.sh` | 一键部署脚本（在服务器上执行） |
| `nginx.conf` | Nginx 站点配置模板 |
| `ecosystem.config.js` | PM2 进程管理配置 |
| `docker-compose.prod.yml` | 生产 MySQL + Redis docker-compose |
| `.env.production.example` | 后端生产环境变量模板 |

## 部署前提

服务器要求：
- Linux（推荐 Ubuntu 22.04）
- 2 核 2G 起步
- 已开放 80 / 443 端口
- 已安装：Node.js 18+、Nginx、PM2、Docker & docker compose（可选）
- 域名已解析并（大陆）备案

## 一键部署流程

1. 服务器上安装依赖（首次）：
   ```bash
   # Ubuntu
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs nginx git
   sudo npm install -g pm2
   ```

2. 克隆代码：
   ```bash
   cd /opt
   sudo git clone <your-repo-url> villa-party-booking
   sudo chown -R $USER:$USER villa-party-booking
   cd villa-party-booking
   ```

3. 配置后端环境变量：
   ```bash
   cp deploy/.env.production.example server/.env
   vim server/.env   # 填入真实密钥
   ```

4. 启动 MySQL / Redis：
   ```bash
   docker compose -f deploy/docker-compose.prod.yml up -d
   ```

5. 运行一键脚本：
   ```bash
   bash deploy/deploy.sh
   ```

6. 配置 Nginx：
   ```bash
   sudo cp deploy/nginx.conf /etc/nginx/sites-available/villa-party
   sudo ln -sf /etc/nginx/sites-available/villa-party /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   ```

7. 配置 HTTPS（免费 Let's Encrypt）：
   ```bash
   sudo apt-get install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

## 回滚

```bash
cd /opt/villa-party-booking
git log --oneline -10
git checkout <previous-commit>
bash deploy/deploy.sh
```

PM2 进程回滚：`pm2 reload villa-server`

## 更新部署（后续发版）

```bash
cd /opt/villa-party-booking
git pull
bash deploy/deploy.sh
```
