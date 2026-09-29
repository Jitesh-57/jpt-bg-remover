import GrowthPage from "@/app/_components/GrowthPage";
import { queryPage } from "@/lib/query-pages";
export const revalidate=300;
export const metadata={title:queryPage("remove-object-from-photo").title,description:queryPage("remove-object-from-photo").description,alternates:{canonical:"https://www.sjpt.io/answers/remove-object-from-photo"}};
export default function Page(){return <GrowthPage page={queryPage("remove-object-from-photo")}/>}
