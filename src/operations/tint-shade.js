// Tint / shade / tone helpers.
//
// All three operations are OKLab linear interpolations between the
// source and a reference color:
//
//   tint(c, t)   mixes toward white        — OKLab (1, 0, 0)
//   shade(c, t)  mixes toward black        — OKLab (0, 0, 0)
//   tone(c, t)   mixes toward mid-gray     — OKLab (0.5, 0, 0)
//
// Amount is a 0..1 fraction: 0 is identity, 1 is fully at the reference.
//
// OKLab is used instead of sRGB so tints/shades stay on a visually
// straight line and mid-gray is perceptually mid.

import { Swatch } from "../core/swatch-class.js";

function lerpOklab(swatch, targetLab, amount) {
	const src = swatch._getCoordsIn("oklab");
	const t = amount;
	const lerp = (a, b) => a + (b - a) * t;
	return new Swatch({
		space: "oklab",
		coords: [
			lerp(src[0], targetLab[0]),
			lerp(src[1], targetLab[1]),
			lerp(src[2], targetLab[2])
		],
		alpha: swatch.alpha
	});
}

export function tint(swatch, amount = 0.1) {
	return lerpOklab(swatch, [1, 0, 0], amount);
}

export function shade(swatch, amount = 0.1) {
	return lerpOklab(swatch, [0, 0, 0], amount);
}

export function tone(swatch, amount = 0.1) {
	return lerpOklab(swatch, [0.5, 0, 0], amount);
}
