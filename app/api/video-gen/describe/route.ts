import { NextResponse } from "next/server";
import { describeWithJev, jevConfig } from "@/lib/video-gen/jev";
import { describeLocally } from "@/lib/video-gen/local-engine";
import { CATEGORY_KEYS } from "@/lib/video-gen/taxonomy";
import type { Category, DescribeRequest, Params } from "@/lib/video-gen/types";

function parse(body: unknown): DescribeRequest | null {
  if (!body || typeof body !== "object") return null;
  const b = body as { prompt?: unknown; entity?: Record<string, unknown>; variant?: unknown };
  const e = b.entity;
  if (!e || typeof e.text !== "string" || !CATEGORY_KEYS.includes(e.category as Category)) return null;
  const params: Params = {};
  if (e.params && typeof e.params === "object") {
    for (const [k, v] of Object.entries(e.params as Record<string, unknown>)) {
      if (typeof v === "string" || typeof v === "number" || v === null) params[k] = v;
    }
  }
  return {
    prompt: typeof b.prompt === "string" ? b.prompt.slice(0, 800) : "",
    entity: {
      text: e.text.slice(0, 40),
      category: e.category as Category,
      subtype: typeof e.subtype === "string" ? e.subtype : undefined,
      params,
    },
    variant: typeof b.variant === "number" && Number.isFinite(b.variant) ? Math.max(0, Math.floor(b.variant)) : 0,
  };
}

export async function POST(request: Request) {
  const req = parse(await request.json().catch(() => null));
  if (!req) return NextResponse.json({ error: "invalid request" }, { status: 400 });

  if (!jevConfig()) return NextResponse.json(describeLocally(req, "未配置 JEV_API_KEY"));

  try {
    return NextResponse.json(await describeWithJev(req));
  } catch (err) {
    console.error("[video-gen] describe fell back to local:", err);
    return NextResponse.json(describeLocally(req, err instanceof Error ? err.message : "Jev 调用失败"));
  }
}
