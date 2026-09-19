# People cards 2026 — web copies

`speakers.html` loads these. They are derived files: the masters live in
`assets/photos/people cards '26/` as 1080×1350 PNGs straight out of the card
template, and each one is ~500–800 KB. Shipping the eleven masters would have
put ~6.8 MB of images on one page; these WebP copies come to ~370 KB.

## What the derivation does

Every master shares the same frame position, so one crop box works for all of
them: **x 199→881, y 185→1071**. That trims the transparent margin, keeps the
frame bottom edge (identical on every card at y=1070), and leaves 7px of
headroom above the tallest head that breaks out of its frame. The result is
682×886, resized to **600px wide** — 3× the ~190px the page ever displays —
and saved as WebP at quality 86.

## Regenerating

Drop a new master into `Summit-2026/people cards '26/` with the same `<name>-<role>.png`
naming, then:

```python
from PIL import Image
import glob, os

BOX, W = (199, 185, 881, 1071), 600
os.makedirs('assets/photos/Summit-2026/cards-2026', exist_ok=True)
for f in glob.glob("assets/photos/Summit-2026/people cards '26/*.png"):
    im = Image.open(f).convert('RGBA').crop(BOX)
    im = im.resize((W, round(W * im.size[1] / im.size[0])), Image.LANCZOS)
    im.save('assets/photos/Summit-2026/cards-2026/' + os.path.basename(f)[:-4] + '.webp',
            'WEBP', quality=86, method=6)
```

If a future card is composed differently and the crop clips it, check the new
master's alpha bounding box before trusting `BOX`.

## The schedule thumbnails

`faces-2026/` holds the small round-ish heads on `schedule.html`. They are cut
from the 600px card, not from the master: box **(0, 40, 600, 640)**, resized to
**180×180**, WebP quality 86. That keeps a sliver of the cream frame down each
side and the head still breaking out of its top edge, which is what makes them
read as the same object as the big cards. Whenever a card is regenerated, redo
its face too:

```python
face = card.crop((0, 40, 600, 640)).resize((180, 180), Image.LANCZOS)
face.save('assets/photos/Summit-2026/faces-2026/' + name + '.webp',
          'WEBP', quality=86, method=6)
```

## Where each one is used

`speakers.html` uses the five `-guest` and three `-mod` cards. The three
`-team` cards run in the team section at the foot of `summit-2026.html`, and
three of the `-guest` cards (bolor, boki, khulan) also appear in that page's
speakers grid.

Note the master paths in the snippet above assume this folder still sits under
`assets/photos/Summit-2026/`. Re-run the snippet whenever a master changes —
the copies here are not generated automatically.
