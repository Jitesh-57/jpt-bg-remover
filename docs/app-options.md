# App options

Every AI app shows one or two controls whose value is written into the prompt.
They live in `src/lib/app-options.ts`; this file is generated from it, so it is
a record of what shipped rather than a second source of truth.

Resolution is slug → category → nothing, the same order the presets use. A
**bold slug** has a set written for that app; the rest inherit their category's.
A `*` marks an option Generate is blocked on. Where a list starts with *Auto*,
that is the default and it adds nothing to the prompt — the app then generates
exactly what it generated before any of this existed.

200 apps.


## Featured apps — 42

| App | Options |
| --- | --- |
| **`3d-figurine`** | Presentation: In its box · On a display base · On a desk · In a scene |
| **`90s-yearbook-photo`** | Backdrop: Laser grid · Mottled blue · Marbled grey · Gradient sunset · Library |
| **`age-progression`** | Age them to: 30s · 40s · 50s · 60s · 70s · 80s |
| **`ai-baby-predictor`** | Stage: Newborn · 6 months · Toddler · Young child |
| `anime-style` | Framing: Auto · Head & shoulders · Half body · Full body<br>Strength: Auto · Subtle · Strong |
| `astronaut-photoshoot` | Framing: Auto · Head & shoulders · Half body · Full body<br>Strength: Auto · Subtle · Strong |
| **`baby-photoshoot`** | Stage: Newborn · 6 months · Toddler · Young child<br>Lighting: Auto · Soft daylight · Golden hour · Studio · Moody · Bright & airy |
| `background-changer` | Background: Auto · Transparent · Plain white · Studio grey · Office · Outdoor · Gradient · Blur the original |
| **`barbie-box`** | Presentation: In its box · On a display base · On a desk · In a scene |
| **`christmas-photo`** | Scene: Auto · By the tree · By the fire · At the table · Outside in the snow · Studio |
| `claymation-portrait` | Framing: Auto · Head & shoulders · Half body · Full body<br>Strength: Auto · Subtle · Strong |
| `coastal-cowgirl` | Setting: Auto · Studio · Outdoors · City street · Indoors · Garden · Beach<br>Lighting: Auto · Soft daylight · Golden hour · Studio · Moody · Bright & airy |
| **`comic-book-cover`** | Text on the image *(type it)*<br>Comic style: Auto · Superhero · Noir · Manga · Golden age · Indie |
| **`corporate-avatar`** | Attire: Auto · Suit & tie · Blazer, no tie · Smart casual · Shirt & sweater · Keep my clothes<br>Background: Auto · Solid colour · Gradient · Blurred scene · Transparent |
| `couple-photoshoot` | Setting: Auto · Studio · Outdoors · City street · Indoors · Garden · Beach<br>Lighting: Auto · Soft daylight · Golden hour · Studio · Moody · Bright & airy |
| `cyberpunk-avatar` | Framing: Auto · Head & shoulders · Half body · Full body<br>Strength: Auto · Subtle · Strong |
| **`festival-photoshoot`** | Festival: Auto · Diwali · Holi · Navratri · Eid · Christmas · Onam · Pongal<br>Lighting: Auto · Soft daylight · Golden hour · Studio · Moody · Bright & airy |
| **`funko-pop-figure`** | Presentation: In its box · On a display base · On a desk · In a scene |
| `ghibli-style` | Framing: Auto · Head & shoulders · Half body · Full body<br>Strength: Auto · Subtle · Strong |
| `glow-up-filter` | Strength: Auto · Subtle · Noticeable · Full |
| **`graduation-photo`** | Gown colour: Auto · Black · Navy · Red · Royal blue · Green<br>Setting: Auto · Studio · Outdoors · City street · Indoors · Garden · Beach |
| **`gym-transformation`** | Build: Lightly toned · Athletic · Muscular |
| **`lego-minifigure`** | Presentation: In its box · On a display base · On a desk · In a scene |
| **`linkedin-banner`** | Text on the image *(type it)*<br>Look: Auto · Bold · Clean · Dark mode |
| `old-hollywood-glamour` | Setting: Auto · Studio · Outdoors · City street · Indoors · Garden · Beach<br>Lighting: Auto · Soft daylight · Golden hour · Studio · Moody · Bright & airy |
| `old-money-aesthetic` | Setting: Auto · Studio · Outdoors · City street · Indoors · Garden · Beach<br>Lighting: Auto · Soft daylight · Golden hour · Studio · Moody · Bright & airy |
| **`passport-photo`** | Format: US — 2×2in · UK / EU — 35×45mm · India — 2×2in · Schengen visa · Canada — 50×70mm · China — 33×48mm<br>Background: Plain white · Light grey · Light blue |
| **`pet-portrait`** | Style: Auto · Royal portrait · Studio photo · Watercolour · Cartoon<br>Framing: Auto · Head & shoulders · Half body · Full body |
| `pixar-avatar` | Framing: Auto · Head & shoulders · Half body · Full body<br>Strength: Auto · Subtle · Strong |
| **`pixel-art-avatar`** | Pixel size: Auto · Chunky 8-bit · 16-bit · Detailed |
| **`polaroid-photo`** | Frame: Auto · Classic white · Vintage · With a caption |
| `professional-headshot` | Attire: Auto · Suit & tie · Blazer, no tie · Smart casual · Shirt & sweater · Keep my clothes<br>Background: Auto · Neutral grey · Plain white · Office, blurred · Outdoor · Dark |
| `prom-photoshoot` | Setting: Auto · Studio · Outdoors · City street · Indoors · Garden · Beach<br>Lighting: Auto · Soft daylight · Golden hour · Studio · Moody · Bright & airy |
| `renaissance-portrait` | Framing: Auto · Head & shoulders · Half body · Full body<br>Strength: Auto · Subtle · Strong |
| `restore-old-photos` | Colour: Auto · Keep black & white · Colourise naturally · Vivid colour<br>Strength: Auto · Subtle · Noticeable · Full |
| `retro-bollywood` | Framing: Auto · Head & shoulders · Half body · Full body<br>Strength: Auto · Subtle · Strong |
| **`saree-photoshoot`** | Saree colour: Auto · Deep red · Royal blue · Emerald green · Black & gold · Pastel pink · Ivory & gold<br>Setting: Auto · Studio · Outdoors · City street · Indoors · Garden · Beach |
| **`superhero-costume`** | Costume colours: Auto · Red & gold · Blue & red · Black stealth · Green · White & silver<br>Framing: Auto · Head & shoulders · Half body · Full body |
| `tarot-card-portrait` | Framing: Auto · Head & shoulders · Half body · Full body<br>Strength: Auto · Subtle · Strong |
| **`thanksgiving-photoshoot`** | Scene: Auto · By the tree · By the fire · At the table · Outside in the snow · Studio |
| **`wedding-invite-photo`** | Text on the image *(type it)* |
| `y2k-aesthetic` | Framing: Auto · Head & shoulders · Half body · Full body<br>Strength: Auto · Subtle · Strong |

## Headshots — 12

| App | Options |
| --- | --- |
| `actor-headshot` | Attire: Auto · Suit & tie · Blazer, no tie · Smart casual · Shirt & sweater · Keep my clothes<br>Background: Auto · Neutral grey · Plain white · Office, blurred · Outdoor · Dark |
| **`add-suit-to-photo`** | Suit: Navy, with tie · Charcoal, with tie · Black, with tie · Navy, no tie · Light grey |
| `ai-headshot-generator` | Attire: Auto · Suit & tie · Blazer, no tie · Smart casual · Shirt & sweater · Keep my clothes<br>Background: Auto · Neutral grey · Plain white · Office, blurred · Outdoor · Dark |
| `business-headshot` | Attire: Auto · Suit & tie · Blazer, no tie · Smart casual · Shirt & sweater · Keep my clothes<br>Background: Auto · Neutral grey · Plain white · Office, blurred · Outdoor · Dark |
| `celebrity-headshot` | Attire: Auto · Suit & tie · Blazer, no tie · Smart casual · Shirt & sweater · Keep my clothes<br>Background: Auto · Neutral grey · Plain white · Office, blurred · Outdoor · Dark |
| `ceo-headshot` | Attire: Auto · Suit & tie · Blazer, no tie · Smart casual · Shirt & sweater · Keep my clothes<br>Background: Auto · Neutral grey · Plain white · Office, blurred · Outdoor · Dark |
| **`doctor-headshot`** | Attire: Auto · White coat · Coat over scrubs · Scrubs · Suit, no coat · Keep my clothes<br>Background: Auto · Neutral grey · Plain white · Office, blurred · Outdoor · Dark |
| **`eras-headshot`** | Suit: Navy, with tie · Charcoal, with tie · Black, with tie · Navy, no tie · Light grey<br>Background: Plain white · Light grey · Light blue |
| `lawyer-headshot` | Attire: Auto · Suit & tie · Blazer, no tie · Smart casual · Shirt & sweater · Keep my clothes<br>Background: Auto · Neutral grey · Plain white · Office, blurred · Outdoor · Dark |
| `linkedin-headshot` | Attire: Auto · Suit & tie · Blazer, no tie · Smart casual · Shirt & sweater · Keep my clothes<br>Background: Auto · Neutral grey · Plain white · Office, blurred · Outdoor · Dark |
| `outdoor-headshot` | Attire: Auto · Suit & tie · Blazer, no tie · Smart casual · Shirt & sweater · Keep my clothes<br>Background: Auto · Neutral grey · Plain white · Office, blurred · Outdoor · Dark |
| `real-estate-headshot` | Attire: Auto · Suit & tie · Blazer, no tie · Smart casual · Shirt & sweater · Keep my clothes<br>Background: Auto · Neutral grey · Plain white · Office, blurred · Outdoor · Dark |

