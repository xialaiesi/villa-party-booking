# 别墅轰趴预订小程序 — 架构设计文档

## 方案概述

采用前后端分离架构：C 端为微信小程序，B 端管理后台为 Web 应用，共享同一套后端 API 服务。后端提供 RESTful API，处理业务逻辑、数据存储和微信支付对接。

## 技术选型

### 方案对比

| 方案 | 前端 | 后端 | 优点 | 缺点 | 结论 |
|------|------|------|------|------|------|
| A: 全 JS 栈 | 小程序原生 + Vue3 后台 | Node.js (Nest.js) | 全栈统一语言，开发效率高 | Node 生态支付库成熟度一般 | ❌ 放弃 |
| B: 经典全栈 | 小程序原生 + Vue3 后台 | Java (Spring Boot) | 支付生态成熟，稳定性高 | 技术栈较重 | ❌ 放弃 |
| C: 轻量全栈 | uni-app + Vue3 后台 | Node.js (Nest.js) | uni-app 跨端能力，开发效率高 | 多一层抽象 | ✅ 采用 |

### 选择理由

- **uni-app**：一套代码可编译到微信小程序、H5、APP，未来扩展成本低；基于 Vue3 语法，前后台技术统一
- **Nest.js**：TypeScript 全栈统一语言，模块化架构清晰，适合中小型项目快速迭代
- **MySQL**：关系型数据，订单/支付场景需要事务保证
- **Redis**：房态缓存、库存锁定、会话管理

### 最终技术栈

| 层 | 技术 | 说明 |
|----|------|------|
| C 端 | uni-app (Vue3 + TypeScript) | 微信小程序，可扩展 H5/APP |
| B 端后台 | Vue3 + Vite + Element Plus | 管理后台 Web |
| 后端 API | Nest.js + TypeScript | RESTful API 服务 |
| ORM | Prisma | 数据库访问，类型安全 |
| 数据库 | MySQL 8.0 | 主数据存储 |
| 缓存 | Redis | 房态缓存、库存锁、会话 |
| 对象存储 | 腾讯云 COS / 阿里云 OSS | 别墅图片存储 |
| 支付 | 微信支付 v3 API | 小程序支付 |
| 部署 | Docker + Nginx | 容器化部署 |

## 系统架构图

```
┌─────────────────┐  ┌─────────────────┐
│   微信小程序      │  │   管理后台 Web    │
│   (uni-app)      │  │   (Vue3)         │
└────────┬────────┘  └────────┬────────┘
         │                     │
         └──────────┬──────────┘
                    │ HTTPS
         ┌──────────▼──────────┐
         │      Nginx          │
         │   (反向代理/静态资源)  │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────┐
         │    Nest.js API       │
         │                      │
         │  ┌────────────────┐  │
         │  │ Auth Module    │  │  ← 微信登录 + JWT
         │  │ Villa Module   │  │  ← 房源/房态/设施
         │  │ Order Module   │  │  ← 订单/支付/退款
         │  │ Package Module │  │  ← 套餐管理
         │  │ Review Module  │  │  ← 评价
         │  │ Upload Module  │  │  ← 图片上传
         │  │ Admin Module   │  │  ← 后台管理
         │  └────────────────┘  │
         └───┬─────────┬───────┘
             │         │
    ┌────────▼──┐  ┌───▼────────┐
    │  MySQL    │  │   Redis    │
    │  (数据)   │  │  (缓存/锁)  │
    └───────────┘  └────────────┘
```

## 数据模型设计

### ER 关系概览

```
user 1──N order N──N package (through order_package)
villa 1──N villa_image
villa N──N facility (through villa_facility)
villa 1──N villa_calendar
order N──1 villa
order 1──1 payment
order 1──N review
```

### 表结构设计

