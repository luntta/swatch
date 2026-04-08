// ============================================================
// <t-delta-e> · pairwise CIEDE2000 / 76 / OK
// ============================================================

import swatch from "../swatch.js";
import { subscribe, getRoot } from "./state.js";

// Quality bands per ΔE mode. ΔE 76 and CIEDE2000 live on a 0..100 scale;
// ΔE OK (Euclidean in OKLab) lives on roughly 0..1 — white→black is 1.0
// and ~0.01 is one JND. The OK thresholds are the 76/2000 ones ÷ 100.
const QUALITY = {
	"76": [
		{ max: 1, label: "Imperceptible" },
		{ max: 2, label: "Just noticeable" },
		{ max: 5, label: "Perceptible" },
		{ max: 10, label: "Easily distinguishable" },
		{ max: 50, label: "Different colors" },
		{ max: Infinity, label: "Opposite" },
	],
	"2000": [
		{ max: 1, label: "Imperceptible" },
		{ max: 2, label: "Just noticeable" },
		{ max: 5, label: "Perceptible" },
		{ max: 10, label: "Easily distinguishable" },
		{ max: 50, label: "Different colors" },
		{ max: Infinity, label: "Opposite" },
	],
	ok: [
		{ max: 0.01, label: "Imperceptible" },
		{ max: 0.02, label: "Just noticeable" },
		{ max: 0.05, label: "Perceptible" },
		{ max: 0.1, label: "Easily distinguishable" },
		{ max: 0.5, label: "Different colors" },
		{ max: Infinity, label: "Opposite" },
	],
};

class DeltaE extends HTMLElement {
	connectedCallback() {
		this.inputs = {
			a: this.querySelector('[data-de-input="a"]'),
			b: this.querySelector('[data-de-input="b"]'),
		};
		this.dots = {
			a: this.querySelector('[data-de-dot="a"]'),
			b: this.querySelector('[data-de-dot="b"]'),
		};
		this.value = this.querySelector("[data-de-value]");
		this.label = this.querySelector("[data-de-label]");
		this.modes = this.querySelector("[data-de-modes]");
		this.mode = "2000";

		this.modes.querySelectorAll("button").forEach((btn) => {
			btn.addEventListener("click", () => {
				this.mode = btn.dataset.mode;
				this.modes
					.querySelectorAll("button")
					.forEach((b) => b.classList.toggle("is-active", b === btn));
				this.render();
			});
		});

		Object.values(this.inputs).forEach((i) =>
			i.addEventListener("input", () => this.render())
		);

		// `a` tracks the root color; `b` is user-controlled but seeded
		// with the root's complement on first run.
		this._unsub = subscribe((c) => {
			if (!c) return;
			this.inputs.a.value = c.hex;
			if (!this.inputs.b.value) this.inputs.b.value = c.complement().hex;
			this.render();
		});
	}

	disconnectedCallback() {
		this._unsub?.();
	}

	render() {
		const a = swatch(this.inputs.a.value.trim());
		const b = swatch(this.inputs.b.value.trim());
		if (!a.isValid || !b.isValid) {
			this.value.textContent = "—";
			return;
		}
		this.dots.a.style.background = a.hex;
		this.dots.b.style.background = b.hex;
		let de;
		try {
			de = a.deltaE(b.hex, this.mode);
		} catch (e) {
			de = 0;
		}
		// ΔE OK is two orders of magnitude smaller than 76/2000, so it
		// needs more decimals to read meaningfully.
		const digits = this.mode === "ok" ? 3 : 2;
		this.value.textContent = de.toFixed(digits);
		const q = QUALITY[this.mode].find((q) => de < q.max);
		this.label.textContent = q ? q.label : "";
	}
}

customElements.define("t-delta-e", DeltaE);
