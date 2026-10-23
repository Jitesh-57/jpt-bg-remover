import type { AppPage } from "./types";
import { COST, PACK_FROM } from "./facts";

const page: AppPage = {
  title: "Photo to Anime: AI Anime Converter Online",
  h1: "Photo to Anime Converter",
  metaDescription: "Turn your photo into an anime illustration: soft colours, expressive eyes and cinematic light, with your own pose, outfit and scene. Free to start.",
  tagline: "Upload a photo and see yourself drawn as an anime character, with soft colours, expressive eyes and gentle film-like light. Your pose, outfit and setting carry over.",
  keywords: "photo to anime, anime yourself, photo to anime converter free, ai anime filter, turn me into anime, anime portrait from photo, anime pfp maker",

  howToHeading: "How to turn a photo into anime",
  howTo: [
    { t: "Upload a photo with some atmosphere", d: "A café, a street at night, a window with rain: anime loves a scene. A plain selfie works too." },
    { t: "Choose framing and strength", d: "Head & shoulders for a profile picture. Strong for a full anime look, Subtle to stay closer to your face." },
    { t: "Generate and download", d: "The illustration is ready in under a minute. Run it again for a different take on the light and colour." },
  ],
  exampleCaption: "A photo in a café on a rainy evening, redrawn as anime: same cream sweater, same \"Good Days Ahead\" mug and open book, with softer colours, bigger eyes and city lights glowing through the window.",

  sections: [
    {
      heading: "What does \"photo to anime\" actually change?",
      paragraphs: [
        "It redraws your photo as a hand-drawn anime illustration, the look of a modern anime film or a slice-of-life series. Faces get the genre's signature touches: larger, brighter eyes with highlights, a small nose, clean shapes and soft shading. Colours turn gentler, and light gets that glowy, cinematic quality anime is known for.",
        "Unlike a filter that only changes colours, the whole picture is redrawn. Your hair becomes defined strands, fabric gets painted folds, and the background becomes an illustrated version of where you were. In our example, the rain on the café window and the lights outside came out more atmospheric than in the photo.",
        "What stays is everything that makes the picture yours: your hairstyle, your outfit, your pose, and what's around you.",
      ],
    },
    {
      heading: "Anime, Ghibli or cartoon: which should you use?",
      paragraphs: ["They're three different looks, and the same photo comes out very differently in each."],
      items: [
        { t: "Anime (this app)", d: "Modern anime: expressive eyes, clean line art, soft, glowing colour. It keeps your real scene, so it's best for photos with a mood: cafés, cities, golden hour, rain." },
        { t: "Ghibli style", d: "Hand-painted and storybook-like, with watercolour skies and lots of greenery. The [Ghibli filter](/creative/ghibli-style) suits outdoor and travel photos." },
        { t: "Cartoon", d: "Bold outlines and flat, bright colour, with a big smile. The [cartoon generator](/creative/cartoon-generator) is made for avatars and stickers." },
      ],
      after: [
        "For a 3D animated-film look instead, try the [Pixar-style avatar](/creative/pixar-avatar).",
      ],
    },
    {
      heading: "Which settings give which look?",
      items: [
        { t: "Framing: Head & shoulders", d: "Close in on your face: the classic anime profile picture, with the eyes doing most of the work." },
        { t: "Framing: Half body", d: "Waist up, with your outfit and hands in the shot. The most natural for posts, like a frame from a series." },
        { t: "Framing: Full body", d: "The whole figure in the scene. Choose it when the place matters: a street, a station, a field." },
        { t: "Strength: Subtle", d: "Semi-realistic anime: your real proportions with anime colour and line. A good choice if Strong doesn't look enough like you." },
        { t: "Strength: Strong", d: "Full anime style with stylised features. The most \"turned into a character\" look." },
      ],
      after: ["Then pick the shape: 1:1 for a profile picture, 4:5 for an Instagram post, 9:16 for a phone wallpaper, or 16:9 for a desktop background."],
    },
    {
      heading: "Tips for a better anime picture",
      list: [
        "Choose a photo with interesting light. Window light, sunset, neon signs and fairy lights all become beautiful in anime.",
        "Show your hair. Anime draws hair as a key part of a character, so a clear view of yours makes the result recognisable.",
        "Keep your face uncovered. Hands on the chin are fine, as in our example; masks and sunglasses aren't.",
        "Use a sharp original. Blurry photos give the app too little to draw your features from.",
        "Want a different mood? Run the same photo with Strong and with Subtle, and keep both.",
        "Use **Use as input** on a result you like to try another framing without uploading again.",
      ],
    },
    {
      heading: "Where does it struggle?",
      list: [
        "**Text in the scene.** Signs, book titles and mugs come out as invented words, as on the chalkboard in our example.",
        "**Big groups.** It handles two or three people well. In a crowd, faces become generic.",
        "**A specific series' style.** It draws in a general modern-anime style. It won't copy a particular show's art or add known characters.",
        "**Hands.** Fingers holding things can come out odd. Run it again, or frame closer.",
      ],
    },
    {
      heading: "What people make with it",
      items: [
        { t: "Anime profile pictures", d: "The most popular use: a Head & shoulders portrait that works on Discord, X, Instagram and gaming profiles." },
        { t: "Couple and friend pictures", d: "A photo of two people redrawn as anime makes a sweet anniversary post or a present." },
        { t: "Wallpapers", d: "Choose 9:16 with a scenic photo. Cityscapes and night shots make striking phone wallpapers." },
        { t: "Characters for stories", d: "Writers and roleplayers use it to picture themselves, or a friend, as a character." },
      ],
    },
    {
      heading: "Can you do it in ChatGPT or Gemini?",
      paragraphs: [
        "Yes. Upload your photo and ask: \"Redraw this as a modern anime illustration with soft colours, expressive eyes, clean line art and cinematic lighting. Keep the person recognisable and keep the scene.\" Results change with the wording, and free plans limit how many you can make a day.",
        "This app has that kind of prompt built in and tuned to keep your face, so you only upload and choose the framing. For your own wording, use the [AI photo editor](/ai-editor).",
      ],
    },
    {
      heading: "How do you make an anime couple or friends picture?",
      paragraphs: [
        "Anime pictures of two people are some of the most shared, for anniversaries, best-friend birthdays and matching profile pictures. A few things make them work.",
        "Use one photo with both of you close together, faces similar in size and both clearly lit. A selfie works well. Set Framing to Half body so both of you fit and your poses show, and leave Strength on Auto so both faces stay recognisable.",
        "For matching profile pictures, make the couple picture first, then crop each person out of it in the [free photo editor](/editor). Because they come from the same drawing, the style, colours and light match perfectly, which separate pictures never quite do.",
        "If the app simplifies one face more than the other, run it again: the two of you are drawn a little differently each time.",
      ],
    },
    {
      heading: "What happens to your photo?",
      paragraphs: [
        "It's sent to our image-model partner, fal.ai, to draw the illustration, and nowhere else. It's never used to train AI models and never sold, and both the photo and the illustration are yours.",
        "Your illustrations are saved in My Creations. Download or delete them whenever you like, or ask us to delete your account and everything in it.",
      ],
    },
  ],

  faq: [
    { q: "How do I turn my photo into anime?", a: "Upload a clear photo, choose a framing and a strength, and press Generate. You get an anime illustration of you, in your own scene, in under a minute." },
    { q: "Is the photo to anime converter free?", a: `Making an account is free and needs no card. Each illustration uses ${COST}; one-time credit packs start at ${PACK_FROM} and never expire. Where a free trial is running, the box above the upload says so and your first one is free.` },
    { q: "Will it still look like me?", a: "Yes, it keeps your hairstyle, outfit and pose, and draws your face in anime proportions. For a closer likeness, set Strength to Subtle." },
    { q: "What's the difference between this and the Ghibli filter?", a: "Anime is modern and glowy with clean line art and keeps your real scene. Ghibli style is hand-painted, with watercolour skies and storybook backgrounds." },
    { q: "Can I make an anime profile picture?", a: "Yes. Set Framing to Head & shoulders and the shape to 1:1. Faces read best at small sizes that way." },
    { q: "Does it work with two people?", a: "Yes, couples and pairs of friends work well. With larger groups, faces get more generic." },
    { q: "Can I print it?", a: "Yes. For a large print, upscale it first in the image upscaler." },
    { q: "Can I choose a specific anime's style?", a: "No. It draws in a general modern-anime style and won't copy a particular series or its characters." },
    { q: "Is there a watermark?", a: "No. The download is full size, with no watermark." },
  ],
};

export default page;
