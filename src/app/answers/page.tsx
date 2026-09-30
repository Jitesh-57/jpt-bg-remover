import Link from "next/link";
import { QUERY_PAGES } from "@/lib/query-pages";
export const revalidate=300;
export const metadata={title:"AI Photo Editing Answers | Pixel Shine",description:"Practical answers to common AI photo editing questions, with direct Pixel Shine tools for each task.",alternates:{canonical:"https://www.sjpt.io/answers"}};
export default function Answers(){
 return <main style={{padding:"70px 24px 90px",background:"var(--bg)",color:"var(--text)",fontFamily:"var(--font)"}}>
  <div style={{maxWidth:1100,margin:"0 auto"}}>
   <div style={{maxWidth:780,margin:"0 auto 52px",textAlign:"center"}}>
    <h1 style={{fontSize:"clamp(2.2rem,5vw,3.5rem)",fontWeight:950,margin:"0 0 16px"}}>AI Photo Editing Answers</h1>
    <p style={{fontSize:18,lineHeight:1.7,color:"var(--text-muted)",margin:0}}>Straight answers to common photo-editing questions, with a Pixel Shine tool you can use for the task.</p>
   </div>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:18}}>
    {QUERY_PAGES.map(p=><Link key={p.slug} href={"/answers/"+p.slug} style={{textDecoration:"none",padding:22,border:"1px solid var(--border)",borderRadius:18,background:"var(--surface-2)"}}>
      <h2 style={{fontSize:18,lineHeight:1.35,color:"var(--text)",margin:"0 0 10px"}}>{p.h1}</h2>
      <p style={{fontSize:14,lineHeight:1.65,color:"var(--text-muted)",margin:0}}>{p.description}</p>
      <div style={{marginTop:14,color:"var(--accent)",fontWeight:800,fontSize:13}}>Read answer →</div>
    </Link>)}
   </div>
  </div>
 </main>
}
