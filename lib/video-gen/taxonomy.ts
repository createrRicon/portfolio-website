// 分类体系：每类元素的标签、配色、子类型，以及弹窗里该给什么交互形式。
// hint 是写给 Jev 的英文选项说明（Choice criteria 的 value）。

import type { Category, Params } from "./types";

export interface SubtypeInfo {
  key: string;
  label: string;
  hint: string;
}

export interface CategoryInfo {
  key: Category;
  label: string;
  en: string;
  /** 下划线 / 标记点的颜色；color 类用识别出的颜色本身 */
  tint: string;
  hint: string;
  subtypes?: SubtypeInfo[];
}

export const CATEGORIES: Record<Category, CategoryInfo> = {
  character: {
    key: "character",
    label: "角色",
    en: "Subject",
    tint: "#FF9EB5",
    hint: "a person, animal, robot or creature that appears in the video",
    subtypes: [
      { key: "human", label: "人物", hint: "a human being" },
      { key: "animal", label: "动物", hint: "a real-world animal" },
      { key: "robot", label: "机器人", hint: "a robot, android, mech or other machine character" },
      { key: "creature", label: "幻想生物", hint: "a mythical, magical or fantasy creature" },
    ],
  },
  scene: {
    key: "scene",
    label: "场景",
    en: "Scene",
    tint: "#74E0B0",
    hint: "a place or setting where the video takes place",
    subtypes: [
      { key: "urban", label: "城市街景", hint: "a city, street or other urban outdoor place" },
      { key: "nature", label: "自然风光", hint: "a natural landscape such as forest, sea, desert or mountains" },
      { key: "interior", label: "室内空间", hint: "an indoor space such as a room, cafe or hall" },
      { key: "cosmic", label: "太空 / 异世界", hint: "outer space, another planet, a dream or a fantasy realm" },
    ],
  },
  object: {
    key: "object",
    label: "物件",
    en: "Object",
    tint: "#D3D8E2",
    hint: "a physical object: a prop, vehicle, plant or piece of clothing",
    subtypes: [
      { key: "clothing", label: "服饰", hint: "clothing or a wearable accessory" },
      { key: "vehicle", label: "载具", hint: "a vehicle such as a car, train, boat or spaceship" },
      { key: "prop", label: "道具", hint: "a handheld object or prop" },
      { key: "flora", label: "植物", hint: "a plant, flower or tree" },
    ],
  },
  action: {
    key: "action",
    label: "动作",
    en: "Action",
    tint: "#C6F06E",
    hint: "an action, motion or event performed by something in the video",
  },
  atmosphere: {
    key: "atmosphere",
    label: "时间天气",
    en: "Time & Weather",
    tint: "#8CC8FF",
    hint: "time of day, season or weather",
  },
  lighting: {
    key: "lighting",
    label: "光线",
    en: "Lighting",
    tint: "#FFD27A",
    hint: "a lighting condition or light source",
  },
  camera: {
    key: "camera",
    label: "镜头",
    en: "Camera",
    tint: "#FF8F6B",
    hint: "camera shot size, angle, movement, lens or playback speed",
    subtypes: [
      { key: "shot", label: "景别机位", hint: "shot size or camera angle, e.g. close-up, wide shot, aerial view" },
      { key: "movement", label: "运镜", hint: "camera movement, e.g. push in, pan, orbit, tracking, handheld" },
      { key: "lens", label: "镜头焦段", hint: "lens type or depth of field, e.g. wide-angle, telephoto, shallow focus" },
      { key: "tempo", label: "速度", hint: "playback speed, e.g. slow motion or timelapse" },
    ],
  },
  style: {
    key: "style",
    label: "风格",
    en: "Style",
    tint: "#B9A3FF",
    hint: "a visual or artistic style, film genre or director reference",
  },
  color: {
    key: "color",
    label: "颜色",
    en: "Color",
    tint: "#E5E7EB",
    hint: "a color",
  },
};

export const CATEGORY_KEYS = Object.keys(CATEGORIES) as Category[];

export function subtypeInfo(category: Category, subtype?: string): SubtypeInfo | undefined {
  return CATEGORIES[category].subtypes?.find((s) => s.key === subtype);
}

/* ---------------------------------- 颜色 ---------------------------------- */

