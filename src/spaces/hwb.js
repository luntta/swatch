// HWB (Hue, Whiteness, Blackness) — CSS Color 4 definition.
//
// H in degrees (same as HSL/HSV); W and B are percentage-like 0..100
// units representing how much white / black is mixed in. When W + B
// >= 100, the result is a neutral grey W/(W+B).
//
// Converts through HSV (sharing the hue) per the CSS spec.

import { registerSpace, getSpace } from "../core/registry.js";
import { srgbToHsv, hsvToSrgb } from "./hsv.js";

export function srgbToHwb(rgb) {
	const [h] = srgbToHsv(rgb);
	const w = Math.min(rgb[0], rgb[1], rgb[2]) * 100;
	const b = (1 - Math.max(rgb[0], rgb[1], rgb[2])) * 100;
	return [h, w, b];
}

export function hwbToSrgb(hwb) {
	const [h, wPct, blPct] = hwb;
	const w = wPct / 100;
	const bl = blPct / 100;
	if (w + bl >= 1) {
		const gray = w / (w + bl);
		return [gray, gray, gray];
	}
	const base = hsvToSrgb([h, 100, 100]);
	const scale = 1 - w - bl;
	return [base[0] * scale + w, base[1] * scale + w, base[2] * scale + w];
}

registerSpace({
	id: "hwb",
	channels: ["h", "w", "b"],
	ranges: [
		[0, 360],
		[0, 100],
		[0, 100]
	],
	white: "D65",
	toXYZ: (coords) => getSpace("srgb").toXYZ(hwbToSrgb(coords)),
	fromXYZ: (xyz) => srgbToHwb(getSpace("srgb").fromXYZ(xyz)),
	shortcuts: {
		srgb: (coords) => hwbToSrgb(coords)
	}
});

getSpace("srgb").shortcuts.hwb = (coords) => srgbToHwb(coords);
