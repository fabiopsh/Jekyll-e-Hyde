# Bibbia della storia — personaggi, luoghi, oggetti, traduzione, cronologia

Unione delle dieci schede in `story/chapters/`. Le righe (`r.`) sono sempre del file capitolo
`book/chapters/NN-slug.txt` indicato con "cap. N". "(dedotto)" segna ciò che non è scritto ma si ricava
dal testo; "scelta di disegno" segna ciò che il libro non dice e che serve solo per disegnare.
I fatti (`FNN.k`) e le battute (`DNN.k.m`) restano nelle schede: qui si rimanda a scene (`S NN.k`).

Regole per gli ID:
- un luogo fisico ha un solo id, anche se il libro rivela solo più avanti che due luoghi sono lo stesso
  (nota nella voce del luogo);
- `loc_jekyll_house`, `loc_lanyon_house` e `loc_utterson_house` valgono per la casa quando il testo non
  dice in quale stanza si è; quando la stanza è scritta si usa l'id della stanza;
- la facciata del laboratorio sulla stradina fa parte di `loc_by_street`: è lo sfondo della strada;
  l'interno del laboratorio è `loc_laboratory_theatre`, `loc_laboratory_corridor`,
  `loc_laboratory_cellar`, `loc_jekyll_cabinet`.

---

## 1. Personaggi

| id | nome | ruolo |
|---|---|---|
| `utterson` | Gabriel John Utterson | avvocato, protagonista; amico e legale di Jekyll |
| `enfield` | Richard Enfield | lontano parente di Utterson, uomo di mondo |
| `jekyll` | dottor Henry Jekyll | medico e scienziato, M.D., D.C.L., LL.D., F.R.S. |
| `hyde` | Edward Hyde | l'altra forma di Jekyll; erede nel testamento, assassino di Carew |
| `lanyon` | dottor Hastie Lanyon | medico di Cavendish Square, vecchio amico di Jekyll e Utterson |
| `poole` | Poole | maggiordomo di Jekyll da vent'anni |
| `guest` | il signor Guest | primo impiegato di Utterson, esperto di grafie |
| `carew` | Sir Danvers Carew | anziano gentiluomo, deputato, vittima di Hyde |
| `newcomen` | ispettore Newcomen | ispettore di Scotland Yard |
| `narrator` | voce narrante | narratore in terza persona (cap. 1-8) |
| `girl` | la bambina | bambina calpestata da Hyde (racconto di Enfield) |
| `doctor_sawbones` | il medico ("Sawbones") | speziale accorso per la bambina |
| `girl_family` | la famiglia della bambina | il padre e le donne della famiglia |
| `lanyon_butler` | maggiordomo di Lanyon | apre a Utterson nel cap. 2 |
| `cronies` | gli ospiti di Jekyll | i "cinque o sei vecchi amici" della cena del cap. 3 |
| `maid` | la cameriera | testimone dell'omicidio Carew dalla finestra |
| `soho_housekeeper` | la vecchia di Soho | la donna che apre la casa di Hyde (cap. 4); la governante di Soho (cap. 10) |
| `utterson_servant` | domestico di Utterson | porta il biglietto di Jekyll (cap. 5) |
| `newsboys` | strilloni | gridano l'edizione straordinaria (cap. 5) |
| `bradshaw` | Bradshaw | valletto di casa Jekyll |
| `cook` | la cuoca | cuoca di casa Jekyll |
| `housemaid` | la cameriera di casa | cameriera di casa Jekyll (cap. 8) |
| `knife_boy` | il ragazzo dei coltelli | garzone di casa Jekyll |
| `jekyll_servants` | i domestici di Jekyll | il gruppo dei domestici; anche il domestico senza nome che apre con la catena (cap. 8) |
| `locksmith` | il fabbro | apre la porta dello studio per Lanyon |
| `carpenter` | il falegname | chiamato con il fabbro |
| `policeman` | il poliziotto | in ronda a Cavendish Square a mezzanotte |
| `denman` | il vecchio dottor Denman | solo nominato: proprietario dell'anfiteatro anatomico |
| `cab_driver` | il vetturino | guida l'hansom di Hyde (cap. 10) |
| `inn_waiter` | il cameriere dell'albergo | e gli inservienti dell'albergo di Portland Street |
| `street_woman` | la donna dei fiammiferi | donna colpita da Hyde di notte |

### Profili

Ogni profilo serve a disegnare il personaggio e a farlo parlare. Aspetto: solo dal testo. Abiti: dal
testo quando c'è, altrimenti abiti londinesi degli anni 1880 indicati come scelta di disegno (il libro
non dà l'anno: "18—").

#### `utterson` — Gabriel John Utterson
- **Nome e stato.** "Gabriel John Utterson" (cap. 8 r. 435-436), "G. J. Utterson" (cap. 6 r. 103);
  avvocato; scapolo, vive in una "bachelor house" (cap. 2 r. 3); abita in Gaunt Street (cap. 2 r. 162).
- **Aspetto (testo).** Volto rude ("rugged countenance") mai illuminato da un sorriso; freddo; magro,
  lungo, "polveroso", tetro e tuttavia amabile (cap. 1 r. 3-6). Quando il vino è di suo gusto, qualcosa
  di "eminentemente umano" gli brilla negli occhi (cap. 1 r. 6-8). Età non scritta: compagno di scuola e
  di college di Lanyon (cap. 2 r. 48-50), quindi coetaneo di Jekyll e Lanyon, intorno ai cinquant'anni
  (dedotto da cap. 3 r. 14).
- **Abiti.** Testo: un pastrano ("greatcoat", cap. 2 r. 36; cap. 8 r. 42) e il cappello (cap. 8 r. 42).
  Scelta di disegno: redingote nera o grigio scuro, panciotto, camicia bianca a colletto alto, cravatta
  scura, cilindro; nessun ornamento vistoso (è austero con se stesso, cap. 1 r. 10-12).
- **Modo di parlare.** Poche parole, freddo e impacciato nel discorso (cap. 1 r. 4); frasi brevi e
  asciutte, domande dirette ("You are sure he used a key?", D01.7.1); esclamazioni misurate ("Tut-tut!",
  D01.4.1; "God forgive us", D07.3.1); immagini legali ("statute of limitations", D02.9.1). Chiama
  Enfield "Richard" (D01.7.4), pensa a Jekyll come "Harry" (D02.9.1). Dà del Lei ai gentiluomini e del tu
  ai domestici.
- **Carattere.** Austero con sé, tollerante con gli altri: aiuta invece di rimproverare (cap. 1 r. 10-15);
  massima "I incline to Cain's heresy" (D01.1.1-2); amicizie di lunga data, "come l'edera" (cap. 1
  r. 22-28); senza passioni scientifiche "tranne il conveyancing" (cap. 2 r. 73-74); leale e rispettoso
  del segreto professionale (cap. 6 r. 116-120).
- **Come cambia.**
  - Cap. 1: calmo, poi colpito dal racconto, sospira (r. 204, 220).
  - Cap. 2: cupo, insonne, ossessionato dal volto di Hyde; dopo l'incontro disgustato e spaventato;
    alla fine deciso ad aiutare Jekyll.
  - Cap. 3: ostinato, poi cede e promette con un sospiro (r. 85).
  - Cap. 4: grave, atterrito dal nome di Hyde, sente "il terrore della legge" (r. 94-97).
  - Cap. 5: sollevato dalla lettera, poi gelato dal sospetto di falso (r. 184-185).
  - Cap. 6: sereno per due mesi, poi solo e turbato; tiene chiuso il plico di Lanyon.
  - Cap. 7: in pena per Jekyll, poi pallido d'orrore (r. 57).
  - Cap. 8: da razionale a uomo d'azione: comanda, sfonda la porta, protegge il nome di Jekyll.

#### `enfield` — Richard Enfield
- **Aspetto (testo).** Nessuna descrizione fisica. Il narratore lo chiama "il giovane" (cap. 1 r. 220):
  più giovane di Utterson (età non scritta). Ha un bastone (cap. 1 r. 67).
- **Abiti.** Scelta di disegno: abiti eleganti da "uomo di mondo" ("well-known man about town", cap. 1
  r. 30): finanziera chiara o grigia, cilindro, guanti, bastone (dal testo).
- **Modo di parlare.** Vivace, colloquiale ("Well, sir", "I gave a few halloa"), immagini forti
  (Juggernaut, arpie, "like Satan") (D01.3.2); autoironico ("what an ass you must have thought me",
  D07.1.3).
- **Carattere.** Regola di non fare domande: "the more it looks like Queer Street, the less I ask"
  (D01.5.6); si vergogna della lingua lunga (D01.7.8); "imperturbabile" secondo Utterson (cap. 2 r. 118).
- **Come cambia.** Cap. 1: loquace, poi pensieroso, imbronciato, vergognoso. Cap. 7: ha scoperto che la
  porta è un retro della casa di Jekyll; alla fine pallido e muto (r. 57, 61-62).

#### `jekyll` — Henry Jekyll
- **Nome e titoli.** "Henry Jekyll, M.D., D.C.L., LL.D., F.R.S., &c." (cap. 2 r. 15-16); "Harry" per
  Utterson. Nato ricco (cap. 10 r. 3).
- **Aspetto (testo).** Uomo di cinquant'anni, grande, ben fatto, dal viso liscio, forse con "qualcosa di
  furbo", ma con ogni segno di capacità e bontà (cap. 3 r. 14-16); "il grande bel viso" (cap. 3 r. 40);
  alto e di bella corporatura (Poole, cap. 8 r. 210); passo pesante e scricchiolante (cap. 8 r. 305-306);
  mano "professionale", grande, salda, bianca e gradevole (cap. 10 r. 246-248); si definisce "il dottore anziano e scontento" (cap. 10 r. 319). Capelli, occhi e colori
  non sono descritti.
- **Abiti.** Scelta di disegno: gentiluomo agiato e stimato: redingote di buon taglio blu notte o nera,
  panciotto, catena d'orologio, camicia bianca, cravatta di seta. Negli ultimi capitoli gli stessi abiti
  su un corpo smagrito (scelta di disegno, coerente con cap. 10 r. 513-517).
- **Modo di parlare.** Cordiale e scherzoso (cap. 3 r. 22-29), un po' brusco sul testamento (cap. 3
  r. 34), incoerente su Hyde (cap. 3 r. 46-47); giuramenti ripetuti e frasi spezzate ("I swear to God",
  "I have—I have received a letter", D05.2.4, D05.2.6); nelle lettere formale, supplichevole, ornato
  (D06.4.1, D09.1.2-15); nella confessione analitico, penitente, ricco di immagini (cap. 10). Dà del Lei a
  Utterson e Lanyon.
