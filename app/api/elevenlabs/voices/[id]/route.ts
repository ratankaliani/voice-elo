import { NextRequest, NextResponse } from "next/server";
import { fetchElevenLabsVoiceById } from "@/lib/elevenlabs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const voice = await fetchElevenLabsVoiceById(id);
    return NextResponse.json(voice);
  } catch (error: any) {
    console.error("Error fetching ElevenLabs voice:", error);
    
    if (error.message === "Voice not found") {
      return NextResponse.json(
        { error: "Voice not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || "Failed to fetch ElevenLabs voice" },
      { status: 500 }
    );
  }
}

