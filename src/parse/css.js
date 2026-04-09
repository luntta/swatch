// CSS Color 4 string parsers.
//
// Handles:
//
//   rgb(R G B [/ A])                       — modern syntax only (legacy
//                                             comma form is parse/legacy.js)
//   hsl(H S L [/ A])                       — ditto
//   hwb(H W B [/ A])                       — note: HWB space registers in
//                                             Phase 8; until then the
//                                             returned state is { space: 'hwb' }
//                                             and will fail conversion
//   lab(L a b [/ A])                       — CIE Lab D50 (CSS spec)
//   lch(L C H [/ A])                       — CIE LCh D50
//   oklab(L a b [/ A])                     — OKLab (L in 0..1 internally
//                                             but CSS uses 0..100% percent)
//   oklch(L C H [/ A])                     — OKLCh (same L convention)
//   color(<space> r g b [/ A])             — srgb, srgb-linear, display-p3,
//                                             rec2020, a98-rgb, prophoto-rgb,
//                                             xyz / xyz-d65 / xyz-d50
//
// Also accepts the `none` keyword (treated as 0 — the CSS spec treats
// it as "missing" for the purposes of interpolation, but for parsing
// into our canonical state zero is the right default) and percentages
// where the spec allows them.

import { registerCssParser } from "./index.js";

const WS = /\s+/;

function tokenize(body) {
	// Split on slashes (alpha separator), then on commas (legacy inside
	// the modern form, e.g. oklch() doesn't accept commas but rgb() modern
	// syntax does via the legacy parser). For Phase 4 we only split on
	// whitespace within each slash-part.
	const slashIdx = body.indexOf("/");
	let main = body;
	let alpha = null;
	if (slashIdx >= 0) {
		main = body.slice(0, slashIdx).trim();
		alpha = body.slice(slashIdx + 1).trim();
	}
	const parts = main.split(WS).filter(Boolean);
	if (alpha != null) parts.push(alpha);
	return parts;
}

function parseNumberOrNone(token) {
	if (token === "none") return 0;
	return parseFloat(token);
}

function parsePercentOrNumber(token, percentBase) {
	if (token === "none") return 0;
	if (token.endsWith("%")) {
		return (parseFloat(token.slice(0, -1)) / 100) * percentBase;
	}
	return parseFloat(token);
}

function parseAlpha(token) {
	if (token == null) return 1;
	if (token === "none") return 0;
	if (token.endsWith("%")) return parseFloat(token.slice(0, -1)) / 100;
	return parseFloat(token);
}

function parseHue(token) {
	if (token === "none") return 0;
	if (/turn$/i.test(token)) return parseFloat(token.slice(0, -4)) * 360;
	if (/rad$/i.test(token)) return (parseFloat(token.slice(0, -3)) * 180) / Math.PI;
	if (/deg$/i.test(token)) return parseFloat(token.slice(0, -3));
	return parseFloat(token);
}

function parseFnBody(input, name) {
	const lower = input.toLowerCase();
	const prefix = name + "(";
	if (!lower.startsWith(prefix) || !lower.endsWith(")")) return null;
	return input.slice(prefix.length, -1).trim();
}

function parseRgbModern(input) {
	// Modern `rgb()` only (slash alpha). Legacy comma form is handled
	// in parse/legacy.js. A modern form has no comma.
	const body = parseFnBody(input, "rgb");
	if (body == null) return null;
	if (body.indexOf(",") >= 0) return null;
	const parts = tokenize(body);
	if (parts.length !== 3 && parts.length !== 4) return null;
	const parse = (token) => {
		if (token === "none") return 0;
		if (token.endsWith("%")) return parseFloat(token.slice(0, -1)) / 100;
		return parseFloat(token) / 255;
	};
	const r = parse(parts[0]);
	const g = parse(parts[1]);
	const b = parse(parts[2]);
	const a = parts.length === 4 ? parseAlpha(parts[3]) : 1;
	if ([r, g, b, a].some(Number.isNaN)) return null;
	return { space: "srgb", coords: [r, g, b], alpha: a };
}

function parseHslModern(input) {
	const body = parseFnBody(input, "hsl");
	if (body == null) return null;
	if (body.indexOf(",") >= 0) return null;
	const parts = tokenize(body);
	if (parts.length !== 3 && parts.length !== 4) return null;
	const h = parseHue(parts[0]);
	const s = parsePercentOrNumber(parts[1], 100);
	const l = parsePercentOrNumber(parts[2], 100);
	const a = parts.length === 4 ? parseAlpha(parts[3]) : 1;
	if ([h, s, l, a].some(Number.isNaN)) return null;
	return { space: "hsl", coords: [h, s, l], alpha: a };
}

function parseHwb(input) {
	const body = parseFnBody(input, "hwb");
	if (body == null) return null;
	const parts = tokenize(body);
	if (parts.length !== 3 && parts.length !== 4) return null;
	const h = parseHue(parts[0]);
	const w = parsePercentOrNumber(parts[1], 100);
	const bl = parsePercentOrNumber(parts[2], 100);
	const a = parts.length === 4 ? parseAlpha(parts[3]) : 1;
	if ([h, w, bl, a].some(Number.isNaN)) return null;
	return { space: "hwb", coords: [h, w, bl], alpha: a };
}

