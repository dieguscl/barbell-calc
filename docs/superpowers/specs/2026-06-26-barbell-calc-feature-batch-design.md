# Barbell Calculator — Feature Batch Design

**Date:** 2026-06-26
**Status:** Approved (design), pending implementation plan
**Branch:** `revamped`

## Summary

Add five capabilities to the barbell plate calculator while keeping the
simple/common path uncluttered:

1. Quick-increment ("stepper") buttons for percentages and manual weights.
2. A "simple mode" plate algorithm that forbids repeated small disks.
3. An advanced section that unlocks custom bar weight, custom plate
   inventory, and the toggle to allow repeated small plates.
4. Shareable multi-person profiles (name + gender + per-movement PRs),
   imported via link or QR.
5. Side-by-side calculation: one movement + percentages computed for several
   profiles at once.

The organizing principle: **Simple (default) vs Advanced (one collapsible
section, default closed).** Simple users never see profiles, custom bars, or
algorithm knobs.

## Current state (baseline)

- Next.js 16 / React 19 app. Key files:
  - `app/components/weight-calculator-form.tsx` — the single form (units tabs,
    percentages/manual tabs, movement+PR, bar-weight tabs, dynamic value rows).
  - `lib/calculations.ts` — `calculatePlateConfigurations` (progressive
    targets, carry-over of large base plates) + `calculatePlatesOptimal`
    (unbounded DP coin-change, cost penalty on plates below 10kg/25lb) +
    `calculatePlateInventory`.
  - `app/results/page.tsx` + `app/results/components/*` — results, per-plate
    disable toggles, barbell visual.
  - `lib/i18n.ts` — `en`/`es`/`pt` translation tables.
- Persistence today: `localStorage` keys `barbell-calc-units`,
  `barbell-calc-bar-weight`, `barbell-calc-movement-prs`; plus URL params for
  shareable single calculations.
- `AVAILABLE_PLATES`: KG `[25,20,15,10,7.5,5,1.5,1,0.5]`, LB `[45,35,25,10,5,2.5]`.
- Bar presets: KG `[20,15]`, LB `[45,35]`; equivalence 20↔45, 15↔35.

## Mode model

- **Simple (default):** repeated-small-plate rule ON, standard bar presets,
  single person ("Me"). No extra UI.
- **Advanced (collapsible, default closed):** allow-repeated-small-plates
  toggle, custom bar weight, custom plate inventory, profile management +
  side-by-side selection.

Closed advanced section ⇒ pure simple behavior.

## Feature 1 — Stepper buttons (not advanced; all users)

- **Percentages tab:** `+5`, `+10` buttons. Each appends a NEW row whose value
  is `lastNonEmptyValue + step`. Empty list ⇒ value is the step itself.
- **Manual weights tab:** steps depend on units —
  - KG: `+2.5`, `+5`, `+10`
  - LB: `+5`, `+10`, `+20`
  Each appends `lastNonEmptyValue + step`.
- Placement: alongside the existing "Add percentage/weight" button. Reuse the
  existing `setPercentageCount` + `form.setValue('percentages', ...)` append
  path so URL sync and focus behavior stay consistent.
- "Last value" = last entry in `percentages` that parses to a number; if none,
  treat base as 0 so the first tap yields the step value.

## Feature 2 — Simple-mode plate algorithm

- New calculation param `allowRepeatSmallPlates: boolean` (default `false`).
- **Rule:** plates strictly `< 5` (KG) or `< 10` (LB) may appear **at most once
  per side** when `allowRepeatSmallPlates` is false.
  - KG small set: `1.5, 1, 0.5`. LB small set: `5, 2.5`.
- **Implementation:** convert `calculatePlatesOptimal` from unbounded DP to a
  **bounded-count** DP. Each plate carries a max count: small plates → `1` in
  simple mode (`Infinity`/large in advanced), large plates → unbounded always.
  Keep the existing below-threshold cost penalty (favor fewer small plates) and
  the carry-over base-plate logic in `calculatePlateConfigurations`.
