# story/ — la storia estratta dal libro

Fonte unica: `book/source/pg43.txt` (Project Gutenberg #43, testo inglese originale, pubblico dominio).
`book/chapters/NN-slug.txt` sono i 10 capitoli ritagliati da quel file (numeri di riga relativi al file del capitolo).

Questa cartella contiene **cosa succede nel libro**, organizzato per essere trasformato in contenuto di gioco.
Non contiene meccaniche di gioco inventate: quelle stanno in `docs/DESIGN.md`.

- `chapters/NN-slug.md` — una scheda per capitolo, formato sotto.
- `bible.md` — personaggi, luoghi, glossario di traduzione, cronologia (unione delle schede).

## Regole

1. Fedeltà: niente eventi, battute o fatti che non stanno nel testo. Se un dettaglio è dedotto, scrivi `(dedotto)`.
2. Ogni battuta di dialogo ha l'inglese originale **parola per parola** e la traduzione italiana.
3. Riferimenti: ogni scena e ogni fatto indicano le righe del file capitolo (`r. 12-40`).
4. Battuta interrotta da un inciso del narratore ("said he", "added the doctor"): si uniscono le parti del
   personaggio e si mette `…` nel punto in cui si è tolto l'inciso. `npm run check:story` verifica che ogni
   `en:` sia nel testo originale.
5. ID stabili, in ASCII minuscolo: personaggi `utterson`, luoghi `loc_...`, oggetti `obj_...`, fatti `F03.2`, dialoghi `D03.2.5`.

## Traduzione italiana

- Registro: italiano letterario moderno, scorrevole, non arcaico. Tra gentiluomini si dà del Lei.
- Nomi propri invariati (Utterson, Enfield, Hyde, Jekyll, Lanyon, Poole, Guest, Carew, Newcomen).
- Titoli: "Mr. Utterson" → "il signor Utterson" (in narrazione solo "Utterson"); "Dr. Jekyll" → "il dottor Jekyll";
  "Sir Danvers Carew" invariato; "Inspector Newcomen" → "l'ispettore Newcomen".
- "lawyer" (Utterson) → "avvocato"; "will" → "testamento"; "cheque" → "assegno"; "the door" → "la porta".
- Luoghi di Londra invariati (Soho, Cavendish Square, Gaunt Street, ...).

## ID personaggi già fissati

`utterson`, `enfield`, `hyde`, `jekyll`, `lanyon`, `poole`, `guest` (Mr. Guest, il segretario di Utterson),
`carew` (Sir Danvers Carew), `newcomen` (ispettore), `narrator` (voce narrante).
Nuovi personaggi: id breve in inglese (`maid`, `bradshaw`, `cook`, `girl`, `doctor_sawbones`, ...),
dichiarato nella sezione "Personaggi presenti".

## Formato di una scheda capitolo

````markdown
# Capitolo NN — Titolo italiano (TITLE ENGLISH)

File: `book/chapters/NN-slug.txt`

## Sintesi
5-10 frasi, fedeli.

## Personaggi presenti
- `id` — ruolo nel capitolo; stato fisico/emotivo in questo momento della storia.

## Luoghi
- `loc_id` — descrizione visiva utile per disegnarlo in pixel art (interno/esterno, arredi, luce, ora, meteo,
  colori) presa dal testo; r. N-M.

## Scene
### S NN.k — titolo breve
- Luogo: `loc_id` · Momento: giorno/notte, stagione, data se scritta nel testo
- Presenti: `id`, `id`
- Righe: r. N-M
- Eventi (in ordine, fedeli):
  1. ...
- Dialoghi: `DNN.k.1` – `DNN.k.m`
- Narrazione chiave: 1-4 brevi passaggi del narratore tradotti in italiano, utili come testo a schermo.
- Proposta di gioco: cosa può fare il giocatore qui senza cambiare la storia (osservare X, parlare con Y di Z,
  raccogliere W). Segna chiaramente che è una proposta.

## Dialoghi
Un blocco YAML per scena, **tutte** le battute dirette del capitolo nell'ordine del testo.
Le battute dentro un racconto (es. Enfield che riporta cosa disse Hyde) hanno `told_by`.

```yaml
- id: DNN.k.1
  speaker: enfield
  to: utterson
  told_by: null
  en: "verbatim English"
  it: "traduzione italiana"
```

## Oggetti e indizi
- `obj_id` — cos'è, dove si trova, chi lo ha, perché conta nella storia; r. N.

## Fatti
Cosa si viene a sapere in questo capitolo. Serve per decidere cosa ogni NPC può dire e quando.
- `FNN.k` — fatto in una frase · Chi lo sa a fine capitolo: `id`, `id` · r. N

## Profili personaggio
Solo personaggi nuovi o con cambiamenti in questo capitolo.
- `id` — aspetto fisico (per generare l'immagine: età, corporatura, viso, abiti dell'epoca, colori),
  modo di parlare, carattere, cosa vuole. Cita le righe.

## Note di fedeltà
Ambiguità del testo, cose da NON inventare, dettagli che il gioco deve rispettare.
````
