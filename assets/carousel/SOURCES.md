# Carousel photographs: provenance

The six photographs behind the "Know your prep" carousel on the Today screen.
These are **application assets**: they are bundled into the binary and ship to
every user, so the bar for rights is higher than it would be for demo data.

Every file here must have a row in the table below before it is committed. If
you cannot say where an image came from and on what basis it is being used, it
does not belong in this folder.

All six were retrieved on **12 September 2026** from
[HealthHub](https://www.healthhub.sg), Singapore's national health information
portal, which is run by **Synapxe** (the national HealthTech agency) for the
**Ministry of Health**. Retrieval was on the basis of approval confirmed by the
project owner. Each is served from HealthHub's own content API
(`ch-api.healthhub.sg`, or `syn-p-001.sitecorecontenthub.cloud` for one).

| File | Card | Depicts | HealthHub page it appears on | Asset URL | Original |
|------|------|---------|------------------------------|-----------|----------|
| `medicines.jpg` | A week before, *Some medicines stop first* | A pharmacist in a dispensary going through a medicine box with an older man | [Water, the elixir of life](https://www.healthhub.sg/live-healthy/water-the-elixir-of-life) | `ch-api.healthhub.sg/api/public/content/cd0a1a03cdd4499f973e07c603ae3056` | 724×483 |
| `meal-check.jpg` | The diet days, *"Can I eat this?"* | A plate of nasi lemak: coconut rice, peanuts, egg, cucumber, sambal | [Colonoscopy Procedure](https://www.healthhub.sg/health-conditions/colonoscopy-video) | `syn-p-001.sitecorecontenthub.cloud/api/public/content/4239ba3f1380467a9deaefc62129fde5` | 1920×1281 |
| `clear-fluids.jpg` | The diet days, *Clear fluids, and plenty* | Two hands at a table, one holding a glass of water, the other a tablet | [Colorectal Cancer](https://www.healthhub.sg/health-conditions/colorectalcancer) | `ch-api.healthhub.sg/api/public/content/929fd022c54d4fabba44b73d4bf17ab9` | 811×431 |
| `purgative-time.jpg` | The purge night, *The full volume, on time* | A man at a desk holding a glass of water and a bottle of medicine | [Whole grains](https://www.healthhub.sg/live-healthy/whole-grains) | `ch-api.healthhub.sg/api/public/content/d01fce736f774ee9bca3d9bafd6afc01` | 724×482 |
| `care-team.jpg` | 6pm to 2am, *Someone to ask at 1am* | A nurse at the bedside talking with an older woman patient | [Colorectal Cancer](https://www.healthhub.sg/health-conditions/colorectalcancer) | `ch-api.healthhub.sg/api/public/content/0d24f661bacb4b55846a01347ae43b5f` | 1200×689 |
| `consult.jpg` | The morning of, *One summary for your nurse* | A doctor examining an older woman with a relative's hand on her shoulder | [Gastroscopy Procedure](https://www.healthhub.sg/health-conditions/gastroscopy-video) | `ch-api.healthhub.sg/api/public/content/bab7f8eb6f114d038798f5dda9b0e6da` | 9504×6336 |

## The gap in this table, stated plainly

**HealthHub is the publisher these were retrieved from, not necessarily the
copyright holder.** Several are visibly commercial stock photography that
HealthHub itself licenses (one still carries an `iStock` string in its
neighbours' filenames on the same pages). A licence HealthHub holds for its own
portal does **not** transfer to a third-party app by virtue of the images being
reachable from that portal, and the project owner's approval covers *retrieving*
them, not the underlying rights.

Before this app is distributed to anyone outside the team, each row needs one of:

- written confirmation from Synapxe/MOH that reuse is permitted, and on what terms;
- the original stock licence, purchased in the project's own name; or
- a replacement photograph the project holds rights to.

Until then, treat these six as **pitch and prototype assets**. This is exactly
the check that `Catholic+/assets/headers/SOURCES.md` flags for its two owner-
supplied headers, and it is not satisfied yet here.

## People in these photographs

Five of the six show identifiable faces, none of whom are known to have
consented to appearing in this app specifically. That is a second reason the
rows above need settling before release, and it is the more urgent of the two:
a rights problem is a negotiation, but a patient-lookalike in a colonoscopy app
is a person's likeness attached to a bowel condition.

The one photograph with no face: `clear-fluids.jpg`, hands and a glass: is the
safest of the six on both counts, and is a good model for replacements.

## Processing

Each was cover-cropped to **3:2** and encoded as progressive JPEG at quality 86,
at **780×520**: @3x for the ~260pt card the carousel renders. Three of the six
(`medicines`, `clear-fluids`, `purgative-time`) came from sources smaller than
that and were upscaled by 1.08–1.21×; they are very slightly soft at @3x on a
large phone. Larger originals are the fix if HealthHub has them.

Crops were biased where the subject sat off-centre: `medicines`, `care-team` and
`consult` were trimmed from the bottom (0.35–0.4 vertical bias) to keep faces
and hands in frame rather than centring on torsos.

## Constraints on any replacement

- **3:2 landscape**, at least 780×520, ideally 1560×1040 for @3x headroom.
- **The bottom third must tolerate a dark scrim and white text.** The card lays
  its caption over a gradient to `rgba(9,11,17,0.88)`; a photograph whose
  subject lives at the bottom edge will be buried by it.
- **Nothing clinical or graphic.** No endoscopic imagery, no stool, no bowel
  contents. The stool check has its own reference scale, drawn as vector
  illustration rather than photographed, for the same reason.
- **Recognisably Singapore where the card is about food.** The whole argument
  of feature 03 is that a printed sheet cannot speak to what people here
  actually eat; a carousel of Western breakfasts would undercut it.

## Adding more

Drop the JPEG in here, add its row above, then add the slide to `PREP_SLIDES`
in `src/components/prep-carousel.tsx`.