- **Carattere.** Desidera la stima pubblica e nasconde i suoi piaceri: "profonda doppiezza di vita"
  (cap. 10 r. 11-14); benefico (cap. 6 r. 16-19); generoso con gli amici (cap. 3 r. 13-17); si inganna
  sulla propria forza ("the moment I choose, I can be rid of Mr. Hyde", D03.2.18).
- **Come cambia.**
  - Prima del cap. 1 (narrato nel cap. 10): giovane ricco, poi scienziato che scopre la droga.
  - Cap. 3: sano, allegro, ma impallidisce fino alle labbra al nome di Hyde (r. 40-41).
  - Cap. 5: "mortalmente malato", mano fredda, voce cambiata, febbrile (r. 24-26, 44).
  - Cap. 6: rinato, il volto "si apre e si illumina" (r. 20); poi recluso nello studio, silenzioso, non
    legge (r. 130-134).
  - Cap. 7: alla finestra, "infinita tristezza", "come un prigioniero sconsolato" (r. 26-27); un attimo
    di terrore e disperazione abietti (r. 48-50).
  - Cap. 8: assente; solo la sua scrittura.
  - Cap. 9: compare dopo la trasformazione: pallido, scosso, mezzo svenuto, "come un uomo restituito
    dalla morte" (r. 254-256).
  - Cap. 10 (ultimi giorni): "creatura consumata e svuotata dalla febbre", debole di corpo e mente
    (r. 513-517), volto "tristemente alterato" (r. 570).

#### `hyde` — Edward Hyde
- **Aspetto (testo).** Va disegnato con cautela: tutti vedono in lui una deformità che nessuno sa
  indicare. Fonti:
  - piccolo ("a little man", cap. 1 r. 84), cammina "stumping" a gran passo (cap. 1 r. 85); sguardo
    "così brutto" da far sudare (cap. 1 r. 94-95); "deve essere deforme da qualche parte", ma Enfield non
    sa dire dove (cap. 1 r. 195-202);
  - piccolo, molto semplicemente vestito (cap. 2 r. 148-149); pallido e nanesco ("dwarfish"), impressione
    di deformità "senza alcuna malformazione definibile", sorriso sgradevole, miscela "omicida" di
    timidezza e audacia, voce rauca, sussurrante e un po' spezzata (cap. 2 r. 212-216); passo leggero e
    strano (cap. 2 r. 137-138);
  - "molto piccolo" (cap. 4 r. 16-17), "particularly small and particularly wicked-looking" (cap. 4
    r. 75-76); mai fotografato; lascia un "senso ossessionante di deformità non espressa" (cap. 4
    r. 155-158); furia "scimmiesca" (cap. 4 r. 35);
  - piccolo; volto con un'espressione sconvolgente; grande attività muscolare e grande debolezza
    apparente di costituzione; la sua vicinanza dà un brivido e fa calare il polso (cap. 9 r. 138-145);
  - più piccolo, più esile e più giovane di Jekyll; il male "scritto chiaro e netto" sul volto; impronta
    di deformità e decadenza (cap. 10 r. 128-133); mano magra, nervosa, nodosa, di pallore scuro, coperta
    di peli neri (cap. 10 r. 249-251); col tempo "cresciuto di statura" (cap. 10 r. 282-284);
  - Poole: "più simile a un nano" (cap. 8 r. 211), rapido e leggero, "come una scimmia" (cap. 8 r. 264).
  Età non scritta: "young man" per Utterson e Jekyll (cap. 2 r. 262; cap. 3 r. 74).
- **Abiti.** Testo: "molto semplicemente vestito" (cap. 2 r. 148-149); un pesante bastone (cap. 4
  r. 28). Quando la trasformazione lo coglie con gli abiti di Jekyll: stoffa ricca e sobria, enormemente
  troppo grande: pantaloni cadenti e rimboccati, vita della giacca sotto i fianchi, colletto largo sulle
  spalle (cap. 9 r. 153-158; cap. 8 r. 353-354; cap. 10 r. 427-428, 476). Scelta di disegno per i
  capitoli 1-4: abiti scuri, semplici, senza dettagli che lo rendano riconoscibile; un cilindro semplice da
  gentiluomo va bene (cap. 9: abiti "ricchi e sobri"); mai un cappello o un accessorio "da cattivo".
- **Regola di disegno.** Nessuna malformazione precisa (gobba, cicatrice, zanne ecc.): il testo la
  esclude ("no nameable malformation"). L'effetto va reso con postura, piccolezza, movimento e reazione
  degli altri.
- **Modo di parlare.** Freddo, sprezzante, da "gentleman" ("No gentleman but wishes to avoid a scene…
  Name your figure", D01.3.4-5); secco ("That is my name. What do you want?", D02.5.2); rabbia improvvisa,
  "risata ringhiante" (cap. 2 r. 204); con Lanyon civile, colto e ornato ma vicino all'isteria (D09.5.3,
  D09.6.1, D09.6.3). Dà del Lei agli sconosciuti, del voi a un gruppo (D01.3.3-5).
- **Carattere.** "Puro male" (cap. 10 r. 142-143); egocentrico, crudele, "implacabile come un uomo di
  pietra" (cap. 10 r. 205-211); lucido e astuto nel pericolo (cap. 10 r. 434-438); terrore della forca
  (cap. 10 r. 538-539); odia Jekyll (cap. 10 r. 537-546).
- **Come cambia.** Cap. 1-2: freddo e sprezzante. Cap. 4: assassino furioso. Cap. 5-6: scomparso.
  Cap. 8: voce che implora (D08.9.3), poi cadavere contorto con abiti troppo grandi e una fiala schiacciata
  (r. 351-358). Cap. 9: impaziente, poi trionfante. Cap. 10: sempre più forte mentre Jekyll si indebolisce
  (r. 522-524).
- **Nome a schermo.** Nel cap. 1 il nome arriva solo a r. 191; nel cap. 9 Lanyon non lo conosce fino a
  r. 269: in quelle scene è "l'ometto" / "lo sconosciuto".

#### `lanyon` — Hastie Lanyon
- **Nome.** "Hastie Lanyon" (cap. 9 r. 272); medico di Cavendish Square con molti pazienti (cap. 2
  r. 37-38); compagno di scuola e college di Utterson (cap. 2 r. 48-50) e di scuola di Jekyll (cap. 9
  r. 4).
- **Aspetto (testo).** Cap. 2: cordiale, sano, elegante ("dapper"), dal viso rosso, con una zazzera di
  capelli prematuramente bianchi, modi rumorosi e decisi (r. 43-45). Cap. 6: l'uomo roseo è pallido, la
  carne calata, visibilmente più calvo e più vecchio; la condanna a morte "scritta sul volto"; sguardo di
  terrore profondo (r. 37-42).
- **Abiti.** Scelta di disegno: abiti curati e alla moda (coerente con "dapper"): redingote ben tagliata,
  panciotto chiaro, cravatta annodata con cura. Nel cap. 6 gli stessi abiti più larghi sul corpo smagrito
  (scelta di disegno).
