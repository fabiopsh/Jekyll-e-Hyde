# Design di gioco

Come il libro diventa un'avventura grafica. La storia è in `story/` (scene `S NN.k`, battute `DNN.k.m`,
fatti `FNN.k`); qui si decide **cosa fa il giocatore** in ogni parte. Gli ID dei luoghi sono quelli di
`story/bible.md`.

## 1. Regole del design

1. **Si gioca dentro la trama, non al posto suo.** Il giocatore sceglie ordine, esplorazione e domande, ma gli
   eventi del libro accadono come nel libro. Un'azione che il personaggio non farebbe è bloccata con una frase
   del narratore (es. Utterson non apre il plico di Lanyon: "L'onore professionale glielo vieta").
2. **Tre modi di raccontare**, usati secondo la scena:
   - *giocato*: stanza esplorabile con punta-e-clicca (osserva, usa, parla, prendi);
   - *dialogo scritto*: le battute del libro, con scelte che cambiano solo l'ordine o le domande;
   - *narrato*: cartoline del narratore su sfondo illustrato, con il testo tradotto del libro. Per i salti di
     tempo, le scene viste da altri (la cameriera, cap. 4) e la violenza, che **non si gioca mai**: si vede fuori
     campo, con dissolvenza.
3. **Diario** (sempre aperto con un tasto): obiettivo corrente, fatti scoperti, documenti letti. È ciò che
   Utterson "sa"; gli NPC ne tengono conto.
4. **Chat libera** con gli NPC principali: aggiunge colore e dà suggerimenti; i fatti indispensabili si ottengono
   sempre anche dai dialoghi scritti.
5. **Suggerimenti**: tre livelli per obiettivo (vago → preciso), scritti a mano. Arrivano da un NPC presente in
   scena o, se nessuno c'è, dal diario ("Pensieri di Utterson").

## 2. Struttura

Menu: *Nuova partita*, *Continua*, *Storico partite*, *Impostazioni* (testo, volume, modello LLM).
Ogni capitolo si apre con il titolo del libro e una cartolina narrata; si chiude con un salvataggio automatico.

| Cap. | Personaggio | Forma prevalente | Luoghi principali |
|---|---|---|---|
| 1 | Utterson | passeggiata + racconto di Enfield | stradina laterale, la porta |
| 2 | Utterson | indagine: testamento, Lanyon, appostamento, Poole | studio di Utterson, casa di Lanyon, la porta, atrio di Jekyll |
| 3 | Utterson | dialogo al camino | casa di Jekyll |
| 4 | Utterson | indagine sul delitto | stazione di polizia, Soho, stanze di Hyde |
| 5 | Utterson | colloquio + perizia calligrafica | studio di Jekyll, casa di Utterson |
| 6 | Utterson | tempo che passa, Lanyon morente | casa di Jekyll (porta chiusa), casa di Lanyon, studio di Utterson |
| 7 | Utterson | scena breve alla finestra | stradina, cortile |
| 8 | Utterson | notte di tensione, sfondare la porta, indizi | casa di Jekyll: atrio, cucina, anfiteatro, studio |
| 9 | **Lanyon** | flashback: la lettera, il cassetto, mezzanotte | casa di Jekyll, studio di Lanyon |
| 10 | **Jekyll / Hyde** | flashback: la confessione a vignette | studio e camera di Jekyll, Soho, Regent's Park, Portland Street |

## 3. Capitolo per capitolo

Per ogni capitolo: obiettivi (in ordine), cosa è giocato / scritto / narrato. Le scene tra parentesi sono quelle
di `story/chapters/`.

### Cap. 1 — Storia della porta
- Narrato: chi è Utterson, l'amicizia con Enfield (S 01.1).
- Giocato: la stradina laterale di domenica, con Enfield accanto. Si osservano vetrine, la casa sinistra, la porta
  senza campanello (S 01.2).
- Scritto: osservare la porta avvia il racconto di Enfield (S 01.3). Il racconto è narrato con illustrazioni:
  la notte, l'angolo, la bambina (fuori campo), il medico, l'assegno.
- Scritto con scelte: domande sulla porta, sul nome, sulla chiave (S 01.4–01.7). Utterson chiede il nome: Hyde.
- Obiettivi: *Ascolta la storia di Enfield* → *Scopri il nome dell'uomo* → *Concludi la passeggiata* (il patto).

