import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Anatomi 101",
    short_name: "Anatomi 101",
    description: "Türkçe ve Latince anatomi terimlerini quizlerle öğren.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f8f6",
    theme_color: "#276b56",
    lang: "tr",
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}
