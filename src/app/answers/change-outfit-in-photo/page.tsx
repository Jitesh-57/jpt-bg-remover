import GrowthPage from "@/app/_components/GrowthPage";
import { queryPage } from "@/lib/query-pages";
export const revalidate=300;
export const metadata={title:queryPage("change-outfit-in-photo").title,description:queryPage("change-outfit-in-photo").description,alternates:{canonical:"https://www.sjpt.io/answers/change-outfit-in-photo"}};
export default function Page(){return <GrowthPage page={queryPage("change-outfit-in-photo")}/>}
