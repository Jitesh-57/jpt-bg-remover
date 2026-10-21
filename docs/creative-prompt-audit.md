# Pixel Shine / SJPT AI Prompt Audit — Dev

> Exact app prompts and reusable parameter phrases currently stored in the codebase. The final prompt for each generation combines the app-specific base prompt, selected parameter phrases, preset/tab choices, and shared identity/staging/medium instructions. Static before/after examples are not passed directly to the model as reference inputs.

## Prompt composition

For apps with multiple parameters, each selected parameter appends its own phrase to the same base prompt. For example, attire + background or setting + lighting are both included in a single generation request. Parameters refine their named attribute; the app-specific prompt remains the intended creative target. `Auto` contributes no phrase where its definition is empty.

## Exact base prompt by app

### AI Headshot Generator (`ai-headshot-generator`)

**Base prompt:**

```text

Turn this into a professional studio headshot, framed from the chest up at eye level, with a composed, confident expression and a gentle smile. Keep their own hair and hairstyle, just neatly groomed. Unless attire is given below, dress them in a tailored beige or camel blazer over a plain white top or open-collar shirt. Unless a background is given below, use a plain mid-grey studio backdrop with a soft gradient falloff. Even key light with a soft fill, clean catchlights in the eyes and crisp focus on the face.

```

**Customization controls:** Attire, Background



### LinkedIn Headshot Maker (`linkedin-headshot`)

**Base prompt:**

```text

Produce a LinkedIn-appropriate headshot: smart-casual business dress, a softly blurred office or outdoor background, natural approachable expression, framed head-and-shoulders.

```

**Customization controls:** Attire, Background



### CEO Headshot Generator (`ceo-headshot`)

**Base prompt:**

```text

Produce an executive leadership portrait, framed from the chest up, with an authoritative, settled posture and a calm, assured expression. Keep their own hair and hairstyle, just neatly groomed. Unless attire is given below, dress them in a dark tailored suit over a crisp white open-collar shirt. Unless a background is given below, place them in a dark executive office softly out of focus behind them, with wooden bookshelves and warm lamplight. Sculpted low-key lighting with a gentle rim light separating them from the background.

```

**Customization controls:** Attire, Background



### Actor Headshot Generator (`actor-headshot`)

**Base prompt:**

```text

Produce a theatrical casting headshot, framed from the chest up, square to the camera at eye level, with direct eye contact and a relaxed, natural expression and a slight smile that a casting director can read. Keep their own hair and hairstyle, just neatly groomed, with minimal natural styling. Unless attire is given below, dress them in a plain black crew-neck top with no logo or pattern. Unless a background is given below, use a plain mid-grey studio backdrop. Soft, even, honest light from the front with a gentle fill and no dramatic shadows, and sharp focus on the eyes.

```

**Customization controls:** Attire, Background



### Doctor Headshot Generator (`doctor-headshot`)

**Base prompt:**

```text

Produce a medical professional headshot, framed from the chest up, with a calm, reassuring smile. Keep their own hair and hairstyle, just neatly groomed. Unless attire is given below, dress them in a clean white clinical coat over navy scrubs, with a stethoscope around the neck. Unless a background is given below, use a bright hospital or clinic corridor, softly out of focus behind them. Bright, even, clean lighting.

```

**Customization controls:** Attire, Background



### Lawyer Headshot Generator (`lawyer-headshot`)

**Base prompt:**

```text

Produce a legal professional headshot: dark conservative suit, formal lighting, a law-library or panelled-office background softly out of focus, and a composed, credible expression.

```

**Customization controls:** Attire, Background



### Realtor Headshot Generator (`real-estate-headshot`)

**Base prompt:**

```text

Produce a real-estate agent headshot: smart-casual blazer, warm natural light, a softly blurred residential or streetscape background, and a friendly, open expression.

```

**Customization controls:** Attire, Background



### Business Headshot Generator (`business-headshot`)

**Base prompt:**

```text

Produce a corporate business headshot, framed from the chest up at eye level, with upright professional posture and a warm, confident half-smile. Keep their own hair and hairstyle, just neatly groomed. Unless attire is given below, dress them in a well-fitted navy suit jacket over a light-blue open-collar shirt, with no tie. Unless a background is given below, use a plain neutral grey studio backdrop. Balanced, even three-point lighting and sharp focus on the eyes.

```

**Customization controls:** Attire, Background



### Outdoor Headshot Generator (`outdoor-headshot`)

**Base prompt:**

```text

Produce an outdoor headshot in natural daylight: soft open shade or golden-hour light, greenery or architecture blurred well behind the subject, relaxed and genuine expression.

```

**Customization controls:** Attire, Background



### ERAS Application Headshot (`eras-headshot`)

**Base prompt:**

```text

Produce a conservative medical-residency application portrait: plain dark suit, plain light background, flat even lighting with no shadow on the face, neutral expression, head and shoulders centred.

```

**Customization controls:** Suit, Background



### Add a Suit to Your Photo (`add-suit-to-photo`)

**Base prompt:**

```text

Replace the clothing with a well-fitted formal suit, shirt and tie appropriate to the person, matching the collar and shoulder line naturally to their build and the photo's lighting. Change only the clothing.

```

**Customization controls:** Suit



### Glamour Headshot Generator (`celebrity-headshot`)

**Base prompt:**

```text

Produce a glamour studio portrait in the style of a magazine cover shoot, framed from the chest up, with a poised, confident editorial expression. Keep their own hair colour and length, styled glossy and polished — soft voluminous waves or a sleek groomed cut. Unless attire is given below, dress them in an elegant black satin evening top with small gold earrings, or a black tuxedo jacket over an open-collar shirt. Unless a background is given below, use a deep, dark seamless backdrop. Warm, directional beauty light from one side, a soft glow on the skin and immaculate grooming.

```

**Customization controls:** Attire, Background



### AI Photoshoot Generator (`ai-photoshoot`)

**Base prompt:**

```text

Turn this snapshot into a frame from a professional fashion photoshoot, taken by a photographer standing several metres away — not a selfie: no outstretched arm, no phone, no close wide-angle distortion. Show the person full length, head to toe with their shoes in frame, standing in a confident, relaxed model pose — weight on one leg, hands in pockets or resting naturally, head held upright on a relaxed neck with the chin level, looking toward the camera with a calm, confident expression. Dress them in a polished, perfectly tailored outfit that suits them, such as a dark slim-fit suit with a crisp open-collar shirt and dress shoes, or an equally elegant dress or co-ord. Keep their own hair and hairstyle, just neatly groomed. Unless a setting is given below, place them outdoors in front of clean modern architecture — light stone walls, tall windows, a few potted plants — on a paved plaza. Unless a lighting style is given below, light it with warm late-afternoon sun from the side, soft natural shadows on the ground and a gently blurred background. Eye-level camera, a 50mm lens look, crisp focus on the person and an editorial colour grade.

```

**Customization controls:** Setting, Lighting



### AI Selfie Generator (`ai-selfie-generator`)

**Base prompt:**

```text

Turn this into a candid lifestyle photo, as if a friend took it from across a café table — not an outstretched-arm selfie. Frame it from the chest up: the person seated at a sunny café table with a latte in front of them, resting their chin on one hand, with a relaxed, happy smile. Dress them in a cosy cream knit sweater, with their own hair loosely pinned up or falling naturally. Unless a setting is given below, the café is softly blurred behind them, with plants and warm fairy lights. Unless a lighting style is given below, use warm golden window light on the face. Natural, true-to-life colour and a shallow depth of field.

```

**Customization controls:** Setting, Lighting



### Profile Picture Maker (`profile-picture-maker`)

**Base prompt:**

```text

Turn this into a polished profile picture, framed head and shoulders with the face centred and even margins, and a warm, natural smile. Keep their own hair and hairstyle, neatly groomed, and dress them in a navy blazer over a white open-collar shirt or top. Unless a background is given below, place them in front of a bright modern office, softly out of focus. Flattering, even natural light and sharp focus on the eyes.

```

**Customization controls:** Background, Crop



### AI Outfit Changer (`outfit-generator`)

**Base prompt:**

```text

Give them a completely new, stylish outfit and photograph them in a setting that suits it, framed from the waist up. Unless an outfit is described below, dress them in an emerald-green satin slip dress with a delicate gold pendant and drop earrings — for a man, a dark green velvet blazer over a black shirt. Keep their own hair and hairstyle, neatly styled. Unless a setting is given below, seat them in an upscale evening lounge with a crystal chandelier, velvet seating and warm lamps softly blurred behind, resting their chin on one hand with a soft smile. Warm evening light that flatters the fabric.

```

**Customization controls:** Describe the outfit, Setting



### AI Saree Photo Editor (`saree-photo-editor`)

**Base prompt:**

```text

Dress the person in an elegant silk saree with authentic drape and pleating, full length from head to toe so the whole saree is visible. Unless a colour is given below, make it emerald green with a rich gold zari border, worn with gold jhumka earrings, bangles and a fine necklace. Style their own hair neatly. Unless a setting is given below, place them in the courtyard of a heritage palace with carved sandstone pillars and arches, with flowers nearby. Warm golden light and believable fabric physics.

```

**Customization controls:** Saree colour, Setting



### AI Dress Photo Editor (`dress-photo-editor`)

**Base prompt:**

```text

Restage this as an elegant evening photograph, full length from head to toe so the whole outfit is visible, in a poised, relaxed pose. Unless an outfit is described below, dress them in a wine-red draped satin gown with thin straps and a thigh-high slit, strappy heels and drop earrings — for a man, a dark velvet dinner jacket with black trousers. Style their own hair into a low, elegant updo, or neatly groomed. Unless a setting is given below, place them in a luxury hotel lobby with a marble floor, a gilded mirror, table lamps and fresh flowers. Warm, glowing evening light with soft shadows and a polished editorial finish.

```

**Customization controls:** Describe the outfit, Setting



### Maternity Photoshoot Editor (`maternity-photoshoot`)

**Base prompt:**

```text

Restage this as a gentle maternity portrait: flowing fabric, soft directional window light, a warm neutral setting, and a calm, tender expression with hands placed naturally.

```

**Customization controls:** Setting, Lighting



### Birthday Photo Editor (`birthday-photo-editor`)

**Base prompt:**

```text

Restage this as a styled birthday photo, framed from the chest up: the person seated at a table with a frosted birthday cake and lit candles in the foreground, resting their chin on one hand with a happy, celebratory smile. Dress them in a pink satin top or shirt. Unless a setting is given below, decorate the room behind them with pink and gold balloons, a glowing neon light, wrapped gift boxes and fairy lights, all softly blurred. Unless a lighting style is given below, use warm party light with a candlelit glow on the face.

```

**Customization controls:** Setting, Lighting



### Anniversary Photo Editor (`anniversary-photo-editor`)

**Base prompt:**

```text

Restage this as a romantic anniversary portrait. If there are two people, show them as a couple standing close in an affectionate embrace, framed from the thighs up with both faces clearly visible; if there is one person, show them alone in the same scene. Dress them elegantly — for example a dark suit with a white open-collar shirt, and a red satin slip dress — in whatever suits each of them. Unless a setting is given below, place them in front of an arch of red and blush roses, with candles and glowing lanterns around them. Unless a lighting style is given below, use warm, soft evening light with gentle bokeh.

```

**Customization controls:** Setting, Lighting



### Fashion Photo Editor (`fashion-photo-editor`)

**Base prompt:**

```text

Restage this as a fashion editorial photograph, full length from head to toe, in a confident, relaxed model pose. Dress them in an elegant cream look: a long-sleeve square-neck midi dress with a side slit, strappy heels and a small cream handbag, with their hair in a sleek low bun — for a man, a tailored cream or beige suit over a fine knit, with loafers. Unless a setting is given below, place them in a luxury hotel lobby with a polished marble floor, warm lamps and tall mirrors. Unless a lighting style is given below, use warm, soft, glowing light. Eye-level camera, a 50mm lens look and a crisp commercial finish.

```

**Customization controls:** Setting, Lighting



### Aesthetic Photo Editor (`aesthetic-photo-editor`)

**Base prompt:**

```text

Restage this as an aesthetic lifestyle photo with a warm, film-like look, full length from head to toe, in a relaxed, natural pose. Dress them in a chic neutral outfit: a long camel coat over a cream knit top, wide-leg cream trousers with a brown belt and a small leather shoulder bag, holding a takeaway coffee cup — for a man, a camel overcoat over a cream knit with tailored trousers. Keep their own hair and hairstyle. Unless a setting is given below, place them on a sunny European street outside a café, with bistro chairs, cobblestones and shopfronts softly blurred behind. Unless a lighting style is given below, light it with warm golden late-afternoon sun. A soft cream-and-caramel palette with gentle film-like tones and highlights that roll off smoothly.

```

**Customization controls:** Setting, Lighting



### Travel Photo Editor (`travel-photo-editor`)

**Base prompt:**

```text

Restage this as a dreamy travel photo, framed from the knees up, with a relaxed, happy pose. Dress them in a light terracotta sundress with a straw tote bag and their hair in a loose messy bun — for a man, a white linen shirt with light chinos. Unless a setting is given below, place them on a clifftop terrace in Santorini, with whitewashed houses and blue domes, pink bougainvillea and the deep blue sea behind. Unless a lighting style is given below, use warm golden late-afternoon sun. Vivid but believable colour and crisp detail.

```

