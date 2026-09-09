# Coco Unofficial Info Hub

A bilingual Japanese/English fan-made information hub for **Coco Hayashi (林 鼓子)**.

The site collects profile details, official links, upcoming and archived activities, a compact event calendar, and ticket information. It is built as a static React app and deployed with Cloudflare tooling.

This project is unofficial and is not affiliated with or endorsed by LIBERTE or Coco Hayashi.

## Features

- **Bilingual UI**: Uses Japanese only when the browser's primary language is Japanese; otherwise defaults to English. A manual language choice is persisted and kept in sync with the document `lang` attribute.
- **Responsive layout**: desktop navigation plus a narrow-screen menu for mobile and compact browser widths.
- **Dark mode**: system, light, and dark theme options.
- **Home calendar**: shows dated activities directly in each day, supports JST performance times and multiple performances per day, and uses a compact responsive layout on narrow screens.
- **Activities page**: groups current activities by category and moves finished activities to an archive page automatically.
- **Add to calendar**: downloads one performance or all remaining known performances as an ICS file, with automatic readiness checks and a manual content switch.
- **Ticket Info page**: shows current ticket lotteries, presales, and sales. Finished ticket entries move to a past-ticket archive automatically.
- **Photobooks page**: presents published photobooks in a poster-style archive with long-form descriptions, bibliographic details, cover attribution, and official links.
- **Data-driven content**: profile, links, activities, photobooks, roles, and fan projects are stored in YAML files under `src/data/`.

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
- `src/data/photobooks.yaml`: published photobooks, descriptions, cover sources, bibliographic details, and official links.
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
npm run editor    # Open the local activity YAML editor on 127.0.0.1:7231
npm run lint      # Type-check with TypeScript
npm run test:calendar # Calendar export and readiness regression tests
npm run test:editor   # Activity schema, ID, and YAML round-trip tests
npm run test:tickets  # Ticket boundary and status regression tests
npm run build     # Build the production bundle
npm run preview   # Build and preview through Wrangler
npm run deploy    # Build and deploy with Wrangler
npm run clean     # Remove dist/
```

No local environment variables are required for normal development.

## Local Activity Editor

For routine activity and ticket updates, start the repository-local editor:

```bash
npm run editor
```

Then open `http://127.0.0.1:7231/editor.html`. The editor can search, create,
duplicate, and delete activities; edit and reorder performances, milestones, and
ticket entries; preview the selected YAML; and validate the entire file before saving.
It writes directly to `src/data/activities.yaml`, so review the Git diff as usual.

The editor server binds only to the loopback interface, rejects non-local API calls,
checks that the YAML has not changed since it was loaded, validates again on save,
and replaces the file atomically. `editor.html` is explicitly excluded from the
production build and has no deployed write API.

Simple top-level fields are described in `src/editor/activityEditorSchema.ts`, so a
future text, URL, date, number, checkbox, or select field can be added to the form by
updating that schema. Nested structures with their own ordering or conditional rules
still need a focused editor component. Unknown fields are retained when existing data
is edited and are surfaced in the UI rather than silently discarded.

## UI Composition

New pages should be assembled from small reusable primitives instead of introducing
another all-purpose data-page schema:

- `PageLayout` and `PageHeader` provide the shared page structure and optional back link.
- `EmptyState` is included only on pages whose data can reasonably be empty.
- `ArchiveLink` provides the common current-to-history navigation.
- `ExternalAnchor` enforces consistent external-link security behavior.
- `ActivityRow`, `TicketGroup`, and `TicketEntryRow` own domain-specific display rules.
- `VenueLabel` keeps activity venues in a consistent position on activity and ticket pages.
- `PhotoBookEntry` owns the poster-style layout and bibliographic display rules for photobooks.
- `activityCategories.ts` is the single source for category order, labels, compact labels, and icons.

Required domain fields should stay in the TypeScript interfaces, while truly optional
display regions should be expressed as optional component props. Avoid a generic
component with many unrelated flags; prefer composition or a small discriminated
variant such as the current/past ticket-row variants.

## Activity Data Format

Activities live in `src/data/activities.yaml`. Each item should follow this shape:

```yaml
- id: "2026-example-event"
  category: "Live"
  scheduleLabel: "2026.09.12"
  performances:
    - startAt: "2026-09-12T14:30"
    - startAt: "2026-09-12T17:30"
  title:
    ja: "LIBERTE LIVE 2026 ～ First Act ～"
    en: "LIBERTE LIVE 2026 ~ First Act ~"
  venue:
    ja: "KIWA TENNOZ"
    en: "KIWA TENNOZ"
  description:
    ja: "ゲスト出演"
    en: "Guest appearance"
  link: "https://example.com"
```

