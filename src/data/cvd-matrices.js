// CVD (Color Vision Deficiency) simulation matrices.
//
// We build dichromat projection matrices in linear sRGB space by
// lifting the LMS plane projection through standard linear-RGB ↔ LMS
// transforms:
//
//   M_RGB = M_LMS→RGB · M_dichromat_LMS · M_RGB→LMS
//
// The LMS plane for each dichromat type is constructed via the
// Brettel/Viénot anchor-line method: the plane passes through white
// and a confusion-line anchor (blue for protan/deutan, red for
// tritan). The missing cone's response is reconstructed as
// a·X + b·Y in LMS space, solved via Cramer's rule.

import { multiplyMatrices, invertMatrix } from "../util/matrix.js";

// sRGB→XYZ (D65), ported from src/swatch.js:1737-1743.
const M_RGB_TO_XYZ = [
	[0.4124564, 0.3575761, 0.1804375],
	[0.2126729, 0.7151522, 0.072175],
	[0.0193339, 0.119192, 0.9503041]
];

// Hunt-Pointer-Estevez XYZ→LMS (normalized to equal-energy).
const M_XYZ_TO_LMS = [
	[0.4002, 0.7076, -0.0808],
	[-0.2263, 1.1653, 0.0457],
	[0, 0, 0.9182]
];

export const M_LINEAR_RGB_TO_LMS = multiplyMatrices(
	M_XYZ_TO_LMS,
	M_RGB_TO_XYZ
);
export const M_LMS_TO_LINEAR_RGB = invertMatrix(M_LINEAR_RGB_TO_LMS);

function mat3mul3(M, v) {
	return [
		M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2],
		M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2],
		M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2]
	];
}

function linearRgbToLms(rgb) {
	return mat3mul3(M_LINEAR_RGB_TO_LMS, rgb);
}

// LMS primaries used as dichromat anchors.
const blueLms = linearRgbToLms([0, 0, 1]);
const redLms = linearRgbToLms([1, 0, 0]);
const whiteLms = linearRgbToLms([1, 1, 1]);

// Protan: L is missing → L = a·M + b·S, anchor = blue.
function dichromatProtanopia() {
	const wL = whiteLms[0],
		wM = whiteLms[1],
		wS = whiteLms[2];
	const bL = blueLms[0],
		bM = blueLms[1],
		bS = blueLms[2];
	const det = wM * bS - bM * wS;
	const a = (wL * bS - bL * wS) / det;
	const b = (wM * bL - bM * wL) / det;
	return [
		[0, a, b],
		[0, 1, 0],
		[0, 0, 1]
	];
}

// Deutan: M is missing → M = a·L + b·S, anchor = blue.
function dichromatDeuteranopia() {
	const wL = whiteLms[0],
		wM = whiteLms[1],
		wS = whiteLms[2];
	const bL = blueLms[0],
		bM = blueLms[1],
		bS = blueLms[2];
	const det = wL * bS - bL * wS;
	const a = (wM * bS - bM * wS) / det;
	const b = (wL * bM - bL * wM) / det;
	return [
		[1, 0, 0],
		[a, 0, b],
		[0, 0, 1]
	];
}

// Tritan: S is missing → S = a·L + b·M, anchor = red.
function dichromatTritanopia() {
	const wL = whiteLms[0],
		wM = whiteLms[1];
	const rL = redLms[0],
		rM = redLms[1],
		rS = redLms[2];
	const det = wL * rM - rL * wM;
	const a = (whiteLms[2] * rM - rS * wM) / det;
	const b = (wL * rS - rL * whiteLms[2]) / det;
	return [
		[1, 0, 0],
		[0, 1, 0],
		[a, b, 0]
	];
}

function buildRgbMatrix(dichromatLms) {
	return multiplyMatrices(
		M_LMS_TO_LINEAR_RGB,
		multiplyMatrices(dichromatLms, M_LINEAR_RGB_TO_LMS)
	);
}

export const CVD_RGB_MATRICES = {
	protan: buildRgbMatrix(dichromatProtanopia()),
	deutan: buildRgbMatrix(dichromatDeuteranopia()),
	tritan: buildRgbMatrix(dichromatTritanopia())
};

export function normalizeCVDType(type) {
	if (typeof type !== "string") {
		throw new Error("CVD type must be a string");
	}
	const t = type.toLowerCase();
	if (t === "protan" || t === "protanopia" || t === "protanomaly")
		return "protan";
	if (t === "deutan" || t === "deuteranopia" || t === "deuteranomaly")
		return "deutan";
	if (t === "tritan" || t === "tritanopia" || t === "tritanomaly")
		return "tritan";
	if (t === "achroma" || t === "achromatopsia" || t === "achromatomaly")
		return "achroma";
	throw new Error("Unknown CVD type: " + type);
}

export const IDENTITY3 = [
	[1, 0, 0],
	[0, 1, 0],
	[0, 0, 1]
];

// Rec. 709 luminance row, used for the achromatopsia projection.
export const ACHROMA_MATRIX = [
	[0.2126, 0.7152, 0.0722],
	[0.2126, 0.7152, 0.0722],
	[0.2126, 0.7152, 0.0722]
];

export function interpolateMatrix3(A, B, t) {
	const out = [
		[0, 0, 0],
		[0, 0, 0],
		[0, 0, 0]
	];
	for (let i = 0; i < 3; i++) {
		for (let j = 0; j < 3; j++) {
			out[i][j] = A[i][j] + (B[i][j] - A[i][j]) * t;
		}
	}
	return out;
}