**Customization controls:** Setting, Lighting



### Ghibli Style Generator (`ghibli-style-generator`)

**Base prompt:**

```text

Redraw this in the style of hand-painted Japanese animation: soft gouache-like skies with fluffy clouds, a warm naturalistic palette, gentle linework, painterly foliage and a quiet nostalgic atmosphere.

```

**Customization controls:** Framing, Strength



### 3D Animation Filter (`pixar-filter`)

**Base prompt:**

```text

Restyle this as a still from a modern 3D animated feature: large expressive eyes, smooth stylised geometry, soft subsurface skin shading and warm cinematic lighting.

```

**Customization controls:** Framing, Strength



### Photo to Anime Converter (`photo-to-anime`)

**Base prompt:**

```text

Redraw this as an anime illustration: clean confident linework, cel shading with defined highlight and shadow blocks, expressive stylised eyes and vivid, glowing colour.

```

**Customization controls:** Framing, Strength



### Cartoon Generator (`cartoon-generator`)

**Base prompt:**

```text

Redraw this as a friendly cartoon illustration: bold clean outlines, bright flat colour with soft shading, simplified but recognisable features and a big warm smile. Keep their pose, clothes and hairstyle, and set them against a warm, sunny yellow wall with a leafy plant, a framed picture and a coffee cup nearby, with a few hand-drawn doodle hearts and sparkles around them.

```

**Customization controls:** Framing, Strength



### Caricature Maker (`caricature-maker`)

**Base prompt:**

```text

Draw this as a good-natured caricature in a bold, colourful hand-inked style: gently exaggerate the most characteristic features — a bigger smile, a slightly larger head — while keeping the person clearly recognisable, with confident ink outlines and rich colour.

```

**Customization controls:** Framing, Strength



### Photo to Oil Painting (`photo-to-oil-painting`)

**Base prompt:**

```text

Repaint this as an oil painting: visible directional brush strokes, built-up impasto in the highlights, a classical warm palette, and canvas tooth showing through the thinner passages.

```

**Customization controls:** Framing, Strength



### Photo to Illustration (`photo-to-illustration`)

**Base prompt:**

```text

Redraw this as an editorial illustration: confident, sketchy ink contours with loose hatching and soft watercolour washes of colour, a light, airy palette and a printed-page quality.

```

**Customization controls:** Framing, Strength



### Webtoon Style Generator (`ai-webtoon-generator`)

**Base prompt:**

```text

Redraw this person as a webtoon character: clean lineart, soft airbrushed shading, glossy hair highlights, a gentle blush and a warm, sunny palette. Keep their own clothes and hairstyle, and pose them at a cosy café table by a sunny window, with a laptop, an iced coffee and plants, resting their chin on one hand with a soft smile.

```

**Customization controls:** Framing, Strength



### Comic Panel Generator (`comic-generator`)

**Base prompt:**

```text

Redraw this as a comic-book panel: heavy ink outlines, halftone dot shading, saturated colour and hard rim light.

```

**Customization controls:** Framing, Strength



### Pixel Art Generator (`pixel-art-generator`)

**Base prompt:**

```text

Redraw this as pixel art: a limited palette, visible square pixels on a consistent grid, hard-edged dithering for gradients and shapes that read clearly.

```

**Customization controls:** Pixel size



### Cut-Out Cartoon Maker (`south-park-style`)

**Base prompt:**

```text

Redraw this in a flat cut-paper cartoon style: simple geometric shapes, a round head with big oval eyes, thick uniform outlines and completely flat colour with no shading.

```

**Customization controls:** Framing, Strength



### Pixel Farm Avatar Maker (`stardew-profile-maker`)

**Base prompt:**

```text

Redraw this as a cosy 16-bit farming-game portrait in pixel art: chunky pixels, a warm limited palette and simple shading blocks. Keep their clothes and whatever they are holding or doing, and set them on a cosy pixel-art farm with a wooden cottage, a windmill, sunflowers, a fence and a couple of chickens, with green hills and mountains behind under a sunny sky.

```

**Customization controls:** Pixel size



### VTuber Avatar Maker (`ai-vtuber-maker`)

**Base prompt:**

```text

Redraw this as a VTuber avatar in polished anime style: large expressive eyes, glossy hair turned a bright teal-blue with layered highlights, and a glowing cat-ear gaming headset with a microphone. The setting becomes a cosy streaming room glowing with purple and pink neon light, with soft rim light on the character.

```

**Customization controls:** Framing, Strength



### Gothic Portrait Generator (`goth-generator`)

**Base prompt:**

```text

Restyle this in a dark romantic gothic register: deep blacks, lace and velvet textures, pale cool-toned lighting, dramatic shadow and an ornate moody setting.

```

**Customization controls:** Framing, Strength



### Vampire Filter (`ai-vampire`)

**Base prompt:**

```text

Restyle this as a gothic vampire portrait: pale, cool-toned skin, subtle fangs and a faint red tint to the eyes, dressed in Victorian finery — a black velvet frock coat with a deep red lining and a lace jabot fastened with a ruby brooch, or an equally rich dark gown — holding a silver goblet. Seat them on a red velvet throne in a candlelit gothic hall with tall candelabras, in dramatic candlelit chiaroscuro.

```

**Customization controls:** Framing, Strength



### Fairy Filter (`ai-fairy-filter`)

**Base prompt:**

```text

Restyle this as an ethereal fairy portrait, keeping the person's pose and framing: delicate translucent wings, a crown of small wildflowers woven into their own hair, and a sheer pale-green gown embroidered with flowers. Place them in an enchanted forest with an old lantern, wildflowers and floating light motes, with warm golden sunlight streaming through the trees behind and soft dappled bokeh.

```

**Customization controls:** Framing, Strength



### Mermaid Filter (`ai-mermaid-filter`)

**Base prompt:**

```text

Create a fantasy mermaid portrait of this person as a lush, semi-realistic digital painting: an iridescent turquoise scaled tail, a top of pearls and shells, and a shell-and-pearl ornament in their hair, which floats around them in the water. They swim above a colourful coral reef with sunken ruins in the blue depths behind, sun rays streaming down from the surface, bubbles and small fish around them.

```

**Customization controls:** Framing, Strength



### Superhero Generator (`superhero-generator`)

**Base prompt:**

```text

Restyle this as a superhero: a fitted original costume with believable panelling and material, heroic posture, dramatic rim lighting and a city skyline behind.

```

**Customization controls:** Costume colours, Framing



### AI Renaissance Portrait Maker (`renaissance-portrait`)

**Base prompt:**

```text

Transform this photo into a classic Renaissance oil painting portrait: rich dramatic chiaroscuro and ornate period clothing — a deep green velvet gown with gold embroidery, a pearl necklace and pearls in braided hair, or a velvet doublet with a lace collar — seated in a three-quarter pose beside a red drape and a vase of flowers against a dark background, with visible brushwork texture. Keep the person's face recognisable in painted form.

```

**Customization controls:** Framing, Strength



### Glitch Effect Generator (`glitch-effect`)

**Base prompt:**

```text

Apply a digital glitch treatment: horizontal datamosh tearing, RGB channel separation, scanlines and block corruption artefacts, over a high-contrast cyberpunk grade.

```

**Customization controls:** Framing, Strength



### Silhouette Maker (`silhouette-maker`)

**Base prompt:**

```text

Reduce this to a clean silhouette: the subject rendered as a solid single-colour shape with a crisp readable contour, against a plain contrasting background. No interior detail.

```

**Customization controls:** Framing, Strength



### Stencil Maker (`stencil-maker`)

**Base prompt:**

```text

Convert this to a two-tone stencil: pure black and white only, simplified connected shapes with no floating islands, and a contour clean enough to cut.

```

**Customization controls:** Framing, Strength



### Coloring Page Maker (`coloring-page-generator`)

**Base prompt:**

```text

Convert this to a printable colouring page — the person and everything around them: clean uniform black outlines on pure white, no shading, grey or colour fills, simplified detail and closed shapes throughout.

```

**Customization controls:** Framing, Strength



### Tattoo Design Generator (`ai-tattoo-generator`)

**Base prompt:**

```text

Add realistic tattoos of roses, leaves and ornamental shading to this person's skin, in the style and placement given below, as if they already had them when the photo was taken. The ink sits in the skin, following its curves, pores and muscle, slightly softened as healed tattoos are, and lit exactly like the rest of the photo.

```

**Customization controls:** Style, Placement



### Birth Flower Tattoo Designer (`birth-flower-tattoo`)

**Base prompt:**

```text

Add a delicate fine-line tattoo of the birth flower given below to this person's skin, as if they already had it when the photo was taken: thin single-weight black linework, accurate flower structure with a few leaves and buds, in an elegant vertical spray. The ink sits in the skin, following its curves and texture, and is lit exactly like the rest of the photo.

```

**Customization controls:** Placement, Birth month



### AI Art Generator (`ai-art-generator`)

**Base prompt:**

```text

Reinterpret this as a fine-art painting. Unless a subject or style is described below, make it an impressionist oil painting: thick, broken dabs and strokes of colour, visible texture, warm light and a soft, harmonious palette.

```

**Customization controls:** Describe what you want, Strength



### AI Painting Generator (`ai-painter`)

**Base prompt:**

```text

Repaint this as an impressionist oil painting with thick impasto brushwork and visible, broken strokes of colour. Keep the person's pose and clothes, and unless a subject is described below, place them at a sunny seaside café terrace with flowers, a small chalkboard and a Mediterranean town and sea behind, in warm afternoon light.

```

**Customization controls:** Describe what you want, Strength



### Creature Designer (`ai-pokemon-generator`)

**Base prompt:**

```text

Design an original collectible creature inspired by this image, its fur, colours and attitude echoing the person: clean cel-shaded anime rendering, a coherent elemental theme, an expressive face, standing proudly on a rock in a dramatic landscape of mountains and sky with streaks of its element crackling around it. Do not reproduce any existing franchise character.

```

**Customization controls:** Describe what you want



### Image to Emoji Maker (`image-to-emoji`)

**Base prompt:**

```text

Turn this person into an emoji-style cartoon portrait, head and shoulders: bold simplified shapes that read at small sizes, flat saturated colour with simple shading, a thick clean outline and a big, friendly expression. Keep their own hair and clothes, simplified, and place them in front of a warm yellow circle on a lighter yellow background.

```

**Customization controls:** Framing, Strength



### Custom Emoji Maker (`text-to-emoji`)

**Base prompt:**

```text

Create a single emoji-style icon: one clear subject, flat saturated colour, bold outline, centred composition, and instant readability at very small sizes.

```

**Customization controls:** Describe what you want



### AI Photo Retouching (`photo-retouching`)

**Base prompt:**

```text

Retouch this portrait: even out skin tone and remove temporary blemishes while keeping pores and natural texture, balance the exposure, brighten the eyes slightly and tidy stray hair. Do not smooth the skin into plastic.

```

**Customization controls:** Retouch strength



### Blemish Remover (`blemish-remover`)

**Base prompt:**

```text

Remove temporary blemishes, spots and minor marks from the skin, matching surrounding tone and keeping pores, fine lines and natural texture fully intact.

```

**Customization controls:** Retouch strength



### Red Eye Remover (`red-eye-remover`)

**Base prompt:**

```text

Correct red-eye caused by flash: restore natural pupil darkness and iris colour, keep the catchlight, and leave the rest of the face untouched.

```

**Customization controls:** Retouch strength



### Eye Color Changer (`eye-color-changer`)

**Base prompt:**

```text

Change the iris colour as specified, keeping the natural iris texture, limbal ring, pupil and catchlight intact so the eyes still read as real. Change nothing else.

```

**Customization controls:** Eye colour



### Face Expression Changer (`face-expression-changer`)

**Base prompt:**

```text

Adjust the facial expression as specified, moving the mouth, cheeks and eyes together the way real facial muscles do, so the change reads as genuine rather than pasted on.

```

**Customization controls:** Expression



### Smile Filter (`smile-filter`)

**Base prompt:**

```text

Add a natural, genuine smile: raise the mouth corners, engage the cheeks and crease the eyes slightly the way a real smile does. Keep the teeth natural and unwhitened.

```

**Customization controls:** Smile



### Expression Filter — Sad (`sad-face-filter`)

**Base prompt:**

```text

Change the expression to a subdued, downcast one: lower the mouth corners, soften the brow inward and slightly lower the eyelids, moving the whole face together.

```

**Customization controls:** Retouch strength



### AI Hairstyle Changer (`hairstyle-changer`)

**Base prompt:**

```text

Change the hairstyle as specified, matching the hairline to the person's own, keeping the hair's natural texture and thickness plausible, and relighting it to match the photo.

```

**Customization controls:** Hairstyle



### Hair Color Changer (`hair-color-changer`)

**Base prompt:**

```text

Change the hair colour as specified: adjust root-to-tip variation, keep strand detail and specular highlights, and match the colour temperature to the photo's lighting.

```

**Customization controls:** Hair colour



### Blonde Hair Filter (`blonde-hair-filter`)

**Base prompt:**

```text

Change the hair to a natural blonde with believable root shadow, tonal variation between strands and warm specular highlights consistent with the photo's light.

```

**Customization controls:** Shade



### Long Hair Filter (`long-hair-filter`)

**Base prompt:**

```text

Extend the hair to the specified length, keeping its own texture and wave pattern, with natural fall over the shoulders and lighting that matches the photo.

```

