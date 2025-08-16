---
title: Introduction
subtitle: Welcome to the ElevenLabs API reference.
hide-feedback: true
---

## Installation

You can interact with the API through HTTP or Websocket requests from any language, via our official Python bindings or our official Node.js libraries.

To install the official Python bindings, run the following command:

```bash
pip install elevenlabs
```

To install the official Node.js library, run the following command in your Node.js project directory:

```bash
npm install @elevenlabs/elevenlabs-js
```

<div id="overview-wave">
  <ElevenLabsWaveform color="gray" className="h-[500px]" />
</div>

Create speech - Converts text into speech using a voice of your choice and returns audio.
POST

https://api.elevenlabs.io
/v1/text-to-speech/:voice_id

import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const client = new ElevenLabsClient({ apiKey: "YOUR_API_KEY" });
await client.textToSpeech.convert("JBFqnCBsd6RMkjVDRZzb", {
    outputFormat: "mp3_44100_128",
    text: "The first move is what sets everything in motion.",
    modelId: "eleven_multilingual_v2"
});

Path parameters
voice_id
string
Required
ID of the voice to be used. Use the Get voices endpoint list all the available voices.

Headers
xi-api-key
string
Required

Query parameters
output_format
enum
Optional
Defaults to mp3_44100_128

Request
This endpoint expects an object.
text
string
Required
The text that will get converted into speech.

model_id
string
I want to use eleven_multilingual_v2

voice_settings
stability
double or null
Optional
Determines how stable the voice is and the randomness between each generation. Lower values introduce broader emotional range for the voice. Higher values can result in a monotonous voice with limited emotion.
use_speaker_boost
boolean or null
Optional
This setting boosts the similarity to the original speaker. Using this setting requires a slightly higher computational load, which in turn increases latency.
similarity_boost
double or null
Optional
Determines how closely the AI should adhere to the original voice when attempting to replicate it.
style
double or null
Optional
Determines the style exaggeration of the voice. This setting attempts to amplify the style of the original speaker. It does consume additional computational resources and might increase latency if set to anything other than 0.
speed
double or null
Optional
Adjusts the speed of the voice. A value of 1.0 is the default speed, while values less than 1.0 slow down the speech, and values greater than 1.0 speed it up.

importnat - Here is what I want for the setting:
stability 77
use_speaker_boost true
similarity_boost 60
style  43
speed 0.86


Errors
{
  "detail": [
    {
      "loc": [
        "string"
      ],
      "msg": "string",
      "type": "string"
    }
  ]
}

