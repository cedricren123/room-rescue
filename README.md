# Room Rescue

A student app that finds UCL Science Library group study rooms for the whole session you need. It checks capacity and facilities, reads fresh booking intervals, and suggests starts 30 or 60 minutes later only when the user allows them.

## TinyFish does the core work

- **Search** discovers official UCL booking guidance.
- **Fetch** reads the guidance and all four public group-room capacity categories, using `include_selectors: ["main"]` to preserve accessible booking controls and `ttl: 0` to request fresh content.
- **Agent** was used during development to navigate the booking interface and verify the accessible calendar. The shipped app uses Search + Fetch; it does not require a paid Agent run for every search.

No reservations are made. Users complete bookings on UCL. Available means observed as available when checked, never guaranteed or reserved.

## Run locally

Use Node 22.13+ (Node 24 recommended).

1. `npm install`
2. Create `.dev.vars` containing `TINYFISH_API_KEY=your_key` (Cloudflare local runtime).
3. `npm run dev`
4. Open the URL printed by the server.

The API key stays server-side. `.env.local` and `.dev.vars` are ignored. On Sites, set `TINYFISH_API_KEY` as a secret runtime environment variable.

## Checks

- `node --test tests/room-engine.test.mjs`
- `npx tsc --noEmit`
- `npm run build`

Matching rejects gaps in a session, inadequate capacity, unverified required facilities, and postgraduate-only rooms for undergraduates. Missing dates, unreadable calendars and partial category failures are never reported as a complete “no availability” result. Requests are restricted to same-origin POSTs and the provider URLs are server-owned.

## Scope and limits

- Science Library group rooms only; UCL students and staff access rules.
- Booking dates from today to three days ahead, London time.
- 1–3 hour sessions starting on the hour or half-hour.
- Room availability can change before booking.
- The parser depends on UCL’s accessible calendar markup; structural changes fail explicitly.
- Runtime searches use two endpoint types. Competition points are decided by reviewers.

## Competition evidence

See `submission/` for the live test results, screenshots, validation notes and submission text. Historical test responses are evidence files only; the app never serves them as live data.
