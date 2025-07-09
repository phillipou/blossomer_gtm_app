# Frontend State/Data Migration Handoff

**Status:** In Progress  
**Last Updated:** July 2025

## Executive Summary

This document outlines the plan and rationale for migrating the Blossomer frontend from legacy `localStorage`-based state management to a robust, API-driven architecture using TanStack Query. The goal is to provide a seamless, auto-saving user experience for all AI-generated entities (Accounts, Personas, Campaigns) while ensuring data integrity, maintainability, and a modern developer workflow.

## Goals
- **Eliminate direct localStorage usage for canonical data** (except for drafts and resilience)
- **Adopt TanStack Query** for all API data fetching, caching, and mutation
- **Implement a frictionless auto-save pattern** for AI-generated entities (no manual save button)
- **Ensure all data is persisted in the backend** and kept in sync with the frontend cache
- **Enable easy migration and rollback** for existing users with localStorage data
- **Document the process and rationale** for future maintainers

## Why This Migration?
- **Reliability:** API is the single source of truth; no more out-of-sync localStorage bugs
- **UX:** Users get instant, auto-saving, draft-to-saved transitions with no friction
- **Maintainability:** Modern, declarative data layer with TanStack Query hooks
- **Scalability:** Pattern can be applied to all entities and future features
- **Developer Experience:** Devtools, cache management, and optimistic updates out of the box

## The Plan

### Phase 1: Setup and Tooling
- **Install TanStack Query:** Add the library to frontend dependencies
- **Configure QueryClientProvider:** Wrap the main React application to provide the caching layer to all components

### Phase 2: Core Data Migration (from localStorage to API)
- **Create Account Data Hooks:** Build custom hooks using TanStack Query (`useQuery`, `useMutation`) to handle all CRUD operations for accounts (`getAccounts`, `createAccount`, `updateAccount`, `deleteAccount`)
- **Refactor Accounts Page:** Update the main `Accounts` page to fetch data using the new `useGetAccounts` hook instead of reading from `localStorage`

### Phase 3: Implement the "Generate & Auto-Save" Workflow
- **Adapt AI Generation Flow:** Modify the "Generate AI" process to save the result as a "draft" in localStorage, separate from the main list of saved accounts
- **Build the `useAutoSave` Hook:** Create a generic, debounced auto-save hook. This hook will intelligently decide whether to `POST` (for a new draft) or `PUT` (for an existing, saved entity)
- **Integrate Auto-Save into Detail Page:** Use the `useAutoSave` hook in the `AccountDetail` page to automatically persist any changes in the background

### Phase 4: Rollout, Migration, and Cleanup
- **Roll out to Other Entities:** Apply the same pattern (create hooks, refactor pages, implement auto-save) for **Personas** and **Campaigns**
- **Build a Migration Utility:** Create a simple, one-time function that a user can trigger to migrate their existing localStorage data to the database
- **Final Cleanup:** Remove all the old, direct localStorage manipulation logic from the codebase
- **Documentation:** Update `ARCHITECTURE.md` and other relevant docs to reflect the use of TanStack Query and the final implementation of the auto-save pattern

## Next Steps
- Continue with the current phase as tracked in the project TODOs
- Reference this document for rationale, implementation order, and onboarding new contributors
- Update this handoff as the migration progresses or if the plan changes

---

**For questions or clarifications, see the updated `ARCHITECTURE.md`, `DECISIONS.md`, and `TASKS.md`.** 