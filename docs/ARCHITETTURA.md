# Architettura

Avventura grafica punta-e-clicca in pixel art che racconta *The Strange Case of Dr Jekyll and Mr Hyde*.
App desktop, in italiano. Gli NPC parlano con un LLM locale, dentro regole che il gioco controlla.

Le ragioni di ogni scelta stanno in `docs/DECISIONI.md`. Questo file dice **com'è fatto** il progetto.

## 1. Principi

1. **Il motore non sa niente della storia.** Scene, dialoghi, oggetti, NPC e capitoli sono file YAML in
   `content/`. Il codice li carica, li valida e li esegue. Aggiungere una scena = scrivere un file, non codice.
2. **La storia avanza solo per regole deterministiche.** Flag, oggetti e fatti cambiano solo tramite *effetti*
   dichiarati nei contenuti. L'LLM non può far avanzare la trama da solo: può solo scegliere tra azioni che
   il gioco gli permette in quel momento (vedi §5).
3. **Si finisce il gioco senza scrivere niente.** Ogni passo obbligato ha un dialogo scritto, preso dal libro.
   La chat libera con gli NPC aggiunge profondità e suggerimenti, non è mai l'unica strada.
4. **Ogni parte si prova da sola.** La logica (stato, condizioni, effetti, director NPC) è TypeScript puro,
   senza Phaser né Electron, con test `vitest`.
5. **Poche dipendenze.** Phaser per il mondo, DOM semplice per l'interfaccia, niente framework UI.

## 2. Stack

| Parte | Scelta |
|---|---|
| App desktop | Electron (processo *main* = Node, processo *renderer* = pagina web) |
| Build | electron-vite (un solo `npm run dev` per main, preload e renderer) |
| Linguaggio | TypeScript, `strict` |
| Mondo di gioco | Phaser 3.90 (scene, sprite, animazioni, tween, input) |
| Interfaccia | HTML/CSS sopra il canvas (dialoghi, chat, diario, menu, storico) |
| Contenuti | YAML + schemi Zod, validati da `npm run validate` |
| LLM NPC | embedded nel processo main (node-llama-cpp, modello GGUF piccolo) — Ollama come ripiego |
| Salvataggi e storico | file JSON / JSONL nella cartella utente di Electron |
| Asset | pipeline Python separata in `tools/assets/` (SDXL + LoRA Pixel Art XL, locale su GPU) |
| Test | vitest (logica), prove manuali di Fabio (gioco) |

## 3. Cartelle

```
book/                 testo originale (fonte unica) e capitoli ritagliati
story/                cosa succede nel libro: schede capitolo, bible personaggi/luoghi (vedi story/README.md)
content/              contenuti di gioco, YAML
  chapters/           un file per capitolo: personaggio giocato, scena iniziale, obiettivi, suggerimenti
  scenes/             un file per scena: sfondo, area calpestabile, hotspot, uscite, NPC presenti
  dialogues/          dialoghi scritti (dal libro): nodi, battute, scelte, condizioni, effetti
  characters.yaml     ogni personaggio: nome a schermo, sprite, ritratto, timbro del blip (anche giocatore e narratore)
  npcs/               scheda di ogni NPC per l'LLM: persona, voce, conoscenze per capitolo, battute canoniche
  items.yaml          oggetti dell'inventario
  facts.yaml          fatti della storia (ID FNN.k di story/), chi li conosce e da quando
  game.yaml           impostazioni del gioco che sono contenuto (musica del menu)
src/
  main/               processo Electron main: finestra, salvataggi, LLM
    llm/              provider (embedded, ollama), coda richieste
    saves/            partite, salvataggi, log
  preload/            ponte sicuro main ↔ renderer (IPC tipizzato)
  shared/             tipi e schemi usati da tutti (Zod), contratto IPC
  game/               logica pura, senza Phaser: stato, condizioni, effetti, obiettivi, director NPC
  renderer/
    phaser/           scene Phaser: caricamento, stanza, personaggi, camminata, hotspot
    ui/               overlay DOM: dialogo, chat NPC, diario, inventario, menu, storico partite
assets/               PNG finali usati dal gioco (versionati) + manifest JSON
tools/assets/         pipeline di generazione (Python, uv) — output grezzi non versionati
docs/                 architettura, design, decisioni, stato lavori, spike
```

## 4. Modello dei contenuti

