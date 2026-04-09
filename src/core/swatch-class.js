// Swatch — the v3 color class.
//
// Each instance holds an immutable canonical `state` object
// ({ space, coords, alpha }) and exposes lazy memoized getters for every
// registered color space. Conversions are routed through the space registry
// (see src/core/registry.js), which uses CIE XYZ D65 as the hub.
//
// For Phase 1 the public surface is minimal: the canonical state, the
// `to(space)` converter, and the foundation-space getters (`srgb`,
// `linearSrgb`, `xyz`). Later phases register more spaces and each one
// automatically becomes accessible via `swatch.to('<space>')` without
// touching this file.

import { makeState, cloneState } from "./state.js";
import { convert, getSpace, listSpaces } from "./registry.js";
import { formatCss } from "../format/css.js";

export class Swatch {
	constructor(state) {
		if (!state || typeof state.space !== "string") {
			throw new Error("Swatch: state must be { space, coords, alpha }");
		}
		this._state = makeState(state.space, state.coords, state.alpha);
		this._cache = new Map();
		// Expose foundation fields directly for ergonomics.
		this.space = this._state.space;
		this.alpha = this._state.alpha;
	}

	// Raw coords in the source space (no conversion).
	get coords() {
		return [
			this._state.coords[0],
			this._state.coords[1],
			this._state.coords[2]
		];
	}

	// Convert to another registered space. Returns a new Swatch.
	to(spaceId) {
		if (spaceId === this._state.space) return this;
		const coords = this._getCoordsIn(spaceId);
		return new Swatch({
			space: spaceId,
			coords,
			alpha: this._state.alpha
		});
	}

	// Memoized raw coords in a given space, as a length-3 array. Internal use;
	// most callers should use the named getters below or `.to(space).coords`.
	_getCoordsIn(spaceId) {
		if (spaceId === this._state.space) {
			return [
				this._state.coords[0],
				this._state.coords[1],
				this._state.coords[2]
			];
		}
		if (this._cache.has(spaceId)) {
			const cached = this._cache.get(spaceId);
			return [cached[0], cached[1], cached[2]];
		}
		const result = convert(this._state.coords, this._state.space, spaceId);
		this._cache.set(spaceId, result);
		return [result[0], result[1], result[2]];
	}

	// Return a plain object {c1, c2, c3} keyed by the space's channel names.
	_asObjectIn(spaceId) {
		const coords = this._getCoordsIn(spaceId);
		const space = getSpace(spaceId);
		const [k1, k2, k3] = space.channels;
		return { [k1]: coords[0], [k2]: coords[1], [k3]: coords[2] };
	}

	// Clone (independent copy). The cache is not copied, which is fine because
	// lookups are deterministic.
	clone() {
		return new Swatch(cloneState(this._state));
	}

	// ─── Foundation-space getters ──────────────────────────────────────
	//
	// These return plain objects in the natural channel layout of each space.
	// Later phases register the other spaces in the registry and add matching
	// getters here.

	get srgb() {
		return this._asObjectIn("srgb");
	}

	get linearSrgb() {
		return this._asObjectIn("srgb-linear");
	}

	get xyz() {
		return this._asObjectIn("xyz");
	}

	get lab() {
		return this._asObjectIn("lab");
	}

	get lch() {
		return this._asObjectIn("lch");
	}

	get oklab() {
		return this._asObjectIn("oklab");
	}

	get oklch() {
		return this._asObjectIn("oklch");
	}

	get hsl() {
		return this._asObjectIn("hsl");
	}

	get displayP3() {
		return this._asObjectIn("display-p3");
	}

	get rec2020() {
		return this._asObjectIn("rec2020");
	}

	get a98() {
		return this._asObjectIn("a98");
	}

	get prophoto() {
		return this._asObjectIn("prophoto");
	}

	// ─── CSS serialization ─────────────────────────────────────────────

	toString(opts) {
		return formatCss(this, opts);
	}

	toCss(opts) {
		return formatCss(this, opts);
	}

	// ─── Channel get/set ───────────────────────────────────────────────
	//
	// Late-bound to avoid circulars with src/operations/channels.js.

	get(path) {
		return _getChannel(this, path);
	}

	set(path, value) {
		return _setChannel(this, path, value);
	}

	// ─── Gamut ─────────────────────────────────────────────────────────

	inGamut(spaceId, opts) {
		return _inGamut(this, spaceId, opts);
	}

	toGamut(opts) {
		return _toGamut(this, opts);
	}
}

let _getChannel = null;
let _setChannel = null;
export function _bindChannels(getFn, setFn) {
	_getChannel = getFn;
	_setChannel = setFn;
}

let _inGamut = null;
let _toGamut = null;
export function _bindGamut(inFn, toFn) {
	_inGamut = inFn;
	_toGamut = toFn;
}

// Factory / invocation without `new`.
export function swatchFromState(state) {
	return new Swatch(state);
}

// Build a Swatch from any recognized input form (string, object literal,
// or existing Swatch). Throws on unrecognized input. Lazily imported to
// avoid a circular dep between Swatch and the parser dispatcher.
let _parseInput = null;
export function _bindParseInput(fn) {
	_parseInput = fn;
}

export function swatch(input) {
	if (input instanceof Swatch) return input;
	if (!_parseInput) {
		throw new Error(
			"swatch(): parser not initialized. Import src/bootstrap.js first."
		);
	}
	const state = _parseInput(input);
	if (!state) {
		throw new Error(
			"swatch(): could not parse input: " + JSON.stringify(input)
		);
	}
	return new Swatch(state);
}

// Helper for tests: is a given id registered?
export function knownSpaces() {
	return listSpaces();
}
