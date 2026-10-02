// Jev（TypeSafe AI 的 System One 模型）适配层 —— 只能在服务端引用，API key 不能进前端 bundle。
//
// 接口形状来自 docs.typesafe.ai：
//   POST https://api.typesafe.ai/v1/systemone
//   Authorization: Bearer <JEV_API_KEY>
//   { state, model, questions: { [id]: { type: "choice", instructions, criteria: { [option]: description } }
//                                     | { type: "noul", instructions } } }
//   → { model, answers: { [id]: { type: "choice", choice, confidence, probabilities }
//                               | { type: "noul", noul } }, usage }
//
// Jev 只做判断、不生成文本，也不会返回原文里的位置，所以分工是：
//   本地（词典 + 分词）负责「找词」→ Jev 负责「这是什么、是哪一种、该给什么交互」。

import { compose, lockedPicks, recipeFor, seededRandom } from "./describe";
import { findCandidates, matchLexicon, suggestSettings, type LexMatch, type Span } from "./extract";
import { CATEGORIES, CATEGORY_KEYS, SWATCHES } from "./taxonomy";
import type {
  AnalyzeResponse,
  Category,
  DescribeRequest,
  Engine,
  DescribeResponse,
  DetectedEntity,
  Params,
  SettingSuggestion,
  VideoSettings,
} from "./types";

const DEFAULT_URL = "https://api.typesafe.ai/v1/systemone";
const DEFAULT_MODEL = "jev-latest";
/** 一次最多判断多少个不同的词 */
const MAX_PHRASES = 32;

type JevQuestion =
  | { type: "choice"; instructions: string; criteria: Record<string, string> }
  | { type: "noul"; instructions: string };

interface JevResult {
  model?: string;
  answers: Record<string, unknown>;
  latencyMs: number;
}

export class JevError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "JevError";
  }
}

export function jevConfig() {
  const key = process.env.JEV_API_KEY;
  if (!key) return null;
  return {
    key,
    url: process.env.JEV_API_URL || DEFAULT_URL,
    model: process.env.JEV_MODEL || DEFAULT_MODEL,
  };
}

async function askJev(state: unknown, questions: Record<string, JevQuestion>, timeoutMs = 4000): Promise<JevResult> {
  const config = jevConfig();
  if (!config) throw new JevError("未配置 JEV_API_KEY");

  const t0 = performance.now();
  let res: Response;
  try {
    res = await fetch(config.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ state, model: config.model, questions }),
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
  } catch (err) {
    const timedOut = err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
    throw new JevError(timedOut ? "Jev 响应超时" : "连不上 Jev");
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error(`[video-gen] Jev ${res.status}: ${detail.slice(0, 500)}`);
    const reason: Record<number, string> = { 401: "API key 无效", 422: "请求格式不被接受", 429: "触发限流", 529: "Jev 过载" };
    throw new JevError(`Jev ${res.status}${reason[res.status] ? ` · ${reason[res.status]}` : ""}`, res.status);
  }

  const data = (await res.json().catch(() => null)) as { model?: string; answers?: Record<string, unknown> } | null;
  if (!data || !data.answers || typeof data.answers !== "object") throw new JevError("Jev 返回格式无法解析");
  return { model: data.model, answers: data.answers, latencyMs: Math.round(performance.now() - t0) };
}

interface ChoiceReading {
  choice: string;
  p: number;
  probs: Record<string, number>;
}

function readChoice(answer: unknown): ChoiceReading | null {
  if (!answer || typeof answer !== "object") return null;
  const a = answer as { choice?: unknown; confidence?: unknown; probabilities?: unknown };
  if (typeof a.choice !== "string") return null;
  const probs = a.probabilities && typeof a.probabilities === "object" ? (a.probabilities as Record<string, number>) : {};
  const p = typeof probs[a.choice] === "number" ? probs[a.choice] : typeof a.confidence === "number" ? a.confidence : 0;
  return { choice: a.choice, p, probs };
}

function readNoul(answer: unknown): number | null {
  const a = answer as { noul?: unknown } | null;
  return a && typeof a.noul === "number" ? a.noul : null;
}

function sample(probs: Record<string, number>, rand: () => number): string | undefined {
  const entries = Object.entries(probs).filter(([, p]) => p > 0);
  const total = entries.reduce((sum, [, p]) => sum + p, 0);
  let r = rand() * total;
  for (const [key, p] of entries) {
    r -= p;
    if (r <= 0) return key;
  }
  return entries.at(-1)?.[0];
}

/* --------------------------------- 问题模板 -------------------------------- */

const CATEGORY_CRITERIA: Record<string, string> = {
  ...Object.fromEntries(CATEGORY_KEYS.map((k) => [k, CATEGORIES[k].hint])),
  none: "not a visual element worth customizing: a function word, filler, vague verb phrase or a fragment of a word",
};

const isCategory = (value: string): value is Category => (CATEGORY_KEYS as string[]).includes(value);