Required fields:

- `id`: permanent, unique lowercase slug used by navigation, UI identity, and calendar UIDs. Once published, do not rename it when a title or URL changes.
- `category`: one of `Stage`, `Musical`, `Program`, `Event`, `Live`, `Reading`, or `Other`. Use `Program` for streamed/broadcast programs and `Event` for in-person events.
- `scheduleLabel`: human-readable schedule text used only for display. This can be a single date, date range, `Weekly`, `Monthly`, or any concise label.
- `title.ja` and `title.en`: bilingual title.
- `link`: source or official activity information URL.

Recommended fields:

- `startDate`: machine-readable first date in `YYYY-MM-DD` for a continuous date range.
- `endDate`: machine-readable last date in `YYYY-MM-DD`; omit it for a single-day activity.
- `performances`: exact non-consecutive dates or timed performances. A performance uses either `occursOn: YYYY-MM-DD` or `startAt: YYYY-MM-DDTHH:mm` JST, and can have a bilingual `label`.
- `milestones`: optional display-only times within a performance, such as an update, merchandise sales, or doors opening. They never change whether the performance is all-day, its end time, or activity status. `at` and `until` use same-day `HH:mm` JST values, not full date-times.
- `durationMinutes`: shared duration for timed performances. An individual performance's `endAt` overrides it.
- `recurrence`: marks an ongoing program and describes how its known occurrences are supplied. Use `type: manual` for monthly/irregular programs, or the bounded `type: weekly` rule described below.
- `venue.ja` and `venue.en`: the activity venue shared by activity, ticket, and future calendar displays.
- `description.ja` and `description.en`: role, appearance note, or other short context. Venue text belongs in `venue`.

Date behavior:

- Use either `performances` or the continuous `startDate`/`endDate` range for one activity, not both.
- Each normalized occurrence becomes a separate calendar item. An activity becomes past after its final occurrence ends.
- A timed performance ends at its own `endAt`, otherwise after the activity's `durationMinutes`, otherwise after the system default of 60 minutes. Durations may cross midnight.
- A date-only `occursOn` performance is treated as an all-day occurrence and remains current through `23:59` JST.
- A milestone uses `kind: update`, `merch`, `doors`, or `other` with an `at: HH:mm` JST time. `update` is an information/content publication time, `merch` is merchandise sales, `doors` is when the venue opens for entry (not the performance start), and `other` is any separately labelled supplementary time. Add `until: HH:mm` for a same-day interval. `other` requires a bilingual `label`; a label on a standard kind overrides its default name.
- `endAt` belongs to the same performance item as `startAt`: align the two fields and do not add another list marker (`-`) before `endAt`.
- A `recurrence` block keeps a program in the current-activities list independently of its latest known occurrence. Manual recurrence never invents dates; weekly recurrence generates only inside its explicit `startOn`–`endOn` range.
- The calendar only uses machine-readable schedule fields. `scheduleLabel` is display-only and never affects status or sorting.
- For non-consecutive dates, use date-only `performances` instead of a broad `startDate` to `endDate` interval.

Example with non-consecutive date-only performances:

```yaml
- id: "2026-example-multi-day-event"
  category: "Live"
  scheduleLabel: "2026.06.06-07, 06.13-14"
  performances:
    - occursOn: "2026-06-06"
    - occursOn: "2026-06-07"
    - occursOn: "2026-06-13"
    - occursOn: "2026-06-14"
  title:
    ja: "イベント名"
    en: "Event Title"
  description:
    ja: "出演情報"
    en: "Appearance details"
  link: "https://example.com"
```

### Recurring Programs

Monthly programs whose dates are irregular or only gradually announced use manual
recurrence. Add only confirmed dates to `performances`:

```yaml
recurrence:
  type: "manual"
performances:
  - occursOn: "2026-09-03"
  - occursOn: "2026-10-01"
    milestones:
      - kind: "update"
        at: "12:00"
```

Programs with a fixed weekly day and time use a bounded generation rule:

```yaml
recurrence:
  type: "weekly"
  startOn: "2026-09-01"
  endOn: "2026-09-30"
  weekday: "friday"
  startTime: "22:00"
  overrides:
    - date: "2026-09-18"
      startTime: "22:30"
    - date: "2026-09-25"
      cancelled: true
```

