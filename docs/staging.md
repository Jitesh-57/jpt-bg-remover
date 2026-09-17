# How much of the picture an app may change

## The bug

A one-click app would age someone by thirty years and hand back the same
photograph: same outfit, same doorway, same pose, wrinkles added. Technically an
aged face. Obviously not a photograph of a 63-year-old.

Two causes, both ours.

1. Every app prompt ended with *"Preserve the person's face, facial structure,
   identity and natural skin tone exactly"* and said **nothing about anything
   else**. Told what to keep and nothing about what to change, a model keeps
   everything.
2. Every app prompt was wrapped in *"You are a professional photo editor. Edit
   this image: …"* before it was sent. That word — *edit* — asks for the
   smallest change that satisfies the sentence.

The model was doing as it was asked.

## The four modes

`src/lib/staging.ts`. Intent is explicit now, and it is not the same intent for
every app:

| Mode | Fixed | Changes | Apps |
| --- | --- | --- | --- |
| `restage` | who the person is | clothing, hair, background, pose, framing, light | 135 |
| `subject` | the person, exactly as photographed | the surroundings | 11 |
| `scene` | the setting, exactly as photographed | something about the person | 32 |
| `minimal` | everything not named | one named thing | 22 |

`restage` names every element, and names the failure: *"a result that leaves the
person in their original clothes and surroundings with only the face altered has
failed."* "Change the clothes" on its own gets a different shirt in the same room.

Mode comes from the app's catalogue category, with a short per-slug override
list for the cases where the category describes navigation rather than intent —
a passport photo is `scene`, not `restage`, because one that invents a different
shirt is a rejected passport photo.

Unknown categories `restage`: most apps here are transformations, and the
failure this file exists to fix comes from doing too little.

## The editor is the other way round

Text someone typed about *their* photograph is `minimal` by definition. "Make
the sky bluer" is not a request for new clothes. `editorDirective()` states it
rather than leaving it to the model's default, and the custom tab inside a
creative app gets the same treatment for the same reason.

## One realism sentence, not two

Nearly all 200 app prompts carried their own *"must look like a real
photograph"* line, written independently and worded slightly differently.
Appending the canonical one left each prompt closing with two near-identical
paragraphs — which is not twice as convincing. A repeated instruction in
different words reads as two instructions, and the second dilutes the first.

`stripOwnPhotoreal()` removes the app's version and the canonical one is
appended. It only matches a sentence that both claims photographic realism and
rules out illustration — the shape of the boilerplate, not of anything an app
needs to say. Verified across all 200: exactly one such clause each.

## Age progression

The clearest case, and the one that surfaced it. `ageStaging()` puts the person
somewhere a person of that age would be, dressed as one — a one-year-old is not
standing at a wedding reception in a lehenga.

It says *"as someone of their own culture and background would dress"* rather
than naming garments, because the right clothes for a 70-year-old depend
entirely on who she is, and a hard-coded answer would dress everyone the same
way.

The base prompt also lost *"the same expression and soft natural lighting"* —
that is a re-staging instruction contradicting itself.


## What shape the answer takes

"Age her to 73" came back as a collectible doll in a blister pack, on a shop
shelf, with a before-and-after inset and **73 YEARS LATER** printed on the box.

Every instruction had been followed. It was photoreal, it was her, it was
re-staged. Nothing had said the answer is *a photograph of a person* — and
"rebuild the whole picture" is an invitation to invent a concept if the output
format is left open. (The concept it borrowed is on the site: `barbie-box` puts
someone in exactly that packaging.)

So the output form is stated separately from the transformation, because it is
true of every transformation:

| Form | Apps | |
| --- | --- | --- |
| `photograph` | 165 | One image. A real person photographed directly — no doll, figurine or model of them, no photo-of-a-photo, no border, frame, screen or layout, no text anywhere |
| `product` | 17 | As above, but the subject may be an object: "no packaging" is backwards for a product shot |
| `artefact` | 18 | One image, and that is the only rule — a Polaroid needs its border, a comic cover its title type, a figurine its box |

All three forbid a collage, grid, diptych, before-and-after or set of
variations, and require that the person appear exactly once with no younger
version of them anywhere in the frame.

### The artefact list is a list on purpose

It was inferred from each app's own prompt first, which read better and was
wrong. *"A magazine cover shoot"* and *"comic-movie lighting"* describe
lighting; *"remove the watermark, logo or stamp"* describes a removal. All
three were read as permission to produce the thing. Five of twenty-five were
wrong that way — including a watermark remover being told it could add a
watermark.

A list goes stale. An inference that confidently says yes to a watermark
remover cannot be trusted at all, and a wrong exemption silently reopens the
exact failure the contract exists to close.
