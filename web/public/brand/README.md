# Institutional marks

`sgh.png` and `singhealth.png` are **derived from the official colour artwork** —
not artwork issued by SGH or SingHealth. Each symbol keeps its brand colour
(SGH's green, SingHealth's orange); only the near-black type under it reverses to
white, because that is the part that disappears on `palette.night`. They are used
by `src/views/components/ui/institution.tsx`, in the brand column down the right
of the Today hero, beneath Clarity's own wordmark.

Regenerate them from scratch with:

```bash
python3 scripts/reverse-institution-marks.py     # needs rsvg-convert + Pillow
```

That script downloads the sources, rebuilds both marks and writes them here, so
this is reproducible rather than a one-off export.

| File | Size | Derived from |
|---|---|---|
| `sgh.png` | 294 × 88 | `Logo of Singapore General Hospital.svg`, English Wikipedia |
| `singhealth.png` | 180 × 139 | `SingHealth Logo.png`, English Wikipedia |

Both are 3× the boxes in `institution.tsx`, so neither is ever upscaled.

## Why they are rebuilt rather than recoloured

SingHealth's logo is raster and separates by saturation: chromatic pixels (the
swoosh) keep their colour, achromatic ones (the wordmark and tagline) go white,
alpha untouched so the anti-aliasing survives.

The SGH lockup cannot be done by recolouring fills, because it is layered: a
solid green rounded square, a solid *white* square on top that leaves the green
showing only as a frame, then the "sgh" monogram in green over that. Drop the
white square and the first layer becomes a solid green blob that swallows the
monogram. The script rebuilds it by rendering the layers separately and
recombining them, so the symbol's field is genuinely transparent and the panel
shows through it. Set `FAITHFUL = True` in the script to keep that field white
instead, reproducing the symbol exactly as drawn at the cost of a white chip on
the dark panel.

## Before this ships

1. **Get the official reversed lockups.** Both brand teams will have them, and
   theirs are authoritative about clear space, minimum size and how the monogram
   is treated in mono. Drop them in with these filenames and delete the script.

2. **Permission, in writing.** These were downloaded from
   `upload.wikimedia.org/wikipedia/en/`, where English Wikipedia hosts **non-free**
   files under a fair-use rationale that does not extend to an app. Permission
   was asserted by the project owner; keep the written version with the repo.
   Deriving a reversed variant is also a modification of a trademark, which is
   normally something the brand owner signs off on specifically.

3. **The SGH file already contains SingHealth.** It is the *endorsed* lockup —
   "Singapore General Hospital" over a rule, with "SingHealth" beneath — so
   showing the SingHealth corporate logo under it states the cluster twice. Pass
   `cluster={false}` to `InstitutionLockup` for the hospital's mark alone, which
   is what SingHealth's own guidelines describe for a hospital-level surface.

4. **The SingHealth tagline is illegible at this size.** "Defining Tomorrow's
   Medicine" renders around 3pt. Brand kits normally include a no-tagline variant
   with a lower minimum size; ask for it. Do not crop it off this file — that
   makes an unapproved variant.

## Placement

They sit under Clarity's wordmark in the brand column down the right of the Today
hero, left-aligned to each other so the stack has a spine. That column is real
layout, not an overlay: it takes width out of everything beside it, which is why
the hero's appointment details moved to a full-width `footer` slot underneath
rather than wrapping in what was left.

Worth confirming with whoever owns the safety rule: this column sits on the card
carrying the countdown and the patient's plan, and `src/models/flag/flag.rules.ts`
is explicit that the app never decides whether a scope goes ahead.
