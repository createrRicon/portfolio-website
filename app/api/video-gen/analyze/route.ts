import { NextResponse } from "next/server";
import { analyzeWithJev, jevConfig } from "@/lib/video-gen/jev";
import { analyzeLocally } from "@/lib/video-gen/local-engine";

const MAX_LENGTH = 800;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { text?: unknown } | null;
  const text = typeof body?.text === "string" ? body.text.slice(0, MAX_LENGTH) : "";
  if (!text.trim()) return NextResponse.json(analyzeLocally(""));

  if (!jevConfig()) return NextResponse.json(analyzeLocally(text, "未配置 JEV_API_KEY"));

  try {
    return NextResponse.json(await analyzeWithJev(text));
  } catch (err) {
    console.error("[video-gen] analyze fell back to local:", err);
    return NextResponse.json(analyzeLocally(text, err instanceof Error ? err.message : "Jev 调用失败"));
  }
}