const categoryQuestion = (phrase: string): JevQuestion => ({
  type: "choice",
  instructions: `In this text-to-video prompt, what kind of visual element is the phrase "${phrase}"?`,
  criteria: CATEGORY_CRITERIA,
});

const subtypeQuestion = (phrase: string, category: Category): JevQuestion => ({
  type: "choice",
  instructions: `In this video prompt, "${phrase}" is a ${CATEGORIES[category].en.toLowerCase()} element. Which kind is it?`,
  criteria: Object.fromEntries((CATEGORIES[category].subtypes ?? []).map((s) => [s.key, s.hint])),
});

const hueQuestion = (phrase: string): JevQuestion => ({
  type: "choice",
  instructions: `Which named color is closest to "${phrase}"?`,
  criteria: Object.fromEntries(SWATCHES.map((s, i) => [`c${i}`, `${s.name} (${s.en})`])),
});

const ASPECTS: Record<string, { value: VideoSettings["aspect"]; hint: string }> = {
  landscape: { value: "16:9", hint: "16:9 horizontal video, the default for most scenes" },
  vertical: { value: "9:16", hint: "9:16 vertical video for phones, short-video platforms or tall subjects" },
  square: { value: "1:1", hint: "1:1 square video" },
  widescreen: { value: "21:9", hint: "21:9 ultra-wide cinematic framing" },
  classic: { value: "4:3", hint: "4:3 retro TV framing" },
};

/* ---------------------------------- 识别 ---------------------------------- */

interface Phrase {
  index: number;
  text: string;
  lex?: LexMatch;
}

interface Verdict {
  category: Category;
  confidence: number;
  /** Jev 同意或改判 → jev；Jev 没把握地反对 → 以词典为准，如实标 local */
  judgedBy: Engine;
  subtype?: string;
  subtypeConfidence?: number;
  params?: Params;
}

