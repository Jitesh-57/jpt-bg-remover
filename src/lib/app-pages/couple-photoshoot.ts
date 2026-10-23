import type { AppPage } from "./types";
import { COST, PACK_FROM } from "./facts";

const page: AppPage = {
  title: "AI Couple Photoshoot: Pre-Wedding Photos From a Selfie",
  h1: "AI Couple Photoshoot",
  metaDescription: "Turn a couple selfie into a cinematic pre-wedding portrait: wedding outfits, a palace courtyard and golden-hour light, both faces unchanged. Free to start.",
  tagline: "Upload a photo of the two of you and get a cinematic pre-wedding portrait: wedding outfits, a palace courtyard and warm golden-hour light, with both your faces kept the same.",
  keywords: "ai couple photo, couple photoshoot ai, pre wedding photoshoot ai, ai wedding photos, couple portrait from selfie, ai couple photo editor free, pre wedding shoot ideas",

  howToHeading: "How to make an AI couple photo",
  howTo: [
    { t: "Upload a photo of you both", d: "A couple selfie is perfect. Both faces should be clear and roughly the same size, close together." },
    { t: "Choose a setting and light", d: "Auto gives the palace courtyard at golden hour. Garden, Beach and City street move the shoot somewhere else." },
    { t: "Generate a few versions", d: "Each run changes the pose and outfits a little. Make three or four and pick the one you both like." },
  ],
  exampleCaption: "A couple selfie by the water, in a black hoodie and a white sweater, becomes a pre-wedding portrait: an ivory sherwani and a green embroidered lehenga with gold jhumkas, in a sandstone palace courtyard at golden hour.",

  sections: [
    {
      heading: "What does the AI couple photoshoot make?",
      paragraphs: [
        "A portrait that looks like it came from a pre-wedding shoot. By default, one of you wears an ivory embroidered sherwani and the other a dark-green embroidered lehenga with gold jhumkas, or matching festive outfits that suit you both. You stand close and affectionate in the arched courtyard of a sandstone heritage palace, in warm golden-hour light with a soft, blurred background.",
        "That's the classic Indian pre-wedding look, the kind couples travel to Udaipur or Jaipur palaces to shoot. Here it comes from a selfie you took on your phone.",
        "Both faces are kept exactly as they are. That's the hardest part of any couple edit, since the AI has to handle two people at once, and it's what this app is built around.",
      ],
    },
    {
      heading: "Which settings and light can you choose?",
      paragraphs: ["Two settings. Auto gives the palace at golden hour from our example."],
      items: [
        { t: "Setting: Garden", d: "Flowers and greenery, like a destination wedding in the hills. Pairs well with Soft daylight." },
        { t: "Setting: Beach", d: "Sand and sea at sunset, the Goa pre-wedding classic. Choose Golden hour for the warm glow." },
        { t: "Setting: City street", d: "A modern, editorial take: the two of you on a city street at dusk. Moody lighting makes it cinematic." },
        { t: "Setting: Studio", d: "A clean studio backdrop: elegant, and easy to use on an invitation or a save-the-date." },
        { t: "Setting: Outdoors or Indoors", d: "Outdoors gives open landscape; Indoors gives a grand room such as a heritage hotel hall." },
      ],
      after: [
        "Lighting does the rest. **Golden hour** is the pre-wedding favourite. **Soft daylight** is natural and fresh, **Studio** is crisp, **Moody** is dark and romantic, and **Bright & airy** is light and modern.",
      ],
    },
    {
      heading: "What kind of couple photo works best?",
      list: [
        "Both faces clear and close together. Heads touching or leaning in, like a selfie, gives the most natural pose.",
        "Similar distance from the camera. If one face is much bigger than the other, the smaller one gets less detail.",
        "Even light on both faces. If one of you is in shadow, the likeness of that person suffers.",
        "No sunglasses or caps. The app needs to see both faces well to keep them.",
        "Hands visible but not covering faces. Holding hands or an arm around each other turns into the portrait's pose.",
        "Any clothes and background: both are replaced.",
      ],
    },
    {
      heading: "What can't it do?",
      list: [
        "**Choose specific outfits.** It picks the wedding outfits. To describe your own, say \"a red lehenga and a gold sherwani\", use the [AI photo editor](/ai-editor).",
        "**Take two separate photos.** Both people need to be in one photo. If you only have separate pictures, take a quick selfie together for the best result.",
        "**Groups or families.** It's built for two. For one person's festive portrait, try the [saree photoshoot](/creative/saree-photoshoot) or the [festival photoshoot](/creative/festival-photoshoot).",
        "**Replace a real wedding photographer.** It's great for ideas, invitations and social posts. Your wedding day itself deserves real photos.",
      ],
    },
    {
      heading: "Pre-wedding and couple photo ideas",
      items: [
        { t: "Save-the-dates and invitations", d: "A Studio or Garden portrait makes a clean background for names and dates. Add text in the [free photo editor](/editor), or see the [wedding invite photo](/creative/wedding-invite-photo) app." },
        { t: "Plan your real shoot", d: "Try the palace, the beach and the city before booking a photographer and a location. Show them the version you both like." },
        { t: "Engagement announcements", d: "A cinematic portrait gets more love than a blurry selfie, and nobody has to dress up." },
        { t: "Anniversaries", d: "Married years ago without a pre-wedding shoot? Make one now from a recent photo." },
        { t: "A gift for parents", d: "Make a portrait of your parents from a photo of them together and print it for their anniversary." },
      ],
    },
    {
      heading: "Can you make couple photos in ChatGPT or Gemini?",
      paragraphs: [
        "Yes. Upload a photo of you both and ask for \"a cinematic pre-wedding portrait of this couple in an ivory sherwani and a green lehenga, in a palace courtyard at golden hour, keeping both faces exactly the same\". Keeping two faces accurate is where general chatbots most often slip, so expect a few tries, and free plans limit how many images you can make in a day.",
        "This app has the prompt built in with extra instructions to protect both faces, so you only choose a setting and light.",
      ],
    },
    {
      heading: "Pre-wedding outfit and location ideas to try",
      paragraphs: [
        "If you're planning a real pre-wedding shoot, the app is a cheap way to try ideas before you book anything. Here are combinations couples commonly test:",
      ],
      list: [
        "**Palace at golden hour (Auto):** the classic Rajasthan look, for traditional outfits and a grand feel.",
        "**Garden with Soft daylight:** fresh and romantic, ideal for pastel lehengas and light sherwanis.",
        "**Beach with Golden hour:** relaxed and warm, the Goa favourite. Lighter outfits look most natural here.",
        "**City street with Moody light:** modern and cinematic, for couples who want something that doesn't look like everyone else's shoot.",
        "**Studio with Bright & airy:** clean and minimal, the easiest background for a save-the-date with text on it.",
      ],
      after: [
        "Make the same photo in three or four of these, show them to each other and to your photographer, and you'll have a much clearer brief before the real shoot.",
      ],
    },
    {
      heading: "What happens to your photo?",
      paragraphs: [
        "It's sent to our image-model partner, fal.ai, to make the portrait, and to no one else. It isn't used to train AI models and is never sold, and you own both the photo and the portrait.",
        "Your portraits are saved in My Creations, so you can download them again. Delete any of them at any time, or ask us to delete your account and everything in it. Please make sure your partner is happy for their photo to be used.",
      ],
    },
  ],

  faq: [
    { q: "How do I make an AI couple photoshoot?", a: "Upload one photo of the two of you with both faces clear, choose a setting and light (or leave Auto for the palace look) and press Generate." },
    { q: "Is it free?", a: `Creating an account is free and needs no card. Each portrait uses ${COST}; one-time credit packs start at ${PACK_FROM} and never expire. Where a free trial is running, the box above the upload says so and your first portrait is free.` },
    { q: "Will both of us still look like ourselves?", a: "Yes. The app is told to keep both faces and identities exactly the same. A photo where both faces are clear and similar in size gives the best likeness." },
    { q: "Do we need to be in the same photo?", a: "Yes. Upload one photo with both of you in it. A quick selfie together works well." },
    { q: "Can we choose our outfits?", a: "Not here: it chooses coordinated wedding outfits. To describe exactly what you want, use the AI photo editor." },
    { q: "Is it only for Indian weddings?", a: "The default look is an Indian pre-wedding shoot. With Setting on Beach, Garden or Studio, the scene changes; for Western wedding clothes, describe them in the AI photo editor." },
    { q: "Does it work for same-sex couples?", a: "Yes. It's told to choose coordinated outfits that suit both of you. If the first result gets the outfits wrong, run it again, or describe exactly what you want in the AI photo editor." },
    { q: "Can I use it on our wedding invitation?", a: "Yes, the portrait is yours to use. Add names and dates afterwards in the free photo editor." },
    { q: "Is there a watermark?", a: "No. The full-size portrait downloads without a watermark." },
  ],
};

export default page;
