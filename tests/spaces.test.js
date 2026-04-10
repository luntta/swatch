import { describe, it, expect } from "vitest";
import swatch from "../src/_v2-monolith.js";

describe("toLinearRGB: sRGB gamma removal", () => {
	it("maps black to 0 and white to 1", () => {
		expect(swatch("#000000").toLinearRGB()).toEqual({ r: 0, g: 0, b: 0 });
		const w = swatch("#ffffff").toLinearRGB();
		expect(w.r).toBeCloseTo(1, 6);
		expect(w.g).toBeCloseTo(1, 6);
		expect(w.b).toBeCloseTo(1, 6);
	});

	it("maps mid-gray 128/255 to ~0.2159", () => {
		// The sRGB EOTF at 128/255 ≈ 0.5020 → ((0.5020 + 0.055)/1.055)^2.4 ≈ 0.2159
		const lin = swatch("#808080").toLinearRGB();
		expect(lin.r).toBeCloseTo(0.2159, 3);
	});
});

describe("toXYZ: D65 reference white", () => {
	it("white sRGB → D65 XYZ (≈ 0.9505, 1.0000, 1.0888)", () => {
		const xyz = swatch("#ffffff").toXYZ();
		expect(xyz.x).toBeCloseTo(0.9505, 3);
		expect(xyz.y).toBeCloseTo(1.0, 3);
		expect(xyz.z).toBeCloseTo(1.0888, 3);
	});

	it("black sRGB → (0, 0, 0)", () => {
		const xyz = swatch("#000000").toXYZ();
		expect(xyz.x).toBeCloseTo(0, 6);
		expect(xyz.y).toBeCloseTo(0, 6);
		expect(xyz.z).toBeCloseTo(0, 6);
	});

	it("pure red sRGB → (0.4124, 0.2126, 0.0193)", () => {
		const xyz = swatch("#ff0000").toXYZ();
		expect(xyz.x).toBeCloseTo(0.4124, 3);
		expect(xyz.y).toBeCloseTo(0.2126, 3);
		expect(xyz.z).toBeCloseTo(0.0193, 3);
	});
});

describe("toLab: CIE Lab D65", () => {
	it("white → L=100, a=0, b=0", () => {
		const lab = swatch("#ffffff").toLab();
		expect(lab.l).toBeCloseTo(100, 2);
		expect(lab.a).toBeCloseTo(0, 2);
		expect(lab.b).toBeCloseTo(0, 2);
	});

	it("black → L=0, a=0, b=0", () => {
		const lab = swatch("#000000").toLab();
		expect(lab.l).toBeCloseTo(0, 4);
		expect(lab.a).toBeCloseTo(0, 4);
		expect(lab.b).toBeCloseTo(0, 4);
	});

	it("pure red → L≈53.24, a≈80.09, b≈67.20", () => {
		// Published reference values for sRGB #ff0000 in CIE Lab (D65).
		const lab = swatch("#ff0000").toLab();
		expect(lab.l).toBeCloseTo(53.24, 1);
		expect(lab.a).toBeCloseTo(80.09, 1);
		expect(lab.b).toBeCloseTo(67.2, 1);
	});

	it("mid-gray #808080 has near-zero chroma", () => {
		const lab = swatch("#808080").toLab();
		expect(lab.l).toBeCloseTo(53.59, 1);
		expect(Math.abs(lab.a)).toBeLessThan(0.01);
		expect(Math.abs(lab.b)).toBeLessThan(0.01);
	});
});

describe("toLch: LCh(ab)", () => {
	it("pure red → L≈53.24, C≈104.55, h≈40°", () => {
		const lch = swatch("#ff0000").toLch();
		expect(lch.l).toBeCloseTo(53.24, 1);
		expect(lch.c).toBeCloseTo(104.55, 1);
		expect(lch.h).toBeCloseTo(40, 0);
	});

	it("white has L=100 and C=0", () => {
		const lch = swatch("#ffffff").toLch();
		expect(lch.l).toBeCloseTo(100, 2);
		expect(lch.c).toBeCloseTo(0, 2);
	});
});

describe("toOklab (Ottosson 2020)", () => {
	it("white → (1, 0, 0)", () => {
		const ok = swatch("#ffffff").toOklab();
		expect(ok.l).toBeCloseTo(1, 3);
		expect(ok.a).toBeCloseTo(0, 3);
		expect(ok.b).toBeCloseTo(0, 3);
	});

	it("black → (0, 0, 0)", () => {
		const ok = swatch("#000000").toOklab();
		expect(ok.l).toBeCloseTo(0, 6);
		expect(ok.a).toBeCloseTo(0, 6);
		expect(ok.b).toBeCloseTo(0, 6);
	});

	it("pure red ≈ (0.628, 0.225, 0.126)", () => {
		// Reference from Ottosson's blog post table.
		const ok = swatch("#ff0000").toOklab();
		expect(ok.l).toBeCloseTo(0.628, 2);
		expect(ok.a).toBeCloseTo(0.2249, 2);
		expect(ok.b).toBeCloseTo(0.1258, 2);
	});

	it("pure green ≈ (0.866, -0.234, 0.179)", () => {
		const ok = swatch("#00ff00").toOklab();
		expect(ok.l).toBeCloseTo(0.866, 2);
		expect(ok.a).toBeCloseTo(-0.234, 2);
		expect(ok.b).toBeCloseTo(0.179, 2);
	});

	it("pure blue ≈ (0.452, -0.032, -0.312)", () => {
		const ok = swatch("#0000ff").toOklab();
		expect(ok.l).toBeCloseTo(0.452, 2);
		expect(ok.a).toBeCloseTo(-0.032, 2);
		expect(ok.b).toBeCloseTo(-0.312, 2);
	});
});

describe("toOklch", () => {
	it("red has positive chroma and hue ~29°", () => {
		// Red in OKLab is (0.628, 0.225, 0.126); hue = atan2(0.126, 0.225)
		// ≈ 29.23°; chroma = hypot(0.225, 0.126) ≈ 0.258.
		const lch = swatch("#ff0000").toOklch();
		expect(lch.l).toBeCloseTo(0.628, 2);
		expect(lch.c).toBeCloseTo(0.258, 2);
		expect(lch.h).toBeCloseTo(29.23, 0);
	});
});