- **Modo di parlare.** Franco e teatrale, ride sommesso (cap. 2 r. 59), si accende sulle idee di Jekyll
  ("unscientific balderdash", D02.2.4); nel cap. 6 voce alta e malferma, frasi drammatiche ("for God's
  sake… in God's name, go", D06.3.9); con lo sconosciuto del cap. 9 freddo, ironico, prudente (D09.6.2).
- **Carattere.** Razionale e scettico, legato alle "vedute più anguste e materiali" secondo Hyde (D09.6.3);
  onorevole (si sente obbligato verso l'amico, cap. 9 r. 79-82); curioso abbastanza da voler "vedere la
  fine".
- **Come cambia.** Cap. 2: in salute. Cap. 6 (dopo il 9 gennaio): morente, rifiuta di sentir parlare di
  Jekyll; una settimana dopo si mette a letto e in meno di quindici giorni muore (r. 98-99). Cap. 9: la
  sua dichiarazione scritta "quattro giorni" dopo i fatti (r. 3), senza sonno, "morirò incredulo"
  (r. 261-264).

#### `poole` — Poole
- **Aspetto (testo).** Servitore anziano e ben vestito (cap. 2 r. 234-235). Cap. 8: viso bianco, voce
  aspra e spezzata, si toglie il cappello e si asciuga la fronte con un fazzoletto rosso (r. 58-63);
  sudore freddo, non guarda negli occhi (r. 24-28).
- **Abiti.** Testo: cappello e fazzoletto rosso (cap. 8 r. 59-60). Scelta di disegno: abito nero da
  maggiordomo, camicia bianca, cravatta nera; fuori casa cappotto scuro e bombetta.
- **Modo di parlare.** Rispettoso ("Mr. Utterson, sir"), frasi semplici; nel cap. 8 espressioni popolari
  ("bitter bad", "hand of write", "bible-word", "made away with") e immagini forti ("put your heart in
  your ears", D08.8.1). Dà del Lei a Utterson e al padrone.
- **Carattere.** Leale, riservato, esegue gli ordini (D02.8.4); nel cap. 8 coraggioso e determinato
  (propone ascia e piano, D08.6.9).
- **Come cambia.** Cap. 2, 5, 6: cortese, laconico, ripete i rifiuti. Cap. 8: terrorizzato da una
  settimana, poi sollevato quando Utterson lo segue (r. 43-45).

#### `guest` — il signor Guest
- **Aspetto.** Non descritto. Scelta di disegno: abito scuro da impiegato, sobrio.
- **Parlare e carattere.** Primo impiegato ("head clerk") di Utterson, "uomo di consiglio", grande
  studioso e critico di grafie (cap. 5 r. 129-138); rispettoso ("sir"), conciso; si illumina davanti a un
  autografo (cap. 5 r. 150-151); discreto (D05.4.15). Utterson gli dà del Lei.

#### `carew` — Sir Danvers Carew
- **Aspetto (testo).** "Aged beautiful gentleman with white hair" (cap. 4 r. 15-16); modi di "very pretty
  manner of politeness" (r. 19); al chiaro di luna il volto respira una gentilezza ingenua e all'antica,
  con qualcosa di elevato (r. 22-25). Deputato ("M.P.", cap. 5 r. 108); uomo di alto rango (cap. 4 r. 4-5),
  "in alta stima pubblica" (cap. 10 r. 389-390); cliente di Utterson (cap. 5 r. 34).
- **Abiti.** Scelta di disegno: abito scuro da gentiluomo, soprabito, cilindro; porta una lettera da
  imbucare (cap. 4 r. 47-49).
- **Parlare.** Nessuna battuta diretta: le sue parole a Hyde non sono riportate.

#### `newcomen` — ispettore Newcomen
- **Aspetto.** Non descritto. Scelta di disegno: abiti civili scuri, soprabito, bombetta.
- **Parlare e carattere.** Ambizioso nel mestiere (cap. 4 r. 63), colloquiale ("He don't seem…",
  D04.6.4), sicuro di sé ("I have him in my hand", D04.7.1). Nel cap. 4 è prima solo "the officer":
  l'identità è dedotta (cap. 4 r. 78-79, 94-97, 119-120).

#### `narrator` — voce narrante
Narratore in terza persona dei cap. 1-8; non compare nei cap. 9-10 (narrano Lanyon e Jekyll). Nessuna
immagine.

#### Personaggi minori
- `girl` — bambina di "otto o dieci anni" che corre a una traversa; calpestata, più spaventata che ferita
  (cap. 1 r. 85-86, 97-98); nel cap. 10 è solo "un bambino" (r. 223). Abiti: scelta di disegno (abitino e
  scialle da bambina povera). Non parla.
- `doctor_sawbones` — speziale "senza età né colore", forte accento di Edimburgo, "emotivo quanto una
  cornamusa"; diventa livido dalla voglia di uccidere Hyde (cap. 1 r. 102-106). Non parla.
- `girl_family` — la famiglia della bambina: il padre (cap. 1 r. 135) e le donne "furiose come arpie"
  (r. 112-113). Non parlano.
- `lanyon_butler` — maggiordomo "solenne" di Lanyon; conosce Utterson (cap. 2 r. 41-43). Non parla.
- `cronies` — cinque o sei vecchi amici di Jekyll, "uomini intelligenti e rispettabili" e buoni giudici di
  vino; alcuni "allegri e chiacchieroni" (cap. 3 r. 3-10). Nessun nome, nessuna battuta.
- `maid` — cameriera che vive sola in una casa vicino al fiume, di indole romantica; racconta poi il fatto
  piangendo (cap. 4 r. 5-14); aveva antipatia per Hyde, visto una volta in casa del suo padrone (r. 25-28);
  sviene (r. 38). Aspetto non scritto (scelta di disegno: cuffia e grembiule da cameriera, camicia da
  notte o scialle perché sta andando a letto). Nessuna battuta diretta.
- `soho_housekeeper` — cap. 4: vecchia dal volto d'avorio e dai capelli argentei, faccia cattiva
  "lisciata dall'ipocrisia" ma modi eccellenti (r. 109-110); "gioia odiosa" alla notizia dei guai di Hyde
  (r. 122). Cap. 10: governante "silenziosa e senza scrupoli" assunta da Jekyll per la casa di Soho
  (r. 178-180). Che siano la stessa donna è dedotto (vive sola nella casa di Hyde, cap. 4 r. 129-130).
  Dà del Lei a Utterson.
- `utterson_servant` — domestico di casa Utterson che porta il biglietto di Jekyll (cap. 5 r. 155).
  Non parla.
- `newsboys` — strilloni rochi a forza di gridare (cap. 5 r. 106-108); numero non detto.
- `bradshaw` — valletto ("footman"); "molto bianco e nervoso" (cap. 8 r. 276); nel cap. 10 vede Hyde in
  casa a un'ora strana e si ritrae (r. 270-271). Scelta di disegno: livrea scura da valletto. Non parla.
- `cook` — cuoca; corre verso Utterson gridando di sollievo (cap. 8 r. 80-81). Scelta di disegno:
  grembiule, cuffia.
- `housemaid` — cameriera di casa ("housemaid", "the girl"); pianto isterico, zittita da Poole (cap. 8
  r. 79, 88-92). Scelta di disegno: cuffia e grembiule.
- `knife_boy` — ragazzo addetto ai coltelli; porta la candela (cap. 8 r. 95-96); probabilmente il "boy"
  mandato con Bradshaw (r. 283, dedotto).
- `jekyll_servants` — i domestici, uomini e donne, ammassati nell'atrio "come un gregge di pecore"
  (cap. 8 r. 76-78); avvertiti che Hyde ha "piena libertà e potere" (cap. 10 r. 180-182); include il
  domestico che apre con la catena e chiede "Is that you, Poole?" (cap. 8 r. 70-72). Tra domestici ci si
  dà del tu.
- `locksmith` — fabbro "abile", quasi disperato davanti alla porta, la apre in due ore (cap. 9 r. 86,
  91-93).
- `carpenter` — falegname: forzare la porta costerebbe molta fatica e danni (cap. 9 r. 86, 89-91).
- `policeman` — poliziotto in ronda con la lanterna aperta ("bull's eye open") (cap. 9 r. 132-133).
- `denman` — "old Dr. Denman", solo nominato come proprietario dell'anfiteatro anatomico (cap. 9 r. 87-88);
  probabilmente il "celebre chirurgo" dai cui eredi Jekyll comprò la casa (cap. 5 r. 7-8) (dedotto).
- `cab_driver` — vetturino dell'hansom: ride dell'aspetto di Hyde, poi impallidisce (cap. 10 r. 454-459).
- `inn_waiter` — cameriere e inservienti dell'albergo di Portland Street: tremano, servili (cap. 10
  r. 459-471).
- `street_woman` — donna che di notte offre a Hyde, "credo", una scatola di fiammiferi e viene colpita al
  volto (cap. 10 r. 481-482).

---

## 2. Luoghi

Per ogni luogo: aspetto visivo dal testo, poi capitoli e scene.

### Londra e le strade
- `loc_by_street` — **la stradina laterale con la porta.** Stradina in un quartiere affollato, piccola,
  "quieta", molto commerciale nei giorni feriali; botteghe come "file di commesse sorridenti"; imposte
  appena dipinte, ottoni lucidi, pulizia; di domenica, vuota, risalta nel vicinato squallido "come un fuoco
  in una foresta" (cap. 1 r. 40-51). A due porte da un angolo, sul lato sinistro andando verso est, la fila
  è interrotta dall'ingresso di un cortile; lì un blocco sinistro spinge il frontone sulla strada: due
  piani, nessuna finestra, una porta al pianterreno e sopra una fronte cieca di muro scolorito; segni di
  lunga incuria (cap. 1 r. 53-58). La porta (`obj_laboratory_door`) è senza campanello né battente
  (r. 58-64). Di notte: negozi chiusi alle dieci, via solitaria e silenziosa, i passi si sentono da
  lontano; notte secca e gelida, strade pulite "come il pavimento di una sala da ballo", lampioni immobili
  che disegnano luce e ombra; Utterson si nasconde nell'ingresso del cortile (cap. 2 r. 121-152).
  Nota: il blocco è il retro del laboratorio di Jekyll; il libro lo lascia capire nel cap. 2 (Utterson:
  "old dissecting room door", r. 256; Poole: Hyde entra "by the laboratory", r. 272), lo dice nel cap. 7
  (Enfield, r. 14-15) e nel cap. 8 (il corridoio unisce l'anfiteatro "alla porta sulla stradina",
  r. 366-367). Scene: S 01.2-01.7, S 02.4-02.6, S 07.1, S 07.3, S 10.7, S 10.8; citata in S 08.7
  (Bradshaw di guardia alla porta).
- `loc_lamplit_streets` — **le strade dei lampioni (racconto di Enfield).** Verso le tre di una nera
  mattina d'inverno, "nient'altro che lampioni", strada dopo strada illuminate "come per una processione"
  e vuote "come una chiesa"; una traversa e un angolo (cap. 1 r. 77-91). Torna nelle visioni insonni di
  Utterson (cap. 2 r. 91-97, non è un evento). Scena: S 01.3.
- `loc_enfield_chambers` — **le stanze di Enfield.** Non descritte; vi si passa il resto della notte
  (cap. 1 r. 135-137). Scena: S 01.3.
- `loc_bank` — **la banca dell'assegno.** Non descritta (cap. 1 r. 136-139); l'assegno era "su Coutts's"
  (r. 124), ma che sia la stessa banca non è scritto. Non è la banca del conto di Hyde del cap. 4 (r. 142-144),
  che è "un'altra banca" (cap. 10 r. 229-230). Scena: S 01.3.
- `loc_london_streets` — **strade di Londra (generico).** Nebbia del tardo pomeriggio, strilloni; di sera
  la città "annegata" nella nebbia, lampioni come carbonchi, traffico come un vento potente (cap. 5
  r. 106-108, 119-123). Notte di marzo selvaggia e fredda, luna pallida "sdraiata sulla schiena", nuvole
  sfilacciate, vento che fa lacrimare, strade deserte (cap. 8 r. 47-55). Strade illuminate dai lampioni,
  vie meno frequentate, passanti notturni (cap. 10 r. 364, 471-481). Scene: S 05.3, S 06.1, S 08.2,
  S 10.7, S 10.12 (dedotto), S 10.13, S 10.19.
- `loc_thoroughfare` — **la via vicina alla stradina.** Anche di domenica c'è un po' di vita (cap. 7
  r. 54-57). Scena: S 07.3.
- `loc_carew_lane` — **il vicolo dell'omicidio.** Vicolo non lontano dal fiume; prima parte della notte
  senza nubi, luna piena che lo illumina "brillantemente"; nelle ore piccole scende la nebbia; selciato e
  grondaia (cap. 4 r. 5-10, 36-37, 40-46). Nome non dato. Scene: S 04.1, S 04.2.
- `loc_maid_room` — **la camera della cameriera.** Al piano di sopra, finestra sul vicolo; sotto la
  finestra la sua cassa (`obj_maid_box`); luce di luna (cap. 4 r. 5-12, 18). Scena: S 04.1.
- `loc_police_station` — **la stazione di polizia.** Una cella dove è stato portato il corpo; nient'altro
  (cap. 4 r. 56-57). Scena: S 04.4.
- `loc_soho_street` — **Soho nella nebbia.** Circa le nove del mattino, prima nebbia della stagione: velo
  color cioccolato, zone buie "come il fondo della sera" e bagliori bruni e lividi; vie fangose, passanti
  sciatti, lampioni accesi; la via di Hyde: una gin palace, una trattoria francese di basso rango, una
  bottega di fascicoli da un penny e insalate da due penny, bambini cenciosi sulle soglie, donne di molte
  nazionalità con la chiave in mano per il bicchiere del mattino (cap. 4 r. 81-105). Scene: S 04.5, S 04.6.
- `loc_regents_park` — **Regent's Park.** Giornata limpida di gennaio, terreno bagnato dove il gelo si è
  sciolto, nessuna nuvola, cinguettii invernali e odori di primavera; una panchina al sole (cap. 10
  r. 414-417). Scene: S 10.16, S 10.17.
- `loc_hansom_cab` — **la carrozza di Hyde.** Un hansom fermato per strada, poi una "carrozza chiusa" la
  sera (cap. 10 r. 452-459, 471-475). Scene: S 10.18, S 10.19.
- `loc_portland_street_hotel` — **l'albergo di Portland Street.** Una stanza privata con il fuoco, dove
  Hyde scrive e pranza da solo (cap. 10 r. 453-470). Scene: S 10.18, S 10.19.

### Casa di Utterson
- `loc_utterson_house` — **la casa da scapolo di Utterson (stanza del focolare).** La sera cena e siede
  accanto al fuoco con un libro di teologia (cap. 2 r. 3-9); un lato del focolare per lui, l'altro per
  Guest, una bottiglia di vecchio vino a distanza calcolata dal fuoco, stanza "allegra di luce di fuoco"
  mentre fuori c'è nebbia (cap. 5 r. 116-128); vi siede dopo cena quando arriva Poole (cap. 8 r. 3-4).
  Il testo non nomina la stanza. Scene: S 02.1 (inizio), S 05.4, S 05.5, S 06.4, S 08.1.
- `loc_utterson_study` — **la stanza degli affari ("business room").** Di notte, una sola candela; una
  cassaforte con una parte "più privata" (cap. 2 r. 9-12); porta chiusa a chiave, candela "malinconica",
  l'angolo più interno della cassaforte (cap. 6 r. 100-103, 119-120). È nella casa (cap. 2 r. 3-9).
  Scene: S 02.1, S 06.5.
- `loc_utterson_bedroom` — **la camera da letto.** Grande letto buio, buio fitto; le campane della chiesa
  vicina suonano le sei (cap. 2 r. 81-91); la mattina dopo l'omicidio è ancora a letto (cap. 4 r. 51-52).
  Scene: S 02.3, S 04.3.
- `loc_utterson_office` — **l'"office" di Utterson.** Solo nominato: vi torna a leggere i due racconti
  (cap. 8 r. 482), dopo aver detto "devo tornare a casa" (r. 476). Che coincida con `loc_utterson_study`
  non è scritto. Scena: S 08.14.

### Casa di Lanyon
- `loc_cavendish_square` — **Cavendish Square e il portico di Lanyon.** La piazza, "cittadella della
  medicina" (cap. 2 r. 36-38); a mezzanotte buia, un poliziotto con la lanterna (cap. 9 r. 132-133); la
  casa di Lanyon ha un portico a pilastri e una porta con battente (cap. 9 r. 124-126). Scene: S 02.1
  (fine), S 09.4.
- `loc_lanyon_house` — **la casa di Lanyon (stanza non detta).** Utterson vi è ammesso (cap. 2 r. 41;
  cap. 6 r. 33-35); Lanyon vi riceve la lettera "a tavola" e manda a letto i domestici (cap. 9 r. 82-83,
  121); "da Lanyon" Jekyll torna in sé (cap. 10 r. 484). Dove Lanyon si metta a letto e muoia non è
  scritto. Scene: S 06.3, S 06.5 (morte, fuori scena), S 09.1, S 09.3, S 10.20.
- `loc_lanyon_dining_room` — **la sala da pranzo di Lanyon.** Lanyon siede solo davanti al suo vino
  (cap. 2 r. 41-43). Scena: S 02.2.
- `loc_lanyon_consulting_room` — **lo studio medico di Lanyon.** Stanza ben illuminata (cap. 9 r. 137); un
  tavolo, dietro il quale sul pavimento sta il cassetto coperto da un lenzuolo (r. 194-195); la sedia
  abituale di Lanyon (r. 178); un muro contro cui Lanyon si getta (r. 250-252). Scene: S 09.3-09.8;
  S 10.20 (dedotto).

### Casa e laboratorio di Jekyll
Pianta che il testo permette: la casa dà sulla piazza; dietro, un cortile un tempo giardino; in fondo il
blocco del laboratorio (anfiteatro al pianterreno, studio al piano superiore a un'estremità), il cui retro
dà sulla stradina (cap. 5 r. 3-10; cap. 8 r. 364-369; cap. 10 r. 262-264).
- `loc_jekyll_square` — **la piazza e la facciata della casa.** Piazza di case antiche e belle, per lo più
  decadute e divise in appartamenti e studi (incisori di mappe, architetti, avvocati dubbi, agenti di
  imprese oscure); la casa di Jekyll è la seconda dall'angolo, l'unica occupata per intero, con "un grande
  aspetto di ricchezza e comodità", buia tranne la lunetta sopra la porta (`obj_fanlight_jekyll_house`);
  dietro l'angolo rispetto alla stradina (cap. 2 r. 227-235). Di notte a marzo: vento e polvere, alberelli
  sottili del giardino che sferzano la ringhiera (cap. 8 r. 56-58). Nome della piazza non dato. Scene:
  S 02.7, S 02.9, S 08.2; la soglia dove Utterson parla con Poole (cap. 6 r. 127-128, in S 06.6).
- `loc_jekyll_house` — **la casa di Jekyll (stanza non detta).** La cena con i vecchi amici e i due lati
  del fuoco (cap. 3 r. 3-16); gli "uffici di cucina" attraversati verso il cortile e l'uscita (cap. 5
  r. 3-5, 98); la cena dell'8 gennaio e la porta chiusa (cap. 6 r. 24-29); la "casa di volontaria
  prigionia" (cap. 6 r. 129); dove Poole attende Lanyon (cap. 9 r. 83-87). La casa fu comprata dagli eredi
  di un celebre chirurgo (cap. 5 r. 7-8). Scene: S 03.1-03.3, S 05.1, S 05.3, S 06.2, S 06.6, S 09.2.
- `loc_jekyll_hall` — **l'atrio.** Grande, basso di soffitto, comodo, pavimento di lastre di pietra,
  scaldato da un vivace fuoco aperto "come in una casa di campagna", costosi mobili di quercia, alto
  parafuoco; il fuoco tremola sui mobili lucidi, l'ombra sussulta sul soffitto; "la stanza più piacevole di
  Londra" per Utterson (cap. 2 r. 239-254). Cap. 8: illuminatissimo, fuoco alto, i domestici ammassati
  davanti al camino; porta d'ingresso con la catena; una porta interna sul fondo (r. 70-78, 94). Scene:
  S 02.7, S 02.8, S 08.3, S 08.14.
- `loc_jekyll_dining_room` — **la sala da pranzo.** Citata da Poole (cap. 2 r. 242-243) e da Jekyll, che
  da lì sente gli strilloni nella piazza (cap. 5 r. 32); la colazione (cap. 10 r. 273-274); "la tavola
  apparecchiata per me nella sala da pranzo" (cap. 10 r. 430-431). Non descritta. Scene: S 10.9, S 10.10.
- `loc_jekyll_kitchen` — **la cucina.** "Uffici di cucina" attraversati per andare al laboratorio (cap. 5
  r. 4); grande cucina con il fuoco spento, scarafaggi che saltano sul pavimento, luce di candela,
  l'attizzatoio (cap. 8 r. 120-121, 234). Scene: S 05.1 (passaggio), S 08.5-08.7.
- `loc_jekyll_house_interior` — **corridoi e scale della casa.** "Due rampe di scale", il corridoio di
  servizio ("back passage"), corridoi percorsi di notte mentre tutti dormono (cap. 10 r. 113-119,
  262-264). Scene: S 10.4, S 10.6, S 10.9, S 10.15.
- `loc_jekyll_bedroom` — **la camera da letto di Jekyll.** Mobili "decenti", proporzioni alte, tende del
  letto a disegno, telaio di mogano; luce gialla di un mattino di "mezza Londra"; uno specchio (cap. 10
  r. 120, 237-239, 249, 257). Scene: S 10.4, S 10.9, S 10.20.
- `loc_jekyll_court` — **il cortile.** Un solo spazio che il libro chiama "court" e "yard". Cap. 1: sul
  cortile, al primo piano, tre finestre sempre chiuse ma pulite, nessuna sotto; un camino che fuma; edifici
  così addossati che non si capisce dove finisca l'uno (r. 53-54, 175-180). Cap. 5: "un cortile che un
  tempo era un giardino", tra casa e laboratorio; lo studio vi si affaccia con tre finestre (r. 5-6,
  20-21). Cap. 7: fresco, un po' umido, pieno di crepuscolo prematuro mentre il cielo in alto è ancora
  luminoso di tramonto; la finestra di mezzo socchiusa (r. 23-27). Cap. 8: buio, "profondo pozzo di
  edifici" dove il vento entra a folate e agita la candela (r. 288-292). Cap. 10: sotto le costellazioni
  (r. 115-118), "il cortile aperto" (r. 263), aria fredda del mattino (r. 500-501). Nota: nel cap. 10
  "yard" (r. 116) e "court" (r. 263, 500) indicano lo stesso passaggio tra casa e laboratorio; nei cap. 1,
  2 e 7 al cortile si accede dalla stradina. Il testo non spiega come le due cose stiano insieme (vedi
  Questioni aperte). Scene: S 01.2, S 01.5 (descritto da fuori), S 05.1, S 07.2, S 08.4, S 08.7, S 08.8,
  S 10.4, S 10.9, S 10.21.
- `loc_laboratory_theatre` — **l'anfiteatro anatomico (laboratorio).** Edificio basso, sporco, senza
  finestre, noto come "laboratorio o sale di dissezione"; dentro, l'anfiteatro un tempo affollato di
  studenti, ora scarno e silenzioso: tavoli carichi di apparecchi chimici, pavimento con casse e paglia da
  imballaggio, luce fioca da un lucernario a cupola velato di nebbia; in fondo una scala sale a una porta
  di panno rosso (cap. 5 r. 6-18). Casse e bottiglie accatastate, l'ascia sotto la paglia, un tavolo per
  la candela (cap. 8 r. 106-108, 317-319); occupa quasi tutto il pianterreno ed è illuminato dall'alto
  (cap. 8 r. 364-365). Nota: è lo stesso "anfiteatro chirurgico del vecchio dottor Denman" da cui si entra
  nello studio (cap. 9 r. 87-89) e il "teatro anatomico" del cap. 10 (r. 263-264). Scene: S 05.1, S 08.4,
  S 08.8, S 08.9, S 08.14, S 09.2, S 10.9 (percorso).
- `loc_laboratory_corridor` — **il corridoio verso la stradina.** Corridoio di lastre che unisce
  l'anfiteatro alla porta sulla stradina; lo studio vi comunica con una seconda scala; accanto alla porta
  chiusa, a terra, la chiave rotta (cap. 8 r. 366-368, 379-384). Scena: S 08.11.
- `loc_laboratory_cellar` — **ripostigli e cantina.** Ripostigli bui, vuoti, polverosi, chiusi da anni;
  cantina spaziosa piena di ciarpame dei tempi del chirurgo, ingresso sigillato da una fitta ragnatela
  (cap. 8 r. 369-377). Scena: S 08.11.
- `loc_jekyll_cabinet` — **lo studio di Jekyll ("cabinet").** Piano superiore a un'estremità del
  laboratorio, sul cortile (cap. 8 r. 365-366); porta coperta di panno rosso (cap. 5 r. 17-18; cap. 8
  r. 110), molto robusta, serratura eccellente (cap. 9 r. 89-90). Stanza ampia con armadi a vetri tutto
  intorno, uno specchio a bilico, un tavolo da lavoro, tre finestre impolverate con inferriate sul cortile,
  fuoco nel camino, lampada accesa sulla mensola (cap. 5 r. 18-26). Cap. 8: luce di lampada, fuoco che
  scoppietta, bollitore che canta, cassetti aperti, carte in ordine sul tavolo, le cose per il tè accanto
  alla poltrona, armadi a vetri pieni di sostanze chimiche, una libreria, il tappeto; lo specchio girato
  verso il soffitto rosato (r. 342-349, 405-417). Cap. 9: l'armadio a vetri E sulla sinistra (r. 31, 93).
  Cap. 10: gli armadi delle droghe (r. 438), il camino (r. 506), "l'ultimo rifugio terreno" (r. 582).
  Jekyll a volte vi dorme (cap. 6 r. 131-133). Nota: è la stanza delle tre finestre viste da Enfield
  (cap. 1) e della finestra del cap. 7 (dedotto dal numero delle finestre e dall'affaccio). Scene: S 05.1,
  S 05.2, S 07.2 (vista da fuori), S 08.4, S 08.9-08.13, S 09.2, S 10.1-10.3, S 10.5, S 10.7, S 10.10,
  S 10.11, S 10.14, S 10.21-10.25.

### Casa di Hyde a Soho
- `loc_hyde_house` — **la casa di Soho.** La porta aperta dalla vecchia; la casa, salvo lei, è vuota
  (cap. 4 r. 99-115, 129-130); presa e ammobiliata da Jekyll, dove Hyde dorme in una "stanzetta" (cap. 10
  r. 177-178, 241-242); Hyde vi distrugge le carte la notte dell'omicidio (cap. 10 r. 362-363). Scene:
  S 04.6, S 10.6, S 10.13.
- `loc_hyde_rooms` — **le stanze di Hyde.** Un paio di stanze arredate con lusso e buon gusto: armadietto
  pieno di vino, argenteria, biancheria elegante, un bel quadro, tappeti a più strati dai colori gradevoli;
  dopo la fuga: abiti per terra con le tasche rovesciate, cassetti aperti, cenere grigia di carte sul
  focolare (cap. 4 r. 129-141). Scena: S 04.7.

---

## 3. Oggetti

- `obj_laboratory_door` — la porta del laboratorio sulla stradina: senza campanello né battente,
  screpolata e macchiata (cap. 1 r. 58-64); "Black Mail House" per Enfield; "old dissecting room door" per
  Utterson (cap. 2 r. 256); "back way to Dr. Jekyll's" (cap. 7 r. 15); Jekyll la chiude a chiave dopo
  l'omicidio (cap. 10 r. 383-386); chiusa nell'ultima notte (cap. 8 r. 382-383). Cap. 1, 2, 5, 7, 8, 10.
- `obj_laboratory_door_key` — la chiave di quella porta: Hyde la usa (cap. 1 r. 123, 217-218; cap. 2
  r. 152, 205, 259-260); Jekyll la schiaccia sotto il tallone (cap. 10 r. 384-386); trovata a terra, rotta e
  arrugginita anche nelle fratture (cap. 8 r. 383-391). Che la chiave rotta sia quella di Hyde si capisce
  solo dal cap. 10. Cap. 1, 2, 8, 10.
- `obj_cheque_coutts` — assegno su Coutts's, pagabile al portatore, per il saldo di cento sterline,
  firmato con un nome notissimo che Enfield non dice; autentico (cap. 1 r. 123-139); firmato "Henry Jekyll"
  (cap. 10 r. 227-229). Cap. 1, 10.
- `obj_gold_ten_pounds` — circa dieci sterline in oro portate fuori dalla porta (cap. 1 r. 123-124).
  Cap. 1.
- `obj_enfield_cane` — il bastone con cui Enfield indica la porta (cap. 1 r. 67). Cap. 1.
- `obj_jekyll_will` — testamento olografo in una busta "Dr. Jekyll's Will": tutto a Edward Hyde, che
  subentra anche in caso di scomparsa o assenza inspiegata oltre tre mesi (cap. 2 r. 10-22); Utterson non
  l'ha mai approvato (cap. 3); Hyde ne dettò le condizioni sulla scomparsa (cap. 5 r. 84-89); Utterson lo
  ha restituito al suo autore (cap. 6 r. 111; "sei mesi prima" dell'ultima notte, cap. 8 r. 432-433);
  scritto perché Hyde subentrasse senza perdite (cap. 10 r. 183-186). Cap. 2, 3, 5, 6, 8, 10.
- `obj_new_will` — il nuovo testamento trovato nello studio, negli stessi termini ma con Gabriel John
  Utterson al posto di Hyde; testamento in caso di morte, atto di donazione in caso di scomparsa (cap. 8
  r. 431-437). Cap. 8.
- `obj_utterson_safe` — la cassaforte nella stanza degli affari di Utterson, con una parte più privata:
  vi stanno il testamento (cap. 2 r. 10-11), il biglietto di Jekyll (cap. 5 r. 183-184), il plico di Lanyon
  (cap. 6 r. 119-120). Cap. 2, 5, 6.
- `obj_fanlight_jekyll_house` — la lunetta sopra la porta di casa Jekyll, unica luce nella piazza (cap. 2
  r. 233-234). Cap. 2.
- `obj_hyde_address` — l'indirizzo che Hyde dà a Utterson: "il numero di una strada di Soho"; strada e
  numero non sono scritti (cap. 2 r. 181). Cap. 2.
- `obj_hyde_cane` — pesante bastone di legno raro, tenace e pesante, regalato molti anni prima da
  Utterson a Jekyll; Hyde lo spezza su Carew; una metà nella grondaia, l'altra dietro la porta delle sue
  stanze (cap. 4 r. 28, 42-46, 69-71, 140-141). Cap. 4.
- `obj_carew_envelope` — busta sigillata e affrancata trovata su Carew, indirizzata a Utterson; contenuto
  non detto (cap. 4 r. 47-49). Cap. 4.
- `obj_purse_watch` — borsa e orologio d'oro trovati sul morto: non fu un furto (cap. 4 r. 46-47). Cap. 4.
- `obj_chequebook` — moncone di un libretto degli assegni verde salvato dalla cenere nel camino di Hyde
  (cap. 4 r. 138-141). Cap. 4.
- `obj_soho_papers` — le carte di Hyde a Soho: bruciate, mucchio di cenere grigia sul focolare (cap. 4
  r. 138-139); Hyde le distrugge "per essere doppiamente sicuro" (cap. 10 r. 362-363). Cap. 4, 10.
- `obj_soho_picture` — il bel quadro nelle stanze di Hyde, dono di Jekyll "come Utterson suppone" (cap. 4
  r. 132-134). Cap. 4.
- `obj_maid_box` — la cassa della cameriera sotto la finestra (cap. 4 r. 11). Cap. 4.
- `obj_hyde_letter` — lettera firmata "Edward Hyde", grafia strana e diritta: Jekyll non deve temere per
  lo scrivente, che ha mezzi di fuga sicuri; testo riportato solo in sintesi (cap. 5 r. 50-53, 66-72,
  148-153). Cap. 5.
- `obj_hyde_letter_envelope` — la busta di quella lettera, bruciata da Jekyll; nessun timbro postale
  (cap. 5 r. 74-77). Cap. 5.
- `obj_jekyll_dinner_note` — biglietto di Jekyll a Utterson ("solo un invito a cena" secondo Utterson);
  grafia quasi identica a quella di Hyde, solo inclinata diversamente; chiuso in cassaforte (cap. 5
  r. 155-172, 182-184). Cap. 5.
- `obj_cheval_glass` — lo specchio a bilico dello studio (cap. 5 r. 20); girato verso il soffitto, "ne ha
  viste di strane" (cap. 8 r. 412-426); portato nello studio dopo la prima trasformazione apposta per le
  trasformazioni (cap. 10 r. 109-111, 569-570). Che sia lo stesso specchio è dedotto. Cap. 5, 8, 10.
- `obj_old_wine` — bottiglia di vecchio vino tenuta nelle fondamenta della casa di Utterson (cap. 5
  r. 117-119). Cap. 5.
- `obj_lanyon_envelope` — busta esterna sigillata da Lanyon: "PRIVATE: for the hands of G. J. Utterson
  ALONE…" (cap. 6 r. 101-108). Cap. 6.
- `obj_lanyon_narrative` — il plico interno, "da non aprire fino alla morte o alla scomparsa del dottor
  Henry Jekyll" (cap. 6 r. 108-120); contiene la dichiarazione di Lanyon firmata "HASTIE LANYON" (cap. 9);
  Jekyll lo chiama "the narrative which Lanyon warned me he was to place in your hands" (cap. 8 r. 462-463).
  Cap. 6, 8, 9.
- `obj_jekyll_seclusion_letter` — lunga lettera di Jekyll a Utterson, patetica e oscura: vivrà in estrema
  reclusione (cap. 6 r. 78-89; D06.4.1). Cap. 6.
- `obj_cabinet_window` — la finestra di mezzo delle tre dello studio sul cortile; socchiusa, poi abbassata
  di colpo (cap. 7 r. 25-27, 51-52). Cap. 1 (le tre finestre), 5, 7.
- `obj_cabinet_door` — la porta dello studio, coperta di panno rosso, robusta, con serratura eccellente;
  forzata dal fabbro per Lanyon (cap. 9 r. 89-93); sfondata con l'ascia al quinto colpo (cap. 8
  r. 334-340). Cap. 5, 8, 9.
- `obj_candle` — la candela di Poole nell'ultima notte (cap. 8 r. 95-96, 108, 291, 318-319). Cap. 8.
- `obj_axe` — ascia nascosta sotto la paglia nell'anfiteatro (cap. 8 r. 233, 317-318). Cap. 8.
- `obj_poker` — l'attizzatoio della cucina preso da Utterson (cap. 8 r. 234-238, 288). Cap. 8.
- `obj_drug_note` — biglietto di "Dr. Jekyll" ai signori Maw: campione impuro, cercare la vecchia partita,
  "For God's sake, find me some of the old" (cap. 8 r. 159-177). Cap. 8.
- `obj_orders_papers` — i fogli di ordini gettati sulla scala per una settimana (cap. 8 r. 146-155). Cap. 8.
- `obj_crushed_phial` — fiala schiacciata nella mano di Hyde, forte odore di noccioli (cap. 8 r. 356-358).
  Cap. 8.
- `obj_hyde_clothes` — gli abiti di Jekyll quando li porta Hyde, enormemente troppo grandi (cap. 8
  r. 353-354; cap. 9 r. 153-158; cap. 10 r. 427-428, 476); e gli abiti della misura di Hyde, tenuti pronti
  nello studio (cap. 10 r. 269-270, 325-326). Cap. 8, 9, 10.
- `obj_salt` — il sale, ultimo ingrediente della droga, comprato in grande quantità da una ditta di
  chimici all'ingrosso (cap. 10 r. 86-88); la scorta finisce, la nuova non funziona: Jekyll crede che la
  prima fosse impura (cap. 10 r. 558-565); nell'ultima notte, mucchietti misurati di sale bianco su
  piattini di vetro (cap. 8 r. 397-402). Cap. 8, 10.
- `obj_powders` — le polveri confezionate da Jekyll (sale cristallino bianco) nel cassetto (cap. 9
  r. 97-101); "l'ultima delle vecchie polveri" usata per scrivere la confessione (cap. 10 r. 567-569).
  Cap. 9, 10.
- `obj_red_phial` — fiala mezza piena di liquore rosso sangue, pungente; per Lanyon fosforo ed etere
  (ipotesi) (cap. 9 r. 101-104); la "tintura" preparata da Jekyll (cap. 10 r. 85, dedotto). Cap. 9, 10.
- `obj_potion` — la bevanda: tintura e sale nel vetro, ribolle, fuma, cambia colore due volte; dosi
  doppie o triple quando fallisce (cap. 9 r. 213-219; cap. 10 r. 88-91, 287-291, 504-505, 559-562).
  Cap. 9, 10.
- `obj_kettle` — il bollitore che canta e poi trabocca (cap. 8 r. 345, 403). Cap. 8.
- `obj_tea_things` — le cose per il tè accanto alla poltrona, lo zucchero nella tazza (cap. 8 r. 347,
  405-407). Cap. 8.
- `obj_pious_book` — opera devota stimata da Jekyll, annotata "di suo pugno" con bestemmie (cap. 8
  r. 407-410); il cap. 10 dice che Hyde scriveva bestemmie con la calligrafia di Jekyll sui suoi libri
  (r. 542-544). Cap. 8, 10.
- `obj_jekyll_last_envelope` — grande busta sul tavolo dello studio con il nome di Utterson; contiene il
  nuovo testamento, il biglietto datato e il plico (cap. 8 r. 428-431). Cap. 8.
- `obj_jekyll_last_note` — biglietto datato di Jekyll a Utterson (data non riportata): sarà scomparso;
  leggere prima il racconto di Lanyon, poi la confessione (cap. 8 r. 443-467). Cap. 8.
- `obj_jekyll_confession` — il plico sigillato in più punti (cap. 8 r. 472-474): la "dichiarazione
  completa" di Henry Jekyll, che lui sigilla nell'ultima pagina (cap. 10 r. 567-587). Cap. 8, 10.
- `obj_utterson_watch` — l'orologio con cui Utterson conta i dieci minuti (cap. 8 r. 287). Cap. 8.
- `obj_jekyll_letter_lanyon` — lettera raccomandata a Lanyon datata "10th December, 18—", firmata "H.J.",
  con poscritto, ricevuta la sera del 9 gennaio (cap. 9 r. 3-75); scritta da Hyde con la calligrafia di
  Jekyll all'albergo di Portland Street (cap. 10 r. 447-450, 466-468). Cap. 9, 10.
- `obj_letter_poole` — la raccomandata di istruzioni a Poole, arrivata con la stessa posta (cap. 9
  r. 84-86; cap. 10 r. 466-468). Contenuto non riportato. Cap. 9, 10.
- `obj_glazed_press_e` — l'armadio a vetri segnato E, a sinistra nello studio, non chiuso a chiave (cap. 9
  r. 31, 93). Cap. 9.
- `obj_drawer` — il quarto cassetto dall'alto (terzo dal basso) con polveri, fiala e quaderno, portato
  da Lanyon in un lenzuolo con la paglia (cap. 9 r. 33-38, 93-95, 194-195). Cap. 9.
- `obj_version_book` — quaderno con date di molti anni, finite quasi un anno prima; "double" circa sei
  volte, "total failure!!!" una volta all'inizio (cap. 9 r. 105-111). Cap. 9.
- `obj_revolver` — la vecchia rivoltella che Lanyon carica (cap. 9 r. 121-122). Cap. 9.
- `obj_graduated_glass` — il bicchiere graduato in cui lo sconosciuto prepara e beve la miscela (cap. 9
  r. 207-221, 246). Cap. 9.
- `obj_hyde_account` — il conto in un'altra banca a nome di Edward Hyde, con firma in grafia inclinata
  all'indietro (cap. 10 r. 229-232); vi sono diverse migliaia di sterline (cap. 4 r. 142-144, dedotto che
  sia lo stesso conto). Cap. 4, 10.
