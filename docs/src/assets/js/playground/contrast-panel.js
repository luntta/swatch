// ============================================================
// <t-contrast-panel> · WCAG 2.1 + APCA, paired pickers, auto-fix
// ============================================================

import swatch from "../swatch.js";
import { subscribe, getRoot } from "./state.js";
import { fmtHex, copy } from "./format.js";

class ContrastPanel extends HTMLElement {
	connectedCallback() {
		this.preview = this.querySelector("[data-contrast-preview]");
		this.fgInput = this.querySelector("[data-contrast-fg]");
		this.bgInput = this.querySelector("[data-contrast-bg]");
		this.fgDot = this.querySelector("[data-contrast-fg-dot]");
		this.bgDot = this.querySelector("[data-contrast-bg-dot]");
		this.ratio = this.querySelector("[data-contrast-ratio]");
		this.apca = this.querySelector("[data-contrast-apca]");
		this.badges = this.querySelector("[data-contrast-badges]");
		this.fixBtn = this.querySelector("[data-contrast-fix]");
		this.swapBtn = this.querySelector("[data-contrast-swap]");

		this.fg = swatch("#14110a");
		this.bg = null; // synced from root

		this.fgInput.addEventListener("input", () => {
			const c = swatch(this.fgInput.value.trim());
			if (c.isValid) {
				this.fg = c;
				this.render();
			}
		});
		this.bgInput.addEventListener("input", () => {
			const c = swatch(this.bgInput.value.trim());
			if (c.isValid) {
				this.bg = c;
				this.render();
			}
		});

		this.fixBtn.addEventListener("click", () => {
			try {
				this.fg = this.fg.ensureContrast(this.bg.hex, { minRatio: 4.5 });
				this.fgInput.value = fmtHex(this.fg);
				this.render();
			} catch (e) {}
		});

		this.swapBtn.addEventListener("click", () => {
			const tmp = this.fg;
			this.fg = this.bg;
			this.bg = tmp;
			this.fgInput.value = fmtHex(this.fg);
			this.bgInput.value = fmtHex(this.bg);
			this.render();
		});

		this._unsub = subscribe((c) => {
			if (!c) return;
			this.bg = c;
			this.bgInput.value = fmtHex(c);
			if (!this.fgInput.value) this.fgInput.value = fmtHex(this.fg);
			this.render();
		});
	}

	disconnectedCallback() {
		this._unsub?.();
	}

	render() {
		if (!this.fg || !this.bg) return;
		const fgHex = fmtHex(this.fg);
		const bgHex = fmtHex(this.bg);

		this.preview.style.setProperty("--c-fg", fgHex);
		this.preview.style.setProperty("--c-bg", bgHex);
		this.fgDot.style.background = fgHex;
		this.bgDot.style.background = bgHex;

		const ratio = this.fg.contrast(this.bg.hex);
		this.ratio.textContent = ratio.toFixed(2) + ":1";

		let apca = 0;
		try {
			apca = swatch.apcaContrast(fgHex, bgHex);
		} catch (e) {}
		this.apca.textContent =
			(apca > 0 ? "+" : "") + apca.toFixed(1);

		this.badges.innerHTML = "";
		const make = (label, pass) => {
			const b = document.createElement("span");
			b.className = "badge " + (pass ? "pass" : "fail");
			b.textContent = label + " · " + (pass ? "pass" : "fail");
			this.badges.appendChild(b);
		};
		make("AA Normal", ratio >= 4.5);
		make("AAA Normal", ratio >= 7);
		make("AA Large", ratio >= 3);
		make("AAA Large", ratio >= 4.5);
		make("UI", ratio >= 3);
	}
}

customElements.define("t-contrast-panel", ContrastPanel);
