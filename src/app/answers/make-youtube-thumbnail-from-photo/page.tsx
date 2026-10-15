import { seoMeta } from "@/lib/seo/brand";
import { brandedTitle } from "@/lib/seo/title";
import GrowthPage from "@/app/_components/GrowthPage";
import { queryPage } from "@/lib/query-pages";
export const revalidate=300;
export const metadata=seoMeta({title:{absolute:brandedTitle(queryPage("make-youtube-thumbnail-from-photo").title)},description:queryPage("make-youtube-thumbnail-from-photo").description,alternates:{canonical:"https://www.sjpt.io/answers/make-youtube-thumbnail-from-photo"}});
export default function Page(){return <GrowthPage page={queryPage("make-youtube-thumbnail-from-photo")}/>}
