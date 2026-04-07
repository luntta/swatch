// ============================================================
// <t-palette-check> · checkPalette + nudge
// ============================================================

import swatch from "../swatch.js";
import { subscribe } from "./state.js";

class PaletteCheck extends HTMLElement {
	connectedCallback() {
		this.input = this.querySelector("[data-palette-input]");
		this.cvd = this.querySelector("[data-palette-cvd]");
		this.min = this.querySelector("[data-palette-min]");
		this.report = this.querySelector("[data-palette-report]");
		this.verdict = this.report.querySelector(".palette__verdict");
		this.verdictStrong = this.verdict.querySelector("strong");
		this.chips = this.querySelector("[data-palette-chips]");
		this.pairs = this.querySelector("[data-palette-pairs]");

		[this.input, this.cvd, this.min].forEach((el) =>
			el.addEventListener("input", () => this.render())
		);

		// re-render once whenever the root changes too (palette is independent
		// but min should still re-evaluate cleanly)
		this._unsub = subscribe(() => this.render());
		this.render();
	}

	disconnectedCallback() {
		this._unsub?.();
	}

	parsePalette() {
		return this.input.value
			.split(/\s*[\n,]\s*/)
			.map((s) => s.trim())
			.filter(Boolean);
	}

	render() {
		const palette = this.parsePalette();
		if (palette.length < 2) {
			this.verdictStrong.textContent = "—";
			this.chips.innerHTML = "";
			this.pairs.innerHTML = "";
			return;
		}
		const min = +this.min.value || 11;
		const cvd = this.cvd.value;
		let report;
		try {
			report = swatch.checkPalette(palette, { cvd, minDeltaE: min });
		} catch (e) {
			this.verdictStrong.textContent = "invalid";
			return;
		}

		this.verdict.classList.toggle("safe", report.safe);
		this.verdict.classList.toggle("unsafe", !report.safe);
		this.verdictStrong.textContent = report.safe
			? `safe · min ΔE ${report.minDeltaE.toFixed(1)}`
			: `unsafe · min ΔE ${report.minDeltaE.toFixed(1)}`;

		// chips
		this.chips.innerHTML = "";
		palette.forEach((p) => {
			const c = swatch(p);
			if (!c.isValid) return;
			const el = document.createElement("span");
			el.className = "chip";
			el.style.background = c.hex;
			el.title = c.hex;
			this.chips.appendChild(el);
		});

		// pairs
		this.pairs.innerHTML = "";
		const unsafe = report.unsafe || [];
		if (!unsafe.length) {
			const note = document.createElement("div");
			note.className = "pair";
			note.innerHTML = `<span>All pairs clear ΔE ≥ ${min}</span><span></span>`;
			this.pairs.appendChild(note);
			return;
		}
		unsafe.forEach((u) => {
			const a = palette[u.i];
			const b = palette[u.j];
			const ca = swatch(a);
			const cb = swatch(b);
			if (!ca.isValid || !cb.isValid) return;
			const row = document.createElement("div");
			row.className = "pair";
			row.innerHTML = `
				<div class="pair__swatches">
					<span style="background:${ca.hex}"></span>
					<span style="background:${cb.hex}"></span>
					<span class="pair__de">ΔE ${u.deltaE.toFixed(1)}</span>
				</div>
				<button type="button" class="pair__nudge">Nudge ${b}</button>
			`;
			row.querySelector(".pair__nudge").addEventListener("click", () => {
				try {
					const nudged = swatch.nearestDistinguishable(b, a, {
						cvd,
						minDeltaE: min,
					});
					const lines = this.input.value.split("\n");
					const idx = lines.findIndex((l) => l.trim() === b);
					if (idx >= 0) {
						lines[idx] = nudged.hex;
						this.input.value = lines.join("\n");
						this.render();
					}
				} catch (e) {}
			});
			this.pairs.appendChild(row);
		});
	}
}

customElements.define("t-palette-check", PaletteCheck);
