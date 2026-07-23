# Coco Unofficial Info Hub

A bilingual Japanese/English fan-made information hub for **Coco Hayashi (林 鼓子)**.

The site collects profile details, official links, upcoming and archived activities, a compact event calendar, and ticket information. It is built as a static React app and deployed with Cloudflare tooling.

This project is unofficial and is not affiliated with or endorsed by LIBERTE or Coco Hayashi.

## Features

- **Bilingual UI**: Uses Japanese only when the browser's primary language is Japanese; otherwise defaults to English. A manual language choice is persisted and kept in sync with the document `lang` attribute.
- **Responsive layout**: desktop navigation plus a narrow-screen menu for mobile and compact browser widths.
- **Dark mode**: system, light, and dark theme options.
- **Home calendar**: shows upcoming dated activities, highlights today, supports hover previews on desktop, and tap/click detail popups on touch or narrow screens.
- **Activities page**: groups current activities by category and moves finished activities to an archive page automatically.
- **Ticket Info page**: shows current ticket lotteries, presales, and sales. Finished ticket entries move to a past-ticket archive automatically.
- **Data-driven content**: profile, links, activities, roles, and fan projects are stored in YAML files under `src/data/`.

## Tech Stack

- [React 19](https://react.dev)
- [TypeScript](https://www.typescriptlang.org)
- [Vite 6](https://vite.dev)
- [Tailwind CSS 4](https://tailwindcss.com)
- [react-router-dom](https://reactrouter.com)
- [motion](https://motion.dev)
- [lucide-react](https://lucide.dev/icons)
- [react-icons](https://react-icons.github.io/react-icons/)
- [date-fns](https://date-fns.org/)
- [@modyfi/vite-plugin-yaml](https://github.com/Modyfi/vite-plugin-yaml)
- [Cloudflare Vite Plugin](https://developers.cloudflare.com/workers/vite-plugin/)
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/)

## Project Structure

```text
src/
├── components/          # Reusable UI components
├── config/              # Shared display metadata such as activity categories
├── data/                # YAML content files
├── hooks/               # Calendar and theme hooks
├── pages/               # Route-level pages
├── utils/               # Activity and ticket status helpers
├── App.tsx              # Routes and app shell
├── i18n.ts              # UI translation dictionary
├── index.css            # Tailwind theme and global styles
└── types.ts             # Shared TypeScript interfaces
```

Important content files:

- `src/data/activities.yaml`: activities and optional ticket information.
- `src/data/profile.yaml`: profile facts.
- `src/data/links.yaml`: all official and external resource links shown on the home page.
- `src/data/roles.yaml`: role/history data for the about page.
- `src/data/fan-projects.yaml`: fan project data, currently not routed in the app.

## Getting Started

Use Node.js and npm.

```bash
npm install
npm run dev
```

The dev script starts Vite with the project-defined host and port settings.

Useful scripts:

```bash
npm run lint      # Type-check with TypeScript
npm run build     # Build the production bundle
npm run preview   # Build and preview through Wrangler
npm run deploy    # Build and deploy with Wrangler
npm run clean     # Remove dist/
```

No local environment variables are required for normal development.

## UI Composition

New pages should be assembled from small reusable primitives instead of introducing
another all-purpose data-page schema:

- `PageLayout` and `PageHeader` provide the shared page structure and optional back link.
- `EmptyState` is included only on pages whose data can reasonably be empty.
- `ArchiveLink` provides the common current-to-history navigation.
- `ExternalAnchor` enforces consistent external-link security behavior.
- `ActivityRow`, `TicketGroup`, and `TicketEntryRow` own domain-specific display rules.
- `activityCategories.ts` is the single source for category order, labels, compact labels, and icons.

Required domain fields should stay in the TypeScript interfaces, while truly optional
display regions should be expressed as optional component props. Avoid a generic
component with many unrelated flags; prefer composition or a small discriminated
variant such as the current/past ticket-row variants.

## Activity Data Format

Activities live in `src/data/activities.yaml`. Each item should follow this shape:

```yaml
- category: "Live"
  date: "2026.09.12"
  startDate: "2026-09-12"
  title:
    ja: "LIBERTE LIVE 2026 ～ First Act ～"
    en: "LIBERTE LIVE 2026 ~ First Act ~"
  description:
    ja: "at KIWA TENNOZ"
    en: "at KIWA TENNOZ"
  link: "https://example.com"
```

Required fields:

- `category`: one of `Stage`, `Musical`, `Program`, `Event`, `Live`, `Reading`, or `Other`. Use `Program` for streamed/broadcast programs and `Event` for in-person events.
- `date`: human-readable display text. This can be a single date, date range, `Weekly`, `Monthly`, or any concise label.
- `title.ja` and `title.en`: bilingual title.
- `link`: source or official information URL.

Recommended fields:

- `startDate`: machine-readable date in `YYYY-MM-DD`.
- `endDate`: machine-readable end date in `YYYY-MM-DD` when the activity spans multiple consecutive days.
- `activeDates`: exact dates in `YYYY-MM-DD` when a multi-day activity should appear on the calendar.
- `description.ja` and `description.en`: role, venue, appearance note, or other short context.

Date behavior:

- An activity is considered past starting on the day after its last active date.
- If `activeDates` exists, the first and last values define the activity status range.
- Otherwise, status uses `endDate`, then `startDate`.
- The calendar only uses machine-readable dates. Activities with `Weekly` or `Monthly` as display-only labels should usually omit `startDate` unless there is a concrete dated occurrence to show.
- For non-consecutive runs, use `activeDates` instead of relying on a broad `startDate` to `endDate` interval.

Example with non-consecutive active dates:

```yaml
- category: "Live"
  date: "2026.06.06-07, 06.13-14"
  startDate: "2026-06-06"
  endDate: "2026-06-14"
  activeDates:
    - "2026-06-06"
    - "2026-06-07"
    - "2026-06-13"
    - "2026-06-14"
  title:
    ja: "イベント名"
    en: "Event Title"
  description:
    ja: "出演情報"
    en: "Appearance details"
  link: "https://example.com"
```

## Ticket Data Format

Only activities with ticket information need a `ticketInfo` block. Ticket entries are shown on the Ticket Info page while they are current, and move to the past-ticket archive after their `endDate` has passed.

```yaml
- category: "Live"
  date: "2026.09.12"
  startDate: "2026-09-12"
  title:
    ja: "LIBERTE LIVE 2026 ～ First Act ～"
    en: "LIBERTE LIVE 2026 ~ First Act ~"
  description:
    ja: "at KIWA TENNOZ"
    en: "at KIWA TENNOZ"
  link: "https://example.com/event"
  ticketInfo:
    venue:
      ja: "KIWA TENNOZ"
      en: "KIWA TENNOZ"
    officialUrl: "https://example.com/tickets"
    entries:
      - type:
          ja: "-鼓星- 先行予約受付"
          en: "Fan Club Presale"
        startDate: "2026-07-04"
        endDate: "2026-07-12"
        period: "2026.07.04-07.12"
        price:
          ja: "7,700円 + ドリンク代600円"
          en: "7,700 yen + 600 yen drink fee"
        note:
          ja: "LIBERTE TICKETにて受付"
          en: "Available through LIBERTE TICKET"
        link: "https://example.com/tickets/presale"
```

Ticket field notes:

- `ticketInfo.venue`: optional venue override for the ticket page.
- `ticketInfo.officialUrl`: optional fallback URL for ticket entries.
- `entries`: list of ticket lotteries, presales, general sales, or TBA entries.
- `entry.type.ja` and `entry.type.en`: visible ticket entry name. This text is clickable in the UI.
- `entry.startDate`: `YYYY-MM-DD`; used to mark the entry as upcoming before this date.
- `entry.endDate`: `YYYY-MM-DD`; used to move the entry to the archive after this date. If the official cutoff is unknown, use the activity `endDate` as the fallback.
- `entry.period`: language-independent, human-readable sale/application period.
- `entry.price`: human-readable price details.
- `entry.note`: optional extra details.
- `entry.link`: optional URL for this exact ticket entry. If omitted, the UI falls back to `ticketInfo.officialUrl`, then the activity `link`.

Ticket status behavior:

- `upcoming`: today is before `entry.startDate`.
- `open`: today is on or after `entry.startDate`, and not after `entry.endDate`.
- `past`: today is after `entry.endDate`.
- `tba`: no machine-readable ticket dates are provided.

For sales without a published cutoff, use the parent activity `endDate` instead of an empty string so the entry can move to the archive.

## Contribution Notes

When adding or editing content:

- Keep Japanese and English fields in sync.
- Use `YYYY-MM-DD` for machine-readable date fields.
- Use the `date` and `period` fields for display text; do not rely on them for sorting or status logic.
- Prefer exact source links from official sites or reliable announcements.
- For recurring programs, use `date: "Weekly"` or `date: "Monthly"` and describe the schedule in `description`; avoid generating infinite calendar dates.
- Run `npm run lint` and `npm run build` before opening a PR.

## Deployment

The project includes Cloudflare configuration through `wrangler.jsonc` and the Cloudflare Vite plugin.

```bash
npm run build
npm run deploy
```

Cloudflare deployment may require local Wrangler authentication or project-level Cloudflare settings.

## License

This project is licensed under the Apache License 2.0. See `LICENSE`.

## Disclaimer

This is an unofficial fan project. It is not affiliated with or endorsed by LIBERTE or Coco Hayashi. All event and ticket information should be verified against official sources before use.
