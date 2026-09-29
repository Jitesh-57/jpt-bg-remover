import GrowthPage from "@/app/_components/GrowthPage";
import { queryPage } from "@/lib/query-pages";
export const revalidate=300;
export const metadata={title:queryPage("change-background-of-product-photo").title,description:queryPage("change-background-of-product-photo").description,alternates:{canonical:"https://www.sjpt.io/answers/change-background-of-product-photo"}};
export default function Page(){return <GrowthPage page={queryPage("change-background-of-product-photo")}/>}
