import { NextResponse } from "next/server";
import { fetchGeminiVoices } from "@/lib/gemini";

export async function GET() {
  try {
    const voices = await fetchGeminiVoices();
    return NextResponse.json(voices);
  } catch (error: any) {
    console.error("Error fetching Gemini voices:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch Gemini voices" },
      { status: 500 }
    );
  }
}
