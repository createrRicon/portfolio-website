"use client";

// 视频生成入口 mockup 的总装：
//   一片黑 + 光标 → 开始输入 → 系统边读边识别元素（下划线）→ 点词弹窗细化 → 常驻参数 → 生成结构化请求

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { analyzeLocally } from "@/lib/video-gen/local-engine";
import { hasUserData, isIntact, mapThroughEdit, mergeDetected, stashKey, type UserData } from "@/lib/video-gen/positions";
import { defaultParams } from "@/lib/video-gen/taxonomy";
import type { AnalyzeResponse, Engine, Entity, ParamValue, Params, RefImage, SettingKey, SettingSuggestion, VideoSettings } from "@/lib/video-gen/types";
import ElementTray from "./ElementTray";
import EntityPopover from "./EntityPopover";
import PayloadPanel from "./PayloadPanel";
import PromptField, { type PromptFieldHandle, type Selection } from "./PromptField";
import SettingsBar, { type SettingMeta } from "./SettingsBar";
import styles from "./video-gen.module.css";

const EXAMPLES = [
  "一个穿红色风衣的女孩站在雨夜的东京街头，赛博朋克风格，镜头缓慢推进",
  "一只柯基在琥珀色的夕阳下追逐纸飞机，胶片质感，慢镜头",
  "航拍深蓝色的大海，一艘帆船在暴风雨中穿行，史诗感",
  "老人坐在咖啡馆窗边看书，午后的阳光从侧面照进来，王家卫风格，浅景深",
  "宇航员漂浮在空间站里，窗外是绚烂的星云，皮克斯风格，镜头环绕",
];

const DEFAULT_SETTINGS: VideoSettings = { aspect: "16:9", resolution: "1080p", fps: 24, duration: 5 };
const DEFAULT_GLOW = ["#2f4fd8", "#5b2a86", "#12707a"];

/** 停顿多久开始识别；持续输入时最多等多久也要识别一次（边打边出下划线） */
const DEBOUNCE_MS = 450;
const MAX_WAIT_MS = 1000;
/** 「理解中」状态至少显示这么久，避免闪烁 */
const MIN_PENDING_MS = 280;

interface AnalysisState {
  status: "idle" | "pending" | "done";
  engine?: Engine;
  model?: string;
  latencyMs?: number;
  fallbackReason?: string;
}

interface VideoState {
  settings: VideoSettings;
  meta: SettingMeta;
}

/** 把提示词里读出来的设置建议应用到常驻参数上；用户手动改过的项不动 */
function applySuggestions(state: VideoState, suggestions: SettingSuggestion[]): VideoState {
  const settings: Record<SettingKey, VideoSettings[SettingKey]> = { ...state.settings };
  const meta: SettingMeta = { ...state.meta };
  let changed = false;
  const suggested = new Set<SettingKey>();

  for (const s of suggestions) {
    suggested.add(s.key);
    if (meta[s.key]?.by === "user") continue;
    if (settings[s.key] !== s.value) {
      settings[s.key] = s.value;
      changed = true;
    }
    if (meta[s.key]?.reason !== s.reason) {
      meta[s.key] = { by: "ai", reason: s.reason };
      changed = true;
    }
  }
  // 提示词里相关的词被删掉了：AI 改过的项恢复默认
  for (const key of Object.keys(meta) as SettingKey[]) {
    if (meta[key]?.by === "ai" && !suggested.has(key)) {
      settings[key] = DEFAULT_SETTINGS[key];
      delete meta[key];
      changed = true;
    }
  }
  return changed ? { settings: settings as VideoSettings, meta } : state;
}

