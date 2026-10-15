# tools/audio — pipeline audio e doppiaggio in locale

Genera in locale colonne sonore musicali con loop senza stacchi e doppiaggio vocale dei dialoghi in italiano.

## 1. Colonna sonora (`generate_music.py`)

Usa **Meta MusicGen** (`facebook/musicgen-small`) in float16 su CUDA:
- Le tracce sono definite in `data/tracks.yaml` con prompt d'atmosfera vittoriana (violoncello solista, pianoforte d'epoca, archi calmi o sinistri).
- Genera campioni a 32 kHz, applica un crossfade a pari potenza per loop continuo e pulito, normalizza il volume e salva in `assets/audio/music/<id>.mp3` e `.wav`.
- Il catalogo delle tracce viene salvato automaticamente in `assets/audio/manifest.json`.

Comandi:
```bash
cd tools/audio
uv run python generate_music.py                     # genera tutte le tracce mancanti
uv run python generate_music.py --ids mus_by_street  # genera traccia specifica
uv run python generate_music.py --force             # rigenera sovrascrivendo
```

Tracce del Capitolo 1:
- `mus_menu_theme`: Tema del menu principale (violoncello malinconico e pianoforte da salotto vittoriano).
- `mus_by_street`: Sottofondo della stradina di domenica (archi gentili, pizzicato, mistero calmo).
- `mus_sinister_story`: Storia della porta (violoncello cupo, carillon sinistro, tremolo drammatico).

## 2. Sintesi Vocale e Doppiaggio (`generate_speech.py`)

Usa **Kokoro-82M** (Apache 2.0, pesi ~300MB, velocissimo: ~75x tempo reale su CPU/GPU) per sintetizzare le battute in italiano:
- Scansiona `content/dialogues/*.yaml`.
- Applica profili vocali distinti per personaggio:
  - `enfield`: `im_nicola`, speed 1.05 (giovane gentiluomo brillante e spigliato).
  - `utterson`: `im_nicola`, speed 0.90 (avvocato austero, maturo e misurato).
  - `narrator`: `im_nicola`, speed 0.96 (voce narrante solenne).
- Salva i file in `assets/audio/speech/<dialogue_id>/<node_id>_<idx>.mp3` e scrive il registro in `assets/audio/speech/manifest.json`.

Comandi:
```bash
cd tools/audio
uv run python generate_speech.py                        # genera tutte le 52 battute del capitolo 1
uv run python generate_speech.py --dialogue d01_enfield # genera solo un dialogo
uv run python generate_speech.py --force               # rigenera sovrascrivendo
```

## 3. Integrazione nel Gioco

- La musica sfuma con crossfade tra menu, stanze e narrazione (`src/renderer/audio.ts`).
- Quando Enfield racconta la storia della porta (`d01_door_story`), la musica passa automaticamente a `mus_sinister_story.mp3`, e al termine torna al tema della stradina.
- Nei dialoghi canonici, l'audio della voce parte sincronizzato con l'effetto macchina da scrivere (typewriter effect).
- Se il giocatore clicca o preme Spazio per avanzare, la voce si interrompe immediatamente per non sovrapporsi.
