# 别墅轰趴预订 SaaS 平台

一个多租户的别墅轰趴预订 SaaS 平台，支持商家入驻、自动分账，主打团建、生日聚会场景。帮助别墅趴中介高效获客、管理房源、促成订单。

## 在线访问

| 端 | 地址 | 说明 |
|----|------|------|
| H5 前台 | http://localhost:5176 | 用户浏览/预订/评价 |
| 营销落地页 | http://localhost:5176/landing | 小红书引流专用 |
| 管理后台 | http://localhost:5173 | 商家/超管管理 |
| 后端 API | http://localhost:3000 | RESTful API |
| API 文档 | http://localhost:3000/api | Swagger |

> 以上为本地开发地址，生产环境请替换为实际域名。

## 核心特性

- **多租户架构**：支持多个商家入驻，数据完全隔离
- **自动分账**：订单确认后自动按商家佣金率分账
- **四种角色**：平台超管、商家、用户、游客
- **差异化玩法**：轰趴剧本、AA分摊、趴后回忆、智能选墅、氛围包、拼团裂变、入住清单、周边服务、趴友圈、老板买单、季节限定、AI策划师
- **营销获客**：小红书引流落地页、访客数据追踪、UTM参数、转化漏斗分析、分享裂变

## 项目结构

```
villa-party-booking/
├── server/            # Nest.js 后端 API（23 个模块）
├── web/               # Vue3 H5 前台（含营销落地页）
├── miniapp/           # uni-app 微信小程序（20+ 页面）
├── admin/             # Vue3 管理后台（14 个页面）
├── docs/              # 需求 & 架构文档
├── agents/            # Buddy Agent 定义
├── .claude/skills/    # Claude Code 技能（buddy / pm）
└── docker-compose.yml # MySQL + Redis 本地环境
```

## 技术栈

| 端 | 技术 |
|----|------|
| 后端 API | Nest.js + TypeScript + Prisma + MySQL 8.0 + Redis |
| 小程序 | uni-app (Vue3 + TypeScript + Pinia) |
| 管理后台 | Vue3 + Vite + Element Plus + ECharts |
| AI 能力 | Silicon Flow (Qwen3-VL + Qwen3) |
| 部署 | Docker + Nginx |

## 角色与权限

| 角色 | 访问范围 |
|------|----------|
| **平台超管** | 所有商家数据、商家 CRUD、结算管理、平台全局统计 |
| **商家** | 只看到自己的房源/订单/套餐等；财务中心查看收入和结算 |
| **用户** (微信登录) | 浏览所有商家别墅、下单、评价、趴友圈、AI 策划 |
| **游客** (未登录) | 仅浏览 |

## 后端 (server/)

### 数据模型（30+ 张表）
- **商家体系**：`merchant`、`settlement`（分账记录）
- **房源**：`villa`、`villa_image`、`villa_facility`、`villa_calendar`、`facility`
- **订单**：`order`、`order_package`、`payment`、`review`
- **套餐/服务**：`package`、`theme_pack`、`local_service`、`service_order`
- **场景功能**：`activity_plan`（轰趴剧本）、`seasonal_event`（限定活动）、`group_buy`（拼团）
- **用户互动**：`order_share`（AA分摊）、`album`（相册）、`post`（趴友圈）、`order_task`（任务清单）
- **企业/AI**：`corporate_order`（老板买单）、`chat_session`（AI 策划）
- **认证**：`user`、`admin`

### 22 个后端模块
auth、villa、order、package、facility、theme-pack、activity-plan、local-service、seasonal-event、group-buy、order-share、order-task、album、community、corporate、ai-planner、smart-recommend、merchant、admin、ai、review、upload

### 基础设施
- 统一响应格式（TransformInterceptor）
- 全局异常过滤（AllExceptionsFilter）
- JWT 守卫 + 角色守卫（RolesGuard）
- Redis 分布式锁（防超售）
- 装饰器：`@Public` / `@CurrentUser` / `@AdminCtx` / `@Roles`

## 小程序 (miniapp/)

### 20+ 个页面
- **核心预订**：首页、搜索列表、别墅详情、预订确认、订单列表、订单详情、我的
- **智能体验**：智能选墅、AI 趴体策划师（多轮对话）
- **差异化功能**：活动方案列表/详情、AA 分摊、趴后回忆相册、氛围包、拼团、入住清单、周边服务、趴友圈、限定体验

## 管理后台 (admin/)

### 13 个页面
- **数据看板**：4 张统计卡片 + 趋势折线图 + 状态饼图 + 热门 Top 5 + 最近订单
- **商家管理**（超管专属）：商家 CRUD + 创建管理员账号 + 佣金率设置
- **财务中心**（商家专属）：收入/结算/待结算 + 收款账户 + 结算记录
- **结算管理**（超管专属）：全平台结算记录 + 标记已结算
- **业务管理**：房源、房态日历、套餐、订单（确认/拒绝/退押金）、设施、活动方案、氛围包、周边服务、限定活动

### 特色
- 菜单按角色动态显示
- 登录页展示角色标签
- 房态日历支持单日/批量设置
- 房源管理集成 AI（智能排版图片 + 生成描述）

## 快速启动

```bash
# 1. 启动 MySQL + Redis
docker-compose up -d

# 2. 初始化数据库
cd server
npm install
cp .env.example .env   # 填入你的密钥
npx prisma db push
npx ts-node --skip-project prisma/seed.ts
npx ts-node --skip-project prisma/seed-extra.ts  # 可选：氛围包/服务/限定活动数据

# 3. 启动后端（http://localhost:3000）
npm run start:dev

# 4. 启动管理后台（http://localhost:5173）
cd ../admin
npm install
npm run dev

# 5. 启动小程序（需要 HBuilderX 或微信开发者工具）
cd ../miniapp
npm install
npm run dev:mp-weixin
```

## 默认账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 平台超管 | `admin` | `admin123` |
| 默认商家 | `merchant` | `merchant123` |

## 环境变量

所有后端配置在 `server/.env`（参考 `server/.env.example`）：
- `DATABASE_URL` — MySQL 连接（默认端口 3307）
- `REDIS_HOST` / `REDIS_PORT`
- `JWT_SECRET` — JWT 签名密钥（必须修改）
- `WX_APPID` / `WX_SECRET` — 微信小程序凭证
- `WX_PAY_*` — 微信支付商户信息
- `AI_API_KEY` — 硅基流动 API Key（免费注册：https://cloud.siliconflow.cn）

## 自动分账流程

```
用户下单 → 支付成功 → 管理员确认订单
  → 自动创建 settlement 记录（按商家 commissionRate 计算佣金和实得）
  → 更新商家 totalRevenue / pendingAmount
  → 平台超管在结算管理页面标记「已结算」
  → 更新商家 settledAmount / pendingAmount
```

默认商家佣金率为 0（平台免佣金），可在商家管理页单独调整。

## 文档

- [需求文档](docs/01-requirements.md)
- [架构设计文档](docs/02-architecture.md)

## Claude Code 技能

项目内置两个用户可调用的技能：

- `/pm` — 别墅趴产品经理，挖掘用户需求，提出差异化功能方案
- `/buddy` — 全流程交付（需求分析 → 架构设计 → 编码 → 审查 → 测试 → 部署）
