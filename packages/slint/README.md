# Starkplane for Slint — reserved

This directory reserves space for a possible Slint implementation of Starkplane. No Slint components, dependencies, manifests, or build targets exist yet.

**Everything is subject to change until v1.0.0.**

Start with the [design principles](../../docs/design-language.md) and [implementation boundaries](../../docs/implementations.md). Future components should share Starkplane's geometry, material roles, states, and motion intent while following native platform conventions. Token ownership currently lives in `packages/web/src/tokens.ts`; its build generates a JSON handoff at `packages/web/lib/tokens.json`.
