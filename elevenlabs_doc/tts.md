Convert text to speech (file)
To convert text to speech and save it as a file, we’ll use the convert method of the ElevenLabs SDK and then it locally as a .mp3 file.
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import * as dotenv from 'dotenv';
import { createWriteStream } from 'fs';
import { v4 as uuid } from 'uuid';

dotenv.config();

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

const elevenlabs = new ElevenLabsClient({
  apiKey: ELEVENLABS_API_KEY,
});

export const createAudioFileFromText = async (text: string): Promise<string> => {
  return new Promise<string>(async (resolve, reject) => {
    try {
      const audio = await elevenlabs.textToSpeech.convert('JBFqnCBsd6RMkjVDRZzb', {
        modelId: 'eleven_multilingual_v2',
        text,
        outputFormat: 'mp3_44100_128',
        // Optional voice settings that allow you to customize the output
        voiceSettings: {
          stability: 0,
          similarityBoost: 0,
          useSpeakerBoost: true,
          speed: 1.0,
        },
      });

      const fileName = `${uuid()}.mp3`;
      const fileStream = createWriteStream(fileName);

      audio.pipe(fileStream);
      fileStream.on('finish', () => resolve(fileName)); // Resolve with the fileName
      fileStream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
};

You can then run this function with:
await createAudioFileFromText('Hello World');

Uploading to AWS S3 and getting a secure sharing link:
Once your audio data is created as either a file, upload it to an AWS S3 bucket and generate a secure sharing link.