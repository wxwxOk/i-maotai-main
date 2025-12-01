# i茅台自动预约微信小程序 - 架构设计

## 一、系统架构图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              用户端                                          │
│  ┌─────────────────┐                                                        │
│  │   微信小程序     │  ← 用户操作界面                                         │
│  │  - 账号管理      │                                                        │
│  │  - 预约配置      │                                                        │
│  │  - 结果查看      │                                                        │
│  └────────┬────────┘                                                        │
└───────────┼─────────────────────────────────────────────────────────────────┘
            │ HTTPS
            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              后端服务                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         Node.js / Nest.js                           │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │    │
│  │  │  用户模块    │  │  预约模块    │  │  定时任务    │  │  消息推送   │ │    │
│  │  │ - 微信登录   │  │ - i茅台API  │  │ - 每日预约   │  │ - 订阅消息  │ │    │
│  │  │ - 账号绑定   │  │ - 签名加密   │  │ - 结果查询   │  │ - 模板消息  │ │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                    │                              │                          │
│         ┌──────────┴──────────┐         ┌────────┴────────┐                 │
│         ▼                     ▼         ▼                 ▼                 │
│  ┌─────────────┐      ┌─────────────┐  ┌─────────────────────┐             │
│  │    MySQL    │      │    Redis    │  │   微信开放平台API    │             │
│  │  - 用户数据  │      │  - 缓存     │  │  - 小程序登录        │             │
│  │  - 预约记录  │      │  - 会话     │  │  - 订阅消息推送      │             │
│  └─────────────┘      └─────────────┘  └─────────────────────┘             │
└─────────────────────────────────────────────────────────────────────────────┘
            │
            │ HTTPS
            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           i茅台服务器                                        │
│  app.moutai519.com.cn / static.moutai519.com.cn / h5.moutai519.com.cn      │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 二、技术选型

| 层级 | 技术选择 | 说明 |
|------|---------|------|
| 小程序端 | 原生微信小程序 / Taro / uni-app | 推荐uni-app，可跨端 |
| 后端框架 | Node.js + Nest.js | TypeScript支持好，适合中小项目 |
| 数据库 | MySQL 8.0 | 存储用户和预约数据 |
| 缓存 | Redis | 会话管理、接口缓存 |
| 定时任务 | node-cron / Bull | 每日定时预约 |
| 消息推送 | 微信订阅消息 | 预约结果通知 |
| 部署 | Docker + Nginx | 容器化部署 |

## 三、数据库设计

### 3.1 用户表 (users)
```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    openid VARCHAR(64) NOT NULL UNIQUE COMMENT '微信openid',
    unionid VARCHAR(64) COMMENT '微信unionid',
    nickname VARCHAR(64) COMMENT '微信昵称',
    avatar_url VARCHAR(255) COMMENT '头像URL',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_openid (openid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';
```

### 3.2 i茅台账号表 (mt_accounts)
```sql
CREATE TABLE mt_accounts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT '关联用户ID',
    mobile VARCHAR(20) NOT NULL COMMENT 'i茅台手机号',
    mt_user_id VARCHAR(32) COMMENT 'i茅台用户ID',
    token TEXT COMMENT 'i茅台Token',
    cookie TEXT COMMENT 'i茅台Cookie',
    device_id VARCHAR(64) COMMENT '设备ID',
    province_name VARCHAR(32) COMMENT '省份',
    city_name VARCHAR(32) COMMENT '城市',
    lat VARCHAR(32) COMMENT '纬度',
    lng VARCHAR(32) COMMENT '经度',
    address VARCHAR(255) COMMENT '详细地址',
    status TINYINT DEFAULT 1 COMMENT '状态: 1正常 0禁用',
    token_expire_at DATETIME COMMENT 'Token过期时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_mobile (mobile)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='i茅台账号表';
```

### 3.3 预约配置表 (reservation_configs)
```sql
CREATE TABLE reservation_configs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    account_id BIGINT NOT NULL COMMENT '关联账号ID',
    item_codes VARCHAR(255) COMMENT '商品代码,多个用@分隔',
    shop_type TINYINT DEFAULT 1 COMMENT '门店类型: 1出货量最大 2距离最近',
    reserve_minute TINYINT DEFAULT 9 COMMENT '预约分钟(9点后第几分钟)',
    random_minute TINYINT DEFAULT 0 COMMENT '是否随机分钟: 0随机 1固定',
    auto_travel TINYINT DEFAULT 1 COMMENT '自动旅行: 1开启 0关闭',
    is_enabled TINYINT DEFAULT 1 COMMENT '是否启用: 1启用 0禁用',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_account_id (account_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='预约配置表';
```

