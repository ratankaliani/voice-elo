import { NextRequest, NextResponse } from "next/server";
import { generateGeminiSpeech } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const { voiceId, text } = await request.json();

    if (!voiceId) {
      return NextResponse.json(
        { error: "voiceId is required" },
        { status: 400 }
      );
    }

    if (!text) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    const audioBuffer = await generateGeminiSpeech(voiceId, text);

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": audioBuffer.byteLength.toString(),
      },
    });
  } catch (error: any) {
    console.error("Error generating Gemini speech:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate speech" },
      { status: 500 }
    );
  }
}