export interface Swatch {
  name: string;
  hex: string;
  en: string;
}

// 名字必须都在词典里，这样改写原文之后重新识别还能认出来
export const SWATCHES: Swatch[] = [
  { name: "红色", hex: "#E5484D", en: "red" },
  { name: "橙色", hex: "#F76B15", en: "orange" },
  { name: "金色", hex: "#D4A72C", en: "gold" },
  { name: "黄色", hex: "#F5D90A", en: "yellow" },
  { name: "绿色", hex: "#30A46C", en: "green" },
  { name: "青色", hex: "#12A594", en: "teal / cyan" },
  { name: "蓝色", hex: "#3E63DD", en: "blue" },
  { name: "紫色", hex: "#8E4EC6", en: "purple" },
  { name: "粉色", hex: "#E93D82", en: "pink" },
  { name: "棕色", hex: "#8B5A2B", en: "brown" },
  { name: "白色", hex: "#F2F2F2", en: "white" },
  { name: "灰色", hex: "#8B8D98", en: "gray" },
  { name: "黑色", hex: "#18181B", en: "black" },
];

/* ---------------------------------- 风格 ---------------------------------- */

export interface StylePreset {
  key: string;
  name: string;
  en: string;
  /** 英文提示词里改写原文时用的短名（同样在词典里） */
  short: string;
  gradient: string;
}

// name 同样必须在词典里
export const STYLE_PRESETS: StylePreset[] = [
  { key: "cyberpunk", name: "赛博朋克", en: "cyberpunk", short: "cyberpunk", gradient: "linear-gradient(135deg,#ff2a6d 0%,#7a04eb 55%,#05d9e8 100%)" },
  { key: "film", name: "胶片写实", en: "35mm film realism", short: "film grain", gradient: "linear-gradient(135deg,#e2c290 0%,#9c6b43 55%,#3b2a22 100%)" },
  { key: "ghibli", name: "吉卜力", en: "Studio Ghibli animation", short: "ghibli", gradient: "linear-gradient(160deg,#9be1ff 0%,#c8f7c5 55%,#6fbf73 100%)" },
  { key: "ink", name: "水墨", en: "Chinese ink wash", short: "ink wash", gradient: "linear-gradient(160deg,#f4f1ea 0%,#a9a59c 50%,#1f1f1f 100%)" },
  { key: "noir", name: "黑色电影", en: "film noir", short: "film noir", gradient: "linear-gradient(135deg,#0b0b0b 0%,#5a5a5a 60%,#d9d9d9 100%)" },
  { key: "vaporwave", name: "蒸汽波", en: "vaporwave", short: "vaporwave", gradient: "linear-gradient(135deg,#ff71ce 0%,#b967ff 50%,#01cdfe 100%)" },
  { key: "claymation", name: "定格动画", en: "claymation stop motion", short: "claymation", gradient: "linear-gradient(135deg,#ffd27a 0%,#f79d65 55%,#c8553d 100%)" },
  { key: "pixar", name: "皮克斯", en: "Pixar-style 3D animation", short: "pixar", gradient: "linear-gradient(135deg,#a1c4fd 0%,#c2e9fb 45%,#fbc2eb 100%)" },
];

/* --------------------------------- 弹窗控件 -------------------------------- */

export type SliderFormat = "time" | "kelvin" | "mm" | "percent";

export type ControlSpec =
  | { kind: "chips"; key: string; label: string; options: string[] }
  | {
      kind: "slider";
      key: string;
      label: string;
      min: number;
      max: number;
      step: number;
      format?: SliderFormat;
      /** 两端的文字说明，有它时不显示数值 */
      ends?: [string, string];
      track?: "sky" | "kelvin";
    }
  | { kind: "color" }
  | { kind: "style" }
  | { kind: "light-preview" }
  | { kind: "shot-size"; key: string; label: string; options: string[] }
  | { kind: "camera-move"; key: string; label: string; options: string[] };

export const SHOT_SIZES = ["大特写", "特写", "近景", "中景", "全景", "远景"];
export const CAMERA_MOVES = ["固定", "推进", "拉远", "横摇", "环绕", "跟随", "升降", "手持"];
export const LIGHT_POSITIONS = ["顺光", "侧光", "逆光", "顶光", "底光"];
export const WEATHERS = ["晴", "多云", "雨", "雪", "雾", "风暴"];

