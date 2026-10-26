import type { AppPage } from "./types";
import { COST, PACK_FROM } from "./facts";

const page: AppPage = {
  title: "Restore Old Photos Online: AI Photo Restoration",
  h1: "Restore Old Photos with AI",
  metaDescription: "Fix scratched, torn and faded family photos with AI: repair the damage, sharpen faces and add natural colour, or keep it black and white. Free to start.",
  tagline: "Upload a scan or a phone photo of an old print. The AI repairs scratches, tears and fading, brings faces back into focus and, if you like, adds natural colour.",
  keywords: "restore old photos, old photo restoration online free, fix old photos with ai, repair damaged photo, ai photo restoration, colorize old photos, fix torn photo",

  howToHeading: "How to restore an old photo",
  howTo: [
    { t: "Scan or photograph the print", d: "A flatbed scan is best. A phone photo works too: lay the print flat in daylight and shoot straight down, with no glare." },
    { t: "Choose colour and strength", d: "Auto adds natural colour to faded or black-and-white photos. Pick Keep black & white to stay true to the original." },
    { t: "Generate and compare", d: "Check faces closely against the original. If the repair looks too smooth, go back and set Strength to Subtle." },
  ],
  exampleCaption: "A creased, torn sepia print of a family of four on a stone wall, restored: the tears and stains are gone, the faces are sharp, and the scene is in natural colour, including the lake and trees the AI recovered behind them.",

  sections: [
    {
      heading: "What can AI fix in an old photo?",
      paragraphs: [
        "Most damage on old family photos falls into a few kinds, and AI is now good at all of them. It doesn't just smooth the picture; it rebuilds the parts that are missing from what's around them.",
      ],
      items: [
        { t: "Scratches, creases and tears", d: "Lines across the print are filled in with what should be underneath: skin, fabric, sky. Even a tear straight through the middle can usually be closed." },
        { t: "Fading and yellowing", d: "Prints from the 1960s to the 1990s often fade to orange or pink. The app brings back the contrast and neutral tones." },
        { t: "Blur and lost detail in faces", d: "Small, soft faces are sharpened and given back their eyes, mouths and hairlines. This is where AI restoration has improved the most." },
        { t: "Spots, dust and grain", d: "Mould spots, dust from the scanner and heavy film grain are cleaned up without making the photo look plastic." },
        { t: "Missing colour", d: "Black-and-white and sepia photos can be colourised with believable skin tones and clothing colours, or kept in black and white." },
      ],
    },
    {
      heading: "Which old photos should you restore first?",
      paragraphs: [
        "If you have a box or an album, it's tempting to scan everything. It's easier to start with the photos that matter most and are at the most risk.",
      ],
      list: [
        "**Photos of people who are no longer here.** These are usually the only copies, and relatives often ask for them first.",
        "**Prints that are actively getting worse.** Fading colour prints from the 1970s to the 1990s, photos stuck in sticky \"magnetic\" albums, and anything with mould spots.",
        "**Photos with only one copy.** Negatives are often lost, so the print is all there is.",
        "**Group photos of the family.** Weddings, reunions and holidays carry the most faces per picture.",
        "**Photos you plan to frame or share.** Restoring them gives you a clean copy for a print or a family group straight away.",
      ],
      after: [
        "Scan the whole box once you've done these. Even without restoring them, a scan is a safe copy if the originals are lost or damaged.",
      ],
    },
    {
      heading: "Which colour and strength should you choose?",
      paragraphs: ["There are two settings. Both start on Auto, which repairs the damage and colours a faded or black-and-white photo naturally."],
      items: [
        { t: "Colour: Keep black & white", d: "Repairs everything but leaves it in black and white. The right choice when the photo should look like it did on the day, or when you're restoring it for an archive." },
        { t: "Colour: Colourise naturally", d: "Adds realistic, slightly muted colour, the way film of that era looked. Good for most family photos." },
        { t: "Colour: Vivid colour", d: "Brighter, modern colour. It makes an old photo feel like it was taken yesterday, which some people love and others find too much." },
        { t: "Strength: Subtle", d: "A light touch: fixes the worst damage and keeps more of the original texture. Use it for photos that are only a little worn." },
        { t: "Strength: Noticeable or Full", d: "Full repairs heavy damage and rebuilds more detail. Use it for badly torn or faded prints, and check faces carefully afterwards." },
      ],
    },
    {
      heading: "How do you scan an old photo for the best result?",
      list: [
        "A flatbed scanner at 600 dpi captures enough detail for the AI to work with. For tiny prints such as passport-sized photos, use 1200 dpi.",
        "No scanner? Lay the photo flat by a window in daylight and photograph it straight from above, filling the frame. A free scanning app such as Google PhotoScan helps remove glare.",
        "Don't use flash on glossy prints. The glare hides detail the AI can't recover.",
        "Take the photo out of the frame and the glass. Reflections and dust on the glass are scanned as damage.",
        "Scan the whole print, borders included, then let the app decide what to repair.",
        "Keep the original scan. Restore from the scan each time, not from a restored copy, so you never stack edits on top of edits.",
      ],
    },
    {
      heading: "Will the restored photo still be accurate?",
      paragraphs: [
        "Mostly, and it's worth knowing where it can't be. When part of a face or a background is missing, the AI fills the gap with the most likely detail. That's what makes restoration possible, but it means very damaged areas are a careful reconstruction, not a recovery of what was really there. In our example, the faded hills behind the family came back as a lake and trees: plausible, but the AI's reading of the scene.",
        "Colour works the same way. Black-and-white film records brightness, not colour, so colourised clothes and skin are an informed guess. A blue dress in the restored photo may have been green in real life.",
        "For family history, keep the original scan alongside the restored copy, and note on the back of any print which version it is. If accuracy matters most, use Keep black & white and Subtle strength.",
      ],
    },
    {
      heading: "What can't it restore?",
      list: [
        "**Faces that are completely missing.** If a tear or a stain has removed most of someone's face, the AI can't know what they looked like and will invent features.",
        "**Very small groups in a big scene.** In a wedding photo with fifty people, each face is a few dots. Crop to the people you care about first, then restore.",
        "**Writing on the photo.** Handwriting on the front, such as names and dates, may be smoothed away. Note it down before you restore.",
        "**Photos of a screen.** A photo of a photo on a monitor has moiré lines that look like damage. Scan the original print where you can.",
      ],
    },
    {
      heading: "What do people do with restored photos?",
      items: [
        { t: "Frame them for family", d: "A restored photo of grandparents is one of the most loved presents there is. For prints larger than A4, run it through the [image upscaler](/upscale) first." },
        { t: "Family history and archives", d: "Restore copies for a family tree, and keep the originals and the scans together." },
        { t: "Memorials and anniversaries", d: "A clear, colour photo for a memorial order of service, an anniversary card or a slideshow." },
        { t: "Share with relatives", d: "Relatives abroad often have never seen some photos clearly. Send the restored version in a family group." },
      ],
      after: [
        "Curious how a restored face might look today? The [age progression](/creative/age-progression) app ages a face forward. For more on scanning and repairing prints, read our [guide to restoring old photos](/blog/ai-photo-restoration-free-online).",
      ],
    },
    {
      heading: "What happens to your family photos?",
      paragraphs: [
        "Your scan is sent to our image-model partner, fal.ai, to make the restored copy, and to no one else. It isn't used to train AI models and is never sold, and you own both the scan and the restoration.",
        "Your restorations are saved in My Creations so you can download them again. Delete any of them there at any time, or ask us to delete your account and everything in it.",
      ],
    },
  ],

  faq: [
    { q: "Can AI restore my old photos?", a: "Yes. It repairs scratches, creases, tears, fading and blur, and sharpens faces. Badly damaged areas are reconstructed, so check faces against the original." },
    { q: "Is photo restoration free?", a: `Creating an account is free and needs no card. Each restoration uses ${COST}; one-time packs start at ${PACK_FROM} and the credits never expire. Where a free trial is running, the box above the upload says so and your first restoration is free.` },
    { q: "How should I scan an old photo?", a: "Use a flatbed scanner at 600 dpi, or photograph the print flat in daylight from straight above with no glare. Take it out of its frame first." },
    { q: "Can I keep it black and white?", a: "Yes. Set Colour to Keep black & white. The damage is repaired and the photo stays monochrome." },
    { q: "Are the colours accurate?", a: "They're a well-informed guess. Black-and-white film doesn't record colour, so clothes and backgrounds may differ from real life. Skin tones are usually very convincing." },
    { q: "Can it fix a torn photo?", a: "Usually, yes. Tears and creases are filled in from the surrounding detail. If a tear runs through a face, look closely at the result, since that part is rebuilt." },
    { q: "Does it work on group photos?", a: "Yes, for small groups. In a large group each face is tiny, so crop to the people you care about before restoring." },
    { q: "Will it replace my original?", a: "No. You download a new restored copy; your scan stays untouched. Keep both." },
    { q: "Can I print the restored photo?", a: "Yes. For a large print, upscale it in the image upscaler first so the detail holds up." },
  ],
};

export default page;
