import { describe, it, expect } from "vitest";
import swatch from "../src/swatch.js";

describe("checkPalette: basic structure", () => {
	it("returns pairs, unsafe, minDeltaE, safe", () => {
		const result = swatch.checkPalette(["#ff0000", "#00ff00", "#0000ff"]);
		expect(result.pairs).toHaveLength(3); // C(3,2)
		expect(Array.isArray(result.unsafe)).toBe(true);
		expect(typeof result.minDeltaE).toBe("number");
		expect(typeof result.safe).toBe("boolean");
	});

	it("each pair has i, j, deltaE, safe", () => {
		const r = swatch.checkPalette(["#ff0000", "#00ff00"]);
		expect(r.pairs[0]).toMatchObject({
			i: 0,
			j: 1,
			deltaE: expect.any(Number),
			safe: expect.any(Boolean)
		});
	});

	it("a single-color palette has no pairs and is safe", () => {
		const r = swatch.checkPalette(["#ff0000"]);
		expect(r.pairs).toHaveLength(0);
		expect(r.unsafe).toHaveLength(0);
		expect(r.safe).toBe(true);
	});
});

describe("checkPalette: identifies unsafe pairs", () => {
	it("two near-identical colors are unsafe", () => {
		const r = swatch.checkPalette(["#ff0000", "#fe0000"], {
			minDeltaE: 5
		});
		expect(r.safe).toBe(false);
		expect(r.unsafe).toHaveLength(1);
		expect(r.minDeltaE).toBeLessThan(5);
	});

	it("primary RGB without CVD is safe at moderate threshold", () => {
		const r = swatch.checkPalette(["#ff0000", "#00ff00", "#0000ff"], {
			minDeltaE: 10
		});
		expect(r.safe).toBe(true);
	});
});

describe("checkPalette: under CVD simulation", () => {
	it("red and green become unsafe under deutan", () => {
		const noCvd = swatch.checkPalette(["#ff0000", "#00cc00"], {
			minDeltaE: 20
		});
		const deutan = swatch.checkPalette(["#ff0000", "#00cc00"], {
			cvd: "deutan",
			minDeltaE: 20
		});
		expect(noCvd.minDeltaE).toBeGreaterThan(deutan.minDeltaE);
	});

	it("the ColorBrewer Set1 (red, blue, green) is unsafe under deutan", () => {
		const palette = ["#e41a1c", "#377eb8", "#4daf4a"];
		const r = swatch.checkPalette(palette, {
			cvd: "deutan",
			minDeltaE: 11
		});
		// At least the red/green pair should be flagged.
		expect(r.unsafe.length).toBeGreaterThan(0);
	});
});

describe("checkPalette: accepts mixed input forms", () => {
	it("strings, objects, and swatch instances mix freely", () => {
		const r = swatch.checkPalette([
			"#ff0000",
			{ r: 0, g: 255, b: 0 },
			swatch("#0000ff")
		]);
		expect(r.pairs).toHaveLength(3);
	});
});

describe("nearestDistinguishable", () => {
	it("returns the same color when already distinguishable", () => {
		const target = swatch("#ff0000");
		const against = swatch("#0000ff");
		const out = swatch.nearestDistinguishable(target, against, {
			minDeltaE: 5
		});
		// Should be unchanged (or close to it).
		expect(Math.abs(out.rgb.r - 255)).toBeLessThanOrEqual(2);
	});

	it("nudges target away when too close", () => {
		const target = swatch("#ff0000");
		const against = swatch("#fe0000");
		const out = swatch.nearestDistinguishable(target, against, {
			minDeltaE: 30
		});
		// The output should now be ≥ 30 ΔE from the against color.
		expect(out.deltaE(against, "2000")).toBeGreaterThanOrEqual(30);
	});

	it("under CVD, finds a deuteranopia-distinguishable alternative", () => {
		// Red and a yellow-green are confused under deutan; nudging the
		// target's lightness should still find a clear value.
		const target = swatch("#ff0000");
		const against = swatch("#cc8800");
		const out = swatch.nearestDistinguishable(target, against, {
			cvd: "deutan",
			minDeltaE: 15
		});
		const seenT = out.simulate("deutan");
		const seenA = against.simulate("deutan");
		expect(seenT.deltaE(seenA, "2000")).toBeGreaterThanOrEqual(15);
	});
});
