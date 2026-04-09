// Blend modes.
//
// The W3C "Compositing and Blending Level 1" non-separable blend modes
// (minus hue/saturation/color/luminosity, which require a separate HSL
// pass and aren't covered by the acceptance criteria). Operates on
// sRGB-encoded channels per the CSS default blending color space —
// this matches Canvas2D/Photoshop/CSS `mix-blend-mode` behavior.
//
// Alpha composition: for simplicity we combine alphas as `a_src +
// a_dst - a_src * a_dst` (normal compositing); blending only affects
// color channels.

import { Swatch, swatch } from "../core/swatch-class.js";

function clamp01(v) {
	return v < 0 ? 0 : v > 1 ? 1 : v;
}

const MODES = {
	normal: (_cb, cs) => cs,
	multiply: (cb, cs) => cb * cs,
	screen: (cb, cs) => cb + cs - cb * cs,
	darken: (cb, cs) => Math.min(cb, cs),
	lighten: (cb, cs) => Math.max(cb, cs),
	difference: (cb, cs) => Math.abs(cb - cs),
	exclusion: (cb, cs) => cb + cs - 2 * cb * cs,
	"color-dodge": (cb, cs) => {
		if (cb === 0) return 0;
		if (cs === 1) return 1;
		return Math.min(1, cb / (1 - cs));
	},
	"color-burn": (cb, cs) => {
		if (cb === 1) return 1;
		if (cs === 0) return 0;
		return 1 - Math.min(1, (1 - cb) / cs);
	},
	"hard-light": (cb, cs) => {
		if (cs <= 0.5) return cb * cs * 2;
		return cb + (2 * cs - 1) - cb * (2 * cs - 1);
	},
	"soft-light": (cb, cs) => {
		if (cs <= 0.5) {
			return cb - (1 - 2 * cs) * cb * (1 - cb);
		}
		const d =
			cb <= 0.25 ? ((16 * cb - 12) * cb + 4) * cb : Math.sqrt(cb);
		return cb + (2 * cs - 1) * (d - cb);
	},
	overlay: (cb, cs) => MODES["hard-light"](cs, cb)
};

export function listBlendModes() {
	return Object.keys(MODES);
}

export function blend(backdrop, source, mode = "normal") {
	const fn = MODES[mode];
	if (!fn) throw new Error(`blend: unknown mode "${mode}"`);
	const bs = backdrop instanceof Swatch ? backdrop : swatch(backdrop);
	const ss = source instanceof Swatch ? source : swatch(source);
	const b = bs.srgb;
	const s = ss.srgb;
	const r = clamp01(fn(b.r, s.r));
	const g = clamp01(fn(b.g, s.g));
	const bl = clamp01(fn(b.b, s.b));
	const alpha = bs.alpha + ss.alpha - bs.alpha * ss.alpha;
	return new Swatch({
		space: "srgb",
		coords: [r, g, bl],
		alpha
	});
}