**Customization controls:** Length



### Curly Hair Filter (`curly-hair-filter`)

**Base prompt:**

```text

Change the hair to defined natural curls: consistent curl pattern and volume, believable root lift, and highlights that follow the curl spirals.

```

**Customization controls:** Curl type



### Bangs Filter (`bangs-filter`)

**Base prompt:**

```text

Add a fringe in the specified shape, sitting correctly on the forehead with natural density, a believable parting and shadow where it falls.

```

**Customization controls:** Fringe shape



### Buzz Cut Filter (`buzz-cut-filter`)

**Base prompt:**

```text

Change the hair to a short buzz cut at an even length, showing the real hairline and scalp tone through the stubble, with lighting consistent with the photo.

```

**Customization controls:** Retouch strength



### Bald Filter (`bald-filter`)

**Base prompt:**

```text

Remove the hair to show a cleanly shaved head: correct skull shape, natural scalp tone and sheen, a believable residual hairline shadow, and matching light direction.

```

**Customization controls:** Retouch strength



### Beard Filter (`beard-filter`)

**Base prompt:**

```text

Add a beard in the specified style, following the person's real jawline and natural growth pattern, with individual hair detail, believable density and matching lighting.

```

**Customization controls:** Beard



### Beard Remover (`no-beard-filter`)

**Base prompt:**

```text

Remove all facial hair to reveal a clean-shaven face: reconstruct the jaw, chin and upper-lip skin with tone and texture matching the surrounding face.

```

**Customization controls:** Retouch strength



### Eyebrow Shape Filter (`eyebrow-filter`)

**Base prompt:**

```text

Reshape the eyebrows as specified, keeping individual hair detail and natural density, with a shape that suits the person's face and matches the photo's light.

```

**Customization controls:** Brow shape



### Braces Filter (`braces-filter`)

**Base prompt:**

```text

Add realistic orthodontic braces to the visible teeth: correct bracket placement and spacing, a believable archwire, and metal specular highlights matching the lighting.

```

**Customization controls:** Braces



### Add Glasses to Photo (`add-glasses-to-photo`)

**Base prompt:**

```text

Add spectacles in the specified style: correctly positioned on the nose bridge and ears, with believable lens refraction, frame shadow on the face and reflections matching the light.

```

**Customization controls:** Frames



### Piercing Filter (`piercing-filter`)

**Base prompt:**

```text

Add the specified piercing at an anatomically correct placement, with metal specular highlights, a subtle contact shadow and scale appropriate to the face.

```

**Customization controls:** Piercing



### Muscle Generator (`muscle-generator`)

**Base prompt:**

```text

Increase visible muscle definition in the arms, shoulders and chest, keeping proportions anatomically plausible and preserving the existing clothing fit and lighting.

```

**Customization controls:** Build



### Six-Pack Filter (`abs-filter`)

**Base prompt:**

```text

Add defined abdominal muscle definition with anatomically correct shading and highlight placement, consistent with the photo's existing light direction.

```

**Customization controls:** Build



### Photo Color Correction (`photo-color-correction`)

**Base prompt:**

```text

Colour-correct this image: neutralise the white balance, fix the black and white points, recover clipped highlight and shadow detail, and remove any colour cast. Keep the result natural.

```

**Customization controls:** Retouch strength



### Image Brightener (`brighten-image`)

**Base prompt:**

```text

Brighten this underexposed image: lift shadows and midtones while protecting the highlights, control the noise that lifting reveals, and keep colour saturation natural.

```

**Customization controls:** Retouch strength



### Image Darkener (`darken-image`)

**Base prompt:**

```text

Bring this overexposed image back into balance: recover the blown-out highlights and the colour in bright skies and skin, deepen the shadows slightly for richer contrast, and hold detail at both ends of the range, keeping it natural.

```

**Customization controls:** Retouch strength



### Image Recolor Tool (`recolor-image`)

**Base prompt:**

```text

Recolour the specified elements to the requested colours, keeping the original shading, texture and material behaviour so the change looks like it was always that colour.

```

**Customization controls:** Retouch strength



### Color Inverter (`invert-image-color`)

**Base prompt:**

```text

Invert the colours of this image to produce a photographic negative, preserving full tonal range and detail throughout.

```

**Customization controls:** Retouch strength



### Color Splash Effect (`color-splash`)

**Base prompt:**

```text

Desaturate the entire image to neutral monochrome except the specified subject, which keeps its full natural colour with a clean, precise boundary.

```

**Customization controls:** Retouch strength



### Old Photo Restoration (`old-photo-restoration`)

**Base prompt:**

```text

Restore this damaged photograph: repair scratches, tears, creases and spotting, rebuild missing areas consistently with their surroundings, correct the fading and recover contrast and fine detail — without inventing new features that were never in the original. Unless keeping it black and white is asked for below, bring a faded, sepia or black-and-white photo back into natural, believable colour.

```

**Customization controls:** Colour, Strength



### Photo Colorizer (`colorize-photo`)

**Base prompt:**

```text

Colourise this black-and-white photograph with historically plausible, naturally desaturated colour: believable skin tones, period-appropriate clothing and material colours, and consistent light temperature throughout.

```

**Customization controls:** Colour



### B&W to Color Converter (`black-and-white-to-color`)

**Base prompt:**

```text

Add natural colour to this monochrome image, keeping the tonal structure of the original intact and choosing restrained, believable colours rather than saturated guesses.

```

**Customization controls:** Colour



### Image Unblur Tool (`unblur-image`)

**Base prompt:**

```text

Sharpen and deblur this image: recover edge definition and fine detail, counteract motion or focus blur, and avoid halos, ringing or over-sharpened texture.

```

**Customization controls:** Colour, Strength



### Unpixelate Image (`unpixelate-image`)

**Base prompt:**

```text

Reconstruct this pixelated image at higher fidelity: rebuild smooth edges and plausible fine detail from the visible block structure, without inventing features that contradict the original.

```

**Customization controls:** Colour, Strength



### Image Denoiser (`denoise-image`)

**Base prompt:**

```text

Remove digital noise and grain from this image while preserving genuine fine detail, edge sharpness and texture. Do not smear the result flat.

```

**Customization controls:** Colour, Strength



### Image Sharpener (`image-sharpener`)

**Base prompt:**

```text

Sharpen this image: increase acuity on genuine edges and detail, leave flat areas free of amplified noise, and avoid visible halos around high-contrast boundaries.

```

**Customization controls:** Colour, Strength



### AI Image Upscaler (`image-upscaler`)

**Base prompt:**

```text

Upscale this image substantially: reconstruct genuine fine detail in hair, fabric weave, skin texture and edges, suppress artefacts from the source compression, and keep the subject identical.

```

**Customization controls:** Enlarge by, Finish



### 4K Image Upscaler (`4k-image-upscaler`)

**Base prompt:**

```text

Upscale this image to a high pixel count suitable for print: rebuild edge and texture detail cleanly, remove compression artefacts, and keep noise controlled across flat areas.

```

**Customization controls:** Enlarge by, Finish



### Image Enlarger (`image-enlarger`)

**Base prompt:**

```text

Enlarge this small image with reconstructed detail rather than interpolation blur: sharp edges, plausible texture, and no visible upscaling artefacts.

```

**Customization controls:** Enlarge by, Finish



### HD Photo Converter (`hd-photo-converter`)

**Base prompt:**

```text

Convert this low-quality image to HD: increase resolution, recover detail and contrast, remove compression blocking and banding, and produce a clean modern-looking file.

```

**Customization controls:** Enlarge by, Finish



### Transparent PNG Maker (`png-maker`)

**Base prompt:**

```text

Isolate the main subject and place it on a fully transparent background: a precise edge including hair and fine detail, no residual fringing or halo from the old background.

```

**Customization controls:** Enlarge by, Finish



### AI Background Remover (`background-remover`)

**Base prompt:**

```text

Remove the background completely and make it transparent, keeping a precise subject edge through hair, fur and thin detail, with no colour fringing left behind.

```

**Customization controls:** Background



### White Background Remover (`white-background-remover`)

**Base prompt:**

```text

Remove the white or near-white background and make it fully transparent, keeping soft shadow edges and thin detail intact without eating into the subject.

```

**Customization controls:** Background



### AI Background Generator (`background-generator`)

**Base prompt:**

```text

Replace the background with the described scene — unless a background is given below, a sunny Mediterranean coastal path with flowers, old stone walls, a hillside village and the blue sea below — matching its perspective, light direction, colour temperature and depth of field to the subject so the composite reads as one photograph.

```

**Customization controls:** Background



### Background Blur Tool (`blur-background`)

**Base prompt:**

```text

Apply a believable shallow depth of field: keep the subject sharp, blur the background progressively with distance, and render the out-of-focus highlights as natural bokeh rather than a flat gaussian wash.

```

**Customization controls:** Background



### AI Room Redesign (`room-design`)

**Base prompt:**

```text

Redesign this room: change the furniture, finishes, lighting and decor while keeping the architecture, window positions and camera perspective exactly as they are. Unless a style is given below, make it warm modern: a beige sofa with soft cushions, a round wooden coffee table, a large textured rug, sheer curtains, abstract art, and warm hidden cove lighting in the ceiling and around the media wall.

```

**Customization controls:** Interior style, Time of day



### AI Interior Design (`ai-interior-design`)

**Base prompt:**

```text

Produce an interior design visualisation of this space. Unless a style is given below, redesign it in a warm modern style: an upholstered bed or sofa in beige, an olive-green throw, a sage-green accent wall with botanical prints, warm hidden cove lighting, light wood furniture, a textured rug and a few plants. Cohesive materials and palette, realistic lighting with believable shadows, and the room's true geometry preserved.

```

**Customization controls:** Interior style, Time of day



### Interior Photo Editor (`interior-photo-editor`)

**Base prompt:**

```text

Enhance this interior photograph: correct vertical lines and lens distortion, balance the mixed window and lamp lighting, recover window highlights and shadow detail, and render wall colours accurately.

```

**Customization controls:** Interior style, Time of day



### House Photo Editor (`house-photo-editor`)

**Base prompt:**

```text

Enhance this property exterior: balance the sky and building exposure, deepen lawn and foliage colour naturally, correct converging verticals, and clean up distracting clutter.

```

**Customization controls:** Time of day



### Architecture Photo Editor (`architecture-photo-editor`)

**Base prompt:**

```text

Enhance this architectural photograph: correct the perspective so verticals are true and, unless a time of day is given below, make it a bright clear day — a vivid blue sky with a few soft white clouds and warm sunlight on the facade. Balance the exposure between sky and structure, and render materials crisply without over-sharpening.

```

**Customization controls:** Time of day



### AI Object Remover (`object-remover`)

**Base prompt:**

```text

Remove the unwanted object — the one named below, or whatever is most obviously out of place if none is — and reconstruct what was behind it consistently with the surrounding texture, perspective and lighting, leaving no smear, ghost or repeated pattern.

```

**Customization controls:** Fill the gap with



### Remove People from Photos (`remove-people-from-photo`)

**Base prompt:**

```text

Remove the unwanted people and rebuild the scene behind them: continue the architecture, ground and background texture correctly through the gap, matching perspective and light.

```

**Customization controls:** Fill the gap with



### AI Watermark Remover (`watermark-remover-ai`)

**Base prompt:**

```text

Remove the watermark, logo or stamp and reconstruct the image underneath it at the pixel level, matching texture, colour and light so no blur, smear or outline remains. For images you own or are licensed to edit.

```

**Customization controls:** Fill the gap with



### Text Remover (`remove-text-from-image`)

**Base prompt:**

```text

Remove the text from this image and rebuild the surface beneath it, continuing the underlying pattern, texture and gradient so there is no trace of where it was.

```

**Customization controls:** Fill the gap with



### Emoji & Sticker Remover (`emoji-remover`)

**Base prompt:**

```text

Remove the emoji, sticker or overlay and reconstruct the covered area plausibly from the surrounding image, matching texture, tone and lighting.

```

**Customization controls:** Fill the gap with



### Shadow Remover (`remove-shadow-from-photo`)

**Base prompt:**

```text

Remove the unwanted shadow and even out the lighting across the surface, recovering the true colour and detail in the shadowed area without flattening the image's natural depth.

```

**Customization controls:** Fill the gap with



### Face Blur Tool (`blur-face`)

**Base prompt:**

```text

Blur the faces in this image sufficiently to prevent identification, with a clean boundary that follows the head shape, leaving the rest of the photograph sharp and unaltered.

```

**Customization controls:** Fill the gap with



### License Plate Blur (`license-plate-blur`)

**Base prompt:**

```text

Obscure the vehicle registration plates so the characters are unreadable, keeping the plate's shape and the rest of the vehicle sharp and unaltered.

```

**Customization controls:** Fill the gap with



### Mirror & Flip Image (`mirror-image`)

**Base prompt:**

```text

Mirror this image horizontally, keeping all detail, sharpness and colour identical to the original.

```

**Customization controls:** Fill the gap with



### AI Product Photoshoot (`product-photoshoot`)

**Base prompt:**

```text

Restage this product as a professional lifestyle studio photograph. Unless a background is given below, stand it on a travertine stone plinth with warm natural sunlight falling across it, soft leaf shadows on a cream wall and a green plant at the edge of the frame. A believable contact shadow and reflection.

```

**Customization controls:** Product background, Lighting



