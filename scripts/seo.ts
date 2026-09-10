import type { HtmlTagDescriptor, Plugin } from "vite";
import { site } from "../src/data/site.ts";

export function normalizeSiteUrl(value?: string): string | undefined {
  if (!value?.trim()) return undefined;
  const input = value.trim();
  const isBareDomain =
    /^[a-z\d](?:[a-z\d-]*[a-z\d])?(?:\.[a-z\d](?:[a-z\d-]*[a-z\d])?)+(?::\d+)?(?:[/?#]|$)/i.test(
      input,
    );
  const url = new URL(isBareDomain ? `https://${input}` : input);
  if (
    !["https:", "http:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "SITE_URL must be an HTTP(S) URL without credentials, query, or fragment.",
    );
  }
  url.pathname = `${url.pathname.replace(/\/+$/, "")}/`;
  return url.href;
}

export function seoTags(siteUrl?: string): HtmlTagDescriptor[] {
  const url = normalizeSiteUrl(siteUrl);
  const meta = (name: string, content: string): HtmlTagDescriptor => ({
    tag: "meta",
    attrs: { [name.startsWith("og:") ? "property" : "name"]: name, content },
  });
  const tags: HtmlTagDescriptor[] = [
    { tag: "title", children: site.title },
    meta("description", site.description),
    meta("robots", "index, follow, max-image-preview:large"),
    meta("og:type", "website"),
    meta("og:site_name", site.name),
    meta("og:locale", "en_US"),
    meta("og:title", site.title),
    meta("og:description", site.description),
    meta("twitter:card", url ? "summary_large_image" : "summary"),
    meta("twitter:title", site.title),
    meta("twitter:description", site.description),
  ];
  const image = url ? new URL("social-preview.png", url).href : undefined;
  if (url && image) {
    tags.push(
      { tag: "link", attrs: { rel: "canonical", href: url } },
      meta("og:url", url),
      meta("og:image", image),
      meta("og:image:type", "image/png"),
      meta("og:image:width", "1200"),
      meta("og:image:height", "630"),
      meta("og:image:alt", site.imageAlt),
      meta("twitter:image", image),
      meta("twitter:image:alt", site.imageAlt),
    );
  }
  tags.push({
    tag: "script",
    attrs: { type: "application/ld+json" },
    children: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "VideoGame",
      name: site.name,
      description: site.description,
      url,
      image,
      inLanguage: "en",
      genre: ["Simulation", "Comedy"],
      gamePlatform: "Web browser",
      playMode: "https://schema.org/SinglePlayer",
      isAccessibleForFree: true,
      applicationCategory: "GameApplication",
      operatingSystem: "Any",
      browserRequirements: "Requires JavaScript and WebGL.",
    }).replace(/</g, "\\u003c"),
  });
  return tags;
}

export function crawlFiles(siteUrl?: string): Record<string, string> {
  const url = normalizeSiteUrl(siteUrl);
  const files: Record<string, string> = {
    "robots.txt": `User-agent: *\nAllow: /\n${url ? `\nSitemap: ${new URL("sitemap.xml", url).href}\n` : ""}`,
  };
  if (url) {
    const escaped = url
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    files["sitemap.xml"] =
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${escaped}</loc></url>\n</urlset>\n`;
  }
  return files;
}

export function seoPlugin(siteUrl?: string): Plugin {
  const url = normalizeSiteUrl(siteUrl);
  return {
    name: "coder-life-seo",
    transformIndexHtml() {
      return seoTags(url);
    },
    generateBundle() {
      if (!url) {
        this.warn(
          "Set SITE_URL to the public homepage URL to generate canonical URLs, social image URLs, and sitemap.xml.",
        );
      }
      for (const [fileName, source] of Object.entries(crawlFiles(url))) {
        this.emitFile({ type: "asset", fileName, source });
      }
    },
  };
}