- `obj_father_portrait` — il ritratto del padre di Jekyll, distrutto da Hyde (cap. 10 r. 544). Cap. 10.

---

## 4. Tabella di rinomina

Id cambiati nelle schede. "Cap." indica dove compariva il vecchio id.

| vecchio id | cap. | id canonico |
|---|---|---|
| `landlady` | 4 | `soho_housekeeper` |
| `servant` | 5 | `utterson_servant` |
| `servants` | 10 | `jekyll_servants` |
| `servant_voice` | 8 | `jekyll_servants` |
| `cabinet_voice` | 8 | `hyde` |
| `maid` (cameriera di casa Jekyll) | 8 | `housemaid` |
| `loc_door_building` | 1 | `loc_by_street` |
| `loc_court` | 1 | `loc_jekyll_court` |
| `loc_jekyll_yard` | 5, 8 | `loc_jekyll_court` |
| `loc_jekyll_laboratory` | 5 | `loc_laboratory_theatre` |
| `loc_jekyll_anatomical_theatre` | 10 | `loc_laboratory_theatre` |
| `loc_denman_theatre` | 9 | `loc_laboratory_theatre` |
| `loc_cabinet` | 8 | `loc_jekyll_cabinet` |
| `loc_jekyll_house_fireside` | 3 | `loc_jekyll_house` |
| `loc_utterson_house` (Utterson a letto) | 4 | `loc_utterson_bedroom` |
| `loc_london` | 6 | `loc_london_streets` |
| `loc_london_night` | 8 | `loc_london_streets` |
| `loc_soho_house` | 10 | `loc_hyde_house` |
| `loc_lab_door` | 10 | `loc_by_street` (la porta è `obj_laboratory_door`) |
| `obj_door_by_street` | 1, 7 | `obj_laboratory_door` |
| `obj_lab_door` | 5 | `obj_laboratory_door` |
| `obj_door_key` | 1 | `obj_laboratory_door_key` |
| `obj_hyde_key` | 2 | `obj_laboratory_door_key` |
| `obj_broken_key` | 8 | `obj_laboratory_door_key` |
| `obj_lab_door_key` | 10 | `obj_laboratory_door_key` |
| `obj_cheque` | 10 | `obj_cheque_coutts` |
| `obj_will` | 10 | `obj_jekyll_will` |
| `obj_cane` | 4 | `obj_hyde_cane` |
| `obj_envelope` | 4 | `obj_carew_envelope` |
| `obj_envelope` | 8 | `obj_jekyll_last_envelope` |
| `obj_ashes` | 4 | `obj_soho_papers` |
| `obj_picture` | 4 | `obj_soho_picture` |
| `obj_lanyon_packet` | 6 | `obj_lanyon_narrative` |
| `obj_jekyll_letter` | 6 | `obj_jekyll_seclusion_letter` |
| `obj_jekyll_letter` | 8 | `obj_jekyll_last_note` |
| `obj_jekyll_letter` | 9 | `obj_jekyll_letter_lanyon` |
| `obj_court_window` | 7 | `obj_cabinet_window` |
| `obj_white_salt` | 8 | `obj_salt` |
| `obj_sealed_packet` | 8 | `obj_jekyll_confession` |
| `obj_confession` | 10 | `obj_jekyll_confession` |
| `obj_hyde_oversized_clothes` | 9 | `obj_hyde_clothes` |
| `obj_old_powders` | 10 | `obj_powders` |
| `obj_mirror_cabinet` | 10 | `obj_cheval_glass` |
| `obj_letters_lanyon_poole` | 10 | `obj_jekyll_letter_lanyon` + `obj_letter_poole` |

