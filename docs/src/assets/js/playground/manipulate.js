// ============================================================
// <t-manipulate> · live HSL knobs (lighten / saturate / spin)
// ============================================================

import { subscribe, getRoot, setRoot } from "./state.js";
import { copy, fmtHex } from "./format.js";

class Manipulate extends HTMLElement {
	connectedCallback() {
		this.inputs = {
			lighten: this.querySelector('[data-knob="lighten"]'),
			saturate: this.querySelector('[data-knob="saturate"]'),
			spin: this.querySelector('[data-knob="spin"]'),
		};
		this.values = {
			lighten: this.querySelector('[data-knob-value="lighten"]'),
			saturate: this.querySelector('[data-knob-value="saturate"]'),
			spin: this.querySelector('[data-knob-value="spin"]'),
		};
		this.chip = this.querySelector("[data-knobs-chip]");
		this.hexBtn = this.querySelector("[data-knobs-hex]");
		this.resetBtn = this.querySelector("[data-knobs-reset]");
		this.promoteBtn = this.querySelector("[data-knobs-promote]");

		Object.values(this.inputs).forEach((input) =>
			input.addEventListener("input", () => this.render())
		);

		this.hexBtn.addEventListener("click", () => copy(this.hexBtn.textContent));
		this.resetBtn.addEventListener("click", () => {
			Object.values(this.inputs).forEach((i) => (i.value = 0));
			this.render();
		});
		this.promoteBtn.addEventListener("click", () => {
			const c = this.derive();
			if (!c) return;
			// Reset the knobs so the preview tracks the new root, not
			// the new root + the old offsets.
			Object.values(this.inputs).forEach((i) => (i.value = 0));
			setRoot(c);
		});

		this._unsub = subscribe(() => this.render());
	}

	disconnectedCallback() {
		this._unsub?.();
	}

	derive() {
		const c = getRoot();
		if (!c) return null;
		let out = c;
		const l = +this.inputs.lighten.value;
		const s = +this.inputs.saturate.value;
		const sp = +this.inputs.spin.value;
		try {
			if (l > 0) out = out.lighten(l);
			else if (l < 0) out = out.darken(-l);
			if (s > 0) out = out.saturate(s);
			else if (s < 0) out = out.desaturate(-s);
			if (sp !== 0) out = out.spin(sp);
		} catch (e) {}
		return out;
	}

	render() {
		const c = this.derive();
		if (!c) return;
		const hex = fmtHex(c);
		this.chip.style.background = hex;
		this.hexBtn.textContent = hex;

		for (const k of ["lighten", "saturate", "spin"]) {
			const v = +this.inputs[k].value;
			if (k === "spin") {
				this.values[k].textContent = (v >= 0 ? "+" : "") + v + "°";
			} else {
				const d = k === "saturate" ? 3 : 2;
				this.values[k].textContent = (v >= 0 ? "+" : "") + v.toFixed(d);
			}
		}
	}
}

customElements.define("t-manipulate", Manipulate);
