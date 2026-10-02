"use client";

// 提示词输入框（contentEditable）。
// 文本 + 识别结果是唯一的数据源：每次输入后从 DOM 读回纯文本交给上层，再按数据重新渲染 DOM。
// 这样词的前后才能留出间距、词前面才能插入参考图缩略图（textarea 做不到）。
// 中文输入法组字期间绝不改动 DOM，组字结束后再读回、重渲染。
// 重渲染会打乱浏览器自带的撤销栈，所以撤销 / 重做由上层维护。

import { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type KeyboardEvent, type Ref } from "react";
import type { Entity } from "@/lib/video-gen/types";
import { composeThumbStack, type ThumbStack } from "./thumbs";
import styles from "./video-gen.module.css";

export interface Selection {
  start: number;
  end: number;
}

/** 这次改动在撤销历史里怎么记：连续打字合并成一步，其他改动各算一步 */
export type HistoryMode = "coalesce" | "record";

export interface PromptFieldHandle {
  /** 不传选区时，光标放在末尾 */
  focus: (selection?: Selection) => void;
  /** 实体在视口中的位置；跨行的实体取第 fragment 段 */
  getEntityRect: (id: string, fragment?: number) => DOMRect | null;
}

interface Props {
  ref?: Ref<PromptFieldHandle>;
  value: string;
  /** 只传当前文本里完好的实体，按位置排序 */
  entities: Entity[];
  selection: Selection;
  activeId: string | null;
  hoverId: string | null;
  analyzing: boolean;
  onChange: (value: string, selection: Selection, mode: HistoryMode) => void;
  onSelectionChange: (selection: Selection) => void;
  onCompositionChange: (composing: boolean) => void;
  onHover: (id: string | null) => void;
  onEntityClick: (id: string | null, fragment: number) => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  onUndo: () => void;
  onRedo: () => void;
  onUserInput: () => void;
}

/** 下划线 / 缩略图入场动画的时长，期间重渲染要接着播而不是从头播 */
const ENTER_MS = 520;
const STAGGER_MS = 60;

type Stack = ThumbStack & { sig: string };

/* ------------------------------- DOM ↔ 文本 ------------------------------- */

/**
 * DOM → 纯文本。正常情况下 DOM 里只有文本、实体 span 和末尾占位的 <br>；
 * 浏览器偶尔会自己插入 <br> / <div>（比如清空内容时），这里一并归一。
 */
function readText(root: Node): string {
  let out = "";
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      out += node.nodeValue ?? "";
      return;
    }
    if (!(node instanceof HTMLElement)) return;
    if (node.tagName === "BR") {
      if (node.dataset.tail !== "true" && node.nextSibling) out += "\n";
      return;
    }
    if ((node.tagName === "DIV" || node.tagName === "P") && out && !out.endsWith("\n")) out += "\n";
    node.childNodes.forEach(walk);
  };
  root.childNodes.forEach(walk);
  return out.replace(/ /g, " ");
}

/** DOM 中的一个位置 → 文本偏移 */
function offsetOf(root: HTMLElement, node: Node, offset: number): number {
  const range = document.createRange();
  range.selectNodeContents(root);
  try {
    range.setEnd(node, offset);
  } catch {
    return 0;
  }
  return readText(range.cloneContents()).length;
}

function getSelectionIn(root: HTMLElement): Selection | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) return null;
  const start = offsetOf(root, range.startContainer, range.startOffset);
  const end = range.collapsed ? start : offsetOf(root, range.endContainer, range.endOffset);
  return { start: Math.min(start, end), end: Math.max(start, end) };
}

/** 文本偏移 → DOM 位置。落在词的边界上时优先放在词外面，接着打的字就不会跑进下划线里 */
function pointAt(root: HTMLElement, target: number): { node: Node; offset: number } {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let pos = 0;
  let fallback: { node: Node; offset: number } | null = null;
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const text = n as Text;
    const len = text.data.length;
    if (target >= pos && target <= pos + len) {
      const point = { node: text, offset: target - pos };
      const inEntity = text.parentElement?.closest("[data-eid]") != null;
      if (!inEntity || (target > pos && target < pos + len)) return point;
      fallback ??= point;
    } else if (pos > target) {
      break;
    }
    pos += len;
  }
  return fallback ?? { node: root, offset: root.childNodes.length };
}

