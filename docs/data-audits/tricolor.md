# Tricolor appearance records

Checked on 2026-10-26 against the [official program page](https://www.onsen.ag/program/tricolor), including its public archive list and announcements.

- The archive contains main episodes 0–41 and companion bonus tracks. A main episode and its same-day bonus track are represented by one performance, not two appearances.
- The latest dated comment identifies episode 41 as 2026-10-22. Archive rows show month/day; older years are reconstructed by stepping backwards through their published order across January/December boundaries. This yields episode 0 on 2024-09-07 and episode 1 on 2024-10-10.
- The 2026-01-15 frequency-change notice says the former fortnightly Thursday schedule becomes monthly from February 2026. Actual monthly dates vary; no recurrence dates are inferred.
- Episodes 32 (2026-01-29) and 33 (2026-02-26) explicitly replace Coco Hayashi with guests in the official announcements. Both are excluded from the website's appearance YAML. The episode 32 notice has a body typo saying episode 22; its heading and dated broadcast line both identify episode 32.
- Episode 38 (2026-07-16) replaces Karin Isobe, not Coco Hayashi. It remains included. Episode 18 (2025-06-19) has a guest announcement without a host absence and remains included with the ordinary host lineup.
- The 2025-11-17 rescheduling notice confirms episode 27 on November 20 at 13:00 and episode 28 on November 27 at 13:00. The superseded November 6 date is not used. No clock time is inferred for other episodes.
- Thus 40 published appearances are represented: episodes 0–41 except 32 and 33. They use the overall program link; premium availability is not treated as an expired link.
- The user's previously authored dates 2026-08-27, 2026-09-10, 2026-10-22 and 2026-11-19 are preserved. The first three gain verified episode numbers. November 19 remains an unnumbered future plan, not a confirmed historical appearance.

Runtime data lives only in `src/data/activity-schedules/tricolor.yaml`, using the common `performances` format and the existing activity editor. This audit is not a runtime data source. Website descriptions do not gain additional audit explanations.
