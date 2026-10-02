// 把一个词的参考图合成为一张「缩略图组」小图，作为该词 ::before 的背景显示在词前面。
// 用伪元素承载：它在行内占位置，但不属于可编辑内容——光标会跳过它，退格也删不掉它。
// 1–2 张并排；3 张及以上重叠收起。

const SIZE = 64; // 单张在画布上的边长（按约 2x 分辨率绘制）
const RADIUS = 15;
const GAP = 6;
/** 重叠时每张只露出边长的这么多 */
const OVERLAP_STEP = 0.42;
/** 与页面背景同色的描边，把重叠的缩略图隔开 */
const RING = "#050506";

export interface ThumbStack {
  url: string;
  /** 宽高比，CSS 用它按字号缩放 */
  ratio: number;
}

const loaded = new Map<string, Promise<HTMLImageElement>>();

function load(src: string): Promise<HTMLImageElement> {
  let p = loaded.get(src);
  if (!p) {
    p = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`无法读取图片 ${src}`));
      img.src = src;
    });
    loaded.set(src, p);
  }
  return p;
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** 等比裁切铺满（object-fit: cover） */
function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, size: number) {
  const scale = Math.max(size / img.naturalWidth, size / img.naturalHeight);
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  ctx.drawImage(img, x + (size - w) / 2, y + (size - h) / 2, w, h);
}

export async function composeThumbStack(srcs: string[]): Promise<ThumbStack> {
  const imgs = await Promise.all(srcs.map(load));
  const n = imgs.length;
  const step = n >= 3 ? SIZE * OVERLAP_STEP : SIZE + GAP;
  const pad = 2;
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(SIZE + step * (n - 1)) + pad * 2;
  canvas.height = SIZE + pad * 2;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 不可用");

  // 从最后一张画起，第一张压在最上面
  for (let i = n - 1; i >= 0; i--) {
    const x = pad + i * step;
    const y = pad;
    ctx.save();
    roundedRect(ctx, x, y, SIZE, SIZE, RADIUS);
    ctx.clip();
    drawCover(ctx, imgs[i], x, y, SIZE);
    ctx.restore();

    roundedRect(ctx, x, y, SIZE, SIZE, RADIUS);
    ctx.lineWidth = 4;
    ctx.strokeStyle = RING;
    ctx.stroke();

    roundedRect(ctx, x + 2, y + 2, SIZE - 4, SIZE - 4, RADIUS - 2);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.stroke();
  }

  return { url: canvas.toDataURL("image/png"), ratio: canvas.width / canvas.height };
}
