// APCA — Accessible Perceptual Contrast Algorithm (Andrew Somers).
//
// Returns the Lightness Contrast (Lc) on a ~[-108, +106] scale:
//   • Positive Lc — dark text on light background ("BoW")
//   • Negative Lc — light text on dark background ("WoB")
//
// Typical body-text thresholds: |Lc| ≥ 75 comfortable, ≥ 60 minimum.
// Reference: https://github.com/Myndex/SAPC-APCA (SA98G constants).
// Uses the "simple" γ = 2.4 model, not the full sRGB EOTF, matching
// the spec.

import { Swatch, swatch } from "../core/swatch-class.js";

function toSwatch(input) {
	return input instanceof Swatch ? input : swatch(input);
}

const mainTRC = 2.4;
const sRco = 0.2126729;
const sGco = 0.7151522;
const sBco = 0.072175;

function apcaY({ r, g, b }) {
	return (
		sRco * Math.pow(r, mainTRC) +
		sGco * Math.pow(g, mainTRC) +
		sBco * Math.pow(b, mainTRC)
	);
}

// Soft clamp for luminances near black.
const blkThrs = 0.022;
const blkClmp = 1.414;
function clampY(Y) {
	return Y >= blkThrs ? Y : Y + Math.pow(blkThrs - Y, blkClmp);
}

const deltaYmin = 0.0005;
const normBG = 0.56;
const normTXT = 0.57;
const revTXT = 0.62;
const revBG = 0.65;
const scaleBoW = 1.14;
const scaleWoB = 1.14;
const loBoWoffset = 0.027;
const loWoBoffset = 0.027;
const loClip = 0.1;

export function apcaContrast(text, background) {
	const t = toSwatch(text);
	const b = toSwatch(background);

	const txtY = clampY(apcaY(t.srgb));
	const bgY = clampY(apcaY(b.srgb));

	if (Math.abs(bgY - txtY) < deltaYmin) return 0;

	let SAPC;
	let outputContrast;
	if (bgY > txtY) {
		// BoW — light background, dark text (positive Lc).
		SAPC =
			(Math.pow(bgY, normBG) - Math.pow(txtY, normTXT)) * scaleBoW;
		outputContrast = SAPC < loClip ? 0 : SAPC - loBoWoffset;
	} else {
		// WoB — dark background, light text (negative Lc).
		SAPC =
			(Math.pow(bgY, revBG) - Math.pow(txtY, revTXT)) * scaleWoB;
		outputContrast = SAPC > -loClip ? 0 : SAPC + loWoBoffset;
	}

	return outputContrast * 100;
}
