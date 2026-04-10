export default {
	title: "Swatch",
	tagline: "A color library with first-class colorblind support, CSS Color 4, wide-gamut spaces, and perceptual manipulation.",
	version: "3.0",
	repo: "https://github.com/luntta/swatch",
	npm: "https://www.npmjs.com/package/swatch",
	baseUrl: process.env.ELEVENTY_ENV === "production" ? "/swatch" : "",
	nav: [
		{ label: "Playground", href: "/" },
		{ label: "Reference", href: "/reference/" },
		{ label: "GitHub", href: "https://github.com/luntta/swatch", external: true },
	],
};
