// Display P3 color space.
//
// P3 primaries + D65 white, using the same transfer function as sRGB
// (the 0.04045 knee, γ ≈ 2.4). P3 is the default wide-gamut space for
// modern displays; Apple adopted it industry-wide and CSS Color 4
// standardizes it under `color(display-p3 r g b)`.
//
// Matrices from the CSS Color 4 sample code
// (https://www.w3.org/TR/css-color-4/#color-conversion-code).

import { multiplyMatrixVector } from "../util/matrix.js";
import { registerSpace } from "../core/registry.js";
import { srgbToLinear, linearToSrgb } from "./srgb.js";

export const LINEAR_P3_TO_XYZ_D65 = [
	[0.4865709486482162, 0.26566769316909306, 0.1982172852343625],
	[0.2289745640697488, 0.6917385218365064, 0.079286914093745],
	[0.0, 0.04511338185890264, 1.043944368900976]
];

export const XYZ_D65_TO_LINEAR_P3 = [
	[2.493496911941425, -0.9313836179191239, -0.40271078445071684],
	[-0.8294889695615747, 1.7626640603183463, 0.023624685841943577],
	[0.03584583024378447, -0.07617238926804182, 0.9568845240076872]
];

export function linearP3ToXyz(lin) {
	return multiplyMatrixVector(LINEAR_P3_TO_XYZ_D65, lin);
}

export function xyzToLinearP3(xyz) {
	return multiplyMatrixVector(XYZ_D65_TO_LINEAR_P3, xyz);
}

// Display P3 uses the sRGB EOTF, so we reuse the sRGB helpers.
export const p3ToLinear = srgbToLinear;
export const linearToP3 = linearToSrgb;

registerSpace({
	id: "display-p3",
	channels: ["r", "g", "b"],
	ranges: [
		[0, 1],
		[0, 1],
		[0, 1]
	],
	white: "D65",
	toXYZ: (coords) => linearP3ToXyz(p3ToLinear(coords)),
	fromXYZ: (xyz) => linearToP3(xyzToLinearP3(xyz))
});
