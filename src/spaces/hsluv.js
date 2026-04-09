// HSLuv — perceptually uniform alternative to HSL.
//
// Ported from the canonical reference at https://github.com/hsluv/hsluv
// (Alexei Boronine, MIT License). HSLuv is CIELuv under a polar
// transform with the chroma normalized against the maximum possible
// chroma for each (L, H) in the sRGB gamut — so S = 100 always means
// "as saturated as sRGB will allow" at that lightness/hue, and lines
// of constant L are perceptually flat.
//
// The intermediate CIELuv space is registered too (as id 'luv').
//
// We register HSLuv with a direct srgb shortcut so there is no
// precision-losing round-trip through the generic XYZ hub when the
// user reads `.hsluv` or calls `.to('hsluv')` from an sRGB source.

import { registerSpace, getSpace } from "../core/registry.js";

// sRGB linear ↔ XYZ matrices per the HSLuv reference (BT.709,
// numerically identical to src/spaces/srgb.js within ~1e-6).
const M = [
	[3.240969941904521, -1.537383177570093, -0.498610760293],
	[-0.96924363628087, 1.87596750150772, 0.041555057407175],
	[0.055630079696993, -0.20397695888897, 1.056971514242878]
];
const M_INV = [
	[0.41239079926595, 0.35758433938387, 0.18048078840183],
	[0.21263900587151, 0.71516867876775, 0.07219231536073],
	[0.01933081871559, 0.11919477979462, 0.9505321522496]
];

const REF_U = 0.19783000664283;
const REF_V = 0.46831999493879;
const KAPPA = 903.2962962;
const EPSILON = 0.0088564516;

function dotProduct(row, v) {
	return row[0] * v[0] + row[1] * v[1] + row[2] * v[2];
}

function srgbLinearToRgb(lin) {
	// Matches the sRGB EOTF; copied here so hsluv is self-contained.
	const f = (v) =>
		Math.abs(v) <= 0.0031308
			? 12.92 * v
			: Math.sign(v) * (1.055 * Math.pow(Math.abs(v), 1 / 2.4) - 0.055);
	return [f(lin[0]), f(lin[1]), f(lin[2])];
}

function rgbToSrgbLinear(rgb) {
	const f = (v) =>
		Math.abs(v) <= 0.04045
			? v / 12.92
			: Math.sign(v) * Math.pow((Math.abs(v) + 0.055) / 1.055, 2.4);
	return [f(rgb[0]), f(rgb[1]), f(rgb[2])];
}

// Get the 6 lines in the (u, v) plane that bound the sRGB gamut for
// the given L value.
function getBounds(L) {
	const result = [];
	const sub1 = Math.pow(L + 16, 3) / 1560896;
	const sub2 = sub1 > EPSILON ? sub1 : L / KAPPA;
	for (let channel = 0; channel < 3; channel++) {
		const m1 = M[channel][0];
		const m2 = M[channel][1];
		const m3 = M[channel][2];
		for (let t = 0; t < 2; t++) {
			const top1 = (284517 * m1 - 94839 * m3) * sub2;
			const top2 =
				(838422 * m3 + 769860 * m2 + 731718 * m1) * L * sub2 - 769860 * t * L;
			const bottom = (632260 * m3 - 126452 * m2) * sub2 + 126452 * t;
			result.push({ slope: top1 / bottom, intercept: top2 / bottom });
		}
	}
	return result;
}

function lengthOfRayUntilIntersect(theta, line) {
	return line.intercept / (Math.sin(theta) - line.slope * Math.cos(theta));
}

function maxChromaForLH(L, H) {
	const hrad = (H / 360) * Math.PI * 2;
	let min = Infinity;
	for (const bound of getBounds(L)) {
		const length = lengthOfRayUntilIntersect(hrad, bound);
		if (length >= 0 && length < min) min = length;
	}
	return min;
}

function yToL(Y) {
	if (Y <= EPSILON) return Y * KAPPA;
	return 116 * Math.cbrt(Y) - 16;
}

