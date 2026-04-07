// ============================================================
// <t-harmonies> · tabbed harmony generator
// ============================================================

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
			if (this.active === "analogous") arr = c.analogous(6, 30);
			else if (this.active === "monochromatic") arr = c.monochromatic(6);
			else arr = c[this.active]();
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
