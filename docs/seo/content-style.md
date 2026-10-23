# How we write

Every page on PixelShine is written for one person: someone who just typed a
search, wants a result in the next two minutes, and will leave the moment the
page stops being useful. Write for them. Search engines rank the pages people
stay on, come back to, and link to; that's the whole strategy.

This isn't about sounding "human" to fool a detector. Google ranks pages on
whether they help, not on who typed them. What gets pages dropped is the
opposite of this guide: the same template with the name swapped in, padding,
claims nobody checked, and hundreds of near-identical pages.

## Voice

- **Talk to one person.** "You", "your photo". Not "users", "individuals",
  "one".
- **Plain words, short sentences.** If a 14-year-old couldn't follow it, rewrite it.
  One idea per sentence. Most paragraphs are 1–3 sentences.
- **Say the specific thing.** Not "stunning results in seconds" but "upload a
  selfie, tap Generate, and you'll have a Ghibli-style portrait in about 20
  seconds".
- **Be honest about limits.** If side profiles come out worse, say so, and say
  what to do instead. Readers trust a page that admits a weakness.
- **Sound like a person who uses the thing.** Small first-hand details beat
  adjectives: "glasses with thick frames sometimes lose a lens reflection —
  take them off for the cleanest result".
- **British or American spelling?** American (US searches dominate). Keep it
  consistent within a page.

## Words we don't use

Delete on sight:

- Filler openers: "In today's digital world", "In the ever-evolving landscape",
  "Whether you're a … or a …", "Look no further", "Say goodbye to".
- Empty boosters: "seamless(ly)", "effortless(ly)", "cutting-edge",
  "revolutionary", "game-changer", "unleash", "elevate", "delve", "harness",
  "robust", "leverage", "a testament to", "breathtaking", "stunning" (once per
  page at most).
- Keyword-stuffed lines: "If you've searched for 'ai ghibli filter free online'…".
  Use a phrase where it reads naturally, once in the title, once in the H1,
  then let related wording do the rest.
- "Pixel Shine at Pixel Shine". The brand is **PixelShine** in titles and
  metadata (`seoMeta()` converts automatically); in body copy either spelling is
  fine, just don't repeat it.

## "Free" — say only what's true

- **Always true, fine anywhere:** the free tools (resize, compress, crop,
  convert, background remover basic, …) are free with no account; creating an
  account is free; no card is needed to sign up.
- **Trial-dependent, never hard-coded:** "your first AI generation is free" and
  "N free credits". Use the `{{trial}}` token in blog posts and the
  `TrialCallout` / `useTrialOffer()` components on pages, so the promise
  disappears automatically if the trial is switched off for a country.
- **Never:** "unlimited", "no credits needed" or "100% free" for AI apps — they
  cost credits after the trial.

## Page outlines

Headings are what the reader is looking for, phrased the way they'd ask it.
Never a heading like "Key highlights" or "More about X".

### AI app page (`/creative/*`) — 1,800–2,300 words unique to the page

1. H1: the main phrase from the keyword map ("Photo to Ghibli — Free AI Ghibli
   Filter"), then one line on what you get.
2. The tool itself (upload box) — above everything.
3. **What this is** — the trend or style in 2–3 short paragraphs: where it
   came from, why people use it, what the result looks like.
4. **How to make one** — 3 steps written for *this* app (what photo works,
   which option to pick, what to do if the first one isn't right).
5. **Styles you can pick** — one H3 per real preset or option the app offers,
   each with what it looks like and who it suits.
6. **Examples** — the app's own before/after, with a caption saying what was
   changed.
7. **Get the best result** — 4–6 photo tips specific to this app.
8. **What it can't do (yet)** — honest limits.
9. **Ideas for using it** — where people actually post or print these.
10. **Your photos and privacy** — what happens to uploads.
11. **FAQ** — 8–10 real questions, including the awkward ones ("Will it look
    like me?", "Can I use it for my business?", "Why does my result have
    extra fingers?"), plus the ChatGPT/Gemini comparison where people ask it.
12. Related apps — indexable ones first.

### Tool page (`/remove-bg`, `/upscale`, …) — ~1,800 words

H1 with the main phrase → the tool → how it works (3 steps) → what it's good
at (use cases, each a question-led H2/H3) → when it's free and when it costs
credits → how it compares (honest, no invented numbers) → tips → FAQ.

### Blog post — 1,500–2,500 words

- A title that is the question or job ("How to Turn a Photo Into Ghibli Style
  (Free)").
- Open with the answer in 2–3 sentences, then the detail.
- Question-led H2s (the "People also ask" questions), H3s for steps and
  options; a table of contents is generated from the H2s.
- Real before/afters from our apps, each with a caption.
- At least 3 in-body links: the app or tool, and two related posts.
- An honest section on limits or alternatives.
- FAQ at the end.
- Byline: Jitesh, founder of PixelShine. Update `updated` when the post changes.

## Checklist before publishing

- [ ] Title ≤ 60 characters, main phrase near the start, "Free" only if true.
- [ ] Meta description ≤ 155 characters, says what you get and that it's free
      to start.
- [ ] One H1. Every H2 is a question or a job, not a slogan.
- [ ] Nothing in the first screen a reader would skip.
- [ ] Every claim is true today (speed, price, what's free, what it supports).
- [ ] No sentence from the banned list; no paragraph copied from another page.
- [ ] Images have alt text that describes the image ("Selfie of a woman next
      to the same photo as a Ghibli-style painting").
- [ ] Links: the primary page from the keyword map, plus related pages.