function setSelectionIn(root: HTMLElement, s: Selection) {
  const sel = window.getSelection();
  if (!sel) return;
  const a = pointAt(root, s.start);
  const b = s.end === s.start ? a : pointAt(root, s.end);
  const range = document.createRange();
  range.setStart(a.node, a.offset);
  range.setEnd(b.node, b.offset);
  sel.removeAllRanges();
  sel.addRange(range);
}

/* ---------------------------------- 渲染 ---------------------------------- */

interface Animations {
  /** 实体 → 下划线入场动画的开始时间 */
  underline: Map<string, number>;
  /** 实体 → 当前缩略图组的签名和它入场动画的开始时间 */
  thumbs: Map<string, { sig: string; at: number }>;
}

function renderInto(root: HTMLElement, value: string, entities: Entity[], stacks: Map<string, Stack>, anim: Animations) {
  const now = performance.now();
  const nodes: Node[] = [];
  let cursor = 0;
  let fresh = 0;

  for (const e of entities) {
    const end = e.start + e.text.length;
    if (e.start < cursor || end > value.length) continue;
    if (e.start > cursor) nodes.push(document.createTextNode(value.slice(cursor, e.start)));

    const span = document.createElement("span");
    span.className = styles.entity;
    span.dataset.eid = e.id;

    // 同一批新识别出的词依次出现；动画没播完时重渲染，用负的 delay 接着播
    let at = anim.underline.get(e.id);
    if (at === undefined) {
      at = now + fresh++ * STAGGER_MS;
      anim.underline.set(e.id, at);
    }
    if (now - at < ENTER_MS) {
      span.dataset.enter = "true";
      span.style.setProperty("--enter-delay", `${Math.round(at - now)}ms`);
    }

    const stack = stacks.get(e.id);
    if (stack) {
      span.dataset.thumbs = "true";
      span.style.setProperty("--thumbs", `url("${stack.url}")`);
      span.style.setProperty("--thumbs-ratio", stack.ratio.toFixed(3));
      let shown = anim.thumbs.get(e.id);
      if (shown?.sig !== stack.sig) {
        shown = { sig: stack.sig, at: now };
        anim.thumbs.set(e.id, shown);
      }
      if (now - shown.at < ENTER_MS) {
        span.dataset.thumbsEnter = "true";
        span.style.setProperty("--thumbs-delay", `${Math.round(shown.at - now)}ms`);
      }
    } else {
      anim.thumbs.delete(e.id);
    }

    span.textContent = value.slice(e.start, end);
    nodes.push(span);
    cursor = end;
  }

  if (cursor < value.length) nodes.push(document.createTextNode(value.slice(cursor)));
  // 末尾是换行时，空的最后一行需要一个占位才有高度
  if (value.endsWith("\n")) {
    const br = document.createElement("br");
    br.dataset.tail = "true";
    nodes.push(br);
  }
  root.replaceChildren(...nodes);
}

function applyStates(root: HTMLElement, hoverId: string | null, activeId: string | null) {
  root.querySelectorAll<HTMLElement>("[data-eid]").forEach((el) => {
    el.dataset.hover = String(el.dataset.eid === hoverId);
    el.dataset.active = String(el.dataset.eid === activeId);
  });
}

/* ---------------------------------- 组件 ---------------------------------- */

