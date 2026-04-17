# 🐺 WOLF TECH — WhatsApp Session Generator

![WOLF TECH Session Generator](https://i.ibb.co/zVmsnGVS/Screenshot-2026-04-17-022549.png)

A clean, open-source WhatsApp session generator built with [Baileys](https://github.com/WhiskeySockets/Baileys).  
Clone it, edit one config file, and run your own pair-code / QR-code site for any WhatsApp bot.

---

## Features

- **Pair Code** — enter your number, get a code, link via WhatsApp Linked Devices
- **QR Code** — scan with WhatsApp to link instantly
- **Session DM** — session string sent directly to your WhatsApp after linking
- **One config file** — `config.js` is the only file you ever edit
- **Minimal** — no database, no auth layer, no bloat

---

## Quick Start

```bash
git clone https://github.com/sil3nt-wolf/wolfXpair
cd wolfXpair
npm install
node server.js
```

Open `http://localhost:3000` in your browser.

---

## Configuration

Edit **`config.js`** — every field that appears in the UI and the post-link DM is driven from here:

```js
export const CONFIG = {
  BOT_NAME:       'WOLF TECH',          // display name
  SESSION_PREFIX: 'WOLF-TECH',          // prefix of the session string
  TAGLINE:        'WhatsApp Device Linking',
  NAV_SUB:        'Session Generator',

  AUTHOR:         'Silent Wolf',        // shown in post-link DM card
  DEPLOY_HOST:    'host.xwolf.space',   // your bot hosting domain
  PANEL_HOST:     'panel.xwolf.space',  // your panel domain
  GITHUB_URL:     'https://github.com/sil3nt-wolf',
};
```

No other file needs changing.

---

## How It Works

1. User enters their WhatsApp number → server connects to WhatsApp via Baileys
2. WhatsApp returns a pairing code (or QR) → shown in the browser
3. User enters the code in WhatsApp → **Settings → Linked Devices → Link a Device → Link with phone number instead**
4. Device links → session string is sent to user's WhatsApp DMs as two messages:
   - **Message 1** — raw session string
   - **Message 2** — branded info card

---

## Session String Format

```
WOLF-TECH:~eyJub2lzZXlLZXlzIjp7...
```

---

## File Structure

```
├── server.js       Express server, API routes
├── config.js       ← only file you edit
├── whatsapp.js     Baileys integration
├── package.json
└── public/
    ├── index.html  Landing page
    ├── pair.html   Pair code page
    ├── pair.js
    ├── qr.html     QR code page
    ├── qr.js
    └── preview.png OG / thumbnail image
```

---

## Live Demo

> [wolfxpair.xwolf.space](https://wolfxpair.xwolf.space)

---

## Credits

Built by [Silent Wolf](https://github.com/sil3nt-wolf)  
Powered by [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys)
```
Enjoy.
