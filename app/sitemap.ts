import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.alqb.co.uk";
  const pages = ["", "/about", "/tutorials", "/contact", "/study", "/subscriptions", "/tips", "/flashcards", "/recordings", "/terms", "/privacy"];
  return pages.map((p) => ({
    url: base + p,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: p === "" ? 1 : 0.7,
  }));
}