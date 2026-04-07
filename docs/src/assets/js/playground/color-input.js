// ============================================================
// <t-color-input> · root color text + native picker + randomize
// ============================================================

import swatch from "../swatch.js";
import { getRoot, setRoot, subscribe } from "./state.js";
import { copy, fmtHex, randomHex } from "./format.js";

class ColorInput extends HTMLElement {
	connectedCallback() {
		this.bar = this.querySelector(".color-bar");
		this.chip = this.querySelector("[data-bar-chip]");
		this.text = this.querySelector("[data-color-text]");
		this.picker = this.querySelector("[data-color-picker]");
		this.randomize = this.querySelector("[data-randomize]");
		this.copyBtn = this.querySelector("[data-copy]");

		// Live text input
		this.text.addEventListener("input", () => {
			const v = this.text.value.trim();
			const c = swatch(v);
			if (c.isValid) {
				this.bar.classList.remove("is-invalid");
				setRoot(c);
			} else {
				this.bar.classList.add("is-invalid");
			}
		});

		// Native color picker (always emits hex)
		this.picker.addEventListener("input", () => {
			setRoot(this.picker.value);
		});

		this.randomize.addEventListener("click", () => {
			setRoot(randomHex());
		});

		this.copyBtn.addEventListener("click", () => {
			const c = getRoot();
			if (c) copy(fmtHex(c));
		});

		// Sync from store
		this._unsub = subscribe((c) => {
			if (!c) return;
			const hex = fmtHex(c);
			if (document.activeElement !== this.text) {
				this.text.value = hex;
			}
			this.picker.value = hex;
			this.chip.style.setProperty("background", hex);
		});
	}

	disconnectedCallback() {
		this._unsub?.();
	}
}

customElements.define("t-color-input", ColorInput);