### AI Product Photography (`ai-product-photography`)

**Base prompt:**

```text

Turn this into a professional commercial product photograph. Unless a background is given below, place it on a pure white seamless background with a soft natural contact shadow, centred with even margins. Even, diffuse key light and a subtle specular highlight that describes the material.

```

**Customization controls:** Product background, Lighting



### Ecommerce Photo Editor (`ecommerce-product-editor`)

**Base prompt:**

```text

Prepare this product image for an online store: pure white seamless background, the product centred with even margins, colour-accurate and sharp throughout, with a soft natural contact shadow.

```

**Customization controls:** Product background, Lighting



### Marketplace Photo Editor (`amazon-product-editor`)

**Base prompt:**

```text

Prepare this to marketplace listing standards: pure white background, the product filling most of the frame, no props or added text, accurate colour, and crisp edge detail.

```

**Customization controls:** Product background, Lighting



### Jewelry Photo Editor (`image-editor-for-jewelry`)

**Base prompt:**

```text

Enhance this jewellery photograph: clean dust and fingerprints, render metal with an accurate warm or cool tone and crisp specular highlights, and bring out gemstone brilliance and facet definition. Unless a background is given below, place it on a pure white seamless background with a faint soft shadow, as a clean catalogue shot.

```

**Customization controls:** Product background, Lighting



### Beauty Product Editor (`image-editor-for-beauty`)

**Base prompt:**

```text

Enhance this cosmetics product shot: remove glare and dust, render the packaging finish accurately whether matte or glossy, and keep the label text perfectly legible. Unless a background is given below, place it on a pure white seamless background with a soft shadow and clean, bright studio light.

```

**Customization controls:** Product background, Lighting



### Food Photo Editor (`food-photo-editor`)

**Base prompt:**

```text

Turn this into an appetising, professional photograph of the same dish, keeping the food and the plate as served. Unless a setting is given below, place it on a rustic dark wooden table with a linen napkin, scattered fresh herbs and a small bowl of a fitting side or garnish, lit by warm directional window light with a shallow depth of field. Deepen the natural colour of the food and bring out its texture and moisture without making it look artificial.

```

**Customization controls:** Setting



### Car Photo Editor (`car-photo-editor`)

**Base prompt:**

```text

Turn this into a professional car photograph. Unless a setting is given below, place the car in front of a modern glass-fronted showroom at golden hour, on clean dark asphalt under a warm sunset sky. A deep, even paint finish with clean reflections, sharp trim and wheels, a three-quarter front view and balanced exposure.

```

**Customization controls:** Setting



### Bike Photo Editor (`bike-photo-editor`)

**Base prompt:**

```text

Turn this into a professional motorcycle photograph. Unless a setting is given below, place the bike in a dark studio with tall vertical strips of warm light behind it and a polished concrete floor that reflects it. Crisp metal and paint detail with accurate reflections, well-defined tyres and spokes, a three-quarter front view and balanced exposure.

```

**Customization controls:** Setting



### Truck Photo Editor (`truck-photo-editor`)

**Base prompt:**

```text

Turn this into a professional commercial vehicle photograph. Unless a setting is given below, place the truck on an open highway with motion blur on the road surface, snow-capped mountains and pine forest behind, under a golden sunset sky. Even paint and panel rendering, legible livery and signage, and balanced exposure between the sky and the vehicle.

```

**Customization controls:** Setting



### Real Estate Photo Editor (`image-editor-for-real-estate`)

**Base prompt:**

```text

Enhance this property photograph to listing standard: correct verticals, balance window and interior exposure, render wall and floor colour accurately and remove clutter. Unless a time of day is given below, fill the room with warm golden late-afternoon sun streaming through the windows, with a clear sunset sky in the view.

```

**Customization controls:** Interior style, Time of day



### Hotel Photo Editor (`image-editor-for-hotels`)

**Base prompt:**

```text

Enhance this hospitality photograph so the room looks its most inviting. Unless a time of day is given below, make it golden hour: warm sunset light through the windows, a glowing sunset sky in the view and the room's lamps softly lit. Accurate textile and finish colour, corrected verticals and a tidy, well-composed frame.

```

**Customization controls:** Interior style, Time of day



### Restaurant Photo Editor (`image-editor-for-restaurants`)

**Base prompt:**

```text

Make this restaurant photo menu-ready. If it shows a dish, keep the food as served and style it as an appetising close-up on a warm wooden table with fitting side dishes, garnish and a textile napkin, under warm, inviting light with a shallow depth of field. If it shows the dining room, keep the room as built and give it warm ambient light, recovered shadow detail and a clean composition free of service clutter.

```

**Customization controls:** Interior style, Time of day



### Electronics Photo Editor (`image-editor-for-electronics`)

**Base prompt:**

```text

Enhance this electronics product shot: clean the surfaces of dust and fingerprints, render screens without moiré or glare, and describe metal and matte plastic finishes accurately. Unless a background is given below, place it on a pure white seamless background with a soft contact shadow and clean, even studio light.

```

**Customization controls:** Product background, Lighting



### Home Decor Photo Editor (`image-editor-for-home-decor`)

**Base prompt:**

```text

Turn this into a styled home-decor photograph. Unless a background is given below, place the piece on a warm wooden side table in a cosy living room — a soft sofa with cushions, a couple of books and a green plant softly blurred behind — lit by warm natural window light. Accurate material and colour rendering and an inviting, uncluttered composition.

```

**Customization controls:** Product background, Lighting



### Ad Creative Generator (`ai-ads-generator`)

**Base prompt:**

```text

Turn this product photo into a polished advertising image. Unless a background is given below, stage the product on a glossy reflective surface surrounded by props that echo what it is — fresh flowers and scattered petals for a fragrance, for example — with a softly blurred background in a colour that complements the product and a warm, glowing light. A striking composition with the product as the clear focal point.

```

**Customization controls:** Product background, Lighting



### Marketing Creative Editor (`marketing-creative-editor`)

**Base prompt:**

```text

Turn this product photo into a clean, premium marketing image. Unless a background is given below, place the product on a pure white seamless background with a soft natural shadow, evenly lit with clean studio light and its label crisp and fully legible. One strong focal point and a polished finish suitable for ads and listings.

```

**Customization controls:** Product background, Lighting



### Thumbnail Maker (`thumbnail-maker`)

**Base prompt:**

```text

Turn this into a high-impact video thumbnail: the person framed from the chest up with an excited, open-mouthed expression, pointing toward the empty side of the frame. Dress them in something bold and bright, like a red knit sweater, with their own hair. Seat them at a desk with a laptop and a small plant, against a saturated background of deep blue and red light, with a strong glow separating them from it. Punchy contrast and colour, and a clear area beside them for a big headline. If text is given below, set it there in bold white, yellow and red lettering with a red arrow pointing at it; otherwise add no text.

```

**Customization controls:** Text on the image, Reaction



### YouTube Thumbnail Maker (`youtube-thumbnail-generator`)

**Base prompt:**

```text

Create a YouTube thumbnail: the person framed from the chest up with a shocked, excited expression, one hand pointing to the side, dressed in a bold yellow hoodie or another bright colour and sitting at a desk with a laptop and a stack of books. Behind them, a saturated blue background with a warm orange lamp glow rimming them, and a few bold yellow burst lines beside the face for energy. Strong subject separation and punchy contrast, readable at thumbnail size. If text is given below, set it big and bold in the clear side of the frame; otherwise add no text.

```

**Customization controls:** Text on the image, Reaction



### Instagram Photo Editor (`instagram-photo-editor`)

**Base prompt:**

```text

Edit this for an Instagram feed, keeping the scene, the person, their pose and their outfit: make the photo look its best, with bright sunny light, a clear blue sky wherever there is sky, warm glowing skin, vivid but believable colour, lifted shadows with controlled highlights and crisp detail.

```

**Customization controls:** Look, Text space



### Instagram Profile Picture Maker (`instagram-pfp-maker`)

**Base prompt:**

```text

Create an eye-catching profile picture: the person framed head and shoulders and centred, with a warm, natural smile and flattering soft light, keeping their own outfit and hair. Unless a background is given below, place them inside a thin white circular ring on a vivid sunset gradient that flows from orange through pink to purple. Clean, bright and readable at very small sizes. Add no logos, icons or text.

```

**Customization controls:** Background, Crop



### LinkedIn Profile Picture Maker (`linkedin-pfp-maker`)

**Base prompt:**

```text

Create a LinkedIn profile picture: business-appropriate dress, clean even lighting, a simple neutral or softly blurred background, an approachable expression, framed head-and-shoulders.

```

**Customization controls:** Background, Crop



### Discord Avatar Maker (`discord-pfp-maker`)

**Base prompt:**

```text

Create a Discord avatar of this person as a polished digital-art illustration in a modern anime-inspired style: clean linework, smooth cel shading and vivid colour, framed head and shoulders, keeping their own outfit and accessories such as headphones. Unless a background is given below, place them inside a glowing neon ring of purple and electric blue on a dark purple patterned background, with a soft glow around the edges. A strong silhouette that stays readable when small and circular. Add no text or logos.

```

**Customization controls:** Background, Crop



### YouTube Profile Picture Maker (`youtube-pfp-maker`)

**Base prompt:**

```text

Create a YouTube channel profile picture: the person framed head and shoulders and centred, keeping their own outfit and hair, with a confident, friendly expression. Unless a background is given below, place them inside a glowing red neon ring on a deep red background with soft glowing shapes behind. High contrast and instantly legible at small size. Add no logos, icons or text.

```

**Customization controls:** Background, Crop



### Facebook Profile Picture Maker (`facebook-pfp-maker`)

**Base prompt:**

```text

Create a Facebook profile picture: natural flattering light, a friendly genuine expression, a simple uncluttered background, framed safely for a circular crop.

```

**Customization controls:** Background, Crop



### Game Avatar Maker (`roblox-pfp-maker`)

**Base prompt:**

```text

Create a blocky voxel-style game avatar of this person: built from simple cubes and blocks, with bright saturated colour and a clean, readable silhouette, their hair colour, skin tone, outfit and accessories — headphones, a hoodie — translated into blocks. Unless a background is given below, set them in a sunny blocky voxel landscape of green hills, trees and blue sky.

```

**Customization controls:** Background, Crop



### Fisheye PFP Maker (`fish-eye-pfp`)

**Base prompt:**

```text

Recreate this as a playful fisheye-lens photo shot from very close with an ultra-wide fisheye lens: strong barrel distortion, the person leaning in toward the camera so their face and an outstretched hand making a peace sign look big, with the rest of their body curving away below. Keep their own outfit and hair. Unless a background is given below, set it in an urban skate park with graffiti walls and tall buildings bending around the edges under a bright blue daytime sky. The round fisheye image sits inside a black circular vignette that darkens the corners.

```

**Customization controls:** Background, Crop



### LinkedIn Banner Maker (`linkedin-banner-maker`)

**Base prompt:**

```text

Create a wide professional LinkedIn banner photograph: the person on the left side, framed from the waist up, standing confidently on a rooftop terrace beside a modern glass building, dressed in a navy blazer over a white open-collar shirt. A city skyline stretches behind them at golden hour, and the right side of the frame is left as open sky for text. Warm, natural sunset light and a crisp, premium finish. Unless text is given below, add no text.

```

**Customization controls:** Text on the image, Look



### Album Cover Generator (`album-cover-generator`)

**Base prompt:**

```text

Create square album cover artwork as a photograph of this person performing: singing into a vintage microphone with an acoustic guitar, caught mid-song with real emotion. Unless a genre is given below, light it with dramatic red and orange stage light cutting through smoke, with deep shadows and a warm glow. Give the whole image the look of a well-loved vinyl sleeve — film grain, slightly faded blacks and softly worn edges. Unless a name is given below, add no text at all.

```

**Customization controls:** Name to use, Genre



### Movie Poster Generator (`movie-poster-generator`)

**Base prompt:**

```text

Create a cinematic film poster starring this person, in a vertical one-sheet composition. Unless a genre is given below, make it an adventure epic: the person as a rugged hero in a worn leather jacket with a satchel strap across the chest, standing among ancient jungle temple ruins with misty mountains behind, under a dramatic golden sunset with haze and drifting dust. Strong atmospheric lighting and a polished blockbuster grade. Unless a title is given below, add no text at all.

```

**Customization controls:** Name to use, Genre



### Book Cover Generator (`book-cover-generator`)

**Base prompt:**

```text

Create a book cover starring this person, shown as a finished hardback book standing upright on a wooden table and photographed as a product shot. Unless a genre is given below, make it an epic fantasy cover: the person as its hero in a flowing red cloak, looking out toward a castle on a sea cliff at sunset, with petals drifting on the warm wind, in rich cinematic light. Set a title and an author line in elegant gold serif lettering at the top and bottom of the cover — the name given below if there is one, otherwise a short invented title that fits.

```

**Customization controls:** Name to use, Genre



### AI Logo Maker (`logo-maker`)

**Base prompt:**

```text

Create a clean logo mark: simple geometry that stays legible at small size, a restrained two or three colour palette, balanced negative space, on a plain background.

```

**Customization controls:** Name to use, Logo style



### Gaming Logo Maker (`gaming-logo-maker`)

**Base prompt:**

```text

Create an esports-style logo: a bold aggressive mascot or emblem, heavy outlines, a strong two-tone accent palette, and a silhouette that reads on a stream overlay.

```

