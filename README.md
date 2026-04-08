# 别墅轰趴预订小程序

别墅轰趴预订平台，支持按日期预订、多人数筛选、设施筛选、套餐加购、在线支付、订单管理。主打别墅团建、生日聚会场景。

## 项目结构

```
villa-party-booking/
├── server/            # Nest.js 后端 API
├── miniapp/           # uni-app 微信小程序
├── admin/             # Vue3 管理后台
├── docs/              # 需求 & 架构文档
├── agents/            # Buddy Agent 定义
└── docker-compose.yml # MySQL + Redis 本地环境
```

## 技术栈

| 端 | 技术 |
|----|------|
| 后端 API | Nest.js + TypeScript + Prisma + MySQL 8.0 + Redis |
| 小程序 | uni-app (Vue3 + TypeScript) |
| 管理后台 | Vue3 + Vite + Element Plus |
| 部署 | Docker + Nginx |

## 后端 (server/)

- **Prisma Schema**: 11 张表（villa / facility / calendar / package / user / order / payment / review / admin）
- **模块**: Auth（微信登录 + JWT）、Villa（房源 + 日历）、Order（下单 + 库存锁）、Admin（后台管理）
- **基础设施**: 统一响应格式、全局异常过滤、JWT 守卫、Redis 分布式锁、`@Public` / `@CurrentUser` 装饰器

## 小程序 (miniapp/)

- **7 个页面**: 首页、搜索列表、别墅详情、预订确认、订单列表、订单详情、我的
- **API 封装**: auth / villa / order 三组接口
- **Pinia 状态管理**: 用户登录状态

## 管理后台 (admin/)

- **6 个视图**: 数据看板、房源管理（完整 CRUD）、房态日历、套餐管理、订单管理（确认 / 拒绝 / 退押金）、设施管理
- **侧边栏布局 + 路由守卫 + 登录页**

## 快速启动

```bash
# 1. 启动 MySQL + Redis
docker-compose up -d

# 2. 初始化数据库
cd server
npm install
npx prisma migrate dev --name init
npm run prisma:seed

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
| 管理员 | admin | admin123 |

## 文档

- [需求文档](docs/01-requirements.md)
- [架构设计文档](docs/02-architecture.md)
