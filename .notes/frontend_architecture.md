# Frontend Architecture Blueprint – Blossomer GTM Dashboard

_Last updated 28 Jun 2025_

---

## 1. Overview
The Blossomer GTM Dashboard frontend is a modern, modular React (TypeScript) application, styled with TailwindCSS and powered by a robust design system. It is designed for rapid prototyping (mock-first), seamless backend integration, and maintainability.

---

## 2. Main Technologies
- **React** (with TypeScript)
- **Vite** (build tool and dev server)
- **TailwindCSS** (utility-first CSS, design tokens)
- **MSW (Mock Service Worker)** (API mocking for local/dev)
- **Radix UI** (accessible UI primitives)
- **Jest/React Testing Library** (unit/integration tests)
- **Cypress/Playwright** (E2E tests, planned)

---

## 3. Directory Structure (Prototype)

frontend/
├── src/
│   ├── components/           # Reusable UI components (atomic design)
│   ├── pages/                # Route-level views (Landing, Dashboard, Splash)
│   ├── mocks/                # MSW handlers and mock data
│   ├── services/             # API clients, backend integration
│   ├── hooks/                # Custom React hooks
│   ├── contexts/             # React context providers
│   ├── utils/                # Utility functions
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
├── tailwind.config.js
├── postcss.config.js
├── design-system.json        # (Reference: design tokens, see .notes/design-system.json for canonical source)
└── ...

---

## 4. Service Boundaries & Data Flow
- **API Layer**: All data fetching and mutations go through a typed API client in `services/`, which switches between MSW mocks and live backend based on environment.
- **State Management**: Local state via React hooks; context for auth/session; (Redux/Zustand optional for future scale).
- **Component Boundaries**: Atomic design (atoms, molecules, organisms, templates, pages). All UI blocks (ContentBlock, AttributeBlock, etc.) are self-contained and reusable.
- **Mock-First**: MSW intercepts API calls in dev, enabling rapid UI iteration and offline prototyping.
- **Proxy Layer**: Vite dev server proxies `/api` calls to FastAPI backend for integration testing.

---

## 5. Environment Switching
- **MSW Mode**: Default for local/dev. All API calls are intercepted and served from `src/mocks/`.
- **Live Backend Mode**: Set env var (e.g., `VITE_API_MOCK=0`) to disable MSW and proxy API calls to backend.
- **Splash Page**: <1024px viewport triggers a fixed splash page (responsive check in root layout).

---

## 6. Integration Strategy
- **Incremental Backend Wiring**: UI is built against mocks first, then endpoints are wired up as backend is ready.
- **API Contract**: All endpoints and payloads are defined in the PRD and mirrored in MSW handlers for consistency.
- **Design System**: All colors, spacing, typography, and component tokens are mapped from `design-system.json` (see .notes/design-system.json for canonical source) into `tailwind.config.js`.
- **Testing**: Unit/integration tests for all components and flows; E2E tests for critical user journeys (planned).

---

## 7. Future Considerations
- **SSR/SSG**: Next.js or similar for SEO and performance (future).
- **State Management**: Evaluate Redux/Zustand as app complexity grows.
- **Accessibility**: Enforced via Radix UI and custom lint rules.
- **CI/CD**: Automated tests and deploys via GitHub Actions.

---

For detailed requirements and user flows, see [frontend_prd.md](mdc:frontend_prd.md). For design tokens, see `.notes/design-system.json` (canonical) and `tailwind.config.js`. 