**Customization controls:** Name to use, Logo style



### Icon Generator (`icon-generator`)

**Base prompt:**

```text

Create an app icon: one clear central metaphor, a simple rounded-square composition, flat or subtly gradient colour, and full legibility at 48 pixels.

```

**Customization controls:** Name to use, Logo style



### AI Age Progression (`age-progression-tool`)

**Base prompt:**

```text

Age this person to the specified age: add age-appropriate skin texture, fine lines, hair greying and thinning, and subtle changes to facial volume — while keeping them unmistakably the same person.

```

**Customization controls:** Age target



### Old Age Filter (`old-filter`)

**Base prompt:**

```text

Age this person to the age given: deeper lines, a softened jawline, thinner greyed hair, age spots and reduced skin elasticity in the measure that age calls for, keeping their identity and bone structure clearly recognisable.

```

**Customization controls:** Strength



### Baby Face Filter (`baby-face-filter`)

**Base prompt:**

```text

De-age this person to the age given, as a real child: rounder cheeks, larger eyes relative to the face, smoother skin and softer features, keeping the characteristic traits that make them recognisable. Keep the same setting, camera angle and lighting as the photo, and dress the child in a child-sized version of the same outfit — if their clothes show a job or hobby, make it a little version of that, like a tiny hard hat and safety vest. A similar pose, with a happy, playful expression.

```

**Customization controls:** Make them look



### AI Time Machine (`ai-time-machine`)

**Base prompt:**

```text

Restage this person in the specified historical period: period-accurate clothing, hair, grooming and accessories, an era-appropriate setting, and the photographic look of that decade's film and lenses.

```

**Customization controls:** Decade



### AI Yearbook Generator (`ai-yearbook-generator`)

**Base prompt:**

```text

Restage this as a 1990s school yearbook portrait: feathered period hair, a patterned knit or collared top, a mottled blue-grey studio backdrop, direct flash and the soft grain of 90s portrait film.

```

**Customization controls:** Backdrop



### 1980s Photo Trend Maker (`1980s-photo-trend`)

**Base prompt:**

```text

Restage this as an authentic 1980s photograph: voluminous period hair, era-accurate wardrobe, warm tungsten studio lighting with a soft-focus glow, and genuine 35mm film grain with slightly faded colour.

```

**Customization controls:** Look



### Action Figure Generator (`action-figure-generator`)

**Base prompt:**

```text

Render this person as a collectible action figure in retail blister packaging, themed on what the photo suggests they do or love — their job, sport or hobby. The figure wears a version of their outfit for that role, with matching accessories in their own moulded compartments beside it, and the printed cardboard backing card carries an illustrated themed background and a bold title naming the role. Visible moulded plastic with seam lines and joint articulation, and clean product-shot lighting.

```

**Customization controls:** Presentation



### Vinyl Figure Maker (`funko-figure-maker`)

**Base prompt:**

```text

Render this person as a stylised vinyl collectible figure: oversized head with simplified features and black dot eyes, a small simplified body, matte moulded plastic finish, and clean product lighting.

```

**Customization controls:** Presentation



### Aura Photo Generator (`aura-farm-horse`)

**Base prompt:**

```text

Keep the person — and any animal with them — exactly as photographed, and give the photo a dramatic cinematic aura: replace the background with a sweeping epic landscape of mountain peaks at golden sunset above a sea of clouds, with heavy atmospheric haze, a strong warm backlight rimming the subject, and a high-contrast filmic grade.

```

**Customization controls:** Strength



### Character Generator (`ai-character-generator`)

**Base prompt:**

```text

Reimagine this person as a character from a cinematic world, built on who they already are: take their role, outfit or hobby from the photo and turn it into a richly themed version of it — a chef, for example, becomes a steampunk chef with brass goggles on the toque and a leather apron hung with gears and tools, in a steampunk kitchen lit by Edison bulbs. Unless a subject is described below, choose a theme in that spirit. A detailed costume and props, a fully realised setting behind them and cinematic lighting.

```

**Customization controls:** Describe what you want, Framing



### AI Avatar Generator (`ai-avatar-generator`)

**Base prompt:**

```text

Create a polished, colourful avatar of this person in a semi-3D cartoon style, like a still from a modern animated film: smooth shading, slightly larger expressive eyes, clean outlines and simplified but recognisable features. Keep their own outfit and accessories, framed from the chest up with a friendly smile. Unless a background is given below, set them in front of a detailed, sunny painted scene — a pretty old-town street with colourful buildings and flowers.

```

**Customization controls:** Background, Crop



### Glow-Up Editor (`glow-up-editor`)

**Base prompt:**

```text

Give this photo a polished glow-up: relight it with warm, flattering golden-hour sun, even out the skin naturally, make the hair look freshly styled and glossy, smooth out creases in the clothes, and make the colour richer but believable, so the location looks its best — cleaner and brighter. Do not change the face.

```

**Customization controls:** Strength



### AI Saree Photoshoot Maker (`saree-photoshoot`)

**Base prompt:**

```text

Transform this person into an elegant 90s vintage Bollywood saree portrait: a deep red silk saree with a gold border, gold jhumka earrings, bangles, a small bindi and jasmine in their hair, resting their chin on one hand with a soft smile, inside a heritage palace interior lit by glowing brass diyas. Warm cinematic light and a gentle vintage warmth. Keep the face and identity exactly the same.

```

**Customization controls:** Saree colour, Setting



### 3D Figurine Maker (`3d-figurine`)

**Base prompt:**

```text

Turn this person into a highly detailed 1/7 scale collectible figurine displayed on a round base, with a printed product packaging box behind it. Glossy PVC material, studio product photography, soft lighting. Keep the face and likeness accurate. This must look like a real photograph of a physical toy figure — sharp studio product-photography detail and realistic plastic material — not a flat illustration or cartoon drawing.

```

**Customization controls:** Presentation



### Retro 90s Bollywood Photo Editor (`retro-bollywood`)

**Base prompt:**

```text

Restyle this photo as a 90s Bollywood film still: dress them in a red silk saree with a gold border, gold jhumka earrings, glass bangles and a small bindi — or a 90s film hero's outfit — resting their chin on one hand with a soft smile in front of a heritage palace with carved arches and blooming roses. Warm golden haze, soft film grain and a nostalgic cinematic colour grade. Keep the person's face and identity the same.

```

**Customization controls:** No additional app options detected.



### AI Polaroid Photo Maker (`polaroid-photo`)

**Base prompt:**

```text

Turn this photo into a real vintage instant-film print of the same moment: a slight flash-photography look, warm indoor tones, soft focus and gentle film grain, inside a classic white instant-film border with the wider margin at the bottom. Show the print lying on a wooden table, photographed from above. Keep the person's face and identity the same.

```

**Customization controls:** Frame



### AI Old Photo Restoration (`restore-old-photos`)

**Base prompt:**

```text

Restore this old photograph: repair scratches, tears and damage, sharpen and recover facial detail, reduce noise and fading, and gently enhance clarity while keeping it natural and true to the original people. Unless keeping it black and white is asked for below, bring a faded, sepia or black-and-white photo into natural, believable colour. Keep every face exactly as it is.

```

**Customization controls:** No additional app options detected.



### AI Couple Photoshoot Maker (`couple-photoshoot`)

**Base prompt:**

```text

Transform this couple photo into a cinematic Indian pre-wedding portrait: one in an ivory embroidered sherwani and the other in a dark-green embroidered lehenga with gold jhumkas — or coordinated outfits that suit them — standing close and affectionate in the arched courtyard of a sandstone heritage palace, in warm golden-hour light with soft bokeh. Keep both faces and identities exactly the same.

```

**Customization controls:** No additional app options detected.



### AI Professional Headshot Maker (`professional-headshot`)

**Base prompt:**

```text

Turn this selfie into a polished professional corporate headshot: formal business attire, neutral grey studio background, soft flattering lighting and a confident, natural expression. Keep the face and identity exactly the same. This must look like a real photograph — natural skin texture, realistic lighting and shadows, sharp photographic detail — not a painting, illustration, or cartoon.

```

**Customization controls:** No additional app options detected.



### AI Festival Photoshoot Maker (`festival-photoshoot`)

**Base prompt:**

```text

Transform this person into a festive Diwali portrait: elegant traditional Indian attire, warm glow of diyas and fairy lights, rich festive backdrop and a celebratory mood. Keep the face and identity exactly the same. This must look like a real photograph — natural skin texture, realistic lighting and shadows, sharp photographic detail — not a painting, illustration, or cartoon.

```

**Customization controls:** Festival, Lighting



### AI Pet Portrait Maker (`pet-portrait`)

**Base prompt:**

```text

Transform this pet into a regal renaissance royal portrait: dressed in a crown and ornate royal robe, oil-painting style, dramatic classical lighting and a palace backdrop. Keep the pet's face and features accurate.

```

**Customization controls:** Style, Framing



### AI Anime Style Photo Converter (`anime-style`)

**Base prompt:**

```text

Convert this photo into a beautiful hand-drawn anime illustration: soft colours, expressive features, gentle cinematic lighting and painterly detail. Keep the person's likeness recognisable.

```

**Customization controls:** No additional app options detected.



### AI Passport Photo Maker (`passport-photo`)

**Base prompt:**

```text

Convert this selfie into a regulation passport / ID photo: plain pure-white background, even neutral lighting, front-facing with a neutral expression and shoulders visible. Keep the face and identity exactly the same. This must look like a real photograph — natural skin texture, realistic lighting and shadows, sharp photographic detail — not a painting, illustration, or cartoon.

```

**Customization controls:** Format, Background



### AI Background Changer (`background-changer`)

**Base prompt:**

```text

Replace the background of this image. Unless a background is given below, use a modern office interior softly out of focus — warm lighting under the shelves, a few plants and clean wooden surfaces — lit to match the person. Keep the person or subject exactly as they are — same pose, appearance and clothing — and change only the background behind them.

```

**Customization controls:** No additional app options detected.



### AI LinkedIn Banner Maker (`linkedin-banner`)

**Base prompt:**

```text

Turn this photo into a professional LinkedIn banner: a wide composition with the person on the left third, framed from the chest up, smiling with confidence and dressed in a navy blazer over a white T-shirt or shirt. The right side opens out into a deep blue gradient with soft diagonal light streaks and subtle geometric shapes, blending into a softly blurred city skyline seen through office glass, leaving clear space for a headline. Unless text is given below, add no text. Keep the person's face and identity exactly the same.

```

**Customization controls:** Text on the image, Look



### AI Christmas Photo Maker (`christmas-photo`)

**Base prompt:**

```text

Transform this photo into a warm festive Christmas portrait: soft string lights, a decorated tree in the background, a cozy red or green sweater, gentle golden bokeh and a joyful holiday mood. Keep the face and identity exactly the same. This must look like a real photograph — natural skin texture, realistic lighting and shadows, sharp photographic detail — not a painting, illustration, or cartoon.

```

**Customization controls:** Scene



### AI Baby Photoshoot Maker (`baby-photoshoot`)

**Base prompt:**

```text

Transform this photo into a soft, dreamy baby photoshoot: the baby wearing a knitted bear-ear bonnet and a cream knit romper, sitting on a fluffy cream rug and holding a small teddy bear, surrounded by beige boho props like pampas grass and a little star-shaped light. Warm pastel tones and gentle diffused window light. Keep the baby's face and features exactly the same.

```

**Customization controls:** Stage, Lighting



### AI Graduation Photo Maker (`graduation-photo`)

**Base prompt:**

```text

Transform this person into a graduation portrait: wearing an academic cap and gown, holding a rolled diploma, with a celebratory campus or ceremony backdrop and warm proud lighting. Keep the face and identity exactly the same. This must look like a real photograph — natural skin texture, realistic lighting and shadows, sharp photographic detail — not a painting, illustration, or cartoon.

```

**Customization controls:** Gown colour, Setting



### AI Gym Transformation Photo (`gym-transformation`)

**Base prompt:**

```text

Transform this photo into a fitness-motivation photo of the same person, keeping their pose and framing: give them a toned, athletic, visibly fit physique, dressed in a black training tank top and shorts, in a modern gym with dumbbell racks and equipment behind, under dramatic gym lighting. Keep the person's face and identity exactly the same — this is a motivational style edit, not a medical depiction.

```

**Customization controls:** Build



### AI Ghibli Style Photo Converter (`ghibli-style`)

**Base prompt:**

```text

Convert this photo into a dreamy hand-painted Japanese animated film style: soft watercolour skies and backgrounds, warm nostalgic lighting, gentle painterly textures and expressive simplified features, enriched with a few flowers and small charming details. Keep the person's likeness recognisable.

```

**Customization controls:** No additional app options detected.



### AI Y2K Aesthetic Photo Filter (`y2k-aesthetic`)

**Base prompt:**

```text

Restyle this photo with a Y2K early-2000s aesthetic: flash-lit digital camera look, glossy highlights, low-rise fashion vibe, bold saturated colours and a slight grainy point-and-shoot quality. Keep the person's face and identity the same. This must look like a real photograph — natural skin texture, realistic lighting and shadows, sharp photographic detail — not a painting, illustration, or cartoon.

```

**Customization controls:** No additional app options detected.



### AI Wedding Invitation Photo Maker (`wedding-invite-photo`)

**Base prompt:**