function parseLab(input) {
	const body = parseFnBody(input, "lab");
	if (body == null) return null;
	const parts = tokenize(body);
	if (parts.length !== 3 && parts.length !== 4) return null;
	// CSS lab() L is 0..100 (number or percent of 100).
	const L = parsePercentOrNumber(parts[0], 100);
	// a, b are signed, ±125 (number or percent of 125).
	const a = parsePercentOrNumber(parts[1], 125);
	const b = parsePercentOrNumber(parts[2], 125);
	const alpha = parts.length === 4 ? parseAlpha(parts[3]) : 1;
	if ([L, a, b, alpha].some(Number.isNaN)) return null;
	// CSS lab() is D50.
	return { space: "lab-d50", coords: [L, a, b], alpha };
}

function parseLch(input) {
	const body = parseFnBody(input, "lch");
	if (body == null) return null;
	const parts = tokenize(body);
	if (parts.length !== 3 && parts.length !== 4) return null;
	const L = parsePercentOrNumber(parts[0], 100);
	const C = parsePercentOrNumber(parts[1], 150);
	const H = parseHue(parts[2]);
	const alpha = parts.length === 4 ? parseAlpha(parts[3]) : 1;
	if ([L, C, H, alpha].some(Number.isNaN)) return null;
	return { space: "lch-d50", coords: [L, C, H], alpha };
}

function parseOklab(input) {
	const body = parseFnBody(input, "oklab");
	if (body == null) return null;
	const parts = tokenize(body);
	if (parts.length !== 3 && parts.length !== 4) return null;
	// CSS oklab() L is 0..1 (percent 0..100% of 1).
	const L = parsePercentOrNumber(parts[0], 1);
	const a = parsePercentOrNumber(parts[1], 0.4);
	const b = parsePercentOrNumber(parts[2], 0.4);
	const alpha = parts.length === 4 ? parseAlpha(parts[3]) : 1;
	if ([L, a, b, alpha].some(Number.isNaN)) return null;
	return { space: "oklab", coords: [L, a, b], alpha };
}

function parseOklch(input) {
	const body = parseFnBody(input, "oklch");
	if (body == null) return null;
	const parts = tokenize(body);
	if (parts.length !== 3 && parts.length !== 4) return null;
	const L = parsePercentOrNumber(parts[0], 1);
	const C = parsePercentOrNumber(parts[1], 0.4);
	const H = parseHue(parts[2]);
	const alpha = parts.length === 4 ? parseAlpha(parts[3]) : 1;
	if ([L, C, H, alpha].some(Number.isNaN)) return null;
	return { space: "oklch", coords: [L, C, H], alpha };
}

// Map CSS color() space IDs to v3 registry ids.
const COLOR_FN_SPACES = {
	srgb: "srgb",
	"srgb-linear": "srgb-linear",
	"display-p3": "display-p3",
	rec2020: "rec2020",
	"a98-rgb": "a98",
	"prophoto-rgb": "prophoto",
	xyz: "xyz",
	"xyz-d65": "xyz",
	"xyz-d50": "xyz-d50"
};

function parseColorFn(input) {
	const body = parseFnBody(input, "color");
	if (body == null) return null;
	const parts = tokenize(body);
	if (parts.length < 4 || parts.length > 5) return null;
	const spaceToken = parts[0].toLowerCase();
	const spaceId = COLOR_FN_SPACES[spaceToken];
	if (!spaceId) return null;
	// Channels are numbers or percentages; percentages normalize to
	// [0, 1] in the space's natural domain. For XYZ the percent base is 1
	// per the CSS spec.
	const parseChannel = (token) => {
		if (token === "none") return 0;
		if (token.endsWith("%")) return parseFloat(token.slice(0, -1)) / 100;
		return parseFloat(token);
	};
	const c1 = parseChannel(parts[1]);
	const c2 = parseChannel(parts[2]);
	const c3 = parseChannel(parts[3]);
	const a = parts.length === 5 ? parseAlpha(parts[4]) : 1;
	if ([c1, c2, c3, a].some(Number.isNaN)) return null;
	return { space: spaceId, coords: [c1, c2, c3], alpha: a };
}

export function parseCss(input) {
	if (typeof input !== "string") return null;
	const trimmed = input.trim();
	const lower = trimmed.toLowerCase();
	// Quick prefix switch.
	if (lower.startsWith("rgb(")) return parseRgbModern(trimmed);
	if (lower.startsWith("hsl(")) return parseHslModern(trimmed);
	if (lower.startsWith("hwb(")) return parseHwb(trimmed);
	if (lower.startsWith("lab(")) return parseLab(trimmed);
	if (lower.startsWith("lch(")) return parseLch(trimmed);
	if (lower.startsWith("oklab(")) return parseOklab(trimmed);
	if (lower.startsWith("oklch(")) return parseOklch(trimmed);
	if (lower.startsWith("color(")) return parseColorFn(trimmed);
	return null;
}

// Register as the primary CSS parser so parse/index.js dispatches here
// before falling through to the legacy rgb/hsl matchers.
registerCssParser(parseCss);
