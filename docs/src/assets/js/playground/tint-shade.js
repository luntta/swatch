// ============================================================
// <t-tint-shade> · tint / shade / tone strips
// ============================================================

import { subscribe, getRoot } from "./state.js";
import { copy, fmtHex } from "./format.js";

const STEPS = 7;

class TintShade extends HTMLElement {
	connectedCallback() {
		this.tintStrip = this.querySelector("[data-tint-strip]");
		this.shadeStrip = this.querySelector("[data-shade-strip]");
		this.toneStrip = this.querySelector("[data-tone-strip]");
		this._unsub = subscribe(() => this.render());
	}

	disconnectedCallback() {
		this._unsub?.();
	}

	renderStrip(container, fn) {
		container.innerHTML = "";
		for (let i = 0; i < STEPS; i++) {
			const t = i / (STEPS - 1);
			let c;
			try {
				c = fn(t);
			} catch (e) {
				continue;
			}
			const hex = fmtHex(c);
			const chip = document.createElement("button");
			chip.type = "button";
			chip.className = "ts-chip";
			chip.style.background = hex;
			chip.title = `${hex} (${t.toFixed(2)})`;
			chip.addEventListener("click", () => copy(hex));
			container.appendChild(chip);
		}
	}

	render() {
		const c = getRoot();
		if (!c) return;
		this.renderStrip(this.tintStrip, (t) => c.tint(t));
		this.renderStrip(this.shadeStrip, (t) => c.shade(t));
		this.renderStrip(this.toneStrip, (t) => c.tone(t));
	}
}

customElements.define("t-tint-shade", TintShade);