## Portraits — 12

| App | Options |
| --- | --- |
| `aesthetic-photo-editor` | Setting: Auto · Studio · Outdoors · City street · Indoors · Garden · Beach<br>Lighting: Auto · Soft daylight · Golden hour · Studio · Moody · Bright & airy |
| `ai-photoshoot` | Setting: Auto · Studio · Outdoors · City street · Indoors · Garden · Beach<br>Lighting: Auto · Soft daylight · Golden hour · Studio · Moody · Bright & airy |
| `ai-selfie-generator` | Setting: Auto · Studio · Outdoors · City street · Indoors · Garden · Beach<br>Lighting: Auto · Soft daylight · Golden hour · Studio · Moody · Bright & airy |
| `anniversary-photo-editor` | Setting: Auto · Studio · Outdoors · City street · Indoors · Garden · Beach<br>Lighting: Auto · Soft daylight · Golden hour · Studio · Moody · Bright & airy |
| `birthday-photo-editor` | Setting: Auto · Studio · Outdoors · City street · Indoors · Garden · Beach<br>Lighting: Auto · Soft daylight · Golden hour · Studio · Moody · Bright & airy |
| **`dress-photo-editor`** | Describe the outfit *(type it)*<br>Setting: Auto · Studio · Outdoors · City street · Indoors · Garden · Beach |
| `fashion-photo-editor` | Setting: Auto · Studio · Outdoors · City street · Indoors · Garden · Beach<br>Lighting: Auto · Soft daylight · Golden hour · Studio · Moody · Bright & airy |
| `maternity-photoshoot` | Setting: Auto · Studio · Outdoors · City street · Indoors · Garden · Beach<br>Lighting: Auto · Soft daylight · Golden hour · Studio · Moody · Bright & airy |
| **`outfit-generator`** | Describe the outfit *(type it)*<br>Setting: Auto · Studio · Outdoors · City street · Indoors · Garden · Beach |
| **`profile-picture-maker`** | Background: Auto · Solid colour · Gradient · Blurred scene · Transparent<br>Crop: Auto · Circle-safe · Tight on the face · Head & shoulders |
| **`saree-photo-editor`** | Saree colour: Auto · Deep red · Royal blue · Emerald green · Black & gold · Pastel pink · Ivory & gold<br>Setting: Auto · Studio · Outdoors · City street · Indoors · Garden · Beach |
| `travel-photo-editor` | Setting: Auto · Studio · Outdoors · City street · Indoors · Garden · Beach<br>Lighting: Auto · Soft daylight · Golden hour · Studio · Moody · Bright & airy |

## Art & styles — 29

| App | Options |
| --- | --- |
| **`ai-art-generator`** | Describe what you want *(type it)*<br>Strength: Auto · Subtle · Strong |
| `ai-fairy-filter` | Framing: Auto · Head & shoulders · Half body · Full body<br>Strength: Auto · Subtle · Strong |
| `ai-mermaid-filter` | Framing: Auto · Head & shoulders · Half body · Full body<br>Strength: Auto · Subtle · Strong |
| **`ai-painter`** | Describe what you want *(type it)*<br>Strength: Auto · Subtle · Strong |
| **`ai-pokemon-generator`** | Describe what you want *(type it)* |
| **`ai-tattoo-generator`** | Style: Fine line · Traditional · Blackwork · Realism · Watercolour<br>Placement: Forearm · Shoulder · Upper back · Ankle · Collarbone |
| `ai-vampire` | Framing: Auto · Head & shoulders · Half body · Full body<br>Strength: Auto · Subtle · Strong |
| `ai-vtuber-maker` | Framing: Auto · Head & shoulders · Half body · Full body<br>Strength: Auto · Subtle · Strong |
| `ai-webtoon-generator` | Framing: Auto · Head & shoulders · Half body · Full body<br>Strength: Auto · Subtle · Strong |
| **`birth-flower-tattoo`** | Birth month: January — carnation · February — violet · March — daffodil · April — daisy · May — lily of the valley · June — rose · July — larkspur · August — gladiolus · September — aster · October — marigold · November — chrysanthemum · December — narcissus<br>Placement: Forearm · Shoulder · Upper back · Ankle · Collarbone |
| `caricature-maker` | Framing: Auto · Head & shoulders · Half body · Full body<br>Strength: Auto · Subtle · Strong |
| `cartoon-generator` | Framing: Auto · Head & shoulders · Half body · Full body<br>Strength: Auto · Subtle · Strong |
| `coloring-page-generator` | Framing: Auto · Head & shoulders · Half body · Full body<br>Strength: Auto · Subtle · Strong |
| `comic-generator` | Framing: Auto · Head & shoulders · Half body · Full body<br>Strength: Auto · Subtle · Strong |
| `ghibli-style-generator` | Framing: Auto · Head & shoulders · Half body · Full body<br>Strength: Auto · Subtle · Strong |
| `glitch-effect` | Framing: Auto · Head & shoulders · Half body · Full body<br>Strength: Auto · Subtle · Strong |
| `goth-generator` | Framing: Auto · Head & shoulders · Half body · Full body<br>Strength: Auto · Subtle · Strong |
| `image-to-emoji` | Framing: Auto · Head & shoulders · Half body · Full body<br>Strength: Auto · Subtle · Strong |
| `photo-to-anime` | Framing: Auto · Head & shoulders · Half body · Full body<br>Strength: Auto · Subtle · Strong |
| `photo-to-illustration` | Framing: Auto · Head & shoulders · Half body · Full body<br>Strength: Auto · Subtle · Strong |
| `photo-to-oil-painting` | Framing: Auto · Head & shoulders · Half body · Full body<br>Strength: Auto · Subtle · Strong |
| `pixar-filter` | Framing: Auto · Head & shoulders · Half body · Full body<br>Strength: Auto · Subtle · Strong |
| **`pixel-art-generator`** | Pixel size: Auto · Chunky 8-bit · 16-bit · Detailed |
| `silhouette-maker` | Framing: Auto · Head & shoulders · Half body · Full body<br>Strength: Auto · Subtle · Strong |
| `south-park-style` | Framing: Auto · Head & shoulders · Half body · Full body<br>Strength: Auto · Subtle · Strong |
| **`stardew-profile-maker`** | Pixel size: Auto · Chunky 8-bit · 16-bit · Detailed |
| `stencil-maker` | Framing: Auto · Head & shoulders · Half body · Full body<br>Strength: Auto · Subtle · Strong |
| **`superhero-generator`** | Costume colours: Auto · Red & gold · Blue & red · Black stealth · Green · White & silver<br>Framing: Auto · Head & shoulders · Half body · Full body |
| **`text-to-emoji`** | Describe what you want *(type it)* |

## Retouch — 29

