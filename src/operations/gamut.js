// Gamut detection and mapping.
//
// `inGamut(swatch, spaceId)` reports whether the color fits inside the
// [0, 1] cube of the target display RGB space. Only gamut-bounded spaces
// are meaningful; for unbounded spaces (Lab, OKLab, XYZ, polar forms) the
// function always returns `true`.
//
// `toGamut(swatch, opts)` maps an out-of-gamut color into the target
// space. Two methods:
//
//   'clip'   — convert to target and clamp each channel. Fast, but
//               shifts hue in a perceptually unfriendly way.
//   'css4'   — the CSS Color 4 binary chroma reduction: hold OKLCh L
//               and H fixed, binary-search C downward until the clipped
//               result is within ΔEOK < 0.02 of the candidate. Hue is
//               preserved, lightness drifts only minimally.
//
// 'oklch-chroma' is an alias for 'css4'.

import { Swatch } from "../core/swatch-class.js";
import { getSpace } from "../core/registry.js";
import { clamp } from "../util/math.js";

const DEFAULT_EPSILON = 1e-5;
const JND = 0.02;
const SEARCH_EPSILON = 1e-4;

// The set of display RGB spaces whose natural coord domain is [0, 1]^3.
// Phase 7 extends this list when display-p3, rec2020, a98, and prophoto
// register.
const RGB_GAMUT_SPACES = new Set([
	"srgb",
	"srgb-linear",
	"display-p3",
	"rec2020",
	"a98",
	"prophoto"
]);

export function isGamutBounded(spaceId) {
	return RGB_GAMUT_SPACES.has(spaceId);
}

export function inGamut(swatch, spaceId = "srgb", opts = {}) {
	if (!isGamutBounded(spaceId)) return true;
	const epsilon = opts.epsilon ?? DEFAULT_EPSILON;
	const coords = swatch._getCoordsIn(spaceId);
	for (let i = 0; i < 3; i++) {
		if (coords[i] < -epsilon) return false;
		if (coords[i] > 1 + epsilon) return false;
	}
	return true;
}

function clipCoords(coords) {
	return [clamp(coords[0], 0, 1), clamp(coords[1], 0, 1), clamp(coords[2], 0, 1)];
}

function deltaEOK(lab1, lab2) {
	const dL = lab1[0] - lab2[0];
	const da = lab1[1] - lab2[1];
	const db = lab1[2] - lab2[2];
	return Math.sqrt(dL * dL + da * da + db * db);
}

// Convert an (L, C, H) OKLCh triple to a target RGB space's coords.
function oklchToTarget(L, C, H, targetId) {
	const oklch = getSpace("oklch");
	const target = getSpace(targetId);
	// Shortcut if oklch has one, else via XYZ.
	if (oklch.shortcuts[targetId]) {
		return oklch.shortcuts[targetId]([L, C, H]);
	}
	return target.fromXYZ(oklch.toXYZ([L, C, H]));
}

// Convert an RGB-space triple to OKLab coords (for ΔEOK).
function targetToOklab(coords, targetId) {
	const target = getSpace(targetId);
	const oklab = getSpace("oklab");
	if (target.shortcuts.oklab) {
		return target.shortcuts.oklab(coords);
	}
	return oklab.fromXYZ(target.toXYZ(coords));
}

function oklchToOklab(L, C, H) {
	const oklch = getSpace("oklch");
	if (oklch.shortcuts.oklab) {
		return oklch.shortcuts.oklab([L, C, H]);
	}
	const oklab = getSpace("oklab");
	return oklab.fromXYZ(oklch.toXYZ([L, C, H]));
}

function clipInto(swatch, targetId) {
	const coords = swatch._getCoordsIn(targetId);
	return new Swatch({
		space: targetId,
		coords: clipCoords(coords),
		alpha: swatch.alpha
	});
}

function toGamutCss4(swatch, targetId) {
	// Convert to OKLCh to read L and H.
	const originOklch = swatch._getCoordsIn("oklch");
	const L = originOklch[0];
	const originC = originOklch[1];
	const H = originOklch[2];

	// Edge cases: pure white / pure black.
	if (L >= 1 - 1e-12) {
		return new Swatch({ space: targetId, coords: [1, 1, 1], alpha: swatch.alpha });
	}
	if (L <= 1e-12) {
		return new Swatch({ space: targetId, coords: [0, 0, 0], alpha: swatch.alpha });
	}

	// Quick-return if the clipped origin is already perceptually close.
	const originTarget = swatch._getCoordsIn(targetId);
	const originClipped = clipCoords(originTarget);
	const originClippedOklab = targetToOklab(originClipped, targetId);
	const originOklab = oklchToOklab(L, originC, H);
	if (deltaEOK(originClippedOklab, originOklab) < JND) {
		return new Swatch({
			space: targetId,
			coords: originClipped,
			alpha: swatch.alpha
		});
	}

	// Binary search chroma.
	let min = 0;
	let max = originC;
	let minInGamut = true;
	let lastClipped = originClipped;

	while (max - min > SEARCH_EPSILON) {
		const chroma = (min + max) / 2;
		const candidate = oklchToTarget(L, chroma, H, targetId);

		const candidateInGamut =
			candidate[0] >= -DEFAULT_EPSILON &&
			candidate[0] <= 1 + DEFAULT_EPSILON &&
			candidate[1] >= -DEFAULT_EPSILON &&
			candidate[1] <= 1 + DEFAULT_EPSILON &&
			candidate[2] >= -DEFAULT_EPSILON &&
			candidate[2] <= 1 + DEFAULT_EPSILON;

		if (minInGamut && candidateInGamut) {
			min = chroma;
			lastClipped = clipCoords(candidate);
			continue;
		}

		const clipped = clipCoords(candidate);
		const clippedOklab = targetToOklab(clipped, targetId);
		const candOklab = oklchToOklab(L, chroma, H);
		const E = deltaEOK(clippedOklab, candOklab);

		if (E < JND) {
			if (JND - E < SEARCH_EPSILON) {
				lastClipped = clipped;
				break;
			}
			minInGamut = false;
			min = chroma;
			lastClipped = clipped;
		} else {
			max = chroma;
		}
	}

	return new Swatch({
		space: targetId,
		coords: lastClipped,
		alpha: swatch.alpha
	});
}

export function toGamut(swatch, opts = {}) {
	const spaceId = opts.space ?? "srgb";
	const method = opts.method ?? "css4";
	if (!isGamutBounded(spaceId)) {
		// Not a bounded target — just convert.
		return swatch.to(spaceId);
	}
	if (inGamut(swatch, spaceId)) {
		return swatch.to(spaceId);
	}
	if (method === "clip") {
		return clipInto(swatch, spaceId);
	}
	if (method === "css4" || method === "oklch-chroma") {
		return toGamutCss4(swatch, spaceId);
	}
	throw new Error(`toGamut: unknown method "${method}"`);
}
