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
