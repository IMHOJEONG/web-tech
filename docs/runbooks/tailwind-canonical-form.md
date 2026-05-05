# Tailwind Canonical Form

## What It Means

Tailwind canonical form means writing utility classes in the most standard and intention-revealing way that Tailwind recommends.

It is not "remove every arbitrary value."

It is closer to:

- prefer the built-in utility when one already exists
- keep variant order consistent
- avoid duplicate or redundant utilities
- avoid verbose arbitrary-property syntax when a canonical utility exists
- keep static class strings readable and predictable across files

## Why We Use It

- class strings become easier to scan during review
- editor lint can point to the same style issue consistently
- refactors become safer because utilities follow the same pattern
- UI code feels less hand-written and less accidental

## Project Baseline

The workspace now treats these as editor errors:

- `tailwindCSS.lint.suggestCanonicalClasses`
- `tailwindCSS.lint.recommendedVariantOrder`

See `[.vscode/settings.json](/Users/coder/Desktop/project/web-tech/.vscode/settings.json:1)`.

## Practical Rules

1. Use the normal utility first.
   - Prefer `rounded-lg` over arbitrary radius when the built-in scale is enough.
   - Prefer `object-cover` over `[object-fit:cover]`.

2. Keep class groups in a stable order.
   - Layout and positioning first
   - Sizing and spacing next
   - Border and background next
   - Typography next
   - Effects and transitions next
   - State variants after the base utility
   - Responsive variants last

3. Remove unnecessary wrappers.
   - If a `cn()` call contains only one static string, prefer a plain `className="..."`.

4. Remove duplicates.
   - Example: `rounded rounded-lg` should become `rounded-lg`.

5. Use arbitrary values only when they carry real design intent.
   - Good: `tracking-[0.24em]` for a deliberate display style
   - Good: `bg-[radial-gradient(...)]` for a branded surface
   - Bad: arbitrary syntax for something that already has a built-in utility

6. Replace exact built-in matches when they exist.
   - Prefer `aspect-video` over `aspect-[16/9]`
   - Prefer `text-xs` over `text-[0.75rem]`
   - Prefer `text-lg` over `text-[1.125rem]`
   - Prefer palette tokens like `bg-zinc-950` over raw hex when they are identical

## Examples

Non-canonical:

```tsx
<div className={cn('rounded rounded-lg')} />
<div className={cn('grid gap-5', 'md:grid-cols-2 xl:grid-cols-3')} />
<div className="[display:flex] [object-fit:cover]" />
```

Canonical:

```tsx
<div className="rounded-lg" />
<div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" />
<div className="flex object-cover" />
```

## Current Scope

On `2026-05-05`, we normalized the main `apps/docs` home, category, and shell UI files to this standard first.

That pass focused on:

- broken or invalid class strings
- duplicated utilities
- single-string `cn()` wrappers
- stable utility ordering in recently changed files

The rest of the repository can be migrated incrementally with the same rules.

Some arbitrary values may still remain after cleanup.

That is expected when the value expresses:

- a custom grid fraction
- a branded gradient
- a CSS variable
- an exact shell height or spacing value with no stable built-in equivalent