#### villa — 别墅

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK | 主键 |
| name | VARCHAR(100) | 别墅名称 |
| description | TEXT | 描述 |
| address | VARCHAR(255) | 地址 |
| latitude | DECIMAL(10,7) | 纬度 |
| longitude | DECIMAL(10,7) | 经度 |
| max_guests | INT | 最大容纳人数 |
| bedrooms | INT | 卧室数 |
| area | DECIMAL(8,2) | 面积（平米） |
| base_price | DECIMAL(10,2) | 基础日价（平日价） |
| weekend_price | DECIMAL(10,2) | 周末日价 |
| deposit | DECIMAL(10,2) | 押金金额 |
| discount_3days | DECIMAL(3,2) | 连续3天折扣（如0.95表示95折） |
| discount_5days | DECIMAL(3,2) | 连续5天折扣 |
| discount_7days | DECIMAL(3,2) | 连续7天折扣 |
| cover_image | VARCHAR(500) | 封面图 URL |
| tags | VARCHAR(255) | 标签（团建/生日/聚会），逗号分隔 |
| status | TINYINT | 0-下架 1-上架 |
| sort_order | INT | 排序权重 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

#### villa_image — 别墅图片

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK | 主键 |
| villa_id | BIGINT FK | 别墅 ID |
| url | VARCHAR(500) | 图片 URL |
| sort_order | INT | 排序 |

#### facility — 设施字典

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK | 主键 |
| name | VARCHAR(50) | 设施名称（泳池/KTV/烧烤/棋牌/投影...） |
| icon | VARCHAR(200) | 图标 |
| category | VARCHAR(50) | 分类（娱乐/餐饮/运动/基础） |

#### villa_facility — 别墅-设施关联

| 字段 | 类型 | 说明 |
|------|------|------|
| villa_id | BIGINT FK | 别墅 ID |
| facility_id | BIGINT FK | 设施 ID |

#### villa_calendar — 别墅日历（房态 + 价格）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK | 主键 |
| villa_id | BIGINT FK | 别墅 ID |
| date | DATE | 日期 |
| price | DECIMAL(10,2) | 当日价格（覆盖基础价） |
| status | TINYINT | 0-不可订 1-可订 2-已预订 |

唯一索引：`(villa_id, date)`

#### package — 套餐/加购项

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK | 主键 |
| name | VARCHAR(100) | 套餐名称 |
| description | TEXT | 描述 |
| price | DECIMAL(10,2) | 平日价格 |
| weekend_price | DECIMAL(10,2) | 周末价格（周五六日） |
| holiday_price | DECIMAL(10,2) | 节假日价格 |
| category | VARCHAR(50) | 分类（烧烤/KTV/布置/食材/游戏） |
| image | VARCHAR(500) | 图片 |
| status | TINYINT | 0-下架 1-上架 |

#### user — 用户

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK | 主键 |
| openid | VARCHAR(64) | 微信 openid |
| union_id | VARCHAR(64) | 微信 union_id |
| nickname | VARCHAR(50) | 昵称 |
| avatar | VARCHAR(500) | 头像 |
| phone | VARCHAR(20) | 手机号 |
| created_at | DATETIME | 注册时间 |

#### order — 订单

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK | 主键 |
| order_no | VARCHAR(32) UNI | 订单编号 |
| user_id | BIGINT FK | 用户 ID |
| villa_id | BIGINT FK | 别墅 ID |
| check_in | DATE | 入住日期 |
| check_out | DATE | 退房日期 |
| days | INT | 天数 |
| guests | INT | 入住人数 |
| villa_amount | DECIMAL(10,2) | 别墅费用 |
| package_amount | DECIMAL(10,2) | 套餐费用 |
| discount_rate | DECIMAL(3,2) | 连续预订折扣率（1.00=无折扣） |
| discount_amount | DECIMAL(10,2) | 折扣减免金额 |
| total_amount | DECIMAL(10,2) | 总金额（折后） |
| deposit_amount | DECIMAL(10,2) | 押金金额 |
| deposit_status | TINYINT | 0-待支付 1-已收 2-已退 3-部分扣除 |
| status | TINYINT | 见状态流转 |
| contact_name | VARCHAR(50) | 联系人姓名 |
| contact_phone | VARCHAR(20) | 联系人手机 |
| remark | TEXT | 备注 |
| cancel_reason | VARCHAR(255) | 取消原因 |
| created_at | DATETIME | 下单时间 |
| paid_at | DATETIME | 支付时间 |
| confirmed_at | DATETIME | 确认时间 |

