// CSS named color lookup (148 names + `transparent`). Case-insensitive.

import namedColors from "../data/named-colors.js";
import { parseHex } from "./hex.js";

export function parseNamed(input) {
	if (typeof input !== "string") return null;
	const key = input.trim().toLowerCase();
	if (!Object.prototype.hasOwnProperty.call(namedColors, key)) return null;
	return parseHex("#" + namedColors[key]);
}
