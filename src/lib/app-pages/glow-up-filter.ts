import type { AppPage } from "./types";
import { COST, PACK_FROM } from "./facts";

const page: AppPage = {
  title: "AI Glow Up Filter: Natural Glow-Up Photo Editor",
  h1: "AI Glow Up Filter",
  metaDescription: "Give your selfie a natural glow-up: even skin, flattering light and neater hair, with your face and features unchanged. Free to start.",
  tagline: "Upload a selfie and get the well-rested, good-light version of it: even skin, flattering light and tidier hair. It's still your face, just on a good day.",
  keywords: "ai glow up, glow up filter, ai face glow up, glow up photo editor free, natural selfie retouch, ai skin retouch, glow up filter online",

  howToHeading: "How to glow up a photo with AI",
  howTo: [
    { t: "Upload a selfie or portrait", d: "Any everyday photo: a bedroom selfie, a video-call screenshot, a photo from a night out." },
    { t: "Choose how strong", d: "Subtle is barely there. Noticeable is the usual glow-up. Full is a polished, magazine-retouch finish." },
    { t: "Compare and download", d: "Put the result next to your original. If people would ask \"what filter is that?\", go one step weaker." },
  ],
  exampleCaption: "A casual bedroom selfie, glowed up: the redness on the cheeks is evened out, the light is warmer and brighter, and the stray hairs are tidied. Freckles, face shape and smile are all still there.",

  sections: [
    {
      heading: "What is an AI glow-up?",
      paragraphs: [
        "\"Glow-up\" started as a word for a real-life change: someone who looks healthier, happier and more put-together than they did a year ago. On TikTok and Instagram it became a trend of before-and-after photos, and then a filter.",
        "Most glow-up filters do it badly. They blur skin until it looks like plastic, enlarge eyes and slim faces, so the result looks like a different person. This app is built to do the opposite: it improves what a good photographer and a good night's sleep would improve, and leaves your face alone.",
        "In practice that means even skin tone without losing texture, brighter and more flattering light, hair that looks freshly styled, and a rested, polished overall look. Your bone structure, features, freckles and expression are kept exactly as they are.",
      ],
    },
    {
      heading: "What does it change, and what does it leave alone?",
      items: [
        { t: "Changes: skin tone and texture", d: "Redness, blotchiness and shine are evened out. Pores and texture stay, so skin still looks like skin. Spots are softened rather than airbrushed away." },
        { t: "Changes: the light", d: "Flat ceiling light or a dim room becomes soft, flattering light with a gentle catchlight in your eyes. This alone makes most of the difference." },
        { t: "Changes: hair", d: "Flyaways are tidied and hair gets a little more shape and shine, as if you'd just styled it." },
        { t: "Leaves alone: your face", d: "No slimming, no bigger eyes, no new nose or jawline. That's on purpose: the point is to look like yourself on a good day." },
        { t: "Leaves alone: your clothes and background", d: "The scene stays the same. Only you, and the light on you, are improved." },
      ],
    },
    {
      heading: "How is it different from a beauty filter?",
      paragraphs: [
        "Beauty filters on phone cameras and social apps work in real time, so they take shortcuts. They blur skin evenly, which removes texture along with blemishes. Many also reshape the face: thinner jaw, smaller nose, bigger eyes. Each change is small, but together they produce the familiar filtered look that people spot instantly.",
        "This app works on a still photo with a full image model, so it can be more careful. It evens out colour rather than blurring, keeps pores and fine lines that make skin look real, and fixes the light falling on your face instead of painting over it. And it doesn't reshape anything.",
        "The practical difference shows up when someone meets you. A filtered photo sets up an expectation you can't match; a natural glow-up looks like a good photo of you. That's why the Subtle and Noticeable strengths exist, and why most people end up posting one of those rather than Full.",
      ],
    },
    {
      heading: "Which strength should you choose?",
      paragraphs: ["Strength is the only setting. Auto picks a natural middle; the others let you choose."],
      items: [
        { t: "Subtle", d: "It should be hard to tell anything was done. Best for work profile pictures and for anyone who hates filters. (Never use it for passport or ID photos, which must be unedited.)" },
        { t: "Noticeable", d: "A clear improvement that still looks believable. The usual glow-up: what most people choose for Instagram and dating apps." },
        { t: "Full", d: "A full, professional-retouch finish, like a magazine portrait, but without crossing into plastic skin. Use it for a special photo you want to print or frame." },
      ],
    },
    {
      heading: "How to get the most natural glow-up",
      list: [
        "Start with a sharp photo. The app improves light and skin, but it can't add detail to a blurry face.",
        "Avoid photos that already have a beauty filter. Smoothing on top of smoothing is what makes skin look fake.",
        "Natural light in the original helps most. A window to the side or in front is ideal.",
        "Try Subtle first. Many people find the gentlest version is the one they actually post.",
        "If your hair or skin tone changes more than you'd like, run it again on Subtle. Each run is a little different.",
      ],
    },
    {
      heading: "Is it okay to post a glowed-up photo?",
      paragraphs: [
        "Yes, as long as it looks like you. Photographers have retouched light and skin for as long as there have been portraits, and a natural glow-up is no different. That's why this app doesn't reshape faces.",
        "On dating apps and professional profiles, the honest rule is simple: someone meeting you in person should recognise you instantly. Subtle and Noticeable stay well inside that. If you need a business photo, the [professional headshot](/creative/professional-headshot) app also changes clothes and background; for a full makeover look, try the [old money aesthetic](/creative/old-money-aesthetic).",
      ],
    },
    {
      heading: "What can't it do?",
      list: [
        "**Change your features.** It won't slim your face, change your nose or make you look younger. For a younger or older version, the [age progression](/creative/age-progression) app does that openly.",
        "**Fix a very dark or blurry photo.** Retake it in better light, or run it through the [image upscaler](/upscale) first to sharpen it.",
        "**Add makeup.** It evens skin; it doesn't apply a makeup look. Describe makeup in the [AI photo editor](/ai-editor) if you want it.",
        "**Retouch groups evenly.** It's built for one face. In a group, people further away get less attention.",
      ],
    },
    {
      heading: "What happens to your selfie?",
      paragraphs: [
        "It's sent to our image-model partner, fal.ai, to make the retouched version, and nowhere else. It isn't used to train AI models, is never sold, and both the original and the result belong to you.",
        "Your results are saved in My Creations, where you can download or delete them whenever you like. You can also ask us to delete your account and everything in it.",
      ],
    },
  ],

  faq: [
    { q: "How does the AI glow up filter work?", a: "It evens out skin tone, improves the light on your face and tidies your hair, while keeping your face, features and background as they are. Upload a selfie, choose a strength and press Generate." },
    { q: "Is it free?", a: `Your account is free and needs no card. Each glow-up uses ${COST}; one-time credit packs start at ${PACK_FROM} and never expire. Where a free trial is running, the box above the upload says so and your first one is free.` },
    { q: "Will it still look like me?", a: "Yes. It's told to keep your identity and features exactly the same. It changes light, skin evenness and hair neatness, not your face." },
    { q: "Does it slim my face or make my eyes bigger?", a: "No. It deliberately doesn't reshape anything. That's what makes most glow-up filters look fake." },
    { q: "Will my skin look plastic?", a: "It shouldn't. Pores and texture are kept. If it looks too smooth, choose Subtle, and avoid uploading a photo that already has a beauty filter." },
    { q: "Does it remove acne or spots?", a: "It softens and evens them. It doesn't fully airbrush them away, which keeps the skin looking real." },
    { q: "Can I use it on a dating profile?", a: "Yes, as long as it looks like you in person. Subtle and Noticeable keep you recognisable." },
    { q: "Does it work for men?", a: "Yes. It evens skin and light the same way, keeps facial hair, and tidies hair without changing the style." },
    { q: "Is there a watermark?", a: "No. You download the full-size photo without a watermark." },
  ],
};

export default page;
