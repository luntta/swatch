export default {
	layout: "reference.njk",
	tags: "reference",
	eleventyComputed: {
		permalink: (data) => {
			const isIndex = data.page.inputPath.endsWith("/reference/index.md");
			if (isIndex) return "/reference/";
			return `/reference/${data.page.fileSlug}/`;
		},
	},
};