`maid` resta l'id della cameriera testimone del cap. 4; `loc_utterson_house` resta l'id della casa di
Utterson negli altri capitoli.

---

## 5. Glossario di traduzione

### Forme di cortesia (decisioni da applicare in tutte le battute)
- Il Lei di cortesia si scrive con la maiuscola: Lei, La, Le, Suo, Sua, Suoi, Sue, Glielo, anche in
  forma enclitica (parlarLe, vederLa, ringraziarLa, dirGlielo).
- Tra gentiluomini si dà del Lei: Jekyll, Utterson e Lanyon tra loro (anche nelle lettere e quando
  Utterson apostrofa Jekyll assente, D02.6.1); Utterson ed Enfield; Utterson e Guest; Utterson e Newcomen;
  Hyde con Utterson, Enfield e Lanyon; Utterson e Newcomen con la vecchia di Soho.
- I padroni danno del tu ai domestici (Utterson a Poole, Bradshaw, ai domestici: D02.8.3, D08.1.x); a un
  gruppo di domestici "voi" (D08.3.4). I domestici danno del Lei ai padroni e ai loro amici (Poole a
  Utterson e al padrone). Tra domestici ci si dà del tu (D08.3.1).
- A un gruppo misto o ostile si dà del voi (Hyde alla famiglia della bambina, D01.3.3-5).
- La confessione di Jekyll si rivolge a Utterson con il Lei (cap. 10).

