import GrowthPage from "@/app/_components/GrowthPage";
import { USE_CASES } from "@/lib/growth-pages";
export const revalidate=300;
export const metadata={title:USE_CASES.find(p=>p.slug==="real-estate")?.title,description:USE_CASES.find(p=>p.slug==="real-estate")?.description,alternates:{canonical:"https://www.sjpt.io/use-cases/real-estate"}};
export default function Page(){const page=USE_CASES.find(p=>p.slug==="real-estate")!;return <GrowthPage page={page}/>}
