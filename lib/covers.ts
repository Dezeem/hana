import type { WorkType } from "@/site.config";

/**
 * Procedural cover art.
 *
 * Seed covers are drawn as SVG at runtime so the repository stays light,
 * works offline and never ships third-party artwork. Every plate is derived
 * from a numeric seed, so a title always gets the same image.
 */

export const TYPE_TINT: Record<WorkType, { accent: string; wash: string; paper: string; code: string }> = {
  movie: { accent: "#B4402F", wash: "#F1E4DE", paper: "#F7F1EA", code: "FILM" },
  series: { accent: "#2F4858", wash: "#DFE6EA", paper: "#F1F2F0", code: "SERI" },
  book: { accent: "#5C6B4A", wash: "#E4E7DA", paper: "#F4F3EA", code: "BOOK" },
  music: { accent: "#B8863B", wash: "#F0E6D4", paper: "#F8F3E8", code: "ALBM" },
};

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function grain(id: string, opacity: number) {
  return `<filter id="${id}"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope="${opacity}"/></feComponentTransfer></filter>`;
}

type CoverOptions = {
  seed: number;
  type: WorkType;
  title: string;
  index?: number;
  width?: number;
  ratio?: number;
};

export function coverSvg({ seed, type, title, index = 1, width = 900, ratio = 0.72 }: CoverOptions) {
  const tint = TYPE_TINT[type];
  const rand = mulberry32(seed * 7919 + index * 104729);
  const height = Math.round(width / ratio);
  const w = width;
  const h = height;
  const variant = seed % 5;
  const uid = `g${seed}`;

  const shapes: string[] = [];

  if (variant === 0) {
    const cx = w * (0.35 + rand() * 0.3);
    const cy = h * (0.3 + rand() * 0.14);
    const r = w * (0.3 + rand() * 0.1);
    shapes.push(
      `<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${r.toFixed(0)}" fill="${tint.accent}" opacity="0.9"/>`,
      `<rect x="0" y="${(h * 0.62).toFixed(0)}" width="${w}" height="1" fill="${tint.accent}" opacity="0.5"/>`,
      `<rect x="0" y="${(h * 0.74).toFixed(0)}" width="${w}" height="1" fill="${tint.accent}" opacity="0.3"/>`,
      `<rect x="${(w * 0.12).toFixed(0)}" y="${(h * 0.5).toFixed(0)}" width="${(w * 0.06).toFixed(0)}" height="${(h * 0.36).toFixed(0)}" fill="${tint.accent}" opacity="0.14"/>`,
    );
  } else if (variant === 1) {
    const cx = w * 0.5;
    const cy = h * 0.72;
    for (let i = 0; i < 6; i += 1) {
      const r = w * (0.22 + i * 0.13);
      shapes.push(
        `<circle cx="${cx}" cy="${cy.toFixed(0)}" r="${r.toFixed(0)}" fill="none" stroke="${tint.accent}" stroke-width="${i === 0 ? 2 : 1}" opacity="${(0.75 - i * 0.1).toFixed(2)}"/>`,
      );
    }
    shapes.push(
      `<circle cx="${cx}" cy="${cy.toFixed(0)}" r="${(w * 0.05).toFixed(0)}" fill="${tint.accent}"/>`,
      `<rect x="0" y="${(h * 0.28).toFixed(0)}" width="${w}" height="1" fill="${tint.accent}" opacity="0.35"/>`,
    );
  } else if (variant === 2) {
    const cols = 7;
    const rows = Math.round((cols * h) / w);
    const step = w / (cols + 1);
    const dotR = Math.max(2.2, w * 0.004);
    const dots: string[] = [];
    for (let row = 1; row < rows; row += 1) {
      for (let col = 1; col <= cols; col += 1) {
        const cx = col * step;
        const cy = (row * h) / (rows + 1);
        const inBand = Math.abs(cx / w - cy / h) < 0.16;
        if (inBand) continue;
        dots.push(
          `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${dotR.toFixed(1)}" fill="${tint.accent}" opacity="0.5"/>`,
        );
      }
    }
    shapes.push(
      `<polygon points="0,${h} ${(w * 0.58).toFixed(0)},0 ${(w * 0.82).toFixed(0)},0 0,${(h * 0.78).toFixed(0)}" fill="${tint.accent}" opacity="0.9"/>`,
      ...dots,
    );
  } else if (variant === 3) {
    const strokes = 9;
    for (let i = 0; i < strokes; i += 1) {
      const x = (w / (strokes + 1)) * (i + 1);
      const amp = w * (0.02 + rand() * 0.05);
      const path = `M ${x.toFixed(1)} 0 C ${(x + amp).toFixed(1)} ${(h * 0.3).toFixed(0)}, ${(x - amp).toFixed(1)} ${(h * 0.7).toFixed(0)}, ${x.toFixed(1)} ${h}`;
      shapes.push(
        `<path d="${path}" fill="none" stroke="${tint.accent}" stroke-width="${i % 3 === 0 ? 2 : 1}" opacity="${(0.25 + (i % 4) * 0.18).toFixed(2)}"/>`,
      );
    }
    shapes.push(
      `<rect x="${(w * 0.18).toFixed(0)}" y="${(h * 0.36).toFixed(0)}" width="${(w * 0.64).toFixed(0)}" height="1" fill="${tint.accent}" opacity="0.9"/>`,
    );
  } else {
    const inset = w * (0.13 + rand() * 0.06);
    shapes.push(
      `<rect x="${inset.toFixed(0)}" y="${inset.toFixed(0)}" width="${(w - inset * 2).toFixed(0)}" height="${(h - inset * 2).toFixed(0)}" fill="none" stroke="${tint.accent}" stroke-width="1" opacity="0.7"/>`,
      `<rect x="${(w * 0.3).toFixed(0)}" y="${(h * 0.36).toFixed(0)}" width="${(w * 0.4).toFixed(0)}" height="${(w * 0.4).toFixed(0)}" fill="${tint.accent}" opacity="0.86"/>`,
      `<rect x="${(w * 0.3).toFixed(0)}" y="${(h * 0.36).toFixed(0)}" width="${(w * 0.4).toFixed(0)}" height="${(w * 0.4).toFixed(0)}" fill="none" stroke="#F7F4EE" stroke-width="1" opacity="0.5"/>`,
    );
  }

  const label = String(index).padStart(2, "0");
  const safeTitle = title
    .slice(0, 22)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${safeTitle}">
  <defs>
    ${grain(uid, 0.22)}
    <linearGradient id="${uid}-wash" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${tint.wash}"/>
      <stop offset="100%" stop-color="${tint.paper}"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="${tint.paper}"/>
  <rect width="${w}" height="${h}" fill="url(#${uid}-wash)" opacity="0.6"/>
  ${shapes.join("\n  ")}
  <rect width="${w}" height="${h}" filter="url(#${uid})" opacity="0.55"/>
  <rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" fill="none" stroke="${tint.accent}" stroke-width="1" opacity="0.25"/>
  <text x="${(w * 0.06).toFixed(0)}" y="${(h * 0.95).toFixed(0)}" font-family="Georgia, serif" font-size="${(w * 0.018).toFixed(0)}" letter-spacing="${(w * 0.004).toFixed(1)}" fill="${tint.accent}" opacity="0.75">PL. ${label}</text>
  <text x="${(w * 0.94).toFixed(0)}" y="${(h * 0.95).toFixed(0)}" text-anchor="end" font-family="Georgia, serif" font-size="${(w * 0.018).toFixed(0)}" letter-spacing="${(w * 0.004).toFixed(1)}" fill="${tint.accent}" opacity="0.75">${tint.code}</text>
</svg>`;
}

/** Deterministic ratios so the collage keeps an organic rhythm. */
export function ratioForIndex(index: number): number {
  const set = [0.72, 0.8, 1, 0.68, 0.75, 0.9, 0.66];
  return set[index % set.length];
}
