# Decisioni

Registro in ordine di data. Una decisione si cambia aggiungendo una voce nuova che la sostituisce, non
riscrivendo quella vecchia. Accanto a ogni voce: chi ha deciso (Fabio / proposta dell'agente accettata).

## 2026-10-15

**D1 — Fonte del testo: Project Gutenberg #43, file `.txt`.** (agente)
Gutenberg non offre un PDF del libro (il link `.pdf` restituisce una pagina HTML). Il `.txt` ufficiale è il
testo inglese completo, più facile da analizzare. Salvato in `book/source/pg43.txt`, mai modificato.

**D2 — Lingua del gioco: italiano.** (Fabio)
Traduzione fatta nel progetto dall'originale inglese; ogni battuta conserva l'inglese accanto per controllo.

**D3 — Protagonista: Utterson nei capitoli 1-8, flashback giocabili per i capitoli 9-10.** (Fabio)
Capitolo 9 giocato come Lanyon, capitolo 10 come Jekyll (e Hyde dopo la trasformazione).

**D4 — App desktop.** (Fabio) Electron: un solo linguaggio (TypeScript) per gioco, salvataggi e LLM.

**D5 — LLM degli NPC embedded nell'app, modello piccolo (Qwen 3.5 4B se possibile), Ollama come ripiego.** (Fabio)
Da verificare con lo spike `docs/spikes/2026-10-15-llm-embedded.md`. L'interfaccia `LlmProvider` permette
di passare dall'uno all'altro senza toccare il resto.

**D6 — Phaser 3.90 invece di Phaser 4.** (agente)
Phaser 4 è stabile dall'aprile 2026, ma Phaser 3 ha molta più documentazione ed esempi: gli agenti di
programmazione lo conoscono meglio e sbagliano meno. Un'avventura grafica non usa nulla che manchi in v3.
L'API delle scene è quasi uguale: passare a v4 più avanti resta possibile.

**D7 — Interfaccia in HTML/CSS sopra il canvas, senza framework.** (agente)
Testo nitido a qualsiasi scala, campo di testo vero per la chat con gli NPC, accessibilità. Le schermate sono
poche (dialogo, chat, diario, inventario, menu, storico): un framework non ripaga il peso.

**D8 — Contenuti in YAML validati con Zod.** (agente)
YAML è leggibile per i lunghi testi italiani; Zod dà errori chiari e i tipi TypeScript dagli stessi schemi.
Un validatore controlla anche i riferimenti incrociati (scene, flag, oggetti, fatti, battute del libro).

**D9 — L'LLM sceglie azioni solo da enum costruiti dallo stato, con decodifica vincolata a schema JSON.** (agente)
È la garanzia più forte contro "uscire fuori rotta" con un modello piccolo: non può rivelare un fatto non
ancora permesso né inventare effetti. I suggerimenti sono testi scritti a mano per ogni obiettivo; l'LLM decide
solo *quando* darli e li introduce con la voce del personaggio.

**D10 — Asset: SDXL + LoRA Pixel Art XL in locale, poi riduzione a griglia e palette.** (agente)
Stessi modelli già presenti nella cache Hugging Face e usati in `ASE-Tamer-Project/tools/monster-gen`.
Sfondi, ritratti, pose base dei personaggi e oggetti si generano; i fotogrammi di animazione si derivano dalla
posa base con uno script e si possono ritoccare a mano (formato spritesheet standard).

**D11 — LLM embedded confermato: node-llama-cpp 3.22.1 + Qwen 3.5 4B Q4_K_M.** (agente, da spike)
Misure in `docs/spikes/2026-10-15-llm-embedded.md`: ~1-1,4 s per risposta, JSON valido nel 100% delle prove
con la grammatica, ~3,4 GB di VRAM. Impostazioni obbligatorie: `getLlama({gpu:'auto', build:'never'})`,
`QwenChatWrapper({variation:'3.5', thoughts:'discourage'})`. In sviluppo si usa il file GGUF già scaricato da
Ollama; nel pacchetto il modello va in `resources/models/`. Ollama resta selezionabile con `llm.json`.
Da distribuire: binari CPU + Vulkan (CUDA richiede ~500 MB di DLL NVIDIA).

**D12 — Nel prompt dell'NPC solo i fatti rivelabili adesso.** (agente, da spike)
Nella prova del segreto il 4B lo ha rivelato 1 volta su 20 quando era nel prompt. Quindi il director mette nel
prompt solo i fatti già permessi; quelli futuri non arrivano mai al modello. Il campo `action` non sempre
corrisponde a ciò che l'NPC dice: i fatti indispensabili si ottengono comunque dai dialoghi scritti.

**D13 — Traduzione: "cabinet" → "studio"; Lei maiuscolo nelle battute.** (agente)
"Gabinetto" oggi è ambiguo. Il Lei di cortesia maiuscolo distingue il registro d'epoca. I padroni danno del tu
ai domestici. Dettagli nel glossario di `story/bible.md`.

**D14 — Battute interrotte da un inciso: si uniscono con `…`.** (agente)
Permette il controllo automatico `npm run check:story` (ogni `en:` deve stare nel testo originale).

**D15 — Pipeline asset: script `export.py` e fogli `contact_sheet.py`.** (agente)
Gli asset approvati in `data/selections.yaml` vengono copiati nella cartella radice `assets/`
(`backgrounds/`, `characters/` con spritesheet PNG + JSON atlas Phaser generato da `animate.py`,
`portraits/`, `items/`) e tracciati in `assets/manifest.json`. `contact_sheet.py` genera fogli
di confronto in `output/sheets/` con la variante scelta evidenziata.

**D16 — Effetto typewriter con salto immediato.** (Fabio)
I testi di narrazione, dialoghi canonici e risposte chat dell'LLM compaiono lettera per lettera con pause naturali
sulla punteggiatura e cursore lampeggiante. Il primo clic o Spazio completa istantaneamente la battuta; il secondo
avanza alla battuta successiva.

**D17 — Audio e Text-To-Speech in locale.** (Fabio)
Musica d'ambiente e colonne sonore generate in locale su GPU con Meta MusicGen (`tools/audio/`) con loop senza stacchi.
Doppiaggio personaggi in italiano: XTTSv2 / Kokoro-82M per voci coerenti da profili audio; pre-generazione dei file
dei dialoghi scritti in `assets/audio/` e sintesi in tempo reale per la chat libera.

**D18 — Generazione colonne sonore con Meta MusicGen in formato MP3/WAV con crossfade.** (Fabio / agente)
`tools/audio/generate_music.py` genera tracce musicali originali da prompt d'atmosfera in `data/tracks.yaml`. Applica un
crossfade a pari potenza (2s) per loop continuo. L'export in MP3/WAV a 32 kHz evita problemi con il formato OGG su Windows
e si integra con il gestore audio `src/renderer/audio.ts` (crossfade fluido, cambio traccia nei dialoghi e ripristino).

**D19 — Doppiaggio vocale italiano con Kokoro-82M sincronizzato con typewriter.** (Fabio / agente)
`tools/audio/generate_speech.py` genera in locale a ~75x tempo reale tutti i file audio doppiati del primo capitolo in
`assets/audio/speech/<dialogue_id>/`. I profili vocali differenziano Enfield (giovane e vivace, speed 1.05) da Utterson
(austero e misurato, speed 0.90) e dal narratore (speed 0.96). In gioco, `playVoice` avvia la voce sincronizzata con
la digitazione del testo e `stopVoice` la interrompe all'avanzamento manuale per evitare sovrapposizioni.

**D20 — Coerenza visiva dei personaggi tramite bozzetti di posa e derivazione procedurale.** (Fabio / agente)
Per mantenere l'aspetto invariato tra inquadrature, i personaggi usano bozzetti di posa e palette dedicati
(`data/layouts/pose_profile_<id>.png` con blocchi colore per giacca, cappello e pantaloni) usati da SDXL `img2img`.
Enfield ha un bozzetto a giacca chiara per contrastare nettamente con il pastrano scuro di Utterson. Tutte le animazioni
di camminata e respiro sono derivate direttamente dal singolo sprite approvato con `animate.py`, garantendo il 100%
di coerenza pixel-perfect.

**D21 — Regia teatrale ed enfasi emotiva per il TTS (Kokoro-82M con voice blending e DSP).** (Fabio / agente)
Le voci dei due gentiluomini risultavano indistinguibili e piatte con la sola variazione di velocità. La regia teatrale (`tools/audio/generate_speech.py`) risolve con tre interventi:
1. **Voice blending dei tensori di stile**: interpolazione dei vettori vocali di Kokoro (`0.55 * bm_george + 0.35 * am_onyx + 0.10 * im_nicola` per Utterson, austero avvocato di 55 anni; `0.70 * im_nicola + 0.30 * bm_fable` per Enfield, 30 anni brillante; `0.75 * bm_lewis + 0.25 * im_nicola` per il narratore) preservando la fonemizzazione italiana (`lang_code='i'`).
2. **Pitch shift e filtri DSP**: abbassamento di 1.8-2.6 semitoni ed equalizzazione sulle basse frequenze (240 Hz) per dare a Utterson un timbro profondo, maturo e roco; filtro di presenza sulle frequenze medie (2.2-4.8 kHz) per Enfield.
3. **Regia prosodica per battuta (`ACTING_DIRECTIONS`)**: ogni battuta di `d01_door_story` e `d01_enfield` è diretta individualmente con pause espressive (`...`), respiri, modulazioni dinamiche di velocità e pitch per riflettere l'emotività della scena (il raccapriccio per l'urto notturno, il tono gelido di Hyde, la gravità inquisitoria di Utterson).

