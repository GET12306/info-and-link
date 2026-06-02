# Coco Unofficial Info Hub

A bilingual (Japanese/English) fan-made information hub for **Coco Hayashi (林 鼓子)** — a Japanese voice actress, stage actress, and idol.

Built with React 19 + TypeScript + Vite + Tailwind CSS.

## Features

- **Profile** — birth date, birthplace, voice range, agency info
- **Links** — official X, Instagram, agency homepage, fan club, radio show
- **Activities** — categorized timeline of stage, musical, program, and live performances
- **Fan Projects** — community-driven initiatives (flower stands, etc.)
- **Dark Mode** — switch between System, Light, and Dark themes; persists preference
- **Language Toggle** — switch between 日本語 and English

## Tech Stack

- [React 19](https://react.dev)
- [TypeScript](https://www.typescriptlang.org)
- [Vite 6](https://vite.dev)
- [Tailwind CSS 4](https://tailwindcss.com)
- [react-router-dom](https://reactrouter.com) (hash-based routing with code splitting)
- [motion](https://motion.dev) (page transitions)
- [lucide-react](https://lucide.dev/icons) (icons)
- [@modyfi/vite-plugin-yaml](https://github.com/Modyfi/vite-plugin-yaml) (YAML data files)

## Project Structure

```
src/
├── components/     # Reusable UI components
├── data/           # YAML data files (profile, links, activities, etc.)
├── hooks/          # Custom hooks
├── pages/          # Route-level page components
├── i18n.ts         # Translation dictionary
└── types.ts        # Shared TypeScript interfaces
```

## Getting Started

**Prerequisites:** Node.js

```bash
npm install
npm run dev
```

## Disclaimer

This is an unofficial fan project. It is not affiliated with or endorsed by LIBERTE or Coco Hayashi.
