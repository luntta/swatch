import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import markdownItAnchor from "markdown-it-anchor";

export default function (eleventyConfig) {
	// Plugins
	eleventyConfig.addPlugin(syntaxHighlight, {
		preAttributes: { tabindex: 0 },
	});

	// Markdown: anchors on headings
	eleventyConfig.amendLibrary("md", (md) => {
		md.use(markdownItAnchor, {
			level: [2, 3],
			permalink: markdownItAnchor.permalink.headerLink({
				class: "anchor",
			}),
		});
	});

	// Passthrough
	eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
	eleventyConfig.addPassthroughCopy({ "../src": "assets/js/lib" });
	eleventyConfig.addPassthroughCopy({ "src/.nojekyll": ".nojekyll" });

	// Watch JS/CSS
	eleventyConfig.addWatchTarget("src/assets/");
	eleventyConfig.addWatchTarget("../src/");

	// Reference collection ordered by `order` front-matter
	eleventyConfig.addCollection("reference", (api) =>
		api
			.getFilteredByTag("reference")
			.sort((a, b) => (a.data.order || 0) - (b.data.order || 0))
	);

	// Filters
	eleventyConfig.addFilter("absUrl", function (url) {
		const base = (this.ctx?.site?.baseUrl || "").replace(/\/$/, "");
		if (!url) return base + "/";
		if (url.startsWith("http")) return url;
		return base + (url.startsWith("/") ? url : "/" + url);
	});

	return {
		dir: {
			input: "src",
			output: "_site",
			includes: "_includes",
			layouts: "_includes/layouts",
			data: "_data",
		},
		markdownTemplateEngine: "njk",
		htmlTemplateEngine: "njk",
		templateFormats: ["njk", "md", "html"],
		pathPrefix:
			process.env.ELEVENTY_ENV === "production" ? "/swatch/" : "/",
	};
}
