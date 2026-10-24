import type { AppPage } from "./types";
import { COST, PACK_FROM } from "./facts";

const page: AppPage = {
  title: "Photo to Cartoon: Turn Your Photo Into a Cartoon Online",
  h1: "Photo to Cartoon Generator",
  metaDescription: "Turn your photo into a cheerful cartoon: bold outlines, bright colours and a friendly smile, ready for an avatar or sticker. Free to start.",
  tagline: "Upload a photo and get a bright, friendly cartoon of yourself with bold outlines and flat colours. It's made to work as an avatar, a sticker or a fun profile picture.",
  keywords: "photo to cartoon, cartoon yourself, turn photo into cartoon, cartoon generator, cartoon avatar from photo, cartoon picture of me, cartoonize photo free",

  howToHeading: "How to turn a photo into a cartoon",
  howTo: [
    { t: "Upload a clear photo", d: "A well-lit photo where your face is easy to see. A smile helps, since the cartoon is drawn smiling." },
    { t: "Set the framing", d: "Head & shoulders for an avatar, Half body if your top or a pose is part of it. Strength sets how cartoony it gets." },
    { t: "Generate and download", d: "Ready in under a minute. Each run draws a slightly different background, so try a couple." },
  ],
  exampleCaption: "A smiling photo with chin on hand, redrawn as a cartoon: bold outlines, flat colour, a sunny yellow wall, a \"Good Vibes Only\" sign, a coffee cup and hand-drawn hearts. The hair, sweater and pose all carry over.",

  sections: [
    {
      heading: "What kind of cartoon does it make?",
      paragraphs: [
        "A friendly, modern cartoon: the style you see in sticker packs, children's books and brand illustrations. It has bold, clean outlines, bright flat colours with soft shading, and simplified features with a big, warm smile.",
        "Your pose, clothes and hairstyle carry over, so it still reads as you. The background is replaced with a cheerful scene, usually a sunny yellow wall with a plant, a picture frame and a coffee cup, and a few hand-drawn hearts and sparkles around you.",
        "If you're after a different kind of drawing, there are other apps for it: the [anime style](/creative/anime-style) for soft, painterly anime, the [Ghibli style](/creative/ghibli-style) for hand-painted scenes, the [Pixar-style avatar](/creative/pixar-avatar) for a 3D animated look, and the [comic book cover](/creative/comic-book-cover) for bold superhero art.",
      ],
    },
    {
      heading: "Which options should you pick?",
      paragraphs: ["Two settings, both on Auto to start."],
      items: [
        { t: "Framing: Head & shoulders", d: "Your face fills the frame. Best for profile pictures and avatars, which are shown small." },
        { t: "Framing: Half body", d: "Waist up, so your outfit and what you're holding show. Good for stickers and posts." },
        { t: "Framing: Full body", d: "The whole of you, standing in the scene. Fun for a poster or a character sheet." },
        { t: "Strength: Subtle", d: "Closer to your real proportions, with a lighter cartoon touch. Choose it if Strong stops looking like you." },
        { t: "Strength: Strong", d: "A fully cartoon look, with simpler shapes and bigger expressions. Best for stickers and anything playful." },
      ],
      after: [
        "Pick the shape before you generate: 1:1 for an avatar, 4:5 for an Instagram post, 9:16 for a story or a phone wallpaper.",
      ],
    },
    {
      heading: "What photo gives the best cartoon?",
      list: [
        "Smile in the photo. The cartoon is drawn with a big smile; if you're serious in the original, the smile can look added on.",
        "Face the light. A clear, evenly lit face gives the cleanest outlines.",
        "Show your hair clearly. Hairstyle is one of the strongest clues that the cartoon is you, so avoid hats unless you always wear one.",
        "Keep the photo uncluttered. Busy backgrounds are replaced anyway, but objects close to you may be turned into cartoon props.",
        "One or two people. In a group, every face gets simpler and harder to tell apart.",
      ],
    },
    {
      heading: "What won't it do?",
      list: [
        "**Keep a serious face.** It's a cheerful style, so expect a smile.",
        "**Write the words you want.** The background often includes a little sign or mug with a short phrase the AI chooses. You can't set it, so add your own text afterwards in the [free photo editor](/editor) if you need it.",
        "**Make a transparent sticker.** You get a picture with a background. To cut it out, run it through the [background remover](/remove-bg).",
        "**Draw in a specific artist's or show's style.** It has its own friendly style. For anime, Pixar-like or Ghibli looks, use those apps.",
      ],
    },
    {
      heading: "Ways to use your cartoon",
      items: [
        { t: "Profile pictures and avatars", d: "A cartoon avatar is friendly and recognisable, and works well on Slack, Discord, gaming profiles and WhatsApp." },
        { t: "Stickers", d: "Make a few with different expressions in your photos, remove the background, and turn them into a WhatsApp or Telegram sticker pack." },
        { t: "A personal brand", d: "Freelancers and small shops use a cartoon of themselves on business cards, email signatures and their website's About page." },
        { t: "Cards and invitations", d: "A cartoon of the birthday person or the couple makes an invitation feel personal without being too formal." },
        { t: "A present for kids", d: "Children love seeing themselves as a cartoon. Print it, or make one of the whole family for the fridge." },
      ],
    },
    {
      heading: "Can you cartoon yourself in ChatGPT or Gemini?",
      paragraphs: [
        "Yes, both can redraw a photo as a cartoon if you upload it and ask. It takes some trial and error to get a consistent style, and the free plans limit how many images you can make in a day.",
        "If you want to write your own, try: \"Redraw this photo as a friendly cartoon illustration with bold clean outlines, bright flat colours and soft shading. Keep the person recognisable, with the same hairstyle and clothes.\" That works in ChatGPT, Gemini or our [AI photo editor](/ai-editor). This app has a fuller version built in, so you only choose the framing.",
      ],
    },
    {
      heading: "How do you make a cartoon sticker pack of yourself?",
      paragraphs: [
        "Cartoon stickers of yourself are one of the most fun things to make with this app, and they take about ten minutes.",
        "First, take four or five photos of yourself with different expressions: laughing, surprised, thumbs up, eye roll, waving. Run each one through the cartoon generator with Head & shoulders framing and Strength on Strong, so the set looks consistent.",
        "Next, put each cartoon through the [background remover](/remove-bg) to get a transparent PNG. Stickers need a clear background to look right in a chat.",
        "Finally, add them to WhatsApp or Telegram with a sticker-maker app, which takes PNGs and turns them into a pack. WhatsApp packs need at least three stickers. Share the pack with friends, and they'll want one of their own.",
      ],
    },
    {
      heading: "What happens to your photo?",
      paragraphs: [
        "It's sent to our image-model partner, fal.ai, to draw the cartoon, and to no one else. It's never used to train AI models or sold, and you own both your photo and the cartoon.",
        "Your cartoons are saved in My Creations, where you can download or delete them at any time. You can also ask us to delete your account and everything in it.",
      ],
    },
  ],

  faq: [
    { q: "How do I turn my photo into a cartoon?", a: "Upload a clear photo, choose a framing (Head & shoulders for an avatar) and press Generate. In under a minute you get a bright cartoon version of yourself." },
    { q: "Is the cartoon generator free?", a: `Your account is free and needs no card. Each cartoon uses ${COST}; one-time credit packs start at ${PACK_FROM} and never expire. Where a free trial is running, the box above the upload says so and your first cartoon is free.` },
    { q: "Will the cartoon still look like me?", a: "Yes, it keeps your hairstyle, clothes and pose and draws your features in a simpler way. If it drifts, set Strength to Subtle." },
    { q: "Can I make a cartoon of my family?", a: "Yes, with two or three people it works well. In bigger groups each face gets simpler, so crop to a few people at a time." },
    { q: "Why is my cartoon smiling when I wasn't?", a: "The style is drawn with a warm smile. Upload a photo where you're smiling for the most natural result." },
    { q: "Can I get a transparent background for a sticker?", a: "Run the cartoon through the background remover. It cuts you out of the scene and gives you a transparent PNG." },
    { q: "What's the difference between cartoon and anime?", a: "The cartoon style has bold outlines and flat, bright colour. The anime style is softer and more painterly, with expressive eyes. Try both on the same photo." },
    { q: "Can I use my cartoon for my business?", a: "Yes, the picture you download is yours to use on your website, cards or social media. Only upload photos you have the right to use." },
    { q: "Do you watermark the download?", a: "No. The full-size cartoon downloads with no watermark." },
  ],
};

export default page;