### 3.4 预约日志表 (reservation_logs)
```sql
CREATE TABLE reservation_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    account_id BIGINT NOT NULL COMMENT '关联账号ID',
    item_id VARCHAR(32) COMMENT '商品ID',
    item_name VARCHAR(64) COMMENT '商品名称',
    shop_id VARCHAR(32) COMMENT '门店ID',
    shop_name VARCHAR(128) COMMENT '门店名称',
    status TINYINT COMMENT '状态: 0预约中 1预约成功 2预约失败 3中签 4未中签',
    result_msg TEXT COMMENT '结果信息',
    reserve_date DATE COMMENT '预约日期',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_account_id (account_id),
    INDEX idx_reserve_date (reserve_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='预约日志表';
```

### 3.5 商品表 (items)
```sql
CREATE TABLE items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    item_id VARCHAR(32) NOT NULL UNIQUE COMMENT '商品ID',
    title VARCHAR(128) COMMENT '商品名称',
    content VARCHAR(255) COMMENT '商品描述',
    picture_url VARCHAR(255) COMMENT '图片URL',
    price DECIMAL(10,2) COMMENT '价格',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品表';
```

## 四、后端API接口设计

### 4.1 用户模块

```typescript
// 微信登录
POST /api/auth/wx-login
Request: { code: string }
Response: { token: string, userInfo: object }

// 获取用户信息
GET /api/user/info
Response: { id, openid, nickname, avatarUrl, accounts: [] }
```

### 4.2 i茅台账号模块

```typescript
// 发送验证码
POST /api/mt/send-code
Request: { mobile: string }
Response: { success: boolean }

// 登录i茅台
POST /api/mt/login
Request: { mobile: string, code: string }
Response: { success: boolean, account: object }

// 获取账号列表
GET /api/mt/accounts
Response: { accounts: [] }

// 删除账号
DELETE /api/mt/accounts/:id

// 更新账号位置
PUT /api/mt/accounts/:id/location
Request: { province, city, lat, lng, address }
```

### 4.3 预约配置模块

```typescript
// 获取可预约商品列表
GET /api/mt/items
Response: { items: [] }

// 获取预约配置
GET /api/mt/accounts/:id/config
Response: { config: object }

// 更新预约配置
PUT /api/mt/accounts/:id/config
Request: { itemCodes, shopType, reserveMinute, randomMinute, autoTravel, isEnabled }

// 手动触发预约
POST /api/mt/accounts/:id/reserve
Response: { success: boolean, logs: [] }
```

### 4.4 日志模块

```typescript
// 获取预约日志
GET /api/mt/logs
Query: { accountId?, page, pageSize, startDate?, endDate? }
Response: { total, list: [] }

// 获取今日预约状态
GET /api/mt/today-status
Response: { accounts: [{ accountId, status, items: [] }] }
```

## 五、小程序页面设计

```
pages/
├── index/                    # 首页 - 今日预约状态概览
│   └── index.wxml/js/wxss
├── accounts/                 # 账号管理
│   ├── list.wxml            # 账号列表
│   ├── add.wxml             # 添加账号（输入手机号+验证码）
│   └── detail.wxml          # 账号详情（位置、配置）
├── reserve/                  # 预约配置
│   ├── config.wxml          # 预约设置（商品选择、门店类型、时间）
│   └── items.wxml           # 商品选择页
├── logs/                     # 预约记录
│   └── list.wxml            # 历史记录列表
└── user/                     # 个人中心
    └── index.wxml           # 设置、关于
```

### 页面原型

```
┌─────────────────────────────┐
│  i茅台自动预约              │
├─────────────────────────────┤
│  今日预约状态               │
│  ┌─────────────────────────┐│
│  │ 138****8888             ││
│  │ 飞天茅台 ✓ 已预约       ││
│  │ 生肖茅台 ✓ 已预约       ││
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │ 139****9999             ││
│  │ 飞天茅台 ⏳ 待开奖       ││
│  └─────────────────────────┘│
├─────────────────────────────┤
│  [+] 添加账号               │
├─────────────────────────────┤
│ 🏠首页  📋记录  👤我的     │
└─────────────────────────────┘
```

## 六、定时任务设计

