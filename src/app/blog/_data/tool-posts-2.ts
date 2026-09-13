import type { BlogPost } from "./posts";

/**
 * Posts for the newer browser tools — resize, QR code, blur/pixelate — plus
 * deeper coverage of compress, convert and crop.
 *
 * Resize, QR and blur had no blog coverage at all, so nothing was catching
 * their search traffic. Every post here targets one specific intent ("resize to
 * 1080x1080", "blur a licence plate", "WiFi QR code") and links into the tool
 * that does exactly that.
 *
 * Every claim is limited to what these tools actually do: they all run in the
 * browser, none of them upload, none cost credits, and none add a watermark.
 * The converter handles JPG, PNG and WEBP only — not HEIC — and the blur tool
 * censors a region you drag, which is not the same as separating a subject from
 * its background. Writing past any of that would be writing a feature request.
 */

export const TOOL_POSTS_2: BlogPost[] = [
  // ── Resize ────────────────────────────────────────────────────────────────
  {
    slug: "resize-image-to-1080x1080-free",
    title: "How to Resize an Image to 1080×1080 (Free, Exact Pixels)",
    metaTitle: "Resize Image to 1080x1080 Free Online | Pixel Shine",
    metaDescription:
      "Resize any photo to exactly 1080×1080 pixels free online. Type the numbers, keep it sharp, download instantly — no watermark, no sign-up.",
    excerpt:
      "1080×1080 is the size Instagram wants for a feed post. Here's how to hit it exactly, for free, without stretching your photo.",
    date: "2026-09-02",
    readTime: "5 min read",
    category: "Tutorial",
    keywords: ["resize image to 1080x1080", "resize image free", "instagram square size", "resize photo to exact pixels"],
    toolHref: "/resize-image",
    toolLabel: "Resize Your Image — Free →",
    sections: [
      { body: `1080×1080 pixels is the square Instagram serves at full quality, and it is the number most social schedulers ask for. Getting there is not hard, but two things go wrong constantly: people stretch the image by setting both numbers independently, and people upload something far smaller than 1080 and wonder why it looks soft. Here is how to do it properly in about twenty seconds.` },
      { heading: "Resize and crop are not the same thing", body: `Resizing changes how many pixels an image has. Cropping changes which part of the image you keep. If your photo is already square, resizing to 1080×1080 is all you need. If it is a rectangle, resizing it straight to a square will squash it — you want to crop it square first, then resize. The cropper has a one-tap Square (1:1) ratio for exactly this.` },
      { heading: "How to resize to 1080×1080", body: `Open the resizer, drop your photo in, and type 1080 into the width. With the aspect ratio locked, the height follows automatically — if your image is square, it lands on 1080 too. If you need both numbers forced to 1080 regardless of shape, unlock the ratio first, though be aware that is the setting that stretches things. Download when the preview looks right.` },
      { heading: "Start bigger than 1080, not smaller", body: `Making an image smaller keeps it crisp — you are throwing away pixels you did not need. Making it bigger does not add detail, it just spreads the pixels you have, which is what makes an enlarged photo look soft. If your original is only 600px wide, resizing up to 1080 will look worse, not better. Run it through the AI upscaler instead, which generates genuine new detail.` },
      { heading: "Resize your image now — free", body: `Type the width and height you need, keep the ratio locked, and download. It runs in your browser, so nothing is uploaded, and there is no watermark or account.` },
    ],
  },
  {
    slug: "resize-image-for-youtube-thumbnail-free",
    title: "Resize an Image for a YouTube Thumbnail (1280×720, Free)",
    metaTitle: "Resize Image for YouTube Thumbnail Free | Pixel Shine",
    metaDescription:
      "YouTube thumbnails are 1280×720. Resize any photo to that exact size free online — locked aspect ratio, no watermark, no sign-up.",
    excerpt:
      "YouTube wants 1280×720 and under 2 MB. Here's how to hit both, free, in a browser tab.",
    date: "2026-09-01",
    readTime: "5 min read",
    category: "Tutorial",
    keywords: ["youtube thumbnail size", "resize image for youtube", "1280x720 resize free", "thumbnail resizer free"],
    toolHref: "/resize-image",
    toolLabel: "Resize to 1280×720 — Free →",
    sections: [
      { body: `YouTube's thumbnail spec is 1280×720 pixels, 16:9, under 2 MB, as JPG, PNG, GIF or WEBP. Upload something the wrong shape and YouTube will letterbox or crop it for you, usually badly. Two free browser tools get you to spec without opening anything heavier.` },
      { heading: "Get the shape right first", body: `1280×720 is 16:9. If your source photo is a phone shot, it is probably 4:3 or 3:4 — nowhere near 16:9. Crop it to the wide ratio first so you choose what gets cut, rather than letting YouTube decide. The cropper has a wide preset for this.` },
      { heading: "Then resize to exactly 1280×720", body: `Once the shape is 16:9, open the resizer and type 1280 into the width. With the ratio locked, the height lands on 720 by itself. Download and you have a file that matches the spec exactly.` },
      { heading: "If it's over 2 MB", body: `A 1280×720 PNG can still be several megabytes. Run it through the compressor and drag the quality slider down while watching the live size read-out — at that resolution you can usually get well under 2 MB with no visible difference. JPG is the safer output for a thumbnail; PNG only helps if you have flat graphics or text.` },
      { heading: "Resize your thumbnail now — free", body: `Crop to wide, resize to 1280×720, compress if needed. All three run in your browser, free, with no watermark and no account.` },
    ],
  },
  {
    slug: "resize-image-without-losing-quality-free",
    title: "How to Resize an Image Without Losing Quality (Free)",
    metaTitle: "Resize Image Without Losing Quality Free | Pixel Shine",
    metaDescription:
      "Resize photos without them going soft. What actually causes quality loss when resizing, and how to avoid it — free, online, no sign-up.",
    excerpt:
      "Resizing down is nearly free of quality loss. Resizing up is where images fall apart — and there's a different tool for that.",
    date: "2026-08-28",
    readTime: "6 min read",
    category: "Guide",
    keywords: ["resize image without losing quality", "resize photo quality loss", "image resizer free", "enlarge image without blur"],
    toolHref: "/resize-image",
    toolLabel: "Resize Your Image — Free →",
    sections: [
      { body: `"Resize without losing quality" is one of the most searched image phrases there is, and the honest answer depends entirely on which direction you are going. Making an image smaller is almost lossless in any way you would notice. Making it bigger cannot be lossless, because the detail you want was never captured. Knowing which case you are in tells you which tool to use.` },
      { heading: "Making it smaller: essentially free", body: `When you resize a 4000px photo down to 1000px, you are discarding pixels. The remaining ones are averaged from what was there, so edges stay clean and the result looks sharp — often sharper than the original did on screen, because the detail is packed more densely. This is the case where "no quality loss" is genuinely true.` },
      { heading: "Making it bigger: where it goes wrong", body: `Enlarging a 600px image to 2000px cannot invent the missing detail. A plain resizer stretches each pixel across a larger area and interpolates between them, which reads as softness and mushy edges. No amount of sharpening afterwards brings back what was not there. This is the "quality loss" people actually run into.` },
      { heading: "What to use when you need it bigger", body: `An AI upscaler is a different kind of tool: it is a model trained on millions of images that predicts what the missing detail should look like — hair strands, fabric weave, text edges — and draws it in. That is why an upscaled photo can look genuinely sharp at 4× while a resized one looks blurred. Use the resizer to go down, the upscaler to go up.` },
      { heading: "The other thing that costs quality: re-saving", body: `Every time you save a JPG, it is compressed again, and the damage accumulates. If you are going to resize, crop and compress, do it in one sitting from the original file rather than opening and re-saving the same JPG five times. Keep the original; work from a copy.` },
      { heading: "Resize your image now — free", body: `For anything you are making smaller, the resizer handles it in the browser with the ratio locked, no watermark and no account.` },
    ],
  },
  {
    slug: "resize-image-for-passport-photo-free",
    title: "Resize a Photo to Passport Size (Free, Exact Pixels)",
    metaTitle: "Resize Photo to Passport Size Free Online | Pixel Shine",
    metaDescription:
      "Resize a photo to exact passport or visa pixel dimensions free online. Type the numbers, download instantly — no watermark, no sign-up.",
    excerpt:
      "Passport and visa portals want an exact pixel size and often an exact file size. Here's how to hit both for free.",
    date: "2026-08-26",
    readTime: "5 min read",
    category: "Tutorial",
    keywords: ["resize photo to passport size", "passport photo size pixels", "visa photo resize free", "resize image to exact size"],
    toolHref: "/resize-image",
    toolLabel: "Resize Your Photo — Free →",
    sections: [
      { body: `Passport and visa upload portals are unusually strict: a fixed pixel size, a fixed file size range, often a fixed aspect ratio, and an instant rejection if you miss. The requirements differ by country, so the first job is always to read the actual spec on the portal rather than trusting a blog's number — including this one.` },
      { heading: "Find the two numbers that matter", body: `Almost every portal states a pixel size (for example 600×600, or 413×531) and a file size range (often 20–50 KB, sometimes up to 200 KB). Write both down. Some also specify a head-height percentage, which is a photography requirement rather than something a resizer can fix.` },
      { heading: "Crop to the right shape, then resize", body: `If the required size is square and your photo is not, crop it square first so you control the framing — resizing a rectangle into a square stretches the face, which is both unflattering and a rejection risk. Once the shape matches, open the resizer, type the exact width, and let the locked ratio fill in the height.` },
      { heading: "Then hit the file size", body: `Pixel size and file size are separate requirements. With the dimensions correct, run the file through the compressor and slide the quality down until the live read-out lands inside the portal's range. Do it in this order — compressing first and resizing after undoes your work.` },
      { heading: "What these tools cannot do", body: `They will not judge head height, background colour, expression or lighting against a government standard. If the portal rejects your photo for those reasons, the fix is retaking it, not reprocessing it.` },
      { heading: "Resize your photo now — free", body: `Type the exact dimensions your portal asks for and download. It runs in your browser, so your identity photo is never uploaded to us.` },
    ],
  },
  {
    slug: "resize-profile-picture-to-exact-size-free",
    title: "Resize a Profile Picture to the Exact Size (Free)",
    metaTitle: "Resize Profile Picture Free Online | Pixel Shine",
    metaDescription:
      "Resize a profile picture to the exact size any platform wants — free online, locked aspect ratio, no watermark, no sign-up.",
    excerpt:
      "Every platform has a different profile picture size, and uploading the wrong one is why your face ends up cropped at the chin.",
    date: "2026-08-24",
    readTime: "5 min read",
    category: "Tutorial",
    keywords: ["resize profile picture", "profile photo size free", "resize avatar image", "resize image online free"],
    toolHref: "/resize-image",
    toolLabel: "Resize Your Photo — Free →",
    sections: [
      { body: `Profile pictures are displayed as circles on most platforms but stored as squares, which is why an off-centre face gets clipped at the edges. Getting a clean avatar is two steps: square it up with the face centred, then resize to the size the platform actually stores.` },
      { heading: "Square it first, with room to spare", body: `Crop to a 1:1 square and leave a little space around the head. The visible circle is inscribed inside the square, so the corners get cut — anything tight to the edge disappears. The cropper's Square preset plus a bit of breathing room solves this.` },
      { heading: "Resize to something generous", body: `Platforms store a fixed size and generate smaller versions from it. Uploading something larger than needed is harmless; uploading something smaller means the platform enlarges it and it looks soft. Around 800×800 to 1000×1000 is comfortably above what any mainstream platform stores.` },
      { heading: "If your source is small", body: `If the only copy you have is a 300px thumbnail, resizing it up will not help — it will just be a bigger blurry image. Run it through the AI upscaler first to rebuild detail, then resize to your target.` },
      { heading: "Want an actual round PNG?", body: `Some places accept a transparent PNG and will not add their own circle mask. The cropper has a Circle option that outputs a genuinely round image with a transparent background, which is useful for a website byline or a signature block.` },
      { heading: "Resize your profile picture now — free", body: `Square, resize, download. In the browser, no watermark, no account.` },
    ],
  },
  {
    slug: "resize-image-for-email-signature-free",
    title: "Resize an Image for an Email Signature (Free)",
    metaTitle: "Resize Image for Email Signature Free | Pixel Shine",
    metaDescription:
      "Email signature logos should be small in both pixels and kilobytes. Resize and compress yours free online — no watermark, no sign-up.",
    excerpt:
      "A 4 MB logo in your signature goes out with every email you send. Here's the size it should actually be.",
    date: "2026-08-21",
    readTime: "4 min read",
    category: "Tutorial",
    keywords: ["email signature image size", "resize logo for email signature", "resize image free", "compress signature image"],
    toolHref: "/resize-image",
    toolLabel: "Resize Your Logo — Free →",
    sections: [
      { body: `A signature image is attached to every single email you send, so its size is multiplied by your whole year of correspondence. It also has to survive being displayed at roughly 150–200 pixels wide in most email clients. Both facts point the same way: make it small, deliberately.` },
      { heading: "The size to aim for", body: `Most signature logos display around 150–200px wide. Export at roughly double that — 300–400px — so it stays sharp on high-density screens, and no larger. Under 50 KB is a reasonable target for the file itself; many good signature logos are under 20 KB.` },
      { heading: "How to get there", body: `Open the resizer, set the width to 300 or 400 with the ratio locked, and download. If the file is still heavier than you want, pass it through the compressor and watch the live size read-out as you slide the quality down.` },
      { heading: "Pick the right format", body: `A logo with flat colours and text is usually smaller and sharper as a PNG. A photograph is much smaller as a JPG. If your logo needs a transparent background so it sits on any email background colour, it has to be PNG — JPG has no transparency and will fill it with white. The converter switches between JPG, PNG and WEBP.` },
      { heading: "Resize your signature image now — free", body: `Set the width, download, compress if needed. Free, in the browser, no watermark.` },
    ],
  },

  // ── QR code ───────────────────────────────────────────────────────────────
  {
    slug: "create-qr-code-for-website-free",
    title: "How to Create a QR Code for a Website (Free, No Sign-Up)",
    metaTitle: "Create a QR Code for a Website Free | Pixel Shine",
    metaDescription:
      "Generate a QR code for any link free online. Choose the size and colours, download PNG or SVG — no sign-up, no expiry, no tracking.",
    excerpt:
      "Most free QR generators quietly route your code through their own domain, so it dies when they do. Here's one that doesn't.",
    date: "2026-09-05",
    readTime: "5 min read",
    category: "Tutorial",
    keywords: ["create qr code free", "qr code generator free", "qr code for website", "free qr code no sign up"],
    toolHref: "/qr-code-generator",
    toolLabel: "Make a QR Code — Free →",
    sections: [
      { body: `A QR code is just a URL encoded as a pattern of squares. That simplicity is worth protecting, because a lot of "free" generators do something else: they encode a short link on their own domain that redirects to yours. It looks identical, and it works — right up until the service shuts down, starts charging, or puts an ad interstitial in front of your link. Every printed code you made then points at nothing.` },
      { heading: "Static beats dynamic for anything printed", body: `A code that encodes your real URL directly is called static. It cannot be tracked or edited, but it also cannot expire or be taken hostage, and it works forever with no account attached. For a poster, a business card or a product label, that is the right trade. Dynamic codes make sense only when you genuinely need to change the destination later.` },
      { heading: "How to make one", body: `Paste your full URL, including https://, into the generator. Set the size with the slider — anything from 128 to 1024 pixels — and adjust the foreground and background colours if you want it to match your branding. The preview updates as you type, so you can see immediately that it still scans.` },
      { heading: "Keep the contrast strong", body: `Scanners look for dark modules on a light background. Dark on light works; light on dark often fails; two mid-tone colours with similar brightness fail reliably. If you recolour it, check the preview with your actual phone before printing a thousand of them. Leave the quiet zone — the empty margin around the code — alone.` },
      { heading: "Download PNG or SVG", body: `PNG is right for screens and slides. SVG is right for print, because it is vector and stays perfectly sharp at any size, from a business card to a billboard. Both download straight from the page, and the whole thing runs in your browser — the URL you encode is never sent to us.` },
      { heading: "Make your QR code now — free", body: `Paste a link, pick a size, download. No account, no expiry, no tracking.` },
    ],
  },
  {
    slug: "qr-code-for-wifi-password-free",
    title: "Make a WiFi QR Code So Guests Can Join Without Typing (Free)",
    metaTitle: "WiFi QR Code Generator Free Online | Pixel Shine",
    metaDescription:
      "Create a WiFi QR code free — guests scan and connect without typing the password. Works on iPhone and Android. No sign-up.",
    excerpt:
      "Reading a 20-character WiFi password out loud is a small, recurring misery. A QR code ends it permanently.",
    date: "2026-09-04",
    readTime: "5 min read",
    category: "Tutorial",
    keywords: ["wifi qr code", "wifi password qr code free", "qr code generator free", "guest wifi qr"],
    toolHref: "/qr-code-generator",
    toolLabel: "Make a WiFi QR Code — Free →",
    sections: [
      { body: `Phones have understood a standard WiFi QR format for years. Scan one with the camera and it offers to join the network — no typing, no spelling out whether that character is a capital I or a lowercase L. It is a plain piece of text in a defined format, which means any generator that accepts text can make one.` },
      { heading: "The format", body: `The text to encode looks like this:

WIFI:T:WPA;S:MyNetworkName;P:MyPassword;;

T is the security type — WPA covers WPA, WPA2 and WPA3, and you use nopass for an open network. S is the network name exactly as it appears, capitals included. P is the password. The two semicolons at the end are part of the format, not a typo.` },
      { heading: "Escape these characters", body: `If your network name or password contains a semicolon, comma, colon, backslash or double quote, put a backslash before it. A password of pa;ss becomes P:pa\;ss. Getting this wrong is the single most common reason a WiFi code scans but fails to connect.` },
      { heading: "Generate and test it", body: `Paste the whole WIFI: string into the generator, set a size — 512px prints well on a small card — and download the PNG, or the SVG if you are sending it to a printer. Then test it with a phone that is not already on the network, which is the only test that actually proves anything.` },
      { heading: "A word on where you stick it", body: `Anyone who can see the code can join, so a café counter or a guest room is fine and a front window facing the street is not. If you have a guest network separate from your main one, encode that one. Your password is only ever in your own browser — the generator runs locally and sends nothing to a server.` },
      { heading: "Make your WiFi code now — free", body: `Paste the WIFI: string, download, print. No account needed.` },
    ],
  },
  {
    slug: "qr-code-for-restaurant-menu-free",
    title: "Make a QR Code for a Restaurant Menu (Free)",
    metaTitle: "Restaurant Menu QR Code Generator Free | Pixel Shine",
    metaDescription:
      "Create a menu QR code free online. Download as SVG so it stays sharp on printed table cards — no sign-up, no monthly fee, no expiry.",
    excerpt:
      "Menu QR codes are usually rented from a service by the month. For a menu that lives at a stable URL, you do not need one.",
    date: "2026-09-03",
    readTime: "5 min read",
    category: "Tutorial",
    keywords: ["restaurant menu qr code", "menu qr code free", "qr code generator free", "table qr code"],
    toolHref: "/qr-code-generator",
    toolLabel: "Make a Menu QR Code — Free →",
    sections: [
      { body: `A menu QR code is one of the most common paid subscriptions in hospitality, and for most restaurants it does not need to be. If your menu lives at a URL you control — a page on your website, or even a PDF you host — a plain static code pointing at it does the job for nothing, forever.` },
      { heading: "Point it at a page you control", body: `The important decision is the destination, not the code. Point it at a URL on your own domain, such as yourrestaurant.com/menu. You can then change the menu behind that URL as often as you like — new prices, seasonal specials, a different PDF — and every printed code keeps working, because the address never changed.

Point it at a file with a version number in the name and you will be reprinting table cards every time the menu changes.` },
      { heading: "Generate and download as SVG", body: `Paste the URL, set the colours to match your table cards if you want, and download the SVG. Vector matters here: an SVG stays perfectly crisp whether your printer runs it at 3cm on a table tent or 30cm on an A-board. A PNG scaled up for print goes visibly blocky.` },
      { heading: "Print it big enough to scan", body: `A rough rule is that the code should be at least a tenth of the distance it will be scanned from. For a table card held at arm's length, 2–3cm across is plenty. For a window or an A-board read from a few metres, you want 15–20cm. Keep the pale margin around the code — scanners need it.` },
      { heading: "Test before the print run", body: `Scan it with an old phone, in dim light, at the angle a seated customer would hold it. Codes that scan perfectly on a bright screen sometimes struggle on matte card under low restaurant lighting. Better to find that out before a hundred table tents arrive.` },
      { heading: "Make your menu code now — free", body: `Paste your menu URL, download the SVG, send it to the printer. No monthly fee and nothing to expire.` },
    ],
  },
  {
    slug: "qr-code-svg-for-printing-free",
    title: "Why Your Printed QR Code Looks Blocky (Use SVG Instead)",
    metaTitle: "QR Code SVG Download Free — Print-Ready | Pixel Shine",
    metaDescription:
      "Download QR codes as SVG for print — perfectly sharp at any size. Free, no sign-up, no watermark.",
    excerpt:
      "A QR code that looks fine on screen can print with visibly ragged edges. The fix is the file format, not the resolution.",
    date: "2026-08-30",
    readTime: "4 min read",
    category: "Guide",
    keywords: ["qr code svg", "print qr code high resolution", "qr code for printing free", "vector qr code"],
    toolHref: "/qr-code-generator",
    toolLabel: "Download a Vector QR Code — Free →",
    sections: [
      { body: `You download a QR code, drop it into a poster layout, scale it up to fill the corner, and the edges of every little square come out soft and stepped. Increasing the download size helps a bit and then stops helping. The problem is not resolution — it is that a PNG is made of pixels at all.` },
      { heading: "Pixels versus shapes", body: `A PNG stores a grid of coloured pixels. Enlarge it and you are enlarging the pixels, which is why the edges go stepped. An SVG stores the code as actual shapes — "a black square from here to here" — so the printer renders it at whatever resolution it natively supports. A QR code is nothing but hard-edged squares, which makes it about the ideal candidate for vector.` },
      { heading: "When a PNG is fine", body: `Screens, slide decks, social posts, email — anywhere the code is displayed at roughly the size you exported it. Export at 512px or 1024px and a PNG looks perfect. It is only print, and only enlargement, where it falls down.` },
      { heading: "How to get the SVG", body: `Generate your code as normal — paste the content, set the colours — then use the SVG download rather than the PNG. Both are produced in your browser from the same data, so they encode exactly the same thing; it is only how the file describes the picture that differs. Hand the SVG to a designer or drop it straight into InDesign, Illustrator, Figma or Canva.` },
      { heading: "Download a vector QR code now — free", body: `Enter your content, download the SVG, print it at any size you like.` },
    ],
  },
  {
    slug: "qr-code-error-correction-explained",
    title: "QR Code Error Correction: Which Level Should You Pick?",
    metaTitle: "QR Code Error Correction Levels Explained | Pixel Shine",
    metaDescription:
      "L, M, Q or H? What QR error correction actually does, when a higher level helps, and when it just makes your code denser. Free generator, no sign-up.",
    excerpt:
      "Error correction is the setting nobody changes and everybody should understand. It's what lets a scuffed code still scan.",
    date: "2026-08-27",
    readTime: "5 min read",
    category: "Guide",
    keywords: ["qr code error correction", "qr code L M Q H", "qr code generator free", "qr code with logo"],
    toolHref: "/qr-code-generator",
    toolLabel: "Generate a QR Code — Free →",
    sections: [
      { body: `Every QR code carries redundant data, so that a code which is partly dirty, scratched, creased or covered can still be read. How much redundancy is the error correction level, and it is the one setting in a QR generator whose effect is not obvious from its name.` },
      { heading: "The four levels", body: `L recovers from about 7% damage, M about 15%, Q about 25%, and H about 30%. Higher is not automatically better: the redundant data has to live somewhere, so raising the level packs more modules into the same square. More modules means smaller squares at the same printed size, which is harder for a camera to resolve — you can make a code less scannable by protecting it more.` },
      { heading: "Which to actually use", body: `M is a sensible default and is where most generators sit. Use L when the content is long and the code is displayed on a clean screen where nothing will damage it. Use Q or H for anything printed on a surface that will be handled, wiped, folded or stuck outdoors — table cards, packaging, equipment labels, anything in a workshop.` },
      { heading: "The logo trick", body: `Putting a logo in the middle of a QR code works precisely because of error correction: the logo is damage, and the code recovers from it. That only holds if the level is high enough — H, or at least Q — and if the logo stays small, around 20–25% of the width at most. Cover more than the level can recover and the code is simply broken, which you will only discover after printing.` },
      { heading: "Always test the real thing", body: `Whatever level you pick, scan the final artefact — the actual print, at the actual size, under the actual lighting — with more than one phone. A preview on a bright monitor is a much easier test than a matte sticker in a dim room.` },
      { heading: "Generate a QR code now — free", body: `Pick your level, size and colours, and download PNG or SVG. It all runs in your browser.` },
    ],
  },
  {
    slug: "qr-code-for-business-card-free",
    title: "Put a QR Code on Your Business Card (Free, No Sign-Up)",
    metaTitle: "Business Card QR Code Generator Free | Pixel Shine",
    metaDescription:
      "Add a contact QR code to your business card free. Encode a vCard so a scan saves your details straight to their phone. SVG for print.",
    excerpt:
      "A QR code on a business card can drop your full contact details into someone's phone in one scan — no typing, no lost card.",
    date: "2026-08-25",
    readTime: "5 min read",
    category: "Tutorial",
    keywords: ["business card qr code", "vcard qr code free", "contact qr code generator", "qr code for business card"],
    toolHref: "/qr-code-generator",
    toolLabel: "Make a Contact QR Code — Free →",
    sections: [
      { body: `The point of a business card is that your details end up in someone's phone. Most cards fail at that: they go in a pocket, then a drawer, and the details are never typed in. A QR code that encodes a vCard closes the gap — one scan and their phone offers to save the contact.` },
      { heading: "The vCard format", body: `A vCard is plain text in a defined shape, so any generator that takes text can encode it:

BEGIN:VCARD
VERSION:3.0
N:Patil;Jitesh;;;
FN:Jitesh Patil
ORG:Your Company
TITLE:Founder
TEL:+911234567890
EMAIL:you@example.com
URL:https://example.com
END:VCARD

N is surname then first name. FN is the name as it should display. Keep every line break exactly as shown.` },
      { heading: "Keep it short", body: `Every extra field adds data, and more data means more modules packed into the same square, which makes the code denser and harder to scan at business-card size. Name, one phone number, one email and one URL is usually the right set. Postal addresses and second phone numbers are what tip a card-sized code over into unreliable.` },
      { heading: "Or just link to a page", body: `The alternative is encoding a single short URL to a contact page on your site. The code stays sparse and easy to scan, and you can update the details afterwards without reprinting. The trade is that it needs a working internet connection at the moment of scanning, whereas a vCard does not.` },
      { heading: "Download SVG for the printer", body: `Business cards are printed small, so sharpness matters. Download the SVG and hand it to your printer or drop it into your layout — it stays crisp at any size, where an enlarged PNG goes blocky. Aim for at least 2cm across on the card and keep the pale margin.` },
      { heading: "Make your contact code now — free", body: `Paste your vCard, download the SVG, add it to your card. Free, no account, and your details never leave your browser.` },
    ],
  },

  // ── Blur / pixelate ───────────────────────────────────────────────────────
  {
    slug: "blur-face-in-photo-free",
    title: "How to Blur a Face in a Photo (Free, In Your Browser)",
    metaTitle: "Blur a Face in a Photo Free Online | Pixel Shine",
    metaDescription:
      "Blur or pixelate a face in any photo free online. Drag a box over it, adjust the strength, download — nothing is uploaded.",
    excerpt:
      "Blurring a face before you post a photo takes about ten seconds — and the photo never has to leave your device to do it.",
    date: "2026-09-08",
    readTime: "5 min read",
    category: "Tutorial",
    keywords: ["blur face in photo free", "blur face online", "hide face in picture", "censor face free"],
    toolHref: "/blur-image",
    toolLabel: "Blur a Face — Free →",
    sections: [
      { body: `You want to post a photo from an event, a classroom or a family gathering, but not everybody in it agreed to be on the internet. Blurring their faces is the normal, courteous fix, and it does not need an app or an account.` },
      { heading: "How to do it", body: `Open the blur tool and drop your photo in. Drag a box over the face you want to hide, and it is blurred immediately at full resolution — not just in the preview. Repeat for each face. Adjust the strength slider until the face is genuinely unrecognisable rather than merely softened, then download the PNG.` },
      { heading: "Blur or pixelate?", body: `Both are offered. A blur reads as more natural in a photograph; pixelation reads as more deliberately censored, which is sometimes exactly the signal you want. For hiding identity, what matters is not which you pick but how strong it is — a light blur on a face can still leave it recognisable to someone who knows the person.` },
      { heading: "Cover more than the face", body: `People are identifiable from more than facial features. A name badge, a distinctive tattoo, a school logo on a uniform, a car registration in the background — blur those too if the point is anonymity. Take a proper look at the whole frame before you export.` },
      { heading: "Why in-browser matters here", body: `The tool runs entirely on your device. The photo is drawn to a canvas locally, edited locally, and downloaded locally — it is never uploaded to a server. For a photo containing someone else's face, that is not a minor detail: the safest place for it is the one where it never travelled.` },
      { heading: "Blur a face now — free", body: `Drop the photo, drag a box, download. No watermark, no sign-up, nothing uploaded.` },
    ],
  },
  {
    slug: "blur-licence-plate-in-photo-free",
    title: "How to Blur a Licence Plate in a Photo (Free)",
    metaTitle: "Blur Licence Plate in Photo Free Online | Pixel Shine",
    metaDescription:
      "Blur or pixelate a number plate before listing or posting a car photo. Free, online, nothing uploaded, no watermark.",
    excerpt:
      "Selling a car online means posting photos of it. There's no reason the registration has to be in them.",
    date: "2026-09-07",
    readTime: "4 min read",
    category: "Tutorial",
    keywords: ["blur licence plate", "blur number plate free", "hide license plate photo", "pixelate number plate"],
    toolHref: "/blur-image",
    toolLabel: "Blur a Number Plate — Free →",
    sections: [
      { body: `A registration number is a public-facing identifier that links to a vehicle and, through it, often to a person. Listing sites are full of photos with the plate in plain view. Removing it costs a few seconds and takes away a small but free piece of information about you.` },
      { heading: "How to do it", body: `Drop the photo into the blur tool, drag a box over the plate, and it is obscured immediately. Push the strength up — plates are high-contrast block characters and survive a light blur surprisingly well, which is exactly what you do not want. Check the result at full size before downloading.` },
      { heading: "Pixelate is often the better choice here", body: `For blocky, high-contrast text, pixelation at a large block size destroys the character shapes more decisively than a soft blur does. Switch modes in the tool and compare — whichever leaves you unable to read it when you zoom in is the one to use.` },
      { heading: "Don't forget the other plates", body: `Cars parked behind yours have plates too, and reflections in a shiny bonnet or a showroom window can carry a legible one. Scan the whole frame, not just the obvious spot.` },
      { heading: "It never leaves your device", body: `The editing happens in your browser on a canvas — the photo is not uploaded anywhere. That is worth knowing when the entire reason you are here is to remove identifying information.` },
      { heading: "Blur a plate now — free", body: `Drop the photo, drag a box, download. Free, no watermark, nothing uploaded.` },
    ],
  },
  {
    slug: "blur-sensitive-info-in-screenshot-free",
    title: "Blur Sensitive Information in a Screenshot Before You Share It",
    metaTitle: "Blur Info in a Screenshot Free Online | Pixel Shine",
    metaDescription:
      "Hide names, emails, account numbers and addresses in a screenshot. Blur or pixelate them free online — nothing is uploaded.",
    excerpt:
      "Screenshots leak more than people mean them to: an email address in the header, a name in a sidebar, a balance in the corner.",
    date: "2026-09-06",
    readTime: "5 min read",
    category: "Tutorial",
    keywords: ["blur screenshot free", "hide info in screenshot", "censor screenshot online", "redact screenshot free"],
    toolHref: "/blur-image",
    toolLabel: "Censor a Screenshot — Free →",
    sections: [
      { body: `Screenshots are the most casually shared images there are, and they routinely carry more than the thing being pointed at: the account email in a corner, a customer's name in a list, a notification that slid in at the top, an order number, a balance. Most of it is invisible to the person sharing because they have stopped noticing their own interface.` },
      { heading: "Look at the edges first", body: `The subject of the screenshot is almost never the problem. The problem is the browser tab titles, the sidebar, the account menu, the notification banner and the taskbar. Scan the border of the image before you scan the middle.` },
      { heading: "How to censor it", body: `Drop the screenshot into the tool and drag a box over each thing that should not be public. Every box is applied at full resolution, so what you see is what downloads. Use as many boxes as you need, adjust the strength, then download the PNG.` },
      { heading: "Use pixelate at a large block size for text", body: `Text is the easiest thing to recover from a weak censor. A gentle blur on a short string — a six-digit code, a short name — can sometimes be worked back by someone determined. Pixelation with a large block size removes far more information. When it matters, crank it until the shape of the text is gone entirely, not just soft.` },
      { heading: "The strongest option is cropping", body: `If the sensitive part is at the edge, crop it off rather than obscuring it. Removed pixels cannot be recovered by anyone, which is a stronger guarantee than any amount of blur. Use the cropper for that, then blur whatever is left in the middle.` },
      { heading: "Censor a screenshot now — free", body: `Drag boxes over anything private and download. It all happens in your browser — the screenshot is never uploaded.` },
    ],
  },
  {
    slug: "pixelate-vs-blur-which-is-safer",
    title: "Pixelate or Blur: Which Actually Hides Information?",
    metaTitle: "Pixelate vs Blur — Which Is Safer? | Pixel Shine",
    metaDescription:
      "Blur and pixelation hide information differently, and both can be too weak. How to censor an image so it stays censored — free tool, nothing uploaded.",
    excerpt:
      "Both look censored. Only one of them reliably is — and it depends far more on strength than on which you pick.",
    date: "2026-09-05",
    readTime: "5 min read",
    category: "Guide",
    keywords: ["pixelate vs blur", "is blurring safe", "censor image properly", "redact image free"],
    toolHref: "/blur-image",
    toolLabel: "Censor an Image — Free →",
    sections: [
      { body: `Both blur and pixelation destroy detail, and both are reversible in principle if too little was destroyed. The practical question is not which effect you choose but how much information survives it — and that is a question of strength far more than of mode.` },
      { heading: "What a blur does", body: `A blur averages each pixel with its neighbours. At low strength that is a cosmetic softening and the underlying structure is largely intact — which is why a lightly blurred face can still be recognised by someone who knows it, and lightly blurred large text can often still be read. At high strength the region becomes a smooth gradient with almost nothing left.` },
      { heading: "What pixelation does", body: `Pixelation replaces each block with a single averaged colour. With a large block size, a whole character of text collapses into one flat square and there is genuinely nothing to recover. With a small block size, you have kept a low-resolution image of the original — and a low-resolution image of a six-digit number is not many guesses away from the number.` },
      { heading: "The rule that actually matters", body: `Whichever you use, push it until the censored area carries no structure you can perceive. Zoom in on the result. If you can still see the outline of letters or the shape of a face, it is not strong enough. This single check matters more than the choice of mode.` },
      { heading: "And when it really matters, crop or cover", body: `For anything genuinely sensitive — account numbers, government IDs, medical details — the safest answer is to remove the pixels rather than transform them. Crop the region away, or paste a solid block over it. Neither is reversible, because there is nothing left to reverse.` },
      { heading: "Try both now — free", body: `The tool has blur and pixelate side by side with a strength slider, so you can compare on your own image. It runs in your browser and uploads nothing.` },
    ],
  },
  {
    slug: "blur-image-online-without-uploading",
    title: "Blur an Image Without Uploading It Anywhere",
    metaTitle: "Blur an Image Online — Nothing Uploaded | Pixel Shine",
    metaDescription:
      "Blur or pixelate part of a photo entirely in your browser. The image is never uploaded to a server. Free, no sign-up, no watermark.",
    excerpt:
      "The thing you're censoring is the reason you'd rather not upload the photo. So don't.",
    date: "2026-09-01",
    readTime: "4 min read",
    category: "Guide",
    keywords: ["blur image without uploading", "private image editor", "blur image offline", "blur photo browser"],
    toolHref: "/blur-image",
    toolLabel: "Blur Privately — Free →",
    sections: [
      { body: `There is an awkwardness at the centre of most online censoring tools: to hide the sensitive part of an image, you first send the whole uncensored image to someone else's server. Whatever the privacy policy says, the original has now been somewhere you do not control, complete with the thing you were trying to hide.` },
      { heading: "What in-browser actually means", body: `This tool loads your image into a canvas element inside the page and does the blurring with your own device's graphics. No network request carries the image. You can verify it the honest way: open your browser's network tab, edit a photo, and watch for an upload that never happens. Or disconnect your WiFi after the page loads and keep working.` },
      { heading: "What that gets you", body: `Nothing to retain, nothing to leak in a breach, no copy sitting in a processing queue, no question about how long it is kept. For a photo of someone else's face, a screenshot of an account, or a document you are redacting, that is the meaningful difference between two otherwise identical tools.` },
      { heading: "The limits, honestly", body: `Very large images are limited by your device's memory rather than by a server's, so a huge panorama may be slow on an old phone. And the output is a PNG, which is lossless and therefore not small — run it through the compressor afterwards if you need a lighter file.` },
      { heading: "Blur something now — free", body: `Drop an image in, drag a box, download. No account, no upload, no watermark.` },
    ],
  },
  {
    slug: "blur-part-of-image-for-documentation-free",
    title: "Blur Part of an Image for Docs and Tutorials (Free)",
    metaTitle: "Blur Part of an Image Free Online | Pixel Shine",
    metaDescription:
      "Writing docs or a tutorial? Blur the parts of a screenshot that shouldn't be public, free online. Nothing uploaded, no watermark.",
    excerpt:
      "Every tutorial screenshot has a bit that shouldn't ship: a real customer name, an internal URL, a licence key.",
    date: "2026-08-29",
    readTime: "4 min read",
    category: "Tutorial",
    keywords: ["blur part of image", "blur screenshot for documentation", "censor part of image free", "blur image free"],
    toolHref: "/blur-image",
    toolLabel: "Blur Part of an Image — Free →",
    sections: [
      { body: `Writing documentation means taking screenshots of a real system, and a real system has real data in it. Customer names, internal hostnames, API keys, ticket numbers, a colleague's avatar — none of it belongs in a public help centre, and all of it tends to be in the screenshot you just took.` },
      { heading: "Blur what's private, keep what's instructive", body: `The value of a screenshot is showing where things are and what they look like. You can obscure a customer name and still show the customer list. Blur the specific values, not the layout — if a reader cannot tell which screen they are looking at, you have censored too much.` },
      { heading: "How to do it", body: `Drop the screenshot in, drag a box over each private value, and adjust the strength. Every box applies at full resolution, so what you see in the preview is what you get in the file. Undo is there if a box lands in the wrong place, and reset starts the image over.` },
      { heading: "Keep it consistent across a set", body: `If a doc has twelve screenshots, use the same mode and roughly the same strength in all of them. A page where some things are lightly blurred and others are heavily pixelated looks careless, and readers notice the inconsistency more than the censoring.` },
      { heading: "Better still: use fake data", body: `Where you can, take the screenshot against a demo account with invented names and values. Nothing to censor is always cleaner than something censored — and the screenshot stays usable when someone later needs to re-crop it.` },
      { heading: "Blur an image now — free", body: `Drop it in, drag boxes, download the PNG. Free, in the browser, nothing uploaded.` },
    ],
  },

  // ── Compress ──────────────────────────────────────────────────────────────
  {
    slug: "compress-image-to-200kb-free",
    title: "How to Compress an Image to 200 KB (Free)",
    metaTitle: "Compress Image to 200 KB Free Online | Pixel Shine",
    metaDescription:
      "Hit a 200 KB upload limit exactly. Compress any photo free online with a live size read-out — no watermark, no sign-up.",
    excerpt:
      "200 KB is the limit on a surprising number of forms. Here's how to land just under it without wrecking the photo.",
    date: "2026-08-20",
    readTime: "4 min read",
    category: "Tutorial",
    keywords: ["compress image to 200kb", "reduce image size to 200kb", "compress photo free", "image compressor online free"],
    toolHref: "/compress-image",
    toolLabel: "Compress to 200 KB — Free →",
    sections: [
      { body: `200 KB turns up constantly as an upload ceiling — exam portals, job applications, government forms, membership sites. A phone photo is typically 3–8 MB, so you need to shed around 95% of the file. That sounds drastic and usually is not, because most of that data is detail the form will never display.` },
      { heading: "Compress first, and watch the number", body: `Open the compressor, drop the photo in, and drag the quality slider down while the live size read-out updates. Stop a little under 200 KB rather than exactly on it — some portals count slightly differently, and a 199 KB file that gets rejected for being 201 KB is a miserable way to spend an afternoon.` },
      { heading: "If quality gets ugly before you get there", body: `That means the image has more pixels than it needs. Resize it smaller first — a form photo rarely needs to be wider than about 1000px — and then compress. Fewer pixels at decent quality nearly always beats many pixels at terrible quality, and the visible result is better at the same file size.` },
      { heading: "Check the format too", body: `If your file is a PNG photograph, converting it to JPG will often cut the size dramatically before you compress anything, because PNG is a poor fit for photographic content. Use the converter, then compress. The exception is an image with transparency, which has to stay PNG or WEBP.` },
      { heading: "Compress your image now — free", body: `Drop it in, slide to your target, download. In the browser, no watermark, no account.` },
    ],
  },
  {
    slug: "compress-images-for-website-speed-free",
    title: "Compress Images for a Faster Website (Free)",
    metaTitle: "Compress Images for Website Speed Free | Pixel Shine",
    metaDescription:
      "Images are usually the heaviest thing on a page. Compress and convert them free online for faster loads and better Core Web Vitals.",
    excerpt:
      "On most sites, images are the majority of the page weight — and the easiest thing to fix.",
    date: "2026-08-19",
    readTime: "6 min read",
    category: "Guide",
    keywords: ["compress images for website", "image optimisation free", "faster website images", "webp for site speed"],
    toolHref: "/compress-image",
    toolLabel: "Compress Your Images — Free →",
    sections: [
      { body: `Open almost any slow page, look at what it downloaded, and images will be most of it. Not the framework, not the fonts — the pictures. Which is good news, because unlike a rendering bottleneck, oversized images are fixable in an afternoon with no code changes.` },
      { heading: "Serve the size you actually display", body: `The most common waste by far is a 4000px photo displayed in a 600px column. The browser downloads every one of those pixels and then throws most of them away. Resize each image to roughly the width it is displayed at — double it if you want it crisp on high-density screens — and you will often cut the file by 90% before compressing at all.` },
      { heading: "Then compress", body: `With the dimensions sensible, run each image through the compressor and pull the quality down while watching the size. For photographs on a web page, the point where quality loss becomes visible is much lower than people expect — most of the way down the slider still looks clean at display size.` },
      { heading: "Use WEBP where you can", body: `WEBP typically gives a noticeably smaller file than JPG or PNG at comparable quality, and it supports transparency. Browser support has been universal for years. The converter switches between JPG, PNG and WEBP, so converting a set of hero images to WEBP is often the single biggest remaining win.` },
      { heading: "Why this shows up in Core Web Vitals", body: `Largest Contentful Paint is usually a hero image. If that image is 3 MB, LCP is bounded by how long 3 MB takes on the visitor's connection — and on mobile data that is the whole problem. Getting the hero to a couple of hundred kilobytes tends to move the metric more than anything else you can do without touching code.` },
      { heading: "Compress your images now — free", body: `Resize, compress, convert to WEBP. All three run in your browser with no watermark and no limits.` },
    ],
  },
  {
    slug: "compress-photo-for-whatsapp-free",
    title: "Compress a Photo for WhatsApp Without Losing Quality",
    metaTitle: "Compress Photo for WhatsApp Free Online | Pixel Shine",
    metaDescription:
      "WhatsApp re-compresses photos and they arrive soft. Compress yours properly first, free online — no watermark, no sign-up.",
    excerpt:
      "WhatsApp compresses whatever you send. Compressing it yourself first means you choose what gets lost.",
    date: "2026-08-18",
    readTime: "4 min read",
    category: "Tutorial",
    keywords: ["compress photo for whatsapp", "whatsapp image quality", "send photo without losing quality", "compress image free"],
    toolHref: "/compress-image",
    toolLabel: "Compress Your Photo — Free →",
    sections: [
      { body: `Send a photo on WhatsApp and it arrives noticeably softer than the one you sent. That is the app doing its own compression on the way through, tuned for speed and data cost rather than for how your picture looks. You cannot turn it off — but you can change what it has to work with.` },
      { heading: "Why your photo gets worse", body: `WhatsApp resizes and re-compresses images to keep them small. Feeding it an 8 MB, 4000px original means an aggressive squeeze. Feeding it something already close to what it wants means much less to do, and much less damage.` },
      { heading: "Compress it yourself first", body: `Resize to around 1600px on the long edge and compress to somewhere in the region of a few hundred kilobytes. That is comfortably sharp on any phone screen, and it is close enough to WhatsApp's target that its own pass takes far less out.` },
      { heading: "Or send it as a document", body: `If the photo genuinely has to arrive untouched — a scan, a document photo, something being printed — attach it as a document rather than a photo. WhatsApp passes documents through without re-compressing, at the cost of no inline preview.` },
      { heading: "Compress your photo now — free", body: `Drop it in, pick a size, download, then send. Free, in the browser, no watermark.` },
    ],
  },
  {
    slug: "compress-png-without-losing-quality-free",
    title: "How to Compress a PNG (and When to Use JPG Instead)",
    metaTitle: "Compress PNG Free Online | Pixel Shine",
    metaDescription:
      "PNGs are often far bigger than they need to be. How to shrink one, and when converting to JPG or WEBP is the real answer. Free, no sign-up.",
    excerpt:
      "A PNG photograph is usually the wrong format, not just a big file — and that's why compressing it barely helps.",
    date: "2026-08-17",
    readTime: "5 min read",
    category: "Guide",
    keywords: ["compress png free", "reduce png file size", "png vs jpg size", "compress image without losing quality"],
    toolHref: "/compress-image",
    toolLabel: "Compress Your Image — Free →",
    sections: [
      { body: `People often arrive wanting to compress a PNG and leave disappointed, because PNG is lossless — it is designed not to throw anything away. If your PNG is enormous, the productive question is usually not "how do I compress this" but "should this have been a PNG at all".` },
      { heading: "What PNG is good at", body: `Flat colour, hard edges, text, logos, screenshots of interfaces, and anything needing transparency. For those, PNG is both small and perfectly crisp — and far better than JPG, which smears coloured fringes around sharp edges.` },
      { heading: "What it's bad at", body: `Photographs. A photo has millions of subtly different colours and no flat areas, which is the worst case for PNG's compression. The same photo as a high-quality JPG is routinely five to ten times smaller with no visible difference. If your big PNG is a photo, converting it is the fix.` },
      { heading: "How to shrink one either way", body: `If it is a photo: convert it to JPG, then compress with the quality slider. If it needs transparency: convert to WEBP instead, which keeps the transparency and is still much smaller than PNG. If it must stay PNG, resizing to the dimensions you actually display is the main lever left.` },
      { heading: "Shrink your image now — free", body: `Convert, resize and compress all run in your browser, free, with no watermark.` },
    ],
  },

  // ── Convert ───────────────────────────────────────────────────────────────
  {
    slug: "convert-webp-to-jpg-free",
    title: "How to Convert WEBP to JPG (Free, No Sign-Up)",
    metaTitle: "Convert WEBP to JPG Free Online | Pixel Shine",
    metaDescription:
      "Saved an image and got a .webp you can't open? Convert WEBP to JPG free online in your browser — no watermark, no sign-up.",
    excerpt:
      "You saved an image from the web and got a .webp that half your software refuses to open. One conversion fixes it.",
    date: "2026-08-16",
    readTime: "4 min read",
    category: "Tutorial",
    keywords: ["convert webp to jpg", "webp to jpg free", "open webp file", "image converter free"],
    toolHref: "/convert-image",
    toolLabel: "Convert WEBP to JPG — Free →",
    sections: [
      { body: `WEBP is the format most websites now serve, because it is smaller than JPG at the same quality. That is good for the web and mildly annoying when you save one: older versions of Office, some photo software and a few upload forms still will not take a .webp.` },
      { heading: "Converting it", body: `Open the converter, drop the .webp in, choose JPG as the output, and download. The conversion runs in your browser, so the image is not uploaded anywhere, and there is no watermark or account.` },
      { heading: "One thing to know about transparency", body: `WEBP supports transparent backgrounds and JPG does not. If your WEBP has transparency, converting to JPG flattens it onto a solid white background — which is standard behaviour, not a bug. If you need to keep the transparency, convert to PNG instead.` },
      { heading: "Does converting lose quality?", body: `WEBP to JPG re-encodes the image, so there is a generation of loss in principle. At high quality it is not visible. What you should not do is convert back and forth repeatedly — each round trip costs a little, and it accumulates. Convert once, from the best copy you have.` },
      { heading: "Convert your file now — free", body: `Drop the WEBP in, pick JPG, download. Free, private, no limits.` },
    ],
  },
  {
    slug: "convert-webp-to-png-free",
    title: "Convert WEBP to PNG and Keep the Transparency (Free)",
    metaTitle: "Convert WEBP to PNG Free Online | Pixel Shine",
    metaDescription:
      "Convert WEBP to PNG free online and keep transparent backgrounds intact. Runs in your browser — no watermark, no sign-up.",
    excerpt:
      "If your WEBP has a transparent background, PNG is the conversion that keeps it. JPG is the one that destroys it.",
    date: "2026-08-15",
    readTime: "4 min read",
    category: "Tutorial",
    keywords: ["convert webp to png", "webp to png transparent", "image converter free", "keep transparency convert"],
    toolHref: "/convert-image",
    toolLabel: "Convert WEBP to PNG — Free →",
    sections: [
      { body: `WEBP and PNG both support transparency, so converting between them keeps a cut-out logo or a background-free product shot intact. This is the conversion to use when the image has to sit on a coloured background without a white box around it.` },
      { heading: "How to convert", body: `Drop the .webp into the converter, choose PNG as the output, and download. Transparent areas stay transparent. It runs in your browser, so nothing is uploaded.` },
      { heading: "Why not JPG", body: `JPG has no concept of transparency. Convert a transparent image to JPG and every see-through pixel becomes solid white — which is exactly the white rectangle people end up with behind a logo and cannot explain. If transparency matters, the answer is PNG or WEBP, never JPG.` },
      { heading: "Expect a bigger file", body: `PNG is lossless, so the file will usually be larger than the WEBP you started with — sometimes several times larger. That is the price of the format. If the size matters and you only needed PNG for compatibility, consider whether the software you are feeding it accepts WEBP after all.` },
      { heading: "Convert your file now — free", body: `Drop it in, pick PNG, download with the transparency intact.` },
    ],
  },
  {
    slug: "jpg-vs-png-vs-webp-which-to-use",
    title: "JPG, PNG or WEBP: Which Image Format Should You Use?",
    metaTitle: "JPG vs PNG vs WEBP — Which to Use | Pixel Shine",
    metaDescription:
      "A plain guide to the three formats that matter, what each is good at, and how to convert between them free online.",
    excerpt:
      "Three formats cover almost everything. Picking the right one is usually worth more than any amount of compressing the wrong one.",
    date: "2026-08-14",
    readTime: "6 min read",
    category: "Guide",
    keywords: ["jpg vs png", "webp vs jpg", "which image format", "image format guide"],
    toolHref: "/convert-image",
    toolLabel: "Convert Between Formats — Free →",
    sections: [
      { body: `Almost every image you deal with will be a JPG, a PNG or a WEBP. They are not interchangeable: each throws away different things, and using the wrong one is the most common reason a file is either far too big or unexpectedly ugly.` },
      { heading: "JPG — photographs", body: `Lossy, no transparency, and extremely good at photographic content. Millions of subtly varying colours compress beautifully. Use it for photos of people, places and objects, anywhere you do not need a transparent background. Avoid it for text, screenshots and logos, where its compression leaves visible fringing around hard edges.` },
      { heading: "PNG — flat colour, text and transparency", body: `Lossless, supports transparency, and excellent at sharp edges and flat regions. Use it for logos, icons, interface screenshots and anything that has to sit on a coloured background. Avoid it for photographs, where it produces enormous files for no visible benefit.` },
      { heading: "WEBP — smaller than both, for the web", body: `Supports both lossy and lossless modes and transparency, and is typically meaningfully smaller than JPG or PNG at comparable quality. Browser support has been universal for years, so for images on a website it is usually the best choice. The friction is outside the browser: some desktop software and upload forms still will not accept it.` },
      { heading: "A rule of thumb", body: `On a website, WEBP. A photo to send someone or upload to a form, JPG. A logo, screenshot or anything transparent, PNG — or WEBP if it is staying on the web. When a form rejects your file, converting to JPG is nearly always the answer.` },
      { heading: "Convert between them now — free", body: `The converter switches between all three in your browser, keeping transparency where the target format supports it. No watermark, no sign-up.` },
    ],
  },
  {
    slug: "convert-png-to-webp-for-faster-site-free",
    title: "Convert PNG to WEBP for a Faster Site (Free)",
    metaTitle: "Convert PNG to WEBP Free Online | Pixel Shine",
    metaDescription:
      "WEBP keeps transparency and is far smaller than PNG. Convert free online in your browser — no watermark, no sign-up.",
    excerpt:
      "If your site serves PNG logos and graphics, converting them to WEBP is one of the cheapest speed wins available.",
    date: "2026-08-13",
    readTime: "4 min read",
    category: "Tutorial",
    keywords: ["convert png to webp", "png to webp free", "webp for website speed", "image converter free"],
    toolHref: "/convert-image",
    toolLabel: "Convert PNG to WEBP — Free →",
    sections: [
      { body: `PNG is lossless, which is exactly why it is big. For images on a website, that losslessness is usually buying you nothing a visitor can see — and costing them download time. WEBP gives you the same transparency support at a fraction of the size.` },
      { heading: "What you gain", body: `A typical PNG graphic converted to WEBP comes out substantially smaller with no visible difference at display size. Transparency survives, so a cut-out logo stays cut out. Multiply that across every image on a page and it is usually the largest single reduction in page weight available without changing any code.` },
      { heading: "How to convert", body: `Drop the PNG into the converter, choose WEBP as the output, and download. It runs in your browser — nothing is uploaded — and there is no watermark or limit on how many you do.` },
      { heading: "Where to keep the PNG", body: `Keep PNG for anything leaving the web: a logo you send to a printer, an asset for a partner, an image going into desktop software. Support outside browsers is still patchy enough that PNG remains the safer handover format. Convert for the site; archive the original.` },
      { heading: "Resize before you convert", body: `Format is only half of it. An image displayed at 400px wide should not be 2000px wide in the file, whatever format it is in. Resize to roughly the display size first, then convert — the two together do far more than either alone.` },
      { heading: "Convert your PNGs now — free", body: `Drop them in, pick WEBP, download. Free, private, unlimited.` },
    ],
  },

  // ── Crop ──────────────────────────────────────────────────────────────────
  {
    slug: "circle-crop-profile-picture-free",
    title: "How to Make a Circle Profile Picture (Free, Transparent PNG)",
    metaTitle: "Circle Crop a Photo Free Online | Pixel Shine",
    metaDescription:
      "Crop a photo into a circle with a transparent background, free online. Perfect for avatars, bylines and signatures — no watermark.",
    excerpt:
      "A genuinely round PNG, not a square with a circle drawn on it — which is the difference between a clean avatar and a white box.",
    date: "2026-08-12",
    readTime: "4 min read",
    category: "Tutorial",
    keywords: ["circle crop free", "round profile picture", "circle crop photo online", "transparent circle png"],
    toolHref: "/crop-image",
    toolLabel: "Circle Crop — Free →",
    sections: [
      { body: `Most platforms display a square photo inside a circular mask, so you never need a round file for them. But for anything you place yourself — a byline on your own site, an email signature, a slide, a team page — you need the image to actually be round, with transparency outside the circle. Otherwise the corners show up as a white box.` },
      { heading: "How to do it", body: `Drop the photo into the cropper and pick the Circle option. It crops to a round image with a transparent PNG background, which means it sits cleanly on any colour behind it. Download and you are done.` },
      { heading: "Centre the face with room to spare", body: `The circle cuts the corners off the square, so anything near an edge disappears. Leave visible space around the head. A portrait that looks well-framed as a square often loses the top of the head or an ear once it is round.` },
      { heading: "It has to stay a PNG", body: `Transparency only survives in PNG or WEBP. If you convert your circle to JPG, the transparent corners become solid white and you are back to the box you were avoiding. Keep it PNG for placement; convert only if the destination demands it.` },
      { heading: "Circle crop your photo now — free", body: `Drop it in, pick Circle, download the transparent PNG. No watermark, no account.` },
    ],
  },
  {
    slug: "crop-photo-for-linkedin-banner-free",
    title: "Crop a Photo for a LinkedIn Banner (Free)",
    metaTitle: "Crop Image for LinkedIn Banner Free | Pixel Shine",
    metaDescription:
      "LinkedIn banners are very wide and get covered by your profile photo. Crop yours properly, free online — no watermark, no sign-up.",
    excerpt:
      "A LinkedIn banner is unusually wide, and your profile photo sits on top of the left side of it. Crop accordingly.",
    date: "2026-08-11",
    readTime: "4 min read",
    category: "Tutorial",
    keywords: ["linkedin banner size", "crop image for linkedin", "linkedin cover photo free", "crop photo online free"],
    toolHref: "/crop-image",
    toolLabel: "Crop Your Banner — Free →",
    sections: [
      { body: `LinkedIn's banner is a wide strip — around 1584×396 — which is a far more extreme ratio than any photo your camera produces. Drop a normal photo in and LinkedIn crops it for you, usually cutting the part you cared about. Cropping deliberately first means you choose what survives.` },
      { heading: "Crop wide first", body: `Open the cropper, load your image, and use a wide ratio so you can see exactly what is kept. Anything above and below the strip is gone — which on a landscape photo is most of it. Pick the horizontal band that actually reads well on its own.` },
      { heading: "Leave the lower-left alone", body: `Your profile photo overlaps the banner near the lower left on desktop, and the position shifts on mobile. Anything you place there — a face, a logo, text — will be partly covered on at least one layout. Keep that corner visually quiet and put the interesting content to the right.` },
      { heading: "Then resize to 1584 wide", body: `After cropping to the right shape, resize the width to 1584 with the ratio locked so the height lands where it should. Uploading at roughly the right size avoids LinkedIn's own resampling, which tends to soften things.` },
      { heading: "Crop your banner now — free", body: `Crop wide, resize, upload. Both tools are free, run in your browser and add no watermark.` },
    ],
  },
  {
    slug: "crop-image-for-facebook-cover-free",
    title: "Crop an Image for a Facebook Cover Photo (Free)",
    metaTitle: "Crop Image for Facebook Cover Free | Pixel Shine",
    metaDescription:
      "Facebook cover photos crop differently on mobile and desktop. Crop yours so it works on both, free online — no watermark.",
    excerpt:
      "Facebook shows a different slice of your cover photo on phones than on desktop. Design for the overlap.",
    date: "2026-08-10",
    readTime: "4 min read",
    category: "Tutorial",
    keywords: ["facebook cover photo size", "crop image for facebook", "facebook banner crop free", "crop photo free"],
    toolHref: "/crop-image",
    toolLabel: "Crop Your Cover — Free →",
    sections: [
      { body: `The recurring frustration with Facebook covers is that there is no single correct crop. Desktop shows a wide, short strip. Mobile shows a taller, narrower one. The same image is cut two different ways, and an image composed for one usually looks wrong in the other.` },
      { heading: "Compose for the middle", body: `The region visible in both layouts is a band through the centre. Put anything that matters — faces, a logo, text — in the middle of the frame, horizontally and vertically. Treat the far left and right edges as decoration that may vanish on a phone.` },
      { heading: "Crop wide, then check the centre", body: `Use the cropper's wide ratio to get the overall shape, and keep the subject central rather than pushed to one side. A well-centred composition survives both crops; a subject at the edge does not.` },
      { heading: "Upload bigger than you need", body: `Facebook re-compresses covers, and a small upload gets enlarged and softened before that. Give it something comfortably larger than the display size so its own processing has good material to work from.` },
      { heading: "Crop your cover now — free", body: `Drop the photo in, crop wide, download. Free, in the browser, no watermark.` },
    ],
  },
  {
    slug: "crop-photo-to-square-free",
    title: "How to Crop a Photo to a Perfect Square (Free)",
    metaTitle: "Crop Photo to Square Free Online | Pixel Shine",
    metaDescription:
      "Crop any photo to a perfect 1:1 square free online — one tap, no stretching, no watermark, no sign-up.",
    excerpt:
      "Cropping to a square keeps your photo's proportions. Resizing to a square squashes them. People mix these up constantly.",
    date: "2026-08-09",
    readTime: "4 min read",
    category: "Tutorial",
    keywords: ["crop photo to square", "square crop free", "1:1 crop online", "crop image free"],
    toolHref: "/crop-image",
    toolLabel: "Crop to Square — Free →",
    sections: [
      { body: `Square is the default shape for feed posts, album art, avatars and product grids, and almost no camera shoots it. Turning a rectangle into a square is a one-tap job — as long as you crop rather than resize.` },
      { heading: "Crop, don't resize", body: `Cropping to 1:1 keeps a square region of the photo and discards the rest, so everything that remains has its true proportions. Resizing a rectangle to equal width and height squashes the whole image into the square — faces get wide or narrow and it looks subtly wrong in a way people notice without identifying why.` },
      { heading: "How to do it", body: `Drop the photo into the cropper and choose Square (1:1). Position the crop over the part you want to keep and apply. Download — no watermark, no account.` },
      { heading: "Watch the edges", body: `On a portrait photo, a square crop takes a big bite out of the top and bottom; on a landscape, from the sides. Check that nothing important — the top of someone's head, a hand, the edge of a product — is being clipped. If it is, reframe rather than settling.` },
      { heading: "Then resize if a platform wants a specific size", body: `Once it is square, resizing to an exact pixel size like 1080×1080 is safe, because the shape already matches. Crop for shape, resize for pixels — in that order.` },
      { heading: "Crop to square now — free", body: `One tap, download, done. Free and private in your browser.` },
    ],
  },
];