- `startOn` and `endOn` are inclusive boundaries of the currently confirmed range; extending the schedule requires changing `endOn` explicitly.
- `weekday` is one of `sunday` through `saturday`, and `startTime` is `HH:mm` JST.
- `overrides` may change one generated date's time or cancel it. Its `date` must be a date that the base rule would generate.
- Weekly rules and `performances` are mutually exclusive. Manual recurrence requires at least one performance.
- Generated Program times are labelled as updates rather than stage-performance starts in the site UI.

Example with two performances on the same day:

```yaml
- id: "2026-example-two-shows"
  category: "Live"
  scheduleLabel: "2026.10.10"
  durationMinutes: 120
  performances:
    - startAt: "2026-10-10T14:30"
      label:
        ja: "昼公演"
        en: "Matinee"
    - startAt: "2026-10-10T18:30"
      label:
        ja: "夜公演"
        en: "Evening"
  title:
    ja: "イベント名"
    en: "Event Title"
  link: "https://example.com"
```

Example with display-only times:

```yaml
- id: "2026-example-program"
  category: "Program"
  scheduleLabel: "2026.09.10"
  calendarExport: "enabled"
  performances:
    - occursOn: "2026-09-10"
      milestones:
        - kind: "update"
          at: "12:00"
  title:
    ja: "番組名"
    en: "Program title"
  link: "https://example.com/program"
```

```yaml
- id: "2026-example-show-with-milestones"
  category: "Live"
  scheduleLabel: "2026.10.10"
  durationMinutes: 120
  performances:
    - startAt: "2026-10-10T18:00"
      milestones:
        - kind: "merch"
          at: "14:00"
          until: "16:30"
        - kind: "doors"
          at: "17:00"
  title:
    ja: "イベント名"
    en: "Event Title"
  link: "https://example.com"
```

## Calendar Downloads

The current Activities page offers **Add to calendar** when an activity has valid
Japanese and English titles, an HTTP(S) source link, and exact start times for all
listed performances. The download is generated in the visitor's browser when they
click a download button, using the site's currently loaded activity data and UI
language. No calendar API, account connection, or additional service is required.

Control availability per activity in `src/data/activities.yaml`:

```yaml
calendarExport: "auto"     # Default when omitted: all performances need exact start times.
# calendarExport: "enabled"  # Manually allow valid date-only entries as all-day placeholders.
# calendarExport: "disabled" # Hide downloads until you decide the information is ready.
```

`enabled` does not bypass invalid/missing dates, titles, or source links. A display-only
`scheduleLabel` cannot generate an event. Malformed or conflicting schedules block
export instead of silently downloading a partial schedule. The existing site calendar
and automatic archive rules are unchanged.

