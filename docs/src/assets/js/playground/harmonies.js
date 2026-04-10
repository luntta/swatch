// ============================================================
// <t-harmonies> · tabbed harmony generator (OKLCh spin-based)
// ============================================================

import swatch from "../lib/swatch.js";
import { subscribe, getRoot, setRoot } from "./state.js";
import { copy, fmtHex } from "./format.js";

const TABS = [
	{ key: "complementary", label: "Complementary" },
	{ key: "triad", label: "Triad" },
	{ key: "tetrad", label: "Tetrad" },
	{ key: "splitComplement", label: "Split-comp" },
	{ key: "analogous", label: "Analogous" },
	{ key: "monochromatic", label: "Monochromatic" },
];

const HARMONIES = {
	complementary: (c) => [c, c.spin(180)],
	triad: (c) => [c, c.spin(120), c.spin(240)],
	tetrad: (c) => [c, c.spin(90), c.spin(180), c.spin(270)],
	splitComplement: (c) => [c, c.spin(150), c.spin(210)],
	analogous: (c) => Array.from({ length: 6 }, (_, i) => c.spin(-75 + i * 30)),
	monochromatic: (c) => Array.from({ length: 6 }, (_, i) => {
		const step = i / 5;
		return c.set("oklch.l", 0.15 + step * 0.7);
	}),
};

class Harmonies extends HTMLElement {
	connectedCallback() {
		this.tabs = this.querySelector("[data-harmonies-tabs]");
		this.chips = this.querySelector("[data-harmonies-chips]");
		this.active = "complementary";

		TABS.forEach((t) => {
			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = "harmonies__tab";
			btn.textContent = t.label;
			btn.dataset.key = t.key;
			if (t.key === this.active) btn.classList.add("is-active");
			btn.addEventListener("click", () => {
				this.active = t.key;
				this.tabs
					.querySelectorAll(".harmonies__tab")
					.forEach((b) =>
						b.classList.toggle("is-active", b.dataset.key === t.key)
					);
				this.render();
			});
			this.tabs.appendChild(btn);
		});

		this._unsub = subscribe(() => this.render());
	}

	disconnectedCallback() {
		this._unsub?.();
	}

	render() {
		const c = getRoot();
		if (!c) return;
		let arr = [];
		try {
			arr = HARMONIES[this.active](c);
		} catch (e) {
			arr = [c];
		}

		this.chips.innerHTML = "";
		arr.forEach((tc) => {
			const hex = fmtHex(tc);
			const chip = document.createElement("button");
			chip.type = "button";
			chip.className = "h-chip";
			chip.style.setProperty("--h-color", hex);
			chip.innerHTML = `
				<span class="h-chip__swatch"></span>
				<span class="h-chip__hex">${hex}</span>
			`;
			chip.addEventListener("click", (e) => {
				if (e.shiftKey) {
					setRoot(tc);
				} else {
					copy(hex);
				}
			});
			chip.title = "Click to copy · Shift-click to promote to root";
			this.chips.appendChild(chip);
		});
	}
}

customElements.define("t-harmonies", Harmonies);
