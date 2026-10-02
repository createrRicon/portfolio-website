// 「找词」：词典匹配（最长优先、互不重叠）+ 分词候选（交给 Jev 判断词典外的词）

import { LEXICON, SETTING_HINTS, type LexEntry } from "./lexicon";
import type { Category, Params, SettingKey, SettingSuggestion, VideoSettings } from "./types";

export interface Span {
  text: string;
  start: number;
  end: number;
}

export interface LexMatch extends Span {
  category: Category;
  subtype?: string;
  params?: Params;
}

const CJK = /[㐀-鿿豈-﫿]/;
const ASCII_ONLY = /^[\x20-\x7e]+$/;

/** 只转换 ASCII 大写，保证下标和原文一一对应 */
function asciiLower(s: string): string {
  return s.replace(/[A-Z]/g, (c) => c.toLowerCase());
}

function isAlnum(ch: string | undefined): boolean {
  return ch !== undefined && /[a-z0-9]/i.test(ch);
}

interface CompiledEntry {
  entry: LexEntry;
  term: string;
  /** 纯 ASCII 的词需要检查单词边界（避免 woman 里匹配出 man） */
  bounded: boolean;
}

const COMPILED: CompiledEntry[] = [...LEXICON]
  .sort((a, b) => b.term.length - a.term.length)
  .map((entry) => ({ entry, term: asciiLower(entry.term), bounded: ASCII_ONLY.test(entry.term) }));

function rangeFree(claimed: Uint8Array, start: number, end: number): boolean {
  for (let i = start; i < end; i++) if (claimed[i]) return false;
  return true;
}

/** 在 lower 中查找 term 的所有出现位置（纯 ASCII 词带单词边界） */
function* occurrences(lower: string, term: string, bounded: boolean): Generator<number> {
  let from = 0;
  while (from <= lower.length - term.length) {
    const i = lower.indexOf(term, from);
    if (i < 0) return;
    from = i + 1;
    if (bounded && (isAlnum(lower[i - 1]) || isAlnum(lower[i + term.length]))) continue;
    yield i;
  }
}

/* ------------------------------ 颜色深浅前缀 ------------------------------ */

const DARKER = "深暗浓";
const LIGHTER = "浅淡嫩亮";

