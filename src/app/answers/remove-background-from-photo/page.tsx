import { seoMeta } from "@/lib/seo/brand";
import { brandedTitle } from "@/lib/seo/title";
import GrowthPage from "@/app/_components/GrowthPage";
import { queryPage } from "@/lib/query-pages";
export const revalidate=300;
export const metadata=seoMeta({title:{absolute:brandedTitle(queryPage("remove-background-from-photo").title)},description:queryPage("remove-background-from-photo").description,alternates:{canonical:"https://www.sjpt.io/answers/remove-background-from-photo"}});
export default function Page(){return <GrowthPage page={queryPage("remove-background-from-photo")}/>}
