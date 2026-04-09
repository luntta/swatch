// Color Vision Deficiency simulation and daltonization.
//
// Projection matrices for protan/deutan/tritan come from
// data/cvd-matrices.js via the Brettel/Viénot anchor-line method.
// simulate() interpolates between the identity and the dichromat
// matrix by `severity` (0..1). daltonize() uses Fidaner-style error
// redistribution: compute what the dichromat loses (the delta in
// linear sRGB) and shift it into channels the user can still see.

import { Swatch, swatch } from "../core/swatch-class.js";
import { srgbToLinear, linearToSrgb } from "../spaces/srgb.js";
import {
	CVD_RGB_MATRICES,
	IDENTITY3,
	ACHROMA_MATRIX,
	interpolateMatrix3,
	normalizeCVDType
} from "../data/cvd-matrices.js";

function toSwatch(input) {
	return input instanceof Swatch ? input : swatch(input);
}

function mat3mulVec3(M, v) {
	return [
		M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2],
		M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2],
		M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2]
	];
}

function clamp01Triplet(v) {
	for (let i = 0; i < 3; i++) {
		if (v[i] < 0) v[i] = 0;
		else if (v[i] > 1) v[i] = 1;
	}
	return v;
}

export function simulate(input, type, { severity = 1 } = {}) {
	const s = toSwatch(input);
	const sev = Math.max(0, Math.min(1, severity));
	const normalized = normalizeCVDType(type);

	let M;
	if (normalized === "achroma") {
		M = interpolateMatrix3(IDENTITY3, ACHROMA_MATRIX, sev);
	} else {
		M = interpolateMatrix3(
			IDENTITY3,
			CVD_RGB_MATRICES[normalized],
			sev
		);
	}

	const { r, g, b } = s.srgb;
	const lin = srgbToLinear([r, g, b]);
	const linOut = clamp01Triplet(mat3mulVec3(M, lin));
	const out = linearToSrgb(linOut);

	return new Swatch({
		space: "srgb",
		coords: out,
		alpha: s.alpha
	});
}

export function daltonize(input, type, { severity = 1 } = {}) {
	const s = toSwatch(input);
	const sev = Math.max(0, Math.min(1, severity));
	const normalized = normalizeCVDType(type);
	if (normalized === "achroma") {
		throw new Error(
			"daltonize: achromatopsia cannot be corrected (no remaining channels)"
		);
	}

	const M = interpolateMatrix3(
		IDENTITY3,
		CVD_RGB_MATRICES[normalized],
		sev
	);

	const { r, g, b } = s.srgb;
	const lin = srgbToLinear([r, g, b]);
	const linSim = mat3mulVec3(M, lin);
	const err = [lin[0] - linSim[0], lin[1] - linSim[1], lin[2] - linSim[2]];

	// Fidaner shift matrices:
	//   red-green deficits push red-channel error into G and B;
	//   blue-yellow (tritan) pushes blue error into R and G.
	let shift;
	if (normalized === "tritan") {
		shift = [
			[0, 0, 0.7],
			[0, 0, 0.7],
			[0, 0, 0]
		];
	} else {
		shift = [
			[0, 0, 0],
			[0.7, 0, 0],
			[0.7, 0, 0]
		];
	}

	const corrected = clamp01Triplet([
		lin[0] + shift[0][0] * err[0] + shift[0][1] * err[1] + shift[0][2] * err[2],
		lin[1] + shift[1][0] * err[0] + shift[1][1] * err[1] + shift[1][2] * err[2],
		lin[2] + shift[2][0] * err[0] + shift[2][1] * err[1] + shift[2][2] * err[2]
	]);

	const out = linearToSrgb(corrected);
	return new Swatch({
		space: "srgb",
		coords: out,
		alpha: s.alpha
	});
}
