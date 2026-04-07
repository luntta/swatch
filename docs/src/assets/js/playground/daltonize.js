// ============================================================
// <t-daltonize> · before / after / simulated-after table
// ============================================================

import { subscribe, getRoot } from "./state.js";
import { copy, fmtHex } from "./format.js";

const ROWS = [
	{ key: "protan", label: "Protan" },
	{ key: "deutan", label: "Deutan" },
	{ key: "tritan", label: "Tritan" },
];

class Daltonize extends HTMLElement {
	connectedCallback() {
		this.table = this.querySelector("[data-dalt-table]");

		// Header row
		this.table.innerHTML = `
			<div class="dalt-table__head">CVD</div>
			<div class="dalt-table__head">Original (sim)</div>
			<div class="dalt-table__head">Daltonized</div>
			<div class="dalt-table__head">Daltonized (sim)</div>
		`;

		this.cells = ROWS.map((r) => {
			const wrap = document.createElement("div");
			wrap.className = "dalt-table__row";
			wrap.innerHTML = `
				<div class="dalt-table__cell">${r.label}</div>
				<div class="dalt-table__cell"><div class="dalt-swatch" data-orig></div></div>
				<div class="dalt-table__cell"><div class="dalt-swatch" data-dalt></div></div>
				<div class="dalt-table__cell"><div class="dalt-swatch" data-dsim></div></div>
			`;
			this.table.appendChild(wrap);
			const orig = wrap.querySelector("[data-orig]");
			const dalt = wrap.querySelector("[data-dalt]");
			const dsim = wrap.querySelector("[data-dsim]");
			[orig, dalt, dsim].forEach((el) =>
				el.addEventListener("click", () => copy(el.style.background))
			);
			return { type: r.key, orig, dalt, dsim };
		});

		this._unsub = subscribe(() => this.render());
		this.render();
	}

	disconnectedCallback() {
		this._unsub?.();
	}

	render() {
		const c = getRoot();
		if (!c) return;
		for (const { type, orig, dalt, dsim } of this.cells) {
			try {
				const simOrig = c.simulate(type);
				const corrected = c.daltonize(type);
				const simCorrected = corrected.simulate(type);
				orig.style.background = fmtHex(simOrig);
				dalt.style.background = fmtHex(corrected);
				dsim.style.background = fmtHex(simCorrected);
			} catch (e) {
				orig.style.background = c.hex;
				dalt.style.background = c.hex;
				dsim.style.background = c.hex;
			}
		}
	}
}

customElements.define("t-daltonize", Daltonize);
