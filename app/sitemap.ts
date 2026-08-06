import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/discovery";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_ORIGIN },
    { url: `${SITE_ORIGIN}/building-proofflow` },
    { url: `${SITE_ORIGIN}/gemma-core` },
  ];
}