**D22 — Voci neurali italiane native (Edge Neural), audio ducking e TTS live per la chat libera.** (Fabio / agente)
La prova manuale ha evidenziato accenti spuri (causati dal blending con voci inglesi di Kokoro), onomatopee lette come lettere ("tks" -> "ti-kappa-esse"), colonna sonora troppo alta durante il parlato e mancata sintesi vocale nella chat libera, oltre a un bug di stato infinito "riflette...".
Soluzioni adottate:
1. **Passaggio a voci neurali italiane native (Edge Neural)**:
   - Utterson: `it-IT-GiuseppeMultilingualNeural` (timbro grave e profondo, rate -6%, pitch -4Hz, avvocato maturo di 55 anni).
   - Enfield: `it-IT-DiegoNeural` (timbro brillante, giovane e vivace, rate +2%, pitch +1Hz, gentiluomo di 30 anni).
   - Narratore: `it-IT-IsabellaNeural` (voce letteraria e drammatica ottocentesca, chiaramente distinta da entrambi i personaggi).
   - Risultato: zero accento straniero, dizione e prosodia italiana naturale al 100%.
2. **Normalizzazione onomatopee**: stringhe come "Tsk, tsk!" o "tks" vengono convertite in espressioni naturali parlate ("Mmh... che brutta faccenda.") eliminando la sillabazione delle lettere.
3. **Audio Ducking dinamico (`src/renderer/audio.ts`)**: volume musica di base abbassato a 0.28; all'avvio della voce (`playVoice`), la musica sfuma a 0.06 (sottofondo leggero) e si ripristina dolcemente a 0.28 al termine della battuta (`ended`) o all'avanzamento (`stopVoice`).
4. **Chat libera NPC**:
   - Risolto bug "riflette...": stato cancellato immediatamente alla ricezione della risposta LLM; `streamText` visualizza il testo senza bloccare il modal su un clic supplementare.
   - **TTS live in tempo reale**: servizio IPC `CHANNELS.ttsSynthesize` gestito da `src/main/tts.ts` e `tools/audio/synthesize_live.py`. Quando Enfield risponde in chat, l'audio MP3 generato in streaming via base64 viene riprodotto istantaneamente mentre il testo scorre.

