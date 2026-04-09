// Canonical Swatch state shape.
//
// Every Swatch instance holds:
//   space  — string id of the source color space (e.g. "srgb", "oklab")
//   coords — length-3 array of numbers in the source space's natural units
//   alpha  — number in [0, 1]
//
// This is the colorjs.io / culori representation: the input space is preserved
// losslessly and conversions to other spaces are computed lazily on the
// instance and memoized. Wide-gamut inputs (color(display-p3 1 0 0)) keep
// their full chromaticity instead of being clamped to sRGB.

export function makeState(space, coords, alpha) {
	return {
		space,
		coords: [coords[0], coords[1], coords[2]],
		alpha: alpha == null ? 1 : alpha
	};
}

export function cloneState(state) {
	return {
		space: state.space,
		coords: [state.coords[0], state.coords[1], state.coords[2]],
		alpha: state.alpha
	};
}

export function statesEqual(a, b, epsilon = 0) {
	if (a.space !== b.space) return false;
	if (Math.abs(a.alpha - b.alpha) > epsilon) return false;
	for (let i = 0; i < 3; i++) {
		if (Math.abs(a.coords[i] - b.coords[i]) > epsilon) return false;
	}
	return true;
}
