const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_TTS_MODEL = "gemini-2.5-flash-preview-tts";

export interface GeminiVoice {
  id: string;
  name: string;
  description: string;
}

// Gemini TTS has 30 predefined voices
// These are named after celestial objects
export const GEMINI_VOICES: GeminiVoice[] = [
  { id: "Achernar", name: "Achernar", description: "Soft, conversational voice" },
  { id: "Achird", name: "Achird", description: "Clear, professional voice" },
  { id: "Algenib", name: "Algenib", description: "Warm, friendly voice" },
  { id: "Algieba", name: "Algieba", description: "Expressive, dynamic voice" },
  { id: "Alnilam", name: "Alnilam", description: "Calm, soothing voice" },
  { id: "Aoede", name: "Aoede", description: "Bright, enthusiastic voice" },
  { id: "Autonoe", name: "Autonoe", description: "Natural, conversational voice" },
  { id: "Callirrhoe", name: "Callirrhoe", description: "Gentle, melodic voice" },
  { id: "Charon", name: "Charon", description: "Deep, resonant voice" },
  { id: "Despina", name: "Despina", description: "Light, cheerful voice" },
  { id: "Enceladus", name: "Enceladus", description: "Authoritative, clear voice" },
  { id: "Erinome", name: "Erinome", description: "Smooth, engaging voice" },
  { id: "Fenrir", name: "Fenrir", description: "Strong, confident voice" },
  { id: "Gacrux", name: "Gacrux", description: "Balanced, neutral voice" },
  { id: "Iapetus", name: "Iapetus", description: "Rich, expressive voice" },
  { id: "Kore", name: "Kore", description: "Warm, approachable voice" },
  { id: "Laomedeia", name: "Laomedeia", description: "Elegant, refined voice" },
  { id: "Leda", name: "Leda", description: "Soft, pleasant voice" },
  { id: "Orus", name: "Orus", description: "Bold, commanding voice" },
  { id: "Puck", name: "Puck", description: "Playful, energetic voice" },
  { id: "Pulcherrima", name: "Pulcherrima", description: "Beautiful, flowing voice" },
  { id: "Rasalgethi", name: "Rasalgethi", description: "Wise, thoughtful voice" },
  { id: "Sadachbia", name: "Sadachbia", description: "Friendly, welcoming voice" },
  { id: "Sadaltager", name: "Sadaltager", description: "Steady, reliable voice" },
  { id: "Schedar", name: "Schedar", description: "Articulate, precise voice" },
  { id: "Sulafat", name: "Sulafat", description: "Vibrant, lively voice" },
  { id: "Umbriel", name: "Umbriel", description: "Mysterious, intriguing voice" },
  { id: "Vindemiatrix", name: "Vindemiatrix", description: "Graceful, poised voice" },
  { id: "Zephyr", name: "Zephyr", description: "Breezy, light voice" },
  { id: "Zubenelgenubi", name: "Zubenelgenubi", description: "Unique, distinctive voice" },
];

export async function fetchGeminiVoices(): Promise<GeminiVoice[]> {
  // Gemini doesn't have a list voices API, so we return the static list
  // But we still check if the API key is configured
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  return GEMINI_VOICES;
}

export async function fetchGeminiVoiceById(voiceId: string): Promise<GeminiVoice> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const voice = GEMINI_VOICES.find(
    (v) => v.id.toLowerCase() === voiceId.toLowerCase()
  );

  if (!voice) {
    throw new Error("Voice not found");
  }

  return voice;
}

// Convert PCM audio (16-bit, 24kHz) to WAV format
function pcmToWav(pcmData: Uint8Array, sampleRate: number = 24000): ArrayBuffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmData.length;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, "RIFF");
  view.setUint32(4, totalSize - 8, true);
  writeString(view, 8, "WAVE");

  // fmt chunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // audio format (1 = PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data chunk
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  // Write PCM data
  const dataView = new Uint8Array(buffer, headerSize);
  dataView.set(pcmData);

  return buffer;
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

export async function generateGeminiSpeech(
  voiceId: string,
  text: string
): Promise<ArrayBuffer> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  // Verify voice exists
  const voice = GEMINI_VOICES.find(
    (v) => v.id.toLowerCase() === voiceId.toLowerCase()
  );

  if (!voice) {
    throw new Error(`Invalid voice: ${voiceId}`);
  }

  const response = await fetch(
    `${GEMINI_API_URL}/models/${GEMINI_TTS_MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text }],
          },
        ],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voice.id,
              },
            },
          },
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to generate Gemini speech: ${response.status} ${errorText}`
    );
  }

  const data = await response.json();

  // Extract base64 audio from response
  const inlineData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;

  if (!inlineData?.data) {
    throw new Error("No audio data in Gemini response");
  }

  // Decode base64 to binary
  const binaryString = atob(inlineData.data);
  const pcmData = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    pcmData[i] = binaryString.charCodeAt(i);
  }

  // Convert PCM to WAV format for browser playback
  // Gemini returns audio/L16;codec=pcm;rate=24000
  const wavBuffer = pcmToWav(pcmData, 24000);

  return wavBuffer;
}
