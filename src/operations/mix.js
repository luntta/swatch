// Mix (lerp) and average operations.
//
// `mix(a, b, amount, { space })` interpolates between two colors in the
// given color space. `amount` is 0..1 (0 = a, 1 = b). Default space is
// `'oklab'` since linear interpolation there is perceptually meaningful.
//
// Polar spaces (hsl, hsv, hwb, lch, oklch, hsluv) use shortest-arc hue
// interpolation — the hue walks the smaller of the two directions
// around the 360° circle.
//
// `average(colors, { space })` is the multi-color analogue: take the
// arithmetic mean of the coord arrays in the given space. Hue is
// averaged as a unit-vector sum (handles wrap-around correctly).

import { Swatch, swatch } from "../core/swatch-class.js";
import { clamp } from "../util/math.js";

const POLAR_SPACES = new Set([
	"hsl",
	"hsv",
	"hwb",
	"lch",
	"lch-d50",
	"oklch",
	"hsluv"
]);

// Each polar space has its hue as channel 0 except for lch/oklch which
// have L/C/H — hue is channel 2.
const HUE_INDEX = {
	hsl: 0,
	hsv: 0,
	hwb: 0,
	hsluv: 0,
	lch: 2,
	"lch-d50": 2,
	oklch: 2
};

function lerp(a, b, t) {
	return a + (b - a) * t;
}

function lerpHueShortest(a, b, t) {
	let dh = b - a;
	if (dh > 180) dh -= 360;
	else if (dh < -180) dh += 360;
	let h = a + dh * t;
	if (h < 0) h += 360;
	if (h >= 360) h -= 360;
	return h;
}

function toSwatch(input) {
	return input instanceof Swatch ? input : swatch(input);
}

export function mix(a, b, amount = 0.5, opts = {}) {
	const spaceId = opts.space || "oklab";
	const t = clamp(amount, 0, 1);
	const as = toSwatch(a);
	const bs = toSwatch(b);
	const ac = as._getCoordsIn(spaceId);
	const bc = bs._getCoordsIn(spaceId);
	const alpha = as.alpha + (bs.alpha - as.alpha) * t;

	const out = [ac[0], ac[1], ac[2]];
	if (POLAR_SPACES.has(spaceId)) {
		const hIdx = HUE_INDEX[spaceId];
		for (let i = 0; i < 3; i++) {
			if (i === hIdx) out[i] = lerpHueShortest(ac[i], bc[i], t);
			else out[i] = lerp(ac[i], bc[i], t);
		}
	} else {
		out[0] = lerp(ac[0], bc[0], t);
		out[1] = lerp(ac[1], bc[1], t);
		out[2] = lerp(ac[2], bc[2], t);
	}

	return new Swatch({ space: spaceId, coords: out, alpha });
}

// Hue average as unit-vector sum — handles wrap-around correctly
// (averaging 350° and 10° should give 0°, not 180°).
function averageHue(hues) {
	let x = 0;
	let y = 0;
	for (const h of hues) {
		const rad = (h * Math.PI) / 180;
		x += Math.cos(rad);
		y += Math.sin(rad);
	}
	let result = (Math.atan2(y, x) * 180) / Math.PI;
	if (result < 0) result += 360;
	return result;
}

export function average(inputs, opts = {}) {
	const spaceId = opts.space || "oklab";
	if (!Array.isArray(inputs) || inputs.length === 0) {
		throw new Error("average: inputs must be a non-empty array");
	}
	const swatches = inputs.map(toSwatch);
	const n = swatches.length;
	const coords = swatches.map((s) => s._getCoordsIn(spaceId));
	const alphas = swatches.map((s) => s.alpha);

	const out = [0, 0, 0];
	if (POLAR_SPACES.has(spaceId)) {
		const hIdx = HUE_INDEX[spaceId];
		for (let i = 0; i < 3; i++) {
			if (i === hIdx) {
				out[i] = averageHue(coords.map((c) => c[i]));
			} else {
				let sum = 0;
				for (const c of coords) sum += c[i];
				out[i] = sum / n;
			}
		}
	} else {
		for (let i = 0; i < 3; i++) {
			let sum = 0;
			for (const c of coords) sum += c[i];
			out[i] = sum / n;
		}
	}
	const alpha = alphas.reduce((a, b) => a + b, 0) / n;
	return new Swatch({ space: spaceId, coords: out, alpha });
}