- Only occurrences that have not ended (using the site's JST status rules) are offered.
- **Performance Schedule** and **Add all shows** share one toolbar. Expand the schedule
  to find **Add this show** next to each eligible performance; each button downloads
  only that performance. Add all shows downloads all remaining eligible performances
  directly.
- Date-only entries and continuous ranges require `enabled`; each date is an all-day
  placeholder. Only use ranges when every day is intended.
- Exact times are converted from JST to the visitor's browser timezone. The ICS contains
  a `VTIMEZONE` definition and uses that timezone on `DTSTART` and `DTEND`, including
  daylight-saving transitions where applicable.
- Explicit `endAt` overrides `durationMinutes`. When neither is provided, the generated
  event uses the same 60-minute default as the site's status logic.
- Manual recurring programs export only explicitly listed dates. Weekly programs export only occurrences generated inside their finite confirmed range; ICS files never contain an open-ended recurrence rule.
- The ICS contains the title, performance label, venue, and one standard `URL` property
  per event. It intentionally omits `DESCRIPTION`; milestone times remain display-only.

ICS downloads are **one-time snapshots, not subscriptions**. Updating YAML and deploying
the site affects future downloads; it cannot update events already imported by visitors.
Re-importing may create duplicates, depending on the calendar app. UIDs are deterministic for the permanent activity `id`
and occurrence start/date, but are not a synchronization guarantee. Changing a title
or source URL therefore does not change an existing occurrence's UID.

For later automatic updates, a separately hosted calendar subscription feed at a stable
HTTPS URL is possible without a calendar-provider API. That feature would need durable
performance IDs, revision/cancellation handling, and published feed updates. Durable
activity IDs are already present.
Refresh timing is controlled by the subscribing app. It is not implemented here.

The schedule renderer exposes toolbar, per-performance action, and footer slots.
`AddToCalendar` connects these to `useCalendarDownload`; file delivery is independent
of display. `buildActivityCalendar` accepts a typed `selection` (`all` or explicit
performance keys), so future selection controls can reuse it. Milestones remain
structured data and are currently display-only.
Standalone milestone export should add its own selection variant, eligibility rules,
and UID namespace; it must not change the meaning of “all shows” or reuse a show's UID.

Run `npm run test:calendar`, `npm run lint`, and `npm run build` after changing export logic.

## Ticket Data Format

Only activities with ticket information need a `ticketInfo` block. Ticket entries are shown on the Ticket Info page while they are current, and move to the past-ticket archive after their `endAt` has passed.

```yaml
- id: "2026-example-ticketed-event"
  category: "Live"
  scheduleLabel: "2026.09.12"
  performances:
    - startAt: "2026-09-12T14:30"
    - startAt: "2026-09-12T17:30"
  title:
    ja: "LIBERTE LIVE 2026 ～ First Act ～"
    en: "LIBERTE LIVE 2026 ~ First Act ~"
  venue:
    ja: "KIWA TENNOZ"
    en: "KIWA TENNOZ"
  link: "https://example.com/event"
  ticketInfo:
    link: "https://example.com/tickets"
    price:
      ja: "7,700円 + ドリンク代600円"
      en: "7,700 yen + 600 yen drink fee"
    entries:
      - type:
          ja: "-鼓星- 先行予約受付"
          en: "Fan Club Presale"
        startAt: "2026-07-04T12:00"
        endAt: "2026-07-12"
        scheduleLabel: "2026.07.04-07.12"
        description:
          ja: "LIBERTE TICKETにて受付"
          en: "Available through LIBERTE TICKET"
        link: "https://example.com/tickets/presale"
```

Ticket field notes:

- The activity-level `venue` is displayed on both activity and ticket pages; do not duplicate it inside `ticketInfo`.
- `ticketInfo.link`: optional ticket overview URL and the middle link fallback level.
- `ticketInfo.price`: optional price shared by every ticket entry for the activity.
- `entries`: list of ticket lotteries, presales, general sales, or TBA entries.
- `entry.type.ja` and `entry.type.en`: visible ticket entry name. This text is clickable in the UI.
- `entry.startAt`: optional start boundary. Use either `YYYY-MM-DD` or minute-precise `YYYY-MM-DDTHH:mm` JST. A date-only value starts at `00:00`.
- `entry.endAt`: optional closing boundary in the same two formats. A date-only value remains open through `23:59`; if the official cutoff is unknown, the parent activity `endDate` may be used.
- `entry.scheduleLabel`: language-independent, human-readable sale/application period used only for display.
- `entry.price`: optional price override for an exceptional ticket stage. The UI falls back to `ticketInfo.price` when omitted.
- `entry.description`: optional application conditions or other supplementary details, with the same meaning as activity `description`.
- `entry.link`: optional URL for this exact ticket entry. Link resolution is `entry.link`, then `ticketInfo.link`, then the activity `link`.

Ticket status behavior:

- `upcoming`: the current JST date/time is before the entry start.
- `open`: the current JST date/time is on or after the entry start, and not after the entry end.
- `past`: the current JST date/time is after the entry end.
- `tba`: no machine-readable ticket dates are provided.

All machine-readable times are interpreted as Japan Standard Time (`Asia/Tokyo`), regardless of the visitor's device time zone. Date-only starts mean `00:00` JST, and date-only ends remain active through `23:59` JST.

For sales without a published cutoff, copy the parent activity `endDate` into the ticket entry's `endAt` instead of using an empty string so the entry can move to the archive.

## Contribution Notes

When adding or editing content:

- Give every activity a permanent unique `id`; do not derive UI identity from its list position.
- Keep Japanese and English fields in sync.
- Use `YYYY-MM-DD` for machine-readable dates and `YYYY-MM-DDTHH:mm` for precise JST times. Ticket `startAt`/`endAt` accept either format and supply boundary defaults for date-only values.
- Both activities and ticket entries use `scheduleLabel` for display-only schedule text; never use it for sorting or status logic.
- Keep venue information only at the activity level unless a future performance explicitly needs a different venue.
- Prefer exact source links from official sites or reliable announcements.
- For monthly or irregular programs, use `recurrence.type: manual` and add only confirmed dates to `performances`. For fixed weekly programs, update the bounded `recurrence.endOn`; never create an unbounded rule.
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
