import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/discovery";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: SITE_ORIGIN }];
}