const CONTROLS: Record<string, ControlSpec[]> = {
  "character.human": [
    { kind: "chips", key: "age", label: "年龄", options: ["儿童", "少年", "青年", "中年", "老年"] },
    { kind: "chips", key: "expression", label: "神情", options: ["平静", "坚定", "忧郁", "微笑", "警惕"] },
    { kind: "chips", key: "bearing", label: "体态", options: ["挺拔", "慵懒", "匆忙", "轻盈"] },
  ],
  "character.animal": [
    { kind: "chips", key: "size", label: "体型", options: ["幼崽", "小型", "中型", "大型"] },
    { kind: "chips", key: "coat", label: "毛色", options: ["原色", "纯白", "乌黑", "橘黄", "花斑"] },
    { kind: "chips", key: "mood", label: "状态", options: ["安静", "好奇", "奔跑", "嬉闹"] },
  ],
  "character.robot": [
    { kind: "chips", key: "form", label: "外形", options: ["人形", "圆润可爱", "工业机械", "巨型机甲"] },
    { kind: "chips", key: "material", label: "材质", options: ["磨砂金属", "陶瓷白", "锈蚀", "全息"] },
    { kind: "slider", key: "mechanical", label: "机械感", min: 0, max: 100, step: 1, ends: ["拟人", "机械"] },
  ],
  "character.creature": [
    { kind: "chips", key: "aura", label: "气质", options: ["神圣", "诡异", "可爱", "威严"] },
    { kind: "chips", key: "scale", label: "体型", options: ["掌心大小", "人类大小", "遮天蔽日"] },
    { kind: "slider", key: "realism", label: "写实程度", min: 0, max: 100, step: 1, ends: ["卡通", "写实"] },
  ],
  "scene.urban": [
    { kind: "chips", key: "era", label: "时代", options: ["古代", "近代", "现代", "未来"] },
    { kind: "slider", key: "crowd", label: "人流", min: 0, max: 100, step: 1, ends: ["空无一人", "人潮汹涌"] },
    { kind: "chips", key: "ground", label: "地面", options: ["干燥", "湿润反光", "积雪", "落叶"] },
  ],
  "scene.nature": [
    { kind: "chips", key: "season", label: "季节", options: ["春", "夏", "秋", "冬"] },
    { kind: "slider", key: "vegetation", label: "植被", min: 0, max: 100, step: 1, ends: ["荒芜", "茂密"] },
    { kind: "chips", key: "view", label: "视野", options: ["开阔", "幽闭", "层叠"] },
  ],
  "scene.interior": [
    { kind: "chips", key: "space", label: "空间", options: ["局促", "适中", "空旷"] },
    { kind: "chips", key: "decor", label: "陈设", options: ["极简", "杂乱", "复古", "工业风"] },
    { kind: "slider", key: "daylight", label: "自然光", min: 0, max: 100, step: 1, ends: ["昏暗", "明亮"] },
  ],
  "scene.cosmic": [
    { kind: "chips", key: "environment", label: "环境", options: ["真空", "异星地表", "星云", "舱内"] },
    { kind: "slider", key: "fantasy", label: "幻想程度", min: 0, max: 100, step: 1, ends: ["硬科幻", "奇幻"] },
  ],
  "object.clothing": [
    { kind: "chips", key: "material", label: "材质", options: ["棉麻", "皮革", "丝绸", "羊毛", "防水面料"] },
    { kind: "chips", key: "condition", label: "状态", options: ["崭新", "褶皱", "湿透", "破旧"] },
  ],
  "object.vehicle": [
    { kind: "chips", key: "motion", label: "状态", options: ["静止", "缓行", "疾驰"] },
    { kind: "chips", key: "era", label: "年代", options: ["复古", "现代", "未来"] },
  ],
  "object.prop": [
    { kind: "chips", key: "material", label: "材质", options: ["金属", "木质", "玻璃", "纸", "布"] },
    { kind: "chips", key: "focus", label: "画面地位", options: ["背景", "配角", "焦点"] },
  ],
  "object.flora": [
    { kind: "chips", key: "bloom", label: "状态", options: ["含苞", "盛开", "凋零"] },
    { kind: "slider", key: "amount", label: "数量", min: 0, max: 100, step: 1, ends: ["一株", "漫山遍野"] },
  ],
  action: [
    { kind: "chips", key: "pace", label: "速度", options: ["慢动作", "自然", "急促"] },
    { kind: "slider", key: "amplitude", label: "动作幅度", min: 0, max: 100, step: 1, ends: ["细微", "夸张"] },
  ],
  atmosphere: [
    { kind: "slider", key: "time", label: "时间", min: 0, max: 24, step: 0.5, format: "time", track: "sky" },
    { kind: "chips", key: "weather", label: "天气", options: WEATHERS },
    { kind: "chips", key: "mood", label: "情绪", options: ["宁静", "孤独", "紧张", "浪漫"] },
  ],
  lighting: [
    { kind: "light-preview" },
    { kind: "chips", key: "position", label: "光位", options: LIGHT_POSITIONS },
    { kind: "slider", key: "kelvin", label: "色温", min: 1800, max: 9000, step: 100, format: "kelvin", track: "kelvin" },
    { kind: "slider", key: "hardness", label: "软硬", min: 0, max: 100, step: 1, ends: ["柔和", "硬朗"] },
  ],
  "camera.shot": [
    { kind: "shot-size", key: "size", label: "景别", options: SHOT_SIZES },
    { kind: "chips", key: "angle", label: "机位", options: ["仰拍", "平视", "俯拍", "鸟瞰"] },
  ],
  "camera.movement": [
    { kind: "camera-move", key: "move", label: "运镜", options: CAMERA_MOVES },
    { kind: "slider", key: "speed", label: "运镜速度", min: 0, max: 100, step: 1, ends: ["缓慢", "迅速"] },
  ],
  "camera.lens": [
    { kind: "slider", key: "focal", label: "焦段", min: 12, max: 200, step: 1, format: "mm" },
    { kind: "slider", key: "dof", label: "景深", min: 0, max: 100, step: 1, ends: ["全景深", "浅景深"] },
  ],
  "camera.tempo": [
    { kind: "chips", key: "speed", label: "播放速度", options: ["0.25×", "0.5×", "1×", "2×", "延时"] },
    { kind: "slider", key: "blur", label: "运动模糊", min: 0, max: 100, step: 1, ends: ["清晰", "拖影"] },
  ],
  style: [
    { kind: "style" },
    { kind: "slider", key: "strength", label: "风格强度", min: 0, max: 100, step: 1, format: "percent" },
  ],
  color: [
    { kind: "color" },
    { kind: "chips", key: "role", label: "作用", options: ["主色调", "点缀色", "光色"] },
  ],
};

