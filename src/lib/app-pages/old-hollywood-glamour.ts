import type { AppPage } from "./types";
import { COST, PACK_FROM } from "./facts";

const page: AppPage = {
  title: "Old Hollywood Photo: AI Vintage Glamour Portrait",
  h1: "Old Hollywood Glamour Portrait",
  metaDescription: "Turn a selfie into an Old Hollywood glamour portrait: 1950s gown or tuxedo, finger waves and dramatic black-and-white studio light. Free to start.",
  tagline: "Upload a selfie and step into a 1950s studio portrait: an evening gown or a tuxedo, glossy waved hair and dramatic black-and-white light. Same face, very different era.",
  keywords: "old hollywood photo, old hollywood photoshoot ai, vintage glamour portrait, old hollywood glamour filter, black and white hollywood portrait, 1950s portrait ai, classic film star photo",

  howToHeading: "How to make an Old Hollywood portrait",
  howTo: [
    { t: "Upload a clear selfie", d: "Facing the camera or turned slightly. The light and styling are added, so an everyday photo at home is fine." },
    { t: "Choose setting and lighting", d: "Auto gives the classic studio look. Moody is the most dramatic; Golden hour softens it into sepia warmth." },
    { t: "Generate and download", d: "Under a minute later you have a film-star portrait. Try Studio and Moody side by side." },
  ],
  exampleCaption: "A casual selfie in a black sweater becomes a 1950s studio portrait: black and white, glossy waved hair, a satin strapless gown, long satin gloves, a fur stole and drop earrings against dark drapes.",

  sections: [
    {
      heading: "What is the Old Hollywood glamour look?",
      paragraphs: [
        "From the 1930s to the 1950s, film studios kept portrait photographers on staff to make their stars look larger than life. George Hurrell, who shot for MGM, is the most famous of them. Their portraits had a recognisable recipe: a single hard light from above and in front, deep black shadows, skin that glowed, hair set in glossy waves, and gowns or dinner jackets that caught the light.",
        "Those pictures still define what \"glamour\" looks like. The lighting has a name in photography, Paramount or butterfly lighting, after the small shadow it leaves under the nose. It's why the trend keeps coming back: almost everyone looks dramatic in it.",
        "This app recreates that portrait from a normal selfie. It dresses you in 1950s-style formalwear, styles your hair the period way, lights you like a studio star, and renders it in rich black and white or sepia. Your face and identity stay exactly as they are, and the result looks like a real photograph rather than a painting.",
      ],
    },
    {
      heading: "How did the look change from the 1930s to the 1950s?",
      items: [
        { t: "The 1930s", d: "The most dramatic decade: hard spotlights, deep shadows, slinky bias-cut satin gowns, platinum finger waves and pencil-thin brows. Portraits were often shot from slightly below to make stars look statuesque." },
        { t: "The 1940s", d: "Hair grew longer and softer, in rolls and waves. Shoulders got structure, and portraits became a little warmer and more approachable, though still lit like a film." },
        { t: "The 1950s", d: "Full skirts, strapless gowns, gloves and pearls, short curled hair, and a sharper, cleaner light. Men's portraits settled on the dinner jacket and the slicked side parting. This is the decade the app's formalwear is based on." },
      ],
      after: [
        "You can lean towards an earlier decade with the settings: Moody lighting and the Studio setting get closest to the high-contrast 1930s feel, while Golden hour softens things towards the 1940s.",
      ],
    },
    {
      heading: "What will you be wearing?",
      items: [
        { t: "For gowns", d: "Satin or silk evening gowns, often off the shoulder, with long gloves, drop earrings or pearls, and sometimes a fur stole, as in our example. Hair is set in finger waves or soft pin curls." },
        { t: "For tuxedos", d: "A dinner jacket with a crisp shirt and bow tie, hair slicked and parted. Men get the classic leading-man portrait." },
        { t: "The finish", d: "Black and white or warm sepia, with a soft film-like sharpness. Skin keeps its natural texture; the glow comes from the light, not from smoothing." },
      ],
      after: ["You can't pick the outfit itself in this app. If you have something specific in mind, such as a red gown in colour, describe it in the [AI photo editor](/ai-editor)."],
    },
    {
      heading: "How do the setting and lighting options change it?",
      paragraphs: ["Auto gives the classic studio portrait from our example. The two settings let you move it."],
      items: [
        { t: "Lighting: Moody", d: "The most Hurrell-like: one light, deep shadow, high contrast. The best choice for a dramatic black-and-white print." },
        { t: "Lighting: Studio", d: "Clean, controlled light with a bright catchlight in the eyes, like a studio publicity photo." },
        { t: "Lighting: Golden hour", d: "Warmer and softer, often in sepia. It feels more romantic than dramatic." },
        { t: "Setting: Studio or Indoors", d: "Studio keeps the plain backdrop and drapes. Indoors puts you in a period room, such as a hotel lobby or a dressing room." },
        { t: "Setting: City street", d: "A night street with lights behind you, like a still from a film noir." },
      ],
      after: ["Soft daylight and Bright & airy work too, but they lighten the drama, which is the point of the look. Use them when you want something softer for a profile picture."],
    },
    {
      heading: "Tips for a better glamour portrait",
      list: [
        "Turn your face slightly to one side. Three-quarter angles were the studio standard, and they make the lighting more sculpted.",
        "Lift your chin a little and keep your eyes on the camera. Film-star portraits are confident.",
        "Hair up or down both work. If your hair is curly, as in our example, the app styles it into period waves.",
        "Take off modern accessories you don't want kept, such as a baseball cap. Earrings and necklaces are often restyled to match the era.",
        "A plain expression works as well as a smile. Many classic portraits are calm, with just a hint of a smile.",
      ],
    },
    {
      heading: "What it won't do",
      list: [
        "**Make it look like a specific star.** You stay you. It copies the style of the era, not any actor's face.",
        "**Keep your clothes.** The formalwear replaces them, since that's half of the look.",
        "**Give full colour by default.** The classic look is black and white or sepia. For colour, open the result in the [AI photo editor](/ai-editor) and ask for colour.",
        "**Work well with groups.** It's a solo portrait. For two people, try the [couple photoshoot](/creative/couple-photoshoot).",
      ],
    },
    {
      heading: "Where do people use these portraits?",
      items: [
        { t: "Profile pictures", d: "A black-and-white glamour portrait stands out on LinkedIn for creative roles, on Instagram, and on dating apps." },
        { t: "Themed parties", d: "Great Gatsby or Oscars-night parties: make one for each guest and print them as place cards or invitations." },
        { t: "Framed prints", d: "Black and white looks beautiful framed. Run the portrait through the [image upscaler](/upscale) before printing it large." },
        { t: "Actors and performers", d: "A quick way to see a period look before booking a real shoot, or for a vintage-themed show poster." },
      ],
      after: ["Like the retro look? Try the [Renaissance portrait](/creative/renaissance-portrait) for an oil-painting take, or the [old money aesthetic](/creative/old-money-aesthetic) for quiet luxury in colour."],
    },
    {
      heading: "What happens to your photo?",
      paragraphs: [
        "Your selfie is sent to our image-model partner, fal.ai, to make the portrait, and nowhere else. It isn't used to train AI models and is never sold, and you own both the selfie and the portrait.",
        "Your portraits are saved in My Creations, so you can download them again. Delete any of them there at any time, or ask us to delete your account and everything in it.",
      ],
    },
  ],

  faq: [
    { q: "How do I make an Old Hollywood glamour portrait?", a: "Upload a clear selfie and press Generate. The app adds 1950s formalwear, period hair and dramatic studio light. Choose Moody lighting for the most dramatic version." },
    { q: "Is it free?", a: `Your account is free and needs no card. Each portrait uses ${COST}; one-time credit packs start at ${PACK_FROM} and never expire. Where a free trial is running, the box above the upload says so and your first portrait is free.` },
    { q: "Will it still look like me?", a: "Yes. Your face and identity are kept exactly the same. Clothes, hair styling, light and background are what change." },
    { q: "Can I get it in colour?", a: "The classic look is black and white or sepia. For colour, open your result in the AI photo editor and ask it to colour the photo." },
    { q: "Does it work for men?", a: "Yes. Men are dressed in a dinner jacket and bow tie with slicked, parted hair, the classic leading-man portrait." },
    { q: "What is Hollywood glamour lighting?", a: "A hard light from high in front of the face, often called butterfly or Paramount lighting, with deep shadows around it. The Moody option gets closest." },
    { q: "Can I choose the outfit?", a: "Not in this app. It picks period formalwear for you. To describe a specific outfit, use the AI photo editor." },
    { q: "Can I print it?", a: "Yes. Black and white prints beautifully. For anything larger than A4, upscale it first in the image upscaler." },
    { q: "Is there a watermark?", a: "No. The full-size portrait downloads with no watermark." },
  ],
};

export default page;
