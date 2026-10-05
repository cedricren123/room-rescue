# Validation

Validated locally on 5 October 2026.

- Seven matching-rule tests passed: continuous sessions, permitted later starts, capacity, postgraduate eligibility, required screens, planned TVs, unreadable calendars and booking-window validation.
- TypeScript check passed.
- Production Worker build passed.
- Live API returned seven suitable room records and one Plan B for four people, 6 October, 15:30, two hours: De Morgan 16:00–18:00.
- Same-origin API rejected group size 13 with HTTP 400 and outside-origin requests with HTTP 403.
- Browser WebMCP tool performed a real live search and updated the visible results. Unsupported input was rejected.
- Desktop layout checked at 1280 × 900 and mobile at 390 × 844. Mobile document width was 390 pixels, with no horizontal overflow.
- Screenshots and JSON responses are historical evidence. Runtime searches fetch fresh calendars; saved evidence is not an app data source.

Publishing is pending: the automatic approval policy rejected passing credentials to the official Sites repository workflow. Network and project Git write permission requests did not resolve it. The site has been registered and its server secret configured, but no successful production deployment has been recorded.
