# Sorceress Art Pipeline — The Weeping Walls

The game renders fully with procedural (code-painted) textures, but any of
them can be replaced by real artwork. Generate an image in Sorceress using
the matching prompt from the game bible (Section 10 — see
`GAME_BIBLE.md`), save it with the exact filename below into
**`game/assets/`**, push, and the game uses it automatically. No code
changes needed. Delete the file to fall back to the procedural version.

## How to generate & install

1. In Sorceress, run the prompt listed for the asset (copy it from
   `docs/GAME_BIBLE.md`, Section 10).
2. Download as PNG. Square images work best; textures marked **tileable**
   should be generated as seamless/tileable if Sorceress offers the option.
3. Rename the file to the exact name in the table (case matters).
4. Put it in `game/assets/` in the repo and push (or upload the PNGs to
   Claude in chat and I'll commit them for you).
5. The website redeploys itself; refresh and the art is in the game.

Keep images ≤1024×1024 — the PSX renderer downsamples everything anyway,
and small files keep the site fast.

## Act 1 assets (in the game now)

| Filename (game/assets/) | Bible prompt | Used for | Tileable |
|---|---|---|---|
| `gravel.png` | PROMPT 003 | drive & grounds | yes |
| `limestone.png` | PROMPT 006 | exterior walls | yes |
| `flagstone.png` | PROMPT 007 | entrance hall, kitchen, bathroom floors | yes |
| `panelling.png` | PROMPT 008 | dark oak wall panelling, doors | yes |
| `fernWallpaper.png` | PROMPT 009 | ferns-and-songbirds wallpaper (most rooms) | yes |
| `roseWallpaper.png` | PROMPT 010 | roses-and-thorns paper (behind library shelf; Eleanor's room in Act 2) | yes |
| `woodFloor.png` | PROMPT 012 | floorboards (light) | yes |
| `woodFloorDark.png` | PROMPT 012 (darker variant) | floorboards, stairs, corridor | yes |
| `portraitEleanor.png` | PROMPT 030 | Eleanor's portrait, entrance hall — include frame + scratched brass plate | no |
| `portraitThomas.png` | PROMPT 031 | Thomas's portrait, second floor — include frame | no |
| `plaster.png` | — (aged plaster, neutral) | kitchen/bathroom walls, breathing wall | yes |
| `plasterDark.png` | — (darker ceiling plaster) | ceilings | yes |
| `slate.png` | — (grey-green slate worktop) | kitchen counter | yes |
| `bookshelf.png` | PROMPT 017 (detail: blank-spined books on dark shelves) | library shelving | no |
| `curtain.png` | — (heavy Victorian curtain fabric) | window dressings | yes |
| `windowPane.png` | — (lead-framed 4-pane window, night) | all windows | no |
| `landscape0.png` / `landscape1.png` | — (gloomy Victorian landscape paintings) | hall pictures | no |
| `childDrawing.png` | — (child's crayon house, 13 windows, figure in one) | breakfast room door | no |
| `sheetMusic.png` | — (1880s handwritten sheet music) | piano stand | no |
| `linen.png` | — (aged white bed linen) | bedding | yes |

## Coming with Acts 2–4

`cellarEarth.png` (PROMPT 013) is already wired for the cellar. The west
wing, Eleanor's room props (PROMPTs 022–029), the black book (027), the
archive book (033) and the supernatural effects (037–044) will get override
slots as those scenes are built — same workflow.
