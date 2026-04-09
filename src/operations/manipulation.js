// OKLCh-based perceptual manipulation.
//
// BREAKING CHANGE from v2: `lighten`/`darken`/`saturate` all operate on
// OKLCh coordinates instead of HSL. Amounts are in the native OKLCh
// unit (L is 0..1, C is the absolute chroma, H is degrees), NOT the
// v2 0..100 percent scale. See MIGRATING.md.
//
// Rationale: HSL's "lightness" is not perceptually uniform — lightening
// yellow and blue by 10% HSL lightness produces very different visual
// lightness changes. OKLCh is designed to be perceptually uniform so
// the same numeric delta produces the same perceived change.
//
// Each operation returns a new Swatch. By default the result is passed
// through `toGamut('srgb')` so you still get a displayable sRGB color;
// pass `{ gamut: false }` to keep the raw OKLCh result (useful when
// chaining further operations).

import { Swatch } from "../core/swatch-class.js";
import { toGamut } from "./gamut.js";

const DEFAULT_LIGHTEN = 0.1;
const DEFAULT_SATURATE = 0.05;

function applyOklch(swatch, mutator, opts = {}) {
	const oklch = swatch._getCoordsIn("oklch");
	const out = mutator(oklch.slice());
	const result = new Swatch({
		space: "oklch",
		coords: out,
		alpha: swatch.alpha
	});
	if (opts.gamut === false) return result;
	return toGamut(result, { space: "srgb" });
}

export function lighten(swatch, amount = DEFAULT_LIGHTEN, opts) {
	return applyOklch(
		swatch,
		(c) => {
			c[0] = Math.min(1, Math.max(0, c[0] + amount));
			return c;
		},
		opts
	);
}

export function darken(swatch, amount = DEFAULT_LIGHTEN, opts) {
	return lighten(swatch, -amount, opts);
}

export function saturate(swatch, amount = DEFAULT_SATURATE, opts) {
	return applyOklch(
		swatch,
		(c) => {
			c[1] = Math.max(0, c[1] + amount);
			return c;
		},
		opts
	);
}

export function desaturate(swatch, amount = DEFAULT_SATURATE, opts) {
	return saturate(swatch, -amount, opts);
}

export function spin(swatch, degrees, opts) {
	return applyOklch(
		swatch,
		(c) => {
			c[2] = ((c[2] + degrees) % 360 + 360) % 360;
			return c;
		},
		opts
	);
}

export function greyscale(swatch, opts) {
	return applyOklch(
		swatch,
		(c) => {
			c[1] = 0;
			return c;
		},
		opts
	);
}

export function complement(swatch, opts) {
	return spin(swatch, 180, opts);
}

export function invert(swatch) {
	// sRGB channel inversion — unchanged from v2 semantics.
	const { r, g, b } = swatch.srgb;
	return new Swatch({
		space: "srgb",
		coords: [1 - r, 1 - g, 1 - b],
		alpha: swatch.alpha
	});
}
