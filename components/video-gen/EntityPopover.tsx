"use client";

// 点击下划线词后的弹窗：AI 判断 → 该类型的专属控件 → 补充描述（可让 AI 写）→ 参考图。
// 桌面端锚定在词的下方（放不下就翻到上方），窄屏变成底部抽屉。

import { motion } from "framer-motion";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { describeLocally } from "@/lib/video-gen/local-engine";
import { CATEGORIES, controlsFor, subtypeInfo } from "@/lib/video-gen/taxonomy";
import type { Category, DescribeRequest, DescribeResponse, Entity, ParamValue, Params, RefImage } from "@/lib/video-gen/types";
import { EntityControls } from "./controls";
import styles from "./video-gen.module.css";

interface Props {
  entity: Entity;
  prompt: string;
  getAnchor: () => DOMRect | null;
  onClose: (refocus: boolean) => void;
  onParam: (key: string, value: ParamValue) => void;
  onRewrite: (text: string, params: Params) => void;
  onSubtype: (subtype: string) => void;
  onDescription: (text: string, touch: boolean) => void;
  onReferences: (refs: RefImage[]) => void;
  onRemove: () => void;
}

interface Placement {
  sheet: boolean;
  left: number;
  top: number;
  width: number;
  /** 上下都放不下完整内容时，限制高度、内部滚动，绝不盖住被点的词 */
  maxHeight?: number;
  side: "below" | "above";
  arrowX: number;
}

const WIDTH = 360;
const MAX_HEIGHT = 620;
const GAP = 12;
const MARGIN = 12;
const MAX_REFS = 4;
const SHEET_BREAKPOINT = 640;

const REF_HINT: Partial<Record<Category, string>> = {
  character: "上传参考图，在多个镜头里保持同一个角色",
  scene: "上传场景参考，锁定空间结构和色调",
  style: "上传风格参考，让画面质感向它靠拢",
  color: "上传取色参考",
  object: "上传物件参考，保持外观一致",
};

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

const samePlacement = (a: Placement, b: Placement) =>
  a.sheet === b.sheet &&
  a.side === b.side &&
  Math.round(a.maxHeight ?? -1) === Math.round(b.maxHeight ?? -1) &&
  Math.round(a.left) === Math.round(b.left) &&
  Math.round(a.top) === Math.round(b.top) &&
  Math.round(a.width) === Math.round(b.width) &&
  Math.round(a.arrowX) === Math.round(b.arrowX);