export default function PromptField(props: Props) {
  const { ref, value, entities, selection, activeId, hoverId, analyzing } = props;
  const rootRef = useRef<HTMLDivElement>(null);
  const latest = useRef(props);
  const composingRef = useRef(false);
  const renderedKey = useRef<string | null>(null);
  const anim = useRef<Animations>({ underline: new Map(), thumbs: new Map() });
  const inflight = useRef(new Set<string>());
  const downRef = useRef<{ x: number; y: number } | null>(null);
  const [stacks, setStacks] = useState<Map<string, Stack>>(() => new Map());
  // 组字中：在空白输入框里打第一个字时，要露出原生光标、藏起发光的占位光标
  const [composing, setComposing] = useState(false);
  // plaintext-only 让浏览器只插入纯文本；不支持的浏览器退回 true，粘贴 / 换行 / 格式都由我们拦截
  const [editable, setEditable] = useState<"plaintext-only" | "true">("true");

  useLayoutEffect(() => {
    latest.current = props;
  });

  useEffect(() => {
    const probe = document.createElement("div");
    try {
      probe.contentEditable = "plaintext-only";
      if (probe.contentEditable === "plaintext-only") setEditable("plaintext-only");
    } catch {
      // 不支持就保持 true
    }
    // 有鼠标的设备上直接聚焦；手机上等用户点，免得一进来就弹键盘
    const root = rootRef.current;
    if (root && window.matchMedia("(hover: hover)").matches) root.focus({ preventScroll: true });
  }, []);

  const renderNow = (sel: Selection | null) => {
    const root = rootRef.current;
    if (!root) return;
    const p = latest.current;
    renderInto(root, p.value, p.entities, stacks, anim.current);
    applyStates(root, p.hoverId, p.activeId);
    if (sel && document.activeElement === root) setSelectionIn(root, sel);
  };

  // ---- 数据 → DOM ----
  const key = `${value}\u0000${entities.map((e) => `${e.id}:${e.start}:${e.text.length}:${stacks.get(e.id)?.sig ?? ""}`).join(",")}`;

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || composingRef.current || key === renderedKey.current) return;
    renderedKey.current = key;
    renderNow(selection);
  });

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (root) applyStates(root, hoverId, activeId);
  }, [hoverId, activeId]);

  // ---- 参考图 → 缩略图组 ----
  useEffect(() => {
    const wanted = new Map(entities.filter((e) => e.references.length > 0).map((e) => [e.id, e.references.map((r) => r.url)]));
    setStacks((prev) => {
      const next = new Map([...prev].filter(([id]) => wanted.has(id)));
      return next.size === prev.size ? prev : next;
    });
    for (const [id, urls] of wanted) {
      const sig = urls.join("|");
      const token = `${id}#${sig}`;
      if (stacks.get(id)?.sig === sig || inflight.current.has(token)) continue;
      inflight.current.add(token);
      composeThumbStack(urls)
        .then((stack) =>
          setStacks((prev) => {
            const current = latest.current.entities.find((e) => e.id === id);
            if (!current || current.references.map((r) => r.url).join("|") !== sig) return prev;
            return new Map(prev).set(id, { ...stack, sig });
          }),
        )
        .catch(() => undefined)
        .finally(() => inflight.current.delete(token));
    }
  }, [entities, stacks]);

  // ---- DOM → 数据 ----
  const syncFromDom = (mode: Parameters<Props["onChange"]>[2]) => {
    const root = rootRef.current;
    if (!root) return;
    const text = readText(root);
    const sel = getSelectionIn(root) ?? { start: text.length, end: text.length };
    if (text === latest.current.value) {
      // 文本没变（比如浏览器塞了个占位的 <br>）：立刻按数据重渲染，保持 DOM 干净
      renderNow(sel);
      renderedKey.current = key;
      return;
    }
    latest.current.onChange(text, sel, mode);
  };

  const insertText = (text: string) => {
    const root = rootRef.current;
    if (!root) return;
    const p = latest.current;
    const sel = getSelectionIn(root) ?? p.selection;
    const caret = sel.start + text.length;
    p.onChange(p.value.slice(0, sel.start) + text + p.value.slice(sel.end), { start: caret, end: caret }, "record");
  };

  // 换行、撤销、格式化这类输入交给我们自己处理（React 的 onBeforeInput 不覆盖这些 inputType）
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const onBeforeInput = (e: InputEvent) => {
      const type = e.inputType;
      if (type === "insertParagraph" || type === "insertLineBreak") {
        e.preventDefault();
        if (!e.isComposing) insertText("\n");
      } else if (type === "historyUndo") {
        e.preventDefault();
        latest.current.onUndo();
      } else if (type === "historyRedo") {
        e.preventDefault();
        latest.current.onRedo();
      } else if (type.startsWith("format") || type === "insertFromDrop" || type === "deleteByDrag") {
        e.preventDefault();
      }
    };
    root.addEventListener("beforeinput", onBeforeInput);
    return () => root.removeEventListener("beforeinput", onBeforeInput);
    // insertText 只读 ref，不需要重绑
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onSelectionChange = () => {
      const root = rootRef.current;
      if (!root || composingRef.current || document.activeElement !== root) return;
      const sel = getSelectionIn(root);
      if (sel) latest.current.onSelectionChange(sel);
    };
    document.addEventListener("selectionchange", onSelectionChange);
    return () => document.removeEventListener("selectionchange", onSelectionChange);
  }, []);

  useImperativeHandle(ref, () => ({
    focus(sel) {
      const root = rootRef.current;
      if (!root) return;
      root.focus({ preventScroll: true });
      const length = latest.current.value.length;
      setSelectionIn(root, sel ?? { start: length, end: length });
    },
    getEntityRect(id, fragment = 0) {
      const span = rootRef.current?.querySelector<HTMLElement>(`[data-eid="${CSS.escape(id)}"]`);
      if (!span) return null;
      const rects = span.getClientRects();
      return rects[Math.min(fragment, rects.length - 1)] ?? span.getBoundingClientRect();
    },
  }));

  return (
    <div className={styles.field}>
      <div
        ref={rootRef}
        className={styles.editor}
        contentEditable={editable}
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="描述你想生成的视频"
        aria-describedby="video-gen-hint"
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        data-entity-trigger=""
        data-empty={value.length === 0}
        data-composing={composing}
        onInput={(e) => {
          if (composingRef.current || (e.nativeEvent as InputEvent).isComposing) return;
          props.onUserInput();
          syncFromDom("coalesce");
        }}
        onCompositionStart={() => {
          composingRef.current = true;
          setComposing(true);
          props.onUserInput();
          props.onCompositionChange(true);
        }}
        onCompositionEnd={() => {
          composingRef.current = false;
          setComposing(false);
          props.onCompositionChange(false);
          renderedKey.current = null;
          syncFromDom("record");
        }}
        onPaste={(e) => {
          e.preventDefault();
          const text = e.clipboardData.getData("text/plain").replace(/\r\n?/g, "\n");
          if (text) insertText(text);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          if (e.nativeEvent.isComposing || e.keyCode === 229) return;
          props.onUserInput();
          const mod = e.metaKey || e.ctrlKey;
          const k = e.key.toLowerCase();
          if (mod && !e.altKey && (k === "z" || k === "y")) {
            e.preventDefault();
            if (k === "y" || e.shiftKey) props.onRedo();
            else props.onUndo();
            return;
          }
          props.onKeyDown(e);
        }}
        onMouseOver={(e) => {
          const id = (e.target as Element).closest?.("[data-eid]")?.getAttribute("data-eid") ?? null;
          if (id !== latest.current.hoverId) props.onHover(id);
        }}
        onMouseLeave={() => {
          if (latest.current.hoverId) props.onHover(null);
        }}
        onPointerDown={(e) => {
          props.onUserInput();
          downRef.current = { x: e.clientX, y: e.clientY };
        }}
        onClick={(e) => {
          const down = downRef.current;
          downRef.current = null;
          // 拖选文字不算点击
          if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 4) return;
          if (window.getSelection()?.isCollapsed === false) return;
          const span = (e.target as Element).closest?.("[data-eid]") as HTMLElement | null;
          if (!span) {
            props.onEntityClick(null, 0);
            return;
          }
          const rects = Array.from(span.getClientRects());
          const hit = rects.findIndex((r) => e.clientX >= r.left - 1 && e.clientX <= r.right + 1 && e.clientY >= r.top - 2 && e.clientY <= r.bottom + 2);
          props.onEntityClick(span.dataset.eid ?? null, Math.max(0, hit));
        }}
      />
      <div className={styles.scan} data-on={analyzing} aria-hidden="true" />
    </div>
  );
}
