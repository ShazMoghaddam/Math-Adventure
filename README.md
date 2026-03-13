# 🐰 Math Adventure

> **Help Benny the bunny hop home by solving maths puzzles!**

A free, offline-capable maths game for children aged 4–9. No ads, no accounts, no data collection — just fun learning.

🎮 **[Play now →](https://shazmoghaddam.github.io/math-adventure)**

---

## 🌍 Worlds

| World | Topic | Ages |
|-------|-------|------|
| 🌿 Clover Meadow | Counting & subitising | 4–6 |
| 🌻 Sunflower Fields | Addition | 5–7 |
| 🍁 Autumn Forest | Subtraction | 6–8 |
| 💎 Crystal Peak | Mixed + place value | 7–9 |
| 🏔️ Number Mountain | Times tables | 8–10 |
| 🌊 River Divide | Division | 9–11 |

Each world has 5 questions per round, adaptive difficulty, word problems, and a collectible badge. An optional ⏱ Time Trial mode adds extra challenge.

---

## ✨ Features

- **Adaptive difficulty** — questions get harder or easier based on performance
- **Diverse question types** — dice patterns, number lines, arrays, word problems, missing numbers, estimation, fact families, place value, division with remainders
- **Streak system** — build combos for score multipliers and Benny animations
- **Review mode** — see missed questions after each level
- **Trophy room** — collect badges and carrots across sessions
- **Fully offline** — works as a PWA, installable on any phone or tablet
- **Accessible** — ARIA live regions, reduced-motion support, screen-reader announcements
- **No data collected** — progress saved to device only

---

## 📁 File Structure

```
math-adventure/
├── index.html          # Main game
├── script.js           # All game logic
├── style.css           # All styles
├── manifest.json       # PWA manifest
├── sw.js               # Service worker (offline support)
├── privacy-policy.html # Privacy policy
└── icons/              # App icons (see below)
    ├── icon-72.png
    ├── icon-96.png
    ├── icon-128.png
    ├── icon-144.png
    ├── icon-152.png
    ├── icon-192.png    ← also used as Apple Touch Icon
    ├── icon-384.png
    └── icon-512.png
```

---

## 🚀 Deployment (GitHub Pages)

1. Fork or clone this repository
2. Go to **Settings → Pages**
3. Set Source to **Deploy from a branch** → `main` → `/ (root)`
4. Click **Save**
5. Your game will be live at `https://[your-username].github.io/math-adventure` within a minute or two

> ⚠️ If you rename the repository, update `"start_url"` in `manifest.json` to match.

---

## 🖼️ Icons

The `icons/` folder is not included in this repo — you need to create your own icon set before deploying.

**Required sizes:** 72 · 96 · 128 · 144 · 152 · 192 · 384 · 512 px (all PNG)

**Recommended tools:**
- [PWABuilder Image Generator](https://www.pwabuilder.com/imageGenerator) — paste one 512×512 image, downloads all sizes
- [RealFaviconGenerator](https://realfavicongenerator.net) — also generates the Apple Touch Icon and favicon.ico

For the 192px and 512px icons, also create **maskable** versions with ~20% padding around the icon so Android adaptive icons don't crop the artwork. [Maskable.app](https://maskable.app/editor) is a free editor for this.

---

## 🔧 Local Development

No build step required — it's plain HTML, CSS, and JS.

```bash
# Clone the repo
git clone https://github.com/shazmoghaddam/math-adventure.git
cd math-adventure

# Serve locally (service worker requires a server, not file://)
npx serve .
# or
python3 -m http.server 8080
```

Then open `http://localhost:8080` in your browser.

> Note: The service worker only activates over HTTPS or `localhost`. Use one of the above servers rather than opening `index.html` directly.

---

## 📱 Installing as an App

**On Android (Chrome):**
Tap the three-dot menu → *Add to Home Screen*

**On iPhone/iPad (Safari):**
Tap the Share button → *Add to Home Screen*

Once installed, the game runs fullscreen and works completely offline.

---

## 🔒 Privacy

Math Adventure collects no personal data. Game progress is stored only on the player's device using `localStorage`.

Full details: [Privacy Policy](https://shazmoghaddam.github.io/math-adventure/privacy-policy.html)

---

## 📋 Roadmap

- [ ] Icon set & maskable icons
- [ ] App Store screenshots
- [ ] Google Play release (via PWABuilder)
- [ ] iOS App Store release (via Capacitor)
- [ ] Localisation (Spanish, French)
- [ ] Parent/teacher progress dashboard

---

## 👩‍💻 Author

Made with 🥕 by **Shaz Moghaddam**
📧 shaz.moghaddam@gmail.com
🌐 [shazmoghaddam.github.io](https://shazmoghaddam.github.io/)

---

## 📄 Licence

This project is currently **All Rights Reserved**.
Please contact the author before using, copying, or distributing any part of this project.
