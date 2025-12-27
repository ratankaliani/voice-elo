import { NextResponse } from "next/server";
import { fetchCartesiaVoices } from "@/lib/cartesia";

export async function GET() {
  try {
    const voices = await fetchCartesiaVoices();
    return NextResponse.json(voices);
  } catch (error: any) {
    console.error("Error fetching Cartesia voices:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch Cartesia voices" },
      { status: 500 }
    );
  }
}
