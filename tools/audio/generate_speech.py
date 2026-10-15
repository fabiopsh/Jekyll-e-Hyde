"""Generate expressive, natural human Italian speech for game dialogues using Microsoft Edge Neural TTS.

Directly driven by the `emotion` tags in content/dialogues/ YAML files.
Characters speak with authentic conversational pacing and human inflections:
- Utterson: GiuseppeMultilingualNeural (Natural, measured Victorian lawyer, 55yo, rate: -2%, pitch: 0Hz)
- Enfield: DiegoNeural (Lively, expressive Victorian gentleman, 30yo, rate: +1%, pitch: 0Hz)
- Narrator: IsabellaNeural (Warm, elegant literary Victorian narrator, rate: -1%, pitch: 0Hz)

Eliminates slow-motion distortions, robotic dragging, and literal letter reading of onomatopoeias.

Usage:
    uv run python generate_speech.py --force
"""

from __future__ import annotations

import argparse
import asyncio
import json
import re
import time
from datetime import datetime, timezone
from pathlib import Path

import soundfile as sf
import yaml
import edge_tts

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent.parent

DIALOGUES_DIR = REPO / "content" / "dialogues"
OUTPUT_SPEECH_DIR = REPO / "assets" / "audio" / "speech"
MANIFEST_FILE = REPO / "assets" / "audio" / "speech" / "manifest.json"

# Base natural voices (authentic human cadence, NO slow-motion dragging)
VOICE_PROFILES: dict[str, dict] = {
    "utterson": {
        "voice": "it-IT-GiuseppeMultilingualNeural",
        "name": "Gabriel John Utterson (Avvocato austero, 55 anni)",
        "base_rate": -2,
        "base_pitch": 0,
    },
    "enfield": {
        "voice": "it-IT-DiegoNeural",
        "name": "Richard Enfield (Gentiluomo brillante, 30 anni)",
        "base_rate": +1,
        "base_pitch": 0,
    },
    "narrator": {
        "voice": "it-IT-IsabellaNeural",
        "name": "Voce narrante ottocentesca (Isabella)",
        "base_rate": -1,
        "base_pitch": 0,
    },
}

# Emotion modifiers (fine-grained natural human conversational adjustments)
EMOTION_DELTAS: dict[str, dict] = {
    "curious_question": {"rate_delta": +1, "pitch_delta": +1},
    "confidential_mystery": {"rate_delta": -1, "pitch_delta": 0},
    "grave_inquiry": {"rate_delta": -1, "pitch_delta": 0},
    "storytelling_calm": {"rate_delta": 0, "pitch_delta": 0},
    "eerie_suspense": {"rate_delta": -1, "pitch_delta": 0},
    "sudden_event": {"rate_delta": +2, "pitch_delta": +1},
    "visceral_horror": {"rate_delta": +2, "pitch_delta": +1},
    "indignation_and_chill": {"rate_delta": +1, "pitch_delta": 0},
    "doctor_arrival": {"rate_delta": 0, "pitch_delta": 0},
    "doctor_characterization": {"rate_delta": +1, "pitch_delta": 0},
    "shared_hatred": {"rate_delta": +1, "pitch_delta": 0},
    "threat_of_scandal": {"rate_delta": +2, "pitch_delta": +1},
    "demonic_defiance": {"rate_delta": 0, "pitch_delta": 0},
    "hyde_cold_cynicism": {"rate_delta": -1, "pitch_delta": 0},
    "settlement_agreed": {"rate_delta": 0, "pitch_delta": 0},
    "mystery_of_the_door": {"rate_delta": 0, "pitch_delta": 0},
    "incredulous_suspicion": {"rate_delta": +1, "pitch_delta": +1},
    "hyde_mocking_calm": {"rate_delta": -1, "pitch_delta": 0},
    "bank_astonishment": {"rate_delta": +1, "pitch_delta": +1},
    "grave_disapproval": {"rate_delta": -1, "pitch_delta": 0},
    "shared_scandal": {"rate_delta": +1, "pitch_delta": 0},
    "reflective_conclusion": {"rate_delta": -1, "pitch_delta": 0},
    "sharp_inquiry": {"rate_delta": 0, "pitch_delta": 0},
    "ironical_reply": {"rate_delta": +1, "pitch_delta": +1},
    "cautious_probing": {"rate_delta": -1, "pitch_delta": 0},
    "candid_rule": {"rate_delta": +1, "pitch_delta": 0},
    "vivid_metaphor": {"rate_delta": +2, "pitch_delta": +1},
    "dry_agreement": {"rate_delta": -1, "pitch_delta": 0},
    "architectural_curiosity": {"rate_delta": +1, "pitch_delta": 0},
    "building_analysis": {"rate_delta": 0, "pitch_delta": 0},
    "thoughtful_preface": {"rate_delta": -1, "pitch_delta": 0},
    "casual_assent": {"rate_delta": 0, "pitch_delta": 0},
    "decisive_question": {"rate_delta": -1, "pitch_delta": 0},
    "naming_hyde": {"rate_delta": 0, "pitch_delta": 0},
    "intense_curiosity": {"rate_delta": -1, "pitch_delta": 0},
    "struggle_to_describe": {"rate_delta": -1, "pitch_delta": 0},
    "visceral_repulsion": {"rate_delta": +1, "pitch_delta": +1},
    "lawyer_cross_examination": {"rate_delta": -1, "pitch_delta": 0},
    "offended_disbelief": {"rate_delta": +2, "pitch_delta": +1},
    "grave_revelation": {"rate_delta": -1, "pitch_delta": 0},
    "stubborn_assertion": {"rate_delta": +1, "pitch_delta": 0},
    "heavy_sigh": {"rate_delta": -2, "pitch_delta": 0},
    "self_reproach_and_pact": {"rate_delta": +1, "pitch_delta": 0},
    "warm_gentleman_pact": {"rate_delta": 0, "pitch_delta": 0},
}

