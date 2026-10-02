"use client";

// 弹窗里的交互控件。具体给哪几个，由 taxonomy.controlsFor(类型, 子类型) 决定。

import type { CSSProperties, ReactNode } from "react";
import {
  LIGHT_POSITIONS,
  STYLE_PRESETS,
  SWATCHES,
  formatSlider,
  type ControlSpec,
} from "@/lib/video-gen/taxonomy";
import type { Entity, ParamValue, Params } from "@/lib/video-gen/types";
import styles from "./video-gen.module.css";

interface ControlsProps {
  entity: Entity;
  specs: ControlSpec[];
  onParam: (key: string, value: ParamValue) => void;
  onRewrite: (text: string, params: Params) => void;
}

const isAscii = (s: string) => /^[\x20-\x7e]+$/.test(s);

export function EntityControls({ entity, specs, onParam, onRewrite }: ControlsProps) {
  return (
    <>
      {specs.map((spec, i) => {
        switch (spec.kind) {
          case "chips":
            return (
              <Chips
                key={spec.key}
                label={spec.label}
                options={spec.options}
                value={entity.params[spec.key] ?? null}
                onChange={(v) => onParam(spec.key, v)}
              />
            );
          case "slider":
            return <Slider key={spec.key} spec={spec} value={entity.params[spec.key]} onChange={(v) => onParam(spec.key, v)} />;
          case "color":
            return <ColorControl key="color" entity={entity} onParam={onParam} onRewrite={onRewrite} />;
          case "style":
            return <StyleControl key="style" entity={entity} onRewrite={onRewrite} />;
          case "light-preview":
            return <LightPreview key={`light-${i}`} params={entity.params} />;
          case "shot-size":
            return (
              <TileGroup
                key={spec.key}
                label={spec.label}
                options={spec.options}
                value={entity.params[spec.key] ?? null}
                columns="shot"
                icon={(_, idx) => <ShotIcon index={idx} />}
                onChange={(v) => onParam(spec.key, v)}
              />
            );
          case "camera-move":
            return (
              <TileGroup
                key={spec.key}
                label={spec.label}
                options={spec.options}
                value={entity.params[spec.key] ?? null}
                columns="move"
                icon={(o) => <MoveIcon move={o} />}
                onChange={(v) => onParam(spec.key, v)}
              />
            );
        }
      })}
    </>
  );
}

/* ---------------------------------- chips --------------------------------- */

