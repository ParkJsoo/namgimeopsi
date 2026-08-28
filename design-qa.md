# Design QA — Home screen

**Result: passed (implementation capture and interaction QA)**

The Expo web implementation was captured at the requested 375 × 812 viewport with the seeded home state. The accepted screenshots are in [`docs/qa-artifacts/`](docs/qa-artifacts/).

## Findings

- [Resolved P1] The first recipe card previously called the platform `Alert`, which did not surface a confirmation on Expo web. It now opens a shared bottom sheet before the user can mark the ingredient as eaten. The sheet identifies the item and quantity, explains that home and inventory will update, and offers `다 먹음` and `아직 있어요`.
- [Blocker] This run captured the implementation only. The Figma source frame could not be rendered in connected Chrome because WebGL is unavailable; the captured failure is [`06-figma-webgl-blocked.png`](docs/qa-artifacts/06-figma-webgl-blocked.png). A Figma Desktop fallback was also unavailable because the local Computer Use connection could not start, so no desktop screenshot was captured. Figma MCP was not retried, per the one-check constraint. Exact pixel-diff comparison needs a WebGL-enabled capture surface or a restored Computer Use connection in a later session.

## Required Fidelity Surfaces

- Fonts and typography: passed visual inspection of the captured implementation. The display title, section heading, body copy, and compact metadata retain a clear hierarchy at 375px width.
- Spacing and layout rhythm: passed visual inspection. The large header-to-priority-card gap, 20px screen gutter, stacked recipe cards, and bottom navigation remain readable without cropping.
- Colors and visual tokens: passed visual inspection. The rendered screen uses the documented white, pale green, brand green, and soft border colors (`#FFFFFF`, `#E4F0E7`, `#2F6B4F`, `#D5E0D6`).
- Image quality and asset fidelity: passed; the source and implementation surface use no image assets.
- Copy and content: passed. The seeded priority and featured-menu copy is legible and preserves the recommendation reasons.

## Interaction Checklist

1. Home, seeded state — passed. [`01-home-375x812.png`](docs/qa-artifacts/01-home-375x812.png)
2. Priority-card edit action — passed. Selecting `남은 치킨` opens the editable inventory sheet with item, quantity, storage, recommended-use timing, and remove action. [`02-priority-edit-sheet.png`](docs/qa-artifacts/02-priority-edit-sheet.png)
3. Recipe action — passed after the P1 fix. Selecting `치킨마요 덮밥` opens the explicit consumption confirmation sheet; the destructive `다 먹음` option was not selected during QA. [`03-recipe-completion-confirmation.png`](docs/qa-artifacts/03-recipe-completion-confirmation.png)
4. Inventory tab — passed. The navigation updates the active tab and shows storage, type, and timing filters with seeded inventory. [`04-inventory-tab.png`](docs/qa-artifacts/04-inventory-tab.png)
5. Quick add — passed. The central `+` opens the direct-add sheet with ingredient/leftover selection and date-language guidance. [`05-quick-add-sheet.png`](docs/qa-artifacts/05-quick-add-sheet.png)
6. Live meal completion — passed for visible state and cancellation. Live cards are derived from active inventory; selecting a card shows the recipe-specific whole-consumption targets and `아직 있어요` closes without changing state. [`07-live-recipe-completion-sheet.png`](docs/qa-artifacts/07-live-recipe-completion-sheet.png) Pure tests cover the confirmed `consume-all` event, active-inventory projection, and recommendation refresh input.

## Comparison metadata

- Source visual truth: Figma `남김없이 — Mobile App Design`, `App Screens > Frame 1`.
- Implementation screenshots: `docs/qa-artifacts/01` through `05`.
- Target viewport: 375 × 812.
- State: seeded inventory, home tab.
- Browser: connected Chrome; in-app Browser was unavailable in this session.
- Figma MCP: one status check completed; no design file mutation or retry was made. The Chrome Figma canvas is blocked by WebGL.
