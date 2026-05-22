export interface HeadshotStyle {
  id: number;
  name: string;
  tag: string;
  prompt: string;
}

export const MEN_STYLES: HeadshotStyle[] = [
  {
    id: 1,
    name: "Navy Urban",
    tag: "Executive",
    prompt:
      "Professional outdoor corporate headshot of the person from the reference photo, captured from the waist up, standing confidently with arms crossed in an urban alleyway. Short neatly groomed hair with a calm and confident expression projecting professionalism and composure. Dressed in a well-fitted dark navy blue blazer paired with a crisp white button-up shirt. The blazer features notch lapels and four visible buttons on the sleeves. Posture is relaxed yet confident with arms crossed comfortably across the chest. Background features a softly blurred alleyway with brick and neutral-colored walls, dynamic urban setting. Natural outdoor lighting is soft and balanced, illuminating the face and attire without harsh shadows. Sharp, clear, visually striking, suitable for business profiles, LinkedIn, or corporate websites.",
  },
  {
    id: 2,
    name: "Light Blue Suit",
    tag: "Professional",
    prompt:
      "Professional corporate headshot of the person from the reference photo, captured from the waist up, standing confidently with arms crossed. Neatly groomed hair and a warm smile projecting confidence and approachability. Wearing a light blue well-tailored suit with a crisp white button-up shirt underneath. The suit jacket has notch lapels and four visible buttons on the sleeves. A large elegant wristwatch is visible on the left wrist. Background is a soft neutral light gray ensuring focus remains on the subject. Lighting is natural and balanced, highlighting the face and attire while avoiding harsh shadows. Sharp, clear, and visually appealing, suitable for business profiles, LinkedIn, or corporate websites.",
  },
  {
    id: 3,
    name: "Charcoal Office",
    tag: "Corporate",
    prompt:
      "Professional corporate headshot of the person from the reference photo, captured from the waist up, standing confidently in a modern office hallway. Neatly styled hair with a warm confident smile conveying professionalism. Dressed in a well-tailored dark charcoal blazer paired with a crisp white button-up shirt. Posture is upright and confident with shoulders relaxed projecting a calm self-assured demeanor. Background is blurred with large windows allowing natural light to filter in. The blurred hallway creates depth while keeping focus on the subject. Lighting is natural and balanced, highlighting facial features and attire without harsh shadows. Professional and polished appearance.",
  },
  {
    id: 4,
    name: "Brown City View",
    tag: "Modern",
    prompt:
      "Professional corporate headshot of the person from the reference photo, captured from the waist up, standing confidently in front of a large window overlooking a cityscape. Short neatly groomed hair with a warm smile projecting confidence. Dressed in a dark chocolate brown blazer paired with a beige shirt underneath, giving a modern smart-casual appearance, with matching dark chocolate brown trousers. A large wristwatch on the left wrist adds sophistication. Standing with arms crossed, exuding confidence. Behind, a modern office desk with laptop adds subtle work context. The large window provides bright natural light with the slightly blurred cityscape visible. Lighting is bright and natural ensuring even skin tones. Sharp, suitable for business profiles, LinkedIn, or corporate websites.",
  },
  {
    id: 5,
    name: "Plaid Smart-Casual",
    tag: "Stylish",
    prompt:
      "Professional corporate headshot of the person from the reference photo, captured from the waist up, standing confidently in front of a large window overlooking a cityscape. Neatly groomed hair with a warm smile. Dressed in a dark plaid-patterned blazer paired with a black t-shirt underneath, giving a modern smart-casual appearance, with well-fitted gray trousers. A large wristwatch on the left wrist adds sophistication. Standing with arms crossed exuding confidence. Behind, a modern office desk adds subtle work context. The large window provides bright natural light with a slightly blurred city skyline. Lighting is bright and natural ensuring even skin tones. Sharp, suitable for business profiles, LinkedIn, or corporate websites.",
  },
  {
    id: 6,
    name: "Grey + Sky Blue",
    tag: "Classic",
    prompt:
      "Professional corporate headshot of the person from the reference photo, captured from the waist up, standing confidently against a clean neutral background. Neatly styled hair with a warm confident smile conveying professionalism. Dressed in a well-tailored dark grey blazer paired with a light sky blue button-up shirt, giving a polished modern corporate appearance. Posture is upright with one arm casually crossed over the body while the other rests gently on the blazer, projecting a relaxed yet confident demeanor. Background is clean neutral light ensuring focus remains entirely on the subject. Lighting is soft and even, highlighting facial features and attire without harsh shadows. Sharp, clear, and visually appealing.",
  },
  {
    id: 7,
    name: "Beige Outdoor",
    tag: "Approachable",
    prompt:
      "Professional corporate headshot of the person from the reference photo, captured from the waist up, standing outdoors against a softly blurred modern building with large windows. Neatly groomed hair exuding maturity and professionalism, smiling warmly and projecting confidence and approachability. Dressed in a light beige tailored blazer with clean sharp lines paired with a crisp white button-up shirt. Background features the soft blur of large windows. Lighting is warm and natural with a soft golden-hour glow highlighting facial features and attire without harsh shadows. Subtle warm color filter enhancing the natural lighting and polished finish. Sharp and clear, suitable for business profiles, LinkedIn, or corporate websites.",
  },
  {
    id: 8,
    name: "Light Gray Portrait",
    tag: "Polished",
    prompt:
      "Professional corporate headshot of the person from the reference photo, captured from the shoulders up, set against a clean neutral background. Neatly groomed hair with a warm confident smile conveying approachability and professionalism. Dressed in a light gray tailored blazer presenting a modern polished look, with a light blue dress shirt buttoned up for classic professional appearance. The combination of light gray blazer and blue shirt creates a subtle contrast enhancing the corporate aesthetic. Background is soft light gray keeping focus on the subject. Lighting is bright, natural, and evenly distributed ensuring facial features and attire are well-lit with no harsh shadows. Sharp, clear, and visually appealing.",
  },
  {
    id: 9,
    name: "Dusty Blue Alleyway",
    tag: "Confident",
    prompt:
      "Professional outdoor corporate headshot of the person from the reference photo, captured from the waist up, standing confidently with arms crossed in an urban alleyway. Short neatly groomed hair with a calm and confident expression projecting professionalism and composure. Dressed in a well-fitted dusty blue blazer paired with a crisp white button-up shirt. The blazer features notch lapels and four visible buttons on the sleeves. Posture is relaxed yet confident with arms crossed across the chest. Background features a softly blurred alleyway with brick and neutral-colored walls, providing a dynamic urban setting. Natural outdoor lighting is soft and balanced. Sharp, clear, and visually striking, suitable for business profiles, LinkedIn, or corporate websites.",
  },
  {
    id: 10,
    name: "Charcoal Outdoor",
    tag: "Leadership",
    prompt:
      "Professional corporate headshot of the person from the reference photo, captured from the waist up, standing outdoors against a softly blurred modern building with large windows. Neatly groomed hair exuding maturity and professionalism, smiling warmly and projecting confidence. Dressed in a charcoal grey tailored blazer with clean sharp lines paired with a crisp white button-up shirt. Background features the soft blur of large windows. Lighting is warm and natural with a soft golden-hour glow highlighting facial features and attire without harsh shadows. Subtle warm color filter enhances the natural lighting. Sharp and clear, suitable for business profiles, LinkedIn, or corporate websites.",
  },
  {
    id: 11,
    name: "Brown Office Suite",
    tag: "Formal",
    prompt:
      "Professional corporate headshot of the person from the reference photo, captured from the waist up, standing confidently in a modern office hallway. Neatly styled hair with a warm confident smile conveying professionalism. Dressed in a well-tailored dark brown blazer paired with a crisp white button-up shirt, creating a polished and formal look. Posture is upright and confident with shoulders relaxed projecting a calm self-assured demeanor. Background is blurred with large windows allowing natural light to filter in. The blurred hallway elements create depth while keeping focus on the subject. Lighting is natural and balanced, highlighting facial features and attire without harsh shadows. Suitable for business profiles, LinkedIn, or corporate websites.",
  },
];

