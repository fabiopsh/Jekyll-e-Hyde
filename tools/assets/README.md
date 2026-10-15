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
| Ritratto | `assets/portraits/<id>_<umore>.png` | 128×160, con fondale | SDXL busto su fondale scuro → inquadratura 4:5 dal cappello alle spalle (la maschera serve solo a trovare la testa, niente scontorno) → riduzione → palette |
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

## Coerenza visiva dei personaggi tra pose e fotogrammi

Generare fotogrammi o pose diverse da zero con diffusion model produce inevitabilmente "allucinazioni" e derive
sui dettagli (fisionomia, colore dei vestiti, proporzioni). Per garantire che ogni personaggio sia sempre
rigorosamente lo stesso in tutte le pose:

1. **Scheda aspetto invariante** in `prompts/characters.yaml`: definisce l'identità del personaggio (cappello,
   foggia e colore esatto dell'abito, fisionomia, età, negativi dedicati) applicata a ogni richiesta.
2. **Bozzetto guida di posa** (`data/layouts/pose_profile_<id>.png`): silhouette a blocchi colore piatti che
   fissa anatomia, proporzioni e palette dell'abito prima dell'inferenza SDXL (tramite `img2img` con strength tarata
   a 0.75 e rumore a 6). Ad esempio, `pose_profile_enfield.png` impone la giacca chiara a Enfield, distinguendolo
   immediatamente dal pastrano scuro di Utterson.
3. **Derivazione fotogrammi con `animate.py`**: invece di rigenerare fotogrammi con l'IA (che cambierebbe i pixel
   del personaggio a ogni passo), `animate.py` prende la singola posa base approvata e genera proceduralmente
   l'intera animazione di camminata e respiro idle. In questo modo **l'identità del personaggio è matematicamente identica
   al 100% su tutti i fotogrammi**, senza alcuno sfarfallio.
4. **Atlas Phaser standard**: lo spritesheet e il file atlas JSON (`assets/characters/<id>.png/.json`) vengono
   caricati nativamente da Phaser con le animazioni `idle` e `walk`.

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
