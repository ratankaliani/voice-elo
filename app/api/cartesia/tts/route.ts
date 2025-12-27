import { NextRequest, NextResponse } from "next/server";
import { generateCartesiaSpeech } from "@/lib/cartesia";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { voiceId, text } = body;

    if (!voiceId || !text) {
      return NextResponse.json(
        { error: "voiceId and text are required" },
        { status: 400 }
      );
    }

    const audioBuffer = await generateCartesiaSpeech(voiceId, text);
    
    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
      },
    });
  } catch (error: any) {
    console.error("Error generating Cartesia speech:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate speech" },
      { status: 500 }
    );
  }
}

