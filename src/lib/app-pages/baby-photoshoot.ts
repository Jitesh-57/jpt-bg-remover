import type { AppPage } from "./types";
import { COST, PACK_FROM } from "./facts";

const page: AppPage = {
  title: "AI Baby Photoshoot at Home: Studio Baby Photos From Any Pic",
  h1: "AI Baby Photoshoot",
  metaDescription: "Turn an everyday photo of your baby into a soft studio portrait: knit bonnet, teddy bear and cosy props, with your baby's own face. Free to start.",
  tagline: "Turn a quick phone photo of your baby into a soft, cosy studio portrait: knit bonnet, teddy bear, warm window light. Your baby's face stays exactly the same.",
  keywords: "ai baby photoshoot, baby photoshoot at home, baby photoshoot ideas, ai baby photos free, newborn photoshoot ai, monthly baby photos ai, baby studio portrait from photo",

  howToHeading: "How to do a baby photoshoot at home with AI",
  howTo: [
    { t: "Upload a clear photo of your baby", d: "Any everyday picture works, on the bed, in a high chair or on your lap, as long as the face is in focus and not hidden." },
    { t: "Choose the stage and the light", d: "Leave Stage on As in photo to keep your baby's real age. Soft daylight and Bright & airy give the classic studio feel." },
    { t: "Generate and keep the best", d: "Each run arranges the props and pose a little differently. Make three or four and keep your favourite." },
  ],
  exampleCaption: "A happy baby sitting on a bed in a grey elephant-print onesie becomes a studio portrait: knitted bear-ear bonnet, cream knit romper and a teddy, on a fluffy rug with a star-shaped light and pampas grass. The smile is the baby's own.",

  sections: [
    {
      heading: "What does the AI baby photoshoot make?",
      paragraphs: [
        "It turns a normal photo of your baby into the kind of picture a newborn photographer would take: a knitted bear-ear bonnet and a cream romper, a soft teddy to hold, a fluffy rug, and warm, neutral props such as pampas grass and a little star-shaped light. The colours are soft creams and beiges, lit by gentle window light.",
        "Your baby's face, expression and features are kept exactly as they are in your photo. That's the part that matters to parents, and it's what the app is built around: the outfit, props and room change, the baby doesn't.",
        "It's a good fit for parents who missed the newborn shoot, can't fit one into the budget, or just want a lovely picture from a moment they caught on their phone.",
      ],
    },
    {
      heading: "Is an AI photoshoot safer than a newborn shoot?",
      paragraphs: [
        "It avoids the parts of a newborn shoot that worry people most. Studio newborn photography often means a long session, a warm room, and posing a sleeping baby in baskets or on props, which experienced photographers do very carefully and often as a composite of several photos.",
        "With AI, your baby is never posed at all. You take a normal photo however your baby happens to be sitting or lying, and the props are added afterwards. No one has to balance a newborn on anything.",
        "A real photographer still gives you something AI can't: a real record of that day, and prints from an actual camera. Many parents do both, using AI for monthly milestone pictures in between.",
      ],
    },
    {
      heading: "What's the best age for a baby photoshoot?",
      paragraphs: [
        "Photographers usually suggest three windows. Newborn shoots happen in the first two weeks, when babies sleep a lot and curl up. The sitter shoot comes at around six to nine months, when a baby can sit up and smile at the camera. And the first-birthday shoot, often with a cake, marks the end of the first year.",
        "With AI you don't have to hit those windows. You can make a studio portrait from a photo taken on any day, at any age, which is why parents use it for every month of the first year instead of just one or two shoots. The app works best once your baby's face is clear and awake in the photo; for a sleepy newborn with eyes closed, the result is softer and less detailed.",
        "If you're expecting and planning a real newborn shoot, book it before the birth: good newborn photographers fill up early. Use AI for everything in between.",
      ],
    },
    {
      heading: "What do the Stage and Lighting options do?",
      paragraphs: ["Stage changes how old your baby looks in the picture. Leave it on **As in photo** for a portrait of your baby as they are today."],
      items: [
        { t: "Newborn", d: "Shows your baby as a newborn. Parents use it to imagine the newborn photo they never got, but it's the AI's guess, not a real record of how your baby looked." },
        { t: "6 months", d: "Shows your baby at about six months. Fun for a milestone card, but again an imagined version." },
        { t: "Toddler", d: "Shows your child at about two. Expect the face to change more, because toddlers look quite different from babies." },
        { t: "Young child", d: "Shows your child at about five. The biggest jump, so treat it as a playful \"what might they look like\" rather than a prediction." },
      ],
      after: [
        "Lighting sets the mood. **Soft daylight** is natural and gentle. **Bright & airy** is the white, light look many newborn photographers use. **Golden hour** adds warm, low sun. **Studio** is crisp and even. **Moody** is darker and richer, beautiful for a framed print. Auto keeps the warm pastel window light from our example.",
      ],
    },
    {
      heading: "How do you take a photo that works?",
      list: [
        "Make sure the face is sharp. A tiny bit of motion blur on a wriggling baby is the most common reason a result looks off; take a burst and pick the clearest.",
        "Daylight from a window is best. Avoid the flash, which flattens the face and gives red eyes.",
        "A happy or calm expression carries straight through to the portrait, so the smile in your photo is the smile you get.",
        "Keep hands, bottles and dummies away from the face where you can. The app has to guess at anything covered.",
        "One baby per photo. For twins or siblings, try a photo of each child separately.",
        "Any background is fine. A messy bed or a busy living room is replaced completely.",
      ],
    },
    {
      heading: "What are its limits?",
      list: [
        "**Changing ages is a guess.** Newborn, 6 months, Toddler and Young child show an imagined version of your child, not how they did or will look.",
        "**The outfit is set.** You get the bear-ear bonnet and knit romper look. For a different theme, such as a festival outfit or a christmas jumper, try the [christmas photo](/creative/christmas-photo) or describe it in the [AI photo editor](/ai-editor).",
        "**Hands and feet.** Tiny fingers and toes are hard for any AI. If one looks odd, generate again.",
        "**Very small or blurry faces.** If your baby is a small part of a wide photo, crop in closer before uploading.",
      ],
    },
    {
      heading: "Baby photoshoot ideas to try",
      items: [
        { t: "Monthly milestones", d: "Take a photo on the same day each month and run it through with the same lighting. You get a matching set for the first year." },
        { t: "Birth announcement", d: "A soft studio portrait makes a lovely announcement card. Add the name and date afterwards in the [free photo editor](/editor)." },
        { t: "Grandparents' gift", d: "A framed print of the portrait is a simple present. Run it through the [image upscaler](/upscale) first for a sharp print." },
        { t: "First birthday invitations", d: "Use a portrait from the year as the front of the invitation, with the Bright & airy light." },
        { t: "Wondering what your baby will look like?", d: "Expecting? The [AI baby predictor](/creative/ai-baby-predictor) imagines a baby from both parents' photos." },
      ],
    },
    {
      heading: "What happens to photos of your child?",
      paragraphs: [
        "Your photo is sent to our image-model partner, fal.ai, to make the portrait, and to no one else. It isn't used to train AI models and is never sold, and you own both your photo and the portrait.",
        "Your portraits are saved in My Creations, which only you can see when signed in. Delete any of them there at any time, or ask us to delete your account and everything in it. Please only upload photos of your own child, or with the parents' permission.",
      ],
    },
  ],

  faq: [
    { q: "How do I do a baby photoshoot at home?", a: "Take a clear daylight photo of your baby on your phone, upload it here, and press Generate. The app adds the outfit, props and studio light and keeps your baby's face exactly the same." },
    { q: "Is the AI baby photoshoot free?", a: `Your account is free, with no card needed. Each portrait uses ${COST}; one-time credit packs start at ${PACK_FROM} and never expire. Where a free trial is running, the box above the upload says so and your first portrait is free.` },
    { q: "Will it still look like my baby?", a: "Yes, with Stage on As in photo. The app keeps your baby's face and expression and changes only the outfit, props and background. A sharp photo gives the closest result." },
    { q: "Can it show my baby as a newborn?", a: "Yes, choose Newborn under Stage. Remember it's an imagined picture made from a later photo, not a real record of how your baby looked." },
    { q: "Is it safe to upload photos of my baby?", a: "Your photo is only sent to our image partner to make the portrait, is never used to train AI and is never sold. You can delete it from My Creations whenever you like." },
    { q: "Can I change the outfit or theme?", a: "This app always uses the knit bonnet and romper look. For other themes, describe the outfit in the AI photo editor, or try the seasonal apps such as the christmas photo." },
    { q: "Does it work for twins?", a: "It's made for one baby per picture. Upload each twin separately with the same lighting, then put the two side by side." },
    { q: "Can I print it?", a: "Yes. For a frame or a large print, run the portrait through the image upscaler first so it stays sharp." },
    { q: "Do you add a watermark?", a: "No. You download the full-size portrait with no watermark." },
  ],
};

export default page;
