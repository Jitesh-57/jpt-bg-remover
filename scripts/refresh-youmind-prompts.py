import re, json, sys, os
REPOS = {
 "awesome-gpt-image-2": ("GPT Image 2","image"),
 "awesome-nano-banana-pro-prompts": ("Nano Banana Pro","image"),
 "awesome-seedream-4.5": ("Seedream 4.5","image"),
 "awesome-gpt-image-1.5": ("GPT Image 1.5","image"),
 "awesome-gemini-3-prompts": ("Gemini 3","image"),
 "awesome-christmas-card-prompts": ("Nano Banana Pro","image"),
 "awesome-seedance-2-prompts": ("Seedance 2.0","video"),
 "awesome-grok-imagine-prompts": ("Grok Imagine","video"),
}
def slug(s): return re.sub(r'[^a-z0-9]+','-',s.lower()).strip('-')[:70]
out=[]; seen=set()
for repo,(model,media) in REPOS.items():
    md=open(f"repos/{repo}.md",encoding="utf-8").read()
    section=None
    parts=re.split(r'(?m)^(##\s[^#].*|###\s.*)$', md)
    cur=None
    for p in parts:
        if p.startswith('## ') : section=p[3:].strip(); continue
        if p.startswith('### '):
            cur=p[4:].strip(); continue
        if cur is None: continue
        body=p; title=re.sub(r'^No\.\s*\d+:\s*','',cur)
        m=re.search(r'####\s*📝 Prompt\s*```[a-z]*\n(.*?)```', body, re.S)
        if not m: cur=None; continue
        prompt=m.group(1).strip()
        d=re.search(r'####\s*📖 Description\s*\n(.*?)\n####', body, re.S) or re.search(r'(?m)^>\s*(.+)$', body.split('#### 📝')[0])
        imgs=re.findall(r'<img src="(https://cms-assets[^"]+)"', body)
        vid=re.search(r'href="(https://github\.com/[^"]+\.mp4)"', body)
        thumb=re.search(r'<img src="(https://(?:customer-|pbs\.twimg)[^"]+)"', body)
        def f(k):
            x=re.search(r'\*\*'+k+r':\*\*\s*(.*?)(?:\s*\|\s*\*\*|$)', body, re.M); return x.group(1).strip() if x else None
        a=f('Author') or ''; am=re.match(r'\[(.*?)\]\((.*?)\)',a)
        s=f('Source') or ''; sm=re.search(r'\((http[^)]+)\)',s)
        tr=re.search(r'(?:Try it now|View Video|Watch Video) →\]\((.*?)\)',body)
        category=None
        cm=re.match(r'^([A-Z][\w &/]+?) - (.+)$', title)
        if cm and '/' in cm.group(1) or (cm and len(cm.group(1))<30 and media=='image'): category, title = cm.group(1).strip(), cm.group(2).strip()
        lb=re.findall(r'badge/(?:lang|Language)-([^-)]+)', body)
        langs=f('Languages')
        cats=re.findall(r'img\.shields\.io/badge/([^)]*)\)', body)
        key=(repo,title,prompt[:80])
        if key in seen: cur=None; continue
        seen.add(key)
        out.append({
          "id": f"{slug(model)}-{len(out)+1}",
          "slug": slug(title),
          "title": title, "description": d.group(1).strip() if d else None,
          "prompt": prompt,
          "has_variables": "{argument" in prompt or "[insert" in prompt.lower(),
          "model": model, "media": media,
          "featured": "Featured" in body[:600],
          "section": section,
          "images": imgs,
          "video_url": vid.group(1) if vid else None,
          "video_thumbnail": thumb.group(1) if thumb else None,
          "author": {"name": am.group(1) if am else a or None, "url": am.group(2) if am else None},
          "source_url": sm.group(1) if sm else None,
          "published": f('Published'),
          "languages": [x.strip() for x in langs.split(',')] if langs else lb,
          "category": category,
          "youmind_url": tr.group(1) if tr else None,
          "license": "CC BY 4.0",
          "dataset_repo": f"https://github.com/YouMind-OpenLab/{repo}",
        })
        cur=None
json.dump(out,open("prompts.json","w",encoding="utf-8"),ensure_ascii=False,indent=1)
from collections import Counter
print(len(out), Counter(o['model'] for o in out), sum(len(o['images']) for o in out), sum(1 for o in out if o['video_url']), sum(1 for o in out if not o['images'] and not o['video_url']))
