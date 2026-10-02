// 前端实体状态的两个核心操作：
// 1. 用户打字时，把已有实体的位置「映射」过这次编辑（下划线跟着文字走，不用等重新识别）
// 2. 识别结果回来时，和已有实体合并 —— 用户在弹窗里做过的设置不能因为重新识别而丢失

import { defaultParams } from "./taxonomy";
import type { DetectedEntity, Entity, Params, RefImage } from "./types";

export interface EditRange {
  /** 编辑起点（两版文本相同前缀的长度） */
  start: number;
  /** 旧文本中被替换部分的终点 */
  oldEnd: number;
  /** 新文本中替换内容的终点 */
  newEnd: number;
}

export function diffRange(prev: string, next: string): EditRange {
  let start = 0;
  const min = Math.min(prev.length, next.length);
  while (start < min && prev.charCodeAt(start) === next.charCodeAt(start)) start++;
  let oldEnd = prev.length;
  let newEnd = next.length;
  while (oldEnd > start && newEnd > start && prev.charCodeAt(oldEnd - 1) === next.charCodeAt(newEnd - 1)) {
    oldEnd--;
    newEnd--;
  }
  return { start, oldEnd, newEnd };
}

/** 编辑在实体之前 → 平移；在实体之后 → 不动；落在实体内部 → 标记为待重新识别 */
export function mapThroughEdit(entities: Entity[], prev: string, next: string): Entity[] {
  if (prev === next) return entities;
  const edit = diffRange(prev, next);
  const delta = edit.newEnd - edit.oldEnd;
  return entities.map((e) => {
    if (e.start < 0) return e;
    const end = e.start + e.text.length;
    if (end <= edit.start) return e;
    if (e.start >= edit.oldEnd) return { ...e, start: e.start + delta };
    return { ...e, start: -1, ghost: edit.start };
  });
}

/** 实体在当前文本里是否还完好 */
export function isIntact(e: Entity, text: string): boolean {
  return e.start >= 0 && text.slice(e.start, e.start + e.text.length) === e.text;
}

export interface UserData {
  params: Params;
  description: string;
  references: RefImage[];
  touched: boolean;
  subtype?: string;
  subtypeLocked?: boolean;
}

export const stashKey = (e: { category: string; text: string }) => `${e.category}:${e.text}`;

export function hasUserData(e: Entity): boolean {
  return e.touched || e.description.trim() !== "" || e.references.length > 0;
}

let seq = 0;
const newId = () => `e${Date.now().toString(36)}${(seq++).toString(36)}`;

function create(d: DetectedEntity, restored?: UserData): Entity {
  return {
    id: newId(),
    text: d.text,
    start: d.start,
    category: d.category,
    confidence: d.confidence,
    subtype: restored?.subtypeLocked ? restored.subtype : d.subtype,
    subtypeConfidence: d.subtypeConfidence,
    aiSubtype: d.subtype,
    subtypeLocked: restored?.subtypeLocked,
    source: d.source,
    judgedBy: d.judgedBy,
    params: restored ? restored.params : defaultParams(d.category, d.subtype, d.params),
    description: restored?.description ?? "",
    references: restored?.references ?? [],
    touched: restored?.touched ?? false,
    bornAt: Date.now(),
  };
}

/** 已有实体吸收新的识别结果 */
function refresh(e: Entity, d: DetectedEntity): Entity {
  const renamed = e.text !== d.text;
  // 用户细化过的实体保留自己的类型；没动过的跟着最新判断走
  const category = e.touched ? e.category : d.category;
  const recategorized = category !== e.category;
  const subtype = e.subtypeLocked ? e.subtype : category === d.category ? d.subtype : e.subtype;

  let params = e.params;
  if (recategorized || (!e.touched && subtype !== e.subtype)) {
    params = defaultParams(category, subtype, d.params);
  } else if (renamed && (category === "color" || category === "style")) {
    // 颜色 / 风格是「文字即取值」：用户直接改了字，取值跟着字走
    const valueKey = category === "color" ? "hex" : "preset";
    params = { ...e.params, [valueKey]: d.params?.[valueKey] ?? null };
  }

  return {
    ...e,
    text: d.text,
    start: d.start,
    ghost: undefined,
    category,
    confidence: category === d.category ? d.confidence : e.confidence,
    subtype,
    subtypeConfidence: category === d.category ? d.subtypeConfidence : e.subtypeConfidence,
    aiSubtype: category === d.category ? d.subtype : e.aiSubtype,
    source: d.source,
    judgedBy: d.judgedBy,
    params,
  };
}

function overlaps(a: { start: number; text: string }, b: { start: number; text: string }): boolean {
  return a.start < b.start + b.text.length && b.start < a.start + a.text.length;
}

/**
 * 合并一次识别结果（detected 一定对应当前文本 text）。
 * stash 保存被移除实体的用户设置，用户撤销编辑后能找回来。
 */
export function mergeDetected(
  prev: Entity[],
  detected: DetectedEntity[],
  text: string,
  ignored: ReadonlySet<string>,
  stash: Map<string, UserData>,
): Entity[] {
  const used = new Set<string>();
  const next: Entity[] = [];

  for (const d of detected) {
    if (ignored.has(d.text)) continue;
    // 1. 同一位置、同一个词
    let match = prev.find((e) => !used.has(e.id) && e.start === d.start && e.text === d.text);
    // 2. 用户把词改了（女孩 → 女人）：同类型、位置相近的待识别实体
    match ??= prev.find(
      (e) => !used.has(e.id) && e.start < 0 && e.category === d.category && e.ghost !== undefined && Math.abs(e.ghost - d.start) <= 4,
    );
    if (match) {
      used.add(match.id);
      next.push(refresh(match, d));
    } else {
      next.push(create(d, stash.get(stashKey(d))));
    }
  }

  for (const e of prev) {
    if (used.has(e.id)) continue;
    // 用户细化过、文字也还在的实体，即使这次没被识别出来也保留
    if (hasUserData(e) && isIntact(e, text) && !next.some((n) => overlaps(n, e))) {
      next.push(e);
      continue;
    }
    if (hasUserData(e)) {
      stash.set(stashKey(e), {
        params: e.params,
        description: e.description,
        references: e.references,
        touched: e.touched,
        subtype: e.subtype,
        subtypeLocked: e.subtypeLocked,
      });
    }
  }

  return next.sort((a, b) => a.start - b.start);
}
