// Palette helpers.
//
//   checkPalette(palette, { cvd, severity, minDeltaE, mode })
//     Pairwise ΔE scan (under an optional CVD simulation) reporting
//     the smallest distance and any pairs that fall under the threshold.
//
//   nearestDistinguishable(target, against, { cvd, severity, minDeltaE, mode, step })
//     Walk target's HSL lightness until it is ≥ minDeltaE away from
//     `against` under the chosen CVD simulation.
//
//   mostReadable(background, candidates, { level, size, includeFallback })
//     Pick the highest-contrast foreground that passes WCAG. Falls
//     back to black/white if none pass (unless includeFallback=false).

import { Swatch, swatch } from "../core/swatch-class.js";
import { simulate } from "./cvd.js";
import { deltaE as defaultDeltaE } from "./deltaE.js";
import { contrast, isReadable } from "./accessibility.js";

function toSwatch(input) {
	return input instanceof Swatch ? input : swatch(input);
}

export function checkPalette(palette, opts = {}) {
	const {
		cvd = null,
		severity = 1,
		minDeltaE = 11,
		mode = "2000"
	} = opts;

	const colors = palette.map(toSwatch);
	const view = cvd
		? colors.map((c) => simulate(c, cvd, { severity }))
		: colors;

	const pairs = [];
	const unsafe = [];
	let minDE = Infinity;

	for (let i = 0; i < view.length; i++) {
		for (let j = i + 1; j < view.length; j++) {
			const de = defaultDeltaE(view[i], view[j], mode);
			const safe = de >= minDeltaE;
			const entry = { i, j, deltaE: de, safe };
			pairs.push(entry);
			if (!safe) unsafe.push(entry);
			if (de < minDE) minDE = de;
		}
	}

	return {
		pairs,
		unsafe,
		minDeltaE: minDE === Infinity ? 0 : minDE,
		safe: unsafe.length === 0
	};
}

export function nearestDistinguishable(target, against, opts = {}) {
	const {
		cvd = null,
		severity = 1,
		minDeltaE = 11,
		mode = "2000",
		step = 2
	} = opts;

	const targetT = toSwatch(target);
	const againstT = toSwatch(against);

	function evalDE(t) {
		const a = cvd ? simulate(t, cvd, { severity }) : t;
		const b = cvd ? simulate(againstT, cvd, { severity }) : againstT;
		return defaultDeltaE(a, b, mode);
	}

	if (evalDE(targetT) >= minDeltaE) return targetT;

	const baseHsl = targetT.hsl;
	let best = targetT;
	let bestDE = evalDE(targetT);

	for (let d = step; d <= 100; d += step) {
		for (const sign of [-1, 1]) {
			const newL = baseHsl.l + sign * d;
			if (newL < 0 || newL > 100) continue;
			const candidate = swatch({
				space: "hsl",
				coords: [baseHsl.h, baseHsl.s, newL],
				alpha: targetT.alpha
			});
			const de = evalDE(candidate);
			if (de > bestDE) {
				bestDE = de;
				best = candidate;
			}
			if (de >= minDeltaE) return candidate;
		}
	}
	return best;
}

export function mostReadable(background, candidates, opts = {}) {
	const bg = toSwatch(background);
	const cands = candidates.map(toSwatch);

	let bestPass = null;
	let bestPassRatio = -Infinity;
	let bestAny = null;
	let bestAnyRatio = -Infinity;

	for (const c of cands) {
		const ratio = contrast(c, bg);
		if (isReadable(c, bg, opts)) {
			if (ratio > bestPassRatio) {
				bestPassRatio = ratio;
				bestPass = c;
			}
		}
		if (ratio > bestAnyRatio) {
			bestAnyRatio = ratio;
			bestAny = c;
		}
	}

	if (bestPass) return bestPass;
	if (opts.includeFallback === false) return bestAny;

	const black = swatch("#000000");
	const white = swatch("#ffffff");
	return contrast(black, bg) >= contrast(white, bg) ? black : white;
}
