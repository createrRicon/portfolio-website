"use client";

// 提示词输入框：上层是真实的 textarea（保证输入法、撤销、选区都是原生的），
// 下层是排版完全一致的镜像 div，负责画下划线、高亮和自定义光标。
// 镜像层不接收鼠标事件，点击时用坐标去命中镜像里的实体 span。

import { useEffect, useImperativeHandle, useRef, type CSSProperties, type KeyboardEvent, type ReactNode, type Ref } from "react";
import { CATEGORIES } from "@/lib/video-gen/taxonomy";
import type { Entity } from "@/lib/video-gen/types";
import styles from "./video-gen.module.css";

export interface Selection {
  start: number;
  end: number;
}

export interface PromptFieldHandle {
  focus: (selection?: Selection) => void;
  /** 实体在视口中的位置；多行实体取第 fragment 段 */
  getEntityRect: (id: string, fragment?: number) => DOMRect | null;
}

interface Props {
  ref?: Ref<PromptFieldHandle>;
  value: string;
  entities: Entity[];
  selection: Selection;
  focused: boolean;
  composing: boolean;
  activeId: string | null;
  hoverId: string | null;
  analyzing: boolean;
  onChange: (value: string) => void;
  onSelectionChange: (selection: Selection) => void;
  onFocusChange: (focused: boolean) => void;
  onCompositionChange: (composing: boolean) => void;
  onHover: (id: string | null) => void;
  onEntityClick: (id: string | null, fragment: number) => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onUserInput: () => void;
}

export function entityTint(e: Entity): string {
  return e.category === "color" && typeof e.params.hex === "string" ? e.params.hex : CATEGORIES[e.category].tint;
}