| App | Options |
| --- | --- |
| **`abs-filter`** | Build: Lightly toned · Athletic · Muscular |
| **`add-glasses-to-photo`** | Frames: Round metal · Square acetate · Rimless · Cat-eye · Aviator sunglasses · Sport |
| `bald-filter` | Strength: Auto · Subtle · Noticeable · Full |
| **`bangs-filter`** | Fringe shape: Blunt · Curtain · Side-swept · Wispy · Micro |
| **`beard-filter`** | Beard: Stubble · Short boxed · Full beard · Goatee · Moustache only · Van Dyke |
| `blemish-remover` | Strength: Auto · Subtle · Noticeable · Full |
| **`blonde-hair-filter`** | Shade: Golden · Platinum · Ash · Honey · Strawberry · Balayage |
| **`braces-filter`** | Braces: Metal · Ceramic / clear · Coloured bands · Clear aligner |
| `brighten-image` | Strength: Auto · Subtle · Noticeable · Full |
| `buzz-cut-filter` | Strength: Auto · Subtle · Noticeable · Full |
| **`color-splash`** | What keeps its colour? \* *(type it)* |
| **`curly-hair-filter`** | Curl type: Loose waves · Defined curls · Tight coils · Beach curls |
| `darken-image` | Strength: Auto · Subtle · Noticeable · Full |
| **`eye-color-changer`** | Eye colour: Blue · Green · Hazel · Light brown · Dark brown · Grey · Amber |
| **`eyebrow-filter`** | Brow shape: Natural · Soft arch · Straight · Thick & full · Thin & defined |
| **`face-expression-changer`** | Expression: Happy · Serious · Surprised · Calm · Confident |
| **`hair-color-changer`** | Hair colour: Blonde · Platinum · Light brown · Dark brown · Black · Auburn · Copper red · Silver grey · Pastel pink · Blue |
| **`hairstyle-changer`** | Hairstyle: Long & straight · Long & wavy · Shoulder bob · Pixie crop · Natural curls · Ponytail · Bun · Side part & quiff · Braids |
| `invert-image-color` | — |
| **`long-hair-filter`** | Length: Shoulder length · Mid-back · Waist length |
| **`muscle-generator`** | Build: Lightly toned · Athletic · Muscular |
| `no-beard-filter` | Strength: Auto · Subtle · Noticeable · Full |
| `photo-color-correction` | Strength: Auto · Subtle · Noticeable · Full |
| `photo-retouching` | Strength: Auto · Subtle · Noticeable · Full |
| **`piercing-filter`** | Piercing: Ear lobe · Helix · Nose stud · Septum · Eyebrow · Lip |
| **`recolor-image`** | What, and to what colour? \* *(type it)* |
| `red-eye-remover` | Strength: Auto · Subtle · Noticeable · Full |
| `sad-face-filter` | Strength: Auto · Subtle · Noticeable · Full |
| **`smile-filter`** | Smile: Subtle, closed-lip · Natural · Broad |

## Restore — 7

| App | Options |
| --- | --- |
| **`black-and-white-to-color`** | Colour: Auto · Keep black & white · Colourise naturally · Vivid colour |
| **`colorize-photo`** | Colour: Auto · Keep black & white · Colourise naturally · Vivid colour |
| `denoise-image` | Colour: Auto · Keep black & white · Colourise naturally · Vivid colour<br>Strength: Auto · Subtle · Noticeable · Full |
| `image-sharpener` | Colour: Auto · Keep black & white · Colourise naturally · Vivid colour<br>Strength: Auto · Subtle · Noticeable · Full |
| `old-photo-restoration` | Colour: Auto · Keep black & white · Colourise naturally · Vivid colour<br>Strength: Auto · Subtle · Noticeable · Full |
| `unblur-image` | Colour: Auto · Keep black & white · Colourise naturally · Vivid colour<br>Strength: Auto · Subtle · Noticeable · Full |
| `unpixelate-image` | Colour: Auto · Keep black & white · Colourise naturally · Vivid colour<br>Strength: Auto · Subtle · Noticeable · Full |

## Backgrounds — 9

| App | Options |
| --- | --- |
| **`ai-interior-design`** | Interior style: Auto · Modern minimal · Scandinavian · Industrial · Mid-century · Boho · Luxury<br>Time of day: Auto · Bright daylight · Golden evening · Twilight |
| **`architecture-photo-editor`** | Time of day: Auto · Bright daylight · Golden evening · Twilight |
| `background-generator` | Background: Auto · Transparent · Plain white · Studio grey · Office · Outdoor · Gradient · Blur the original |
| `background-remover` | Background: Auto · Transparent · Plain white · Studio grey · Office · Outdoor · Gradient · Blur the original |
| `blur-background` | Background: Auto · Transparent · Plain white · Studio grey · Office · Outdoor · Gradient · Blur the original |
| **`house-photo-editor`** | Time of day: Auto · Bright daylight · Golden evening · Twilight |
| **`interior-photo-editor`** | Interior style: Auto · Modern minimal · Scandinavian · Industrial · Mid-century · Boho · Luxury<br>Time of day: Auto · Bright daylight · Golden evening · Twilight |
| **`room-design`** | Interior style: Auto · Modern minimal · Scandinavian · Industrial · Mid-century · Boho · Luxury<br>Time of day: Auto · Bright daylight · Golden evening · Twilight |
| `white-background-remover` | Background: Auto · Transparent · Plain white · Studio grey · Office · Outdoor · Gradient · Blur the original |

## Clean up — 9

| App | Options |
| --- | --- |
| `blur-face` | Fill the gap with: Auto · What was behind it · A clean surface |
| **`emoji-remover`** | What should go? *(type it)* |
| `license-plate-blur` | Fill the gap with: Auto · What was behind it · A clean surface |
| `mirror-image` | Fill the gap with: Auto · What was behind it · A clean surface |
| **`object-remover`** | What should go? *(type it)*<br>Fill the gap with: Auto · What was behind it · A clean surface |
| **`remove-people-from-photo`** | What should go? *(type it)*<br>Fill the gap with: Auto · What was behind it · A clean surface |
| `remove-shadow-from-photo` | Fill the gap with: Auto · What was behind it · A clean surface |
| **`remove-text-from-image`** | What should go? *(type it)* |
| **`watermark-remover-ai`** | What should go? *(type it)* |

## Enhance — 5

| App | Options |
| --- | --- |
| `4k-image-upscaler` | Enlarge by: Auto · 2× · 4×<br>Finish: Auto · Natural · Crisp · Print-ready |
| `hd-photo-converter` | Enlarge by: Auto · 2× · 4×<br>Finish: Auto · Natural · Crisp · Print-ready |
| `image-enlarger` | Enlarge by: Auto · 2× · 4×<br>Finish: Auto · Natural · Crisp · Print-ready |
| `image-upscaler` | Enlarge by: Auto · 2× · 4×<br>Finish: Auto · Natural · Crisp · Print-ready |
| `png-maker` | Enlarge by: Auto · 2× · 4×<br>Finish: Auto · Natural · Crisp · Print-ready |

## Product & business — 17

| App | Options |
| --- | --- |
| `ai-ads-generator` | Background: Auto · White sweep · Studio · Lifestyle · Marble · Outdoor · Colour pop<br>Lighting: Auto · Soft daylight · Golden hour · Studio · Moody · Bright & airy |
| `ai-product-photography` | Background: Auto · White sweep · Studio · Lifestyle · Marble · Outdoor · Colour pop<br>Lighting: Auto · Soft daylight · Golden hour · Studio · Moody · Bright & airy |
| `amazon-product-editor` | Background: Auto · White sweep · Studio · Lifestyle · Marble · Outdoor · Colour pop<br>Lighting: Auto · Soft daylight · Golden hour · Studio · Moody · Bright & airy |
| **`bike-photo-editor`** | Setting: Auto · Studio · Mountain road · City at night · Showroom |
| **`car-photo-editor`** | Setting: Auto · Studio · Mountain road · City at night · Showroom |
| `ecommerce-product-editor` | Background: Auto · White sweep · Studio · Lifestyle · Marble · Outdoor · Colour pop<br>Lighting: Auto · Soft daylight · Golden hour · Studio · Moody · Bright & airy |
| **`food-photo-editor`** | Setting: Auto · Overhead on marble · Rustic wood · Restaurant table · Dark & moody |
| `image-editor-for-beauty` | Background: Auto · White sweep · Studio · Lifestyle · Marble · Outdoor · Colour pop<br>Lighting: Auto · Soft daylight · Golden hour · Studio · Moody · Bright & airy |
| `image-editor-for-electronics` | Background: Auto · White sweep · Studio · Lifestyle · Marble · Outdoor · Colour pop<br>Lighting: Auto · Soft daylight · Golden hour · Studio · Moody · Bright & airy |
| `image-editor-for-home-decor` | Background: Auto · White sweep · Studio · Lifestyle · Marble · Outdoor · Colour pop<br>Lighting: Auto · Soft daylight · Golden hour · Studio · Moody · Bright & airy |
| **`image-editor-for-hotels`** | Interior style: Auto · Modern minimal · Scandinavian · Industrial · Mid-century · Boho · Luxury<br>Time of day: Auto · Bright daylight · Golden evening · Twilight |
| `image-editor-for-jewelry` | Background: Auto · White sweep · Studio · Lifestyle · Marble · Outdoor · Colour pop<br>Lighting: Auto · Soft daylight · Golden hour · Studio · Moody · Bright & airy |
| **`image-editor-for-real-estate`** | Interior style: Auto · Modern minimal · Scandinavian · Industrial · Mid-century · Boho · Luxury<br>Time of day: Auto · Bright daylight · Golden evening · Twilight |
| **`image-editor-for-restaurants`** | Interior style: Auto · Modern minimal · Scandinavian · Industrial · Mid-century · Boho · Luxury<br>Time of day: Auto · Bright daylight · Golden evening · Twilight |
| `marketing-creative-editor` | Background: Auto · White sweep · Studio · Lifestyle · Marble · Outdoor · Colour pop<br>Lighting: Auto · Soft daylight · Golden hour · Studio · Moody · Bright & airy |
| `product-photoshoot` | Background: Auto · White sweep · Studio · Lifestyle · Marble · Outdoor · Colour pop<br>Lighting: Auto · Soft daylight · Golden hour · Studio · Moody · Bright & airy |
| **`truck-photo-editor`** | Setting: Auto · Studio · Mountain road · City at night · Showroom |

