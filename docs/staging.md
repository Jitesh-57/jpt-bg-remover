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
