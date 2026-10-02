// 「AI 帮我写」：Jev 不生成文本，所以描述由「词表 + 模板」组成——
// 每个空位由 Jev 在候选措辞里做 Choice（本地模式下按上下文挑），再拼成句子。
// 弹窗里已选的 chip 会直接锁定对应空位，保证描述和 GUI 一致。

import type { Category, Params } from "./types";

export interface VocabOption {
  text: string;
  /** 对应弹窗里的 chip 值：用户选了这个值，就固定用这条措辞 */
  when?: string;
  /** 本地模式随机挑选时的权重（默认 1）。「时代」这类强设定不该被随便挑中 */
  weight?: number;
}

export interface VocabGroup {
  key: string;
  /** 给 Jev 的英文问题片段 */
  question: string;
  /** 与哪个弹窗参数联动 */
  param?: string;
  options: VocabOption[];
}

export interface Recipe {
  groups: VocabGroup[];
  template: string;
}

const g = (key: string, question: string, options: Array<string | [string, string] | [string, string, number]>, param?: string): VocabGroup => ({
  key,
  question,
  param,
  options: options.map((o) => (Array.isArray(o) ? { when: o[0], text: o[1], weight: o[2] } : { text: o })),
});

const RECIPES: Record<string, Recipe> = {
  "character.human": {
    template: "{age}{text}，{look}，{expression}，{bearing}，{motion}。",
    groups: [
      g("age", "the age of this person", [["儿童", "七八岁的"], ["少年", "十几岁的"], ["青年", "二十出头的"], ["中年", "四十岁上下的"], ["老年", "白发苍苍的"]], "age"),
      g("look", "a hair or appearance detail", ["短发微湿，几缕贴在额前", "长发被风吹乱", "利落的齐耳短发", "头发松松地挽在脑后", "半张脸藏在兜帽的阴影里"]),
      g("expression", "the facial expression", [["平静", "神情平静"], ["坚定", "眼神坚定"], ["忧郁", "眉眼间带着一点忧郁"], ["微笑", "嘴角挂着浅浅的笑"], ["警惕", "目光警惕地扫过四周"]], "expression"),
      g("bearing", "the body language", [["挺拔", "站姿挺拔"], ["慵懒", "姿态松弛慵懒"], ["匆忙", "脚步匆忙"], ["轻盈", "动作轻盈"]], "bearing"),
      g("motion", "a small action that fits the scene", ["缓缓回头望向镜头", "抬头看向远处", "低头整理衣领", "把手插进口袋", "停下来，深吸一口气"]),
    ],
  },
  "character.animal": {
    template: "{size}{text}，{coat}，{texture}，{mood}。",
    groups: [
      g("size", "the size or age of the animal", [["幼崽", "一只刚出生不久的"], ["小型", "一只小小的"], ["中型", "一只"], ["大型", "一只体型高大的"]], "size"),
      g("coat", "the fur color", [["原色", "毛色自然"], ["纯白", "通体雪白"], ["乌黑", "毛色乌黑发亮"], ["橘黄", "一身橘黄的毛"], ["花斑", "身上带着花斑"]], "coat"),
      g("texture", "a fur texture detail", ["毛发蓬松柔软", "皮毛被雨打湿，一绺一绺的", "毛尖在逆光里泛着金边", "皮毛光亮顺滑"]),
      g("mood", "what the animal is doing", [["安静", "安静地蹲坐着"], ["好奇", "好奇地歪着头张望"], ["奔跑", "轻快地小跑"], ["嬉闹", "欢快地扑腾打闹"]], "mood"),
    ],
  },
  "character.robot": {
    template: "{form}{text}，{material}，{detail}。",
    groups: [
      g("form", "the robot's body shape", [["人形", "人形的"], ["圆润可爱", "圆润小巧的"], ["工业机械", "方正笨重的工业"], ["巨型机甲", "高达数十米的"]], "form"),
      g("material", "the shell material", [["磨砂金属", "磨砂金属外壳"], ["陶瓷白", "白色陶瓷质感的外壳"], ["锈蚀", "外壳斑驳生锈"], ["全息", "半透明的全息外壳"]], "material"),
      g("detail", "a mechanical detail", ["眼部发出柔和的蓝光", "关节处偶尔迸出细小的电火花", "胸口的指示灯有节奏地闪烁", "动作带着轻微的机械顿挫"]),
    ],
  },
  "character.creature": {
    template: "{aura}{text}，{scale}，{detail}。",
    groups: [
      g("aura", "the creature's aura", [["神圣", "散发着圣洁微光的"], ["诡异", "轮廓模糊、透着诡异气息的"], ["可爱", "圆头圆脑、憨态可掬的"], ["威严", "气势威严的"]], "aura"),
      g("scale", "the creature's size", [["掌心大小", "只有掌心大小"], ["人类大小", "与人差不多高"], ["遮天蔽日", "庞大到遮住半边天空"]], "scale"),
      g("detail", "a striking visual detail", ["鳞片在光下泛着虹彩", "周身萦绕着细碎的光点", "每一次呼吸都带起一阵风", "尾巴在身后缓缓摆动"]),
    ],
  },
  "scene.urban": {
    template: "{era}{text}，{ground}，{detail}，{crowd}。",
    groups: [
      g("era", "the era of the place", [["古代", "青石板铺就的", 0.3], ["近代", "带着民国风情的", 0.3], ["现代", "", 3], ["未来", "高楼林立、全息广告闪烁的", 0.6]], "era"),
      g("ground", "the street surface", [["干燥", "路面干燥"], ["湿润反光", "湿漉漉的路面倒映着招牌的光"], ["积雪", "路边堆着未化的积雪"], ["落叶", "地上铺满落叶"]], "ground"),
      g("detail", "an environmental detail", ["两侧是层层叠叠的招牌", "远处有电车缓缓驶过", "街角的自动售货机亮着灯", "井盖缝隙里升起白色蒸汽", "电线在头顶交错"]),
      g("crowd", "how crowded it is", ["空无一人", "零星几个行人撑伞走过", "人潮汹涌，彼此擦肩而过"]),
    ],
  },
  "scene.nature": {
    template: "{season}{text}，{detail}，{view}。",
    groups: [
      g("season", "the season", [["春", "春日的"], ["夏", "盛夏的"], ["秋", "深秋的"], ["冬", "冬日的"]], "season"),
      g("detail", "a natural detail", ["薄雾在低处缓缓流动", "风吹过时草浪层层起伏", "阳光穿过枝叶洒下斑驳光点", "远处山峦层叠，渐隐于雾中"]),
      g("view", "the sense of space", [["开阔", "视野开阔"], ["幽闭", "四周幽深静谧"], ["层叠", "前中后景层次分明"]], "view"),
    ],
  },
  "scene.interior": {
    template: "{space}{text}，{decor}，{light}。",
    groups: [
      g("space", "the size of the room", [["局促", "狭小的"], ["适中", ""], ["空旷", "空旷的"]], "space"),
      g("decor", "the furnishing style", [["极简", "陈设极简，只有一桌一椅"], ["杂乱", "杂物堆得满满当当"], ["复古", "摆着旧唱片机和褪色的海报"], ["工业风", "墙面是裸露的水泥和金属管道"]], "decor"),
      g("light", "the light inside", ["午后的光从百叶窗斜斜切进来", "一盏昏黄的台灯照亮角落", "窗外的霓虹在墙上投下变幻的颜色", "灰尘在光线里缓缓飘浮"]),
    ],
  },
  "scene.cosmic": {
    template: "{text}，{environment}，{detail}。",
    groups: [
      g("environment", "the surroundings", [["真空", "四下是寂静的真空"], ["异星地表", "脚下是荒凉的异星地表"], ["星云", "背景是绚烂翻涌的星云"], ["舱内", "视角在狭窄的舱室之内"]], "environment"),
      g("detail", "a cosmic detail", ["漂浮的尘埃在光束中闪烁", "远处一颗蔚蓝星球缓缓转动", "失重让一切都慢了下来", "金属舱壁上凝着细小的冰晶"]),
    ],
  },
  "object.clothing": {
    template: "{material}{text}，{condition}，{motion}。",
    groups: [
      g("material", "the fabric", [["棉麻", "棉麻质地的"], ["皮革", "皮革"], ["丝绸", "丝绸"], ["羊毛", "羊毛呢"], ["防水面料", "防水面料的"]], "material"),
      g("condition", "the condition of the garment", [["崭新", "剪裁利落、崭新挺括"], ["褶皱", "带着自然的褶皱"], ["湿透", "被雨水打湿，颜色深了一层"], ["破旧", "边角磨损、有些破旧"]], "condition"),
      g("motion", "how it moves on screen", ["衣摆在风中翻动", "随动作轻轻摆荡", "在光下泛着细腻的光泽"]),
    ],
  },
  "object.vehicle": {
    template: "{era}{text}，{motion}，{detail}。",
    groups: [
      g("era", "the design era", [["复古", "复古的", 0.6], ["现代", "", 2], ["未来", "线条锋利、充满未来感的", 0.6]], "era"),
      g("motion", "whether it is moving", [["静止", "静静停在一旁"], ["缓行", "缓缓驶过"], ["疾驰", "疾驰而过，拖出长长的光轨"]], "motion"),
      g("detail", "a surface detail", ["车身上落满雨滴", "车灯在雾气里晕开", "表面反射着周围的灯光"]),
    ],
  },
  "object.prop": {
    template: "{material}{text}，{focus}，{detail}。",
    groups: [
      g("material", "the material", [["金属", "金属质感的"], ["木质", "木质的"], ["玻璃", "玻璃"], ["纸", "纸做的"], ["布", "布面的"]], "material"),
      g("focus", "its importance in the frame", [["背景", "安静地待在画面一角"], ["配角", "在画面中若隐若现"], ["焦点", "是整个画面的视觉焦点"]], "focus"),
      g("detail", "a surface detail", ["表面有细微的划痕", "在光下闪着微光", "带着被使用过的痕迹"]),
    ],
  },
  "object.flora": {
    template: "{bloom}{text}，{detail}。",
    groups: [
      g("bloom", "the blooming state", [["含苞", "含苞待放的"], ["盛开", "盛开的"], ["凋零", "开始凋零的"]], "bloom"),
      g("detail", "a delicate detail", ["花瓣上挂着细小的水珠", "随风轻轻摇曳", "被光线勾出半透明的轮廓", "零星的花瓣缓缓飘落"]),
    ],
  },
  action: {
    template: "{text}的过程{pace}，{feel}。",
    groups: [
      g("pace", "the pace of the action", [["慢动作", "以慢动作呈现"], ["自然", "节奏自然"], ["急促", "急促而有力"]], "pace"),
      g("feel", "the feeling of the motion", ["带着一点迟疑", "一气呵成", "收尾时有短暂的停顿", "像是排练过很多次"]),
    ],
  },
  atmosphere: {
    template: "{text}，{weather}，{air}，{mood}。",
    groups: [
      g("weather", "the weather", [["晴", "天空澄澈"], ["多云", "云层低垂"], ["雨", "雨丝斜斜落下"], ["雪", "细雪无声飘落"], ["雾", "薄雾弥漫"], ["风暴", "狂风卷着雨点"]], "weather"),
      g("air", "how the air feels", ["空气湿润微凉", "远处传来模糊的城市声响", "一切显得安静而缓慢", "风里带着一点咸味"]),
      g("mood", "the emotional tone", [["宁静", "整体氛围宁静"], ["孤独", "透出一种孤独感"], ["紧张", "空气里有种山雨欲来的紧张"], ["浪漫", "氛围温柔浪漫"]], "mood"),
    ],
  },
  lighting: {
    template: "{text}：{position}，{quality}。",
    groups: [
      g("position", "where the light comes from", [["顺光", "光线从正面打来，细节清晰"], ["侧光", "光从一侧斜射，明暗对比分明"], ["逆光", "光从主体身后打来，勾出一圈亮边"], ["顶光", "光从头顶落下，阴影短而浓"], ["底光", "光从下方往上照，带点戏剧感"]], "position"),
      g("quality", "a quality of the light", ["高光处微微溢出", "暗部保留着细节", "光里能看到浮动的微尘", "整体反差柔和"]),
    ],
  },
  "camera.shot": {
    template: "{text}：{angle}，{size}{purpose}。",
    groups: [
      g("angle", "the camera angle", [["仰拍", "从低处仰拍"], ["平视", "平视"], ["俯拍", "从高处俯拍"], ["鸟瞰", "从空中鸟瞰"]], "angle"),
      g("size", "the shot size", [["大特写", "用大特写"], ["特写", "用特写"], ["近景", "用近景"], ["中景", "用中景"], ["全景", "用全景"], ["远景", "用远景"]], "size"),
      g("purpose", "what the framing should achieve", ["突出人物的情绪", "交代环境与人物的关系", "让画面更有压迫感", "营造一种疏离感"]),
    ],
  },
  "camera.movement": {
    template: "{text}：{move}，{purpose}。",
    groups: [
      g("move", "the camera movement", [["固定", "机位固定不动"], ["推进", "镜头缓缓推进"], ["拉远", "镜头慢慢拉远"], ["横摇", "镜头水平横摇"], ["环绕", "镜头围绕主体环绕"], ["跟随", "镜头稳稳跟随主体"], ["升降", "镜头缓缓升起"], ["手持", "手持拍摄，带轻微晃动"]], "move"),
      g("purpose", "what the movement should achieve", ["把注意力一点点收拢到主体上", "逐步揭示周围的环境", "制造身临其境的临场感", "让情绪慢慢累积"]),
    ],
  },
  "camera.lens": {
    template: "{text}，{look}。",
    groups: [g("look", "the optical look", ["画面边缘有轻微的透视拉伸", "背景被压缩得很近", "焦外化成柔和的光斑", "主体从背景中被干净地剥离"])],
  },
  "camera.tempo": {
    template: "{text}：{speed}呈现，{effect}。",
    groups: [
      g("speed", "the playback speed", [["0.25×", "以四分之一速度"], ["0.5×", "以半速"], ["1×", "以正常速度"], ["2×", "以两倍速"], ["延时", "以延时摄影"]], "speed"),
      g("effect", "the effect of the speed change", ["放大每一个细微动作", "让时间的流逝变得可见", "营造梦境般的质感"]),
    ],
  },
  style: {
    template: "整体为{text}风格，{palette}，{texture}。",
    groups: [
      g("palette", "the color palette", ["高对比的色彩", "低饱和的柔和色调", "偏冷的青色调", "偏暖的琥珀色调"]),
      g("texture", "the image texture", ["细腻的胶片颗粒", "干净锐利的画面", "轻微的暗角", "手工质感的笔触"]),
    ],
  },
  color: {
    template: "{text}{role}，{quality}。",
    groups: [
      g("role", "how the color is used", [["主色调", "作为画面的主色调", 2], ["点缀色", "作为点缀色出现"], ["光色", "作为光的颜色", 0.6]], "role"),
      g("quality", "the quality of the color", ["饱和度偏高，非常醒目", "略带灰调，显得克制", "带有一点金属光泽", "在暗部里依然清晰可辨"]),
    ],
  },
};