```text

Transform this couple photo into an elegant wedding portrait for an invitation. Keep their pose and closeness — if they are cheek to cheek, keep them cheek to cheek. Dress them in wedding attire that suits each of them — for example a black tuxedo with a bow tie and a white boutonniere, and an ivory lace gown with a bouquet of white and blush roses. Place them in a garden under an arch of white roses, with warm golden-hour sun behind them. Unless text is given below, add no text. Keep both faces and identities exactly the same.

```

**Customization controls:** Text on the image



### AI Corporate Avatar Maker (`corporate-avatar`)

**Base prompt:**

```text

Turn this selfie into a clean, simplified professional avatar: smart business-casual attire, soft solid-colour background, friendly approachable expression, framed tightly like a profile icon. Keep the face and identity exactly the same. This must look like a real photograph — natural skin texture, realistic lighting and shadows, sharp photographic detail — not a painting, illustration, or cartoon.

```

**Customization controls:** Attire, Background



### AI Old Money Aesthetic Photo (`old-money-aesthetic`)

**Base prompt:**

```text

Restyle this photo with an old-money quiet-luxury aesthetic: tailored neutral-toned classic clothing, soft natural light, an elegant estate or library-style backdrop, and a timeless understated mood. Keep the person's face and identity exactly the same. This must look like a real photograph — natural skin texture, realistic lighting and shadows, sharp photographic detail — not a painting, illustration, or cartoon.

```

**Customization controls:** No additional app options detected.



### AI Barbie Box Photo Maker (`barbie-box`)

**Base prompt:**

```text

Turn this person into a collectible doll in a pink Barbie-style retail box: glossy plastic packaging, bold pink branding elements, printed accessories around the figure, studio product-photography lighting. Keep the face and likeness accurate. This must look like a real photograph of a physical toy in its box — sharp studio product-photography detail and realistic material — not a flat illustration or cartoon drawing.

```

**Customization controls:** Presentation



### AI Baby Predictor (`ai-baby-predictor`)

**Base prompt:**

```text

Using the features of the people in this photo, imagine a cute baby who blends their facial features, at the age given below — sitting up with a big happy smile, wearing a cream knit cardigan — photographed in the same setting as the photo, softly blurred behind, in warm natural light. This is a playful, for-fun concept, not a scientific prediction.

```

**Customization controls:** Stage



### AI Lego Minifigure Maker (`lego-minifigure`)

**Base prompt:**

```text

Turn this person into a glossy plastic Lego-style minifigure: cylindrical head, simplified blocky body proportions, bright primary-colour outfit matching their real clothing, displayed in a printed toy packaging box, studio product photography lighting. Keep the likeness recognisable in a toy form. This must look like a real photograph of a physical plastic toy — sharp studio product-photography detail and realistic material — not a flat illustration or cartoon drawing.

```

**Customization controls:** Presentation



### AI Pixar Avatar Maker (`pixar-avatar`)

**Base prompt:**

```text

Convert this photo into a 3D animated-movie-style character: large expressive eyes, smooth stylised features and the soft rounded shading of modern 3D animated films, with warm, soft cinematic light. Keep the person's likeness recognisable in cartoon form.

```

**Customization controls:** No additional app options detected.



### AI Age Progression Photo (`age-progression`)

**Base prompt:**

```text

Show this person realistically at the age given, with skin texture, hair and facial structure appropriate to that exact age. Keep the identity clearly recognisable — this is a fun, illustrative guess, not a medical prediction.

```

**Customization controls:** Age target



### AI Superhero Costume Maker (`superhero-costume`)

**Base prompt:**

```text

Transform this person into a superhero: a sleek detailed costume with a flowing cape, a heroic confident pose, dramatic comic-movie lighting and a city-skyline backdrop. Keep the person's face and identity exactly the same. This must look like a real photograph — natural skin texture, realistic lighting and shadows, sharp photographic detail — not a painting, illustration, or cartoon.

```

**Customization controls:** Costume colours, Framing



### AI Tarot Card Portrait Maker (`tarot-card-portrait`)

**Base prompt:**

```text

Design a mystical tarot card around this person's portrait: ornate gold border, celestial symbols (moon, stars, sun), rich jewel-toned colours, dramatic painterly lighting, and an elegant card-style composition. Keep the person's face recognisable within the artwork.

```

**Customization controls:** No additional app options detected.



### AI 90s Yearbook Photo Maker (`90s-yearbook-photo`)

**Base prompt:**

```text

Restyle this photo as a 90s school yearbook portrait: laser-grid or marbled studio backdrop, soft flash lighting, slightly retro hairstyle and clothing styling, a faint film-photo grain. Keep the person's face and identity exactly the same. This must look like a real photograph — natural skin texture, realistic lighting and shadows, sharp photographic detail — not a painting, illustration, or cartoon.

```

**Customization controls:** Backdrop



### AI Cyberpunk Avatar Maker (`cyberpunk-avatar`)

**Base prompt:**

```text

Transform this photo into a cyberpunk-style portrait: neon pink and cyan lighting, futuristic city backdrop, subtle tech-inspired accessories, dramatic rim lighting and a high-contrast sci-fi mood. Keep the person's face and identity exactly the same. This must look like a real photograph — natural skin texture, realistic lighting and shadows, sharp photographic detail — not a painting, illustration, or cartoon.

```

**Customization controls:** No additional app options detected.



### Funko Pop Yourself AI Generator (`funko-pop-figure`)

**Base prompt:**

```text

Turn this person into a Funko Pop-style vinyl collectible figure: oversized rounded head, small black dot eyes, simplified blocky body matching their real outfit and hair colour, standing in a printed collector's box with a clear plastic window, studio product-photography lighting. Keep the likeness recognisable in toy form. This must look like a real photograph of a physical vinyl toy in its retail box — sharp studio product-photography detail and realistic plastic material — not a flat illustration or cartoon drawing.

```

**Customization controls:** Presentation



### AI Claymation Photo Maker (`claymation-portrait`)

**Base prompt:**

```text

Convert this photo into a claymation stop-motion scene: visible clay texture with soft fingerprint-like imperfections, slightly exaggerated rounded features and matte lighting like a stop-motion film set, with everything — the person, their clothes, what they are doing and the setting around them — modelled in clay. Keep the person's likeness recognisable in clay form.

```

**Customization controls:** No additional app options detected.



### AI Comic Book Cover Maker (`comic-book-cover`)

**Base prompt:**

```text

Convert this photo into a bold comic book cover illustration: thick ink outlines, dramatic halftone shading and vivid colour. Unless a comic style is given below, make the person an original superhero in a red, gold and blue costume of their own design — an armoured suit or bodice, a tiara or mask and a flowing cape, not any existing character — standing confidently in front of a city skyline. Classic cover trade dress: a title area at the top, a small issue box in one corner and a bold caption burst. Keep the person's likeness recognisable in illustrated form.

```

**Customization controls:** Text on the image, Comic style



### Coastal Cowgirl Aesthetic AI Photoshoot (`coastal-cowgirl`)

**Base prompt:**

```text

Restyle this photo with a coastal cowgirl aesthetic: a straw cowboy hat, light denim and white linen, subtle western-style boots or accessories, sun-bleached beachy hair, warm golden-hour coastal lighting and a breezy ocean-adjacent backdrop. Keep the person's face and identity exactly the same. This must look like a real photograph — natural skin texture, realistic lighting and shadows, sharp photographic detail — not a painting, illustration, or cartoon.

```

**Customization controls:** No additional app options detected.



### Old Hollywood Glamour AI Portrait (`old-hollywood-glamour`)

**Base prompt:**

```text

Transform this photo into a classic old Hollywood glamour portrait: elegant 1950s-style formalwear, dramatic studio key lighting with soft falloff, glossy finger-waved hair styling, rich black-and-white or sepia tone, and a red-carpet studio backdrop. Keep the person's face and identity exactly the same. This must look like a real photograph — natural skin texture, realistic lighting and shadows, sharp photographic detail — not a painting, illustration, or cartoon.

```

**Customization controls:** No additional app options detected.



### AI Prom Photo Maker (`prom-photoshoot`)

**Base prompt:**

```text

Transform this photo into a glamorous prom-night portrait, framed from the knees up: a burgundy sequinned corset gown with a thigh slit and a sparkly clutch, with hair in an elegant updo — or a sharp black tuxedo — standing in a grand ballroom with crystal chandeliers, candles, flowers and softly blurred guests, in warm romantic light with sparkle bokeh. Keep the person's face and identity exactly the same.

```

**Customization controls:** No additional app options detected.



### AI Thanksgiving Photo Maker (`thanksgiving-photoshoot`)

**Base prompt:**

```text

Transform this photo into a cozy Thanksgiving fall portrait: warm autumn-toned knitwear, soft golden hour light, a backdrop of fall foliage or a rustic dinner table with pumpkins and candles, and a warm festive family-gathering mood. Keep the person's face and identity exactly the same. This must look like a real photograph — natural skin texture, realistic lighting and shadows, sharp photographic detail — not a painting, illustration, or cartoon.

```

**Customization controls:** Scene



### AI Glow Up Filter (`glow-up-filter`)

**Base prompt:**

```text

Give this photo a natural glow-up enhancement: smoother even skin texture without losing realism, brighter and more flattering studio-quality lighting, subtly improved hair styling, and a polished, well-rested look. Keep the person's face, identity and features exactly the same — this is an enhancement, not a different person. This must look like a real photograph — natural skin texture, realistic lighting and shadows, sharp photographic detail — not a painting, illustration, or cartoon.

```

**Customization controls:** No additional app options detected.



### AI Astronaut Photo Maker (`astronaut-photoshoot`)

**Base prompt:**

```text

Transform this person into an astronaut on a spacewalk: a detailed, realistic white space suit with the helmet's clear visor showing their face, giving a thumbs-up as they float in orbit with the Earth curving below, a bright sun flare and part of a space station's solar panels in the frame. Keep the person's face and identity exactly the same.

```

**Customization controls:** No additional app options detected.



### AI Pixel Art Avatar Maker (`pixel-art-avatar`)

**Base prompt:**

```text

Convert this photo into a bright 16-bit pixel-art video-game scene: visible square pixels, a cheerful limited palette and simplified features. Keep the person's clothes and what they are doing — riding a bike, holding a drink — and set them in a sunny pixel-art world built on their location, like a colourful seaside town with flowers. Add a small game HUD: a PLAYER 1 label with three hearts in the top corner. Keep the person's likeness recognisable in pixel form.

```

**Customization controls:** Pixel size



## Reusable customization option phrases

The options below are exact reusable choice phrases. The runtime app mapping determines which option sets appear on each app.

### Strength (`strength`; STRENGTH)

- **Subtle**: Apply the transformation lightly: the photograph should still be clearly recognisable as the original, with the style as a finish rather than a replacement.

- **Strong**: Commit fully to the transformation — push the style as far as it goes while keeping the subject recognisable.



### Framing (`framing`; FRAMING)

- **Head & shoulders**: Frame as a head-and-shoulders composition.

- **Half body**: Frame from the waist up.

- **Full body**: Frame the full figure from head to feet.



### Strength (`strength`; RETOUCH_STRENGTH)

- **Subtle**: Keep the edit conservative — it should be hard to tell the photo was retouched at all.

- **Noticeable**: Make the correction clearly visible while keeping everything about it believable.

- **Full**: Apply the correction fully, to a commercial-retouch standard, without crossing into plastic or airbrushed skin.



### Background (`backdrop`; BACKDROP)

- **Transparent**: Place the subject on a fully transparent background with a precise edge through hair and fine detail.

- **Plain white**: Place the subject on a plain white background with a soft natural contact shadow.

- **Studio grey**: Place the subject on a seamless mid-grey studio backdrop with a gentle gradient falloff.

- **Office**: Place the subject in a modern office interior, softly out of focus and lit to match the subject.

- **Outdoor**: Place the subject outdoors in natural daylight with believable depth behind them.

- **Gradient**: Place the subject on a smooth two-tone colour gradient.

- **Blur the original**: Keep the original background but throw it convincingly out of focus, as a wide aperture would.



### Background (`backdrop`; PRODUCT_BACKDROP)

- **White sweep**: Pure white seamless background with a soft natural contact shadow, the product centred with even margins.

- **Studio**: Dark gradient studio backdrop with controlled softbox lighting and a crisp specular highlight describing the material.

- **Lifestyle**: A styled real-world surface with props kept well out of focus behind, lit by warm natural window light.

- **Marble**: A polished stone surface, bright diffuse light, and a clean reflection beneath the product.

- **Outdoor**: Outdoor natural light on wood or stone, soft dappled shade, believable ambient bounce.

- **Colour pop**: A bold single-colour gradient background with punchy commercial lighting and strong product separation.



### Lighting (`lighting`; LIGHTING)

- **Soft daylight**: Light it with soft, even daylight and gentle shadows.

- **Golden hour**: Light it with warm low sun, long soft shadows and gentle backlight rimming the subject.

- **Studio**: Light it with controlled studio softboxes: a clear key, a soft fill and clean catchlights.

- **Moody**: Light it low-key: one soft source, deep shadow, rich contrast and restrained colour.

- **Bright & airy**: Light it high-key: bright, airy, minimal shadow and a light overall tone.



### Setting (`setting`; SETTING)

- **Studio**: Set it in a photographic studio against a clean backdrop.

- **Outdoors**: Set it outdoors with a natural landscape behind, at a believable distance and depth.

