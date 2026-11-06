# Phase 1 — Design system baseline

## Brand direction

Warm, grounded, premium, human, and quietly confident. The visual system should feel closer to a thoughtful social-impact editorial brand than to a government portal or an emergency appeal page.

## Tokens

| Token | Use | Current value |
| --- | --- | --- |
| Ink | Main text | `#17221D` |
| Muted | Supporting text | `#66736B` |
| Paper | Page background | `#F7F6F1` |
| Green | Primary action and trust | `#24483A` |
| Green dark | Hover and deep contrast | `#17352A` |
| Sage | Soft section backgrounds | `#DCE8D9` |
| Gold | Eyebrows and emphasis | `#D49B47` |
| Line | Borders and dividers | `#DFE5DF` |

## Typography

- Display: editorial serif for mission statements, major headings, and human stories.
- Body: neutral sans-serif for forms, navigation, metadata, and dense operational content.
- Body size: minimum 16px for reading content.
- Headings: meaningful hierarchy; never skip levels for visual appearance.
- Copy tone: direct, respectful, hopeful, specific, and never sentimental for its own sake.

## Components

- Header: clear brand, four primary destinations, one prominent giving action, sign-in access.
- Hero: one message, one supporting sentence, two actions maximum.
- Program card: audience/eyebrow, clear title, short description, one next action.
- Story card: consented image, title, context, date, and clear distinction between story and metric.
- Support form: short first step, progressive disclosure, consent language, expectation after submission.
- Donation form: amount, frequency, campaign, payment, receipt, and privacy choices separated clearly.
- Product card: image, product name, price, availability, maker story entry point.
- Status badge: text plus colour/icon; never colour alone.
- Empty state: explain what belongs here and the next useful action.

## Interaction rules

- Use motion sparingly and respect `prefers-reduced-motion`.
- Use visible focus styles for every interactive element.
- Do not use auto-advancing carousels for essential information.
- Keep destructive or irreversible actions visually distinct and confirmable.
- Preserve form values after validation errors.
- Use inline help for sensitive questions; do not make people guess why information is needed.

## Responsive behaviour

- Mobile first; core routes usable from 320px wide.
- Navigation collapses without hiding the primary giving and support paths.
- Tables become cards or horizontally scrollable regions with a useful accessible label.
- Images are responsive and lazy-loaded when not above the fold.
- Avoid background video and heavy decorative assets on low-bandwidth paths.
