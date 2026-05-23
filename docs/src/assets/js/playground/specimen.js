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
	const buttons = el.querySelectorAll("button[data-format]");

	buttons.forEach((button) => {
		button.addEventListener("click", () => copy(button.textContent));
	});

	subscribe((c) => {
		if (!c) return;
		chip.style.background = fmtHex(c);
		buttons.forEach((button) => {
			const fmt = button.dataset.format;
			const fn = FORMATS[fmt];
			if (fn) {
				try {
					button.textContent = fn(c);
					button.setAttribute("aria-label", `Copy ${fmt}: ${button.textContent}`);
				} catch (e) {
					button.textContent = "—";
					button.setAttribute("aria-label", `Copy ${fmt}`);
				}
			}
		});
	});
}
