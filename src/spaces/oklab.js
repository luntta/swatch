// OKLab — Björn Ottosson (2020), "A perceptual color space for image processing".
//
// L is on 0..1 (roughly maps to L* 0..100 perceptually). a and b are signed,
// typically in [-0.4, 0.4].
//
// The transform is defined from linear sRGB directly, so we register a
// direct shortcut `srgb-linear ↔ oklab` that bypasses the XYZ hub for
// accuracy and speed. v2's `_linearRGBToOklab` (src/swatch.js:1495-1516)
// and `_oklabToRGB` (src/swatch.js:1131-1150) supply the exact same
// coefficients.

import { registerSpace, getSpace } from "../core/registry.js";

// Linear sRGB → OKLab.
export function linearSrgbToOklab(lin) {
	const l =
		0.4122214708 * lin[0] +
		0.5363325363 * lin[1] +
		0.0514459929 * lin[2];
	const m =
		0.2119034982 * lin[0] +
		0.6806995451 * lin[1] +
		0.1073969566 * lin[2];
	const s =
		0.0883024619 * lin[0] +
		0.2817188376 * lin[1] +
		0.6299787005 * lin[2];
	const lp = Math.cbrt(l);
	const mp = Math.cbrt(m);
	const sp = Math.cbrt(s);
	return [
		0.2104542553 * lp + 0.793617785 * mp - 0.0040720468 * sp,
		1.9779984951 * lp - 2.428592205 * mp + 0.4505937099 * sp,
		0.0259040371 * lp + 0.7827717662 * mp - 0.808675766 * sp
	];
}

// OKLab → linear sRGB. Inverse of the transform above.
export function oklabToLinearSrgb(ok) {
	const lp = ok[0] + 0.3963377774 * ok[1] + 0.2158037573 * ok[2];
	const mp = ok[0] - 0.1055613458 * ok[1] - 0.0638541728 * ok[2];
	const sp = ok[0] - 0.0894841775 * ok[1] - 1.291485548 * ok[2];
	const l = lp * lp * lp;
	const m = mp * mp * mp;
	const s = sp * sp * sp;
	return [
		4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
		-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
		-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
	];
}

registerSpace({
	id: "oklab",
	channels: ["l", "a", "b"],
	ranges: [
		[0, 1],
		[-0.4, 0.4],
		[-0.4, 0.4]
	],
	white: "D65",
	toXYZ: (coords) => {
		const lin = oklabToLinearSrgb(coords);
		return getSpace("srgb-linear").toXYZ(lin);
	},
	fromXYZ: (xyz) => {
		const lin = getSpace("srgb-linear").fromXYZ(xyz);
		return linearSrgbToOklab(lin);
	},
	shortcuts: {
		"srgb-linear": (coords) => oklabToLinearSrgb(coords)
	}
});

// Add the reverse shortcut on srgb-linear. We can't do this at the
// srgb-linear registration site without a circular dependency, so we
// patch it here after both spaces exist.
getSpace("srgb-linear").shortcuts.oklab = (coords) =>
	linearSrgbToOklab(coords);
