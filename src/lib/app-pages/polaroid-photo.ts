import type { AppPage } from "./types";
import { COST, PACK_FROM } from "./facts";

const page: AppPage = {
  title: "AI Polaroid Photo: Turn Any Picture Into an Instant Print",
  h1: "AI Polaroid Photo Maker",
  metaDescription: "Turn any photo into a real-looking instant-film print: flash, warm tones, film grain and the white border, photographed on a table. Free to start.",
  tagline: "Upload a photo and get it back as an instant-film print lying on a wooden table: on-camera flash, warm tones, soft grain and the white border with the wide bottom edge.",
  keywords: "ai polaroid photo, polaroid ai trend, polaroid filter, instant film photo ai, polaroid style picture, gemini polaroid trend, vintage instant photo",

  howToHeading: "How to make an AI Polaroid photo",
  howTo: [
    { t: "Upload the moment", d: "A candid photo works best: a party, a dinner, a night out. It becomes a print of that same moment." },
    { t: "Pick a frame", d: "Classic white for the clean look, Vintage for a yellowed, decades-old print, With a caption for a handwritten note." },
    { t: "Generate and download", d: "In under a minute you get a photo of the print on a table, ready to post." },
  ],
  exampleCaption: "A candid, winking photo at a party with string lights behind becomes an instant-film print lying on a wooden table: warm flash, soft focus, a little grain and the classic white border.",

  sections: [
    {
      heading: "What does the Polaroid filter do?",
      paragraphs: [
        "It turns a phone photo into what looks like a real instant-film print of the same moment, then photographs that print from above on a wooden table. You get the whole object: the square-ish picture, the white border with the wider strip at the bottom, the slight sheen of the film.",
        "The picture itself is redone the way instant film records light: the on-camera flash look, warm indoor colours, slightly soft focus and gentle grain. Faces stay the same; only the photographic look and the frame change.",
        "It's a good way to give digital photos the feeling of something you could stick on a fridge or pin to a corkboard. People use it for nights out, couples and friends, and anything they'd once have shot on a real instant camera.",
      ],
    },
    {
      heading: "Why do instant photos look so different from phone photos?",
      paragraphs: [
        "Phone cameras do a lot of work behind the scenes. They combine several exposures, brighten shadows, sharpen detail and smooth noise, so every photo looks clean and evenly lit. Instant film does none of that, and that's exactly its charm.",
        "An instant camera fires a strong flash from right beside the lens, so faces are bright and the background falls into darkness. The film has a narrow range, so highlights blow out and shadows go deep. Colours shift warm or slightly green depending on the film and the temperature. And the picture is a little soft, with visible grain.",
        "Those flaws make a picture feel like a real moment rather than a polished image, which is why the look became so popular again. The app adds all of them deliberately: the flash, the warm cast, the softness and the grain. Then it puts the result in the frame you choose and lays it on a table, so it looks like something you could hold.",
      ],
    },
    {
      heading: "What was the Gemini Polaroid trend?",
      paragraphs: [
        "In September 2025, people used Google Gemini's Nano Banana model to make instant-film pictures of themselves hugging their younger self, or posing next to a celebrity in front of a white curtain with a harsh flash. It spread fast because it looked like a real snapshot from a party that never happened.",
        "This app does the part of that trend that works with your own photos: the instant-film look and the print. It doesn't add other people, younger versions of you or celebrities. It turns the moment you upload into a convincing instant print, running on Nano Banana Pro, the newer version of the same model.",
      ],
    },
    {
      heading: "Which frame should you pick?",
      paragraphs: ["Frame is the one setting. Auto lets the app choose, usually the classic white border."],
      items: [
        { t: "Classic white", d: "A clean white instant-film frame with the wide border at the bottom. The look most people picture, and the best for posting." },
        { t: "Vintage", d: "An aged print: yellowed border, faded warm colour, the look of a photo found in a shoebox. Lovely for family photos and anything nostalgic." },
        { t: "With a caption", d: "A white frame with a short handwritten caption in the bottom border. The app chooses the words, so treat it as a surprise; to write your own, use Classic white and add text in the [free photo editor](/editor)." },
      ],
      after: ["Use the 1:1 or 4:5 shape so the print and the table around it fill an Instagram post."],
    },
    {
      heading: "Which photos make the best instant prints?",
      list: [
        "Candid moments. Laughing, winking, mid-conversation: instant film is about the moment, not a perfect pose.",
        "Indoor and evening photos. The flash look and warm tones suit parties, dinners and fairy lights best, as in our example.",
        "Close-ups of one or two people. Instant prints are small, so faces should fill a good part of the frame.",
        "Photos you already like. The filter changes the look, not the moment, so start from one worth printing.",
        "Avoid screenshots and photos with text overlays. Stickers and captions from other apps end up printed into the picture.",
      ],
    },
    {
      heading: "What it won't do",
      list: [
        "**Print it.** You get a picture of a print, not a physical photo. For a real print, upscale it in the [image upscaler](/upscale) and send it to a photo printer.",
        "**Keep the exact framing.** Instant film is nearly square, so a tall phone photo is cropped closer to fit.",
        "**Add other people.** It won't put you next to a celebrity or your younger self.",
        "**Write the caption you choose.** With a caption writes its own words. Add yours afterwards with a text tool.",
      ],
    },
    {
      heading: "Ideas for your instant photos",
      items: [
        { t: "A photo dump", d: "Turn five photos from a trip or a party into prints and post them together. It looks like a real set of instant photos." },
        { t: "Couple and friend posts", d: "Anniversary posts and best-friend birthdays feel more personal as an instant print. Vintage makes them feel like a memory." },
        { t: "Digital scrapbooks", d: "Drop the prints into a scrapbook layout or a story, with handwritten notes beside them." },
        { t: "Event invitations", d: "A print of the couple or the birthday person on an invite gives it a relaxed, retro feel." },
      ],
      after: ["Love retro? The [90s yearbook photo](/creative/90s-yearbook-photo) and the [Y2K aesthetic](/creative/y2k-aesthetic) are made for the same feed."],
    },
    {
      heading: "What happens to your photo?",
      paragraphs: [
        "It's sent to our image-model partner, fal.ai, to make the print, and to no one else. It's not used to train AI models and never sold, and both the photo and the print are yours.",
        "Your prints are saved in My Creations, where you can download them again or delete them at any time. You can also ask us to delete your account and everything in it.",
      ],
    },
  ],

  faq: [
    { q: "How do I make an AI Polaroid photo?", a: "Upload a photo, choose a frame (Classic white is the usual look) and press Generate. You get your photo as an instant-film print lying on a table." },
    { q: "Is it free to use?", a: `Signing up is free and needs no card. Each print uses ${COST}; one-time credit packs start at ${PACK_FROM} and never expire. Where a free trial is running, the box above the upload says so and your first print is free.` },
    { q: "Can I make the Gemini Polaroid with a celebrity?", a: "No. This app turns your own photo into an instant print. It doesn't add celebrities or other people." },
    { q: "Will it still look like me?", a: "Yes. Faces are kept the same; only the film look, colours and frame change." },
    { q: "Can I write my own caption?", a: "Not inside the app. Choose Classic white, then add your words to the bottom border in the free photo editor." },
    { q: "Why is my photo cropped?", a: "Instant film is nearly square, so a tall phone photo is trimmed to fit the print. Keep the important part near the middle." },
    { q: "Is it a real Polaroid?", a: "No. It's a digital picture that looks like an instant-film print. PixelShine isn't connected to the Polaroid brand." },
    { q: "Can I print it?", a: "Yes. Upscale it first in the image upscaler, then print it like any photo." },
    { q: "Is there a watermark?", a: "No. The download is full size and has no watermark." },
  ],
};

export default page;
