import type { AppPage } from "./types";
import { COST, PACK_FROM } from "./facts";

const page: AppPage = {
  title: "AI Hairstyle Changer: Try Hairstyles on Your Face",
  h1: "AI Hairstyle Changer",
  metaDescription: "Try a new haircut on your own photo before you book it: bob, pixie, curls, braids, quiff and more, with your hairline and face kept real. Free to start.",
  tagline: "See a haircut on your own face before you sit in the chair. Pick a style, and the AI changes only your hair, matched to your hairline and the light in your photo.",
  keywords: "ai hairstyle changer, try hairstyles on my face, hairstyle filter, haircut simulator, try on haircut online, new hairstyle ai free, what haircut suits me",

  howToHeading: "How to try a new hairstyle on your photo",
  howTo: [
    { t: "Upload a photo with your hair visible", d: "Face the camera, hair down and off your face if you can. Daylight shows your real hair colour best." },
    { t: "Pick a hairstyle", d: "Ten styles, from Pixie crop to Long & wavy. Fresh cut, the first, gives a modern cut that suits your face and current length." },
    { t: "Compare, then try another", d: "Each takes under a minute. Run three or four styles on the same photo and compare them side by side." },
  ],
  exampleCaption: "A photo on a city street with medium-length wavy hair, given the Fresh cut: shorter, textured on top and tapered at the sides. The face, stubble, jacket and street behind are unchanged.",

  sections: [
    {
      heading: "What does the AI hairstyle changer do?",
      paragraphs: [
        "It changes your hair and nothing else. You pick a style, and the AI redraws your hair in that cut, matching it to your own hairline so it looks like it grows from your head, keeping the texture and thickness believable for your hair, and relighting it to fit the photo.",
        "Your face is untouched: same features, same skin, same expression, same background. That's what makes it useful. You're not looking at a model with your hairstyle; you're looking at yourself with a new one.",
        "It's the quickest answer to \"would this suit me?\", the question everyone asks before a big cut. Ten minutes of trying styles here can save months of growing out a cut you didn't like.",
      ],
    },
    {
      heading: "Which hairstyles can you try?",
      paragraphs: ["Ten styles are in the Hairstyle menu. Here's what each one gives you, and who tends to suit it."],
      items: [
        { t: "Fresh cut", d: "The default: a modern, flattering cut that suits your face and hair type. Short textured top with tapered sides for short hair, soft face-framing layers for long hair. A safe first try." },
        { t: "Long & straight", d: "Sleek hair falling past the shoulders. Good for seeing how you'd look growing your hair out." },
        { t: "Long & wavy", d: "Loose waves past the shoulders: relaxed and full. Flattering on most face shapes." },
        { t: "Shoulder bob", d: "A blunt bob that sits around the jaw. Strong and polished; suits oval and heart-shaped faces especially." },
        { t: "Pixie crop", d: "A short, textured pixie. The boldest change, and the one most worth previewing before you cut." },
        { t: "Natural curls", d: "Defined curls with real volume at the roots. Try it if you're thinking about a curl-friendly cut or a perm." },
        { t: "Ponytail", d: "A high ponytail with a clean hairline and a few loose strands. Useful for event and gym looks." },
        { t: "Bun", d: "Hair gathered into a neat bun. A quick preview of a wedding or formal updo." },
        { t: "Side part & quiff", d: "A side parting with volume at the front and tapered sides. A classic, smart men's cut that works for any length." },
        { t: "Braids", d: "Neat braids with a believable parting pattern. Preview braided styles before a long salon appointment." },
      ],
    },
    {
      heading: "Which haircut suits your face shape?",
      paragraphs: [
        "Hairdressers often start with face shape, because a cut can balance it. These are the usual rules of thumb, and the app is a good way to check them on your own face.",
      ],
      items: [
        { t: "Oval face", d: "Suits almost anything. A Shoulder bob, Long & wavy, or a Pixie crop all work; it's mostly about what you like." },
        { t: "Round face", d: "Length and height help. Long & straight, Long & wavy and a Side part & quiff lengthen the face; a jaw-length bob can make it look rounder." },
        { t: "Square face", d: "Soft shapes balance a strong jaw. Long & wavy and Natural curls soften it; very blunt cuts at the jaw emphasise it." },
        { t: "Heart-shaped face", d: "Volume near the jaw balances a wider forehead. A Shoulder bob and Long & wavy are good choices." },
        { t: "Long face", d: "Width helps more than length. Natural curls, a bob and styles with volume at the sides suit it; very long, straight hair can make it look longer." },
      ],
      after: [
        "Rules are a starting point, not a verdict. Try the styles they suggest and a couple they don't. Your own eyes on your own photo are the best test.",
      ],
    },
    {
      heading: "How do you get a realistic result?",
      list: [
        "Use a straight-on photo. Your hairline and the shape of your head are clearest from the front.",
        "Push hair back from your face if you can. A fringe hides your forehead, and the AI has to guess the hairline underneath.",
        "Avoid hats, headbands and hoods. Anything on your head gets in the way of the new style.",
        "Keep the light even. Strong light from one side makes the new hair harder to match.",
        "Try the same style twice. Each run is slightly different, and the second is sometimes a better match.",
        "Take a screenshot of the result to your hairdresser. A picture of the cut on your own face explains it better than any description.",
      ],
    },
    {
      heading: "How accurate is it?",
      paragraphs: [
        "It shows the shape and length of a style on your head convincingly, which is what you need to decide if you like it. What it can't know is exactly how your hair behaves: whether it holds a curl, how a fringe sits with your cowlick, or how much volume your hair has on a humid day.",
        "So treat the result as a preview of the look, not a promise from the salon. Your hairdresser can tell you whether your hair type will actually do it. Bring the picture along and ask.",
      ],
    },
    {
      heading: "What can't it do?",
      list: [
        "**Change your hair colour.** It keeps your colour. To try a new colour, use the [hair colour changer](/creative/hair-color-changer), then run the result through this app.",
        "**Make a style from a reference photo.** You choose from the ten styles; you can't upload a celebrity's haircut. Describe a specific cut in the [AI photo editor](/ai-editor) instead.",
        "**Add a beard.** Facial hair isn't changed. The [beard filter](/creative/beard-filter) does that.",
        "**Show the back of your head.** It changes the photo you upload, so you see the front view only.",
      ],
    },
    {
      heading: "When is it most useful?",
      items: [
        { t: "Before a big cut", d: "Going from long to a pixie or a bob? Preview it first. It's the biggest decision people use this app for." },
        { t: "Wedding and event hair", d: "Compare a bun, a ponytail and loose waves with your outfit before the day, and show your stylist your favourite." },
        { t: "Braids and protective styles", d: "See braids on yourself before booking a long appointment." },
        { t: "Growing it out", d: "Long & straight and Long & wavy show where you're heading, which helps on the in-between days." },
        { t: "A fresh profile picture", d: "A new cut in your profile picture before the real one? Fun for a reveal post." },
      ],
    },
    {
      heading: "What happens to your photo?",
      paragraphs: [
        "It's sent to our image-model partner, fal.ai, to make the new picture, and to no one else. It isn't used to train AI models and is never sold, and both your photo and the results are yours.",
        "Your results are saved in My Creations so you can compare styles later or show your hairdresser. Delete any of them whenever you like, or ask us to delete your account and everything in it.",
      ],
    },
  ],

  faq: [
    { q: "How does the AI hairstyle changer work?", a: "Upload a photo where your hair is visible, pick one of ten styles and press Generate. Only your hair changes, matched to your hairline and the light in the photo." },
    { q: "Is the AI hairstyle changer free?", a: `Making an account is free and needs no card. Each try uses ${COST}; one-time credit packs start at ${PACK_FROM} and never expire. Where a free trial is running, the box above the upload says so and your first try is free.` },
    { q: "Will it still look like me?", a: "Yes. Your face, skin and expression are kept exactly the same. Only the hair is redrawn." },
    { q: "Can I try hairstyles on my face for free?", a: "Creating an account is free, and where a free trial is running your first try costs nothing. After that, each style uses credits." },
    { q: "Can it change my hair colour too?", a: "No, it keeps your colour. Use the hair colour changer for that, then try styles on the result." },
    { q: "Does it work for men?", a: "Yes. Fresh cut and Side part & quiff are made with short hair in mind, and every style works on any photo." },
    { q: "Can I upload a photo of a haircut I like?", a: "Not in this app; you choose from the ten styles. To describe a particular cut, use the AI photo editor." },
    { q: "Will my hair really look like that?", a: "It shows the shape and length well, but not exactly how your hair behaves. Show the picture to your hairdresser and ask if your hair type suits it." },
    { q: "Is there a watermark?", a: "No. You download the full-size picture without a watermark." },
  ],
};

export default page;
