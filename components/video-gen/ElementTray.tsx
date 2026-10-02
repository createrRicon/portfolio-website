"use client";

// 提示词下方的「已识别元素」：系统读懂了什么一目了然，也是键盘用户打开弹窗的入口。

import { AnimatePresence, motion } from "framer-motion";
import type { CSSProperties } from "react";
import { CATEGORIES, subtypeInfo } from "@/lib/video-gen/taxonomy";
import type { Engine, Entity } from "@/lib/video-gen/types";
import { entityTint } from "./PromptField";
import styles from "./video-gen.module.css";

interface Props {
  entities: Entity[];
  activeId: string | null;
  hoverId: string | null;
  analyzing: boolean;
  engine?: Engine;
  engineLabel: string;
  onOpen: (id: string) => void;
  onHover: (id: string | null) => void;
}

export default function ElementTray({ entities, activeId, hoverId, analyzing, engine, engineLabel, onOpen, onHover }: Props) {
  const status = analyzing
    ? entities.length > 0
      ? "正在重新理解…"
      : "正在理解你的描述…"
    : entities.length > 0
      ? `识别到 ${entities.length} 个元素 · 点击细化`
      : "继续描述画面，系统会自动识别其中的元素";

  return (
    <div className={styles.tray}>
      <div className={styles.trayHead}>
        <span className={styles.status}>
          <span className={styles.pulse} data-on={analyzing} />
          {status}
        </span>
        {engineLabel && (
          <span className={`${styles.engine} ${styles.mono}`} data-engine={engine}>
            {engineLabel}
          </span>
        )}
      </div>
      <div className={styles.chips}>
        <AnimatePresence initial={false}>
          {entities.map((e) => {
            const sub = subtypeInfo(e.category, e.subtype);
            return (
              <motion.button
                key={e.id}
                layout="position"
                type="button"
                className={styles.chip}
                data-entity-trigger=""
                data-active={activeId === e.id}
                data-hover={hoverId === e.id}
                style={{ "--tint": entityTint(e) } as CSSProperties}
                aria-label={`细化${CATEGORIES[e.category].label}：${e.text}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                onClick={() => onOpen(e.id)}
                onMouseEnter={() => onHover(e.id)}
                onMouseLeave={() => onHover(null)}
              >
                <span className={styles.dot} />
                <span className={styles.chipType}>{sub?.label ?? CATEGORIES[e.category].label}</span>
                {e.text}
                {e.references.length > 0 && <span className={styles.chipBadge}>◫ {e.references.length}</span>}
                {e.touched && <span className={styles.chipBadge}>✓</span>}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
