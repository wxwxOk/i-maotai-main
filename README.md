# i茅台自动预约小程序

基于微信小程序 + Node.js(Nest.js) 的i茅台自动预约系统。

## 功能特点

- ✅ 多账号管理 - 支持绑定多个i茅台账号
- ✅ 自动预约 - 每日定时自动预约茅台
- ✅ 智能选店 - 出货量最大/距离最近门店
- ✅ 自动旅行 - 自动执行小茅运任务
- ✅ 消息推送 - 预约结果/中签微信通知
- ✅ 预约记录 - 查看历史预约和中签记录

## 项目结构

```
i-maotai/
├── server/                    # 后端服务 (Nest.js)
│   ├── src/
│   │   ├── common/           # 公共模块
│   │   │   ├── prisma/       # 数据库服务
│   │   │   ├── guards/       # 守卫
│   │   │   ├── decorators/   # 装饰器
│   │   │   └── utils/        # 工具类
│   │   └── modules/
│   │       ├── auth/         # 认证模块
│   │       ├── user/         # 用户模块
│   │       ├── mt-account/   # i茅台账号模块
│   │       ├── mt-api/       # i茅台API封装
│   │       ├── reservation/  # 预约模块
│   │       ├── scheduler/    # 定时任务
│   │       └── wechat/       # 微信服务
│   ├── prisma/               # 数据库模型
│   └── Dockerfile
├── miniprogram/              # 微信小程序
│   ├── pages/
│   │   ├── index/           # 首页
│   │   ├── accounts/        # 账号管理
│   │   ├── reserve/         # 预约配置
│   │   ├── logs/            # 预约记录
│   │   └── user/            # 个人中心
│   ├── services/            # API服务
│   └── utils/               # 工具函数
├── docker-compose.yml        # Docker编排
└── ARCHITECTURE.md           # 架构设计文档
```

## 快速开始

### 1. 环境要求

- Node.js >= 18
- MySQL >= 8.0
- Redis >= 7.0
- 微信开发者工具

### 2. 后端部署

```bash
# 进入后端目录
cd server

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入数据库和微信配置

# 生成Prisma客户端
npx prisma generate

# 创建数据库表
npx prisma migrate dev

# 启动开发服务器
npm run start:dev
```

### 3. Docker部署

```bash
# 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f app
```

### 4. 小程序配置

1. 在微信公众平台注册小程序
2. 获取 AppID 和 AppSecret
3. 配置服务器域名白名单
4. 申请订阅消息模板
5. 在微信开发者工具中导入 `miniprogram` 目录
6. 修改 `utils/request.js` 中的 `BASE_URL`

## 环境变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| DATABASE_URL | 数据库连接 | mysql://root:password@localhost:3306/imaotai |
| JWT_SECRET | JWT密钥 | your-secret-key |
| WX_APPID | 小程序AppID | wx1234567890 |
| WX_SECRET | 小程序Secret | your-app-secret |
| WX_TEMPLATE_RESERVE_RESULT | 预约结果模板ID | template-id-1 |
| WX_TEMPLATE_WIN_NOTIFY | 中签通知模板ID | template-id-2 |

## 定时任务

| 任务 | 时间 | 说明 |
|------|------|------|
| 刷新数据 | 每天 8:00 | 刷新版本号和商品列表 |
| 执行预约 | 每天 9:00-9:30 | 按用户配置时间预约 |
| 查询结果 | 每天 18:00 | 查询中签结果并推送 |
| 旅行任务 | 每天 9:30-19:30 | 执行小茅运任务 |
| Token检查 | 每天 7:00 | 检查即将过期的Token |

## API接口

### 认证
- `POST /api/auth/wx-login` - 微信登录

### 用户
- `GET /api/user/info` - 获取用户信息
- `PUT /api/user/info` - 更新用户信息

### i茅台账号
- `POST /api/mt/send-code` - 发送验证码
- `POST /api/mt/login` - 登录i茅台
- `GET /api/mt/accounts` - 获取账号列表
- `GET /api/mt/accounts/:id` - 获取账号详情
- `DELETE /api/mt/accounts/:id` - 删除账号
- `PUT /api/mt/accounts/:id/location` - 更新位置
- `GET /api/mt/accounts/:id/config` - 获取预约配置
- `PUT /api/mt/accounts/:id/config` - 更新预约配置
- `POST /api/mt/accounts/:id/reserve` - 手动预约

### 预约
- `GET /api/mt/items` - 获取商品列表
- `GET /api/mt/logs` - 获取预约日志
- `GET /api/mt/today-status` - 获取今日状态

## 注意事项

⚠️ **免责声明**

1. 本项目仅供学习交流使用
2. 使用本程序产生的一切后果由用户自行承担
3. i茅台API可能随时更新，导致功能失效
4. 请勿用于商业用途

## 参考项目

- [campus-imaotai](https://github.com/oddfar/campus-imaotai)

## License

MIT
