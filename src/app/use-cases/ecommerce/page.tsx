import GrowthPage from "@/app/_components/GrowthPage";
import { USE_CASES } from "@/lib/growth-pages";
export const revalidate=300;
export const metadata={title:USE_CASES.find(p=>p.slug==="ecommerce")?.title,description:USE_CASES.find(p=>p.slug==="ecommerce")?.description,alternates:{canonical:"https://www.sjpt.io/use-cases/ecommerce"}};
export default function Page(){const page=USE_CASES.find(p=>p.slug==="ecommerce")!;return <GrowthPage page={page}/>}