export function recipeFor(category: Category, subtype?: string): Recipe {
  if (subtype && RECIPES[`${category}.${subtype}`]) return RECIPES[`${category}.${subtype}`];
  const fallback = Object.keys(RECIPES).find((k) => k.startsWith(`${category}.`));
  return RECIPES[category] ?? RECIPES[fallback ?? "style"];
}

/** 用户在弹窗里已经选定的空位 */
export function lockedPicks(recipe: Recipe, params: Params): Record<string, VocabOption> {
  const picks: Record<string, VocabOption> = {};
  for (const group of recipe.groups) {
    if (!group.param) continue;
    const value = params[group.param];
    const option = group.options.find((o) => o.when !== undefined && o.when === value);
    if (option) picks[group.key] = option;
  }
  return picks;
}

export function compose(recipe: Recipe, picks: Record<string, VocabOption>, text: string): string {
  return recipe.template
    .replace(/\{(\w+)\}/g, (_, key: string) => (key === "text" ? text : picks[key]?.text ?? ""))
    .replace(/，(?=[，。：])/g, "")
    .replace(/^[，：]+/, "")
    .replace(/：，/g, "：");
}

/* ------------------------------ 本地挑选措辞 ------------------------------ */

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** 可复现的伪随机数（mulberry32），同样的输入 + variant 得到同样的结果 */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 提示词里出现左边的字，就偏好包含右边字眼的措辞，让本地模式也有点「读懂上下文」的感觉
const CUES: Array<[string, string[]]> = [
  ["雨", ["雨", "湿"]],
  ["夜", ["灯", "霓虹", "光"]],
  ["雪", ["雪", "冷"]],
  ["雾", ["雾"]],
  ["风", ["风"]],
  ["海", ["咸", "风"]],
  ["城", ["招牌", "电车", "城市"]],
  ["街", ["招牌", "电车", "售货机"]],
  ["光", ["光"]],
  ["赛博", ["全息", "霓虹"]],
  ["未来", ["全息", "未来"]],
  ["科幻", ["全息", "未来"]],
  ["古", ["青石板"]],
  ["复古", ["复古", "旧"]],
];

export function pickLocally(recipe: Recipe, prompt: string, text: string, params: Params, variant: number): Record<string, VocabOption> {
  const rand = seededRandom(hash(`${text}|${variant}`));
  const picks = lockedPicks(recipe, params);
  const cueWords = CUES.filter(([c]) => prompt.includes(c)).flatMap(([, words]) => words);
  for (const group of recipe.groups) {
    if (picks[group.key]) continue;
    let best = group.options[0];
    let bestScore = -1;
    for (const option of group.options) {
      const affinity = cueWords.some((w) => option.text.includes(w)) ? 0.8 : 0;
      const score = rand() * (option.weight ?? 1) + affinity;
      if (score > bestScore) {
        bestScore = score;
        best = option;
      }
    }
    picks[group.key] = best;
  }
  return picks;
}
