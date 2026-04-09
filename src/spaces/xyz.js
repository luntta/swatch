// CIE XYZ color space and chromatic adaptation transforms.
//
// Two whites are registered:
//
//   xyz / xyz-d65 — D65 reference white. This is the canonical hub for the
//                   conversion graph. All other spaces convert to/from this.
//   xyz-d50       — D50 reference white. Used by spaces that are natively
//                   defined under D50 (CIE Lab D50, ProPhoto). The Bradford
//                   chromatic adaptation transform converts between D50 and
//                   D65 with very low error.
//
// Reference white tristimulus values (Y normalized to 1):
//   D65 ≈ (0.95047, 1.0,    1.08883)
//   D50 ≈ (0.96422, 1.0,    0.82521)

import { multiplyMatrixVector } from "../util/matrix.js";
import { registerSpace } from "../core/registry.js";

export const D65 = [0.95047, 1.0, 1.08883];
export const D50 = [0.96422, 1.0, 0.82521];

// Bradford chromatic adaptation transforms.
//
// Source: https://www.w3.org/TR/css-color-4/#color-conversion-code
// (the W3C-recommended Bradford CAT used in CSS Color 4 conversions).
export const BRADFORD_D50_TO_D65 = [
	[0.9554734527042182, -0.023098536874261423, 0.0632593086610217],
	[-0.028369706963208136, 1.0099954580058226, 0.021041398966943008],
	[0.012314001688319899, -0.020507696433477912, 1.3303659366080753]
];

export const BRADFORD_D65_TO_D50 = [
	[1.0479298208405488, 0.022946793341019434, -0.05019222954313557],
	[0.029627815688159608, 0.990434484573249, -0.01707382502938514],
	[-0.009243058152591178, 0.015055144896577895, 0.7518742899580008]
];

export function adaptD50ToD65(xyz) {
	return multiplyMatrixVector(BRADFORD_D50_TO_D65, xyz);
}

export function adaptD65ToD50(xyz) {
	return multiplyMatrixVector(BRADFORD_D65_TO_D50, xyz);
}

// XYZ D65 — the hub. toXYZ / fromXYZ are identity.
registerSpace({
	id: "xyz",
	channels: ["x", "y", "z"],
	white: "D65",
	toXYZ: (coords) => [coords[0], coords[1], coords[2]],
	fromXYZ: (xyz) => [xyz[0], xyz[1], xyz[2]]
});

// Alias.
registerSpace({
	id: "xyz-d65",
	channels: ["x", "y", "z"],
	white: "D65",
	toXYZ: (coords) => [coords[0], coords[1], coords[2]],
	fromXYZ: (xyz) => [xyz[0], xyz[1], xyz[2]]
});

// XYZ D50 — Bradford-adapted on the way to/from the hub.
registerSpace({
	id: "xyz-d50",
	channels: ["x", "y", "z"],
	white: "D50",
	toXYZ: (coords) => adaptD50ToD65(coords),
	fromXYZ: (xyz) => adaptD65ToD50(xyz)
});