## Social — 17

| App | Options |
| --- | --- |
| **`album-cover-generator`** | Name to use *(type it)*<br>Genre: Auto · Pop · Hip-hop · Rock · Electronic · Indie folk · Jazz · Metal |
| **`book-cover-generator`** | Name to use *(type it)*<br>Genre: Auto · Thriller · Romance · Sci-fi · Fantasy · Horror · Literary · Non-fiction |
| **`discord-pfp-maker`** | Background: Auto · Solid colour · Gradient · Blurred scene · Transparent<br>Crop: Auto · Circle-safe · Tight on the face · Head & shoulders |
| **`facebook-pfp-maker`** | Background: Auto · Solid colour · Gradient · Blurred scene · Transparent<br>Crop: Auto · Circle-safe · Tight on the face · Head & shoulders |
| **`fish-eye-pfp`** | Background: Auto · Solid colour · Gradient · Blurred scene · Transparent<br>Crop: Auto · Circle-safe · Tight on the face · Head & shoulders |
| **`gaming-logo-maker`** | Name to use *(type it)*<br>Logo style: Auto · Wordmark · Icon & text · Badge · Mascot · Minimal |
| **`icon-generator`** | Name to use *(type it)*<br>Logo style: Auto · Wordmark · Icon & text · Badge · Mascot · Minimal |
| **`instagram-pfp-maker`** | Background: Auto · Solid colour · Gradient · Blurred scene · Transparent<br>Crop: Auto · Circle-safe · Tight on the face · Head & shoulders |
| `instagram-photo-editor` | Look: Auto · Bold · Clean · Dark mode<br>Text space: Auto · Leave room for text · Fill the frame |
| **`linkedin-banner-maker`** | Text on the image *(type it)*<br>Look: Auto · Bold · Clean · Dark mode |
| **`linkedin-pfp-maker`** | Background: Auto · Solid colour · Gradient · Blurred scene · Transparent<br>Crop: Auto · Circle-safe · Tight on the face · Head & shoulders |
| **`logo-maker`** | Name to use *(type it)*<br>Logo style: Auto · Wordmark · Icon & text · Badge · Mascot · Minimal |
| **`movie-poster-generator`** | Name to use *(type it)*<br>Genre: Auto · Action · Thriller · Sci-fi · Horror · Romance · Comedy · Drama |
| **`roblox-pfp-maker`** | Background: Auto · Solid colour · Gradient · Blurred scene · Transparent<br>Crop: Auto · Circle-safe · Tight on the face · Head & shoulders |
| **`thumbnail-maker`** | Text on the image *(type it)*<br>Reaction: Auto · Excited · Shocked · Serious · Happy |
| **`youtube-pfp-maker`** | Background: Auto · Solid colour · Gradient · Blurred scene · Transparent<br>Crop: Auto · Circle-safe · Tight on the face · Head & shoulders |
| **`youtube-thumbnail-generator`** | Text on the image *(type it)*<br>Reaction: Auto · Excited · Shocked · Serious · Happy |

## For fun — 12

| App | Options |
| --- | --- |
| **`1980s-photo-trend`** | Look: Mall studio portrait · Prom night · Band promo · Family portrait · Holiday snapshot |
| **`action-figure-generator`** | Presentation: In its box · On a display base · On a desk · In a scene |
| **`age-progression-tool`** | Age them to: 30s · 40s · 50s · 60s · 70s · 80s |
| **`ai-avatar-generator`** | Background: Auto · Solid colour · Gradient · Blurred scene · Transparent<br>Crop: Auto · Circle-safe · Tight on the face · Head & shoulders |
| **`ai-character-generator`** | Describe what you want *(type it)*<br>Framing: Auto · Head & shoulders · Half body · Full body |
| **`ai-time-machine`** | Decade: 1990s · 1980s · 1970s · 1960s · 1950s · 1920s · 2000s |
| **`ai-yearbook-generator`** | Backdrop: Laser grid · Mottled blue · Marbled grey · Gradient sunset · Library |
| `aura-farm-horse` | Strength: Auto · Subtle · Strong |
| **`baby-face-filter`** | Make them look: A toddler · A young child · A pre-teen · A teenager |
| **`funko-figure-maker`** | Presentation: In its box · On a display base · On a desk · In a scene |
| `glow-up-editor` | Strength: Auto · Subtle · Strong |
| **`old-filter`** | Age them to: 80s · 70s · 60s · 50s · 40s · 30s |


## Numeric options (sliders)

`kind: "number"` renders a slider with the value spelled out beside it. It
carries `min`, `max`, `step`, `initial`, a `format(n)` for the readout and a
`phraseFor(n)` that produces the sentence appended to the prompt.

`phraseFor` is a function, not a `{value}` template, because a number on its own
is a weak instruction. Asked to make someone "62", the model tends to return the
same non-specific middle-aged face it returns for 48. `ageAppearance()` names
what actually changes at that age, which is the whole point of having the
control.

The value arrives as a string from a form control and, server-side, from a
request body — so `clampNumber()` rejects anything non-numeric and pins the rest
inside the declared range. A stale or hand-edited value cannot put an arbitrary
number, or arbitrary text, into a prompt.

### Age progression

The six fixed decades are gone. "What do I look like at 34?" used to be answered
with "pick 30s or 40s". The slider runs **1 to 100**, so the app de-ages as
readily as it ages — which meant the base prompt had to change too: it said
"natural greying hair", which contradicts a target of eight. It now asks for
whatever is appropriate to the age given, and the phrase says *"not older, not
younger"* explicitly, because "age this person to 8" is a contradiction the
model resolves by ignoring half of it.

`old-filter` uses the same control with a 40–100 range: that app only ever ages
upward, and offering to de-age there would contradict the page it sits on.


## Preview fidelity and prompt review inventory (dev)

The app-specific prompt is the primary visual target because each app has its own before/after creative. It defines the recognizable transformation, scene, styling, clothing, palette, and composition. Selected presets and customization options should refine only their named attributes; multiple selected options are all included in the same final prompt.

The shared prompt contract now emphasizes stable facial geometry and identity, natural skin texture, realistic anatomy/lighting for photographic outputs, and consistent likeness within the requested artistic medium for intentionally stylized apps. Group mode explicitly instructs the model not to merge or replace different faces.

Prompt composition sources:
- App-specific base transformation: `src/lib/app-catalog.ts` (catalogue apps) and `src/lib/creative-apps.ts` (curated apps).
- Exact parameter options and phrases: `src/lib/app-options.ts`.
- App preview/preset refinements and combination logic: `src/lib/app-presets.ts`.
- Identity, staging mode, medium, and output constraints: `src/lib/staging.ts`.

### Per-app inventory

The third column lists available controls; when a user chooses several parameters, all their phrases are appended to that app's base prompt. The second column is a shortened description of the app's base transformation, not the entire runtime prompt.

