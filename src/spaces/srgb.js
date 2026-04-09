// sRGB and linear-light sRGB spaces.
//
// Two spaces are registered:
//
//   srgb         — gamma-encoded sRGB, coords in [0, 1] (not 0..255).
//   srgb-linear  — linear-light sRGB (gamma removed), coords in [0, 1].
//
// Keeping the coords in [0, 1] rather than 0..255 is the CSS Color 4 /
// colorjs.io convention; 0..255 is a *view* exposed by the legacy `.rgb`
// getter on the Swatch class, not the canonical storage.
//
// The sRGB transfer function uses the piecewise approximation with the
// standard 0.03928 knee. The primaries matrix (sRGB linear → XYZ D65) is the
// BT.709 reference, identical to what v2 used in _tMatrixRGBToXYZ.

import { multiplyMatrixVector, invertMatrix } from "../util/matrix.js";
import { registerSpace } from "../core/registry.js";

// sRGB inverse EOTF: gamma-encoded → linear light.
export function srgbToLinear(rgb) {
	const f = (v) =>
		Math.abs(v) <= 0.04045
			? v / 12.92
			: Math.sign(v) * Math.pow((Math.abs(v) + 0.055) / 1.055, 2.4);
	return [f(rgb[0]), f(rgb[1]), f(rgb[2])];
}

// sRGB EOTF: linear light → gamma-encoded.
export function linearToSrgb(lin) {
	const f = (v) =>
		Math.abs(v) <= 0.0031308
			? 12.92 * v
			: Math.sign(v) * (1.055 * Math.pow(Math.abs(v), 1 / 2.4) - 0.055);
	return [f(lin[0]), f(lin[1]), f(lin[2])];
}

// Linear sRGB → CIE XYZ D65. BT.709 primaries, same values as v2's
// _tMatrixRGBToXYZ (src/swatch.js:1737-1743).
export const LINEAR_SRGB_TO_XYZ_D65 = [
	[0.4124564, 0.3575761, 0.1804375],
	[0.2126729, 0.7151522, 0.072175],
	[0.0193339, 0.119192, 0.9503041]
];

export const XYZ_D65_TO_LINEAR_SRGB = invertMatrix(LINEAR_SRGB_TO_XYZ_D65);

export function linearSrgbToXyz(lin) {
	return multiplyMatrixVector(LINEAR_SRGB_TO_XYZ_D65, lin);
}

export function xyzToLinearSrgb(xyz) {
	return multiplyMatrixVector(XYZ_D65_TO_LINEAR_SRGB, xyz);
}

registerSpace({
	id: "srgb-linear",
	channels: ["r", "g", "b"],
	ranges: [
		[0, 1],
		[0, 1],
		[0, 1]
	],
	white: "D65",
	toXYZ: (coords) => linearSrgbToXyz(coords),
	fromXYZ: (xyz) => xyzToLinearSrgb(xyz),
	shortcuts: {
		srgb: (coords) => linearToSrgb(coords)
	}
});

registerSpace({
	id: "srgb",
	channels: ["r", "g", "b"],
	ranges: [
		[0, 1],
		[0, 1],
		[0, 1]
	],
	white: "D65",
	toXYZ: (coords) => linearSrgbToXyz(srgbToLinear(coords)),
	fromXYZ: (xyz) => linearToSrgb(xyzToLinearSrgb(xyz)),
	shortcuts: {
		"srgb-linear": (coords) => srgbToLinear(coords)
	}
});