### Titoli e nomi
| inglese | italiano | note |
|---|---|---|
| Mr. Utterson | il signor Utterson (in narrazione solo "Utterson") | vocativo "signor Utterson" |
| Dr. Jekyll / Dr. Lanyon | il dottor Jekyll / il dottor Lanyon | "Dr. J." → "il dott. J." (D08.5.7) |
| Sir Danvers Carew | Sir Danvers Carew | invariato |
| Inspector Newcomen | l'ispettore Newcomen | |
| Mr. Guest, Mr. Enfield, Mr. Hyde | il signor Guest, il signor Enfield, il signor Hyde | |
| Master Hyde | il signorino Hyde | tono sprezzante (D02.9.2) |
| Mr. Seek | il signor Seek | gioco di parole hide / seek, non tradotto |
| Harry | Harry | solo Utterson, per Jekyll |
| sir | signore | |
| my good man | mio buon uomo | Utterson a Poole |
| Messrs. Maw | i signori Maw | |
| M.D., D.C.L., LL.D., F.R.S. | invariati | |
| M.P. | deputato | |
| Dr. Fell | il dottor Fell | filastrocca, non spiegata |
| Damon and Pythias | Damone e Pizia | |
| HENRY JEKYLL, HASTIE LANYON (firme) | invariati, in maiuscolo | |

