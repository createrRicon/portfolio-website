// 从 portfolio_content.md 提取的结构化数据

export interface Project {
  id: string;
  trackNumber: string;
  title: string;
  subtitle: string;
  description: string;
  tags: string[];
  year: string;
  overview: string;
  background: {
    market?: string[];
    projectInitiation: string[];
  };
  challenges: string[];
  strategy: string[];
  solution: string[];
  results?: string[];
  review: {
    ifAgain?: string[];
    learned: string[];
  };
  capabilities?: string[];
}

export interface Experience {
  company: string;
  position: string;
  period: string;
  responsibilities: string[];
}

export const portfolioData = {
  profile: {
    name: "龚力康",
    nameEn: "Ricon Gong",
    title: "UI/UX 设计师",
    experience: "2.5年 B端产品设计经验",
    company: "轻流 (Qingflow) - 无代码/低代码平台",
    birthYear: "2000年",
    education: "西南交通大学 · 211院校 · 风景园林 · 工学学士 (2018/09 - 2023/06)",
    contact: {
      phone: "158-9592-9199",
      email: "gongricon@gmail.com",
      wechat: "Glk0116"
    },
    skills: ["Figma", "Cursor", "Rive", "Claude Code", "Adobe Suite"]
  },

  philosophy: {
    tagline: "关系设计师 — 在复杂系统中寻找并设计联系",
    description: "我的设计特质不只是创造美观的界面，而是识别、建立和优化事物之间的关系——无论是界面元素、产品功能、用户需求，还是更广泛的系统连接。",
    keywords: [
      {
        term: "关联性 (Connectivity)",
        description: "看见并设计事物之间的关系"
      },
      {
        term: "克制 (Restraint)",
        description: "在约束中找到优雅解"
      },
      {
        term: "系统思考 (Systems Thinking)",
        description: "理解整体而非孤立元素"
      }
    ],
    beliefs: [
      "设计的起点是用户，而不是功能搬迁",
      "好的设计不是追求完美方案，而是在约束中找到最优解",
      "被否定不是终点，而是重新理解问题的起点"
    ],
    traits: [
      "充满好奇心",
      "富含同理心",
      "追求克制的力量",
      "基于逻辑推导的美学"
    ]
  },

  projects: [
    {
      id: "ai-agent",
      trackNumber: "01",
      title: "轻流 AI Agent",
      subtitle: "全局AI智能助手设计",
      description: "时间紧迫下的快速交付",
      tags: ["竞品研究", "快速决策", "系统思考"],
      year: "2025",
      overview: "为轻流无代码平台设计全局AI助手，在一周内完成从竞品研究到方案落地的全流程。聚焦场景化引导和用户可控感，让AI成为懂场景的助手，而非万能但难用的工具。",
      background: {
        market: [
          "AI功能已成为SaaS产品的重要竞争力",
          "轻流功能日益增多，学习曲线陡峭"
        ],
        projectInitiation: [
          "Q4启动「轻流AI」项目",
          "项目内容包括「AI字段」「AI节点」和「全局智能体」",
          "计划2025年年末进行线上发布会"
        ]
      },
      challenges: [
        "来得及设计吗？ - 时间紧急，需要快速交付设计",
        "用户能信任AI吗？ - B端业务需要精准和可控，获取用户信任非常重要",
        "用户愿意学吗？ - Agent可能会颠覆用户的操作习惯"
      ],
      strategy: [
        "UI层面的竞品研究：复用组件降低开发成本、场景化引导降低使用门槛、情感化设计建立品牌认知",
        "分析用户真实场景与痛点：聚焦适配度最高的场景（搭建应用），优先保证可用性和易用性",
        "通过设计给予用户可控感受：AI执行操作用户决策确认、结构化输出内容、流式输出缓解等待焦虑"
      ],
      solution: [
        "入口设计：使用公司IP「机器人小Q」作为AI助手，添加当前页面信息和推荐提示词",
        "会话设计：规范化场景会话，加入「采纳」按钮给予用户可控感",
        "回答分类：分为「文本」「技能」「输出物」不同样式展示，打字机效果展示回复",
        "技能卡片：将Agent处理任务封装为「技能」，在会话中穿插调用",
        "多场景适配：全屏展开适用于沉浸式对话，收起为侧栏适用于日常辅助"
      ],
      review: {
        ifAgain: [
          "会更早和研发对齐技术边界，避免后期发现实现成本过高",
          "会在设计任务推进研发后，规划数据埋点，确保上线后能验证设计效果"
        ],
        learned: [
          "B端场景下，AI Agent需要辅助用户使用，提高效率，而不是颠覆原使用流程",
          "平衡AI的能力和用户的控制感——重点不是AI能做什么，而是用户需要什么",
          "时间紧凑时，聚焦核心场景，用「场景-痛点-适配度」框架快速筛选优先级",
          "竞品研究真正有价值的是在有限制的场景中如何做出有效的设计决策"
        ]
      },
      capabilities: ["竞品研究", "快速决策", "系统思考"]
    },
    {
      id: "code-block",
      trackNumber: "02",
      title: "代码块节点",
      subtitle: "从失败中翻盘的设计",
      description: "被否定后重新出发",
      tags: ["用户调研", "假设验证", "从失败中学习"],
      year: "2025",
      overview: "为无代码平台设计「代码块」功能——一个看似矛盾的需求。第一版方案被研发否定后，我主动发起用户调研，发现了问题的本质，并交出了令人满意的方案。",
      background: {
        projectInitiation: [
          "客户个性化需求需要代码块能力解决",
          "代码块字段不能自动执行",
          "新增「代码块」节点功能，补足「无代码」的能力边界"
        ]
      },
      challenges: [
        "被否定：前端主管认为方案不适合真正写代码的用户",
        "如何理解写代码用户的真实需求",
        "如何在成本限制下重新设计方案"
      ],
      strategy: [
        "竞品分析：对比Zapier、明道云、VS Code、Cursor等产品",
        "用户调研：发现代码块字段和代码块节点的本质区别",
        "心智模型对齐：理解真正写代码用户的工作方式"
      ],
      solution: [
        "将线性流程解耦，不限制用户操作顺序",
        "编码优先：代码编辑区有足够的屏占比",
        "测试随行：测试功能以侧栏形式常驻，支持边写边测",
        "配置分离：回填配置独立操作，不会写代码的管理员也能完成维护",
        "用户调研验证：让真正的用户在两版方案中选择"
      ],
      review: {
        ifAgain: [
          "会在设计前先做「心智模型对齐」，找技术同事聊聊他们平时怎么写代码",
          "会在设计评审前做非正式preview，提前暴露问题"
        ],
        learned: [
          "被否定不是终点，而是重新理解问题的起点",
          "设计的起点应该是用户体验，而不是实现成本",
          "即使是设计师和产品经理，也可能不了解真正的用户怎样使用功能"
        ]
      },
      capabilities: ["用户调研", "假设验证", "从失败中学习"]
    },
    {
      id: "mobile-optimization",
      trackNumber: "03",
      title: "移动端体验优化",
      subtitle: "发现被忽视的用户",
      description: "最小成本解决核心问题",
      tags: ["策略取舍", "优先级判断", "最小成本最大价值"],
      year: "2024",
      overview: "移动端积累多年设计债务，功能堆砌、场景缺失。深入分析后我发现核心问题：移动端用户≠PC用户。我选择「表格视图」作为切入点，用「卡片样式」替代完整的「卡片视图」，以最小成本解决了80%的体验问题。",
      background: {
        market: [
          "UI风格旧：2019年上线后从未更新过UI",
          "需求债务：移动端总是低优先级，积攒了大量需求",
          "功能堆砌：移动端功能没有被系统整理过"
        ],
        projectInitiation: [
          "Q3Q4后端重构，有空余前端资源",
          "移动端体验优化由设计侧发起"
        ]
      },
      challenges: [
        "移动端用户≠PC用户，但之前完全按PC逻辑在设计",
        "如何判断核心功能优先级",
        "卡片视图功能后端成本超出预期"
      ],
      strategy: [
        "多维度分析功能优先级：需求工单、客户调研、页面走查",
        "分阶段推进：T0功能补齐、T1架构整合、T2组件库搭建",
        "策略取舍：将「卡片样式」从「卡片视图」中拆解，仅前端成本实现"
      ],
      solution: [
        "定义移动端页面范式：「应用层」「视图层」「操作层」",
        "在表格视图中新增「布局配置」，支持卡片形式展示",
        "仅支持卡片布局和标题调整，权限和表格视图一致",
        "与原有「卡片视图」不冲突，绕过后端成本高的问题"
      ],
      results: [
        "业务侧好评增加，作为季度主要功能卖点",
        "移动端相关需求工单数量显著减少，客户成功回访好评率90%",
        "表格视图成为移动端用户最常用功能之一",
        "约30%的用户选择默认卡片样式展示"
      ],
      review: {
        ifAgain: [
          "会更早和研发对齐「卡片视图」的研发成本，避免中途调整方案"
        ],
        learned: [
          "设计的起点是用户和场景，而不是功能搬迁",
          "「四两拨千斤」的价值：用最小成本解决80%的体验问题"
        ]
      },
      capabilities: ["策略取舍", "优先级判断", "最小成本最大价值"]
    }
  ] as Project[],

  experience: [
    {
      company: "轻流",
      position: "用户体验设计师",
      period: "2023/06 - 2026/02",
      responsibilities: [
        "独立负责无代码/低代码产品线产品设计、设计系统、AI功能及移动端",
        "具备与产品团队深度共建方案并推动落地的能力",
        "负责设计系统维护，包括组件库、Design Token、图标规范"
      ]
    },
    {
      company: "轻流",
      position: "用户体验设计实习生",
      period: "2022/12 - 2023/03",
      responsibilities: [
        "负责业务组内的设计任务",
        "配合产品经理完成调研任务"
      ]
    }
  ] as Experience[],

  visualStyle: {
    concept: "磁带",
    colors: {
      primary: "#0066FF",
      background: "#0a0a0a",
      surface: "#1a1a1a",
      accent: "#ffffff",
      secondary: "#888888"
    },
    elements: [
      "磁带模型（3D渲染）",
      "飘动的磁带线",
      "复古质感的标签贴纸",
      "手绘风格的装饰元素"
    ]
  }
};

export type PortfolioData = typeof portfolioData;
