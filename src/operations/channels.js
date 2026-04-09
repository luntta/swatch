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
import { getSpace, hasSpace } from "../core/registry.js";

const SPACE_ALIASES = {
	rgb: "srgb"
};

function resolveSpaceId(token) {
	if (SPACE_ALIASES[token]) return SPACE_ALIASES[token];
	return token;
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
		throw new Error(`channel path: unknown space "${spaceToken}"`);
	}
	const space = getSpace(spaceId);
	const idx = space.channels.indexOf(channel);
	if (idx < 0) {
		throw new Error(
			`channel path: space "${spaceId}" has no channel "${channel}" (has ${space.channels.join(", ")})`
		);
	}
	return { kind: "channel", spaceId, channel, index: idx };
}

export function getChannel(swatch, path) {
	const parsed = parsePath(path);
	if (parsed.kind === "alpha") return swatch.alpha;
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
	const coords = swatch._getCoordsIn(parsed.spaceId);
	coords[parsed.index] = value;
	return new Swatch({
		space: parsed.spaceId,
		coords,
		alpha: swatch.alpha
	});
}
