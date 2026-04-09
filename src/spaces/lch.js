// CIE LCh — polar form of CIE Lab.
//
// Two variants are registered matching the Lab variants:
//   lch      (D65, our default)
//   lch-d50  (CSS Color 4 variant)

import { registerSpace, convert } from "../core/registry.js";
import { labToLchPolar, lchToLabRect } from "../util/math.js";

function lchToXyz(coords, labSpaceId) {
	const lab = lchToLabRect({ l: coords[0], c: coords[1], h: coords[2] });
	return convert([lab.l, lab.a, lab.b], labSpaceId, "xyz");
}

function xyzToLch(xyz, labSpaceId) {
	const [l, a, b] = convert(xyz, "xyz", labSpaceId);
	const lch = labToLchPolar({ l, a, b });
	return [lch.l, lch.c, lch.h];
}

registerSpace({
	id: "lch",
	channels: ["l", "c", "h"],
	ranges: [
		[0, 100],
		[0, 150],
		[0, 360]
	],
	white: "D65",
	toXYZ: (coords) => lchToXyz(coords, "lab"),
	fromXYZ: (xyz) => xyzToLch(xyz, "lab"),
	shortcuts: {
		lab: (coords) => {
			const { l, a, b } = lchToLabRect({
				l: coords[0],
				c: coords[1],
				h: coords[2]
			});
			return [l, a, b];
		}
	}
});

registerSpace({
	id: "lch-d50",
	channels: ["l", "c", "h"],
	ranges: [
		[0, 100],
		[0, 150],
		[0, 360]
	],
	white: "D50",
	toXYZ: (coords) => lchToXyz(coords, "lab-d50"),
	fromXYZ: (xyz) => xyzToLch(xyz, "lab-d50"),
	shortcuts: {
		"lab-d50": (coords) => {
			const { l, a, b } = lchToLabRect({
				l: coords[0],
				c: coords[1],
				h: coords[2]
			});
			return [l, a, b];
		}
	}
});
