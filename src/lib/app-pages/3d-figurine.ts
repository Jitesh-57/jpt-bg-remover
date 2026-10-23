import type { AppPage } from "./types";
import { COST, PACK_FROM } from "./facts";

const page: AppPage = {
  title: "AI Action Figure Generator: Make a Figure of Yourself",
  h1: "AI Action Figure Generator",
  metaDescription: "Make an action figure of yourself from one photo: a glossy 1/7 scale collectible on a display base, with its own printed box. Free to start.",
  tagline: "Upload a photo and see yourself as a boxed collectible: a glossy 1/7 scale figure on its own base, with a printed box standing behind it.",
  keywords: "ai action figure generator, action figure of myself, 3d figurine from photo, ai figurine, make yourself an action figure, nano banana figurine, collectible figure ai",

  howToHeading: "How to make an action figure of yourself",
  howTo: [
    { t: "Upload a photo that shows your outfit", d: "Waist-up or full body works best. The figure is sculpted from your pose and clothes, so a tight face crop leaves it little to build." },
    { t: "Choose how it's displayed", d: "Base & box gives the classic look. Pick In its box for a sealed toy, or On a desk to show off its size." },
    { t: "Generate and download", d: "In under a minute you get a product-style photo of the figure. Run it again for a different box design or pose." },
  ],
  exampleCaption: "A street photographer with a camera on a rainy, neon-lit street becomes a figure on a round base. The app turned the camera into the theme: the box reads \"Street Photographer\" and holds a camera bag and tripod as accessories.",

  sections: [
    {
      heading: "What is the AI action figure trend?",
      paragraphs: [
        "It came in two waves. In April 2025, people started asking ChatGPT to turn them into a boxed action figure: a plastic version of themselves sealed in a blister pack, with their job or hobby printed on the box and tiny accessories beside them. A laptop and a coffee for the LinkedIn crowd, running shoes for the marathon runners. Brands and recruiters joined in within days.",
        "In September 2025, Google's Nano Banana model started a second wave. This time the figure stood on a clear round base on someone's desk, looking like a real 1/7 scale collectible, with a printed box standing behind it. That version spread even faster, because it looked less like a cartoon and more like something you could actually buy.",
        "This app makes the second kind, and runs on Nano Banana Pro by default. You get a photo that looks like a product shot of a real toy: glossy plastic, studio lighting, and a box made for your figure. Pick In its box from the options and you get closer to the first wave's sealed blister-pack look.",
      ],
    },
    {
      heading: "What will your figure look like?",
      items: [
        { t: "The figure", d: "Your pose and outfit become sculpted, painted plastic, with the slight sheen of a PVC collectible. Your face is kept recognisable, the way a good figure maker would sculpt a real person rather than a generic doll." },
        { t: "The base", d: "A round display base, like the ones collectible figures stand on. It's what makes the picture read as a real object on a shelf." },
        { t: "The box", d: "A printed collector's box with your figure's picture on it. The app usually gives it a title and accessories that match your photo: in our example, a camera turned into \"Street Photographer\", with a camera bag and tripod in the window." },
        { t: "The photo itself", d: "It's lit and framed like a product photo: soft studio light, shallow depth of field, real-looking materials. That's why people sometimes ask where they can buy theirs." },
      ],
    },
    {
      heading: "How is this different from a Funko or LEGO figure?",
      paragraphs: [
        "They're different kinds of toy, and the app family has one for each. This one makes a realistic collectible, the kind sold as a 1/7 scale statue: real proportions, a detailed sculpt of your face and clothes, and painted plastic that looks like a premium figure.",
        "A Funko-style figure is the opposite: a big square head, a small body and black button eyes, with only your hair and outfit carrying the likeness. The [Funko-style figure](/creative/funko-pop-figure) app makes that. A LEGO-style minifigure turns you into the blocky yellow figure with clip hands, which the [minifigure](/creative/lego-minifigure) app does.",
        "If you want people to recognise your face, this app is the one. If you want something cute and instantly recognisable as a toy, try the other two.",
      ],
    },
    {
      heading: "Which display option should you choose?",
      paragraphs: ["There's one setting, Presentation. It changes where your figure stands and what's around it."],
      items: [
        { t: "Base & box", d: "The default, and the trend's signature look: the figure on a clear round base on a desk, its printed box standing behind it." },
        { t: "In its box", d: "Sealed inside retail packaging with a clear window, like a toy on a shop shelf. The closest to the April 2025 blister-pack trend." },
        { t: "On a display base", d: "Just the figure on its base against a plain studio background, no packaging. The cleanest option for a profile picture." },
        { t: "On a desk", d: "The figure stands on a real desk beside everyday objects, so you can see how small it is. Good for a playful post." },
        { t: "In a scene", d: "The figure gets a whole miniature set around it, like a diorama. Best when your photo already has a strong theme, such as hiking gear or a guitar." },
      ],
    },
    {
      heading: "What photo makes the best action figure?",
      list: [
        "Show your outfit. A waist-up or full-body photo gives the app clothes and a pose to sculpt; a face-only selfie becomes a figure with invented clothes.",
        "Hold the thing that defines you. A camera, a guitar, a football or a laptop becomes the theme of the box and often a separate accessory.",
        "Use one clear subject. The figure is built around one person, so crop out friends in the background.",
        "Stand naturally. Arms crossed, hands in pockets and simple poses turn into the cleanest figures; jumping or dancing poses can come out stiff.",
        "Use even light. Strong shadows across your face can be sculpted in as dents or odd colours.",
        "If the box title isn't right, run it again. The title is the part that changes most between runs.",
      ],
    },
    {
      heading: "What can't the action figure generator do yet?",
      list: [
        "**Spell your name exactly.** It invents the box title from your photo and can't take typed text, and small print on the box can come out garbled. If you need your name on it, add it afterwards in the [free photo editor](/editor).",
        "**Make several people into one set.** It's built for one figure. A group photo usually comes out as one figure or a muddle; run each person separately instead.",
        "**Make a 3D file.** You get a photo of a figure, not a model you can 3D print. A print shop would need a separate 3D model.",
        "**Copy a real brand's packaging.** It won't reproduce a toy company's logo, and you shouldn't try to sell the picture as an official product.",
      ],
    },
    {
      heading: "What do people do with their figure?",
      items: [
        { t: "A profile picture with a story", d: "A figure that holds the tools of your job says what you do before anyone reads your bio. Use On a display base for a clean, round crop." },
        { t: "LinkedIn and work posts", d: "The professional version of the trend still gets shared: you, boxed, with a laptop and a coffee. Pick Base & box and a photo of you at work." },
        { t: "Gifts and team presents", d: "Make one for each person in a team or a family and print them as cards. For prints, run the image through the [image upscaler](/upscale) first." },
        { t: "Character ideas", d: "Illustrators and game makers use it to see how a character might look as merchandise before anyone sculpts a thing." },
      ],
      after: [
        "Like the figure look but want a different toy? Try the [Funko-style figure](/creative/funko-pop-figure), the [LEGO-style minifigure](/creative/lego-minifigure) or the [doll in a box](/creative/barbie-box).",
      ],
    },
    {
      heading: "Can you make an action figure in ChatGPT or Gemini?",
      paragraphs: [
        "Yes, both started the trend. Upload your photo and ask for \"a 1/7 scale collectible figure of this person on a round clear base, with a printed toy box behind it, photographed as a product shot\". Expect to adjust the wording a few times: the box, the scale and the likeness change a lot between attempts, and the free plans limit how many images you can make.",
        "Here the instructions are already written and tuned to keep your face, so you choose a presentation and press Generate. If you want to describe something very specific, such as a figure in a particular uniform, use the [AI photo editor](/ai-editor), where you write the prompt yourself.",
      ],
    },
    {
      heading: "What happens to the photo you upload?",
      paragraphs: [
        "It's sent to our image-model partner, fal.ai, to make your figure, and nowhere else. It isn't used to train AI models and it's never sold. You keep full ownership of both your photo and the figure picture.",
        "Your figures are saved in My Creations, where you can download or delete them whenever you want. You can also ask us to delete your account and everything in it.",
      ],
    },
  ],

  faq: [
    { q: "How do I make an action figure of myself?", a: "Upload a waist-up or full-body photo, choose a presentation (Base & box is the classic trend look) and press Generate. In under a minute you get a product-style photo of yourself as a boxed collectible." },
    { q: "Is the action figure generator free?", a: `Signing up is free and needs no card. Each figure uses ${COST}; one-time packs start at ${PACK_FROM} and the credits never expire. Where a free trial is running, the box above the upload shows it and your first figure is free.` },
    { q: "Can I get a real figure made from it?", a: "Not directly: you get a photo, not a 3D file. Some people take the picture to a 3D artist or a print-on-demand figure maker as a reference." },
    { q: "Can I put my name on the box?", a: "Not inside the app. It writes its own title based on your photo. Add your name afterwards in the free photo editor, which has a text tool." },
    { q: "Does it work for pets?", a: "It's made for people, so results with pets vary. A photo of you holding your pet works better: you become the figure and the pet often becomes an accessory." },
    { q: "Can I make a figure of a group or a couple?", a: "It's built for one figure per picture. For a couple, make two figures and place them side by side, or try the couple apps instead." },
    { q: "Is this the same as the Nano Banana figurine trend?", a: "Yes. That trend used Google's Nano Banana model to make a 1/7 scale figure on a clear base with a box behind it, which is what Base & box gives you. This app runs on Nano Banana Pro by default." },
    { q: "Why does the box say something strange?", a: "Small text is the weakest part of any AI image. The title is usually right, but fine print can be garbled. Run it again for a new box, or cover the fine print in the photo editor." },
    { q: "Can I sell prints of my figure?", a: "The picture is yours, so you can use it for your own products and posts. Don't present it as an official toy from a real brand, and only upload photos you have the right to use." },
  ],
};

export default page;
