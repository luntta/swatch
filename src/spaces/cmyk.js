// CMYK — naive device-independent conversion.
//
// WARNING: this is the textbook "no profile" CMYK that every color
// library ships. It has no relationship to any real printer's behavior,
// which requires an ICC profile and a specific ink set. For on-screen
// use (CMYK-as-quadruple in CSS pipelines, CMYK-ish color picker math),
// it's fine; for print production, run it through a real CMS.

import { registerSpace, getSpace } from "../core/registry.js";

export function srgbToCmyk(rgb) {
	const [r, g, b] = rgb;
	const k = 1 - Math.max(r, g, b);
	if (k >= 1 - 1e-12) return [0, 0, 0, 1];
	const c = (1 - r - k) / (1 - k);
	const m = (1 - g - k) / (1 - k);
	const y = (1 - b - k) / (1 - k);
	return [c, m, y, k];
}

export function cmykToSrgb(cmyk) {
	const [c, m, y, k] = cmyk;
	return [(1 - c) * (1 - k), (1 - m) * (1 - k), (1 - y) * (1 - k)];
}

// CMYK is 4-channel, which doesn't fit the 3-channel canonical state.
// We store it in a 3-channel shell by stashing K in the conversion
// shortcut layer: the registry treats cmyk as { c, m, y } plus a
// separate `_k` stored via the second-channel pattern... wait, that
// breaks the invariant.
//
// Simpler: cmyk is stored as [c, m, y] internally with K derived on
// conversion. To preserve all four values for a user who constructs
// from {c, m, y, k}, we embed k into the space by treating the storage
// as 3D and converting deterministically on the way in/out — losing a
// degree of freedom. This matches colorjs.io's approach: CMYK is a
// "view" not a "storage" space. parse/objects.js therefore immediately
// converts {c,m,y,k} into sRGB and stores it as srgb.
//
// For registration purposes, CMYK is still a registered space so
// `c.cmyk` and `c.to('cmyk')` work — it converts sRGB on demand.
// Channels on the stored state are [c, m, y]; K is computed at read
// time by re-running srgbToCmyk on the round-tripped sRGB coords.

export function srgbToCmykTriplet(rgb) {
	// Store [c, m, y] compressed without K; the sRGB round-trip
	// loses the K degree of freedom which is fine since device-
	// independent CMYK is a view, not a storage space.
	const [c, m, y, k] = srgbToCmyk(rgb);
	// Fold K into CMY for the 3-channel view:
	return [c + k - c * k, m + k - m * k, y + k - y * k];
}

export function cmykTripletToSrgb(cmy) {
	// Inverse of the folded-K representation.
	return [1 - cmy[0], 1 - cmy[1], 1 - cmy[2]];
}

registerSpace({
	id: "cmyk",
	channels: ["c", "m", "y"],
	ranges: [
		[0, 1],
		[0, 1],
		[0, 1]
	],
	white: "D65",
	toXYZ: (coords) => getSpace("srgb").toXYZ(cmykTripletToSrgb(coords)),
	fromXYZ: (xyz) => srgbToCmykTriplet(getSpace("srgb").fromXYZ(xyz)),
	shortcuts: {
		srgb: (coords) => cmykTripletToSrgb(coords)
	}
});

getSpace("srgb").shortcuts.cmyk = (coords) => srgbToCmykTriplet(coords);