**D23 — Pacing conversazionale guidato dai dialoghi (`emotion`) e fix IPC per TTS live.** (Fabio / agente)
La prova manuale ha rivelato:
1) **Pacing innaturale**: un rallentamento forzato eccessivo (-19%) e pitch shift facevano trascinare le sillabe in modo artefatto.
   - Risoluzione: rimozione dei rallentamenti artificiali; le velocità base sono calibrate sulle cadenze umane naturali (Utterson a -2%, Enfield a +1%, Narratore a -1%, pitch 0Hz).
   - I file di dialogo YAML (`content/dialogues/d01_door_story.yaml`, `d01_enfield.yaml`) definiscono il tono conversazionale tramite il campo nativo `emotion` (`curious_question`, `confidential_mystery`, `visceral_horror`, `demonic_defiance`, `sharp_inquiry`, `vivid_metaphor`, `grave_revelation`, `warm_gentleman_pact`, ecc.).
   - Le battute sono state riscritte con cesure ritmiche e pause di respiro naturali, restituendo la dinamica vivace di un vero dialogo tra due gentiluomini in cammino.
2) **Blocco audio in tempo reale nella chat libera**:
   - La presenza di spazi nel percorso cartella (`"UNIPI - Magistrale"`) causava il fallimento di `spawn('uv', ..., { shell: true })` su Windows.
   - Risolto passando a percorso relativo per lo script e trasmettendo il payload di testo e voce come JSON su `child.stdin`. La sintesi live ora restituisce e riproduce l'audio MP3 istantaneamente (in ~1 secondo) a ogni risposta dell'NPC.