export async function analyzeWithJev(text: string): Promise<AnalyzeResponse> {
  const { matches, claimed } = matchLexicon(text);
  const candidates = findCandidates(text, claimed);

  // 同一个词只问一次
  const phrases: Phrase[] = [];
  const seen = new Set<string>();
  const addPhrase = (t: string, lex?: LexMatch) => {
    if (seen.has(t) || phrases.length >= MAX_PHRASES) return;
    seen.add(t);
    phrases.push({ index: phrases.length, text: t, lex });
  };
  matches.forEach((m) => addPhrase(m.text, m));
  candidates.forEach((c) => addPhrase(c.text));

  const state = {
    prompt: text,
    task: "Understand a text-to-video prompt so an editor can underline its visual elements and show matching controls for each.",
  };

  // 第一轮：每个词的类型 + 已知类型的子类型 + 画幅 / 慢动作
  const round1: Record<string, JevQuestion> = {
    aspect: {
      type: "choice",
      instructions: "Which aspect ratio best fits the video this prompt describes?",
      criteria: Object.fromEntries(Object.entries(ASPECTS).map(([k, v]) => [k, v.hint])),
    },
    slowmo: { type: "noul", instructions: "Does this prompt ask for slow motion or a high frame rate?" },
  };
  for (const p of phrases) {
    round1[`cat_${p.index}`] = categoryQuestion(p.text);
    if (p.lex && CATEGORIES[p.lex.category].subtypes) round1[`sub_${p.index}`] = subtypeQuestion(p.text, p.lex.category);
  }
  const r1 = await askJev(state, round1);
  let latencyMs = r1.latencyMs;

  const verdicts = new Map<string, Verdict>();
  const round2: Record<string, JevQuestion> = {};

  for (const p of phrases) {
    const cat = readChoice(r1.answers[`cat_${p.index}`]);
    let verdict: Verdict | null = null;

    if (p.lex) {
      // 词典命中的词：Jev 很有把握地给出别的类型才改判；非常确定「不是元素」才丢弃
      const lexCat = p.lex.category;
      if (cat?.choice === "none" && cat.p >= 0.9) verdict = null;
      else if (cat && isCategory(cat.choice) && cat.choice !== lexCat && cat.p >= 0.75)
        verdict = { category: cat.choice, confidence: cat.p, judgedBy: "jev" };
      else if (cat?.choice === lexCat) verdict = { category: lexCat, confidence: cat.p, judgedBy: "jev", params: p.lex.params };
      else verdict = { category: lexCat, confidence: 1, judgedBy: "local", params: p.lex.params };
    } else if (cat && isCategory(cat.choice) && cat.p >= 0.6) {
      // 词典外的词：Jev 说是元素才留下
      verdict = { category: cat.choice, confidence: cat.p, judgedBy: "jev" };
    }
    if (!verdict) continue;

    const subtypes = CATEGORIES[verdict.category].subtypes;
    if (subtypes) {
      const lexSub = p.lex?.category === verdict.category ? p.lex.subtype : undefined;
      const sub = lexSub !== undefined ? readChoice(r1.answers[`sub_${p.index}`]) : null;
      const valid = sub !== null && subtypes.some((s) => s.key === sub.choice);
      if (valid && (sub.choice === lexSub || sub.p >= 0.6)) {
        verdict.subtype = sub.choice;
        verdict.subtypeConfidence = sub.p;
        // 子类型被改判：词典给的参数属于原来的子类型，不再适用
        if (sub.choice !== lexSub) verdict.params = undefined;
      } else if (lexSub) {
        verdict.subtype = lexSub;
      } else {
        round2[`sub_${p.index}`] = subtypeQuestion(p.text, verdict.category);
      }
    }
    if (verdict.category === "color" && typeof verdict.params?.hex !== "string") round2[`hue_${p.index}`] = hueQuestion(p.text);
    verdicts.set(p.text, verdict);
  }

  // 第二轮（可选）：新发现的词的子类型、词典外颜色最接近的色板
  if (Object.keys(round2).length > 0) {
    try {
      const r2 = await askJev(state, round2, 2500);
      latencyMs += r2.latencyMs;
      for (const p of phrases) {
        const v = verdicts.get(p.text);
        if (!v) continue;
        const sub = readChoice(r2.answers[`sub_${p.index}`]);
        if (sub && CATEGORIES[v.category].subtypes?.some((s) => s.key === sub.choice)) {
          v.subtype = sub.choice;
          v.subtypeConfidence = sub.p;
        }
        const hue = readChoice(r2.answers[`hue_${p.index}`]);
        const swatch = hue ? SWATCHES[Number(hue.choice.slice(1))] : undefined;
        if (swatch) v.params = { ...v.params, hex: swatch.hex };
      }
    } catch (err) {
      // 第二轮失败不影响第一轮的结果，子类型会退回默认
      console.error("[video-gen] Jev round 2 failed:", err);
    }
  }

  const toEntity = (span: Span, v: Verdict, source: DetectedEntity["source"]): DetectedEntity => ({
    text: span.text,
    start: span.start,
    end: span.end,
    category: v.category,
    confidence: v.confidence,
    subtype: v.subtype,
    subtypeConfidence: v.subtypeConfidence,
    params: v.params,
    source,
    judgedBy: v.judgedBy,
  });

  const entities: DetectedEntity[] = [];
  for (const m of matches) {
    const v = verdicts.get(m.text);
    if (v) entities.push(toEntity(m, v, "lexicon"));
  }
  for (const c of candidates) {
    const v = verdicts.get(c.text);
    if (v) entities.push(toEntity(c, v, "model"));
  }
  entities.sort((a, b) => a.start - b.start);

  // 常驻设置：用户明确写出的优先，其次才是 Jev 的判断
  const suggestions: SettingSuggestion[] = suggestSettings(text);
  const aspect = readChoice(r1.answers.aspect);
  if (!suggestions.some((s) => s.key === "aspect") && aspect && aspect.choice !== "landscape" && aspect.p >= 0.7 && ASPECTS[aspect.choice]) {
    suggestions.push({ key: "aspect", value: ASPECTS[aspect.choice].value, reason: `Jev 判断更适合 ${ASPECTS[aspect.choice].value}`, confidence: aspect.p });
  }
  const slowmo = readNoul(r1.answers.slowmo);
  if (!suggestions.some((s) => s.key === "fps") && slowmo !== null && slowmo >= 0.75) {
    suggestions.push({ key: "fps", value: 60, reason: "Jev 判断需要慢动作", confidence: slowmo });
  }

  return { engine: "jev", model: r1.model, latencyMs, entities, suggestions };
}

/* ------------------------------- AI 帮我写 -------------------------------- */

export async function describeWithJev(req: DescribeRequest): Promise<DescribeResponse> {
  const { text, category, subtype, params } = req.entity;
  const recipe = recipeFor(category, subtype);
  const picks = lockedPicks(recipe, params);
  const open = recipe.groups.filter((group) => !picks[group.key]);

  let latencyMs = 0;
  if (open.length > 0) {
    const questions: Record<string, JevQuestion> = {};
    for (const group of open) {
      questions[`g_${group.key}`] = {
        type: "choice",
        instructions: `For "${text}" in this video prompt, which wording best describes ${group.question}?`,
        criteria: Object.fromEntries(group.options.map((o, i) => [`o${i}`, o.text || `${o.when ?? ""}（不额外修饰）`])),
      };
    }
    const chosen = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== null && v !== ""));
    const state = { prompt: req.prompt, element: text, element_type: CATEGORIES[category].en, chosen_settings: chosen };
    const result = await askJev(state, questions);
    latencyMs = result.latencyMs;

    // 第一次取概率最高的措辞；「换一版」按 Jev 给出的概率分布采样
    const rand = seededRandom(req.variant * 7919 + 17);
    for (const group of open) {
      const answer = readChoice(result.answers[`g_${group.key}`]);
      const key = answer && req.variant > 0 ? (sample(answer.probs, rand) ?? answer.choice) : answer?.choice;
      const option = key ? group.options[Number(key.slice(1))] : undefined;
      picks[group.key] = option ?? group.options[0];
    }
  }

  return { engine: "jev", text: compose(recipe, picks, text), latencyMs };
}
