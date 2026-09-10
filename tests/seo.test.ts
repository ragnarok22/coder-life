import { describe, expect, it } from "vitest";
import { crawlFiles, normalizeSiteUrl, seoTags } from "../scripts/seo";

describe("deployment SEO", () => {
  it.each([
    [
      "https://example.com/games/coder-life",
      "https://example.com/games/coder-life",
    ],
    ["coder-life.ragnarok22.dev", "https://coder-life.ragnarok22.dev"],
    ["http://example.com/game", "http://example.com/game"],
    ["example.com:8443/game", "https://example.com:8443/game"],
    [
      " coder-life.ragnarok22.dev/games/coder-life/// ",
      "https://coder-life.ragnarok22.dev/games/coder-life",
    ],
  ])("keeps all SEO URLs consistent for SITE_URL=%s", (input, url) => {
    expect(normalizeSiteUrl(input)).toBe(`${url}/`);
    const tags = seoTags(input);
    expect(
      tags.find((tag) => tag.attrs?.rel === "canonical")?.attrs?.href,
    ).toBe(`${url}/`);
    expect(
      tags.find((tag) => tag.attrs?.property === "og:url")?.attrs?.content,
    ).toBe(`${url}/`);
    for (const key of ["og:image", "twitter:image"]) {
      expect(
        tags.find((tag) => (tag.attrs?.property ?? tag.attrs?.name) === key)
          ?.attrs?.content,
      ).toBe(`${url}/social-preview.png`);
    }
    const data = JSON.parse(
      tags.find((tag) => tag.tag === "script")!.children as string,
    );
    expect(data).toMatchObject({
      "@type": "VideoGame",
      url: `${url}/`,
      image: `${url}/social-preview.png`,
      isAccessibleForFree: true,
    });
    const files = crawlFiles(input);
    expect(files["robots.txt"]).toContain(`Sitemap: ${url}/sitemap.xml`);
    expect(files["sitemap.xml"]).toContain(`<loc>${url}/</loc>`);
  });

  it("does not invent production URLs when deployment is unconfigured", () => {
    const tags = seoTags();
    expect(tags.some((tag) => tag.attrs?.rel === "canonical")).toBe(false);
    expect(tags.some((tag) => tag.attrs?.property === "og:image")).toBe(false);
    expect(crawlFiles()).toEqual({ "robots.txt": "User-agent: *\nAllow: /\n" });
    expect(normalizeSiteUrl(" ")).toBeUndefined();
  });

  it.each([
    "not-a-url",
    "-example.com",
    "example..com",
    "mailto:user@example.com",
    "ftp://example.com/",
    "https://user:secret@example.com/",
    "https://example.com/?preview=1",
    "https://example.com/#game",
    "user:secret@example.com/",
    "example.com/?preview=1",
    "example.com/#game",
  ])("rejects an invalid canonical URL: %s", (url) => {
    expect(() => normalizeSiteUrl(url)).toThrow();
  });

  it("normalizes trailing slashes and escapes XML URLs", () => {
    expect(normalizeSiteUrl(" https://example.com/game/// ")).toBe(
      "https://example.com/game/",
    );
    expect(crawlFiles("https://example.com/a&b")["sitemap.xml"]).toContain(
      "<loc>https://example.com/a&amp;b/</loc>",
    );
  });
});
