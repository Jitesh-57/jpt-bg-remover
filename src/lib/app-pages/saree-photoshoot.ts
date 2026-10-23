import type { AppPage } from "./types";
import { COST, PACK_FROM } from "./facts";

const page: AppPage = {
  title: "Gemini Saree Trend: AI Saree Photo Editor Online",
  h1: "AI Saree Photoshoot: the Gemini Saree Trend",
  metaDescription: "Do the viral Gemini saree trend from one selfie: a vintage Bollywood saree portrait with jhumkas, jasmine and warm palace light. Free to start.",
  tagline: "Upload a selfie and get the viral retro saree portrait: silk saree, gold jhumkas, jasmine in your hair and warm 90s film light. Your face stays yours.",
  keywords: "gemini saree trend, ai saree photo, nano banana saree prompt, ai saree photo editor free, vintage saree portrait, red saree ai photo, retro bollywood saree",

  howToHeading: "How to do the Gemini saree trend from a selfie",
  howTo: [
    { t: "Upload a clear selfie", d: "Face the camera in soft light. Any clothes are fine: the app dresses you in the saree, so a T-shirt photo works perfectly." },
    { t: "Pick a saree colour and setting", d: "Deep red is the classic trend look. Black & gold and Ivory & gold are the other favourites. Auto keeps the palace room." },
    { t: "Generate and download", d: "Your portrait is ready in under a minute. Try two or three colours: most people keep more than one." },
  ],
  exampleCaption: "A selfie in a grey sweatshirt becomes a 90s-style portrait: red silk saree with a gold border, gold jhumkas, a bindi and jasmine, chin resting on one hand in a palace lit by brass lamps.",

  sections: [
    {
      heading: "What is the Gemini saree trend?",
      paragraphs: [
        "In September 2025, Instagram filled with portraits of people in flowing saree drapes, lit like a scene from a 90s Hindi film: warm golden light, a little film grain, a flower tucked behind the ear. Most were made with Google Gemini's image model, nicknamed Nano Banana, by uploading a selfie and pasting a long prompt. That's why people still search for \"Gemini saree trend\" and \"Nano Banana saree prompt\" rather than any app's name.",
        "The look borrows from the Bollywood posters and studio portraits of the 1990s: rich silk, gold jewellery, soft focus and an expression somewhere between shy and dramatic. It took off because it turns an everyday selfie into something that looks like a professional shoot, without a stylist, a borrowed saree or a photographer.",
        "This app makes that portrait without the prompt. It runs on Nano Banana Pro, the newer version of the same model, with the trend's look already written in: the saree, the jhumkas, the jasmine and the warm palace light. You choose the colour and the place.",
      ],
    },
    {
      heading: "Which saree looks can you pick?",
      paragraphs: ["Saree colour is the setting that changes your portrait the most. Each one has its own mood."],
      items: [
        { t: "Deep red", d: "The classic. A red silk saree with a gold border, the colour most people picture when they think of the trend and of Indian bridal portraits." },
        { t: "Black & gold", d: "The other viral favourite: a black saree with gold work, which looks dramatic and modern at the same time. Great with Studio or City street." },
        { t: "Royal blue", d: "Rich and regal, and it flatters warm skin tones. It stands out in a feed full of red." },
        { t: "Emerald green", d: "A festive green that suits wedding season and Diwali posts, especially with the Garden setting." },
        { t: "Pastel pink", d: "Soft and light, closer to a modern engagement shoot than a 90s film. Works best with the Garden or Beach setting." },
        { t: "Ivory & gold", d: "Cream silk with gold, the Kerala-style look. Elegant and calm; lovely for Onam or a family portrait." },
      ],
      after: [
        "Setting moves you out of the palace room. Studio gives a clean backdrop, Outdoors and Garden add greenery, City street and Beach suit a modern version of the trend. Auto keeps the lamp-lit heritage room from our example.",
      ],
    },
    {
      heading: "Which saree colour suits your skin tone?",
      paragraphs: [
        "There's no wrong answer, but some colours make skin glow more than others, and it's an easy thing to test here since you can try every colour on the same photo.",
        "If your skin has warm, golden or olive undertones, the deep jewel colours tend to look richest: Deep red, Emerald green and Royal blue. Gold borders and jewellery sit naturally against warm skin too. If your skin has cool, pink undertones, Royal blue, Black & gold and Pastel pink often flatter more, and Ivory & gold can look soft and luminous.",
        "Very fair skin can look washed out next to pale colours, so a strong Deep red or Black & gold gives contrast. Deep skin tones look stunning in almost every colour here, especially Ivory & gold, Emerald green and Royal blue, where the contrast makes the portrait pop.",
        "The quickest way to decide: run the same selfie in three colours, put them side by side, and look at your face rather than the saree. The colour that makes your skin look brightest and most even is the one.",
      ],
    },
    {
      heading: "How do you get the best saree portrait?",
      list: [
        "Use a straight-on selfie in daylight. Window light gives the app clean skin tones to keep, which is what makes the result look like you.",
        "Hair loose or tied both work, but keep it off your face. The jasmine and jewellery go around it.",
        "Skip sunglasses, masks and heavy filters. A beauty filter on the original makes the portrait look plasticky.",
        "Your clothes don't matter, since the saree replaces them. Your face, skin tone and expression are what it keeps.",
        "Try at least two colours. The same photo looks very different in Deep red and Ivory & gold, and people often post a pair.",
        "If you like the result but not the colour, press **Use as input**, change the colour and generate again.",
      ],
    },
    {
      heading: "What doesn't it get right?",
      list: [
        "**Very specific drapes.** It dresses you in a classic Nivi-style drape. If you want a particular regional style or a specific saree from your wardrobe, describe it in the [AI photo editor](/ai-editor) instead.",
        "**Exact jewellery.** You get gold jhumkas, bangles and a bindi. If you'd rather not wear a bindi or want different jewellery, the editor can change those details too.",
        "**Group photos.** It's made for one person. For a couple, use the [couple photoshoot](/creative/couple-photoshoot) app; for festival group looks, try the [festival photoshoot](/creative/festival-photoshoot).",
        "**Hands.** The chin-on-hand pose sometimes gives a slightly odd finger. Run it again; it usually comes out right on the second try.",
      ],
    },
    {
      heading: "Where do people use their saree portraits?",
      items: [
        { t: "Instagram and WhatsApp", d: "The trend lives on Instagram, and a 4:5 portrait fills the feed best. Many people also set it as their WhatsApp picture for a festival." },
        { t: "Festival greetings", d: "Diwali, Navratri, Onam, Pongal and Durga Puja posts. Emerald green and Ivory & gold suit festival greetings especially well." },
        { t: "Before a real shoot", d: "Planning a wedding or engagement shoot? Try colours on yourself first and show the photographer what you like." },
        { t: "A gift for family", d: "A portrait of your mother or grandmother in her favourite colour makes a thoughtful print. Upscale it first in the [image upscaler](/upscale) for a frame." },
      ],
      after: [
        "Love the 90s film look? The [retro Bollywood portrait](/creative/retro-bollywood) goes further into vintage posters and film stills.",
      ],
    },
    {
      heading: "What's the Nano Banana saree prompt, if you want to write your own?",
      paragraphs: [
        "Prompts for the trend usually describe the saree, the jewellery, the light and the mood. One that works well in Gemini, ChatGPT or our [AI photo editor](/ai-editor): \"Turn this person into a 90s Bollywood-style portrait: a deep red silk saree with a gold border, gold jhumka earrings, jasmine in the hair, warm golden light and soft film grain. Keep the face exactly the same.\"",
        "Writing your own gives you full control, but it takes several tries, and Gemini's free plan limits how many images you can make each day. This app has the full prompt built in, with extra instructions to keep your face unchanged, so you only pick a colour.",
      ],
    },
    {
      heading: "Is it safe to upload your photo?",
      paragraphs: [
        "It's a fair question. During the trend, a widely shared post showed an AI portrait with a mole that wasn't visible in the uploaded photo, and police in India reminded people to be careful which sites they give their photos to. The general advice is sound: use a service that tells you where your photo goes.",
        "Here is where yours goes. It's sent to our image-model partner, fal.ai, to make the portrait, and to no one else. It isn't used to train AI models and it's never sold. You own both the selfie and the portrait. Your portraits are saved in My Creations, where you can delete them at any time, and you can ask us to delete your account and everything in it.",
      ],
    },
  ],

  faq: [
    { q: "How do I do the Gemini saree trend?", a: "Upload a clear selfie, choose a saree colour (Deep red for the classic look) and press Generate. You get the vintage saree portrait without writing a prompt." },
    { q: "Is the AI saree photo editor free?", a: `Your account is free and needs no card. Each portrait uses ${COST}; one-time credit packs start at ${PACK_FROM} and never expire. Where a free trial is running, the box above the upload says so and your first portrait is free.` },
    { q: "Is this the same AI as Gemini?", a: "It's the same family. Gemini's image feature is Google's Nano Banana model, and this app runs on Nano Banana Pro, the newer version, by default." },
    { q: "Can I choose a black saree?", a: "Yes. Pick Black & gold under Saree colour. Deep red, Royal blue, Emerald green, Pastel pink and Ivory & gold are there too." },
    { q: "Will it still look like me?", a: "Yes, it's told to keep your face exactly the same and change only the outfit, jewellery and scene. A clear, front-lit selfie gives the best likeness." },
    { q: "Can men use it?", a: "It's built for the saree look. For a sherwani or kurta portrait, the festival photoshoot and couple photoshoot apps are a better fit." },
    { q: "Can I do it with my partner or friends?", a: "This one is for one person. For two people, use the couple photoshoot app, which dresses both of you to match." },
    { q: "What size should I download for Instagram?", a: "Set the shape to 4:5 before you generate. That fills the Instagram feed without cropping." },
    { q: "Why does my portrait have a bindi?", a: "It's part of the classic 90s look the trend copies. If you'd rather not have one, open the result in the AI photo editor and ask it to remove the bindi." },
  ],
};

export default page;