export default function EntityPopover(props: Props) {
  const { entity, prompt, onClose } = props;
  const info = CATEGORIES[entity.category];
  const sub = subtypeInfo(entity.category, entity.subtype);
  const ref = useRef<HTMLDivElement>(null);
  const [place, setPlace] = useState<Placement | null>(null);
  const [sheetAtMount] = useState(() => typeof window !== "undefined" && window.innerWidth < SHEET_BREAKPOINT);

  // 回调里总是拿到最新的 props
  const latest = useRef(props);
  useLayoutEffect(() => {
    latest.current = props;
  });

  /* ------------------------------- 定位 ------------------------------- */

  const reposition = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let next: Placement;
    if (vw < SHEET_BREAKPOINT) {
      next = { sheet: true, left: 0, top: 0, width: vw, side: "below", arrowX: 0 };
    } else {
      const anchor = latest.current.getAnchor();
      if (!anchor) return;
      const width = Math.min(WIDTH, vw - MARGIN * 2);
      const center = anchor.left + anchor.width / 2;
      const left = clamp(center - width / 2, MARGIN, vw - width - MARGIN);

      // 内容的自然高度 = 外框高度 - 滚动区可见高度 + 滚动区内容高度
      const scroller = el.querySelector<HTMLElement>("[data-scroll]");
      const natural = scroller ? el.offsetHeight - scroller.clientHeight + scroller.scrollHeight : el.offsetHeight;
      const want = Math.min(natural, MAX_HEIGHT);
      const below = vh - anchor.bottom - GAP - MARGIN;
      const above = anchor.top - GAP - MARGIN;
      // 优先放得下完整内容的一侧（先下后上）；都放不下就放空间更大的一侧
      const side: Placement["side"] = want <= below || (want > above && below >= above) ? "below" : "above";
      const maxHeight = Math.min(MAX_HEIGHT, side === "below" ? below : above);
      const height = Math.min(want, maxHeight);
      const top = side === "below" ? anchor.bottom + GAP : anchor.top - GAP - height;
      next = { sheet: false, left, top, width, maxHeight, side, arrowX: clamp(center - left, 18, width - 18) };
    }
    setPlace((prev) => (prev && samePlacement(prev, next) ? prev : next));
  }, []);

  useLayoutEffect(() => {
    reposition();
  });

  useEffect(() => {
    const el = ref.current;
    const observer = new ResizeObserver(() => reposition());
    if (el) observer.observe(el);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [reposition]);

  /* --------------------------- 焦点与关闭 --------------------------- */

  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (!target || ref.current?.contains(target)) return;
      // 输入框和元素托盘自己处理点击（切换到另一个词，而不是先关再开）
      if (target.closest("[data-entity-trigger]")) return;
      latest.current.onClose(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, []);

  /* ----------------------------- AI 帮我写 ----------------------------- */

  const [busy, setBusy] = useState(false);
  const [writeNote, setWriteNote] = useState<string | null>(null);
  const variant = useRef(0);
  /** 上一次 AI 写的内容：用户没改过的话，「换一版」只替换 AI 写的那部分 */
  const draft = useRef<{ full: string; ai: string } | null>(null);
  const stream = useRef<{ timer: number; final: string } | null>(null);

  useEffect(
    () => () => {
      // 写到一半关掉弹窗：直接落成完整内容
      const s = stream.current;
      if (s) {
        window.clearInterval(s.timer);
        latest.current.onDescription(s.final, true);
      }
    },
    [],
  );

  const aiWrite = async () => {
    if (busy) return;
    setBusy(true);
    setWriteNote(null);
    const req: DescribeRequest = {
      prompt,
      entity: { text: entity.text, category: entity.category, subtype: entity.subtype, params: entity.params },
      variant: variant.current++,
    };
    let res: DescribeResponse;
    try {
      const r = await fetch("/api/video-gen/describe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });
      if (!r.ok) throw new Error(String(r.status));
      res = (await r.json()) as DescribeResponse;
    } catch {
      res = describeLocally(req, "接口不可用");
    }

    const current = latest.current.entity.description;
    let base = "";
    if (draft.current && current === draft.current.full) base = current.slice(0, current.length - draft.current.ai.length);
    else if (current.trim()) base = `${current.replace(/\s+$/, "")}\n`;
    const final = base + res.text;
    draft.current = { full: final, ai: res.text };

    let shown = 0;
    const timer = window.setInterval(() => {
      shown = Math.min(res.text.length, shown + 2);
      if (shown >= res.text.length) {
        window.clearInterval(timer);
        stream.current = null;
        latest.current.onDescription(final, true);
        setBusy(false);
        setWriteNote(res.engine === "jev" ? `Jev 选词 · ${res.latencyMs}ms` : `本地模板${res.fallbackReason ? ` · ${res.fallbackReason}` : ""}`);
      } else {
        latest.current.onDescription(base + res.text.slice(0, shown), false);
      }
    }, 18);
    stream.current = { timer, final };
  };

  const aiLabel = busy ? "正在写…" : draft.current && entity.description === draft.current.full ? "换一版" : "AI 帮我写";

  /* ------------------------------- 参考图 ------------------------------- */

  const [dragging, setDragging] = useState(false);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const room = MAX_REFS - entity.references.length;
    const added = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, Math.max(0, room))
      .map((f, i) => ({ id: `r${Date.now().toString(36)}${i}`, url: URL.createObjectURL(f), name: f.name }));
    if (added.length > 0) props.onReferences([...entity.references, ...added]);
  };

  const removeRef = (id: string) => {
    const target = entity.references.find((r) => r.id === id);
    if (target) URL.revokeObjectURL(target.url);
    props.onReferences(entity.references.filter((r) => r.id !== id));
  };

  /* -------------------------------- 渲染 -------------------------------- */

  const sheet = place?.sheet ?? sheetAtMount;
  const byJev = entity.judgedBy === "jev";
  const pct = Math.round(entity.confidence * 100);

  return (
    <>
      {sheet && <motion.div className={styles.backdrop} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />}
      <motion.div
        ref={ref}
        role="dialog"
        aria-label={`${info.label}：${entity.text}`}
        tabIndex={-1}
        className={styles.popover}
        data-sheet={sheet}
        style={{
          // 定位算出来之前先放在屏幕外（不能用 visibility: hidden，那样 focus() 会静默失败）
          left: place ? place.left : -10000,
          top: place?.top ?? 0,
          width: place?.width ?? WIDTH,
          maxHeight: place?.sheet ? undefined : place?.maxHeight,
        }}
        initial={sheet ? { opacity: 0, y: 48 } : { opacity: 0, scale: 0.97 }}
        animate={sheet ? { opacity: 1, y: 0 } : { opacity: 1, scale: 1 }}
        exit={sheet ? { opacity: 0, y: 48 } : { opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.18, ease: [0.2, 0.7, 0.2, 1] }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            onClose(true);
          }
        }}
      >
        {sheet && <div className={styles.grabber} />}
        {place && !place.sheet && (
          <span className={styles.arrow} data-side={place.side} style={{ left: place.arrowX - 6 }} aria-hidden="true" />
        )}

        <div className={styles.popScroll} data-scroll="">
          <header className={styles.popHead}>
            <div className={styles.popHeadRow}>
              <span className={styles.typeTag}>
                {info.label}
                {sub ? ` · ${sub.label}` : ""}
                <span className={styles.mono}>{info.en}</span>
              </span>
              <button type="button" className={styles.close} aria-label="关闭" onClick={() => onClose(true)}>
                ✕
              </button>
            </div>
            <div className={styles.entityTitle}>{entity.text}</div>
          </header>

          <div className={styles.judge}>
            <div className={styles.judgeLine}>
              <span>
                {byJev ? "Jev 判断为" : "词典识别为"} <span style={{ color: "var(--ink)" }}>{info.label}</span>
              </span>
              {byJev && (
                <span className={styles.confidence}>
                  <span className={styles.meter}>
                    <span style={{ width: `${pct}%` }} />
                  </span>
                  {pct}%
                </span>
              )}
            </div>
            {info.subtypes && (
              <>
                <div className={styles.chipRow} role="group" aria-label="具体是哪一种">
                  {info.subtypes.map((s) => (
                    <button key={s.key} type="button" className={styles.opt} aria-pressed={entity.subtype === s.key} onClick={() => props.onSubtype(s.key)}>
                      {s.label}
                      {entity.aiSubtype === s.key && (
                        <span className={styles.optAi}>
                          {byJev && entity.subtypeConfidence !== undefined ? `AI ${Math.round(entity.subtypeConfidence * 100)}%` : "AI"}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <div className={styles.note}>不同类型给出不同的设置项；判断错了可以手动切换</div>
              </>
            )}
          </div>

          <EntityControls
            entity={entity}
            specs={controlsFor(entity.category, entity.subtype)}
            onParam={props.onParam}
            onRewrite={props.onRewrite}
          />

          <section className={styles.section}>
            <div className={styles.label}>
              <span>补充描述</span>
            </div>
            <textarea
              className={styles.desc}
              value={entity.description}
              readOnly={busy}
              placeholder={`写下「${entity.text}」更具体的样子，或者让 AI 帮你写`}
              aria-label="补充描述"
              onChange={(e) => props.onDescription(e.target.value, true)}
            />
            <div className={styles.descActions}>
              {/* 用 aria-disabled 而不是 disabled：已聚焦的按钮被禁用会把焦点丢给 body，Esc 就关不掉弹窗了 */}
              <button type="button" className={styles.aiBtn} onClick={aiWrite} aria-disabled={busy}>
                <span className={styles.spark}>✦</span>
                {aiLabel}
              </button>
              {writeNote && <span className={styles.note}>{writeNote}</span>}
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.label}>
              <span>参考图</span>
              <span className={styles.note}>
                {entity.references.length}/{MAX_REFS}
              </span>
            </div>
            <div
              className={styles.refs}
              data-dragging={dragging}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                addFiles(e.dataTransfer.files);
              }}
            >
              {entity.references.map((r) => (
                <div key={r.id} className={styles.thumb}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- 本地 object URL，无需 next/image */}
                  <img src={r.url} alt={r.name} />
                  <button type="button" className={styles.thumbRemove} aria-label={`移除 ${r.name}`} onClick={() => removeRef(r.id)}>
                    ✕
                  </button>
                </div>
              ))}
              {entity.references.length < MAX_REFS && (
                <label className={styles.addTile}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      addFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                  <span style={{ fontSize: 18, lineHeight: 1 }}>＋</span>
                  <span>上传</span>
                </label>
              )}
            </div>
            <div className={styles.note}>{REF_HINT[entity.category] ?? "上传参考图"} · 支持拖拽</div>
          </section>
        </div>

        <footer className={styles.popFoot}>
          <button type="button" className={styles.linkBtn} onClick={props.onRemove}>
            识别错了？移除标记
          </button>
          <button type="button" className={styles.doneBtn} onClick={() => onClose(true)}>
            完成
          </button>
        </footer>
      </motion.div>
    </>
  );
}
