# 别墅轰趴预订 SaaS 平台 — 架构设计文档

## 方案概述

采用前后端分离 + 多租户 SaaS 架构：
- **C 端**：uni-app 微信小程序，20+ 页面，面向用户/游客
- **B 端**：Vue3 管理后台，13 个页面，同一套后台服务平台超管和商家
- **后端**：Nest.js 单体 API 服务，22 个模块，提供 RESTful 接口
- **多租户**：业务表全部加 `merchant_id` 外键，根据登录角色自动隔离数据
- **自动分账**：订单确认后按商家佣金率生成分账记录

## 技术选型

### 最终技术栈

| 层 | 技术 | 说明 |
|----|------|------|
| C 端 | uni-app (Vue3 + TypeScript + Pinia) | 微信小程序，可扩展 H5/APP |
| B 端后台 | Vue3 + Vite + Element Plus + ECharts | 管理后台 Web |
| 后端 API | Nest.js + TypeScript | RESTful API 服务 |
| ORM | Prisma 7 + @prisma/adapter-mariadb | 数据库访问，类型安全 |
| 数据库 | MySQL 8.0 | 主数据存储 |
| 缓存 | Redis 7 | 房态缓存、库存锁、会话 |
| AI | Silicon Flow (Qwen3-VL-8B + Qwen3-8B) | 视觉分析 + 文本生成 |
| 对象存储 | 腾讯云 COS / 阿里云 OSS | 别墅图片存储（待对接） |
| 支付 | 微信支付 v3 API | 小程序支付 |
| 部署 | Docker + Nginx | 容器化部署 |

## SaaS 多租户架构

### 数据隔离策略

```
所有业务表加 merchant_id 外键
 ↓
Admin 登录后 JWT 携带 { role, merchantId }
 ↓
AdminService 根据 role 自动过滤 where 条件：
  - role=platform → {} （看全部）
  - role=merchant → { merchantId: ctx.merchantId }
 ↓
跨商家操作被 ensureAccess() 拦截
```

### 4 种角色

| 角色 | 登录方式 | 数据范围 |
|------|----------|----------|
| 平台超管 | Web 后台账号密码 | 所有商家数据、商家 CRUD、结算管理 |
| 商家 | Web 后台账号密码 | 仅自己的房源/订单/套餐/财务 |
| 用户 | 微信小程序 wx.login | 全平台别墅浏览、下单 |
| 游客 | 未登录 | 仅浏览 |

### 自动分账流程

```
订单创建 → 写入 merchantId（从 villa.merchantId 继承）
  ↓
支付成功 → 商家确认订单
  ↓
自动调用 merchantService.createSettlement()
  ↓
创建 settlement 记录：
  - amount = order.totalAmount
  - commission = amount × merchant.commissionRate
  - netAmount = amount - commission
  - status = 0 (待结算)
  ↓
更新 merchant:
  - totalRevenue += amount
  - pendingAmount += netAmount
  ↓
平台超管在结算管理页标记「已结算」
  ↓
更新 settlement.status = 1
更新 merchant: settledAmount += netAmount, pendingAmount -= netAmount
```

## 系统架构图

```
┌────────────────────┐    ┌────────────────────┐
│   微信小程序         │    │    管理后台 Web      │
│   (uni-app)         │    │    (Vue3)           │
│   游客 / 用户         │    │  平台超管 / 商家       │
└──────────┬─────────┘    └──────────┬─────────┘
           │                          │
           └──────────┬───────────────┘
                      │ HTTPS
           ┌──────────▼──────────┐
           │      Nginx          │
           │   (反向代理/静态资源)  │
           └──────────┬──────────┘
                      │
           ┌──────────▼──────────────────────────────┐
           │           Nest.js API                   │
           │                                          │
           │  ┌─────────────────────────────────┐    │
           │  │ 认证 & 多租户层                   │    │
           │  │ - JwtAuthGuard                  │    │
           │  │ - RolesGuard                    │    │
           │  │ - @AdminCtx 装饰器               │    │
           │  └─────────────────────────────────┘    │
           │                                          │
           │  ┌─────────────────────────────────┐    │
           │  │ 核心业务模块                      │    │
           │  │ merchant / villa / order /      │    │
           │  │ package / facility              │    │
           │  └─────────────────────────────────┘    │
           │                                          │
           │  ┌─────────────────────────────────┐    │
           │  │ 差异化功能模块                    │    │
           │  │ activity-plan / theme-pack /    │    │
           │  │ local-service / seasonal-event /│    │
           │  │ group-buy / order-share /       │    │
           │  │ album / order-task / community /│    │
           │  │ corporate / ai-planner          │    │
           │  └─────────────────────────────────┘    │
           │                                          │
           │  ┌─────────────────────────────────┐    │
           │  │ AI 能力模块                       │    │
           │  │ smart-recommend / ai             │    │
           │  │ → Silicon Flow API               │    │
           │  └─────────────────────────────────┘    │
           └───┬─────────┬──────────┬───────────────┘
               │         │          │
      ┌────────▼──┐  ┌───▼────┐  ┌─▼──────────┐
      │  MySQL    │  │ Redis  │  │ Silicon    │
      │  (30+ 表) │  │ (锁/缓存)│  │ Flow API   │
      └───────────┘  └────────┘  └────────────┘
```