function lToY(L) {
	if (L <= 8) return L / KAPPA;
	return Math.pow((L + 16) / 116, 3);
}

// XYZ (D65, Y=1 for white) → CIELuv.
export function xyzToLuv(xyz) {
	const [X, Y, Z] = xyz;
	const divisor = X + 15 * Y + 3 * Z;
	if (divisor === 0) return [0, 0, 0];
	const varU = (4 * X) / divisor;
	const varV = (9 * Y) / divisor;
	const L = yToL(Y);
	if (L === 0) return [0, 0, 0];
	const U = 13 * L * (varU - REF_U);
	const V = 13 * L * (varV - REF_V);
	return [L, U, V];
}

export function luvToXyz(luv) {
	const [L, U, V] = luv;
	if (L === 0) return [0, 0, 0];
	const varU = U / (13 * L) + REF_U;
	const varV = V / (13 * L) + REF_V;
	const Y = lToY(L);
	const X = -(9 * Y * varU) / ((varU - 4) * varV - varU * varV);
	const Z = (9 * Y - 15 * varV * Y - varV * X) / (3 * varV);
	return [X, Y, Z];
}

function luvToLchuv(luv) {
	const [L, U, V] = luv;
	const C = Math.sqrt(U * U + V * V);
	let H;
	if (C < 1e-8) {
		H = 0;
	} else {
		H = (Math.atan2(V, U) * 180) / Math.PI;
		if (H < 0) H += 360;
	}
	return [L, C, H];
}

function lchuvToLuv(lch) {
	const [L, C, H] = lch;
	const hrad = (H * Math.PI) / 180;
	return [L, Math.cos(hrad) * C, Math.sin(hrad) * C];
}

function hsluvToLchuv(hsl) {
	const [H, S, L] = hsl;
	if (L > 99.9999999) return [100, 0, H];
	if (L < 0.00000001) return [0, 0, H];
	const max = maxChromaForLH(L, H);
	const C = (max / 100) * S;
	return [L, C, H];
}

function lchuvToHsluv(lch) {
	const [L, C, H] = lch;
	if (L > 99.9999999) return [H, 0, 100];
	if (L < 0.00000001) return [H, 0, 0];
	const max = maxChromaForLH(L, H);
	const S = (C / max) * 100;
	return [H, S, L];
}

// HSLuv → sRGB (using HSLuv's internal matrices).
export function hsluvToSrgb(hsluv) {
	const lch = hsluvToLchuv(hsluv);
	const luv = lchuvToLuv(lch);
	const xyz = luvToXyz(luv);
	const lin = [dotProduct(M[0], xyz), dotProduct(M[1], xyz), dotProduct(M[2], xyz)];
	return srgbLinearToRgb(lin);
}

export function srgbToHsluv(rgb) {
	const lin = rgbToSrgbLinear(rgb);
	const xyz = [
		dotProduct(M_INV[0], lin),
		dotProduct(M_INV[1], lin),
		dotProduct(M_INV[2], lin)
	];
	const luv = xyzToLuv(xyz);
	const lch = luvToLchuv(luv);
	return lchuvToHsluv(lch);
}

// Register CIELuv as a standalone space.
registerSpace({
	id: "luv",
	channels: ["l", "u", "v"],
	white: "D65",
	toXYZ: (coords) => luvToXyz(coords),
	fromXYZ: (xyz) => xyzToLuv(xyz)
});

// Register HSLuv with a direct sRGB shortcut.
registerSpace({
	id: "hsluv",
	channels: ["h", "s", "l"],
	ranges: [
		[0, 360],
		[0, 100],
		[0, 100]
	],
	white: "D65",
	toXYZ: (coords) => getSpace("srgb").toXYZ(hsluvToSrgb(coords)),
	fromXYZ: (xyz) => srgbToHsluv(getSpace("srgb").fromXYZ(xyz)),
	shortcuts: {
		srgb: (coords) => hsluvToSrgb(coords)
	}
});

getSpace("srgb").shortcuts.hsluv = (coords) => srgbToHsluv(coords);
