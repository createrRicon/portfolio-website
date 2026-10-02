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

## Lab：视频生成入口 mockup

访问 `/lab/video-gen`。复刻一个视频生成网站的进入流程：

1. 一片黑暗，屏幕中央只有闪烁的光标（`Tab` 或点击示例可以逐字填入）
2. 边输入边识别提示词里的元素（风格、颜色、角色、场景、时间天气、光线、镜头、物件、动作），加上白色下划线，每个词前后留出间距；悬停能看到它被识别成了什么
3. 点击下划线弹出该类型专属的设置：颜色给色板、风格给预设、镜头给景别 / 运镜……都可以补充描述、让 AI 帮写、上传参考图；参考图会以小缩略图显示在词前面，三张以上重叠收起
4. 画幅 / 分辨率 / 帧率 / 时长常驻在下方；提示词里写了「竖屏」「慢镜头」会自动调整
5. 没有生成按钮：`⌘/Ctrl + Enter` 生成（手机上轻点底部提示），输出一份结构化请求（原文 + 每个元素的设置 + 常驻参数）

识别分两步：本地词典 + 中文分词负责**找词**；配置 `JEV_API_KEY` 后由 [Jev](https://docs.typesafe.ai) 负责**判断**（每个词是什么类型、具体是哪一种，从而决定弹窗给出哪种交互）。未配置或调用失败时自动退回本地词典。

```bash
cp .env.example .env.local   # 填入 JEV_API_KEY
```

## 待完成功能

- [ ] 磁带线动效
- [ ] 页面过渡动画
- [ ] 更多视觉装饰元素（贴纸、手绘元素）
- [ ] 移动端优化

## License

MIT
