const markdownIt = require("markdown-it");
const markdownItAttrs = require("markdown-it-attrs");
const xmlFiltersPlugin = require("eleventy-xml-plugin");
const mila = require("markdown-it-link-attributes");

const Image = require("@11ty/eleventy-img");

async function imageShortcode(src, alt, classParent, classDescendent, sizes = "100vw") {
  if(alt === undefined) {
    // You bet we throw an error on missing alt (alt="" works okay)
    throw new Error(`Missing \`alt\` on responsiveimage from: ${src}`);
  }

  let metadata = await Image(src, {
    urlPath: "/assets/images",
    outputDir: "dist/assets/images",
    widths: [42, 320, 480, 768, 992, 1200, 1920],
    formats: ["avif", "webp", "jpeg"],
    sharpOptions: {
      ChromaSubsampling: "4:4:4",
      Progressive: true,
      Quality: 95,
    }
  });

  let lowsrc = metadata.jpeg[0];
  let highsrc = metadata.jpeg[metadata.jpeg.length - 1];

  return `<picture class="lazy ${classParent}">
    ${Object.values(metadata).map(imageFormat => {
      return `  <source type="${imageFormat[0].sourceType}" srcset="${imageFormat.map(entry => entry.srcset).join(", ")}" sizes="${sizes}">`;
    }).join("\n")}
      <img
        class="lazyload ${classDescendent}"
        src="${lowsrc.url}"
        width="${highsrc.width}"
        height="${highsrc.height}"
        alt="${alt}"
        loading="lazy"
        decoding="async">
    </picture>`;
}

module.exports = function (eleventyConfig) {

  eleventyConfig.addLiquidShortcode("images", imageShortcode);

  const markdownItOptions = {
    html: true,
    linkify: true,
    typographer: true,
  };
  const markdownItAttrsOptions = {
    leftDelimiter: "{:",
    rightDelimiter: "}",
    allowedAttributes: ["id", "class", /^data\-.*$/],
  };

  const milaOptions = {
    pattern: /^https:/,
    attrs: {
      target: "_blank",
      rel: "noopener",
    },
  };

  const markdown = markdownIt(markdownItOptions)
    .use(markdownItAttrs, markdownItAttrsOptions)
    .use(mila, milaOptions);

  eleventyConfig.setLibrary("md", markdown);

  //   PLUGINS
  eleventyConfig.addPlugin(xmlFiltersPlugin);


  eleventyConfig.addCollection("posts", (collection) => {
    const coll = collection.getFilteredByTag("post");

    for (let i = 0; i < coll.length; i++) {
      const prevPost = coll[i - 1];
      const nextPost = coll[i + 1];

      coll[i].data["prevPost"] = prevPost;
      coll[i].data["nextPost"] = nextPost;
    }

    return coll.reverse();
  });

  eleventyConfig.addLayoutAlias("default", "layouts/default.liquid");
  eleventyConfig.addLayoutAlias("home", "layouts/home.liquid");
  eleventyConfig.addLayoutAlias("post", "layouts/post.liquid");
  eleventyConfig.addLayoutAlias("page", "layouts/page.liquid");
  eleventyConfig.addLayoutAlias("404", "layouts/404.liquid");

  // DON'T USE .GITIGNORE
  eleventyConfig.setUseGitIgnore(false);

  return {
    dir: {
      data: "_data",
      includes: "_includes",
      input: "./src",
      output: "./dist",
    },
  };
};

