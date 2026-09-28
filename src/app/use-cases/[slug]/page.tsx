import {notFound} from "next/navigation";
import GrowthPage from "@/app/_components/GrowthPage";
import {USE_CASES,appsForPage} from "@/lib/growth-pages";
export const revalidate=300;
export function generateStaticParams(){return USE_CASES.map(p=>({slug:p.slug}))}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const p=USE_CASES.find(x=>x.slug===(await params).slug);return p?{title:p.title,description:p.description,alternates:{canonical:`https://www.sjpt.io/use-cases/${p.slug}`}}:{}}
export default async function Page({params}:{params:Promise<{slug:string}>}){const p=USE_CASES.find(x=>x.slug===(await params).slug);if(!p)notFound();return <GrowthPage page={p}/>}
