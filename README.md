# 个人博客

一个使用 Next.js、React 和 TypeScript 构建的个人博客网站。

## 功能特性

- ✅ 用户登录
- ✅ 发表博客
- ✅ 查看博客列表
- ✅ 删除博客

## 技术栈

- **前端**: React, Next.js, TypeScript
- **样式**: CSS3
- **认证**: JWT
- **密码加密**: bcryptjs

## 开始使用

1. 安装依赖:

```bash
npm install
```

2. 启动开发服务器:

```bash
npm run dev
```

3. 打开 [http://localhost:3000](http://localhost:3000)

## 测试账号

- 用户名: `admin`
- 密码: `admin123`

## 项目结构

```
├── app/
│   ├── api/           # API 路由
│   ├── login/         # 登录页面
│   ├── create/        # 创建博客页面
│   ├── globals.css    # 全局样式
│   ├── layout.tsx     # 布局组件
│   └── page.tsx       # 首页
├── data/
│   └── store.ts       # 数据存储
├── types/
│   └── index.ts       # 类型定义
├── package.json
└── tsconfig.json
```

## 注意事项

- 默认测试密码已加密存储
- Token 有效期为 7 天
- 数据存储在内存中，重启后会重置
