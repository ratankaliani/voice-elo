const CARTESIA_API_URL = "https://api.cartesia.ai";

export interface CartesiaVoice {
  id: string;
  name: string;
  description: string;
  language: string;
  is_public: boolean;
  created_at: string;
}

export interface CartesiaVoicesResponse {
  data: CartesiaVoice[];
}

export async function fetchCartesiaVoices(): Promise<CartesiaVoice[]> {
  const apiKey = process.env.CARTESIA_API_KEY;

  if (!apiKey) {
    throw new Error("CARTESIA_API_KEY is not configured");
  }

  const response = await fetch(`${CARTESIA_API_URL}/voices`, {
    headers: {
      "X-API-Key": apiKey,
      "Cartesia-Version": "2024-06-10",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Failed to fetch Cartesia voices: ${response.status} ${text}`
    );
  }

  const data = await response.json();
  // Cartesia returns an array directly or { data: [...] } depending on version
  return Array.isArray(data) ? data : data.data || [];
}

export async function fetchCartesiaVoiceById(
  voiceId: string
): Promise<CartesiaVoice> {
  const apiKey = process.env.CARTESIA_API_KEY;

  if (!apiKey) {
    throw new Error("CARTESIA_API_KEY is not configured");
  }

  const response = await fetch(`${CARTESIA_API_URL}/voices/${voiceId}`, {
    headers: {
      "X-API-Key": apiKey,
      "Cartesia-Version": "2024-06-10",
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Voice not found");
    }
    const text = await response.text();
    throw new Error(
      `Failed to fetch Cartesia voice: ${response.status} ${text}`
    );
  }

  return response.json();
}

export async function generateCartesiaSpeech(
  voiceId: string,
  text: string
): Promise<ArrayBuffer> {
  const apiKey = process.env.CARTESIA_API_KEY;

  if (!apiKey) {
    throw new Error("CARTESIA_API_KEY is not configured");
  }

  const response = await fetch(`${CARTESIA_API_URL}/tts/bytes`, {
    method: "POST",
    headers: {
      "X-API-Key": apiKey,
      "Cartesia-Version": "2024-06-10",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model_id: "sonic-2",
      transcript: text,
      voice: {
        mode: "id",
        id: voiceId,
      },
      output_format: {
        container: "mp3",
        bit_rate: 128000,
        sample_rate: 44100,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Failed to generate Cartesia speech: ${response.status} ${text}`
    );
  }

  return response.arrayBuffer();
}
