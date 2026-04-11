// CSS Color 4 serializer.
//
// `formatCss(swatch, opts)` returns a CSS string. `opts.format` picks
// the form; if omitted we pick the best default for the swatch's source
// space (preserving it losslessly where possible).
//
// Supported formats:
//   'hex'          — #rrggbb (drops alpha)
//   'hex-alpha'    — #rrggbbaa
//   'rgb'          — rgb(r g b) or rgb(r g b / a)   (modern slash syntax)
//   'rgb-legacy'   — rgb(r, g, b) or rgba(r, g, b, a)
//   'hsl'          — hsl(h s% l%) modern
//   'hsl-legacy'   — hsl(h, s%, l%) / hsla(...)
//   'hwb'          — hwb(h w% b%)
//   'lab'          — lab(L a b)  (D50, CSS spec)
//   'lch'          — lch(L C H)
//   'oklab'        — oklab(L a b)
//   'oklch'        — oklch(L C H)
//   'color'        — color(<space> r g b [/ a])  — uses the source space
//
// Precision: numbers are serialized with up to 6 significant digits by
// default to keep strings short; pass `{ precision }` to override.

const DEFAULT_PRECISION = 6;

function fmtNum(n, precision = DEFAULT_PRECISION) {
	if (!Number.isFinite(n)) return "0";
	if (n === 0) return "0";
	// Strip trailing zeros after toPrecision.
	const s = n.toPrecision(precision);
	// toPrecision may return scientific notation for very small/large; for
	// color values we'd rather see fixed form within a sane range.
	if (s.indexOf("e") < 0) {
		return parseFloat(s).toString();
	}
	return parseFloat(n.toFixed(precision)).toString();
}

function fmtInt(n) {
	return Math.round(n).toString();
}

function fmtAlpha(a, precision = DEFAULT_PRECISION) {
	if (a >= 1) return "1";
	if (a <= 0) return "0";
	return fmtNum(a, precision);
}

function hex2(n) {
	const v = Math.max(0, Math.min(255, Math.round(n * 255)));
	return v.toString(16).padStart(2, "0");
}

function toHex(swatch, withAlpha) {
	const { r, g, b } = swatch.srgb;
	const base = "#" + hex2(r) + hex2(g) + hex2(b);
	if (withAlpha) return base + hex2(swatch.alpha);
	return base;
}

function toRgbModern(swatch, precision) {
	const { r, g, b } = swatch.srgb;
	const R = fmtInt(r * 255);
	const G = fmtInt(g * 255);
	const B = fmtInt(b * 255);
	if (swatch.alpha < 1) {
		return `rgb(${R} ${G} ${B} / ${fmtAlpha(swatch.alpha, precision)})`;
	}
	return `rgb(${R} ${G} ${B})`;
}

function toRgbLegacy(swatch, precision) {
	const { r, g, b } = swatch.srgb;
	const R = fmtInt(r * 255);
	const G = fmtInt(g * 255);
	const B = fmtInt(b * 255);
	if (swatch.alpha < 1) {
		return `rgba(${R}, ${G}, ${B}, ${fmtAlpha(swatch.alpha, precision)})`;
	}
	return `rgb(${R}, ${G}, ${B})`;
}

function toHslModern(swatch, precision) {
	const { h, s, l } = swatch.hsl;
	const H = fmtNum(h, precision);
	const S = fmtNum(s, precision);
	const L = fmtNum(l, precision);
	if (swatch.alpha < 1) {
		return `hsl(${H} ${S}% ${L}% / ${fmtAlpha(swatch.alpha, precision)})`;
	}
	return `hsl(${H} ${S}% ${L}%)`;
}

function toHslLegacy(swatch, precision) {
	const { h, s, l } = swatch.hsl;
	const H = fmtNum(h, precision);
	const S = fmtNum(s, precision);
	const L = fmtNum(l, precision);
	if (swatch.alpha < 1) {
		return `hsla(${H}, ${S}%, ${L}%, ${fmtAlpha(swatch.alpha, precision)})`;
	}
	return `hsl(${H}, ${S}%, ${L}%)`;
}

function toHwb(swatch, precision) {
	const { h, w, b } = swatch.hwb;
	const H = fmtNum(h, precision);
	const W = fmtNum(w, precision);
	const B = fmtNum(b, precision);
	if (swatch.alpha < 1) {
		return `hwb(${H} ${W}% ${B}% / ${fmtAlpha(swatch.alpha, precision)})`;
	}
	return `hwb(${H} ${W}% ${B}%)`;
}