**D24 — Audio classico delle avventure grafiche (LucasArts / Pentiment), puntatore vittoriano in pixel art, menu di pausa (ESC), click SFX e fix menu porta.** (Fabio / agente)
Dopo i test con la sintesi vocale neurale (D21-D23), l'utente ha stabilito che le voci sintetiche non raggiungono la recitazione organica adatta a una narrazione letteraria e ha richiesto il passaggio completo al paradigma classico delle avventure grafiche (LucasArts, *Monkey Island*, *Pentiment*), eliminando tutto il codice TTS non necessario.
Interventi realizzati:
1. **Talk-blip procedurali per personaggio (`src/renderer/audio.ts`, `dom.ts`, `story-panels.ts`, `chat.ts`)**:
   - Generazione Web Audio API a latenza zero durante l'animazione typewriter del testo (ogni 2 caratteri).
   - Timbri sonori unici e caratterizzanti:
     - Utterson: baritono grave, profondo e caldo (~125 Hz a dente di sega filtrato passa-basso a 380 Hz).
     - Enfield: tenore brillante, vivace e giovanile (~260 Hz a triangolo filtrato passa-basso a 800 Hz).
     - Narratore: ticchettio meccanico d'epoca di tasti e nastro da macchina da scrivere antica.
   - Eliminata tutta l'infrastruttura TTS (script Python, IPC, dipendenze edge-tts).
2. **Puntatore a tema vittoriano in pixel art (`assets/ui/cursor_default.png`, `cursor_pointer.png`)**:
   - Cursore standard: elegante guanto vittoriano in pelle avorio con polsino dorato, gemma e bordo scuro ad alto contrasto.
   - Cursore interattivo (hover su hotspot, uscite, scelte, pulsanti, elementi cliccabili): guanto in oro brillante radioso con aura ambrata.
   - Supporto nativo via CSS e Phaser (`this.input.setDefaultCursor`).
3. **Menu di Pausa su tasto `ESC` (`src/renderer/ui/screens.ts`, `presenter.ts`, `style.css`)**:
   - Accessibile durante l'esplorazione premendo `ESC` (se non vi sono modali già aperti; se è aperto il menu verbi lo chiude; se è aperto il diario o la chat ESC chiude il pannello).
   - Card vittoriana con capitolo, scena corrente e controlli:
     - Riprendi l'esplorazione (ESC)
     - Diario delle indagini (J)
     - Regolazione volume Musica e volume Effetti Sonori con cursori a tema e feedback sonoro in tempo reale
     - Torna al Menu Principale (salva la sessione e ritorna alla copertina del libro)
     - Esci dal gioco (salva la sessione e chiude l'app via IPC `app:quit`).
4. **Effetto sonoro tattile sui click (`playClickSound`)**:
   - Feedback audio meccanico (interruttore in ottone/legno d'epoca sintetizzato via Web Audio) su ogni pulsante HTML, scelta di dialogo, tab, hotspot della stanza e transizioni di uscita.
5. **Risoluzione bug menu esamina porta (`room-ui.ts`, `RoomScene.ts`)**:
   - Il menu verbi della porta non si sposta più al primo click: aggiunta propagazione bloccata (`pointerdown`, `mousedown`, `mouseup`, `click`) e guardia `isVerbMenuOpen()`.