function buildPayload(text: string, entities: Entity[], settings: VideoSettings, analysis: AnalysisState) {
  return {
    prompt: text,
    settings: {
      aspect_ratio: settings.aspect,
      resolution: settings.resolution,
      fps: settings.fps,
      duration_seconds: settings.duration,
    },
    elements: entities.map((e) => ({
      text: e.text,
      span: [e.start, e.start + e.text.length],
      type: e.category,
      kind: e.subtype ?? null,
      judged_by: e.judgedBy,
      confidence: e.judgedBy === "jev" ? Number(e.confidence.toFixed(2)) : null,
      settings: Object.fromEntries(Object.entries(e.params).filter(([, v]) => v !== null && v !== "")),
      description: e.description || null,
      reference_images: e.references.map((r) => r.name),
      refined_by_user: e.touched,
    })),
    understanding: {
      engine: analysis.engine ?? null,
      model: analysis.model ?? null,
      latency_ms: analysis.latencyMs ?? null,
    },
  };
}

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export default function VideoGenStudio() {
  const [text, setText] = useState("");
  const [entities, setEntities] = useState<Entity[]>([]);
  const [selection, setSelection] = useState<Selection>({ start: 0, end: 0 });
  const [focused, setFocused] = useState(false);
  const [composing, setComposing] = useState(false);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [open, setOpen] = useState<{ id: string; fragment: number } | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisState>({ status: "idle" });
  const [video, setVideo] = useState<VideoState>({ settings: DEFAULT_SETTINGS, meta: {} });
  const [generating, setGenerating] = useState(false);
  const [panel, setPanel] = useState<"inspect" | "generated" | null>(null);
  const [exampleIndex, setExampleIndex] = useState(0);
  const [shortcut, setShortcut] = useState("⌘↵");

  const fieldRef = useRef<PromptFieldHandle>(null);
  // 回调里需要同步读到的最新值
  const textRef = useRef("");
  const entitiesRef = useRef<Entity[]>([]);
  const selectionRef = useRef<Selection>({ start: 0, end: 0 });
  const exampleRef = useRef(0);
  const composingRef = useRef(false);
  const generatingRef = useRef(false);
  // 识别调度
  const timerRef = useRef<number | undefined>(undefined);
  const pendingSinceRef = useRef<number | null>(null);
  const requestRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  // 用户移除的标记、被移除实体的设置（撤销编辑后能找回）
  const ignoredRef = useRef(new Set<string>());
  const stashRef = useRef(new Map<string, UserData>());
  const typingRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    entitiesRef.current = entities;
    selectionRef.current = selection;
    exampleRef.current = exampleIndex;
  });

  useEffect(() => {
    if (!/Mac|iPhone|iPad/i.test(navigator.userAgent)) setShortcut("Ctrl↵");
  }, []);

  /* --------------------------------- 识别 --------------------------------- */

  const runAnalysis = useCallback(async () => {
    pendingSinceRef.current = null;
    if (composingRef.current) return;
    const snapshot = textRef.current;
    const id = ++requestRef.current;
    abortRef.current?.abort();
    if (!snapshot.trim()) return;

    const controller = new AbortController();
    abortRef.current = controller;
    setAnalysis((a) => ({ ...a, status: "pending" }));
    const started = performance.now();

    let res: AnalyzeResponse;
    try {
      const r = await fetch("/api/video-gen/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: snapshot }),
        signal: controller.signal,
      });
      if (!r.ok) throw new Error(String(r.status));
      res = (await r.json()) as AnalyzeResponse;
    } catch {
      if (controller.signal.aborted) return;
      // 接口不可用（比如静态导出）也不影响体验：前端直接跑本地词典
      res = analyzeLocally(snapshot, "分析接口不可用");
    }

    const elapsed = performance.now() - started;
    if (elapsed < MIN_PENDING_MS) await sleep(MIN_PENDING_MS - elapsed);
    // 结果只对发请求时的那版文本有效
    if (id !== requestRef.current || snapshot !== textRef.current) return;

    setEntities((prev) => mergeDetected(prev, res.entities, snapshot, ignoredRef.current, stashRef.current));
    setVideo((v) => applySuggestions(v, res.suggestions));
    setAnalysis({ status: "done", engine: res.engine, model: res.model, latencyMs: res.latencyMs, fallbackReason: res.fallbackReason });
  }, []);

  const scheduleAnalysis = useCallback(() => {
    const now = Date.now();
    pendingSinceRef.current ??= now;
    window.clearTimeout(timerRef.current);
    const wait = Math.max(0, Math.min(DEBOUNCE_MS, MAX_WAIT_MS - (now - pendingSinceRef.current)));
    timerRef.current = window.setTimeout(runAnalysis, wait);
  }, [runAnalysis]);

  const cancelAnalysis = useCallback(() => {
    window.clearTimeout(timerRef.current);
    pendingSinceRef.current = null;
    requestRef.current++;
    abortRef.current?.abort();
  }, []);

  /* -------------------------------- 文本变化 ------------------------------- */

  const applyText = useCallback(
    (next: string) => {
      const prev = textRef.current;
      if (prev === next) return;
      textRef.current = next;
      setText(next);

      if (!next.trim()) {
        // 清空 = 回到一片黑的初始状态；用户的细化先存起来，撤销后还能找回
        for (const e of entitiesRef.current) if (hasUserData(e)) stashRef.current.set(stashKey(e), e);
        cancelAnalysis();
        setEntities([]);
        setOpen(null);
        setHoverId(null);
        setAnalysis({ status: "idle" });
        setVideo((v) => applySuggestions(v, []));
        return;
      }

      setEntities((es) => mapThroughEdit(es, prev, next));
      if (!composingRef.current) scheduleAnalysis();
    },
    [cancelAnalysis, scheduleAnalysis],
  );

  const stopTyping = useCallback(() => {
    if (typingRef.current !== null) {
      window.clearInterval(typingRef.current);
      typingRef.current = null;
    }
  }, []);

  /** Tab：把示例逐字打出来，正好演示「边输入边识别」 */
  const typeExample = useCallback(() => {
    stopTyping();
    const example = EXAMPLES[exampleRef.current];
    let i = 0;
    typingRef.current = window.setInterval(() => {
      i += 1;
      applyText(example.slice(0, i));
      setSelection({ start: i, end: i });
      if (i >= example.length) stopTyping();
    }, 34);
  }, [applyText, stopTyping]);

  /* -------------------------------- 实体操作 ------------------------------- */

  const updateEntity = useCallback((id: string, fn: (e: Entity) => Entity) => {
    setEntities((es) => es.map((e) => (e.id === id ? fn(e) : e)));
  }, []);

  const closePopover = useCallback((refocus: boolean) => {
    setOpen(null);
    if (refocus) fieldRef.current?.focus(selectionRef.current);
  }, []);

  /** 颜色 / 风格这类「可替换的值」：弹窗里改了，原文跟着改 */
  const rewriteEntity = useCallback(
    (id: string, replacement: string, params: Params) => {
      const target = entitiesRef.current.find((e) => e.id === id);
      const prev = textRef.current;
      if (!target || !isIntact(target, prev)) return;
      const end = target.start + target.text.length;
      const next = prev.slice(0, target.start) + replacement + prev.slice(end);
      const delta = replacement.length - target.text.length;
      textRef.current = next;
      setText(next);
      setEntities((es) =>
        mapThroughEdit(es, prev, next).map((e) =>
          e.id === id ? { ...e, text: replacement, start: target.start, ghost: undefined, params: { ...e.params, ...params }, touched: true } : e,
        ),
      );
      const sel = selectionRef.current;
      const shift = (pos: number) => (pos >= end ? pos + delta : pos);
      setSelection({ start: shift(sel.start), end: shift(sel.end) });
      scheduleAnalysis();
    },
    [scheduleAnalysis],
  );

  const removeEntity = useCallback(
    (id: string) => {
      const target = entitiesRef.current.find((e) => e.id === id);
      if (!target) return;
      ignoredRef.current.add(target.text);
      stashRef.current.delete(stashKey(target));
      target.references.forEach((r) => URL.revokeObjectURL(r.url));
      setEntities((es) => es.filter((e) => e.id !== id));
      closePopover(true);
    },
    [closePopover],
  );

  /* --------------------------------- 生成 --------------------------------- */

  const generate = useCallback(() => {
    if (!textRef.current.trim() || generatingRef.current) return;
    generatingRef.current = true;
    stopTyping();
    setOpen(null);
    setGenerating(true);
    window.setTimeout(() => {
      generatingRef.current = false;
      setGenerating(false);
      setPanel("generated");
    }, 1400);
  }, [stopTyping]);

  /* --------------------------------- 副作用 -------------------------------- */

  const started = text.trim().length > 0;

  useEffect(() => {
    if (started) return;
    const timer = window.setInterval(() => setExampleIndex((i) => (i + 1) % EXAMPLES.length), 4200);
    return () => window.clearInterval(timer);
  }, [started]);

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        generate();
      } else if (e.key === "Escape" && (panel || open)) {
        // 焦点不在弹窗里时（比如点了页面空白处）也能用 Esc 关闭
        if (panel) setPanel(null);
        else closePopover(true);
      } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey && !open && !panel) {
        // 在黑暗里随便敲个字就能开始：焦点不在任何输入框时，先把焦点交给提示词
        const active = document.activeElement;
        const typing = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || (active as HTMLElement | null)?.isContentEditable;
        if (!typing) fieldRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closePopover, generate, open, panel]);

  useEffect(
    () => () => {
      window.clearTimeout(timerRef.current);
      abortRef.current?.abort();
      if (typingRef.current !== null) window.clearInterval(typingRef.current);
    },
    [],
  );

  /* --------------------------------- 派生 --------------------------------- */

  const visible = useMemo(() => entities.filter((e) => isIntact(e, text)), [entities, text]);
  const openEntity = open ? visible.find((e) => e.id === open.id) : undefined;

  useEffect(() => {
    if (open && !openEntity) setOpen(null);
  }, [open, openEntity]);

  const glowColors = useMemo(() => {
    const hexes = [...new Set(visible.filter((e) => e.category === "color" && typeof e.params.hex === "string").map((e) => e.params.hex as string))];
    return hexes.length > 0 ? [...hexes, ...DEFAULT_GLOW].slice(0, 3) : DEFAULT_GLOW;
  }, [visible]);

  const payload = useMemo(() => buildPayload(text, visible, video.settings, analysis), [text, visible, video.settings, analysis]);

  const engineLabel =
    analysis.engine === "jev"
      ? `Jev${analysis.model ? ` · ${analysis.model}` : ""} · ${analysis.latencyMs}ms`
      : analysis.engine === "local"
        ? `本地词典${analysis.fallbackReason ? ` · ${analysis.fallbackReason}` : ""}`
        : "";

  /* --------------------------------- 事件 --------------------------------- */

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab" && !e.shiftKey && !textRef.current) {
      e.preventDefault();
      typeExample();
    } else if (e.key === "Escape" && open) {
      e.preventDefault();
      setOpen(null);
    }
  };

  const onStagePointerDown = (e: PointerEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;
    if (target === e.currentTarget || target.classList.contains(styles.column)) {
      e.preventDefault();
      fieldRef.current?.focus();
    }
  };

  const onParam = (key: string, value: ParamValue) => {
    if (!open) return;
    updateEntity(open.id, (e) => ({ ...e, params: { ...e.params, [key]: value }, touched: true }));
  };

  const onSubtype = (subtype: string) => {
    if (!open) return;
    updateEntity(open.id, (e) =>
      e.subtype === subtype ? e : { ...e, subtype, subtypeLocked: true, params: defaultParams(e.category, subtype), touched: true },
    );
  };

  const onDescription = (description: string, touch: boolean) => {
    if (!open) return;
    updateEntity(open.id, (e) => ({ ...e, description, touched: e.touched || (touch && description.trim() !== "") }));
  };

  const onReferences = (references: RefImage[]) => {
    if (!open) return;
    updateEntity(open.id, (e) => ({ ...e, references, touched: true }));
  };

  const footerHint = !started ? (
    <>
      在黑暗里写下你想看到的画面
      <span className={styles.desktopOnly}>
        {" "}
        · <span className={styles.kbd}>Tab</span> 填入示例
      </span>
    </>
  ) : (
    <>
      点击带下划线的词进行细化
      <span className={styles.desktopOnly}>
        {" "}
        · <span className={styles.kbd}>{shortcut}</span> 生成
      </span>
    </>
  );

  return (
    <div className={styles.root}>
      <div className={styles.glowLayer} style={{ opacity: started ? 1 : 0 }} aria-hidden="true">
        {glowColors.map((color, i) => (
          <span key={i} className={styles.glow} style={{ backgroundColor: color }} />
        ))}
      </div>
      <div className={styles.grain} aria-hidden="true" />

      <AnimatePresence>
        {started && (
          <motion.header
            className={styles.topbar}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.4 }}
          >
            <div className={styles.topbarLeft}>
              <Link href="/" className={styles.back}>
                ← 作品集
              </Link>
              <span className={styles.divider} />
              <span className={styles.title}>Lab · 视频生成入口 mockup</span>
            </div>
            <button type="button" className={styles.ghostBtn} onClick={() => setPanel((p) => (p ? null : "inspect"))}>
              <span className={styles.mono}>{"{ }"}</span>
              结构化请求
            </button>
          </motion.header>
        )}
      </AnimatePresence>

      <main className={styles.stage} onPointerDown={onStagePointerDown}>
        <h1 className={styles.srOnly}>视频生成入口 · 交互 mockup</h1>
        <div className={styles.column}>
          <motion.div layout="position" className={styles.prompt} transition={{ type: "spring", stiffness: 260, damping: 32 }}>
            <PromptField
              ref={fieldRef}
              value={text}
              entities={visible}
              selection={selection}
              focused={focused}
              composing={composing}
              activeId={open?.id ?? null}
              hoverId={hoverId}
              analyzing={analysis.status === "pending"}
              onChange={applyText}
              onSelectionChange={setSelection}
              onFocusChange={setFocused}
              onCompositionChange={(value) => {
                composingRef.current = value;
                setComposing(value);
                if (!value) scheduleAnalysis();
              }}
              onHover={setHoverId}
              onEntityClick={(id, fragment) => setOpen(id ? { id, fragment } : null)}
              onKeyDown={onKeyDown}
              onUserInput={stopTyping}
            />
            <AnimatePresence>
              {!started && (
                <motion.div
                  key={exampleIndex}
                  className={styles.placeholder}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.5 }}
                >
                  <button
                    type="button"
                    className={styles.placeholderBtn}
                    tabIndex={-1}
                    onClick={() => {
                      fieldRef.current?.focus();
                      typeExample();
                    }}
                  >
                    <span className={styles.placeholderLead}>试试</span>
                    {EXAMPLES[exampleIndex]}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <AnimatePresence>
            {started && (
              <motion.div
                key="gui"
                className={styles.gui}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 14 }}
                transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
              >
                <ElementTray
                  entities={visible}
                  activeId={open?.id ?? null}
                  hoverId={hoverId}
                  analyzing={analysis.status === "pending"}
                  engine={analysis.engine}
                  engineLabel={engineLabel}
                  onOpen={(id) => setOpen({ id, fragment: 0 })}
                  onHover={setHoverId}
                />
                <SettingsBar
                  settings={video.settings}
                  meta={video.meta}
                  canGenerate={started}
                  generating={generating}
                  shortcut={shortcut}
                  onChange={(key, value) =>
                    setVideo((v) => ({ settings: { ...v.settings, [key]: value }, meta: { ...v.meta, [key]: { by: "user" } } }))
                  }
                  onGenerate={generate}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <div id="video-gen-hint" className={styles.footer}>
        {footerHint}
      </div>
      <div className={styles.srOnly} aria-live="polite">
        {analysis.status === "done" ? `识别到 ${visible.length} 个元素` : ""}
      </div>

      <AnimatePresence>
        {openEntity && open && (
          <EntityPopover
            key={openEntity.id}
            entity={openEntity}
            prompt={text}
            getAnchor={() => fieldRef.current?.getEntityRect(openEntity.id, open.fragment) ?? null}
            onClose={closePopover}
            onParam={onParam}
            onRewrite={(replacement, params) => rewriteEntity(openEntity.id, replacement, params)}
            onSubtype={onSubtype}
            onDescription={onDescription}
            onReferences={onReferences}
            onRemove={() => removeEntity(openEntity.id)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>{panel && <PayloadPanel key="panel" mode={panel} payload={payload} onClose={() => setPanel(null)} />}</AnimatePresence>
    </div>
  );
}
