# 个人博客

一个使用 Next.js、React 和 TypeScript 构建的个人博客网站，支持用户注册登录、博客管理、PDF OCR 文字识别等功能。

## 功能特性

- ✅ 用户注册 / 登录
- ✅ 发表博客
- ✅ 查看博客列表（登录后仅显示当前用户的博客）
- ✅ 删除博客
- ✅ PDF 文字识别（文字型 PDF 提取 + 扫描件 OCR 识别）
- ✅ AI 助手（通义千问流式对话、Markdown 渲染、复制/停止功能）
- ✅ 登录状态保护（未登录无法访问创建/OCR/AI 页面）
- ✅ API 接口 JWT 认证保护

## 技术栈

- **前端**: React, Next.js (App Router + Pages Router), TypeScript
- **样式**: Tailwind CSS
- **数据库**: MySQL (mysql2 连接池)
- **认证**: JWT (jsonwebtoken)
- **密码加密**: bcryptjs
- **OCR**:
  - 文字型 PDF: pdf-parse
  - 扫描件 PDF: pdfjs-dist + tesseract.js (前端渲染 + 图像识别)
- **AI 对话**: 通义千问 API (qwen-turbo)，流式响应
- **Markdown**: react-markdown + remark-gfm

## 开始使用

1. 安装依赖:

```bash
npm install
```

2. 配置数据库连接，创建 `.env.local` 文件:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=personal_blog
JWT_SECRET=your-secret-key-change-in-production
QWEN_API_KEY=your-dashscope-api-key
```

3. 初始化数据库（创建库、表及默认用户）:

```bash
npm run init-db
```

4. 启动开发服务器:

```bash
npm run dev
```

5. 打开 [http://localhost:3000](http://localhost:3000)

## 测试账号

- 用户名: `admin`
- 密码: `admin123`

## 项目结构

```
├── app/
│   ├── hooks/
│   │   └── AuthGuard.tsx    # 登录状态守卫组件
│   ├── login/               # 登录页面
│   ├── register/            # 注册页面
│   ├── create/              # 创建博客页面
│   ├── ocr/                 # PDF OCR 识别页面
│   ├── ai/                  # AI 助手页面（通义千问流式对话）
│   ├── globals.css          # 全局样式
│   ├── layout.tsx           # 布局组件
│   └── page.tsx             # 首页
├── pages/
│   └── api/
│       ├── auth/
│       │   ├── login.ts     # 登录 API
│       │   └── register.ts  # 注册 API
│       ├── blogs/
│       │   ├── index.ts     # 博客列表/创建 API
│       │   └── [id].ts      # 博客详情/删除 API
│       ├── ocr/
│       │   └── index.ts     # OCR 识别 API
│       └── ai/
│           └── chat.ts      # AI 对话 API（流式转发通义千问）
├── data/
│   └── store.ts             # 数据访问层 (MySQL)
├── lib/
│   ├── db.ts                # MySQL 连接池配置
│   └── init-db.ts           # 数据库初始化脚本
├── types/
│   └── index.ts             # 类型定义
├── public/
│   └── pdf.worker.min.js    # pdfjs-dist worker
├── .env.local               # 环境变量（已 gitignore）
├── package.json
└── tsconfig.json
```

## 注意事项

- 默认测试密码已加密存储
- Token 有效期为 7 天
- 数据存储在 MySQL 中，需先运行 `npm run init-db` 初始化
- `.env.local` 不会提交到 Git，需手动配置
- OCR API 已做安全加固：JWT 认证、base64 格式校验、buffer 大小限制、60s 超时保护
- AI 对话需配置 `QWEN_API_KEY`（通义千问 DashScope API Key），JWT 认证保护
