import type { AppPage } from "./types";
import { COST, PACK_FROM } from "./facts";

const page: AppPage = {
  title: "AI Outfit Changer: Try On Clothes in Your Photo",
  h1: "AI Outfit Changer",
  metaDescription: "Change the clothes in any photo with AI. Describe an outfit in your own words and see it on you, in a setting that suits it. Free to start.",
  tagline: "See yourself in a different outfit before you buy it, pack it or wear it to the party. Describe the clothes in plain words, and the AI dresses you in them.",
  keywords: "ai outfit changer, change clothes in photo, try on clothes ai, outfit generator, virtual outfit try on, change dress in photo ai, ai clothes changer free",

  howToHeading: "How to change the outfit in a photo",
  howTo: [
    { t: "Upload a waist-up photo", d: "A photo where your shoulders and top are visible gives the app room to dress you. Face the camera if you can." },
    { t: "Describe the outfit", d: "Write it the way you'd tell a friend: \"a navy linen suit with a white T-shirt\". Leave it empty to see the app's own evening look." },
    { t: "Pick a setting and generate", d: "Choose where the photo is taken, or leave Auto. Try a few outfits on the same photo to compare them side by side." },
  ],
  exampleCaption: "A selfie in a grey sweatshirt, re-dressed with no description typed: an emerald satin slip dress, gold pendant and green drop earrings, in an evening lounge under a chandelier. Hair and face are unchanged.",

  sections: [
    {
      heading: "What does the AI outfit changer do?",
      paragraphs: [
        "It takes a photo of you and replaces what you're wearing with the outfit you describe, then places you in a setting that suits those clothes. Your face, hair and skin tone stay the same; the clothes, jewellery, light and background change.",
        "If you don't describe anything, you see the app's own look: an emerald-green satin slip dress with gold jewellery, or a dark green velvet blazer over a black shirt, in a candle-lit evening lounge. It's a good first test of how the app handles your photo before you start describing your own ideas.",
        "It's a way to see an idea on yourself, not a fitting room. The AI doesn't know your measurements and can't copy a specific product from a shop's photo, but it's very good at showing whether a colour, a cut or a whole style suits you.",
      ],
    },
    {
      heading: "How do you describe an outfit so it comes out right?",
      paragraphs: ["The description box is the whole point of this app. A good description names three things: the item, the colour and the fabric. Add the fit if it matters. Here are descriptions that work well, to copy or change."],
      items: [
        { t: "Smart for work", d: "\"A navy linen suit with a white T-shirt and no tie\" or \"a camel wool coat over a black turtleneck\". Good for testing a new work wardrobe." },
        { t: "Wedding guest", d: "\"A sage-green silk midi dress with thin straps\" or \"an ivory embroidered kurta with a light gold dupatta\". For a full saree look, the [saree photoshoot](/creative/saree-photoshoot) is made for it." },
        { t: "Casual weekend", d: "\"A black leather jacket over a white T-shirt\" or \"an oversized cream knit sweater\". Simple pieces come out the most convincing." },
        { t: "Holiday", d: "\"A pastel floral sundress with a straw hat\" or \"a short-sleeved linen shirt in sky blue\". Pair it with the Beach or Garden setting." },
        { t: "Party night", d: "\"A sequinned black blazer\" or \"a red satin dress with a cowl neck\". Leave the setting on Auto for the evening lounge." },
      ],
      after: [
        "Keep it to one outfit per run. \"A red dress or a blue suit\" makes the AI guess. If a detail matters, such as \"long sleeves\" or \"high neck\", say it plainly.",
      ],
    },
    {
      heading: "How can it help you find colours that suit you?",
      paragraphs: [
        "Most of us buy the same few colours because we're not sure what else works. The outfit changer is a quick way to find out, because you can try any colour on your real face and skin in a minute, without ordering anything.",
        "Pick one simple item, such as \"a plain crew-neck sweater\", and run it several times with only the colour changed: \"in camel\", \"in navy\", \"in olive green\", \"in dusty pink\", \"in charcoal\". Keep the setting on Studio so nothing else changes. Then put the results side by side and look at your face, not the sweater.",
        "The colours that suit you make your skin look even and your eyes look brighter; the ones that don't make you look tired or a little grey. Many people are surprised by the result, and it's far cheaper than returning clothes.",
      ],
    },
    {
      heading: "Which setting should you choose?",
      paragraphs: [
        "Setting decides where the new photo is taken. **Auto** picks the evening lounge, which flatters dressy clothes. **Studio** gives a clean backdrop, best when you're comparing outfits and want nothing else to change. **Outdoors** and **Garden** add daylight and greenery for casual and summer clothes. **City street** suits jackets, coats and street style. **Indoors** keeps a homely room. **Beach** is for holiday looks.",
        "When you're deciding between outfits, use the same photo and the same setting for each. Then the only thing that changes between pictures is the clothes, which makes the choice much easier.",
      ],
    },
    {
      heading: "What photo works best?",
      list: [
        "Waist up, facing the camera. The app frames the new photo from the waist up, so it needs to see your shoulders and body.",
        "Fitted clothes in the original help. A very baggy hoodie hides your shape, and the app has to guess it.",
        "Plain, even light. A dark photo or strong coloured light changes how the new fabric looks.",
        "Only you in the frame. With two people, the app may dress the wrong one or both.",
        "Arms relaxed by your sides or resting near your face. Crossed arms or a bag across your body make the outfit harder to draw.",
      ],
    },
    {
      heading: "What can't it do?",
      list: [
        "**Show your shoes.** The photo is framed from the waist up, so trousers and shoes are only partly visible, if at all.",
        "**Try on a product from a photo.** You can't upload a picture of a shop item; describe it in words instead. It shows the idea, not that exact garment.",
        "**Tell you if it fits.** It doesn't know your size. Use it to judge colour and style, then check the size chart.",
        "**Keep the original background.** The outfit comes with a new setting. If you need your own background, try the [AI photo editor](/ai-editor) and ask it to change only the clothes.",
        "**Draw logos and prints exactly.** Brand logos and detailed prints come out approximate.",
      ],
    },
    {
      heading: "What do people use it for?",
      items: [
        { t: "Deciding what to buy", d: "Before ordering something online, see the colour on yourself. A coat in camel and in navy can look surprisingly different on the same person." },
        { t: "Planning an event outfit", d: "Wedding, graduation, interview or date: try three ideas in a minute and see which one you'd actually wear." },
        { t: "Packing for a trip", d: "Check that the clothes you're bringing go together, in a beach or city setting." },
        { t: "Fresh photos for social media", d: "A new look for a profile picture without a new photo shoot. Use 4:5 for Instagram." },
        { t: "Styling ideas for clients", d: "Stylists and small clothing shops use it to show a look on a real person quickly. For a full product shoot, see the [AI photo editor](/ai-editor)." },
      ],
    },
    {
      heading: "What happens to the photo you upload?",
      paragraphs: [
        "It's sent to our image-model partner, fal.ai, to make the new picture, and to no one else. It isn't used to train AI models and it's never sold, and you own both the photo and the result.",
        "Everything you make is saved in My Creations, so you can compare outfits later. Delete any picture there whenever you like, or ask us to delete your account and all of it. Only upload photos of yourself, or of people who've said yes.",
      ],
    },
  ],

  faq: [
    { q: "How does the AI outfit changer work?", a: "Upload a waist-up photo, describe the outfit in words and press Generate. The AI dresses you in it, keeps your face and hair, and places you in a setting that suits the clothes." },
    { q: "Is the AI outfit changer free?", a: `Signing up is free and needs no card. Each outfit uses ${COST}, and one-time credit packs start at ${PACK_FROM} and never expire. Where a free trial is running, the box above the upload says so and your first outfit is free.` },
    { q: "Can I try on clothes from a shop's website?", a: "Not by uploading the product photo. Describe the item instead: colour, fabric and cut. You'll see the idea on you, though not that exact garment." },
    { q: "Will it still look like me?", a: "Yes. The app is told to keep your face, hairstyle and skin tone exactly as they are and change only clothes, accessories and setting." },
    { q: "What happens if I leave the description empty?", a: "You get the app's evening look: an emerald satin slip dress with gold jewellery, or a dark green velvet blazer over a black shirt, in a candle-lit lounge." },
    { q: "Does it work for men?", a: "Yes. Describe any outfit, such as a suit, a kurta or a denim jacket. With no description, men get the green velvet blazer look." },
    { q: "Can I change only the clothes and keep my background?", a: "This app changes the setting too. To change just the clothes, use the AI photo editor and write \"change only the outfit to…\"." },
    { q: "Can I see my shoes?", a: "Not really. The photo is framed from the waist up, which shows the outfit's top half and how it suits your face best." },
    { q: "Do you watermark the download?", a: "No. You download the full-size picture with no watermark." },
  ],
};

export default page;
