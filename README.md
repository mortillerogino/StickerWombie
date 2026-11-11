# StickerWombie

Just Budget stickers you can copy straight into a Microsoft Teams chat.

Open the site, click a sticker, and paste it into Teams with Ctrl+V (Cmd+V on Mac).

## Files

- `index.html` is the page markup, with no build step.
- `css/styles.css` holds the styles.
- `js/app.js` builds the sticker grid and handles copying.
- `stickers/wombie/`, `stickers/case-manager-bm/` and `stickers/case-manager-bm-2/` hold each character's transparent PNG stickers. Characters are listed at the top of `js/app.js`; the first one is shown by default.
- `stickers/data.js` holds embedded copies of the stickers, so copying also works when `index.html` is opened as a local file.

## Hosting

Any static host works, for example Netlify (publish directory `/`, no build command) or GitHub Pages.
Copying needs the site served over https.
