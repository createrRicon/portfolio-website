# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个基于「磁带」概念的个人作品集网站，使用 Next.js 16 + Three.js + Tailwind CSS 构建。项目以专辑 Track 的形式展示设计案例，具有 3D 交互和深色主题的视觉风格。

## 常用命令

```bash
# 开发模式（启动开发服务器）
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 代码检查
npm run lint
```

## 架构说明

### 技术栈
- **框架**: Next.js 16 (App Router) + TypeScript
- **样式**: Tailwind CSS 4.x
- **3D**: Three.js + React Three Fiber + Drei
- **动画**: Framer Motion

### 核心目录结构

```
app/
├── layout.tsx          # 全局布局，设置 metadata 和语言
├── page.tsx            # 首页，使用 dynamic import 加载 3D 场景
├── projects/           # 项目页面
│   ├── page.tsx       # 项目列表页（Track List）
│   └── [id]/page.tsx  # 项目详情页（动态路由）
└── about/page.tsx      # 关于页面

components/3d/
├── Scene.tsx           # 3D 场景容器
└── CassetteTape.tsx    # 磁带 3D 模型组件

data/
├── content.ts          # 结构化作品集数据（项目信息、个人资料等）
└── portfolio_content.md # 原始内容文档

app/lab/video-gen/      # Lab：视频生成入口交互 mockup
app/api/video-gen/      # analyze / describe 两个 API route（Jev 或本地词典）
components/video-gen/   # mockup 的 UI，样式用 CSS Module（video-gen.module.css），不依赖全局 Tailwind
lib/video-gen/          # 词典、分类体系、实体位置映射、Jev 适配层（jev.ts 只能在服务端引用）
```

### 重要设计决策

1. **3D 组件必须使用动态导入并禁用 SSR**
   ```typescript
   const Scene = dynamic(() => import("@/components/3d/Scene"), {
     ssr: false,  // Three.js 只能在客户端运行
   });
   ```

2. **作品集内容集中在 `data/content.ts` 管理**
   - 所有项目、个人信息、设计理念都在此文件中
   - 修改内容时更新此文件即可，无需改动组件

3. **色彩系统在 Tailwind 配置中定义**
   - Primary: #0066FF (蓝色)
   - Background: #0a0a0a (深色背景)
   - Surface: #1a1a1a (卡片/组件背景)

### 数据结构

核心数据结构定义在 `data/content.ts`:
- `Project`: 项目接口（包含 challenges, strategy, solution, review 等字段）
- `Experience`: 工作经历接口
- `portfolioData`: 导出的完整数据对象

## 开发注意事项

1. **3D 组件开发**: 任何使用 Three.js 的组件必须标记为 `"use client"`，并通过 dynamic import 导入
2. **内容更新**: 修改作品集内容时直接编辑 `data/portfolio_content.md` 或 `data/content.ts`
3. **响应式设计**: 项目使用 Tailwind 的响应式类（如 `md:text-6xl`），移动端体验是重点
4. **页面路由**: 使用 Next.js App Router 的文件系统路由，动态路由使用 `[id]` 格式

## 待实现功能

- 磁带线动效
- 页面过渡动画（Framer Motion）
- 更多视觉装饰元素（贴纸、手绘元素）
- 移动端优化
