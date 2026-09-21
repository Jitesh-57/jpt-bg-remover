import { creativeUrls } from "@/lib/sitemap-data";
import { urlsetXml, xmlResponse } from "@/lib/sitemap-xml";

export const revalidate = 300;

export async function GET() {
  return xmlResponse(urlsetXml(creativeUrls()));
}
