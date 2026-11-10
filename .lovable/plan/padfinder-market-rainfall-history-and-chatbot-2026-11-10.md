# PadFinder: market, rainfall history, and chatbot

## What will change
- Add a current-listings price summary on the home page: separate rent and sale averages by district, plus averages within 1.5 km of mapped schools when listings support them. Label these as asking prices, not completed transactions, and show sample counts.
- Add historical rainfall summaries on the flood-map page for 2020–2025, using Open-Meteo archive estimates at district reference points. Clearly label grid-based estimates separately from reported flood-history notes; do not infer flood depth from rain totals or imported station readings.
- Improve Cá Heo with the installed Lovable AI Gateway streaming SDK, input validation, preserved chat history, friendly PadFinder-specific guidance, graceful error recovery, and a clear retry path.
- Add focused tests for price aggregation and historical-summary rules, then verify the chat stream and the visible price/history sections.

## Assumptions
- Only data already available from listings counts toward market averages; empty groups will say there is not enough listing data.
- School locations and nearby listing counts come from OpenStreetMap community data, using the existing 1.5 km nearby-search radius.
- Historical rainfall covers 2020–2025; rainfall values are estimates from a regional weather grid, not local rain-gauge observations.

## Technical details
- Keep calculations in browser-safe utilities and UI in focused components; make no database schema changes.
- Keep the existing chatbot model and Responses surface, replacing the legacy provider wrapper with `@lovable.dev/ai-gateway` and handling its native stream events.
- Preserve source caveats around imported water-station readings and historical flood-zone estimates.
