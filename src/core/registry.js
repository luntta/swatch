// Color space registry and conversion router.
//
// Spaces register themselves with `registerSpace`. Each space provides:
//
//   id        — string identifier (e.g. "srgb", "oklab", "display-p3")
//   channels  — names of the 3 channels (e.g. ["r", "g", "b"])
//   ranges    — natural ranges for each channel, used by clamping/normalization
//   white     — D65 (default) or D50 — used to know whether a Bradford CAT
//               needs to run on the way to/from the canonical XYZ-D65 hub
//   toXYZ     — convert this space's coords → CIE XYZ D65
//   fromXYZ   — convert CIE XYZ D65 → this space's coords
//   shortcuts — optional direct converters keyed by destination space id, used
//               to bypass the XYZ hub for accuracy/speed (e.g. linear sRGB ↔
//               OKLab is a single matrix multiply that loses precision if you
//               round-trip via XYZ).
//
// Conversion lookup: A → B is attempted in this order:
//   1. A === B → identity
//   2. A.shortcuts[B] if defined
//   3. B.fromXYZ(A.toXYZ(coords))

const spaces = new Map();

export function registerSpace(space) {
	if (!space || typeof space.id !== "string") {
		throw new Error("registerSpace: missing id");
	}
	if (typeof space.toXYZ !== "function" || typeof space.fromXYZ !== "function") {
		throw new Error(`registerSpace[${space.id}]: missing toXYZ/fromXYZ`);
	}
	const entry = {
		id: space.id,
		channels: space.channels || ["c1", "c2", "c3"],
		ranges: space.ranges || null,
		white: space.white || "D65",
		toXYZ: space.toXYZ,
		fromXYZ: space.fromXYZ,
		shortcuts: space.shortcuts || {}
	};
	spaces.set(space.id, entry);
	return entry;
}

export function getSpace(id) {
	const entry = spaces.get(id);
	if (!entry) throw new Error(`Unknown color space: ${id}`);
	return entry;
}

export function hasSpace(id) {
	return spaces.has(id);
}

export function listSpaces() {
	return Array.from(spaces.keys());
}

// Convert coords from one space to another. Coords is a length-3 array.
// Returns a new length-3 array (does not mutate input).
export function convert(coords, fromId, toId) {
	if (fromId === toId) {
		return [coords[0], coords[1], coords[2]];
	}
	const from = getSpace(fromId);
	const to = getSpace(toId);

	// Direct shortcut?
	if (from.shortcuts[toId]) {
		return from.shortcuts[toId](coords);
	}

	// Hub route via XYZ D65.
	const xyz = from.toXYZ(coords);
	return to.fromXYZ(xyz);
}