/** 「AI 判断」的结果决定弹窗给出哪一组交互 */
export function controlsFor(category: Category, subtype?: string): ControlSpec[] {
  const info = CATEGORIES[category];
  if (info.subtypes) {
    const key = subtype && info.subtypes.some((s) => s.key === subtype) ? subtype : info.subtypes[0].key;
    return CONTROLS[`${category}.${key}`] ?? [];
  }
  return CONTROLS[category] ?? [];
}

const SLIDER_DEFAULTS: Record<string, number> = {
  time: 12,
  kelvin: 5600,
  hardness: 40,
  focal: 35,
  dof: 50,
  speed: 35,
  blur: 20,
  strength: 70,
  amplitude: 50,
  crowd: 45,
  vegetation: 60,
  daylight: 55,
  fantasy: 40,
  mechanical: 60,
  realism: 60,
  amount: 30,
};

/** 新识别出的实体的初始参数：滑杆给默认值，chips 留空（= 交给 AI） */
export function defaultParams(category: Category, subtype?: string, inferred?: Params): Params {
  const params: Params = {};
  for (const spec of controlsFor(category, subtype)) {
    if (spec.kind === "slider") params[spec.key] = SLIDER_DEFAULTS[spec.key] ?? Math.round((spec.min + spec.max) / 2);
  }
  return { ...params, ...inferred };
}

export function formatSlider(value: number, format?: SliderFormat): string {
  switch (format) {
    case "time": {
      const h = Math.floor(value) % 24;
      const m = Math.round((value - Math.floor(value)) * 60);
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
    case "kelvin":
      return `${value}K`;
    case "mm":
      return `${value}mm`;
    case "percent":
      return `${value}%`;
    default:
      return String(value);
  }
}
