// Correlated color temperature (CCT) ↔ color.
//
// Forward: Krystek 1985 piecewise polynomial maps blackbody CCT
// (Kelvin) onto CIE 1931 xy chromaticity, then to XYZ, then to a
// scaled sRGB triple normalized so the brightest channel equals 1.
//
// Inverse: McCamy 1992 cubic approximation from xy to CCT. This is
// a *fit*, not an exact inversion — documented as approximate. The
// fit is accurate to within a few kelvin for daylight illuminants
// but degrades at the extremes of the Planckian locus.
//
// Supported range: 1000 K – 40000 K. Outside this range the
// polynomial is not defined and we throw.

import { Swatch } from "../core/swatch-class.js";
import { convert } from "../core/registry.js";

const MIN_K = 1000;
const MAX_K = 40000;

// Krystek 1985 (also published as CIE D illuminant series refinement).
// Reference: Krystek, M. (1985) "An algorithm to calculate correlated
// colour temperature", Color Research & Application 10, 38–40.
//
// Implementation here uses the classic piecewise-cubic fit
// (Kim et al. 2002, also reproduced in Wikipedia's
// "Planckian locus" article) which matches the blackbody locus to
// within a few ΔE across the working range.
function kelvinToXy(k) {
	if (k < MIN_K || k > MAX_K) {
		throw new Error(
			`temperature: ${k}K is out of range [${MIN_K}, ${MAX_K}]`
		);
	}
	const T = k;
	let x;
	if (T <= 4000) {
		// 1667 K ≤ T ≤ 4000 K
		x =
			-0.2661239 * (1e9 / (T * T * T)) -
			0.2343589 * (1e6 / (T * T)) +
			0.8776956 * (1e3 / T) +
			0.17991;
	} else {
		// 4000 K ≤ T ≤ 25000 K — also used as an extrapolation up to 40000 K.
		x =
			-3.0258469 * (1e9 / (T * T * T)) +
			2.1070379 * (1e6 / (T * T)) +
			0.2226347 * (1e3 / T) +
			0.24039;
	}
	let y;
	if (T <= 2222) {
		y =
			-1.1063814 * (x * x * x) -
			1.3481102 * (x * x) +
			2.18555832 * x -
			0.20219683;
	} else if (T <= 4000) {
		y =
			-0.9549476 * (x * x * x) -
			1.37418593 * (x * x) +
			2.09137015 * x -
			0.16748867;
	} else {
		y =
			3.081758 * (x * x * x) -
			5.8733867 * (x * x) +
			3.75112997 * x -
			0.37001483;
	}
	return [x, y];
}

function xyToXyz(x, y) {
	// Y normalized to 1; XYZ scaled by Y/y.
	if (y === 0) return [0, 0, 0];
	const Y = 1;
	const X = (x * Y) / y;
	const Z = ((1 - x - y) * Y) / y;
	return [X, Y, Z];
}

// Build a Swatch for the blackbody radiator at `kelvin`. The returned
// color is in sRGB, gamut-clipped and normalized so the brightest
// channel is 1 (which is how temperature-picker widgets conventionally
// present these colors).
export function temperature(kelvin) {
	const [x, y] = kelvinToXy(kelvin);
	const xyz = xyToXyz(x, y);
	const srgbLinear = convert(xyz, "xyz", "srgb-linear");
	// Normalize so the max linear channel is 1 (preserve chromaticity).
	let m = Math.max(srgbLinear[0], srgbLinear[1], srgbLinear[2]);
	if (m <= 0) m = 1;
	const scaled = [
		srgbLinear[0] / m,
		srgbLinear[1] / m,
		srgbLinear[2] / m
	];
	// Clip any residual negatives (blackbody below ~1900K can still
	// produce small negative B values even after chroma scaling).
	for (let i = 0; i < 3; i++) {
		if (scaled[i] < 0) scaled[i] = 0;
		if (scaled[i] > 1) scaled[i] = 1;
	}
	const srgb = convert(scaled, "srgb-linear", "srgb");
	return new Swatch({ space: "srgb", coords: srgb, alpha: 1 });
}

// McCamy 1992: xy chromaticity → approximate CCT in Kelvin.
// n = (x − 0.3320) / (0.1858 − y)
// CCT ≈ 449 n³ + 3525 n² + 6823.3 n + 5520.33
//
// Accurate for daylight-ish illuminants; degrades on extreme locus
// points. Documented as an approximation.
export function kelvin(input) {
	// `input` must be a Swatch — wrapping is the caller's job, and
	// temperature() exposes this only via the prototype method below.
	const [X, Y, Z] = input._getCoordsIn("xyz");
	const sum = X + Y + Z;
	if (sum === 0) return NaN;
	const x = X / sum;
	const y = Y / sum;
	const n = (x - 0.332) / (0.1858 - y);
	return 449 * n * n * n + 3525 * n * n + 6823.3 * n + 5520.33;
}
