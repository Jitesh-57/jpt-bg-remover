import GrowthPage from "@/app/_components/GrowthPage";
import { queryPage } from "@/lib/query-pages";
export const revalidate=300;
export const metadata={title:queryPage("edit-photo-with-text-prompt").title,description:queryPage("edit-photo-with-text-prompt").description,alternates:{canonical:"https://www.sjpt.io/answers/edit-photo-with-text-prompt"}};
export default function Page(){return <GrowthPage page={queryPage("edit-photo-with-text-prompt")}/>}
