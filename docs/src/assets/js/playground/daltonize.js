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
				<div class="dalt-table__cell"><button type="button" class="dalt-swatch" data-orig></button></div>
				<div class="dalt-table__cell"><button type="button" class="dalt-swatch" data-dalt></button></div>
				<div class="dalt-table__cell"><button type="button" class="dalt-swatch" data-dsim></button></div>
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
				const origHex = fmtHex(simOrig);
				const daltHex = fmtHex(corrected);
				const dsimHex = fmtHex(simCorrected);
				orig.style.background = origHex;
				dalt.style.background = daltHex;
				dsim.style.background = dsimHex;
				orig.setAttribute("aria-label", `Copy ${type} simulated original ${origHex}`);
				dalt.setAttribute("aria-label", `Copy ${type} daltonized ${daltHex}`);
				dsim.setAttribute("aria-label", `Copy ${type} simulated daltonized ${dsimHex}`);
			} catch (e) {
				const hex = fmtHex(c);
				orig.style.background = hex;
				dalt.style.background = hex;
				dsim.style.background = hex;
				orig.setAttribute("aria-label", `Copy ${type} simulated original ${hex}`);
				dalt.setAttribute("aria-label", `Copy ${type} daltonized ${hex}`);
				dsim.setAttribute("aria-label", `Copy ${type} simulated daltonized ${hex}`);
			}
		}
	}
}

customElements.define("t-daltonize", Daltonize);
