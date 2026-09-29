import GrowthPage from "@/app/_components/GrowthPage";
import { queryPage } from "@/lib/query-pages";
export const revalidate=300;
export const metadata={title:queryPage("restore-old-photo").title,description:queryPage("restore-old-photo").description,alternates:{canonical:"https://www.sjpt.io/answers/restore-old-photo"}};
export default function Page(){return <GrowthPage page={queryPage("restore-old-photo")}/>}
