// Main input dispatcher. Returns a v3 state object, or throws on
// unrecognized input. Order is significant: v3 instance → object → string
// forms (CSS Color 4 → legacy → hex → named).
//
// parse/css.js lands in Phase 4; until then the modern CSS Color 4 forms
// fall through to legacy (for rgb/hsl) or fail.

import { Swatch } from "../core/swatch-class.js";
import { parseObject } from "./objects.js";
import { parseLegacy } from "./legacy.js";
import { parseHex } from "./hex.js";
import { parseNamed } from "./named.js";

let cssParser = null; // wired by parse/css.js later

export function registerCssParser(fn) {
	cssParser = fn;
}

export function parseInput(input) {
	if (input instanceof Swatch) return input._state;

	if (input && typeof input === "object") {
		const obj = parseObject(input);
		if (obj) return obj;
	}

	if (typeof input === "string") {
		const trimmed = input.trim();
		if (cssParser) {
			const css = cssParser(trimmed);
			if (css) return css;
		}
		const legacy = parseLegacy(trimmed);
		if (legacy) return legacy;
		const hex = parseHex(trimmed);
		if (hex) return hex;
		const named = parseNamed(trimmed);
		if (named) return named;
	}

	return null;
}
