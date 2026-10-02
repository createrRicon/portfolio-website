// 本地引擎：只靠词典和模板。没配 Jev、Jev 出错、或者 API route 不可用时都会退回这里。
// 纯函数，前后端都能跑。

import { compose, pickLocally, recipeFor } from "./describe";
import { matchLexicon, suggestSettings } from "./extract";
import type { AnalyzeResponse, DescribeRequest, DescribeResponse } from "./types";

const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

export function analyzeLocally(text: string, fallbackReason?: string): AnalyzeResponse {
  const t0 = now();
  const { matches } = matchLexicon(text);
  return {
    engine: "local",
    latencyMs: Math.round(now() - t0),
    entities: matches.map((m) => ({
      text: m.text,
      start: m.start,
      end: m.end,
      category: m.category,
      confidence: 1,
      subtype: m.subtype,
      subtypeConfidence: m.subtype ? 1 : undefined,
      params: m.params,
      source: "lexicon",
      judgedBy: "local",
    })),
    suggestions: suggestSettings(text),
    fallbackReason,
  };
}

export function describeLocally(req: DescribeRequest, fallbackReason?: string): DescribeResponse {
  const t0 = now();
  const { text, category, subtype, params } = req.entity;
  const recipe = recipeFor(category, subtype);
  const picks = pickLocally(recipe, req.prompt, text, params, req.variant);
  return { engine: "local", text: compose(recipe, picks, text), latencyMs: Math.round(now() - t0), fallbackReason };
}
