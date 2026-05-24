// Channel get/set by path.
//
// Paths are either the literal `'alpha'`, or `'<space>.<channel>'` where
// space is a registered space id (with `'rgb'` as an alias for `'srgb'`)
// and channel is one of the space's channel names.
//
// `get(swatch, path)` returns the current value — converting to the
// target space if necessary. `set(swatch, path, value)` returns a NEW
// Swatch with the channel updated; the result's source space is the
// space named in the path (so `set(red, 'oklch.l', 0.5).space === 'oklch'`).

import { Swatch } from "../core/swatch-class.js";
import { getSpace, hasSpace, listSpaces } from "../core/registry.js";
import { appendSuggestion, closestMatch } from "../util/suggest.js";

const SPACE_ALIASES = {
	rgb: "srgb"
};

// Long-form channel names → the single-letter channel they refer to, scoped
// per channel layout. Scoping matters because the same letter means different
// things in different spaces: "b" is blue in rgb but blackness in hwb, and in
// lab/oklab the a/b axes have no common long name at all. A single global map
// would mis-suggest blackness's "b" for a stray `hwb.blue`.
const CHANNEL_HINTS_BY_LAYOUT = {
	"r,g,b": { red: "r", green: "g", blue: "b" },
	"h,s,l": { hue: "h", saturation: "s", lightness: "l", luminosity: "l" },
	"h,s,v": { hue: "h", saturation: "s", value: "v", brightness: "v" },
	"h,w,b": { hue: "h", whiteness: "w", white: "w", blackness: "b", black: "b" },
	"l,c,h": { lightness: "l", luminance: "l", chroma: "c", hue: "h" },
	"c,m,y,k": { cyan: "c", magenta: "m", yellow: "y", black: "k", key: "k" }
};

function foldCmyk({ c, m, y, k }) {
	return [c + k - c * k, m + k - m * k, y + k - y * k];
}

function resolveSpaceId(token) {
	if (SPACE_ALIASES[token]) return SPACE_ALIASES[token];
	return token;
}

function suggestChannel(channel, channels) {
	const table = CHANNEL_HINTS_BY_LAYOUT[channels.join(",")];
	const hinted = table?.[channel];
	if (hinted && channels.includes(hinted)) return hinted;
	return closestMatch(channel, channels);
}

function parsePath(path) {
	if (typeof path !== "string" || path.length === 0) {
		throw new Error("channel path: expected non-empty string");
	}
	if (path === "alpha") {
		return { kind: "alpha" };
	}
	const dotIdx = path.indexOf(".");
	if (dotIdx < 0) {
		throw new Error(
			`channel path: "${path}" must be "<space>.<channel>" or "alpha"`
		);
	}
	const spaceToken = path.slice(0, dotIdx).toLowerCase();
	const channel = path.slice(dotIdx + 1).toLowerCase();
	const spaceId = resolveSpaceId(spaceToken);
	if (!hasSpace(spaceId)) {
		throw new Error(
			appendSuggestion(
				`channel path: unknown space "${spaceToken}"`,
				spaceToken,
				["rgb", ...listSpaces()]
			)
		);
	}
	if (spaceId === "cmyk" && channel === "k") {
		return { kind: "cmyk-k" };
	}
	const space = getSpace(spaceId);
	const idx = space.channels.indexOf(channel);
	if (idx < 0) {
		const suggestion = suggestChannel(channel, space.channels);
		const maybeSuggestion = suggestion
			? ` Did you mean "${suggestion}"?`
			: "";
		throw new Error(
			`channel path: space "${spaceId}" has no channel "${channel}".${maybeSuggestion} Valid channels: ${space.channels.join(", ")}.`
		);
	}
	return { kind: "channel", spaceId, channel, index: idx };
}

export function getChannel(swatch, path) {
	const parsed = parsePath(path);
	if (parsed.kind === "alpha") return swatch.alpha;
	if (parsed.kind === "cmyk-k") return swatch.cmyk.k;
	return swatch._getCoordsIn(parsed.spaceId)[parsed.index];
}

export function setChannel(swatch, path, value) {
	const parsed = parsePath(path);
	if (parsed.kind === "alpha") {
		return new Swatch({
			space: swatch.space,
			coords: swatch.coords,
			alpha: value
		});
	}
	if (parsed.kind === "cmyk-k") {
		const cmyk = swatch.cmyk;
		return new Swatch({
			space: "cmyk",
			coords: foldCmyk({ ...cmyk, k: value }),
			alpha: swatch.alpha
		});
	}
	const coords = swatch._getCoordsIn(parsed.spaceId);
	coords[parsed.index] = value;
	return new Swatch({
		space: parsed.spaceId,
		coords,
		alpha: swatch.alpha
	});
}
