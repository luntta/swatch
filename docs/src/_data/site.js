export default {
	title: "Swatch",
	tagline: "A color library that takes vision seriously.",
	version: "2.0",
	repo: "https://github.com/luntta/tincture",
	npm: "https://www.npmjs.com/package/swatch",
	baseUrl: process.env.ELEVENTY_ENV === "production" ? "/swatch" : "",
	nav: [
		{ label: "Playground", href: "/" },
		{ label: "Reference", href: "/reference/" },
		{ label: "GitHub", href: "https://github.com/luntta/tincture", external: true },
	],
};
