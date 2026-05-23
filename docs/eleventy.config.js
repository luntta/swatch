import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import markdownItAnchor from "markdown-it-anchor";

function relativeUrl(url, fromUrl = "/") {
	if (!url) return ".";
	if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return url;

	const match = String(url).match(/^([^?#]*)([?#].*)?$/);
	const targetPath = match?.[1] || "/";
	const suffix = match?.[2] || "";
	const targetEndsWithSlash = targetPath.endsWith("/");
	const target = targetPath.replace(/^\/+|\/+$/g, "");
	const current = String(fromUrl || "/").replace(/[?#].*$/, "");
	const currentDir = current.endsWith("/")
		? current
		: current.replace(/[^/]*$/, "");

	const fromParts = currentDir.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
	const targetParts = target.split("/").filter(Boolean);
	let common = 0;
	while (
		common < fromParts.length &&
		common < targetParts.length &&
		fromParts[common] === targetParts[common]
	) {
		common++;
	}

	const parts = [
		...Array(fromParts.length - common).fill(".."),
		...targetParts.slice(common),
	];
	let out = parts.join("/");
	if (!out) out = ".";
	if (targetEndsWithSlash && !out.endsWith("/")) out += "/";
	return out + suffix;
}

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
	eleventyConfig.addPassthroughCopy({ "src/favicon.svg": "favicon.svg" });
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

	eleventyConfig.addFilter("relUrl", function (url, fromUrl = "/") {
		return relativeUrl(url, fromUrl);
	});

	eleventyConfig.addTransform("relative-html-links", function (content) {
		if (!this.page.outputPath?.endsWith(".html")) return content;
		return content.replace(
			/\b(href|src)="\/(?!\/)([^"]*)"/g,
			(_, attr, target) => `${attr}="${relativeUrl("/" + target, this.page.url)}"`
		);
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
