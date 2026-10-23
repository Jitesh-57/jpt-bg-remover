import type { AppPage } from "./types";
import { COST, PACK_FROM } from "./facts";

const page: AppPage = {
  title: "Photo to Ghibli: Free AI Ghibli Filter Online",
  h1: "Photo to Ghibli: AI Ghibli Filter",
  metaDescription: "Turn a selfie into Studio Ghibli-style art in under a minute: soft painted skies, warm light, and a face that still looks like you. Free to start.",
  tagline: "Upload a selfie and get it back as a hand-painted, Ghibli-style scene: soft skies, warm light, and a face that still looks like you.",
  keywords: "photo to ghibli, ghibli ai, ghibli filter, ghibli style photo, studio ghibli ai generator, ghibli art from photo, ghibli profile picture",

  howToHeading: "How to turn a photo into Ghibli style",
  howTo: [
    { t: "Upload a clear photo", d: "A selfie or portrait where your face is easy to see works best. Daylight photos give the painting more colour to work with." },
    { t: "Pick the framing and strength", d: "Head & shoulders for a profile picture, Full body if your outfit matters. Subtle stays close to your photo; Strong goes all in on the painted look." },
    { t: "Generate, then download", d: "It usually takes under a minute. If it isn't quite right, run it again: every run paints a slightly different scene." },
  ],
  exampleCaption: "A selfie on a sunny hillside above the sea, repainted. The app kept the hair, the backpack and the view, then added a few touches of its own: flowers, a street lamp and a cat that weren't in the photo.",

  sections: [
    {
      heading: "What is the Ghibli style, and why is everyone making these?",
      paragraphs: [
        "Studio Ghibli is the Japanese animation studio behind My Neighbor Totoro, Spirited Away and Howl's Moving Castle. Its films look hand-painted because the backgrounds were: watercolour skies, deep green hillsides, and light that feels like a slow summer afternoon. The characters are drawn simply, with big expressive eyes and very few lines.",
        "In March 2025, ChatGPT learned to edit photos, and people started asking it to redraw their selfies in that style. Within a week, Ghibli versions of family photos, weddings and pets were all over Instagram, X and WhatsApp. The trend never really went away. People still search for it every day, mostly to make a profile picture or a present for someone.",
        "This app paints the same kind of picture from your own photo. It doesn't use any film's characters or scenes; it redraws your photo with the soft colours, simple faces and calm backgrounds the style is known for. PixelShine has no connection to Studio Ghibli. \"Ghibli style\" is simply the name everyone uses for the look.",
      ],
    },
    {
      heading: "What does the Ghibli filter change in your photo?",
      paragraphs: ["Three things change, and one thing stays the same."],
      items: [
        { t: "The background becomes a painting", d: "Skies turn to soft watercolour, walls and trees get visible brush texture, and the light warms up. A plain grey wall won't turn into a meadow by itself, but the app fills empty space with a few flowers and small details." },
        { t: "Your face is simplified, not replaced", d: "Your features are drawn with fewer lines: brighter eyes, a smaller nose, gentle shading. The goal is that friends recognise you at a glance, the way they would in a good caricature." },
        { t: "The colours get warmer and calmer", d: "Harsh phone colours become the muted greens, blues and creams of the films. Night photos come out as evening scenes rather than dark ones." },
        { t: "What stays: your pose, hair and clothes", d: "The layout of your photo is kept. If you're holding a coffee cup, you're still holding it. If your hair is curly, it stays curly." },
      ],
    },
    {
      heading: "Which options should you pick?",
      paragraphs: ["There are two settings above the Generate button. Both start on Auto, which suits most photos, so you only need them when the first result isn't what you pictured."],
      items: [
        { t: "Framing: Head & shoulders", d: "Crops in close. It's the best choice for profile pictures, because your face fills the frame and still reads at a tiny size." },
        { t: "Framing: Half body", d: "Waist up. A good middle ground when your top, or whatever you're holding, is part of the story." },
        { t: "Framing: Full body", d: "Shows all of you and much more background. Use it for travel photos and wallpapers, where the scenery matters as much as you do." },
        { t: "Strength: Subtle", d: "Stays nearer your photo: more of your real proportions, a lighter coat of paint. Pick it when the strong version stops looking like you." },
        { t: "Strength: Strong", d: "Goes fully into the hand-painted look, with simpler features and a more painterly world around you. Best for wallpapers and prints." },
      ],
      after: [
        "Below those you can change the model and the shape. Nano Banana Pro, the default, is the best at keeping a face recognisable. Choose 1:1 for a profile picture, 4:5 for an Instagram post, and 9:16 for a phone wallpaper.",
      ],
    },
    {
      heading: "How do you make a Ghibli profile picture that works?",
      paragraphs: [
        "A profile picture is shown as a small circle, often no bigger than a thumbnail, so what matters is that your face reads at that size. Start from a photo where your face takes up at least a third of the frame, set Framing to Head & shoulders and the shape to 1:1, and leave Strength on Auto.",
        "Before you upload the result, look at it shrunk down on your phone. If your eyes and smile still read clearly, it will work on WhatsApp, Instagram and LinkedIn alike. If the background is busy, the circle crop will cut most of it away anyway, so a plain sky behind you is no loss. Many people make two: a close one for the profile picture and a Full body one for a cover photo or wallpaper.",
      ],
    },
    {
      heading: "How do you get the best Ghibli result?",
      list: [
        "Use a photo where your face is lit from the front. Hard shadows across the face become odd painted patches.",
        "Outdoor photos make the best scenes. Sky, trees and water are what this style paints best; a bare wall gives it little to work with.",
        "Take off sunglasses and keep hands away from your face. The app has to guess what's hidden, and guessing is where likeness slips.",
        "One to three people works best. In a group of six, each face is tiny and gets simplified a lot.",
        "If the result is close but not quite you, set Strength to Subtle and try again before you change the photo.",
        "Press **Use as input** to run a second pass on your result, for example to change the framing, without uploading again.",
      ],
    },
    {
      heading: "What can't it do well yet?",
      paragraphs: ["It's good at what it does, but it isn't magic. These are the cases where you'll want a second try, or a different photo."],
      list: [
        "**An exact likeness.** It's a drawing, so small things such as a scar or the exact shape of your eyebrows can be smoothed away.",
        "**Text and logos.** Writing on a T-shirt or a shop sign usually comes out as squiggles. If the words matter, add them afterwards in the [free photo editor](/editor).",
        "**Hands in awkward poses.** Fingers sometimes merge or multiply. Run it again, or pick Head & shoulders so the hands are out of frame.",
        "**Very small faces.** In a wide landscape where you're a dot, you may be painted as a generic figure. Crop the photo tighter first.",
        "**The films' characters.** It won't add Totoro or No-Face to your picture. It paints the style, not the studio's characters.",
      ],
    },
    {
      heading: "What do people make with it?",
      items: [
        { t: "Profile pictures", d: "The most common use by far. A Ghibli-style avatar stands out in a list of ordinary photos and still looks like you." },
        { t: "Phone wallpapers", d: "Pick 9:16 and Full body with a scenic photo. Holiday shots by the sea or in the hills come out especially well." },
        { t: "Presents and prints", d: "Couples turn a favourite trip photo into a print; families do it with a picture of their grandparents. For anything bigger than A4, run the result through the [image upscaler](/upscale) first." },
        { t: "Pet portraits", d: "The app is tuned for people, so a pet on its own is hit and miss. A photo of you holding your pet usually works better than the pet alone." },
        { t: "Invitations and cards", d: "A painted photo of the couple or the birthday person makes a simple invitation look made to order." },
      ],
    },
    {
      heading: "Can you make a Ghibli picture in ChatGPT or Gemini instead?",
      paragraphs: [
        "Yes. Both can redraw a photo if you upload it and describe the style. The catch is that you have to write the prompt yourself, results swing a lot with the wording, and the free plans limit how many images you can make in a day.",
        "If you want to write your own, this prompt works in ChatGPT, Gemini, or our [AI photo editor](/ai-editor): \"Redraw this photo as a hand-painted Japanese animated film scene: soft watercolour sky, warm afternoon light, simple expressive faces, lush greenery. Keep the person recognisable and keep their pose and clothes.\"",
        "This app has a longer version of that prompt built in, tuned to keep faces recognisable, so all you do is upload and press Generate. For more trend ideas, see our [AI photo effects guides](/guides/ai-photo-effects).",
      ],
    },
    {
      heading: "What happens to the photos you upload?",
      paragraphs: [
        "Your photo is sent to our image-model partner, fal.ai, to make the picture, and to no one else. It isn't used to train AI models and it's never sold. You keep full ownership of the photo you upload and the picture you download.",
        "The pictures you make are saved in My Creations in your account, so you can download them again later. You can delete any of them there at any time, or ask us to delete your account and everything in it.",
      ],
    },
  ],

  faq: [
    { q: "Is the Ghibli filter free?", a: `Making an account is free and needs no card. Each picture uses ${COST}, and one-time credit packs start at ${PACK_FROM} and never expire. If a free trial is running where you are, the box above the upload says so, and your first picture costs nothing.` },
    { q: "Will it still look like me?", a: "Usually, yes: friends should recognise you straight away. It is a drawing, though, so fine details get simplified. If it drifts, set Strength to Subtle and use a photo with your face lit from the front." },
    { q: "Is this made by Studio Ghibli?", a: "No. PixelShine has no connection to Studio Ghibli. \"Ghibli style\" is the common name for this hand-painted anime look, and the app paints your photo in that look without using any of the studio's characters." },
    { q: "Why did it add things that weren't in my photo?", a: "The style is known for small, lived-in details, so the app adds a few: flowers, a lamp, sometimes an animal. If you'd rather not have them, run it again. Each run paints a slightly different scene." },
    { q: "Does it work on group photos?", a: "Yes, with two or three people it works well. Bigger groups work too, but each face is smaller and gets simplified more, so likeness suffers. Crop to the people who matter most." },
    { q: "Can I turn my pet into Ghibli art?", a: "Sometimes. The app is tuned for people, so a pet alone can come out generic. A photo of you with your pet usually gives a better picture of both of you." },
    { q: "How long does it take?", a: "Usually under a minute. At busy times it can take a little longer. Keep the tab open and the result appears on its own." },
    { q: "What do I get when I download?", a: "A PNG at the full size the model makes, with no watermark. For a large print, run it through the image upscaler first." },
    { q: "Can I use the picture for my business?", a: "The picture you download is yours. You can use it on social media, in a shop or on a product. Just don't present it as official Studio Ghibli artwork, and only upload photos you have the right to use." },
  ],
};

export default page;
