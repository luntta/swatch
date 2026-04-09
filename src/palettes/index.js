// Built-in palette registry.
//
// Registers the matplotlib perceptually-uniform maps
// (viridis/magma/plasma/inferno/cividis) and the ColorBrewer 2.0
// sequential/diverging/qualitative sets. Users can look up any of
// them via swatch.scale('<name>').

import {
	viridis,
	magma,
	plasma,
	inferno,
	cividis
} from "./viridis.js";
import * as brewer from "./colorbrewer.js";

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

// Matplotlib perceptually-uniform.
registerPalette("viridis", viridis);
registerPalette("magma", magma);
registerPalette("plasma", plasma);
registerPalette("inferno", inferno);
registerPalette("cividis", cividis);

// ColorBrewer sequential.
registerPalette("Blues", brewer.Blues);
registerPalette("Greens", brewer.Greens);
registerPalette("Reds", brewer.Reds);
registerPalette("Oranges", brewer.Oranges);
registerPalette("Purples", brewer.Purples);
registerPalette("Greys", brewer.Greys);

// ColorBrewer diverging.
registerPalette("RdBu", brewer.RdBu);
registerPalette("RdYlBu", brewer.RdYlBu);
registerPalette("PiYG", brewer.PiYG);
registerPalette("BrBG", brewer.BrBG);
registerPalette("Spectral", brewer.Spectral);

// ColorBrewer qualitative.
registerPalette("Set1", brewer.Set1);
registerPalette("Set2", brewer.Set2);
registerPalette("Set3", brewer.Set3);
registerPalette("Pastel1", brewer.Pastel1);
registerPalette("Dark2", brewer.Dark2);