### Cap. 2 — Ricerca di Mr. Hyde
- Giocato: studio di Utterson di sera. Aprire la cassaforte, leggere il testamento di Jekyll (documento nel diario).
- Giocato + scritto: casa di Lanyon, cena; dialogo sul dottor Jekyll e su Hyde.
- Narrato: la notte insonne, le visioni (S 02.3).
- Giocato: l'appostamento alla porta. Il giocatore sceglie quando andare (mattina, mezzogiorno, sera, notte):
  per alcune volte non succede niente (narrazione breve), poi in una notte gelida arriva Hyde (S 02.4).
- Scritto: l'incontro con Hyde (S 02.5), poi la riflessione (narrato, S 02.6).
- Giocato + scritto: alla porta della casa di Jekyll, Poole nell'atrio (S 02.7–02.8). Chat libera con Poole.
- Obiettivi: *Rileggi il testamento* → *Chiedi a Lanyon di Hyde* → *Vedi in faccia Mr. Hyde* → *Cerca Jekyll*.

### Cap. 3 — Il dottor Jekyll era perfettamente tranquillo
- Narrato: la cena, gli ospiti che se ne vanno.
- Scritto: dialogo al camino con Jekyll, fino alla promessa (S 03.2–03.3). Chat libera con Jekyll prima di
  sollevare la questione del testamento.
- Obiettivo: *Parla a Jekyll del testamento*.

### Cap. 4 — Il caso dell'omicidio Carew
- Narrato: il delitto visto dalla cameriera, tutto fuori campo (S 04.1–04.2).
- Giocato: Utterson riceve la busta (S 04.3). Stazione di polizia: osservare il corpo coperto e il bastone
  spezzato; riconoscere Carew e il bastone (S 04.4).
- Narrato: la carrozza nella nebbia di Soho (S 04.5).
- Giocato: la casa di Hyde, la vecchia governante (scritto), le stanze: trovare la metà del bastone dietro la
  porta, il libretto degli assegni bruciato nel camino (S 04.6–04.7). Chat libera con l'ispettore Newcomen.
- Obiettivi: *Va' alla polizia* → *Accompagna l'ispettore da Hyde* → *Perquisisci le stanze di Hyde*.

### Cap. 5 — L'episodio della lettera
- Giocato: attraversare cortile e anfiteatro anatomico fino allo studio di Jekyll (S 05.1).
- Scritto: colloquio con Jekyll, la lettera di Hyde (oggetto) (S 05.2).
- Scritto: domanda a Poole all'uscita (S 05.3). Narrato: gli strilloni.
- Giocato: a casa con Guest. Arriva il biglietto di Jekyll: *usare* la lettera di Hyde e il biglietto con Guest
  avvia il confronto delle grafie (S 05.4). Chiudere il biglietto nella cassaforte (S 05.5).
- Obiettivi: *Va' da Jekyll* → *Chiedi a Poole della lettera* → *Mostra la lettera a Guest* → *Metti al sicuro il biglietto*.

### Cap. 6 — Lo strano episodio del dottor Lanyon
- Narrato: i mesi di pace (S 06.1).
- Giocato: tre visite alla porta di Jekyll respinte da Poole (date del libro sullo schermo) (S 06.2).
- Scritto: Lanyon invecchiato e terrorizzato (S 06.3). Chat libera con Lanyon, che rifiuta di parlare di Jekyll.
- Giocato: leggere la lettera di Jekyll (S 06.4). Dopo il funerale, la busta di Lanyon: il plico interno
  non si può aprire, solo chiudere in cassaforte (S 06.5).
- Narrato: le visite sempre più rare (S 06.6).

### Cap. 7 — L'episodio della finestra
- Giocato: passeggiata domenicale con Enfield, ingresso nel cortile (S 07.1).
- Scritto: Jekyll alla finestra; la finestra che si chiude di colpo (S 07.2). Narrato: il silenzio (S 07.3).

