import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/admin", "/api/", "/profile/edit", "/verify-me", "/notifications", "/messages", "/saved", "/buy-connects", "/ai-tools", "/refer"],
      },
    ],
    sitemap: "https://gigway.in/sitemap.xml",
  }
}