## 数据模型设计

### 30+ 张表分类

#### 商家体系（SaaS 核心）

**merchant** — 商家
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK | |
| name | VARCHAR(100) | 商家名称 |
| logo / description / contactName / contactPhone / email / address | | 基础信息 |
| bankName / bankAccount / accountHolder | | 结算账户 |
| commissionRate | DECIMAL(4,3) | 佣金率，0-1 之间 |
| totalRevenue / settledAmount / pendingAmount | DECIMAL(12,2) | 累计数据 |
| status | TINYINT | 0-停用 1-正常 |

**settlement** — 分账记录
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK | |
| merchantId | BIGINT FK | |
| orderId | BIGINT FK UNIQUE | |
| orderNo | VARCHAR(32) | |
| amount | DECIMAL(10,2) | 订单金额 |
| commission | DECIMAL(10,2) | 平台佣金 |
| netAmount | DECIMAL(10,2) | 商家实得 |
| status | TINYINT | 0-待结算 1-已结算 |

#### 房源 & 订单

| 表 | 关键字段 | 说明 |
|----|----------|------|
| villa | merchantId, name, basePrice, weekendPrice, deposit, discount3d/5d/7d | 别墅 |
| villa_image | villaId, url | 图片 |
| facility | merchantId, name, category | 设施字典 |
| villa_facility | villaId, facilityId | 关联 |
| villa_calendar | villaId, date, price, status | 日历 |
| package | merchantId, name, price, weekendPrice, holidayPrice | 套餐（日期分档定价） |
| order | merchantId, orderNo, userId, villaId, 金额字段, 状态, 押金相关 | 订单主表 |
| order_package | orderId, packageId, 快照字段 | 订单套餐 |
| payment | orderId, transactionId, amount, type, status | 支付记录 |
| review | orderId, userId, villaId, rating, content | 评价 |

#### 差异化功能

| 表 | 说明 |
|----|------|
| activity_plan / plan_step / plan_package | 轰趴剧本：方案 + 步骤 + 关联套餐 |
| theme_pack | 氛围包：主题打包（含物品清单） |
| local_service | 周边服务：厨师/摄影/DJ 等 |
| service_order | 服务预约记录 |
| seasonal_event | 季节限定活动 |
| group_buy / group_member | 拼团裂变 |
| order_share / share_payment | AA 分摊 |
| album / album_photo | 趴后回忆相册 |
| order_task | 入住任务清单 |
| post / post_comment / post_like | 趴友圈 UGC 社区 |
| corporate_order | 老板买单 |
| chat_session / chat_message | AI 策划师对话 |

#### 用户与权限

**user** — C 端用户
| 字段 | 说明 |
|------|------|
| id, openid, unionId, nickname, avatar, phone | 微信登录信息 |

**admin** — 后台管理员（支持 SaaS 多角色）
| 字段 | 说明 |
|------|------|
| id, username, password, nickname | 基础信息 |
| role | platform / merchant |
| merchantId | platform 角色为 null |
| status | 0-停用 1-正常 |

### 订单状态流转

- 0: 待支付
- 1: 已支付/待确认
- 2: 已确认/待入住
- 3: 已入住
- 4: 待退押金
- 5: 已完成
- 6: 已取消（用户）
- 7: 已拒绝（商家）
- 8: 超时关闭

## API 接口设计

### C 端接口（无需 merchantId）

