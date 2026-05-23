// ============================================================
// <t-scale-panel> · color scales and built-in palettes
// ============================================================

import swatch from "../lib/swatch.js";
import { subscribe, getRoot } from "./state.js";
import { copy, fmtHex } from "./format.js";
import {
	replaceColorAtCaret,
	setPickerColor,
	syncPickerFromInput,
} from "./picker-utils.js";

const CHIP_COUNT = 9;

class ScalePanel extends HTMLElement {
	connectedCallback() {
		this.stopsInput = this.querySelector("[data-scale-stops]");
		this.stopPicker = this.querySelector("[data-scale-stop-picker]");
		this.stopPickerChip = this.querySelector("[data-scale-stop-picker-chip]");
		this.paletteSelect = this.querySelector("[data-scale-palette]");
		this.modeSelect = this.querySelector("[data-scale-mode]");
		this.chips = this.querySelector("[data-scale-chips]");

		// Populate palette options
		try {
			const names = swatch.palettes();
			names.forEach((name) => {
				const opt = document.createElement("option");
				opt.value = name;
				opt.textContent = name;
				this.paletteSelect.appendChild(opt);
			});
		} catch (e) {}

		this.stopsInput.addEventListener("input", () => {
			this.paletteSelect.value = "";
			syncPickerFromInput(this.stopPicker, this.stopPickerChip, this.stopsInput, ",");
			this.render();
		});
		["click", "keyup", "focus"].forEach((eventName) => {
			this.stopsInput.addEventListener(eventName, () => {
				syncPickerFromInput(this.stopPicker, this.stopPickerChip, this.stopsInput, ",");
			});
		});
		this.stopPicker.addEventListener("input", () => {
			this.paletteSelect.value = "";
			replaceColorAtCaret(this.stopsInput, this.stopPicker.value, ",");
			setPickerColor(this.stopPicker, this.stopPickerChip, this.stopPicker.value);
			this.render();
		});
		this.paletteSelect.addEventListener("change", () => this.render());
		this.modeSelect.addEventListener("change", () => this.render());

		this._unsub = subscribe((c) => {
			if (!c) return;
			// Seed the stops input with root + its complement
			if (!this._seeded) {
				this._seeded = true;
				this.stopsInput.value = fmtHex(c) + ", " + fmtHex(c.spin(180));
				setPickerColor(this.stopPicker, this.stopPickerChip, c);
			}
			this.render();
		});
	}

	disconnectedCallback() {
		this._unsub?.();
	}

	render() {
		const palette = this.paletteSelect.value;
		const mode = this.modeSelect.value;
		let scale;
		try {
			if (palette) {
				scale = swatch.scale(palette);
			} else {
				const stops = this.stopsInput.value
					.split(",")
					.map((s) => s.trim())
					.filter(Boolean);
				if (stops.length < 2) {
					this.chips.innerHTML = "";
					return;
				}
				scale = swatch.scale(stops);
			}
			if (mode) scale = scale.mode(mode);
		} catch (e) {
			this.chips.innerHTML = "";
			return;
		}

		let colors;
		try {
			colors = scale.colors(CHIP_COUNT);
		} catch (e) {
			this.chips.innerHTML = "";
			return;
		}

		this.chips.innerHTML = "";
		colors.forEach((c) => {
			const hex = fmtHex(c);
			const chip = document.createElement("button");
			chip.type = "button";
			chip.className = "scale-chip";
			chip.style.background = hex;
			chip.title = hex;
			chip.setAttribute("aria-label", `Copy scale color ${hex}`);
			chip.addEventListener("click", () => copy(hex));
			this.chips.appendChild(chip);
		});
	}
}

customElements.define("t-scale-panel", ScalePanel);
