// Type definitions for swatch 2.0
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

export type ColorInput = string | RGB | HSL | Swatch;

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

export interface SwatchJSON {
	hex: string;
	rgb: RGB;
	hsl: HSL;
	isValid: boolean;
	format?: string;
}

export interface Swatch {
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
	toJSON(): SwatchJSON;
	clone(): Swatch;
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
	lighten(amount?: number): Swatch;
	darken(amount?: number): Swatch;
	saturate(amount?: number): Swatch;
	desaturate(amount?: number): Swatch;
	spin(degrees: number): Swatch;
	greyscale(): Swatch;
	complement(): Swatch;
	invert(): Swatch;
	mix(other: ColorInput, amount?: number, space?: MixSpace): Swatch;

	// ─── Harmonies ──────────────────────────────────────────────────
	complementary(): Swatch[];
	triad(): Swatch[];
	tetrad(): Swatch[];
	splitComplement(): Swatch[];
	analogous(n?: number, slice?: number): Swatch[];
	monochromatic(n?: number): Swatch[];

	// ─── Colorblind story ───────────────────────────────────────────
	simulate(type: CVDType, options?: SimulateOptions): Swatch;
	daltonize(
		type: Exclude<CVDType, "achroma" | "achromatopsia">,
		options?: DaltonizeOptions
	): Swatch;

	// ─── Accessibility ──────────────────────────────────────────────
	contrast(other: ColorInput): number;
	isReadable(other: ColorInput, options?: IsReadableOptions): boolean;
	ensureContrast(
		other: ColorInput,
		options?: EnsureContrastOptions
	): Swatch;

	// ─── Legacy/raw WCAG helpers ────────────────────────────────────
	getLuminance(rgb?: RGB): number;
	getContrast(rgb1: RGB, rgb2?: RGB): number;
}

export interface SwatchConstructor {
	(color: ColorInput): Swatch;
	new (color: ColorInput): Swatch;

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
	): Swatch;

	/** Pick the best-contrast readable foreground from candidates. */
	mostReadable(
		background: ColorInput,
		candidates: ColorInput[],
		options?: MostReadableOptions
	): Swatch;

	/** APCA (WCAG 3 draft) lightness contrast Lc. */
	apcaContrast(text: ColorInput, background: ColorInput): number;
}

declare const swatch: SwatchConstructor;
export default swatch;
