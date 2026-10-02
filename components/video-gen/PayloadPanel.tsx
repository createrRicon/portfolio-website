"use client";

// 「最终会发给视频模型的结构化请求」——把文字 + GUI 设置合成一份 JSON，说明这套交互的产出是什么。

import { motion } from "framer-motion";
import { useMemo, useState, type ReactNode } from "react";
import styles from "./video-gen.module.css";

interface Props {
  mode: "inspect" | "generated";
  payload: unknown;
  onClose: () => void;
}

/** 极简 JSON 着色 */
function highlight(json: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /("(?:\\.|[^"\\])*")(\s*:)?|\b(-?\d+(?:\.\d+)?)\b|\b(true|false|null)\b/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(json))) {
    if (m.index > last) out.push(json.slice(last, m.index));
    if (m[1]) {
      out.push(
        <span key={i++} className={m[2] ? styles.jKey : styles.jStr}>
          {m[1]}
        </span>,
      );
      if (m[2]) out.push(m[2]);
    } else if (m[3]) {
      out.push(
        <span key={i++} className={styles.jNum}>
          {m[3]}
        </span>,
      );
    } else {
      out.push(
        <span key={i++} className={styles.jLit}>
          {m[4]}
        </span>,
      );
    }
    last = re.lastIndex;
  }
  out.push(json.slice(last));
  return out;
}

export default function PayloadPanel({ mode, payload, onClose }: Props) {
  // 只含数字 / 短值的数组折成一行（"span": [3, 5]），更好读
  const json = useMemo(
    () => JSON.stringify(payload, null, 2).replace(/\[\n\s+([^[\]{}]*?)\n\s*\]/g, (_, inner: string) => `[${inner.split(/,\n\s*/).join(", ")}]`),
    [payload],
  );
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <motion.aside
      className={styles.panel}
      role="dialog"
      aria-label="结构化请求"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.22, ease: [0.2, 0.7, 0.2, 1] }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div className={styles.panelHead}>
        <div>
          <div className={styles.panelTitle}>{mode === "generated" ? "生成请求已就绪" : "结构化请求"}</div>
          <div className={styles.panelSub}>
            {mode === "generated"
              ? "这是一个交互 mockup，不会真的生成视频。下面是这次会发给视频模型的内容：原文 + 每个元素的细化设置 + 常驻参数。"
              : "随着输入实时更新：原文 + 每个元素的细化设置 + 常驻参数。"}
          </div>
        </div>
        <button type="button" className={styles.close} aria-label="关闭" onClick={onClose} autoFocus>
          ✕
        </button>
      </div>
      <pre className={styles.json}>{highlight(json)}</pre>
      <div className={styles.panelFoot}>
        <button type="button" className={styles.ghostBtn} onClick={copy}>
          {copied ? "已复制" : "复制 JSON"}
        </button>
      </div>
    </motion.aside>
  );
}