function Chips(props: { label: string; options: string[]; value: ParamValue; onChange: (v: string | null) => void }) {
  const { label, options, value, onChange } = props;
  return (
    <div className={styles.section}>
      <div className={styles.label}>
        <span>{label}</span>
        {value === null && <span className={styles.note}>未指定 · 交给 AI</span>}
      </div>
      <div className={styles.chipRow} role="group" aria-label={label}>
        {options.map((o) => (
          <button key={o} type="button" className={styles.opt} aria-pressed={value === o} onClick={() => onChange(value === o ? null : o)}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------- 滑杆 --------------------------------- */

const SKY =
  "linear-gradient(90deg,#0b1026 0%,#1d2350 17%,#f29a62 25%,#9ccbff 31%,#57a8ff 50%,#8fb8ff 70%,#ff8a5b 77%,#5b3a8c 82%,#141a3a 90%,#0b1026 100%)";

/** 色温 → RGB（Tanner Helland 近似） */
export function kelvinToRgb(kelvin: number): [number, number, number] {
  const t = kelvin / 100;
  let r: number;
  let g: number;
  let b: number;
  if (t <= 66) {
    r = 255;
    g = 99.4708025861 * Math.log(t) - 161.1195681661;
    b = t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  } else {
    r = 329.698727446 * Math.pow(t - 60, -0.1332047592);
    g = 288.1221695283 * Math.pow(t - 60, -0.0755148492);
    b = 255;
  }
  const clamp = (v: number) => Math.round(Math.min(255, Math.max(0, v)));
  return [clamp(r), clamp(g), clamp(b)];
}

const KELVIN = `linear-gradient(90deg,${[1800, 2700, 3500, 4500, 5600, 6500, 9000]
  .map((k, i, arr) => `rgb(${kelvinToRgb(k).join(" ")}) ${Math.round(((k - arr[0]) / (arr[arr.length - 1] - arr[0])) * 100)}%`)
  .join(",")})`;

function timeName(h: number): string {
  if (h < 4 || h >= 22) return "深夜";
  if (h < 6) return "黎明";
  if (h < 9) return "清晨";
  if (h < 11) return "上午";
  if (h < 13.5) return "正午";
  if (h < 17) return "午后";
  if (h < 19.5) return "黄昏";
  return "夜晚";
}

function kelvinName(k: number): string {
  if (k < 3300) return "暖";
  if (k < 5000) return "偏暖";
  if (k < 6500) return "日光";
  return "冷";
}

function Slider(props: { spec: Extract<ControlSpec, { kind: "slider" }>; value: ParamValue | undefined; onChange: (v: number) => void }) {
  const { spec, onChange } = props;
  const value = typeof props.value === "number" ? props.value : (spec.min + spec.max) / 2;
  const pct = ((value - spec.min) / (spec.max - spec.min)) * 100;
  const track =
    spec.track === "sky"
      ? SKY
      : spec.track === "kelvin"
        ? KELVIN
        : `linear-gradient(90deg, rgba(255,255,255,.6) ${pct}%, rgba(255,255,255,.12) ${pct}%)`;
  let readout = formatSlider(value, spec.format);
  if (spec.format === "time") readout += ` · ${timeName(value)}`;
  if (spec.format === "kelvin") readout += ` · ${kelvinName(value)}`;

  return (
    <div className={styles.section}>
      <div className={styles.label}>
        <span>{spec.label}</span>
        {!spec.ends && <span className={styles.labelValue}>{readout}</span>}
      </div>
      <input
        type="range"
        className={styles.range}
        min={spec.min}
        max={spec.max}
        step={spec.step}
        value={value}
        aria-label={spec.label}
        aria-valuetext={spec.ends ? `${Math.round(pct)}%` : readout}
        style={{ "--track": track } as CSSProperties}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {spec.ends && (
        <div className={styles.rangeEnds}>
          <span>{spec.ends[0]}</span>
          <span>{spec.ends[1]}</span>
        </div>
      )}
    </div>
  );
}

/* --------------------------------- 颜色 --------------------------------- */

function ColorControl(props: { entity: Entity; onParam: ControlsProps["onParam"]; onRewrite: ControlsProps["onRewrite"] }) {
  const { entity, onParam, onRewrite } = props;
  const hex = typeof entity.params.hex === "string" ? entity.params.hex : "#8B8D98";
  const english = isAscii(entity.text);
  const matched = SWATCHES.find((s) => s.hex.toLowerCase() === hex.toLowerCase());

  return (
    <div className={styles.section}>
      <div className={styles.label}>
        <span>颜色</span>
        <span className={styles.note}>选色板会直接改写原文</span>
      </div>
      <div className={styles.swatches} role="group" aria-label="色板">
        {SWATCHES.map((s) => (
          <button
            key={s.name}
            type="button"
            className={styles.swatch}
            style={{ background: s.hex }}
            title={s.name}
            aria-label={s.name}
            aria-pressed={matched?.name === s.name}
            onClick={() => onRewrite(english ? s.en.split(" / ")[0] : s.name, { hex: s.hex })}
          />
        ))}
        <label className={styles.customSwatch} data-on={!matched} title="自定义颜色">
          <input type="color" aria-label="自定义颜色" value={hex.length === 7 ? hex.toLowerCase() : "#8b8d98"} onChange={(e) => onParam("hex", e.target.value.toUpperCase())} />
        </label>
      </div>
      <div className={styles.colorMeta}>
        <span className={styles.colorChip} style={{ background: hex }} />
        <span className={styles.mono}>{hex.toUpperCase()}</span>
        <span>{matched ? `· ${matched.name}` : "· 自定义色值，原文保持不变"}</span>
      </div>
    </div>
  );
}

/* --------------------------------- 风格 --------------------------------- */

function StyleControl(props: { entity: Entity; onRewrite: ControlsProps["onRewrite"] }) {
  const { entity, onRewrite } = props;
  const english = isAscii(entity.text);
  return (
    <div className={styles.section}>
      <div className={styles.label}>
        <span>风格预设</span>
        <span className={styles.note}>选择会直接改写原文</span>
      </div>
      <div className={styles.styleGrid} role="group" aria-label="风格预设">
        {STYLE_PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            className={styles.styleCard}
            aria-pressed={entity.params.preset === p.key}
            onClick={() => onRewrite(english ? p.short : p.name, { preset: p.key })}
          >
            <span className={styles.styleThumb} style={{ background: p.gradient }} />
            {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------- 光位预览 ------------------------------- */

const LIGHT_SPOT: Record<string, { highlight: [number, number]; source: [number, number] }> = {
  顺光: { highlight: [42, 38], source: [26, 22] },
  侧光: { highlight: [88, 46], source: [84, 48] },
  逆光: { highlight: [50, 50], source: [50, 46] },
  顶光: { highlight: [50, 6], source: [50, 9] },
  底光: { highlight: [50, 96], source: [50, 92] },
};

function LightPreview({ params }: { params: Params }) {
  const position = typeof params.position === "string" && LIGHT_SPOT[params.position] ? params.position : LIGHT_POSITIONS[0];
  const kelvin = typeof params.kelvin === "number" ? params.kelvin : 5600;
  const hardness = typeof params.hardness === "number" ? params.hardness : 40;
  const [r, g, b] = kelvinToRgb(kelvin);
  const light = (a: number) => `rgba(${r},${g},${b},${a})`;
  const spot = LIGHT_SPOT[position];
  const spread = 26 + (100 - hardness) * 0.42;
  const back = position === "逆光";

  const orb: CSSProperties = back
    ? {
        background: "radial-gradient(circle at 50% 55%, #121216 0%, #08080a 100%)",
        boxShadow: `0 0 0 1.5px ${light(0.9)}, 0 0 ${10 + (100 - hardness) * 0.3}px ${light(0.6)}`,
        zIndex: 1,
      }
    : {
        background: `radial-gradient(circle at ${spot.highlight[0]}% ${spot.highlight[1]}%, ${light(1)} 0%, ${light(0.5)} ${spread * 0.4}%, #1b1b21 ${spread}%, #09090b 100%)`,
        boxShadow: "0 14px 30px rgba(0,0,0,.6)",
      };

  return (
    <div className={styles.lightStage} aria-hidden="true">
      <span
        className={styles.lightSource}
        style={{
          left: `calc(${spot.source[0]}% - 5px)`,
          top: `calc(${spot.source[1]}% - 5px)`,
          backgroundColor: light(1),
          boxShadow: `0 0 ${back ? 40 : 16}px ${back ? 18 : 4}px ${light(back ? 0.45 : 0.55)}`,
          zIndex: 0,
        }}
      />
      <span className={styles.lightOrb} style={orb} />
      <span className={styles.lightCaption}>
        预览 · {position} · {kelvin}K
      </span>
    </div>
  );
}

/* ------------------------------ 景别 / 运镜 ------------------------------ */

function TileGroup(props: {
  label: string;
  options: string[];
  value: ParamValue;
  columns: "shot" | "move";
  icon: (option: string, index: number) => ReactNode;
  onChange: (v: string | null) => void;
}) {
  const { label, options, value, columns, icon, onChange } = props;
  return (
    <div className={styles.section}>
      <div className={styles.label}>
        <span>{label}</span>
        {value === null ? <span className={styles.note}>未指定 · 交给 AI</span> : <span className={styles.labelValue}>{value}</span>}
      </div>
      <div className={columns === "shot" ? styles.shotGrid : styles.moveGrid} role="group" aria-label={label}>
        {options.map((o, i) => (
          <button key={o} type="button" className={styles.tile} aria-pressed={value === o} onClick={() => onChange(value === o ? null : o)}>
            {icon(o, i)}
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

// 大特写 → 远景：同一个小人，用不同的缩放和取景中心模拟构图
const SHOT_FRAMES: Array<[number, number]> = [
  [2.4, 19],
  [1.1, 22],
  [0.75, 31],
  [0.55, 38],
  [0.29, 55],
  [0.11, 55],
];

function ShotIcon({ index }: { index: number }) {
  const [scale, focusY] = SHOT_FRAMES[index] ?? SHOT_FRAMES[3];
  return (
    <svg viewBox="0 0 48 30" aria-hidden="true">
      <rect width="48" height="30" fill="rgba(255,255,255,.06)" />
      <g transform={`translate(24 15) scale(${scale}) translate(-50 -${focusY})`} fill="currentColor">
        <circle cx="50" cy="20" r="9" />
        <circle cx="46.5" cy="19" r="1.1" fill="#111" />
        <circle cx="53.5" cy="19" r="1.1" fill="#111" />
        <path d="M33 46c0-9 7.6-14 17-14s17 5 17 14v22l-4 30h-9l-4-24-4 24h-9l-4-30z" />
      </g>
    </svg>
  );
}

const MOVE_CLASS: Record<string, string | undefined> = {
  推进: styles.mvPush,
  拉远: styles.mvPull,
  横摇: styles.mvPan,
  升降: styles.mvCrane,
  手持: styles.mvShake,
};

function MoveIcon({ move }: { move: string }) {
  const sceneClass = MOVE_CLASS[move];
  return (
    <svg viewBox="0 0 48 30" aria-hidden="true">
      <rect width="48" height="30" fill="rgba(255,255,255,.06)" />
      <g className={sceneClass ? `${styles.mv} ${sceneClass}` : undefined}>
        <g className={move === "跟随" ? `${styles.mv} ${styles.mvFollow}` : undefined} stroke="currentColor" strokeOpacity=".3">
          {[4, 12, 20, 28, 36, 44].map((x) => (
            <line key={x} x1={x} y1="24" x2={x} y2="26" />
          ))}
          <line x1="0" y1="24" x2="48" y2="24" />
        </g>
        <circle cx="24" cy="11" r="3" fill="currentColor" />
        <path d="M19 23.5c0-4 2.2-6.5 5-6.5s5 2.5 5 6.5z" fill="currentColor" />
      </g>
      {move === "环绕" && <circle className={`${styles.mv} ${styles.mvOrbit}`} cx="24" cy="15" r="1.8" fill="#b9a3ff" />}
      {move === "固定" && <path d="M21 29l3-4 3 4" stroke="currentColor" strokeOpacity=".5" fill="none" />}
    </svg>
  );
}
