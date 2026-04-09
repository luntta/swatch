// Random color generation.
//
//   swatch.random()
//     Uniform random sRGB color.
//
//   swatch.random({ space, hue, lightness, chroma, saturation, seed })
//     Constrained random color in the chosen space ('oklch' or 'hsl').
//     Each of `hue`, `lightness`, `chroma`, `saturation` is either a
//     single number (fixed) or a [min, max] tuple (uniform range). If
//     `seed` is given, an xorshift32 PRNG is used for reproducibility;
//     otherwise Math.random() is used.
//
// Unknown constraint keys for the current space are ignored.

import { Swatch } from "../core/swatch-class.js";

function xorshift32(seed) {
	// Classic xorshift32 PRNG. Seed must be a non-zero 32-bit integer;
	// if the caller passes 0 we nudge it to 1.
	let s = seed | 0;
	if (s === 0) s = 1;
	return function next() {
		s ^= s << 13;
		s ^= s >>> 17;
		s ^= s << 5;
		// Map to [0, 1). Shift into positive and divide by 2^32.
		return (s >>> 0) / 0x100000000;
	};
}

function pick(rng, value, defaultRange) {
	if (value == null) {
		const [lo, hi] = defaultRange;
		return lo + rng() * (hi - lo);
	}
	if (typeof value === "number") return value;
	if (Array.isArray(value) && value.length === 2) {
		const [lo, hi] = value;
		if (lo === hi) return lo;
		return lo + rng() * (hi - lo);
	}
	throw new Error("random: constraints must be a number or [min, max]");
}

export function random(opts = {}) {
	const rng = opts.seed != null ? xorshift32(opts.seed) : Math.random;
	const space = opts.space;

	if (!space) {
		// Uniform sRGB.
		const r = rng();
		const g = rng();
		const b = rng();
		return new Swatch({ space: "srgb", coords: [r, g, b], alpha: 1 });
	}

	if (space === "oklch") {
		const l = pick(rng, opts.lightness, [0, 1]);
		const c = pick(rng, opts.chroma, [0, 0.4]);
		const h = pick(rng, opts.hue, [0, 360]);
		return new Swatch({ space: "oklch", coords: [l, c, h], alpha: 1 });
	}

	if (space === "hsl") {
		// HSL stores S/L as percent (0..100) per CSS convention.
		// Callers can pass either percent ([0, 100]) or any tuple
		// consistent with the HSL registration.
		const h = pick(rng, opts.hue, [0, 360]);
		const s = pick(rng, opts.saturation, [0, 100]);
		const l = pick(rng, opts.lightness, [0, 100]);
		return new Swatch({ space: "hsl", coords: [h, s, l], alpha: 1 });
	}

	throw new Error(`random: unsupported space "${space}"`);
}
