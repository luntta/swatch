// Built-in palette registry.
//
// Phase 17 lands the scale infrastructure with this stub; Phase 18
// will fill in viridis/magma/plasma/inferno/cividis and ColorBrewer.

const REGISTRY = new Map();

export function registerPalette(name, stops) {
	REGISTRY.set(name, stops);
}

export function getPalette(name) {
	return REGISTRY.get(name) || null;
}

export function listPalettes() {
	return Array.from(REGISTRY.keys());
}