- The carry-over threshold (10kg/25lb) is independent of the new 5kg/10lb rule;
  both remain. Because small plates are not carried across targets, each config's
  small-plate count equals one DP call's output, so the per-config cap holds.
- **Tradeoff:** coarser fine-tuning near the target weight (intended; matches
  real gym plate sets).

## Feature 3 — Advanced bar/plate configuration

Inside the advanced section:

- **Custom bar weight:** numeric input; when set, overrides the preset tabs and
  feeds `barWeight` to the calculation. Presets remain for simple mode.
- **Plate inventory:** toggle which standard sizes are available, plus add a
  custom size. (Results page already supports per-plate disabling at view time;
  this controls the source set.) Custom plate *counts* are deferred (v2).
- **Allow repeated small plates** toggle (drives Feature 2's param).

## Feature 4 — Profiles, gender, sharing

### Data model

```ts
interface Profile {
  id: string                 // slug of name or generated id
  name: string
  gender: "M" | "F"
  units: "KG" | "LB"
  movements: { [movement: string]: { pr: string } }
}
```

- Storage: `localStorage` key `barbell-calc-profiles` (array or id-map).
- **Migration:** existing `barbell-calc-movement-prs` becomes the default
  **"Me"** profile (gender defaults to M / 20kg, user-editable). No data loss.

### Gender → default bar

- Female ⇒ 15kg / 35lb; Male ⇒ 20kg / 45lb. Always overridable per calculation.

### Sharing (link + QR)

- **Generate:** encode `{ name, gender, units, movements }` as base64 JSON into
  `/import?p=<payload>`. Render the link AND a QR of it (add dependency
  `qrcode.react`).
- **Import route** `app/import/page.tsx`: decode `p`, show a preview
  ("Add <name> — <gender>, N movements?"), confirm ⇒ upsert into
  `barbell-calc-profiles`. Handle malformed payloads gracefully.
- Profile management UI (list / import / show-QR / delete) lives in Advanced.
- Imported profiles are snapshots; v1 supports delete + re-import, not inline
  editing.

## Feature 5 — Side-by-side calculation

- Selection: in Advanced, multi-select profiles to compare. Choose one movement
  + percentages/weights (manual mode also allowed).
- Each selected profile computes with **its own PR** (for that movement) and its
  **own gender-default bar** (overridable).
- **Results:** one card per person — person name, their target weights, plate
  configs, and their own "grab these plates" inventory (different PRs ⇒ different
  plates, so inventory is per person).
- URL: `profiles=id1,id2&movement=...&isPercentages=...&value0=...`; the results
  page reads the referenced profiles from `localStorage` (same-device).
- **Out of scope (v1):** sharing a side-by-side result link (other devices won't
  have the profiles).

## Cross-cutting

### i18n

New keys across `en`/`es`/`pt`:
- Steppers: none needed if buttons show literal `+5` etc. (verify).
- Advanced section title + descriptions.
- Custom bar weight / plate inventory labels.
- Profiles: add, import, share, QR, delete, gender (male/female), "Me".
- Import preview + confirm strings.
- Side-by-side: select people, per-person headings.

### Testing

Extend `test.ts` (Node/ts test harness already present):
- Simple mode ⇒ every config has ≤1 of each small plate (<5kg / <10lb).
- Advanced mode ⇒ repeated small plates permitted (regression of current
  behavior).
- Gender → bar default mapping (F=15/35, M=20/45).
- Share payload encode → decode round-trip equals original profile.
- Migration: legacy `movement-prs` → "Me" profile shape.

## Build order

1. Stepper buttons (isolated UI; immediate value).
2. Algorithm: `allowRepeatSmallPlates` + bounded DP + tests.
3. Advanced section shell + custom bar weight + plate inventory + algo toggle.
4. Profiles model + migration + gender defaults.
5. Share link + QR generation + `/import` route.
6. Side-by-side results.

## YAGNI cuts

- No sharing of side-by-side result links (single-profile share only).
- No inline editing of imported profiles.
- No custom plate counts in v1 (sizes only).
