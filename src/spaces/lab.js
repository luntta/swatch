// CIE Lab color space.
//
// Two variants are registered:
//
//   lab      — D65 reference white (our default; matches what v2 used).
//   lab-d50  — D50 reference white (the CSS Color 4 specified variant).
//
// Both follow the standard CIE L*a*b* transfer functions. L is on a 0..100
// scale; a and b are signed.
//
// Porting reference: v2 `_XYZToLab` at src/swatch.js:1463-1482 and `_labToRGB`
// at src/swatch.js:1098-1128.

import { registerSpace } from "../core/registry.js";
import { D65, D50, adaptD50ToD65, adaptD65ToD50 } from "./xyz.js";

const KAPPA = 24389 / 27; // (29/3)^3
const EPSILON = 216 / 24389; // (6/29)^3
const DELTA = 6 / 29;

function labForward(xyz, white) {
	const f = (t) =>
		t > EPSILON ? Math.cbrt(t) : (KAPPA * t + 16) / 116;
	const fx = f(xyz[0] / white[0]);
	const fy = f(xyz[1] / white[1]);
	const fz = f(xyz[2] / white[2]);
	return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

function labInverse(lab, white) {
	const fy = (lab[0] + 16) / 116;
	const fx = lab[1] / 500 + fy;
	const fz = fy - lab[2] / 200;
	const finv = (t) =>
		t > DELTA ? t * t * t : 3 * DELTA * DELTA * (t - 4 / 29);
	return [
		white[0] * finv(fx),
		white[1] * finv(fy),
		white[2] * finv(fz)
	];
}

// Lab D65 — the v2 default; all existing tests expect this.
registerSpace({
	id: "lab",
	channels: ["l", "a", "b"],
	ranges: [
		[0, 100],
		[-125, 125],
		[-125, 125]
	],
	white: "D65",
	toXYZ: (coords) => labInverse(coords, D65),
	fromXYZ: (xyz) => labForward(xyz, D65)
});

// Lab D50 — CSS Color 4 lab() uses this. Bradford-adapts to D65 on the
// way to the hub.
registerSpace({
	id: "lab-d50",
	channels: ["l", "a", "b"],
	ranges: [
		[0, 100],
		[-125, 125],
		[-125, 125]
	],
	white: "D50",
	toXYZ: (coords) => adaptD50ToD65(labInverse(coords, D50)),
	fromXYZ: (xyz) => labForward(adaptD65ToD50(xyz), D50)
});
