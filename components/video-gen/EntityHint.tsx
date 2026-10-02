"use client";

// 悬停在下划线词上时出现的小提示：系统把它识别成了什么。
// 识别结果只在这里出现，不再常驻在提示词下方。

import { motion } from "framer-motion";
import { useLayoutEffect, useRef, useState } from "react";
import { CATEGORIES, subtypeInfo } from "@/lib/video-gen/taxonomy";
import type { Entity } from "@/lib/video-gen/types";
import styles from "./video-gen.module.css";

interface Props {
  entity: Entity;
  getAnchor: () => DOMRect | null;
}

const GAP = 10;
const MARGIN = 8;

export default function EntityHint({ entity, getAnchor }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    const anchor = getAnchor();
    if (!el || !anchor) return;
    const width = el.offsetWidth;
    const height = el.offsetHeight;
    const left = Math.round(Math.min(Math.max(anchor.left + anchor.width / 2 - width / 2, MARGIN), window.innerWidth - width - MARGIN));
    const above = anchor.top - GAP - height;
    const top = Math.round(above >= MARGIN ? above : anchor.bottom + GAP);
    setPos((p) => (p && p.left === left && p.top === top ? p : { left, top }));
  });

  const info = CATEGORIES[entity.category];
  const sub = subtypeInfo(entity.category, entity.subtype);
  const details = [
    entity.references.length > 0 ? `${entity.references.length} 张参考图` : null,
    entity.description.trim() ? "已补充描述" : null,
  ].filter(Boolean);

  return (
    <motion.div
      ref={ref}
      role="tooltip"
      className={styles.hint}
      style={{ left: pos?.left ?? -10000, top: pos?.top ?? 0 }}
      initial={{ opacity: 0, y: 3 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.14, delay: 0.06 }}
    >
      <span className={styles.hintType}>
        {info.label}
        {sub ? ` · ${sub.label}` : ""}
      </span>
      {details.length > 0 && <span className={styles.hintMeta}>{details.join(" · ")}</span>}
      <span className={styles.hintAction}>点击细化</span>
    </motion.div>
  );
}
