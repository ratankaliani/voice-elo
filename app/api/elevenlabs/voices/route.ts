import { NextResponse } from "next/server";
import { fetchElevenLabsVoices } from "@/lib/elevenlabs";

export async function GET() {
  try {
    const voices = await fetchElevenLabsVoices();
    return NextResponse.json(voices);
  } catch (error: any) {
    console.error("Error fetching 11Labs voices:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch voices" },
      { status: 500 }
    );
  }
}
