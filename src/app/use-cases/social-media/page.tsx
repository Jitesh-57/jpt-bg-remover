import GrowthPage from "@/app/_components/GrowthPage";
import { USE_CASES } from "@/lib/growth-pages";
export const revalidate=300;
export const metadata={title:USE_CASES.find(p=>p.slug==="social-media")?.title,description:USE_CASES.find(p=>p.slug==="social-media")?.description,alternates:{canonical:"https://www.sjpt.io/use-cases/social-media"}};
export default function Page(){const page=USE_CASES.find(p=>p.slug==="social-media")!;return <GrowthPage page={page}/>}
