// Reusable theme system for the loyalty app, driven by the restaurant's MenuDock
// `theme` config. buildTheme() merges a restaurant's colours over sensible defaults
// and derives the extra shades the rich UI needs (deep/soft brand, on-brand text),
// so a restaurant only has to supply a primary colour to get a complete, cohesive theme.

const FALLBACK = {
  primary: "#FF7A1A",
  secondary: "#17202A",
  accent: "#1BB58A",
};

// --- tiny hex helpers (no deps) ---------------------------------------------
function clamp(n) { return Math.max(0, Math.min(255, n)); }
function parse(hex) {
  const h = (hex || "").replace("#", "");
  if (h.length !== 6) return null;
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}
function toHex(rgb) { return "#" + rgb.map((c) => clamp(Math.round(c)).toString(16).padStart(2, "0")).join(""); }
function shade(hex, amt) {
  const rgb = parse(hex);
  if (!rgb) return hex;
  return toHex(rgb.map((c) => (amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)));
}
// Readable text colour for a given background. Uses perceived brightness (YIQ):
// white text on mid-to-dark backgrounds, dark text only on genuinely light ones.
// This is what makes the UI adapt per restaurant theme automatically — pass any
// background colour and get a legible text colour back.
export function onColor(hex) {
  const rgb = parse(hex);
  if (!rgb) return "#ffffff";
  const [r, g, b] = rgb;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000; // 0 (black) – 255 (white)
  return brightness > 150 ? "#17202A" : "#ffffff";
}

export function buildTheme(restaurantTheme = {}) {
  const c = { ...FALLBACK, ...(restaurantTheme.colors || {}) };
  const primary = c.primary || FALLBACK.primary;
  const accent = c.accent || FALLBACK.accent;
  const brandDeep = shade(primary, -0.22);

  return {
    colors: {
      primary,
      brandDeep,
      brandSoft: shade(primary, 0.82),
      // onBrand = readable on `primary` (buttons, chips); onBrandDeep = readable on
      // `brandDeep` (points card, drawer, avatars). Computed per surface, not fixed.
      onBrand: onColor(primary),
      onBrandDeep: onColor(brandDeep),
      accent,
      secondary: c.secondary || FALLBACK.secondary,
      // neutral surface palette (not usually overridden per restaurant)
      bg: c.background || "#F6F7F9",
      surface: "#ffffff",
      text: c.text || "#17202A",
      muted: "#5E6B78",
      faint: "#93A0AD",
      line: "#E7ECF1",
    },
    fonts: {
      heading: restaurantTheme.fonts?.heading || "System",
      body: restaurantTheme.fonts?.body || "System",
    },
    logoUrl: restaurantTheme.logoUrl || "",
    radii: { sm: 10, md: 14, lg: 20, pill: 999 },
  };
}

export const defaultTheme = buildTheme();