### Luoghi e casa
| inglese | italiano | note |
|---|---|---|
| by-street | stradina (laterale) | |
| court / yard | cortile | stesso luogo, `loc_jekyll_court` |
| entry of the court | ingresso del cortile | |
| the door | la porta | |
| back way | via sul retro | D07.1.3 |
| cabinet | studio | mai "gabinetto" |
| study (cap. 10 r. 199) | studio | stessa parola di "cabinet"; nota in cap. 10 |
| theatre / surgical theatre / anatomical theatre | anfiteatro anatomico | il "theatre" del laboratorio, sempre |
| laboratory | laboratorio | |
| dissecting room(s) | sala / sale di dissezione | "laboratory or dissecting rooms" → "laboratorio o sale di dissezione" |
| kitchen offices | uffici di cucina | |
| hall | atrio | |
| dining-room | sala da pranzo | |
| business room | stanza degli affari | Utterson |
| office (Utterson, cap. 8) | ufficio | |
| consulting room | studio medico | Lanyon |
| chambers (Enfield) | stanze | |
| fanlight | lunetta | |
| fender | parafuoco | |
| red baize | panno rosso | |
| glazed press(es) | armadio / armadi a vetri | |
| flags | lastre | |
| closets | ripostigli | |
| portico | portico | |
| gin palace | bettola (gin palace) | parentesi solo nelle descrizioni |
| Soho, Cavendish Square, Gaunt Street, Regent's Park, Portland Street, Scotland Yard, Edinburgh | invariati (Edimburgo) | |
| Black Mail House | Casa del Ricatto | "(Black Mail House)" solo alla prima occorrenza |
| Queer Street | faccenda losca (Queer Street) | |

### Oggetti e sostanze
| inglese | italiano | note |
|---|---|---|
| will | testamento | |
| deed of gift | atto di donazione | |
| cheque | assegno | |
| cheque book | libretto degli assegni | |
| drawn payable to bearer | pagabile al portatore | |
| handbills | manifesti | |
| cane / stick | bastone | stesso oggetto nel cap. 4 |
| envelope / packet / enclosure | busta / plico / allegato | |
| note | biglietto | |
| narrative (Lanyon) | racconto / dichiarazione | |
| statement, confession (Jekyll) | dichiarazione, confessione | |
| cheval-glass / glass | specchio a bilico / specchio | "a figura intera" ammesso nelle descrizioni |
| phial | fiala | |
| powders | polveri | |
| salt | sale | |
| tincture | tintura | |
| draught / potion | bevanda / pozione | |
| drug | droga (preparato di Jekyll, cap. 10); sostanza (Poole e Utterson, cap. 8) | senso antico di preparato |
| graduated glass | bicchiere graduato | |
| minims | gocce | |
| version book / paper book | quaderno di versioni / quaderno | |
| kernels | noccioli | non dire "mandorle amare" né nominare il veleno |
| box of lights | scatola di fiammiferi | |
| poker | attizzatoio | |
| axe | ascia | |
| cab | carrozza | vettura a nolo |
| cab / carriage (cap. 9, in contrasto) | vettura pubblica / carrozza | D09.1.5 |
| closed cab | carrozza chiusa | |
| hansom | hansom | invariato |
| bull's eye (lanterna) | lanterna aperta | |
| penny numbers | fascicoli da un penny | |
| special edition | edizione straordinaria | |

### Persone, mestieri, espressioni
| inglese | italiano | note |
|---|---|---|
| lawyer | avvocato | |
| butler | maggiordomo | |
| footman | valletto | |
| housemaid / maid / maid servant | cameriera | |
| cook | cuoca | |
| knife-boy | ragazzo dei coltelli (addetto ai coltelli) | |
| housekeeper | governante | |
| old woman | vecchia | |
| head clerk | primo impiegato | |
| newsboys | strilloni | |
| locksmith / carpenter | fabbro / falegname | |
| apothecary | speziale | |
| Sawbones | il Segaossa | soprannome del medico |
| Juggernaut | Juggernaut | invariato |
| protégé | protégé | invariato |
| pede claudo | pede claudo | invariato |
| foul play | atto criminale | |
| made away with | fatto sparire | |
| Tut-tut! | Tsk, tsk! (cap. 1); Suvvia, suvvia! (cap. 6, quando rimprovera) | secondo il tono |
| Bless me | Santo cielo | |
| God forgive us | Dio ci perdoni | |
| the man (Hyde), my gentleman | l'uomo, il mio signore | nel cap. 1 prima del nome |

### Registro
Italiano letterario moderno, scorrevole, non arcaico. Nomi propri invariati. Le parole inglesi lasciate
in originale (Queer Street, gin palace, Black Mail House) vanno tra parentesi solo la prima volta.

---

## 6. Cronologia

Eventi in ordine reale, non di narrazione. Il libro non dà mai l'anno ("18—"). "Narrato in" indica dove
il libro racconta un fatto avvenuto prima del punto in cui lo racconta.

| # | quando | evento | scena | narrato in |
|---|---|---|---|---|
| 1 | anni prima | Jekyll nasce ricco; da giovane nasconde i suoi piaceri ("profonda doppiezza") | S 10.1 | cap. 10 |
| 2 | non datato | Jekyll compra la casa dagli eredi di un celebre chirurgo e trasforma il blocco in fondo al giardino in laboratorio | S 05.1 (narrazione) | cap. 5 |
| 3 | "più di dieci anni" prima del cap. 2 | Lanyon si allontana da Jekyll per le sue idee "non scientifiche" | S 02.2 | cap. 2 |
| 4 | non datato | Jekyll compone la droga, compra il sale, beve: prima trasformazione, poi ritorno a Jekyll | S 10.2-10.5 | cap. 10 |
| 5 | dopo | casa di Soho, governante, domestici avvisati, testamento olografo (Utterson rifiuta di aiutare a scriverlo, poi lo custodisce) | S 10.6; S 02.1 | cap. 2 (testamento), cap. 10 |
| 6 | periodo non datato | i piaceri di Hyde diventano mostruosi | S 10.7 | cap. 10 |
| 7 | una nera mattina d'inverno, verso le tre | Hyde calpesta la bambina; cento sterline; dieci in oro e l'assegno; notte nelle stanze di Enfield; banca | S 01.3; S 10.8 | cap. 1 (Enfield), cap. 10 (Jekyll) |
| 8 | dopo | conto di Hyde in un'altra banca, firma inclinata all'indietro | S 10.8 | cap. 10 |
| 9 | meno di una settimana prima del cap. 1 | Enfield vede Hyde usare la chiave | S 01.7 | cap. 1 |
| 10 | una domenica | la passeggiata e la storia della porta | S 01.1-01.7 | |
| 11 | la stessa domenica sera e notte | testamento riletto, visita a Lanyon, notte insonne fino alle sei | S 02.1-02.3 | |
| 12 | "da allora", durata non scritta | Utterson fa la guardia alla porta | S 02.4 | |
| 13 | una notte secca e gelida, verso le dieci | incontro con Hyde; poi casa di Jekyll e Poole | S 02.5-02.9 | |
| 14 | subito dopo | Hyde dice a Jekyll di aver visto Utterson | S 03.3 (D03.3.2) | cap. 3 |
| 15 | "due settimane dopo" | cena da Jekyll, promessa di Utterson | S 03.1-03.3 | |
| 16 | circa sei mesi prima dell'ultima notte (data non narrata) | Utterson restituisce il primo testamento a Jekyll | S 08.13 (r. 432-433); S 06.5 (r. 111) | cap. 6, cap. 8 |
| 17 | circa due mesi prima dell'omicidio | Jekyll si sveglia come Hyde senza la droga; Bradshaw lo vede; sceglie Jekyll | S 10.9-10.10 | cap. 10 |
| 18 | due mesi | vita rigorosa (la vecchia di Soho non vede Hyde per quasi due mesi, S 04.6) | S 10.11 | cap. 10 |
| 19 | ottobre, "quasi un anno" dopo il cap. 3, verso le undici di notte | ricaduta; Hyde uccide Sir Danvers Carew; la cameriera sviene, rinviene alle due | S 04.1-04.2; S 10.11-10.12 | cap. 4; cap. 10 |
| 20 | la stessa notte | Hyde a Soho distrugge le carte, riparte in meno di un'ora; Jekyll prega, chiude la porta e schiaccia la chiave | S 10.13-10.14; S 04.6 | cap. 10 (la chiave rotta si vede nel cap. 8) |
| 21 | la mattina dopo | busta a Utterson, stazione di polizia, Soho alle nove nella nebbia, stanze di Hyde, banca | S 04.3-04.7 | |
| 22 | lo stesso giorno, tardo pomeriggio e sera (dedotto) | Utterson nello studio di Jekyll, lettera firmata Hyde; Poole; strilloni; Guest confronta le grafie; cassaforte | S 05.1-05.5; S 10.15 (la notizia) | |
| 23 | fine anno, "più di due mesi" | Hyde scomparso; Jekyll rinato, benefico | S 06.1; S 10.15 | cap. 6, cap. 10 |
| 24 | 8 gennaio | cena da Jekyll con Utterson e Lanyon | S 06.2; S 09.1 | |
| 25 | 9 gennaio, giorno (dedotto) | trasformazione involontaria a Regent's Park; hansom; albergo di Portland Street; lettere a Lanyon e a Poole | S 10.16-10.18 | cap. 10 |
| 26 | 9 gennaio, sera | Lanyon riceve la lettera; Poole, fabbro e falegname; cassetto portato a Cavendish Square; rivoltella | S 09.1-09.3 | cap. 9 |
| 27 | 9 gennaio, sera | Hyde gira la città, colpisce la donna dei fiammiferi | S 10.19 | cap. 10 |
| 28 | mezzanotte del 9-10 gennaio | Hyde da Lanyon; la miscela; la trasformazione in Jekyll; un'ora di racconto non riportato | S 09.4-09.8; S 10.20 | cap. 9, cap. 10 |
| 29 | 10 gennaio | Jekyll si sveglia a casa; dopo colazione, nel cortile, la trasformazione: si rifugia nello studio, dose doppia; da allora recluso | S 10.20-10.22 | cap. 10 |
| 30 | 12, 14 e 15 gennaio | la porta di Jekyll resta chiusa a Utterson | S 06.2 | |
| 31 | circa 13 gennaio (dedotto) | Lanyon scrive la sua dichiarazione "quattro giorni" dopo | S 09.8 | cap. 9 |
| 32 | la quinta e la sesta sera (dedotto: dopo il 15) | Guest a cena da Utterson; Utterson da Lanyon morente | S 06.2-06.3 | |
| 33 | quella sera e il giorno dopo | lettera di Utterson a Jekyll e risposta | S 06.4 | |
| 34 | una settimana dopo; meno di quindici giorni | Lanyon si mette a letto e muore; la notte dopo il funerale Utterson apre la busta e chiude il plico in cassaforte | S 06.5 | |
| 35 | settimane seguenti | le visite di Utterson diradano; Poole sulla soglia | S 06.6 | |
| 36 | una domenica, al tramonto (data non scritta) | Jekyll alla finestra del cortile | S 07.1-07.3 | |
| 37 | stesso periodo | il tormento di Jekyll; Hyde scrive bestemmie nei libri, brucia lettere, distrugge il ritratto del padre | S 10.22-10.23 | cap. 10 (le bestemmie si vedono nel cap. 8) |
| 38 | settimana prima dell'ultima notte | il sale finisce, la nuova scorta non funziona; Poole mandato da tutti i grossisti; biglietti sulla scala | S 10.24; S 08.5 | cap. 8 (Poole), cap. 10 |
| 39 | "otto giorni" prima dell'ultima notte | i domestici sentono il padrone gridare il nome di Dio | S 08.5 (D08.5.3) | cap. 8 |
| 40 | "circa una settimana" dopo l'ultima trasformazione riuscita | Jekyll finisce la dichiarazione con l'ultima polvere e la sigilla; un biglietto per Utterson porta la data dell'ultimo giorno (S 08.13); quando sia stata scritta l'ultima pagina non è detto | S 10.25 | cap. 10 |
| 41 | una sera di marzo, dopo cena, fino alle dieci | Poole da Utterson; la porta dello studio sfondata; Hyde morto; nessuna traccia di Jekyll; la busta | S 08.1-08.13 | |
| 42 | la stessa notte, dopo le dieci | Utterson torna a leggere i due racconti; deve tornare prima di mezzanotte per chiamare la polizia (non narrato) | S 08.14 | i cap. 9 e 10 sono i documenti letti qui |

