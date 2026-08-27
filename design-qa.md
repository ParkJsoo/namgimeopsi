# Design QA — Home screen

**Findings**

- [P0] Browser-rendered implementation capture is unavailable.
  Location: Expo web home screen.
  Evidence: the Figma desktop canvas provides the selected 375 × 812 home-screen reference, but the Product Design browser runtime reported no available browser while the Expo web server was running on port 8082.
  Impact: the implementation cannot be compared at the same viewport, so typography, vertical rhythm, color application, content cropping, and the bottom navigation cannot be visually verified.
  Fix: enable an in-app Browser or connect a supported Chrome browser in Codex, then capture the Expo web screen at the reference viewport and run a visual comparison.

**Open Questions**

- The source reference is the existing `App Screens > Frame 1` Figma canvas. It is a 375 × 812 static composition, while the app retains scrollable content and functional inventory editing.

**Implementation Checklist**

1. Capture the selected Figma frame at 375 × 812.
2. Capture Expo web at the same viewport with the seeded home state.
3. Compare the two images, fixing any P0/P1/P2 differences.
4. Test the priority-card edit action, recipe action, inventory tab, and quick-add action.

**Required Fidelity Surfaces**

- Fonts and typography: blocked pending rendered capture.
- Spacing and layout rhythm: blocked pending rendered capture.
- Colors and visual tokens: code uses the documented `#FFFFFF`, `#E4F0E7`, `#2F6B4F`, and `#D5E0D6` tokens; visual verification is blocked.
- Image quality and asset fidelity: no image assets appear in the selected home reference.
- Copy and content: source and implementation use the same featured-menu and priority language where updated; visual verification is blocked.

**Comparison metadata**

- Source visual truth: Figma `남김없이 — Mobile App Design`, `App Screens > Frame 1`.
- Implementation screenshot: unavailable.
- Target viewport: 375 × 812.
- State: seeded inventory, home tab.
- Full-view and focused-region comparison: unavailable because no supported browser was available.

final result: blocked
