import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/admin", "/api/", "/profile/edit", "/verify-me", "/notifications", "/messages", "/saved", "/buy-connects", "/refer"],
      },
    ],
    sitemap: "https://www.gigway.in/sitemap.xml",
  }
}
