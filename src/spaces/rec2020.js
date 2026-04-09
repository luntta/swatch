// ITU-R BT.2020 (Rec2020) wide-gamut space.
//
// Primaries + D65 white, with its own transfer function (α ≈ 1.09929,
// β ≈ 0.01806). Rec2020 is the UHDTV standard and the reference
// wide-gamut space for video/HDR workflows.
//
// Matrices from the CSS Color 4 sample code; transfer function from
// ITU-R BT.2020-2.

import { multiplyMatrixVector } from "../util/matrix.js";
import { registerSpace } from "../core/registry.js";

const ALPHA = 1.09929682680944;
const BETA = 0.018053968510807;

export function rec2020ToLinear(coords) {
	const f = (v) => {
		const abs = Math.abs(v);
		if (abs < BETA * 4.5) return v / 4.5;
		return Math.sign(v) * Math.pow((abs + ALPHA - 1) / ALPHA, 1 / 0.45);
	};
	return [f(coords[0]), f(coords[1]), f(coords[2])];
}

export function linearToRec2020(lin) {
	const f = (v) => {
		const abs = Math.abs(v);
		if (abs < BETA) return 4.5 * v;
		return Math.sign(v) * (ALPHA * Math.pow(abs, 0.45) - (ALPHA - 1));
	};
	return [f(lin[0]), f(lin[1]), f(lin[2])];
}

export const LINEAR_REC2020_TO_XYZ_D65 = [
	[0.6369580483012914, 0.14461690358620832, 0.1688809751641721],
	[0.26270021201126703, 0.6779980715188708, 0.05930171646986196],
	[0.0, 0.028072693049087428, 1.060985057710791]
];

export const XYZ_D65_TO_LINEAR_REC2020 = [
	[1.7166511879712674, -0.35567078377639233, -0.25336628137365974],
	[-0.6666843518324892, 1.6164812366349395, 0.01576854581391113],
	[0.017639857445310783, -0.042770613257808524, 0.9421031212354738]
];

export function linearRec2020ToXyz(lin) {
	return multiplyMatrixVector(LINEAR_REC2020_TO_XYZ_D65, lin);
}

export function xyzToLinearRec2020(xyz) {
	return multiplyMatrixVector(XYZ_D65_TO_LINEAR_REC2020, xyz);
}

registerSpace({
	id: "rec2020",
	channels: ["r", "g", "b"],
	ranges: [
		[0, 1],
		[0, 1],
		[0, 1]
	],
	white: "D65",
	toXYZ: (coords) => linearRec2020ToXyz(rec2020ToLinear(coords)),
	fromXYZ: (xyz) => linearToRec2020(xyzToLinearRec2020(xyz))
});
