// ============================================================
// <t-naming-panel> · nearest CSS named color
// ============================================================

import { subscribe, getRoot } from "./state.js";
import { copy } from "./format.js";

class NamingPanel extends HTMLElement {
	connectedCallback() {
		this.nameEl = this.querySelector("[data-naming-name]");
		this.chip = this.querySelector("[data-naming-chip]");
		this.hexEl = this.querySelector("[data-naming-hex]");
		this.deEl = this.querySelector("[data-naming-de]");

		this.hexEl.addEventListener("click", () => copy(this.hexEl.textContent));

		this._unsub = subscribe(() => this.render());
	}

	disconnectedCallback() {
		this._unsub?.();
	}

	render() {
		const c = getRoot();
		if (!c) return;
		try {
			const { name, hex, deltaE } = c.name();
			this.nameEl.textContent = name;
			this.chip.style.background = hex;
			this.hexEl.textContent = hex;
			this.deEl.textContent = `ΔE ${deltaE.toFixed(2)}`;
		} catch (e) {
			this.nameEl.textContent = "—";
		}
	}
}

customElements.define("t-naming-panel", NamingPanel);
