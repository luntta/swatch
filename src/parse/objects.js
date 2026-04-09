// Object-literal input parsing.
//
// Accepts:
//
//   { space, coords, alpha? }        — canonical v3 form
//   { r, g, b, a? }                  — sRGB-255 object (legacy v2)
//   { h, s, l, a? }                  — HSL object (legacy v2)
//   { h, s, v, a? }                  — HSV object
//   { h, w, b, a? }                  — HWB object
//   { l, a, b, alpha? }              — CIE Lab D65
//   { l, c, h, alpha? }              — generic LCh — ambiguous between CIE
//                                      and OK until disambiguated by the
//                                      `space` hint; defaults to OKLCh
//                                      when L ≤ 1 and CIE LCh when L > 1
//
// Returns a v3 state object or null if the input shape doesn't match.

const HAS = Object.prototype.hasOwnProperty;

export function parseObject(input) {
	if (input === null || typeof input !== "object") return null;

	// Canonical v3 form.
	if (HAS.call(input, "space") && HAS.call(input, "coords")) {
		const coords = input.coords;
		if (!Array.isArray(coords) || coords.length !== 3) return null;
		const alpha =
			input.alpha != null ? input.alpha : input.a != null ? input.a : 1;
		return {
			space: String(input.space),
			coords: [+coords[0], +coords[1], +coords[2]],
			alpha: +alpha
		};
	}

	// Legacy RGB-255 object.
	if (HAS.call(input, "r") && HAS.call(input, "g") && HAS.call(input, "b")) {
		const alpha = input.a != null ? +input.a : 1;
		return {
			space: "srgb",
			coords: [+input.r / 255, +input.g / 255, +input.b / 255],
			alpha
		};
	}

	// HSL legacy object (also supports HSLuv later when that space registers,
	// but the built-in HSL is the common case).
	if (HAS.call(input, "h") && HAS.call(input, "s") && HAS.call(input, "l")) {
		const alpha = input.a != null ? +input.a : 1;
		return {
			space: "hsl",
			coords: [+input.h, +input.s, +input.l],
			alpha
		};
	}

	// HSV object.
	if (HAS.call(input, "h") && HAS.call(input, "s") && HAS.call(input, "v")) {
		const alpha = input.a != null ? +input.a : 1;
		return {
			space: "hsv",
			coords: [+input.h, +input.s, +input.v],
			alpha
		};
	}

	// HWB object. Collision with { h, s, b } for HSB isn't a real problem
	// because HWB's key order is h/w/b and HSB is spelled h/s/v in practice.
	if (HAS.call(input, "h") && HAS.call(input, "w") && HAS.call(input, "b")) {
		const alpha = input.a != null ? +input.a : 1;
		return {
			space: "hwb",
			coords: [+input.h, +input.w, +input.b],
			alpha
		};
	}

	// CIE Lab D65 (L/a/b). Ambiguous vs OKLab; we pick CIE Lab here because
	// OKLab users should use the explicit { space: 'oklab', coords: [...] }
	// form (OKLab L is in 0..1, CIE Lab L in 0..100 — enforcing that via
	// this parser would be surprising).
	if (HAS.call(input, "l") && HAS.call(input, "a") && HAS.call(input, "b")) {
		const alpha = input.alpha != null ? +input.alpha : 1;
		return {
			space: "lab",
			coords: [+input.l, +input.a, +input.b],
			alpha
		};
	}

	// CIE LCh / OKLCh. Disambiguate by L magnitude: CIE LCh has L in 0..100,
	// OKLCh L in 0..1. Callers who want to force a choice should pass the
	// explicit { space, coords } form.
	if (HAS.call(input, "l") && HAS.call(input, "c") && HAS.call(input, "h")) {
		const alpha = input.alpha != null ? +input.alpha : 1;
		const space = +input.l > 1 ? "lch" : "oklch";
		return {
			space,
			coords: [+input.l, +input.c, +input.h],
			alpha
		};
	}

	// CMYK object. Stored as the 3-channel "folded K" representation so it
	// fits the canonical state shape; see src/spaces/cmyk.js.
	if (
		HAS.call(input, "c") &&
		HAS.call(input, "m") &&
		HAS.call(input, "y") &&
		HAS.call(input, "k")
	) {
		const alpha = input.alpha != null ? +input.alpha : input.a != null ? +input.a : 1;
		const c = +input.c;
		const m = +input.m;
		const y = +input.y;
		const k = +input.k;
		return {
			space: "cmyk",
			coords: [c + k - c * k, m + k - m * k, y + k - y * k],
			alpha
		};
	}

	return null;
}
