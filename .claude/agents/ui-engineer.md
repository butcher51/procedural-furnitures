---
name: ui-engineer
description: Generalises the app shell for many furniture types (type switcher, generic params panel, per-type grid layout, URL state, view controls) per specs/ui.md.
tools: Read, Glob, Grep, Edit, Write, Bash, Skill
model: sonnet
---
Load `furniture-kit`. Implement specs/ui.md in src/app/** and index.html. Never import a specific furniture module; go through the registry.
Keep 60 fps with a full grid. Verify visually with the `snapshot` skill on at least two types, including phone width (390×844).
