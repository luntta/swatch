// Adobe RGB (1998) / A98 color space.
//
// D65 white with a pure power-law transfer function (γ = 563/256 ≈
// 2.19921875). Historically significant in print/photo pipelines for
// its wider green reach compared to sRGB.
//
// Matrices from the CSS Color 4 sample code.

import { multiplyMatrixVector } from "../util/matrix.js";
import { registerSpace } from "../core/registry.js";

const GAMMA = 563 / 256; // 2.19921875

export function a98ToLinear(coords) {
	const f = (v) => Math.sign(v) * Math.pow(Math.abs(v), GAMMA);
	return [f(coords[0]), f(coords[1]), f(coords[2])];
}

export function linearToA98(lin) {
	const f = (v) => Math.sign(v) * Math.pow(Math.abs(v), 1 / GAMMA);
	return [f(lin[0]), f(lin[1]), f(lin[2])];
}

export const LINEAR_A98_TO_XYZ_D65 = [
	[0.5766690429101305, 0.1855582379065463, 0.1882286462349947],
	[0.29734497525053605, 0.6273635662554661, 0.07529145849399788],
	[0.02703136138641234, 0.07068885253582723, 0.9913375368376388]
];

export const XYZ_D65_TO_LINEAR_A98 = [
	[2.0415879038107465, -0.5650069742788596, -0.34473135077832957],
	[-0.9692436362808795, 1.8759675015077202, 0.04155505740717557],
	[0.013444280632031142, -0.11836239223101835, 1.0151749943912054]
];

export function linearA98ToXyz(lin) {
	return multiplyMatrixVector(LINEAR_A98_TO_XYZ_D65, lin);
}

export function xyzToLinearA98(xyz) {
	return multiplyMatrixVector(XYZ_D65_TO_LINEAR_A98, xyz);
}

registerSpace({
	id: "a98",
	channels: ["r", "g", "b"],
	ranges: [
		[0, 1],
		[0, 1],
		[0, 1]
	],
	white: "D65",
	toXYZ: (coords) => linearA98ToXyz(a98ToLinear(coords)),
	fromXYZ: (xyz) => linearToA98(xyzToLinearA98(xyz))
});
