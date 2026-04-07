// ============================================================
// Swatch playground · root-color store + URL hash sync
// ============================================================

import swatch from "../swatch.js";

const STORAGE_KEY = "swatch-root";
const HASH_KEY = "c";

function readHash() {
	if (typeof location === "undefined" || !location.hash) return null;
	const params = new URLSearchParams(location.hash.replace(/^#/, ""));
	const raw = params.get(HASH_KEY);
	if (!raw) return null;
	try {
		return decodeURIComponent(raw);
	} catch (e) {
		return raw;
	}
}

function writeHash(value) {
	const params = new URLSearchParams(location.hash.replace(/^#/, ""));
	params.set(HASH_KEY, value);
	const next = "#" + params.toString();
	if (location.hash !== next) {
		history.replaceState(null, "", next);
	}
}

let _root = null;
const listeners = new Set();
let _writeTimer = null;

function safeSwatch(input) {
	const c = swatch(input);
	return c && c.isValid ? c : null;
}

export function getRoot() {
	return _root;
}

export function setRoot(input, opts = {}) {
	const c = typeof input === "string" ? safeSwatch(input) : input;
	if (!c || !c.isValid) return false;
	_root = c;
	notify();

	clearTimeout(_writeTimer);
	_writeTimer = setTimeout(() => {
		try {
			localStorage.setItem(STORAGE_KEY, c.hex);
		} catch (e) {}
		if (!opts.skipHash) writeHash(c.hex);
	}, 150);
	return true;
}

export function subscribe(fn) {
	listeners.add(fn);
	if (_root) fn(_root);
	return () => listeners.delete(fn);
}

function notify() {
	for (const fn of listeners) {
		try {
			fn(_root);
		} catch (e) {
			console.error(e);
		}
	}
}

export function init(defaultColor = "#c5341c") {
	const fromHash = readHash();
	let stored = null;
	try {
		stored = localStorage.getItem(STORAGE_KEY);
	} catch (e) {}
	const initial = fromHash || stored || defaultColor;
	const c = safeSwatch(initial) || safeSwatch(defaultColor);
	_root = c;
	notify();

	window.addEventListener("hashchange", () => {
		const next = readHash();
		if (!next) return;
		const c = safeSwatch(next);
		if (c && c.hex !== _root.hex) {
			_root = c;
			notify();
		}
	});
}