```typescript
// 定时任务配置
const schedules = [
  {
    name: '刷新商品和门店',
    cron: '0 0 8 * * *',      // 每天8:00
    handler: refreshShopsAndItems
  },
  {
    name: '执行预约',
    cron: '0 0-30 9 * * *',   // 每天9:00-9:30每分钟执行
    handler: executeReservation
  },
  {
    name: '查询预约结果',
    cron: '0 0 18 * * *',     // 每天18:00
    handler: queryReservationResults
  },
  {
    name: '旅行奖励',
    cron: '0 30 9-19 * * *',  // 每天9:30-19:30每小时执行
    handler: getTravelReward
  }
];
```

## 七、消息推送设计

### 7.1 订阅消息模板

**预约成功通知**
```
预约结果通知
商品名称: {{thing1.DATA}}
预约时间: {{date2.DATA}}
预约状态: {{phrase3.DATA}}
备注: {{thing4.DATA}}
```

**中签通知**
```
中签通知
商品名称: {{thing1.DATA}}
中签门店: {{thing2.DATA}}
支付截止: {{date3.DATA}}
提货截止: {{date4.DATA}}
```

### 7.2 推送逻辑

```typescript
// 推送时机
1. 每日预约完成后 → 推送预约结果
2. 查询到中签后 → 推送中签通知
3. Token即将过期 → 推送重新登录提醒
```

## 八、项目目录结构

### 8.1 后端 (server/)

```
server/
├── src/
│   ├── common/                    # 公共模块
│   │   ├── decorators/           # 装饰器
│   │   ├── filters/              # 异常过滤器
│   │   ├── guards/               # 守卫
│   │   ├── interceptors/         # 拦截器
│   │   └── utils/                # 工具类
│   │       ├── crypto.util.ts    # 加密工具(MD5/AES)
│   │       └── http.util.ts      # HTTP请求封装
│   ├── modules/
│   │   ├── auth/                 # 认证模块
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── jwt.strategy.ts
│   │   ├── user/                 # 用户模块
│   │   ├── mt-account/           # i茅台账号模块
│   │   │   ├── mt-account.controller.ts
│   │   │   ├── mt-account.service.ts
│   │   │   └── mt-account.entity.ts
│   │   ├── mt-api/               # i茅台API封装
│   │   │   ├── mt-api.service.ts
│   │   │   ├── mt-shop.service.ts
│   │   │   └── mt-reserve.service.ts
│   │   ├── reservation/          # 预约模块
│   │   ├── scheduler/            # 定时任务
│   │   │   ├── scheduler.module.ts
│   │   │   └── tasks/
│   │   │       ├── reserve.task.ts
│   │   │       ├── result.task.ts
│   │   │       └── travel.task.ts
│   │   └── wechat/               # 微信相关
│   │       ├── wechat.service.ts
│   │       └── subscribe-message.service.ts
│   ├── app.module.ts
│   └── main.ts
├── prisma/                       # 数据库迁移 (或 TypeORM)
│   └── schema.prisma
├── Dockerfile
├── docker-compose.yml
├── package.json
└── tsconfig.json
```

### 8.2 小程序 (miniprogram/)

```
miniprogram/
├── pages/
│   ├── index/                    # 首页
│   ├── accounts/                 # 账号管理
│   ├── reserve/                  # 预约配置
│   ├── logs/                     # 预约记录
│   └── user/                     # 个人中心
├── components/                   # 组件
│   ├── account-card/            # 账号卡片
│   ├── item-selector/           # 商品选择器
│   └── status-badge/            # 状态徽章
├── services/                     # API服务
│   ├── api.js                   # 请求封装
│   ├── auth.js                  # 认证相关
│   └── mt.js                    # i茅台相关
├── utils/
│   ├── request.js               # 网络请求
│   └── storage.js               # 本地存储
├── app.js
├── app.json
├── app.wxss
└── project.config.json
```

## 九、安全考虑

1. **Token加密存储** - 数据库中的i茅台Token应加密存储
2. **接口鉴权** - 所有API需要JWT认证
3. **请求限流** - 防止频繁调用i茅台API
4. **敏感信息脱敏** - 日志中手机号等信息脱敏处理
5. **HTTPS** - 全链路HTTPS加密

## 十、部署方案

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: ./server
    ports:
      - "3000:3000"
    depends_on:
      - mysql
      - redis
    environment:
      - DB_HOST=mysql
      - REDIS_HOST=redis

  mysql:
    image: mysql:8.0
    volumes:
      - mysql_data:/var/lib/mysql
    environment:
      - MYSQL_ROOT_PASSWORD=xxx
      - MYSQL_DATABASE=imaotai

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  mysql_data:
  redis_data:
```
