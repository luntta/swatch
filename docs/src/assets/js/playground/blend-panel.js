// ============================================================
// <t-blend-panel> · CSS compositing blend modes
// ============================================================

import swatch from "../lib/swatch.js";
import { subscribe, getRoot } from "./state.js";
import { copy, fmtHex } from "./format.js";

const MODES = [
	"normal", "multiply", "screen", "darken", "lighten", "overlay",
	"color-dodge", "color-burn", "hard-light", "soft-light",
	"difference", "exclusion",
];

class BlendPanel extends HTMLElement {
	connectedCallback() {
		this.input = this.querySelector("[data-blend-input]");
		this.select = this.querySelector("[data-blend-mode]");
		this.chipA = this.querySelector("[data-blend-a]");
		this.chipB = this.querySelector("[data-blend-b]");
		this.chipResult = this.querySelector("[data-blend-result]");
		this.hexBtn = this.querySelector("[data-blend-hex]");

		this.other = swatch("#2563eb");

		this.input.addEventListener("input", () => {
			try {
				this.other = swatch(this.input.value.trim());
				this.render();
			} catch (e) {}
		});
		this.select.addEventListener("change", () => this.render());
		this.hexBtn.addEventListener("click", () => copy(this.hexBtn.textContent));

		this._unsub = subscribe(() => this.render());
	}

	disconnectedCallback() {
		this._unsub?.();
	}

	render() {
		const c = getRoot();
		if (!c || !this.other) return;
		const mode = this.select.value;
		this.chipA.style.background = fmtHex(c);
		this.chipB.style.background = fmtHex(this.other);
		try {
			const result = c.blend(this.other, mode);
			const hex = fmtHex(result);
			this.chipResult.style.background = hex;
			this.hexBtn.textContent = hex;
		} catch (e) {
			this.chipResult.style.background = "transparent";
			this.hexBtn.textContent = "—";
		}
	}
}

customElements.define("t-blend-panel", BlendPanel);
