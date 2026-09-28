import {notFound} from "next/navigation";
import GrowthPage from "@/app/_components/GrowthPage";
import {ANSWER_PAGES} from "@/lib/growth-pages";
export const revalidate=300;
export function generateStaticParams(){return ANSWER_PAGES.map(p=>({slug:p.slug}))}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const p=ANSWER_PAGES.find(x=>x.slug===(await params).slug);return p?{title:p.title,description:p.description,alternates:{canonical:`https://www.sjpt.io/ai/${p.slug}`}}:{}}
export default async function Page({params}:{params:Promise<{slug:string}>}){const p=ANSWER_PAGES.find(x=>x.slug===(await params).slug);if(!p)notFound();return <GrowthPage page={p}/>}