### Stato di gioco (`src/game/state.ts`)
```
GameState = { chapter, scene, player, flags: Set, inventory: Set, facts: Set,
              objectives: {id: done}, journal: [...], playtimeMs, hintsUsed }
```
Unico oggetto serializzato nel salvataggio.

### Condizioni ed effetti (mini-linguaggio dei contenuti)
- Condizioni: `{flag: x}`, `{has: obj_x}`, `{knows: F02.3}`, `{chapter: 3}`, `{not: …}`, `{all: […]}`, `{any: […]}`.
- Effetti: `{set: flag}`, `{unset: flag}`, `{give: obj}`, `{take: obj}`, `{learn: F02.3}`, `{goto: scena}`,
  `{dialogue: id}`, `{narrate: testo}`, `{journal: testo}`, `{complete: obiettivo}`, `{chapter: N}`.
- Un solo interprete (`src/game/rules.ts`) per entrambi. Il validatore controlla che ogni riferimento esista.

### Scena (`content/scenes/*.yaml`)
Sfondo, eventuali livelli in primo piano, poligono calpestabile, punti di ingresso, hotspot (forma, nome,
verbi *guarda/usa/parla/prendi* → effetti), uscite (verso scena, condizione), NPC presenti (posizione, condizione).
NPC e hotspot con `when` seguono lo stato mentre si è nella stanza: dopo ogni gruppo di effetti la stanza li
mostra o li nasconde (`RoomScene.refresh()`), così qualcuno può arrivare o andarsene senza cambiare scena.

### Dialogo scritto (`content/dialogues/*.yaml`)
Nodi con battute (`speaker`, `it`, `src: D02.3.4` = riferimento alla battuta del libro), scelte del giocatore
(testo, condizione, effetti, nodo successivo). Le battute del libro si usano così come sono state tradotte in
`story/chapters/`; `src` permette di controllare la fedeltà. `thought: true` segna un pensiero ("he thought"):
si mostra in corsivo con il nome "Utterson, tra sé", mai come battuta detta a un altro personaggio.
`npm run validate` controlla spazi e punteggiatura di ogni testo mostrato (`src/shared/typography.ts`):
doppi spazi, spazi prima della punteggiatura o mancanti dopo, `...` al posto di `…`, « » non appaiati.

### Capitolo (`content/chapters/*.yaml`)
Personaggio giocato (Utterson; Lanyon e Jekyll/Hyde nei flashback), scena iniziale, obiettivi in ordine con
condizione di completamento, per ogni obiettivo tre suggerimenti scritti a mano (vago → preciso).

## 5. NPC con LLM

Flusso di una battuta libera del giocatore:

```
renderer (chat)  →  IPC npc:say  →  main: NpcDirector  →  LlmProvider  →  JSON  →  validazione  →  effetti
```

**NpcDirector** (`src/game/npc/`, logica pura, testabile con un provider finto):

1. Costruisce il prompt da: scheda NPC (persona, voce, battute canoniche come esempi), capitolo e scena
   attuali, fatti che l'NPC **conosce in questo momento della storia**, fatti che il giocatore ha già,
   obiettivo corrente, riassunto della conversazione.
2. Costruisce **a ogni turno** uno schema JSON di risposta con enum ricavati dallo stato:
   ```
   { say: string (max ~300 caratteri),
     emotion: "neutral" | "worried" | ... ,
     action: "none" | "reveal_fact" | "give_hint" | "end_conversation" | "deflect",
     fact: <solo gli ID rivelabili ora> | null }
   ```
   La generazione è vincolata dalla grammatica: il modello **non può** produrre un fatto non permesso.
3. Valida la risposta (Zod) e la applica: `reveal_fact` → effetto `learn`; `give_hint` → il gioco mostra il
   suggerimento **scritto a mano** dell'obiettivo corrente (il livello sale a ogni richiesta), l'NPC lo
   introduce con parole sue; `end_conversation` chiude la chat.
4. Guardie fuori dal modello: limite di turni per conversazione, lunghezza massima, filtro di anacronismi
   (lista di parole), risposta di riserva scritta a mano se il JSON non è valido o il modello non risponde.

**Quando un suggerimento è permesso**: se il giocatore lo chiede, oppure se è fermo sullo stesso obiettivo da
più di N minuti o ha fallito più tentativi (contatori nello stato). Altrimenti `give_hint` non è nell'enum.

