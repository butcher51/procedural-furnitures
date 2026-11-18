---
name: furniture-spec
description: Template and research checklist for writing specs/<type>.md — the design spec for one procedural furniture type (styles, real dimensions, parameter table, re-roll groups, kit reuse, new helpers, failure modes). Use when designing a new furniture type or reviewing a spec.
---

# Furniture spec

Write one file: `specs/<type>.md`. Load `furniture-kit` first so the kit reuse map names real helpers. Do not write code.

## Research checklist

- [ ] Real dimensions from at least two sources (ergonomics guides, manufacturer ranges). Cite them.
- [ ] 3–6 styles that are recognisable **as silhouettes at grid distance**, not only by colour.
- [ ] Each style broken into parts; each part mapped to a kit helper or a named new helper.
- [ ] Every parameter has a range in meters (or a set), a distribution and a re-roll group.
- [ ] Group order respects dependencies: a group only reads groups before it.
- [ ] Failure modes listed with a concrete guard (clamp, derived value, or test).
- [ ] Footprint max fits `cell.spacing − 0.1`.

## Template

```markdown
# <Type> spec

## Summary
One paragraph: what it is, why it is fun to generate, what makes seeds differ.

## Real-world references and dimensions
| Dimension | Range | Source |

## Styles
### <style> (weight 0.xx)
- Silhouette: one or two sentences someone could sketch from.
- Parts: list.

## Parameters
| Name | Range / set | Distribution | Depends on | Group |
Units in meters. Distribution: uniform, weighted pick, derived, etc.

## Re-roll groups
| Order | Group | Owns | Visibly changes |
Note any later-group fields that depend on an earlier group.

## Kit reuse map
| Part | Helper | Notes |

## New helpers requested
| Helper | Signature | Why | Reusable by |

## Failure modes and guards
| Failure | Guard | Test |
Examples: floating parts, intersections, tipping, legs through the top, unreadable silhouette.

## describe() rows
| Section (group) | Label | Value format |

## Grid cell
spacing: x.x m, gridSize: n — with the max footprint that drives it.

## Open questions
Numbered, for the human gate.
```

## Review checklist (architect)

- Reuse the designer missed? Near-duplicate helper requests across specs (merge into `specs/_kit-additions.md`)?
- Ranges plausible and within budgets (≤ 6k tris, ≤ 4 draw calls)?
- Groups ordered correctly; style weights sum to 1?
- Approve, or return with concrete edits.