订单状态值：
- 0: 待支付
- 1: 已支付/待确认
- 2: 已确认/待入住
- 3: 已入住
- 4: 待退押金（退房验收中）
- 5: 已完成（押金已处理）
- 6: 已取消
- 7: 已拒绝
- 8: 超时关闭

#### order_package — 订单-套餐关联

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK | 主键 |
| order_id | BIGINT FK | 订单 ID |
| package_id | BIGINT FK | 套餐 ID |
| package_name | VARCHAR(100) | 套餐名称（快照） |
| price | DECIMAL(10,2) | 单价（快照） |
| quantity | INT | 数量 |

#### payment — 支付记录

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK | 主键 |
| order_id | BIGINT FK | 订单 ID |
| transaction_id | VARCHAR(64) | 微信支付交易号 |
| amount | DECIMAL(10,2) | 支付金额 |
| refund_amount | DECIMAL(10,2) | 退款金额 |
| type | TINYINT | 1-支付 2-退款 |
| status | TINYINT | 0-待支付 1-成功 2-失败 |
| created_at | DATETIME | 创建时间 |
| paid_at | DATETIME | 完成时间 |

#### review — 评价

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT PK | 主键 |
| order_id | BIGINT FK | 订单 ID |
| user_id | BIGINT FK | 用户 ID |
| villa_id | BIGINT FK | 别墅 ID |
| rating | TINYINT | 评分 1-5 |
| content | TEXT | 评价内容 |
| images | TEXT | 评价图片 URL，JSON 数组 |
| created_at | DATETIME | 评价时间 |

## API 接口设计

### C 端接口

#### 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/wx-login | 微信登录（code 换 token） |
| GET | /api/auth/profile | 获取当前用户信息 |
| PUT | /api/auth/profile | 更新用户信息 |
| POST | /api/auth/phone | 获取手机号 |

#### 别墅

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/villas | 别墅列表（支持筛选/分页） |
| GET | /api/villas/:id | 别墅详情 |
| GET | /api/villas/:id/calendar | 别墅日历（某月的价格和可订状态） |
| GET | /api/villas/:id/reviews | 别墅评价列表 |

查询参数（列表）：
- `check_in`: 入住日期
- `check_out`: 退房日期
- `guests`: 人数
- `facilities`: 设施 ID 列表
- `min_price` / `max_price`: 价格范围
- `tag`: 场景标签
- `sort`: 排序（price_asc / price_desc / rating）
- `page` / `page_size`: 分页

#### 套餐

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/packages | 可用套餐列表 |

#### 订单

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/orders | 创建订单 |
| GET | /api/orders | 我的订单列表（支持状态筛选） |
| GET | /api/orders/:id | 订单详情 |
| POST | /api/orders/:id/cancel | 取消订单 |
| POST | /api/orders/:id/pay | 发起支付（返回微信支付参数） |
| POST | /api/orders/:id/review | 提交评价 |

#### 支付回调

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/payment/notify | 微信支付回调（微信服务器调用） |

#### 通用

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/facilities | 设施字典列表 |
| POST | /api/upload | 图片上传 |

### B 端接口（管理后台）

所有路径前缀 `/api/admin`，需要管理员 JWT 认证。

#### 房源管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/admin/villas | 别墅列表 |
| POST | /api/admin/villas | 新增别墅 |
| PUT | /api/admin/villas/:id | 编辑别墅 |
| DELETE | /api/admin/villas/:id | 删除别墅 |
| PUT | /api/admin/villas/:id/status | 上架/下架 |

#### 房态管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/admin/villas/:id/calendar | 获取日历 |
| PUT | /api/admin/villas/:id/calendar | 批量设置日历（价格/状态） |

#### 套餐管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/admin/packages | 套餐列表 |
| POST | /api/admin/packages | 新增套餐 |
| PUT | /api/admin/packages/:id | 编辑套餐 |
| DELETE | /api/admin/packages/:id | 删除套餐 |