# Conversational line directing: natural human phrasing and breath pauses
CONVERSATIONAL_SCRIPTS: dict[str, str] = {
    # d01_door_story
    "d01_door_story/point_0": "Erano sull'altro lato della stradina. Quando giunsero all'altezza dell'ingresso, Enfield alzò il bastone e indicò.",
    "d01_door_story/point_1": "Ha mai fatto caso a quella porta?",
    "d01_door_story/point_2": "Utterson rispose di sì.",
    "d01_door_story/point_3": "Nella mia mente... è legata a una storia molto singolare.",
    "d01_door_story/point_4": "Davvero? E quale sarebbe?",
    "d01_door_story/night_0": "Ecco, andò così. Stavo tornando a casa da un posto in capo al mondo, verso le tre di una nera mattina d'inverno. E la mia strada attraversava una zona della città dove, letteralmente, non c'era niente da vedere se non lampioni.",
    "d01_door_story/night_1": "Strada dopo strada... e tutta la gente addormentata. Strade illuminate a giorno come per una processione, e vuote come una chiesa! Finché, alla fine, arrivai a quello stato d'animo in cui uno ascolta, e ascolta... e comincia a desiderare la vista di un poliziotto.",
    "d01_door_story/night_2": "All'improvviso vidi due figure! Una era un ometto che camminava a gran passo verso est, e l'altra una ragazzina di otto o dieci anni che correva più forte che poteva lungo una traversa.",
    "d01_door_story/night_3": "Ebbene, signore, i due si scontrarono all'angolo. E poi venne la parte orribile della faccenda! L'uomo calpestò con calma il corpo della bambina e la lasciò a terra che urlava! A sentirlo non sembra niente, ma a vederlo era infernale! Non sembrava un uomo... sembrava un maledetto Juggernaut!",
    "d01_door_story/crowd_0": "Gridai un paio di volte, mi misi a correre, afferrai per il bavero il mio signore e lo riportai dove c'era già un bel gruppo intorno alla bambina. Era perfettamente freddo e non oppose resistenza... ma mi lanciò uno sguardo così brutto che mi fece uscire il sudore addosso come una corsa!",
    "d01_door_story/crowd_1": "Le persone accorse erano la famiglia stessa della bambina, e poco dopo arrivò il dottore. Ebbene, la bambina non stava molto peggio, più spaventata che altro, secondo il medico; e si sarebbe potuto supporre che finisse lì.",
    "d01_door_story/crowd_2": "Ma ci fu una circostanza curiosa. Io avevo concepito un'avversione per quell'uomo a prima vista. Così la famiglia della bambina, il che era naturale. Ma a colpirmi fu il caso del dottore! Era il solito speziale tutto d'un pezzo, con un forte accento di Edimburgo, ed emotivo quanto una cornamusa.",
    "d01_door_story/crowd_3": "Ebbene, signore, era come tutti noi! Ogni volta che guardava il mio prigioniero, vedevo quel medico diventare livido e bianco dalla voglia di ucciderlo! Io sapevo cosa gli passava per la testa, proprio come lui sapeva cosa passava nella mia. E, non potendo ucciderlo, facemmo la cosa migliore dopo quella.",
    "d01_door_story/crowd_4": "Dicemmo all'uomo che potevamo e volevamo fare di questa storia uno scandalo tale da far puzzare il suo nome da un capo all'altro di Londra! Se aveva amici o credito, ci impegnammo a fargliene perdere! E per tutto il tempo tenevamo le donne lontane da lui, perché erano furiose come arpie!",
    "d01_door_story/crowd_5": "Non ho mai visto un cerchio di facce così odiose! E in mezzo c'era lui, con una specie di ghigno nero e freddo... spaventato anche, lo vedevo bene; ma che ci affrontava, signore, con una spavalderia da vero Satana!",
    "d01_door_story/crowd_6": "«Se volete far soldi con questo incidente», disse lui, «è chiaro che sono impotente. Qualunque gentiluomo vorrebbe evitare una scenata. Dite la vostra cifra».",
    "d01_door_story/cheque_0": "Ebbene, lo facemmo salire fino a cento sterline per la famiglia della bambina. È chiaro che avrebbe voluto tirarla per le lunghe; ma c'era in tutti noi qualcosa che prometteva guai, e alla fine cedette.",
    "d01_door_story/cheque_1": "La cosa successiva fu procurarsi il denaro. E dove crede che ci portò?... Proprio a quel luogo con la porta! Tirò fuori una chiave, entrò, e poco dopo tornò con circa dieci sterline in oro e un assegno per il saldo su Coutts, pagabile al portatore e firmato con un nome che non posso fare, benché sia essenziale alla storia.",
    "d01_door_story/cheque_2": "La cifra era alta; ma la firma valeva ben più di così, se solo era autentica! Mi presi la libertà di far notare al mio signore che tutta la faccenda aveva l'aria di una falsità, e che un uomo non entra, nella vita reale, da una porta di cantina alle quattro del mattino per uscirne con l'assegno di un altro uomo! Ma lui era del tutto a suo agio e sprezzante.",
    "d01_door_story/cheque_3": "«Stia tranquillo», dice lui, «resterò con voi finché le banche non apriranno e incasserò io stesso l'assegno».",
    "d01_door_story/cheque_4": "Così ci mettemmo tutti in cammino, il dottore, il padre della bambina, il nostro amico e io, e passammo il resto della notte nelle mie stanze. Il giorno dopo andammo tutti insieme alla banca. Presentai io stesso l'assegno, dicendo che avevo ogni ragione di credere che fosse un falso. Niente affatto! L'assegno era autentico!",
    "d01_door_story/blackmail_0": "Mmh... Brutta faccenda, Richard... Davvero una brutta faccenda.",
    "d01_door_story/blackmail_1": "Vedo che la pensa come me! Sì, è una brutta storia. Perché quell'uomo era un individuo con cui nessuno vorrebbe avere a che fare, un uomo davvero detestabile; mentre chi ha firmato l'assegno è il modello stesso delle convenienze, famoso, e, cosa che peggiora le cose, uno di quei tipi che fanno quello che chiamano del bene.",
    "d01_door_story/blackmail_2": "Ricatto, suppongo. Un uomo onesto che paga a caro prezzo certe bravate della gioventù. Casa del Ricatto è come chiamo quel luogo con la porta, di conseguenza... Anche se perfino questo, sa, è ben lontano dallo spiegare tutto.",
    "d01_door_story/blackmail_3": "E con queste parole Enfield cadde in una vena meditativa.",

    # d01_enfield
    "d01_enfield/silence_0": "I due camminavano senza dirsi nulla, come ogni domenica.",
    "d01_enfield/signer_0": "Da quello stato lo richiamò Utterson, che domandò piuttosto bruscamente:",
    "d01_enfield/signer_1": "E Lei non sa se chi ha firmato l'assegno abita lì?",
    "d01_enfield/signer_2": "Un posto verosimile, non è vero? Ma mi è capitato di notare il suo indirizzo; abita in una qualche piazza.",
    "d01_enfield/signer_3": "E non ha mai chiesto... del luogo con la porta?",
    "d01_enfield/signer_4": "No, signore; avevo un certo riguardo. Ho idee molto nette sul fare domande; sa troppo di giorno del giudizio! Si fa una domanda, ed è come far partire un sasso...",
    "d01_enfield/signer_5": "Se ne sta seduti tranquilli in cima a una collina; e il sasso se ne va, mettendone in moto altri! E presto qualche vecchio tipo bonario, l'ultimo a cui avrebbe pensato, viene colpito in testa nel suo giardino, e la famiglia deve cambiare cognome! No, signore, ne faccio una regola: più la cosa ha l'aria di una faccenda losca, meno chiedo!",
    "d01_enfield/signer_6": "Una regola ottima. Anche questa.",
    "d01_enfield/signer_7": "Ma il posto l'ho studiato per conto mio. Sembra a malapena una casa! Non c'è un'altra porta, e nessuno entra o esce da quella se non, molto di rado, il signore della mia avventura.",
    "d01_enfield/signer_8": "Ci sono tre finestre che danno sul cortile al primo piano, nessuna sotto; le finestre sono sempre chiuse, ma sono pulite. E poi c'è un camino che per lo più fuma, quindi qualcuno deve abitarci. Eppure non è sicuro, perché gli edifici sono così addossati gli uni agli altri che è difficile dire dove ne finisce uno e ne comincia un altro.",
    "d01_enfield/name_0": "I due ripresero a camminare per un po' in silenzio.",
    "d01_enfield/name_1": "Enfield... È una buona regola, la Sua.",
    "d01_enfield/name_2": "Sì, credo di sì.",
    "d01_enfield/name_3": "Ma nonostante questo... C'è un punto su cui voglio fare una domanda. Voglio chiederLe il nome di quell'uomo che ha calpestato la bambina.",
    "d01_enfield/name_4": "Ebbene, non vedo che male potrebbe fare. Era un uomo di nome Hyde.",
    "d01_enfield/name_5": "Hm... Che tipo d'uomo è a vedersi?",
    "d01_enfield/name_6": "Non è facile da descrivere. C'è qualcosa che non va nel suo aspetto, qualcosa di sgradevole, qualcosa di decisamente detestabile! Non ho mai visto un uomo che mi ripugnasse tanto, eppure non so spiegare perché.",
    "d01_enfield/name_7": "Deve essere deforme da qualche parte; dà una forte impressione di deformità, anche se non saprei specificare dove! Eppure non è per mancanza di memoria; perché vi giuro che posso vederlo in questo preciso istante!",
    "d01_enfield/key_0": "Utterson camminò di nuovo un tratto in silenzio, visibilmente soprappensiero.",
    "d01_enfield/key_1": "È sicuro che abbia usato una chiave?",
    "d01_enfield/key_2": "Mio caro signore!...",
    "d01_enfield/key_3": "Sì, lo so... So che deve sembrarLe strano. Il fatto è che... se non Le chiedo il nome dell'altra persona, è perché lo so già!",
    "d01_enfield/key_4": "Credo che avrebbe potuto avvertirmi! Ma sono stato pedante nel riferire i fatti. Quell'uomo aveva una chiave; e per di più l'ha usata non più tardi di qualche giorno fa.",
    "d01_enfield/key_5": "Utterson sospirò profondamente, ma non disse una parola.",
    "d01_enfield/key_6": "Ecco un'altra lezione a non dire nulla. Mi vergogno della mia linguaccia! Facciamo un patto di non parlare mai più di questa faccenda.",
    "d01_enfield/bargain_0": "Con tutto il cuore. Ci stringo la mano sopra, Richard.",
    "d01_enfield/bargain_1": "Fine del primo capitolo. I capitoli successivi proseguono nel romanzo.",
}


