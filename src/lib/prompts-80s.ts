// 100 copy-paste prompts for the viral 80s AI photo trend.
//
// Structure follows the pattern that recurs across every public version of this
// prompt (see docs research): (1) lock the face, (2) change only hair / makeup /
// wardrobe / lighting / background, (3) period-accurate detail, (4) anchor to a
// specific year so it reads as a real photo rather than a filter.
//
// To swap in a different prompt set, replace the CATEGORIES array below — the
// page renders entirely from this file.

/** Identity lock — appears in every prompt; the single most important line. */
const LOCK =
  "Preserve my exact facial features, bone structure, identity and natural skin tone — do not change my face. Change only the hair, makeup, wardrobe, lighting and background.";

/** Period-authenticity tail, anchored to a specific year. */
const tail = (year: number) =>
  `Authentic analogue film grain, slightly faded period colour, shot on 35mm. It should look like a real photograph taken in ${year} — not a filter applied over a modern photo.`;

export interface Prompt {
  id: string;
  title: string;
  text: string;
}
export interface PromptCategory {
  id: string;
  name: string;
  emoji: string;
  blurb: string;
  prompts: Prompt[];
}

let seq = 0;
const P = (title: string, scene: string, year = 1986): Prompt => ({
  id: `p${++seq}`,
  title,
  text: `${scene}\n\n${LOCK}\n\n${tail(year)}`,
});

export const MASTER_TEMPLATE = `Turn this photo into an authentic 1986 studio portrait.

${LOCK}

Style: [describe hair, wardrobe, makeup, background and lighting here].

${tail(1986)}`;

