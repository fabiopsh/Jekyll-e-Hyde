# tools/assets — pipeline degli asset pixel art

Genera in locale, sulla GPU, sfondi, personaggi, ritratti e oggetti del gioco, e li porta nel formato che il
gioco usa (`assets/`). Modelli già nella cache Hugging Face del PC (gli stessi di
`ASE-Tamer-Project/tools/monster-gen`):

- `stabilityai/stable-diffusion-xl-base-1.0` — modello base SDXL
- `nerijs/pixel-art-xl` — LoRA che porta SDXL verso lo stile pixel art
- `madebyollin/sdxl-vae-fp16-fix` — VAE che evita artefatti in fp16
- `latent-consistency/lcm-lora-sdxl` — opzionale, generazione rapida per le prove

## Regola di originalità

Personaggi e luoghi si disegnano **solo dalle descrizioni del libro** (`story/bible.md`). I prompt non
nominano film, attori, illustratori, fumetti o altri giochi tratti dal romanzo: l'aspetto di Jekyll, Hyde e
degli altri è un design originale di questo progetto.

## Tipi di asset e formato finale

| Tipo | Cartella finale | Dimensione | Come si fa |
|---|---|---|---|
| Sfondo di scena | `assets/backgrounds/<loc_id>.png` | 480×270 | SDXL 1344×768 → ritaglio 16:9 → riduzione a griglia → palette comune |
| Primo piano (opz.) | `assets/backgrounds/<loc_id>_fg.png` | 480×270, trasparente | ritaglio a mano o maschera dallo sfondo |
| Personaggio in scena | `assets/characters/<id>.png` + `.json` | fotogrammi alti ~64 px | posa base generata → fotogrammi derivati (sotto) |
| Ritratto | `assets/portraits/<id>_<umore>.png` | 128×160 | SDXL busto → scontorno → riduzione → palette |
| Oggetto | `assets/items/<obj_id>.png` | 32×32 | SDXL oggetto isolato → scontorno → riduzione |

Ogni PNG finale ha accanto la sua voce in `assets/manifest.json` (prompt, seed, variante scelta, data):
così chiunque può rigenerarlo uguale.

## Coerenza dello stile

1. **Prefisso di stile unico** per ogni tipo (in `prompts/style.yaml`): epoca vittoriana, Londra 1880, luce a
   gas, nebbia, toni bruni e verde scuro.
2. **Palette comune**: `palette.hex` (circa 32 colori), applicata a tutti gli asset dopo la riduzione.
   Si ricava dai primi sfondi approvati da Fabio e poi resta fissa.
3. **Seed fissi** e varianti numerate; si sceglie a mano dal foglio di confronto (`contact_sheet.py`).
4. **Scheda aspetto** per personaggio in `prompts/characters.yaml`, presa da `story/bible.md`, identica in
   tutti i prompt di quel personaggio (posa in scena, ritratti).

## Animazioni

Generare fotogrammi diversi con SDXL produce personaggi che cambiano da un fotogramma all'altro. Quindi:

1. Si genera **una posa base** del personaggio, di profilo, figura intera, su fondo neutro.
2. `animate.py` la divide in fasce (testa, busto, gambe) e deriva i fotogrammi:
   - `idle`: 2 fotogrammi, respiro di 1 px sul busto;
   - `walk`: 4 fotogrammi, gambe alternate e oscillazione di 1 px;
   - `talk`: 2 fotogrammi, sul ritratto, bocca aperta/chiusa nella zona del mento.
3. Uscita: spritesheet PNG + JSON atlas Phaser (stesso formato dell'export di Aseprite/LibreSprite).
   Un fotogramma ritoccato a mano si salva sopra quello generato: il gioco non cambia.
4. Nel gioco si aggiungono movimenti via codice (passo, piccoli rimbalzi, specchiatura sinistra/destra),
   che non richiedono asset.

## Passi (da implementare)

```
uv sync                                   ambiente Python con torch CUDA, diffusers, rembg
uv run generate.py --kind background --ids loc_door --variants 4
uv run postprocess.py                     riduzione a griglia, palette, scontorno
uv run contact_sheet.py                   fogli di confronto in output/sheets/
uv run animate.py --ids utterson          fotogrammi e atlas
uv run export.py                          copia le varianti scelte in assets/ e aggiorna il manifest
```

Le richieste di asset stanno in `data/assets.yaml` (id, tipo, soggetto, varianti); le scelte in
`data/selections.yaml`. `output/` non è versionata.
