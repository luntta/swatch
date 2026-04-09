// Legacy CSS string parsers: rgb()/rgba()/hsl()/hsla().
//
// Accepts both the comma-separated (legacy) and whitespace + slash (modern)
// syntaxes, because v2 accepted both and existing tests depend on it.
// Modern CSS Color 4 extras like the `none` keyword and `<percentage>`
// alpha are handled in parse/css.js (Phase 4).
//
// Hue units supported: bare number (deg), `deg`, `rad`, `turn`. Mirrors
// v2's behavior in `_HSLToRGB` (src/swatch.js:546-613) and `_HSLAToRGBA`
// (src/swatch.js:625-730).

const RGB_FN = /^rgba?\(([^)]+)\)$/i;
const HSL_FN = /^hsla?\(([^)]+)\)$/i;

function splitArgs(body) {
	// Split on slashes, commas, or runs of whitespace. The slash is
	// always a separator for the alpha argument.
	const slashParts = body.split("/").map((s) => s.trim());
	const main = slashParts[0];
	const alphaStr = slashParts[1];
	const parts = main.split(/[\s,]+/).filter(Boolean);
	if (alphaStr != null && alphaStr !== "") parts.push(alphaStr);
	return parts;
}

function parsePercentOrNumber(token) {
	if (token.endsWith("%")) {
		return parseFloat(token.slice(0, -1)) / 100;
	}
	return parseFloat(token);
}

function parseAlpha(token) {
	if (token == null) return 1;
	if (token.endsWith("%")) return parseFloat(token.slice(0, -1)) / 100;
	const n = parseFloat(token);
	return isNaN(n) ? 1 : n;
}

function parseHue(token) {
	// Bare number is degrees.
	if (/turn$/i.test(token)) return parseFloat(token.slice(0, -4)) * 360;
	if (/rad$/i.test(token)) return (parseFloat(token.slice(0, -3)) * 180) / Math.PI;
	if (/deg$/i.test(token)) return parseFloat(token.slice(0, -3));
	return parseFloat(token);
}

export function parseRgbFn(input) {
	if (typeof input !== "string") return null;
	const match = RGB_FN.exec(input.trim());
	if (!match) return null;
	const parts = splitArgs(match[1]);
	if (parts.length !== 3 && parts.length !== 4) return null;

	// Each of r, g, b may be a number in 0..255 or a percentage 0..100%.
	const parseChannel = (token) => {
		if (token.endsWith("%")) {
			return parseFloat(token.slice(0, -1)) / 100;
		}
		const n = parseFloat(token);
		return n / 255;
	};
	const r = parseChannel(parts[0]);
	const g = parseChannel(parts[1]);
	const b = parseChannel(parts[2]);
	const a = parts.length === 4 ? parseAlpha(parts[3]) : 1;
	if (isNaN(r) || isNaN(g) || isNaN(b) || isNaN(a)) return null;
	return { space: "srgb", coords: [r, g, b], alpha: a };
}

export function parseHslFn(input) {
	if (typeof input !== "string") return null;
	const match = HSL_FN.exec(input.trim());
	if (!match) return null;
	const parts = splitArgs(match[1]);
	if (parts.length !== 3 && parts.length !== 4) return null;

	const h = parseHue(parts[0]);
	const s = parsePercentOrNumber(parts[1]) * 100;
	const l = parsePercentOrNumber(parts[2]) * 100;
	const a = parts.length === 4 ? parseAlpha(parts[3]) : 1;
	if (isNaN(h) || isNaN(s) || isNaN(l) || isNaN(a)) return null;
	return { space: "hsl", coords: [h, s, l], alpha: a };
}

export function parseLegacy(input) {
	return parseRgbFn(input) || parseHslFn(input);
}
