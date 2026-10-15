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
| Illustrazione | `assets/illustrations/<ill_id>.png` | 160×200 (4:5) | SDXL 896×1152, scena intera → nessuno scontorno → ritaglio centrale 4:5 (896×1120) → riduzione a griglia → palette comune |

Ogni PNG finale ha accanto la sua voce in `assets/manifest.json` (prompt, seed, variante scelta, data):
così chiunque può rigenerarlo uguale.

## Coerenza dello stile

1. **Prefisso di stile unico** per ogni tipo (in `prompts/style.yaml`): epoca vittoriana, Londra 1880, luce a
   gas, nebbia, toni bruni e verde scuro.
2. **Palette comune**: `palette.hex`, applicata a tutti gli asset dopo la riduzione. Le prime 32 righe
   vengono dai primi sfondi approvati (palette di giorno); le righe 33-40 sono i colori notturni aggiunti il
   2026-10-16 (sezione "Palette notturna" sotto). I colori già presenti non si cambiano.
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

## Illustrazioni (riquadro a destra, `docs/DECISIONI.md` D20)

Tipo `illustration` in `data/assets.yaml`: una scena intera, senza scontorno. SDXL genera 896×1152,
`postprocess.py` ritaglia al centro un 4:5 (896×1120), riduce a griglia a 160×200 e applica `palette.hex`;
`export.py` copia la variante scelta in `assets/illustrations/<id>.png` e aggiunge la voce in
`assets/manifest.json`. Prefisso, suffisso e negativo stanno nel blocco `illustration` di `prompts/style.yaml`.

- **Personaggi nella scena.** `{utterson}` nel `subject` diventa la scheda di quel personaggio in
  `prompts/characters.yaml` (campo `illustration` se c'è, cioè l'aspetto senza cappello e scarpe e più corto,
  altrimenti `appearance`) e ne aggiunge il `negative_extra`. `negative_extra` vale anche sulla singola richiesta.
- **Composizione.** Quando il testo da solo non mette le figure al posto giusto si usa un bozzetto:
  `make_layouts.py` disegna `data/layouts/<id>.png` a blocchi di colore (stesso metodo dei bozzetti di posa, D18)
  e la richiesta lo usa con `layout`, `strength` e `noise`. Per il capitolo 1 servono: angolo, cerchio di
  persone, mano in guanto alla serratura, cortile, passeggiata (cappotto chiaro di Enfield), monete e assegno.
- **La stessa porta della stradina.** `ill_c1_door_closeup` e `ill_c1_door_key` partono da un riquadro 4:5
  di `assets/backgrounds/loc_by_street.png` (`DOOR_BOX` = x 229-289, y 108-183; `LOCK_BOX` = x 248-280,
  y 134-174, in pixel di 480×270), letto con `layout_crop` di `generate.py`; `make_layouts.py` aggiunge
  gradini, fiammiferi e tagli (porta) oppure buio, luce a gas e la mano in guanto (chiave). Con strength
  basso (0.45) forma e colori della porta restano quelli dello sfondo.
- **Versione notturna di uno sfondo.** `layout` può essere un'immagine già approvata del repository
  (`assets/backgrounds/<id>.png`): `generate.py` la porta alle dimensioni di generazione senza deformarla
  (480×270 → 1344×756 più 6 righe ripetute sopra e sotto, che il ritaglio 16:9 toglie), così la composizione
  resta identica. `layout_grade: [r, g, b]` ne moltiplica i colori. Per `loc_by_street_night`
  `make_layouts.py` parte dallo sfondo diurno, lo scurisce verso il blu, accende il lampione, aggiunge
  una leggera nebbia azzurrina e scurisce la porta; poi img2img con strength 0.45.

```
uv run make_layouts.py                                   bozzetti di composizione in data/layouts/
uv run generate.py --kind illustration --dry-run         prompt e conteggio dei token CLIP (massimo 77)
uv run generate.py --kind illustration                   4 varianti per illustrazione
uv run generate.py --ids ill_c1_lamps --variants 8       aggiunge le varianti 4-7
uv run postprocess.py --kind illustration
uv run contact_sheet.py --kind illustration              un foglio per id, ingrandito x2
uv run export.py --ids ill_c1_lamps
uv run contact_sheet.py --summary c1_illustrations --kind illustration --scale 2
                                                         solo le varianti scelte, in un foglio
```

## Palette notturna (2026-10-16)

