# Stato del lavoro

Aggiornato: 2026-10-15. Chi lavora qui aggiorna questo file a fine sessione (vedi `AGENTS.md`).

## Fatto

- **Libro**: testo Gutenberg #43 in `book/source/`, diviso in 10 capitoli in `book/chapters/`.
- **Storia estratta**: 10 schede in `story/chapters/` (scene, battute inglese + italiano, oggetti, fatti,
  profili). `npm run check:story` verifica che tutte le 395 battute inglesi siano nel testo originale: 0 problemi.
- **Documenti**: `docs/ARCHITETTURA.md`, `docs/DESIGN.md`, `docs/DECISIONI.md` (D1-D14), `AGENTS.md`.
- **Spike LLM**: `docs/spikes/2026-10-15-llm-embedded.md`. Qwen 3.5 4B gira dentro l'app (node-llama-cpp).
- **Motore** (TypeScript; si avvia fino al menu senza errori, non ancora provato a mano):
  - `src/shared/`: schemi dei contenuti (Zod), loader con controllo dei riferimenti, contratto IPC;
  - `src/game/`: stato, condizioni ed effetti, obiettivi e capitoli, director NPC;
  - `src/main/`: finestra Electron, storico partite su disco, servizio LLM (embedded + Ollama);
  - `src/renderer/`: stanza Phaser (camminata, hotspot, uscite, NPC, segnaposto se mancano gli asset),
    dialoghi scritti, narrazione, chat NPC con fase/tempo/Stop, diario (tasto J), menu, storico partite.
- **Bible**: `story/bible.md` — 31 personaggi, 35 luoghi, 54 oggetti con ID unici, glossario, cronologia,
  questioni aperte. Gli ID nelle schede sono già stati uniformati.
- **Capitolo 1 giocabile** (`content/`): capitolo, scena `loc_by_street`, dialoghi `d01_door_story` e
  `d01_enfield` (battute del libro, scelte solo nell'ordine del libro), NPC `enfield`, 16 fatti.
  Protezioni NPC: `reveal_when` sui fatti (ordine del libro anche in chat), `banned_words` per capitolo
  (il modello conosce il romanzo e potrebbe anticipare, es. "Jekyll" nel cap. 1).
- **Test**: `npm test`, 17 test: regole, director, e un giro completo del capitolo 1 sui contenuti veri
  (`tests/content-playthrough.test.ts`, da estendere a ogni capitolo).
- In sviluppo la console del renderer arriva nel terminale di `npm run dev` (righe `[renderer:...]`).

## In corso

- `tools/assets/`: pipeline SDXL + Pixel Art XL, prima prova su stradina, Utterson, chiave.

## Prossimi passi

1. Prova manuale di Fabio sul capitolo 1 (sotto) e correzioni.
2. Asset del capitolo 1 approvati da Fabio → `palette.hex` definitiva; ritarare le coordinate degli hotspot
   di `content/scenes/loc_by_street.yaml` sullo sfondo vero.
3. Capitolo 2 (`docs/DESIGN.md` §3), poi 3-8, poi i flashback 9-10. Un capitolo per volta, ognuno con il suo
   giro in `tests/content-playthrough.test.ts`.
4. Pacchetto desktop (electron-builder, modello in `resources/models/`, binari CPU + Vulkan).

## Da provare a mano (Fabio)

Capitolo 1. Senza asset lo sfondo è un riquadro grigio con il nome del file e i personaggi sono sagome.
1. `npm run dev` → *Nuova partita*. Quattro cartoline narrate (clic o Spazio).
2. Nella stradina: clic sul pavimento per camminare; passando sugli oggetti compare il nome in basso.
   Botteghe (sinistra), edificio (centro in alto), porta (centro), cortile (destra).
3. Clic sulla porta → *Osserva*: parte il racconto di Enfield.
4. Clic su Enfield → *Parla*: le domande compaiono una alla volta nell'ordine del libro, fino al patto.
5. Clic su Enfield → *Conversa*: chat libera. La prima risposta può richiedere 5-10 s (caricamento del
   modello); poi 1-2 s. Provare: domande sulla storia, una domanda fuori tema, chiedere chi ha firmato l'assegno.
6. Tasto J: diario con obiettivo, *Un suggerimento*, fatti scoperti.
7. Dopo il patto: "Fine" → menu → *Storico partite*: la partita con fatti, scelte e conversazioni.

Da riportare: testi troppo piccoli o lenti, punti cliccabili sbagliati, risposte di Enfield fuori personaggio
(copiare il testo), errori a schermo o nel terminale.

## Problemi aperti

- La camminata va in linea retta dentro il poligono calpestabile, senza pathfinding: basta per stanze semplici;
  per stanze a forma di L servirà un grafo di punti.
- I suggerimenti spontanei degli NPC scattano dopo 4 minuti sullo stesso obiettivo o 3 tentativi falliti
  (`src/game/npc/director.ts`): valori da tarare con le prove.

## Prompt per riprendere con un'altra IA

Da incollare in una nuova sessione aperta nella cartella del progetto:

```
Stai continuando il progetto in questa cartella: un'avventura grafica in pixel art, app desktop in italiano,
che racconta fedelmente "The Strange Case of Dr Jekyll and Mr Hyde". Leggi AGENTS.md e segui l'ordine di
lettura che indica (docs/STATO.md per primo). Poi riprendi dal primo punto di "Prossimi passi" in
docs/STATO.md. Prima di modificare codice esegui npm install, npm run validate, npm run check:story e npm test
e verifica che passino. Rispetta le regole di AGENTS.md (fedeltà al libro, una casa per ogni fatto, il motore
non conosce la storia). A fine sessione aggiorna docs/STATO.md e, se prendi decisioni, docs/DECISIONI.md.
Se serve una prova manuale chiedila a Fabio con passi numerati.
```
