// Generic numeric helpers used by multiple modules.

export function clamp(value, lo, hi) {
	return value < lo ? lo : value > hi ? hi : value;
}

export function lerp(a, b, t) {
	return a + (b - a) * t;
}

// Shortest-arc hue interpolation in degrees.
export function lerpHue(a, b, t) {
	let dh = b - a;
	if (dh > 180) dh -= 360;
	else if (dh < -180) dh += 360;
	let h = a + dh * t;
	if (h < 0) h += 360;
	else if (h >= 360) h -= 360;
	return h;
}

export function degToRad(deg) {
	return (deg * Math.PI) / 180;
}

export function radToDeg(rad) {
	return (rad * 180) / Math.PI;
}

// Wrap a hue into [0, 360).
export function normalizeHue(h) {
	h = h % 360;
	if (h < 0) h += 360;
	return h;
}

// Lab-style {l, a, b} → polar {l, c, h}. Used by both CIE LCh and OKLCh.
export function labToLchPolar(lab) {
	const c = Math.hypot(lab.a, lab.b);
	let h = Math.atan2(lab.b, lab.a) * (180 / Math.PI);
	if (h < 0) h += 360;
	return { l: lab.l, c, h };
}

// Polar {l, c, h} → {l, a, b}.
export function lchToLabRect(lch) {
	const hRad = (lch.h * Math.PI) / 180;
	return {
		l: lch.l,
		a: lch.c * Math.cos(hRad),
		b: lch.c * Math.sin(hRad)
	};
}