#### 订单管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/admin/orders | 订单列表（支持筛选） |
| GET | /api/admin/orders/:id | 订单详情 |
| POST | /api/admin/orders/:id/confirm | 确认订单 |
| POST | /api/admin/orders/:id/reject | 拒绝订单（触发退款） |
| POST | /api/admin/orders/:id/refund | 手动退款 |
| POST | /api/admin/orders/:id/deposit/refund | 退还押金（全额/部分） |

#### 设施管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/admin/facilities | 设施列表 |
| POST | /api/admin/facilities | 新增设施 |
| PUT | /api/admin/facilities/:id | 编辑设施 |
| DELETE | /api/admin/facilities/:id | 删除设施 |

#### 数据看板

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/admin/dashboard/stats | 统计概览（订单数/收入/入住率） |
| GET | /api/admin/dashboard/trend | 趋势数据（按天/周/月） |

#### 管理员认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/admin/auth/login | 管理员登录 |
| POST | /api/admin/auth/logout | 退出登录 |

## 项目目录结构

```
villa-party-booking/
├── docs/                          # 文档
├── miniapp/                       # C 端 - uni-app 小程序
│   ├── src/
│   │   ├── pages/                 # 页面
│   │   │   ├── index/             # 首页
│   │   │   ├── search/            # 搜索/列表
│   │   │   ├── villa/             # 别墅详情
│   │   │   ├── booking/           # 预订确认
│   │   │   ├── order/             # 订单列表 & 详情
│   │   │   └── mine/              # 我的
│   │   ├── components/            # 公共组件
│   │   ├── api/                   # API 请求封装
│   │   ├── store/                 # Pinia 状态管理
│   │   ├── utils/                 # 工具函数
│   │   ├── static/                # 静态资源
│   │   ├── App.vue
│   │   ├── main.ts
│   │   ├── manifest.json
│   │   ├── pages.json
│   │   └── uni.scss
│   ├── package.json
│   └── tsconfig.json
├── admin/                         # B 端 - 管理后台
│   ├── src/
│   │   ├── views/                 # 页面
│   │   │   ├── dashboard/         # 数据看板
│   │   │   ├── villa/             # 房源管理
│   │   │   ├── calendar/          # 房态管理
│   │   │   ├── package/           # 套餐管理
│   │   │   ├── order/             # 订单管理
│   │   │   ├── facility/          # 设施管理
│   │   │   └── login/             # 登录
│   │   ├── components/            # 公共组件
│   │   ├── api/                   # API 请求
│   │   ├── router/                # 路由
│   │   ├── store/                 # Pinia
│   │   ├── utils/                 # 工具
│   │   ├── App.vue
│   │   └── main.ts
│   ├── package.json
│   └── vite.config.ts
├── server/                        # 后端 - Nest.js
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/              # 认证（微信登录 + JWT）
│   │   │   ├── villa/             # 别墅（含日历/设施）
│   │   │   ├── order/             # 订单
│   │   │   ├── package/           # 套餐
│   │   │   ├── payment/           # 支付
│   │   │   ├── review/            # 评价
│   │   │   ├── upload/            # 文件上传
│   │   │   └── admin/             # 后台管理
│   │   ├── common/                # 公共模块
│   │   │   ├── guards/            # 权限守卫
│   │   │   ├── interceptors/      # 拦截器
│   │   │   ├── filters/           # 异常过滤器
│   │   │   ├── decorators/        # 自定义装饰器
│   │   │   └── dto/               # 公共 DTO
│   │   ├── prisma/                # Prisma 服务
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── prisma/
│   │   ├── schema.prisma          # 数据模型定义
│   │   └── seed.ts                # 种子数据
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yml             # 本地开发环境
├── .gitignore
├── CLAUDE.md
└── README.md
```

## 关键设计决策

### 1. 库存锁定（防超售）

