// Scale interpolators.
//
//   bezier([c0, c1, c2, ...])
//     chroma.js-style Bezier-smoothed interpolation through Lab stops.
//     Returns a function t∈[0,1] → Swatch that can be passed to
//     swatch.scale(...) and then reshaped with .domain(), .classes(),
//     .padding(), .gamma() like any other scale.
//
//   cubehelix({ start, rotations, hue, gamma, lightness })
//     Green & Dave's cubehelix interpolation — a one-dimensional
//     colormap that spirals through RGB space with monotonically
//     varying lightness. Arguments match chroma.js's cubehelix.
//     Returns the same t∈[0,1] → Swatch function shape.

import { Swatch, swatch } from "../core/swatch-class.js";

function toSwatch(input) {
	return input instanceof Swatch ? input : swatch(input);
}

// De Casteljau's algorithm on Lab coords. Returns a Lab triple.
function bezierLab(stops, t) {
	const n = stops.length;
	if (n === 1) return stops[0];
	const work = stops.map((s) => [s[0], s[1], s[2]]);
	for (let r = 1; r < n; r++) {
		for (let i = 0; i < n - r; i++) {
			for (let k = 0; k < 3; k++) {
				work[i][k] = work[i][k] * (1 - t) + work[i + 1][k] * t;
			}
		}
	}
	return work[0];
}

export function bezier(colors) {
	const stops = colors.map(toSwatch);
	const labs = stops.map((s) => {
		const { l, a, b } = s.lab;
		return [l, a, b];
	});
	return function (t) {
		const [l, a, b] = bezierLab(labs, t);
		return new Swatch({ space: "lab", coords: [l, a, b], alpha: 1 });
	};
}

// Cubehelix — reference: D. A. Green (2011), "A colour scheme for
// the display of astronomical intensity images", Bulletin of the
// Astronomical Society of India, 39, 289.
//
// t∈[0,1] → Swatch (sRGB). gamma shapes the lightness ramp; hue
// controls chroma amplitude; start/rotations define the spiral.
export function cubehelix(opts = {}) {
	const start = opts.start != null ? opts.start : 300;
	const rotations = opts.rotations != null ? opts.rotations : -1.5;
	const hue = opts.hue != null ? opts.hue : 1;
	const gamma = opts.gamma != null ? opts.gamma : 1;
	const lightness =
		opts.lightness != null ? opts.lightness : [0, 1];

	return function (t) {
		const lStart = lightness[0];
		const lEnd = lightness[1];
		const f = lStart + (lEnd - lStart) * t;
		const l = Math.pow(f, gamma);
		const angle =
			2 * Math.PI * (start / 360 + 1 + rotations * t);
		const amp = (hue * l * (1 - l)) / 2;
		const cosA = Math.cos(angle);
		const sinA = Math.sin(angle);
		let r = l + amp * (-0.14861 * cosA + 1.78277 * sinA);
		let g = l + amp * (-0.29227 * cosA - 0.90649 * sinA);
		let b = l + amp * (1.97294 * cosA);
		if (r < 0) r = 0;
		if (r > 1) r = 1;
		if (g < 0) g = 0;
		if (g > 1) g = 1;
		if (b < 0) b = 0;
		if (b > 1) b = 1;
		return new Swatch({ space: "srgb", coords: [r, g, b], alpha: 1 });
	};
}
