// 视频生成入口 mockup 的共享类型（client / server 通用）

export type Category =
  | "character"
  | "scene"
  | "object"
  | "action"
  | "atmosphere"
  | "lighting"
  | "camera"
  | "style"
  | "color";

export type ParamValue = string | number | null;
export type Params = Record<string, ParamValue>;

/** analyze 接口针对某一版文本返回的一个识别结果 */
export interface DetectedEntity {
  text: string;
  start: number;
  end: number;
  category: Category;
  /** 0..1，Jev 返回的是校准过的概率；本地词典固定给一个经验值 */
  confidence: number;
  subtype?: string;
  subtypeConfidence?: number;
  /** 从字面推断出的默认参数，例如颜色的 hex、「黄昏」对应的时间 */
  params?: Params;
  /** 词是谁找到的：词典，还是分词后由模型判断出来的 */
  source: "lexicon" | "model";
  /** 类型是谁判断的 */
  judgedBy: Engine;
}

export interface VideoSettings {
  aspect: "16:9" | "9:16" | "1:1" | "4:3" | "21:9";
  resolution: "720p" | "1080p" | "4K";
  fps: 24 | 30 | 60;
  duration: number;
}

export type SettingKey = keyof VideoSettings;

/** 根据提示词推断出的常驻设置建议，例如「竖屏」→ 9:16 */
export interface SettingSuggestion {
  key: SettingKey;
  value: VideoSettings[SettingKey];
  reason: string;
  confidence: number;
}

export type Engine = "jev" | "local";

export interface AnalyzeResponse {
  engine: Engine;
  model?: string;
  latencyMs: number;
  entities: DetectedEntity[];
  suggestions: SettingSuggestion[];
  /** 想用 Jev 但失败、退回本地时的原因 */
  fallbackReason?: string;
}

export interface RefImage {
  id: string;
  url: string;
  name: string;
}

/** 前端维护的实体状态 */
export interface Entity {
  id: string;
  text: string;
  /** 在当前文本中的起点；-1 表示这段文字被编辑过、等待重新识别 */
  start: number;
  /** start 为 -1 时，记录被编辑的大致位置，用于重新识别后找回用户的设置 */
  ghost?: number;
  category: Category;
  confidence: number;
  subtype?: string;
  subtypeConfidence?: number;
  /** AI 最初判断的子类型（用户手动切换后仍保留，用于标注） */
  aiSubtype?: string;
  /** 用户手动切换过类型判断后，不再被重新识别覆盖 */
  subtypeLocked?: boolean;
  source: DetectedEntity["source"];
  judgedBy: Engine;
  params: Params;
  description: string;
  references: RefImage[];
  /** 用户细化过（改过参数 / 写过描述 / 传过参考图）→ 下划线变实线 */
  touched: boolean;
  /** 首次出现的时间，用于下划线入场动画 */
  bornAt: number;
}

export interface DescribeRequest {
  prompt: string;
  entity: {
    text: string;
    category: Category;
    subtype?: string;
    params: Params;
  };
  variant: number;
}

export interface DescribeResponse {
  engine: Engine;
  text: string;
  latencyMs: number;
  fallbackReason?: string;
}
