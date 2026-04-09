// Color difference metrics.
//
//   deltaE(a, b, mode)
//     "76"   — CIE76 euclidean distance in CIE Lab D65
//     "94"   — CIE94 (graphic arts, kL=kC=kH=1, K1=0.045, K2=0.015)
//     "2000" — CIEDE2000 (Sharma, Wu, Dalal 2005), kL = kC = kH = 1
//     "cmc"  — CMC l:c with default l=1 c=1; override via opts
//              (pass as { mode: 'cmc', l, c }, or deltaE(a,b,'cmc',opts))
//     "hyab" — Abasi/Fairchild HyAB for large color differences
//     "ok"   — euclidean distance in OKLab
//
// All Lab-based metrics operate on D65 Lab (matching v2 behavior
// and the colorjs.io convention).

import { Swatch, swatch } from "../core/swatch-class.js";

function toSwatch(input) {
	return input instanceof Swatch ? input : swatch(input);
}

function lab(s) {
	return s._getCoordsIn("lab");
}
function oklab(s) {
	return s._getCoordsIn("oklab");
}

export function deltaE76(a, b) {
	const [l1, a1, b1] = lab(toSwatch(a));
	const [l2, a2, b2] = lab(toSwatch(b));
	return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}

export function deltaEOK(a, b) {
	const [l1, a1, b1] = oklab(toSwatch(a));
	const [l2, a2, b2] = oklab(toSwatch(b));
	return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}

// CIEDE2000 — Sharma, Wu, Dalal (2005).
export function deltaE2000(a, b) {
	const [L1, a1, b1] = lab(toSwatch(a));
	const [L2, a2, b2] = lab(toSwatch(b));
	const deg = Math.PI / 180;

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

	const kL = 1;
	const kC = 1;
	const kH = 1;
	const termL = dLp / (kL * Sl);
	const termC = dCp / (kC * Sc);
	const termH = dHp / (kH * Sh);

	return Math.sqrt(
		termL * termL +
			termC * termC +
			termH * termH +
			Rt * termC * termH
	);
}

// CIE94 — graphic-arts application (textiles uses different constants).
// kL = kC = kH = 1, K1 = 0.045, K2 = 0.015.
// Symmetric by using sample 1 as reference (v2 convention).
export function deltaE94(a, b) {
	const [L1, a1, b1] = lab(toSwatch(a));
	const [L2, a2, b2] = lab(toSwatch(b));

	const C1 = Math.hypot(a1, b1);
	const C2 = Math.hypot(a2, b2);

	const dL = L1 - L2;
	const dC = C1 - C2;
	const da = a1 - a2;
	const db = b1 - b2;
	// dH² = da² + db² − dC². Guard against tiny negatives from rounding.
	const dH2 = Math.max(da * da + db * db - dC * dC, 0);

	const SL = 1;
	const SC = 1 + 0.045 * C1;
	const SH = 1 + 0.015 * C1;

	const termL = dL / SL;
	const termC = dC / SC;
	// termH² = dH² / SH²
	return Math.sqrt(termL * termL + termC * termC + dH2 / (SH * SH));
}

// CMC l:c — sample 1 is reference. Defaults l=1 c=1 ("acceptability");
// pass l=2 for "perceptibility".
export function deltaECMC(a, b, { l = 1, c = 1 } = {}) {
	const [L1, a1, b1] = lab(toSwatch(a));
	const [L2, a2, b2] = lab(toSwatch(b));
	const deg = Math.PI / 180;

	const C1 = Math.hypot(a1, b1);
	const C2 = Math.hypot(a2, b2);

	let H1 = (Math.atan2(b1, a1) * 180) / Math.PI;
	if (H1 < 0) H1 += 360;

	const dL = L1 - L2;
	const dC = C1 - C2;
	const da = a1 - a2;
	const db = b1 - b2;
	const dH2 = Math.max(da * da + db * db - dC * dC, 0);

	const SL = L1 < 16 ? 0.511 : (0.040975 * L1) / (1 + 0.01765 * L1);
	const SC = (0.0638 * C1) / (1 + 0.0131 * C1) + 0.638;

	const F = Math.sqrt(Math.pow(C1, 4) / (Math.pow(C1, 4) + 1900));
	const T =
		H1 >= 164 && H1 <= 345
			? 0.56 + Math.abs(0.2 * Math.cos((H1 + 168) * deg))
			: 0.36 + Math.abs(0.4 * Math.cos((H1 + 35) * deg));
	const SH = SC * (F * T + 1 - F);

	const termL = dL / (l * SL);
	const termC = dC / (c * SC);
	return Math.sqrt(termL * termL + termC * termC + dH2 / (SH * SH));
}

// HyAB — Abasi & Fairchild (2020), "Distancing colour signals from the
// visual system." L distance plus euclidean (a,b) distance; performs
// better than ΔE2000 for large color differences.
export function deltaEHyAB(a, b) {
	const [L1, a1, b1] = lab(toSwatch(a));
	const [L2, a2, b2] = lab(toSwatch(b));
	return Math.abs(L1 - L2) + Math.hypot(a1 - a2, b1 - b2);
}

export function deltaE(a, b, mode = "2000", opts) {
	if (mode === "76") return deltaE76(a, b);
	if (mode === "94") return deltaE94(a, b);
	if (mode === "2000") return deltaE2000(a, b);
	if (mode === "cmc") return deltaECMC(a, b, opts);
	if (mode === "hyab") return deltaEHyAB(a, b);
	if (mode === "ok") return deltaEOK(a, b);
	throw new Error(`deltaE: unknown mode "${mode}"`);
}
