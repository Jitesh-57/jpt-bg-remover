import GrowthPage from "@/app/_components/GrowthPage";
import { ANSWER_PAGES } from "@/lib/growth-pages";
export const revalidate=300;
export const metadata={title:ANSWER_PAGES.find(p=>p.slug==="ai-image-editor")?.title,description:ANSWER_PAGES.find(p=>p.slug==="ai-image-editor")?.description,alternates:{canonical:"https://www.sjpt.io/ai/ai-image-editor"}};
export default function Page(){const page=ANSWER_PAGES.find(p=>p.slug==="ai-image-editor")!;return <GrowthPage page={page}/>}