export default function PromptField(props: Props) {
  const { ref, value, entities, selection, focused, composing, activeId, hoverId, analyzing } = props;
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const downRef = useRef<{ x: number; y: number } | null>(null);

  useImperativeHandle(ref, () => ({
    focus(sel) {
      const el = inputRef.current;
      if (!el) return;
      el.focus({ preventScroll: true });
      if (sel) el.setSelectionRange(sel.start, sel.end);
    },
    getEntityRect(id, fragment = 0) {
      const span = mirrorRef.current?.querySelector<HTMLElement>(`[data-eid="${id}"]`);
      if (!span) return null;
      const rects = span.getClientRects();
      return rects[Math.min(fragment, rects.length - 1)] ?? span.getBoundingClientRect();
    },
  }));

  /** 坐标命中：返回指针下的实体和它的第几段（跨行实体有多个矩形） */
  const hitTest = (x: number, y: number): { id: string; fragment: number } | null => {
    const spans = mirrorRef.current?.querySelectorAll<HTMLElement>("[data-eid]") ?? [];
    for (const span of spans) {
      const rects = span.getClientRects();
      for (let i = 0; i < rects.length; i++) {
        const r = rects[i];
        if (x >= r.left - 1 && x <= r.right + 1 && y >= r.top - 2 && y <= r.bottom + 2) {
          return { id: span.dataset.eid as string, fragment: i };
        }
      }
    }
    return null;
  };

  const syncSelection = () => {
    const el = inputRef.current;
    if (el) props.onSelectionChange({ start: el.selectionStart, end: el.selectionEnd });
  };

  // SSR 输出的原生 autofocus 会在 React 接管之前生效，onFocus 不会触发，这里补一次
  useEffect(() => {
    const el = inputRef.current;
    if (el && document.activeElement === el) {
      props.onFocusChange(true);
      props.onSelectionChange({ start: el.selectionStart, end: el.selectionEnd });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 只在挂载时检查一次
  }, []);

  // ---- 镜像层内容 ----
  // 空白状态下即使没聚焦也显示光标：黑暗中央那一下闪烁就是唯一的引导
  const showCaret = (focused || value.length === 0) && !composing && selection.start === selection.end;
  const caretAt = showCaret ? selection.start : -1;
  const caretKey = `${value.length}:${selection.start}`;
  const caret = (
    <span key={`caret-${caretKey}`} className={styles.caret} data-idle={value.length === 0} aria-hidden="true" />
  );

  const pieces: ReactNode[] = [];
  let caretPlaced = false;
  const pushText = (from: number, to: number, into: ReactNode[], allowEdges: boolean) => {
    const inside = allowEdges ? caretAt >= from && caretAt <= to : caretAt > from && caretAt < to;
    if (!caretPlaced && inside) {
      caretPlaced = true;
      into.push(value.slice(from, caretAt), caret, value.slice(caretAt, to));
    } else {
      into.push(value.slice(from, to));
    }
  };

  // 同一批新识别出来的词，下划线依次画出来
  const newest = entities.reduce((max, e) => Math.max(max, e.bornAt), 0);
  let freshRank = 0;
  let cursor = 0;
  for (const e of entities) {
    const end = e.start + e.text.length;
    pushText(cursor, e.start, pieces, true);
    const inner: ReactNode[] = [];
    pushText(e.start, end, inner, false);
    const delay = e.bornAt >= newest - 150 ? freshRank++ * 70 : 0;
    pieces.push(
      <span
        key={e.id}
        data-eid={e.id}
        className={styles.entity}
        data-touched={e.touched}
        data-hover={hoverId === e.id}
        data-active={activeId === e.id}
        style={{ "--tint": entityTint(e), "--delay": `${delay}ms` } as CSSProperties}
      >
        {inner}
      </span>,
    );
    cursor = end;
  }
  pushText(cursor, value.length, pieces, true);
  // 保证末尾换行时空行也有高度
  pieces.push("​");

  return (
    <div className={styles.field}>
      <div ref={mirrorRef} className={styles.mirror} aria-hidden="true">
        {pieces}
      </div>
      <textarea
        ref={inputRef}
        className={styles.input}
        value={value}
        rows={1}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        autoFocus
        aria-label="描述你想生成的视频"
        aria-describedby="video-gen-hint"
        data-entity-trigger=""
        data-composing={composing}
        data-hovering={hoverId !== null && entities.some((e) => e.id === hoverId)}
        onChange={(e) => {
          props.onUserInput();
          props.onChange(e.target.value);
          props.onSelectionChange({ start: e.target.selectionStart, end: e.target.selectionEnd });
        }}
        onSelect={syncSelection}
        onKeyUp={syncSelection}
        onFocus={() => {
          props.onFocusChange(true);
          syncSelection();
        }}
        onBlur={() => props.onFocusChange(false)}
        onCompositionStart={() => props.onCompositionChange(true)}
        onCompositionEnd={() => props.onCompositionChange(false)}
        onKeyDown={props.onKeyDown}
        onScroll={(e) => {
          // 高度由镜像层撑开，理论上不会滚动；保险起见归零，避免两层错位
          e.currentTarget.scrollTop = 0;
        }}
        onMouseMove={(e) => {
          const hit = hitTest(e.clientX, e.clientY);
          if ((hit?.id ?? null) !== hoverId) props.onHover(hit?.id ?? null);
        }}
        onMouseLeave={() => hoverId && props.onHover(null)}
        onPointerDown={(e) => {
          props.onUserInput();
          downRef.current = { x: e.clientX, y: e.clientY };
        }}
        onClick={(e) => {
          const down = downRef.current;
          downRef.current = null;
          // 拖选文字不算点击
          if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 4) return;
          const el = e.currentTarget;
          if (el.selectionStart !== el.selectionEnd) return;
          const hit = hitTest(e.clientX, e.clientY);
          props.onEntityClick(hit?.id ?? null, hit?.fragment ?? 0);
        }}
      />
      <div className={styles.scan} data-on={analyzing} aria-hidden="true" />
    </div>
  );
}