| App | Base transformation prompt (summary) | Customization parameters |
| --- | --- | --- |
| `ai-headshot-generator` — AI Headshot Generator | Turn this into a professional studio headshot, framed from the chest up at eye level, with a composed, confident expression and a gentle smile. Keep their own hair and hairstyle, just neatly groome… | attire, background |
| `linkedin-headshot` — LinkedIn Headshot Maker | Produce a LinkedIn-appropriate headshot: smart-casual business dress, a softly blurred office or outdoor background, natural approachable expression, framed head-and-shoulders. | attire, background |
| `ceo-headshot` — CEO Headshot Generator | Produce an executive leadership portrait, framed from the chest up, with an authoritative, settled posture and a calm, assured expression. Keep their own hair and hairstyle, just neatly groomed. Un… | attire, background |
| `actor-headshot` — Actor Headshot Generator | Produce a theatrical casting headshot, framed from the chest up, square to the camera at eye level, with direct eye contact and a relaxed, natural expression and a slight smile that a casting direc… | attire, background |
| `doctor-headshot` — Doctor Headshot Generator | Produce a medical professional headshot, framed from the chest up, with a calm, reassuring smile. Keep their own hair and hairstyle, just neatly groomed. Unless attire is given below, dress them in… | clinical attire, headshot background |
| `lawyer-headshot` — Lawyer Headshot Generator | Produce a legal professional headshot: dark conservative suit, formal lighting, a law-library or panelled-office background softly out of focus, and a composed, credible expression. | attire, background |
| `real-estate-headshot` — Realtor Headshot Generator | Produce a real-estate agent headshot: smart-casual blazer, warm natural light, a softly blurred residential or streetscape background, and a friendly, open expression. | attire, background |
| `business-headshot` — Business Headshot Generator | Produce a corporate business headshot, framed from the chest up at eye level, with upright professional posture and a warm, confident half-smile. Keep their own hair and hairstyle, just neatly groo… | attire, background |
| `outdoor-headshot` — Outdoor Headshot Generator | Produce an outdoor headshot in natural daylight: soft open shade or golden-hour light, greenery or architecture blurred well behind the subject, relaxed and genuine expression. | attire, background |
| `eras-headshot` — ERAS Application Headshot | Produce a conservative medical-residency application portrait: plain dark suit, plain light background, flat even lighting with no shadow on the face, neutral expression, head and shoulders centred. | suit style, ID background |
| `add-suit-to-photo` — Add a Suit to Your Photo | Replace the clothing with a well-fitted formal suit, shirt and tie appropriate to the person, matching the collar and shoulder line naturally to their build and the photo's lighting. Change only th… | suit style |
| `celebrity-headshot` — Glamour Headshot Generator | Produce a glamour studio portrait in the style of a magazine cover shoot, framed from the chest up, with a poised, confident editorial expression. Keep their own hair colour and length, styled glos… | attire, background |
| `ai-photoshoot` — AI Photoshoot Generator | Turn this snapshot into a frame from a professional fashion photoshoot, taken by a photographer standing several metres away — not a selfie: no outstretched arm, no phone, no close wide-angle disto… | setting, lighting |
| `ai-selfie-generator` — AI Selfie Generator | Turn this into a candid lifestyle photo, as if a friend took it from across a café table — not an outstretched-arm selfie. Frame it from the chest up: the person seated at a sunny café table with a… | setting, lighting |
| `profile-picture-maker` — Profile Picture Maker | Turn this into a polished profile picture, framed head and shoulders with the face centred and even margins, and a warm, natural smile. Keep their own hair and hairstyle, neatly groomed, and dress … | profile background, profile crop |
| `outfit-generator` — AI Outfit Changer | Give them a completely new, stylish outfit and photograph them in a setting that suits it, framed from the waist up. Unless an outfit is described below, dress them in an emerald-green satin slip d… | custom outfit, setting |
| `saree-photo-editor` — AI Saree Photo Editor | Dress the person in an elegant silk saree with authentic drape and pleating, full length from head to toe so the whole saree is visible. Unless a colour is given below, make it emerald green with a… | saree colour, setting |
| `dress-photo-editor` — AI Dress Photo Editor | Restage this as an elegant evening photograph, full length from head to toe so the whole outfit is visible, in a poised, relaxed pose. Unless an outfit is described below, dress them in a wine-red … | custom outfit, setting |
| `maternity-photoshoot` — Maternity Photoshoot Editor | Restage this as a gentle maternity portrait: flowing fabric, soft directional window light, a warm neutral setting, and a calm, tender expression with hands placed naturally. | setting, lighting |
| `birthday-photo-editor` — Birthday Photo Editor | Restage this as a styled birthday photo, framed from the chest up: the person seated at a table with a frosted birthday cake and lit candles in the foreground, resting their chin on one hand with a… | setting, lighting |
| `anniversary-photo-editor` — Anniversary Photo Editor | Restage this as a romantic anniversary portrait. If there are two people, show them as a couple standing close in an affectionate embrace, framed from the thighs up with both faces clearly visible;… | setting, lighting |
| `fashion-photo-editor` — Fashion Photo Editor | Restage this as a fashion editorial photograph, full length from head to toe, in a confident, relaxed model pose. Dress them in an elegant cream look: a long-sleeve square-neck midi dress with a si… | setting, lighting |
| `aesthetic-photo-editor` — Aesthetic Photo Editor | Restage this as an aesthetic lifestyle photo with a warm, film-like look, full length from head to toe, in a relaxed, natural pose. Dress them in a chic neutral outfit: a long camel coat over a cre… | setting, lighting |
| `travel-photo-editor` — Travel Photo Editor | Restage this as a dreamy travel photo, framed from the knees up, with a relaxed, happy pose. Dress them in a light terracotta sundress with a straw tote bag and their hair in a loose messy bun — fo… | setting, lighting |
| `ghibli-style-generator` — Ghibli Style Generator | Redraw this in the style of hand-painted Japanese animation: soft gouache-like skies with fluffy clouds, a warm naturalistic palette, gentle linework, painterly foliage and a quiet nostalgic atmosp… | framing, strength |
| `pixar-filter` — 3D Animation Filter | Restyle this as a still from a modern 3D animated feature: large expressive eyes, smooth stylised geometry, soft subsurface skin shading and warm cinematic lighting. | framing, strength |
| `photo-to-anime` — Photo to Anime Converter | Redraw this as an anime illustration: clean confident linework, cel shading with defined highlight and shadow blocks, expressive stylised eyes and vivid, glowing colour. | framing, strength |
| `cartoon-generator` — Cartoon Generator | Redraw this as a friendly cartoon illustration: bold clean outlines, bright flat colour with soft shading, simplified but recognisable features and a big warm smile. Keep their pose, clothes and ha… | framing, strength |
| `caricature-maker` — Caricature Maker | Draw this as a good-natured caricature in a bold, colourful hand-inked style: gently exaggerate the most characteristic features — a bigger smile, a slightly larger head — while keeping the person … | framing, strength |
| `photo-to-oil-painting` — Photo to Oil Painting | Repaint this as an oil painting: visible directional brush strokes, built-up impasto in the highlights, a classical warm palette, and canvas tooth showing through the thinner passages. | framing, strength |
| `photo-to-illustration` — Photo to Illustration | Redraw this as an editorial illustration: confident, sketchy ink contours with loose hatching and soft watercolour washes of colour, a light, airy palette and a printed-page quality. | framing, strength |
| `ai-webtoon-generator` — Webtoon Style Generator | Redraw this person as a webtoon character: clean lineart, soft airbrushed shading, glossy hair highlights, a gentle blush and a warm, sunny palette. Keep their own clothes and hairstyle, and pose t… | framing, strength |
| `comic-generator` — Comic Panel Generator | Redraw this as a comic-book panel: heavy ink outlines, halftone dot shading, saturated colour and hard rim light. | framing, strength |
| `pixel-art-generator` — Pixel Art Generator | Redraw this as pixel art: a limited palette, visible square pixels on a consistent grid, hard-edged dithering for gradients and shapes that read clearly. | pixel depth |
| `south-park-style` — Cut-Out Cartoon Maker | Redraw this in a flat cut-paper cartoon style: simple geometric shapes, a round head with big oval eyes, thick uniform outlines and completely flat colour with no shading. | framing, strength |
| `stardew-profile-maker` — Pixel Farm Avatar Maker | Redraw this as a cosy 16-bit farming-game portrait in pixel art: chunky pixels, a warm limited palette and simple shading blocks. Keep their clothes and whatever they are holding or doing, and set … | pixel depth |
| `ai-vtuber-maker` — VTuber Avatar Maker | Redraw this as a VTuber avatar in polished anime style: large expressive eyes, glossy hair turned a bright teal-blue with layered highlights, and a glowing cat-ear gaming headset with a microphone.… | framing, strength |
| `goth-generator` — Gothic Portrait Generator | Restyle this in a dark romantic gothic register: deep blacks, lace and velvet textures, pale cool-toned lighting, dramatic shadow and an ornate moody setting. | framing, strength |
| `ai-vampire` — Vampire Filter | Restyle this as a gothic vampire portrait: pale, cool-toned skin, subtle fangs and a faint red tint to the eyes, dressed in Victorian finery — a black velvet frock coat with a deep red lining and a… | framing, strength |
| `ai-fairy-filter` — Fairy Filter | Restyle this as an ethereal fairy portrait, keeping the person's pose and framing: delicate translucent wings, a crown of small wildflowers woven into their own hair, and a sheer pale-green gown em… | framing, strength |
| `ai-mermaid-filter` — Mermaid Filter | Create a fantasy mermaid portrait of this person as a lush, semi-realistic digital painting: an iridescent turquoise scaled tail, a top of pearls and shells, and a shell-and-pearl ornament in their… | framing, strength |
| `superhero-generator` — Superhero Generator | Restyle this as a superhero: a fitted original costume with believable panelling and material, heroic posture, dramatic rim lighting and a city skyline behind. | costume colours, framing |
| `renaissance-portrait` — Renaissance Portrait Maker | Repaint this as a Renaissance oil portrait: period dress, single-source chiaroscuro lighting, dark umber background, fine glazed skin rendering and an aged varnish quality. | framing, strength |
| `glitch-effect` — Glitch Effect Generator | Apply a digital glitch treatment: horizontal datamosh tearing, RGB channel separation, scanlines and block corruption artefacts, over a high-contrast cyberpunk grade. | framing, strength |
| `silhouette-maker` — Silhouette Maker | Reduce this to a clean silhouette: the subject rendered as a solid single-colour shape with a crisp readable contour, against a plain contrasting background. No interior detail. | framing, strength |
| `stencil-maker` — Stencil Maker | Convert this to a two-tone stencil: pure black and white only, simplified connected shapes with no floating islands, and a contour clean enough to cut. | framing, strength |
| `coloring-page-generator` — Coloring Page Maker | Convert this to a printable colouring page — the person and everything around them: clean uniform black outlines on pure white, no shading, grey or colour fills, simplified detail and closed shapes… | framing, strength |
| `ai-tattoo-generator` — Tattoo Design Generator | Add realistic tattoos of roses, leaves and ornamental shading to this person's skin, in the style and placement given below, as if they already had them when the photo was taken. The ink sits in th… | tattoo style, tattoo placement |
| `birth-flower-tattoo` — Birth Flower Tattoo Designer | Add a delicate fine-line tattoo of the birth flower given below to this person's skin, as if they already had it when the photo was taken: thin single-weight black linework, accurate flower structu… | tattoo placement |
| `ai-art-generator` — AI Art Generator | Reinterpret this as a fine-art painting. Unless a subject or style is described below, make it an impressionist oil painting: thick, broken dabs and strokes of colour, visible texture, warm light a… | subject description, transformation strength |
| `ai-painter` — AI Painting Generator | Repaint this as an impressionist oil painting with thick impasto brushwork and visible, broken strokes of colour. Keep the person's pose and clothes, and unless a subject is described below, place … | subject description, transformation strength |
| `ai-pokemon-generator` — Creature Designer | Design an original collectible creature inspired by this image, its fur, colours and attitude echoing the person: clean cel-shaded anime rendering, a coherent elemental theme, an expressive face, s… | subject description |
| `image-to-emoji` — Image to Emoji Maker | Turn this person into an emoji-style cartoon portrait, head and shoulders: bold simplified shapes that read at small sizes, flat saturated colour with simple shading, a thick clean outline and a bi… | framing, strength |
| `text-to-emoji` — Custom Emoji Maker | Create a single emoji-style icon: one clear subject, flat saturated colour, bold outline, centred composition, and instant readability at very small sizes. | subject description |
| `photo-retouching` — AI Photo Retouching | Retouch this portrait: even out skin tone and remove temporary blemishes while keeping pores and natural texture, balance the exposure, brighten the eyes slightly and tidy stray hair. Do not smooth… | retouch strength |
| `blemish-remover` — Blemish Remover | Remove temporary blemishes, spots and minor marks from the skin, matching surrounding tone and keeping pores, fine lines and natural texture fully intact. | retouch strength |
| `red-eye-remover` — Red Eye Remover | Correct red-eye caused by flash: restore natural pupil darkness and iris colour, keep the catchlight, and leave the rest of the face untouched. | retouch strength |
| `eye-color-changer` — Eye Color Changer | Change the iris colour as specified, keeping the natural iris texture, limbal ring, pupil and catchlight intact so the eyes still read as real. Change nothing else. | eye colour |
| `face-expression-changer` — Face Expression Changer | Adjust the facial expression as specified, moving the mouth, cheeks and eyes together the way real facial muscles do, so the change reads as genuine rather than pasted on. | expression |
| `smile-filter` — Smile Filter | Add a natural, genuine smile: raise the mouth corners, engage the cheeks and crease the eyes slightly the way a real smile does. Keep the teeth natural and unwhitened. | smile |
| `sad-face-filter` — Expression Filter — Sad | Change the expression to a subdued, downcast one: lower the mouth corners, soften the brow inward and slightly lower the eyelids, moving the whole face together. | retouch strength |
| `hairstyle-changer` — AI Hairstyle Changer | Change the hairstyle as specified, matching the hairline to the person's own, keeping the hair's natural texture and thickness plausible, and relighting it to match the photo. | hairstyle |
| `hair-color-changer` — Hair Color Changer | Change the hair colour as specified: adjust root-to-tip variation, keep strand detail and specular highlights, and match the colour temperature to the photo's lighting. | hair colour |
| `blonde-hair-filter` — Blonde Hair Filter | Change the hair to a natural blonde with believable root shadow, tonal variation between strands and warm specular highlights consistent with the photo's light. | blonde shade |
| `long-hair-filter` — Long Hair Filter | Extend the hair to the specified length, keeping its own texture and wave pattern, with natural fall over the shoulders and lighting that matches the photo. | hair length |
| `curly-hair-filter` — Curly Hair Filter | Change the hair to defined natural curls: consistent curl pattern and volume, believable root lift, and highlights that follow the curl spirals. | curl type |
| `bangs-filter` — Bangs Filter | Add a fringe in the specified shape, sitting correctly on the forehead with natural density, a believable parting and shadow where it falls. | fringe shape |
| `buzz-cut-filter` — Buzz Cut Filter | Change the hair to a short buzz cut at an even length, showing the real hairline and scalp tone through the stubble, with lighting consistent with the photo. | retouch strength |
| `bald-filter` — Bald Filter | Remove the hair to show a cleanly shaved head: correct skull shape, natural scalp tone and sheen, a believable residual hairline shadow, and matching light direction. | retouch strength |
| `beard-filter` — Beard Filter | Add a beard in the specified style, following the person's real jawline and natural growth pattern, with individual hair detail, believable density and matching lighting. | beard style |
| `no-beard-filter` — Beard Remover | Remove all facial hair to reveal a clean-shaven face: reconstruct the jaw, chin and upper-lip skin with tone and texture matching the surrounding face. | retouch strength |
| `eyebrow-filter` — Eyebrow Shape Filter | Reshape the eyebrows as specified, keeping individual hair detail and natural density, with a shape that suits the person's face and matches the photo's light. | brow shape |
| `braces-filter` — Braces Filter | Add realistic orthodontic braces to the visible teeth: correct bracket placement and spacing, a believable archwire, and metal specular highlights matching the lighting. | braces type |
| `add-glasses-to-photo` — Add Glasses to Photo | Add spectacles in the specified style: correctly positioned on the nose bridge and ears, with believable lens refraction, frame shadow on the face and reflections matching the light. | glasses |
| `piercing-filter` — Piercing Filter | Add the specified piercing at an anatomically correct placement, with metal specular highlights, a subtle contact shadow and scale appropriate to the face. | piercing |
| `muscle-generator` — Muscle Generator | Increase visible muscle definition in the arms, shoulders and chest, keeping proportions anatomically plausible and preserving the existing clothing fit and lighting. | body build |
| `abs-filter` — Six-Pack Filter | Add defined abdominal muscle definition with anatomically correct shading and highlight placement, consistent with the photo's existing light direction. | body build |
| `photo-color-correction` — Photo Color Correction | Colour-correct this image: neutralise the white balance, fix the black and white points, recover clipped highlight and shadow detail, and remove any colour cast. Keep the result natural. | retouch strength |
| `brighten-image` — Image Brightener | Brighten this underexposed image: lift shadows and midtones while protecting the highlights, control the noise that lifting reveals, and keep colour saturation natural. | retouch strength |
| `darken-image` — Image Darkener | Bring this overexposed image back into balance: recover the blown-out highlights and the colour in bright skies and skin, deepen the shadows slightly for richer contrast, and hold detail at both en… | retouch strength |
| `recolor-image` — Image Recolor Tool | Recolour the specified elements to the requested colours, keeping the original shading, texture and material behaviour so the change looks like it was always that colour. | recolour target |
| `invert-image-color` — Color Inverter | Invert the colours of this image to produce a photographic negative, preserving full tonal range and detail throughout. | App brief only |
| `color-splash` — Color Splash Effect | Desaturate the entire image to neutral monochrome except the specified subject, which keeps its full natural colour with a clean, precise boundary. | colour splash target |
| `old-photo-restoration` — Old Photo Restoration | Restore this damaged photograph: repair scratches, tears, creases and spotting, rebuild missing areas consistently with their surroundings, correct the fading and recover contrast and fine detail —… | colour treatment, retouch strength |
| `colorize-photo` — Photo Colorizer | Colourise this black-and-white photograph with historically plausible, naturally desaturated colour: believable skin tones, period-appropriate clothing and material colours, and consistent light te… | colour treatment |
| `black-and-white-to-color` — B&W to Color Converter | Add natural colour to this monochrome image, keeping the tonal structure of the original intact and choosing restrained, believable colours rather than saturated guesses. | colour treatment |
| `unblur-image` — Image Unblur Tool | Sharpen and deblur this image: recover edge definition and fine detail, counteract motion or focus blur, and avoid halos, ringing or over-sharpened texture. | colour treatment, retouch strength |
| `unpixelate-image` — Unpixelate Image | Reconstruct this pixelated image at higher fidelity: rebuild smooth edges and plausible fine detail from the visible block structure, without inventing features that contradict the original. | colour treatment, retouch strength |
| `denoise-image` — Image Denoiser | Remove digital noise and grain from this image while preserving genuine fine detail, edge sharpness and texture. Do not smear the result flat. | colour treatment, retouch strength |
| `image-sharpener` — Image Sharpener | Sharpen this image: increase acuity on genuine edges and detail, leave flat areas free of amplified noise, and avoid visible halos around high-contrast boundaries. | colour treatment, retouch strength |
| `image-upscaler` — AI Image Upscaler | Upscale this image substantially: reconstruct genuine fine detail in hair, fabric weave, skin texture and edges, suppress artefacts from the source compression, and keep the subject identical. | upscale amount, finish |
| `4k-image-upscaler` — 4K Image Upscaler | Upscale this image to a high pixel count suitable for print: rebuild edge and texture detail cleanly, remove compression artefacts, and keep noise controlled across flat areas. | upscale amount, finish |
| `image-enlarger` — Image Enlarger | Enlarge this small image with reconstructed detail rather than interpolation blur: sharp edges, plausible texture, and no visible upscaling artefacts. | upscale amount, finish |
| `hd-photo-converter` — HD Photo Converter | Convert this low-quality image to HD: increase resolution, recover detail and contrast, remove compression blocking and banding, and produce a clean modern-looking file. | upscale amount, finish |
| `png-maker` — Transparent PNG Maker | Isolate the main subject and place it on a fully transparent background: a precise edge including hair and fine detail, no residual fringing or halo from the old background. | upscale amount, finish |
| `background-remover` — AI Background Remover | Remove the background completely and make it transparent, keeping a precise subject edge through hair, fur and thin detail, with no colour fringing left behind. | background |
| `white-background-remover` — White Background Remover | Remove the white or near-white background and make it fully transparent, keeping soft shadow edges and thin detail intact without eating into the subject. | background |
| `background-generator` — AI Background Generator | Replace the background with the described scene — unless a background is given below, a sunny Mediterranean coastal path with flowers, old stone walls, a hillside village and the blue sea below — m… | background |
| `blur-background` — Background Blur Tool | Apply a believable shallow depth of field: keep the subject sharp, blur the background progressively with distance, and render the out-of-focus highlights as natural bokeh rather than a flat gaussi… | background |
| `room-design` — AI Room Redesign | Redesign this room: change the furniture, finishes, lighting and decor while keeping the architecture, window positions and camera perspective exactly as they are. Unless a style is given below, ma… | interior style, time of day |
| `ai-interior-design` — AI Interior Design | Produce an interior design visualisation of this space. Unless a style is given below, redesign it in a warm modern style: an upholstered bed or sofa in beige, an olive-green throw, a sage-green ac… | interior style, time of day |
| `interior-photo-editor` — Interior Photo Editor | Enhance this interior photograph: correct vertical lines and lens distortion, balance the mixed window and lamp lighting, recover window highlights and shadow detail, and render wall colours accura… | interior style, time of day |
| `house-photo-editor` — House Photo Editor | Enhance this property exterior: balance the sky and building exposure, deepen lawn and foliage colour naturally, correct converging verticals, and clean up distracting clutter. | time of day |
| `architecture-photo-editor` — Architecture Photo Editor | Enhance this architectural photograph: correct the perspective so verticals are true and, unless a time of day is given below, make it a bright clear day — a vivid blue sky with a few soft white cl… | time of day |
| `object-remover` — AI Object Remover | Remove the unwanted object — the one named below, or whatever is most obviously out of place if none is — and reconstruct what was behind it consistently with the surrounding texture, perspective a… | removal target, removal fill |
| `remove-people-from-photo` — Remove People from Photos | Remove the unwanted people and rebuild the scene behind them: continue the architecture, ground and background texture correctly through the gap, matching perspective and light. | removal target, removal fill |
| `watermark-remover-ai` — AI Watermark Remover | Remove the watermark, logo or stamp and reconstruct the image underneath it at the pixel level, matching texture, colour and light so no blur, smear or outline remains. For images you own or are li… | removal target |
| `remove-text-from-image` — Text Remover | Remove the text from this image and rebuild the surface beneath it, continuing the underlying pattern, texture and gradient so there is no trace of where it was. | removal target |
| `emoji-remover` — Emoji & Sticker Remover | Remove the emoji, sticker or overlay and reconstruct the covered area plausibly from the surrounding image, matching texture, tone and lighting. | removal target |
| `remove-shadow-from-photo` — Shadow Remover | Remove the unwanted shadow and even out the lighting across the surface, recovering the true colour and detail in the shadowed area without flattening the image's natural depth. | removal fill |
| `blur-face` — Face Blur Tool | Blur the faces in this image sufficiently to prevent identification, with a clean boundary that follows the head shape, leaving the rest of the photograph sharp and unaltered. | removal fill |
| `license-plate-blur` — License Plate Blur | Obscure the vehicle registration plates so the characters are unreadable, keeping the plate's shape and the rest of the vehicle sharp and unaltered. | removal fill |
| `mirror-image` — Mirror & Flip Image | Mirror this image horizontally, keeping all detail, sharpness and colour identical to the original. | removal fill |
| `product-photoshoot` — AI Product Photoshoot | Restage this product as a professional lifestyle studio photograph. Unless a background is given below, stand it on a travertine stone plinth with warm natural sunlight falling across it, soft leaf… | product background, lighting |
| `ai-product-photography` — AI Product Photography | Turn this into a professional commercial product photograph. Unless a background is given below, place it on a pure white seamless background with a soft natural contact shadow, centred with even m… | product background, lighting |
| `ecommerce-product-editor` — Ecommerce Photo Editor | Prepare this product image for an online store: pure white seamless background, the product centred with even margins, colour-accurate and sharp throughout, with a soft natural contact shadow. | product background, lighting |
| `amazon-product-editor` — Marketplace Photo Editor | Prepare this to marketplace listing standards: pure white background, the product filling most of the frame, no props or added text, accurate colour, and crisp edge detail. | product background, lighting |
| `image-editor-for-jewelry` — Jewelry Photo Editor | Enhance this jewellery photograph: clean dust and fingerprints, render metal with an accurate warm or cool tone and crisp specular highlights, and bring out gemstone brilliance and facet definition… | product background, lighting |
| `image-editor-for-beauty` — Beauty Product Editor | Enhance this cosmetics product shot: remove glare and dust, render the packaging finish accurately whether matte or glossy, and keep the label text perfectly legible. Unless a background is given b… | product background, lighting |
| `food-photo-editor` — Food Photo Editor | Turn this into an appetising, professional photograph of the same dish, keeping the food and the plate as served. Unless a setting is given below, place it on a rustic dark wooden table with a line… | food setting |
| `car-photo-editor` — Car Photo Editor | Turn this into a professional car photograph. Unless a setting is given below, place the car in front of a modern glass-fronted showroom at golden hour, on clean dark asphalt under a warm sunset sk… | vehicle setting |
| `bike-photo-editor` — Bike Photo Editor | Turn this into a professional motorcycle photograph. Unless a setting is given below, place the bike in a dark studio with tall vertical strips of warm light behind it and a polished concrete floor… | vehicle setting |
| `truck-photo-editor` — Truck Photo Editor | Turn this into a professional commercial vehicle photograph. Unless a setting is given below, place the truck on an open highway with motion blur on the road surface, snow-capped mountains and pine… | vehicle setting |
| `image-editor-for-real-estate` — Real Estate Photo Editor | Enhance this property photograph to listing standard: correct verticals, balance window and interior exposure, render wall and floor colour accurately and remove clutter. Unless a time of day is gi… | interior style, time of day |
| `image-editor-for-hotels` — Hotel Photo Editor | Enhance this hospitality photograph so the room looks its most inviting. Unless a time of day is given below, make it golden hour: warm sunset light through the windows, a glowing sunset sky in the… | interior style, time of day |
| `image-editor-for-restaurants` — Restaurant Photo Editor | Make this restaurant photo menu-ready. If it shows a dish, keep the food as served and style it as an appetising close-up on a warm wooden table with fitting side dishes, garnish and a textile napk… | interior style, time of day |
| `image-editor-for-electronics` — Electronics Photo Editor | Enhance this electronics product shot: clean the surfaces of dust and fingerprints, render screens without moiré or glare, and describe metal and matte plastic finishes accurately. Unless a backgro… | product background, lighting |
| `image-editor-for-home-decor` — Home Decor Photo Editor | Turn this into a styled home-decor photograph. Unless a background is given below, place the piece on a warm wooden side table in a cosy living room — a soft sofa with cushions, a couple of books a… | product background, lighting |
| `ai-ads-generator` — Ad Creative Generator | Turn this product photo into a polished advertising image. Unless a background is given below, stage the product on a glossy reflective surface surrounded by props that echo what it is — fresh flow… | product background, lighting |
| `marketing-creative-editor` — Marketing Creative Editor | Turn this product photo into a clean, premium marketing image. Unless a background is given below, place the product on a pure white seamless background with a soft natural shadow, evenly lit with … | product background, lighting |
| `thumbnail-maker` — Thumbnail Maker | Turn this into a high-impact video thumbnail: the person framed from the chest up with an excited, open-mouthed expression, pointing toward the empty side of the frame. Dress them in something bold… | image text, reaction |
| `youtube-thumbnail-generator` — YouTube Thumbnail Maker | Create a YouTube thumbnail: the person framed from the chest up with a shocked, excited expression, one hand pointing to the side, dressed in a bold yellow hoodie or another bright colour and sitti… | image text, reaction |
| `instagram-photo-editor` — Instagram Photo Editor | Edit this for an Instagram feed, keeping the scene, the person, their pose and their outfit: make the photo look its best, with bright sunny light, a clear blue sky wherever there is sky, warm glow… | social look, text space |
| `instagram-pfp-maker` — Instagram Profile Picture Maker | Create an eye-catching profile picture: the person framed head and shoulders and centred, with a warm, natural smile and flattering soft light, keeping their own outfit and hair. Unless a backgroun… | profile background, profile crop |
| `linkedin-pfp-maker` — LinkedIn Profile Picture Maker | Create a LinkedIn profile picture: business-appropriate dress, clean even lighting, a simple neutral or softly blurred background, an approachable expression, framed head-and-shoulders. | profile background, profile crop |
| `discord-pfp-maker` — Discord Avatar Maker | Create a Discord avatar of this person as a polished digital-art illustration in a modern anime-inspired style: clean linework, smooth cel shading and vivid colour, framed head and shoulders, keepi… | profile background, profile crop |
| `youtube-pfp-maker` — YouTube Profile Picture Maker | Create a YouTube channel profile picture: the person framed head and shoulders and centred, keeping their own outfit and hair, with a confident, friendly expression. Unless a background is given be… | profile background, profile crop |
| `facebook-pfp-maker` — Facebook Profile Picture Maker | Create a Facebook profile picture: natural flattering light, a friendly genuine expression, a simple uncluttered background, framed safely for a circular crop. | profile background, profile crop |
| `roblox-pfp-maker` — Game Avatar Maker | Create a blocky voxel-style game avatar of this person: built from simple cubes and blocks, with bright saturated colour and a clean, readable silhouette, their hair colour, skin tone, outfit and a… | profile background, profile crop |
| `fish-eye-pfp` — Fisheye PFP Maker | Recreate this as a playful fisheye-lens photo shot from very close with an ultra-wide fisheye lens: strong barrel distortion, the person leaning in toward the camera so their face and an outstretch… | profile background, profile crop |
| `linkedin-banner-maker` — LinkedIn Banner Maker | Create a wide professional LinkedIn banner photograph: the person on the left side, framed from the waist up, standing confidently on a rooftop terrace beside a modern glass building, dressed in a … | image text, social look |
| `album-cover-generator` — Album Cover Generator | Create square album cover artwork as a photograph of this person performing: singing into a vintage microphone with an acoustic guitar, caught mid-song with real emotion. Unless a genre is given be… | name, music genre |
| `movie-poster-generator` — Movie Poster Generator | Create a cinematic film poster starring this person, in a vertical one-sheet composition. Unless a genre is given below, make it an adventure epic: the person as a rugged hero in a worn leather jac… | name, film genre |
| `book-cover-generator` — Book Cover Generator | Create a book cover starring this person, shown as a finished hardback book standing upright on a wooden table and photographed as a product shot. Unless a genre is given below, make it an epic fan… | name, book genre |
| `logo-maker` — AI Logo Maker | Create a clean logo mark: simple geometry that stays legible at small size, a restrained two or three colour palette, balanced negative space, on a plain background. | name, logo style |
| `gaming-logo-maker` — Gaming Logo Maker | Create an esports-style logo: a bold aggressive mascot or emblem, heavy outlines, a strong two-tone accent palette, and a silhouette that reads on a stream overlay. | name, logo style |
| `icon-generator` — Icon Generator | Create an app icon: one clear central metaphor, a simple rounded-square composition, flat or subtly gradient colour, and full legibility at 48 pixels. | name, logo style |
| `age-progression-tool` — AI Age Progression | Age this person to the specified age: add age-appropriate skin texture, fine lines, hair greying and thinning, and subtle changes to facial volume — while keeping them unmistakably the same person. | target age |
| `old-filter` — Old Age Filter | Age this person to the age given: deeper lines, a softened jawline, thinner greyed hair, age spots and reduced skin elasticity in the measure that age calls for, keeping their identity and bone str… | target age |
| `baby-face-filter` — Baby Face Filter | De-age this person to the age given, as a real child: rounder cheeks, larger eyes relative to the face, smoother skin and softer features, keeping the characteristic traits that make them recognisa… | target age |
| `ai-time-machine` — AI Time Machine | Restage this person in the specified historical period: period-accurate clothing, hair, grooming and accessories, an era-appropriate setting, and the photographic look of that decade's film and len… | decade |
| `ai-yearbook-generator` — AI Yearbook Generator | Restage this as a 1990s school yearbook portrait: feathered period hair, a patterned knit or collared top, a mottled blue-grey studio backdrop, direct flash and the soft grain of 90s portrait film. | yearbook backdrop |
| `1980s-photo-trend` — 1980s Photo Trend Maker | Restage this as an authentic 1980s photograph: voluminous period hair, era-accurate wardrobe, warm tungsten studio lighting with a soft-focus glow, and genuine 35mm film grain with slightly faded c… | 1980s scene |
| `action-figure-generator` — Action Figure Generator | Render this person as a collectible action figure in retail blister packaging, themed on what the photo suggests they do or love — their job, sport or hobby. The figure wears a version of their out… | figure presentation |
| `funko-figure-maker` — Vinyl Figure Maker | Render this person as a stylised vinyl collectible figure: oversized head with simplified features and black dot eyes, a small simplified body, matte moulded plastic finish, and clean product light… | figure presentation |
| `aura-farm-horse` — Aura Photo Generator | Keep the person — and any animal with them — exactly as photographed, and give the photo a dramatic cinematic aura: replace the background with a sweeping epic landscape of mountain peaks at golden… | transformation strength |
| `ai-character-generator` — Character Generator | Reimagine this person as a character from a cinematic world, built on who they already are: take their role, outfit or hobby from the photo and turn it into a richly themed version of it — a chef, … | subject description, framing |
| `ai-avatar-generator` — AI Avatar Generator | Create a polished, colourful avatar of this person in a semi-3D cartoon style, like a still from a modern animated film: smooth shading, slightly larger expressive eyes, clean outlines and simplifi… | profile background, profile crop |
| `glow-up-editor` — Glow-Up Editor | Give this photo a polished glow-up: relight it with warm, flattering golden-hour sun, even out the skin naturally, make the hair look freshly styled and glossy, smooth out creases in the clothes, a… | transformation strength |

### Important test note

Static preview creatives are visual targets, not image-conditioning inputs. Prompting can make results more consistent with each app's own creative direction, but generative models are non-deterministic and exact pixel-level matching to a static preview is not guaranteed. Validate representative outputs for each app and for multi-parameter combinations on `dev` before production promotion.