def clean_text(text: str) -> str:
    """Normalize text and remove unpronounceable onomatopoeias."""
    t = re.sub(r'\b(tsk[,\s-]*tsk|tks[,\s-]*tks|tut[,\s-]*tut|tsk|tks)\b', 'Mmh... brutta faccenda.', text, flags=re.IGNORECASE)
    t = re.sub(r'\bHm\.\s*', 'Hm... ', t)
    t = re.sub(r'—', ', ', t)
    t = re.sub(r'«|»|"|\*', '', t)
    return t.strip()


def load_dialogues(dialogue_filter: str | None = None) -> list[tuple[str, dict]]:
    results = []
    for file in sorted(DIALOGUES_DIR.glob("*.yaml")):
        d_id = file.stem
        if dialogue_filter and d_id != dialogue_filter:
            continue
        data = yaml.safe_load(file.read_text(encoding="utf-8")) or {}
        results.append((d_id, data))
    return results


async def synthesize_clip(text: str, voice: str, rate: str, pitch: str, dest_file: Path) -> None:
    comm = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
    await comm.save(str(dest_file))


def generate_speech(dialogue_id: str | None = None, force: bool = False) -> None:
    dialogues = load_dialogues(dialogue_filter=dialogue_id)
    if not dialogues:
        print("No dialogues found to process.")
        return

    OUTPUT_SPEECH_DIR.mkdir(parents=True, exist_ok=True)

    manifest_entries = {}
    if MANIFEST_FILE.exists():
        try:
            for item in json.loads(MANIFEST_FILE.read_text(encoding="utf-8")):
                manifest_entries[item["id"]] = item
        except Exception:
            pass

    total_lines = 0
    generated_count = 0

    for d_id, data in dialogues:
        dest_dir = OUTPUT_SPEECH_DIR / d_id
        dest_dir.mkdir(parents=True, exist_ok=True)
        nodes = data.get("nodes", {})

        print(f"=== Dialogue '{d_id}' ({len(nodes)} nodes) ===", flush=True)

        for node_id, node_data in nodes.items():
            lines = node_data.get("lines", [])
            for idx, line in enumerate(lines):
                total_lines += 1
                clip_id = f"{d_id}/{node_id}_{idx}"
                dest_file = dest_dir / f"{node_id}_{idx}.mp3"
                dest_wav = dest_dir / f"{node_id}_{idx}.wav"

                if dest_file.exists() and not force:
                    continue

                speaker = line.get("speaker", "narrator")
                orig_text = line.get("it", "").strip()
                emotion = line.get("emotion", "conversational")
                if not orig_text:
                    continue

                profile = VOICE_PROFILES.get(speaker, VOICE_PROFILES["narrator"])
                delta = EMOTION_DELTAS.get(emotion, {"rate_delta": 0, "pitch_delta": 0})

                # Check scripted conversational delivery
                speech_text = CONVERSATIONAL_SCRIPTS.get(clip_id, clean_text(orig_text))

                # Conversational rate and pitch calculation
                rate_val = profile["base_rate"] + delta.get("rate_delta", 0)
                pitch_val = profile["base_pitch"] + delta.get("pitch_delta", 0)

                rate_str = f"{rate_val:+d}%"
                pitch_str = f"{pitch_val:+d}Hz"

                print(f"  [{clip_id}] {profile['name']} [emotion: {emotion}] (rate={rate_str}, pitch={pitch_str}):", flush=True)
                print(f"     \"{speech_text[:55]}...\"", flush=True)
                t_line = time.perf_counter()

                # Synthesize with Edge-TTS
                asyncio.run(synthesize_clip(speech_text, profile["voice"], rate_str, pitch_str, dest_file))

                # Save WAV copy
                try:
                    audio_data, sr = sf.read(str(dest_file))
                    sf.write(str(dest_wav), audio_data, sr)
                    duration = float(len(audio_data)) / float(sr)
                except Exception:
                    duration = sf.info(str(dest_file)).duration

                manifest_entries[clip_id] = {
                    "id": clip_id,
                    "dialogue": d_id,
                    "node": node_id,
                    "index": idx,
                    "speaker": speaker,
                    "voice": profile["voice"],
                    "emotion": emotion,
                    "text": orig_text,
                    "spoken_script": speech_text,
                    "rate": rate_str,
                    "pitch": pitch_str,
                    "file": f"speech/{d_id}/{node_id}_{idx}.mp3",
                    "duration": round(duration, 2),
                    "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                }
                generated_count += 1
                print(f"     -> {duration:.1f}s in {time.perf_counter() - t_line:.2f}s", flush=True)

    # Save manifest
    MANIFEST_FILE.write_text(
        json.dumps(list(manifest_entries.values()), indent=2) + "\n",
        encoding="utf-8"
    )
    print(f"\nConversational acting synthesis completed! Processed {generated_count} clips.", flush=True)
    print(f"Manifest written -> {MANIFEST_FILE.relative_to(REPO)}", flush=True)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dialogue", help="Dialogue id to generate (e.g. d01_door_story)")
    parser.add_argument("--force", action="store_true", help="Regenerate existing clips")
    args = parser.parse_args()
    generate_speech(args.dialogue, args.force)


if __name__ == "__main__":
    main()
