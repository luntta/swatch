// ============================================================
// Swatch playground · formatting + clipboard helpers
// ============================================================

export function fmtHex(c) {
	return c.hex.toLowerCase();
}

export function fmtRgb(c) {
	const { r, g, b } = c.rgb;
	return `rgb(${r} ${g} ${b})`;
}

export function fmtHsl(c) {
	const { h, s, l } = c.hsl;
	return `hsl(${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%)`;
}

export function fmtOklch(c) {
	const { l, c: chroma, h } = c.toOklch();
	const safeH = Number.isFinite(h) ? Math.round(h) : 0;
	return `oklch(${(l * 100).toFixed(1)}% ${chroma.toFixed(3)} ${safeH})`;
}

export function fmtLab(c) {
	const { l, a, b } = c.toLab();
	return `lab(${l.toFixed(1)}% ${a.toFixed(1)} ${b.toFixed(1)})`;
}

export const FORMATS = {
	hex: fmtHex,
	rgb: fmtRgb,
	hsl: fmtHsl,
	oklch: fmtOklch,
	lab: fmtLab,
};

let _toastEl = null;
let _toastTimer = null;

export function toast(msg) {
	if (!_toastEl) _toastEl = document.getElementById("toast");
	if (!_toastEl) return;
	_toastEl.textContent = msg;
	_toastEl.classList.add("is-visible");
	clearTimeout(_toastTimer);
	_toastTimer = setTimeout(() => _toastEl.classList.remove("is-visible"), 1400);
}

export async function copy(text) {
	try {
		await navigator.clipboard.writeText(text);
		toast(`copied · ${text}`);
		return true;
	} catch (e) {
		toast("copy failed");
		return false;
	}
}

export function readableInkOn(c) {
	// pick black or white text on a given swatch background
	const white = c.contrast("#ffffff");
	const black = c.contrast("#000000");
	return black >= white ? "#0d0c08" : "#f7f1de";
}

export function randomHex() {
	const r = () => Math.floor(Math.random() * 256);
	const h = (n) => n.toString(16).padStart(2, "0");
	return "#" + h(r()) + h(r()) + h(r());
}
