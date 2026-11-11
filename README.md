# StickerWombie

Just Budget stickers you can copy straight into a Microsoft Teams chat.

Open the site, click a sticker, and paste it into Teams with Ctrl+V (Cmd+V on Mac).

## Files

- `index.html` is the whole site, with no build step.
- `stickers/` holds the 12 transparent PNG stickers.
- `stickers/data.js` holds embedded copies of the stickers, so copying also works when `index.html` is opened as a local file.

## Hosting

Any static host works, for example Netlify (publish directory `/`, no build command) or GitHub Pages.
Copying needs the site served over https.
