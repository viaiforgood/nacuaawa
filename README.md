# NACUAA WA Website

The official website for the **North America Colleges and Universities Alumni Alliance, Washington State Chapter (Seattle Chapter)** (北美高校联盟华盛顿州分会 / 西雅图分会).

- 🌐 **Live Website**: [https://wa.nacuaa.ai](https://wa.nacuaa.ai)
- 👤 **President**: Ashley Qi (戚霄), `ashley@nacuaa.ai`

## Tech Stack
* **Framework**: Astro (v5)
* **Styling**: Tailwind CSS (v4)
* **Internationalization**: Custom lightweight i18n routing (`zh-CN`, `en`, `zh-TW`)
* **Deployment**: Cloudflare Pages (`nacuaawa.pages.dev`)

## Features
* 🌐 **Full i18n Support**: Supports Simplified Chinese (`zh-CN`, default), English (`en`), and Traditional Chinese (`zh-TW`).
* 🎨 **Theme & Design**: Responsive layout with dark-mode navy & slate palettes and custom typography.
* 👥 **Leadership Roster**: Highlights chapter leadership (President Ashley Qi 戚霄).
* 📝 **Official Activity Release of Liability Agreement (Waiver)**: Bilingual waiver terms, electronic touch handwriting signature pad, auto-generated PDF receipts via `pdf-lib`, and optional Cloudflare Workers/R2 archiving backend (`/waiver/`, `/waiver/admin/`).
* 🏆 **Specialized Alumni Clubs**: Dedicated directory and club pages for Guandan, Hike, Pickleball, Golf, Tennis, Music, Garden, AI, and AI Creative Media.

## Local Development
Install dependencies:
```bash
npm install
```

Start dev server:
```bash
npm run dev
```

Build production static bundle:
```bash
npm run build
```

## Cloudflare Pages Deployment
Deployed via Cloudflare Pages:
* **Project**: `nacuaawa`
* **Custom Domain**: `wa.nacuaa.ai`
* **Build Command**: `npm run build`
* **Output Directory**: `dist`


