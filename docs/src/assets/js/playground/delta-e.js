// ============================================================
// <t-delta-e> · pairwise ΔE (2000 / 76 / OK / 94 / CMC / HyAB)
// ============================================================

import swatch from "../lib/swatch.js";
import { subscribe, getRoot } from "./state.js";
import { fmtHex } from "./format.js";

// Quality bands per ΔE mode. ΔE 76 / 2000 / 94 / CMC live on a 0..100
// scale; ΔE OK (Euclidean in OKLab) lives on roughly 0..1 — white→black
// is 1.0 and ~0.01 is one JND. HyAB has a wider range than Lab-Euclidean.
const STANDARD_BANDS = [
	{ max: 1, label: "Imperceptible" },
	{ max: 2, label: "Just noticeable" },
	{ max: 5, label: "Perceptible" },
	{ max: 10, label: "Easily distinguishable" },
	{ max: 50, label: "Different colors" },
	{ max: Infinity, label: "Opposite" },
];

const QUALITY = {
	"76": STANDARD_BANDS,
	"2000": STANDARD_BANDS,
	"94": STANDARD_BANDS,
	cmc: STANDARD_BANDS,
	ok: [
		{ max: 0.01, label: "Imperceptible" },
		{ max: 0.02, label: "Just noticeable" },
		{ max: 0.05, label: "Perceptible" },
		{ max: 0.1, label: "Easily distinguishable" },
		{ max: 0.5, label: "Different colors" },
		{ max: Infinity, label: "Opposite" },
	],
	hyab: [
		{ max: 2, label: "Imperceptible" },
		{ max: 5, label: "Just noticeable" },
		{ max: 10, label: "Perceptible" },
		{ max: 25, label: "Easily distinguishable" },
		{ max: 75, label: "Different colors" },
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
			this.inputs.a.value = fmtHex(c);
			if (!this.inputs.b.value) this.inputs.b.value = fmtHex(c.spin(180));
			this.render();
		});
	}

	disconnectedCallback() {
		this._unsub?.();
	}

	render() {
		let a, b;
		try {
			a = swatch(this.inputs.a.value.trim());
			b = swatch(this.inputs.b.value.trim());
		} catch (e) {
			this.value.textContent = "—";
			return;
		}
		this.dots.a.style.background = fmtHex(a);
		this.dots.b.style.background = fmtHex(b);
		let de;
		try {
			de = a.deltaE(b, this.mode);
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
