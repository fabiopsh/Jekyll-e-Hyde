# AGENTS.md — istruzioni per qualunque agente o modello IA che lavora qui

Progetto: avventura grafica punta-e-clicca in pixel art, app desktop in italiano, che racconta fedelmente
*The Strange Case of Dr Jekyll and Mr Hyde* (Stevenson, 1886, pubblico dominio). Gli NPC parlano tramite un
LLM locale tenuto sotto controllo dal gioco. Proprietario: Fabio (fa i test manuali e dà feedback).

## Leggi prima, in quest'ordine

1. `docs/STATO.md` — a che punto siamo, cosa fare dopo. **Inizia sempre da qui.**
2. `docs/ARCHITETTURA.md` — com'è fatto il progetto.
3. `docs/DECISIONI.md` — perché è fatto così. Non ridiscutere una decisione senza una voce nuova motivata.
4. Per lavorare sulla storia: `story/README.md` e `story/bible.md`. Per i contenuti: `docs/DESIGN.md`.

## Regole

- **Una sola casa per ogni fatto.** Testo originale: `book/source/pg43.txt` (mai modificarlo). Cosa succede nel
  libro: `story/`. Contenuti di gioco: `content/`. Scelte: `docs/DECISIONI.md`. Stato: `docs/STATO.md`.
  Non copiare informazioni da un posto all'altro: rimanda.
- **Fedeltà al libro.** Nessun evento, battuta o fatto inventato nella trama. Le battute dei dialoghi scritti
  portano `src:` con l'ID della battuta in `story/chapters/`. Le idee di gameplay sono permesse solo dove non
  cambiano la storia, e vanno marcate.
- **Il motore non conosce la storia.** Niente nomi di personaggi, scene o flag nel codice in `src/`.
  Tutto passa da `content/`.
- **L'LLM non decide la trama.** Può solo scegliere azioni da enum costruiti dallo stato (vedi ARCHITETTURA §5).
- Dopo ogni modifica: `npm run validate` e `npm test` devono passare. Se cambi un contenuto o una scena,
  scrivi in `docs/STATO.md` cosa Fabio deve provare a mano.
- A fine sessione aggiorna `docs/STATO.md` (fatto, in corso, prossimo passo, problemi aperti) e, se hai preso
  una decisione, aggiungi una voce datata in `docs/DECISIONI.md`.
- Documenti in italiano. Codice, nomi di file e commenti nel codice in inglese.
- Solo date, numeri e fonti realmente noti. Se qualcosa non è noto, scrivilo.
- Commit piccoli, messaggio in inglese, formato Conventional Commits.

## Comandi

```
npm install
npm run dev          gioco in sviluppo (Electron)
npm run validate     validazione contenuti
npm test             test della logica
```
Asset: `tools/assets/README.md`.

## Lavoro in parallelo

I compiti si dividono bene per file: una scheda capitolo, una scena, un dialogo, un NPC. Due agenti non devono
modificare lo stesso file. Compiti meccanici (estrazione, traduzione, YAML di contenuto) vanno bene per modelli
più piccoli; architettura, motore e director NPC richiedono il modello più capace.
