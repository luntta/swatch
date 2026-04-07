// Type definitions for tincturelib 2.0
// Project: https://github.com/luntta/tincture

export interface RGB {
	r: number;
	g: number;
	b: number;
	a?: number;
}

export interface HSL {
	h: number;
	s: number;
	l: number;
	a?: number;
}

export interface XYZ {
	x: number;
	y: number;
	z: number;
}

export interface Lab {
	l: number;
	a: number;
	b: number;
}

export interface LCh {
	l: number;
	c: number;
	h: number;
}

export type ColorInput = string | RGB | HSL | Tincture;

export type CVDType =
	| "protan"
	| "protanopia"
	| "protanomaly"
	| "deutan"
	| "deuteranopia"
	| "deuteranomaly"
	| "tritan"
	| "tritanopia"
	| "tritanomaly"
	| "achroma"
	| "achromatopsia";

export type MixSpace = "oklab" | "lab" | "linear" | "rgb" | "hsl";

export type DeltaEMode = "76" | "2000" | "ok";

export type WCAGLevel = "AA" | "AAA";
export type WCAGSize = "normal" | "large" | "ui";

export interface SimulateOptions {
	/** Severity 0..1 (default 1.0 = full dichromacy). */
	severity?: number;
}

export interface DaltonizeOptions {
	/** Severity 0..1 (default 1.0). */
	severity?: number;
}

export interface MixOptions {
	space?: MixSpace;
}

export interface IsReadableOptions {
	level?: WCAGLevel;
	size?: WCAGSize;
}

export interface EnsureContrastOptions {
	minRatio?: number;
	direction?: "auto" | "lighter" | "darker";
	step?: number;
}

export interface EqualsOptions {
	/** Comparison space. Default "rgb". */
	space?: "rgb" | "hex" | "hsl" | "lab" | "oklab";
	/** Tolerance in the chosen space (Delta E for lab/oklab). Default 0. */
	tolerance?: number;
}

export interface CheckPaletteOptions {
	cvd?: CVDType | null;
	severity?: number;
	minDeltaE?: number;
	mode?: DeltaEMode;
}

export interface PalettePair {
	i: number;
	j: number;
	deltaE: number;
	safe: boolean;
}

export interface PaletteReport {
	pairs: PalettePair[];
	unsafe: PalettePair[];
	minDeltaE: number;
	safe: boolean;
}

export interface NearestDistinguishableOptions extends CheckPaletteOptions {
	/** HSL lightness step in percent. Default 2. */
	step?: number;
}

export interface MostReadableOptions extends IsReadableOptions {
	/** Fall back to pure black/white when no candidate passes. Default true. */
	includeFallback?: boolean;
}

export interface TinctureJSON {
	hex: string;
	rgb: RGB;
	hsl: HSL;
	isValid: boolean;
	format?: string;
}

export interface Tincture {
	// ─── Core state ──────────────────────────────────────────────────
	readonly rgb: RGB;
	readonly hsl: HSL;
	readonly hex: string;
	readonly isValid: boolean;
	readonly hasAlpha: boolean;

	// ─── Accessors / formatters ─────────────────────────────────────
	toRgb(): RGB;
	toRgbString(): string;
	toHsl(): HSL;
	toHslString(): string;
	toHex(): string;
	toJSON(): TinctureJSON;
	clone(): Tincture;
	equals(other: ColorInput, options?: EqualsOptions): boolean;

	// ─── Perceptual spaces ──────────────────────────────────────────
	toLinearRGB(): RGB;
	toXYZ(): XYZ;
	toLab(): Lab;
	toLch(): LCh;
	toOklab(): Lab;
	toOklch(): LCh;
	deltaE(other: ColorInput, mode?: DeltaEMode): number;

	// ─── Manipulation ───────────────────────────────────────────────
	lighten(amount?: number): Tincture;
	darken(amount?: number): Tincture;
	saturate(amount?: number): Tincture;
	desaturate(amount?: number): Tincture;
	spin(degrees: number): Tincture;
	greyscale(): Tincture;
	complement(): Tincture;
	invert(): Tincture;
	mix(other: ColorInput, amount?: number, space?: MixSpace): Tincture;

	// ─── Harmonies ──────────────────────────────────────────────────
	complementary(): Tincture[];
	triad(): Tincture[];
	tetrad(): Tincture[];
	splitComplement(): Tincture[];
	analogous(n?: number, slice?: number): Tincture[];
	monochromatic(n?: number): Tincture[];

	// ─── Colorblind story ───────────────────────────────────────────
	simulate(type: CVDType, options?: SimulateOptions): Tincture;
	daltonize(
		type: Exclude<CVDType, "achroma" | "achromatopsia">,
		options?: DaltonizeOptions
	): Tincture;

	// ─── Accessibility ──────────────────────────────────────────────
	contrast(other: ColorInput): number;
	isReadable(other: ColorInput, options?: IsReadableOptions): boolean;
	ensureContrast(
		other: ColorInput,
		options?: EnsureContrastOptions
	): Tincture;

	// ─── Legacy/raw WCAG helpers ────────────────────────────────────
	getLuminance(rgb?: RGB): number;
	getContrast(rgb1: RGB, rgb2?: RGB): number;
}

export interface TinctureConstructor {
	(color: ColorInput): Tincture;
	new (color: ColorInput): Tincture;

	/** Pairwise Delta E analysis across a palette, optionally under CVD. */
	checkPalette(
		palette: ColorInput[],
		options?: CheckPaletteOptions
	): PaletteReport;

	/** Nudge `target` until it is distinguishable from `against`. */
	nearestDistinguishable(
		target: ColorInput,
		against: ColorInput,
		options?: NearestDistinguishableOptions
	): Tincture;

	/** Pick the best-contrast readable foreground from candidates. */
	mostReadable(
		background: ColorInput,
		candidates: ColorInput[],
		options?: MostReadableOptions
	): Tincture;

	/** APCA (WCAG 3 draft) lightness contrast Lc. */
	apcaContrast(text: ColorInput, background: ColorInput): number;
}

declare const tincture: TinctureConstructor;
export default tincture;
