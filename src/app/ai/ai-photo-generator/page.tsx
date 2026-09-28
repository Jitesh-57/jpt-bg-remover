import GrowthPage from "@/app/_components/GrowthPage";
import { ANSWER_PAGES } from "@/lib/growth-pages";
export const revalidate=300;
export const metadata={title:ANSWER_PAGES.find(p=>p.slug==="ai-photo-generator")?.title,description:ANSWER_PAGES.find(p=>p.slug==="ai-photo-generator")?.description,alternates:{canonical:"https://www.sjpt.io/ai/ai-photo-generator"}};
export default function Page(){const page=ANSWER_PAGES.find(p=>p.slug==="ai-photo-generator")!;return <GrowthPage page={page}/>}
