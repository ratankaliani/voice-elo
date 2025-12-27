import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSpeech } from "@/lib/elevenlabs";
import { generateCartesiaSpeech } from "@/lib/cartesia";

// Character limit for TTS requests
const MAX_TEXT_LENGTH = 1000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { voiceId, scriptId, text } = body;

    if (!voiceId) {
      return NextResponse.json(
        { error: "voiceId is required" },
        { status: 400 }
      );
    }

    if (!scriptId && !text) {
      return NextResponse.json(
        { error: "Either scriptId or text is required" },
        { status: 400 }
      );
    }

    // Get voice info from database
    const voice = await prisma.voice.findUnique({
      where: { id: voiceId },
    });

    if (!voice) {
      return NextResponse.json({ error: "Voice not found" }, { status: 404 });
    }

    // Get text content
    let textContent: string;

    if (scriptId) {
      const script = await prisma.script.findUnique({
        where: { id: scriptId },
      });

      if (!script) {
        return NextResponse.json(
          { error: "Script not found" },
          { status: 404 }
        );
      }
      textContent = script.content;
    } else {
      textContent = text;
    }

    // Validate text length
    if (textContent.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        {
          error: `Text exceeds maximum length of ${MAX_TEXT_LENGTH} characters`,
        },
        { status: 400 }
      );
    }

    // Generate audio based on provider
    let audioBuffer: ArrayBuffer;

    if (voice.provider === "cartesia") {
      audioBuffer = await generateCartesiaSpeech(voice.voiceId, textContent);
    } else {
      audioBuffer = await generateSpeech(voice.voiceId, textContent);
    }

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
      },
    });
  } catch (error: any) {
    console.error("Error generating speech:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate speech" },
      { status: 500 }
    );
  }
}
