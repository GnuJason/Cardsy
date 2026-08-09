# Grandmagame

Grandmagame is a Turborepo monorepo for the solitaire game family. The playable Vite application lives in `apps/web`; it currently includes Klondike, FreeCell, Spider, Pyramid, TriPeaks, and Golf.

## Workspace layout

- `apps/web`: Vite/React web application, screens, hooks, sound service, and app-specific static assets.
- `packages/card-engine`: Card model plus shared deck, randomization, move, rule, and scoring logic.
- `packages/game-logic`: Rules, deals, moves, layouts, and scoring for FreeCell, Spider, Pyramid, TriPeaks, and Golf.
- `packages/pixi-engine`: Pixi application lifecycle, rendering, layout, animation, and interaction.
- `packages/ui`: Reusable React game boards, cards, HUD, modal, and toast components.
- `packages/themes`: Theme definitions, card art, family deck assets, and card-back helpers.
- `packages/storage`: Browser storage, statistics, and achievements.
- `infra`: Deployment and automation support files.

Each package owns the tests for its logic. `apps/web` composes the packages and keeps browser-specific orchestration. Package entry points use `@grandmagame/*` names; Vite resolves them directly to workspace source for development.

## Commands

Use pnpm from the repository root:

```bash
pnpm install
pnpm dev
pnpm test
pnpm lint
pnpm build
```

Turbo caches build, lint, typecheck, and test tasks locally. CI uses pnpm's store cache and accepts optional `TURBO_TOKEN` and `TURBO_TEAM` secrets for remote Turbo caching.