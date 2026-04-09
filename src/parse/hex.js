// Hex color parsing.
//
// Accepts 3, 4, 6, and 8 hex digit forms with optional leading `#`:
//
//   #rgb         → { space: 'srgb', coords: [r,g,b],     alpha: 1 }
//   #rgba        → { space: 'srgb', coords: [r,g,b],     alpha: a }
//   #rrggbb      → { space: 'srgb', coords: [r,g,b],     alpha: 1 }
//   #rrggbbaa    → { space: 'srgb', coords: [r,g,b],     alpha: a }
//
// Returns null if the input is not a hex string so callers can fall
// through to other parsers.

const HEX = /^#?([\da-f]{3,8})$/i;

export function parseHex(input) {
	if (typeof input !== "string") return null;
	const match = HEX.exec(input.trim());
	if (!match) return null;
	const digits = match[1];
	const len = digits.length;
	if (len === 3 || len === 4) {
		const r = parseInt(digits[0] + digits[0], 16) / 255;
		const g = parseInt(digits[1] + digits[1], 16) / 255;
		const b = parseInt(digits[2] + digits[2], 16) / 255;
		const a =
			len === 4 ? parseInt(digits[3] + digits[3], 16) / 255 : 1;
		return { space: "srgb", coords: [r, g, b], alpha: a };
	}
	if (len === 6 || len === 8) {
		const r = parseInt(digits.slice(0, 2), 16) / 255;
		const g = parseInt(digits.slice(2, 4), 16) / 255;
		const b = parseInt(digits.slice(4, 6), 16) / 255;
		const a =
			len === 8 ? parseInt(digits.slice(6, 8), 16) / 255 : 1;
		return { space: "srgb", coords: [r, g, b], alpha: a };
	}
	return null;
}
