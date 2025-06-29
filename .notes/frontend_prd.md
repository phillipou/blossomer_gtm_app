# Blossomer GTM Dashboard – Comprehensive PRD (v2.2)

_Last updated 28 Jun 2025_

---

## A. Purpose & Context

Blossomer GTM Dashboard is an AI-powered web application that converts a startup's website URL + (optional) ICP description into a fully-populated Go-to-Market workspace.

This PRD merges product vision, UX flows, edge-case handling, and build plan into one reference for design, engineering, and stakeholders.

### Core Value
- Zero-to-asset: one URL → complete Company, Customers, and Campaigns content.
- Edit-in-place: hover ✏️/✨ controls, no separate edit modes.
- AI-optional: refinement available, never mandatory.
- Smart dependencies: changes flag downstream blocks with an orange ! badge.
- Desktop-only: sub-1024 px viewport shows splash "Desktop required".

### Prototype Strategy
1. Mock-first UI (MSW handlers) – iterate quickly, polish interactions.
2. Proxy layer – map clean mock paths to existing backend routes for demo.
3. Incremental backend additions – only where no legacy route exists.
4. Hardening pass – refactor backend once UX stabilises.

---

## B. Information Architecture

| Section    | Purpose                                                      | Primary Endpoints                                                                 |
|-----------|--------------------------------------------------------------|-----------------------------------------------------------------------------------|
| Company   | Auto-scraped overview, pricing, features, testimonials, differentiators | POST /company/generate, PATCH /company/<block>/refine, POST /company/<block>/regenerate |
| Customers | Target Accounts, Personas, Prospecting sources                | POST /customers/target_accounts, POST /customers/target_personas, POST /customers/prospecting_sources, POST /customers/correct |
| Campaigns | Email-only sequences + A/B variants                           | POST /campaigns/generate, PATCH /campaigns/email/{stepId}/refine, POST /campaigns/email/variant |
| Auth      | API-key issue & validation                                    | POST /auth/signup, POST /auth/validate_key                                        |

---

## C. Key User Flows & Edge Cases

### 1. Authentication

| Step           | Behaviour                                                                 |
|----------------|--------------------------------------------------------------------------|
| Sign-up modal  | Fields email*, name. POST /auth/signup → returns api_key. Show copy-once dialog. Error 409 if email exists. |
| Login modal    | Field api_key. POST /auth/validate_key. 401 shows inline red banner.     |

### 2. Landing → Dashboard
1. Enter URL (+ ICP). Optional "✨ Enhance" hits POST /enhance-icp.
2. Press Start → loading text sequence (7 s total) while UI calls /company/generate.
3. On success store session_id and parallel-fetch Customers (3 calls) & Campaigns.
4. Errors: unreachable URL → inline error card; 504 timeout → retry button.

### 3. Editing & AI Refine

| Action      | UI                                                                 | API                                 |
|-------------|---------------------------------------------------------------------|-------------------------------------|
| Hover block | Show ✏️ Edit, ✨ Refine                                             | –                                   |
| ✏️ Edit     | Inline textarea, Cmd+Enter save, Esc cancel                        | PATCH /<section>/<block>/refine     |
| ✨ Refine   | Split modal (left editable, right fresh AI chat). "View changes" shows diff; Accept/Reject updates cache | same route                          |
| Diff colours| additions #DCFCE7, deletions #FEE2E2                               | –                                   |

### 4. Update Badge
When backend returns affected_sections, UI shows orange ! on those blocks. Click → banner with Update button → POST /<section>/<block>/regenerate.