- **City street**: Set it on a real city street with architecture and depth behind the subject.

- **Indoors**: Set it in a warm, tastefully furnished interior with natural window light.

- **Garden**: Set it in a garden with greenery and dappled natural light.

- **Beach**: Set it on a beach with soft sand, open sky and warm low light.



### Attire (`attire`; ATTIRE)

- **Suit & tie**: Dress the subject in a well-fitted dark business suit with a shirt and tie.

- **Blazer, no tie**: Dress the subject in a tailored blazer over an open-collar shirt.

- **Smart casual**: Dress the subject in smart-casual business dress — a shirt or knitwear, no jacket.

- **Shirt & sweater**: Dress the subject in a collared shirt under a fine-knit sweater.

- **Keep my clothes**: Keep the clothing exactly as it is in the photo and change only the lighting, background and framing.



### Attire (`attire`; CLINICAL_ATTIRE)

- **White coat**: Dress the subject in a clean white clinical coat over business dress.

- **Coat over scrubs**: Dress the subject in a white clinical coat over scrubs.

- **Scrubs**: Dress the subject in clean, well-fitted scrubs.

- **Suit, no coat**: Dress the subject in business dress with no clinical coat.

- **Keep my clothes**: Keep the clothing exactly as it is and change only the lighting, background and framing.



### Background (`backdrop`; HEADSHOT_BACKDROP)

- **Neutral grey**: Use a plain neutral grey studio background with a soft gradient falloff.

- **Plain white**: Use a plain white background with flat even lighting and no shadow behind the head.

- **Office, blurred**: Use a modern office interior thrown well out of focus behind the subject.

- **Outdoor**: Use softly blurred greenery or architecture in natural daylight behind the subject.

- **Dark**: Use a dark low-key background with the subject separated by rim light.



### Look (`look`; SOCIAL_LOOK)

- **Bold**: Punchy saturated colour, strong contrast and clear subject separation so it reads at thumbnail size.

- **Clean**: A restrained palette, generous negative space and one clear focal point.

- **Dark mode**: A dark background with bright accent colour and strong subject separation.



### Text space (`textspace`; TEXT_SPACE)

- **Leave room for text**: Compose with a large clear area of empty space for a headline to be added later.

- **Fill the frame**: Fill the frame with the subject and leave no reserved space for text.



### Background (`backdrop`; PFP_BACKDROP)

- **Solid colour**: Put the subject on a single flat colour behind, chosen to contrast with them.

- **Gradient**: Put the subject on a smooth two-tone gradient behind.

- **Blurred scene**: Keep a real setting behind the subject but thrown well out of focus.

- **Transparent**: Put the subject on a fully transparent background with a precise edge.



### Crop (`crop`; PFP_CROP)

- **Circle-safe**: Compose so nothing important is lost to a tight circular crop, with the head centred and clear margins.

- **Tight on the face**: Crop tightly to the face so it still reads at very small sizes.

- **Head & shoulders**: Frame head and shoulders with even margins.



### Enlarge by (`amount`; UPSCALE_AMOUNT)

- **2×**: Enlarge to roughly twice the original dimensions.

- **4×**: Enlarge to roughly four times the original dimensions — more reconstruction, so judge the result at full size.



### Finish (`finish`; ENHANCE_FINISH)

- **Natural**: Keep the finish honest: no added contrast, no stylisation, grain structure left natural.

- **Crisp**: Favour acuity and micro-contrast, without edge halos.

- **Print-ready**: Prepare for print: maximum honest resolution, neutral colour, nothing stylised.



### Colour (`colour`; RESTORE_COLOUR)

- **Keep black & white**: Stay black and white: restore contrast and remove damage, but add no colour at all.

- **Colourise naturally**: Colourise with restrained, period-plausible tones and believable skin colour.

- **Vivid colour**: Colourise with fuller, more saturated colour while keeping skin tones believable.



### Fill the gap with (`fill`; REMOVE_FILL)

- **What was behind it**: Reconstruct whatever was behind the removed area, continuing the surrounding texture, perspective and lighting exactly.

- **A clean surface**: Fill the removed area with a clean continuation of the nearest plain surface rather than inventing new detail.



### Presentation (`packaging`; FIGURE_PACKAGING)

- **In its box**: Show the figure inside printed retail packaging with a clear window, photographed as a product shot.

- **On a display base**: Show the figure standing on a round display base against a plain studio background, with no packaging.

- **On a desk**: Show the figure standing on a real desk beside everyday objects, so its scale reads immediately.

- **In a scene**: Show the figure in a full miniature scene with believable set dressing and lighting.



### Build (`build`; BUILD)

- **Lightly toned**: Add light, natural muscle tone — the build of someone who trains occasionally.

- **Athletic**: Give an athletic build with clear but natural definition.

- **Muscular**: Give a heavily muscular, gym-trained build with pronounced definition, keeping proportions anatomically possible.



### Style (`style`; TATTOO_STYLE)

- **Fine line**: Draw it as a fine-line tattoo: thin single-weight black lines, no shading, delicate detail.

- **Traditional**: Draw it as an American traditional tattoo: heavy black outlines, a limited flat palette, bold simple shapes.

- **Blackwork**: Draw it as blackwork: solid black fills, high contrast, strong negative space.

- **Realism**: Draw it as a realism tattoo: smooth greyscale shading and photographic detail.

- **Watercolour**: Draw it as a watercolour tattoo: soft colour washes and bleeding edges with minimal outline.



### Placement (`placement`; TATTOO_PLACEMENT)

- **Forearm**: Place it on the inner forearm, wrapping believably with the curve of the arm.

- **Shoulder**: Place it on the outer shoulder and upper arm, following the deltoid curve.

- **Upper back**: Place it across the upper back, centred on the spine.

- **Ankle**: Place it just above the ankle, small and following the leg's curve.

- **Collarbone**: Place it along the collarbone, sized to sit between the shoulder and the sternum.



### Decade (`decade`; DECADE)

- **1990s**: Set it in the 1990s: the clothing, hair, grooming and the film and lens look of that decade.

- **1980s**: Set it in the 1980s: the clothing, hair, grooming and the film and lens look of that decade.

- **1970s**: Set it in the 1970s: the clothing, hair, grooming and the warm faded film look of that decade.

- **1960s**: Set it in the 1960s: the clothing, hair, grooming and the film look of that decade.

- **1950s**: Set it in the 1950s: the clothing, hair, grooming and the film look of that decade.

- **1920s**: Set it in the 1920s: the clothing, hair, grooming and the photographic look of that period.

- **2000s**: Set it in the 2000s: the clothing, hair, grooming and the early-digital-camera look of that decade.



### Backdrop (`backdrop`; YEARBOOK_BACKDROP)

- **Laser grid**: Use the classic laser-grid studio backdrop of the period.

- **Mottled blue**: Use a mottled blue-grey painted studio backdrop.

- **Marbled grey**: Use a marbled grey studio backdrop.

- **Gradient sunset**: Use an airbrushed sunset gradient backdrop.

- **Library**: Use a bookshelf backdrop, softly out of focus.



### Look (`look`; EIGHTIES_LOOK)

- **Mall studio portrait**: Stage it as a mall portrait-studio sitting: soft-focus glow, a painted backdrop and a posed three-quarter turn.

- **Prom night**: Stage it as a prom photograph: formalwear, a balloon arch or foil backdrop, and hard on-camera flash.

- **Band promo**: Stage it as a band promo shot: moody coloured gels, a brick or alley setting and a deliberately cool expression.

- **Family portrait**: Stage it as a formal family portrait of the period: matching knitwear, a neutral backdrop and even studio flash.

- **Holiday snapshot**: Stage it as a holiday snapshot on 35mm: bright sun, slight overexposure and faded colour.



### Hair colour (`colour`; HAIR_COLOUR)

- **Blonde**: Change the hair to a natural golden blonde.

- **Platinum**: Change the hair to a cool platinum blonde, almost white.

- **Light brown**: Change the hair to a light ash brown.

- **Dark brown**: Change the hair to a deep chocolate brown.

- **Black**: Change the hair to a natural jet black with blue-toned highlights.

- **Auburn**: Change the hair to a warm auburn.

- **Copper red**: Change the hair to a bright copper red.

- **Silver grey**: Change the hair to a silver grey.

- **Pastel pink**: Change the hair to a pastel pink.

- **Blue**: Change the hair to a deep vivid blue.



### Shade (`shade`; BLONDE_SHADE)

- **Golden**: Make it a warm golden blonde with believable root shadow.

- **Platinum**: Make it a cool platinum blonde, almost white, with a faint grey undertone.

- **Ash**: Make it an ash blonde with cool, slightly muted tones.

- **Honey**: Make it a honey blonde with warm caramel depth through the mid-lengths.

- **Strawberry**: Make it a strawberry blonde with a soft copper warmth.

- **Balayage**: Make it a blonde balayage: darker roots melting into lighter ends.



### Curl type (`curl`; CURL_TYPE)

- **Loose waves**: Give it loose, soft waves with plenty of movement.

- **Defined curls**: Give it well-defined spiral curls with believable volume and root lift.

- **Tight coils**: Give it tight natural coils with dense, even definition.

- **Beach curls**: Give it relaxed beach curls, looser at the roots and tighter toward the ends.



### Braces (`type`; BRACES_TYPE)

- **Metal**: Add traditional metal brackets with a silver archwire.

- **Ceramic / clear**: Add tooth-coloured ceramic brackets with a fine, barely visible wire.

- **Coloured bands**: Add metal brackets with coloured elastic bands on each one.

- **Clear aligner**: Add a clear aligner tray over the teeth, with a faint edge line and realistic reflections.



### Eye colour (`colour`; EYE_COLOUR)

- **Blue**: Change the iris colour to a natural blue.

- **Green**: Change the iris colour to a natural green.

- **Hazel**: Change the iris colour to hazel, with the usual green-to-amber variation.

- **Light brown**: Change the iris colour to a light amber brown.

- **Dark brown**: Change the iris colour to a deep brown.

- **Grey**: Change the iris colour to a cool grey.

- **Amber**: Change the iris colour to a golden amber.



### Hairstyle (`style`; HAIRSTYLE)

- **Long & straight**: Give them long straight hair falling past the shoulders.

- **Long & wavy**: Give them long, loosely waved hair past the shoulders.

- **Shoulder bob**: Give them a blunt bob cut level with the jaw.

- **Pixie crop**: Give them a short pixie crop with textured layers.

- **Natural curls**: Give them defined natural curls with believable volume and root lift.

- **Ponytail**: Give them a high ponytail with a clean hairline and a few loose strands.

- **Bun**: Give them hair gathered into a neat bun.

- **Side part & quiff**: Give them a side-parted quiff with tapered sides.

- **Braids**: Give them neat braids with a believable parting pattern.



### Beard (`style`; BEARD)

- **Stubble**: Add short even stubble of a few days' growth.

- **Short boxed**: Add a short boxed beard, neatly trimmed and following the jawline.

- **Full beard**: Add a full beard with natural density and a tidy outline.

- **Goatee**: Add a goatee on the chin with a connected moustache.

- **Moustache only**: Add a moustache only, leaving the rest of the face clean-shaven.

- **Van Dyke**: Add a Van Dyke: a pointed chin beard with a detached moustache.



### Frames (`frames`; GLASSES)

- **Round metal**: Add round thin metal-framed spectacles.

- **Square acetate**: Add square black acetate-framed spectacles.

- **Rimless**: Add rimless spectacles with thin temple arms.

- **Cat-eye**: Add cat-eye framed spectacles.

- **Aviator sunglasses**: Add aviator sunglasses with believable reflections in the lenses.

- **Sport**: Add wraparound sport sunglasses.



### Saree colour (`colour`; SAREE_COLOUR)

- **Deep red**: Dress her in a deep red silk saree with gold zari work.

- **Royal blue**: Dress her in a royal blue silk saree with silver detailing.

- **Emerald green**: Dress her in an emerald green silk saree with gold border work.

- **Black & gold**: Dress her in a black saree with heavy gold embroidery.

- **Pastel pink**: Dress her in a soft pastel pink chiffon saree with delicate detailing.

- **Ivory & gold**: Dress her in an ivory silk saree with a gold border.



### Interior style (`style`; INTERIOR_STYLE)

- **Modern minimal**: Redesign it in a modern minimal style: clean lines, a restrained palette and uncluttered surfaces.

- **Scandinavian**: Redesign it in a Scandinavian style: pale wood, white walls, soft textiles and abundant daylight.

- **Industrial**: Redesign it in an industrial style: exposed brick, black metal, raw wood and utilitarian fittings.

- **Mid-century**: Redesign it in a mid-century modern style: warm walnut, tapered legs and muted period colour.

- **Boho**: Redesign it in a bohemian style: layered textiles, plants, rattan and warm earthy colour.

- **Luxury**: Redesign it in a luxury style: marble, brass, deep upholstery and considered accent lighting.



### Setting (`setting`; VEHICLE_SETTING)

- **Studio**: Place it in a professional vehicle studio: seamless backdrop, sculpted lighting along the bodywork, a clean floor reflection.

- **Mountain road**: Place it on an empty mountain road with landscape behind and warm low sun on the bodywork.

- **City at night**: Place it on a city street at night with wet asphalt and neon reflections along the bodywork.

- **Showroom**: Place it in a bright showroom with even overhead lighting and a polished floor.