function mixHex(hex: string, target: number, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => Math.round(c + (target - c) * amount));
  return `#${ch.map((c) => c.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

export function shadeForPrefix(hex: string, prefix: string): string {
  if (DARKER.includes(prefix)) return mixHex(hex, 0, 0.35);
  if (LIGHTER.includes(prefix)) return mixHex(hex, 255, 0.4);
  return hex;
}

/* -------------------------------- 词典匹配 -------------------------------- */

export function matchLexicon(text: string): { matches: LexMatch[]; claimed: Uint8Array } {
  const lower = asciiLower(text);
  const claimed = new Uint8Array(text.length);
  const matches: LexMatch[] = [];

  for (const { entry, term, bounded } of COMPILED) {
    if (term.length > lower.length) continue;
    for (const i of occurrences(lower, term, bounded)) {
      const end = i + term.length;
      if (!rangeFree(claimed, i, end)) continue;
      claimed.fill(1, i, end);
      if (!entry.category) continue; // 占位词
      matches.push({ text: text.slice(i, end), start: i, end, category: entry.category, subtype: entry.subtype, params: entry.params });
    }
  }

  // 「深红色」「浅蓝色」：把深浅前缀并进颜色词，并相应调整色值
  for (const m of matches) {
    if (m.category !== "color" || m.start === 0) continue;
    const prefix = text[m.start - 1];
    if (!(DARKER + LIGHTER).includes(prefix) || claimed[m.start - 1]) continue;
    claimed[m.start - 1] = 1;
    m.start -= 1;
    m.text = text.slice(m.start, m.end);
    const hex = m.params?.hex;
    if (typeof hex === "string") m.params = { ...m.params, hex: shadeForPrefix(hex, prefix) };
  }

  matches.sort((a, b) => a.start - b.start);
  return { matches, claimed };
}

/* ------------------------------ 分词候选（Jev） ------------------------------ */

const STOPWORDS = new Set(
  (
    "一个 一位 一只 一群 一些 一种 一下 一点 一起 这个 那个 这里 那里 我们 你们 他们 她们 它们 自己 可以 需要 想要 希望 " +
    "要求 画面 视频 镜头 风格 感觉 效果 氛围 质感 时候 然后 最后 开始 整个 非常 特别 有点 慢慢 缓缓 缓慢 逐渐 突然 " +
    "正在 已经 站在 坐在 走在 位于 出现 看到 看见 显得 带着 穿着 拿着 没有 还有 以及 或者 但是 因为 所以 如果 就是 " +
    "之间 周围 旁边 前面 后面 上面 下面 中间 里面 远处 近处 整体 主要 其中 一样 那种 这种 很多 许多 各种 所有 " +
    "the and with a an of in on at to is are for from by into its their his her very slowly while as that this " +
    "some then there where when who which video shot style scene"
  ).split(/\s+/),
);

const STOP_CHARS = new Set("的了着过在和与及或是有个只位把被让向从到对于为以也都很更最又再就还而且一这那些里上下中前后左右内外边地得我你您他她它");

/** 「一艘」「这只」这类数量词 */
const MEASURE = /^[一两几这那每某][个只位艘辆架棵朵片群条张把台座间对双件层道束]$/;

/** 「竖屏」「慢动作」这类词归常驻设置管，不需要再问 Jev */
const SETTING_TERMS = new Set(SETTING_HINTS.flatMap((h) => h.terms.map(asciiLower)));

/**
 * 词典没覆盖到的候选词。ICU 分词对生词会切成单字（风/衣、柯/基），
 * 所以把连续的单字合并成一个候选。返回所有出现位置（未去重）。
 */
export function findCandidates(text: string, claimed: Uint8Array): Span[] {
  if (typeof Intl === "undefined" || typeof Intl.Segmenter !== "function") return [];
  const segmenter = new Intl.Segmenter("zh-CN", { granularity: "word" });
  const out: Span[] = [];
  let run: { start: number; end: number } | null = null;

  const push = (start: number, end: number) => {
    const t = text.slice(start, end);
    const key = asciiLower(t);
    if (!STOPWORDS.has(key) && !SETTING_TERMS.has(key) && !MEASURE.test(t)) out.push({ text: t, start, end });
  };
  const flush = () => {
    if (run && run.end - run.start >= 2 && run.end - run.start <= 4) push(run.start, run.end);
    run = null;
  };

  for (const s of segmenter.segment(text)) {
    const start = s.index;
    const end = start + s.segment.length;
    if (!s.isWordLike || !rangeFree(claimed, start, end)) {
      flush();
      continue;
    }
    const word = s.segment;
    if (CJK.test(word)) {
      if (word.length === 1) {
        if (STOP_CHARS.has(word)) flush();
        else run = run ? { start: run.start, end } : { start, end };
        continue;
      }
      flush();
      if (word.length <= 6) push(start, end);
    } else {
      flush();
      if (/^[a-z][a-z'-]{2,}$/i.test(word)) push(start, end);
    }
  }
  flush();
  return out;
}

/* ------------------------------ 常驻设置的线索 ------------------------------ */

const ASPECTS: VideoSettings["aspect"][] = ["16:9", "9:16", "1:1", "4:3", "21:9"];

export function suggestSettings(text: string): SettingSuggestion[] {
  const lower = asciiLower(text);
  const found = new Map<SettingKey, SettingSuggestion>();
  const put = (s: SettingSuggestion) => {
    if (!found.has(s.key)) found.set(s.key, s);
  };

  // 明确写出的数值优先
  const ratio = text.match(/(\d{1,2})\s*[:：]\s*(\d{1,2})/);
  if (ratio) {
    const value = `${ratio[1]}:${ratio[2]}` as VideoSettings["aspect"];
    if (ASPECTS.includes(value)) put({ key: "aspect", value, reason: `写明了 ${value}`, confidence: 1 });
  }
  const seconds = text.match(/(\d{1,2})\s*(?:秒|s(?![a-z])|sec)/i);
  if (seconds) {
    const value = Math.min(20, Math.max(2, Number(seconds[1])));
    put({ key: "duration", value, reason: `写明了 ${seconds[0].trim()}`, confidence: 1 });
  }
  const fps = text.match(/(24|30|60)\s*(?:帧|fps)/i);
  if (fps) put({ key: "fps", value: Number(fps[1]) as VideoSettings["fps"], reason: `写明了 ${fps[0]}`, confidence: 1 });

  for (const h of SETTING_HINTS) {
    if (found.has(h.key)) continue;
    for (const term of h.terms) {
      const t = asciiLower(term);
      const i = occurrences(lower, t, ASCII_ONLY.test(term)).next().value;
      if (typeof i === "number") {
        put({ key: h.key, value: h.value, reason: `提到「${text.slice(i, i + t.length)}」`, confidence: 0.95 });
        break;
      }
    }
  }
  return [...found.values()];
}
