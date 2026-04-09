// WCAG 2.1 accessibility helpers.
//
//   luminance(c)     — relative luminance (Y) per WCAG 2.1
//   contrast(a, b)   — WCAG contrast ratio, symmetric, clamped ≥ 1
//   isReadable(a, b, { level, size }) — checks WCAG AA/AAA thresholds
//   ensureContrast(a, b, { minRatio, direction, step }) —
//     walks HSL L (preserving hue/saturation) until the ratio meets
//     the target. Future: add { space: 'oklch' } to walk OKLCh L.
//
// These operate on sRGB (legacy .rgb view); wide-gamut inputs are
// gamut-mapped first via the .srgb getter.

import { Swatch, swatch } from "../core/swatch-class.js";

function toSwatch(input) {
	return input instanceof Swatch ? input : swatch(input);
}

// WCAG 2.1 relative luminance from gamma-encoded sRGB in [0,1].
export function luminance(input) {
	const s = toSwatch(input);
	const { r, g, b } = s.srgb;
	const rl =
		r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
	const gl =
		g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
	const bl =
		b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
	return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

export function contrast(a, b) {
	const la = luminance(a);
	const lb = luminance(b);
	const ratio = (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
	return ratio;
}

// Thresholds:
//   normal AA = 4.5, normal AAA = 7
//   large  AA = 3,   large  AAA = 4.5
//   ui       = 3 (AA only per WCAG 2.1)
export function isReadable(a, b, { level = "AA", size = "normal" } = {}) {
	let threshold;
	if (size === "large") {
		threshold = level === "AAA" ? 4.5 : 3;
	} else if (size === "ui") {
		threshold = 3;
	} else {
		threshold = level === "AAA" ? 7 : 4.5;
	}
	return contrast(a, b) >= threshold;
}

// Walk the HSL L of `color` until contrast against `other` meets
// `minRatio`. If one direction fails, try the other; if neither
// succeeds, fall back to pure white or black.
export function ensureContrast(
	color,
	other,
	{ minRatio = 4.5, direction = "auto", step = 1 } = {}
) {
	const cs = toSwatch(color);
	const os = toSwatch(other);

	if (contrast(cs, os) >= minRatio) return cs;

	let dir = direction;
	if (dir === "auto") {
		dir = luminance(os) > 0.5 ? "darker" : "lighter";
	}

	const baseHsl = cs.hsl;

	function tryWalk(sign) {
		let l = baseHsl.l;
		while (true) {
			l += sign * step;
			if (l < 0 || l > 100) return null;
			const candidate = swatch({
				space: "hsl",
				coords: [baseHsl.h, baseHsl.s, l],
				alpha: cs.alpha
			});
			if (contrast(candidate, os) >= minRatio) return candidate;
		}
	}

	const primary = tryWalk(dir === "lighter" ? 1 : -1);
	if (primary) return primary;
	const fallback = tryWalk(dir === "lighter" ? -1 : 1);
	if (fallback) return fallback;

	return swatch(luminance(os) > 0.5 ? "#000000" : "#ffffff");
}
