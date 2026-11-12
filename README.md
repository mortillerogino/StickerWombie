# StickerWombie

Just Budget stickers you can copy straight into a Microsoft Teams chat.

Open the site, click a sticker, and paste it into Teams with Ctrl+V (Cmd+V on Mac).

## Files

- `index.html` is the page markup, with no build step.
- `css/styles.css` holds the styles.
- `js/app.js` builds the sticker grid and handles copying.
- `js/request.js` runs the "Would you like to be added as a sticker?" form. Photos (PNG/JPG up to 25 MB) are resized in the browser to fit Netlify's 8 MB form limit, then sent to Netlify Forms as `sticker-request`.
- `stickers/wombie/` and `stickers/case-manager-bm/` hold each character's transparent PNG stickers. Characters are listed at the top of `js/app.js`; the first one is shown by default.
- `stickers/<character>/web/` holds small WebP copies (440px) shown on the page so it loads fast; the full PNG is what gets copied. Regenerate them when adding stickers.
- `fonts/` holds the self-hosted Fraunces and Plus Jakarta Sans fonts (latin subset).
- `_headers` sets long cache times on Netlify for fonts and stickers.
- `stickers/data.js` holds embedded copies of the stickers, so copying also works when `index.html` is opened as a local file.

## Hosting

Any static host works, for example Netlify (publish directory `/`, no build command) or GitHub Pages.
Copying needs the site served over https.

## Sticker requests

Submissions appear in Netlify under the site's **Forms** tab, in the `sticker-request` form. Each one has the person's name, email, the sticker poses they'd like and a link to their photo. Form detection must be enabled for the site.
