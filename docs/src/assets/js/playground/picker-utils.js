// ============================================================
// Native color picker helpers
// ============================================================

import swatch from "../lib/swatch.js";
import { fmtHex } from "./format.js";

function toHex(value) {
	if (value && typeof value === "object") {
		try {
			return fmtHex(value);
		} catch (e) {}
	}
	if (!String(value || "").trim()) return null;
	try {
		return fmtHex(swatch(value));
	} catch (e) {
		return null;
	}
}

function isSeparator(ch, separators) {
	return separators.includes(ch);
}

function tokenBoundsAtCaret(input, separators) {
	const value = input.value;
	const pos =
		typeof input.selectionStart === "number"
			? input.selectionStart
			: value.length;
	let start = pos;
	let end = pos;

	while (start > 0 && !isSeparator(value[start - 1], separators)) start--;
	while (end < value.length && !isSeparator(value[end], separators)) end++;

	return { start, end };
}

export function firstColorInInput(input, separators = ",\n") {
	return input.value
		.split(new RegExp(`[${separators.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}]`))
		.map((s) => s.trim())
		.filter(Boolean)
		.map(toHex)
		.find(Boolean);
}

export function colorAtCaret(input, separators = ",\n") {
	const { start, end } = tokenBoundsAtCaret(input, separators);
	return toHex(input.value.slice(start, end).trim());
}

export function setPickerColor(picker, chip, value) {
	const hex = toHex(value);
	if (!hex) return false;
	picker.value = hex;
	if (chip) chip.style.background = hex;
	return true;
}

export function syncPickerFromInput(picker, chip, input, separators = ",\n") {
	const hex = colorAtCaret(input, separators) || firstColorInInput(input, separators);
	if (!hex) return false;
	picker.value = hex;
	if (chip) chip.style.background = hex;
	return true;
}

export function replaceColorAtCaret(input, hex, separators = ",\n") {
	const value = input.value;
	if (!value.trim()) {
		input.value = hex;
		input.setSelectionRange?.(hex.length, hex.length);
		return;
	}

	const { start, end } = tokenBoundsAtCaret(input, separators);
	let replaceStart = start;
	let replaceEnd = end;
	while (replaceStart < replaceEnd && /\s/.test(value[replaceStart])) {
		replaceStart++;
	}
	while (replaceEnd > replaceStart && /\s/.test(value[replaceEnd - 1])) {
		replaceEnd--;
	}

	const next = value.slice(0, replaceStart) + hex + value.slice(replaceEnd);
	input.value = next;
	const cursor = replaceStart + hex.length;
	input.setSelectionRange?.(cursor, cursor);
}
