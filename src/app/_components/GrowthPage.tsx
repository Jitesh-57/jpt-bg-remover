import Link from "next/link";
import type { GrowthPage } from "@/lib/growth-pages";
import { appsForPage } from "@/lib/growth-pages";
import { CREATIVE_BASE } from "@/lib/creative-apps";

export default function GrowthPage({page}:{page:GrowthPage}) {
 const apps=appsForPage(page);
 const faqLd={"@context":"https://schema.org","@type":"FAQPage",mainEntity:page.faqs.map(f=>({"@type":"Question",name:f.q,acceptedAnswer:{"@type":"Answer",text:f.a}}))};
 const itemLd={"@context":"https://schema.org","@type":"ItemList",itemListElement:apps.map((a,i)=>({"@type":"ListItem",position:i+1,name:a.h1,url:`https://www.sjpt.io${CREATIVE_BASE}/${a.slug}`}))};
 return <main style={{background:"var(--bg)",color:"var(--text)",fontFamily:"var(--font)"}}>
  <section style={{padding:"72px 24px 54px",background:"linear-gradient(160deg,var(--surface-2),var(--accent-soft))"}}>
   <div style={{maxWidth:900,margin:"0 auto"}}>
    <nav aria-label="Breadcrumb" style={{fontSize:13,fontWeight:700,marginBottom:24}}><Link href="/" style={{color:"var(--text-muted)",textDecoration:"none"}}>Home</Link><span style={{margin:"0 8px",color:"var(--text-faint)"}}>›</span><span style={{color:"var(--accent)"}}>AI Guides</span></nav>
    <h1 style={{fontSize:"clamp(2.2rem,5vw,3.5rem)",lineHeight:1.08,letterSpacing:"-0.035em",margin:"0 0 18px",fontWeight:950}}>{page.h1}</h1>
    <p style={{fontSize:"clamp(1rem,2vw,1.2rem)",lineHeight:1.7,color:"var(--text-muted)",maxWidth:760,margin:0}}>{page.intro}</p>
    <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:26}}>
      {apps.slice(0,3).map(a=><Link key={a.slug} href={`${CREATIVE_BASE}/${a.slug}`} className="jpt-btn jpt-btn-primary" style={{textDecoration:"none"}}>Try {a.h1} →</Link>)}
    </div>
   </div>
  </section>
  <section style={{padding:"58px 24px"}}>
   <div style={{maxWidth:1100,margin:"0 auto"}}>
    <h2 style={{fontSize:"clamp(1.5rem,3vw,2.2rem)",fontWeight:900,textAlign:"center",margin:"0 0 30px"}}>What you can do</h2>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:16}}>{page.bullets.map(x=><div key={x} style={{padding:20,border:"1px solid var(--border)",borderRadius:16,background:"var(--surface)"}}><p style={{margin:0,fontWeight:750,lineHeight:1.55}}>{x}</p></div>)}</div>
   </div>
  </section>
  <section style={{padding:"20px 24px 72px",background:"var(--surface)"}}>
   <div style={{maxWidth:1100,margin:"0 auto"}}>
    <h2 style={{fontSize:"clamp(1.5rem,3vw,2.2rem)",fontWeight:900,textAlign:"center",margin:"0 0 32px"}}>Pixel Shine tools for this use case</h2>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:18}}>{apps.map(a=><Link key={a.slug} href={`${CREATIVE_BASE}/${a.slug}`} style={{textDecoration:"none",padding:20,border:"1px solid var(--border)",borderRadius:16,background:"var(--surface-2)"}}><div style={{fontSize:26}}>{a.emoji}</div><h3 style={{margin:"10px 0 6px",color:"var(--text)",fontSize:17}}>{a.h1}</h3><p style={{margin:0,color:"var(--text-muted)",lineHeight:1.55,fontSize:14}}>{a.intro}</p><div style={{marginTop:12,color:"var(--accent)",fontWeight:800,fontSize:13}}>Open app →</div></Link>)}</div>
   </div>
  </section>
  <section style={{padding:"64px 24px",background:"var(--bg)"}}>
   <div style={{maxWidth:780,margin:"0 auto"}}>
    <h2 style={{fontSize:"clamp(1.5rem,3vw,2.1rem)",fontWeight:900,textAlign:"center",margin:"0 0 30px"}}>Frequently asked questions</h2>
    <div style={{display:"grid",gap:14}}>{page.faqs.map(f=><details key={f.q} style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:14,padding:"16px 18px"}}><summary style={{fontWeight:800,cursor:"pointer"}}>{f.q}</summary><p style={{color:"var(--text-muted)",lineHeight:1.7,margin:"12px 0 0"}}>{f.a}</p></details>)}</div>
   </div>
  </section>
  <section style={{padding:"12px 24px 80px"}}>
   <div style={{maxWidth:780,margin:"0 auto",textAlign:"center"}}>
    <h2 style={{fontSize:"1.7rem",fontWeight:900}}>Explore all 200+ Creative Apps</h2>
    <p style={{color:"var(--text-muted)",lineHeight:1.7}}>Find more focused AI transformations, from headshots and product photos to restoration and viral styles.</p>
    <Link href={CREATIVE_BASE} className="jpt-btn jpt-btn-primary" style={{textDecoration:"none"}}>Browse Creative Apps →</Link><Link href="/answers" className="jpt-btn" style={{textDecoration:"none"}}>Browse AI answers →</Link>
   </div>
  </section>
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(faqLd)}}/>
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(itemLd)}}/>
 </main>
}
