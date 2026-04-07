// ============================================================
// Swatch playground · entry
// ============================================================

import { init, getRoot, setRoot } from "./state.js";
import { copy, fmtHex, randomHex } from "./format.js";
import { attachSpecimen } from "./specimen.js";

import "./color-input.js";
import "./simulation-grid.js";
import "./daltonize.js";
import "./contrast-panel.js";
import "./manipulate.js";
import "./harmonies.js";
import "./palette-check.js";
import "./delta-e.js";

function ready(fn) {
	if (document.readyState !== "loading") fn();
	else document.addEventListener("DOMContentLoaded", fn);
}

ready(() => {
	init("#3b82f6");
	attachSpecimen(document);

	// Global keyboard shortcuts
	document.addEventListener("keydown", (e) => {
		const tag = (document.activeElement?.tagName || "").toLowerCase();
		if (tag === "input" || tag === "textarea" || tag === "select") return;
		if (e.metaKey || e.ctrlKey || e.altKey) return;
		if (e.key === "c") {
			const c = getRoot();
			if (c) copy(fmtHex(c));
		} else if (e.key === "r") {
			setRoot(randomHex());
		}
	});
});