function toLab(swatch, precision) {
	// CSS lab() is D50.
	const coords = swatch._getCoordsIn("lab-d50");
	const L = fmtNum(coords[0], precision);
	const a = fmtNum(coords[1], precision);
	const b = fmtNum(coords[2], precision);
	if (swatch.alpha < 1) {
		return `lab(${L} ${a} ${b} / ${fmtAlpha(swatch.alpha, precision)})`;
	}
	return `lab(${L} ${a} ${b})`;
}

function toLch(swatch, precision) {
	const coords = swatch._getCoordsIn("lch-d50");
	const L = fmtNum(coords[0], precision);
	const C = fmtNum(coords[1], precision);
	const H = fmtNum(coords[2], precision);
	if (swatch.alpha < 1) {
		return `lch(${L} ${C} ${H} / ${fmtAlpha(swatch.alpha, precision)})`;
	}
	return `lch(${L} ${C} ${H})`;
}

function toOklab(swatch, precision) {
	const { l, a, b } = swatch.oklab;
	const L = fmtNum(l, precision);
	const A = fmtNum(a, precision);
	const B = fmtNum(b, precision);
	if (swatch.alpha < 1) {
		return `oklab(${L} ${A} ${B} / ${fmtAlpha(swatch.alpha, precision)})`;
	}
	return `oklab(${L} ${A} ${B})`;
}

function toOklch(swatch, precision) {
	const { l, c, h } = swatch.oklch;
	const L = fmtNum(l, precision);
	const C = fmtNum(c, precision);
	const H = fmtNum(h, precision);
	if (swatch.alpha < 1) {
		return `oklch(${L} ${C} ${H} / ${fmtAlpha(swatch.alpha, precision)})`;
	}
	return `oklch(${L} ${C} ${H})`;
}

// Map registry ids back to CSS color() space tokens.
const SPACE_TO_COLOR_FN = {
	srgb: "srgb",
	"srgb-linear": "srgb-linear",
	"display-p3": "display-p3",
	rec2020: "rec2020",
	a98: "a98-rgb",
	prophoto: "prophoto-rgb",
	xyz: "xyz-d65",
	"xyz-d65": "xyz-d65",
	"xyz-d50": "xyz-d50"
};

function toColorFn(swatch, precision, spaceOverride) {
	const spaceId = spaceOverride || swatch.space;
	const token = SPACE_TO_COLOR_FN[spaceId];
	if (!token) {
		throw new Error(
			`formatCss: space "${spaceId}" has no color() serialization`
		);
	}
	const coords = swatch._getCoordsIn(spaceId);
	const c1 = fmtNum(coords[0], precision);
	const c2 = fmtNum(coords[1], precision);
	const c3 = fmtNum(coords[2], precision);
	if (swatch.alpha < 1) {
		return `color(${token} ${c1} ${c2} ${c3} / ${fmtAlpha(swatch.alpha, precision)})`;
	}
	return `color(${token} ${c1} ${c2} ${c3})`;
}

// Pick a default format for a swatch based on its source space.
function defaultFormat(swatch) {
	switch (swatch.space) {
		case "srgb":
			return swatch.alpha < 1 ? "rgb" : "hex";
		case "hsl":
			return "hsl";
		case "hwb":
			return "hwb";
		case "lab":
		case "lab-d50":
			return "lab";
		case "lch":
		case "lch-d50":
			return "lch";
		case "oklab":
			return "oklab";
		case "oklch":
			return "oklch";
		case "display-p3":
		case "rec2020":
		case "a98":
		case "prophoto":
		case "srgb-linear":
		case "xyz":
		case "xyz-d65":
		case "xyz-d50":
			return "color";
		default:
			return "hex";
	}
}

export function formatCss(swatch, opts = {}) {
	const precision = opts.precision ?? DEFAULT_PRECISION;
	const format = opts.format ?? defaultFormat(swatch);
	switch (format) {
		case "hex":
			return toHex(swatch, false);
		case "hex-alpha":
			return toHex(swatch, true);
		case "rgb":
			return toRgbModern(swatch, precision);
		case "rgb-legacy":
			return toRgbLegacy(swatch, precision);
		case "hsl":
			return toHslModern(swatch, precision);
		case "hsl-legacy":
			return toHslLegacy(swatch, precision);
		case "hwb":
			return toHwb(swatch, precision);
		case "lab":
			return toLab(swatch, precision);
		case "lch":
			return toLch(swatch, precision);
		case "oklab":
			return toOklab(swatch, precision);
		case "oklch":
			return toOklch(swatch, precision);
		case "color":
			return toColorFn(swatch, precision, opts.space);
		default:
			throw new Error(`formatCss: unknown format "${format}"`);
	}
}
