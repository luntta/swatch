// Color naming — nearest named color by ΔE2000.
//
// Uses the CSS Color Module Level 4 named-color list from
// src/data/named-colors.js. At module load time we precompute Lab
// D65 coordinates for each entry so that `name()` only needs to
// convert the query color once per call.
//
// Because several CSS names are synonyms (aqua ↔ cyan, grey ↔ gray,
// magenta ↔ fuchsia), we deduplicate by hex — an exact match to any
// of these returns one canonical name but both names remain valid
// matches via the dedup table.

import { Swatch, swatch } from "../core/swatch-class.js";
import { convert } from "../core/registry.js";
import { deltaE2000 } from "./deltaE.js";
import namedColors from "../data/named-colors.js";

// Canonical list: deduplicated by hex, preferring the first name in
// iteration order. `transparent` is excluded (it has no chromatic
// meaning for naming purposes).
//
// We build the table at module-load time without going through the
// swatch() factory, because bootstrap.js imports this module *before*
// it installs the parser — using swatch() here would crash with
// "parser not initialized".
const ENTRIES = [];
const SEEN_HEX = new Map();

function hexToSrgb(hex) {
	const r = parseInt(hex.slice(0, 2), 16) / 255;
	const g = parseInt(hex.slice(2, 4), 16) / 255;
	const b = parseInt(hex.slice(4, 6), 16) / 255;
	return [r, g, b];
}

for (const [colorName, hex] of Object.entries(namedColors)) {
	if (colorName === "transparent") continue;
	if (SEEN_HEX.has(hex)) continue;
	SEEN_HEX.set(hex, colorName);
	const srgb = hexToSrgb(hex);
	const lab = convert(srgb, "srgb", "lab");
	ENTRIES.push({ name: colorName, hex: "#" + hex, lab });
}

function lab2000FromLab(lab1, lab2) {
	// Inlined ΔE2000 so we avoid constructing a Swatch for every
	// precomputed entry on every lookup.
	const deg = Math.PI / 180;
	const [L1, a1, b1] = lab1;
	const [L2, a2, b2] = lab2;

	const C1 = Math.hypot(a1, b1);
	const C2 = Math.hypot(a2, b2);
	const Cbar = (C1 + C2) / 2;

	const Cbar7 = Math.pow(Cbar, 7);
	const G = 0.5 * (1 - Math.sqrt(Cbar7 / (Cbar7 + Math.pow(25, 7))));

	const a1p = (1 + G) * a1;
	const a2p = (1 + G) * a2;

	const C1p = Math.hypot(a1p, b1);
	const C2p = Math.hypot(a2p, b2);

	let h1p = (Math.atan2(b1, a1p) * 180) / Math.PI;
	if (h1p < 0) h1p += 360;
	let h2p = (Math.atan2(b2, a2p) * 180) / Math.PI;
	if (h2p < 0) h2p += 360;

	const dLp = L2 - L1;
	const dCp = C2p - C1p;

	let dhp;
	if (C1p * C2p === 0) {
		dhp = 0;
	} else if (Math.abs(h2p - h1p) <= 180) {
		dhp = h2p - h1p;
	} else if (h2p - h1p > 180) {
		dhp = h2p - h1p - 360;
	} else {
		dhp = h2p - h1p + 360;
	}
	const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp / 2) * deg);

	const LbarP = (L1 + L2) / 2;
	const CbarP = (C1p + C2p) / 2;

	let hbarP;
	if (C1p * C2p === 0) {
		hbarP = h1p + h2p;
	} else if (Math.abs(h1p - h2p) <= 180) {
		hbarP = (h1p + h2p) / 2;
	} else if (h1p + h2p < 360) {
		hbarP = (h1p + h2p + 360) / 2;
	} else {
		hbarP = (h1p + h2p - 360) / 2;
	}

	const T =
		1 -
		0.17 * Math.cos((hbarP - 30) * deg) +
		0.24 * Math.cos(2 * hbarP * deg) +
		0.32 * Math.cos((3 * hbarP + 6) * deg) -
		0.2 * Math.cos((4 * hbarP - 63) * deg);

	const dTheta = 30 * Math.exp(-Math.pow((hbarP - 275) / 25, 2));

	const CbarP7 = Math.pow(CbarP, 7);
	const Rc = 2 * Math.sqrt(CbarP7 / (CbarP7 + Math.pow(25, 7)));

	const Sl =
		1 +
		(0.015 * Math.pow(LbarP - 50, 2)) /
			Math.sqrt(20 + Math.pow(LbarP - 50, 2));
	const Sc = 1 + 0.045 * CbarP;
	const Sh = 1 + 0.015 * CbarP * T;

	const Rt = -Math.sin(2 * dTheta * deg) * Rc;

	const termL = dLp / Sl;
	const termC = dCp / Sc;
	const termH = dHp / Sh;

	return Math.sqrt(
		termL * termL +
			termC * termC +
			termH * termH +
			Rt * termC * termH
	);
}

function toSwatch(input) {
	return input instanceof Swatch ? input : swatch(input);
}

export function name(input, _opts = {}) {
	const s = toSwatch(input);
	const queryLab = s._getCoordsIn("lab");
	let best = null;
	let bestD = Infinity;
	for (const entry of ENTRIES) {
		const d = lab2000FromLab(queryLab, entry.lab);
		if (d < bestD) {
			bestD = d;
			best = entry;
		}
	}
	return { name: best.name, hex: best.hex, deltaE: bestD };
}

export function toName(input) {
	return name(input).name;
}

// Useful for tests and users who want the raw data table.
export function listNamedColors() {
	return ENTRIES.map((e) => ({ name: e.name, hex: e.hex }));
}
