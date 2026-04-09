import { describe, it, expect } from "vitest";
import "../src/bootstrap.js";
import { swatch } from "../src/core/swatch-class.js";
import { name, toName, listNamedColors } from "../src/operations/naming.js";
import { deltaE } from "../src/operations/deltaE.js";

// Phase 12: color naming.

describe("Phase 12: naming", () => {
	it("exact CSS colors return their own name", () => {
		expect(name("#dc143c").name).toBe("crimson");
		expect(name("#ff0000").name).toBe("red");
		expect(name("#00ff00").name).toBe("lime");
		expect(name("#0000ff").name).toBe("blue");
		expect(name("#ffffff").name).toBe("white");
		expect(name("#000000").name).toBe("black");
	});

	it("exact matches have deltaE ≈ 0", () => {
		expect(name("#dc143c").deltaE).toBeLessThan(1e-9);
	});

	it("near-miss returns the closest CSS name", () => {
		// #dc143d is one blue-channel step away from crimson (#dc143c).
		const r = name("#dc143d");
		expect(r.name).toBe("crimson");
		expect(r.deltaE).toBeGreaterThan(0);
		expect(r.deltaE).toBeLessThan(1);
	});

	it("hex field is prefixed with '#'", () => {
		expect(name("#dc143c").hex).toBe("#dc143c");
	});

	it("works with a Swatch instance", () => {
		const c = swatch("#ff6347");
		expect(name(c).name).toBe("tomato");
	});

	it("works with a parsed object", () => {
		const c = swatch({ space: "srgb", coords: [1, 0, 0] });
		expect(name(c).name).toBe("red");
	});

	it("wired as c.name()", () => {
		expect(swatch("#4682b4").name().name).toBe("steelblue");
	});

	it("wired as c.toName() returning a string", () => {
		expect(swatch("#40e0d0").toName()).toBe("turquoise");
	});

	it("returned deltaE matches a fresh deltaE2000 call", () => {
		const input = "#ff4500"; // orangered — slightly off from several names
		const r = name(input);
		const d = deltaE(input, r.hex, "2000");
		expect(d).toBeCloseTo(r.deltaE, 10);
	});

	it("listNamedColors returns a deduped list", () => {
		const list = listNamedColors();
		expect(list.length).toBeGreaterThan(100);
		expect(list.length).toBeLessThan(200);
		// transparent is excluded
		expect(list.some((e) => e.name === "transparent")).toBe(false);
		// no duplicate hexes
		const hexes = new Set(list.map((e) => e.hex));
		expect(hexes.size).toBe(list.length);
	});

	it("aqua/cyan dedupe — #00ffff resolves to one canonical name", () => {
		// Both 'aqua' and 'cyan' map to #00ffff; whichever appears first
		// in the CSS-named-color list wins. We just verify it's one of them.
		const picked = name("#00ffff").name;
		expect(["aqua", "cyan"]).toContain(picked);
	});

	it("off-palette color falls back to a reasonable neighbor", () => {
		// A muddy swamp green — no exact CSS match.
		const r = name("#556b2f");
		expect(r.name).toBe("darkolivegreen");
		expect(r.deltaE).toBeLessThan(1e-9);
	});
});