La palette di giorno non aveva blu notte né oro: le scene di notte venivano bruno-grigie. Sono stati aggiunti
8 colori in fondo a `palette.hex`, scelti così:

1. `postprocess.py --ids loc_by_street_night,ill_c1_lamps,ill_c1_corner,ill_c1_crowd --extend-palette 8
   --dry-palette`: k-means in CIELAB sulle versioni ridotte e non quantizzate delle immagini notturne, con i 32
   colori di giorno fissi. Risultato: quasi solo scuri (`231e28`, `2d2c36`, `383640`, `1c181d` sono il 50% dei
   pixel) e due blu (`363c61`, `495375`); nessun oro, perché le luci sono pochi pixel.
2. Per i ruoli che il k-means non vede, i colori sono misurati nell'immagine grezza dello sfondo notturno
   (percentili di luminosità per zona) e nell'illustrazione dei lampioni.

| Colore | Ruolo | Da dove |
|---|---|---|
| `211d28` | nero-blu della notte | k-means (gruppo `231e28`/`1c181d`) |
| `363c61` | blu notte profondo | k-means; cielo, mediana `353b5f` |
| `495375` | blu notte chiaro | k-means; cielo, 90° percentile `424e74` |
| `6f7ea6` | blu lunare | a mano: un gradino più chiaro di `495375`, per stelle e bordi illuminati |
| `525a6e` | blu-grigio della nebbia | a mano, tra il grigio della strada (`3b3c45`) e il blu lunare |
| `ddba63` | oro della luce a gas | lampioni, 99° percentile |
| `f8ce65` | oro acceso | lampioni, 99,7° percentile; anche le sovrane |
| `f6e2a8` | crema dell'alone | nucleo del lampione, mediana `f1d39b` |

Effetto sugli asset già approvati: `uv run palette_check.py --old-count 32` riquantizza le varianti scelte in
`output/palette_check/` e stampa la quota di pixel che cambia colore e l'errore medio rispetto ai colori
originali (sempre sceso). Riesportati: `loc_by_street` 0,1% di pixel cambiati, `utterson` 1,2% e `enfield`
1,5% (con `animate.py`), `utterson_neutral` 5,1%, `obj_door_key` 0%, illustrazioni di giorno 0,4-15%. Lasciati
con la palette di giorno (`palette_size: 32` in `data/assets.yaml`, esportato invariato): `enfield_neutral`
(8,5%, il volto diventava giallastro con il crema nuovo) e `ill_c1_handshake` (7,2%, il guanto grigio chiaro
diventava blu).

**Tempi misurati il 2026-10-16** (RTX 4070 SUPER, 30 passi): 896×1152 da rumore 10-14 s per immagine;
con bozzetto (img2img, strength 0.6-0.75) 7-9 s; sfondo notturno 1344×768 a strength 0.5 circa 6-7 s;
caricamento della pipeline 8-17 s per comando; `postprocess.py` circa 0,1 s per immagine. Alcune immagini
hanno preso 45-55 s mentre la GPU era occupata anche da un altro processo (11,5 GB di VRAM su 12 in uso).
Le 12 illustrazioni del capitolo 1 più lo sfondo notturno: 120 immagini in 5 giri, circa 27 minuti di GPU.
Rifacimento con la palette notturna (sfondo notturno e tre illustrazioni, 8 varianti ciascuna, 2 giri):
56 immagini in circa 6 minuti (206 s + 132 s), 5-6 s per immagine a strength 0.45-0.6.

**Limiti visti.**
- Notte: anche con la palette notturna le facciate al buio diventano quasi nere e perdono dettaglio;
  a strength 0.5 SDXL ha aggiunto una finestra sul frontone cieco, a 0.45 no ma l'immagine è più scura.
- Mani e oggetti piccoli: senza bozzetto SDXL non disegna una mano che gira la chiave né conta dieci monete;
  con il bozzetto sì, ma a strength 0.6 la mano scompare (8 varianti su 8): serve 0.45.
- Carta: sul foglio piatto la grana del bozzetto diventa a strength 0.6 una trama che sembra scrittura;
  con noise 4 e strength 0.5 il foglio resta liscio.
- I negativi non bastano a togliere barbe, porte o persone in 1 caso su 2-4: si sceglie la variante.
- Senza bozzetto SDXL non mette mai due figure in un punto preciso né colori diversi a due cappotti.