export const WOMEN_STYLES: HeadshotStyle[] = [
  {
    id: 1,
    name: "Tan Suit Outdoor",
    tag: "Cityscape",
    prompt:
      "Professional headshot of the person from the reference photo. She is wearing a white button-up shirt, neatly tucked into high-waisted matching tan trousers. The shirt features a classic collar. The subject stands in a relaxed, natural pose with hands gently clasped in front, exuding confidence and ease. The image captures the subject in front of a cityscape backdrop, with notable architectural features blurred softly in the background. The lighting is warm and natural, with the sun creating a soft golden glow, highlighting hair and face while ensuring even skin tones. Warm sunlit filter. Sharp, clear, professional headshot suitable for LinkedIn or corporate websites.",
  },
  {
    id: 2,
    name: "Navy Blazer Office",
    tag: "Corporate",
    prompt:
      "Professional corporate headshot of the person from the reference photo, captured from the waist up, standing confidently in a modern office setting. Hair styled naturally, bright warm smile conveying professionalism and approachability. Dressed in a well-tailored dark navy blazer layered over a crisp white button-up shirt. Posture is upright and confident, hands gently resting by sides. Background is blurred with hints of natural light through a window, neutral tone. Soft and even lighting highlighting facial features, hair, and attire without harsh shadows. Sharp, clear, and visually appealing, suitable for business profiles, LinkedIn, corporate websites.",
  },
  {
    id: 3,
    name: "Red Blouse Elegant",
    tag: "Stylish",
    prompt:
      "Professional corporate headshot of the person from the reference photo, captured from the waist up, standing confidently in a softly lit indoor setting. Hair styled naturally with a warm confident smile. Dressed in a deep red blouse with lapel-like collars and a V-neckline, polished yet stylish. Complemented by a simple elegant necklace and sleek wristwatch. Posture upright and confident with arms crossed comfortably across chest. Background softly blurred with hints of natural light, neutral tones. Soft and even lighting highlighting facial features, hair, and attire without harsh shadows.",
  },
  {
    id: 4,
    name: "Black Blazer Urban",
    tag: "Executive",
    prompt:
      "Professional corporate headshot of the person from the reference photo. She is wearing a tailored black blazer with sharp lapels and a sleek professional cut, layered over a white top. Natural and confident pose, right hand raised to chest level, left arm resting naturally at side. Background features a softly blurred urban cityscape with tall buildings. Lighting is natural and soft, ensuring even skin tones and highlighting outfit details. No harsh shadows. Neutral clean color filter ensuring clarity and sharpness. Visually appealing, sharp, suitable for business profiles, LinkedIn, corporate websites.",
  },
  {
    id: 5,
    name: "White Blazer Arms Crossed",
    tag: "Authority",
    prompt:
      "Professional corporate headshot of the person from the reference photo, captured from the waist up, standing confidently with arms crossed. Posture upright and confident projecting authority and self-assurance. Hair styled naturally with calm composed expression conveying professionalism and poise. Dressed in a white blazer with slightly rolled sleeves layered over a high-neck white blouse, paired with tan wide-leg trousers. A delicate minimal gold necklace. Background is soft neutral gray tone, focus remains entirely on the subject. Lighting natural and evenly distributed, highlighting facial features, hair, and attire without harsh shadows. Sharp, clear, professional.",
  },
  {
    id: 6,
    name: "Green Blazer Classic",
    tag: "Modern",
    prompt:
      "Professional corporate headshot of the person from the reference photo, captured from the waist up, standing confidently with arms crossed. Hair styled naturally with calm and confident expression. Dressed in a well-tailored dark green blazer paired with a simple white blouse underneath. Blazer features notch lapels and two visible buttons on sleeves. Posture upright yet relaxed, arms crossed comfortably across chest projecting authority and confidence. Background softly blurred with neutral tones. Lighting natural and evenly distributed, highlighting facial features and attire without harsh shadows. Sharp, clear, visually appealing, suitable for LinkedIn or corporate websites.",
  },
  {
    id: 7,
    name: "Dark Blue Belt Blazer",
    tag: "Sophisticated",
    prompt:
      "Professional corporate headshot of the person from the reference photo, captured from the waist up, standing confidently with arms crossed. Sleek hair styled straight with composed and confident expression. Dressed in a well-tailored dark blue blazer with structured shoulders layered over a beige ribbed top. The blazer has notch lapels and a belt at the waist creating a sleek modern corporate look. Accessorized with gold jewelry including a delicate necklace, hoop earrings, and minimalist bracelets. Posture upright and confident with arms crossed. Background is soft muted gray tone. Soft and balanced lighting highlighting facial features, hair, and attire without harsh shadows. Sharp, suitable for LinkedIn or corporate websites.",
  },
  {
    id: 8,
    name: "Navy Executive Power",
    tag: "Leadership",
    prompt:
      "Professional corporate headshot of the person from the reference photo with long straight hair parted naturally. Calm yet confident expression projecting professionalism and composure. Dressed in a well-tailored navy blue suit. The blazer features sharp clean lines, notch lapels, and two buttons on the front with one fastened. Sleeves slightly bunched, structured modern executive appearance. Beneath the blazer a simple white scoop-neck blouse. Standing with arms crossed in confident authoritative posture. Background minimalist neutral light gray tones. Lighting soft and balanced highlighting suit structure and face without harsh shadows. Even skin tones and polished finish. Sharp, clear, suitable for business profiles, corporate websites, LinkedIn.",
  },
  {
    id: 9,
    name: "White Blazer Seated",
    tag: "Poised",
    prompt:
      "Professional corporate headshot of the person from the reference photo with shoulder-length loose waves, calm composed expression conveying professionalism and poise. Dressed in a white blazer with slightly rolled sleeves layered over a high-neck white blouse, paired with tan wide-leg trousers. A delicate gold necklace adding elegance. Posture relaxed yet poised, one hand resting gently and the other on edge of stool, projecting confidence and ease. Background is soft neutral gray tone, focus remains on subject. Lighting natural and evenly distributed highlighting facial features, hair, and attire without harsh shadows. Sharp, clear, visually striking, suitable for business profiles, LinkedIn.",
  },
  {
    id: 10,
    name: "Light Blue Power Suit",
    tag: "Bold",
    prompt:
      "Professional corporate headshot of the person from the reference photo with long wavy hair parted slightly to the side. Calm confident expression with soft smile exuding approachability and professionalism. Dressed in a light blue tailored suit consisting of a blazer and matching trousers paired with a white button-up top. Suit fits perfectly presenting modern stylish corporate appearance. Relaxed yet confident pose with one hand placed casually in pocket of trousers. Background is soft solid blue creating a clean modern aesthetic. Lighting soft and balanced focusing on face and attire ensuring even skin tones and polished high-quality finish free from harsh shadows. Sharp, clear, visually appealing.",
  },
];
