import { seoMeta } from "@/lib/seo/brand";
import { brandedTitle } from "@/lib/seo/title";
import GrowthPage from "@/app/_components/GrowthPage";
import { ANSWER_PAGES } from "@/lib/growth-pages";
export const revalidate=300;
export const metadata=seoMeta({title:{absolute:brandedTitle(ANSWER_PAGES.find(p=>p.slug==="photo-enhancer")?.title)},description:ANSWER_PAGES.find(p=>p.slug==="photo-enhancer")?.description,alternates:{canonical:"https://www.sjpt.io/ai/photo-enhancer"}});
export default function Page(){const page=ANSWER_PAGES.find(p=>p.slug==="photo-enhancer")!;return <GrowthPage page={page}/>}
