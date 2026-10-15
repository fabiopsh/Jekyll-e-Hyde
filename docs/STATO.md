# Stato del lavoro

Aggiornato: 2026-10-15. Chi lavora qui aggiorna questo file a fine sessione (vedi `AGENTS.md`).

## Fatto

- **Libro**: testo Gutenberg #43 in `book/source/`, diviso in 10 capitoli in `book/chapters/`.
- **Storia estratta**: 10 schede in `story/chapters/` (scene, battute inglese + italiano, oggetti, fatti,
  profili). `npm run check:story` verifica che tutte le 395 battute inglesi siano nel testo originale: 0 problemi.
- **Documenti**: `docs/ARCHITETTURA.md`, `docs/DESIGN.md`, `docs/DECISIONI.md` (D1-D19), `AGENTS.md`.
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
- **Bug fix finestre d'azione**: corretto il ciclo di vita del menu contestuale (`src/renderer/ui/room-ui.ts`,
  `RoomScene.ts`, `presenter.ts`). Ora la finestra si chiude correttamente su clic opzione, clic fuori, tasto Esc,
  apertura diario o cambio scena. Non è più possibile aprire finestre multiple sovrapposte.
- **UI & UX Vittoriana + Typewriter effect**:
  - Selezione del testo disabilitata su tutta la UI (`user-select: none` in `style.css`), preservando gli input di testo.
  - Schermata del menu principale ridisegnata come frontespizio di un libro d'epoca vittoriano: doppio bordo con angolari, titolazione dorata con sfumatura metallica, fregi tipografici e citazione d'apertura del romanzo (`src/renderer/ui/screens.ts`).
  - Implementato effetto macchina da scrivere/streaming progressivo per narrazione, dialoghi canonici e risposte chat LLM (`typeText` in `dom.ts`, `story-panels.ts`, `chat.ts`).
  - Salto istantaneo: un clic/Spazio mostra immediatamente l'intera frase, il secondo avanza.
  - Cursore lampeggiante dorato, freccia di avanzamento pulsante `▸`, scrollbar in ottone antico e bordi dorati in `style.css`.