**LlmProvider** (`src/main/llm/`): interfaccia unica `generate({system, messages, schema, maxTokens})`.
Implementazioni: `embedded` (node-llama-cpp nel processo main) e `ollama` (HTTP). Scelta da file di config.
Le richieste passano da una coda: una per volta, annullabili. Il modello si carica all'avvio in background;
finché non è pronto la chat libera mostra lo stato di caricamento e i dialoghi scritti restano disponibili.

## 6. Salvataggi e storico partite

Cartella utente Electron (`app.getPath('userData')/runs/`):
```
runs/<runId>/meta.json     id, data inizio/fine, capitolo raggiunto, tempo di gioco, finale, versione gioco
runs/<runId>/save.json     ultimo GameState (salvataggio automatico a ogni cambio scena e a richiesta)
runs/<runId>/log.jsonl     eventi in ordine: scena, dialogo, scelta, fatto, oggetto, suggerimento, chat NPC
```
- "Partita" = una run dall'inizio alla fine. Lo **storico** elenca tutte le run (anche concluse) con data,
  durata, capitolo, suggerimenti usati, e permette di rileggere diario e conversazioni dal log.
- Il renderer non tocca il disco: passa dal main via IPC (`runs:list`, `runs:new`, `runs:save`, `runs:log`, ...).

## 7. Grafica e animazioni

- Risoluzione interna **480×270** (16:9), scalata a numeri interi (×2, ×3, ×4) con pixel netti.
- Testo nell'overlay DOM con font pixel leggibile a dimensione piena (mai testo minuscolo nel canvas).
- Personaggi in scena alti circa 64 px; ritratti per i dialoghi ~128×160; oggetti 32×32.
- Formato animazioni: spritesheet PNG + JSON (formato atlas Phaser, compatibile con l'export di Aseprite).
  Animazioni minime per personaggio: `idle`, `walk` (lato), `talk`. Un fotogramma disegnato a mano può
  sostituire uno generato senza toccare codice.
- Movimento: punta-e-clicca con percorso dentro il poligono calpestabile; scala del personaggio in base a y.

- Illustrazioni (D20): riquadro a destra, 160×200 mostrato a multipli interi, con comparsa a macchia
  d'inchiostro (`src/renderer/ui/illustration.ts`). Nei contenuti: `image` su una battuta (resta fino alla
  prossima immagine o alla fine del dialogo), su un effetto `narrate` o su una cartolina di `intro`/`ending`.
- Ambiente (campo `ambience` della scena): fumo dai camini, uccelli che volano via quando ci si avvicina, suoni
  (`src/renderer/phaser/ambience.ts`). Un NPC con `follow: true` accompagna il giocatore.
- Interfaccia: menu con scena del titolo animata (`content/game.yaml`, `menu_scene`) e copertina che si apre,
  cartolina di capitolo, pagina di fine capitolo con anticipazione (`ending` del capitolo), taccuino a due pagine
  (tasto J), cursore con l'icona dell'azione (`src/renderer/cursors.ts`), impostazioni di lettura
  (`src/renderer/settings.ts`: velocità e dimensione del testo, schermo intero).
- Percorsi degli asset sempre relativi (`assetUrl()` in `src/renderer/assets.ts`): l'app costruita si apre da disco.

Pipeline asset: vedi `tools/assets/README.md`.

## 7b. Audio

Il gioco **non ha voci** (D19): i personaggi parlano con il testo.
- Musica: generata con `tools/audio/` (MusicGen), MP3 in `assets/audio/music/`. Ogni scena e ogni dialogo
  dichiara la sua traccia nel campo `music`; il menu in `content/game.yaml`. Dissolvenze in `src/renderer/audio.ts`.
- Blip: mentre il testo appare lettera per lettera, ogni 2 caratteri un breve suono con il timbro del personaggio
  (`blip` in `content/characters.yaml`: frequenza, forma d'onda, filtro; `typewriter` per il narratore).
- Ambiente della scena (`ambience.sounds`): vento, campane, passi, fuoco del camino, orologio a pendolo.
- Effetti: clic su pulsanti, scelte e hotspot. Volumi di musica ed effetti nel menu di pausa (ESC).

## 8. Comandi

```
npm run dev        avvia il gioco in sviluppo
npm run validate   valida tutti i contenuti (schemi + riferimenti)
npm test           test della logica
npm run shot       app costruita guidata da Playwright: screenshot in out/shots/<scenario>/ (c1, c1full)
npm run build      pacchetto desktop
```