| 分类 | 主要接口 |
|------|----------|
| 认证 | `POST /api/auth/wx-login`、`GET/PUT /api/auth/profile` |
| 别墅 | `GET /api/villas`、`GET /api/villas/:id`、`GET /api/villas/:id/calendar` |
| 订单 | `POST /api/orders`、`GET /api/orders`、`POST /api/orders/:id/cancel` |
| 套餐 | `GET /api/packages` |
| 设施 | `GET /api/facilities` |
| 活动方案 | `GET /api/activity-plans`、`GET /api/activity-plans/:id` |
| 氛围包 | `GET /api/theme-packs` |
| 周边服务 | `GET /api/local-services`、`POST /api/local-services/book` |
| 限定活动 | `GET /api/seasonal-events` |
| 拼团 | `POST /api/groups`、`GET /api/groups/:id`、`POST /api/groups/:id/join` |
| AA 分摊 | `POST /api/shares`、`POST /api/shares/:id/join`、`POST /api/shares/payments/:id/pay` |
| 相册 | `POST /api/albums`、`POST /api/albums/:id/photos`、`GET /api/albums/invite/:code` |
| 任务清单 | `GET /api/orders/:id/tasks`、`POST /api/orders/tasks/:id/toggle` |
| 社区 | `GET /api/community/feed`、`POST /api/community/posts`、`POST /api/community/posts/:id/like` |
| AI | `POST /api/smart-recommend`、`POST /api/ai-planner/sessions/:id/chat` |
| 支付 | `POST /api/orders/:id/pay`、`POST /api/payment/notify` |

### B 端接口（根据角色自动隔离）

所有路径前缀 `/api/admin`，由 JwtAuthGuard + RolesGuard 保护。

| 模块 | 接口 | 备注 |
|------|------|------|
| 认证 | `POST /api/admin/auth/login` | 返回 role + merchantId |
| 商家管理 | `GET/POST/PUT/DELETE /api/admin/merchants` | @Roles('platform') 专属 |
| 财务中心 | `GET /api/admin/merchants/my/finance` | 商家查看自己 |
| 结算记录 | `GET /api/admin/merchants/my/settlements` | 按角色过滤 |
| 标记结算 | `POST /api/admin/merchants/settlements/:id/mark-settled` | 平台超管 |
| 房源 | `GET/POST/PUT /api/admin/villas` | 自动按 merchantId 过滤 |
| 房态 | `GET/PUT /api/admin/villas/:id/calendar` | |
| 套餐 | `GET/POST/PUT/DELETE /api/admin/packages` | |
| 订单 | `GET /api/admin/orders`、`POST /api/admin/orders/:id/confirm` | 确认时自动创建分账 |
| 设施 | `GET/POST/PUT/DELETE /api/admin/facilities` | |
| 活动方案 | `GET/POST/PUT/DELETE /api/admin/activity-plans` | |
| 氛围包 | `GET/POST/PUT/DELETE /api/admin/theme-packs` | |
| 周边服务 | `GET/POST/PUT/DELETE /api/admin/local-services` | |
| 限定活动 | `GET/POST/PUT/DELETE /api/admin/seasonal-events` | |
| 数据看板 | `GET /api/admin/dashboard/*` | 5 个统计接口 |
| AI 辅助 | `POST /api/admin/ai/*` | 图片排版/描述生成 |

## 项目目录结构

```
villa-party-booking/
├── docs/                          # 文档
│   ├── 01-requirements.md
│   └── 02-architecture.md
├── miniapp/                       # C 端 - uni-app
│   └── src/
│       ├── pages/                 # 20+ 页面
│       ├── api/                   # API 封装
│       ├── store/                 # Pinia
│       └── ...
├── admin/                         # B 端 - Vue3 管理后台
│   └── src/
│       ├── views/                 # 13 个页面
│       │   ├── dashboard/
│       │   ├── merchant/          # 商家管理（平台超管）
│       │   ├── finance/           # 财务中心（商家）
│       │   └── ...
│       ├── api/
│       ├── store/user.ts          # 登录用户状态
│       └── components/layout/     # 按角色显示菜单
├── server/                        # 后端 - Nest.js
│   ├── src/
│   │   ├── modules/               # 22 个业务模块
│   │   │   ├── auth/
│   │   │   ├── merchant/          # 商家 + 分账
│   │   │   ├── admin/             # 认证 + 订单 + 看板
│   │   │   ├── villa/ package/ facility/
│   │   │   ├── activity-plan/ theme-pack/
│   │   │   ├── local-service/ seasonal-event/
│   │   │   ├── group-buy/ order-share/ album/
│   │   │   ├── order-task/ community/
│   │   │   ├── corporate/ ai-planner/
│   │   │   ├── smart-recommend/ ai/
│   │   │   └── order/ payment/ review/ upload/
│   │   ├── common/
│   │   │   ├── decorators/
│   │   │   │   ├── public.decorator.ts
│   │   │   │   ├── current-user.decorator.ts
│   │   │   │   ├── admin-context.decorator.ts   # @AdminCtx
│   │   │   │   └── roles.decorator.ts           # @Roles
│   │   │   ├── guards/
│   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   └── roles.guard.ts               # RolesGuard
│   │   │   ├── filters/
│   │   │   ├── interceptors/
│   │   │   ├── redis/
│   │   │   └── types/admin-context.ts           # AdminContext 类型
│   │   ├── prisma/
│   │   ├── app.module.ts
│   │   └── main.ts
│   └── prisma/
│       ├── schema.prisma          # 30+ 模型定义
│       ├── seed.ts                # 基础种子（商家/管理员/别墅）
│       └── seed-extra.ts          # 扩展种子（氛围包/服务/活动）
├── docker-compose.yml             # MySQL + Redis
├── .claude/skills/                # Claude Code 技能
│   ├── buddy/                     # 全流程交付
│   └── pm/                        # 产品经理
├── CLAUDE.md
└── README.md
```

