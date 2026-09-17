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
