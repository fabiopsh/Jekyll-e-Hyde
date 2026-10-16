# Stato del lavoro

Aggiornato: 2026-10-16. Chi lavora qui aggiorna questo file a fine sessione (vedi `AGENTS.md`).

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

- **Capitolo 2 giocabile (2026-10-16, D26-D27)**: studio di Utterson (testamento nella cassaforte), sala da
  pranzo di Lanyon, notte insonne narrata con illustrazioni, guardia alla porta a ore diverse, la stradina di
  notte con Hyde che arriva quando Utterson si nasconde nel cortile, la piazza, l'atrio di Jekyll con Poole, il
  ritorno a casa con i pensieri di Utterson. 52 battute del libro, identiche alle traduzioni della scheda; 23
  fatti F02; chat libera con Lanyon e Poole. Motore: pensieri (`thought`), NPC e hotspot che compaiono e
  scompaiono dentro la stanza, suoni di fuoco e orologio, notifiche tolte alla pagina di fine capitolo.
  `npm run validate` ora controlla spazi e punteggiatura di ogni testo. Giro completo in
  `tests/content-playthrough.test.ts`; scenario `npm run shot -- c2` (gioca il cap. 1 e poi tutto il 2).
  Musica: `mus_utterson_study`, `mus_lanyon`, `mus_night_watch`, `mus_jekyll_hall` (MusicGen, non ascoltate).

## In corso

- Asset del capitolo 2 (4 sfondi, Lanyon, Poole, Hyde con ritratti, 12 illustrazioni): esportata una variante
  per ciascuno, scelta dall'agente senza revisione; da guardare da Fabio sui fogli in
  `tools/assets/output/sheets/` (riassunto `c2_summary.png`). Per cambiare variante: `data/selections.yaml`,
  poi `uv run export.py`.
  Cassaforte e porta dello studio, porte dell'atrio ridipinte (inpainting) perché coincidano con i punti
  cliccabili. Dubbi dell'agente: in `ill_c2_bedside` la figura accanto al letto potrebbe mostrare dei
  lineamenti (deve restare un'ombra senza volto); `ill_c2_safe` potrebbe non sembrare una cassaforte;
  `ill_c2_lanyon` mostra Lanyon seduto, non mentre balza in piedi; Lanyon poco rosso in viso; nella piazza il
  passaggio a sinistra verso la stradina è scuro.

- Dopo il primo giro di Fabio (2026-10-16, D28): stradina di notte e piazza = sfondo di giorno + filtro di luce
  (`lighting`); il titolo usa lo sfondo di giorno scurito; i quattro ambienti rifatti in scala (porta ~85 px,
  Utterson 75-85 px), luce neutra e meno rumore (`despeckle`); corretto il bug delle Cronache nel menu (la
  copertina restava sopra). Ambienti e filtro notturno approvati da Fabio sugli screenshot. Dettagli minori: nello studio la
  cassaforte ha bordi verdi; nell'atrio i mobili di quercia sembrano una finestra; nella piazza la lunetta è
  debole.

- Secondo giro di Fabio (2026-10-16, D29): *Parla* vicino all'NPC non fa più camminare nessuno; la stessa
  illustrazione in due narrazioni di fila resta ferma; interni = stanza vuota + 26 oggetti separati
  (`assets/props/`, tipo `prop`), zone calpestabili che si fermano davanti a mobili e fuoco; piazza tornata alla
  prima versione (ricostruita con lo stesso seed, non identica al byte). Da confermare da Fabio sugli screenshot.

- Taccuino e HUD (2026-10-16, D30): taccuino solo appunti, a righe, impaginato per spazio, foglio che gira;
  lampadina dei suggerimenti in alto a sinistra (clic: obiettivo, *Rifletti*, tasche); piccolo taccuino in alto
  a destra con penna che scrive e leggero scuotimento finché ci sono appunti non letti; niente notifiche per gli appunti. Scenario `npm run shot -- notebook`. Corretto anche Enfield che
  girava intorno a Utterson quando si cliccava su di lui (scenario `talkstill`).

## Prossimi passi

1. Prova manuale di Fabio dei capitoli 1 e 2 (sotto) e revisione delle immagini del capitolo 2.
2. Correzioni dalla prova; se un sfondo cambia composizione, riallineare gli hotspot in `content/scenes/`.
3. Capitolo 3 (*Il dottor Jekyll era perfettamente tranquillo*), stesso procedimento del capitolo 2.

## Da provare a mano (Fabio)

Capitolo 1:
1. `npm run dev`. Nel menu: la stradina di notte dietro la copertina; aspetta 20-30 secondi: il lampione si
   abbassa e alla porta compare per un attimo un'ombra. *Impostazioni*: velocità e dimensione del testo.
2. *Comincia la lettura*: la copertina si apre, cartolina "Capitolo I", intro con illustrazioni a destra.
3. Nella stradina: Enfield ti segue; i piccioni si alzano quando ti avvicini; fumo dal camino; passi, vento,
   campane ogni tanto. Il cursore cambia: lente sugli oggetti, fumetto su Enfield.
4. Porta → *Osserva*: il racconto di Enfield con le illustrazioni che cambiano.
5. Quando si annota qualcosa la penna scrive sul taccuino in alto a destra, che poi si agita ogni tanto finché
   non lo apri. Tasto J o clic: solo appunti sulle righe; frecce: il foglio gira. In alto a sinistra la
   lampadina (accesa = c'è un suggerimento): clic, riquadro con cosa fare e *Rifletti*.
6. Enfield → *Parla* tre volte (firmatario, nome, chiave) → stretta di mano → pagina di fine capitolo →
   anticipazione → cartolina "Capitolo II".

Capitolo 2:
7. Studio: orologio e fuoco si sentono. La porta non si apre prima del testamento. Cassaforte → *Usa*: il
   testamento con le illustrazioni; Utterson parla ad alta voce. Porta → pensiero "Utterson, tra sé".
8. Da Lanyon: accoglienza narrata; *Parla*: prima l'amico Jekyll, poi Hyde. Prova anche *Conversa* (LLM).
9. Porta di Lanyon: la notte insonne (la figura non ha mai volto), poi la stradina di giorno senza Enfield.
10. Ingresso del cortile → *Usa*: scegli le ore (mattina, mezzogiorno, notte di nebbia), poi "Tornare ancora".
11. Di notte: ingresso del cortile → *Usa*: Hyde compare alla porta. *Parla*: l'incontro; poi Hyde sparisce.
12. Bordo destro → la piazza; porta con la lunetta → *Usa*: Poole apre, l'atrio. Fuoco → *Osserva*: Poole
    torna. *Parla* quattro volte; ritorno a casa con i pensieri; pagina di fine capitolo senza notifiche sopra.

Da riportare: testi con spazi o punteggiatura sbagliati, illustrazioni che non corrispondono al testo, punti
cliccabili che non coincidono con il disegno (porte, cassaforte, fuoco), animazioni fastidiose o lente.

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
