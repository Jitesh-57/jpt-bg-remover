import GrowthPage from "@/app/_components/GrowthPage";
import { queryPage } from "@/lib/query-pages";
export const revalidate=300;
export const metadata={title:queryPage("make-instagram-profile-picture").title,description:queryPage("make-instagram-profile-picture").description,alternates:{canonical:"https://www.sjpt.io/answers/make-instagram-profile-picture"}};
export default function Page(){return <GrowthPage page={queryPage("make-instagram-profile-picture")}/>}
