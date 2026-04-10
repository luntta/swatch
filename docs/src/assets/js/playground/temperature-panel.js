// ============================================================
// <t-temperature-panel> · blackbody temperature
// ============================================================

import swatch from "../lib/swatch.js";
import { subscribe, getRoot } from "./state.js";
import { copy, fmtHex } from "./format.js";

class TemperaturePanel extends HTMLElement {
	connectedCallback() {
		this.slider = this.querySelector("[data-temp-slider]");
		this.kelvinLabel = this.querySelector("[data-temp-kelvin]");
		this.chip = this.querySelector("[data-temp-chip]");
		this.hexBtn = this.querySelector("[data-temp-hex]");
		this.inverseLabel = this.querySelector("[data-temp-inverse]");

		this.slider.addEventListener("input", () => this.renderSlider());
		this.hexBtn.addEventListener("click", () => copy(this.hexBtn.textContent));

		this._unsub = subscribe(() => this.renderInverse());
		this.renderSlider();
	}

	disconnectedCallback() {
		this._unsub?.();
	}

	renderSlider() {
		const k = +this.slider.value;
		this.kelvinLabel.textContent = k + " K";
		try {
			const c = swatch.temperature(k);
			const hex = fmtHex(c);
			this.chip.style.background = hex;
			this.hexBtn.textContent = hex;
		} catch (e) {
			this.chip.style.background = "transparent";
			this.hexBtn.textContent = "—";
		}
	}

	renderInverse() {
		const c = getRoot();
		if (!c) return;
		try {
			const k = c.temperature();
			this.inverseLabel.textContent = `≈ ${Math.round(k)} K`;
		} catch (e) {
			this.inverseLabel.textContent = "—";
		}
	}
}

customElements.define("t-temperature-panel", TemperaturePanel);
