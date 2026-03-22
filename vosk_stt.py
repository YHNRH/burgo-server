#!/usr/bin/env python3
import sys
import json
import wave
import vosk

if len(sys.argv) < 2:
    print("ERROR: No audio file specified", file=sys.stderr)
    sys.exit(1)

audio_file = sys.argv[1]
model_path = "vosk-model"  # путь к папке с моделью

try:
    wf = wave.open(audio_file, "rb")
    # Проверяем, что файл в нужном формате
    if wf.getnchannels() != 1 or wf.getsampwidth() != 2 or wf.getframerate() != 16000:
        print("ERROR: Audio file must be 16kHz mono PCM", file=sys.stderr)
        sys.exit(1)

    model = vosk.Model(model_path)
    rec = vosk.KaldiRecognizer(model, wf.getframerate())
    rec.SetWords(False)  # не нужны таймштампы слов

    while True:
        data = wf.readframes(4000)
        if len(data) == 0:
            break
        rec.AcceptWaveform(data)

    result = json.loads(rec.FinalResult())
    text = result.get("text", "")
    print(text)

except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    sys.exit(1)