- **Pipeline musicale in locale (Meta MusicGen)**:
  - Implementato `tools/audio/generate_music.py` con modello `facebook/musicgen-small` su GPU (CUDA FP16).
  - Algoritmo di looping seamless: crossfade a pari potenza di 2 secondi per eliminare stacchi e click nei loop.
  - Generazione ed esportazione di 3 colonne sonore in MP3/WAV a 32 kHz (`assets/audio/music/`) con `assets/audio/manifest.json`:
    - `mus_menu_theme`: tema principale del menu (violoncello malinconico e pianoforte vittoriano da salotto).
    - `mus_by_street`: atmosfera della stradina di domenica (archi gentili, pizzicato, quiete con mistero).
    - `mus_sinister_story`: tema cupo per la storia della porta (violoncello grave, tremolo d'archi e carillon sinistro).
  - Gestore audio disaccoppiato `src/renderer/audio.ts`: transizioni fluide in dissolvenza (crossfade), sblocco autoplay su primo clic, arresto a fine partita e cambio musica automatico nei dialoghi drammatici (es. `d01_door_story` attiva `mus_sinister_story` e ripristina la musica della scena all'uscita).
- **Audio senza voci** (D19): blip di testo per personaggio, ticchettio per il narratore, clic, volumi nel
  menu di pausa.
- **Puntatore vittoriano a tema in pixel art**:
  - `assets/ui/cursor_default.png`: guanto vittoriano in pelle avorio con polsino in ottone dorato, gemma e bordo scuro ad alto contrasto.
  - `assets/ui/cursor_pointer.png`: guanto d'oro radioso con aura ambrata attivo sull'hover di hotspot, uscite, pulsanti, scelte e link.
  - Integrato in tutto il CSS (`style.css`) e direttamente sul canvas Phaser (`RoomScene.ts`).
- **Menu di Pausa su tasto `ESC`**:
  - Accessibile premendo `ESC` durante l'esplorazione.
  - Pannello vittoriano con capitolo, luogo corrente, regolazione volume Musica ed Effetti sonori con slider dedicati, Riprendi (ESC), Diario (J), Torna al Menu Principale ed Esci dal gioco (`app:quit`).
- **Effetti sonori tattili sui click (`playClickSound`)**:
  - Sintetizzatore Web Audio di micro-transienti meccanici in ottone/legno d'epoca agganciato a livello globale su pulsanti HTML, opzioni di dialogo e hotspot/uscite della scena.
- **Risolto bug menu esamina porta**:
  - Cliccando sul pulsante "Osserva" della porta, il menu non si sposta più: bloccata la propagazione degli eventi pointerdown/mousedown/mouseup/click al canvas Phaser e introdotta la guardia `isVerbMenuOpen()`.

- **Pulizia del 2026-10-15 sera**: tolta ogni traccia delle voci sintetiche (script, file di prova, dipendenze,
  README, voci del registro decisioni rinumerato D17-D19). Nuovo `content/characters.yaml`: nome, sprite,
  ritratto e blip di ogni personaggio, giocatore e narratore compresi; il codice non contiene più nomi di
  personaggi né brani musicali (`content/game.yaml` per la musica del menu).
- **Ritratti rifatti**: con fondale e senza scontorno (lo scontorno aveva mangiato una spalla di Enfield),
  inquadrati dal cappello alle spalle. Nuovi `assets/portraits/utterson_neutral.png` (variante 1) ed
  `enfield_neutral.png` (variante 3); le altre varianti in `tools/assets/output/sheets/`.

- **Capitolo 1 rifinito (2026-10-16, D20-D22)**:
  - riquadro delle illustrazioni a destra durante intro, racconto di Enfield, domande, descrizioni;
  - Enfield accompagna Utterson; pagina di fine capitolo con il taccuino e anticipazione del capitolo 2;
  - titolo animato (stradina di notte, nebbia, lampione, ombra alla porta) e copertina che si apre;
    cartolina di capitolo; citazione di copertina dal cap. 1 (quella del cap. 10 anticipava il segreto);
  - taccuino a due pagine con appunti che si scrivono; ritratti che respirano; cursore con l'azione;
    impostazioni di lettura; fumo dal camino, piccioni, vento, campane, passi;
  - `npm run shot` (Playwright): ha trovato tre bug ora corretti: immagini non caricate nell'app costruita
    (percorsi assoluti), riquadro invisibile che bloccava i clic a destra, notifiche sovrapposte.

## In corso

- Nulla in esecuzione. Palette notturna (D25) applicata; rifatti sfondo notturno, assegno, chiave, porta da vicino;
  lampioni, angolo e folla riquantizzati. Scelte dell'agente da confermare sul foglio
  `tools/assets/output/sheets/c1_illustrations.png`. Limiti noti: l'assegno sembra un foglio bianco, nella
  chiave la porta è sfocata, nello sfondo notturno le facciate sono molto scure.

## Prossimi passi

1. Prova manuale di Fabio del capitolo 1 (sotto).
2. Correzioni dalla prova; poi capitolo 2 (*Ricerca di Mr. Hyde*), con il suo giro in
   `tests/content-playthrough.test.ts` e uno scenario in `scripts/shot.ts`.

## Da provare a mano (Fabio)

1. `npm run dev`. Nel menu: la stradina di notte dietro la copertina; aspetta 20-30 secondi: il lampione si
   abbassa e alla porta compare per un attimo un'ombra. *Impostazioni*: velocità e dimensione del testo.
2. *Comincia la lettura*: la copertina si apre, cartolina "Capitolo I", intro con illustrazioni a destra.
3. Nella stradina: Enfield ti segue; i piccioni si alzano quando ti avvicini; fumo dal camino; passi, vento,
   campane ogni tanto. Il cursore cambia: lente sugli oggetti, fumetto su Enfield.
4. Porta → *Osserva*: il racconto di Enfield con le illustrazioni che cambiano.
5. Tasto J: il taccuino; gli appunti nuovi si scrivono uno dopo l'altro.
6. Enfield → *Parla* tre volte (firmatario, nome, chiave) → stretta di mano → pagina di fine capitolo →
   anticipazione del capitolo 2 → ritorno al menu con il segnalibro *Riprendi*.
7. ESC: menu di pausa con volumi e impostazioni.

Da riportare: testi poco leggibili, illustrazioni che non corrispondono al testo, animazioni fastidiose o lente,
punti cliccabili sbagliati.

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
