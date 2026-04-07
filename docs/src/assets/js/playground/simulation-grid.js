// ============================================================
// <t-simulation-grid> · Brettel/Viénot CVD contact sheet
// ============================================================

import { subscribe, getRoot } from "./state.js";
import { copy, fmtHex } from "./format.js";

const TYPES = [
	{ key: "normal", label: "Trichromat", note: "as authored" },
	{ key: "protan", label: "Protan", note: "L-cone" },
	{ key: "deutan", label: "Deutan", note: "M-cone" },
	{ key: "tritan", label: "Tritan", note: "S-cone" },
	{ key: "achroma", label: "Achroma", note: "Rec. 709" },
];

class SimulationGrid extends HTMLElement {
	connectedCallback() {
		this.grid = this.querySelector("[data-sim-grid]");
		this.severity = this.querySelector("[data-severity]");
		this.severityValue = this.querySelector("[data-severity-value]");

		this.cards = TYPES.map((t) => {
			const card = document.createElement("div");
			card.className = "sim-card";
			card.innerHTML = `
				<div class="sim-card__chip" data-chip></div>
				<div class="sim-card__name">
					<strong>${t.label}</strong>
					<span>${t.note}</span>
				</div>
				<button type="button" class="sim-card__hex" data-hex>—</button>
			`;
			const chip = card.querySelector("[data-chip]");
			const hex = card.querySelector("[data-hex]");
			hex.addEventListener("click", () => copy(hex.textContent));
			this.grid.appendChild(card);
			return { type: t.key, chip, hex };
		});

		this.severity.addEventListener("input", () => {
			this.severityValue.textContent = (+this.severity.value).toFixed(2);
			this.render();
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
		const sev = +this.severity.value;
		this.severityValue.textContent = sev.toFixed(2);
		for (const { type, chip, hex } of this.cards) {
			let sim = c;
			if (type !== "normal") {
				try {
					sim = c.simulate(type, { severity: sev });
				} catch (e) {
					sim = c;
				}
			}
			const h = fmtHex(sim);
			chip.style.background = h;
			hex.textContent = h;
		}
	}
}

customElements.define("t-simulation-grid", SimulationGrid);
