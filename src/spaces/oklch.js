// OKLCh — polar form of OKLab. Direct shortcut converters to/from OKLab
// avoid a round-trip through XYZ or linear sRGB.

import { registerSpace } from "../core/registry.js";
import { labToLchPolar, lchToLabRect } from "../util/math.js";
import { linearSrgbToOklab, oklabToLinearSrgb } from "./oklab.js";
import { getSpace } from "../core/registry.js";

registerSpace({
	id: "oklch",
	channels: ["l", "c", "h"],
	ranges: [
		[0, 1],
		[0, 0.4],
		[0, 360]
	],
	white: "D65",
	toXYZ: (coords) => {
		const { l, a, b } = lchToLabRect({
			l: coords[0],
			c: coords[1],
			h: coords[2]
		});
		const lin = oklabToLinearSrgb([l, a, b]);
		return getSpace("srgb-linear").toXYZ(lin);
	},
	fromXYZ: (xyz) => {
		const lin = getSpace("srgb-linear").fromXYZ(xyz);
		const ok = linearSrgbToOklab(lin);
		const { l, c, h } = labToLchPolar({ l: ok[0], a: ok[1], b: ok[2] });
		return [l, c, h];
	},
	shortcuts: {
		oklab: (coords) => {
			const { l, a, b } = lchToLabRect({
				l: coords[0],
				c: coords[1],
				h: coords[2]
			});
			return [l, a, b];
		}
	}
});

// Reverse shortcut from oklab → oklch.
getSpace("oklab").shortcuts.oklch = (coords) => {
	const { l, c, h } = labToLchPolar({
		l: coords[0],
		a: coords[1],
		b: coords[2]
	});
	return [l, c, h];
};