```
创建订单时：
1. Redis SETNX 锁定 villa:{id}:date:{date} （TTL 30分钟）
2. 锁定成功 → 创建订单（待支付）
3. 锁定失败 → 返回"该日期已被预订"
4. 支付成功 → 更新 villa_calendar 状态为已预订
5. 超时未支付 → 释放 Redis 锁 + 关闭订单
```

### 2. 价格计算

```
应付金额 = (别墅费用 × 连续折扣) + 套餐费用
实付金额 = 应付金额 + 押金

别墅费用 = Σ(每日价格)
  - 优先取 villa_calendar 中的自定义价格
  - 无自定义价格时：周末取 weekend_price，工作日取 base_price

连续预订折扣：
  - 3天及以上 → discount_3days（如 0.95）
  - 5天及以上 → discount_5days（如 0.90）
  - 7天及以上 → discount_7days（如 0.85）
  - 取最优折扣，不叠加

套餐费用 = Σ(套餐日价 × 数量)
  - 套餐按入住日期区分定价：
    - 周五/六/日 → weekend_price
    - 节假日 → holiday_price（优先级最高）
    - 其他 → price（平日价）

押金 = villa.deposit（固定金额，退房验收后原路退还）
```

### 3. 押金流程

```
下单支付时：
  实付 = 订单金额 + 押金 → 一笔微信支付

退房后：
  管理员验收 → 无损坏 → 全额退还押金（微信退款，仅退押金部分）
            → 有损坏 → 扣除部分/全部押金，差额退还
            → deposit_status 更新为 已退/部分扣除
```

### 3. 微信支付流程

```
小程序端                    后端                      微信支付
   │                        │                          │
   │── POST /orders ──────→ │ 创建订单                  │
   │← 返回 order_id ───────│                           │
   │                        │                          │
   │── POST /orders/:id/pay→│                          │
   │                        │── 统一下单 ──────────────→│
   │                        │←─ prepay_id ────────────│
   │← 返回支付参数 ─────────│                          │
   │                        │                          │
   │── wx.requestPayment ──────────────────────────────→│
   │← 支付结果 ────────────────────────────────────────│
   │                        │                          │
   │                        │←─ 支付回调通知 ──────────│
   │                        │   更新订单状态            │
   │                        │   更新房态日历            │
   │                        │── 返回成功 ─────────────→│
```

### 4. 认证方案

- **C 端**：微信小程序 wx.login 获取 code → 后端换取 openid → 签发 JWT
- **B 端**：账号密码登录 → 签发 JWT
- **接口鉴权**：JWT Bearer Token，通过 Nest.js Guard 统一拦截

## 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 并发预订超售 | 高 | Redis 分布式锁 + 数据库乐观锁双重保障 |
| 支付回调丢失 | 高 | 主动查询补偿机制（定时任务查询未确认支付） |
| 图片加载慢 | 中 | CDN 加速 + 图片压缩 + 懒加载 |
| 管理后台无权限分级 | 低 | V1 单角色管理员，V2 可扩展 RBAC |

## 实施顺序

### Phase 1 — 基础骨架（Week 1）
1. 初始化三端项目（server / miniapp / admin）
2. Docker Compose 搭建 MySQL + Redis 本地环境
3. Prisma Schema 建表 + 种子数据
4. 后端基础模块（认证、异常处理、响应格式）

### Phase 2 — 核心功能（Week 2-3）
5. 别墅 CRUD + 房态日历（后端 + 管理后台）
6. 设施管理 + 套餐管理（后端 + 管理后台）
7. 小程序首页 + 搜索列表 + 别墅详情
8. 图片上传（对象存储对接）

### Phase 3 — 交易闭环（Week 3-4）
9. 订单创建 + 库存锁定
10. 微信支付对接（统一下单 + 回调）
11. 订单管理（C 端 + B 端）
12. 取消/退款流程

### Phase 4 — 完善体验（Week 5）
13. 评价功能
14. 数据看板
15. 小程序我的页面
16. 联调测试 + Bug 修复

### Phase 5 — 上线准备（Week 6）
17. 部署（Docker + Nginx）
18. 小程序提审
19. 生产环境配置 + 灰度验证
