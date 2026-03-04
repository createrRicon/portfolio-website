# 龚力康作品集网站

基于「磁带」概念的个人作品集网站，使用 Next.js 14 + Three.js + Tailwind CSS 构建。

## 功能特性

- ✅ 3D 磁带模型首页（可交互）
- ✅ Track 风格的项目列表
- ✅ 完整的项目详情页
- ✅ 关于页面
- ✅ 响应式设计
- ✅ 深色主题

## 技术栈

- **框架**: Next.js 14 (App Router) + TypeScript
- **样式**: Tailwind CSS 4.x
- **3D**: Three.js + React Three Fiber
- **动画**: Framer Motion

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看网站。

### 构建生产版本

```bash
npm run build
npm start
```

## 项目结构

```
portfolio-website/
├── app/                    # Next.js App Router 页面
│   ├── about/             # 关于页
│   ├── projects/          # 项目相关页面
│   │   ├── [id]/         # 项目详情页（动态路由）
│   │   └── page.tsx      # 项目列表页
│   ├── layout.tsx        # 全局布局
│   ├── page.tsx          # 首页
│   └── globals.css       # 全局样式
├── components/
│   ├── 3d/               # 3D 组件
│   │   ├── CassetteTape.tsx  # 3D 磁带模型
│   │   └── Scene.tsx         # 3D 场景
│   └── ui/               # UI 组件
└── data/
    └── content.ts        # 作品集内容数据
```

## 自定义内容

所有作品集内容都在 `data/content.ts` 文件中，包括：

- 个人信息
- 设计理念
- 项目列表
- 工作经历

你可以直接修改这个文件来更新你的作品集内容。

## 部署

推荐使用 [Vercel](https://vercel.com) 部署：

1. 将代码推送到 GitHub
2. 在 Vercel 导入项目
3. 自动部署完成

## 待完成功能

- [ ] 磁带线动效
- [ ] 页面过渡动画
- [ ] 更多视觉装饰元素（贴纸、手绘元素）
- [ ] 移动端优化

## License

MIT
