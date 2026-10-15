# tools/audio — musica del gioco, generata in locale

Genera in locale le colonne sonore, con loop senza stacchi. Il gioco non ha voci: i personaggi parlano solo
con il testo, accompagnato da brevi effetti sonori ("blip") prodotti nel gioco stesso (`src/renderer/audio.ts`).

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

## 2. Integrazione nel gioco

- La musica sfuma con crossfade tra menu, stanze e narrazione (`src/renderer/audio.ts`).
- Quando Enfield racconta la storia della porta (`d01_door_story`), la musica passa automaticamente a `mus_sinister_story.mp3`, e al termine torna al tema della stradina.
