// HSL — the CSS HSL color space, defined against gamma-encoded sRGB.
//
// H in [0, 360) degrees; S and L in [0, 100] percent (CSS convention).
// Ports the conversion math from v2 `_RGBAToHSLA` (src/swatch.js:808-873) and
// `_HSLToRGB` (src/swatch.js:546-613) but operates on unit-RGB coords
// instead of 0..255 ints.

import { registerSpace, getSpace } from "../core/registry.js";

// Unit-RGB → HSL. rgb coords in [0, 1]; output h in [0, 360), s/l in [0, 100].
export function srgbToHsl(rgb) {
	const r = rgb[0];
	const g = rgb[1];
	const b = rgb[2];
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const delta = max - min;
	let h = 0;
	let s = 0;
	const l = (max + min) / 2;

	if (delta !== 0) {
		s = delta / (1 - Math.abs(2 * l - 1));
		if (max === r) {
			h = ((g - b) / delta) % 6;
		} else if (max === g) {
			h = (b - r) / delta + 2;
		} else {
			h = (r - g) / delta + 4;
		}
		h *= 60;
		if (h < 0) h += 360;
	}

	return [h, s * 100, l * 100];
}

// HSL → unit-RGB.
export function hslToSrgb(hsl) {
	const h = ((hsl[0] % 360) + 360) % 360;
	const s = hsl[1] / 100;
	const l = hsl[2] / 100;
	const c = (1 - Math.abs(2 * l - 1)) * s;
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
	const m = l - c / 2;
	let r1 = 0;
	let g1 = 0;
	let b1 = 0;
	if (h < 60) {
		r1 = c;
		g1 = x;
	} else if (h < 120) {
		r1 = x;
		g1 = c;
	} else if (h < 180) {
		g1 = c;
		b1 = x;
	} else if (h < 240) {
		g1 = x;
		b1 = c;
	} else if (h < 300) {
		r1 = x;
		b1 = c;
	} else {
		r1 = c;
		b1 = x;
	}
	return [r1 + m, g1 + m, b1 + m];
}

registerSpace({
	id: "hsl",
	channels: ["h", "s", "l"],
	ranges: [
		[0, 360],
		[0, 100],
		[0, 100]
	],
	white: "D65",
	toXYZ: (coords) => {
		const rgb = hslToSrgb(coords);
		return getSpace("srgb").toXYZ(rgb);
	},
	fromXYZ: (xyz) => {
		const rgb = getSpace("srgb").fromXYZ(xyz);
		return srgbToHsl(rgb);
	},
	shortcuts: {
		srgb: (coords) => hslToSrgb(coords)
	}
});

getSpace("srgb").shortcuts.hsl = (coords) => srgbToHsl(coords);
