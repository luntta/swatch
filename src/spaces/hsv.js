// HSV / HSB space (Hue, Saturation, Value/Brightness).
//
// Defined on top of sRGB: H in degrees, S and V in 0..100 (percent-
// like units) to match the conventions used by the rest of the library.
//
// Bidirectional shortcut to sRGB bypasses the XYZ hub. toXYZ / fromXYZ
// still route through sRGB for the conversion graph fallback.

import { registerSpace, getSpace } from "../core/registry.js";

export function srgbToHsv(rgb) {
	const [r, g, b] = rgb;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const delta = max - min;
	let h = 0;
	if (delta !== 0) {
		if (max === r) h = 60 * (((g - b) / delta) % 6);
		else if (max === g) h = 60 * ((b - r) / delta + 2);
		else h = 60 * ((r - g) / delta + 4);
	}
	if (h < 0) h += 360;
	const s = max === 0 ? 0 : (delta / max) * 100;
	const v = max * 100;
	return [h, s, v];
}

export function hsvToSrgb(hsv) {
	const [h, sPct, vPct] = hsv;
	const s = sPct / 100;
	const v = vPct / 100;
	const c = v * s;
	const hp = ((h % 360) + 360) % 360 / 60;
	const x = c * (1 - Math.abs((hp % 2) - 1));
	let r1 = 0,
		g1 = 0,
		b1 = 0;
	if (hp < 1) {
		r1 = c;
		g1 = x;
	} else if (hp < 2) {
		r1 = x;
		g1 = c;
	} else if (hp < 3) {
		g1 = c;
		b1 = x;
	} else if (hp < 4) {
		g1 = x;
		b1 = c;
	} else if (hp < 5) {
		r1 = x;
		b1 = c;
	} else {
		r1 = c;
		b1 = x;
	}
	const m = v - c;
	return [r1 + m, g1 + m, b1 + m];
}

registerSpace({
	id: "hsv",
	channels: ["h", "s", "v"],
	ranges: [
		[0, 360],
		[0, 100],
		[0, 100]
	],
	white: "D65",
	toXYZ: (coords) => getSpace("srgb").toXYZ(hsvToSrgb(coords)),
	fromXYZ: (xyz) => srgbToHsv(getSpace("srgb").fromXYZ(xyz)),
	shortcuts: {
		srgb: (coords) => hsvToSrgb(coords)
	}
});

// Patch reverse shortcut on sRGB now that HSV exists.
getSpace("srgb").shortcuts.hsv = (coords) => srgbToHsv(coords);