## 关键设计决策

### 1. 多租户数据隔离

- 采用**共享数据库 + 行级隔离**方案（而非独立 schema）
- 所有业务表加 `merchant_id` 字段
- 定义 `AdminContext` 类型 `{ id, role, merchantId }`
- `@AdminCtx` 装饰器从 JWT 提取上下文
- 每个 service 方法接收 `ctx` 参数，根据 `ctx.role` 自动拼接 where 条件
- `ensureAccess()` 方法防止通过 ID 跨商家操作

### 2. 库存锁定（防超售）

```
创建订单时：
1. Redis SETNX 锁定 villa:{id}:date:{date}（TTL 30分钟）
2. 锁定成功 → 创建订单
3. 锁定失败 → "该日期已被预订"
4. 支付成功 → 更新 villa_calendar 状态
5. 超时未支付 → 释放锁 + 关闭订单
```

### 3. 价格计算

```
订单总金额 = (别墅费用 × 连续折扣) + 套餐费用

别墅费用 = Σ(每日价格)
  - 优先取 villa_calendar 中的自定义价格
  - 无自定义价格时：周末 weekend_price，工作日 base_price

连续折扣：3天/5天/7天阶梯折扣，取最优，不叠加

套餐费用 = Σ(套餐单价 × 数量)
  - 平日 price / 周末 weekendPrice / 节假日 holidayPrice

押金 = villa.deposit（固定金额，退房验收后退还）

实付金额 = 订单总金额 + 押金
```

### 4. 分账计算

```
订单确认触发：
  merchantService.createSettlement(orderId)
    ↓
  amount = order.totalAmount
  commission = amount × merchant.commissionRate  // V1 默认 0
  netAmount = amount - commission
    ↓
  创建 settlement 记录（status=0 待结算）
  更新 merchant.totalRevenue += amount
  更新 merchant.pendingAmount += netAmount
```

### 5. 认证方案

- **C 端**：`wx.login → code2openid → 签发 JWT`
- **B 端**：`账号密码 → 签发 JWT（含 role 和 merchantId）`
- **守卫链**：`JwtAuthGuard（验证 token） → RolesGuard（验证角色） → Controller`

## 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 多商家数据隔离漏洞 | 高（数据泄漏） | 所有 admin service 强制 merchantId 过滤 + ensureAccess |
| 并发预订超售 | 高 | Redis 分布式锁 + 数据库乐观锁 |
| 支付回调丢失 | 高 | 主动查询补偿（定时任务） |
| 分账计算错误 | 高 | settlement 表单向更新，记录完整审计 |
| 图片加载慢 | 中 | CDN + 压缩 + 懒加载 |

## 实施进度

### 已完成
- ✅ Phase 1 — 基础骨架（三端初始化 + 基础模块）
- ✅ Phase 2 — 核心功能（别墅/套餐/订单 CRUD）
- ✅ Phase 3 — 差异化功能 I（轰趴剧本/AA分摊/趴后回忆）
- ✅ Phase 4 — 差异化功能 II（智能选墅/氛围包/拼团/入住清单）
- ✅ Phase 5 — 差异化功能 III（周边服务/趴友圈/老板买单/限定活动/AI策划）
- ✅ Phase 6 — SaaS 多租户改造 + 自动分账
- ✅ Phase 7 — 数据看板完善（ECharts 图表）
- ✅ Phase 8 — 房态/套餐/设施管理页面完整实现

### 待完成
- [ ] 微信支付实际对接（替换模拟支付）
- [ ] 图片上传对接 COS/OSS
- [ ] 商家店铺页（C 端按商家浏览）
- [ ] 商家入驻审核流程（V2）
- [ ] 生产环境部署