export const CATEGORIES: PromptCategory[] = [
  {
    id: "studio-glamour",
    name: "Studio Glamour",
    emoji: "✨",
    blurb: "The classic 80s mall-studio portrait — soft focus, dreamy gradient backdrop, big hair.",
    prompts: [
      P("Classic mall studio", "Recreate me as a classic 1980s shopping-mall portrait-studio photograph: voluminous blow-dried hair, soft pastel blue-to-pink gradient backdrop, warm key light with a soft-focus glow filter, shoulders angled to camera."),
      P("Soft-focus dream", "Style me as a dreamy 1980s glamour portrait with heavy soft-focus, a halo of backlight through big feathered hair, frosted pink lipstick and blue eyeshadow, seated against a mottled grey studio backdrop."),
      P("Pearl and satin", "Make this a 1985 formal studio glamour shot: satin blouse with a pearl necklace, teased and hair-sprayed hair, rosy blush, gentle vignette and a painted cloud-grey backdrop.", 1985),
      P("Laser beam backdrop", "Recreate me in an 80s portrait studio with the famous laser-beam backdrop — neon pink and blue beams over black, high-shine hair, a bold blazer and a confident half-smile."),
      P("Feathered hair icon", "Style me with iconic 1983 feathered, centre-parted hair, soft champagne lighting, a cream silk blouse and a hand-painted sepia studio backdrop.", 1983),
      P("Glamour with pearls and fog", "Turn this into a high-glamour 80s studio portrait with a light fog machine haze, rim lighting on big curled hair, dangling pearl earrings and a black off-shoulder top."),
      P("Two-tone gradient", "Recreate me against a two-tone teal-and-magenta airbrushed studio gradient, hair blown out and voluminous, wearing a bold-shouldered jacket, lit with a soft beauty dish."),
      P("Golden hour studio", "Make this a warm 1987 studio portrait: golden tungsten key light, honey-toned highlights in big wavy hair, a gold chain necklace and a mustard-brown backdrop.", 1987),
      P("Black velvet portrait", "Style me as an elegant 80s black-velvet-backdrop studio portrait with dramatic side lighting, statement gold earrings, deep red lipstick and sculpted hair."),
      P("Family portrait day", "Recreate me as the formal 80s portrait-studio photo taken on family portrait day — neat blow-dried hair, a collared shirt or blouse, soft even lighting and a muted blue marbled backdrop."),
    ],
  },
  {
    id: "yearbook",
    name: "Yearbook Portrait",
    emoji: "🎓",
    blurb: "High-school yearbook energy — awkward charm, gradient backdrop, senior-photo pose.",
    prompts: [
      P("Classic senior photo", "Make this my 1986 high-school senior yearbook portrait: neat feathered hair, a collared shirt under a sweater, a blue-to-white gradient backdrop and flat studio lighting."),
      P("Varsity jacket", "Recreate me as an 80s yearbook photo wearing a varsity letterman jacket over a turtleneck, hair blow-dried and full, seated at a slight angle on a grey mottled backdrop."),
      P("Big glasses yearbook", "Style me as a 1984 yearbook portrait with oversized tortoiseshell glasses, a striped polo shirt, side-parted hair and a warm brown studio gradient.", 1984),
      P("Cheer squad", "Make this an 80s yearbook sports portrait: cheer or team uniform, high ponytail with a ribbon, bright even lighting and a school-colours backdrop."),
      P("Band and orchestra", "Recreate me as the 80s school band yearbook photo — holding a brass instrument, formal band uniform, tidy hair and a deep maroon studio backdrop."),
      P("Prom king and queen", "Style me as an 80s prom yearbook photo: ruffled tuxedo shirt or taffeta dress, corsage, balloon arch background and a soft-focus flash."),
      P("Class of '89", "Make this a Class of 1989 yearbook portrait with a bold patterned sweater, crimped hair, subtle soft focus and a laser-blue gradient backdrop.", 1989),
      P("Debate club formal", "Recreate me as a serious 80s yearbook club portrait: blazer and tie, hair neatly combed, arms folded, lit with hard studio key light on a slate backdrop."),
      P("Faculty photo", "Style me as an 80s school faculty yearbook portrait — tweed jacket with elbow patches or a smart cardigan, glasses, warm lighting and a bookshelf-painted backdrop."),
      P("Best smile superlative", "Make this the 'Best Smile' superlative yearbook photo from 1985: bright grin, feathered hair, pastel polo collar popped, sky-blue gradient backdrop.", 1985),
    ],
  },
  {
    id: "neon-synthwave",
    name: "Neon Synthwave",
    emoji: "🌆",
    blurb: "Miami-Vice neon, grid horizons and chrome — the loudest end of the trend.",
    prompts: [
      P("Neon grid horizon", "Recreate me in a 1985 synthwave scene: magenta and cyan neon rim lighting, a glowing wireframe grid horizon behind me, chrome sunset, slicked-back hair and a pastel blazer with rolled sleeves.", 1985),
      P("Miami night", "Style me as a Miami Vice-era portrait — pastel linen suit over a t-shirt, neon palm-tree signage glowing behind, humid night air, teal and pink light on my face."),
      P("Arcade glow", "Make this a photo of me lit only by 80s arcade cabinets: multicoloured screen glow across my face, a denim jacket, dark arcade interior with cabinet marquees blurred behind."),
      P("Chrome and laser", "Recreate me in a neon-lit 80s studio with chrome lettering, laser beams cutting through haze, mirrored sunglasses pushed into big hair and a leather jacket."),
      P("Synth club portrait", "Style me inside a 1987 synth-pop nightclub: hot pink and electric blue wash lights, fog, big permed hair, a mesh top and heavy eyeliner.", 1987),
      P("Neon rain street", "Make this a neon-noir 80s street portrait — wet pavement reflecting pink and green neon signage, trench coat, collar up, cinematic side light."),
      P("VHS tracking lines", "Recreate me as a still from a 1986 VHS tape: visible tracking lines and colour bleed, neon studio lighting, big hair, bold geometric-patterned top."),
      P("Sunset chrome portrait", "Style me against an airbrushed chrome-and-sunset backdrop with a purple-to-orange gradient sky, wind-blown hair and a bright windbreaker."),
      P("Neon gym", "Make this an 80s neon aerobics-studio portrait: headband, bright leotard and legwarmers, mirrored wall, magenta and cyan tube lighting."),
      P("Retro-future portrait", "Recreate me as a retro-futurist 1988 portrait with a chrome-effect jacket, neon geometric shapes floating behind, hard blue key light and a soft magenta fill.", 1988),
    ],
  },
  {
    id: "bollywood",
    name: "Bollywood Studio",
    emoji: "🎬",
    blurb: "Vintage Hindi-cinema styling — the strongest sub-trend in India right now.",
    prompts: [
      P("Mumbai premiere night", "Recreate me outside a Mumbai cinema hall on a 1986 film premiere night: vintage Bollywood posters and a glowing neon marquee behind me, a sequinned gown or a wide-collar patterned shirt, styled voluminous hair, warm cinematic key light."),
      P("Retro film studio portrait", "Style me as a 1980s Bollywood studio publicity portrait — dramatic single-source lighting, painted studio backdrop, glossy styled hair, statement jewellery, hyper-realistic and cinematic."),
      P("Song sequence still", "Make this a still from an 80s Hindi film song sequence: bright saturated colours, chiffon and sequins, a garden or hillside set, soft wind machine on the hair, high-contrast film stock."),
      P("Vintage movie magazine", "Recreate me as a cover portrait for a 1984 Bollywood film magazine: bold direct-to-camera gaze, heavy studio makeup, glamorous styling and rich saturated colour.", 1984),
      P("Disco night Bombay", "Style me in a 1982 Bombay disco: mirror ball, coloured floor lights, a satin shirt open at the collar or a shimmering dress, bouffant hair and confident posture.", 1982),
      P("Rain song classic", "Make this a classic 80s Bollywood rain-song still — dramatic backlight through falling rain, soaked styled hair, rich jewel-tone clothing, cinematic contrast."),
      P("Family drama poster", "Recreate me as the lead in an 80s Hindi family-drama poster portrait: warm amber lighting, traditional formal wear, dignified expression, grainy period film stock."),
      P("Action hero portrait", "Style me as an 80s Bollywood action-hero publicity still: leather or denim jacket, moustache and styled hair, hard rim light, smoky background, high contrast."),
      P("Playback singer portrait", "Make this a 1987 recording-studio portrait: vintage microphone, headphones around the neck, warm tungsten light, patterned shirt or elegant saree, soft grain.", 1987),
      P("Cinema hall lobby", "Recreate me standing in a vintage Indian cinema lobby with hand-painted film hoardings, red carpet and warm bulb lighting, dressed in glamorous 80s eveningwear."),
    ],
  },
  {
    id: "indian-retro",
    name: "Saree & Indian Retro",
    emoji: "🪷",
    blurb: "Traditional Indian styling with period studio treatment — saree, jewellery, warm grain.",
    prompts: [
      P("Silk saree studio", "Recreate me in a rich silk saree with traditional gold jewellery, curled voluminous hair, seated in a 1980s Indian portrait studio with warm tungsten lighting and a painted backdrop."),
      P("Kurta formal portrait", "Style me in a crisp kurta with a Nehru-collar jacket, neatly styled hair and a moustache, photographed in an 80s Indian studio with soft warm light and a muted backdrop."),
      P("Wedding album portrait", "Make this a page from an 80s Indian wedding album: heavy bridal or formal wear, layered gold jewellery, marigold garlands, warm flash-lit colour and visible grain."),
      P("Festival family photo", "Recreate me dressed for a 1980s Diwali celebration — festive traditional clothing, oil lamps glowing warm in the background, candid flash-lit family-album look."),
      P("Chiffon saree glamour", "Style me in a pastel chiffon saree with statement earrings, soft-focus glamour lighting, big blow-dried hair and a hand-painted garden backdrop."),
      P("Temple visit portrait", "Make this an 80s photograph taken outside a South Indian temple: traditional silk clothing, jasmine in the hair, bright natural daylight and slightly faded colour."),
      P("Retro passport formal", "Recreate me as a formal 1985 Indian studio portrait — plain blue backdrop, direct flash, traditional formal clothing, neutral expression, authentic period grain.", 1985),
      P("Bridal jewellery close portrait", "Style me as an 80s Indian bridal portrait with elaborate gold jewellery, a red and gold saree, kohl-lined eyes, warm dramatic side lighting."),
      P("Village daylight portrait", "Make this a 1980s outdoor portrait in an Indian courtyard: cotton saree or kurta, natural midday light, mud-brick wall behind, warm faded Kodachrome colour."),
      P("Anniversary studio photo", "Recreate me in a formal 80s Indian anniversary studio portrait: traditional finery, seated pose, ornate carved chair, warm bulb lighting and soft vignette."),
    ],
  },
  {
    id: "family-album",
    name: "Family Album",
    emoji: "📷",
    blurb: "Home-photo realism — direct flash, living-room backdrops, faded print colour.",
    prompts: [
      P("Living room flash", "Recreate me as a candid 1986 family-album snapshot: harsh direct on-camera flash, patterned wallpaper and a boxy TV behind, casual 80s clothing, red-eye-era colour cast."),
      P("Birthday party", "Style me at an 80s birthday party — paper hats, a homemade cake with candles, wood-panelled walls, flash-lit and slightly overexposed."),
      P("Christmas morning", "Make this a 1985 Christmas-morning family photo: pyjamas or a festive jumper, tinsel tree with big coloured bulbs, warm flash, faded print colour.", 1985),
      P("Backyard barbecue", "Recreate me at an 80s backyard barbecue: casual polo shirt or sundress, garden furniture, bright summer sun, washed-out colour and visible grain."),
      P("Road trip stop", "Style me leaning against a boxy 80s family car at a roadside stop, windbreaker and jeans, big open sky, sun-faded snapshot colour."),
      P("Beach holiday", "Make this a 1987 beach-holiday snapshot: bright swimwear or a loose shirt, sunburnt light, sand and sea behind, heavy sun flare and faded borders.", 1987),
      P("Grandma's front room", "Recreate me sitting in a 1980s front room with floral wallpaper, a doily-covered sideboard and a gas fire, flash-lit and warmly faded."),
      P("School run morning", "Style me as an 80s candid morning photo — school bag over the shoulder, front door and hedge behind, flat grey daylight, soft grain."),
      P("New car day", "Make this an 80s 'new car' family photo: proud pose beside a boxy saloon on the driveway, casual clothing, bright overcast light, slightly green-shifted colour."),
      P("Camping trip", "Recreate me on an 80s camping holiday: fleece and cagoule, canvas tent behind, campfire light on my face, grainy low-light film."),
    ],
  },
  {
    id: "magazine",
    name: "Magazine Cover",
    emoji: "📰",
    blurb: "Editorial fashion covers — bold type-ready framing and high-gloss styling.",
    prompts: [
      P("Fashion cover shoot", "Recreate me as an 80s fashion magazine cover portrait: bold direct gaze, dramatic shoulder-padded outfit, strong beauty lighting, seamless coloured backdrop with space for cover lines."),
      P("Music magazine", "Style me as an 80s music magazine cover: leather jacket, tousled big hair, moody side light, gritty studio backdrop and high-contrast printing look."),
      P("Business feature", "Make this an 80s business magazine cover portrait — power suit with strong shoulders, arms crossed, confident expression, corporate grey gradient backdrop."),
      P("Fitness cover", "Recreate me as an 80s fitness magazine cover: bright leotard or tracksuit, headband, glowing rim light, energetic pose, saturated primary colours."),
      P("Teen magazine pull-out", "Style me as an 80s teen magazine pull-out poster: bright colour blocking, glossy smile, feathered hair, playful pose and heavy studio flash."),
      P("Style editorial", "Make this a high-fashion 1988 editorial portrait: avant-garde silhouette, sculptural hair, hard shadow on a coloured wall, saturated film stock.", 1988),
      P("Cover star glamour", "Recreate me as a glamour magazine cover from 1984: soft-focus beauty lighting, glossy lips, big curled hair, jewel-tone satin and a warm cream backdrop.", 1984),
      P("Tech magazine feature", "Style me as an 80s technology magazine cover portrait: beige computer terminal glowing beside me, blazer and tie, cool fluorescent office light."),
      P("Travel magazine", "Make this an 80s travel magazine cover portrait: linen shirt, sun-bleached location background, bright natural light and warm faded Kodachrome tones."),
      P("Album sleeve", "Recreate me as an 80s vinyl album sleeve portrait: dramatic single-source lighting, bold solid colour background, styled hair and a confident, stylised pose."),
    ],
  },
  {
    id: "disco",
    name: "Disco & Nightlife",
    emoji: "🕺",
    blurb: "Mirror balls, sequins and dance-floor lighting.",
    prompts: [
      P("Mirror ball floor", "Recreate me on an 80s disco dance floor under a mirror ball: scattered light specks across my face, sequinned outfit, big hair, motion in the background."),
      P("Roller disco", "Style me at an 80s roller disco — bright striped tube socks and shorts or a shiny jumpsuit, neon rink lighting, skates on, energetic pose."),
      P("VIP booth", "Make this an 80s nightclub VIP booth photo: velvet seating, champagne on the table, satin shirt or a shimmering dress, warm low light and direct flash."),
      P("Dance floor flash", "Recreate me mid-dance in a 1983 club: harsh direct flash freezing the moment, sweaty glow, patterned shirt, crowded dark background.", 1983),
      P("Cocktail bar portrait", "Style me at an 80s cocktail bar: neon bar signage behind, a brightly coloured cocktail in hand, sharp blazer, moody warm lighting."),
      P("Saturday night out", "Make this an 80s Saturday-night-out group-style portrait: bold makeup, statement earrings, big blow-dried hair, flash-lit against a mirrored club wall."),
      P("Live band front row", "Recreate me at the front row of an 80s gig: stage lights flaring behind, denim jacket with badges, hands up, grainy high-ISO film."),
      P("Karaoke night", "Style me singing at an 80s karaoke bar — microphone in hand, glowing screen light on my face, patterned shirt, warm smoky interior."),
      P("Rooftop party", "Make this an 80s rooftop party photo at dusk: city skyline behind, string lights, breezy linen outfit, warm golden flash and faded colour."),
      P("After-party portrait", "Recreate me at an 80s after-party: dim warm lamplight, loosened tie or a slipped shoulder strap, tired glamorous look, heavy film grain."),
    ],
  },
  {
    id: "film-poster",
    name: "Retro Film Poster",
    emoji: "🎞️",
    blurb: "Movie-poster framing — dramatic light, painted-poster texture, cinematic grade.",
    prompts: [
      P("Action poster hero", "Recreate me as the hero on an 80s action film poster: dramatic low-angle hero shot, hard rim light, smoke and sparks behind, painted-poster texture."),
      P("Teen comedy poster", "Style me as the lead on an 80s teen comedy poster: bright pastel colour blocking, cheeky grin, school lockers behind, glossy airbrushed finish."),
      P("Sci-fi one-sheet", "Make this an 80s sci-fi film one-sheet portrait: cool blue rim light, starfield and chrome typography space behind, determined expression, airbrushed poster look."),
      P("Romance poster", "Recreate me on an 80s romance film poster: soft warm backlight, wind in the hair, gauzy soft focus, pastel sunset gradient."),
      P("Detective thriller", "Style me as an 80s detective thriller poster portrait: venetian-blind shadows across the face, trench coat, cigarette smoke haze, high-contrast noir grade."),
      P("Horror poster", "Make this an 80s horror film poster portrait: hard green-blue underlight, deep shadow, fog, unsettling stillness and heavy grain."),
      P("Dance movie poster", "Recreate me on an 80s dance film poster: mid-motion pose, leg warmers and a cut-off sweatshirt, spotlight from above, dust in the beam."),
      P("Buddy cop poster", "Style me as one half of an 80s buddy-cop poster: leather jacket, arms folded, city night behind, warm streetlight and a bold cinematic grade."),
      P("Adventure serial", "Make this an 80s adventure film poster portrait: rugged jacket, sunlit jungle or desert behind, dust in the air, painted-poster warmth."),
      P("Fantasy epic", "Recreate me on an 80s fantasy epic poster: dramatic mist, torchlight glow, ornate costume, airbrushed painterly texture and rich saturated colour."),
    ],
  },
  {
    id: "street",
    name: "Street & Outdoor",
    emoji: "🛼",
    blurb: "Candid outdoor 80s — city streets, skate parks, sun-faded daylight.",
    prompts: [
      P("City street candid", "Recreate me as a candid 1986 street photograph: walking a busy high street, denim jacket and high-waisted jeans, boxy cars and shopfronts behind, sun-faded colour."),
      P("Skate park", "Style me at an 80s skate park: skateboard under one foot, band t-shirt, concrete bowl behind, harsh midday sun and grainy colour film."),
      P("Boombox on the corner", "Make this an 80s street portrait with a boombox on the shoulder, tracksuit and trainers, brick wall with graffiti, hard afternoon light."),
      P("Bus stop wait", "Recreate me waiting at an 80s bus stop: parka over a jumper, grey overcast light, timetable poster behind, muted washed-out colour."),
      P("Arcade doorway", "Style me leaning in the doorway of an 80s amusement arcade: neon signage above, denim on denim, evening light mixing with arcade glow."),
      P("Seaside promenade", "Make this an 80s seaside promenade photo: windbreaker, hair blown sideways, railings and grey sea behind, bright flat daylight and faded print colour."),
      P("Record shop", "Recreate me flicking through vinyl in an 80s record shop: band tee and leather jacket, crowded racks, warm fluorescent light and heavy grain."),
      P("Payphone call", "Style me on an 80s street payphone: receiver to the ear, oversized coat, rain-slick pavement, sodium streetlight glow."),
      P("Football terraces", "Make this an 80s football-terraces photo: scarf held up, crowd behind, cold flat daylight, grainy and slightly underexposed."),
      P("Neighbourhood bike ride", "Recreate me on a BMX in an 80s suburban street: bright windbreaker, low sun flare, parked boxy cars, warm faded snapshot colour."),
    ],
  },
];

export const ALL_PROMPTS: Prompt[] = CATEGORIES.flatMap((c) => c.prompts);
export const PROMPT_COUNT = ALL_PROMPTS.length;