### 5. Loading & Error Patterns
- Skeleton cards appear after 300 ms; animate-pulse bg-gray-200 rounded h-36.
- 4xx error → inline red banner (bg-#FEE2E2, border-#FCA5A5).
- 5xx error → toast bottom-right, auto-dismiss 5 s, Retry button.

---

## D. Component Inventory (Prototype)
- ContentBlock, AttributeBlock (see TypeScript defs)
- UpdateBadge
- DiffViewer (side-by-side)
- SkeletonCard
- ErrorBanner, Toast
- ApiKeyModal
- **All atomic UI primitives (Button, Card, Input, Textarea, Label, etc.) are now standardized in `src/components/ui/` and must be reused across all pages and components.**

---

## E. Design Tokens & Guidelines
All colours, typography, spacing, banner and skeleton styles are defined in the canonical Design System JSON ([.notes/design-system.json](mdc:.notes/design-system.json)). New tokens:
- banners.error.*
- skeleton.background, @keyframes pulse

**The design system is now implemented as code in `src/components/ui/` and `tailwind.config.js`. All new UI work should extend these primitives and reference design tokens from `.notes/design-system.json` via Tailwind config.**

---

## F. Out-of-Scope (post-prototype)
- Export / Import
- Settings (key rotation, theme)
- Undo history
- Metrics & analytics
- Help / onboarding tour
- Mobile tablet support

---

## G. Acceptance Criteria
1. Paste URL → populated Company view within 20 s 95th percentile.
2. Edit & Accept diff updates content and shows badge on dependent sections.
3. Generate Campaigns returns a 3-step sequence and allows one A/B variant per step.
4. Prototype runs offline with MSW mocks; switching env var points to live backend without code change.
5. Sub-1024 px shows fixed splash page.

---

## H. Page Layout Descriptions (replaces ASCII diagrams)
Each screen description references component names defined in Section D and styling tokens in the canonical Design System JSON ([.notes/design-system.json](mdc:.notes/design-system.json)).

### H.1 Landing Page (`/`)
- Full-width container centred within a max-width 1200 px grid. Spacing uses spacing.3xl top and bottom.
- Header – HeaderBar component, flex row; left logo, right Button.secondary Sign-in (opens ApiKeyModal).
- Hero – vertical stack centred, Typography.xl headline, Typography.md sub-headline; colour neutral.gray800.
- SandboxCard – Card.container max-width 640 px, internal grid rows:
    - URL InputField (full width)
    - ICP InputField + Button.ghost "✨ Enhance" (appears when user types)
    - Primary Button.primary "Start for free" (stretch)
- Loading state – after CTA click, replace SandboxCard with three-step status text (styled Typography.sm, colour neutral.gray500) and show 3 SkeletonCard placeholders.

### H.2 Dashboard Shell (`/dashboard`)
- Two-column CSS grid: Sidebar fixed 260 px, Content auto; padding spacing.xl.
- HeaderBar inside Content: page title on left, user key-prefix pill on right.
- SidebarNav (navigation.sidebar tokens): links Company, Customers, Campaigns with active state. Orange UpdateBadge icon positioned absolute right-hand if any descendant block is stale.

#### H.2.1 Company Tab
- Content stack uses spacing.lg gap; each block is a ContentBlock variant.
- OverviewBlock – text area; shows UpdateBadge on edit.
- Two-column responsive grid (minmax(0,1fr) cols) containing:
    - BusinessModelBlock
    - FeaturesBlock
- Secondary grid for ExistingCustomers, Testimonials.
- Footer grid for Differentiators and Alternatives.

#### H.2.2 Customers Tab
- Tab content area itself is a Card.container (white, border-#E5E7EB, radius 8 px). Inside, Radix Tabs.Root renders three triggers across the top with sticky background.
- Target Accounts – vertical stack inside its own Card.section.
    - OverviewBlock card (title bar optional).
    - Attribute list: each AttributeBlock row sits inside a Card.item (border-bottom #F3F4F6).
- Personas – grid of PersonaCards. Each PersonaCard is a child Card.container: header row with title + Delete icon; body rows bullets; footer shows toggle chips.
- Prospecting Sources – single Card.section containing Chip list.

#### H.2.3 Campaigns Tab
- Entire tab body wrapped in a parent Card.container.
- CSS grid two columns: ConfigPanel card left, SequencePreview card right.
- ConfigPanel – child Card.section width 320 px. Contains stacked SelectFields and a footer with Button.primary Generate.
- SequencePreview – child Card.section that houses vertical EmailCard list.
    - Each EmailCard is itself a Card.container with subject header, body markdown viewer, and bottom bar with Add Variant button.
    - Variant EmailCards nest under parent with a left border colour primary.light.
- Campaigns Tab
    - CSS grid two columns: ConfigPanel 320 px fixed, Sequence auto.
    - ConfigPanel – stacked Select controls (Intro, Value-prop, Pain-point, CTA). Primary Button.primary Generate.
    - SequencePreview – vertical list of EmailCards. Each card has Subject, Body, Button.ghost Add Variant. Variants rendered nested beneath parent with subtle left border colour primary.light.

### H.3 AI Refine Modal
- Radix Dialog.Root, width 900 px, height 80 vh. Grid 50:50. Left pane Textarea with line numbers off; right pane ChatPane containing QuickAction Chips and streaming messages. Footer row hosts Button.secondary Cancel, Button.primary Save and a Button.ghost View Changes toggling DiffViewer overlay.

### H.4 Desktop-Only Splash (<1024 px)
- Full-viewport CenterBox: headline Typography.lg "Desktop required", paragraph guidance, link to docs.

---

*These narrative layouts supersede the previous ASCII diagrams while referencing concrete components and tokens.*

---

### Endpoint list derived from the PRD

**Auth**
- POST /auth/signup
- POST /auth/validate_key

**Landing helpers**
- POST /enhance-icp
- POST /analyze-website

**Session bootstrap**
- GET /session/{id}/company
- GET /session/{id}/customers
- GET /session/{id}/campaigns

**Company**
- POST /company/generate
- PATCH /company/{block}/refine
- POST /company/{block}/regenerate
- GET /company/updates

**Customers**
- POST /customers/target_accounts
- POST /customers/target_personas
- POST /customers/prospecting_sources
- PATCH /customers/{block}/refine
- GET /customers/updates
- POST /customers/{block}/regenerate

**Campaigns**
- POST /campaigns/generate
- PATCH /campaigns/email/{step_id}/refine
- POST /campaigns/email/variant
- GET /campaigns/updates
- POST /campaigns/email/{step_id}/regenerate

**Session maintenance**
- POST /session/{id}/save
- POST /session/{id}/regenerate 