Dove il libro racconta dopo:
- il cap. 1 racconta in flashback un fatto (n. 7) avvenuto prima della passeggiata; il cap. 10 lo
  ripete dal punto di vista di Jekyll;
- il cap. 9 è letto da Utterson dopo il cap. 8 ma racconta il 9 gennaio (n. 25-28), cioè fatti avvenuti
  tra la cena dell'8 gennaio e la porta chiusa del 12 (cap. 6);
- il cap. 10 copre fatti di tutti i capitoli 1-8 (n. 1-9, 14, 17-20, 23, 25-29, 37-40) e spiega lo "shock"
  di Lanyon (cap. 6), la chiave rotta, le bestemmie e la ricerca del sale (cap. 8);
- non spiegano mai: la finestra del cap. 7, la lettera di Hyde del cap. 5, la maschera del cap. 8.

---

## 7. Questioni aperte

Ambiguità del testo che il gioco deve rispettare senza risolverle. Raccolte dalle "Note di fedeltà".

### Le più importanti
1. **Il volto di Hyde.** Nessuno sa dire dove sia la sua deformità: "deformity without any nameable
   malformation" (cap. 2 r. 213), "unexpressed deformity" (cap. 4 r. 157-158), Enfield non sa descriverlo
   (cap. 1 r. 195-202). È "nanesco" per il narratore e "più un nano" per Poole, ma per Jekyll solo "più
   piccolo, più esile e più giovane", e col tempo cresce. Non dare a Hyde una malformazione precisa né un
   ritratto definito; non chiamarlo "nano" in narrazione nuova.
2. **La fine di Jekyll.** Nello studio c'è il corpo di Hyde, con una fiala e odore di noccioli: Utterson
   lo giudica suicida (cap. 8 r. 356-358); Jekyll, scrivendo, non sa se Hyde morirà sul patibolo o si
   ucciderà (cap. 10 r. 583-586). Di Jekyll "nessuna traccia, vivo o morto" (cap. 8 r. 377). Non dire mai
   "il corpo di Jekyll", non nominare il veleno, non mostrare cosa succede dopo la lettura.
3. **Ciò che Lanyon vide e sentì.** Il contenuto dell'ora di racconto di Jekyll (cap. 9 r. 258-266) non è
   scritto; la causa della morte di Lanyon è solo uno "shock" (cap. 6 r. 49-50). Non inventare la
   conversazione né una malattia.
4. **La finestra del cap. 7.** Il testo non dice che cosa causi il terrore sul volto di Jekyll né chi
   abbassi la finestra (cap. 7 r. 48-52); il cap. 10 non racconta quell'episodio. Non spiegarlo nel cap. 7.
5. **Le date della lettera a Lanyon.** È datata "10th December, 18—" (cap. 9 r. 12) ma arriva il 9
   gennaio (r. 3), mentre il cap. 10 colloca Regent's Park in gennaio. Lasciare l'incongruenza; l'anno non
   è mai dato.

### Altre
6. **Cortile e stradina.** Il cortile tra casa e laboratorio ("yard", "court") è raggiungibile dalla
   stradina (cap. 1 r. 53-54; cap. 2 r. 143-144; cap. 7 r. 18-23): il testo non spiega come un cortile
   privato sia aperto alla strada. Un solo id, nessuna spiegazione inventata. Enfield chiama la porta
   "cellar door" (cap. 1 r. 131), ma è al pianterreno (r. 56).
7. **La lettera firmata Hyde (cap. 5).** Chi l'abbia scritta e come sia arrivata (nessun messaggero, solo
   circolari per posta, cap. 5 r. 99-101) non è detto; il cap. 10 non ne parla. Guest nota solo la
   somiglianza delle grafie.
8. **La maschera (cap. 8).** Poole dice che la creatura aveva una maschera; nessuna maschera viene trovata
   (cap. 8 r. 192, 215, 264). Non inventarla come oggetto.
9. **Chi c'è dietro la porta prima che Utterson riconosca la voce.** A r. 115 del cap. 8 la voce non è
   identificata; l'id `hyde` è una deduzione (cap. 8 r. 331).
10. **La vecchia di Soho.** Che la vecchia del cap. 4 sia la governante assunta da Jekyll (cap. 10
    r. 178-180) è dedotto.
11. **Le stanze del cap. 10.** "My room", "cabinet", "study", "laboratory table" (cap. 10 r. 59, 109, 148,
    199, 438) possono essere la stessa stanza o stanze vicine.
12. **L'"office" di Utterson.** Dice "devo tornare a casa", poi va al suo "office" (cap. 8 r. 476, 482).
13. **Carew.** "Sembrava" chiedere la strada (cap. 4 r. 20-22); il contenuto della lettera per Utterson
    che portava addosso non è detto (r. 47-49); le sue parole a Hyde non sono riportate.
14. **Il testamento restituito.** Utterson lo restituisce "sei mesi prima" dell'ultima notte (cap. 8
    r. 432-433), "molto tempo prima" secondo il cap. 6 (r. 111): la scena non è narrata.
15. **Enfield riconosciuto "l'altro giorno".** Jekyll dice di aver riconosciuto il passante "nella persona
    di un Suo parente" (cap. 10 r. 224-225): quando, non è detto (forse alla finestra del cap. 7,
    dedotto).
16. **Il quaderno.** Che cosa significhino "double" e "total failure!!!" non è spiegato (cap. 9
    r. 105-111). Il fosforo e l'etere sono ipotesi di Lanyon (r. 103-104).
17. **Il sale impuro.** Che la prima scorta fosse impura è una convinzione di Jekyll (cap. 10 r. 562-565);
    il colore del cambiamento mancato non è detto (r. 561).
18. **"Since my time".** Che cosa intenda Lanyon (cap. 2 r. 79) non è spiegato.
19. **Età.** Solo Jekyll ha un'età scritta (cinquant'anni, cap. 3 r. 14). Hyde è "young man" (cap. 2
    r. 262; cap. 3 r. 74) e "più giovane"; Enfield "il giovane".
20. **Durate non scritte.** Quanto dura la guardia di Utterson (cap. 2 r. 121); quanto passa tra la morte
    di Lanyon e la finestra (cap. 7) e tra la finestra e l'ultima notte; da quale giorno contare la "quinta
    sera" (cap. 6 r. 31-33).
21. **Dettagli assenti.** Nomi della stradina e della piazza di Jekyll; strada e numero dell'indirizzo di
    Hyde (cap. 2 r. 181); il nome del firmatario dell'assegno nel cap. 1; chi porti la busta di Carew a
    Utterson (cap. 4 r. 51); chi sia il padrone della cameriera (cap. 4 r. 27, 153); il "boy" mandato con
    Bradshaw (cap. 8 r. 283); se Lanyon entri da solo nello studio (cap. 9 r. 92-95); dove Hyde sia nei
    mesi dopo l'omicidio (cap. 6 r. 9-10).
22. **Che cosa sa il giocatore.** Nel cap. 1 Jekyll non è nominato e il nome di Hyde arriva a r. 191; nel
    cap. 6 il plico di Lanyon resta chiuso; nel cap. 9 lo sconosciuto non ha nome fino a r. 269; la
    trasformazione è descritta con cautela ("I thought", "seemed to swell", cap. 9 r. 248-250).
