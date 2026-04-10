// ============================================================
// Hero specimen card · live preview + format list
// (not a custom element — just attached at boot)
// ============================================================

import { subscribe } from "./state.js";
import { FORMATS, fmtHex, copy } from "./format.js";

export function attachSpecimen(root) {
	const el = root.querySelector("[data-specimen]");
	if (!el) return;
	const chip = el.querySelector("[data-specimen-chip]");
	const dds = el.querySelectorAll("dd[data-format]");

	dds.forEach((dd) => {
		dd.addEventListener("click", () => copy(dd.textContent));
	});

	subscribe((c) => {
		if (!c) return;
		chip.style.background = fmtHex(c);
		dds.forEach((dd) => {
			const fmt = dd.dataset.format;
			const fn = FORMATS[fmt];
			if (fn) {
				try {
					dd.textContent = fn(c);
				} catch (e) {
					dd.textContent = "—";
				}
			}
		});
	});
}
