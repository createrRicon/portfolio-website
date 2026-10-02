"use client";

// 常驻在提示词下方的视频参数。被提示词自动调整过的项会带 ✦ 标记，
// 用户手动改过之后，AI 就不再覆盖它。

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { SettingKey, VideoSettings } from "@/lib/video-gen/types";
import styles from "./video-gen.module.css";

export type SettingMeta = Partial<Record<SettingKey, { by: "ai" | "user"; reason?: string }>>;

interface Props {
  settings: VideoSettings;
  meta: SettingMeta;
  canGenerate: boolean;
  generating: boolean;
  /** 「⌘↵」或「Ctrl↵」 */
  shortcut: string;
  onChange: <K extends SettingKey>(key: K, value: VideoSettings[K]) => void;
  onGenerate: () => void;
}

const ASPECTS: VideoSettings["aspect"][] = ["16:9", "9:16", "1:1", "4:3", "21:9"];
const ASPECT_NOTE: Record<VideoSettings["aspect"], string> = {
  "16:9": "横屏",
  "9:16": "竖屏",
  "1:1": "方形",
  "4:3": "复古",
  "21:9": "宽银幕",
};
const RESOLUTIONS: Array<{ value: VideoSettings["resolution"]; note: string }> = [
  { value: "720p", note: "快速预览" },
  { value: "1080p", note: "标准" },
  { value: "4K", note: "更慢，更贵" },
];
const FPS: Array<{ value: VideoSettings["fps"]; note: string }> = [
  { value: 24, note: "电影感" },
  { value: 30, note: "流畅" },
  { value: 60, note: "可做慢动作" },
];

export function RatioIcon({ ratio }: { ratio: string }) {
  const [w, h] = ratio.split(":").map(Number);
  const scale = 16 / Math.max(w, h);
  return (
    <span className={styles.ratioIcon} aria-hidden="true">
      <span style={{ width: Math.max(6, w * scale), height: Math.max(6, h * scale) }} />
    </span>
  );
}

export default function SettingsBar({ settings, meta, canGenerate, generating, shortcut, onChange, onGenerate }: Props) {
  const [open, setOpen] = useState<SettingKey | null>(null);
  const [side, setSide] = useState<"top" | "bottom">("bottom");
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!barRef.current?.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = (key: SettingKey, el: HTMLElement) => {
    if (open === key) return setOpen(null);
    const rect = el.getBoundingClientRect();
    setSide(window.innerHeight - rect.bottom < 300 ? "top" : "bottom");
    setOpen(key);
  };

  const pill = (key: SettingKey, label: string, value: ReactNode, menu: ReactNode) => {
    const m = meta[key];
    return (
      <div className={styles.pillWrap}>
        <button
          type="button"
          className={styles.pill}
          aria-haspopup="true"
          aria-expanded={open === key}
          title={m?.by === "ai" ? `根据提示词自动调整：${m.reason ?? ""}` : undefined}
          onClick={(e) => toggle(key, e.currentTarget)}
        >
          <span className={styles.pillLabel}>{label}</span>
          {value}
          {m?.by === "ai" && (
            <span key={`${key}-${String(settings[key])}`} className={styles.aiMark} aria-label="AI 自动调整">
              ✦
            </span>
          )}
        </button>
        <AnimatePresence>
          {open === key && (
            <motion.div
              className={styles.menu}
              data-side={side}
              role="menu"
              initial={{ opacity: 0, y: side === "bottom" ? -4 : 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: side === "bottom" ? -4 : 4 }}
              transition={{ duration: 0.14 }}
            >
              {m?.by === "ai" && m.reason && <div className={styles.menuNote}>✦ AI 已调整 · {m.reason}</div>}
              {menu}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const item = <K extends SettingKey>(key: K, value: VideoSettings[K], content: ReactNode) => (
    <button
      key={String(value)}
      type="button"
      role="menuitemradio"
      aria-checked={settings[key] === value}
      className={styles.menuItem}
      onClick={() => {
        onChange(key, value);
        setOpen(null);
      }}
    >
      {content}
    </button>
  );

  return (
    <div ref={barRef} className={styles.settings}>
      {pill(
        "aspect",
        "画幅",
        <>
          <RatioIcon ratio={settings.aspect} />
          <span className={styles.pillValue}>{settings.aspect}</span>
        </>,
        ASPECTS.map((a) =>
          item(
            "aspect",
            a,
            <>
              <RatioIcon ratio={a} />
              <span>{a}</span>
              <span className={styles.menuHint}>{ASPECT_NOTE[a]}</span>
            </>,
          ),
        ),
      )}
      {pill(
        "resolution",
        "分辨率",
        <span className={styles.pillValue}>{settings.resolution}</span>,
        RESOLUTIONS.map((r) =>
          item(
            "resolution",
            r.value,
            <>
              <span>{r.value}</span>
              <span className={styles.menuHint}>{r.note}</span>
            </>,
          ),
        ),
      )}
      {pill(
        "fps",
        "帧率",
        <span className={styles.pillValue}>{settings.fps} fps</span>,
        FPS.map((f) =>
          item(
            "fps",
            f.value,
            <>
              <span>{f.value} fps</span>
              <span className={styles.menuHint}>{f.note}</span>
            </>,
          ),
        ),
      )}
      {pill(
        "duration",
        "时长",
        <span className={styles.pillValue}>{settings.duration}s</span>,
        <div className={styles.durationBox}>
          <div className={styles.durationValue}>{settings.duration} 秒</div>
          <input
            type="range"
            className={styles.range}
            min={2}
            max={20}
            step={1}
            value={settings.duration}
            aria-label="时长（秒）"
            onChange={(e) => onChange("duration", Number(e.target.value))}
          />
          <div className={styles.presetRow}>
            {[5, 10, 15].map((s) => (
              <button key={s} type="button" className={styles.opt} aria-pressed={settings.duration === s} onClick={() => onChange("duration", s)}>
                {s}s
              </button>
            ))}
          </div>
        </div>,
      )}
      <span className={styles.spacer} />
      <button type="button" className={styles.generate} disabled={!canGenerate || generating} onClick={onGenerate}>
        {generating && <span className={styles.generateProgress} />}
        <span className={styles.generateLabel}>
          {generating ? "生成中…" : "生成"}
          {!generating && <span className={styles.kbd}>{shortcut}</span>}
        </span>
      </button>
    </div>
  );
}