### Cap. 8 — L'ultima notte
- Scritto: Poole a casa di Utterson (S 08.1). Narrato: la notte ventosa (S 08.2).
- Giocato: atrio con i domestici; ascoltare alla porta dello studio (S 08.3–08.4).
- Giocato + scritto: in cucina, i biglietti per la sostanza, il racconto di Poole (S 08.5–08.6). Chat con Poole.
- Scritto con scelta: decidere di sfondare la porta; mandare Bradshaw e il ragazzo alla porta sulla strada (S 08.7).
- Giocato: l'attesa nell'anfiteatro, poi l'ascia (S 08.8–08.9). Narrato: il corpo di Hyde (S 08.10).
- Giocato: perquisizione di studio, anfiteatro e cantina: la chiave rotta, il libro devoto, lo specchio, la busta
  con il nome di Utterson (S 08.11–08.13). Ultimo atto: leggere il racconto di Lanyon → cap. 9.
- Obiettivi: *Segui Poole* → *Ascolta la voce* → *Decidi cosa fare* → *Entra nello studio* → *Cerca Jekyll* → *Leggi i documenti*.

### Cap. 9 — Il racconto del dottor Lanyon (flashback, si gioca Lanyon)
- Giocato: leggere la lettera raccomandata (S 09.1).
- Giocato: casa di Jekyll, il fabbro e il falegname al lavoro, poi lo studio: trovare il cassetto giusto seguendo
  le istruzioni della lettera (S 09.2–09.3). A casa: esaminare polveri, fiala, quaderno; caricare la rivoltella.
- Scritto: mezzanotte, lo sconosciuto (che resta "lo sconosciuto" fino alla fine) (S 09.4–09.6). La scelta di
  restare si offre al giocatore; scegliere di andarsene è bloccato dalla curiosità di Lanyon (narrato).
- Narrato con animazione: la trasformazione (S 09.7). Narrato: ciò che Lanyon non riesce a scrivere (S 09.8).

### Cap. 10 — La dichiarazione di Henry Jekyll (flashback, si gioca Jekyll, a tratti Hyde)
Vignette brevi, ognuna con una sola azione chiave, legate dalla voce di Jekyll che scrive:
- Narrato: l'uomo diviso (S 10.1). Giocato: preparare la tintura con il sale nello studio (S 10.2), la prima
  trasformazione (narrata), allo specchio della camera (giocato, S 10.4), il ritorno (S 10.5).
- Narrato: preparativi e piaceri di Hyde, l'assegno (S 10.6–10.8).
- Giocato: il risveglio con la mano di Hyde, attraversare la casa fino allo studio senza farsi notare (S 10.9).
- Narrato: la scelta, la ricaduta, l'omicidio fuori campo, la fuga, la preghiera (S 10.10–10.15).
- Giocato: Regent's Park, la trasformazione; come Hyde, all'albergo di Portland Street scrivere le lettere per
  Lanyon e Poole (S 10.16–10.19). Narrato: da Lanyon (rimanda al cap. 9), il ritorno (S 10.20).
- Narrato con brevi momenti giocati: il cortile, il tormento, il sale che non funziona più (S 10.21–10.24).
- Finale: l'ultima pagina nello studio (S 10.25). Titoli di coda. La partita si chiude nello storico.

## 4. NPC con chat libera

| NPC | Capitoli | Note di comportamento |
|---|---|---|
| Enfield | 1, 7 | uomo di mondo, discreto: "più sembra strano, meno chiedo" |
| Lanyon | 2, 6 | 2: cordiale, sprezzante sulle idee di Jekyll; 6: rifiuta di parlarne |
| Poole | 2, 5, 6, 8 | rispettoso; nel cap. 8 terrorizzato |
| Jekyll | 3, 5, 7 | cordiale ma si chiude su Hyde; 5 e 7 malato e disperato |
| Guest | 5 | appassionato di grafie, discreto |
| Newcomen | 4 | ispettore pratico, fiducioso di prendere Hyde |
| Hyde | 2 | solo poche battute, ostile: chiude presto la conversazione |

Gli NPC conoscono solo i fatti già veri in quel capitolo (`content/facts.yaml`, campo `known_by`).

## 5. Primo pezzo giocabile (vertical slice)

Capitolo 1 completo: una scena giocata (stradina e porta), il racconto di Enfield narrato, il dialogo scritto
con scelte, chat libera con Enfield, diario, salvataggio e storico. Serve a provare insieme tutte le parti del
motore prima di produrre gli altri capitoli.
