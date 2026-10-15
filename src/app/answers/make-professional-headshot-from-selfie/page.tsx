import { seoMeta } from "@/lib/seo/brand";
import { brandedTitle } from "@/lib/seo/title";
import GrowthPage from "@/app/_components/GrowthPage";
import { queryPage } from "@/lib/query-pages";
export const revalidate=300;
export const metadata=seoMeta({title:{absolute:brandedTitle(queryPage("make-professional-headshot-from-selfie").title)},description:queryPage("make-professional-headshot-from-selfie").description,alternates:{canonical:"https://www.sjpt.io/answers/make-professional-headshot-from-selfie"}});
export default function Page(){return <GrowthPage page={queryPage("make-professional-headshot-from-selfie")}/>}
