import type { WorkType } from "@/site.config";

/**
 * Procedural cover art — De Stijl plates.
 *
 * Each plate is a deterministic partition of the canvas into rectangles, divided
 * by thick black rules and filled with the three primaries. Nothing is
 * downloaded, nothing is licensed, and a given seed always produces the same
 * composition, so the archive looks designed rather than random.
 */

export const TYPE_TINT: Record<
  WorkType,
  { accent: string; code: string }
> = {
  movie: { accent: "#D8231C", code: "FILM" },
  book: { accent: "#F7C400", code: "BOOK" },
  music: { accent: "#101010", code: "ALBM" },
};

const RED = "#D8231C";
const BLUE = "#1B4B9C";
const YELLOW = "#F7C400";
const BLACK = "#101010";
const WHITE = "#FBFAF7";

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rect = { x: number; y: number; w: number; h: number };

/** Recursively bisects a rectangle; depth 3 gives 4–8 planes. */
function partition(rect: Rect, depth: number, rand: () => number): Rect[] {
  if (depth <= 0) return [rect];

  const horizontal = rand() > 0.42;
  const ratio = 0.28 + rand() * 0.44;

  if (horizontal) {
    const cut = rect.h * ratio;
    return [
      ...partition({ ...rect, h: cut }, depth - 1, rand),
      ...partition({ x: rect.x, y: rect.y + cut, w: rect.w, h: rect.h - cut }, depth - 1, rand),
    ];
  }

  const cut = rect.w * ratio;
  return [
    ...partition({ ...rect, w: cut }, depth - 1, rand),
    ...partition({ x: rect.x + cut, y: rect.y, w: rect.w - cut, h: rect.h }, depth - 1, rand),
  ];
}

type CoverOptions = {
  seed: number;
  type: WorkType;
  title: string;
  index?: number;
  width?: number;
  ratio?: number;
};

export function coverSvg({
  seed,
  type,
  title,
  index = 1,
  width = 900,
  ratio = 0.72,
}: CoverOptions) {
  const tint = TYPE_TINT[type];
  const rand = mulberry32(seed * 7919 + index * 104729);
  const h = Math.round(width / ratio);
  const labelH = Math.round(width * 0.075);
  const L = Math.max(6, Math.round(width * 0.011));

  const planes = partition({ x: 0, y: 0, w: width, h: h - labelH }, 3, rand);
  planes.sort((a, b) => b.w * b.h - a.w * a.h);

  // The type's primary always appears; the other two primaries join sometimes.
  const palette: string[] = [];
  if (tint.accent === BLACK) {
    // Albums are keyed to black, so keep at least one primary in the plane.
    palette.push(RED);
    if (rand() > 0.45) palette.push(BLUE);
    if (rand() > 0.72) palette.push(YELLOW);
  } else {
    palette.push(tint.accent);
    const extras = [RED, BLUE, YELLOW].filter((color) => color !== tint.accent);
    if (rand() > 0.35) palette.push(extras[0]);
    if (rand() > 0.6) palette.push(extras[1]);
  }
  palette.push(WHITE, WHITE, WHITE);

  const shapes: string[] = [];
  planes.forEach((plane, planeIndex) => {
    const pick = planeIndex === 0 ? palette[0] : palette[Math.floor(rand() * palette.length)];
    const inset = L / 2;
    const x = plane.x + (plane.x === 0 ? L / 2 : inset);
    const y = plane.y + (plane.y === 0 ? L / 2 : inset);
    const w = plane.w - (plane.x === 0 ? L / 2 : inset) - (plane.x + plane.w >= width ? L / 2 : inset);
    const hh =
      plane.h -
      (plane.y === 0 ? L / 2 : inset) -
      (plane.y + plane.h >= h - labelH ? L / 2 : inset);

    if (w <= 0 || hh <= 0) return;
    shapes.push(
      `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${hh.toFixed(1)}" fill="${pick}"/>`,
    );
  });

  const label = String(index).padStart(2, "0");
  const safeTitle = title
    .slice(0, 24)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const fontSize = Math.round(width * 0.021);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${h}" width="${width}" height="${h}" role="img" aria-label="${safeTitle}">
  <rect width="${width}" height="${h}" fill="${BLACK}"/>
  <g>${shapes.join("")}</g>
  <rect x="0" y="${h - labelH}" width="${width}" height="${labelH}" fill="${WHITE}"/>
  <rect x="0" y="${h - labelH}" width="${width}" height="${L / 2}" fill="${BLACK}"/>
  <text x="${Math.round(L * 1.6)}" y="${h - labelH / 2 + fontSize * 0.36}" font-family="Helvetica, Arial, sans-serif" font-size="${fontSize}" letter-spacing="${(fontSize * 0.18).toFixed(1)}" fill="${BLACK}">PL. ${label}</text>
  <text x="${width - Math.round(L * 1.6)}" y="${h - labelH / 2 + fontSize * 0.36}" text-anchor="end" font-family="Helvetica, Arial, sans-serif" font-size="${fontSize}" letter-spacing="${(fontSize * 0.18).toFixed(1)}" fill="${BLACK}">${tint.code}</text>
</svg>`;
}

/** Deterministic ratios so the collage keeps an asymmetric rhythm. */
export function ratioForIndex(index: number): number {
  const set = [0.72, 0.8, 1, 0.68, 0.75, 0.9, 0.66];
  return set[index % set.length];
}
