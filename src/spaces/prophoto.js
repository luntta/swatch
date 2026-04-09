// ProPhoto RGB color space.
//
// D50 white with a piecewise transfer function (linear near zero,
// gamma 1.8 above). ProPhoto has the widest gamut of the common RGB
// spaces — large enough to cover colors outside the human visual
// system, which is why it ships with a caveat in pipelines.
//
// Because ProPhoto is natively D50 we apply the Bradford chromatic
// adaptation transform on the way to/from the canonical D65 XYZ hub.
//
// Matrices from the CSS Color 4 sample code; transfer function from
// the ROMM RGB spec (ISO 22028-2).

import { multiplyMatrixVector } from "../util/matrix.js";
import { registerSpace } from "../core/registry.js";
import { adaptD50ToD65, adaptD65ToD50 } from "./xyz.js";

const ET = 1 / 512;
const ET_LINEAR = 16 / 512;

export function prophotoToLinear(coords) {
	const f = (v) => {
		const abs = Math.abs(v);
		if (abs < ET_LINEAR) return v / 16;
		return Math.sign(v) * Math.pow(abs, 1.8);
	};
	return [f(coords[0]), f(coords[1]), f(coords[2])];
}

export function linearToProphoto(lin) {
	const f = (v) => {
		const abs = Math.abs(v);
		if (abs < ET) return 16 * v;
		return Math.sign(v) * Math.pow(abs, 1 / 1.8);
	};
	return [f(lin[0]), f(lin[1]), f(lin[2])];
}

// Linear ProPhoto → XYZ D50.
export const LINEAR_PROPHOTO_TO_XYZ_D50 = [
	[0.7977666449006423, 0.13518129740053308, 0.0313477341283922],
	[0.2880748288194013, 0.711835234241873, 0.00008993693872564],
	[0.0, 0.0, 0.8251046025104602]
];

// XYZ D50 → Linear ProPhoto.
export const XYZ_D50_TO_LINEAR_PROPHOTO = [
	[1.3457868816471585, -0.25557208737979464, -0.05110186497554526],
	[-0.5446307051249019, 1.5082477428451468, 0.02052744743642139],
	[0.0, 0.0, 1.2119675456389452]
];

export function linearProphotoToXyzD50(lin) {
	return multiplyMatrixVector(LINEAR_PROPHOTO_TO_XYZ_D50, lin);
}

export function xyzD50ToLinearProphoto(xyz) {
	return multiplyMatrixVector(XYZ_D50_TO_LINEAR_PROPHOTO, xyz);
}

registerSpace({
	id: "prophoto",
	channels: ["r", "g", "b"],
	ranges: [
		[0, 1],
		[0, 1],
		[0, 1]
	],
	white: "D50",
	toXYZ: (coords) => adaptD50ToD65(linearProphotoToXyzD50(prophotoToLinear(coords))),
	fromXYZ: (xyz) => linearToProphoto(xyzD50ToLinearProphoto(adaptD65ToD50(xyz)))
});
