# Architectural Decision Records (ADRs)

This directory contains Architectural Decision Records (ADRs) documenting key technical decisions made during the development of the Life Simulation Game.

## What are ADRs?

ADRs are documents that capture important architectural decisions along with their context and consequences. Each record describes:
- **Status**: Current state (Accepted, Deprecated, Superseded)
- **Context**: The problem or situation requiring a decision
- **Decision**: The choice that was made
- **Consequences**: Positive, negative, and neutral outcomes
- **Alternatives Considered**: Other options and why they were rejected

## Index

### Build and Development
- [ADR-001: Build System - Vite over Webpack](ADR-001-build-system-vite.md)
  - Why we chose Vite for faster development and better DX

- [ADR-008: ES6+ Module System](ADR-008-es6-modules.md)
  - Using native ES6 modules with explicit `.js` extensions

### Game Architecture
- [ADR-002: Programmatic Graphics for Phase 1](ADR-002-programmatic-graphics.md)
  - Using colored rectangles instead of sprite assets initially

- [ADR-006: Scene Management - Boot and Game Scenes](ADR-006-scene-management.md)
  - Two-scene architecture for loading and gameplay

- [ADR-007: Arcade Physics Engine](ADR-007-arcade-physics.md)
  - Choosing Phaser Arcade Physics over Matter.js

### User Experience
- [ADR-003: Unified Input Controller Architecture](ADR-003-unified-input-controller.md)
  - Single API for keyboard and touch input across platforms

- [ADR-004: Responsive Canvas Strategy](ADR-004-responsive-canvas.md)
  - Maintaining aspect ratio while supporting all screen sizes

### Data Management
- [ADR-005: LocalStorage Save System](ADR-005-localstorage-save-system.md)
  - Browser localStorage for game state persistence

### Testing
- [ADR-009: Playwright for E2E Testing](ADR-009-playwright-e2e-testing.md)
  - End-to-end browser testing with Playwright over Cypress/Selenium

## Decision Process

Each major technical decision follows this process:
1. **Identify the problem** requiring a decision
2. **Research alternatives** and their trade-offs
3. **Evaluate** against project requirements (cross-platform, performance, maintainability)
4. **Document the decision** with rationale
5. **Implement** the chosen solution
6. **Review** consequences during development

## Status Definitions

- **Accepted**: Currently active decision
- **Deprecated**: Superseded by a newer decision but still in use
- **Superseded**: Replaced by a newer decision (references the new ADR)

## Contributing

When making a significant architectural decision:
1. Create a new ADR file: `ADR-XXX-descriptive-name.md`
2. Use the standard template (see existing ADRs)
3. Document context, decision, consequences, and alternatives
4. Update this README with a brief description
5. Commit the ADR with the implementation

## Related Documentation

- [Development Plan](../development-plan.md) - Overall project roadmap
- [Worklog](../worklog.md) - Chronological development log
- [Requirements](../requirements.md) - Original game requirements
- [Phase 1 Status](../phase1-ACTUAL-status.md) - Current project status

---

*Last updated: Phase 1 - The Foundation*