### Setting (`setting`; FOOD_SETTING)

- **Overhead on marble**: Shoot it flat overhead on a marble surface with soft diffuse light.

- **Rustic wood**: Shoot it on rustic wood with warm directional window light and natural props.

- **Restaurant table**: Shoot it on a laid restaurant table with the room softly out of focus behind.

- **Dark & moody**: Shoot it dark and moody: a single raking light, deep shadow and rich colour.



### Time of day (`time`; PROPERTY_TIME)

- **Bright daylight**: Light it as bright midday: clear sky, even natural light, no blown windows.

- **Golden evening**: Light it at golden hour: warm low sun through the windows and long soft shadows.

- **Twilight**: Light it at twilight: a deep blue sky with the interior lights warm and glowing.



### Expression (`expression`; EXPRESSION)

- **Happy**: Change the expression to a genuine happy one, with the eyes creasing the way they do in a real smile.

- **Serious**: Change the expression to a composed, serious one with a relaxed mouth and steady eyes.

- **Surprised**: Change the expression to a surprised one: raised brows, widened eyes, a slightly open mouth.

- **Calm**: Change the expression to a calm, settled one.

- **Confident**: Change the expression to a confident one: level brows, a slight closed-mouth smile, direct gaze.



### Smile (`smile`; SMILE)

- **Subtle, closed-lip**: Add a subtle closed-lip smile with the cheeks slightly raised.

- **Natural**: Add a natural smile showing a little of the upper teeth, with the eyes creasing to match.

- **Broad**: Add a broad open smile showing the teeth, with the whole face engaged.



### Costume colours (`palette`; HERO_PALETTE)

- **Red & gold**: Give the costume a red and gold colour scheme with metallic detailing.

- **Blue & red**: Give the costume a classic blue and red colour scheme.

- **Black stealth**: Give the costume a matte black stealth colour scheme with minimal accents.

- **Green**: Give the costume a deep green colour scheme with darker panelling.

- **White & silver**: Give the costume a white and silver colour scheme with a cool metallic sheen.



### Gown colour (`gown`; GOWN)

- **Black**: Dress them in a black academic gown with a matching mortarboard.

- **Navy**: Dress them in a navy academic gown with a matching mortarboard.

- **Red**: Dress them in a red academic gown with a matching mortarboard.

- **Royal blue**: Dress them in a royal blue academic gown with a matching mortarboard.

- **Green**: Dress them in a green academic gown with a matching mortarboard.



### Frame (`frame`; POLAROID_FRAME)

- **Classic white**: Present it in a classic white instant-film frame with the wide border at the bottom.

- **Vintage**: Present it in an aged instant-film frame with yellowed borders and faded warm colour.

- **With a caption**: Present it in a white instant-film frame with a short handwritten caption in the bottom border.



### Pixel size (`depth`; PIXEL_DEPTH)

- **Chunky 8-bit**: Render it as chunky 8-bit pixel art on a coarse grid with a very limited palette.

- **16-bit**: Render it as 16-bit pixel art with a finer grid, more colours and careful dithering.

- **Detailed**: Render it as detailed pixel art with a fine grid, smooth shading ramps and a broad palette.



### Stage (`stage`; BABY_STAGE)

- **Newborn**: Show the child as a newborn baby.

- **6 months**: Show the child at about six months old.

- **Toddler**: Show the child as a toddler of about two years old.

- **Young child**: Show the child at about five years old.



### Make them look (`age`; YOUNGER_AGE)

- **A toddler**: De-age the person to a toddler of about three years old.

- **A young child**: De-age the person to a child of about six years old.

- **A pre-teen**: De-age the person to a pre-teen of about eleven years old.

- **A teenager**: De-age the person to a teenager of about sixteen years old.



### Length (`length`; HAIR_LENGTH)

- **Shoulder length**: Extend the hair to shoulder length.

- **Mid-back**: Extend the hair to mid-back length.

- **Waist length**: Extend the hair to waist length.



### Fringe shape (`shape`; BANGS)

- **Blunt**: Add a blunt fringe cut straight across the brow.

- **Curtain**: Add a curtain fringe parted in the centre and sweeping to both sides.

- **Side-swept**: Add a side-swept fringe falling across one side of the forehead.

- **Wispy**: Add a thin wispy fringe with visible separation between strands.

- **Micro**: Add a very short micro fringe sitting well above the brow.



### Brow shape (`shape`; BROWS)

- **Natural**: Reshape the eyebrows to a natural, lightly groomed shape.

- **Soft arch**: Reshape the eyebrows with a soft, even arch.

- **Straight**: Reshape the eyebrows to a straight, level line.

- **Thick & full**: Reshape the eyebrows to be thick and full, with dense natural hair detail.

- **Thin & defined**: Reshape the eyebrows to a thin, sharply defined line.



### Piercing (`placement`; PIERCING)

- **Ear lobe**: Add a small stud in the ear lobe.

- **Helix**: Add a small hoop in the upper ear helix.

- **Nose stud**: Add a small nose stud on one nostril.

- **Septum**: Add a septum ring.

- **Eyebrow**: Add an eyebrow barbell.

- **Lip**: Add a small lip ring at one corner of the mouth.



### Format (`country`; PASSPORT_COUNTRY)

- **US — 2×2in**: Format as a US passport photo: square 2×2 inches, plain white background, neutral expression, the head centred and fully visible.

- **UK / EU — 35×45mm**: Format as a UK or EU passport photo: 35×45mm, plain light grey background, neutral expression, no shadow on the face.

- **India — 2×2in**: Format as an Indian passport photo: square 2×2 inches, plain white background, the face filling most of the frame, neutral expression.

- **Schengen visa**: Format as a Schengen visa photo: 35×45mm, plain light background, the head 32–36mm from chin to crown, neutral expression.

- **Canada — 50×70mm**: Format as a Canadian passport photo: 50×70mm, plain white background, the head 31–36mm from chin to crown.

- **China — 33×48mm**: Format as a Chinese visa photo: 33×48mm, plain white background, the head centred, ears visible, neutral expression.



### Background (`backdrop`; ID_BACKDROP)

- **Plain white**: Use a plain pure white background with no shadow behind the head.

- **Light grey**: Use a plain light grey background with no shadow behind the head.

- **Light blue**: Use a plain light blue background with no shadow behind the head.



### Suit (`suit`; SUIT_COLOUR)

- **Navy, with tie**: Dress them in a well-fitted navy suit with a white shirt and a plain tie.

- **Charcoal, with tie**: Dress them in a well-fitted charcoal suit with a white shirt and a plain tie.

- **Black, with tie**: Dress them in a well-fitted black suit with a white shirt and a plain tie.

- **Navy, no tie**: Dress them in a well-fitted navy suit with an open-collar white shirt and no tie.

- **Light grey**: Dress them in a well-fitted light grey suit with a white shirt.



### Logo style (`style`; LOGO_STYLE)

- **Wordmark**: Design it as a clean typographic wordmark with careful letter spacing.

- **Icon & text**: Design it as a simple geometric icon with the name set beside it.

- **Badge**: Design it as a circular badge with the name running around the mark.

- **Mascot**: Design it as a bold mascot logo with heavy outlines and a limited palette.

- **Minimal**: Design it as a minimal monoline mark in a single colour.



### Genre (`genre`; BOOK_GENRE)

- **Thriller**: Use a thriller book-cover visual language: high contrast, cold colour, tense negative space.

- **Romance**: Use a romance book-cover visual language: warm light, soft focus, an elegant script-friendly layout.

- **Sci-fi**: Use a science-fiction book-cover visual language: cool metallics, scale and atmospheric depth.

- **Fantasy**: Use a fantasy book-cover visual language: ornate detail, rich colour and a heroic sense of scale.

- **Horror**: Use a horror book-cover visual language: deep shadow, unsettling framing, a desaturated palette.

- **Literary**: Use a literary book-cover visual language: restrained typography-led design, muted colour, generous space.

- **Non-fiction**: Use a non-fiction book-cover visual language: clear hierarchy, a confident single image and plain strong type.



### Genre (`genre`; MUSIC_GENRE)

- **Pop**: Use a pop album visual language: bright saturated colour, a bold centred subject and clean modern type.

- **Hip-hop**: Use a hip-hop album visual language: strong contrast, confident posing, gold or chrome accents.

- **Rock**: Use a rock album visual language: grain, high contrast monochrome or muted colour, a raw unposed feel.

- **Electronic**: Use an electronic album visual language: geometric abstraction, neon gradients and a synthetic finish.

- **Indie folk**: Use an indie folk album visual language: soft natural light, film texture and a quiet, understated composition.

- **Jazz**: Use a classic jazz album visual language: duotone colour blocks, mid-century type and a smoky monochrome portrait.

- **Metal**: Use a metal album visual language: dark dense artwork, heavy ornament and a near-black palette.



### Genre (`genre`; FILM_GENRE)

- **Action**: Use an action film-poster visual language: teal and orange grade, a low hero angle and explosive scale.

- **Thriller**: Use a thriller film-poster visual language: cold colour, deep shadow and a tense off-centre composition.

- **Sci-fi**: Use a science-fiction film-poster visual language: vast scale, cool metallics and atmospheric haze.

- **Horror**: Use a horror film-poster visual language: near-black background, a single unsettling element and stark type.

- **Romance**: Use a romance film-poster visual language: warm light, soft focus and a close two-shot composition.

- **Comedy**: Use a comedy film-poster visual language: bright flat colour, a playful pose and light-hearted type.

- **Drama**: Use a drama film-poster visual language: restrained colour, a contemplative portrait and quiet typography.



### Comic style (`genre`; COMIC_GENRE)

- **Superhero**: Use a mainstream superhero comic style: bold inks, dynamic foreshortening and saturated primaries.

- **Noir**: Use a noir comic style: heavy black spotting, rain and hard shadow, a near-monochrome palette.

- **Manga**: Use a manga style: screentone shading, expressive linework and speed lines.

- **Golden age**: Use a golden-age comic style: limited flat colour, visible halftone dots and period lettering.

- **Indie**: Use an indie comic style: looser linework, muted colour and an unshowy layout.



### Reaction (`mood`; THUMBNAIL_MOOD)

- **Excited**: Give the subject an excited, high-energy expression.

- **Shocked**: Give the subject a shocked, wide-eyed expression.

- **Serious**: Give the subject a serious, credible expression.

- **Happy**: Give the subject a warm, happy expression.



### Festival (`festival`; FESTIVAL)

- **Diwali**: Set it at Diwali: diyas and warm lamplight, rangoli, festive traditional dress and marigold decoration.

- **Holi**: Set it at Holi: clouds of coloured powder, white clothing stained with colour, bright daylight.

- **Navratri**: Set it at Navratri: mirrored chaniya choli or kediyu, garba lighting and a decorated venue.

- **Eid**: Set it at Eid: elegant traditional dress, crescent and lantern decoration, warm evening light.

- **Christmas**: Set it at Christmas: a decorated tree, warm string lights and festive knitwear.

- **Onam**: Set it at Onam: kasavu white-and-gold dress, a pookalam flower carpet and bright natural light.

- **Pongal**: Set it at Pongal: traditional South Indian dress, sugarcane and kolam decoration in warm daylight.



### Scene (`scene`; HOLIDAY_SCENE)

- **By the tree**: Set it beside a decorated tree with warm string lights and wrapped gifts.

- **By the fire**: Set it by a lit fireplace with stockings and warm low light.

- **At the table**: Set it at a laid festive table with candles and the meal dressed.

- **Outside in the snow**: Set it outdoors in fresh snow with soft overcast winter light.

- **Studio**: Set it in a studio with a simple festive backdrop and clean lighting.



### Style (`style`; PET_STYLE)

- **Royal portrait**: Paint the pet as a royal oil portrait in period dress, in a gilded setting.

- **Studio photo**: Photograph the pet as a studio portrait: clean backdrop, soft key light, sharp focus on the eyes.

- **Watercolour**: Render the pet as a loose watercolour with soft bleeding edges and paper texture.

- **Cartoon**: Render the pet as a friendly cartoon with clean outlines and flat colour.



### Describe the outfit (`outfit`; OUTFIT_TEXT)

Template: `Dress them in this specifically: {value}. Match the drape, fit and fabric behaviour to their pose and to the light of the scene.`



### Text on the image (`headline`; HEADLINE_TEXT)

Template: `Render this text large and legible in the image, spelled exactly like this: "{value}".`



### Name to use (`name`; NAME_TEXT)

Template: `Set this name in the design, spelled exactly like this: "{value}".`



### Describe what you want (`subject`; SUBJECT_TEXT)

Template: `The subject is: {value}.`



## Shared instructions updated for dev

- `src/lib/staging.ts`: facial geometry/identity preservation, realistic facial detail and lighting, and coherent restaging/artwork instructions.

- `src/lib/app-presets.ts`: the app-specific base prompt is prioritized; selected presets and all selected parameter phrases refine named attributes. Group prompts preserve each person's identity independently.

- `src/lib/app-catalog.ts`: improved base quality contract for catalogue apps.

- `src/lib/creative-apps.ts`: shared preview-fidelity contract definition for curated apps.

## Limitations

The app's preview creative is a visual target encoded by its written prompt; this implementation does not send that static after-preview as a second image reference. Prompting can improve resemblance to the expected result but cannot guarantee exact image matching or identity preservation on every generation. Test sample photos and combined parameters on dev before production.